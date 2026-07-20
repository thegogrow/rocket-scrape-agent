const { updateTagTaxonomy, verifyAdminToken } = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH" && request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAdminToken(request.headers.authorization);
    const payload = await readJsonBody(request);

    response.status(200).json(await updateTagTaxonomy(payload));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
};
