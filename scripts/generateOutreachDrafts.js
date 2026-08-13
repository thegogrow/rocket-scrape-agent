// Generates (or regenerates) the 5 outreach drafts for every provider that has
// a real primary contact, using the current LLM prompt (includes the real
// access link in Email 1/2/3, not just the claim invitation) and appends the
// opt-out footer - matching what src/api/admin-generate-outreach.js does for
// a single provider, but run as a batch. See docs/weekly-plan.md Week 11.
require("dotenv").config();

const {
  createOutreachLink,
  getOrCreateAccessLink,
  getProviderById,
  listOutreachContacts,
  updateProvider,
} = require("../src/ui/supabaseStore");
const { generateOutreachMessages, primaryContactForProvider } = require("../src/llm/outreachMessages");
const { env } = require("../src/config/env");

const GENERIC_LOCAL_PARTS = new Set([
  "info", "kontakt", "hello", "contact", "office", "sales", "support",
  "admin", "anfragen", "hi", "team", "mail", "inquiries", "de.office",
]);

function isGenericContact(contact) {
  if (!contact || !contact.email) return true;
  const localPart = contact.email.split("@")[0].toLowerCase();
  return GENERIC_LOCAL_PARTS.has(localPart);
}

function appendOptOutFooter(body, optOutUrl) {
  return `${body}\n\n---\nDon't want further emails about this listing? ${optOutUrl}`;
}

async function fetchProvidersWithRealContacts() {
  const url = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const fetchAll = async (q) => {
    const res = await fetch(`${url}/rest/v1/${q}`, { headers });
    if (!res.ok) throw new Error(`${q} -> ${res.status} ${await res.text()}`);
    return res.json();
  };

  const [providers, contacts] = await Promise.all([
    fetchAll("providers?select=id,company_name,domain,status&status=in.(approved,outreach_pending,outreach_active)"),
    fetchAll("outreach_contacts?select=provider_id,name,email,primary_contact"),
  ]);

  const contactsByProvider = new Map();
  for (const c of contacts) {
    if (!contactsByProvider.has(c.provider_id)) contactsByProvider.set(c.provider_id, []);
    contactsByProvider.get(c.provider_id).push(c);
  }

  return providers
    .map((p) => {
      const pcontacts = contactsByProvider.get(p.id) || [];
      const primary = pcontacts.find((c) => c.primary_contact) || pcontacts[0] || null;
      return { id: p.id, name: p.company_name, domain: p.domain, status: p.status, primary };
    })
    .filter((p) => !isGenericContact(p.primary));
}

async function generateForProvider(target) {
  const provider = await getProviderById(target.id);
  const contacts = await listOutreachContacts([target.id]);
  const primaryContact = primaryContactForProvider({ outreachContacts: contacts });

  if (!primaryContact) {
    throw new Error("No primary contact found (unexpected).");
  }

  const [accessLink, optOutLink] = await Promise.all([
    getOrCreateAccessLink(target.id),
    createOutreachLink(target.id, { purpose: "opt_out" }),
  ]);
  const accessUrl = `${env.publicBaseUrl}/profile-access?token=${encodeURIComponent(accessLink.token)}`;
  const optOutUrl = `${env.publicBaseUrl}/api/outreach-opt-out?token=${encodeURIComponent(optOutLink.token)}`;

  const generatedMessages = await generateOutreachMessages(provider, {
    contact: primaryContact,
    generatedBy: "batch-script",
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

  await updateProvider(target.id, { outreachMessages }, target.status);

  return outreachMessages.find((m) => m.messageStep === "email_1");
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null;

  let targets = await fetchProvidersWithRealContacts();
  console.log(`${targets.length} providers have a real contact and are eligible for draft generation.`);

  if (limit) {
    targets = targets.slice(0, limit);
    console.log(`Limiting this run to the first ${targets.length}.\n`);
  } else {
    console.log("");
  }

  let success = 0;
  let failed = 0;
  const failures = [];

  for (const [i, target] of targets.entries()) {
    try {
      const email1 = await generateForProvider(target);
      success += 1;
      console.log(`[${i + 1}/${targets.length}] ${target.name}: generated. Subject: "${email1.subject}"`);
    } catch (error) {
      failed += 1;
      failures.push({ name: target.name, domain: target.domain, error: error.message });
      console.error(`[${i + 1}/${targets.length}] ${target.name}: FAILED - ${error.message}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Generated: ${success}`);
  console.log(`Failed: ${failed}`);
  if (failures.length) {
    console.log(JSON.stringify(failures, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
