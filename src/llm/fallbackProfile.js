const SERVICE_KEYWORDS = [
  "Cloud Consulting",
  "Cloud Migration",
  "Managed Services",
  "DevOps",
  "Platform Engineering",
  "Kubernetes",
  "Site Reliability Engineering",
  "Security",
  "CI/CD",
  "Infrastructure as Code",
  "Observability",
  "FinOps",
  "Software Engineering",
  "Data Engineering",
  "AI Engineering",
];
const TECHNOLOGY_KEYWORDS = [
  "AWS",
  "Azure",
  "Google Cloud",
  "Kubernetes",
  "Docker",
  "Terraform",
  "OpenShift",
  "GitLab",
  "GitHub Actions",
  "Argo CD",
  "Helm",
  "Prometheus",
  "Grafana",
  "Istio",
  "Cilium",
  "Ansible",
  "Pulumi",
  "Go",
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "Ruby",
];
const VENDOR_KEYWORDS = [
  "AWS",
  "Amazon Web Services",
  "Microsoft",
  "Azure",
  "Google Cloud",
  "CNCF",
  "Kubernetes Certified Service Provider",
  "Kubernetes Training Partner",
  "GitLab",
  "Red Hat",
  "OpenShift",
  "HashiCorp",
  "VMware",
  "SUSE",
  "Rancher",
  "Docker",
  "Grafana",
  "Datadog",
  "Elastic",
  "JFrog",
  "Atlassian",
  "Cisco",
  "IBM",
  "Oracle",
];
const PARTNERSHIP_TERMS = [
  "partner",
  "partnership",
  "certified",
  "certification",
  "service provider",
  "solution provider",
  "reseller",
  "marketplace",
  "member",
  "alliance",
  "competency",
  "specialization",
  "partnerschaft",
  "zertifizierung",
  "zertifiziert",
  "mitglied",
  "kompetenz",
  "spezialisierung",
  "lösungsanbieter",
  "loesungsanbieter",
  "dienstleisterprogramm",
];

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactArray(values, limit = 12) {
  return [
    ...new Set(
      values
        .flat()
        .map((value) => normalizeText(value))
        .filter(Boolean)
    ),
  ].slice(0, limit);
}

function websiteSourceText(sourceBundle) {
  return normalizeText(
    [
      sourceBundle?.websiteData?.markdown,
      sourceBundle?.websiteData?.metadata?.title,
      sourceBundle?.websiteData?.metadata?.description,
      JSON.stringify(sourceBundle?.brandfetchData || {}),
      JSON.stringify(sourceBundle?.enrichmentData || {}),
    ].join(" ")
  );
}

function sourceText(sourceBundle) {
  return normalizeText(
    [
      websiteSourceText(sourceBundle),
      JSON.stringify(sourceBundle?.githubData || {}),
    ].join(" ")
  );
}

function includesKeyword(text, keyword) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function extractKeywordMatches(text, keywords) {
  return keywords.filter((keyword) => includesKeyword(text, keyword));
}

function extractVendorPartnerships(text) {
  const lowerText = text.toLowerCase();

  return compactArray(
    VENDOR_KEYWORDS.filter((vendor) => {
      const vendorIndex = lowerText.indexOf(vendor.toLowerCase());

      if (vendorIndex === -1) {
        return false;
      }

      const evidenceWindow = lowerText.slice(
        Math.max(0, vendorIndex - 180),
        vendorIndex + vendor.length + 180
      );

      return PARTNERSHIP_TERMS.some((term) => evidenceWindow.includes(term));
    }),
    8
  );
}

function extractLinkedInUrl(sourceBundle) {
  if (sourceBundle?.enrichmentData?.linkedinUrl) {
    return sourceBundle.enrichmentData.linkedinUrl;
  }

  const links = sourceBundle?.brandfetchData?.links || [];
  const linkedinLink = links.find((link) => /linkedin/i.test(link?.url || link?.name || ""));

  return linkedinLink?.url || null;
}

function extractLocation(enrichmentData) {
  const location = enrichmentData?.location;

  if (!location || typeof location !== "object") {
    return null;
  }

  return compactArray([location.city, location.state, location.country], 4).join(", ") || null;
}

function extractLogoUrl(sourceBundle) {
  const metadata = sourceBundle?.websiteData?.metadata || {};
  const images = Array.isArray(metadata.images) ? metadata.images : [];

  return (
    sourceBundle?.brandfetchData?.bestLogo?.url ||
    metadata.logoUrl ||
    images.find((image) => /(logo|brand)/i.test(image)) ||
    null
  );
}

