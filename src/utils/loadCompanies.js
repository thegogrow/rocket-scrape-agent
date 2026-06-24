const fs = require("fs-extra");
const path = require("path");
const { isValidHttpUrl } = require("./url");

const COMPANY_URLS_FILE = path.resolve(process.cwd(), "data", "company-urls.json");

async function loadCompanies() {
  const raw = await fs.readJson(COMPANY_URLS_FILE);

  if (!Array.isArray(raw)) {
    throw new Error("company-urls.json must contain an array of URLs");
  }

  return raw
    .filter((value) => {
      const valid = isValidHttpUrl(value);

      if (!valid) {
        console.warn(`[companies] Skipping invalid URL: ${String(value)}`);
      }

      return valid;
    })
    .map((value) => value.trim());
}

module.exports = {
  loadCompanies,
  isValidUrl: isValidHttpUrl,
};
