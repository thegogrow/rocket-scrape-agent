// Backfills providers.company_size via Apollo company enrichment for
// providers scraped before that column existed (added Week 11 - see
// docs/weekly-plan.md Week 13+ item 6). Company-level enrichment doesn't
// cost per-contact Apollo credits, unlike sourceOutreachContacts.js.
// Run with: node scripts/backfillCompanySize.js [--limit=N]
require("dotenv").config();

const { enrichCompany } = require("../src/enrichment/apollo");
const { listAdminState, updateProvider } = require("../src/ui/supabaseStore");

const DELAY_MS = 300;
const MAX_CONSECUTIVE_ERRORS = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null;

  const state = await listAdminState();
  let targets = state.providers.filter((provider) => !provider.companySize);
  console.log(`${targets.length} providers missing company_size.`);

  if (limit) {
    targets = targets.slice(0, limit);
    console.log(`Limiting this run to the first ${targets.length}.\n`);
  } else {
    console.log("");
  }

  let updated = 0;
  let noData = 0;
  let consecutiveErrors = 0;
  const errors = [];

  for (const [index, provider] of targets.entries()) {
    try {
      const enrichment = await enrichCompany({
        companyName: provider.companyName,
        website: provider.website || `https://${provider.domain}`,
      });
      consecutiveErrors = 0;

      if (!enrichment?.companySize) {
        noData += 1;
        console.log(`[${index + 1}/${targets.length}] ${provider.companyName}: no Apollo company-size data found.`);
        await sleep(DELAY_MS);
        continue;
      }

      const patch = { companySize: enrichment.companySize };

      // Don't clobber a linkedinUrl someone already corrected by hand -
      // only fill it if the provider doesn't have one yet.
      if (enrichment.linkedinUrl && !provider.linkedinUrl) {
        patch.linkedinUrl = enrichment.linkedinUrl;
      }

      await updateProvider(provider.id, patch, provider.status);
      updated += 1;
      console.log(`[${index + 1}/${targets.length}] ${provider.companyName}: company_size=${patch.companySize}`);
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
  console.log(`Updated: ${updated}`);
  console.log(`No data found: ${noData}`);
  console.log(`Errors: ${errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
