const axios = require("axios");
const { env } = require("../config/env");

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 3;
const CREATE_CRAWL_TIMEOUT_MS = 15000;
const STATUS_TIMEOUT_MS = 5000;
const PAGE_FETCH_TIMEOUT_MS = 30000;
const PRIMARY_CRAWL_OPTIONS = {
  limit: 5,
  maxDiscoveryDepth: 1,
  sitemap: "skip",
};
const FALLBACK_CRAWL_OPTIONS = {
  limit: 1,
  maxDiscoveryDepth: 0,
  sitemap: "skip",
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error) {
  if (!error.response) {
    return true;
  }

  return RETRYABLE_STATUS_CODES.has(error.response.status);
}

function getRetryDelayMs(error, attempt) {
  const retryAfterSeconds = Number(error.response?.headers?.["retry-after"]);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return 1000 * attempt;
}

async function firecrawlRequest(config, maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios(config);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !isRetryableError(error)) {
        throw error;
      }

      await sleep(getRetryDelayMs(error, attempt));
    }
  }

  throw lastError;
}

function buildHeaders() {
  if (!env.firecrawl.apiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY");
  }

  return {
    Authorization: `Bearer ${env.firecrawl.apiKey}`,
    "Content-Type": "application/json",
  };
}

function getBaseUrl() {
  return (env.firecrawl.baseUrl || "https://api.firecrawl.dev/v2").replace(/\/+$/, "");
}

function normalizeImageList(metadata) {
  const candidates = [
    metadata?.images,
    metadata?.image,
    metadata?.ogImage,
    metadata?.["og:image"],
    metadata?.twitterImage,
    metadata?.["twitter:image"],
  ];

  return [...new Set(
    candidates
      .flatMap((value) => {
        if (!value) {
          return [];
        }

        return Array.isArray(value) ? value : [value];
      })
      .filter((value) => typeof value === "string" && value.trim() !== "")
      .map((value) => value.trim())
  )];
}

function extractLogoUrl(metadata) {
  const candidates = [
    metadata?.logo,
    metadata?.logoUrl,
    metadata?.logoURL,
    metadata?.["og:logo"],
    metadata?.favicon,
    metadata?.icon,
    metadata?.appleTouchIcon,
    ...normalizeImageList(metadata).filter((value) =>
      /(logo|brand|icon|favicon)/i.test(value)
    ),
  ];

  return (
    candidates.find(
      (value) => typeof value === "string" && value.trim() !== ""
    ) || null
  );
}

