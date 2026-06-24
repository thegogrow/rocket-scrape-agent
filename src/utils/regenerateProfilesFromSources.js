const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { generateCompanyProfile } = require("../llm/openrouter");

const DOMAIN_FILTER = (process.env.REGENERATE_DOMAINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const LIMIT = Number.parseInt(process.env.REGENERATE_LIMIT || "0", 10);

async function findDomains() {
  const entries = await fs.readdir(env.paths.outputDir, { withFileTypes: true });
  const domains = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((domain) => domain !== "demo")
    .sort();

  if (DOMAIN_FILTER.length > 0) {
    return domains.filter((domain) => DOMAIN_FILTER.includes(domain));
  }

  if (LIMIT > 0) {
    return domains.slice(0, LIMIT);
  }

  return domains;
}

async function regenerateProfile(domain, index, total) {
  const sourceBundlePath = path.join(env.paths.outputDir, domain, "source-bundle.json");
  const profilePath = path.join(env.paths.outputDir, domain, "profile.json");

  if (!(await fs.pathExists(sourceBundlePath))) {
    console.log(`[${index}/${total}] ${domain}: skipped, no source-bundle.json`);
    return { domain, status: "skipped" };
  }

  const sourceBundle = await fs.readJson(sourceBundlePath);

  if (!sourceBundle) {
    console.log(`[${index}/${total}] ${domain}: skipped, empty source bundle`);
    return { domain, status: "skipped" };
  }

  const startedAt = Date.now();
  console.log(`[${index}/${total}] ${domain}: regenerating`);
  const profile = await generateCompanyProfile(sourceBundle);
  await fs.writeJson(profilePath, profile, { spaces: 2 });
  console.log(`[${index}/${total}] ${domain}: saved in ${Date.now() - startedAt}ms`);

  return { domain, status: "saved" };
}

async function main() {
  const domains = await findDomains();
  const results = [];

  for (const [index, domain] of domains.entries()) {
    try {
      results.push(await regenerateProfile(domain, index + 1, domains.length));
    } catch (error) {
      console.warn(`[${index + 1}/${domains.length}] ${domain}: failed - ${error.message}`);
      results.push({ domain, status: "failed", error: error.message });
    }
  }

  const saved = results.filter((result) => result.status === "saved").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const failed = results.filter((result) => result.status === "failed").length;

  console.log(`Regeneration complete: ${saved} saved, ${skipped} skipped, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Failed to regenerate profiles: ${error.message}`);
  process.exitCode = 1;
});
