const state = {
  activeSection: "dashboard",
  activityEvents: [],
  claimRequests: [],
  outreachSelection: new Set(),
  jobs: [],
  metrics: {},
  providerLeads: [],
  providers: [],
  readiness: null,
  tags: [],
  sidebarCollapsed: window.localStorage.getItem("rocketEngineersAdminSidebar") === "collapsed",
  jobsPage: 1,
  jobsPageSize: 10,
  reviewPage: 1,
  reviewPageSize: 10,
  publishedPage: 1,
  publishedPageSize: 20,
  publishedFilters: {
    name: "",
    status: "",
    selfEdited: false,
  },
  publishedSortField: "name",
  publishedSortDirection: "asc",
  selectedProviders: new Set(),
  visibleReviewKeys: [],
  visiblePublishedKeys: [],
  allReviewKeys: [],
  allPublishedKeys: [],
  selectionMode: {
    review: false,
    published: false,
  },
  tagFilters: {
    search: "",
    category: "",
    status: "",
  },
  activityFilters: {
    search: "",
    group: "",
    sort: "desc",
  },
  outreachFilters: {
    search: "",
    status: "",
  },
  showSampleRequests: false,
};

const SVG_LOGO_DOMAINS = new Set([
  "2ndwatch.com",
  "adesso.de",
  "andrena.de",
  "b1-systems.de",
  "bespinian.io",
  "cloud303.io",
  "codurance.com",
  "innoq.com",
  "isolutions.ch",
  "kreuzwerker.de",
  "maibornwolff.de",
  "novatec-gmbh.de",
  "opsguru.com",
  "redguard.ch",
  "terreactive.ch",
  "viadee.de",
]);

const INDUSTRY_RULES = [
  { name: "Banking & Financial Services", match: ["bank", "finance", "financial", "fintech", "insurance", "wealth", "payment", "finanz", "versicherung", "wertpapier", "zahlungsverkehr"] },
  { name: "Healthcare & Life Sciences", match: ["health", "healthcare", "hospital", "medical", "medtech", "pharma", "life science"] },
  { name: "Public Sector & Government", match: ["public sector", "government", "municipal", "administration", "education", "university"] },
  { name: "Retail & E-commerce", match: ["retail", "commerce", "ecommerce", "e-commerce", "shop", "consumer goods"] },
  { name: "Manufacturing & Industrial", match: ["manufacturing", "industrial", "industrie", "industry 4.0", "factory", "machinery", "automotive"] },
  { name: "Telecommunications & Media", match: ["telecom", "telecommunication", "media", "broadcast", "publisher", "entertainment"] },
  { name: "Energy & Utilities", match: ["energy", "utility", "utilities", "renewable", "power", "electricity"] },
  { name: "Transportation & Logistics", match: ["transport", "logistics", "mobility", "rail", "aviation", "luftfahrt", "shipping"] },
  { name: "Software & Technology", match: ["software", "technology", "tech", "saas", "platform", "cloud provider", "it"] },
];

const DEFAULT_INDUSTRY_FILTERS = new Set(INDUSTRY_RULES.map((rule) => rule.name));
const LIFECYCLE_STATUSES = new Set([
  "scraped",
  "in_review",
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
  "removal_requested",
  "removed",
]);
const ADMIN_SECTIONS = new Set([
  "dashboard",
  "scrape",
  "review",
  "outreach",
  "data-quality",
  "tags",
  "requests",
  "metrics",
  "published",
]);
const LIVE_PROFILE_STATUSES = new Set([
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
]);
const CONFIDENCE_GUARDRAIL_SCORE = 75;
const ACTIVITY_GROUPS = [
  { key: "review", label: "Profile Review", test: (type) => type.startsWith("profile_") || type === "reviewer_feedback" },
  { key: "outreach", label: "Outreach", test: (type) => type.startsWith("outreach_") },
  { key: "content", label: "Success Stories", test: (type) => type.startsWith("success_story_") },
  { key: "events", label: "Events", test: (type) => type.startsWith("provider_event_") },
  { key: "signals", label: "Market Signals", test: (type) => type.startsWith("market_signal_") },
  { key: "claims", label: "Claims & Removals", test: (type) => type === "claim_requested" || type === "removal_requested" },
  { key: "owner_edits", label: "Owner Edits", test: (type) => type === "provider_self_edited" },
  { key: "leads", label: "Leads", test: (type) => type === "lead_submitted" },
];

function activityGroupForType(type = "") {
  return ACTIVITY_GROUPS.find((group) => group.test(type)) || { key: "other", label: "Other" };
}
const PROVIDER_EVENT_STATUSES = new Set(["suggested", "approved", "expired", "archived"]);
const MARKET_SIGNAL_TYPES = new Set(["hiring", "news", "leadership", "tender", "technology", "partnership"]);
const MARKET_SIGNAL_STATUSES = new Set(["scraped", "reviewed", "approved", "archived"]);
const REVIEW_PROFILE_STATUSES = new Set([
  "scraped",
  "in_review",
  "removal_requested",
]);
const OUTREACH_MESSAGE_STEPS = [
  { messageStep: "email_1", channel: "email", label: "Email 1" },
  { messageStep: "email_2", channel: "email", label: "Email 2" },
  { messageStep: "email_3", channel: "email", label: "Email 3" },
  { messageStep: "linkedin_message", channel: "linkedin", label: "LinkedIn" },
  { messageStep: "claim_profile_invitation", channel: "claim_invite", label: "Claim Invite" },
];
const OUTREACH_MESSAGE_STATUSES = new Set(["draft", "approved", "sent", "opened", "clicked", "replied"]);
const GENERIC_INDUSTRIES = new Set([
  "cloud",
  "cloud computing",
  "consulting",
  "devops",
  "digital transformation",
  "information technology",
  "it",
  "it services",
  "managed services",
  "software development",
  "technology",
]);

const GENERIC_INDUSTRY_KEYWORDS = [
  "agile",
  "ai",
  "application",
  "automation",
  "aws",
  "cloud",
  "code",
  "compliance",
  "container",
  "cyber",
  "data",
  "devops",
  "engineering",
  "hosting",
  "infrastructure",
  "integration",
  "kubernetes",
  "legacy",
  "linux",
  "management",
  "modernisation",
  "modernization",
  "mlops",
  "open source",
  "platform",
  "product",
  "security",
  "serverless",
  "sovereign",
  "strategy",
  "transformation",
  "web",
];

const elements = {
  loginScreen: document.querySelector("#adminLoginScreen"),
  loginForm: document.querySelector("#adminLoginForm"),
  email: document.querySelector("#adminEmail"),
  password: document.querySelector("#adminPassword"),
  loginMessage: document.querySelector("#adminLoginMessage"),
  app: document.querySelector("#adminApp"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  signedInAs: document.querySelector("#adminSignedInAs"),
  refreshButton: document.querySelector("#adminRefreshButton"),
  signOutButton: document.querySelector("#adminSignOutButton"),
  setupNotice: document.querySelector("#adminSetupNotice"),
  readinessWarnings: document.querySelector("#adminReadinessWarnings"),
  navButtons: document.querySelectorAll("[data-admin-section]"),
  panels: document.querySelectorAll("[data-admin-panel]"),
  queuedCount: document.querySelector("#queuedCount"),
  reviewCount: document.querySelector("#reviewCount"),
  publishedCount: document.querySelector("#publishedCount"),
  failedCount: document.querySelector("#failedCount"),
  outreachDraftCount: document.querySelector("#outreachDraftCount"),
  requestCount: document.querySelector("#requestCount"),
  dashboardReviewList: document.querySelector("#dashboardReviewList"),
  dashboardJobList: document.querySelector("#dashboardJobList"),
  dashboardOutreachList: document.querySelector("#dashboardOutreachList"),
  dashboardRequestList: document.querySelector("#dashboardRequestList"),
  scrapeForm: document.querySelector("#scrapeForm"),
  scrapeUrl: document.querySelector("#scrapeUrl"),
  scrapeCompanyName: document.querySelector("#scrapeCompanyName"),
  scrapeMessage: document.querySelector("#scrapeMessage"),
  jobList: document.querySelector("#jobList"),
  jobsPrevButton: document.querySelector("#jobsPrevButton"),
  jobsNextButton: document.querySelector("#jobsNextButton"),
  jobsPageInfo: document.querySelector("#jobsPageInfo"),
  jobsPageNumbers: document.querySelector("#jobsPageNumbers"),
  reviewProviderList: document.querySelector("#reviewProviderList"),
  reviewSelectModeButton: document.querySelector("#reviewSelectModeButton"),
  reviewBulkActionBar: document.querySelector("#reviewBulkActionBar"),
  reviewSelectPage: document.querySelector("#reviewSelectPage"),
  reviewBulkAction: document.querySelector("#reviewBulkAction"),
  reviewBulkApply: document.querySelector("#reviewBulkApply"),
  reviewBulkCount: document.querySelector("#reviewBulkCount"),
  reviewPrevButton: document.querySelector("#reviewPrevButton"),
  reviewNextButton: document.querySelector("#reviewNextButton"),
  reviewPageInfo: document.querySelector("#reviewPageInfo"),
  reviewPageNumbers: document.querySelector("#reviewPageNumbers"),
  publishedFilters: document.querySelector("#publishedFilters"),
  publishedNameFilter: document.querySelector("#publishedNameFilter"),
  publishedStatusFilter: document.querySelector("#publishedStatusFilter"),
  publishedSortFilter: document.querySelector("#publishedSortFilter"),
  publishedSelfEditedFilter: document.querySelector("#publishedSelfEditedFilter"),
  publishedFlipButton: document.querySelector("#publishedFlipButton"),
  publishedSelectModeButton: document.querySelector("#publishedSelectModeButton"),
  publishedBulkActionBar: document.querySelector("#publishedBulkActionBar"),
  publishedSelectPage: document.querySelector("#publishedSelectPage"),
  publishedBulkAction: document.querySelector("#publishedBulkAction"),
  publishedBulkApply: document.querySelector("#publishedBulkApply"),
  publishedBulkCount: document.querySelector("#publishedBulkCount"),
  publishedProviderList: document.querySelector("#publishedProviderList"),
  outreachSummaryGrid: document.querySelector("#outreachSummaryGrid"),
  outreachSearchFilter: document.querySelector("#outreachSearchFilter"),
  outreachStatusFilter: document.querySelector("#outreachStatusFilter"),
  outreachProviderList: document.querySelector("#outreachProviderList"),
  outreachBulkBar: document.querySelector("#outreachBulkBar"),
  outreachBulkCount: document.querySelector("#outreachBulkCount"),
  outreachBulkSend: document.querySelector("#outreachBulkSend"),
  outreachBulkClear: document.querySelector("#outreachBulkClear"),
  missingDataList: document.querySelector("#missingDataList"),
  claimRequestList: document.querySelector("#claimRequestList"),
  providerLeadList: document.querySelector("#providerLeadList"),
  metricsSummary: document.querySelector("#metricsSummary"),
  profileStatusMetrics: document.querySelector("#profileStatusMetrics"),
  outreachSignalMetrics: document.querySelector("#outreachSignalMetrics"),
  activityTimeline: document.querySelector("#activityTimeline"),
  activitySearchFilter: document.querySelector("#activitySearchFilter"),
  activityGroupFilter: document.querySelector("#activityGroupFilter"),
  activitySortButton: document.querySelector("#activitySortButton"),
  tagApproveVisibleButton: document.querySelector("#tagApproveVisibleButton"),
  tagSummary: document.querySelector("#tagSummary"),
  tagSearchFilter: document.querySelector("#tagSearchFilter"),
  tagCategoryFilter: document.querySelector("#tagCategoryFilter"),
  tagStatusFilter: document.querySelector("#tagStatusFilter"),
  tagList: document.querySelector("#tagList"),
  requestsSampleToggle: document.querySelector("#requestsSampleToggle"),
  requestsSampleNotice: document.querySelector("#requestsSampleNotice"),
  exportFromFilter: document.querySelector("#exportFromFilter"),
  exportToFilter: document.querySelector("#exportToFilter"),
  publishedPrevButton: document.querySelector("#publishedPrevButton"),
  publishedNextButton: document.querySelector("#publishedNextButton"),
  publishedPageInfo: document.querySelector("#publishedPageInfo"),
  publishedPageNumbers: document.querySelector("#publishedPageNumbers"),
  profileEditDialog: document.querySelector("#profileEditDialog"),
  profileEditForm: document.querySelector("#profileEditForm"),
  profileEditClose: document.querySelector("#profileEditClose"),
  emailPreviewDialog: document.querySelector("#emailPreviewDialog"),
  emailPreviewClose: document.querySelector("#emailPreviewClose"),
  emailPreviewFrom: document.querySelector("#emailPreviewFrom"),
  emailPreviewTo: document.querySelector("#emailPreviewTo"),
  emailPreviewSubject: document.querySelector("#emailPreviewSubject"),
  emailPreviewBody: document.querySelector("#emailPreviewBody"),
  outreachComposeDialog: document.querySelector("#outreachComposeDialog"),
  outreachComposeClose: document.querySelector("#outreachComposeClose"),
  outreachComposeKey: document.querySelector("#outreachComposeKey"),
  outreachComposeLogo: document.querySelector("#outreachComposeLogo"),
  outreachComposeCompanyName: document.querySelector("#outreachComposeCompanyName"),
  outreachComposeDomain: document.querySelector("#outreachComposeDomain"),
  outreachComposeCycle: document.querySelector("#outreachComposeCycle"),
  outreachComposeMessages: document.querySelector("#outreachComposeMessages"),
  profileEditPreviewAccessLink: document.querySelector("#profileEditPreviewAccessLink"),
  profileEditKey: document.querySelector("#profileEditKey"),
  profileEditName: document.querySelector("#profileEditName"),
  profileEditLogo: document.querySelector("#profileEditLogo"),
  profileEditWebsite: document.querySelector("#profileEditWebsite"),
  profileEditCountry: document.querySelector("#profileEditCountry"),
  profileEditCity: document.querySelector("#profileEditCity"),
  profileEditStatus: document.querySelector("#profileEditStatus"),
  profileEditGuardrailNotice: document.querySelector("#profileEditGuardrailNotice"),
  profileEditClaimed: document.querySelector("#profileEditClaimed"),
  profileEditSubscriptionTier: document.querySelector("#profileEditSubscriptionTier"),
  profileEditServices: document.querySelector("#profileEditServices"),
  profileEditIndustries: document.querySelector("#profileEditIndustries"),
  profileEditTechnologies: document.querySelector("#profileEditTechnologies"),
  profileEditPartnerships: document.querySelector("#profileEditPartnerships"),
  profileEditSuccessStories: document.querySelector("#profileEditSuccessStories"),
  profileEditAddSuccessStory: document.querySelector("#profileEditAddSuccessStory"),
  profileEditManagedSuccessStories: document.querySelector("#profileEditManagedSuccessStories"),
  profileEditAddManagedSuccessStory: document.querySelector("#profileEditAddManagedSuccessStory"),
  profileEditSolutions: document.querySelector("#profileEditSolutions"),
  profileEditAddSolution: document.querySelector("#profileEditAddSolution"),
  profileEditActivities: document.querySelector("#profileEditActivities"),
  profileEditManagedEvents: document.querySelector("#profileEditManagedEvents"),
  profileEditAddManagedEvent: document.querySelector("#profileEditAddManagedEvent"),
  profileEditManagedSignals: document.querySelector("#profileEditManagedSignals"),
  profileEditAddManagedSignal: document.querySelector("#profileEditAddManagedSignal"),
  profileEditOutreachContacts: document.querySelector("#profileEditOutreachContacts"),
  profileEditAddOutreachContact: document.querySelector("#profileEditAddOutreachContact"),
  profileEditOutreachMessages: document.querySelector("#profileEditOutreachMessages"),
  profileEditGenerateOutreach: document.querySelector("#profileEditGenerateOutreach"),
  profileEditApproveAllOutreach: document.querySelector("#profileEditApproveAllOutreach"),
  profileEditNotes: document.querySelector("#profileEditNotes"),
  profileEditQualityMissing: document.querySelector("#profileEditQualityMissing"),
  profileEditQualityIncorrect: document.querySelector("#profileEditQualityIncorrect"),
  profileEditQualityAdded: document.querySelector("#profileEditQualityAdded"),
  profileEditQualityNotes: document.querySelector("#profileEditQualityNotes"),
  profileEditQualityFeedbackUp: document.querySelector("#profileEditQualityFeedbackUp"),
  profileEditQualityFeedbackDown: document.querySelector("#profileEditQualityFeedbackDown"),
  profileEditActivityLog: document.querySelector("#profileEditActivityLog"),
  profileEditMessage: document.querySelector("#profileEditMessage"),
  toastRegion: document.querySelector("#adminToastRegion"),
};

let toastCounter = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminToken() {
  return window.localStorage.getItem("rocketEngineersAdminToken");
}

function adminRefreshToken() {
  return window.localStorage.getItem("rocketEngineersAdminRefreshToken");
}

function adminEmail() {
  return window.localStorage.getItem("rocketEngineersAdminEmail");
}

function setAdminSession(session) {
  window.localStorage.setItem("rocketEngineersAdminToken", session.accessToken);
  window.localStorage.setItem("rocketEngineersAdminRefreshToken", session.refreshToken || "");
  window.localStorage.setItem("rocketEngineersAdminEmail", session.email);
}

function clearAdminSession() {
  window.localStorage.removeItem("rocketEngineersAdminToken");
  window.localStorage.removeItem("rocketEngineersAdminRefreshToken");
  window.localStorage.removeItem("rocketEngineersAdminEmail");
}

function isSignedIn() {
  return Boolean(adminToken() && adminEmail());
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${adminToken()}`,
    "Content-Type": "application/json",
  };
}

// The admin access token is short-lived by design (normal Supabase behavior,
// not a bug) - it's meant to be silently swapped for a new one using the
// refresh token, rather than making the admin re-enter a password every time
// it expires. This dedupes concurrent refresh attempts (several requests can
// 401 around the same moment) so only one refresh call ever goes out at once.
let pendingRefresh = null;

async function refreshAdminToken() {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    const refreshToken = adminRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await nativeFetch("/api/admin-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const session = await response.json();
      setAdminSession(session);
      return true;
    } catch (error) {
      return false;
    }
  })();

  try {
    return await pendingRefresh;
  } finally {
    pendingRefresh = null;
  }
}

function handleExpiredSession() {
  if (!isSignedIn()) {
    return;
  }

  clearAdminSession();
  showShell();
  elements.loginMessage.textContent = "Your session expired - please sign in again.";
  elements.loginMessage.classList.add("error");
}

const nativeFetch = window.fetch.bind(window);

// Any admin API call that comes back 401 gets one silent refresh-and-retry
// attempt before giving up - only a genuinely dead/revoked refresh token (or
// no refresh token at all, e.g. a session from before this existed) actually
// drops the admin back to the login screen now.
window.fetch = async function adminSessionAwareFetch(input, init) {
  const response = await nativeFetch(input, init);
  const url = typeof input === "string" ? input : input?.url || "";
  const isAdminApiCall = url.startsWith("/api/") && !url.startsWith("/api/admin-login") && !url.startsWith("/api/admin-refresh");

  if (response.status !== 401 || !isAdminApiCall) {
    return response;
  }

  const refreshed = await refreshAdminToken();

  if (!refreshed) {
    handleExpiredSession();
    return response;
  }

  const retryInit = init && init.headers && "Authorization" in init.headers
    ? { ...init, headers: { ...init.headers, Authorization: `Bearer ${adminToken()}` } }
    : init;

  return nativeFetch(input, retryInit);
};

function normalizeWebsiteInput(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

function showShell() {
  const signedIn = isSignedIn();

  elements.loginScreen.hidden = signedIn;
  elements.app.hidden = !signedIn;
  elements.app.classList.toggle("sidebarCollapsed", state.sidebarCollapsed);
  elements.sidebarToggle.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
  elements.sidebarToggle.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
  );
  elements.signedInAs.textContent = adminEmail() || "";
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  window.localStorage.setItem(
    "rocketEngineersAdminSidebar",
    state.sidebarCollapsed ? "collapsed" : "expanded"
  );
  showShell();
}

function sectionFromHash() {
  const section = window.location.hash.replace("#", "");

  return ADMIN_SECTIONS.has(section) ? section : "dashboard";
}

function setSection(section, options = {}) {
  const nextSection = ADMIN_SECTIONS.has(section) ? section : "dashboard";
  state.activeSection = nextSection;

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === nextSection);
  });

  elements.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === nextSection);
  });

  if (options.updateHash && window.location.hash !== `#${nextSection}`) {
    window.history.pushState({ adminSection: nextSection }, "", `#${nextSection}`);
  }
}

function statusPill(status) {
  const normalizedStatus = normalizeLifecycleStatus(status);
  const label = String(normalizedStatus)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return `<span class="statusPill statusPill-${escapeHtml(normalizedStatus)}">${escapeHtml(label)}</span>`;
}

function normalizeLifecycleStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "published") return "approved";
  if (value === "draft" || value === "needs_review") return "scraped";
  if (value === "archived") return "removed";

  return LIFECYCLE_STATUSES.has(value) ? value : "approved";
}

function lifecycleStatusForProvider(provider = {}) {
  const explicitStatus = normalizeLifecycleStatus(provider.status);

  if (explicitStatus === "removed" || explicitStatus === "removal_requested") {
    return explicitStatus;
  }

  if (provider.claimed) {
    return "claimed";
  }

  return explicitStatus;
}

function confidenceScoreForProvider(provider = {}) {
  const rawScore = provider.confidenceScore ?? provider.confidence_score;
  const score = Number.parseInt(rawScore, 10);

  return Number.isFinite(score) ? score : 0;
}

function isBelowConfidenceGuardrail(provider = {}) {
  return confidenceScoreForProvider(provider) < CONFIDENCE_GUARDRAIL_SCORE;
}

function isLiveProvider(provider = {}) {
  return LIVE_PROFILE_STATUSES.has(lifecycleStatusForProvider(provider));
}

function isReviewProvider(provider = {}) {
  return REVIEW_PROFILE_STATUSES.has(lifecycleStatusForProvider(provider));
}

