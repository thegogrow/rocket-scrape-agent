const { createClaimRequest, isSupabaseConfigured } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Request intake is not configured." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const row = await createClaimRequest({
      domain: body.domain,
      email: body.email,
      requestType: body.requestType,
      metadata: {
        source: "public_profile",
        notify: "rocket_engineers_admin_queue",
        userAgent: request.headers["user-agent"] || "",
      },
    });

    response.status(200).json({ ok: true, id: row.id });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
};
