const { isSupabaseConfigured, resolveOutreachLink, uploadProviderLogo } = require("../ui/supabaseStore");
const { readRawBody } = require("../ui/readJsonBody");

const MAX_LOGO_BYTES = 4 * 1024 * 1024;
const EXTENSION_FOR_CONTENT_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

module.exports = async function handler(request, response) {
  if (request.method !== "PUT") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Logo upload is not configured." });
    return;
  }

  try {
    const token = String(request.query?.token || "").trim();
    const link = token ? await resolveOutreachLink(token) : null;

    if (!link) {
      response.status(404).json({ error: "This link is invalid or has expired." });
      return;
    }

    // Only the durable, post-verification link can upload - matches the
    // PATCH save path in applyOwnerProfileEdit, and the upload control on
    // the client only appears once the fieldset is unlocked, which happens
    // after that same verification.
    if (link.purpose !== "owner_edit") {
      response.status(403).json({ error: "Verify your business email before uploading a logo." });
      return;
    }

    const provider = link.provider;

    if (provider.status === "removed" || provider.status === "removal_requested") {
      response.status(403).json({ error: "This profile is no longer editable." });
      return;
    }

    const contentType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
    const extension = EXTENSION_FOR_CONTENT_TYPE[contentType];

    if (!extension) {
      response.status(400).json({ error: "Unsupported image type. Use PNG, JPEG, WEBP, GIF, or SVG." });
      return;
    }

    const buffer = await readRawBody(request);

    if (!buffer.length) {
      response.status(400).json({ error: "No file received." });
      return;
    }

    if (buffer.length > MAX_LOGO_BYTES) {
      response.status(400).json({ error: "Logo file is too large - please use one under 4MB." });
      return;
    }

    // Each upload gets its own unique object path (not overwritten in place)
    // so a previous logo isn't destroyed the moment a new one is uploaded -
    // that's what lets a "before" snapshot (see applyOwnerProfileEdit) still
    // resolve to a real, fetchable image if an admin reverts a bad upload.
    const publicUrl = await uploadProviderLogo({
      domain: provider.domain,
      filename: `logo-${Date.now()}.${extension}`,
      contentType,
      body: buffer,
    });

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({ ok: true, logoUrl: publicUrl });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