function emptyState(label) {
  return `<div class="emptyResults">${escapeHtml(label)}</div>`;
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function showToast(message, type = "success") {
  if (!elements.toastRegion) {
    return;
  }

  const toastId = `adminToast-${toastCounter += 1}`;
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `adminToast adminToast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Dismiss notification">x</button>
  `;
  elements.toastRegion.appendChild(toast);

  const dismiss = () => {
    toast.classList.add("dismiss");
    window.setTimeout(() => toast.remove(), 180);
  };

  toast.querySelector("button").addEventListener("click", dismiss);
  window.setTimeout(dismiss, type === "error" ? 6500 : 4200);
}

function setBusy(button, busy, label) {
  document.body.classList.toggle("adminBusy", busy);

  if (!button) {
    return;
  }

  if (busy) {
    button.dataset.originalText = button.textContent.trim();
    button.disabled = true;
    button.classList.add("isLoading");

    if (label) {
      button.dataset.loadingLabel = label;
    }
  } else {
    button.disabled = false;
    button.classList.remove("isLoading");
    delete button.dataset.loadingLabel;
  }
}

async function runAdminAction(button, loadingLabel, successMessage, action) {
  setBusy(button, true, loadingLabel);

  try {
    const result = await action();

    if (successMessage && result !== false && !result?.cancelled) {
      showToast(successMessage);
    }

    return result;
  } catch (error) {
    showToast(error.message || "Admin action failed.", "error");
    return null;
  } finally {
    setBusy(button, false);
  }
}

function tableHeader(columns) {
  return `
    <div class="adminTableHeader">
      ${columns.map((column) => `<span>${escapeHtml(column)}</span>`).join("")}
    </div>
  `;
}

function initials(profile) {
  return String(profile.companyName || profile.domain || "?")
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function logoUrlForProvider(provider) {
  return provider.logoUrl;
}

function providerLogo(provider) {
  const label = escapeHtml(provider.companyName || provider.domain || "Provider");
  const fallback = escapeHtml(initials(provider));
  const logoUrl = logoUrlForProvider(provider);

  if (!logoUrl) {
    return `<span class="adminProviderLogo" aria-label="${label}">${fallback}</span>`;
  }

  return `
    <span class="adminProviderLogo">
      <img src="${escapeHtml(logoUrl)}" alt="${label} logo" onerror="this.parentElement.textContent='${fallback}'" />
    </span>
  `;
}

function actionButton(kind, label, attrs = "") {
  const icons = {
    process: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>`,
    recrawl: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18.4 9A7 7 0 0 0 6.2 6.8L4 9" /><path d="M5.6 15a7 7 0 0 0 12.2 2.2L20 15" /></svg>`,
    edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>`,
    unpublish: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5V5Z" /><path d="m8 8 8 8M16 8l-8 8" /></svg>`,
    delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12" /><path d="M9 7V5h6v2" /><path d="M8 10v9h8v-9" /></svg>`,
    profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>`,
    publish: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 16.4-4.2-4.2 1.4-1.4 2.8 2.8 7.8-7.8 1.4 1.4-9.2 9.2Z" /></svg>`,
  };

  return `<button class="secondaryAction compactAction iconButtonText" type="button" ${attrs}>${icons[kind] || ""}<span>${escapeHtml(label)}</span></button>`;
}

function actionLink(kind, label, href, attrs = "") {
  const icon = kind === "profile"
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>`
    : kind === "access"
      ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M18 14v6H4V6h6" /></svg>`
      : "";

  return `<a class="secondaryAction compactAction iconButtonText" href="${escapeHtml(href)}" ${attrs}>${icon}<span>${escapeHtml(label)}</span></a>`;
}

// Standard action-cell renderer used across every admin table (Provider Review,
// Missing Data, Tags, Requests, Live Providers, ...). Actions are always passed
// in the same priority order so the same action never jumps position between
// pages; only the first 2 that fit stay visible, the rest collapse into "More".
function renderActionCell(actions = []) {
  const items = actions.filter(Boolean);

  if (items.length <= 3) {
    return `<div class="adminPublishedActions">${items.join("")}</div>`;
  }

  const primary = items.slice(0, 2);
  const overflow = items.slice(2);

  return `
    <div class="adminPublishedActions">
      ${primary.join("")}
      <details class="adminActionMenu">
        <summary aria-label="More actions">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" /></svg>
          <span>More</span>
        </summary>
        <div class="adminActionMenuPanel">${overflow.join("")}</div>
      </details>
    </div>
  `;
}

// Same shape as renderActionCell but keeps only 1 item primary instead of 2 -
// the Outreach Queue row always leads with a single, priority-ordered action
// (Send / Mark Replied / Edit Drafts), with everything else under "More".
function renderOutreachActionCell(actions = []) {
  const items = actions.filter(Boolean);

  if (items.length <= 1) {
    return `<div class="adminPublishedActions">${items.join("")}</div>`;
  }

  const primary = items.slice(0, 1);
  const overflow = items.slice(1);

  return `
    <div class="adminPublishedActions">
      ${primary.join("")}
      <details class="adminActionMenu">
        <summary aria-label="More actions">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" /></svg>
          <span>More</span>
        </summary>
        <div class="adminActionMenuPanel">${overflow.join("")}</div>
      </details>
    </div>
  `;
}

// Fixed priority order for provider-row actions. Whether an action shows up as
// a visible button or inside "More" depends only on how many higher-priority
// actions are present in that row - never on which page it's rendered on.
const PROVIDER_ACTION_ORDER = ["edit", "publish", "profile", "outreach", "recrawl", "unpublish", "delete"];

function providerActions(provider, options = {}) {
  const {
    includeEdit = false,
    includeDelete = false,
    includePublish = false,
    includeManage = false,
    includeProfile = true,
    includeRecrawl = true,
    includeUnpublish = includeManage,
    includeOutreach = true,
  } = options;
  const key = escapeHtml(provider.id || provider.domain || "");

  const actionsByKind = {
    edit: includeEdit ? actionButton("edit", "Edit", `data-edit-provider="${key}"`) : "",
    publish: includePublish && provider.id ? actionButton("publish", "Publish", `data-publish-provider="${escapeHtml(provider.id)}"`) : "",
    profile: includeProfile && provider.domain ? actionLink("profile", "Profile", `/?provider=${encodeURIComponent(provider.domain)}`, 'target="_blank" rel="noopener"') : "",
    outreach: includeOutreach && provider.domain ? actionLink("access", "Outreach Page", providerAccessUrlForProvider(provider), 'target="_blank" rel="noopener"') : "",
    recrawl: includeRecrawl ? actionButton("recrawl", "Recrawl", `data-recrawl-provider="${key}"`) : "",
    unpublish: includeUnpublish ? actionButton("unpublish", "Unpublish", `data-unpublish-provider="${key}"`) : "",
    delete: includeDelete ? actionButton("delete", "Delete", `data-delete-provider="${key}"`) : "",
  };

  return renderActionCell(PROVIDER_ACTION_ORDER.map((kind) => actionsByKind[kind]));
}

function providerRow(provider, options = {}) {
  const { includeAction = false, compact = false } = options;
  const key = providerKey(provider);
  const checked = state.selectedProviders.has(key) ? " checked" : "";
  const attentionClass = isBelowConfidenceGuardrail(provider) ? " adminLowConfidenceRow" : "";
  const action = providerActions(provider, {
    includeDelete: includeAction || compact,
    includeEdit: includeAction || compact,
    includePublish: includeAction,
    includeManage: compact,
    includeProfile: compact,
    includeOutreach: compact,
  });

  return `
    <article class="adminTableRow ${compact ? "adminPublishedRow" : "adminReviewRow"}${attentionClass}">
      <div class="adminCell adminSelectCell">
        <input type="checkbox" data-select-provider="${escapeHtml(key)}"${checked} aria-label="Select ${escapeHtml(provider.companyName || provider.domain || "provider")}" />
      </div>
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain)}</strong>
            <span title="${escapeHtml(provider.domain || provider.website || "")}">${escapeHtml(provider.domain || provider.website || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml([provider.companyLocation?.city || provider.city, provider.companyLocation?.country || provider.country].filter(Boolean).join(", ") || provider.location || "Unknown")}</span></div>
      <div class="adminCell">${statusPill(lifecycleStatusForProvider(provider))}${selfEditedBadge(provider)}</div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
      <div class="adminCell adminCellAction">${action}</div>
    </article>
  `;
}

function compactProviderRow(provider) {
  const attentionClass = isBelowConfidenceGuardrail(provider) ? " adminLowConfidenceRow" : "";

  return `
    <article class="adminTableRow adminReviewRow adminCompactRow adminDashboardProviderRow${attentionClass}">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain)}</strong>
            <span>${escapeHtml(provider.domain || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell">${statusPill(lifecycleStatusForProvider(provider))}</div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
    </article>
  `;
}

function providerAddedDate(provider) {
  const rawDate = provider.createdAt || provider.created_at || provider.addedAt || provider.added_at || provider.updatedAt || provider.updated_at;
  const date = rawDate ? new Date(rawDate) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
}

// Week 12: self-serve edits from the claim link publish immediately with no
// admin approval step, so this is the after-the-fact spot-check surface -
// a badge/filter derived from the same activity feed already loaded for the
// Activity tab, not a new endpoint.
const SELF_EDIT_LOOKBACK_DAYS = 14;

function lastSelfEditActivity(providerId) {
  if (!providerId) {
    return null;
  }

  // state.activityEvents is the processed timeline from buildActivityTimeline
  // (already ordered newest-first) - entries use `type`, not `eventType`.
  return state.activityEvents.find(
    (entry) => entry.type === "provider_self_edited" && entry.providerId === providerId
  ) || null;
}

function isRecentlySelfEdited(provider) {
  const activity = lastSelfEditActivity(provider.id);

  if (!activity?.createdAt) {
    return false;
  }

  const ageMs = Date.now() - new Date(activity.createdAt).getTime();

  return ageMs >= 0 && ageMs <= SELF_EDIT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
}

function selfEditedBadge(provider) {
  const activity = lastSelfEditActivity(provider.id);

  if (!isRecentlySelfEdited(provider)) {
    return "";
  }

  const dateLabel = new Date(activity.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return `<span class="selfEditedBadge" title="${escapeHtml(activity.summary || "Edited by the owner via their claim link")}">Self-edited ${escapeHtml(dateLabel)}</span>`;
}

function filterPublishedProviders(providers) {
  const nameFilter = state.publishedFilters.name.trim().toLowerCase();
  const statusFilter = normalizeLifecycleStatus(state.publishedFilters.status);

  const filteredProviders = providers.filter((provider) => {
    if (nameFilter) {
      const nameText = `${provider.companyName || ""} ${provider.domain || ""}`.toLowerCase();
      if (!nameText.includes(nameFilter)) {
        return false;
      }
    }

    if (state.publishedFilters.status && lifecycleStatusForProvider(provider) !== statusFilter) {
      return false;
    }

    if (state.publishedFilters.selfEdited && !isRecentlySelfEdited(provider)) {
      return false;
    }

    return true;
  });

  return filteredProviders.sort((left, right) => {
    const direction = state.publishedSortDirection === "desc" ? -1 : 1;

    if (state.publishedSortField === "confidence") {
      const leftScore = Number.parseInt(left.confidenceScore, 10) || 0;
      const rightScore = Number.parseInt(right.confidenceScore, 10) || 0;

      return (leftScore - rightScore) * direction;
    }

    if (state.publishedSortField === "country") {
      const leftCountry = String(left.country || left.location || "");
      const rightCountry = String(right.country || right.location || "");

      return leftCountry.localeCompare(rightCountry, undefined, { sensitivity: "base" }) * direction;
    }

    if (state.publishedSortField === "status") {
      return lifecycleStatusForProvider(left).localeCompare(lifecycleStatusForProvider(right), undefined, { sensitivity: "base" }) * direction;
    }

    const leftName = String(left.companyName || left.domain || "");
    const rightName = String(right.companyName || right.domain || "");

    return leftName.localeCompare(rightName, undefined, { sensitivity: "base" }) * direction;
  });
}

function providerKey(provider) {
  return String(provider.id || provider.domain || "");
}

function findProvider(key) {
  return state.providers.find((provider) => providerKey(provider) === key);
}

function findProviderByDomain(domain) {
  return state.providers.find((provider) => provider.domain === domain);
}

function listToText(items) {
  return (items || [])
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.title || item?.summary || item?.name || "";
    })
    .filter(Boolean)
    .join("\n");
}

function recentActivitiesToText(items) {
  return (items || [])
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      const title = item?.title || item?.summary || item?.name || "";
      const date = item?.date || item?.publishedAt || item?.timestamp || "";
      const source = item?.source || item?.url || "";

      return [date, title, source].filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function textToList(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function normalizeTagName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeTagKey(value) {
  return normalizeTagName(value).toLowerCase();
}

function tagsForCategory(category, options = {}) {
  const { approvedOnly = false, includeMerged = false } = options;

  return state.tags
    .filter((tag) => tag.category === category)
    .filter((tag) => includeMerged || tag.status !== "merged")
    .filter((tag) => !approvedOnly || tag.status === "approved")
    .sort((left, right) => String(left.name).localeCompare(String(right.name), undefined, { sensitivity: "base" }));
}

function approvedTagNames(category) {
  return tagsForCategory(category, { approvedOnly: true }).map((tag) => tag.name);
}

function selectedTagNames(category) {
  const list = document.querySelector(`[data-tag-picker-list="${category}"]`);

  if (!list) {
    return [];
  }

  return uniqueList(Array.from(list.querySelectorAll("[data-tag-value]")).map((item) => item.dataset.tagValue));
}

function setTagPickerValues(category, values = []) {
  const list = document.querySelector(`[data-tag-picker-list="${category}"]`);

  if (!list) {
    return;
  }

  const allKnown = uniqueList([...approvedTagNames(category), ...values]);
  const selected = uniqueList(values);
  list.innerHTML = selected.length
    ? selected.map((value) => `
      <span class="tagChip" data-tag-value="${escapeHtml(value)}">
        ${escapeHtml(value)}
        <button type="button" data-remove-tag="${escapeHtml(category)}" aria-label="Remove ${escapeHtml(value)}">x</button>
      </span>
    `).join("")
    : `<span class="emptyTagHint">No tags selected.</span>`;

  renderTagPickerOptions(category, allKnown);
}

function renderTagPickerOptions(category, tagNames = approvedTagNames(category)) {
  const select = document.querySelector(`[data-tag-picker-select="${category}"]`);

  if (!select) {
    return;
  }

  const selectedKeys = new Set(selectedTagNames(category).map(normalizeTagKey));
  const options = uniqueList(tagNames).filter((name) => !selectedKeys.has(normalizeTagKey(name)));
  select.innerHTML = `<option value="">Add existing tag</option>${options.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
  select.disabled = options.length === 0;
}

function addTagToPicker(category, value) {
  const name = normalizeTagName(value);

  if (!name) {
    return;
  }

  setTagPickerValues(category, [...selectedTagNames(category), name]);
}

function tagValuesForCategory(provider = {}, category) {
  if (category === "vendor_partnerships") {
    return Array.isArray(provider.vendorPartnerships) ? provider.vendorPartnerships : [];
  }

  return Array.isArray(provider?.[category]) ? provider[category] : [];
}

function normalizeIndustryName(value) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const lowerText = text.toLowerCase();
  const rule = INDUSTRY_RULES.find((item) =>
    item.match.some((keyword) => lowerText.includes(keyword))
  );

  if (rule) {
    return rule.name;
  }

  if (GENERIC_INDUSTRIES.has(lowerText)) {
    return "Software & Technology";
  }

  if (GENERIC_INDUSTRY_KEYWORDS.some((keyword) => lowerText.includes(keyword))) {
    return "Software & Technology";
  }

  return null;
}

function normalizeIndustryList(values, fallbackValues = []) {
  const normalized = uniqueList(values)
    .map(normalizeIndustryName)
    .filter(Boolean);

  if (normalized.length === 0) {
    return uniqueList(fallbackValues)
      .map(normalizeIndustryName)
      .filter(Boolean)
      .slice(0, 3);
  }

  return uniqueList(normalized).slice(0, 5);
}

function textToRecentActivities(value) {
  return textToList(value).map((line) => {
    const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
    const firstPartLooksLikeDate = /^\d{4}-\d{2}-\d{2}/.test(parts[0] || "");

    if (parts.length >= 3) {
      return { date: parts[0], title: parts[1], source: parts.slice(2).join(" | ") };
    }

    if (parts.length === 2) {
      if (firstPartLooksLikeDate) {
        return { date: parts[0], title: parts[1], source: "Admin edit" };
      }

      return { title: parts[0], source: parts[1] };
    }

    return { title: line, source: "Admin edit" };
  });
}

function normalizeEditableEntry(item = {}) {
  if (typeof item === "string") {
    return { title: item, shortText: "", link: "" };
  }

  return {
    title: item.title || item.name || "",
    shortText: item.shortText || item.text || item.summary || item.description || "",
    link: item.link || item.url || item.source || "",
  };
}

function editableEntryRowMarkup(entry = {}) {
  const normalizedEntry = normalizeEditableEntry(entry);

  return `
    <article class="structuredEntryRow">
      <label>
        Title
        <input data-entry-field="title" type="text" value="${escapeHtml(normalizedEntry.title)}" placeholder="Title" />
      </label>
      <label>
        Short text
        <textarea data-entry-field="shortText" rows="2" placeholder="Short text">${escapeHtml(normalizedEntry.shortText)}</textarea>
      </label>
      <label>
        Link
        <input data-entry-field="link" type="url" value="${escapeHtml(normalizedEntry.link)}" placeholder="https://example.com/story" />
      </label>
      <button class="secondaryAction compactAction structuredEntryRemove" type="button">Remove</button>
    </article>
  `;
}

function renderEditableEntries(container, entries = []) {
  const normalizedEntries = (entries || []).map(normalizeEditableEntry);
  const renderEntries = normalizedEntries.length > 0 ? normalizedEntries : [{ title: "", shortText: "", link: "" }];

  container.innerHTML = renderEntries.map(editableEntryRowMarkup).join("");
}

function collectEditableEntries(container) {
  return Array.from(container.querySelectorAll(".structuredEntryRow"))
    .map((row) => ({
      title: row.querySelector('[data-entry-field="title"]').value.trim(),
      shortText: row.querySelector('[data-entry-field="shortText"]').value.trim(),
      link: row.querySelector('[data-entry-field="link"]').value.trim(),
    }))
    .filter((entry) => entry.title || entry.shortText || entry.link)
    .map((entry) => ({ ...entry, title: entry.title || "Untitled" }));
}

function addEditableEntry(container) {
  container.insertAdjacentHTML("beforeend", editableEntryRowMarkup());
}

function normalizeManagedSuccessStory(story = {}) {
  const status = String(story.status || "draft").trim().toLowerCase();

  return {
    id: story.id || "",
    title: story.title || "",
    shortText: story.shortText || story.short_text || "",
    link: story.link || "",
    sourceUrl: story.sourceUrl || story.source_url || "",
    status: ["suggested", "draft", "approved", "archived"].includes(status) ? status : "draft",
    featured: Boolean(story.featured),
    approvedBy: story.approvedBy || story.approved_by || "",
    approvedAt: story.approvedAt || story.approved_at || "",
    metadata: story.metadata && typeof story.metadata === "object" ? story.metadata : {},
  };
}

function managedSuccessStoryRowMarkup(story = {}) {
  const normalizedStory = normalizeManagedSuccessStory(story);

  return `
    <article class="managedSuccessStoryRow">
      <div class="managedSuccessStoryHeader">
        <label>
          Status
          <select data-story-field="status">
            ${["suggested", "draft", "approved", "archived"].map((status) => `
              <option value="${status}" ${normalizedStory.status === status ? "selected" : ""}>${escapeHtml(titleCase(status))}</option>
            `).join("")}
          </select>
        </label>
        <label class="adminCheckboxLabel managedStoryFeaturedControl">
          <input data-story-field="featured" type="checkbox" ${normalizedStory.featured ? "checked" : ""} />
          <span>Featured</span>
        </label>
        <button class="secondaryAction compactAction managedSuccessStoryApprove" type="button">Approve</button>
        <button class="secondaryAction compactAction managedSuccessStoryRemove" type="button">Remove</button>
      </div>
      <label>
        Title
        <input data-story-field="title" type="text" value="${escapeHtml(normalizedStory.title)}" placeholder="Customer story title" />
      </label>
      <label>
        Short text
        <textarea data-story-field="shortText" rows="2" placeholder="Short story summary">${escapeHtml(normalizedStory.shortText)}</textarea>
      </label>
      <div class="managedSuccessStoryGrid">
        <label>
          Link
          <input data-story-field="link" type="url" value="${escapeHtml(normalizedStory.link)}" placeholder="https://example.com/story" />
        </label>
        <label>
          Source URL
          <input data-story-field="sourceUrl" type="url" value="${escapeHtml(normalizedStory.sourceUrl)}" placeholder="https://source.example.com/story" />
        </label>
      </div>
      <input data-story-field="id" type="hidden" value="${escapeHtml(normalizedStory.id)}" />
      <input data-story-field="approvedBy" type="hidden" value="${escapeHtml(normalizedStory.approvedBy)}" />
      <input data-story-field="approvedAt" type="hidden" value="${escapeHtml(normalizedStory.approvedAt)}" />
      <textarea data-story-metadata hidden>${escapeHtml(JSON.stringify(normalizedStory.metadata || {}))}</textarea>
    </article>
  `;
}

function renderManagedSuccessStories(container, stories = []) {
  const normalizedStories = (stories || []).map(normalizeManagedSuccessStory);
  const renderStories = normalizedStories.length > 0 ? normalizedStories : [normalizeManagedSuccessStory()];

  container.innerHTML = renderStories.map(managedSuccessStoryRowMarkup).join("");
}

function collectManagedSuccessStories(container) {
  return Array.from(container.querySelectorAll(".managedSuccessStoryRow"))
    .map((row) => {
      let metadata = {};

      try {
        metadata = JSON.parse(row.querySelector("[data-story-metadata]")?.value || "{}");
      } catch (error) {
        metadata = {};
      }

      return {
        id: row.querySelector('[data-story-field="id"]').value.trim(),
        title: row.querySelector('[data-story-field="title"]').value.trim(),
        shortText: row.querySelector('[data-story-field="shortText"]').value.trim(),
        link: row.querySelector('[data-story-field="link"]').value.trim(),
        sourceUrl: row.querySelector('[data-story-field="sourceUrl"]').value.trim(),
        status: row.querySelector('[data-story-field="status"]').value,
        featured: row.querySelector('[data-story-field="featured"]').checked,
        approvedBy: row.querySelector('[data-story-field="approvedBy"]').value.trim(),
        approvedAt: row.querySelector('[data-story-field="approvedAt"]').value.trim() || null,
        metadata,
      };
    })
    .filter((story) => story.title || story.shortText || story.link || story.sourceUrl)
    .map((story) => ({ ...story, title: story.title || "Untitled success story" }));
}

function addManagedSuccessStory(container) {
  container.insertAdjacentHTML("beforeend", managedSuccessStoryRowMarkup());
}

function approveManagedSuccessStory(row) {
  row.querySelector('[data-story-field="status"]').value = "approved";
  row.querySelector('[data-story-field="approvedBy"]').value = adminEmail() || "Unknown admin";
  row.querySelector('[data-story-field="approvedAt"]').value = new Date().toISOString();
}

function normalizeProviderEventStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  return PROVIDER_EVENT_STATUSES.has(status) ? status : "suggested";
}

function normalizeManagedProviderEvent(event = {}) {
  const startsAt = event.startsAt || event.starts_at || "";

  return {
    id: event.id || "",
    title: event.title || "",
    startsAt: startsAt ? startsAt.slice(0, 16) : "",
    location: event.location || "",
    online: Boolean(event.online),
    sourceUrl: event.sourceUrl || event.source_url || "",
    status: normalizeProviderEventStatus(event.status),
    featured: Boolean(event.featured),
    approvedBy: event.approvedBy || event.approved_by || "",
    approvedAt: event.approvedAt || event.approved_at || "",
    metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
  };
}

function managedProviderEventRowMarkup(event = {}) {
  const normalizedEvent = normalizeManagedProviderEvent(event);

  return `
    <article class="managedEventRow">
      <div class="managedEventHeader">
        <label>
          Title
          <input data-event-field="title" type="text" value="${escapeHtml(normalizedEvent.title)}" placeholder="Provider webinar or meetup" />
        </label>
        <label>
          Starts At
          <input data-event-field="startsAt" type="datetime-local" value="${escapeHtml(normalizedEvent.startsAt)}" />
        </label>
        <label>
          Status
          <select data-event-field="status">
            ${["suggested", "approved", "expired", "archived"].map((status) => `
              <option value="${status}" ${normalizedEvent.status === status ? "selected" : ""}>${escapeHtml(titleCase(status))}</option>
            `).join("")}
          </select>
        </label>
        <button class="secondaryAction compactAction managedEventApprove" type="button">Approve</button>
      </div>
      <div class="managedEventGrid">
        <label>
          Location
          <input data-event-field="location" type="text" value="${escapeHtml(normalizedEvent.location)}" placeholder="Online, Bern, Zurich" />
        </label>
        <label>
          Source URL
          <input data-event-field="sourceUrl" type="url" value="${escapeHtml(normalizedEvent.sourceUrl)}" placeholder="https://provider.com/events/..." />
        </label>
        <label class="adminCheckboxLabel managedEventFlagControl">
          <input data-event-field="online" type="checkbox" ${normalizedEvent.online ? "checked" : ""} />
          <span>Online Event</span>
        </label>
        <label class="adminCheckboxLabel managedEventFlagControl">
          <input data-event-field="featured" type="checkbox" ${normalizedEvent.featured ? "checked" : ""} />
          <span>Featured</span>
        </label>
      </div>
      <input data-event-field="id" type="hidden" value="${escapeHtml(normalizedEvent.id)}" />
      <input data-event-field="approvedBy" type="hidden" value="${escapeHtml(normalizedEvent.approvedBy)}" />
      <input data-event-field="approvedAt" type="hidden" value="${escapeHtml(normalizedEvent.approvedAt)}" />
      <textarea data-event-metadata hidden>${escapeHtml(JSON.stringify(normalizedEvent.metadata || {}))}</textarea>
      <button class="secondaryAction compactAction managedEventRemove" type="button">Remove</button>
    </article>
  `;
}

function renderManagedProviderEvents(container, events = []) {
  const normalizedEvents = (events || []).map(normalizeManagedProviderEvent);
  const renderEvents = normalizedEvents.length > 0 ? normalizedEvents : [normalizeManagedProviderEvent()];

  container.innerHTML = renderEvents.map(managedProviderEventRowMarkup).join("");
}

function collectManagedProviderEvents(container) {
  return Array.from(container.querySelectorAll(".managedEventRow"))
    .map((row) => {
      let metadata = {};

      try {
        metadata = JSON.parse(row.querySelector("[data-event-metadata]")?.value || "{}");
      } catch (error) {
        metadata = {};
      }

      return {
        id: row.querySelector('[data-event-field="id"]').value.trim(),
        title: row.querySelector('[data-event-field="title"]').value.trim(),
        startsAt: row.querySelector('[data-event-field="startsAt"]').value.trim(),
        location: row.querySelector('[data-event-field="location"]').value.trim(),
        online: row.querySelector('[data-event-field="online"]').checked,
        sourceUrl: row.querySelector('[data-event-field="sourceUrl"]').value.trim(),
        status: normalizeProviderEventStatus(row.querySelector('[data-event-field="status"]').value),
        featured: row.querySelector('[data-event-field="featured"]').checked,
        approvedBy: row.querySelector('[data-event-field="approvedBy"]').value.trim(),
        approvedAt: row.querySelector('[data-event-field="approvedAt"]').value.trim() || null,
        metadata,
      };
    })
    .filter((event) => event.title || event.startsAt || event.location || event.sourceUrl)
    .map((event) => ({ ...event, title: event.title || "Untitled provider event" }));
}

function addManagedProviderEvent(container) {
  container.insertAdjacentHTML("beforeend", managedProviderEventRowMarkup());
}

function approveManagedProviderEvent(row) {
  row.querySelector('[data-event-field="status"]').value = "approved";
  row.querySelector('[data-event-field="approvedBy"]').value = adminEmail() || "Unknown admin";
  row.querySelector('[data-event-field="approvedAt"]').value = new Date().toISOString();
}

function normalizeMarketSignalType(value) {
  const type = String(value || "").trim().toLowerCase();

  return MARKET_SIGNAL_TYPES.has(type) ? type : "news";
}

function normalizeMarketSignalStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  return MARKET_SIGNAL_STATUSES.has(status) ? status : "scraped";
}

function normalizeManagedMarketSignal(signal = {}) {
  const observedAt = signal.observedAt || signal.observed_at || "";

  return {
    id: signal.id || "",
    signalType: normalizeMarketSignalType(signal.signalType || signal.signal_type),
    title: signal.title || "",
    sourceUrl: signal.sourceUrl || signal.source_url || "",
    status: normalizeMarketSignalStatus(signal.status),
    approvedBy: signal.approvedBy || signal.approved_by || "",
    approvedAt: signal.approvedAt || signal.approved_at || "",
    observedAt: observedAt ? observedAt.slice(0, 16) : "",
    metadata: signal.metadata && typeof signal.metadata === "object" ? signal.metadata : {},
  };
}

function managedMarketSignalRowMarkup(signal = {}) {
  const normalizedSignal = normalizeManagedMarketSignal(signal);

  return `
    <article class="managedSignalRow">
      <div class="managedSignalHeader">
        <label>
          Type
          <select data-signal-field="signalType">
            ${["hiring", "news", "leadership", "tender", "technology", "partnership"].map((type) => `
              <option value="${type}" ${normalizedSignal.signalType === type ? "selected" : ""}>${escapeHtml(titleCase(type))}</option>
            `).join("")}
          </select>
        </label>
        <label>
          Status
          <select data-signal-field="status">
            ${["scraped", "reviewed", "approved", "archived"].map((status) => `
              <option value="${status}" ${normalizedSignal.status === status ? "selected" : ""}>${escapeHtml(titleCase(status))}</option>
            `).join("")}
          </select>
        </label>
        <label>
          Observed At
          <input data-signal-field="observedAt" type="datetime-local" value="${escapeHtml(normalizedSignal.observedAt)}" />
        </label>
        <button class="secondaryAction compactAction managedSignalApprove" type="button">Approve</button>
      </div>
      <div class="managedSignalGrid">
        <label>
          Signal
          <textarea data-signal-field="title" rows="3" placeholder="Hiring spike, funding, new partnership, tender, technology adoption">${escapeHtml(normalizedSignal.title)}</textarea>
        </label>
        <label>
          Source URL
          <input data-signal-field="sourceUrl" type="url" value="${escapeHtml(normalizedSignal.sourceUrl)}" placeholder="https://source.example/..." />
        </label>
      </div>
      <input data-signal-field="id" type="hidden" value="${escapeHtml(normalizedSignal.id)}" />
      <input data-signal-field="approvedBy" type="hidden" value="${escapeHtml(normalizedSignal.approvedBy)}" />
      <input data-signal-field="approvedAt" type="hidden" value="${escapeHtml(normalizedSignal.approvedAt)}" />
      <textarea data-signal-metadata hidden>${escapeHtml(JSON.stringify(normalizedSignal.metadata || {}))}</textarea>
      <button class="secondaryAction compactAction managedSignalRemove" type="button">Remove</button>
    </article>
  `;
}

function renderManagedMarketSignals(container, signals = []) {
  const normalizedSignals = (signals || []).map(normalizeManagedMarketSignal);
  const renderSignals = normalizedSignals.length > 0 ? normalizedSignals : [normalizeManagedMarketSignal()];

  container.innerHTML = renderSignals.map(managedMarketSignalRowMarkup).join("");
}

function collectManagedMarketSignals(container) {
  return Array.from(container.querySelectorAll(".managedSignalRow"))
    .map((row) => {
      let metadata = {};

      try {
        metadata = JSON.parse(row.querySelector("[data-signal-metadata]")?.value || "{}");
      } catch (error) {
        metadata = {};
      }

      return {
        id: row.querySelector('[data-signal-field="id"]').value.trim(),
        signalType: normalizeMarketSignalType(row.querySelector('[data-signal-field="signalType"]').value),
        title: row.querySelector('[data-signal-field="title"]').value.trim(),
        sourceUrl: row.querySelector('[data-signal-field="sourceUrl"]').value.trim(),
        status: normalizeMarketSignalStatus(row.querySelector('[data-signal-field="status"]').value),
        approvedBy: row.querySelector('[data-signal-field="approvedBy"]').value.trim(),
        approvedAt: row.querySelector('[data-signal-field="approvedAt"]').value.trim() || null,
        observedAt: row.querySelector('[data-signal-field="observedAt"]').value.trim(),
        metadata,
      };
    })
    .filter((signal) => signal.title || signal.sourceUrl)
    .map((signal) => ({ ...signal, title: signal.title || "Untitled market signal" }));
}

function addManagedMarketSignal(container) {
  container.insertAdjacentHTML("beforeend", managedMarketSignalRowMarkup());
}

function approveManagedMarketSignal(row) {
  row.querySelector('[data-signal-field="status"]').value = "approved";
  row.querySelector('[data-signal-field="approvedBy"]').value = adminEmail() || "Unknown admin";
  row.querySelector('[data-signal-field="approvedAt"]').value = new Date().toISOString();
  if (!row.querySelector('[data-signal-field="observedAt"]').value) {
    row.querySelector('[data-signal-field="observedAt"]').value = new Date().toISOString().slice(0, 16);
  }
}

function normalizeOutreachContact(contact = {}) {
  return {
    name: contact.name || "",
    title: contact.title || contact.role || "",
    email: contact.email || "",
    linkedinUrl: contact.linkedinUrl || contact.linkedin_url || "",
    seniority: contact.seniority || "",
    source: contact.source || "",
    primaryContact: Boolean(contact.primaryContact || contact.primary_contact),
  };
}

function outreachContactRowMarkup(contact = {}) {
  const normalizedContact = normalizeOutreachContact(contact);

  return `
    <article class="outreachContactRow">
      <label>
        Name
        <input data-contact-field="name" type="text" value="${escapeHtml(normalizedContact.name)}" placeholder="Contact name" />
      </label>
      <label>
        Role / Title
        <input data-contact-field="title" type="text" value="${escapeHtml(normalizedContact.title)}" placeholder="VP Engineering" />
      </label>
      <label>
        Email
        <input data-contact-field="email" type="email" value="${escapeHtml(normalizedContact.email)}" placeholder="name@company.com" />
      </label>
      <label>
        LinkedIn URL
        <input data-contact-field="linkedinUrl" type="url" value="${escapeHtml(normalizedContact.linkedinUrl)}" placeholder="https://www.linkedin.com/in/name" />
      </label>
      <label>
        Seniority
        <input data-contact-field="seniority" type="text" value="${escapeHtml(normalizedContact.seniority)}" placeholder="Executive, Director, Manager" />
      </label>
      <label>
        Source
        <input data-contact-field="source" type="text" value="${escapeHtml(normalizedContact.source)}" placeholder="Manual research, Apollo, LinkedIn" />
      </label>
      <label class="adminCheckboxLabel outreachPrimaryControl">
        <input data-contact-field="primaryContact" type="checkbox" ${normalizedContact.primaryContact ? "checked" : ""} />
        <span>Primary Contact</span>
      </label>
      <button class="secondaryAction compactAction outreachContactRemove" type="button">Remove</button>
    </article>
  `;
}

function renderOutreachContacts(container, contacts = []) {
  const normalizedContacts = (contacts || []).map(normalizeOutreachContact);
  const renderContacts = normalizedContacts.length > 0 ? normalizedContacts : [normalizeOutreachContact()];

  container.innerHTML = renderContacts.map(outreachContactRowMarkup).join("");
}

function collectOutreachContacts(container) {
  let primaryAssigned = false;

  return Array.from(container.querySelectorAll(".outreachContactRow"))
    .map((row) => {
      const primaryInput = row.querySelector('[data-contact-field="primaryContact"]');
      const primaryContact = primaryInput.checked && !primaryAssigned;

      if (primaryContact) {
        primaryAssigned = true;
      }

      return {
        name: row.querySelector('[data-contact-field="name"]').value.trim(),
        title: row.querySelector('[data-contact-field="title"]').value.trim(),
        email: row.querySelector('[data-contact-field="email"]').value.trim(),
        linkedinUrl: row.querySelector('[data-contact-field="linkedinUrl"]').value.trim(),
        seniority: row.querySelector('[data-contact-field="seniority"]').value.trim(),
        source: row.querySelector('[data-contact-field="source"]').value.trim(),
        primaryContact,
      };
    })
    .filter((contact) => contact.name || contact.title || contact.email || contact.linkedinUrl || contact.seniority || contact.source);
}

function addOutreachContact(container) {
  container.insertAdjacentHTML("beforeend", outreachContactRowMarkup());
}

function normalizeOutreachMessageStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  return OUTREACH_MESSAGE_STATUSES.has(status) ? status : "draft";
}

function normalizeOutreachMessage(message = {}) {
  const stepDef = OUTREACH_MESSAGE_STEPS.find((step) => step.messageStep === (message.messageStep || message.message_step)) || OUTREACH_MESSAGE_STEPS[0];

  return {
    id: message.id || "",
    contactId: message.contactId || message.contact_id || "",
    channel: message.channel || stepDef.channel,
    messageStep: stepDef.messageStep,
    subject: message.subject || "",
    body: message.body || "",
    status: normalizeOutreachMessageStatus(message.status),
    generatedBy: message.generatedBy || message.generated_by || "",
    approvedBy: message.approvedBy || message.approved_by || "",
    approvedAt: message.approvedAt || message.approved_at || "",
    sentAt: message.sentAt || message.sent_at || "",
    cycleNumber: message.cycleNumber ?? message.cycle_number ?? null,
    metadata: message.metadata && typeof message.metadata === "object" ? message.metadata : {},
  };
}

function outreachMessagesByStep(messages = []) {
  return new Map((messages || []).map((message) => {
    const normalizedMessage = normalizeOutreachMessage(message);
    return [normalizedMessage.messageStep, normalizedMessage];
  }));
}

// Copy/Preview are shared between the full profile editor and the dedicated
// outreach compose dialog - whichever is currently open owns the active key.
function activeOutreachEditorKey() {
  if (elements.outreachComposeDialog?.open) {
    return elements.outreachComposeKey.value;
  }

  return elements.profileEditKey.value;
}

function providerAccessUrlForProvider(provider = {}) {
  const claimInvite = (provider.outreachMessages || []).find((message) => message.messageStep === "claim_profile_invitation");
  const accessUrl = claimInvite?.metadata?.accessUrl;

  return accessUrl || "/profile-access";
}

// Mirrors bodyToHtml in src/email/resend.js so the preview matches what
// actually gets sent: blank-line-separated paragraphs, single newlines as <br>.
function bodyToPreviewHtml(body) {
  return String(body || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function primaryContactEmailForProvider(provider = {}, contactId = "") {
  const contacts = provider.outreachContacts || [];
  const matched = contactId ? contacts.find((contact) => contact.id === contactId) : null;
  const contact = matched || contacts.find((contact) => contact.primaryContact) || contacts[0];

  return contact?.email || "";
}

function openEmailPreview(row) {
  const provider = findProvider(activeOutreachEditorKey()) || {};
  const contactId = row.querySelector('[data-message-field="contactId"]')?.value.trim() || "";
  const subject = row.querySelector('[data-message-field="subject"]')?.value.trim() || "(no subject)";
  const body = row.querySelector('[data-message-field="body"]')?.value.trim() || "";
  const toEmail = primaryContactEmailForProvider(provider, contactId);

  elements.emailPreviewFrom.textContent = "Rocket Engineers <your RESEND_FROM_EMAIL>";
  elements.emailPreviewTo.textContent = toEmail || "(no contact email set)";
  elements.emailPreviewSubject.textContent = subject;
  elements.emailPreviewBody.innerHTML = bodyToPreviewHtml(body) || "<p><em>Nothing drafted yet.</em></p>";
  elements.emailPreviewDialog.showModal();
}

function outreachMessageRowMarkup(message = {}) {
  const normalizedMessage = normalizeOutreachMessage(message);
  const stepDef = OUTREACH_MESSAGE_STEPS.find((step) => step.messageStep === normalizedMessage.messageStep) || OUTREACH_MESSAGE_STEPS[0];
  const isLinkedIn = stepDef.channel === "linkedin";
  const openProvider = findProvider(elements.profileEditKey?.value) || {};
  const accessUrl = providerAccessUrlForProvider(openProvider);
  const isClaimInvite = stepDef.messageStep === "claim_profile_invitation";

  return `
    <article class="outreachMessageRow" data-message-step="${escapeHtml(stepDef.messageStep)}" data-message-channel="${escapeHtml(stepDef.channel)}">
      <div class="outreachMessageHeader">
        <div>
          <strong>${escapeHtml(stepDef.label)}</strong>
          <span>${escapeHtml(stepDef.channel.replace(/_/g, " "))}</span>
        </div>
        <div class="outreachMessageControls">
          <select data-message-field="status" aria-label="${escapeHtml(stepDef.label)} status">
            ${["draft", "approved", "sent", "opened", "clicked", "replied"].map((status) => `
              <option value="${status}" ${normalizedMessage.status === status ? "selected" : ""}>${escapeHtml(titleCase(status))}</option>
            `).join("")}
          </select>
          <button class="secondaryAction compactAction outreachMessageApprove" type="button">Approve</button>
          <button class="secondaryAction compactAction outreachMessageCopy" type="button">Copy</button>
          ${stepDef.channel === "email" ? `<button class="secondaryAction compactAction outreachMessagePreview" type="button">Preview</button>` : ""}
        </div>
      </div>
      ${isClaimInvite ? `
        <div class="outreachAccessLink">
          <span>Provider access link</span>
          <a href="${escapeHtml(accessUrl)}" target="_blank" rel="noreferrer">${escapeHtml(accessUrl)}</a>
        </div>
      ` : ""}
      <label ${isLinkedIn ? "hidden" : ""}>
        Subject
        <input data-message-field="subject" type="text" value="${escapeHtml(normalizedMessage.subject)}" placeholder="${escapeHtml(stepDef.label)} subject" />
      </label>
      <label>
        Body
        <textarea data-message-field="body" rows="${isLinkedIn ? "4" : "7"}" placeholder="${escapeHtml(stepDef.label)} body">${escapeHtml(normalizedMessage.body)}</textarea>
      </label>
      <input data-message-field="id" type="hidden" value="${escapeHtml(normalizedMessage.id)}" />
      <input data-message-field="contactId" type="hidden" value="${escapeHtml(normalizedMessage.contactId)}" />
      <input data-message-field="generatedBy" type="hidden" value="${escapeHtml(normalizedMessage.generatedBy)}" />
      <input data-message-field="approvedBy" type="hidden" value="${escapeHtml(normalizedMessage.approvedBy)}" />
      <input data-message-field="approvedAt" type="hidden" value="${escapeHtml(normalizedMessage.approvedAt)}" />
      <input data-message-field="sentAt" type="hidden" value="${escapeHtml(normalizedMessage.sentAt)}" />
      <input data-message-field="cycleNumber" type="hidden" value="${normalizedMessage.cycleNumber ?? ""}" />
      <textarea data-message-metadata hidden>${escapeHtml(JSON.stringify(normalizedMessage.metadata || {}))}</textarea>
    </article>
  `;
}

function renderOutreachMessages(container, messages = []) {
  const byStep = outreachMessagesByStep(messages);

  container.innerHTML = OUTREACH_MESSAGE_STEPS
    .map((step) => outreachMessageRowMarkup(byStep.get(step.messageStep) || step))
    .join("");
}

function collectOutreachMessages(container) {
  return Array.from(container.querySelectorAll(".outreachMessageRow"))
    .map((row) => {
      const metadataText = row.querySelector("[data-message-metadata]")?.value || "{}";
      let metadata = {};

      try {
        metadata = JSON.parse(metadataText);
      } catch (error) {
        metadata = {};
      }

      return {
        id: row.querySelector('[data-message-field="id"]').value.trim(),
        contactId: row.querySelector('[data-message-field="contactId"]').value.trim() || null,
        channel: row.dataset.messageChannel,
        messageStep: row.dataset.messageStep,
        subject: row.querySelector('[data-message-field="subject"]')?.value.trim() || "",
        body: row.querySelector('[data-message-field="body"]').value.trim(),
        status: normalizeOutreachMessageStatus(row.querySelector('[data-message-field="status"]').value),
        generatedBy: row.querySelector('[data-message-field="generatedBy"]').value.trim(),
        approvedBy: row.querySelector('[data-message-field="approvedBy"]').value.trim(),
        approvedAt: row.querySelector('[data-message-field="approvedAt"]').value.trim() || null,
        sentAt: row.querySelector('[data-message-field="sentAt"]').value.trim() || null,
        cycleNumber: (() => {
          const raw = row.querySelector('[data-message-field="cycleNumber"]')?.value.trim();
          const parsed = Number.parseInt(raw, 10);
          return Number.isInteger(parsed) ? parsed : null;
        })(),
        metadata,
      };
    })
    .filter((message) => message.id || message.body);
}

function approveOutreachMessage(row) {
  row.querySelector('[data-message-field="status"]').value = "approved";
  row.querySelector('[data-message-field="approvedBy"]').value = adminEmail() || "Unknown admin";
  row.querySelector('[data-message-field="approvedAt"]').value = new Date().toISOString();
}

function approveAllDraftOutreachMessages() {
  let approvedCount = 0;

  elements.profileEditOutreachMessages.querySelectorAll(".outreachMessageRow").forEach((row) => {
    const statusSelect = row.querySelector('[data-message-field="status"]');

    if (statusSelect?.value === "draft" && row.querySelector('[data-message-field="body"]')?.value.trim()) {
      approveOutreachMessage(row);
      approvedCount += 1;
    }
  });

  showToast(
    approvedCount
      ? `${approvedCount} draft message${approvedCount === 1 ? "" : "s"} marked approved. Save profile to persist.`
      : "No draft messages to approve."
  );
}

async function copyOutreachMessage(row) {
  const subject = row.querySelector('[data-message-field="subject"]')?.value.trim();
  let body = row.querySelector('[data-message-field="body"]')?.value.trim();
  const provider = findProvider(activeOutreachEditorKey()) || {};
  const accessUrl = providerAccessUrlForProvider(provider);

  if (row.dataset.messageStep === "claim_profile_invitation" && provider.domain && !body.includes(accessUrl)) {
    body = `${body}\n\nReview, claim, or request removal for your profile here:\n${window.location.origin}${accessUrl}`;
  }

  const text = [subject ? `Subject: ${subject}` : "", body].filter(Boolean).join("\n\n");

  if (!text) {
    showToast("Message is empty.", "error");
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  fetch("/api/admin-activity", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      providerId: provider.id || elements.profileEditKey.value,
      eventType: row.dataset.messageChannel === "linkedin" ? "linkedin_message_copied" : "outreach_copied",
      label: row.dataset.messageChannel === "linkedin" ? "LinkedIn message copied" : "Outreach message copied",
      summary: `${outreachMessageLabel(row.dataset.messageStep)} copied. No outreach was sent.`,
      metadata: {
        messageStep: row.dataset.messageStep,
        channel: row.dataset.messageChannel,
      },
    }),
  }).catch(() => {});

  showToast("Message copied. No outreach was sent.");
}

function hasPremiumProfileAccess(profile = {}) {
  const tier = String(profile.subscriptionTier || profile.subscription_tier || profile.plan || "").toLowerCase();

  return Boolean(profile.isPremium || profile.premium || ["premium", "pro", "paid"].includes(tier));
}

function subscriptionTierForProfile(profile = {}) {
  return hasPremiumProfileAccess(profile) ? "premium" : "free";
}

function normalizeReviewerFeedback(value) {
  const feedback = String(value || "").trim().toLowerCase();

  return feedback === "up" || feedback === "down" ? feedback : "";
}

function selectedReviewerFeedback() {
  if (elements.profileEditQualityFeedbackUp.checked) {
    return "up";
  }

  if (elements.profileEditQualityFeedbackDown.checked) {
    return "down";
  }

  return "";
}

function setReviewerFeedback(value) {
  const feedback = normalizeReviewerFeedback(value);

  elements.profileEditQualityFeedbackUp.checked = feedback === "up";
  elements.profileEditQualityFeedbackDown.checked = feedback === "down";
}

function scraperQualityLogForProfile(profile = {}) {
  const log = profile.scraperQualityLog || {};

  return {
    missing: Array.isArray(log.missing) ? log.missing : [],
    incorrect: Array.isArray(log.incorrect) ? log.incorrect : [],
    added: Array.isArray(log.added) ? log.added : [],
    notes: typeof log.notes === "string" ? log.notes : "",
    feedback: normalizeReviewerFeedback(log.feedback || log.reviewerFeedback),
  };
}

function activityLogForProfile(profile = {}) {
  return Array.isArray(profile.activityLog) ? profile.activityLog : [];
}

function formatActivityDate(value) {
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "No date";
}

function renderProfileActivityLog(profile = {}) {
  if (!elements.profileEditActivityLog) {
    return;
  }

  const entries = activityLogForProfile(profile).slice(0, 12);

  elements.profileEditActivityLog.innerHTML = entries.length
    ? entries.map((entry) => `
      <article class="profileActivityItem">
        <div>
          <strong>${escapeHtml(entry.label || titleCase(entry.type || "activity"))}</strong>
          <span>${escapeHtml(formatActivityDate(entry.createdAt || entry.created_at || entry.at))}</span>
        </div>
        <p>${escapeHtml(entry.summary || "")}</p>
        <small>${escapeHtml(entry.adminEmail || entry.admin_email || entry.by || "Unknown admin")}</small>
      </article>
    `).join("")
    : `<div class="emptyState">No activity logged yet.</div>`;
}

function buildActivityEntry(provider = {}, patch = {}, nextStatus) {
  const previousStatus = lifecycleStatusForProvider(provider);
  const statusChanged = previousStatus !== nextStatus;
  const qualityLog = patch.scraperQualityLog || {};
  const qualityTouched = Boolean(
    qualityLog.feedback ||
    qualityLog.notes ||
    qualityLog.missing?.length ||
    qualityLog.incorrect?.length ||
    qualityLog.added?.length
  );
  const label = statusChanged ? "Profile status changed" : "Profile reviewed";
  const details = [
    statusChanged ? `${titleCase(previousStatus)} to ${titleCase(nextStatus)}` : "Profile content saved",
    qualityTouched ? "quality log updated" : "",
  ].filter(Boolean);

  return {
    type: statusChanged ? "profile_status_changed" : "profile_reviewed",
    label,
    summary: details.join("; "),
    statusFrom: previousStatus,
    statusTo: nextStatus,
    adminEmail: adminEmail() || "Unknown admin",
    createdAt: new Date().toISOString(),
  };
}

function stableContactKey(contact = {}) {
  return [
    contact.email,
    contact.linkedinUrl || contact.linkedin_url,
    contact.name,
    contact.title || contact.role,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join("|");
}

function messageSignature(message = {}) {
  return JSON.stringify({
    subject: message.subject || "",
    body: message.body || "",
    status: normalizeOutreachMessageStatus(message.status),
  });
}

function outreachMessageLabel(messageStep) {
  return OUTREACH_MESSAGE_STEPS.find((step) => step.messageStep === messageStep)?.label || titleCase(messageStep || "message");
}

function buildOutreachActivityEntries(provider = {}, patch = {}) {
  const entries = [];
  const previousContacts = provider.outreachContacts || [];
  const nextContacts = patch.outreachContacts || [];
  const previousContactKeys = new Set(previousContacts.map(stableContactKey).filter(Boolean));
  const nextContactKeys = new Set(nextContacts.map(stableContactKey).filter(Boolean));
  const addedContacts = [...nextContactKeys].filter((key) => !previousContactKeys.has(key)).length;
  const removedContacts = [...previousContactKeys].filter((key) => !nextContactKeys.has(key)).length;
  const previousPrimary = previousContacts.find((contact) => contact.primaryContact);
  const nextPrimary = nextContacts.find((contact) => contact.primaryContact);
  const primaryChanged = stableContactKey(previousPrimary) !== stableContactKey(nextPrimary);
  const now = new Date().toISOString();
  const admin = adminEmail() || "Unknown admin";

  if (addedContacts || removedContacts || primaryChanged) {
    entries.push({
      type: "outreach_contacts_updated",
      label: "Outreach contacts updated",
      summary: [
        addedContacts ? `${addedContacts} added` : "",
        removedContacts ? `${removedContacts} removed` : "",
        primaryChanged ? "primary contact changed" : "",
      ].filter(Boolean).join("; "),
      adminEmail: admin,
      createdAt: now,
    });
  }

  const previousMessages = outreachMessagesByStep(provider.outreachMessages || []);
  const nextMessages = outreachMessagesByStep(patch.outreachMessages || []);
  let generatedCount = 0;
  let editedCount = 0;
  const approvedLabels = [];

  for (const [messageStep, nextMessage] of nextMessages) {
    const previousMessage = previousMessages.get(messageStep);

    if (!previousMessage) {
      generatedCount += 1;
      continue;
    }

    if (messageSignature(previousMessage) !== messageSignature(nextMessage)) {
      editedCount += 1;
    }

    if (previousMessage.status !== "approved" && nextMessage.status === "approved") {
      approvedLabels.push(outreachMessageLabel(messageStep));
    }
  }

  if (generatedCount) {
    entries.push({
      type: "outreach_messages_added",
      label: "Outreach messages added",
      summary: `${generatedCount} draft message${generatedCount === 1 ? "" : "s"} added for review.`,
      adminEmail: admin,
      createdAt: now,
    });
  }

  if (editedCount) {
    entries.push({
      type: "outreach_messages_edited",
      label: "Outreach messages edited",
      summary: `${editedCount} message${editedCount === 1 ? "" : "s"} edited or status changed.`,
      adminEmail: admin,
      createdAt: now,
    });
  }

  if (approvedLabels.length) {
    entries.push({
      type: "outreach_approved",
      label: "Outreach approved",
      summary: `${approvedLabels.join(", ")} approved for outreach workflow.`,
      adminEmail: admin,
      createdAt: now,
    });
  }

  return entries;
}

function storySignature(story = {}) {
  return JSON.stringify({
    title: story.title || "",
    shortText: story.shortText || "",
    link: story.link || "",
    sourceUrl: story.sourceUrl || "",
    status: story.status || "draft",
    featured: Boolean(story.featured),
  });
}

function buildSuccessStoryActivityEntries(provider = {}, patch = {}) {
  const previousStories = new Map((provider.managedSuccessStories || []).map((story) => [story.id || story.title, normalizeManagedSuccessStory(story)]));
  const nextStories = patch.managedSuccessStories || [];
  const admin = adminEmail() || "Unknown admin";
  const now = new Date().toISOString();
  let addedCount = 0;
  let editedCount = 0;
  const approvedStories = [];

  for (const story of nextStories) {
    const key = story.id || story.title;
    const previousStory = previousStories.get(key);

    if (!previousStory) {
      addedCount += 1;
      if (story.status === "approved") {
        approvedStories.push(story.title);
      }
      continue;
    }

    if (storySignature(previousStory) !== storySignature(story)) {
      editedCount += 1;
    }

    if (previousStory.status !== "approved" && story.status === "approved") {
      approvedStories.push(story.title);
    }
  }

  return [
    addedCount ? {
      type: "success_story_scraped",
      label: "Success stories added",
      summary: `${addedCount} managed success stor${addedCount === 1 ? "y" : "ies"} added for review.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    editedCount ? {
      type: "success_story_updated",
      label: "Success stories updated",
      summary: `${editedCount} managed success stor${editedCount === 1 ? "y" : "ies"} edited.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    approvedStories.length ? {
      type: "success_story_approved",
      label: "Success story approved",
      summary: approvedStories.slice(0, 3).join(", "),
      adminEmail: admin,
      createdAt: now,
    } : null,
  ].filter(Boolean);
}

function eventSignature(event = {}) {
  return JSON.stringify({
    title: event.title || "",
    startsAt: event.startsAt || "",
    location: event.location || "",
    online: Boolean(event.online),
    sourceUrl: event.sourceUrl || "",
    status: event.status || "suggested",
    featured: Boolean(event.featured),
  });
}

function buildProviderEventActivityEntries(provider = {}, patch = {}) {
  const previousEvents = new Map((provider.managedProviderEvents || []).map((event) => [event.id || event.title, normalizeManagedProviderEvent(event)]));
  const nextEvents = patch.managedProviderEvents || [];
  const admin = adminEmail() || "Unknown admin";
  const now = new Date().toISOString();
  let addedCount = 0;
  let editedCount = 0;
  const approvedEvents = [];

  for (const event of nextEvents) {
    const key = event.id || event.title;
    const previousEvent = previousEvents.get(key);

    if (!previousEvent) {
      addedCount += 1;
      if (event.status === "approved") {
        approvedEvents.push(event.title);
      }
      continue;
    }

    if (eventSignature(previousEvent) !== eventSignature(event)) {
      editedCount += 1;
    }

    if (previousEvent.status !== "approved" && event.status === "approved") {
      approvedEvents.push(event.title);
    }
  }

  return [
    addedCount ? {
      type: "provider_event_scraped",
      label: "Provider events added",
      summary: `${addedCount} provider event${addedCount === 1 ? "" : "s"} added for review.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    editedCount ? {
      type: "provider_event_updated",
      label: "Provider events updated",
      summary: `${editedCount} provider event${editedCount === 1 ? "" : "s"} edited.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    approvedEvents.length ? {
      type: "provider_event_approved",
      label: "Provider event approved",
      summary: approvedEvents.slice(0, 3).join(", "),
      adminEmail: admin,
      createdAt: now,
    } : null,
  ].filter(Boolean);
}

function signalSignature(signal = {}) {
  return JSON.stringify({
    signalType: signal.signalType || "news",
    title: signal.title || "",
    sourceUrl: signal.sourceUrl || "",
    status: signal.status || "scraped",
    observedAt: signal.observedAt || "",
  });
}

function buildMarketSignalActivityEntries(provider = {}, patch = {}) {
  const previousSignals = new Map((provider.managedMarketSignals || []).map((signal) => [signal.id || signal.title, normalizeManagedMarketSignal(signal)]));
  const nextSignals = patch.managedMarketSignals || [];
  const admin = adminEmail() || "Unknown admin";
  const now = new Date().toISOString();
  let addedCount = 0;
  let editedCount = 0;
  const approvedSignals = [];

  for (const signal of nextSignals) {
    const key = signal.id || signal.title;
    const previousSignal = previousSignals.get(key);

    if (!previousSignal) {
      addedCount += 1;
      if (signal.status === "approved") {
        approvedSignals.push(signal.title);
      }
      continue;
    }

    if (signalSignature(previousSignal) !== signalSignature(signal)) {
      editedCount += 1;
    }

    if (previousSignal.status !== "approved" && signal.status === "approved") {
      approvedSignals.push(signal.title);
    }
  }

  return [
    addedCount ? {
      type: "market_signal_scraped",
      label: "Market signals added",
      summary: `${addedCount} market signal${addedCount === 1 ? "" : "s"} added for review.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    editedCount ? {
      type: "market_signal_updated",
      label: "Market signals updated",
      summary: `${editedCount} market signal${editedCount === 1 ? "" : "s"} edited.`,
      adminEmail: admin,
      createdAt: now,
    } : null,
    approvedSignals.length ? {
      type: "market_signal_approved",
      label: "Market signal approved",
      summary: approvedSignals.slice(0, 3).join(", "),
      adminEmail: admin,
      createdAt: now,
    } : null,
  ].filter(Boolean);
}

function appendActivityLog(provider = {}, entries) {
  const normalizedEntries = Array.isArray(entries) ? entries.filter(Boolean) : [entries].filter(Boolean);

  return [...normalizedEntries, ...activityLogForProfile(provider)].slice(0, 50);
}

function openEditProfile(key) {
  const provider = findProvider(key);

  if (!provider) {
    return;
  }

  elements.profileEditKey.value = key;
  elements.profileEditName.value = provider.companyName || provider.domain || "";
  elements.profileEditLogo.value = provider.logoUrl || "";
  elements.profileEditWebsite.value = provider.website || "";
  elements.profileEditCountry.value = provider.companyLocation?.country || provider.country || "";
  elements.profileEditCity.value = provider.companyLocation?.city || provider.city || "";
  elements.profileEditStatus.value = lifecycleStatusForProvider(provider);
  elements.profileEditClaimed.checked = Boolean(provider.claimed);
  elements.profileEditSubscriptionTier.value = subscriptionTierForProfile(provider);
  setTagPickerValues("services", provider.services);
  setTagPickerValues("industries", normalizeIndustryList(provider.industries, provider.focusAreas));
  setTagPickerValues("technologies", provider.technologies);
  setTagPickerValues("vendor_partnerships", provider.vendorPartnerships);
  renderEditableEntries(elements.profileEditSuccessStories, provider.successStories);
  renderManagedSuccessStories(elements.profileEditManagedSuccessStories, provider.managedSuccessStories);
  renderEditableEntries(elements.profileEditSolutions, provider.solutions);
  elements.profileEditActivities.value = recentActivitiesToText(provider.recentActivity);
  renderManagedProviderEvents(elements.profileEditManagedEvents, provider.managedProviderEvents);
  renderManagedMarketSignals(elements.profileEditManagedSignals, provider.managedMarketSignals);
  renderOutreachContacts(elements.profileEditOutreachContacts, provider.outreachContacts);
  renderOutreachMessages(elements.profileEditOutreachMessages, provider.outreachMessages);
  elements.profileEditNotes.value = listToText(provider.reviewNotes);
  const qualityLog = scraperQualityLogForProfile(provider);
  elements.profileEditQualityMissing.value = listToText(qualityLog.missing);
  elements.profileEditQualityIncorrect.value = listToText(qualityLog.incorrect);
  elements.profileEditQualityAdded.value = listToText(qualityLog.added);
  elements.profileEditQualityNotes.value = qualityLog.notes;
  setReviewerFeedback(qualityLog.feedback);
  renderProfileActivityLog(provider);
  if (elements.profileEditGuardrailNotice) {
    const belowGuardrail = isBelowConfidenceGuardrail(provider);
    elements.profileEditGuardrailNotice.hidden = !belowGuardrail;
    elements.profileEditGuardrailNotice.textContent = belowGuardrail
      ? `Confidence is ${confidenceScoreForProvider(provider)}%, below the 75% guardrail. Keep this profile in review until a human reviewer fixes it or approves it.`
      : "";
  }
  elements.profileEditMessage.textContent = "";
  elements.profileEditMessage.classList.remove("error");
  if (elements.profileEditPreviewAccessLink) {
    const accessUrl = provider.domain ? providerAccessUrlForProvider(provider) : "";
    elements.profileEditPreviewAccessLink.href = accessUrl || "#";
    elements.profileEditPreviewAccessLink.classList.toggle("isDisabled", !accessUrl);
    elements.profileEditPreviewAccessLink.setAttribute("aria-disabled", String(!accessUrl));
  }
  elements.profileEditDialog.showModal();
}

function visiblePageNumbers(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

function renderPagination({ currentPage, totalPages, totalCount, label, elements: controls, onPageChange }) {
  const pages = visiblePageNumbers(currentPage, totalPages);
  let previousPage = 0;

  controls.pageNumbers.innerHTML = pages
    .map((page) => {
      const gap = page - previousPage > 1 ? `<span class="paginationGap">...</span>` : "";
      previousPage = page;

      return `
        ${gap}
        <button class="${page === currentPage ? "active" : ""}" type="button" data-page="${page}" aria-label="Go to ${label} page ${page}">
          ${page}
        </button>
      `;
    })
    .join("");

  controls.pageInfo.textContent = totalCount
    ? `Page ${currentPage} of ${totalPages} · ${totalCount} ${label}`
    : `Page 1 of 1 · 0 ${label}`;
  controls.prevButton.disabled = currentPage <= 1;
  controls.nextButton.disabled = currentPage >= totalPages;

  controls.pageNumbers.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      onPageChange(Number.parseInt(button.dataset.page, 10));
    });
  });
}

function jobRow(job) {
  const actions = [
    job.status === "queued"
      ? actionButton("process", "Process", `data-run-job="${escapeHtml(job.id || "")}"`)
      : "",
    job.id
      ? actionButton("delete", "Delete", `data-delete-job="${escapeHtml(job.id)}"`)
      : "",
  ].filter(Boolean).join("");

  return `
    <article class="adminTableRow adminJobRow">
      <div class="adminCell adminCellPrimary">
        <strong>${escapeHtml(job.company_name || job.domain || job.url)}</strong>
        <span title="${escapeHtml(job.url || job.error || "")}">${escapeHtml(job.error ? `Error: ${job.error}` : job.url || "")}</span>
      </div>
      <div class="adminCell"><span>${escapeHtml(job.requested_by || "Unknown")}</span></div>
      <div class="adminCell">${statusPill(job.status)}</div>
      <div class="adminCell"><span>${escapeHtml(job.created_at ? new Date(job.created_at).toLocaleString() : "No date")}</span></div>
      <div class="adminCell adminCellAction">${actions}</div>
    </article>
  `;
}

function providerForJob(job = {}) {
  const resultProviderId = String(job.result_provider_id || job.resultProviderId || "").trim();
  const jobDomain = String(job.domain || "").trim().toLowerCase();

  return state.providers.find((provider) => (
    resultProviderId && String(provider.id || "").trim() === resultProviderId
  )) || state.providers.find((provider) => (
    jobDomain && String(provider.domain || "").trim().toLowerCase() === jobDomain
  )) || null;
}

function compactJobRow(job) {
  const provider = providerForJob(job);
  const logoProvider = provider || {
    companyName: job.company_name || job.domain || job.url,
    domain: job.domain || "",
  };

  return `
    <article class="adminTableRow adminJobRow adminCompactRow adminDashboardJobRow">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity adminDashboardJobIdentity">
          ${providerLogo(logoProvider)}
          <span>
            <strong>${escapeHtml(job.company_name || job.domain || job.url)}</strong>
            <span>${escapeHtml(job.domain || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell">${statusPill(job.status)}</div>
      <div class="adminCell"><span>${escapeHtml(job.created_at ? new Date(job.created_at).toLocaleDateString() : "No date")}</span></div>
    </article>
  `;
}

function providerMissingIssues(provider = {}) {
  const issues = [];
  const location = [provider.companyLocation?.city || provider.city, provider.companyLocation?.country || provider.country].filter(Boolean);

  if (!provider.companyName) issues.push("Company name");
  if (!provider.website) issues.push("Website");
  if (!provider.logoUrl) issues.push("Logo");
  if (location.length < 2) issues.push("City/country");
  if (!provider.description) issues.push("Introduction");
  if (!Array.isArray(provider.services) || provider.services.length === 0) issues.push("Services");
  if (normalizeIndustryList(provider.industries, provider.focusAreas).length === 0) issues.push("Industries");
  if (!Array.isArray(provider.technologies) || provider.technologies.length === 0) issues.push("Technologies");
  if (isBelowConfidenceGuardrail(provider)) issues.push("Below 75% confidence guardrail");

  return issues;
}

function scraperQualityLogCount(provider = {}) {
  const log = scraperQualityLogForProfile(provider);

  return log.missing.length + log.incorrect.length + log.added.length + (log.notes ? 1 : 0) + (log.feedback ? 1 : 0);
}

function confidenceLabel(provider = {}) {
  const score = provider.confidenceScore ?? provider.confidence_score;

  if (score === null || score === undefined || score === "") {
    return "N/A";
  }

  const parsedScore = Number.parseInt(score, 10);

  return Number.isFinite(parsedScore) ? `${parsedScore}%` : "N/A";
}

function issueChips(issues) {
  return issues.map((issue) => `<span class="adminIssueChip">${escapeHtml(issue)}</span>`).join("");
}

function missingDataRow(provider) {
  const key = providerKey(provider);
  const issues = providerMissingIssues(provider);
  const attentionClass = isBelowConfidenceGuardrail(provider) ? " adminLowConfidenceRow" : "";

  return `
    <article class="adminTableRow adminMissingDataRow${attentionClass}">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain || "Unnamed provider")}</strong>
            <span>${escapeHtml([provider.companyLocation?.city || provider.city, provider.companyLocation?.country || provider.country].filter(Boolean).join(", ") || "Location missing")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell adminIssueCell">${issueChips(issues)}</div>
      <div class="adminCell"><span>${escapeHtml(confidenceLabel(provider))}</span></div>
      <div class="adminCell adminCellAction">${key ? providerActions(provider, { includeEdit: true, includeRecrawl: true, includeProfile: true, includeOutreach: false }) : ""}</div>
    </article>
  `;
}

function renderMissingDataReview() {
  if (!elements.missingDataList) {
    return;
  }

  const providersWithIssues = state.providers
    .map((provider) => ({ provider, issues: providerMissingIssues(provider) }))
    .filter((item) => item.issues.length > 0);

  elements.missingDataList.innerHTML = providersWithIssues.length
    ? `${tableHeader(["Company", "Missing / Needs Review", "Confidence", "Actions"])}${providersWithIssues.map((item) => missingDataRow(item.provider)).join("")}`
    : emptyState("No missing data issues found.");
}

function tagStatusPill(tag = {}) {
  const status = tag.status || "candidate";
  const label = status.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return `<span class="statusPill statusPill-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

function tagCategoryLabel(category) {
  if (category === "industries") {
    return "Industries";
  }

  if (category === "vendor_partnerships") {
    return "Vendor Partnerships";
  }

  return category === "technologies" ? "Technologies" : "Services";
}

function tagUsageCount(tag = {}) {
  return state.providers.filter((provider) => (
    tagValuesForCategory(provider, tag.category)
      .some((value) => normalizeTagKey(value) === normalizeTagKey(tag.name))
  )).length;
}

function filteredTags() {
  const search = state.tagFilters.search.trim().toLowerCase();

  return state.tags
    .filter((tag) => tag.status !== "merged")
    .filter((tag) => !state.tagFilters.category || tag.category === state.tagFilters.category)
    .filter((tag) => !state.tagFilters.status || tag.status === state.tagFilters.status)
    .filter((tag) => !search || `${tag.name} ${tag.category} ${tag.status}`.toLowerCase().includes(search))
    .sort((left, right) => {
      const statusOrder = { candidate: 0, approved: 1 };
      const leftStatus = statusOrder[left.status] ?? 2;
      const rightStatus = statusOrder[right.status] ?? 2;

      if (leftStatus !== rightStatus) {
        return leftStatus - rightStatus;
      }

      return String(left.name).localeCompare(String(right.name), undefined, { sensitivity: "base" });
    });
}

function renderTagSummary() {
  if (!elements.tagSummary) {
    return;
  }

  const activeTags = state.tags.filter((tag) => tag.status !== "merged");
  const candidate = activeTags.filter((tag) => tag.status === "candidate").length;
  const approved = activeTags.filter((tag) => tag.status === "approved").length;
  const services = activeTags.filter((tag) => tag.category === "services").length;
  const industries = activeTags.filter((tag) => tag.category === "industries").length;
  const technologies = activeTags.filter((tag) => tag.category === "technologies").length;
  const partnerships = activeTags.filter((tag) => tag.category === "vendor_partnerships").length;

  elements.tagSummary.innerHTML = [
    ["Needs Review", candidate],
    ["Approved", approved],
    ["Services", services],
    ["Industries", industries],
    ["Technologies", technologies],
    ["Partners", partnerships],
  ].map(([label, count]) => `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(count)}</strong>
    </article>
  `).join("");
}

function tagRow(tag) {
  const approvedTags = tagsForCategory(tag.category, { approvedOnly: true })
    .filter((item) => normalizeTagKey(item.name) !== normalizeTagKey(tag.name));
  const mergeOptions = approvedTags
    .map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`)
    .join("");
  const usageCount = tagUsageCount(tag);
  const canMerge = approvedTags.length > 0;
  const isCandidate = tag.status !== "approved";
  const approveAction = isCandidate
    ? actionButton("publish", "Approve", `data-approve-tag="${escapeHtml(tag.id)}"`)
    : "";
  const actions = renderActionCell([
    approveAction,
    actionButton("edit", "Save Rename", `data-save-tag="${escapeHtml(tag.id)}"`),
    actionButton("unpublish", "Merge", `data-merge-tag="${escapeHtml(tag.id)}"${canMerge ? "" : " disabled"}`),
  ]);

  return `
    <article class="adminTableRow adminTagRow${isCandidate ? " adminTagCandidateRow" : ""}">
      <div class="adminCell adminCellPrimary">
        <strong>${escapeHtml(tag.name)}</strong>
        <span>Used by ${escapeHtml(usageCount)} provider${usageCount === 1 ? "" : "s"}</span>
      </div>
      <div class="adminCell adminTagMetaCell">
        ${tagStatusPill(tag)}
      </div>
      <label class="adminCell adminTagInlineField">
        <span class="adminCellLabel">Rename</span>
        <input type="text" value="${escapeHtml(tag.name)}" data-tag-name="${escapeHtml(tag.id)}" aria-label="Edit tag name" />
      </label>
      <label class="adminCell adminTagInlineField">
        <span class="adminCellLabel">Merge Into Approved Tag</span>
        <select data-tag-merge-target="${escapeHtml(tag.id)}" aria-label="Merge target"${canMerge ? "" : " disabled"}>
          <option value="">${canMerge ? "Merge into..." : "No approved tags yet"}</option>
          ${mergeOptions}
        </select>
      </label>
      <div class="adminCell adminCellAction">${actions}</div>
    </article>
  `;
}

