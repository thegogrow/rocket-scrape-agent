const fs = require("fs-extra");
const path = require("path");
const { normalizeProfile, normalizeProfiles } = require("./normalizeProfile");

const DEFAULT_ADMIN_EMAILS = ["phil@thegogrow.ch", "nunezkathleenm@gmail.com"];
const LIFECYCLE_STATUSES = new Set([
  "scraped",
  "in_review",
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
  "removal_requested",
  "removed",
]);
const PUBLIC_PROVIDER_STATUSES = [
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
];
const CONFIDENCE_GUARDRAIL_SCORE = 75;
const TAG_CATEGORIES = new Set(["services", "industries", "technologies", "vendor_partnerships"]);
const TAG_STATUSES = new Set(["candidate", "approved", "merged"]);

function normalizeLifecycleStatus(status, fallback = "scraped") {
  const value = String(status || "").trim().toLowerCase();

  if (value === "published") return "approved";
  if (value === "draft" || value === "needs_review") return "scraped";
  if (value === "archived") return "removed";

  return LIFECYCLE_STATUSES.has(value) ? value : fallback;
}

function normalizeDomain(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch (error) {
    return text.replace(/^www\./, "").toLowerCase();
  }
}

function normalizeTagName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeTagKey(value) {
  return normalizeTagName(value).toLowerCase();
}

function normalizeTagCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (!TAG_CATEGORIES.has(category)) {
    throw new Error("Unsupported tag category.");
  }

  return category;
}

function normalizeTagStatus(value, fallback = "candidate") {
  const status = String(value || "").trim().toLowerCase();

  return TAG_STATUSES.has(status) ? status : fallback;
}

function tagValuesForCategory(profile = {}, category) {
  if (category === "vendor_partnerships") {
    return Array.isArray(profile.vendorPartnerships) ? profile.vendorPartnerships : [];
  }

  return Array.isArray(profile?.[category]) ? profile[category] : [];
}

function confidenceScoreForProfile(profile = {}) {
  const score = Number.parseInt(profile.confidenceScore ?? profile.confidence_score, 10);

  return Number.isFinite(score) ? score : 0;
}

function automaticStatusForConfidence(status, profile = {}) {
  const normalizedStatus = normalizeLifecycleStatus(status);

  if (
    PUBLIC_PROVIDER_STATUSES.includes(normalizedStatus) &&
    confidenceScoreForProfile(profile) < CONFIDENCE_GUARDRAIL_SCORE
  ) {
    return "in_review";
  }

  return normalizedStatus;
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    adminEmails: (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };
}

function isSupabaseConfigured() {
  const config = supabaseConfig();

  return Boolean(config.url && config.anonKey && config.serviceRoleKey);
}

function normalizeSupabaseUrl(url) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error("SUPABASE_URL must be a valid Supabase project URL.");
  }

  if (!/\.supabase\.(co|in)$/.test(parsed.hostname)) {
    throw new Error("SUPABASE_URL must be your Supabase project URL, like https://your-project.supabase.co.");
  }

  return parsed.origin;
}

