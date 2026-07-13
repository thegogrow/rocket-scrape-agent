const DEV_ADMIN_ACCESS = false;

const state = {
  activeSection: "dashboard",
  jobs: [],
  providers: [],
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
  },
  publishedSortField: "name",
  publishedSortDirection: "asc",
  selectedProviders: new Set(),
  visibleReviewKeys: [],
  visiblePublishedKeys: [],
  selectionMode: {
    review: false,
    published: false,
  },
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
const LIVE_PROFILE_STATUSES = new Set([
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
]);
const REVIEW_PROFILE_STATUSES = new Set([
  "scraped",
  "in_review",
  "removal_requested",
]);
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
  navButtons: document.querySelectorAll("[data-admin-section]"),
  panels: document.querySelectorAll("[data-admin-panel]"),
  queuedCount: document.querySelector("#queuedCount"),
  reviewCount: document.querySelector("#reviewCount"),
  publishedCount: document.querySelector("#publishedCount"),
  failedCount: document.querySelector("#failedCount"),
  dashboardReviewList: document.querySelector("#dashboardReviewList"),
  dashboardJobList: document.querySelector("#dashboardJobList"),
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
  publishedFlipButton: document.querySelector("#publishedFlipButton"),
  publishedSelectModeButton: document.querySelector("#publishedSelectModeButton"),
  publishedBulkActionBar: document.querySelector("#publishedBulkActionBar"),
  publishedSelectPage: document.querySelector("#publishedSelectPage"),
  publishedBulkAction: document.querySelector("#publishedBulkAction"),
  publishedBulkApply: document.querySelector("#publishedBulkApply"),
  publishedBulkCount: document.querySelector("#publishedBulkCount"),
  publishedProviderList: document.querySelector("#publishedProviderList"),
  missingDataList: document.querySelector("#missingDataList"),
  filterOptionsReview: document.querySelector("#filterOptionsReview"),
  publishedPrevButton: document.querySelector("#publishedPrevButton"),
  publishedNextButton: document.querySelector("#publishedNextButton"),
  publishedPageInfo: document.querySelector("#publishedPageInfo"),
  publishedPageNumbers: document.querySelector("#publishedPageNumbers"),
  profileEditDialog: document.querySelector("#profileEditDialog"),
  profileEditForm: document.querySelector("#profileEditForm"),
  profileEditClose: document.querySelector("#profileEditClose"),
  profileEditKey: document.querySelector("#profileEditKey"),
  profileEditName: document.querySelector("#profileEditName"),
  profileEditLogo: document.querySelector("#profileEditLogo"),
  profileEditWebsite: document.querySelector("#profileEditWebsite"),
  profileEditCountry: document.querySelector("#profileEditCountry"),
  profileEditCity: document.querySelector("#profileEditCity"),
  profileEditStatus: document.querySelector("#profileEditStatus"),
  profileEditClaimed: document.querySelector("#profileEditClaimed"),
  profileEditSubscriptionTier: document.querySelector("#profileEditSubscriptionTier"),
  profileEditServices: document.querySelector("#profileEditServices"),
  profileEditIndustries: document.querySelector("#profileEditIndustries"),
  profileEditTechnologies: document.querySelector("#profileEditTechnologies"),
  profileEditPartnerships: document.querySelector("#profileEditPartnerships"),
  profileEditSuccessStories: document.querySelector("#profileEditSuccessStories"),
  profileEditAddSuccessStory: document.querySelector("#profileEditAddSuccessStory"),
  profileEditSolutions: document.querySelector("#profileEditSolutions"),
  profileEditAddSolution: document.querySelector("#profileEditAddSolution"),
  profileEditActivities: document.querySelector("#profileEditActivities"),
  profileEditNotes: document.querySelector("#profileEditNotes"),
  profileEditQualityMissing: document.querySelector("#profileEditQualityMissing"),
  profileEditQualityIncorrect: document.querySelector("#profileEditQualityIncorrect"),
  profileEditQualityAdded: document.querySelector("#profileEditQualityAdded"),
  profileEditQualityNotes: document.querySelector("#profileEditQualityNotes"),
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
  if (DEV_ADMIN_ACCESS) {
    return "dev-admin";
  }

  return window.localStorage.getItem("rocketEngineersAdminToken");
}

