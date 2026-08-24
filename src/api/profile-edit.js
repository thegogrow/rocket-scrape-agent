const { applyOwnerProfileEdit, isSupabaseConfigured, OwnerEditError, resolveOwnerEditAccess } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

const STRING_FIELDS = ["companyName", "logoUrl", "website", "country", "city", "description", "githubUrl", "linkedinUrl"];
const ARRAY_FIELDS = ["services", "technologies", "industries"];

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const seen = new Set();
  const cleaned = [];

  for (const item of value) {
    const text = String(item ?? "").trim();

    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      cleaned.push(text);
    }
  }

  return cleaned;
}

// Only pulls out fields the owner is allowed to touch, coerced to the right
// type - never forwards the raw request body onward.
function sanitizeProfileInput(rawProfile = {}) {
  const profile = {};

  for (const field of STRING_FIELDS) {
    if (rawProfile[field] !== undefined) {
      profile[field] = String(rawProfile[field] ?? "").trim();
    }
  }

  for (const field of ARRAY_FIELDS) {
    const cleaned = sanitizeStringArray(rawProfile[field]);

    if (cleaned !== undefined) {
      profile[field] = cleaned;
    }
  }

  return profile;
}

function shapeProfile(provider) {
  return {
    domain: provider.domain,
    companyName: provider.companyName,
    logoUrl: provider.logoUrl,
    website: provider.website,
    country: provider.country,
    city: provider.city,
    description: provider.description,
    services: provider.services || [],
    technologies: provider.technologies || [],
    industries: provider.industries || [],
    githubUrl: provider.githubUrl,
    linkedinUrl: provider.linkedinUrl,
    claimed: Boolean(provider.claimed),
  };
}

async function handleGet(request, response) {
  const token = String(request.query?.token || "").trim();

  if (!token) {
    response.status(400).json({ error: "Missing token." });
    return;
  }

  const access = await resolveOwnerEditAccess(token);

  if (!access) {
    response.status(404).json({ error: "This link is invalid or has expired." });
    return;
  }

  const { provider } = access;

  response.setHeader("Cache-Control", "no-store");

  if (provider.status === "removed" || provider.status === "removal_requested") {
    response.status(200).json({
      editable: false,
      reason: "removed",
      domain: provider.domain,
      companyName: provider.companyName,
    });
    return;
  }

  if (access.requiresVerification) {
    response.status(200).json({
      editable: false,
      reason: "verification_required",
      domain: provider.domain,
      companyName: provider.companyName,
    });
    return;
  }

  response.status(200).json({
    editable: true,
    providerId: provider.id,
    editorRole: access.editorRole,
    editorEmail: access.editorEmail,
    profile: shapeProfile(provider),
  });
}

async function handlePatch(request, response) {
  const body = await readJsonBody(request);
  const result = await applyOwnerProfileEdit(String(body.token || "").trim(), {
    profile: sanitizeProfileInput(body.profile),
  });

  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    ok: true,
    editToken: result.editToken,
    editorRole: result.editorRole,
    editorEmail: result.editorEmail,
    profile: shapeProfile(result.provider),
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "PATCH") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Profile editing is not configured." });
    return;
  }

  try {
    if (request.method === "GET") {
      await handleGet(request, response);
    } else {
      await handlePatch(request, response);
    }
  } catch (error) {
    const status = error instanceof OwnerEditError ? error.status : 500;
    response.status(status).json({ error: error.message });
  }
};
