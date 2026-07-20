const { reviewClaimRequest, verifyAdminToken } = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { id, status } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing claim request id." });
      return;
    }

    response.status(200).json(await reviewClaimRequest(id, {
      status,
      reviewedBy: admin.email,
    }));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
};
