const { getOperationalReadiness } = require("../ui/supabaseStore");

async function main() {
  const readiness = await getOperationalReadiness();
  const warnings = readiness.warnings || [];

  console.log(`Sprint 2 readiness: ${readiness.ok ? "OK" : "Needs attention"}`);
  console.log(`Schema: ${readiness.schema?.ok ? "OK" : "Needs attention"}`);
  console.log(`Deployment: ${readiness.deployment?.ok ? "OK" : "Needs attention"}`);

  if (warnings.length) {
    console.log("");
    for (const warning of warnings) {
      console.log(`[${warning.severity}] ${warning.title}`);
      if (warning.detail) {
        console.log(`  ${warning.detail}`);
      }
    }
  }

  process.exitCode = readiness.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(`Readiness check failed: ${error.message}`);
  process.exitCode = 1;
});