function tagGroupHeader(category, tags) {
  const candidateCount = tags.filter((tag) => tag.status === "candidate").length;

  return `
    <div class="adminTagGroupHeader">
      <span class="adminTagGroupTitle">${escapeHtml(tagCategoryLabel(category))}</span>
      <span class="adminTagGroupCount">${escapeHtml(tags.length)} tag${tags.length === 1 ? "" : "s"}${candidateCount ? ` · ${escapeHtml(candidateCount)} needs review` : ""}</span>
    </div>
  `;
}

function renderTags() {
  if (!elements.tagList) {
    return;
  }

  const tags = filteredTags();

  renderTagSummary();
  if (elements.tagApproveVisibleButton) {
    elements.tagApproveVisibleButton.disabled = !tags.some((tag) => tag.status === "candidate");
  }

  if (!tags.length) {
    elements.tagList.innerHTML = emptyState("No tags match the current filters.");
    bindTagButtons();
    return;
  }

  const header = tableHeader(["Tag", "Status", "Rename", "Merge Target", "Actions"]);

  if (state.tagFilters.category) {
    elements.tagList.innerHTML = `${header}${tags.map(tagRow).join("")}`;
    bindTagButtons();
    return;
  }

  const groupedBody = ["services", "industries", "technologies", "vendor_partnerships"]
    .map((category) => {
      const groupTags = tags.filter((tag) => tag.category === category);

      return groupTags.length ? `${tagGroupHeader(category, groupTags)}${groupTags.map(tagRow).join("")}` : "";
    })
    .join("");

  elements.tagList.innerHTML = `${header}${groupedBody}`;
  bindTagButtons();
}

