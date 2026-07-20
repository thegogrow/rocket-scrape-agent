const { isPublicProfile, listAllStaticProfiles, loadProfile, safeDomain } = require("../ui/profileData");
const { isSupabaseConfigured, listPublishedProviders } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const domain = safeDomain(request.query.domain);

  if (!domain) {
    response.status(400).json({ error: "Invalid domain" });
    return;
  }

  try {
    if (isSupabaseConfigured()) {
      const databaseProfiles = await listPublishedProviders();
      const databaseProfile = databaseProfiles.find((profile) => profile.domain === domain);

      if (databaseProfile) {
        response.setHeader("Cache-Control", "no-store");
        response.status(200).json(databaseProfile);
        return;
      }
    }

    const allStaticProfiles = await listAllStaticProfiles();
    const staticProfileForDomain = allStaticProfiles.find((profile) => profile.domain === domain);

    if (staticProfileForDomain && !isPublicProfile(staticProfileForDomain)) {
      response.setHeader("Cache-Control", "no-store");
      response.status(404).json({ error: "Profile is not public." });
      return;
    }

    const staticProfiles = allStaticProfiles.filter(isPublicProfile);
    const staticProfile = staticProfiles.find((profile) => profile.domain === domain);

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(staticProfile || (await loadProfile(domain)));
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
