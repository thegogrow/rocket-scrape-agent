const dotenv = require("dotenv");
const { buildOutreachPrompt, primaryContactForProvider } = require("../llm/outreachMessages");
const { listAdminState } = require("../ui/supabaseStore");

dotenv.config();

async function main() {
  const domain = process.argv[2] || "adesso.ch";
  const state = await listAdminState();
  const provider = state.providers.find((item) => item.domain === domain || item.id === domain);

  if (!provider) {
    throw new Error(`Provider not found: ${domain}`);
  }

  const contact = primaryContactForProvider(provider);

  if (!contact) {
    throw new Error(`Provider has no outreach contact: ${domain}`);
  }

  console.log(buildOutreachPrompt(provider, contact));
}

main().catch((error) => {
  console.error(`Failed to preview outreach prompt: ${error.message}`);
  process.exitCode = 1;
});
