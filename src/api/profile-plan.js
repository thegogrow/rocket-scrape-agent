const {
  isSupabaseConfigured,
  logActivityEvent,
  OwnerEditError,
  resolveOwnerEditAccess,
} = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

const VALID_CHOICES = new Set(["free", "pro", "premium"]);
const PLAN_LABELS = { free: "Free", pro: "Pro", premium: "Premium" };

// Records what a company picked at the end of the claim flow's Plan step
// (16d). There's no payment processor wired up in this codebase yet, so
// "Upgrade to Pro/Premium" can't actually change billing here - it logs an
// activity event instead, the same way a sales lead would, so an admin can
// follow up and set subscription_tier manually via admin.js once there's a
// real conversation. Choosing Free needs no follow-up (it's already the
// default tier), but is still logged so admin.js's activity timeline shows
// the claim flow was completed, not abandoned mid-Plan-step.
module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Profile editing is not configured." });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const token = String(body.token || "").trim();
    const choice = String(body.choice || "").trim().toLowerCase();

    if (!VALID_CHOICES.has(choice)) {
      response.status(400).json({ error: "Unknown plan choice." });
      return;
    }

    const access = await resolveOwnerEditAccess(token);

    if (!access || access.requiresVerification) {
      response.status(404).json({ error: "This link is invalid or has expired." });
      return;
    }

    const { provider } = access;
    const planLabel = PLAN_LABELS[choice];

    await logActivityEvent({
      providerId: provider.id,
      eventType: choice === "free" ? "provider_plan_selected" : "provider_plan_interest",
      label: choice === "free" ? "Completed claim flow on the Free plan" : `Requested upgrade to ${planLabel}`,
      summary: `${access.editorEmail || "A verified editor"} ${choice === "free" ? "continued on the Free plan" : `asked about the ${planLabel} plan`} from the claim flow's Plan step.`,
      actorEmail: access.editorEmail || null,
      metadata: { providerDomain: provider.domain, choice },
    });

    response.status(200).json({ ok: true });
  } catch (error) {
    const status = error instanceof OwnerEditError ? error.status : 500;
    response.status(status).json({ error: error.message });
  }
};
