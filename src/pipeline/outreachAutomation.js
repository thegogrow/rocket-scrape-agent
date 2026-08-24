// Auto-sources a contact and drafts outreach the moment a company is
// scraped, rather than waiting for a human to click "Generate Drafts" per
// provider. Shared between the scrape-job completion path
// (src/api/admin-run-job.js) and the backfill script
// (scripts/sourceOutreachContacts.js) so both use the same "already has a
// real contact / already has drafts" skip logic instead of re-implementing it.
const { env } = require("../config/env");
const { sourceOutreachContacts } = require("../enrichment/apollo");
const { generateOutreachMessages, primaryContactForProvider } = require("../llm/outreachMessages");
const {
  createOutreachLink,
  getOrCreateAccessLink,
  logActivityEvent,
  updateProvider,
} = require("../ui/supabaseStore");

// Same generic-mailbox list scripts/sourceOutreachContacts.js used before
// this module existed - kept here as the one place that decides what counts
// as "no real contact yet".
const GENERIC_LOCAL_PARTS = new Set([
  "info", "kontakt", "hello", "contact", "office", "sales", "support",
  "admin", "anfragen", "hi", "team", "mail", "inquiries", "de.office",
]);

function isGenericContact(contact) {
  if (!contact || !contact.email) {
    return true;
  }

  const localPart = contact.email.split("@")[0].toLowerCase();

  return GENERIC_LOCAL_PARTS.has(localPart);
}

// Best-effort: finds and saves candidate contacts if the provider doesn't
// already have a real, human-confirmed one. Adds sourced candidates
// alongside any contacts already on the provider (never deletes/overwrites -
// replaceProviderOutreachContacts treats the whole outreachContacts array as
// the full desired set, so this always passes the existing rows through
// too). New candidates are unconfirmed ("sourced") and never primary - a
// human has to confirm one in the admin before it's send-eligible (see
// primaryContactForProvider in llm/outreachMessages.js, which ignores
// unconfirmed contacts). Returns the updated provider or null if nothing
// changed.
async function sourceContactIfMissing(provider, { actorEmail = "system" } = {}) {
  if (!isGenericContact(primaryContactForProvider(provider))) {
    return null;
  }

  const existingContacts = Array.isArray(provider.outreachContacts) ? provider.outreachContacts : [];
  const existingEmails = new Set(
    existingContacts.map((contact) => String(contact.email || "").toLowerCase()).filter(Boolean)
  );

  const candidates = await sourceOutreachContacts({ website: provider.website || `https://${provider.domain}` });
  const newCandidates = candidates.filter(
    (candidate) => candidate.email && !existingEmails.has(candidate.email.toLowerCase())
  );

  if (newCandidates.length === 0) {
    return null;
  }

  const updated = await updateProvider(
    provider.id,
    {
      outreachContacts: [
        ...existingContacts,
        ...newCandidates.map((candidate) => ({ ...candidate, primaryContact: false, sourceStatus: "sourced" })),
      ],
    },
    provider.status
  );

  await logActivityEvent({
    providerId: provider.id,
    eventType: "provider_contact_sourced",
    label: "Outreach contact candidates sourced",
    summary: `${newCandidates.length} candidate contact${newCandidates.length === 1 ? "" : "s"} found via Apollo, awaiting admin confirmation: ${newCandidates.map((c) => `${c.name || "unnamed"} <${c.email}>`).join(", ")}.`,
    actorEmail,
    metadata: { providerDomain: provider.domain, source: "apollo", candidateCount: newCandidates.length },
  });

  return updated;
}

function appendOptOutFooter(body, optOutUrl) {
  return `${body}\n\n---\nDon't want further emails about this listing? ${optOutUrl}`;
}

// Best-effort: generates the five outreach drafts if the provider doesn't
// have any yet and has a real, emailable contact to personalize them with.
// Returns the updated provider or null if nothing changed.
async function generateDraftsForProvider(provider, { generatedBy = "system" } = {}) {
  if (Array.isArray(provider.outreachMessages) && provider.outreachMessages.length > 0) {
    return null;
  }

  const primaryContact = primaryContactForProvider(provider);

  if (!primaryContact?.id || !primaryContact.email) {
    return null;
  }

  const [accessLink, optOutLink] = await Promise.all([
    getOrCreateAccessLink(provider.id),
    createOutreachLink(provider.id, { purpose: "opt_out" }),
  ]);
  const accessUrl = `${env.publicBaseUrl}/profile-access?token=${encodeURIComponent(accessLink.token)}`;
  const optOutUrl = `${env.publicBaseUrl}/api/outreach-opt-out?token=${encodeURIComponent(optOutLink.token)}`;

  const generatedMessages = await generateOutreachMessages(provider, {
    contact: primaryContact,
    generatedBy,
    accessUrl,
  });
  const outreachMessages = generatedMessages.map((message) => {
    if (message.messageStep === "claim_profile_invitation") {
      return { ...message, metadata: { ...message.metadata, accessUrl } };
    }

    return message.channel === "email"
      ? { ...message, body: appendOptOutFooter(message.body, optOutUrl) }
      : message;
  });

  const activityEntry = {
    type: "outreach_generated",
    label: "Outreach generated",
    summary: `${outreachMessages.length} draft outreach messages generated for ${primaryContact.name || primaryContact.email}.`,
    adminEmail: generatedBy,
    createdAt: new Date().toISOString(),
  };

  return updateProvider(
    provider.id,
    {
      outreachMessages,
      activityLog: [activityEntry, ...(Array.isArray(provider.activityLog) ? provider.activityLog : [])].slice(0, 50),
    },
    provider.status
  );
}

module.exports = {
  isGenericContact,
  sourceContactIfMissing,
  generateDraftsForProvider,
};
