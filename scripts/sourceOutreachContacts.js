// Batch-sources a named outreach contact (via Apollo people search) for every
// approved/outreach-staged provider that doesn't have one yet, or only has a
// generic mailbox (info@, kontakt@, etc). Built for Week 11 batch prep - see
// docs/weekly-plan.md. Run with: node scripts/sourceOutreachContacts.js
require("dotenv").config();

const { sourceOutreachContact } = require("../src/enrichment/apollo");
const { updateProvider } = require("../src/ui/supabaseStore");

const GENERIC_LOCAL_PARTS = new Set([
  "info", "kontakt", "hello", "contact", "office", "sales", "support",
  "admin", "anfragen", "hi", "team", "mail", "inquiries", "de.office",
]);

const DELAY_MS = 400;
const MAX_CONSECUTIVE_ERRORS = 5;

function isGenericContact(contact) {
  if (!contact || !contact.email) return true;
  const localPart = contact.email.split("@")[0].toLowerCase();
  return GENERIC_LOCAL_PARTS.has(localPart);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEligibleProviders() {
  const url = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const fetchAll = async (q) => {
    const res = await fetch(`${url}/rest/v1/${q}`, { headers });
    if (!res.ok) throw new Error(`${q} -> ${res.status} ${await res.text()}`);
    return res.json();
  };

  const [providers, cycles, contacts] = await Promise.all([
    fetchAll("providers?select=id,company_name,domain,status&status=in.(approved,outreach_pending,outreach_active)"),
    fetchAll("outreach_cycles?select=provider_id,stage,resolution"),
    fetchAll("outreach_contacts?select=provider_id,name,email,primary_contact"),
  ]);

  const cycleByProvider = new Map(cycles.map((c) => [c.provider_id, c]));
  const contactsByProvider = new Map();
  for (const c of contacts) {
    if (!contactsByProvider.has(c.provider_id)) contactsByProvider.set(c.provider_id, []);
    contactsByProvider.get(c.provider_id).push(c);
  }

  return providers
    .filter((p) => {
      const cycle = cycleByProvider.get(p.id);
      return (!cycle || cycle.stage === "not_started") && !(cycle && cycle.resolution);
    })
    .map((p) => {
      const pcontacts = contactsByProvider.get(p.id) || [];
      const primary = pcontacts.find((c) => c.primary_contact) || pcontacts[0] || null;
      return { id: p.id, name: p.company_name, domain: p.domain, status: p.status, existingContact: primary };
    })
    .filter((p) => isGenericContact(p.existingContact));
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null;

  let targets = await fetchEligibleProviders();
  console.log(`${targets.length} providers need a named contact sourced.`);

  if (limit) {
    targets = targets.slice(0, limit);
    console.log(`Limiting this run to the first ${targets.length}.\n`);
  } else {
    console.log("");
  }

  let sourced = 0;
  let noEmailFound = 0;
  let noCandidates = 0;
  let consecutiveErrors = 0;
  const errors = [];
  const results = [];

  for (const [i, provider] of targets.entries()) {
    try {
      const contact = await sourceOutreachContact({ website: `https://${provider.domain}` });
      consecutiveErrors = 0;

      if (contact && contact.email) {
        await updateProvider(
          provider.id,
          { outreachContacts: [{ ...contact, primaryContact: true }] },
          provider.status
        );
        sourced += 1;
        results.push({ name: provider.name, domain: provider.domain, ...contact });
        console.log(`[${i + 1}/${targets.length}] ${provider.name}: ${contact.name} (${contact.title}) <${contact.email}>`);
      } else if (contact) {
        noEmailFound += 1;
        console.log(`[${i + 1}/${targets.length}] ${provider.name}: found ${contact.name || "a candidate"} but no email - skipped.`);
      } else {
        noCandidates += 1;
        console.log(`[${i + 1}/${targets.length}] ${provider.name}: no Apollo candidates found.`);
      }
    } catch (error) {
      consecutiveErrors += 1;
      errors.push({ name: provider.name, domain: provider.domain, error: error.message });
      console.error(`[${i + 1}/${targets.length}] ${provider.name}: ERROR - ${error.message}`);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`\nAborting after ${MAX_CONSECUTIVE_ERRORS} consecutive errors (likely rate limit or out of credits).`);
        break;
      }
    }

    await sleep(DELAY_MS);
  }

  console.log("\n=== Summary ===");
  console.log(`Sourced with email: ${sourced}`);
  console.log(`Candidate found, no email: ${noEmailFound}`);
  console.log(`No candidates: ${noCandidates}`);
  console.log(`Errors: ${errors.length}`);

  require("fs").writeFileSync(
    require("path").join(__dirname, "_outreach_sourcing_results.json"),
    JSON.stringify({ sourced: results, errors }, null, 2)
  );
  console.log("\nWrote scripts/_outreach_sourcing_results.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