async function supabaseFetch(path, options = {}) {
  const config = supabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function rowToProfile(row) {
  return normalizeProfile({
    id: row.id,
    domain: row.domain,
    country: row.country,
    city: row.city,
    companyName: row.company_name,
    website: row.website,
    description: row.description,
    services: row.services || [],
    focusAreas: row.focus_areas || [],
    industries: row.industries || [],
    technologies: row.technologies || [],
    vendorPartnerships: row.vendor_partnerships || [],
    successStories: row.success_stories || [],
    solutions: row.solutions || [],
    location: row.location,
    confidenceScore: row.confidence_score || 0,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    logoUrl: row.logo_url,
    claimed: row.claimed,
    subscriptionTier: row.subscription_tier,
    recentActivity: row.recent_activity || [],
    reviewNotes: row.review_notes || [],
    scraperQualityLog: row.scraper_quality_log || {},
    activityLog: row.activity_log || [],
    files: row.files || {},
    sourceData: row.source_data || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function profileToRow(profile, status = "scraped") {
  const normalizedProfile = normalizeProfile(profile);
  const requestedStatus = normalizedProfile.claimed ? "claimed" : normalizeLifecycleStatus(status);
  const normalizedStatus = automaticStatusForConfidence(requestedStatus, normalizedProfile);

  return {
    domain: normalizedProfile.domain,
    country: normalizedProfile.companyLocation.country,
    city: normalizedProfile.companyLocation.city,
    company_name: normalizedProfile.companyName,
    website: normalizedProfile.website,
    description: normalizedProfile.description,
    services: normalizedProfile.services,
    focus_areas: normalizedProfile.focusAreas,
    industries: normalizedProfile.industries,
    technologies: normalizedProfile.technologies,
    vendor_partnerships: normalizedProfile.vendorPartnerships,
    success_stories: normalizedProfile.successStories,
    solutions: normalizedProfile.solutions,
    location: normalizedProfile.location,
    confidence_score: normalizedProfile.confidenceScore,
    github_url: normalizedProfile.githubUrl,
    linkedin_url: normalizedProfile.linkedinUrl,
    logo_url: normalizedProfile.logoUrl,
    claimed: normalizedProfile.claimed,
    subscription_tier: normalizedProfile.subscriptionTier,
    recent_activity: normalizedProfile.recentActivity,
    review_notes: normalizedProfile.reviewNotes,
    scraper_quality_log: normalizedProfile.scraperQualityLog,
    activity_log: normalizedProfile.activityLog || [],
    files: normalizedProfile.files,
    source_data: normalizedProfile.sourceData,
    status: normalizedStatus,
  };
}

function jobPatchToRow(patch = {}) {
  return {
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.error !== undefined ? { error: patch.error } : {}),
    ...(patch.resultProviderId !== undefined ? { result_provider_id: patch.resultProviderId } : {}),
  };
}

async function loadBundledProfiles() {
  const profilesPath = path.resolve(process.cwd(), "public", "profiles.json");

  if (!(await fs.pathExists(profilesPath))) {
    return [];
  }

  const profiles = await fs.readJson(profilesPath);

  return normalizeProfiles(profiles);
}

async function seedPublishedProvidersIfMissing(providers) {
  const hasPublishedProviders = providers.some((provider) => PUBLIC_PROVIDER_STATUSES.includes(normalizeLifecycleStatus(provider.status)));

  if (hasPublishedProviders) {
    return providers;
  }

  const bundledProfiles = await loadBundledProfiles();

  if (bundledProfiles.length === 0) {
    return providers;
  }

  const existingDomains = new Set(
    providers
      .map((provider) => provider.domain)
      .filter(Boolean)
  );
  const rows = bundledProfiles
    .filter((profile) => !existingDomains.has(profile?.domain))
    .filter((profile) => profile?.domain && (profile.companyName || profile.domain))
    .map((profile) => profileToRow(profile, "approved"));

  if (rows.length === 0) {
    return providers;
  }

  await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  return supabaseFetch("/rest/v1/providers?select=*&order=status.asc,company_name.asc&limit=1000");
}

function tagRowsFromProviders(providers = [], status = "approved") {
  const byKey = new Map();

  providers.forEach((provider) => {
    ["services", "industries", "technologies", "vendor_partnerships"].forEach((category) => {
      tagValuesForCategory(provider, category).forEach((value) => {
        const name = normalizeTagName(value);
        const normalizedName = normalizeTagKey(name);

        if (!name || byKey.has(`${category}:${normalizedName}`)) {
          return;
        }

        byKey.set(`${category}:${normalizedName}`, {
          category,
          name,
          normalized_name: normalizedName,
          status,
        });
      });
    });
  });

  return [...byKey.values()];
}

function tagRowToClient(row = {}) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    status: row.status,
    mergeTarget: row.merge_target || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingTagTaxonomyTable(error) {
  const message = String(error?.message || "");

  return message.includes("tag_taxonomy") || message.includes("PGRST205") || message.includes("42P01");
}

async function syncExistingTagsFromProviders(providers = []) {
  const rows = tagRowsFromProviders(providers, "approved");

  if (rows.length === 0) {
    return;
  }

  try {
    await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(rows),
    });
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }
  }
}

