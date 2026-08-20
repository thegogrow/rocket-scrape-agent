// Auto-sources a contact and drafts outreach the moment a company is
// scraped, rather than waiting for a human to click "Generate Drafts" per
// provider. Shared between the scrape-job completion path
// (src/api/admin-run-job.js) and the backfill script
// (scripts/sourceOutreachContacts.js) so both use the same "already has a
// real contact / already has drafts" skip logic instead of re-implementing it.
const { env } = require("../config/env");
const { sourceOutreachContact } = require("../enrichment/apollo");
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

// Best-effort: finds and saves a named contact if the provider doesn't
// already have a real one. Returns the updated provider (with the new
// contact, which now has a real DB id) or null if nothing changed.
async function sourceContactIfMissing(provider, { actorEmail = "system" } = {}) {
  if (!isGenericContact(primaryContactForProvider(provider))) {
    return null;
  }

  const contact = await sourceOutreachContact({ website: provider.website || `https://${provider.domain}` });

  if (!contact || !contact.email) {
    return null;
  }

  const updated = await updateProvider(
    provider.id,
    { outreachContacts: [{ ...contact, primaryContact: true }] },
    provider.status
  );

  await logActivityEvent({
    providerId: provider.id,
    eventType: "provider_contact_sourced",
    label: "Outreach contact sourced",
    summary: `${contact.name || "A contact"} (${contact.title || "unknown title"}) <${contact.email}> found via Apollo.`,
    actorEmail,
    metadata: { providerDomain: provider.domain, source: contact.source || "apollo" },
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
