const { isSupabaseConfigured, listAdminState, statusForError, verifyAdminToken } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!isSupabaseConfigured()) {
      response.status(200).json({
        configured: false,
        jobs: [],
        providers: [],
      });
      return;
    }

    await verifyAdminToken(request.headers.authorization);
    response.status(200).json({
      configured: true,
      ...(await listAdminState()),
    });
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
