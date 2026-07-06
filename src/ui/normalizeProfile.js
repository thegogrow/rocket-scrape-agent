function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeString(value) {
  const text = String(value || "").trim();

  return text || null;
}

function countryFromLocationText(locationText) {
  if (/switzerland|swiss|schweiz|suisse|zurich|zürich|bern|basel|lausanne/i.test(locationText)) {
    return "Switzerland";
  }

  if (/germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|köln|cologne/i.test(locationText)) {
    return "Germany";
  }

  return null;
}

function locationFromProfile(profile = {}, sourceBundle = null) {
  const enrichmentLocation = sourceBundle?.enrichmentData?.location || {};
  const structuredLocation =
    profile.companyLocation && typeof profile.companyLocation === "object"
      ? profile.companyLocation
      : profile.location && typeof profile.location === "object"
        ? profile.location
        : {};
  const legacyLocation = typeof profile.location === "string" ? profile.location : "";
  const legacyParts = legacyLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const locationText = [
    legacyLocation,
    structuredLocation.country,
    structuredLocation.city,
    enrichmentLocation.country,
    enrichmentLocation.state,
    enrichmentLocation.city,
  ]
    .filter(Boolean)
    .join(" ");
  const inferredCountry = countryFromLocationText(locationText);

  return {
    country:
      normalizeString(structuredLocation.country) ||
      normalizeString(profile.country) ||
      normalizeString(enrichmentLocation.country) ||
      inferredCountry,
    city:
      normalizeString(structuredLocation.city || structuredLocation.locality) ||
      normalizeString(profile.city) ||
      normalizeString(enrichmentLocation.city || enrichmentLocation.locality) ||
      normalizeString(legacyParts.length > 1 ? legacyParts.slice(0, -1).join(", ") : legacyParts[0]),
  };
}

function normalizeProfile(profile = {}, options = {}) {
  const sourceBundle = options.sourceBundle || null;
  const companyLocation = locationFromProfile(profile, sourceBundle);
  const rawSubscriptionTier = normalizeString(profile.subscriptionTier || profile.subscription_tier || profile.plan) || "free";
  const subscriptionTier = ["premium", "pro", "paid"].includes(rawSubscriptionTier.toLowerCase()) ? "premium" : "free";

  return {
    ...profile,
    country: companyLocation.country,
    city: companyLocation.city,
    companyLocation,
    services: asArray(profile.services),
    focusAreas: asArray(profile.focusAreas),
    industries: asArray(profile.industries),
    technologies: asArray(profile.technologies),
    vendorPartnerships: asArray(profile.vendorPartnerships),
    successStories: asArray(profile.successStories),
    solutions: asArray(profile.solutions),
    recentActivity: asArray(profile.recentActivity),
    reviewNotes: asArray(profile.reviewNotes),
    files: profile.files || {},
    sourceData: profile.sourceData || {},
    confidenceScore: Number.parseInt(profile.confidenceScore, 10) || 0,
    claimed: Boolean(profile.claimed || profile.claimedAt || profile.verified),
    subscriptionTier,
    isPremium: Boolean(profile.isPremium || profile.premium || subscriptionTier === "premium"),
  };
}

function normalizeProfiles(profiles, options = {}) {
  return asArray(profiles).map((profile) => normalizeProfile(profile, options));
}

module.exports = {
  asArray,
  normalizeProfile,
  normalizeProfiles,
};
