const { deleteProvider, updateProvider, verifyAdminToken } = require("../ui/supabaseStore");
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

    response.status(200).json(await updateProvider(id, profile, status, { reviewedBy: admin.email }));
  } catch (error) {
    response.status(401).json({ error: error.message });
  }
};
