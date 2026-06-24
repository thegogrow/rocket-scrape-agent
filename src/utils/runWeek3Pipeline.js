const fs = require("fs-extra");
const path = require("path");
const { runScrapingPipeline } = require("../pipeline/runPipeline");

const URL_FILE = path.resolve(process.cwd(), "data", "week3-additional-company-urls.json");

function parseIntegerFlag(name) {
  const prefix = `--${name}=`;
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix));

  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue.slice(prefix.length), 10);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function loadWeek3Urls() {
  const urls = await fs.readJson(URL_FILE);

  if (!Array.isArray(urls) || urls.length < 50) {
    throw new Error(`${URL_FILE} must contain at least 50 URLs`);
  }

  return urls;
}

async function runWeek3Pipeline() {
  const urls = await loadWeek3Urls();
  const offset = parseIntegerFlag("offset") || 0;
  const limit = parseIntegerFlag("limit");
  const selectedUrls = limit === null ? urls.slice(offset) : urls.slice(offset, offset + limit);

  if (selectedUrls.length === 0) {
    throw new Error("No URLs selected for Week 3 pipeline run");
  }

  console.log(`Running Week 3 pipeline for ${selectedUrls.length} companies`);
  console.log(`Source URL file: ${URL_FILE}`);

  return runScrapingPipeline(selectedUrls);
}

if (require.main === module) {
  runWeek3Pipeline()
    .then((results) => {
      const failures = results.filter((result) => result.error);
      console.log(`Week 3 pipeline complete: ${results.length - failures.length}/${results.length} succeeded`);

      if (failures.length > 0) {
        console.log(`Failures: ${failures.map((failure) => failure.domain).join(", ")}`);
      }
    })
    .catch((error) => {
      console.error(`Week 3 pipeline failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  loadWeek3Urls,
  runWeek3Pipeline,
};
