const axios = require("axios");
const { env } = require("../config/env");
const { getDomainFromUrl } = require("./url");

const DEFAULT_TIMEOUT_MS = 30000;

function getBrandfetchHeaders() {
  if (!env.brandfetch.apiKey) {
    return null;
  }

  return {
    Authorization: `Bearer ${env.brandfetch.apiKey}`,
  };
}

function getBrandfetchBaseUrl() {
  return (env.brandfetch.baseUrl || "https://api.brandfetch.io").replace(/\/+$/, "");
}

function sortFormats(formats) {
  const formatScore = {
    png: 4,
    webp: 3,
    jpeg: 2,
    svg: 1,
  };

  return [...formats].sort((left, right) => {
    const leftScore = formatScore[left?.format] || 0;
    const rightScore = formatScore[right?.format] || 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const leftArea = (left?.width || 0) * (left?.height || 0);
    const rightArea = (right?.width || 0) * (right?.height || 0);

    return rightArea - leftArea;
  });
}

function sortLogos(logos) {
  const typeScore = {
    logo: 4,
    symbol: 3,
    icon: 2,
    other: 1,
  };

  const themeScore = {
    dark: 2,
    light: 1,
  };

  return [...logos].sort((left, right) => {
    const leftTypeScore = typeScore[left?.type] || 0;
    const rightTypeScore = typeScore[right?.type] || 0;

    if (rightTypeScore !== leftTypeScore) {
      return rightTypeScore - leftTypeScore;
    }

    const leftThemeScore = themeScore[left?.theme] || 0;
    const rightThemeScore = themeScore[right?.theme] || 0;

    return rightThemeScore - leftThemeScore;
  });
}

function pickBestLogoFormat(brandData) {
  const logos = Array.isArray(brandData?.logos) ? brandData.logos : [];

  for (const logo of sortLogos(logos)) {
    const formats = Array.isArray(logo.formats) ? logo.formats : [];
    const bestFormat = sortFormats(formats).find(
      (format) => typeof format?.src === "string" && format.src.trim() !== ""
    );

    if (bestFormat) {
      return {
        type: logo.type || null,
        theme: logo.theme || null,
        format: bestFormat.format || null,
        url: bestFormat.src.trim(),
      };
    }
  }

  return null;
}

function normalizeBrandfetchPayload(brandData, sourceUrl) {
  if (!brandData || typeof brandData !== "object") {
    return null;
  }

  const bestLogo = pickBestLogoFormat(brandData);

  return {
    provider: "brandfetch",
    sourceUrl,
    domain: brandData.domain || null,
    brandId: brandData.id || null,
    companyName: brandData.name || null,
    description: brandData.description || null,
    links: Array.isArray(brandData.links) ? brandData.links : [],
    qualityScore: brandData.qualityScore ?? null,
    bestLogo,
    raw: brandData,
  };
}

async function fetchBrandfetchBrand(url) {
  const headers = getBrandfetchHeaders();

  if (!headers) {
    return null;
  }

  try {
    const domain = getDomainFromUrl(url);
    const response = await axios.get(
      `${getBrandfetchBaseUrl()}/v2/brands/domain/${encodeURIComponent(domain)}`,
      {
        headers,
        timeout: DEFAULT_TIMEOUT_MS,
        validateStatus(status) {
          return (status >= 200 && status < 300) || status === 404;
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    return normalizeBrandfetchPayload(response.data, url);
  } catch (error) {
    console.warn(`[brandfetch] Failed to fetch brand for ${url}: ${error.message}`);
    return null;
  }
}

module.exports = {
  fetchBrandfetchBrand,
  pickBestLogoFormat,
};
