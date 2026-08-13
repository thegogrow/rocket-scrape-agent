const { isSupabaseConfigured, latestClaimRequestForProvider, resolveOutreachLink } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Profile access is not configured." });
    return;
  }

  const token = String(request.query?.token || "").trim();

  if (!token) {
    response.status(400).json({ error: "Missing token." });
    return;
  }

  try {
    const link = await resolveOutreachLink(token);

    if (!link) {
      response.status(404).json({ error: "This link is invalid or has expired." });
      return;
    }

    const existingRequest = await latestClaimRequestForProvider(link.provider.id);

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({
      domain: link.provider.domain,
      companyName: link.provider.companyName,
      status: link.provider.status,
      claimed: Boolean(link.provider.claimed),
      used: Boolean(link.usedAt),
      existingRequest: existingRequest
        ? {
            requestType: existingRequest.requestType,
            status: existingRequest.status,
            createdAt: existingRequest.createdAt,
          }
        : null,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
