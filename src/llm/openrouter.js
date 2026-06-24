const OpenAI = require("openai");
const { env } = require("../config/env");

const MAX_MARKDOWN_CHARS = 16000;
const MAX_IMAGE_COUNT = 6;
const MAX_PAGE_COUNT = 3;

const PROFILE_SCHEMA = {
  companyName: null,
  website: null,
  description: null,
  services: [],
  focusAreas: [],
  technologies: [],
  vendorPartnerships: [],
  location: null,
  companySize: null,
  foundedYear: null,
  industries: [],
  recentActivity: [
    {
      title: null,
      date: null,
      source: null,
      sourceType: null,
    },
  ],
  githubUrl: null,
  linkedinUrl: null,
  logoUrl: null,
  confidenceScore: 0,
};

const SYSTEM_PROMPT = [
  "You are a conservative information extraction system for IT service provider profiles.",
  "Return ONLY valid JSON.",
  "Do not include markdown fences or extra text.",
  "Use only evidence present in the supplied website, GitHub, enrichment, and Brandfetch data.",
  "Do not infer facts from general world knowledge, URLs alone, broad industry norms, or customer case studies.",
  "If a scalar field is unknown, set it to null.",
  "For list fields, return an empty array when no explicit evidence is present.",
  "Prefer Apollo/Clearbit enrichment for company size, founded year, LinkedIn URL, and location when available.",
  "Prefer website copy for description, services, focus areas, technologies, and vendor partnerships.",
  "For technologies, use website content as the primary evidence. Use GitHub languages or repositories only as supporting evidence when website content is thin or confirms the same technology.",
  "Use GitHub data only for githubUrl and recentActivity, not as the main source for technologies and never as proof of vendor partnerships.",
  "Vendor partnerships must be explicit alliances, certifications, marketplace partnerships, reseller/channel relationships, memberships, or service-provider programs.",
  "Do not list customers, clients, case-study subjects, implementation targets, products merely used, or open-source projects as vendorPartnerships.",
  "Valid vendor partnership evidence often includes phrases like partner, certified service provider, reseller, solution provider, marketplace, member, alliance, competency, specialization, or certification.",
  "For cloud-native providers, extract explicit programs such as CNCF, Kubernetes Certified Service Provider, Kubernetes Training Partner, GitLab Partner, AWS Partner, Microsoft Partner, Google Cloud Partner, Red Hat Partner, HashiCorp Partner, JFrog Partner, Grafana Partner, Datadog Partner, or similar only when supported.",
  "For Swiss and German providers, also recognize explicit German-language evidence such as Partner, Partnerschaft, Zertifizierung, zertifiziert, Mitglied, Kompetenz, Spezialisierung, Lösungsanbieter, Dienstleisterprogramm, or Reseller.",
  "For recentActivity, return objects with title, date, source, and sourceType. Include dates when available and include the source URL when available.",
  "For logoUrl, prefer Brandfetch bestLogo or a website image URL that clearly represents the company logo; avoid favicon/icon URLs when a larger logo candidate exists.",
  "Set confidenceScore to an integer from 0 to 100 based only on evidence in the provided data.",
  "Use this exact JSON shape:",
  JSON.stringify(PROFILE_SCHEMA),
].join(" ");

function createClient() {
  if (!env.openRouter.apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  return new OpenAI({
    apiKey: env.openRouter.apiKey,
    baseURL: env.openRouter.baseUrl || "https://openrouter.ai/api/v1",
  });
}

function stripCodeFences(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonString(value) {
  const cleaned = stripCodeFences(value);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return String(value);
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeString)
    .filter(Boolean);
}

function normalizeRecentActivity(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const title = normalizeString(entry);
        return title
          ? {
              title,
              date: null,
              source: null,
              sourceType: null,
            }
          : null;
      }

      const title = normalizeString(entry?.title || entry?.name || entry?.description);

      if (!title) {
        return null;
      }

      return {
        title,
        date: normalizeString(entry?.date || entry?.updatedAt || entry?.publishedAt),
        source: normalizeString(entry?.source || entry?.url),
        sourceType: normalizeString(entry?.sourceType || entry?.type),
      };
    })
    .filter(Boolean);
}

function normalizeFoundedYear(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const year = Number.parseInt(value, 10);

  if (!Number.isInteger(year) || year < 1800 || year > 3000) {
    return null;
  }

  return year;
}

