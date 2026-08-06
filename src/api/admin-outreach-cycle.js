const {
  logActivityEvent,
  setOutreachCyclePaused,
  statusForError,
  stopOutreachCycle,
  verifyAdminToken,
} = require("../ui/supabaseStore");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "PATCH") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { providerId, resolution, paused } = await readJsonBody(request);

    if (!providerId) {
      response.status(400).json({ error: "Missing providerId." });
      return;
    }

    if (resolution) {
      const cycle = await stopOutreachCycle(providerId, { resolution });

      await logActivityEvent({
        providerId,
        eventType: "outreach_marked_replied",
        label: "Outreach cycle stopped",
        summary: `Marked ${resolution.replace(/_/g, " ")} by ${admin.email}. No further follow-ups will send.`,
        actorEmail: admin.email,
      });

      response.status(200).json({ cycle });
      return;
    }

    if (typeof paused === "boolean") {
      const cycle = await setOutreachCyclePaused(providerId, paused);

      response.status(200).json({ cycle });
      return;
    }

    response.status(400).json({ error: "Provide resolution or paused." });
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
