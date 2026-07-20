const { logActivityEvent, verifyAdminToken } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const body = await readJsonBody(request);
    const row = await logActivityEvent({
      providerId: body.providerId,
      eventType: body.eventType,
      label: body.label,
      summary: body.summary,
      actorEmail: admin.email,
      metadata: body.metadata || {},
    });

    response.status(200).json({ ok: true, activity: row });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
};
