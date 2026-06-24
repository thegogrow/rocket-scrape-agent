const axios = require("axios");
const { env } = require("../config/env");
const {
  getDomainFromUrl,
  getRootDomainLabel,
  guessCompanyNameFromUrl,
} = require("../utils/url");

const GITHUB_API_BASE_URL = "https://api.github.com";
const SEARCH_RESULT_LIMIT = 5;
const REPO_LIMIT = 8;
const CONTRIBUTORS_PER_REPO_LIMIT = 30;

function buildGitHubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "rocket-scrape-agent",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (env.github.token) {
    headers.Authorization = `Bearer ${env.github.token}`;
  }

  return headers;
}

async function githubRequest(config) {
  const response = await axios({
    baseURL: GITHUB_API_BASE_URL,
    headers: buildGitHubHeaders(),
    timeout: 20000,
    ...config,
  });

  return response.data;
}

function scoreOrganizationCandidate(candidate, companyName, website) {
  const domain = getDomainFromUrl(website);
  const rootLabel = getRootDomainLabel(website);
  const normalizedName = (companyName || guessCompanyNameFromUrl(website)).toLowerCase();
  const login = String(candidate.login || "").toLowerCase();
  const profileName = String(candidate.name || "").toLowerCase();
  const blog = String(candidate.blog || "").toLowerCase();
  const htmlUrl = String(candidate.html_url || "").toLowerCase();

  let score = 0;

  if (candidate.type === "Organization") {
    score += 30;
  }

  if (login === rootLabel) {
    score += 40;
  } else if (login.includes(rootLabel)) {
    score += 20;
  }

  if (profileName === normalizedName) {
    score += 35;
  } else if (profileName.includes(normalizedName) || normalizedName.includes(profileName)) {
    score += 20;
  }

  if (blog.includes(domain) || htmlUrl.includes(rootLabel)) {
    score += 15;
  }

  return score;
}

async function searchUsers(query) {
  const data = await githubRequest({
    method: "get",
    url: "/search/users",
    params: {
      q: query,
      per_page: SEARCH_RESULT_LIMIT,
    },
  });

  return Array.isArray(data.items) ? data.items : [];
}

async function fetchOrganizationDetails(login) {
  return githubRequest({
    method: "get",
    url: `/users/${encodeURIComponent(login)}`,
  });
}

async function findGitHubOrganization({ companyName, website }) {
  const rootLabel = getRootDomainLabel(website);
  const guessedName = companyName || guessCompanyNameFromUrl(website);
  const queries = [
    `${rootLabel} in:login type:org`,
    `"${guessedName}" in:fullname type:org`,
    `"${guessedName}" in:login type:org`,
  ];

  const candidates = [];

  for (const query of queries) {
    try {
      const items = await searchUsers(query);
      candidates.push(...items);
    } catch (error) {
      console.warn(`[github] Search failed for query "${query}": ${error.message}`);
    }
  }

  const uniqueByLogin = [...new Map(candidates.map((item) => [item.login, item])).values()];

  if (uniqueByLogin.length === 0) {
    return null;
  }

  const detailedCandidates = [];

  for (const candidate of uniqueByLogin) {
    try {
      const details = await fetchOrganizationDetails(candidate.login);
      detailedCandidates.push(details);
    } catch (error) {
      console.warn(
        `[github] Failed to fetch organization details for ${candidate.login}: ${error.message}`
      );
      detailedCandidates.push(candidate);
    }
  }

  if (detailedCandidates.length === 0) {
    return null;
  }

  return detailedCandidates
    .map((candidate) => ({
      candidate,
      score: scoreOrganizationCandidate(candidate, guessedName, website),
    }))
    .sort((left, right) => right.score - left.score)[0]?.candidate || null;
}

async function fetchOrganizationRepos(login) {
  const data = await githubRequest({
    method: "get",
    url: `/orgs/${encodeURIComponent(login)}/repos`,
    params: {
      sort: "updated",
      direction: "desc",
      per_page: REPO_LIMIT,
      type: "public",
    },
  });

  return Array.isArray(data) ? data : [];
}

async function fetchRepoLanguages(owner, repo) {
  try {
    return await githubRequest({
      method: "get",
      url: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    });
  } catch (error) {
    console.warn(`[github] Failed to fetch languages for ${owner}/${repo}: ${error.message}`);
    return {};
  }
}

async function fetchRepoContributors(owner, repo) {
  try {
    const data = await githubRequest({
      method: "get",
      url: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`,
      params: {
        per_page: CONTRIBUTORS_PER_REPO_LIMIT,
        anon: "true",
      },
    });

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      `[github] Failed to fetch contributors for ${owner}/${repo}: ${error.message}`
    );
    return [];
  }
}

function aggregateLanguages(repos) {
  const totals = new Map();

  for (const repo of repos) {
    for (const [language, bytes] of Object.entries(repo.languages || {})) {
      totals.set(language, (totals.get(language) || 0) + Number(bytes || 0));
    }
  }

  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([language, bytes]) => ({ language, bytes }));
}

function buildRepoActivity(repos) {
  return repos.map((repo) => ({
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    languages: Object.keys(repo.languages || {}),
  }));
}

async function extractGitHubData({ companyName, website }) {
  try {
    const organization = await findGitHubOrganization({ companyName, website });

    if (!organization) {
      return null;
    }

    const repos = await fetchOrganizationRepos(organization.login);
    const enrichedRepos = [];
    const contributors = new Set();

    for (const repo of repos) {
      const languages = await fetchRepoLanguages(organization.login, repo.name);
      const repoContributors = await fetchRepoContributors(organization.login, repo.name);

      for (const contributor of repoContributors) {
        const contributorKey =
          contributor.login ||
          contributor.id ||
          `${contributor.name || "anon"}:${contributor.type || "unknown"}`;

        contributors.add(contributorKey);
      }

      enrichedRepos.push({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        homepage: repo.homepage,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        defaultBranch: repo.default_branch,
        pushedAt: repo.pushed_at,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        archived: repo.archived,
        fork: repo.fork,
        languages,
        contributorCount: repoContributors.length,
      });
    }

    return {
      organization: {
        login: organization.login,
        name: organization.name,
        url: organization.html_url,
        blog: organization.blog,
        location: organization.location,
        email: organization.email,
        description: organization.description,
        publicRepos: organization.public_repos,
        followers: organization.followers,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
      },
      repos: enrichedRepos,
      topLanguages: aggregateLanguages(enrichedRepos),
      contributorCount: contributors.size,
      activity: buildRepoActivity(enrichedRepos),
    };
  } catch (error) {
    console.warn(`[github] Failed to extract GitHub data for ${website}: ${error.message}`);
    return null;
  }
}

module.exports = {
  extractGitHubData,
};
