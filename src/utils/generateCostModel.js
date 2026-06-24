const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { buildUserPrompt } = require("../llm/openrouter");
const { getDomainFromUrl } = require("./url");

const URL_FILE = path.resolve(process.cwd(), "data", "week3-additional-company-urls.json");
const REPORT_FILE = path.resolve(process.cwd(), "docs", "week3-cost-model.md");
const DEFAULT_INPUT_TOKENS = 9000;
const DEFAULT_OUTPUT_TOKENS = 900;
const CHARS_PER_TOKEN = 4;
const FIRECRAWL_CREDITS_PER_PAGE = 1;
const FIRECRAWL_PAGES_PER_PROFILE = 5;
const APOLLO_CREDITS_PER_PROFILE = 1;
const BRANDFETCH_MONTHLY_USD = 129;
const BRANDFETCH_INCLUDED_FETCHES = 2500;
const OPENROUTER_INPUT_USD_PER_1M = 3;
const OPENROUTER_OUTPUT_USD_PER_1M = 15;
const PROJECTION_SIZES = [1000, 5000];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readJsonSync(filePath);
}

function numberFromEnv(name, defaultValue = 0) {
  const parsed = Number.parseFloat(process.env[name] || "");

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}

function formatMaybeUsd(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "not priced";
  }

  return formatUsd(value);
}

function estimateTokensFromText(value) {
  return Math.ceil(String(value || "").length / CHARS_PER_TOKEN);
}

function estimateProfileTokenUsage(urls) {
  const estimates = [];

  for (const url of urls) {
    const domain = getDomainFromUrl(url);
    const outputDir = path.join(env.paths.outputDir, domain);
    const sourceBundle = readJsonIfExists(path.join(outputDir, "source-bundle.json"));
    const profile = readJsonIfExists(path.join(outputDir, "profile.json"));

    if (!sourceBundle) {
      continue;
    }

    estimates.push({
      domain,
      inputTokens: estimateTokensFromText(buildUserPrompt(sourceBundle)),
      outputTokens: estimateTokensFromText(JSON.stringify(profile || {})),
    });
  }

  if (estimates.length === 0) {
    return {
      source: "default",
      profileCount: 0,
      inputTokens: DEFAULT_INPUT_TOKENS,
      outputTokens: DEFAULT_OUTPUT_TOKENS,
    };
  }

  return {
    source: "saved-output-average",
    profileCount: estimates.length,
    inputTokens: Math.round(
      estimates.reduce((total, estimate) => total + estimate.inputTokens, 0) / estimates.length
    ),
    outputTokens: Math.round(
      estimates.reduce((total, estimate) => total + estimate.outputTokens, 0) / estimates.length
    ),
  };
}

function calculateOpenRouterUsd(inputTokens, outputTokens) {
  return (
    (inputTokens * OPENROUTER_INPUT_USD_PER_1M) / 1000000 +
    (outputTokens * OPENROUTER_OUTPUT_USD_PER_1M) / 1000000
  );
}

function calculateProjection(size, costs) {
  const firecrawlCredits = size * costs.firecrawlCreditsPerProfile;
  const apolloCredits = size * costs.apolloCreditsPerProfile;
  const openRouterUsd = size * costs.openRouterUsdPerProfile;
  const brandfetchUsd = size * costs.brandfetchUsdPerProfile;
  const configuredFirecrawlUsd = firecrawlCredits * costs.firecrawlUsdPerCredit;
  const configuredApolloUsd = apolloCredits * costs.apolloUsdPerCredit;
  const clearbitUsd = size * costs.clearbitUsdPerRecord;
  const knownUsd = openRouterUsd + brandfetchUsd;
  const configuredUsd =
    knownUsd + configuredFirecrawlUsd + configuredApolloUsd + clearbitUsd;

  return {
    size,
    firecrawlCredits,
    apolloCredits,
    openRouterUsd,
    brandfetchUsd,
    clearbitUsd,
    knownUsd,
    configuredUsd,
  };
}

