const { loadProfile, safeDomain } = require("../src/ui/profileData");

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
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(await loadProfile(domain));
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
