const {
  beginOwnerVerification,
  inviteProviderEditor,
} = require("../ui/supabaseStore");
const { sendOutreachEmail } = require("./resend");
const { env } = require("../config/env");

function verifyEmailUrl(token) {
  return `${env.publicBaseUrl}/profile-access?token=${encodeURIComponent(token)}&verify=1`;
}

// Orchestrates the store (mint the verify token) and the send (email it) -
// same split as sendOutreachMessage.js, so supabaseStore.js never imports
// the email layer.
async function requestOwnerVerification(token, { name, email, role }) {
  const result = await beginOwnerVerification(token, { name, email, role });
  const roleLabel = result.role === "owner" ? "owner" : "editor";

  const body = [
    `Hi${result.name ? ` ${result.name}` : ""},`,
    "",
    `Click the link below to verify your email and get ${roleLabel === "owner" ? "editing access to" : "edit access as an editor on"} the ${result.provider.companyName || result.provider.domain} listing on Rocket Engineers:`,
    "",
    verifyEmailUrl(result.verifyToken),
    "",
    "This link expires in 24 hours. If you didn't request this, you can ignore this email.",
  ].join("\n");

  const sendResult = await sendOutreachEmail({
    to: result.email,
    subject: `Verify your email to manage the ${result.provider.companyName || result.provider.domain} listing`,
    body,
    providerId: result.provider.id,
  });

  return { ...result, dryRun: sendResult.dryRun, recipient: sendResult.recipient };
}

async function requestEditorInvite(inviterToken, { email }) {
  const result = await inviteProviderEditor(inviterToken, { email });

  const body = [
    "Hi,",
    "",
    `You've been invited to help manage the ${result.provider.companyName || result.provider.domain} listing on Rocket Engineers.`,
    "",
    "Click the link below to verify your email and get edit access:",
    "",
    verifyEmailUrl(result.verifyToken),
    "",
    "This link expires in 7 days.",
  ].join("\n");

  const sendResult = await sendOutreachEmail({
    to: result.email,
    subject: `You've been invited to manage the ${result.provider.companyName || result.provider.domain} listing`,
    body,
    providerId: result.provider.id,
  });

  return { ...result, dryRun: sendResult.dryRun, recipient: sendResult.recipient };
}

module.exports = {
  requestOwnerVerification,
  requestEditorInvite,
};
