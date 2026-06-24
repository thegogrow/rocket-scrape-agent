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

module.exports = {
  enrichCompany,
};