async function syncCandidateTagsFromProfile(profile = {}) {
  const rows = tagRowsFromProviders([profile], "candidate");

  if (rows.length === 0) {
    return;
  }

  try {
    await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(rows),
    });
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }
  }
}

async function listTagTaxonomy(providerRows = []) {
  try {
    const rows = await supabaseFetch("/rest/v1/tag_taxonomy?select=*&order=category.asc,status.asc,name.asc");

    return rows.map(tagRowToClient);
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }

    return tagRowsFromProviders(providerRows, "approved").map((row) => tagRowToClient({
      ...row,
      id: `${row.category}:${row.normalized_name}`,
      merge_target: null,
    }));
  }
}

async function listApprovedTagTaxonomy() {
  const tags = await listTagTaxonomy();

  return tags.filter((tag) => tag.status === "approved");
}

async function findProviderByDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return null;
  }

  const rows = await supabaseFetch(
    `/rest/v1/providers?select=*&domain=eq.${encodeURIComponent(normalizedDomain)}&limit=1`
  );

  return rows[0] ? rowToProfile(rows[0]) : null;
}

async function findActiveScrapeJobByDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return null;
  }

  const rows = await supabaseFetch(
    `/rest/v1/scrape_jobs?select=*&domain=eq.${encodeURIComponent(normalizedDomain)}&status=in.(queued,running)&order=created_at.desc&limit=1`
  );

  return rows[0] || null;
}

function replaceTagInList(values = [], fromName, toName) {
  const fromKey = normalizeTagKey(fromName);
  const target = normalizeTagName(toName);
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => (normalizeTagKey(value) === fromKey ? target : value))
    .map(normalizeTagName)
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeTagKey(value);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function replaceProviderTag(category, fromName, toName) {
  const field = normalizeTagCategory(category);
  const rows = await supabaseFetch(`/rest/v1/providers?select=id,${field}`);
  const updates = rows
    .map((row) => ({
      id: row.id,
      values: replaceTagInList(row[field], fromName, toName),
      changed: JSON.stringify(row[field] || []) !== JSON.stringify(replaceTagInList(row[field], fromName, toName)),
    }))
    .filter((row) => row.changed);

  for (const update of updates) {
    await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(update.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: update.values }),
    });
  }
}

async function updateTagTaxonomy({ id, category, name, status, mergeTarget }) {
  const normalizedStatus = normalizeTagStatus(status, "approved");
  const patch = {};

  if (name !== undefined) {
    const normalizedName = normalizeTagName(name);

    if (!normalizedName) {
      throw new Error("Tag name is required.");
    }

    patch.name = normalizedName;
    patch.normalized_name = normalizeTagKey(normalizedName);
  }

  if (status !== undefined) {
    patch.status = normalizedStatus;
  }

  if (mergeTarget !== undefined) {
    const targetName = normalizeTagName(mergeTarget);

    if (!targetName) {
      throw new Error("Choose a merge target.");
    }

    patch.status = "merged";
    patch.merge_target = targetName;
  }

  if (!id) {
    const tagCategory = normalizeTagCategory(category);
    const tagName = normalizeTagName(name);

    if (!tagName) {
      throw new Error("Tag name is required.");
    }

    const rows = await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        category: tagCategory,
        name: tagName,
        normalized_name: normalizeTagKey(tagName),
        status: normalizedStatus,
      }),
    });

    return tagRowToClient(rows[0]);
  }

  const currentRows = await supabaseFetch(
    `/rest/v1/tag_taxonomy?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  const current = currentRows[0];

  if (!current) {
    throw new Error("Tag not found.");
  }

  const nextName = patch.name || current.name;

  if (patch.name && normalizeTagKey(patch.name) !== normalizeTagKey(current.name)) {
    await replaceProviderTag(current.category, current.name, patch.name);
  }

  if (mergeTarget !== undefined) {
    await replaceProviderTag(current.category, current.name, mergeTarget);
    patch.name = current.name;
    patch.normalized_name = normalizeTagKey(current.name);
  }

  const rows = await supabaseFetch(`/rest/v1/tag_taxonomy?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      ...patch,
      ...(mergeTarget === undefined ? { merge_target: null } : {}),
    }),
  });

  if (patch.status === "approved" || normalizedStatus === "approved") {
    await replaceProviderTag(current.category, current.name, nextName);
  }

  return tagRowToClient(rows[0]);
}

