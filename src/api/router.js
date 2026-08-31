const handlers = {
  "/api/admin-login": require("./admin-login"),
  "/api/admin-activity": require("./admin-activity"),
  "/api/admin-claim-request": require("./admin-claim-request"),
  "/api/admin-export": require("./admin-export"),
  "/api/admin-generate-outreach": require("./admin-generate-outreach"),
  "/api/admin-job": require("./admin-job"),
  "/api/admin-outreach-cycle": require("./admin-outreach-cycle"),
  "/api/admin-provider": require("./admin-provider"),
  "/api/admin-provider-lead": require("./admin-provider-lead"),
  "/api/admin-publish": require("./admin-publish"),
  "/api/admin-readiness": require("./admin-readiness"),
  "/api/admin-refresh": require("./admin-refresh"),
  "/api/admin-run-job": require("./admin-run-job"),
  "/api/admin-scrape": require("./admin-scrape"),
  "/api/admin-state": require("./admin-state"),
  "/api/admin-tags": require("./admin-tags"),
  "/api/admin-tags-normalize": require("./admin-tags-normalize"),
  "/api/claim-request": require("./claim-request"),
  "/api/claim-verify": require("./claim-verify"),
  "/api/logo": require("./logo"),
  "/api/outreach-followup": require("./outreach-followup"),
  "/api/outreach-opt-out": require("./outreach-opt-out"),
  "/api/profile": require("./profile"),
  "/api/profile-edit": require("./profile-edit"),
  "/api/profile-edit-logo": require("./profile-edit-logo"),
  "/api/profile-plan": require("./profile-plan"),
  "/api/profiles": require("./profiles"),
  "/api/provider-lead": require("./provider-lead"),
  "/api/resolve-outreach-link": require("./resolve-outreach-link"),
  "/api/send-outreach": require("./send-outreach"),
  "/api/tags": require("./tags"),
};

function normalizeApiPath(pathname = "") {
  if (pathname.startsWith("/api/profiles/")) {
    return "/api/profile";
  }

  return pathname.replace(/\/$/, "") || "/api/profiles";
}

function apiQueryForPath(pathname = "", searchParams = new URLSearchParams()) {
  const query = Object.fromEntries(searchParams.entries());
  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)\/?$/);

  if (profileMatch && !query.domain) {
    query.domain = decodeURIComponent(profileMatch[1]);
  }

  return query;
}

function apiHandlerForPath(pathname) {
  if (!String(pathname || "").startsWith("/api")) {
    return null;
  }

  return handlers[normalizeApiPath(pathname)] || null;
}

module.exports = {
  apiQueryForPath,
  apiHandlerForPath,
  handlers,
  normalizeApiPath,
};
