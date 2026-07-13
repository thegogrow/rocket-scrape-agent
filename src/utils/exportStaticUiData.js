const fs = require("fs-extra");
const path = require("path");
const { listProfiles, logoPathForDomain } = require("../ui/profileData");

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const PUBLIC_LOGOS_DIR = path.join(PUBLIC_DIR, "logos");
const PUBLIC_PROFILES_PATH = path.join(PUBLIC_DIR, "profiles.json");

function compactProfile(profile) {
  return {
    domain: profile.domain,
    country: profile.country,
    city: profile.city,
    companyLocation: profile.companyLocation,
    companyName: profile.companyName,
    website: profile.website,
    description: profile.description,
    services: profile.services,
    focusAreas: profile.focusAreas,
    industries: profile.industries,
    technologies: profile.technologies,
    vendorPartnerships: profile.vendorPartnerships,
    filterBuckets: profile.filterBuckets,
    successStories: profile.successStories,
    solutions: profile.solutions,
    location: profile.location,
    confidenceScore: profile.confidenceScore,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    logoUrl: profile.files?.logo ? `/logos/${profile.domain}/logo.png` : profile.logoUrl,
    claimed: profile.claimed,
    subscriptionTier: profile.subscriptionTier,
    isPremium: profile.isPremium,
    recentActivity: profile.recentActivity,
    reviewNotes: profile.reviewNotes,
    scraperQualityLog: profile.scraperQualityLog,
    files: profile.files,
  };
}

async function exportStaticUiData() {
  const exportDomainsPath = process.env.EXPORT_DOMAINS_FILE
    ? path.resolve(process.cwd(), process.env.EXPORT_DOMAINS_FILE)
    : null;
  const exportDomains = exportDomainsPath && await fs.pathExists(exportDomainsPath)
    ? new Set(await fs.readJson(exportDomainsPath))
    : null;
  const profiles = (await listProfiles())
    .filter((profile) => !exportDomains || exportDomains.has(profile.domain));
  const compactProfiles = profiles.map(compactProfile);

  await fs.ensureDir(PUBLIC_LOGOS_DIR);
  await fs.emptyDir(PUBLIC_LOGOS_DIR);

  for (const profile of profiles) {
    const sourceLogoPath = logoPathForDomain(profile.domain);

    if (!(await fs.pathExists(sourceLogoPath))) {
      continue;
    }

    await fs.copy(sourceLogoPath, path.join(PUBLIC_LOGOS_DIR, profile.domain, "logo.png"));
  }

  await fs.writeJson(PUBLIC_PROFILES_PATH, compactProfiles, { spaces: 2 });

  console.log(`Exported ${compactProfiles.length} profiles to ${PUBLIC_PROFILES_PATH}`);
}

exportStaticUiData().catch((error) => {
  console.error(`Failed to export static UI data: ${error.message}`);
  process.exitCode = 1;
});
