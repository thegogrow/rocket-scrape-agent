const OpenAI = require("openai");
const { env } = require("../config/env");

const SYSTEM_PROMPT = [
  "You clean up a tag taxonomy for a B2B provider directory.",
  "You will be given a list of tag names that all belong to the same category (e.g. all \"technologies\").",
  "Find groups of 2 or more names that are duplicates, near-duplicates, or synonyms of each other (different casing, abbreviations, singular/plural, spelling variants, or the same thing phrased differently).",
  "Do not group tags that are merely related but distinct (e.g. \"React\" and \"React Native\" are different tags, not duplicates).",
  "For each group, pick canonicalName as the clearest, most standard, most complete of the group's own names - do not invent a new name that isn't already in the list.",
  "canonicalName and every entry in duplicateNames must be copied exactly, character-for-character, from the provided list.",
  "Only return groups where you found real duplicates. If nothing in the list duplicates anything else, return an empty clusters array.",
  "Return ONLY valid JSON. Do not include markdown fences or extra text.",
  "Use this exact JSON shape:",
  JSON.stringify({ clusters: [{ canonicalName: "Example Tag", duplicateNames: ["example tag", "Example  Tag"] }] }),
].join(" ");

function createClient() {
  if (!env.openRouter.apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  return new OpenAI({
    apiKey: env.openRouter.apiKey,
    baseURL: env.openRouter.baseUrl || "https://openrouter.ai/api/v1",
    timeout: 45000,
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

// The LLM is asked to only echo names we gave it, but nothing stops a model
// from paraphrasing anyway - drop anything that isn't an exact match (case-
// sensitive) against the real tag list, rather than trust it blindly. A
// cluster left with fewer than 2 real names after this isn't a duplicate
// group anymore, so it's dropped entirely.
function sanitizeClusters(rawClusters, tagNames) {
  const validNames = new Set(tagNames);

  return (Array.isArray(rawClusters) ? rawClusters : [])
    .map((cluster) => {
      const canonicalName = String(cluster?.canonicalName || "").trim();
      const duplicateNames = Array.from(
        new Set(
          (Array.isArray(cluster?.duplicateNames) ? cluster.duplicateNames : [])
            .map((name) => String(name || "").trim())
            .filter((name) => name && name !== canonicalName)
        )
      );

      if (!validNames.has(canonicalName)) {
        return null;
      }

      const realDuplicates = duplicateNames.filter((name) => validNames.has(name));

      return realDuplicates.length > 0 ? { canonicalName, duplicateNames: realDuplicates } : null;
    })
    .filter(Boolean);
}

async function requestNormalization(client, tagNames, retryMessage = null) {
  const userPrompt = [
    `Tag names in this category (${tagNames.length} total):`,
    JSON.stringify(tagNames),
    retryMessage ? `\nCorrection: ${retryMessage}` : "",
  ].filter(Boolean).join("\n");

  const response = await client.chat.completions.create({
    model: env.openRouter.model || "anthropic/claude-sonnet-4",
    temperature: 0.1,
    max_tokens: 3000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices?.[0]?.message?.content || "";
}

// Proposes duplicate/synonym clusters within one tag category. Read-only -
// this never writes to tag_taxonomy; the caller decides what to do with the
// proposals (Week 13 client feedback: stage for admin review, don't
// auto-apply, since a wrong merge silently mislabels providers).
async function proposeTagNormalization({ category, tagNames }) {
  const names = Array.from(new Set((tagNames || []).map((name) => String(name || "").trim()).filter(Boolean)));

  if (names.length < 2) {
    return { category, clusters: [] };
  }

  const client = createClient();
  let firstResponseText = "";

  try {
    firstResponseText = await requestNormalization(client, names);
    const parsed = JSON.parse(extractJsonString(firstResponseText));

    return { category, clusters: sanitizeClusters(parsed.clusters, names) };
  } catch (firstError) {
    try {
      const secondResponseText = await requestNormalization(
        client,
        names,
        "Your previous response could not be parsed as the required JSON shape. Return one valid JSON object with a clusters array."
      );
      const parsed = JSON.parse(extractJsonString(secondResponseText));

      return { category, clusters: sanitizeClusters(parsed.clusters, names) };
    } catch (secondError) {
      const error = new Error(`Failed to normalize tags for ${category}: ${secondError.message}`);
      error.cause = { firstError: firstError.message, firstResponseText, secondError: secondError.message };
      throw error;
    }
  }
}

module.exports = {
  proposeTagNormalization,
};
