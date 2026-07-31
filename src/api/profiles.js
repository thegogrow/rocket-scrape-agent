const { listProfiles, listStaticProfiles } = require("../ui/profileData");
const { isSupabaseConfigured, listPublishedProviders } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (isSupabaseConfigured()) {
      let databaseProfiles = null;

      try {
        databaseProfiles = await listPublishedProviders();
      } catch (error) {
        console.warn(`[profiles] Supabase unavailable, using static profiles: ${error.message}`);
      }

      if (databaseProfiles !== null) {
        response.setHeader("Cache-Control", "no-store");
        response.status(200).json(databaseProfiles);
        return;
      }
    }

    const staticProfiles = await listStaticProfiles();

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(staticProfiles.length > 0 ? staticProfiles : await listProfiles());
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
