const { env } = require("./config/env");
const { loadCompanies } = require("./utils/loadCompanies");
const { runScrapingPipeline } = require("./pipeline/runPipeline");

function parseCliInput(argvValue) {
  if (!argvValue) {
    return null;
  }

  const trimmed = argvValue.trim();

  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  return trimmed;
}

async function main() {
  console.log("Scrape Agent Initialized");

  if (env.nodeEnv !== "production") {
    console.log(`Environment: ${env.nodeEnv}`);
  }

  const cliInput = parseCliInput(process.argv[2] || "");
  const companyUrls = cliInput || (await loadCompanies());

  console.log("Loaded company URLs:", companyUrls);

  await runScrapingPipeline(companyUrls);
}

main().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});
