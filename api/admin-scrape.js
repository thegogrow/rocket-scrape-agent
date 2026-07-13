const { createScrapeJob, verifyAdminToken } = require("../src/ui/supabaseStore");
const { readJsonBody } = require("../src/ui/readJsonBody");

function normalizeWebsiteUrl(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { url, companyName } = await readJsonBody(request);
    const normalizedUrl = normalizeWebsiteUrl(url);

    try {
      new URL(normalizedUrl);
    } catch (error) {
      response.status(400).json({ error: "Enter a valid company website URL." });
      return;
    }

    response.status(200).json(await createScrapeJob({ url: normalizedUrl, companyName, requestedBy: admin.email }));
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