function findTag(id) {
  return state.tags.find((tag) => String(tag.id) === String(id));
}

async function saveTagUpdate(id, patch) {
  const response = await fetch("/api/admin-tags", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id, ...patch }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update tag.");
  }

  await refreshAdminState();
  return payload;
}

function bindTagButtons() {
  document.querySelectorAll("[data-tag-name]").forEach((input) => {
    input.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const id = input.dataset.tagName;
      const button = document.querySelector(`[data-save-tag="${CSS.escape(id)}"]`);
      await runAdminAction(button || input, "Saving", "Tag saved.", () => (
        saveTagUpdate(id, { name: input.value })
      ));
    });
  });

  document.querySelectorAll("[data-approve-tag]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Approving", "Tag approved.", () => (
        saveTagUpdate(button.dataset.approveTag, { status: "approved" })
      ));
    });
  });

  document.querySelectorAll("[data-save-tag]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = document.querySelector(`[data-tag-name="${CSS.escape(button.dataset.saveTag)}"]`);
      await runAdminAction(button, "Saving", "Tag saved.", () => (
        saveTagUpdate(button.dataset.saveTag, { name: input.value })
      ));
    });
  });

  document.querySelectorAll("[data-merge-tag]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) {
        return;
      }

      const select = document.querySelector(`[data-tag-merge-target="${CSS.escape(button.dataset.mergeTag)}"]`);
      const tag = findTag(button.dataset.mergeTag);

      if (!select.value) {
        showToast("Choose a merge target first.", "error");
        return;
      }

      await runAdminAction(button, "Merging", "Tag merged.", () => (
        saveTagUpdate(button.dataset.mergeTag, { mergeTarget: select.value, category: tag?.category })
      ));
    });
  });
}

