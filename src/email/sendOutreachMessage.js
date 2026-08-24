const {
  getProviderById,
  listOutreachContacts,
  logActivityEvent,
  markOutreachMessageSent,
  recordOutreachSend,
  updateProvider,
} = require("../ui/supabaseStore");
const { sendOutreachEmail } = require("./resend");

const STAGE_BY_MESSAGE_STEP = {
  email_1: "cycle_1_sent",
  email_2: "cycle_2_sent",
  email_3: "cycle_3_sent",
};
const CYCLE_NUMBER_BY_MESSAGE_STEP = { email_1: 1, email_2: 2, email_3: 3 };
const STATUSES_ELIGIBLE_FOR_OUTREACH_ACTIVE = ["scraped", "in_review", "approved", "outreach_pending"];

// Shared by the admin Send button (src/api/send-outreach.js) and the
// automated daily follow-up job (src/api/outreach-followup.js): sends one
// email_1/2/3 message and advances the provider's outreach_cycles row.
async function sendOutreachMessageAndAdvanceCycle(message, { actorEmail = "system" } = {}) {
  const stage = STAGE_BY_MESSAGE_STEP[message.messageStep];

  if (!stage) {
    throw new Error(`${message.messageStep} is not an email step and cannot be sent this way.`);
  }

  const provider = await getProviderById(message.providerId);

  if (!provider) {
    throw new Error("Provider not found.");
  }

  const contacts = await listOutreachContacts([provider.id]);
  // An explicit contactId match is an intentional choice (e.g. a message
  // generated for a specific person) and can send regardless of
  // sourceStatus; the fallbacks must not land on an Apollo-suggested
  // candidate nobody has confirmed yet - see llm/outreachMessages.js's
  // primaryContactForProvider, which applies the same rule.
  const confirmedContacts = contacts.filter((item) => (item.sourceStatus || "confirmed") === "confirmed");
  const contact = contacts.find((item) => item.id === message.contactId)
    || confirmedContacts.find((item) => item.primaryContact)
    || confirmedContacts[0];

  if (!contact?.email) {
    throw new Error("No contact email to send to.");
  }

  const sendResult = await sendOutreachEmail({
    to: contact.email,
    subject: message.subject,
    body: message.body,
    providerId: provider.id,
  });

  const [updatedMessage, updatedCycle] = await Promise.all([
    markOutreachMessageSent(message.id, { cycleNumber: CYCLE_NUMBER_BY_MESSAGE_STEP[message.messageStep] }),
    recordOutreachSend(provider.id, stage),
  ]);

  if (STATUSES_ELIGIBLE_FOR_OUTREACH_ACTIVE.includes(provider.status)) {
    await updateProvider(provider.id, {}, "outreach_active");
  }

  await logActivityEvent({
    providerId: provider.id,
    eventType: "outreach_sent",
    label: `${message.messageStep.replace(/_/g, " ")} sent`,
    summary: sendResult.dryRun
      ? `Dry run: redirected to ${sendResult.recipient} instead of ${contact.email}.`
      : `Sent to ${contact.email}.`,
    actorEmail,
    metadata: {
      messageStep: message.messageStep,
      dryRun: sendResult.dryRun,
      resendId: sendResult.id,
    },
  });

  return { message: updatedMessage, cycle: updatedCycle, sendResult, provider };
}

module.exports = {
  sendOutreachMessageAndAdvanceCycle,
  STAGE_BY_MESSAGE_STEP,
  CYCLE_NUMBER_BY_MESSAGE_STEP,
};
