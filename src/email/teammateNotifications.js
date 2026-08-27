// Item #1 of the Week 14 client feedback ("teammate notifications for
// updates - first person will be the owner"): the owner should hear about
// activity on their own listing that they didn't do themselves, without
// having to keep checking back. v1 covers the two events that already exist
// as first-class concepts elsewhere in the codebase (provider_self_edited,
// provider_editor_verified) - an editor changing the listing, and a new
// editor accepting an invite. Both are best-effort: a notification failing
// to send should never break the save/verification it's reporting on, so
// callers wrap these in try/catch rather than awaiting them as part of the
// critical path.
const { sendOutreachEmail } = require("./resend");
const { env } = require("../config/env");

function publicProfileUrl(domain) {
  return `${env.publicBaseUrl}/?provider=${encodeURIComponent(domain)}`;
}

function isSamePerson(emailA, emailB) {
  return Boolean(emailA) && Boolean(emailB) && emailA.toLowerCase() === emailB.toLowerCase();
}

// Fires after a self-serve save (applyOwnerProfileEdit) whenever the person
// who saved isn't the owner - an editor changed the listing.
async function notifyOwnerOfEdit({ provider, editorEmail, editorRole }) {
  if (editorRole === "owner") {
    return null;
  }

  const ownerEmail = provider.claimedByEmail;

  if (!ownerEmail || isSamePerson(ownerEmail, editorEmail)) {
    return null;
  }

  const companyName = provider.companyName || provider.domain;
  const body = [
    "Hi,",
    "",
    `${editorEmail || "An editor"} just updated the ${companyName} listing on Rocket Engineers.`,
    "",
    "View your public profile:",
    publicProfileUrl(provider.domain),
    "",
    "You're getting this because you're the verified owner of this listing.",
  ].join("\n");

  return sendOutreachEmail({
    to: ownerEmail,
    subject: `${companyName}'s listing was updated`,
    body,
    providerId: provider.id,
  });
}

// Fires after confirmOwnerVerification whenever the person who just verified
// joined as an editor (not the owner's own first-ever claim).
async function notifyOwnerOfNewEditor({ provider, editorEmail }) {
  const ownerEmail = provider.claimedByEmail;

  if (!ownerEmail || isSamePerson(ownerEmail, editorEmail)) {
    return null;
  }

  const companyName = provider.companyName || provider.domain;
  const body = [
    "Hi,",
    "",
    `${editorEmail || "Someone you invited"} accepted their invite and can now help manage the ${companyName} listing on Rocket Engineers.`,
    "",
    "You can review or remove their access anytime from your claim link, under Team & contacts.",
  ].join("\n");

  return sendOutreachEmail({
    to: ownerEmail,
    subject: `${editorEmail || "A new editor"} joined the ${companyName} listing`,
    body,
    providerId: provider.id,
  });
}

module.exports = {
  notifyOwnerOfEdit,
  notifyOwnerOfNewEditor,
};