async function approveVisibleTags() {
  const candidateTags = filteredTags().filter((tag) => tag.status === "candidate");

  if (candidateTags.length === 0) {
    showToast("No visible candidate tags to approve.");
    return false;
  }

  for (const tag of candidateTags) {
    await saveTagUpdate(tag.id, { status: "approved" });
  }

  return true;
}

function renderStats() {
  const queued = state.jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const failed = state.jobs.filter((job) => job.status === "failed").length;
  const review = state.providers.filter(isReviewProvider).length;
  const published = state.providers.filter(isLiveProvider).length;
  const outreachDrafts = state.providers.reduce((count, provider) => (
    count + (provider.outreachMessages || []).filter((message) => message.status === "draft").length
  ), 0);
  const pendingRequests = [
    ...state.claimRequests.filter((request) => request.status === "pending"),
    ...state.providerLeads.filter((lead) => lead.status === "new"),
  ].length;

  elements.queuedCount.textContent = queued;
  elements.reviewCount.textContent = review;
  elements.publishedCount.textContent = published;
  elements.failedCount.textContent = failed;
  if (elements.outreachDraftCount) {
    elements.outreachDraftCount.textContent = outreachDrafts;
  }
  if (elements.requestCount) {
    elements.requestCount.textContent = pendingRequests;
  }
}

function outreachSummaryForProvider(provider = {}) {
  const messages = provider.outreachMessages || [];
  const drafts = messages.filter((message) => message.status === "draft").length;
  const approved = messages.filter((message) => message.status === "approved").length;
  const sent = messages.filter((message) => ["sent", "opened", "clicked", "replied"].includes(message.status)).length;

  return { drafts, approved, sent, total: messages.length };
}

function outreachStageForProvider(provider = {}) {
  const contacts = provider.outreachContacts || [];
  const summary = outreachSummaryForProvider(provider);

  if (contacts.length === 0) {
    return "needs_contacts";
  }

  if (summary.total === 0) {
    return "needs_drafts";
  }

  if (summary.drafts > 0) {
    return "draft";
  }

  if (summary.approved > 0) {
    return "approved";
  }

  return "sent";
}

function outreachRowsForQueue() {
  return state.providers.filter((provider) => (
    isLiveProvider(provider) || (provider.outreachContacts || []).length > 0 || outreachSummaryForProvider(provider).total > 0
  ));
}

