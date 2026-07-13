const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");
const { asArray, normalizeProfile, normalizeProfiles } = require("./normalizeProfile");

const PUBLIC_PROFILE_STATUSES = new Set([
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
]);

function normalizeLifecycleStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (!value || value === "published") return "approved";
  if (value === "draft" || value === "needs_review") return "scraped";
  if (value === "archived") return "removed";

  return value;
}

function isPublicProfile(profile = {}) {
  const status = normalizeLifecycleStatus(profile.status);

  return PUBLIC_PROFILE_STATUSES.has(status);
}

function safeDomain(value) {
  const decoded = decodeURIComponent(String(value || ""));

  if (!/^[a-z0-9.-]+$/i.test(decoded)) {
    return null;
  }

  return decoded;
}

async function readJsonIfExists(filePath) {
  if (!(await fs.pathExists(filePath))) {
    return null;
  }

  return fs.readJson(filePath);
}

function buildReviewNotes(profile, sourceBundle, files) {
  const notes = [];

  if (!profile) {
    return ["No profile.json is available for this company."];
  }

  if (!sourceBundle?.websiteData?.markdown) {
    notes.push("Website crawl text is empty or thin, so extraction confidence should be reviewed.");
  }

  if (asArray(profile.technologies).length === 0) {
    notes.push("No technologies were extracted from website content.");
  }

  if (asArray(profile.vendorPartnerships).length === 0) {
    notes.push("No explicit vendor partnerships or certifications were found.");
  }

  if ((profile.confidenceScore || 0) < 60) {
    notes.push("Confidence score is below 60 and should be manually checked.");
  }

  if (!files.logo) {
    notes.push("No local logo file was saved.");
  }

  if (notes.length === 0) {
    notes.push("Profile has website/source data, logo output, and no obvious missing review flags.");
  }

  return notes;
}

function summarizeActivity(activity, github) {
  const repos = Array.isArray(github?.repos) ? github.repos : [];

  return asArray(activity).map((entry) => {
    if (typeof entry === "string") {
      const repoName = entry.split(/\s+-\s+/)[0];
      const repo = repos.find((candidate) => candidate.name === repoName);

      return {
        title: entry,
        date: repo?.updatedAt || repo?.pushedAt ? String(repo.updatedAt || repo.pushedAt).slice(0, 10) : null,
        source: repo?.url || github?.organization?.url || null,
        sourceType: repo || github?.organization?.url ? "github" : null,
      };
    }

    const repoName = entry?.name || String(entry?.title || "").split(/\s+-\s+/)[0];
    const repo = repos.find((candidate) => candidate.name === repoName);

    return {
      title: entry?.title || entry?.name || entry?.description || "",
      date:
        entry?.date ||
        entry?.updatedAt ||
        entry?.publishedAt ||
        (repo?.updatedAt || repo?.pushedAt ? String(repo.updatedAt || repo.pushedAt).slice(0, 10) : null),
      source: entry?.source || entry?.url || repo?.url || github?.organization?.url || null,
      sourceType: entry?.sourceType || entry?.type || (repo || github?.organization?.url ? "github" : null),
    };
  });
}

function logoPathForDomain(domain) {
  return path.join(env.paths.outputDir, domain, "logo.png");
}

async function logoFileForDomain(domain) {
  const companyDir = path.join(env.paths.outputDir, domain);
  const candidates = [
    path.join(companyDir, "logo.svg"),
    path.join(companyDir, "logo.png"),
    path.join(env.paths.rootDir, "public", "logos", domain, "logo.svg"),
    path.join(env.paths.rootDir, "public", "logos", domain, "logo.png"),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadProfile(domain) {
  const companyDir = path.join(env.paths.outputDir, domain);
  const profile = await readJsonIfExists(path.join(companyDir, "profile.json"));
  const sourceBundle = await readJsonIfExists(path.join(companyDir, "source-bundle.json"));
  const raw = await readJsonIfExists(path.join(companyDir, "raw.json"));
  const github = await readJsonIfExists(path.join(companyDir, "github.json"));
  const enrichment = await readJsonIfExists(path.join(companyDir, "enrichment.json"));
  const brandfetch = await readJsonIfExists(path.join(companyDir, "brandfetch.json"));
  const logoSource = await readJsonIfExists(path.join(companyDir, "logo-source.json"));
  const logoFile = await logoFileForDomain(domain);
  const logoExt = logoFile ? path.extname(logoFile) : "";
  const files = {
    logo: logoFile ? `/logos/${domain}/logo${logoExt}` : null,
    profile: Boolean(profile),
    sourceBundle: Boolean(sourceBundle),
    raw: Boolean(raw),
    github: Boolean(github),
    enrichment: Boolean(enrichment),
    brandfetch: Boolean(brandfetch),
  };

  return normalizeProfile({
    domain,
    companyName: profile?.companyName || sourceBundle?.brandfetchData?.companyName || domain,
    website: profile?.website || sourceBundle?.url || raw?.url || null,
    description: profile?.description || null,
    services: asArray(profile?.services),
    focusAreas: asArray(profile?.focusAreas),
    industries: asArray(profile?.industries),
    technologies: asArray(profile?.technologies),
    vendorPartnerships: asArray(profile?.vendorPartnerships),
    successStories: asArray(profile?.successStories),
    solutions: asArray(profile?.solutions),
    companyLocation: profile?.companyLocation,
    location: profile?.location || null,
    confidenceScore: profile?.confidenceScore || 0,
    githubUrl: profile?.githubUrl || github?.organization?.url || null,
    linkedinUrl: profile?.linkedinUrl || null,
    logoUrl: files.logo || profile?.logoUrl || sourceBundle?.brandfetchData?.bestLogo?.url || null,
    claimed: profile?.claimed,
    recentActivity: summarizeActivity(profile?.recentActivity, github),
    reviewNotes: buildReviewNotes(profile, sourceBundle, files),
    scraperQualityLog: profile?.scraperQualityLog || {},
    files,
    json: {
      profile,
      sourceBundle,
      raw,
      github,
      enrichment,
      brandfetch,
      logoSource,
    },
  }, { sourceBundle });
}

async function listProfiles() {
  const entries = await fs.readdir(env.paths.outputDir, { withFileTypes: true });
  const domains = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((domain) => domain !== "demo" && domain !== "proof.local")
    .sort();
  const profiles = await Promise.all(domains.map(loadProfile));

  return profiles.filter((profile) => profile.json.profile && isPublicProfile(profile));
}

async function listStaticProfiles() {
  const staticPath = path.join(env.paths.rootDir, "public", "profiles.json");

  if (!(await fs.pathExists(staticPath))) {
    return [];
  }

  return (await listAllStaticProfiles()).filter(isPublicProfile);
}

async function listAllStaticProfiles() {
  const staticPath = path.join(env.paths.rootDir, "public", "profiles.json");

  if (!(await fs.pathExists(staticPath))) {
    return [];
  }

  return normalizeProfiles(await fs.readJson(staticPath));
}

module.exports = {
  isPublicProfile,
  listAllStaticProfiles,
  listStaticProfiles,
  listProfiles,
  loadProfile,
  logoFileForDomain,
  logoPathForDomain,
  safeDomain,
};
