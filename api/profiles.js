const { listProfiles, listStaticProfiles } = require("../src/ui/profileData");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const staticProfiles = await listStaticProfiles();

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(staticProfiles.length > 0 ? staticProfiles : await listProfiles());
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
