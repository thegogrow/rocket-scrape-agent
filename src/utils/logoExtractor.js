const axios = require("axios");
const cheerio = require("cheerio");
const { isValidHttpUrl } = require("./url");

function resolveUrl(value, baseUrl) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    return new URL(value.trim(), baseUrl).toString();
  } catch (error) {
    return null;
  }
}

function normalizeSrcSet(value, baseUrl) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const firstEntry = value
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .find(Boolean);

  return resolveUrl(firstEntry, baseUrl);
}

function parseDimension(value) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function extractCssUrls(value, baseUrl) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return [...value.matchAll(/url\((['"]?)(.*?)\1\)/gi)]
    .map((match) => resolveUrl(match[2], baseUrl))
    .filter(Boolean);
}

function collectJsonLdLogoValues(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectJsonLdLogoValues);
  }

  if (typeof value !== "object") {
    return [];
  }

  const directValues = [
    value.logo,
    value.url && /(logo|brand)/i.test(String(value.url)) ? value.url : null,
    value.contentUrl,
  ];

  const nestedValues = [
    value.image,
    value.publisher,
    value.organization,
    value.author,
    value["@graph"],
  ];

  return [
    ...directValues.flatMap(collectJsonLdLogoValues),
    ...nestedValues.flatMap(collectJsonLdLogoValues),
  ];
}

function scoreCandidate(candidate) {
  const haystack = [
    candidate.url,
    candidate.alt,
    candidate.className,
    candidate.id,
    candidate.parentClassName,
    candidate.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;

  const sourceScores = {
    brandfetch: 120,
    "json-ld-logo": 90,
    "website-logo": 80,
    "meta-logo": 75,
    "css-logo": 70,
    "profile-logo": 65,
    "crawl-logo": 60,
    "common-path": 55,
    "og-image": 20,
    "crawl-image": 0,
    icon: 5,
    image: 0,
  };

  score += sourceScores[candidate.source] || 0;

  if (haystack.includes("logo")) {
    score += 80;
  }

  if (haystack.includes("brand")) {
    score += 25;
  }

  if (haystack.includes("header") || haystack.includes("navbar") || haystack.includes("nav")) {
    score += 20;
  }

  if (haystack.includes("footer")) {
    score -= 5;
  }

  if (haystack.includes("favicon") || haystack.includes("apple-touch-icon")) {
    score -= haystack.includes("logo") ? 15 : 45;
  } else if (/\bicon\b/.test(haystack)) {
    score -= haystack.includes("logo") ? 5 : 20;
  }

  if (candidate.width >= 80 || candidate.height >= 40) {
    score += 15;
  }

  if (candidate.width >= 120 && candidate.height >= 32) {
    score += 15;
  }

  if (candidate.width > 0 && candidate.height > 0 && candidate.width <= 64 && candidate.height <= 64) {
    score -= 20;
  }

  if (/\.svg(\?|$)|\.png(\?|$)|\.webp(\?|$)|\.jpg(\?|$)|\.jpeg(\?|$)/i.test(candidate.url)) {
    score += 8;
  }

  return score;
}

function commonLogoPaths(finalUrl) {
  const baseUrl = new URL(finalUrl);
  const origin = baseUrl.origin;

  return [
    "/logo.svg",
    "/logo.png",
    "/logo.webp",
    "/assets/logo.svg",
    "/assets/logo.png",
    "/images/logo.svg",
    "/images/logo.png",
    "/img/logo.svg",
    "/img/logo.png",
    "/static/logo.svg",
    "/static/logo.png",
  ].map((pathname) => `${origin}${pathname}`);
}

async function fetchWebsiteLogoCandidates(url) {
  const response = await axios.get(url, {
    responseType: "text",
    timeout: 20000,
    maxRedirects: 5,
    headers: {
      "User-Agent": "rocket-scrape-agent",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const finalUrl = response.request?.res?.responseUrl || url;
  const $ = cheerio.load(String(response.data || ""));
  const candidates = [];

  const addCandidate = (value, context = {}) => {
    const resolvedUrl =
      context.fromSrcSet ? normalizeSrcSet(value, finalUrl) : resolveUrl(value, finalUrl);

    if (!isValidHttpUrl(resolvedUrl)) {
      return;
    }

    candidates.push({
      url: resolvedUrl,
      alt: context.alt || "",
      className: context.className || "",
      id: context.id || "",
      parentClassName: context.parentClassName || "",
      width: parseDimension(context.width),
      height: parseDimension(context.height),
      source: context.source || "image",
    });
  };

  $('meta[property="og:logo"], meta[name="logo"]').each((ignoredIndex, element) => {
    addCandidate($(element).attr("content"), {
      source: "meta-logo",
    });
  });

  $('meta[property="og:image"], meta[name="twitter:image"]').each(
    (ignoredIndex, element) => {
      addCandidate($(element).attr("content"), {
        source: "og-image",
      });
    }
  );

  $('link[rel*="icon"]').each((ignoredIndex, element) => {
    addCandidate($(element).attr("href"), {
      className: $(element).attr("rel") || "",
      source: "icon",
    });
  });

  $('script[type="application/ld+json"]').each((ignoredIndex, element) => {
    try {
      const parsed = JSON.parse($(element).contents().text());

      for (const logoValue of collectJsonLdLogoValues(parsed)) {
        addCandidate(logoValue, {
          source: "json-ld-logo",
        });
      }
    } catch (error) {
      return;
    }
  });

  $("source").each((ignoredIndex, element) => {
    const node = $(element);
    const parent = node.parent();

    if (parent.is("picture")) {
      const pictureParent = parent.parent();
      addCandidate(node.attr("srcset"), {
        className: pictureParent.attr("class") || parent.attr("class") || "",
        id: pictureParent.attr("id") || parent.attr("id") || "",
        parentClassName: pictureParent.parent().attr("class") || "",
        fromSrcSet: true,
        source: "website-logo",
      });
    }
  });

  $("img").each((ignoredIndex, element) => {
    const node = $(element);
    const parent = node.parent();
    const ancestor = node.closest("a, header, nav, [class*=logo], [id*=logo]");
    const logoContext = [
      node.attr("alt"),
      node.attr("class"),
      node.attr("id"),
      parent.attr("class"),
      ancestor.attr("class"),
      ancestor.attr("id"),
    ]
      .filter(Boolean)
      .join(" ");
    const context = {
      alt: node.attr("alt") || "",
      className: node.attr("class") || "",
      id: node.attr("id") || "",
      parentClassName: [parent.attr("class"), ancestor.attr("class")].filter(Boolean).join(" "),
      width: node.attr("width") || "",
      height: node.attr("height") || "",
      source: /logo|brand|header|nav/i.test(logoContext) ? "website-logo" : "image",
    };

    addCandidate(node.attr("src"), context);
    addCandidate(node.attr("data-src"), context);
    addCandidate(node.attr("data-lazy-src"), context);
    addCandidate(node.attr("srcset"), { ...context, fromSrcSet: true });
    addCandidate(node.attr("data-srcset"), { ...context, fromSrcSet: true });
  });

  $("[style]").each((ignoredIndex, element) => {
    const node = $(element);
    const contextText = [
      node.attr("class"),
      node.attr("id"),
      node.parent().attr("class"),
      node.closest("header, nav, [class*=logo], [id*=logo]").attr("class"),
    ]
      .filter(Boolean)
      .join(" ");

    if (!/logo|brand|header|nav/i.test(contextText)) {
      return;
    }

    for (const cssUrl of extractCssUrls(node.attr("style"), finalUrl)) {
      addCandidate(cssUrl, {
        className: node.attr("class") || "",
        id: node.attr("id") || "",
        parentClassName: node.parent().attr("class") || "",
        source: "css-logo",
      });
    }
  });

  for (const commonPath of commonLogoPaths(finalUrl)) {
    addCandidate(commonPath, {
      source: "common-path",
    });
  }

  const scoredCandidates = candidates.map((candidate) => ({
    ...candidate,
    score: scoreCandidate(candidate),
  }));
  const uniqueCandidates = [
    ...scoredCandidates.reduce((itemsByUrl, candidate) => {
      const existing = itemsByUrl.get(candidate.url);

      if (!existing || candidate.score > existing.score) {
        itemsByUrl.set(candidate.url, candidate);
      }

      return itemsByUrl;
    }, new Map())
    .values(),
  ];

  return uniqueCandidates
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.url);
}

module.exports = {
  fetchWebsiteLogoCandidates,
  scoreCandidate,
};
