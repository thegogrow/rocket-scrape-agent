function isValidHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function normalizeInputUrls(input) {
  const values = Array.isArray(input) ? input : [input];

  return values
    .filter((value) => isValidHttpUrl(value))
    .map((value) => value.trim());
}

function getDomainFromUrl(url) {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");

  return (
    hostname
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/\.+/g, ".")
      .replace(/-+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "") || "unknown-company"
  );
}

function getRootDomainLabel(url) {
  const domain = getDomainFromUrl(url);
  const [label] = domain.split(".");

  return label || domain;
}

function guessCompanyNameFromUrl(url) {
  return getRootDomainLabel(url)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

module.exports = {
  isValidHttpUrl,
  normalizeInputUrls,
  getDomainFromUrl,
  getRootDomainLabel,
  guessCompanyNameFromUrl,
};
