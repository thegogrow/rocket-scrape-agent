const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { getDomainFromUrl } = require("./url");

const URL_FILE = path.resolve(process.cwd(), "data", "week3-additional-company-urls.json");
const WEEK2_COMPARISON_FILE = path.resolve(process.cwd(), "docs", "week2-comparison.csv");
const REPORT_FILE = path.resolve(process.cwd(), "docs", "week3-quality-report.md");
const REVIEW_CSV_FILE = path.resolve(process.cwd(), "docs", "week3-quality-review.csv");
const SAMPLE_SIZE = 20;
const PROFILE_FIELDS = [
  "companyName",
  "website",
  "description",
  "services",
  "focusAreas",
  "technologies",
  "vendorPartnerships",
  "location",
  "companySize",
  "foundedYear",
  "industries",
  "recentActivity",
  "githubUrl",
  "linkedinUrl",
  "logoUrl",
];
const PARTNERSHIP_KEYWORDS = [
  "partner",
  "partnership",
  "certified",
  "service provider",
  "solution provider",
  "reseller",
  "marketplace",
  "member",
  "alliance",
  "competency",
  "specialization",
];
const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "into",
  "that",
  "this",
  "your",
  "our",
  "are",
  "provider",
  "service",
  "services",
  "company",
]);

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readJsonSync(filePath);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stringifyValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(" | ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);

  return values;
}

function loadWeek2Summary() {
  if (!fs.existsSync(WEEK2_COMPARISON_FILE)) {
    return {};
  }

  const lines = fs.readFileSync(WEEK2_COMPARISON_FILE, "utf8").trim().split(/\r?\n/);
  const rows = lines.slice(1).map(parseCsvLine);
  const summary = {};

  for (const row of rows) {
    const field = row[3];
    const assessment = row[6];

    if (!field || !assessment) {
      continue;
    }

    summary[field] ||= {};
    summary[field][assessment] = (summary[field][assessment] || 0) + 1;
  }

  return summary;
}

function deterministicHash(value) {
  return [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 1000000007,
    7
  );
}

function loadCompanyOutput(url) {
  const domain = getDomainFromUrl(url);
  const outputDir = path.join(env.paths.outputDir, domain);
  const profile = readJsonIfExists(path.join(outputDir, "profile.json"));
  const sourceBundle = readJsonIfExists(path.join(outputDir, "source-bundle.json"));
  const raw = readJsonIfExists(path.join(outputDir, "raw.json"));
  const github = readJsonIfExists(path.join(outputDir, "github.json"));
  const enrichment = readJsonIfExists(path.join(outputDir, "enrichment.json"));
  const brandfetch = readJsonIfExists(path.join(outputDir, "brandfetch.json"));
  const logoSource = readJsonIfExists(path.join(outputDir, "logo-source.json"));
  const logoPath = path.join(outputDir, "logo.png");

  return {
    domain,
    outputDir,
    profile,
    sourceText: normalizeText(JSON.stringify({ sourceBundle, raw, github, enrichment, brandfetch })),
    hasLogo: fs.existsSync(logoPath) && fs.statSync(logoPath).size > 0,
    logoSource,
  };
}

function tokensFor(value) {
  return normalizeText(value)
    .split(/[^a-z0-9.+#-]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function valueSupportStatus(value, sourceText) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "empty";
  }

  if (sourceText.includes(normalizedValue)) {
    return "supported";
  }

  const tokens = tokensFor(value);

  if (tokens.length === 0) {
    return "unsupported";
  }

  const matchedTokens = tokens.filter((token) => sourceText.includes(token));
  const ratio = matchedTokens.length / tokens.length;

  if (ratio >= 0.75) {
    return "supported";
  }

  if (ratio >= 0.4) {
    return "partial";
  }

  return "unsupported";
}

function vendorSupportStatus(value, sourceText) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "empty";
  }

  const index = sourceText.indexOf(normalizedValue);

  if (index === -1) {
    return valueSupportStatus(value, sourceText);
  }

  const evidenceWindow = sourceText.slice(Math.max(0, index - 160), index + normalizedValue.length + 160);
  const hasPartnershipKeyword = PARTNERSHIP_KEYWORDS.some((keyword) =>
    evidenceWindow.includes(keyword)
  );

  return hasPartnershipKeyword ? "supported" : "partial";
}

function aggregateStatuses(statuses) {
  if (statuses.length === 0 || statuses.every((status) => status === "empty")) {
    return "empty";
  }

  if (statuses.every((status) => status === "supported")) {
    return "supported";
  }

  if (statuses.some((status) => status === "unsupported")) {
    return "unsupported";
  }

  return "partial";
}

function scoreField(field, value, companyOutput) {
  if (field === "logoUrl") {
    if (!value) {
      return companyOutput.hasLogo ? "supported" : "empty";
    }

    if (companyOutput.hasLogo) {
      return "supported";
    }

    return valueSupportStatus(value, companyOutput.sourceText);
  }

  if (Array.isArray(value)) {
    const statuses = value.map((item) =>
      field === "vendorPartnerships"
        ? vendorSupportStatus(item, companyOutput.sourceText)
        : valueSupportStatus(item, companyOutput.sourceText)
    );

    return aggregateStatuses(statuses);
  }

  return valueSupportStatus(value, companyOutput.sourceText);
}

