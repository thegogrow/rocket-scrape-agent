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
        // Public directory data, same for every visitor - cache at the edge so
        // repeat/concurrent loads don't each pay for a fresh Supabase query.
        // Admin changes show up within a minute; stale-while-revalidate keeps
        // it feeling fresh without blocking the response on a refetch.
        response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
        response.status(200).json(databaseProfiles);
        return;
      }
    }

    const staticProfiles = await listStaticProfiles();

    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    response.status(200).json(staticProfiles.length > 0 ? staticProfiles : await listProfiles());
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
