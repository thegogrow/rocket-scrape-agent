const fs = require("fs-extra");
const path = require("path");
const dotenv = require("dotenv");
const {
  isSupabaseConfigured,
  normalizeLifecycleStatus,
  profileToRow,
  supabaseFetch,
} = require("../ui/supabaseStore");

const PUBLIC_PROFILES_PATH = path.resolve(process.cwd(), "public", "profiles.json");
const LOCAL_ENV_PATH = path.resolve(process.cwd(), ".env.local");
const PRESERVED_FIELDS = [
  "status",
  "claimed",
  "subscription_tier",
  "review_notes",
  "scraper_quality_log",
  "activity_log",
];
const PROVIDER_COLUMNS = [
  "domain",
  "country",
  "city",
  "company_name",
  "website",
  "description",
  "services",
  "focus_areas",
  "industries",
  "technologies",
  "vendor_partnerships",
  "success_stories",
  "solutions",
  "location",
  "confidence_score",
  "github_url",
  "linkedin_url",
  "logo_url",
  "claimed",
  "subscription_tier",
  "recent_activity",
  "review_notes",
  "scraper_quality_log",
  "activity_log",
  "files",
  "source_data",
  "status",
];

function hasFlag(name) {
  return process.argv.includes(name);
}

function valueByFlag(name, fallback = null) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg ? arg.slice(prefix.length) : fallback;
}

function loadEnv() {
  dotenv.config();

  if (fs.existsSync(LOCAL_ENV_PATH)) {
    dotenv.config({ path: LOCAL_ENV_PATH, override: true });
  }
}

function uniqueProfilesByDomain(profiles) {
  const byDomain = new Map();

  for (const profile of profiles) {
    const domain = String(profile?.domain || "").trim().toLowerCase();

    if (!domain) {
      continue;
    }

    byDomain.set(domain, { ...profile, domain });
  }

  return [...byDomain.values()];
}

function mergeProfileRow(profile, existingRow) {
  const fallbackStatus = existingRow?.status || profile.status || "approved";
  const row = profileToRow(profile, normalizeLifecycleStatus(fallbackStatus, "approved"));

  if (!existingRow) {
    return stableProviderRow({
      ...row,
      status: normalizeLifecycleStatus(profile.status, "approved"),
    });
  }

  for (const field of PRESERVED_FIELDS) {
    if (existingRow[field] !== undefined) {
      row[field] = existingRow[field];
    }
  }

  // Keep a provider claimed when an admin has already claimed it in Supabase.
  if (existingRow.claimed) {
    row.claimed = true;
  }

  return stableProviderRow(row);
}

function stableProviderRow(row) {
  return Object.fromEntries(
    PROVIDER_COLUMNS.map((column) => [column, row[column] === undefined ? null : row[column]])
  );
}

async function fetchExistingProviderRows() {
  const rows = await supabaseFetch("/rest/v1/providers?select=*&limit=1000");

  return new Map(
    rows
      .filter((row) => row.domain)
      .map((row) => [String(row.domain).trim().toLowerCase(), row])
  );
}

async function upsertRows(rows) {
  const batchSize = 50;
  let synced = 0;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);

    await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(batch),
    });

    synced += batch.length;
    console.log(`Synced ${synced}/${rows.length} provider rows`);
  }
}

async function main() {
  loadEnv();

  const dryRun = hasFlag("--dry-run");
  const profilesPath = path.resolve(process.cwd(), valueByFlag("--profiles", PUBLIC_PROFILES_PATH));

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.local.");
  }

  if (!(await fs.pathExists(profilesPath))) {
    throw new Error(`Profiles file not found: ${profilesPath}`);
  }

  const profiles = uniqueProfilesByDomain(await fs.readJson(profilesPath));
  const existingRows = await fetchExistingProviderRows();
  const rows = profiles.map((profile) => mergeProfileRow(profile, existingRows.get(profile.domain)));
  const newCount = rows.filter((row) => !existingRows.has(row.domain)).length;
  const updateCount = rows.length - newCount;

  console.log(`Profiles file: ${profilesPath}`);
  console.log(`Existing Supabase providers: ${existingRows.size}`);
  console.log(`Profiles to sync: ${rows.length}`);
  console.log(`New providers: ${newCount}`);
  console.log(`Updated providers: ${updateCount}`);
  console.log(`Preserved fields: ${PRESERVED_FIELDS.join(", ")}`);

  if (dryRun) {
    console.log("Dry run complete. No Supabase rows were changed.");
    return;
  }

  await upsertRows(rows);
  console.log("Supabase profile sync complete.");
}

main().catch((error) => {
  console.error(`Failed to sync profiles to Supabase: ${error.message}`);
  process.exitCode = 1;
});