function cleanMarkdown(markdown) {
  if (typeof markdown !== "string") {
    return "";
  }

  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

function normalizePage(page) {
  const metadata = page?.metadata || {};
  const images = normalizeImageList(metadata);
  const logoUrl = extractLogoUrl(metadata);

  return {
    url: metadata.sourceURL || null,
    title: metadata.title || null,
    description: metadata.description || null,
    images,
    logoUrl,
    markdown: cleanMarkdown(page?.markdown),
    metadata,
  };
}

function combineMarkdown(pages) {
  return pages
    .map((page) => {
      const heading = page.title || page.url || "Untitled Page";
      const sourceLine = page.url ? `Source: ${page.url}` : null;

      return [`# ${heading}`, sourceLine, page.markdown]
        .filter(Boolean)
        .join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n---\n\n")
    .trim();
}

async function startCrawl(url, crawlOptions = PRIMARY_CRAWL_OPTIONS) {
  const response = await firecrawlRequest({
    method: "post",
    url: `${getBaseUrl()}/crawl`,
    headers: buildHeaders(),
    data: {
      url,
      ...crawlOptions,
      crawlEntireDomain: true,
      allowSubdomains: false,
      allowExternalLinks: false,
      ignoreQueryParameters: true,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
      },
    },
    timeout: CREATE_CRAWL_TIMEOUT_MS,
  });

  return response.data;
}

async function fetchCrawlStatus(crawlId) {
  const response = await firecrawlRequest(
    {
      method: "get",
      url: `${getBaseUrl()}/crawl/${crawlId}`,
      headers: buildHeaders(),
      timeout: STATUS_TIMEOUT_MS,
    },
    1
  );

  return response.data;
}

async function fetchNextPage(nextUrl) {
  const response = await firecrawlRequest({
    method: "get",
    url: nextUrl,
    headers: buildHeaders(),
    timeout: PAGE_FETCH_TIMEOUT_MS,
  });

  return response.data;
}

async function scrapeWebsite(url) {
  const response = await firecrawlRequest({
    method: "post",
    url: `${getBaseUrl()}/scrape`,
    headers: buildHeaders(),
    data: {
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    },
    timeout: CREATE_CRAWL_TIMEOUT_MS,
  });

  const page = normalizePage(response.data?.data || response.data);

  return {
    url,
    crawlId: null,
    markdown: page.markdown,
    metadata: {
      title: page.title,
      description: page.description,
      images: page.images,
      logoUrl: page.logoUrl,
      pageCount: page.markdown || page.title || page.url ? 1 : 0,
      pages: [
        {
          url: page.url,
          title: page.title,
          description: page.description,
          images: page.images,
          logoUrl: page.logoUrl,
        },
      ].filter((entry) => entry.url || entry.title || entry.description),
    },
  };
}

async function collectAllCrawlData(initialStatus) {
  const pages = [...(Array.isArray(initialStatus.data) ? initialStatus.data : [])];
  let nextUrl = initialStatus.next;

  while (nextUrl) {
    const nextChunk = await fetchNextPage(nextUrl);

    if (Array.isArray(nextChunk.data)) {
      pages.push(...nextChunk.data);
    }

    nextUrl = nextChunk.next || null;
  }

  return pages;
}

async function executeCrawl(url, crawlOptions) {
  const crawlJob = await startCrawl(url, crawlOptions);
  const crawlId = crawlJob?.id;

  if (!crawlId) {
    throw new Error("Firecrawl crawl did not return a crawl ID");
  }

  let statusResponse = null;

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    try {
      statusResponse = await fetchCrawlStatus(crawlId);
    } catch (error) {
      if (attempt >= MAX_POLL_ATTEMPTS) {
        throw error;
      }

      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    if (statusResponse?.status === "completed") {
      break;
    }

    if (statusResponse?.status === "failed") {
      throw new Error(`Firecrawl crawl failed for ${url}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  if (!statusResponse || statusResponse.status !== "completed") {
    throw new Error(`Firecrawl crawl timed out for ${url}`);
  }

  const rawPages = await collectAllCrawlData(statusResponse);
  const pages = rawPages
    .map(normalizePage)
    .filter((page) => page.markdown || page.title || page.url);

  return {
    url,
    crawlId,
    pages,
  };
}

function buildCrawlResult(normalizedUrl, crawlId, pages) {
  if (pages.length === 0) {
    return {
      url: normalizedUrl,
      crawlId,
      markdown: "",
      metadata: {
        title: null,
        description: null,
        images: [],
        logoUrl: null,
        pageCount: 0,
        pages: [],
      },
    };
  }

  const primaryPage = pages[0];

  return {
    url: normalizedUrl,
    crawlId,
    markdown: combineMarkdown(pages),
    metadata: {
      title: primaryPage.title,
      description: primaryPage.description,
      images: [...new Set(pages.flatMap((page) => page.images))],
      logoUrl: primaryPage.logoUrl || pages.find((page) => page.logoUrl)?.logoUrl || null,
      pageCount: pages.length,
      pages: pages.map((page) => ({
        url: page.url,
        title: page.title,
        description: page.description,
        images: page.images,
        logoUrl: page.logoUrl,
      })),
    },
  };
}

async function crawlWebsite(url) {
  try {
    if (typeof url !== "string" || url.trim() === "") {
      throw new Error("crawlWebsite requires a non-empty URL");
    }

    const normalizedUrl = url.trim();
    let crawlExecution;

    try {
      crawlExecution = await executeCrawl(normalizedUrl, PRIMARY_CRAWL_OPTIONS);
    } catch (error) {
      if (!String(error.message).includes("timed out")) {
        return await scrapeWebsite(normalizedUrl);
      }

      try {
        crawlExecution = await executeCrawl(normalizedUrl, FALLBACK_CRAWL_OPTIONS);
      } catch (fallbackError) {
        return await scrapeWebsite(normalizedUrl);
      }
    }

    return buildCrawlResult(
      normalizedUrl,
      crawlExecution.crawlId,
      crawlExecution.pages
    );
  } catch (error) {
    console.error(
      `[firecrawl] crawlWebsite failed: ${error.response?.data?.error || error.message}`
    );
    return null;
  }
}

module.exports = {
  crawlWebsite,
};
