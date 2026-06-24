const fs = require("fs-extra");
const path = require("path");
const { runScrapingPipeline } = require("../pipeline/runPipeline");
const { buildUserPrompt } = require("../llm/openrouter");
const { getDomainFromUrl } = require("./url");

const DEFAULT_DEMO_URL = "https://www.adfinis.com/";
const DEMO_OUTPUT_DIR = path.resolve(process.cwd(), "output", "demo");

function parseFlag(name) {
  const prefix = `--${name}=`;
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix));

  return rawValue ? rawValue.slice(prefix.length) : null;
}

function profileSummary(profile) {
  return {
    companyName: profile?.companyName || null,
    website: profile?.website || null,
    services: Array.isArray(profile?.services) ? profile.services.slice(0, 5) : [],
    technologies: Array.isArray(profile?.technologies) ? profile.technologies.slice(0, 8) : [],
    vendorPartnerships: Array.isArray(profile?.vendorPartnerships)
      ? profile.vendorPartnerships.slice(0, 8)
      : [],
    confidenceScore: profile?.confidenceScore || 0,
  };
}

async function runReplayDemo(url) {
  const domain = getDomainFromUrl(url);
  const sourcePath = path.resolve(process.cwd(), "output", domain, "source-bundle.json");
  const profilePath = path.resolve(process.cwd(), "output", domain, "profile.json");
  const logoPath = path.resolve(process.cwd(), "output", domain, "logo.png");

  if (!(await fs.pathExists(sourcePath)) || !(await fs.pathExists(profilePath))) {
    throw new Error(`Replay artifacts not found for ${domain}. Run the pipeline first or use --mode=live.`);
  }

  const sourceBundle = await fs.readJson(sourcePath);
  const profile = await fs.readJson(profilePath);
  const prompt = buildUserPrompt(sourceBundle);
  const demoDomainDir = path.join(DEMO_OUTPUT_DIR, domain);

  await fs.ensureDir(demoDomainDir);
  await fs.copy(profilePath, path.join(demoDomainDir, "profile.json"));

  if (await fs.pathExists(logoPath)) {
    await fs.copy(logoPath, path.join(demoDomainDir, "logo.png"));
  }

  console.log("Demo mode: replay existing collected data and LLM output");
  console.log(`1. URL in: ${url}`);
  console.log(
    `2. Data collected: ${sourceBundle.websiteData?.metadata?.pageCount || 0} pages, ` +
      `${sourceBundle.websiteData?.markdown?.length || 0} markdown chars, ` +
      `GitHub=${sourceBundle.githubData?.organization?.url || "none"}, ` +
      `Brandfetch=${sourceBundle.brandfetchData?.bestLogo?.url ? "logo found" : "none"}`
  );
  console.log(`3. LLM synthesis prompt prepared: ${prompt.length} chars`);
  console.log(`4. Profile JSON emitted: ${path.relative(process.cwd(), path.join(demoDomainDir, "profile.json"))}`);
  console.log(`5. Logo emitted: ${path.relative(process.cwd(), path.join(demoDomainDir, "logo.png"))}`);
  console.log("Profile preview:");
  console.log(JSON.stringify(profileSummary(profile), null, 2));
}

async function runLiveDemo(url) {
  console.log("Demo mode: live pipeline run");
  console.log(`1. URL in: ${url}`);
  console.log("2. Collecting website, GitHub, enrichment, Brandfetch, profile, and logo data...");

  const results = await runScrapingPipeline(url);
  const result = results[0];

  if (result?.error) {
    throw new Error(result.error);
  }

  const domain = result.domain;
  const profilePath = path.resolve(process.cwd(), "output", domain, "profile.json");
  const logoPath = path.resolve(process.cwd(), "output", domain, "logo.png");
  const profile = await fs.readJson(profilePath);

  console.log(
    process.env.SKIP_LLM === "true"
      ? "3. Profile synthesized with deterministic fallback because SKIP_LLM=true"
      : "3. LLM synthesized the company profile"
  );
  console.log(`4. Profile JSON emitted: ${path.relative(process.cwd(), profilePath)}`);
  console.log(`5. Logo emitted: ${path.relative(process.cwd(), logoPath)}`);
  console.log("Profile preview:");
  console.log(JSON.stringify(profileSummary(profile), null, 2));
}

async function runDemo() {
  const mode = parseFlag("mode") || "replay";
  const url = parseFlag("url") || DEFAULT_DEMO_URL;

  if (mode === "live") {
    await runLiveDemo(url);
    return;
  }

  if (mode !== "replay") {
    throw new Error("Demo mode must be either replay or live");
  }

  await runReplayDemo(url);
}

if (require.main === module) {
  runDemo().catch((error) => {
    console.error(`Demo failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  runDemo,
};
