const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { filterWebsiteSupportedTechnologies } = require("../llm/openrouter");

async function main() {
  const entries = await fs.readdir(env.paths.outputDir, { withFileTypes: true });
  let checked = 0;
  let changed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "demo") {
      continue;
    }

    const profilePath = path.join(env.paths.outputDir, entry.name, "profile.json");
    const sourceBundlePath = path.join(env.paths.outputDir, entry.name, "source-bundle.json");

    if (!(await fs.pathExists(profilePath)) || !(await fs.pathExists(sourceBundlePath))) {
      continue;
    }

    const profile = await fs.readJson(profilePath);
    const sourceBundle = await fs.readJson(sourceBundlePath);
    const originalTechnologies = Array.isArray(profile?.technologies) ? profile.technologies : [];
    const cleaned = filterWebsiteSupportedTechnologies(profile, sourceBundle);

    checked += 1;

    if (JSON.stringify(originalTechnologies) !== JSON.stringify(cleaned.technologies)) {
      await fs.writeJson(profilePath, cleaned, { spaces: 2 });
      changed += 1;
      console.log(`${entry.name}: ${originalTechnologies.length} -> ${cleaned.technologies.length}`);
    }
  }

  console.log(`Checked ${checked} profiles; updated ${changed}.`);
}

main().catch((error) => {
  console.error(`Failed to enforce website-first technologies: ${error.message}`);
  process.exitCode = 1;
});
