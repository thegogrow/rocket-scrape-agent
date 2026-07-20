const {
  listAdminState,
  updateProvider,
  verifyAdminToken,
} = require("../ui/supabaseStore");
const { generateOutreachMessages, primaryContactForProvider } = require("../llm/outreachMessages");
const { readJsonBody } = require("../ui/readJsonBody");

function activityLogForProfile(profile = {}) {
  return Array.isArray(profile.activityLog) ? profile.activityLog : [];
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const admin = await verifyAdminToken(request.headers.authorization);
    const { id, overwrite = false } = await readJsonBody(request);

    if (!id) {
      response.status(400).json({ error: "Missing provider id." });
      return;
    }

    const state = await listAdminState();
    const provider = state.providers.find((item) => item.id === id);

    if (!provider) {
      response.status(404).json({ error: "Provider not found." });
      return;
    }

    if (!overwrite && Array.isArray(provider.outreachMessages) && provider.outreachMessages.length > 0) {
      response.status(409).json({ error: "Outreach messages already exist for this provider." });
      return;
    }

    const primaryContact = primaryContactForProvider(provider);
    const outreachMessages = await generateOutreachMessages(provider, {
      contact: primaryContact,
      generatedBy: admin.email,
    });
    const activityEntry = {
      type: "outreach_generated",
      label: "Outreach generated",
      summary: `${outreachMessages.length} draft outreach messages generated for ${primaryContact.name || primaryContact.email || "the primary contact"}.`,
      adminEmail: admin.email,
      createdAt: new Date().toISOString(),
    };
    const updatedProvider = await updateProvider(
      id,
      {
        outreachMessages,
        activityLog: [activityEntry, ...activityLogForProfile(provider)].slice(0, 50),
      },
      provider.status
    );

    response.status(200).json({
      provider: updatedProvider,
      outreachMessages: updatedProvider.outreachMessages || outreachMessages,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