function normalizeConfidenceScore(value) {
  const score = Number.parseInt(value, 10);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

function normalizeProfile(parsed) {
  return {
    companyName: normalizeString(parsed?.companyName),
    website: normalizeString(parsed?.website),
    description: normalizeString(parsed?.description),
    services: normalizeArray(parsed?.services),
    focusAreas: normalizeArray(parsed?.focusAreas),
    technologies: normalizeArray(parsed?.technologies),
    vendorPartnerships: normalizeArray(parsed?.vendorPartnerships),
    location: normalizeString(parsed?.location),
    companySize: normalizeString(parsed?.companySize),
    foundedYear: normalizeFoundedYear(parsed?.foundedYear),
    industries: normalizeArray(parsed?.industries),
    recentActivity: normalizeRecentActivity(parsed?.recentActivity),
    githubUrl: normalizeString(parsed?.githubUrl),
    linkedinUrl: normalizeString(parsed?.linkedinUrl),
    logoUrl: normalizeString(parsed?.logoUrl),
    confidenceScore: normalizeConfidenceScore(parsed?.confidenceScore),
  };
}

function parseProfileResponse(content) {
  const jsonString = extractJsonString(content);
  const parsed = JSON.parse(jsonString);

  return normalizeProfile(parsed);
}

function truncateText(value, maxLength) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n\n[truncated]`;
}

function compactPage(page) {
  if (!page || typeof page !== "object") {
    return null;
  }

  return {
    url: page.url || null,
    title: page.title || null,
    description: page.description || null,
    logoUrl: page.logoUrl || null,
    images: Array.isArray(page.images) ? page.images.slice(0, 3) : [],
  };
}

function compactWebsiteData(websiteData) {
  if (!websiteData || typeof websiteData !== "object") {
    return null;
  }

  const metadata = websiteData.metadata || {};
  const pages = Array.isArray(metadata.pages) ? metadata.pages : [];

  return {
    url: websiteData.url || null,
    markdown: truncateText(websiteData.markdown || "", MAX_MARKDOWN_CHARS),
    markdownLength: typeof websiteData.markdown === "string" ? websiteData.markdown.length : 0,
    metadata: {
      title: metadata.title || null,
      description: metadata.description || null,
      logoUrl: metadata.logoUrl || null,
      images: Array.isArray(metadata.images) ? metadata.images.slice(0, MAX_IMAGE_COUNT) : [],
      pageCount: pages.length,
      pages: pages.slice(0, MAX_PAGE_COUNT).map(compactPage).filter(Boolean),
    },
  };
}

function compactBrandfetchData(brandfetchData) {
  if (!brandfetchData || typeof brandfetchData !== "object") {
    return null;
  }

  return {
    provider: brandfetchData.provider || null,
    companyName: brandfetchData.companyName || null,
    description: brandfetchData.description || null,
    qualityScore: brandfetchData.qualityScore ?? null,
    links: Array.isArray(brandfetchData.links) ? brandfetchData.links : [],
    bestLogo: brandfetchData.bestLogo || null,
    domain: brandfetchData.domain || null,
  };
}

function prepareScrapedPayload(scrapedData) {
  if (
    scrapedData?.websiteData ||
    scrapedData?.githubData ||
    scrapedData?.enrichmentData ||
    scrapedData?.brandfetchData
  ) {
    return {
      website: scrapedData.url || scrapedData.websiteData?.url || null,
      websiteData: compactWebsiteData(scrapedData.websiteData),
      githubData: scrapedData.githubData || null,
      enrichmentData: scrapedData.enrichmentData || null,
      brandfetchData: compactBrandfetchData(scrapedData.brandfetchData),
    };
  }

  const source = scrapedData?.data ? scrapedData.data : scrapedData;

  return {
    website: source?.url || scrapedData?.url || null,
    websiteData: compactWebsiteData({
      url: source?.url || scrapedData?.url || null,
      markdown: source?.markdown || null,
      metadata: source?.metadata || null,
    }),
    githubData: null,
    enrichmentData: null,
    brandfetchData: null,
  };
}

function buildUserPrompt(scrapedData, retryMessage = null) {
  const payload = prepareScrapedPayload(scrapedData);
  const instructions = [
    "Extract a company profile from the provided source bundle.",
    "Use only information explicitly supported by the supplied data.",
    "If a scalar value is not supported, set it to null.",
    "For list fields with no support, return an empty array.",
    "Keep list values concise and deduplicated.",
    "For vendorPartnerships, include only explicitly stated partner/certification/member programs; exclude customers, clients, tools used, repository dependencies, and case-study brands.",
    "For recentActivity, return objects with title, date, source, and sourceType. Summarize concrete dated news, blog posts, events, or current GitHub repository activity from the supplied data.",
    "For technologies, include named platforms, languages, frameworks, and infrastructure tools from website content first. Use GitHub only as supporting evidence, not as the main source.",
    "For companySize and foundedYear, prefer enrichment data over estimates from website text.",
    "For logoUrl, choose the best supported company logo candidate, not a favicon, unless no other logo candidate is present.",
    "Return JSON only.",
  ];

  if (retryMessage) {
    instructions.push(retryMessage);
  }

  return [
    instructions.join(" "),
    "",
    "Required JSON keys:",
    Object.keys(PROFILE_SCHEMA).join(", "),
    "",
    "=== WEBSITE DATA ===",
    JSON.stringify(payload.websiteData, null, 2),
    "",
    "=== GITHUB DATA ===",
    JSON.stringify(payload.githubData, null, 2),
    "",
    "=== APOLLO/CLEARBIT DATA ===",
    JSON.stringify(payload.enrichmentData, null, 2),
    "",
    "=== BRANDFETCH DATA ===",
    JSON.stringify(payload.brandfetchData, null, 2),
    "",
    "=== INPUT WEBSITE ===",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

async function requestProfileCompletion(client, scrapedData, retryMessage = null) {
  const response = await client.chat.completions.create({
    model: env.openRouter.model || "anthropic/claude-sonnet-4",
    temperature: 0.1,
    max_tokens: 2500,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPrompt(scrapedData, retryMessage),
      },
    ],
  });

  return response.choices?.[0]?.message?.content || "";
}

async function generateCompanyProfile(scrapedData) {
  const client = createClient();
  let firstResponseText = "";

  try {
    firstResponseText = await requestProfileCompletion(client, scrapedData);
    return parseProfileResponse(firstResponseText);
  } catch (firstError) {
    try {
      const secondResponseText = await requestProfileCompletion(
        client,
        scrapedData,
        `Your previous response could not be parsed as JSON. Return only one valid JSON object with the exact required keys.`
      );

      return parseProfileResponse(secondResponseText);
    } catch (secondError) {
      const error = new Error(
        `Failed to generate company profile: ${secondError.message}`
      );

      error.cause = {
        firstError: firstError.message,
        firstResponseText,
        secondError: secondError.message,
      };

      throw error;
    }
  }
}

module.exports = {
  generateCompanyProfile,
  buildUserPrompt,
};
