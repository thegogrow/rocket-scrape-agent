const { env } = require("../config/env");
const {
  isSupabaseConfigured,
  listDueOutreachCycles,
  listOutreachMessages,
  logActivityEvent,
  stopOutreachCycle,
} = require("../ui/supabaseStore");
const { sendOutreachMessageAndAdvanceCycle } = require("../email/sendOutreachMessage");

const NEXT_STEP_BY_STAGE = {
  cycle_1_sent: "email_2",
  cycle_2_sent: "email_3",
};

// Daily target of the Supabase pg_cron job set up in docs/supabase-schema.sql
// (Week 10 Part C). Not admin-token gated - pg_cron can't hold a user session,
// so it authenticates with a shared secret instead.
module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!env.outreach.cronSecret) {
    response.status(503).json({ error: "OUTREACH_CRON_SECRET is not configured." });
    return;
  }

  if (request.headers["x-cron-secret"] !== env.outreach.cronSecret) {
    response.status(401).json({ error: "Invalid cron secret." });
    return;
  }

  if (!isSupabaseConfigured()) {
    response.status(503).json({ error: "Supabase is not configured." });
    return;
  }

  const results = { sent: 0, closedNoResponse: 0, skipped: 0, failed: 0, details: [] };

  try {
    const dueCycles = await listDueOutreachCycles();

    for (const cycle of dueCycles) {
      try {
        if (cycle.stage === "cycle_3_sent") {
          await stopOutreachCycle(cycle.providerId, { resolution: "no_response" });
          results.closedNoResponse += 1;
          results.details.push({ providerId: cycle.providerId, action: "closed_no_response" });
          continue;
        }

        const nextStep = NEXT_STEP_BY_STAGE[cycle.stage];

        if (!nextStep) {
          continue;
        }

        const providerMessages = await listOutreachMessages([cycle.providerId]);
        const nextMessage = providerMessages.find((item) => item.messageStep === nextStep && item.body);

        if (!nextMessage) {
          results.skipped += 1;
          results.details.push({ providerId: cycle.providerId, action: "skipped_no_draft", step: nextStep });
          await logActivityEvent({
            providerId: cycle.providerId,
            eventType: "outreach_followup_skipped",
            label: "Follow-up skipped",
            summary: `${nextStep} has no draft to send, so the follow-up was skipped.`,
          });
          continue;
        }

        await sendOutreachMessageAndAdvanceCycle(nextMessage, { actorEmail: "automated-followup" });
        results.sent += 1;
        results.details.push({ providerId: cycle.providerId, action: "sent", step: nextStep });
      } catch (error) {
        results.failed += 1;
        results.details.push({ providerId: cycle.providerId, action: "failed", error: error.message });
        await logActivityEvent({
          providerId: cycle.providerId,
          eventType: "outreach_followup_failed",
          label: "Follow-up failed",
          summary: error.message,
        });
      }
    }

    response.status(200).json(results);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
