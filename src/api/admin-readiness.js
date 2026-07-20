const { getOperationalReadiness, isSupabaseConfigured, verifyAdminToken } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isSupabaseConfigured()) {
      await verifyAdminToken(request.headers.authorization);
    }

    response.status(200).json(await getOperationalReadiness());
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
