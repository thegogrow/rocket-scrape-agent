const fs = require("fs-extra");
const path = require("path");
const { env } = require("../config/env");

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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCountry(profile, sourceBundle) {
  const locationText = [
    profile?.location,
    sourceBundle?.enrichmentData?.location?.country,
    sourceBundle?.enrichmentData?.location?.state,
  ]
    .filter(Boolean)
    .join(" ");

  if (/switzerland|swiss|schweiz|suisse|zurich|zürich|bern|basel|lausanne/i.test(locationText)) {
    return "Switzerland";
  }

  if (/germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|köln|cologne/i.test(locationText)) {
    return "Germany";
  }

  return sourceBundle?.enrichmentData?.location?.country || null;
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

async function loadProfile(domain) {
  const companyDir = path.join(env.paths.outputDir, domain);
  const profile = await readJsonIfExists(path.join(companyDir, "profile.json"));
  const sourceBundle = await readJsonIfExists(path.join(companyDir, "source-bundle.json"));
  const raw = await readJsonIfExists(path.join(companyDir, "raw.json"));
  const github = await readJsonIfExists(path.join(companyDir, "github.json"));
  const enrichment = await readJsonIfExists(path.join(companyDir, "enrichment.json"));
  const brandfetch = await readJsonIfExists(path.join(companyDir, "brandfetch.json"));
  const logoSource = await readJsonIfExists(path.join(companyDir, "logo-source.json"));
  const hasLogo = await fs.pathExists(logoPathForDomain(domain));
  const country = normalizeCountry(profile, sourceBundle);
  const files = {
    logo: hasLogo ? `/logos/${domain}/logo.png` : null,
    profile: Boolean(profile),
    sourceBundle: Boolean(sourceBundle),
    raw: Boolean(raw),
    github: Boolean(github),
    enrichment: Boolean(enrichment),
    brandfetch: Boolean(brandfetch),
  };

  return {
    domain,
    country,
    companyName: profile?.companyName || sourceBundle?.brandfetchData?.companyName || domain,
    website: profile?.website || sourceBundle?.url || raw?.url || null,
    description: profile?.description || null,
    services: asArray(profile?.services),
    focusAreas: asArray(profile?.focusAreas),
    technologies: asArray(profile?.technologies),
    vendorPartnerships: asArray(profile?.vendorPartnerships),
    location: profile?.location || null,
    confidenceScore: profile?.confidenceScore || 0,
    githubUrl: profile?.githubUrl || github?.organization?.url || null,
    linkedinUrl: profile?.linkedinUrl || null,
    logoUrl: files.logo || profile?.logoUrl || sourceBundle?.brandfetchData?.bestLogo?.url || null,
    recentActivity: summarizeActivity(profile?.recentActivity, github),
    reviewNotes: buildReviewNotes(profile, sourceBundle, files),
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
  };
}

async function listProfiles() {
  const entries = await fs.readdir(env.paths.outputDir, { withFileTypes: true });
  const domains = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((domain) => domain !== "demo")
    .sort();
  const profiles = await Promise.all(domains.map(loadProfile));

  return profiles.filter((profile) => profile.json.profile);
}

async function listStaticProfiles() {
  const staticPath = path.join(env.paths.rootDir, "public", "profiles.json");

  if (!(await fs.pathExists(staticPath))) {
    return [];
  }

  return fs.readJson(staticPath);
}

module.exports = {
  listStaticProfiles,
  listProfiles,
  loadProfile,
  logoPathForDomain,
  safeDomain,
};
