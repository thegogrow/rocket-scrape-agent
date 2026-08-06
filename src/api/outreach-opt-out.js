const {
  isSupabaseConfigured,
  logActivityEvent,
  markOutreachLinkUsed,
  resolveOutreachLink,
  stopOutreachCycle,
} = require("../ui/supabaseStore");

function htmlPage(message) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Rocket Engineers — Outreach preferences</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 20px; color: #111;">
  <p>${message}</p>
</body>
</html>`;
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");

  if (!isSupabaseConfigured()) {
    response.status(503).send(htmlPage("Opt-out is not available right now."));
    return;
  }

  const token = String(request.query?.token || "").trim();

  if (!token) {
    response.status(400).send(htmlPage("This link is missing its token."));
    return;
  }

  try {
    const link = await resolveOutreachLink(token);

    if (!link || link.purpose !== "opt_out") {
      response.status(404).send(htmlPage("This link is invalid or has expired."));
      return;
    }

    await stopOutreachCycle(link.provider.id, { resolution: "opted_out" });
    await markOutreachLinkUsed(token);
    await logActivityEvent({
      providerId: link.provider.id,
      eventType: "outreach_opted_out",
      label: "Opted out of outreach",
      summary: `${link.provider.companyName || link.provider.domain} opted out via the email footer link.`,
      metadata: {},
    });

    response.status(200).send(htmlPage("You won't receive further outreach emails from Rocket Engineers about this profile."));
  } catch (error) {
    response.status(500).send(htmlPage("Something went wrong processing this request."));
  }
};
