const axios = require("axios");
const { env } = require("../config/env");

function hasResendConfig() {
  return Boolean(env.resend.apiKey && env.resend.fromEmail);
}

function isDryRun() {
  return env.resend.dryRun;
}

function bodyToHtml(body) {
  return String(body || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

// Sends one outreach message. In dry-run mode (the default) the send is
// redirected to OUTREACH_TEST_INBOX_EMAIL so the full cycle can be tested
// without ever reaching a real company - see docs/weekly-plan.md Week 10 Part D.
async function sendOutreachEmail({ to, subject, body, providerId }) {
  if (!hasResendConfig()) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  const dryRun = isDryRun();

  if (dryRun && !env.resend.testInboxEmail) {
    throw new Error("OUTREACH_DRY_RUN is enabled but OUTREACH_TEST_INBOX_EMAIL is not set.");
  }

  const recipient = dryRun ? env.resend.testInboxEmail : to;

  if (!recipient) {
    throw new Error("Missing recipient email for outreach send.");
  }

  const response = await axios({
    method: "post",
    url: `${env.resend.baseUrl}/emails`,
    headers: {
      Authorization: `Bearer ${env.resend.apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 20000,
    data: {
      from: env.resend.fromEmail,
      to: [recipient],
      // Plus-addressing lets a future inbound-parse webhook match a reply back
      // to a provider by exact string instead of fuzzy sender matching.
      reply_to: providerId
        ? env.resend.fromEmail.replace("@", `+${providerId}@`)
        : undefined,
      subject: dryRun ? `[TEST -> ${to}] ${subject}` : subject,
      html: bodyToHtml(body),
      text: body,
    },
    validateStatus(status) {
      return status >= 200 && status < 500;
    },
  });

  if (response.status >= 400) {
    throw new Error(
      response.data?.message || `Resend request failed with status ${response.status}`
    );
  }

  return {
    id: response.data?.id || null,
    dryRun,
    recipient,
  };
}

module.exports = {
  hasResendConfig,
  isDryRun,
  sendOutreachEmail,
};
