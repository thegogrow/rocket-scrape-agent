const axios = require("axios");
const { env } = require("../config/env");
const { getDomainFromUrl } = require("../utils/url");

function hasApolloConfig() {
  if (String(process.env.SKIP_APOLLO || "").toLowerCase() === "true") {
    return false;
  }

  return Boolean(env.apollo.apiKey);
}

function normalizeCompanySize(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const min = value.min || value.minimum || value.from || null;
    const max = value.max || value.maximum || value.to || null;

    if (min && max) {
      return `${min}-${max}`;
    }
  }

  return null;
}

async function enrichCompany({ companyName, website }) {
  if (!hasApolloConfig()) {
    return null;
  }

  const domain = getDomainFromUrl(website);

  try {
    const response = await axios({
      method: "get",
      url: `${env.apollo.baseUrl}/api/v1/organizations/enrich`,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.apollo.apiKey,
      },
      timeout: 20000,
      params: {
        domain,
      },
      validateStatus(status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(
        response.data?.error ||
          response.data?.message ||
          `Apollo request failed with status ${response.status}`
      );
    }

    const organization = response.data?.organization || null;

    if (!organization) {
      return null;
    }

    return {
      provider: "apollo",
      companyName: organization.name || companyName || null,
      website: organization.website_url || organization.primary_domain || website || null,
      linkedinUrl: organization.linkedin_url || null,
      location: {
        city: organization.city || null,
        state: organization.state || null,
        country: organization.country || null,
      },
      companySize:
        normalizeCompanySize(organization.estimated_num_employees) ||
        normalizeCompanySize(organization.employee_count) ||
        normalizeCompanySize(organization.organization_num_employees) ||
        null,
      foundedYear:
        Number.isInteger(Number(organization.founded_year))
          ? Number(organization.founded_year)
          : null,
      raw: {
        id: organization.id || null,
        name: organization.name || null,
        domain: organization.primary_domain || null,
      },
    };
  } catch (error) {
    console.warn(`[apollo] Failed to enrich ${website}: ${error.message}`);
    return null;
  }
}

// Roles we want to reach for outreach: marketing/BD/partnerships own "get listed
// on a directory" asks; at small companies a founder/managing director is the
// only realistic contact. Ordered by preference - first match wins.
const OUTREACH_TITLE_PRIORITY = [
  "head of marketing",
  "marketing director",
  "vp marketing",
  "chief marketing officer",
  "business development",
  "partnerships",
  "head of sales",
  "vp sales",
  "chief sales officer",
  "managing director",
  "founder",
  "co-founder",
  "ceo",
];

function seniorityRank(person) {
  const title = String(person.title || "").toLowerCase();
  const index = OUTREACH_TITLE_PRIORITY.findIndex((needle) => title.includes(needle));

  return index === -1 ? OUTREACH_TITLE_PRIORITY.length : index;
}

async function searchPeopleForDomain({ domain, perPage = 10 }) {
  if (!hasApolloConfig() || !domain) {
    return [];
  }

  try {
    const response = await axios({
      method: "post",
      url: `${env.apollo.baseUrl}/api/v1/mixed_people/api_search`,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.apollo.apiKey,
      },
      timeout: 20000,
      data: {
        q_organization_domains: domain,
        person_titles: OUTREACH_TITLE_PRIORITY,
        page: 1,
        per_page: perPage,
      },
      validateStatus(status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(
        response.data?.error || response.data?.message || `Apollo search failed with status ${response.status}`
      );
    }

    return Array.isArray(response.data?.people) ? response.data.people : [];
  } catch (error) {
    console.warn(`[apollo] People search failed for ${domain}: ${error.message}`);
    return [];
  }
}

async function revealPersonEmail({ apolloPersonId }) {
  if (!hasApolloConfig() || !apolloPersonId) {
    return null;
  }

  try {
    const response = await axios({
      method: "post",
      url: `${env.apollo.baseUrl}/api/v1/people/match`,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.apollo.apiKey,
      },
      timeout: 20000,
      data: {
        id: apolloPersonId,
        reveal_personal_emails: true,
      },
      validateStatus(status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status >= 400) {
      throw new Error(
        response.data?.error || response.data?.message || `Apollo match failed with status ${response.status}`
      );
    }

    const person = response.data?.person || null;

    if (!person) {
      return null;
    }

    return {
      name: person.name || [person.first_name, person.last_name].filter(Boolean).join(" ") || null,
      title: person.title || null,
      email: person.email && person.email !== "email_not_unlocked@domain.com" ? person.email : null,
      emailStatus: person.email_status || null,
      linkedinUrl: person.linkedin_url || null,
      seniority: person.seniority || null,
    };
  } catch (error) {
    console.warn(`[apollo] Email reveal failed for person ${apolloPersonId}: ${error.message}`);
    return null;
  }
}

// Finds the best-fit outreach contact for a company: searches Apollo for people
// in ICP roles (marketing/BD/partnerships, falling back to founder/MD/CEO for
// small teams), then spends one credit to reveal the top match's email.
async function sourceOutreachContact({ website, revealEmail = true }) {
  const domain = getDomainFromUrl(website);

  if (!domain) {
    return null;
  }

  const candidates = await searchPeopleForDomain({ domain });

  if (candidates.length === 0) {
    return null;
  }

  const best = [...candidates].sort((a, b) => seniorityRank(a) - seniorityRank(b))[0];

  // Search results have obfuscated names/no email - reveal is required to get
  // usable contact details, and costs one Apollo credit per person.
  if (!revealEmail || !best.id) {
    return {
      name: [best.first_name, best.last_name_obfuscated].filter(Boolean).join(" ") || null,
      title: best.title || null,
      email: null,
      emailStatus: null,
      linkedinUrl: null,
      seniority: null,
      source: "apollo",
    };
  }

  const revealed = await revealPersonEmail({ apolloPersonId: best.id });

  if (!revealed) {
    return null;
  }

  return { ...revealed, source: "apollo" };
}

module.exports = {
  enrichCompany,
  searchPeopleForDomain,
  revealPersonEmail,
  sourceOutreachContact,
};