async function signInWithPassword(email, password) {
  const config = supabaseConfig();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!config.url || !config.anonKey) {
    throw new Error("Supabase Auth is not configured");
  }

  if (!config.adminEmails.includes(normalizedEmail)) {
    throw new Error("This email is not allowed to access admin.");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const payload = JSON.parse(text);
      message = payload.msg || payload.message || payload.error_description || payload.error || text;
    } catch (error) {
      message = text;
    }

    throw new Error(message || "Invalid admin email or password");
  }

  const payload = await response.json();
  const userEmail = String(payload.user?.email || "").toLowerCase();

  if (!config.adminEmails.includes(userEmail)) {
    throw new Error("This user is not allowed to access admin.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    email: userEmail,
  };
}

async function verifyAdminToken(authHeader) {
  const config = supabaseConfig();
  const token = String(authHeader || "").replace(/^Bearer\s+/i, "");

  if (!config.url || !config.anonKey || !token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const user = await response.json();
  const email = String(user.email || "").toLowerCase();

  if (!config.adminEmails.includes(email)) {
    throw new Error("Unauthorized");
  }

  return { email, id: user.id };
}

async function listPublishedProviders() {
  const statusList = PUBLIC_PROVIDER_STATUSES.join(",");
  const rows = await supabaseFetch(
    `/rest/v1/providers?select=*&status=in.(${statusList})&order=company_name.asc`
  );

  return rows.map(rowToProfile);
}

async function listAdminState() {
  const [jobs, providerRows] = await Promise.all([
    supabaseFetch("/rest/v1/scrape_jobs?select=*&order=created_at.desc&limit=100"),
    supabaseFetch("/rest/v1/providers?select=*&order=status.asc,company_name.asc&limit=1000"),
  ]);
  const providers = await seedPublishedProvidersIfMissing(providerRows);
  await syncExistingTagsFromProviders(providers);
  const tags = await listTagTaxonomy(providers);

  return {
    jobs,
    providers: providers.map(rowToProfile),
    tags,
  };
}

async function createScrapeJob({ url, companyName, requestedBy, allowExisting = false }) {
  const domain = normalizeDomain(url);
  const existingProvider = await findProviderByDomain(domain);

  if (existingProvider && !allowExisting) {
    throw new Error(`${existingProvider.companyName || existingProvider.domain || domain} already exists.`);
  }

  const existingJob = await findActiveScrapeJobByDomain(domain);

  if (existingJob) {
    throw new Error(`${existingJob.company_name || existingJob.domain || domain} already exists as a queued scrape.`);
  }

  const rows = await supabaseFetch("/rest/v1/scrape_jobs", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      url,
      domain,
      company_name: companyName || null,
      status: "queued",
      requested_by: requestedBy,
    }),
  });

  return rows[0];
}

async function getScrapeJob(id) {
  const rows = await supabaseFetch(
    `/rest/v1/scrape_jobs?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  return rows[0] || null;
}

async function getNextQueuedScrapeJob() {
  const rows = await supabaseFetch(
    "/rest/v1/scrape_jobs?select=*&status=eq.queued&order=created_at.asc&limit=1"
  );

  return rows[0] || null;
}

async function updateScrapeJob(id, patch) {
  const rows = await supabaseFetch(`/rest/v1/scrape_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(jobPatchToRow(patch)),
  });

  return rows[0] || null;
}

async function upsertProvider(profile, status = "scraped") {
  const rows = await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(profileToRow(profile, status)),
  });

  const provider = rowToProfile(rows[0]);
  await syncCandidateTagsFromProfile(provider);

  return provider;
}