function filteredOutreachProviders() {
  const search = state.outreachFilters.search.trim().toLowerCase();
  const status = state.outreachFilters.status;

  return outreachRowsForQueue()
    .filter((provider) => {
      if (status && outreachStageForProvider(provider) !== status) {
        return false;
      }

      if (search) {
        const haystack = `${provider.companyName || ""} ${provider.domain || ""}`.toLowerCase();

        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => {
      const leftSummary = outreachSummaryForProvider(left);
      const rightSummary = outreachSummaryForProvider(right);

      return rightSummary.drafts - leftSummary.drafts
        || String(left.companyName || left.domain).localeCompare(String(right.companyName || right.domain));
    });
}

function outreachStageLabel(stage) {
  return {
    needs_contacts: "Needs contacts",
    needs_drafts: "Needs drafts",
    draft: "Drafts to review",
    approved: "Approved, not sent",
    sent: "Sent",
  }[stage] || titleCase(stage);
}

const OUTREACH_CYCLE_STAGE_LABELS = {
  cycle_1_sent: "Email 1 sent",
  cycle_2_sent: "Email 2 sent",
  cycle_3_sent: "Email 3 sent",
};
const OUTREACH_CYCLE_NEXT_STEP = {
  not_started: "email_1",
  cycle_1_sent: "email_2",
  cycle_2_sent: "email_3",
};
const OUTREACH_CYCLE_RESOLUTION_TONE = {
  claimed: "approved",
  removed: "merged",
  no_response: "merged",
  opted_out: "merged",
  replied_other: "draft",
};

function outreachCycleLabel(cycle) {
  if (!cycle || cycle.stage === "not_started") {
    return "Not started";
  }

  if (cycle.resolution) {
    return `Closed - ${titleCase(cycle.resolution)}`;
  }

  const stageLabel = OUTREACH_CYCLE_STAGE_LABELS[cycle.stage] || titleCase(cycle.stage);
  const due = cycle.nextActionDueAt ? ` - next due ${new Date(cycle.nextActionDueAt).toLocaleDateString()}` : "";
  const paused = cycle.paused ? " (paused)" : "";

  return `${stageLabel}${due}${paused}`;
}

function cycleStagePill(cycle) {
  const tone = cycle?.resolution
    ? (OUTREACH_CYCLE_RESOLUTION_TONE[cycle.resolution] || "draft")
    : (cycle?.stage && cycle.stage !== "not_started" ? "draft" : "");

  return `<span class="statusPill${tone ? ` statusPill-${escapeHtml(tone)}` : ""}">${escapeHtml(outreachCycleLabel(cycle))}</span>`;
}

// The next approved-but-unsent email_1/2/3 draft for this provider's current
// cycle stage, or null if there's nothing ready to send yet.
function sendableMessageForProvider(provider) {
  const cycle = provider.outreachCycle;

  if (cycle?.resolution || cycle?.paused) {
    return null;
  }

  const nextStep = OUTREACH_CYCLE_NEXT_STEP[cycle?.stage || "not_started"];

  if (!nextStep) {
    return null;
  }

  return (provider.outreachMessages || []).find((message) => (
    message.messageStep === nextStep && message.status === "approved"
  )) || null;
}

// Whether messageStep is the one send-outreach.js/the follow-up job would
// actually act on next, regardless of its current approval status - used to
// decide whether to offer a Send button in the compose dialog.
function isNextSendableStep(provider, messageStep) {
  const cycle = provider.outreachCycle;

  if (cycle?.resolution || cycle?.paused) {
    return false;
  }

  return OUTREACH_CYCLE_NEXT_STEP[cycle?.stage || "not_started"] === messageStep;
}

const OUTREACH_MESSAGE_STATUS_TONE = {
  draft: "draft",
  approved: "approved",
  sent: "outreach_active",
  opened: "outreach_active",
  clicked: "outreach_active",
  replied: "approved",
};

function outreachMessageStatusPill(status) {
  const tone = OUTREACH_MESSAGE_STATUS_TONE[status] || "draft";

  return `<span class="statusPill statusPill-${escapeHtml(tone)}">${escapeHtml(titleCase(status))}</span>`;
}

function outreachProviderRow(provider) {
  const summary = outreachSummaryForProvider(provider);
  const stage = outreachStageForProvider(provider);
  const messageText = [
    summary.drafts ? `${summary.drafts} draft${summary.drafts === 1 ? "" : "s"}` : "",
    summary.approved ? `${summary.approved} approved` : "",
    summary.sent ? `${summary.sent} sent` : "",
  ].filter(Boolean).join(", ") || "No messages yet";
  const cycle = provider.outreachCycle;
  const sendableMessage = sendableMessageForProvider(provider);
  const key = escapeHtml(provider.id || provider.domain || "");
  const editDraftsButton = actionButton("edit", "Edit Drafts", `data-open-outreach-compose="${key}"`);
  const outreachPageLink = provider.domain
    ? actionLink("access", "Outreach Page", providerAccessUrlForProvider(provider), 'target="_blank" rel="noopener"')
    : "";
  const cycleActive = Boolean(cycle && cycle.stage !== "not_started" && !cycle.resolution);
  const sendButton = sendableMessage
    ? actionButton("publish", "Send", `data-send-outreach="${escapeHtml(sendableMessage.id)}"`)
    : null;
  const markRepliedButton = cycleActive
    ? actionButton("process", "Mark Replied", `data-mark-replied="${escapeHtml(provider.id)}"`)
    : null;
  const pauseResumeButton = cycleActive
    ? actionButton("recrawl", cycle.paused ? "Resume" : "Pause", `data-toggle-outreach-pause="${escapeHtml(provider.id)}" data-outreach-pause="${cycle.paused ? "false" : "true"}"`)
    : null;

  // Exactly one primary action shown per row (Send once approved, otherwise
  // Mark Replied once a cycle is running, otherwise Edit Drafts) - everything
  // else, including whichever of those didn't win, collapses into "More".
  const primaryAction = sendButton || markRepliedButton || editDraftsButton;
  const moreActions = [editDraftsButton, outreachPageLink, markRepliedButton, pauseResumeButton]
    .filter((action) => action && action !== primaryAction);
  const actions = renderOutreachActionCell([primaryAction, ...moreActions]);

  const selectable = Boolean(sendableMessage);
  const selected = selectable && state.outreachSelection.has(key);

  return `
    <article class="adminTableRow adminOutreachRow">
      <div class="adminCell adminCellSelect">
        <input
          type="checkbox"
          data-outreach-select="${key}"
          aria-label="Select ${escapeHtml(provider.companyName || provider.domain || "provider")} for bulk send"
          ${selectable ? "" : "disabled"}
          ${selected ? "checked" : ""}
        />
      </div>
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain || "Unnamed provider")}</strong>
            <span>${escapeHtml(provider.domain || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell">${statusPill(lifecycleStatusForProvider(provider))}</div>
      <div class="adminCell"><span title="${escapeHtml(`${outreachStageLabel(stage)} - ${messageText}`)}">${escapeHtml(outreachStageLabel(stage))} - ${escapeHtml(messageText)}</span></div>
      <div class="adminCell">${cycleStagePill(cycle)}</div>
      <div class="adminCell adminCellAction">${actions}</div>
    </article>
  `;
}

function renderOutreach() {
  if (!elements.outreachProviderList) {
    return;
  }

  const queue = outreachRowsForQueue();

  if (elements.outreachSummaryGrid) {
    elements.outreachSummaryGrid.innerHTML = [
      metricCard("Needs contacts", queue.filter((provider) => outreachStageForProvider(provider) === "needs_contacts").length, "", "warning"),
      metricCard("Needs drafts", queue.filter((provider) => outreachStageForProvider(provider) === "needs_drafts").length, "", "mail"),
      metricCard("Drafts to review", queue.filter((provider) => outreachStageForProvider(provider) === "draft").length, "", "mail"),
      metricCard("Approved, not sent", queue.filter((provider) => outreachStageForProvider(provider) === "approved").length, "", "check"),
    ].join("");
  }

  const providers = filteredOutreachProviders();

  // Drop anything from the selection that's no longer sendable (already
  // sent, unapproved, filtered out) so a stale checkbox can never bulk-send
  // something it shouldn't.
  const selectableKeys = new Set(
    providers.filter((provider) => sendableMessageForProvider(provider)).map((provider) => providerKey(provider))
  );
  for (const key of state.outreachSelection) {
    if (!selectableKeys.has(key)) {
      state.outreachSelection.delete(key);
    }
  }

  const outreachTableHeader = `
    <div class="adminTableHeader">
      <span class="adminCellSelect">
        <input
          type="checkbox"
          id="outreachSelectAll"
          aria-label="Select all providers with an approved draft"
          ${selectableKeys.size === 0 ? "disabled" : ""}
          ${selectableKeys.size > 0 && state.outreachSelection.size === selectableKeys.size ? "checked" : ""}
        />
      </span>
      <span>Company</span>
      <span>Status</span>
      <span>Messages</span>
      <span>Cycle</span>
      <span>Actions</span>
    </div>
  `;

  elements.outreachProviderList.innerHTML = providers.length
    ? `${outreachTableHeader}${providers.map(outreachProviderRow).join("")}`
    : emptyState("No providers match the current outreach filters.");

  if (elements.outreachBulkBar) {
    elements.outreachBulkBar.hidden = state.outreachSelection.size === 0;
  }

  if (elements.outreachBulkCount) {
    elements.outreachBulkCount.textContent = `${state.outreachSelection.size} selected`;
  }
}

// Compose-style card for one email_1/2/3 draft inside the dedicated outreach
// dialog - deliberately styled and behaves like an email client (To/Subject/
// body, Approve & Save, Send) rather than a generic form row. Reuses the same
// .outreachMessageRow wrapper and data-message-field inputs as the profile
// editor's outreachMessageRowMarkup so collectOutreachMessages() works on
// either container unchanged.
function outreachComposeMessageMarkup(message = {}, provider = {}) {
  const normalizedMessage = normalizeOutreachMessage(message);
  const stepDef = OUTREACH_MESSAGE_STEPS.find((step) => step.messageStep === normalizedMessage.messageStep) || OUTREACH_MESSAGE_STEPS[0];
  const isEmail = stepDef.channel === "email";
  const isLinkedIn = stepDef.channel === "linkedin";
  const isClaimInvite = stepDef.messageStep === "claim_profile_invitation";
  const accessUrl = providerAccessUrlForProvider(provider);
  const toEmail = primaryContactEmailForProvider(provider, normalizedMessage.contactId);
  const locked = ["sent", "opened", "clicked", "replied"].includes(normalizedMessage.status);
  const canSendHere = isEmail && !locked && isNextSendableStep(provider, stepDef.messageStep);

  return `
    <article class="outreachMessageRow outreachComposeMessage" data-message-step="${escapeHtml(stepDef.messageStep)}" data-message-channel="${escapeHtml(stepDef.channel)}">
      <div class="outreachComposeMessageHeader">
        <div class="outreachComposeMessageLabel">
          <strong>${escapeHtml(stepDef.label)}</strong>
          <span>${escapeHtml(stepDef.channel.replace(/_/g, " "))}</span>
        </div>
        ${outreachMessageStatusPill(normalizedMessage.status)}
      </div>
      ${isEmail ? `
        <div class="outreachComposeField outreachComposeToField">
          <span>To</span>
          <span>${escapeHtml(toEmail || "No contact email set")}</span>
        </div>
      ` : ""}
      ${isClaimInvite ? `
        <div class="outreachAccessLink">
          <span>Provider access link</span>
          <a href="${escapeHtml(accessUrl)}" target="_blank" rel="noreferrer">${escapeHtml(accessUrl)}</a>
        </div>
      ` : ""}
      <label class="outreachComposeField" ${isLinkedIn ? "hidden" : ""}>
        <span>Subject</span>
        <input data-message-field="subject" type="text" value="${escapeHtml(normalizedMessage.subject)}" placeholder="${escapeHtml(stepDef.label)} subject" ${locked ? "readonly" : ""} />
      </label>
      <label class="outreachComposeField outreachComposeBodyField">
        <span>Message</span>
        <textarea data-message-field="body" rows="${isLinkedIn ? "5" : "10"}" placeholder="${escapeHtml(stepDef.label)} body" ${locked ? "readonly" : ""}>${escapeHtml(normalizedMessage.body)}</textarea>
      </label>
      <input data-message-field="id" type="hidden" value="${escapeHtml(normalizedMessage.id)}" />
      <input data-message-field="contactId" type="hidden" value="${escapeHtml(normalizedMessage.contactId)}" />
      <input data-message-field="generatedBy" type="hidden" value="${escapeHtml(normalizedMessage.generatedBy)}" />
      <input data-message-field="approvedBy" type="hidden" value="${escapeHtml(normalizedMessage.approvedBy)}" />
      <input data-message-field="approvedAt" type="hidden" value="${escapeHtml(normalizedMessage.approvedAt)}" />
      <input data-message-field="sentAt" type="hidden" value="${escapeHtml(normalizedMessage.sentAt)}" />
      <input data-message-field="status" type="hidden" value="${escapeHtml(normalizedMessage.status)}" />
      <input data-message-field="cycleNumber" type="hidden" value="${normalizedMessage.cycleNumber ?? ""}" />
      <textarea data-message-metadata hidden>${escapeHtml(JSON.stringify(normalizedMessage.metadata || {}))}</textarea>
      <div class="outreachComposeFooter">
        <button class="secondaryAction compactAction outreachMessageCopy" type="button">Copy</button>
        ${isEmail ? `<button class="secondaryAction compactAction outreachMessagePreview" type="button">Preview</button>` : ""}
        ${!locked && normalizedMessage.status === "draft" ? `<button class="primaryAction compactAction outreachComposeApprove" type="button">Approve &amp; Save</button>` : ""}
        ${!locked && normalizedMessage.status === "approved" ? `<button class="secondaryAction compactAction outreachComposeSave" type="button">Save Changes</button>` : ""}
        ${canSendHere && normalizedMessage.status === "approved" ? `<button class="primaryAction compactAction outreachComposeSend" type="button">Send Email</button>` : ""}
      </div>
    </article>
  `;
}

function renderOutreachComposeHeader(provider) {
  elements.outreachComposeLogo.innerHTML = providerLogo(provider);
  elements.outreachComposeCompanyName.textContent = provider.companyName || provider.domain || "Unnamed provider";
  elements.outreachComposeDomain.textContent = provider.domain || "";
  elements.outreachComposeCycle.innerHTML = cycleStagePill(provider.outreachCycle);
}

function renderOutreachComposeMessages() {
  const key = elements.outreachComposeKey.value;
  const provider = findProvider(key);

  if (!provider) {
    return;
  }

  renderOutreachComposeHeader(provider);

  if ((provider.outreachMessages || []).length === 0) {
    elements.outreachComposeMessages.innerHTML = `
      <div class="emptyResults">
        No drafts yet for this provider.
        <button class="primaryAction compactAction" type="button" id="outreachComposeGenerateInline">Generate Drafts</button>
      </div>
    `;
    document.querySelector("#outreachComposeGenerateInline")?.addEventListener("click", async (event) => {
      await runAdminAction(event.currentTarget, "Generating", "Outreach drafts generated.", () => (
        generateOutreachMessagesForKey(key)
      ));
      renderOutreachComposeMessages();
    });
    return;
  }

  const byStep = outreachMessagesByStep(provider.outreachMessages);
  elements.outreachComposeMessages.innerHTML = OUTREACH_MESSAGE_STEPS
    // Edit Drafts only shows the 3-email sequence, which is all that's ever
    // actually sent automatically - LinkedIn and the claim invite are
    // separate drafts still generated and stored, just not shown here.
    .filter((step) => step.channel === "email")
    .map((step) => outreachComposeMessageMarkup(byStep.get(step.messageStep) || step, provider))
    .join("");
}

function openOutreachCompose(key) {
  const provider = findProvider(key);

  if (!provider) {
    return;
  }

  elements.outreachComposeKey.value = key;
  renderOutreachComposeMessages();
  elements.outreachComposeDialog.showModal();
}

// Persists only the outreach_messages set for a provider - admin-provider.js
// leaves every other field untouched when `profile` only contains this key.
async function saveOutreachMessagesForKey(key, container) {
  if (!key) {
    return false;
  }

  // The compose dialog only shows/collects the 3 emails - saving replaces
  // *all* of a provider's outreach_messages, so the LinkedIn and Claim
  // Invite drafts (generated alongside the emails, just not shown here)
  // have to be carried through by hand or they'd be silently deleted.
  const collectedMessages = collectOutreachMessages(container);
  const collectedSteps = new Set(collectedMessages.map((message) => message.messageStep));
  const untouchedMessages = (findProvider(key)?.outreachMessages || [])
    .filter((message) => !collectedSteps.has(message.messageStep));
  const outreachMessages = [...collectedMessages, ...untouchedMessages];

  const response = await fetch("/api/admin-provider", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key, profile: { outreachMessages } }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to save outreach drafts.");
  }

  await refreshAdminState();
  return payload;
}

function compactOutreachProviderRow(provider) {
  const key = providerKey(provider);
  const summary = outreachSummaryForProvider(provider);
  const statusText = [
    summary.drafts ? `${summary.drafts} draft` : "",
    summary.approved ? `${summary.approved} approved` : "",
    summary.sent ? `${summary.sent} sent` : "",
  ].filter(Boolean).join(", ") || "No messages";

  return `
    <article class="adminTableRow adminCompactRow">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain || "Untitled")}</strong>
            <span>${escapeHtml(provider.domain || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml(statusText)}</span></div>
      <div class="adminCell adminCellAction">${actionButton("edit", "Edit", `data-edit-provider="${escapeHtml(key)}"`)}</div>
    </article>
  `;
}

function requestProviderAction(domain) {
  const provider = findProviderByDomain(domain);

  if (!provider) {
    return "";
  }

  return actionButton("edit", "Provider", `data-edit-provider="${escapeHtml(providerKey(provider))}"`);
}

function compactRequestRow(item) {
  const kind = item.requestType ? titleCase(item.requestType) : "Lead";
  const status = item.status || "pending";

  return `
    <article class="adminTableRow adminCompactRow">
      <div class="adminCell adminCellPrimary">
        <span>
          <strong>${escapeHtml(item.domain || "Unknown provider")}</strong>
          <span>${escapeHtml(item.email || "")}</span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml(kind)}</span></div>
      <div class="adminCell"><span>${escapeHtml(titleCase(status))}</span></div>
    </article>
  `;
}

const SAMPLE_BADGE = `<span class="adminSampleBadge">Sample</span>`;

function claimRequestRow(request = {}, isSample = false) {
  const isPending = (request.status || "pending") === "pending";
  const domainMatch = request.metadata?.domainMatch;
  const emailDomain = request.metadata?.emailDomain || "";
  const metadataKeys = Object.entries(request.metadata || {})
    .filter(([key]) => !["domainMatch", "emailDomain"].includes(key))
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
    .slice(0, 3);
  const verificationText = request.verificationMethod
    ? request.verificationMethod.replace(/_/g, " ")
    : (domainMatch === false ? "email domain mismatch" : "manual review");
  const domainMatchText = domainMatch === true
    ? "Domain match"
    : domainMatch === false
      ? "Domain mismatch"
      : "Domain not checked";
  const reviewedText = request.reviewedAt
    ? `Reviewed ${formatActivityDate(request.reviewedAt)}${request.reviewedBy ? ` by ${request.reviewedBy}` : ""}`
    : "Not reviewed";
  const actions = isSample ? SAMPLE_BADGE : renderActionCell([
    requestProviderAction(request.domain),
    isPending ? actionButton("publish", "Approve", `data-review-claim-request="${escapeHtml(request.id)}" data-claim-review-status="approved"`) : "",
    isPending ? actionButton("delete", "Reject", `data-review-claim-request="${escapeHtml(request.id)}" data-claim-review-status="rejected"`) : "",
  ]);

  return `
    <article class="adminTableRow adminRequestRow">
      <div class="adminCell adminCellPrimary">
        <span>
          <strong>${escapeHtml(request.domain || "Unknown provider")}</strong>
          <span>${escapeHtml(request.email || "")}${emailDomain ? ` - ${escapeHtml(emailDomain)}` : ""}</span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml(titleCase(request.requestType || "claim"))}</span></div>
      <div class="adminCell">
        <span>
          ${escapeHtml(titleCase(request.status || "pending"))}
          <small>${escapeHtml(verificationText)} - ${escapeHtml(domainMatchText)}</small>
        </span>
      </div>
      <div class="adminCell">
        <span>
          ${escapeHtml(formatActivityDate(request.createdAt))}
          <small>${escapeHtml(reviewedText)}</small>
          ${metadataKeys.length ? `<small>${escapeHtml(metadataKeys.join("; "))}</small>` : ""}
        </span>
      </div>
      <div class="adminCell adminCellAction">${actions}</div>
    </article>
  `;
}

function providerLeadRow(lead = {}, isSample = false) {
  const status = lead.status || "new";
  const reviewedText = lead.reviewedAt
    ? `Reviewed ${formatActivityDate(lead.reviewedAt)}${lead.reviewedBy ? ` by ${lead.reviewedBy}` : ""}`
    : "Not reviewed";
  const actions = isSample ? SAMPLE_BADGE : renderActionCell([
    requestProviderAction(lead.domain),
    status !== "reviewed" ? actionButton("process", "Reviewed", `data-update-provider-lead="${escapeHtml(lead.id)}" data-provider-lead-status="reviewed"`) : "",
    status !== "forwarded" ? actionButton("publish", "Forwarded", `data-update-provider-lead="${escapeHtml(lead.id)}" data-provider-lead-status="forwarded"`) : "",
    status !== "closed" ? actionButton("delete", "Closed", `data-update-provider-lead="${escapeHtml(lead.id)}" data-provider-lead-status="closed"`) : "",
  ]);

  return `
    <article class="adminTableRow adminLeadRow">
      <div class="adminCell adminCellPrimary">
        <span>
          <strong>${escapeHtml(lead.domain || "Unknown provider")}</strong>
          <span>${escapeHtml([lead.name, lead.company].filter(Boolean).join(" - ") || lead.email || "")}</span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml(lead.email || "")}</span></div>
      <div class="adminCell"><span>${escapeHtml(lead.message || "")}</span></div>
      <div class="adminCell"><span>${escapeHtml(titleCase(status))}<small>${escapeHtml(reviewedText)}</small></span></div>
      <div class="adminCell"><span>${escapeHtml(formatActivityDate(lead.createdAt))}</span></div>
      <div class="adminCell adminCellAction">${actions}</div>
    </article>
  `;
}

const SAMPLE_CLAIM_REQUESTS = [
  {
    id: "sample-claim-1",
    domain: "adfinis.com",
    email: "jane.owner@adfinis.com",
    requestType: "claim",
    status: "pending",
    verificationMethod: "email_domain_match",
    metadata: { domainMatch: true, emailDomain: "adfinis.com" },
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "sample-claim-2",
    domain: "vshn.ch",
    email: "owner@vshn.ch",
    requestType: "removal",
    status: "approved",
    verificationMethod: "manual_review",
    metadata: { domainMatch: false, emailDomain: "vshn.ch" },
    reviewedBy: "admin@rocketengineers.com",
    reviewedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
];

const SAMPLE_PROVIDER_LEADS = [
  {
    id: "sample-lead-1",
    domain: "ti8m.com",
    name: "Alex Muller",
    company: "Acme Robotics",
    email: "alex@acmerobotics.com",
    message: "Looking for a Swiss cloud partner for a Kubernetes migration starting next quarter.",
    status: "new",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "sample-lead-2",
    domain: "puzzle.ch",
    name: "Sam Rivera",
    company: "Northwind Freight",
    email: "sam@northwindfreight.io",
    message: "Interested in a brokered introduction for a DevOps engagement.",
    status: "reviewed",
    reviewedBy: "admin@rocketengineers.com",
    reviewedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

function renderRequests() {
  const incoming = [
    ...state.claimRequests.map((request) => ({ ...request, requestType: request.requestType || "claim" })),
    ...state.providerLeads.map((lead) => ({ ...lead, requestType: "lead" })),
  ].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

  if (elements.dashboardRequestList) {
    elements.dashboardRequestList.innerHTML = incoming.length
      ? `${tableHeader(["Provider", "Type", "Status"])}${incoming.slice(0, 8).map(compactRequestRow).join("")}`
      : emptyState("No public requests yet.");
  }

  if (elements.requestsSampleNotice) {
    elements.requestsSampleNotice.hidden = !state.showSampleRequests;
  }

  if (elements.claimRequestList) {
    const claimRequests = state.showSampleRequests ? SAMPLE_CLAIM_REQUESTS : state.claimRequests;

    elements.claimRequestList.innerHTML = claimRequests.length
      ? `${tableHeader(["Provider", "Type", "Status", "Created", "Actions"])}${claimRequests.map((request) => claimRequestRow(request, state.showSampleRequests)).join("")}`
      : emptyState("No claim or removal requests yet.");
  }

  if (elements.providerLeadList) {
    const providerLeads = state.showSampleRequests ? SAMPLE_PROVIDER_LEADS : state.providerLeads;

    elements.providerLeadList.innerHTML = providerLeads.length
      ? `${tableHeader(["Provider", "Requester", "Message", "Status", "Created", "Actions"])}${providerLeads.map((lead) => providerLeadRow(lead, state.showSampleRequests)).join("")}`
      : emptyState("No brokered leads yet.");
  }
}

const METRIC_ICONS = {
  check: `<path d="m9.5 16.4-4.2-4.2 1.4-1.4 2.8 2.8 7.8-7.8 1.4 1.4-9.2 9.2Z" />`,
  warning: `<path d="M11 5h2v9h-2V5Zm0 11h2v3h-2v-3Z" />`,
  mail: `<path d="M4 5h16v10H7l-3 3V5Zm4 4v2h8V9H8Z" />`,
  doc: `<path d="M5 4h14v16H5V4Zm4 4h6v2H9V8Zm0 4h6v2H9v-2Z" />`,
  calendar: `<path d="M5 5h14v3H5V5Zm0 5h14v3H5v-3Zm0 5h9v3H5v-3Z" />`,
};

function metricCard(label, value, detail = "", icon = "") {
  const isAttention = ["warning"].includes(icon);

  return `
    <article class="${isAttention ? "metricCardAttention" : ""}">
      ${icon ? `<svg viewBox="0 0 24 24" aria-hidden="true">${METRIC_ICONS[icon] || ""}</svg>` : ""}
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </article>
  `;
}

function metricBreakdownRow(label, value) {
  return `
    <div class="metricBreakdownRow">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function metricsFromObject(values = {}) {
  const entries = Object.entries(values || {}).sort(([left], [right]) => left.localeCompare(right));

  return entries.length
    ? entries.map(([key, value]) => metricBreakdownRow(titleCase(key), value)).join("")
    : emptyState("No metrics yet.");
}

function signalMetricsMarkup(signalsByTypeAndStatus = {}) {
  const entries = Object.entries(signalsByTypeAndStatus || {}).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return metricBreakdownRow("Signals", 0);
  }

  return entries.map(([type, statuses]) => {
    const total = Object.values(statuses || {}).reduce((sum, value) => sum + value, 0);
    const detail = Object.entries(statuses || {})
      .map(([status, value]) => `${titleCase(status)} ${value}`)
      .join(", ");

    return `
      <div class="metricBreakdownRow">
        <span>${escapeHtml(titleCase(type))}<small>${escapeHtml(detail)}</small></span>
        <strong>${escapeHtml(total)}</strong>
      </div>
    `;
  }).join("");
}

function activityTimelineRow(entry = {}) {
  const providerLabel = [entry.providerName, entry.providerDomain].filter(Boolean).join(" - ");
  const group = activityGroupForType(entry.type || "");
  // Only self-serve edits carry a before/after snapshot (see
  // applyOwnerProfileEdit in supabaseStore.js) - that's what makes a
  // one-click revert possible for a write path with no review gate.
  const canRevert = entry.type === "provider_self_edited" && entry.providerId && entry.metadata?.before
    && Object.keys(entry.metadata.before).length > 0;

  return `
    <article class="adminActivityItem">
      <div>
        <span class="adminActivityGroup adminActivityGroup-${escapeHtml(group.key)}">${escapeHtml(group.label)}</span>
        <strong>${escapeHtml(entry.label || titleCase(entry.type || "activity"))}</strong>
        <span class="adminActivityDate">${escapeHtml(formatActivityDate(entry.createdAt))}</span>
      </div>
      <p>${escapeHtml(entry.summary || "")}</p>
      <small>${escapeHtml(providerLabel || entry.actorEmail || "System")}</small>
      ${canRevert
        ? `<button class="secondaryAction adminActivityRevert" type="button" data-revert-provider="${escapeHtml(entry.providerId)}" data-revert-snapshot="${escapeHtml(JSON.stringify(entry.metadata.before))}">Revert this edit</button>`
        : ""}
    </article>
  `;
}

function bindActivityRevertButtons() {
  document.querySelectorAll("[data-revert-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Revert this edit? This restores the field values from just before it was made.")) {
        return;
      }

      const providerId = button.dataset.revertProvider;
      let snapshot;

      try {
        snapshot = JSON.parse(button.dataset.revertSnapshot || "{}");
      } catch (error) {
        showToast("Could not read the revert snapshot.", "error");
        return;
      }

      await runAdminAction(
        button,
        "Reverting",
        "Reverted to the values from before that edit.",
        () => revertOwnerEdit(providerId, snapshot)
      );
    });
  });
}

async function revertOwnerEdit(providerId, snapshot) {
  const response = await fetch("/api/admin-provider", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id: providerId, profile: snapshot }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to revert.");
  }

  await refreshAdminState();
  return payload;
}

function filteredActivityEvents() {
  const search = state.activityFilters.search.trim().toLowerCase();
  const group = state.activityFilters.group;

  const filtered = state.activityEvents.filter((entry) => {
    if (group && activityGroupForType(entry.type || "").key !== group) {
      return false;
    }

    if (search) {
      const providerLabel = [entry.providerName, entry.providerDomain].filter(Boolean).join(" ");
      const haystack = `${entry.label || ""} ${entry.summary || ""} ${providerLabel} ${entry.actorEmail || ""}`.toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });

  return filtered.sort((left, right) => {
    const direction = state.activityFilters.sort === "asc" ? 1 : -1;

    return (new Date(left.createdAt) - new Date(right.createdAt)) * direction;
  });
}

function renderActivityGroupOptions() {
  if (!elements.activityGroupFilter) {
    return;
  }

  const previousValue = state.activityFilters.group;
  const presentGroupKeys = new Set(state.activityEvents.map((entry) => activityGroupForType(entry.type || "").key));
  const availableGroups = ACTIVITY_GROUPS.filter((group) => presentGroupKeys.has(group.key));

  elements.activityGroupFilter.innerHTML = [
    `<option value="">All activity</option>`,
    ...availableGroups.map((group) => `<option value="${escapeHtml(group.key)}">${escapeHtml(group.label)}</option>`),
  ].join("");
  elements.activityGroupFilter.value = availableGroups.some((group) => group.key === previousValue) ? previousValue : "";
  state.activityFilters.group = elements.activityGroupFilter.value;
}

function readinessWarningMarkup(warning = {}) {
  return `
    <article class="adminReadinessWarning ${warning.severity === "error" ? "isError" : ""}">
      <strong>${escapeHtml(warning.title || "Readiness warning")}</strong>
      ${warning.detail ? `<p>${escapeHtml(warning.detail)}</p>` : ""}
    </article>
  `;
}

function renderReadinessWarnings() {
  if (!elements.readinessWarnings) {
    return;
  }

  const readiness = state.readiness || {};
  const warnings = readiness.warnings || [];

  elements.readinessWarnings.hidden = warnings.length === 0;
  elements.readinessWarnings.innerHTML = warnings.length
    ? `
      <div class="adminReadinessHeader">
        <strong>Sprint 2 readiness needs attention</strong>
        <span>${readiness.auditHistory?.decision || "Normalized audit tables are the canonical history source."}</span>
      </div>
      ${warnings.map(readinessWarningMarkup).join("")}
    `
    : "";
}

function renderMetrics() {
  const metrics = state.metrics || {};
  const emailEngagement = metrics.emailEngagement || {};

  if (elements.metricsSummary) {
    elements.metricsSummary.innerHTML = [
      metricCard("Approved profiles", metrics.approvedProfiles || 0, "", "check"),
      metricCard("Outreach pending", metrics.outreachPending || 0, "", "mail"),
      metricCard("Outreach active", metrics.outreachActive || 0, "", "mail"),
      metricCard("Claimed profiles", metrics.claimedProfiles || 0, "", "doc"),
      metricCard("Leads submitted", metrics.leadsSubmitted || 0, `${metrics.openLeads || 0} new`, "doc"),
      metricCard("Approved stories", metrics.approvedSuccessStories || 0, "", "check"),
      metricCard("Upcoming events", metrics.upcomingApprovedEvents || 0, "", "calendar"),
      metricCard("Scrape failures", metrics.scrapeFailures || 0, "", "warning"),
      metricCard("Low confidence", metrics.lowConfidenceProfiles || 0, "", "warning"),
      metricCard("Removal requests", metrics.removalRequests || 0, "", "warning"),
    ].join("");
  }

  if (elements.profileStatusMetrics) {
    elements.profileStatusMetrics.innerHTML = metricsFromObject(metrics.profilesByStatus);
  }

  if (elements.outreachSignalMetrics) {
    elements.outreachSignalMetrics.innerHTML = `
      <section>
        <h3>Outreach Messages</h3>
        ${metricsFromObject(metrics.outreachMessagesByStatus)}
      </section>
      <section>
        <h3>Email Engagement</h3>
        ${[
          metricBreakdownRow("Sent", emailEngagement.sent || 0),
          metricBreakdownRow("Opened", emailEngagement.opened || 0),
          metricBreakdownRow("Clicked", emailEngagement.clicked || 0),
          metricBreakdownRow("Replied", emailEngagement.replied || 0),
          metricBreakdownRow("Sending Enabled", emailEngagement.enabled ? "Yes" : "No"),
        ].join("")}
      </section>
      <section>
        <h3>Signals</h3>
        ${signalMetricsMarkup(metrics.signalsByTypeAndStatus)}
      </section>
    `;
  }

  if (elements.activityTimeline) {
    renderActivityGroupOptions();

    if (elements.activitySortButton) {
      elements.activitySortButton.querySelector("span").textContent = state.activityFilters.sort === "asc" ? "Oldest first" : "Newest first";
    }

    const filtered = filteredActivityEvents();

    elements.activityTimeline.innerHTML = filtered.length
      ? filtered.slice(0, 30).map(activityTimelineRow).join("")
      : emptyState("No activity events match the current filters.");
    bindActivityRevertButtons();
  }
}

function bindPublishButtons() {
  document.querySelectorAll("[data-select-provider]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedProviders.add(checkbox.dataset.selectProvider);
      } else {
        state.selectedProviders.delete(checkbox.dataset.selectProvider);
      }

      updateBulkControls();
    });
  });

  document.querySelectorAll("[data-publish-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Approving", "Provider approved and live.", () => (
        publishProvider(button.dataset.publishProvider)
      ));
    });
  });

  document.querySelectorAll("[data-edit-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      openEditProfile(button.dataset.editProvider);
      showToast("Profile editor opened.");
    });
  });

  document.querySelectorAll("[data-open-outreach-compose]").forEach((button) => {
    button.addEventListener("click", () => {
      openOutreachCompose(button.dataset.openOutreachCompose);
    });
  });

  document.querySelectorAll("[data-outreach-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const key = checkbox.dataset.outreachSelect;

      if (checkbox.checked) {
        state.outreachSelection.add(key);
      } else {
        state.outreachSelection.delete(key);
      }

      renderOutreach();
    });
  });

  document.querySelector("#outreachSelectAll")?.addEventListener("change", (event) => {
    document.querySelectorAll("[data-outreach-select]:not(:disabled)").forEach((checkbox) => {
      if (event.target.checked) {
        state.outreachSelection.add(checkbox.dataset.outreachSelect);
      } else {
        state.outreachSelection.delete(checkbox.dataset.outreachSelect);
      }
    });

    renderOutreach();
  });

  document.querySelectorAll("[data-unpublish-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Unpublishing", "Provider moved to review.", () => (
        updateProviderStatus(button.dataset.unpublishProvider, "in_review")
      ));
    });
  });

  document.querySelectorAll("[data-delete-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Deleting", "Provider deleted.", () => (
        deleteProvider(button.dataset.deleteProvider)
      ));
    });
  });

  document.querySelectorAll("[data-recrawl-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Recrawling", "Recrawl complete. Draft profile is ready for review.", () => (
        recrawlProvider(button.dataset.recrawlProvider, { runNow: true })
      ));
    });
  });

  document.querySelectorAll("[data-delete-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Deleting", "Job deleted.", () => (
        deleteJob(button.dataset.deleteJob)
      ));
    });
  });

  document.querySelectorAll("[data-run-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(button, "Processing", "Scrape complete. Draft profile is ready for review.", () => (
        runScrapeJob(button.dataset.runJob)
      ));
    });
  });

  document.querySelectorAll("[data-review-claim-request]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(
        button,
        "Updating",
        button.dataset.claimReviewStatus === "approved" ? "Request approved." : "Request rejected.",
        () => reviewClaimRequest(button.dataset.reviewClaimRequest, button.dataset.claimReviewStatus)
      );
    });
  });

  document.querySelectorAll("[data-update-provider-lead]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(
        button,
        "Updating",
        `Lead marked ${button.dataset.providerLeadStatus}.`,
        () => updateProviderLeadStatus(button.dataset.updateProviderLead, button.dataset.providerLeadStatus)
      );
    });
  });

  document.querySelectorAll("[data-send-outreach]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(
        button,
        "Sending",
        "Outreach email sent.",
        () => sendOutreachMessage(button.dataset.sendOutreach)
      );
    });
  });

  document.querySelectorAll("[data-mark-replied]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runAdminAction(
        button,
        "Updating",
        "Marked as replied. No further follow-ups will send.",
        () => markProviderReplied(button.dataset.markReplied)
      );
    });
  });

  document.querySelectorAll("[data-toggle-outreach-pause]").forEach((button) => {
    button.addEventListener("click", async () => {
      const paused = button.dataset.outreachPause === "true";

      await runAdminAction(
        button,
        "Updating",
        paused ? "Outreach paused for this provider." : "Outreach resumed for this provider.",
        () => toggleOutreachPause(button.dataset.toggleOutreachPause, paused)
      );
    });
  });
}

function renderLists() {
  const reviewProviders = state.providers.filter(isReviewProvider);
  const publishedProviders = state.providers.filter(isLiveProvider);
  const filteredPublishedProviders = filterPublishedProviders(publishedProviders);
  const totalJobsPages = Math.max(1, Math.ceil(state.jobs.length / state.jobsPageSize));
  const totalReviewPages = Math.max(1, Math.ceil(reviewProviders.length / state.reviewPageSize));
  const totalPublishedPages = Math.max(1, Math.ceil(filteredPublishedProviders.length / state.publishedPageSize));

  state.jobsPage = Math.min(Math.max(1, state.jobsPage), totalJobsPages);
  state.reviewPage = Math.min(Math.max(1, state.reviewPage), totalReviewPages);
  state.publishedPage = Math.min(Math.max(1, state.publishedPage), totalPublishedPages);

  const jobsStart = (state.jobsPage - 1) * state.jobsPageSize;
  const visibleJobs = state.jobs.slice(
    jobsStart,
    jobsStart + state.jobsPageSize
  );
  const reviewStart = (state.reviewPage - 1) * state.reviewPageSize;
  const visibleReviewProviders = reviewProviders.slice(
    reviewStart,
    reviewStart + state.reviewPageSize
  );
  const publishedStart = (state.publishedPage - 1) * state.publishedPageSize;
  const visiblePublishedProviders = filteredPublishedProviders.slice(
    publishedStart,
    publishedStart + state.publishedPageSize
  );
  state.visibleReviewKeys = visibleReviewProviders.map(providerKey);
  state.visiblePublishedKeys = visiblePublishedProviders.map(providerKey);
  state.allReviewKeys = reviewProviders.map(providerKey);
  state.allPublishedKeys = filteredPublishedProviders.map(providerKey);
  elements.reviewProviderList.classList.toggle("adminSelectionMode", state.selectionMode.review);
  elements.publishedProviderList.classList.toggle("adminSelectionMode", state.selectionMode.published);

  elements.dashboardReviewList.innerHTML = reviewProviders.length
    ? `${tableHeader(["Company", "Status", "Confidence"])}${reviewProviders.slice(0, 5).map(compactProviderRow).join("")}`
    : emptyState("No profiles need review.");

  elements.dashboardJobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Status", "Created"])}${state.jobs.slice(0, 5).map(compactJobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  const outreachProviders = state.providers
    .filter((provider) => outreachSummaryForProvider(provider).total > 0)
    .sort((left, right) => {
      const leftSummary = outreachSummaryForProvider(left);
      const rightSummary = outreachSummaryForProvider(right);

      return rightSummary.drafts - leftSummary.drafts || String(left.companyName || left.domain).localeCompare(String(right.companyName || right.domain));
    });

  if (elements.dashboardOutreachList) {
    elements.dashboardOutreachList.innerHTML = outreachProviders.length
      ? `${tableHeader(["Company", "Messages", "Actions"])}${outreachProviders.slice(0, 8).map(compactOutreachProviderRow).join("")}`
      : emptyState("No outreach messages yet.");
  }

  renderRequests();

  elements.jobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Requested by", "Status", "Created", "Actions"])}${visibleJobs.map(jobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  elements.reviewProviderList.innerHTML = reviewProviders.length
    ? `${tableHeader(["", "Company", "Country", "Status", "Confidence", "Actions"])}${visibleReviewProviders.map((provider) => providerRow(provider, { includeAction: true })).join("")}`
    : emptyState("No profiles need review.");

  elements.publishedProviderList.innerHTML = filteredPublishedProviders.length
    ? `${tableHeader(["", "Company", "Country", "Status", "Confidence", "Actions"])}${visiblePublishedProviders.map((provider) => providerRow(provider, { compact: true })).join("")}`
    : emptyState("No published providers match the current filters.");

  renderOutreach();
  renderMissingDataReview();
  renderTags();
  renderMetrics();

  renderPagination({
    currentPage: state.jobsPage,
    totalPages: totalJobsPages,
    totalCount: state.jobs.length,
    label: "jobs",
    elements: {
      prevButton: elements.jobsPrevButton,
      nextButton: elements.jobsNextButton,
      pageInfo: elements.jobsPageInfo,
      pageNumbers: elements.jobsPageNumbers,
    },
    onPageChange(page) {
      state.jobsPage = page;
      renderLists();
    },
  });
  renderPagination({
    currentPage: state.reviewPage,
    totalPages: totalReviewPages,
    totalCount: reviewProviders.length,
    label: "profiles",
    elements: {
      prevButton: elements.reviewPrevButton,
      nextButton: elements.reviewNextButton,
      pageInfo: elements.reviewPageInfo,
      pageNumbers: elements.reviewPageNumbers,
    },
    onPageChange(page) {
      state.reviewPage = page;
      renderLists();
    },
  });
  renderPagination({
    currentPage: state.publishedPage,
    totalPages: totalPublishedPages,
    totalCount: filteredPublishedProviders.length,
    label: "providers",
    elements: {
      prevButton: elements.publishedPrevButton,
      nextButton: elements.publishedNextButton,
      pageInfo: elements.publishedPageInfo,
      pageNumbers: elements.publishedPageNumbers,
    },
    onPageChange(page) {
      state.publishedPage = page;
      renderLists();
    },
  });

  bindPublishButtons();
  updateBulkControls();
}

async function refreshAdminState() {
  const response = await fetch("/api/admin-state", { headers: adminHeaders() });
  const payload = await response.json();

  if (payload.configured === false) {
    elements.setupNotice.hidden = false;
    state.activityEvents = [];
    state.claimRequests = [];
    state.jobs = [];
    state.metrics = {};
    state.providerLeads = [];
    state.providers = [];
    state.readiness = payload.readiness || null;
    state.tags = [];
  } else if (!response.ok) {
    throw new Error(payload.error || "Failed to load admin state.");
  } else {
    elements.setupNotice.hidden = true;
    state.activityEvents = payload.activityEvents || [];
    state.claimRequests = payload.claimRequests || [];
    state.jobs = payload.jobs || [];
    state.metrics = payload.metrics || {};
    state.providerLeads = payload.providerLeads || [];
    state.providers = payload.providers || [];
    state.readiness = payload.readiness || null;
    state.tags = payload.tags || [];
    state.selectedProviders = new Set(
      [...state.selectedProviders].filter((key) => state.providers.some((provider) => providerKey(provider) === key))
    );
    state.jobsPage = 1;
    state.reviewPage = 1;
    state.publishedPage = 1;
  }

  renderStats();
  renderReadinessWarnings();
  renderLists();
}

async function handleLogin(event) {
  event.preventDefault();
  const submitButton = event.submitter || elements.loginForm.querySelector("button[type='submit']");
  elements.loginMessage.textContent = "";
  elements.loginMessage.classList.remove("error");
  setBusy(submitButton, true, "Signing in");

  try {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: elements.email.value,
        password: elements.password.value,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Admin sign in failed.");
    }

    setAdminSession(payload);
    elements.password.value = "";
    showShell();
    await refreshAdminState();
    showToast("Signed in.");
  } catch (error) {
    elements.loginMessage.textContent = error.message;
    elements.loginMessage.classList.add("error");
    showToast(error.message || "Sign in failed.", "error");
  } finally {
    setBusy(submitButton, false);
  }
}

async function handleScrapeSubmit(event) {
  event.preventDefault();
  const submitButton = event.submitter || elements.scrapeForm.querySelector("button[type='submit']");
  elements.scrapeMessage.textContent = "Queueing scrape job...";
  elements.scrapeMessage.classList.remove("error");
  setBusy(submitButton, true, "Queueing");
  const normalizedUrl = normalizeWebsiteInput(elements.scrapeUrl.value);
  let normalizedDomain = "";

  try {
    normalizedDomain = new URL(normalizedUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch (error) {
    elements.scrapeMessage.textContent = "Enter a valid company website URL.";
    elements.scrapeMessage.classList.add("error");
    setBusy(submitButton, false);
    return;
  }
  const existingProvider = state.providers.find((provider) => String(provider.domain || "").toLowerCase() === normalizedDomain);
  const existingJob = state.jobs.find((job) => String(job.domain || "").toLowerCase() === normalizedDomain && ["queued", "running"].includes(job.status));

  if (existingProvider || existingJob) {
    const existingName = existingProvider?.companyName || existingJob?.company_name || normalizedDomain;
    elements.scrapeMessage.textContent = `${existingName} already exists.`;
    elements.scrapeMessage.classList.add("error");
    showToast(`${existingName} already exists.`, "error");
    setBusy(submitButton, false);
    return;
  }

  try {
    const response = await fetch("/api/admin-scrape", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        url: normalizedUrl,
        companyName: elements.scrapeCompanyName.value,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to queue scrape job.");
    }

    elements.scrapeMessage.textContent = "Scrape job queued. Running scraper...";
    elements.scrapeUrl.value = "";
    elements.scrapeCompanyName.value = "";
    await runScrapeJob(payload.id, { stayOnScrape: true });
    elements.scrapeMessage.textContent = "Scrape complete. Draft profile is ready for review.";
    setSection("review");
    await refreshAdminState();
    showToast("Scrape complete. Draft profile is ready for review.");
  } catch (error) {
    elements.scrapeMessage.textContent = error.message;
    elements.scrapeMessage.classList.add("error");
    showToast(error.message || "Scrape failed.", "error");
  } finally {
    setBusy(submitButton, false);
  }
}

async function runScrapeJob(id, options = {}) {
  if (!id) {
    return;
  }

  const response = await fetch("/api/admin-run-job", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to run scrape job.");
  }

  await refreshAdminState();

  if (!options.stayOnScrape) {
    setSection("review");
  }
}

function providerRecrawlUrl(provider = {}) {
  const rawUrl = String(provider.website || "").trim();

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl) {
    return `https://${rawUrl}`;
  }

  if (provider.domain) {
    return `https://${provider.domain}`;
  }

  return "";
}

async function queueRecrawlJob(provider) {
  const url = providerRecrawlUrl(provider);

  if (!url) {
    throw new Error(`Missing website for ${provider.companyName || provider.domain || "provider"}.`);
  }

  const response = await fetch("/api/admin-scrape", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      url,
      companyName: provider.companyName || provider.domain || "",
      allowExisting: true,
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to queue recrawl job.");
  }

  return payload;
}

async function recrawlProvider(key, options = {}) {
  const provider = findProvider(key);

  if (!provider) {
    throw new Error("Provider not found.");
  }

  const job = await queueRecrawlJob(provider);

  if (options.runNow && job?.id) {
    await runScrapeJob(job.id);
    return true;
  }

  await refreshAdminState();
  setSection("scrape");
  return true;
}

async function publishProviderRaw(id) {
  const response = await fetch("/api/admin-publish", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status: "approved" }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to publish provider.");
  }
}

async function publishProvider(id) {
  if (!id) {
    return false;
  }

  const provider = findProvider(id);

  if (provider && isBelowConfidenceGuardrail(provider) && scraperQualityLogForProfile(provider).feedback !== "up") {
    throw new Error("Open this profile and mark reviewer feedback as Looks good before publishing. It is below the 75% confidence guardrail.");
  }

  await publishProviderRaw(id);
  await refreshAdminState();
  return true;
}

function selectedKeysForScope(scope) {
  const visibleKeys = scope === "review" ? state.visibleReviewKeys : state.visiblePublishedKeys;

  return visibleKeys.filter((key) => state.selectedProviders.has(key));
}

function selectedKeysForFullScope(scope) {
  const allKeys = scope === "review" ? state.allReviewKeys : state.allPublishedKeys;

  return allKeys.filter((key) => state.selectedProviders.has(key));
}

function updateBulkControls() {
  const reviewSelected = selectedKeysForFullScope("review");
  const publishedSelected = selectedKeysForFullScope("published");
  const reviewAllSelected = state.visibleReviewKeys.length > 0 && state.visibleReviewKeys.every((key) => state.selectedProviders.has(key));
  const publishedAllSelected = state.visiblePublishedKeys.length > 0 && state.visiblePublishedKeys.every((key) => state.selectedProviders.has(key));

  if (elements.reviewSelectPage) {
    elements.reviewBulkActionBar.hidden = !state.selectionMode.review;
    elements.reviewSelectModeButton.setAttribute("aria-pressed", String(state.selectionMode.review));
    elements.reviewSelectModeButton.querySelector("span").textContent = state.selectionMode.review ? "Done" : "Select";
    elements.reviewSelectPage.checked = reviewAllSelected;
    elements.reviewSelectPage.indeterminate = !reviewAllSelected && reviewSelected.length > 0;
    elements.reviewBulkCount.textContent = `${reviewSelected.length} selected`;
    elements.reviewBulkApply.disabled = reviewSelected.length === 0 || !elements.reviewBulkAction.value;
  }

  if (elements.publishedSelectPage) {
    elements.publishedBulkActionBar.hidden = !state.selectionMode.published;
    elements.publishedSelectModeButton.setAttribute("aria-pressed", String(state.selectionMode.published));
    elements.publishedSelectModeButton.querySelector("span").textContent = state.selectionMode.published ? "Done" : "Select";
    elements.publishedSelectPage.checked = publishedAllSelected;
    elements.publishedSelectPage.indeterminate = !publishedAllSelected && publishedSelected.length > 0;
    elements.publishedBulkCount.textContent = `${publishedSelected.length} selected`;
    elements.publishedBulkApply.disabled = publishedSelected.length === 0 || !elements.publishedBulkAction.value;
  }
}

function toggleSelectionMode(scope) {
  state.selectionMode[scope] = !state.selectionMode[scope];

  if (!state.selectionMode[scope]) {
    selectedKeysForScope(scope).forEach((key) => state.selectedProviders.delete(key));
    const actionSelect = scope === "review" ? elements.reviewBulkAction : elements.publishedBulkAction;
    actionSelect.value = "";
  }

  renderLists();
}

function togglePageSelection(scope, checked) {
  const visibleKeys = scope === "review" ? state.visibleReviewKeys : state.visiblePublishedKeys;

  visibleKeys.forEach((key) => {
    if (checked) {
      state.selectedProviders.add(key);
    } else {
      state.selectedProviders.delete(key);
    }
  });
  renderLists();
}

async function applyBulkAction(scope) {
  const actionSelect = scope === "review" ? elements.reviewBulkAction : elements.publishedBulkAction;
  const action = actionSelect.value;
  const selectedKeys = selectedKeysForFullScope(scope);

  if (!action || selectedKeys.length === 0) {
    return false;
  }

  const failures = [];
  let succeeded = 0;

  for (const key of selectedKeys) {
    try {
      if (action === "recrawl") {
        const provider = findProvider(key);

        if (!provider) {
          throw new Error("Provider no longer available.");
        }

        await queueRecrawlJob(provider);
      } else if (action === "publish") {
        const provider = findProvider(key);

        if (provider && isBelowConfidenceGuardrail(provider) && scraperQualityLogForProfile(provider).feedback !== "up") {
          throw new Error("Below the 75% confidence guardrail; mark reviewer feedback as Looks good first.");
        }

        await publishProviderRaw(key);
      } else if (action === "unpublish") {
        await updateProviderStatusRaw(key, "in_review");
      }

      succeeded += 1;
    } catch (error) {
      failures.push({ key, message: error.message || "Failed." });
    }
  }

  selectedKeys.forEach((key) => state.selectedProviders.delete(key));
  actionSelect.value = "";
  await refreshAdminState();

  if (action === "recrawl" && succeeded > 0) {
    setSection("scrape");
  }

  const summary = failures.length
    ? `${succeeded} of ${selectedKeys.length} succeeded, ${failures.length} failed: ${failures[0].message}${failures.length > 1 ? ` (+${failures.length - 1} more)` : ""}`
    : `${succeeded} provider${succeeded === 1 ? "" : "s"} updated.`;

  showToast(summary, failures.length ? "error" : "success");
}

async function updateProviderStatusRaw(id, status) {
  const response = await fetch("/api/admin-provider", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to update provider.");
  }
}

async function updateProviderStatus(key, status) {
  if (!key) {
    return false;
  }

  await updateProviderStatusRaw(key, status);
  await refreshAdminState();
  if (!LIVE_PROFILE_STATUSES.has(normalizeLifecycleStatus(status))) {
    setSection("review");
  }
  return true;
}

async function reviewClaimRequest(id, status) {
  const response = await fetch("/api/admin-claim-request", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to review claim request.");
  }

  await refreshAdminState();
  setSection("requests");
  return payload;
}

async function sendOutreachMessage(messageId) {
  const response = await fetch("/api/send-outreach", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ messageId }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to send outreach message.");
  }

  await refreshAdminState();
  return payload;
}

async function markProviderReplied(providerId) {
  const response = await fetch("/api/admin-outreach-cycle", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ providerId, resolution: "replied_other" }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to mark provider as replied.");
  }

  await refreshAdminState();
  return payload;
}

