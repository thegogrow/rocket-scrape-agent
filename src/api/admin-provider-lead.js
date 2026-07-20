const { updateProviderLeadStatus, verifyAdminToken } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { id, status } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing provider lead id." });
      return;
    }

    response.status(200).json(await updateProviderLeadStatus(id, {
      status,
      reviewedBy: admin.email,
    }));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
};
