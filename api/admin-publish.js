const { publishProvider, verifyAdminToken } = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAdminToken(request.headers.authorization);
    const { id, status = "approved" } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing provider id." });
      return;
    }

    response.status(200).json(await publishProvider(id, status));
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
