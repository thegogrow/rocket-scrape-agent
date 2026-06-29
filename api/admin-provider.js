const { deleteProvider, updateProvider, verifyAdminToken } = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAdminToken(request.headers.authorization);
    const { id, profile = {}, status } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing provider id." });
      return;
    }

    if (request.method === "DELETE") {
      response.status(200).json(await deleteProvider(id));
      return;
    }

    response.status(200).json(await updateProvider(id, profile, status));
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