function scoreToNumber(status) {
  if (status === "supported") {
    return 1;
  }

  if (status === "partial") {
    return 0.5;
  }

  if (status === "unsupported") {
    return 0;
  }

  return null;
}

function buildReviewRows(sample) {
  const rows = [];

  for (const companyOutput of sample) {
    for (const field of PROFILE_FIELDS) {
      const value = companyOutput.profile?.[field];
      const status = scoreField(field, value, companyOutput);

      rows.push({
        domain: companyOutput.domain,
        field,
        status,
        value: stringifyValue(value),
        logoSource: field === "logoUrl" ? companyOutput.logoSource?.selectedSource || "" : "",
      });
    }
  }

  return rows;
}

function calculateFieldAccuracy(rows) {
  const byField = {};

  for (const row of rows) {
    const score = scoreToNumber(row.status);

    if (score === null) {
      continue;
    }

    byField[row.field] ||= { score: 0, count: 0 };
    byField[row.field].score += score;
    byField[row.field].count += 1;
  }

  return Object.entries(byField).map(([field, aggregate]) => ({
    field,
    reviewedValues: aggregate.count,
    accuracy: aggregate.count === 0 ? null : aggregate.score / aggregate.count,
  }));
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return `${Math.round(value * 100)}%`;
}

function formatWeek2VendorSummary(summary) {
  const vendorSummary = summary.vendorPartnerships || {};

  return Object.entries(vendorSummary)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([assessment, count]) => `\`${assessment}\`: ${count}`)
    .join(", ") || "No Week 2 vendor-partnership rows found.";
}

async function writeReviewCsv(rows) {
  const csvRows = [
    ["domain", "field", "status", "value", "logoSource"],
    ...rows.map((row) => [row.domain, row.field, row.status, row.value, row.logoSource]),
  ];

  await fs.ensureDir(path.dirname(REVIEW_CSV_FILE));
  await fs.writeFile(
    REVIEW_CSV_FILE,
    csvRows.map((row) => row.map(csvEscape).join(",")).join("\n"),
    "utf8"
  );
}

async function generateWeek3QualityReport() {
  const urls = await fs.readJson(URL_FILE);
  const outputs = urls.map(loadCompanyOutput);
  const completedOutputs = outputs.filter((output) => output.profile);
  const sample = [...completedOutputs]
    .sort((left, right) => deterministicHash(left.domain) - deterministicHash(right.domain))
    .slice(0, SAMPLE_SIZE);
  const reviewRows = buildReviewRows(sample);
  const fieldAccuracy = calculateFieldAccuracy(reviewRows);
  const week2Summary = loadWeek2Summary();
  const logoSuccessCount = outputs.filter((output) => output.hasLogo).length;
  const completedProfileCount = completedOutputs.length;

  await writeReviewCsv(reviewRows);

  const report = [
    "# Week 3 Quality Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Prompt Iteration",
    "",
    "- Added conservative extraction rules to prevent unsupported values from website, GitHub, or enrichment data.",
    "- Added explicit vendor-partnership rules that exclude customers, clients, tools merely used, case-study brands, and repository dependencies.",
    "- Added source preferences: Apollo/Clearbit for company metadata, website copy for services/partnerships, GitHub only for repository activity and technologies.",
    "- Added logo instructions to prefer Brandfetch or clear website logo assets over favicons.",
    "",
    "## Before/After Comparison",
    "",
    `- Week 2 vendor-partnership assessment mix: ${formatWeek2VendorSummary(week2Summary)}.`,
    `- Week 3 completed profiles in new corpus: ${completedProfileCount}/${outputs.length}.`,
    `- Week 3 logo success rate in new corpus: ${logoSuccessCount}/${outputs.length} (${formatPercent(logoSuccessCount / outputs.length)}).`,
    `- Week 3 review sample size: ${sample.length} profiles.`,
    "",
    "## Per-Field Accuracy",
    "",
    "| Field | Reviewed Values | Accuracy |",
    "| --- | ---: | ---: |",
    ...fieldAccuracy.map(
      (row) => `| ${row.field} | ${row.reviewedValues} | ${formatPercent(row.accuracy)} |`
    ),
    "",
    "## Sampled Companies",
    "",
    ...sample.map((output) => `- ${output.domain}: logo=${output.hasLogo ? "yes" : "no"}, source=${output.logoSource?.selectedSource || "n/a"}`),
    "",
    "## Review Notes",
    "",
    `- Detailed per-field review rows are in \`${path.relative(process.cwd(), REVIEW_CSV_FILE)}\`.`,
    "- Status meanings: `supported` = directly supported by saved source data, `partial` = likely supported but not exact, `unsupported` = review manually, `empty` = field was not populated.",
    "- Vendor partnerships use stricter scoring: provider name must appear near partnership/certification/member language.",
  ].join("\n");

  await fs.ensureDir(path.dirname(REPORT_FILE));
  await fs.writeFile(REPORT_FILE, report, "utf8");

  return {
    reportFile: REPORT_FILE,
    reviewCsvFile: REVIEW_CSV_FILE,
    completedProfileCount,
    logoSuccessCount,
    totalCount: outputs.length,
  };
}

if (require.main === module) {
  generateWeek3QualityReport()
    .then((result) => {
      console.log(`Quality report written to ${result.reportFile}`);
      console.log(`Review CSV written to ${result.reviewCsvFile}`);
    })
    .catch((error) => {
      console.error(`Failed to generate Week 3 quality report: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  generateWeek3QualityReport,
};
