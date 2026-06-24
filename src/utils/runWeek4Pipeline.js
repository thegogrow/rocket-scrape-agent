const fs = require("fs-extra");
const path = require("path");
const { runScrapingPipeline } = require("../pipeline/runPipeline");

const URL_FILE = path.resolve(process.cwd(), "data", "week4-additional-company-urls.json");

function parseIntegerFlag(name) {
  const prefix = `--${name}=`;
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix));

  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue.slice(prefix.length), 10);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function loadWeek4Urls() {
  const urls = await fs.readJson(URL_FILE);

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(`${URL_FILE} must contain at least one URL`);
  }

  return urls;
}

async function runWeek4Pipeline() {
  const urls = await loadWeek4Urls();
  const offset = parseIntegerFlag("offset") || 0;
  const limit = parseIntegerFlag("limit");
  const selectedUrls = limit === null ? urls.slice(offset) : urls.slice(offset, offset + limit);

  if (selectedUrls.length === 0) {
    throw new Error("No URLs selected for Week 4 pipeline run");
  }

  console.log(`Running Week 4 pipeline for ${selectedUrls.length} companies`);
  console.log(`Source URL file: ${URL_FILE}`);

  return runScrapingPipeline(selectedUrls);
}

if (require.main === module) {
  runWeek4Pipeline()
    .then((results) => {
      const failures = results.filter((result) => result.error);
      console.log(`Week 4 pipeline complete: ${results.length - failures.length}/${results.length} succeeded`);

      if (failures.length > 0) {
        console.log(`Failures: ${failures.map((failure) => failure.domain).join(", ")}`);
      }
    })
    .catch((error) => {
      console.error(`Week 4 pipeline failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  loadWeek4Urls,
  runWeek4Pipeline,
};
