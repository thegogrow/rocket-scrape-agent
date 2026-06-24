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
    companyName: profile.companyName,
    website: profile.website,
    description: profile.description,
    services: profile.services,
    focusAreas: profile.focusAreas,
    technologies: profile.technologies,
    vendorPartnerships: profile.vendorPartnerships,
    location: profile.location,
    confidenceScore: profile.confidenceScore,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    logoUrl: profile.files?.logo ? `/logos/${profile.domain}/logo.png` : profile.logoUrl,
    recentActivity: profile.recentActivity,
    reviewNotes: profile.reviewNotes,
    files: profile.files,
  };
}

async function exportStaticUiData() {
  const profiles = await listProfiles();
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