async function generateCostModel() {
  const urls = await fs.readJson(URL_FILE);
  const tokenUsage = estimateProfileTokenUsage(urls);
  const openRouterUsdPerProfile = calculateOpenRouterUsd(
    tokenUsage.inputTokens,
    tokenUsage.outputTokens
  );
  const costs = {
    firecrawlCreditsPerProfile: FIRECRAWL_CREDITS_PER_PAGE * FIRECRAWL_PAGES_PER_PROFILE,
    apolloCreditsPerProfile: APOLLO_CREDITS_PER_PROFILE,
    brandfetchUsdPerProfile: BRANDFETCH_MONTHLY_USD / BRANDFETCH_INCLUDED_FETCHES,
    openRouterUsdPerProfile,
    firecrawlUsdPerCredit: numberFromEnv("FIRECRAWL_USD_PER_CREDIT"),
    apolloUsdPerCredit: numberFromEnv("APOLLO_USD_PER_CREDIT"),
    clearbitUsdPerRecord: numberFromEnv("CLEARBIT_USD_PER_RECORD"),
  };
  const projections = PROJECTION_SIZES.map((size) => calculateProjection(size, costs));
  const report = [
    "# Week 3 Cost Model",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Pricing Inputs",
    "",
    "- Firecrawl: `crawl`, `scrape`, `map`, and `monitor` are modeled as 1 credit per page. This pipeline crawls up to 5 pages per profile.",
    "- Apollo: organization enrichment is modeled as 1 credit-consuming organization-enrichment call per profile. Dollar cost depends on the Apollo plan or overage rate.",
    "- Brandfetch: modeled from Starter pricing of $129/month for up to 2,500 brand fetches, amortized per profile.",
    "- OpenRouter: modeled for `anthropic/claude-sonnet-4` at $3/input MTok and $15/output MTok.",
    "- Clearbit: not called by the current code path. Set `CLEARBIT_USD_PER_RECORD` only if using Clearbit/Breeze as a replacement enrichment provider.",
    "",
    "## Source Links",
    "",
    "- Firecrawl pricing: https://www.firecrawl.dev/pricing",
    "- Apollo organization enrichment: https://docs.apollo.io/reference/organization-enrichment",
    "- Brandfetch pricing: https://brandfetch.com/developers/pricing",
    "- OpenRouter Claude Sonnet 4 pricing: https://openrouter.ai/anthropic/claude-sonnet-4",
    "",
    "## Per-Profile Model",
    "",
    `- Token estimate source: ${tokenUsage.source} (${tokenUsage.profileCount} profiles).`,
    `- Average LLM input tokens: ${tokenUsage.inputTokens.toLocaleString()}.`,
    `- Average LLM output tokens: ${tokenUsage.outputTokens.toLocaleString()}.`,
    `- Firecrawl: ${costs.firecrawlCreditsPerProfile} credits/profile.`,
    `- Apollo: ${costs.apolloCreditsPerProfile} credit-consuming call/profile.`,
    `- Brandfetch: ${formatUsd(costs.brandfetchUsdPerProfile)}/profile amortized.`,
    `- OpenRouter: ${formatUsd(costs.openRouterUsdPerProfile)}/profile.`,
    `- Firecrawl configured dollar cost: ${formatMaybeUsd(costs.firecrawlCreditsPerProfile * costs.firecrawlUsdPerCredit)}/profile.`,
    `- Apollo configured dollar cost: ${formatMaybeUsd(costs.apolloCreditsPerProfile * costs.apolloUsdPerCredit)}/profile.`,
    `- Clearbit configured dollar cost: ${formatMaybeUsd(costs.clearbitUsdPerRecord)}/profile.`,
    "",
    "## Projections",
    "",
    "| Profiles | Firecrawl Credits | Apollo Credit Calls | OpenRouter | Brandfetch | Known Dollar Subtotal | Configured Dollar Total |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...projections.map(
      (projection) =>
        `| ${projection.size.toLocaleString()} | ${projection.firecrawlCredits.toLocaleString()} | ${projection.apolloCredits.toLocaleString()} | ${formatUsd(projection.openRouterUsd)} | ${formatUsd(projection.brandfetchUsd)} | ${formatUsd(projection.knownUsd)} | ${formatUsd(projection.configuredUsd)} |`
    ),
    "",
    "## Exact-Dollar Configuration",
    "",
    "- Set `FIRECRAWL_USD_PER_CREDIT` to your blended Firecrawl plan cost per credit.",
    "- Set `APOLLO_USD_PER_CREDIT` to your blended Apollo plan or overage cost per enrichment credit.",
    "- Set `CLEARBIT_USD_PER_RECORD` only if replacing Apollo with Clearbit/Breeze enrichment.",
  ].join("\n");

  await fs.ensureDir(path.dirname(REPORT_FILE));
  await fs.writeFile(REPORT_FILE, report, "utf8");

  return REPORT_FILE;
}

if (require.main === module) {
  generateCostModel()
    .then((filePath) => {
      console.log(`Cost model written to ${filePath}`);
    })
    .catch((error) => {
      console.error(`Failed to generate cost model: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  generateCostModel,
};
