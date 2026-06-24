const { crawlWebsite } = require("../crawlers/firecrawl");
const { enrichCompany } = require("../enrichment/apollo");
const { extractGitHubData } = require("../github/github");
const { generateFallbackCompanyProfile } = require("../llm/fallbackProfile");
const { generateCompanyProfile } = require("../llm/openrouter");
const { fetchBrandfetchBrand } = require("../utils/brandfetch");
const { saveJson, saveImage } = require("../utils/fileSaver");
const { fetchWebsiteLogoCandidates, scoreCandidate } = require("../utils/logoExtractor");
const { getDomainFromUrl, normalizeInputUrls, guessCompanyNameFromUrl } = require("../utils/url");

function getLogoCandidates(result) {
  if (!result || !result.metadata) {
    return [];
  }

  return [
    result.metadata.logoUrl ||
      null,
    ...(Array.isArray(result.metadata.images) ? result.metadata.images : []),
    ...(Array.isArray(result.metadata.pages)
      ? result.metadata.pages.flatMap((page) => [page.logoUrl, ...(page.images || [])])
      : []),
  ].filter(Boolean);
}

async function saveBestLogo(domain, websiteUrl, crawlResult, brandfetchData, profile) {
  const buildCandidate = (url, source) => {
    if (!url) {
      return null;
    }

    return {
      url,
      source,
      score: scoreCandidate({
        url,
        source,
      }),
    };
  };

  const directCandidates = [
    buildCandidate(brandfetchData?.bestLogo?.url, "brandfetch"),
    buildCandidate(profile?.logoUrl, "profile-logo"),
    ...getLogoCandidates(crawlResult).map((candidate) =>
      buildCandidate(
        candidate,
        /(logo|brand)/i.test(String(candidate)) ? "crawl-logo" : "crawl-image"
      )
    ),
  ]
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  const triedCandidates = new Set();
  const errors = [];

  const tryCandidates = async (candidates) => {
    for (const candidate of candidates) {
      if (!candidate?.url || triedCandidates.has(candidate.url)) {
        continue;
      }

      triedCandidates.add(candidate.url);

      try {
        await saveImage(domain, candidate.url, "logo.png");
        await saveJson(domain, "logo-source.json", {
          selectedUrl: candidate.url,
          selectedSource: candidate.source,
          selectedScore: candidate.score,
          attemptedCount: triedCandidates.size,
          savedAt: new Date().toISOString(),
        });
        return candidate;
      } catch (error) {
        errors.push(`${candidate.url}: ${error.message}`);
      }
    }

    return null;
  };

  if (await tryCandidates(directCandidates)) {
    return;
  }

  try {
    const extractedCandidates = (await fetchWebsiteLogoCandidates(websiteUrl))
      .map((candidate) => buildCandidate(candidate, "website-logo"))
      .filter(Boolean)
      .sort((left, right) => right.score - left.score);

    if (await tryCandidates(extractedCandidates)) {
      return;
    }
  } catch (error) {
    errors.push(`website-extractor: ${error.message}`);
  }

  if (errors.length > 0) {
    throw new Error(errors[errors.length - 1]);
  }
}

async function runScrapingPipeline(input) {
  const urls = normalizeInputUrls(input);
  const skipLlm = String(process.env.SKIP_LLM || "").toLowerCase() === "true";

  if (urls.length === 0) {
    throw new Error("runScrapingPipeline requires a valid URL or a list of valid URLs");
  }

  const results = [];

  for (const [index, url] of urls.entries()) {
    let domain = "unknown-company";

    try {
      domain = getDomainFromUrl(url);

      console.log(`Processing company ${index + 1} of ${urls.length}`);
      console.log(`Scraping: ${url}`);

      const crawlResult = await crawlWebsite(url);
      const rawPayload = {
        url,
        domain,
        scrapedAt: new Date().toISOString(),
        data: crawlResult,
      };

      await saveJson(domain, "raw.json", rawPayload);
      console.log("Crawl complete");

      const companyName =
        crawlResult?.metadata?.title ||
        crawlResult?.metadata?.pages?.[0]?.title ||
        guessCompanyNameFromUrl(url);

      const githubData = await extractGitHubData({ companyName, website: url });
      await saveJson(domain, "github.json", githubData);

      const enrichmentData = await enrichCompany({ companyName, website: url });
      await saveJson(domain, "enrichment.json", enrichmentData);

      const brandfetchData = await fetchBrandfetchBrand(url);
      await saveJson(domain, "brandfetch.json", brandfetchData);

      const sourceBundle = {
        url,
        domain,
        scrapedAt: rawPayload.scrapedAt,
        websiteData: crawlResult,
        githubData,
        enrichmentData,
        brandfetchData,
      };

      await saveJson(domain, "source-bundle.json", sourceBundle);

      let profile = null;

      if (crawlResult) {
        try {
          if (skipLlm) {
            profile = generateFallbackCompanyProfile(sourceBundle);
            console.log("Fallback profile generated");
          } else {
            profile = await generateCompanyProfile(sourceBundle);
            console.log("Profile generated");
          }
        } catch (error) {
          console.warn(
            `[pipeline] Failed to generate profile for ${domain}: ${error.message}`
          );
          profile = generateFallbackCompanyProfile(sourceBundle);
          console.warn(`[pipeline] Fallback profile generated for ${domain}`);
        }
      } else if (crawlResult) {
        console.log("Profile skipped");
      } else {
        console.warn(`[pipeline] Skipping profile generation for ${domain}: crawl failed`);
      }

      await saveJson(domain, "profile.json", profile);

      if (crawlResult || brandfetchData?.bestLogo?.url || profile?.logoUrl) {
        try {
          await saveBestLogo(domain, url, crawlResult, brandfetchData, profile);
        } catch (error) {
          console.warn(`[pipeline] Failed to save logo for ${domain}: ${error.message}`);
        }
      }

      console.log("Saved successfully");

      results.push({
        url,
        domain,
        raw: rawPayload,
        profile,
      });
    } catch (error) {
      console.warn(`[pipeline] Failed processing ${url}: ${error.message}`);

      try {
        await saveJson(domain, "raw.json", {
          url,
          domain,
          scrapedAt: new Date().toISOString(),
          data: null,
          error: error.message,
        });
        await saveJson(domain, "github.json", null);
        await saveJson(domain, "enrichment.json", null);
        await saveJson(domain, "brandfetch.json", null);
        await saveJson(domain, "source-bundle.json", null);
        await saveJson(domain, "profile.json", null);
      } catch (saveError) {
        console.warn(
          `[pipeline] Failed to persist fallback output for ${domain}: ${saveError.message}`
        );
      }

      results.push({
        url,
        domain,
        raw: null,
        profile: null,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  runScrapingPipeline,
  getDomainFromUrl,
};
