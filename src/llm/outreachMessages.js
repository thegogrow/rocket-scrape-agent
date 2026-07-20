const OpenAI = require("openai");
const { env } = require("../config/env");

const OUTREACH_MESSAGE_STEPS = [
  { messageStep: "email_1", channel: "email", label: "Initial outreach email" },
  { messageStep: "email_2", channel: "email", label: "Follow-up email" },
  { messageStep: "email_3", channel: "email", label: "Final reminder email" },
  { messageStep: "linkedin_message", channel: "linkedin", label: "LinkedIn message" },
  { messageStep: "claim_profile_invitation", channel: "claim_invite", label: "Claim Profile invitation" },
];

const OUTREACH_SCHEMA = {
  messages: OUTREACH_MESSAGE_STEPS.map((step) => ({
    channel: step.channel,
    messageStep: step.messageStep,
    subject: step.channel === "linkedin" ? null : "Short subject line",
    body: "Message body",
  })),
};

const SYSTEM_PROMPT = [
  "You write concise, accurate B2B outreach drafts for Rocket Engineers provider profiles.",
  "Return ONLY valid JSON. Do not include markdown fences or extra text.",
  "Generate exactly five draft messages using the requested messageStep values.",
  "Do not claim that an email was sent, opened, clicked, approved, or reviewed by the provider.",
  "Do not imply a partnership, endorsement, or commercial relationship with the provider.",
  "Do not invent personal details, company facts, customers, awards, or recent news.",
  "Use only the supplied provider profile and primary contact data.",
  "Keep tone professional, direct, and low-pressure.",
  "Every message should invite the provider to verify or claim their Rocket Engineers profile.",
  "Email 1 should introduce the profile and ask for verification.",
  "Email 2 should follow up with a practical reason to verify the listing.",
  "Email 3 should be a brief final reminder.",
  "The LinkedIn message should be under 500 characters.",
  "The Claim Profile invitation should clearly explain that claiming enables profile editing and company information management.",
  "If the contact name is a generic inbox or unknown, use a neutral greeting.",
  "Use this exact JSON shape:",
  JSON.stringify(OUTREACH_SCHEMA),
].join(" ");

function createClient() {
  if (!env.openRouter.apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  return new OpenAI({
    apiKey: env.openRouter.apiKey,
    baseURL: env.openRouter.baseUrl || "https://openrouter.ai/api/v1",
  });
}

function stripCodeFences(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonString(value) {
  const cleaned = stripCodeFences(value);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function compactList(value, limit = 8) {
  return asArray(value).map((item) => String(item || "").trim()).filter(Boolean).slice(0, limit);
}

function primaryContactForProvider(provider = {}) {
  const contacts = asArray(provider.outreachContacts);

  return contacts.find((contact) => contact.primaryContact) || contacts[0] || null;
}

function buildOutreachPayload(provider = {}, contact = primaryContactForProvider(provider)) {
  return {
    provider: {
      id: provider.id || null,
      domain: provider.domain || null,
      companyName: provider.companyName || provider.company_name || null,
      website: provider.website || null,
      description: provider.description || null,
      services: compactList(provider.services),
      technologies: compactList(provider.technologies),
      vendorPartnerships: compactList(provider.vendorPartnerships || provider.vendor_partnerships),
      recentActivity: asArray(provider.recentActivity || provider.recent_activity)
        .slice(0, 5)
        .map((activity) => ({
          title: activity.title || activity.name || "",
          date: activity.date || activity.publishedAt || activity.updatedAt || null,
          source: activity.source || activity.url || null,
        })),
      status: provider.status || null,
      confidenceScore: provider.confidenceScore ?? provider.confidence_score ?? null,
    },
    primaryContact: contact
      ? {
          id: contact.id || null,
          name: contact.name || null,
          title: contact.title || contact.role || null,
          email: contact.email || null,
          linkedinUrl: contact.linkedinUrl || contact.linkedin_url || null,
          source: contact.source || null,
        }
      : null,
    requiredMessages: OUTREACH_MESSAGE_STEPS,
  };
}

function buildOutreachPrompt(provider = {}, contact = primaryContactForProvider(provider)) {
  return [
    "Generate outreach drafts for this provider.",
    "The drafts will be reviewed and edited by an admin before any sending. Do not include sending instructions.",
    "",
    "Payload:",
    JSON.stringify(buildOutreachPayload(provider, contact), null, 2),
  ].join("\n");
}

function normalizeGeneratedMessages(parsed, { provider, contact, generatedBy }) {
  const byStep = new Map(asArray(parsed?.messages).map((message) => [message?.messageStep, message]));

  return OUTREACH_MESSAGE_STEPS.map((step) => {
    const message = byStep.get(step.messageStep) || {};
    const subject = step.channel === "linkedin" ? "" : String(message.subject || "").trim();
    const body = String(message.body || "").trim();

    if (!body) {
      throw new Error(`Generated ${step.messageStep} is missing a body.`);
    }

    if (step.channel !== "linkedin" && !subject) {
      throw new Error(`Generated ${step.messageStep} is missing a subject.`);
    }

    return {
      contactId: contact?.id || null,
      channel: step.channel,
      messageStep: step.messageStep,
      subject,
      body,
      status: "draft",
      generatedBy: generatedBy || "openrouter",
      metadata: {
        generator: "openrouter",
        model: env.openRouter.model || "anthropic/claude-sonnet-4",
        providerDomain: provider.domain || null,
        generatedAt: new Date().toISOString(),
      },
    };
  });
}

function parseOutreachResponse(value, context) {
  const parsed = JSON.parse(extractJsonString(value));

  return normalizeGeneratedMessages(parsed, context);
}

async function requestOutreachCompletion(client, provider, contact, retryMessage = null) {
  const userPrompt = [
    buildOutreachPrompt(provider, contact),
    retryMessage ? `\nCorrection: ${retryMessage}` : "",
  ].filter(Boolean).join("\n");

  const response = await client.chat.completions.create({
    model: env.openRouter.model || "anthropic/claude-sonnet-4",
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  return response.choices?.[0]?.message?.content || "";
}

async function generateOutreachMessages(provider, options = {}) {
  const contact = options.contact || primaryContactForProvider(provider);

  if (!provider?.id) {
    throw new Error("Provider id is required for outreach generation.");
  }

  if (!contact?.id) {
    throw new Error("A primary outreach contact is required before generating messages.");
  }

  const client = createClient();
  let firstResponseText = "";
  const context = {
    provider,
    contact,
    generatedBy: options.generatedBy || "openrouter",
  };

  try {
    firstResponseText = await requestOutreachCompletion(client, provider, contact);
    return parseOutreachResponse(firstResponseText, context);
  } catch (firstError) {
    try {
      const secondResponseText = await requestOutreachCompletion(
        client,
        provider,
        contact,
        "Your previous response could not be parsed or was missing required messages. Return one valid JSON object with exactly the required five messages."
      );

      return parseOutreachResponse(secondResponseText, context);
    } catch (secondError) {
      const error = new Error(`Failed to generate outreach messages: ${secondError.message}`);
      error.cause = {
        firstError: firstError.message,
        firstResponseText,
        secondError: secondError.message,
      };
      throw error;
    }
  }
}

module.exports = {
  OUTREACH_MESSAGE_STEPS,
  buildOutreachPayload,
  buildOutreachPrompt,
  generateOutreachMessages,
  normalizeGeneratedMessages,
  primaryContactForProvider,
};
