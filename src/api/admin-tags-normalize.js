const { listApprovedTagTaxonomy, statusForError, verifyAdminToken } = require("../ui/supabaseStore");
const { proposeTagNormalization } = require("../llm/tagNormalization");
const { readJsonBody } = require("../ui/readJsonBody");

const TAG_CATEGORIES = ["services", "industries", "technologies", "vendor_partnerships"];

// Read-only: runs one LLM pass per category over the current approved tags
// and returns proposed duplicate/synonym clusters for a human to review.
// Nothing here writes to tag_taxonomy - accepting a cluster in the admin UI
// applies it through the existing PATCH /api/admin-tags merge path, one tag
// at a time, exactly like a manual merge.
module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await verifyAdminToken(request.headers.authorization);
    const body = await readJsonBody(request);
    const requestedCategories = Array.isArray(body.categories) && body.categories.length > 0
      ? body.categories.filter((category) => TAG_CATEGORIES.includes(category))
      : TAG_CATEGORIES;

    const approvedTags = await listApprovedTagTaxonomy();
    const proposals = [];

    for (const category of requestedCategories) {
      const categoryTags = approvedTags.filter((tag) => tag.category === category);

      if (categoryTags.length < 2) {
        continue;
      }

      const nameToTag = new Map(categoryTags.map((tag) => [tag.name, tag]));
      const { clusters } = await proposeTagNormalization({
        category,
        tagNames: categoryTags.map((tag) => tag.name),
      });

      clusters.forEach((cluster) => {
        const canonicalTag = nameToTag.get(cluster.canonicalName);
        const duplicates = cluster.duplicateNames
          .map((name) => nameToTag.get(name))
          .filter(Boolean)
          .map((tag) => ({ id: tag.id, name: tag.name }));

        if (canonicalTag && duplicates.length > 0) {
          proposals.push({
            category,
            canonicalId: canonicalTag.id,
            canonicalName: canonicalTag.name,
            duplicates,
          });
        }
      });
    }

    response.status(200).json({ proposals });
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
