const fs = require("fs-extra");
const path = require("path");
const { runScrapingPipeline } = require("../src/pipeline/runPipeline");
const { env } = require("../src/config/env");
const { logoFileForDomain } = require("../src/ui/profileData");
const {
  getNextQueuedScrapeJob,
  getScrapeJob,
  updateScrapeJob,
  uploadProviderLogo,
  upsertProvider,
  verifyAdminToken,
} = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

function imageMetadata(buffer, fallbackPath) {
  const head = buffer.subarray(0, 256).toString("utf8").trimStart();

  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return { filename: "logo.svg", contentType: "image/svg+xml" };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { filename: "logo.jpg", contentType: "image/jpeg" };
  }

  if (buffer.toString("ascii", 0, 4) === "GIF8") {
    return { filename: "logo.gif", contentType: "image/gif" };
  }

  if (buffer.toString("ascii", 8, 12) === "WEBP") {
    return { filename: "logo.webp", contentType: "image/webp" };
  }

  if (path.extname(fallbackPath) === ".svg") {
    return { filename: "logo.svg", contentType: "image/svg+xml" };
  }

  return { filename: "logo.png", contentType: "image/png" };
}

async function readSourceData(domain) {
  const companyDir = path.join(env.paths.outputDir, domain);
  const sourceBundlePath = path.join(companyDir, "source-bundle.json");
  const rawPath = path.join(companyDir, "raw.json");

  return {
    sourceBundle: (await fs.pathExists(sourceBundlePath)) ? await fs.readJson(sourceBundlePath) : null,
    raw: (await fs.pathExists(rawPath)) ? await fs.readJson(rawPath) : null,
  };
}

async function uploadLogoIfAvailable(domain) {
  const logoPath = await logoFileForDomain(domain);

  if (!logoPath || !(await fs.pathExists(logoPath))) {
    return null;
  }

  const buffer = await fs.readFile(logoPath);
  const metadata = imageMetadata(buffer, logoPath);

  return uploadProviderLogo({
    domain,
    filename: metadata.filename,
    contentType: metadata.contentType,
    body: buffer,
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  let activeJob = null;

  try {
    await verifyAdminToken(request.headers.authorization);
    const { id } = await readJsonBody(request);
    const job = id ? await getScrapeJob(id) : await getNextQueuedScrapeJob();

    if (!job) {
      response.status(404).json({ error: "No queued scrape job found." });
      return;
    }

    if (job.status !== "queued") {
      response.status(409).json({ error: `Job is already ${job.status}.` });
      return;
    }

    activeJob = job;
    await updateScrapeJob(job.id, { status: "running", error: null });

    const [result] = await runScrapingPipeline(job.url);

    if (result?.error || !result?.profile) {
      const error = result?.error || "Scrape did not produce a profile.";
      await updateScrapeJob(job.id, { status: "failed", error });
      response.status(500).json({ error });
      return;
    }

    const logoUrl = await uploadLogoIfAvailable(result.domain);
    const sourceData = await readSourceData(result.domain);
    const provider = await upsertProvider(
      {
        ...result.profile,
        domain: result.domain,
        website: result.profile.website || job.url,
        companyName: result.profile.companyName || job.company_name || result.domain,
        logoUrl: logoUrl || result.profile.logoUrl || null,
        files: logoUrl ? { logo: logoUrl } : {},
        sourceData,
      },
      "draft"
    );

    await updateScrapeJob(job.id, {
      status: "needs_review",
      error: null,
      resultProviderId: provider.id,
    });

    response.status(200).json({ jobId: job.id, provider });
  } catch (error) {
    if (activeJob) {
      try {
        await updateScrapeJob(activeJob.id, { status: "failed", error: error.message });
      } catch (updateError) {
        console.warn(`[admin-run-job] Failed to mark job failed: ${updateError.message}`);
      }
    }

    response.status(500).json({ error: error.message });
  }
};
