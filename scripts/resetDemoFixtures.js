// Wipes the "Demo Test 1"-"Demo Test 5" fixture providers (created
// 2026-08-20 to rehearse the claim/outreach flow - see docs/weekly-plan.md
// Week 12/13's "Demo Test 2" references) and replaces them with a single,
// clean "Demo Test" fixture in the same unclaimed, published state a real
// scraped provider starts in - so there's one fixture to rehearse the full
// claim flow against instead of five accumulated, partially-claimed ones.
// Run with: node scripts/resetDemoFixtures.js
require("dotenv").config();

const { deleteProvider, supabaseFetch, upsertProvider } = require("../src/ui/supabaseStore");

const DEMO_DOMAIN_PATTERN = /^demo-test-\d+\.example\.com$/;
const NEW_DEMO_DOMAIN = "demo-test.example.com";

async function main() {
  const rows = await supabaseFetch("/rest/v1/providers?select=id,domain,company_name");
  const demoProviders = rows.filter((row) => DEMO_DOMAIN_PATTERN.test(row.domain || ""));

  console.log(`Found ${demoProviders.length} demo fixture provider(s) to remove:`);
  demoProviders.forEach((row) => console.log(`  - ${row.company_name} (${row.domain})`));

  for (const row of demoProviders) {
    await deleteProvider(row.id);
    console.log(`Deleted ${row.company_name} (${row.domain})`);
  }

  const provider = await upsertProvider(
    {
      domain: NEW_DEMO_DOMAIN,
      companyName: "Demo Test",
      website: `https://${NEW_DEMO_DOMAIN}`,
      country: "Switzerland",
      city: "Zurich",
      description: "Fixture provider for rehearsing the claim, verification, and self-serve editing flows end to end.",
      services: ["Cloud Native Trainings", "Platform Engineering"],
      technologies: ["Kubernetes", "GitLab CI/CD"],
      industries: ["Software & Technology"],
      claimed: false,
      confidenceScore: 90,
    },
    "published"
  );

  console.log(`\nCreated new demo fixture: ${provider.companyName} (${provider.domain}), id=${provider.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
