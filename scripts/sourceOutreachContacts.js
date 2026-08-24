// Backfills a named outreach contact (via Apollo people search) and, once a
// contact is found, the five outreach drafts, for every approved/outreach-
// staged provider that doesn't have them yet. Originally Week 11 batch prep
// (contacts only); extended in Week 12 to also generate drafts and to share
// the sourcing/generation logic with the automatic per-scrape hook in
// src/api/admin-run-job.js via src/pipeline/outreachAutomation.js, instead of
// re-implementing the "is this contact generic" check in two places.
// Run with: node scripts/sourceOutreachContacts.js [--limit=N]
require("dotenv").config();

const { generateDraftsForProvider, isGenericContact, sourceContactIfMissing } = require("../src/pipeline/outreachAutomation");
const { primaryContactForProvider } = require("../src/llm/outreachMessages");
const { listAdminState } = require("../src/ui/supabaseStore");

const DELAY_MS = 400;
const MAX_CONSECUTIVE_ERRORS = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// primaryContactForProvider only counts human-confirmed contacts (Week 13:
// Apollo can now surface several unconfirmed candidates per provider) - so a
// provider with only fresh, unconfirmed candidates still counts as
// "generic"/no real contact yet here, same as having none at all.
function isEligible(provider) {
  const cycle = provider.outreachCycle;
  const cycleOk = !cycle || (cycle.stage === "not_started" && !cycle.resolution);

  return cycleOk && isGenericContact(primaryContactForProvider(provider));
}

async function fetchEligibleProviders() {
  const state = await listAdminState();

  return state.providers.filter(
    (provider) => ["approved", "outreach_pending", "outreach_active"].includes(provider.status) && isEligible(provider)
  );
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null;

  let targets = await fetchEligibleProviders();
  console.log(`${targets.length} providers need a named contact sourced.`);

  if (limit) {
    targets = targets.slice(0, limit);
    console.log(`Limiting this run to the first ${targets.length}.\n`);
  } else {
    console.log("");
  }

  let contactsSourced = 0;
  let draftsGenerated = 0;
  let noEmailFound = 0;
  let noCandidates = 0;
  let consecutiveErrors = 0;
  const errors = [];
  const results = [];

  for (const [index, provider] of targets.entries()) {
    try {
      const withContact = await sourceContactIfMissing(provider, { actorEmail: "batch-script" });
      consecutiveErrors = 0;

      if (!withContact) {
        noCandidates += 1;
        console.log(`[${index + 1}/${targets.length}] ${provider.companyName}: no Apollo candidate with a usable email.`);
        await sleep(DELAY_MS);
        continue;
      }

      // New candidates land unconfirmed (sourceStatus "sourced") - an admin
      // has to pick one in the admin UI before it's send-eligible, so there's
      // no single "the" contact to log yet, just the batch just found.
      const sourcedCandidates = (withContact.outreachContacts || []).filter(
        (contact) => contact.sourceStatus === "sourced"
      );
      contactsSourced += sourcedCandidates.length;
      console.log(
        `[${index + 1}/${targets.length}] ${provider.companyName}: ${sourcedCandidates.length} candidate(s) found, awaiting admin confirmation - ` +
          sourcedCandidates.map((contact) => `${contact.name} (${contact.title}) <${contact.email}>`).join("; ")
      );

      // Draft generation still requires a confirmed contact, so this stays a
      // no-op until an admin confirms one of the candidates above.
      const withDrafts = await generateDraftsForProvider(withContact, { generatedBy: "batch-script" });

      if (withDrafts) {
        draftsGenerated += 1;
        console.log(`    -> 5 outreach drafts generated.`);
      }

      results.push({
        name: provider.companyName,
        domain: provider.domain,
        candidates: sourcedCandidates,
        draftsGenerated: Boolean(withDrafts),
      });
    } catch (error) {
      consecutiveErrors += 1;
      errors.push({ name: provider.companyName, domain: provider.domain, error: error.message });
      console.error(`[${index + 1}/${targets.length}] ${provider.companyName}: ERROR - ${error.message}`);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`\nAborting after ${MAX_CONSECUTIVE_ERRORS} consecutive errors (likely rate limit or out of credits).`);
        break;
      }
    }

    await sleep(DELAY_MS);
  }

  console.log("\n=== Summary ===");
  console.log(`Contacts sourced: ${contactsSourced}`);
  console.log(`Drafts generated: ${draftsGenerated}`);
  console.log(`No candidates / no email: ${noCandidates}`);
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
