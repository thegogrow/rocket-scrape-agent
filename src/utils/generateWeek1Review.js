const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");

const REPORT_PATH = path.resolve(process.cwd(), "docs", "week1-review.md");
const PROFILE_FIELDS = [
  "companyName",
  "website",
  "description",
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
  "confidenceScore",
];

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function escapeMarkdown(value) {
  return String(value).replace(/\|/g, "\\|");
}

function titleFromDomain(domain) {
  return domain
    .split(".")[0]
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildEvidenceText(rawData) {
  if (!rawData?.data) {
    return "";
  }

  const metadataText = JSON.stringify(rawData.data.metadata || {});
  const pageText = JSON.stringify(rawData.data.metadata?.pages || []);
  const markdownText = rawData.data.markdown || "";

  return `${metadataText}\n${pageText}\n${markdownText}`.toLowerCase();
}

function collectKnownUrls(rawData) {
  const urls = new Set();

  const addUrl = (value) => {
    if (typeof value === "string" && value.trim() !== "") {
      urls.add(value.trim().toLowerCase());
    }
  };

  if (rawData?.url) {
    addUrl(rawData.url);
  }

  if (rawData?.data?.url) {
    addUrl(rawData.data.url);
  }

  addUrl(rawData?.data?.metadata?.logoUrl);

  for (const image of rawData?.data?.metadata?.images || []) {
    addUrl(image);
  }

  for (const page of rawData?.data?.metadata?.pages || []) {
    addUrl(page?.url);
    addUrl(page?.logoUrl);

    for (const image of page?.images || []) {
      addUrl(image);
    }
  }

  return urls;
}

function detectMissingFields(profile) {
  if (!profile) {
    return PROFILE_FIELDS.filter((field) => field !== "confidenceScore");
  }

  return PROFILE_FIELDS.filter((field) => {
    if (field === "confidenceScore") {
      return false;
    }

    return !hasMeaningfulValue(profile[field]);
  });
}

function detectHallucinatedFields(rawData, profile) {
  if (!rawData?.data || !profile) {
    return [];
  }

  const evidenceText = buildEvidenceText(rawData);
  const knownUrls = collectKnownUrls(rawData);
  const hallucinated = [];

  const checkStringField = (field) => {
    const value = normalizeValue(profile[field]);

    if (!value) {
      return;
    }

    const normalized = String(value).toLowerCase();

    if (field.endsWith("Url") || field === "website") {
      if (!knownUrls.has(normalized)) {
        hallucinated.push(field);
      }

      return;
    }

    if (!evidenceText.includes(normalized)) {
      hallucinated.push(field);
    }
  };

  const checkArrayField = (field) => {
    const value = Array.isArray(profile[field]) ? profile[field] : [];
    const unsupportedItems = value.filter((item) => {
      const normalized = normalizeValue(item);
      return normalized && !evidenceText.includes(String(normalized).toLowerCase());
    });

    if (unsupportedItems.length > 0) {
      hallucinated.push(`${field} (${unsupportedItems.join(", ")})`);
    }
  };

  checkStringField("companyName");
  checkStringField("website");
  checkStringField("description");
  checkArrayField("focusAreas");
  checkArrayField("technologies");
  checkArrayField("vendorPartnerships");
  checkStringField("location");
  checkStringField("companySize");
  checkStringField("foundedYear");
  checkArrayField("industries");
  checkArrayField("recentActivity");
  checkStringField("githubUrl");
  checkStringField("linkedinUrl");
  checkStringField("logoUrl");

  return hallucinated;
}

function buildAccuracyNotes(rawData, profile, missingFields, hallucinatedFields) {
  const notes = [];

  if (!rawData?.data) {
    notes.push("No crawl data available, so profile accuracy cannot be reviewed.");
  } else {
    notes.push("Crawl data exists and can be manually compared against the generated profile.");
  }

  if (!profile) {
    notes.push("No profile.json data available for this company.");
  } else if (hallucinatedFields.length === 0) {
    notes.push("No obvious unsupported fields were flagged by the basic text-matching review.");
  } else {
    notes.push(
      `Potential unsupported fields flagged: ${hallucinatedFields.join(", ")}.`
    );
  }

  if (missingFields.length > 0) {
    notes.push(`Several fields remain empty: ${missingFields.join(", ")}.`);
  } else {
    notes.push("All expected profile fields were populated.");
  }

  return notes;
}

function getLogoStatus(domain, rawData, profile) {
  const logoPath = path.join(env.paths.outputDir, domain, "logo.png");
  const logoSaved = fs.existsSync(logoPath);
  const discoveredLogo = rawData?.data?.metadata?.logoUrl || profile?.logoUrl || null;

  if (logoSaved) {
    return "Success";
  }

  if (discoveredLogo) {
    return "Failed";
  }

  return "Not found";
}

async function readJsonIfExists(filePath) {
  if (!(await fs.pathExists(filePath))) {
    return null;
  }

  return fs.readJson(filePath);
}

async function loadCompanyOutput(domain) {
  const companyDir = path.join(env.paths.outputDir, domain);

  return {
    domain,
    raw: await readJsonIfExists(path.join(companyDir, "raw.json")),
    profile: await readJsonIfExists(path.join(companyDir, "profile.json")),
  };
}

function buildCompanyReview(entry) {
  const companyName =
    normalizeValue(entry.profile?.companyName) ||
    normalizeValue(entry.raw?.data?.metadata?.title) ||
    titleFromDomain(entry.domain);
  const missingFields = detectMissingFields(entry.profile);
  const hallucinatedFields = detectHallucinatedFields(entry.raw, entry.profile);
  const accuracyNotes = buildAccuracyNotes(
    entry.raw,
    entry.profile,
    missingFields,
    hallucinatedFields
  );
  const logoStatus = getLogoStatus(entry.domain, entry.raw, entry.profile);

  return {
    companyName,
    domain: entry.domain,
    missingFields,
    hallucinatedFields,
    accuracyNotes,
    logoStatus,
    hasRaw: Boolean(entry.raw?.data),
    hasProfile: Boolean(entry.profile),
  };
}

function buildSummary(reviews) {
  const processedCount = reviews.length;
  const crawlAvailableCount = reviews.filter((review) => review.hasRaw).length;
  const profileAvailableCount = reviews.filter((review) => review.hasProfile).length;
  const logoSuccessCount = reviews.filter(
    (review) => review.logoStatus === "Success"
  ).length;
  const flaggedHallucinationCount = reviews.filter(
    (review) => review.hallucinatedFields.length > 0
  ).length;

  return [
    `- Processed companies: ${processedCount}`,
    `- Companies with crawl data: ${crawlAvailableCount}`,
    `- Companies with generated profiles: ${profileAvailableCount}`,
    `- Logos saved successfully: ${logoSuccessCount}`,
    `- Companies with potential unsupported profile fields: ${flaggedHallucinationCount}`,
  ].join("\n");
}

function buildCommonIssues(reviews) {
  const issues = [];

  if (reviews.some((review) => !review.hasRaw)) {
    issues.push("Some companies have no crawl data, so downstream review is blocked.");
  }

  if (reviews.some((review) => !review.hasProfile)) {
    issues.push("Some companies have no generated profile.json output.");
  }

  if (reviews.some((review) => review.logoStatus === "Failed")) {
    issues.push("Some logos were discovered in metadata but were not saved successfully.");
  }

  if (reviews.some((review) => review.logoStatus === "Not found")) {
    issues.push("Some companies have no clear logo candidate in crawl output.");
  }

  if (reviews.some((review) => review.hallucinatedFields.length > 0)) {
    issues.push("Some profile fields are not obviously supported by raw markdown or metadata and need manual review.");
  }

  if (reviews.some((review) => review.missingFields.length > 5)) {
    issues.push("Several companies still have many null or empty fields after synthesis.");
  }

  if (issues.length === 0) {
    issues.push("No major common issues were detected by the current heuristic review.");
  }

  return issues.map((issue) => `- ${issue}`).join("\n");
}

function buildCompanySection(review) {
  const accuracyLines = review.accuracyNotes.map((note) => `  - ${note}`).join("\n");
  const missingFields =
    review.missingFields.length > 0 ? review.missingFields.join(", ") : "None";
  const hallucinatedFields =
    review.hallucinatedFields.length > 0
      ? review.hallucinatedFields.join(", ")
      : "None flagged";

  return [
    `## ${escapeMarkdown(review.companyName)}`,
    `- Company domain: ${escapeMarkdown(review.domain)}`,
    `- Accuracy notes:\n${accuracyLines}`,
    `- Missing fields: ${escapeMarkdown(missingFields)}`,
    `- Hallucinated fields: ${escapeMarkdown(hallucinatedFields)}`,
    `- Logo status: ${escapeMarkdown(review.logoStatus)}`,
  ].join("\n");
}

function buildReport(reviews) {
  const generatedAt = new Date().toISOString();

  return [
    "# Week 1 Review",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    buildSummary(reviews),
    "",
    "## Common Issues",
    buildCommonIssues(reviews),
    "",
    "## Company Reviews",
    "",
    reviews.map(buildCompanySection).join("\n\n"),
    "",
  ].join("\n");
}

async function generateWeek1Review() {
  await fs.ensureDir(path.dirname(REPORT_PATH));

  const companyEntries = await fs.readdir(env.paths.outputDir);
  const companyDomains = companyEntries.filter(
    (entry) => entry !== ".gitkeep" && fs.statSync(path.join(env.paths.outputDir, entry)).isDirectory()
  );

  const reviews = [];

  for (const domain of companyDomains.sort()) {
    const companyOutput = await loadCompanyOutput(domain);
    reviews.push(buildCompanyReview(companyOutput));
  }

  const markdown = buildReport(reviews);

  await fs.writeFile(REPORT_PATH, markdown, "utf8");

  return REPORT_PATH;
}

if (require.main === module) {
  generateWeek1Review()
    .then((reportPath) => {
      console.log(`Review report written to ${reportPath}`);
    })
    .catch((error) => {
      console.error(`Failed to generate review report: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  generateWeek1Review,
};