function extractWebsiteRecentActivity(sourceBundle) {
  const markdown = sourceBundle?.websiteData?.markdown || "";
  const pages = sourceBundle?.websiteData?.metadata?.pages || [];
  const datePattern = /\b(20\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.]20\d{2})\b/;

  const datedLines = markdown
    .split("\n")
    .map((line) => normalizeText(line.replace(/^#+\s*/, "")))
    .filter((line) => datePattern.test(line))
    .slice(0, 3)
    .map((line) => {
      const dateMatch = line.match(datePattern);
      const sourcePage = pages.find((page) => markdown.includes(page?.title || "")) || pages[0];

      return {
        title: line.slice(0, 180),
        date: dateMatch ? dateMatch[0].replace(/\//g, "-").replace(/\./g, "-") : null,
        source: sourcePage?.url || sourceBundle?.url || null,
        sourceType: "website",
      };
    });

  return datedLines;
}

function extractRecentActivity(sourceBundle) {
  const websiteActivity = extractWebsiteRecentActivity(sourceBundle);
  const githubData = sourceBundle?.githubData || {};
  const activity = Array.isArray(githubData?.activity) ? githubData.activity : [];
  const repos = Array.isArray(githubData?.repos) ? githubData.repos : [];

  const githubActivity = activity
    .filter((repo) => repo.name || repo.description)
    .slice(0, 5)
    .map((entry) => {
      const repo = repos.find((candidate) => candidate.name === entry.name) || entry;

      return {
        title: normalizeText([entry.name, entry.description ? `- ${entry.description}` : ""].join(" ")),
        date: repo.updatedAt || repo.pushedAt ? String(repo.updatedAt || repo.pushedAt).slice(0, 10) : null,
        source: repo.url || githubData.organization?.url || null,
        sourceType: "github",
      };
    });

  return [...websiteActivity, ...githubActivity].slice(0, 7);
}

function fallbackConfidenceScore(profile, sourceBundle) {
  let score = 35;

  if (sourceBundle?.websiteData?.markdown) {
    score += 20;
  }

  if (sourceBundle?.enrichmentData) {
    score += 15;
  }

  if (sourceBundle?.githubData) {
    score += 10;
  }

  if (sourceBundle?.brandfetchData) {
    score += 10;
  }

  if (profile.vendorPartnerships.length > 0) {
    score += 5;
  }

  return Math.min(score, 85);
}

function generateFallbackCompanyProfile(sourceBundle) {
  const websiteText = websiteSourceText(sourceBundle);
  const metadata = sourceBundle?.websiteData?.metadata || {};
  const enrichmentData = sourceBundle?.enrichmentData || {};
  const githubData = sourceBundle?.githubData || {};
  const brandfetchData = sourceBundle?.brandfetchData || {};
  const topLanguages = Array.isArray(githubData.topLanguages)
    ? githubData.topLanguages.map((entry) => entry.language)
    : [];
  const services = extractKeywordMatches(websiteText, SERVICE_KEYWORDS);
  const websiteTechnologies = extractKeywordMatches(websiteText, TECHNOLOGY_KEYWORDS);
  const supportingGithubTechnologies = topLanguages.filter((language) =>
    websiteTechnologies.some((technology) => technology.toLowerCase() === language.toLowerCase())
  );
  const technologies = compactArray([websiteTechnologies, supportingGithubTechnologies]);
  const profile = {
    companyName:
      enrichmentData.companyName ||
      brandfetchData.companyName ||
      metadata.title ||
      null,
    website: sourceBundle?.url || sourceBundle?.websiteData?.url || null,
    description:
      brandfetchData.description ||
      metadata.description ||
      null,
    services,
    focusAreas: compactArray(services.filter((service) => service !== "Managed Services"), 8),
    technologies,
    vendorPartnerships: extractVendorPartnerships(websiteText),
    location: extractLocation(enrichmentData),
    companySize: enrichmentData.companySize || null,
    foundedYear: enrichmentData.foundedYear || null,
    industries: [],
    recentActivity: extractRecentActivity(sourceBundle),
    githubUrl: githubData.organization?.url || null,
    linkedinUrl: extractLinkedInUrl(sourceBundle),
    logoUrl: extractLogoUrl(sourceBundle),
    confidenceScore: 0,
  };

  profile.confidenceScore = fallbackConfidenceScore(profile, sourceBundle);

  return profile;
}

module.exports = {
  generateFallbackCompanyProfile,
};
