const { confirmOwnerVerification, isSupabaseConfigured, OwnerEditError } = require("../ui/supabaseStore");
const { requestOwnerVerification, requestEditorInvite } = require("../email/ownerVerification");
const { readJsonBody } = require("../ui/readJsonBody");

// Owner/editor email verification (Week 13 client feedback) - three actions
// on one endpoint, matching how src/api/profile-edit.js already bundles
// GET/PATCH for the self-serve editor rather than one file per verb:
//   request: someone on an unverified link submits Name/Email/Role, gets a
//     verification email.
//   confirm: they click the emailed link - this exchanges the one-shot
//     verify token for their personal, reusable owner_edit token.
//   invite: the owner adds another editor by email.
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
    const action = String(body.action || "").trim();

    if (action === "request") {
      const result = await requestOwnerVerification(String(body.token || "").trim(), {
        name: body.name,
        email: body.email,
        role: body.role,
      });

      response.status(200).json({ ok: true, sentTo: result.recipient, dryRun: result.dryRun });
      return;
    }

    if (action === "confirm") {
      const result = await confirmOwnerVerification(String(body.token || "").trim());

      response.status(200).json({
        ok: true,
        editToken: result.editToken,
        role: result.role,
        name: result.name,
      });
      return;
    }

    if (action === "invite") {
      const result = await requestEditorInvite(String(body.token || "").trim(), { email: body.email });

      response.status(200).json({ ok: true, sentTo: result.recipient, dryRun: result.dryRun });
      return;
    }

    response.status(400).json({ error: "Unknown action." });
  } catch (error) {
    const status = error instanceof OwnerEditError ? error.status : 500;
    response.status(status).json({ error: error.message });
  }
};
