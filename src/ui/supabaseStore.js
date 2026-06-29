const fs = require("fs-extra");
const path = require("path");

const DEFAULT_ADMIN_EMAILS = ["phil@thegogrow.ch", "nunezkathleenm@gmail.com"];

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
  return {
    id: row.id,
    domain: row.domain,
    country: row.country,
    companyName: row.company_name,
    website: row.website,
    description: row.description,
    services: row.services || [],
    focusAreas: row.focus_areas || [],
    technologies: row.technologies || [],
    vendorPartnerships: row.vendor_partnerships || [],
    location: row.location,
    confidenceScore: row.confidence_score || 0,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    logoUrl: row.logo_url,
    recentActivity: row.recent_activity || [],
    reviewNotes: row.review_notes || [],
    files: row.files || {},
    sourceData: row.source_data || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function profileToRow(profile, status = "draft") {
  return {
    domain: profile.domain,
    country: profile.country,
    company_name: profile.companyName,
    website: profile.website,
    description: profile.description,
    services: profile.services || [],
    focus_areas: profile.focusAreas || [],
    technologies: profile.technologies || [],
    vendor_partnerships: profile.vendorPartnerships || [],
    location: profile.location,
    confidence_score: profile.confidenceScore || 0,
    github_url: profile.githubUrl,
    linkedin_url: profile.linkedinUrl,
    logo_url: profile.logoUrl,
    recent_activity: profile.recentActivity || [],
    review_notes: profile.reviewNotes || [],
    files: profile.files || {},
    source_data: profile.sourceData || {},
    status,
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

  return Array.isArray(profiles) ? profiles : [];
}

async function seedPublishedProvidersIfMissing(providers) {
  const hasPublishedProviders = providers.some((provider) => provider.status === "published");

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
    .map((profile) => profileToRow(profile, "published"));

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
  const rows = await supabaseFetch(
    "/rest/v1/providers?select=*&status=eq.published&order=company_name.asc"
  );

  return rows.map(rowToProfile);
}

async function listAdminState() {
  const [jobs, providerRows] = await Promise.all([
    supabaseFetch("/rest/v1/scrape_jobs?select=*&order=created_at.desc&limit=100"),
    supabaseFetch("/rest/v1/providers?select=*&order=status.asc,company_name.asc&limit=1000"),
  ]);
  const providers = await seedPublishedProvidersIfMissing(providerRows);

  return {
    jobs,
    providers: providers.map(rowToProfile),
  };
}

async function createScrapeJob({ url, companyName, requestedBy }) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
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

async function upsertProvider(profile, status = "draft") {
  const rows = await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(profileToRow(profile, status)),
  });

  return rowToProfile(rows[0]);
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

async function publishProvider(id, status = "published") {
  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status }),
  });

  return rowToProfile(rows[0]);
}

async function updateProvider(id, profilePatch = {}, status) {
  const rowPatch = {
    ...(profilePatch.companyName !== undefined ? { company_name: profilePatch.companyName } : {}),
    ...(profilePatch.logoUrl !== undefined ? { logo_url: profilePatch.logoUrl } : {}),
    ...(profilePatch.website !== undefined ? { website: profilePatch.website } : {}),
    ...(profilePatch.country !== undefined ? { country: profilePatch.country } : {}),
    ...(profilePatch.services !== undefined ? { services: profilePatch.services || [] } : {}),
    ...(profilePatch.technologies !== undefined ? { technologies: profilePatch.technologies || [] } : {}),
    ...(profilePatch.vendorPartnerships !== undefined ? { vendor_partnerships: profilePatch.vendorPartnerships || [] } : {}),
    ...(profilePatch.recentActivity !== undefined ? { recent_activity: profilePatch.recentActivity || [] } : {}),
    ...(profilePatch.reviewNotes !== undefined ? { review_notes: profilePatch.reviewNotes || [] } : {}),
    ...(status ? { status } : {}),
  };

  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(rowPatch),
  });

  return rowToProfile(rows[0]);
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
  listPublishedProviders,
  profileToRow,
  publishProvider,
  signInWithPassword,
  supabaseConfig,
  updateScrapeJob,
  updateProvider,
  uploadProviderLogo,
  upsertProvider,
  verifyAdminToken,
};