function adminEmail() {
  if (DEV_ADMIN_ACCESS) {
    return "dev-admin@rocketengineers.local";
  }

  return window.localStorage.getItem("rocketEngineersAdminEmail");
}

function setAdminSession(session) {
  window.localStorage.setItem("rocketEngineersAdminToken", session.accessToken);
  window.localStorage.setItem("rocketEngineersAdminEmail", session.email);
}

function clearAdminSession() {
  if (DEV_ADMIN_ACCESS) {
    return;
  }

  window.localStorage.removeItem("rocketEngineersAdminToken");
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

function setSection(section) {
  state.activeSection = section;

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === section);
  });

  elements.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === section);
  });
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

function isLiveProvider(provider = {}) {
  return LIVE_PROFILE_STATUSES.has(lifecycleStatusForProvider(provider));
}

function isReviewProvider(provider = {}) {
  return REVIEW_PROFILE_STATUSES.has(lifecycleStatusForProvider(provider));
}

function emptyState(label) {
  return `<div class="emptyResults">${escapeHtml(label)}</div>`;
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

  return `<button class="secondaryAction compactAction iconButtonText" type="button" ${attrs}>${icons[kind] || ""}${escapeHtml(label)}</button>`;
}

function actionLink(kind, label, href) {
  const icon = kind === "profile"
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>`
    : "";

  return `<a class="secondaryAction compactAction iconButtonText" href="${escapeHtml(href)}">${icon}${escapeHtml(label)}</a>`;
}

function providerActions(provider, options = {}) {
  const {
    includeEdit = false,
    includeDelete = false,
    includePublish = false,
    includeManage = false,
    includeProfile = true,
    includeRecrawl = true,
  } = options;
  const actions = [
    includeProfile && provider.domain
      ? actionLink("profile", "Profile", `/?provider=${encodeURIComponent(provider.domain)}`)
      : "",
    includeEdit
      ? actionButton("edit", "Edit", `data-edit-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includeRecrawl && !includeManage
      ? actionButton("recrawl", "Recrawl", `data-recrawl-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includePublish && provider.id
      ? actionButton("publish", "Publish", `data-publish-provider="${escapeHtml(provider.id)}"`)
      : "",
    includeDelete
      ? actionButton("delete", "Delete", `data-delete-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includeManage
      ? actionButton("edit", "Edit", `data-edit-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includeManage
      ? actionButton("recrawl", "Recrawl", `data-recrawl-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includeManage
      ? actionButton("unpublish", "Unpublish", `data-unpublish-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includeManage
      ? actionButton("delete", "Delete", `data-delete-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
  ].filter(Boolean);

  return actions.length ? actions.join("") : "";
}

function providerRow(provider, options = {}) {
  const { includeAction = false, compact = false } = options;
  const key = providerKey(provider);
  const checked = state.selectedProviders.has(key) ? " checked" : "";
  const action = providerActions(provider, {
    includeDelete: includeAction,
    includeEdit: includeAction,
    includePublish: includeAction,
    includeManage: compact,
    includeProfile: compact,
  });

  return `
    <article class="adminTableRow ${compact ? "adminPublishedRow" : "adminReviewRow"}">
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
      <div class="adminCell">${statusPill(lifecycleStatusForProvider(provider))}</div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
      <div class="adminCell adminCellAction">${action}</div>
    </article>
  `;
}

function compactProviderRow(provider) {
  return `
    <article class="adminTableRow adminReviewRow adminCompactRow adminDashboardProviderRow">
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

  return "Software & Technology";
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

function hasPremiumProfileAccess(profile = {}) {
  const tier = String(profile.subscriptionTier || profile.subscription_tier || profile.plan || "").toLowerCase();

  return Boolean(profile.isPremium || profile.premium || ["premium", "pro", "paid"].includes(tier));
}

function subscriptionTierForProfile(profile = {}) {
  return hasPremiumProfileAccess(profile) ? "premium" : "free";
}

function scraperQualityLogForProfile(profile = {}) {
  const log = profile.scraperQualityLog || {};

  return {
    missing: Array.isArray(log.missing) ? log.missing : [],
    incorrect: Array.isArray(log.incorrect) ? log.incorrect : [],
    added: Array.isArray(log.added) ? log.added : [],
    notes: typeof log.notes === "string" ? log.notes : "",
  };
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
  elements.profileEditServices.value = listToText(provider.services);
  elements.profileEditIndustries.value = listToText(normalizeIndustryList(provider.industries, provider.focusAreas));
  elements.profileEditTechnologies.value = listToText(provider.technologies);
  elements.profileEditPartnerships.value = listToText(provider.vendorPartnerships);
  renderEditableEntries(elements.profileEditSuccessStories, provider.successStories);
  renderEditableEntries(elements.profileEditSolutions, provider.solutions);
  elements.profileEditActivities.value = recentActivitiesToText(provider.recentActivity);
  elements.profileEditNotes.value = listToText(provider.reviewNotes);
  const qualityLog = scraperQualityLogForProfile(provider);
  elements.profileEditQualityMissing.value = listToText(qualityLog.missing);
  elements.profileEditQualityIncorrect.value = listToText(qualityLog.incorrect);
  elements.profileEditQualityAdded.value = listToText(qualityLog.added);
  elements.profileEditQualityNotes.value = qualityLog.notes;
  elements.profileEditMessage.textContent = "";
  elements.profileEditMessage.classList.remove("error");
  elements.profileEditDialog.showModal();
}

function patchProviderInState(key, patch) {
  state.providers = state.providers.map((provider) => (
    providerKey(provider) === key ? { ...provider, ...patch } : provider
  ));
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

function compactJobRow(job) {
  return `
    <article class="adminTableRow adminJobRow adminCompactRow adminDashboardJobRow">
      <div class="adminCell adminCellPrimary">
        <strong>${escapeHtml(job.company_name || job.domain || job.url)}</strong>
        <span>${escapeHtml(job.domain || "")}</span>
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
  if ((Number.parseInt(provider.confidenceScore, 10) || 0) < 60) issues.push("Low confidence");

  return issues;
}

function scraperQualityLogCount(provider = {}) {
  const log = scraperQualityLogForProfile(provider);

  return log.missing.length + log.incorrect.length + log.added.length + (log.notes ? 1 : 0);
}

function issueChips(issues) {
  return issues.map((issue) => `<span class="adminIssueChip">${escapeHtml(issue)}</span>`).join("");
}

function missingDataRow(provider) {
  const key = providerKey(provider);
  const issues = providerMissingIssues(provider);

  return `
    <article class="adminTableRow adminMissingDataRow">
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
      <div class="adminCell"><span>${escapeHtml(scraperQualityLogCount(provider))}</span></div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
      <div class="adminCell adminCellAction">${key ? providerActions(provider, { includeEdit: true, includeRecrawl: true, includeProfile: true }) : ""}</div>
    </article>
  `;
}

function addOptionCount(counts, value, provider) {
  const text = String(value || "").trim();

  if (!text) {
    return;
  }

  if (!counts.has(text)) {
    counts.set(text, { count: 0, providers: [] });
  }

  const item = counts.get(text);
  item.count += 1;
  item.providers.push(provider.companyName || provider.domain || "Provider");
}

function filterOptionGroups(providers) {
  const groups = [
    { key: "country", label: "Countries", values: (provider) => provider.filterBuckets?.countries || [provider.companyLocation?.country || provider.country] },
    { key: "service", label: "Services", values: (provider) => provider.filterBuckets?.services || provider.services || [] },
    { key: "technology", label: "Technologies", values: (provider) => provider.filterBuckets?.technologies || provider.technologies || [] },
    { key: "partner", label: "Partnerships", values: (provider) => provider.filterBuckets?.partnerships || provider.vendorPartnerships || [] },
    { key: "industry", label: "Industries", values: (provider) => provider.filterBuckets?.industries || normalizeIndustryList(provider.industries, provider.focusAreas) },
  ];

  return groups.map((group) => {
    const counts = new Map();

    providers.forEach((provider) => {
      group.values(provider).forEach((value) => addOptionCount(counts, value, provider));
    });

    return {
      ...group,
      options: [...counts.entries()]
        .map(([value, details]) => ({ value, ...details }))
        .sort((left, right) => left.value.localeCompare(right.value)),
    };
  });
}

function renderMissingDataReview() {
  if (!elements.missingDataList) {
    return;
  }

  const providersWithIssues = state.providers
    .map((provider) => ({ provider, issues: providerMissingIssues(provider) }))
    .filter((item) => item.issues.length > 0);

  elements.missingDataList.innerHTML = providersWithIssues.length
    ? `${tableHeader(["Company", "Missing / Needs Review", "Quality Log", "Confidence", "Actions"])}${providersWithIssues.map((item) => missingDataRow(item.provider)).join("")}`
    : emptyState("No missing data issues found.");
}

function renderFilterOptionReview() {
  if (!elements.filterOptionsReview) {
    return;
  }

  const groups = filterOptionGroups(state.providers);

  elements.filterOptionsReview.innerHTML = groups
    .map((group) => `
      <section class="filterReviewGroup">
        <h3>${escapeHtml(group.label)}</h3>
        <div class="filterReviewList">
          ${
            group.options.length
              ? group.options.map((option) => {
                  const isDefaultIndustry = group.key === "industry" && DEFAULT_INDUSTRY_FILTERS.has(option.value);
                  const status = group.key === "industry"
                    ? (isDefaultIndustry ? "Default filter" : "Admin review")
                    : "Available";

                  return `
                    <div class="filterReviewOption">
                      <span>${escapeHtml(option.value)}</span>
                      <strong>${option.count}</strong>
                      <em>${escapeHtml(status)}</em>
                    </div>
                  `;
                }).join("")
              : `<div class="filterReviewEmpty">No options found.</div>`
          }
        </div>
      </section>
    `)
    .join("");
}

function renderStats() {
  const queued = state.jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const failed = state.jobs.filter((job) => job.status === "failed").length;
  const review = state.providers.filter(isReviewProvider).length;
  const published = state.providers.filter(isLiveProvider).length;

  elements.queuedCount.textContent = queued;
  elements.reviewCount.textContent = review;
  elements.publishedCount.textContent = published;
  elements.failedCount.textContent = failed;
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
  elements.reviewProviderList.classList.toggle("adminSelectionMode", state.selectionMode.review);
  elements.publishedProviderList.classList.toggle("adminSelectionMode", state.selectionMode.published);

  elements.dashboardReviewList.innerHTML = reviewProviders.length
    ? `${tableHeader(["Company", "Status", "Confidence"])}${reviewProviders.slice(0, 5).map(compactProviderRow).join("")}`
    : emptyState("No profiles need review.");

  elements.dashboardJobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Status", "Created"])}${state.jobs.slice(0, 5).map(compactJobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  elements.jobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Requested by", "Status", "Created", "Actions"])}${visibleJobs.map(jobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  elements.reviewProviderList.innerHTML = reviewProviders.length
    ? `${tableHeader(["Select", "Company", "Country", "Status", "Confidence", "Actions"])}${visibleReviewProviders.map((provider) => providerRow(provider, { includeAction: true })).join("")}`
    : emptyState("No profiles need review.");

  elements.publishedProviderList.innerHTML = filteredPublishedProviders.length
    ? `${tableHeader(["Select", "Company", "Country", "Status", "Confidence", "Actions"])}${visiblePublishedProviders.map((provider) => providerRow(provider, { compact: true })).join("")}`
    : emptyState("No published providers match the current filters.");

  renderMissingDataReview();
  renderFilterOptionReview();

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

async function loadPublicProfilesForDevelopment() {
  const response = await fetch("/api/profiles").catch(() => null);
  const fallback = !response || !response.ok ? await fetch("/profiles.json") : response;
  const profiles = fallback.ok ? await fallback.json() : [];

  state.providers = Array.isArray(profiles)
    ? profiles.map((profile) => ({ ...profile, status: lifecycleStatusForProvider(profile) }))
    : [];
  state.jobs = [];
}

async function refreshAdminState() {
  if (DEV_ADMIN_ACCESS) {
    elements.setupNotice.hidden = true;
    await loadPublicProfilesForDevelopment();
    state.jobsPage = 1;
    state.reviewPage = 1;
    state.publishedPage = 1;
    renderStats();
    renderLists();
    return;
  }

  const response = await fetch("/api/admin-state", { headers: adminHeaders() });
  const payload = await response.json();

  if (payload.configured === false) {
    elements.setupNotice.hidden = false;
    state.jobs = [];
    state.providers = [];
  } else if (!response.ok) {
    throw new Error(payload.error || "Failed to load admin state.");
  } else {
    elements.setupNotice.hidden = true;
    state.jobs = payload.jobs || [];
    state.providers = payload.providers || [];
    state.selectedProviders = new Set(
      [...state.selectedProviders].filter((key) => state.providers.some((provider) => providerKey(provider) === key))
    );
    state.jobsPage = 1;
    state.reviewPage = 1;
    state.publishedPage = 1;
  }

  renderStats();
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

  if (DEV_ADMIN_ACCESS) {
    state.jobs.unshift({
      url: elements.scrapeUrl.value,
      domain: new URL(elements.scrapeUrl.value).hostname.replace(/^www\./, ""),
      company_name: elements.scrapeCompanyName.value || null,
      requested_by: adminEmail(),
      status: "queued",
      created_at: new Date().toISOString(),
    });
    elements.scrapeMessage.textContent = "Development job queued locally.";
    elements.scrapeUrl.value = "";
    elements.scrapeCompanyName.value = "";
    renderStats();
    renderLists();
    showToast("Development job queued.");
    setBusy(submitButton, false);
    return;
  }

  try {
    const response = await fetch("/api/admin-scrape", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        url: elements.scrapeUrl.value,
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

  if (DEV_ADMIN_ACCESS) {
    const job = {
      id: `dev-recrawl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url,
      domain: new URL(url).hostname.replace(/^www\./, ""),
      company_name: provider.companyName || null,
      requested_by: adminEmail(),
      status: "queued",
      created_at: new Date().toISOString(),
    };
    state.jobs.unshift(job);
    renderStats();
    renderLists();
    return job;
  }

  const response = await fetch("/api/admin-scrape", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      url,
      companyName: provider.companyName || provider.domain || "",
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

  if (options.runNow && job?.id && !DEV_ADMIN_ACCESS) {
    await runScrapeJob(job.id);
    return true;
  }

  await refreshAdminState();
  setSection("scrape");
  return true;
}

async function publishProvider(id) {
  if (!id) {
    return false;
  }

  if (DEV_ADMIN_ACCESS) {
    patchProviderInState(id, { status: "approved" });
    renderStats();
    renderLists();
    return true;
  }

  const response = await fetch("/api/admin-publish", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status: "approved" }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to publish provider.");
  }

  await refreshAdminState();
  return true;
}

function selectedKeysForScope(scope) {
  const visibleKeys = scope === "review" ? state.visibleReviewKeys : state.visiblePublishedKeys;

  return visibleKeys.filter((key) => state.selectedProviders.has(key));
}

function updateBulkControls() {
  const reviewSelected = selectedKeysForScope("review");
  const publishedSelected = selectedKeysForScope("published");
  const reviewAllSelected = state.visibleReviewKeys.length > 0 && state.visibleReviewKeys.every((key) => state.selectedProviders.has(key));
  const publishedAllSelected = state.visiblePublishedKeys.length > 0 && state.visiblePublishedKeys.every((key) => state.selectedProviders.has(key));

  if (elements.reviewSelectPage) {
    elements.reviewBulkActionBar.hidden = !state.selectionMode.review;
    elements.reviewSelectModeButton.setAttribute("aria-pressed", String(state.selectionMode.review));
    elements.reviewSelectModeButton.lastChild.textContent = state.selectionMode.review ? " Done" : " Select";
    elements.reviewSelectPage.checked = reviewAllSelected;
    elements.reviewSelectPage.indeterminate = !reviewAllSelected && reviewSelected.length > 0;
    elements.reviewBulkCount.textContent = `${reviewSelected.length} selected`;
    elements.reviewBulkApply.disabled = reviewSelected.length === 0 || !elements.reviewBulkAction.value;
  }

  if (elements.publishedSelectPage) {
    elements.publishedBulkActionBar.hidden = !state.selectionMode.published;
    elements.publishedSelectModeButton.setAttribute("aria-pressed", String(state.selectionMode.published));
    elements.publishedSelectModeButton.lastChild.textContent = state.selectionMode.published ? " Done" : " Select";
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
  const selectedKeys = selectedKeysForScope(scope);

  if (!action || selectedKeys.length === 0) {
    return false;
  }

  if (action === "recrawl") {
    for (const key of selectedKeys) {
      const provider = findProvider(key);

      if (provider) {
        await queueRecrawlJob(provider);
      }
    }

    selectedKeys.forEach((key) => state.selectedProviders.delete(key));
    actionSelect.value = "";
    await refreshAdminState();
    setSection("scrape");
    return true;
  }

  if (action === "publish") {
    for (const key of selectedKeys) {
      await publishProvider(key);
    }
  }

  if (action === "unpublish") {
    for (const key of selectedKeys) {
    await updateProviderStatus(key, "in_review");
    }
  }

  selectedKeys.forEach((key) => state.selectedProviders.delete(key));
  actionSelect.value = "";
  renderLists();
  return true;
}

async function updateProviderStatus(key, status) {
  if (!key) {
    return false;
  }

  if (DEV_ADMIN_ACCESS) {
    patchProviderInState(key, { status });
    renderStats();
    renderLists();
    if (!LIVE_PROFILE_STATUSES.has(normalizeLifecycleStatus(status))) {
      setSection("review");
    }
    return true;
  }

  const response = await fetch("/api/admin-provider", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key, status }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to update provider.");
  }

  await refreshAdminState();
  if (!LIVE_PROFILE_STATUSES.has(normalizeLifecycleStatus(status))) {
    setSection("review");
  }
  return true;
}

async function deleteProvider(key) {
  if (!key || !window.confirm("Delete this provider from the admin list?")) {
    return { cancelled: true };
  }

  if (DEV_ADMIN_ACCESS) {
    state.providers = state.providers.filter((provider) => providerKey(provider) !== key);
    renderStats();
    renderLists();
    return true;
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

  if (DEV_ADMIN_ACCESS) {
    state.jobs = state.jobs.filter((job) => String(job.id || "") !== String(id));
    renderStats();
    renderLists();
    return true;
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

async function saveProfileEdit(event) {
  event.preventDefault();
  const submitButton = event.submitter || elements.profileEditForm.querySelector("button[type='submit']");
  const key = elements.profileEditKey.value;
  const provider = findProvider(key) || {};
  const successStories = collectEditableEntries(elements.profileEditSuccessStories);
  const solutions = collectEditableEntries(elements.profileEditSolutions);
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
    services: textToList(elements.profileEditServices.value),
    industries: normalizeIndustryList(textToList(elements.profileEditIndustries.value)),
    technologies: textToList(elements.profileEditTechnologies.value),
    vendorPartnerships: textToList(elements.profileEditPartnerships.value),
    successStories,
    solutions,
    recentActivity: textToRecentActivities(elements.profileEditActivities.value),
    reviewNotes: textToList(elements.profileEditNotes.value),
    scraperQualityLog: {
      missing: textToList(elements.profileEditQualityMissing.value),
      incorrect: textToList(elements.profileEditQualityIncorrect.value),
      added: textToList(elements.profileEditQualityAdded.value),
      notes: elements.profileEditQualityNotes.value.trim(),
    },
  };

  elements.profileEditMessage.textContent = "Saving profile...";
  elements.profileEditMessage.classList.remove("error");
  setBusy(submitButton, true, "Saving");

  try {
    if (DEV_ADMIN_ACCESS) {
      patchProviderInState(key, { ...patch, status });
      elements.profileEditDialog.close();
      renderStats();
      renderLists();
      showToast("Profile saved.");
      return;
    }

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
  elements.publishedFlipButton.lastChild.textContent = ` ${label}`;
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.scrapeForm.addEventListener("submit", handleScrapeSubmit);
  elements.publishedFilters.addEventListener("submit", applyPublishedFilters);
  elements.publishedNameFilter.addEventListener("input", applyPublishedFilters);
  elements.publishedStatusFilter.addEventListener("change", applyPublishedFilters);
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
    runAdminAction(elements.reviewBulkApply, "Applying", "Bulk action complete.", () => applyBulkAction("review"));
  });
  elements.publishedBulkApply.addEventListener("click", () => {
    runAdminAction(elements.publishedBulkApply, "Applying", "Bulk action complete.", () => applyBulkAction("published"));
  });
  elements.profileEditForm.addEventListener("submit", saveProfileEdit);
  elements.profileEditClose.addEventListener("click", () => elements.profileEditDialog.close());
  elements.profileEditAddSuccessStory.addEventListener("click", () => addEditableEntry(elements.profileEditSuccessStories));
  elements.profileEditAddSolution.addEventListener("click", () => addEditableEntry(elements.profileEditSolutions));
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
      setSection(button.dataset.adminSection);
    });
  });
}

async function init() {
  bindEvents();
  showShell();
  setSection("dashboard");
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