async function toggleOutreachPause(providerId, paused) {
  const response = await fetch("/api/admin-outreach-cycle", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ providerId, paused }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update outreach pause state.");
  }

  await refreshAdminState();
  return payload;
}

async function updateProviderLeadStatus(id, status) {
  const response = await fetch("/api/admin-provider-lead", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to update provider lead.");
  }

  await refreshAdminState();
  setSection("requests");
  return payload;
}

async function downloadAdminExport(type, { from = "", to = "" } = {}) {
  const params = new URLSearchParams({ type });

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const response = await fetch(`/api/admin-export?${params.toString()}`, {
    headers: adminHeaders(),
  });
  const text = await response.text();

  if (!response.ok) {
    let message = "Failed to export CSV.";

    try {
      message = JSON.parse(text).error || message;
    } catch (error) {
      message = text || message;
    }

    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `${type}.csv`;
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function deleteProvider(key) {
  if (!key || !window.confirm("Delete this provider from the admin list?")) {
    return { cancelled: true };
  }

  const response = await fetch("/api/admin-provider", {
    method: "DELETE",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to delete provider.");
  }

  await refreshAdminState();
  return true;
}

async function deleteJob(id) {
  if (!id || !window.confirm("Delete this scrape job?")) {
    return { cancelled: true };
  }

  const response = await fetch("/api/admin-job", {
    method: "DELETE",
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to delete job.");
  }

  await refreshAdminState();
  return true;
}

async function generateOutreachMessagesForKey(key) {
  if (!key) {
    return false;
  }

  const provider = findProvider(key);
  const hasExisting = (provider?.outreachMessages || []).length > 0;
  const overwrite = hasExisting
    ? window.confirm("Replace existing outreach messages with newly generated drafts?")
    : true;

  if (!overwrite) {
    return { cancelled: true };
  }

  const response = await fetch("/api/admin-generate-outreach", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key, overwrite }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Failed to generate outreach messages.");
  }

  await refreshAdminState();
  return payload;
}

async function generateOutreachMessagesForOpenProfile() {
  const key = elements.profileEditKey.value;
  const result = await generateOutreachMessagesForKey(key);

  if (result && !result.cancelled) {
    const provider = findProvider(key);
    renderOutreachMessages(elements.profileEditOutreachMessages, result.outreachMessages || provider?.outreachMessages || []);
    renderProfileActivityLog(provider || result.provider || {});
  }

  return result;
}

async function saveProfileEdit(event) {
  event.preventDefault();
  const submitButton = event.submitter || elements.profileEditForm.querySelector("button[type='submit']");
  const key = elements.profileEditKey.value;
  const provider = findProvider(key) || {};
  const successStories = collectEditableEntries(elements.profileEditSuccessStories);
  const managedSuccessStories = collectManagedSuccessStories(elements.profileEditManagedSuccessStories);
  const managedProviderEvents = collectManagedProviderEvents(elements.profileEditManagedEvents);
  const managedMarketSignals = collectManagedMarketSignals(elements.profileEditManagedSignals);
  const solutions = collectEditableEntries(elements.profileEditSolutions);
  const outreachContacts = collectOutreachContacts(elements.profileEditOutreachContacts);
  const outreachMessages = collectOutreachMessages(elements.profileEditOutreachMessages);
  const subscriptionTier = elements.profileEditSubscriptionTier.value;
  const editedProfile = { ...provider, subscriptionTier };

  if (!hasPremiumProfileAccess(editedProfile) && (successStories.length > 1 || solutions.length > 1)) {
    elements.profileEditMessage.textContent =
      "Multiple success stories or solutions require premium subscription.";
    elements.profileEditMessage.classList.add("error");
    return;
  }

  const selectedStatus = normalizeLifecycleStatus(elements.profileEditStatus.value);
  const removalStatus = selectedStatus === "removed" || selectedStatus === "removal_requested";
  const claimed = !removalStatus && (elements.profileEditClaimed.checked || selectedStatus === "claimed");
  const status = removalStatus ? selectedStatus : (claimed ? "claimed" : selectedStatus);
  const reviewerFeedback = selectedReviewerFeedback();

  if (
    isBelowConfidenceGuardrail(provider) &&
    LIVE_PROFILE_STATUSES.has(status) &&
    reviewerFeedback !== "up"
  ) {
    elements.profileEditMessage.textContent =
      "This profile is below the 75% confidence guardrail. Mark reviewer feedback as Looks good before moving it forward.";
    elements.profileEditMessage.classList.add("error");
    return;
  }

  const patch = {
    companyName: elements.profileEditName.value.trim(),
    logoUrl: elements.profileEditLogo.value.trim() || null,
    website: elements.profileEditWebsite.value.trim(),
    country: elements.profileEditCountry.value.trim(),
    city: elements.profileEditCity.value.trim(),
    claimed,
    subscriptionTier,
    companyLocation: {
      country: elements.profileEditCountry.value.trim(),
      city: elements.profileEditCity.value.trim(),
    },
    services: selectedTagNames("services"),
    industries: normalizeIndustryList(selectedTagNames("industries")),
    technologies: selectedTagNames("technologies"),
    vendorPartnerships: selectedTagNames("vendor_partnerships"),
    successStories,
    managedSuccessStories,
    managedProviderEvents,
    managedMarketSignals,
    solutions,
    outreachContacts,
    outreachMessages,
    recentActivity: textToRecentActivities(elements.profileEditActivities.value),
    reviewNotes: textToList(elements.profileEditNotes.value),
    scraperQualityLog: {
      missing: textToList(elements.profileEditQualityMissing.value),
      incorrect: textToList(elements.profileEditQualityIncorrect.value),
      added: textToList(elements.profileEditQualityAdded.value),
      notes: elements.profileEditQualityNotes.value.trim(),
      feedback: reviewerFeedback,
    },
  };
  const activityEntry = buildActivityEntry(provider, patch, status);
  patch.activityLog = appendActivityLog(provider, [
    activityEntry,
    ...buildOutreachActivityEntries(provider, patch),
    ...buildSuccessStoryActivityEntries(provider, patch),
    ...buildProviderEventActivityEntries(provider, patch),
    ...buildMarketSignalActivityEntries(provider, patch),
  ]);

  elements.profileEditMessage.textContent = "Saving profile...";
  elements.profileEditMessage.classList.remove("error");
  setBusy(submitButton, true, "Saving");

  try {
    const response = await fetch("/api/admin-provider", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ id: key, profile: patch, status }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to save profile.");
    }

    elements.profileEditDialog.close();
    await refreshAdminState();
    showToast("Profile saved.");
  } catch (error) {
    elements.profileEditMessage.textContent = error.message;
    elements.profileEditMessage.classList.add("error");
    showToast(error.message || "Failed to save profile.", "error");
  } finally {
    setBusy(submitButton, false);
  }
}

function applyPublishedFilters(event) {
  event?.preventDefault();
  state.publishedFilters = {
    name: elements.publishedNameFilter.value,
    status: elements.publishedStatusFilter.value,
    selfEdited: elements.publishedSelfEditedFilter.checked,
  };
  state.publishedSortField = elements.publishedSortFilter.value;
  state.publishedPage = 1;
  updatePublishedSortButton();
  renderLists();
}

function flipPublishedList() {
  state.publishedSortField = elements.publishedSortFilter.value;
  state.publishedSortDirection = state.publishedSortDirection === "asc" ? "desc" : "asc";
  state.publishedPage = 1;
  updatePublishedSortButton();
  renderLists();
}

function updatePublishedSortButton() {
  const isAscending = state.publishedSortDirection === "asc";
  const field = state.publishedSortField;
  const label = field === "confidence"
    ? (isAscending ? "Low-High" : "High-Low")
    : (isAscending ? "A-Z" : "Z-A");

  elements.publishedFlipButton.setAttribute(
    "aria-label",
    isAscending ? "Flip list to descending order" : "Flip list to ascending order"
  );
  elements.publishedFlipButton.querySelector("span").textContent = label;
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.scrapeForm.addEventListener("submit", handleScrapeSubmit);
  elements.publishedFilters.addEventListener("submit", applyPublishedFilters);
  elements.publishedNameFilter.addEventListener("input", applyPublishedFilters);
  elements.publishedStatusFilter.addEventListener("change", applyPublishedFilters);
  elements.publishedSelfEditedFilter.addEventListener("change", applyPublishedFilters);
  elements.publishedSortFilter.addEventListener("change", () => {
    state.publishedSortField = elements.publishedSortFilter.value;
    updatePublishedSortButton();
    applyPublishedFilters();
  });
  elements.publishedFlipButton.addEventListener("click", flipPublishedList);
  elements.reviewSelectModeButton.addEventListener("click", () => toggleSelectionMode("review"));
  elements.publishedSelectModeButton.addEventListener("click", () => toggleSelectionMode("published"));
  elements.reviewSelectPage.addEventListener("change", () => {
    togglePageSelection("review", elements.reviewSelectPage.checked);
  });
  elements.publishedSelectPage.addEventListener("change", () => {
    togglePageSelection("published", elements.publishedSelectPage.checked);
  });
  [elements.reviewBulkAction, elements.publishedBulkAction].forEach((select) => {
    select.addEventListener("change", updateBulkControls);
  });
  elements.reviewBulkApply.addEventListener("click", () => {
    runAdminAction(elements.reviewBulkApply, "Applying", null, () => applyBulkAction("review"));
  });
  elements.publishedBulkApply.addEventListener("click", () => {
    runAdminAction(elements.publishedBulkApply, "Applying", null, () => applyBulkAction("published"));
  });
  elements.tagSearchFilter?.addEventListener("input", () => {
    state.tagFilters.search = elements.tagSearchFilter.value;
    renderTags();
  });
  [elements.tagCategoryFilter, elements.tagStatusFilter].forEach((select) => {
    select?.addEventListener("change", () => {
      state.tagFilters.search = elements.tagSearchFilter?.value || "";
      state.tagFilters.category = elements.tagCategoryFilter.value;
      state.tagFilters.status = elements.tagStatusFilter.value;
      renderTags();
    });
  });
  elements.tagApproveVisibleButton?.addEventListener("click", () => {
    runAdminAction(elements.tagApproveVisibleButton, "Approving", "Visible candidate tags approved.", approveVisibleTags);
  });
  elements.requestsSampleToggle?.addEventListener("click", () => {
    state.showSampleRequests = !state.showSampleRequests;
    elements.requestsSampleToggle.setAttribute("aria-pressed", String(state.showSampleRequests));
    elements.requestsSampleToggle.querySelector("span").textContent = state.showSampleRequests ? "Hide sample data" : "Preview sample data";
    renderRequests();
  });
  elements.outreachSearchFilter?.addEventListener("input", () => {
    state.outreachFilters.search = elements.outreachSearchFilter.value;
    renderOutreach();
  });
  elements.outreachStatusFilter?.addEventListener("change", () => {
    state.outreachFilters.status = elements.outreachStatusFilter.value;
    renderOutreach();
  });
  elements.activitySearchFilter?.addEventListener("input", () => {
    state.activityFilters.search = elements.activitySearchFilter.value;
    renderMetrics();
  });
  elements.activityGroupFilter?.addEventListener("change", () => {
    state.activityFilters.group = elements.activityGroupFilter.value;
    renderMetrics();
  });
  elements.activitySortButton?.addEventListener("click", () => {
    state.activityFilters.sort = state.activityFilters.sort === "asc" ? "desc" : "asc";
    renderMetrics();
  });
  document.querySelectorAll("[data-admin-export]").forEach((button) => {
    button.addEventListener("click", () => {
      runAdminAction(
        button,
        "Exporting",
        "CSV export ready.",
        () => downloadAdminExport(button.dataset.adminExport, {
          from: elements.exportFromFilter?.value || "",
          to: elements.exportToFilter?.value || "",
        })
      );
    });
  });
  document.querySelectorAll("[data-tag-picker-select]").forEach((select) => {
    select.addEventListener("change", () => {
      addTagToPicker(select.dataset.tagPickerSelect, select.value);
      select.value = "";
    });
  });
  document.querySelectorAll("[data-tag-picker-list]").forEach((list) => {
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-tag]");

      if (!button) {
        return;
      }

      const category = button.dataset.removeTag;
      const chip = button.closest("[data-tag-value]");
      const nextValues = selectedTagNames(category).filter((value) => normalizeTagKey(value) !== normalizeTagKey(chip.dataset.tagValue));
      setTagPickerValues(category, nextValues);
    });
  });
  elements.profileEditForm.addEventListener("submit", saveProfileEdit);
  elements.profileEditClose.addEventListener("click", () => elements.profileEditDialog.close());
  elements.emailPreviewClose.addEventListener("click", () => elements.emailPreviewDialog.close());
  elements.outreachComposeClose.addEventListener("click", () => elements.outreachComposeDialog.close());
  elements.outreachComposeMessages.addEventListener("click", async (event) => {
    const copyButton = event.target.closest(".outreachMessageCopy");

    if (copyButton) {
      copyOutreachMessage(copyButton.closest(".outreachMessageRow")).catch((error) => {
        showToast(error.message || "Copy failed.", "error");
      });
      return;
    }

    const previewButton = event.target.closest(".outreachMessagePreview");

    if (previewButton) {
      openEmailPreview(previewButton.closest(".outreachMessageRow"));
      return;
    }

    const key = elements.outreachComposeKey.value;

    const approveButton = event.target.closest(".outreachComposeApprove");

    if (approveButton) {
      approveOutreachMessage(approveButton.closest(".outreachMessageRow"));
      await runAdminAction(approveButton, "Saving", "Approved and saved.", () => (
        saveOutreachMessagesForKey(key, elements.outreachComposeMessages)
      ));
      renderOutreachComposeMessages();
      return;
    }

    const saveButton = event.target.closest(".outreachComposeSave");

    if (saveButton) {
      await runAdminAction(saveButton, "Saving", "Draft saved.", () => (
        saveOutreachMessagesForKey(key, elements.outreachComposeMessages)
      ));
      renderOutreachComposeMessages();
      return;
    }

    const sendButton = event.target.closest(".outreachComposeSend");

    if (sendButton) {
      // Saving replaces every outreach_messages row for this provider (new
      // ids, even for messages that weren't touched) - the id captured
      // before save is guaranteed stale by the time send runs, which is why
      // this used to fail with "message not found". Re-look-up the message
      // by step from the freshly-saved state instead of trusting the old id.
      const messageStep = sendButton.closest(".outreachMessageRow").dataset.messageStep;

      await runAdminAction(sendButton, "Sending", "Email sent.", async () => {
        await saveOutreachMessagesForKey(key, elements.outreachComposeMessages);

        const freshProvider = findProvider(key);
        const freshMessage = freshProvider?.outreachMessages?.find((message) => message.messageStep === messageStep);

        if (!freshMessage) {
          throw new Error("Couldn't find the saved draft to send - try again.");
        }

        return sendOutreachMessage(freshMessage.id);
      });
      renderOutreachComposeMessages();
    }
  });
  elements.profileEditAddSuccessStory.addEventListener("click", () => addEditableEntry(elements.profileEditSuccessStories));
  elements.profileEditAddManagedSuccessStory.addEventListener("click", () => addManagedSuccessStory(elements.profileEditManagedSuccessStories));
  elements.profileEditAddManagedEvent.addEventListener("click", () => addManagedProviderEvent(elements.profileEditManagedEvents));
  elements.profileEditAddManagedSignal.addEventListener("click", () => addManagedMarketSignal(elements.profileEditManagedSignals));
  elements.profileEditAddSolution.addEventListener("click", () => addEditableEntry(elements.profileEditSolutions));
  elements.profileEditAddOutreachContact.addEventListener("click", () => addOutreachContact(elements.profileEditOutreachContacts));
  elements.profileEditGenerateOutreach.addEventListener("click", () => {
    runAdminAction(elements.profileEditGenerateOutreach, "Generating", "Outreach drafts generated.", generateOutreachMessagesForOpenProfile);
  });
  elements.profileEditApproveAllOutreach.addEventListener("click", approveAllDraftOutreachMessages);
  [elements.profileEditSuccessStories, elements.profileEditSolutions].forEach((container) => {
    container.addEventListener("click", (event) => {
      if (!event.target.closest(".structuredEntryRemove")) {
        return;
      }

      const rows = container.querySelectorAll(".structuredEntryRow");
      const row = event.target.closest(".structuredEntryRow");

      if (rows.length > 1) {
        row.remove();
        return;
      }

      row.querySelectorAll("input, textarea").forEach((input) => {
        input.value = "";
      });
    });
  });
  elements.profileEditOutreachContacts.addEventListener("change", (event) => {
    const primaryInput = event.target.closest('[data-contact-field="primaryContact"]');

    if (!primaryInput || !primaryInput.checked) {
      return;
    }

    elements.profileEditOutreachContacts
      .querySelectorAll('[data-contact-field="primaryContact"]')
      .forEach((input) => {
        if (input !== primaryInput) {
          input.checked = false;
        }
      });
  });
  elements.profileEditOutreachContacts.addEventListener("click", (event) => {
    if (!event.target.closest(".outreachContactRemove")) {
      return;
    }

    const rows = elements.profileEditOutreachContacts.querySelectorAll(".outreachContactRow");
    const row = event.target.closest(".outreachContactRow");

    if (rows.length > 1) {
      row.remove();
      return;
    }

    row.querySelectorAll("input").forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });
  });
  elements.profileEditManagedSuccessStories.addEventListener("click", (event) => {
    const approveButton = event.target.closest(".managedSuccessStoryApprove");
    const removeButton = event.target.closest(".managedSuccessStoryRemove");
    const row = event.target.closest(".managedSuccessStoryRow");

    if (approveButton && row) {
      approveManagedSuccessStory(row);
      showToast("Success story marked approved. Save profile to persist.");
      return;
    }

    if (!removeButton || !row) {
      return;
    }

    const rows = elements.profileEditManagedSuccessStories.querySelectorAll(".managedSuccessStoryRow");

    if (rows.length > 1) {
      row.remove();
      return;
    }

    row.querySelectorAll("input, textarea").forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });
    row.querySelector('[data-story-field="status"]').value = "draft";
  });
  elements.profileEditManagedSuccessStories.addEventListener("change", (event) => {
    const statusSelect = event.target.closest('[data-story-field="status"]');

    if (!statusSelect || statusSelect.value !== "approved") {
      return;
    }

    const row = statusSelect.closest(".managedSuccessStoryRow");
    const approvedAtInput = row.querySelector('[data-story-field="approvedAt"]');

    if (!approvedAtInput.value) {
      approveManagedSuccessStory(row);
    }
  });
  elements.profileEditManagedEvents.addEventListener("click", (event) => {
    const approveButton = event.target.closest(".managedEventApprove");
    const removeButton = event.target.closest(".managedEventRemove");
    const row = event.target.closest(".managedEventRow");

    if (approveButton && row) {
      approveManagedProviderEvent(row);
      showToast("Provider event marked approved. Save profile to persist.");
      return;
    }

    if (!removeButton || !row) {
      return;
    }

    const rows = elements.profileEditManagedEvents.querySelectorAll(".managedEventRow");

    if (rows.length > 1) {
      row.remove();
      return;
    }

    row.querySelectorAll("input, textarea").forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });
    row.querySelector('[data-event-field="status"]').value = "suggested";
  });
  elements.profileEditManagedEvents.addEventListener("change", (event) => {
    const statusSelect = event.target.closest('[data-event-field="status"]');

    if (!statusSelect || statusSelect.value !== "approved") {
      return;
    }

    const row = statusSelect.closest(".managedEventRow");
    const approvedAtInput = row.querySelector('[data-event-field="approvedAt"]');

    if (!approvedAtInput.value) {
      approveManagedProviderEvent(row);
    }
  });
  elements.profileEditManagedSignals.addEventListener("click", (event) => {
    const approveButton = event.target.closest(".managedSignalApprove");
    const removeButton = event.target.closest(".managedSignalRemove");
    const row = event.target.closest(".managedSignalRow");

    if (approveButton && row) {
      approveManagedMarketSignal(row);
      showToast("Market signal marked approved. Save profile to persist.");
      return;
    }

    if (!removeButton || !row) {
      return;
    }

    const rows = elements.profileEditManagedSignals.querySelectorAll(".managedSignalRow");

    if (rows.length > 1) {
      row.remove();
      return;
    }

    row.querySelectorAll("input, textarea").forEach((input) => {
      input.value = "";
    });
    row.querySelector('[data-signal-field="signalType"]').value = "news";
    row.querySelector('[data-signal-field="status"]').value = "scraped";
  });
  elements.profileEditManagedSignals.addEventListener("change", (event) => {
    const statusSelect = event.target.closest('[data-signal-field="status"]');

    if (!statusSelect || statusSelect.value !== "approved") {
      return;
    }

    const row = statusSelect.closest(".managedSignalRow");
    const approvedAtInput = row.querySelector('[data-signal-field="approvedAt"]');

    if (!approvedAtInput.value) {
      approveManagedMarketSignal(row);
    }
  });
  elements.profileEditOutreachMessages.addEventListener("click", (event) => {
    const copyButton = event.target.closest(".outreachMessageCopy");

    if (copyButton) {
      copyOutreachMessage(copyButton.closest(".outreachMessageRow")).catch((error) => {
        showToast(error.message || "Copy failed.", "error");
      });
      return;
    }

    const previewButton = event.target.closest(".outreachMessagePreview");

    if (previewButton) {
      openEmailPreview(previewButton.closest(".outreachMessageRow"));
      return;
    }

    const button = event.target.closest(".outreachMessageApprove");

    if (!button) {
      return;
    }

    const row = button.closest(".outreachMessageRow");
    approveOutreachMessage(row);
    showToast("Message marked approved. Save profile to persist.");
  });
  elements.profileEditOutreachMessages.addEventListener("change", (event) => {
    const statusSelect = event.target.closest('[data-message-field="status"]');

    if (!statusSelect || statusSelect.value !== "approved") {
      return;
    }

    const row = statusSelect.closest(".outreachMessageRow");
    const approvedAtInput = row.querySelector('[data-message-field="approvedAt"]');

    if (!approvedAtInput.value) {
      approveOutreachMessage(row);
    }
  });
  elements.sidebarToggle.addEventListener("click", toggleSidebar);
  elements.refreshButton.addEventListener("click", () => {
    runAdminAction(elements.refreshButton, "Refreshing", "Admin data refreshed.", refreshAdminState);
  });
  elements.jobsPrevButton.addEventListener("click", () => {
    state.jobsPage -= 1;
    renderLists();
  });
  elements.jobsNextButton.addEventListener("click", () => {
    state.jobsPage += 1;
    renderLists();
  });
  elements.reviewPrevButton.addEventListener("click", () => {
    state.reviewPage -= 1;
    renderLists();
  });
  elements.reviewNextButton.addEventListener("click", () => {
    state.reviewPage += 1;
    renderLists();
  });
  elements.publishedPrevButton.addEventListener("click", () => {
    state.publishedPage -= 1;
    renderLists();
  });
  elements.publishedNextButton.addEventListener("click", () => {
    state.publishedPage += 1;
    renderLists();
  });
  elements.signOutButton.addEventListener("click", () => {
    clearAdminSession();
    showShell();
    showToast("Signed out.");
  });

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSection(button.dataset.adminSection, { updateHash: true });
    });
  });
  window.addEventListener("hashchange", () => {
    setSection(sectionFromHash());
  });

  elements.outreachBulkClear?.addEventListener("click", () => {
    state.outreachSelection.clear();
    renderOutreach();
  });

  elements.outreachBulkSend?.addEventListener("click", () => bulkSendOutreach());
}

