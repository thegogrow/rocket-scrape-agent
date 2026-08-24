const { deleteProvider, statusForError, updateProvider, verifyAdminToken } = require("../ui/supabaseStore");
const { generateDraftsForProvider } = require("../pipeline/outreachAutomation");
const { readJsonBody } = require("../ui/readJsonBody");

function hasPremiumProfileAccess(profile = {}) {
  const tier = String(profile.subscriptionTier || profile.subscription_tier || profile.plan || "").toLowerCase();

  return Boolean(profile.isPremium || profile.premium || ["premium", "pro", "paid"].includes(tier));
}

function validateProviderPatch(profile = {}) {
  if (hasPremiumProfileAccess(profile)) {
    return null;
  }

  if ((profile.successStories || []).length > 1 || (profile.solutions || []).length > 1) {
    return "Multiple success stories or solutions require premium subscription.";
  }

  return null;
}

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { id, profile = {}, status } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing provider id." });
      return;
    }

    if (request.method === "DELETE") {
      response.status(200).json(await deleteProvider(id));
      return;
    }

    const validationError = validateProviderPatch(profile);

    if (validationError) {
      response.status(400).json({ error: validationError });
      return;
    }

    let updated = await updateProvider(id, profile, status, { reviewedBy: admin.email });

    // A save that touches contacts is the moment an admin confirms one as
    // the real send target (Week 13's "Suggested" candidates) - draft
    // generation no-ops safely on its own (already-has-drafts / no-
    // confirmed-contact-yet), so it's safe to just always try rather than
    // working out whether this specific save is what newly confirmed one.
    if (profile.outreachContacts !== undefined) {
      try {
        const withDrafts = await generateDraftsForProvider(updated, { generatedBy: admin.email });

        if (withDrafts) {
          updated = withDrafts;
        }
      } catch (error) {
        console.warn(`[admin-provider] Auto draft generation failed for ${id}: ${error.message}`);
      }
    }

    response.status(200).json(updated);
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