async function uploadProviderLogo({ domain, filename, contentType, body }) {
  const config = supabaseConfig();
  const objectPath = `${domain}/${filename}`;
  const response = await fetch(
    `${normalizeSupabaseUrl(config.url)}/storage/v1/object/provider-logos/${objectPath}`,
    {
      method: "PUT",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": contentType,
        "Cache-Control": "3600",
        "x-upsert": "true",
      },
      body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase logo upload failed: ${response.status}`);
  }

  return `${normalizeSupabaseUrl(config.url)}/storage/v1/object/public/provider-logos/${objectPath}`;
}

async function publishProvider(id, status = "approved") {
  const normalizedStatus = normalizeLifecycleStatus(status, "approved");
  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status: normalizedStatus }),
  });

  return rowToProfile(rows[0]);
}

async function updateProvider(id, profilePatch = {}, status) {
  const normalizedStatus = status ? normalizeLifecycleStatus(status) : null;
  const rowPatch = {
    ...(profilePatch.companyName !== undefined ? { company_name: profilePatch.companyName } : {}),
    ...(profilePatch.logoUrl !== undefined ? { logo_url: profilePatch.logoUrl } : {}),
    ...(profilePatch.website !== undefined ? { website: profilePatch.website } : {}),
    ...(profilePatch.country !== undefined ? { country: profilePatch.country } : {}),
    ...(profilePatch.city !== undefined ? { city: profilePatch.city } : {}),
    ...(profilePatch.companyLocation !== undefined
      ? {
          country: profilePatch.companyLocation?.country || null,
          city: profilePatch.companyLocation?.city || null,
        }
      : {}),
    ...(profilePatch.claimed !== undefined ? { claimed: Boolean(profilePatch.claimed) } : {}),
    ...(profilePatch.subscriptionTier !== undefined ? { subscription_tier: profilePatch.subscriptionTier || "free" } : {}),
    ...(profilePatch.services !== undefined ? { services: profilePatch.services || [] } : {}),
    ...(profilePatch.industries !== undefined ? { industries: profilePatch.industries || [] } : {}),
    ...(profilePatch.technologies !== undefined ? { technologies: profilePatch.technologies || [] } : {}),
    ...(profilePatch.vendorPartnerships !== undefined ? { vendor_partnerships: profilePatch.vendorPartnerships || [] } : {}),
    ...(profilePatch.successStories !== undefined ? { success_stories: profilePatch.successStories || [] } : {}),
    ...(profilePatch.solutions !== undefined ? { solutions: profilePatch.solutions || [] } : {}),
    ...(profilePatch.recentActivity !== undefined ? { recent_activity: profilePatch.recentActivity || [] } : {}),
    ...(profilePatch.reviewNotes !== undefined ? { review_notes: profilePatch.reviewNotes || [] } : {}),
    ...(profilePatch.scraperQualityLog !== undefined ? { scraper_quality_log: profilePatch.scraperQualityLog || {} } : {}),
    ...(profilePatch.activityLog !== undefined ? { activity_log: profilePatch.activityLog || [] } : {}),
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
  };

  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(rowPatch),
  });

  const provider = rowToProfile(rows[0]);
  await syncExistingTagsFromProviders([rows[0]]);

  return provider;
}

async function deleteProvider(id) {
  await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return { id, deleted: true };
}

async function deleteScrapeJob(id) {
  await supabaseFetch(`/rest/v1/scrape_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return { id, deleted: true };
}

module.exports = {
  createScrapeJob,
  deleteProvider,
  deleteScrapeJob,
  getNextQueuedScrapeJob,
  getScrapeJob,
  isSupabaseConfigured,
  listAdminState,
  listApprovedTagTaxonomy,
  listTagTaxonomy,
  listPublishedProviders,
  normalizeLifecycleStatus,
  profileToRow,
  publishProvider,
  signInWithPassword,
  supabaseFetch,
  supabaseConfig,
  updateTagTaxonomy,
  updateScrapeJob,
  updateProvider,
  uploadProviderLogo,
  upsertProvider,
  verifyAdminToken,
};