// Sends every selected provider's next approved message one at a time (not
// Promise.all - keeps this predictable and avoids bursting Resend/Supabase
// with N simultaneous sends). Only ever acts on providers that were
// selectable in the first place (row checkboxes are disabled unless there's
// an approved draft ready), so this can't send an unapproved draft.
async function bulkSendOutreach() {
  const keys = [...state.outreachSelection];

  if (keys.length === 0) {
    return;
  }

  const confirmed = window.confirm(
    `Send outreach to ${keys.length} provider${keys.length === 1 ? "" : "s"}? This cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  setBusy(elements.outreachBulkSend, true, "Sending");

  let sent = 0;
  let failed = 0;

  for (const key of keys) {
    const provider = findProvider(key);
    const message = provider ? sendableMessageForProvider(provider) : null;

    if (!message) {
      failed += 1;
      continue;
    }

    try {
      const response = await fetch("/api/send-outreach", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ messageId: message.id }),
      });

      if (!response.ok) {
        throw new Error("Send failed");
      }

      sent += 1;
    } catch (error) {
      failed += 1;
    }
  }

  state.outreachSelection.clear();
  setBusy(elements.outreachBulkSend, false);

  try {
    await refreshAdminState();
  } finally {
    renderLists();
  }

  showToast(
    failed > 0
      ? `Sent ${sent}, ${failed} failed - check the individual rows.`
      : `Sent ${sent} outreach email${sent === 1 ? "" : "s"}.`,
    failed > 0 ? "error" : "success"
  );
}

async function init() {
  bindEvents();
  showShell();
  setSection(sectionFromHash());
  updatePublishedSortButton();

  if (isSignedIn()) {
    await refreshAdminState();
    return;
  }

  elements.email.focus();
}

init().catch((error) => {
  elements.loginMessage.textContent = error.message;
  elements.loginMessage.classList.add("error");
});
