const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { getDomainFromUrl } = require("./url");

const MAPPING_FILE = path.resolve(process.cwd(), "data", "re-company-mapping.json");
const OUTPUT_FILE = path.resolve(process.cwd(), "docs", "week2-comparison.csv");
const FIELDS_TO_COMPARE = [
  "companyName",
  "website",
  "description",
  "services",
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

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readJsonSync(filePath);
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value)
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\u0026/g, "&")
    .replace(/\\u0027/g, "'")
    .trim();
}

function extractFirst(html, pattern) {
  const match = html.match(pattern);
  return match ? cleanText(match[1]) : null;
}

function extractNamesFromArray(html, key) {
  const blockMatch = html.match(new RegExp(`"${key}":\\[(.*?)\\](?:,")`, "s"));

  if (!blockMatch) {
    return [];
  }

  return [...blockMatch[1].matchAll(/"name":"([^"]+)"/g)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
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

function normalizeForCompare(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean).sort();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed.toLowerCase();
  }

  return String(value);
}

function assessField(existingValue, scrapedValue) {
  const existing = normalizeForCompare(existingValue);
  const scraped = normalizeForCompare(scrapedValue);

  if ((existing === null || existing.length === 0) && (scraped === null || scraped.length === 0)) {
    return "missing";
  }

  if ((existing === null || existing.length === 0) && scraped !== null) {
    return "new";
  }

  if (existing !== null && (scraped === null || scraped.length === 0)) {
    return "worse";
  }

  if (JSON.stringify(existing) === JSON.stringify(scraped)) {
    return "equal";
  }

  if (Array.isArray(existing) && Array.isArray(scraped)) {
    return scraped.length >= existing.length ? "better" : "different";
  }

  if (typeof existing === "string" && typeof scraped === "string") {
    return scraped.length >= existing.length ? "better" : "different";
  }

  return "different";
}

async function fetchExistingReProfile(reProfileUrl) {
  const response = await axios.get(reProfileUrl, {
    timeout: 20000,
    responseType: "text",
  });

  const html = String(response.data).replace(/\\"/g, '"');

  return {
    companyName:
      extractFirst(html, /"company_name":"([^"]+)"/) ||
      extractFirst(html, /<title>([^<]+)<\/title>/i),
    website: extractFirst(html, /"company_website":"([^"]+)"/),
    description:
      extractFirst(html, /"seo_description":"([^"]+)"/) ||
      extractFirst(html, /"company_summary":"([^"]+)"/),
    services: extractNamesFromArray(html, "service_list"),
    technologies: extractNamesFromArray(html, "technology_list"),
    vendorPartnerships: extractNamesFromArray(html, "strategic_partnership_list"),
    location: {
      city: extractFirst(html, /"city":"([^"]+)"/),
      country: extractFirst(html, /"country":"([^"]+)"/),
    },
    companySize: extractFirst(html, /"company_size":"([^"]+)"/),
    foundedYear: extractFirst(html, /"founded_year":"([^"]+)"/),
    industries: extractNamesFromArray(html, "industry_list"),
    recentActivity: extractNamesFromArray(html, "case_studies"),
    githubUrl: extractFirst(html, /"github_url":"([^"]+)"/),
    linkedinUrl: extractFirst(html, /"linkedin_url":"([^"]+)"/),
    logoUrl:
      extractFirst(html, /"company_logo":"([^"]+)"/) ||
      extractFirst(html, /"og:image" content="([^"]+)"/),
    confidenceScore: null,
  };
}

function loadScrapedProfile(website) {
  const domain = getDomainFromUrl(website);
  const outputDir = path.join(env.paths.outputDir, domain);
  const profile = readJsonIfExists(path.join(outputDir, "profile.json"));
  const raw = readJsonIfExists(path.join(outputDir, "raw.json"));

  return {
    domain,
    profile,
    raw,
  };
}

function buildCsvRows(mappingEntry, existingProfile, scrapedProfile) {
  return FIELDS_TO_COMPARE.map((field) => {
    const existingValue = existingProfile?.[field] ?? null;
    const scrapedValue = scrapedProfile?.[field] ?? null;

    return [
      mappingEntry.companyName,
      mappingEntry.website,
      mappingEntry.reProfileUrl,
      field,
      stringifyValue(existingValue),
      stringifyValue(scrapedValue),
      assessField(existingValue, scrapedValue),
    ];
  });
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

async function generateComparisonSpreadsheet() {
  const mapping = await fs.readJson(MAPPING_FILE);
  const rows = [
    [
      "companyName",
      "website",
      "reProfileUrl",
      "field",
      "existingValue",
      "scrapedValue",
      "assessment",
    ],
  ];

  for (const entry of mapping) {
    let existingProfile = null;

    try {
      existingProfile = await fetchExistingReProfile(entry.reProfileUrl);
      if (existingProfile && !existingProfile.website) {
        existingProfile.website = entry.website;
      }
    } catch (error) {
      console.warn(
        `[comparison] Failed to fetch RE profile for ${entry.companyName}: ${error.message}`
      );
    }

    const scraped = loadScrapedProfile(entry.website);
    rows.push(...buildCsvRows(entry, existingProfile, scraped.profile));
  }

  await fs.ensureDir(path.dirname(OUTPUT_FILE));
  await fs.writeFile(OUTPUT_FILE, toCsv(rows), "utf8");

  return OUTPUT_FILE;
}

if (require.main === module) {
  generateComparisonSpreadsheet()
    .then((filePath) => {
      console.log(`Comparison spreadsheet written to ${filePath}`);
    })
    .catch((error) => {
      console.error(`Failed to generate comparison spreadsheet: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  generateComparisonSpreadsheet,
};
