const { getOutreachMessage, statusForError, verifyAdminToken } = require("../ui/supabaseStore");
const { sendOutreachMessageAndAdvanceCycle, STAGE_BY_MESSAGE_STEP } = require("../email/sendOutreachMessage");
const { isDryRun } = require("../email/resend");
const { readJsonBody } = require("../ui/readJsonBody");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { messageId } = await readJsonBody(request);

    if (!messageId) {
      response.status(400).json({ error: "Missing messageId." });
      return;
    }

    const message = await getOutreachMessage(messageId);

    if (!message) {
      response.status(404).json({ error: "Outreach message not found." });
      return;
    }

    if (!STAGE_BY_MESSAGE_STEP[message.messageStep]) {
      response.status(400).json({ error: "Only email_1, email_2, or email_3 can be sent from here." });
      return;
    }

    if (message.status !== "approved") {
      response.status(409).json({ error: "Only an approved draft can be sent." });
      return;
    }

    const result = await sendOutreachMessageAndAdvanceCycle(message, { actorEmail: admin.email });

    response.status(200).json({
      message: result.message,
      cycle: result.cycle,
      dryRun: isDryRun(),
    });
  } catch (error) {
    response.status(statusForError(error)).json({ error: error.message });
  }
};
