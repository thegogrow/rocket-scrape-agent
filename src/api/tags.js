const { isSupabaseConfigured, listApprovedTagTaxonomy } = require("../ui/supabaseStore");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const tags = isSupabaseConfigured() ? await listApprovedTagTaxonomy() : [];

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(tags);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
