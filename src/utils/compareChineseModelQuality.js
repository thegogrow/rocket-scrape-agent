const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { buildUserPrompt, generateCompanyProfileWithModel } = require("../llm/openrouter");

const CURRENT_MODEL = process.env.COMPARE_CURRENT_MODEL || env.openRouter.model || "anthropic/claude-sonnet-4";
const CHINESE_MODEL = process.env.COMPARE_CHINESE_MODEL || "deepseek/deepseek-chat-v3.1";
const SAMPLE_DOMAINS = (process.env.COMPARE_SAMPLE_DOMAINS || [
  "puzzle.ch",
  "vshn.ch",
  "copebit.ch",
  "adesso.de",
  "bechtle.com",
].join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const CHARS_PER_TOKEN = 4;
const PRICING = {
  "anthropic/claude-sonnet-4": { input: 3, output: 15 },
  "deepseek/deepseek-chat-v3.1": { input: 0.21, output: 0.79 },
};
const REPORT_PATH = path.resolve(process.cwd(), "docs", "model-comparison-4.7.md");
const JSON_PATH = path.resolve(process.cwd(), "docs", "model-comparison-4.7.json");

function estimateTokens(value) {
  return Math.ceil(String(value || "").length / CHARS_PER_TOKEN);
}

function estimateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || { input: 0, output: 0 };

  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizedValues(values) {
  return new Set(asArray(values).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function overlapScore(candidateValues, baselineValues) {
  const candidate = normalizedValues(candidateValues);
  const baseline = normalizedValues(baselineValues);

  if (candidate.size === 0 && baseline.size === 0) {
    return 1;
  }

  if (candidate.size === 0 || baseline.size === 0) {
    return 0;
  }

  const shared = [...candidate].filter((value) => baseline.has(value)).length;

  return shared / Math.max(candidate.size, baseline.size);
}

function fieldCoverage(profile) {
  const fields = [
    Boolean(profile.companyName),
    Boolean(profile.website),
    Boolean(profile.description),
    asArray(profile.services).length > 0,
    asArray(profile.technologies).length > 0,
    asArray(profile.vendorPartnerships).length > 0,
    Boolean(profile.location),
    asArray(profile.recentActivity).length > 0,
    Boolean(profile.logoUrl),
    Number.isFinite(Number(profile.confidenceScore)) && Number(profile.confidenceScore) > 0,
  ];

  return fields.filter(Boolean).length / fields.length;
}

function activityWithDateAndSource(profile) {
  const activity = asArray(profile.recentActivity);

  if (activity.length === 0) {
    return 0;
  }

  return activity.filter((entry) => entry?.date && (entry?.source || entry?.sourceType)).length / activity.length;
}

function qualityMetrics(profile, baselineProfile) {
  return {
    coverage: fieldCoverage(profile),
    technologyOverlap: overlapScore(profile.technologies, baselineProfile.technologies),
    partnershipOverlap: overlapScore(profile.vendorPartnerships, baselineProfile.vendorPartnerships),
    datedActivityRate: activityWithDateAndSource(profile),
    serviceCount: asArray(profile.services).length,
    technologyCount: asArray(profile.technologies).length,
    partnershipCount: asArray(profile.vendorPartnerships).length,
    activityCount: asArray(profile.recentActivity).length,
  };
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatUsd(value) {
  return `$${value.toFixed(4)}`;
}

async function readSourceBundle(domain) {
  const bundlePath = path.join(env.paths.outputDir, domain, "source-bundle.json");

  if (!(await fs.pathExists(bundlePath))) {
    throw new Error(`Missing source bundle for ${domain}`);
  }

  return fs.readJson(bundlePath);
}

async function runModel(model, sourceBundle, baselineProfile) {
  const inputTokens = estimateTokens(buildUserPrompt(sourceBundle));
  const startedAt = Date.now();
  const profile = await generateCompanyProfileWithModel(sourceBundle, model);
  const durationMs = Date.now() - startedAt;
  const outputTokens = estimateTokens(JSON.stringify(profile));

  return {
    model,
    durationMs,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
    profile,
    metrics: qualityMetrics(profile, baselineProfile),
  };
}

function average(rows, selector) {
  const values = rows.map(selector).filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function renderReport(results) {
  const currentRows = results.map((result) => result.current);
  const chineseRows = results.map((result) => result.chinese);
  const currentCost = currentRows.reduce((total, row) => total + row.estimatedCostUsd, 0);
  const chineseCost = chineseRows.reduce((total, row) => total + row.estimatedCostUsd, 0);
  const savings = currentCost > 0 ? 1 - chineseCost / currentCost : 0;

  const lines = [
    "# Task 4.7 Model Comparison",
    "",
    `Current model: \`${CURRENT_MODEL}\``,
    `Chinese model tested: \`${CHINESE_MODEL}\``,
    `Sample domains: ${results.map((result) => `\`${result.domain}\``).join(", ")}`,
    "",
    "## Summary",
    "",
    `- Current model estimated cost on sample: ${formatUsd(currentCost)}`,
    `- DeepSeek estimated cost on sample: ${formatUsd(chineseCost)}`,
    `- Estimated model-cost savings: ${formatPercent(savings)}`,
    `- Current average latency: ${Math.round(average(currentRows, (row) => row.durationMs))} ms`,
    `- DeepSeek average latency: ${Math.round(average(chineseRows, (row) => row.durationMs))} ms`,
    `- Current average field coverage: ${formatPercent(average(currentRows, (row) => row.metrics.coverage))}`,
    `- DeepSeek average field coverage: ${formatPercent(average(chineseRows, (row) => row.metrics.coverage))}`,
    "",
    "## Per-Provider Results",
    "",
    "| Domain | Model | Cost | Latency | Coverage | Tech overlap | Partnership overlap | Dated activity |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    for (const row of [result.current, result.chinese]) {
      lines.push(
        [
          result.domain,
          `\`${row.model}\``,
          formatUsd(row.estimatedCostUsd),
          `${row.durationMs} ms`,
          formatPercent(row.metrics.coverage),
          formatPercent(row.metrics.technologyOverlap),
          formatPercent(row.metrics.partnershipOverlap),
          formatPercent(row.metrics.datedActivityRate),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
      );
    }
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Coverage checks whether the profile filled core fields such as description, services, technologies, partnerships, activity, logo, and confidence.",
    "- Overlap compares each model output against the currently saved profile for the same company. It is a consistency signal, not a human-verified accuracy score.",
    "- Final acceptance should still manually inspect Swiss/Germany vendor partnerships, because partnership extraction is the highest-risk field."
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  const results = [];

  for (const domain of SAMPLE_DOMAINS) {
    const sourceBundle = await readSourceBundle(domain);
    const baselinePath = path.join(env.paths.outputDir, domain, "profile.json");
    const baselineProfile = await fs.readJson(baselinePath);

    console.log(`Comparing ${domain}`);

    results.push({
      domain,
      current: await runModel(CURRENT_MODEL, sourceBundle, baselineProfile),
      chinese: await runModel(CHINESE_MODEL, sourceBundle, baselineProfile),
    });
  }

  await fs.writeJson(JSON_PATH, results, { spaces: 2 });
  await fs.writeFile(REPORT_PATH, renderReport(results));
  console.log(`Wrote ${REPORT_PATH}`);
  console.log(`Wrote ${JSON_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
