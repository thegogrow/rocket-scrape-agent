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
  },
  publishedSortField: "name",
  publishedSortDirection: "asc",
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
  reviewPrevButton: document.querySelector("#reviewPrevButton"),
  reviewNextButton: document.querySelector("#reviewNextButton"),
  reviewPageInfo: document.querySelector("#reviewPageInfo"),
  reviewPageNumbers: document.querySelector("#reviewPageNumbers"),
  publishedFilters: document.querySelector("#publishedFilters"),
  publishedNameFilter: document.querySelector("#publishedNameFilter"),
  publishedSortFilter: document.querySelector("#publishedSortFilter"),
  publishedFlipButton: document.querySelector("#publishedFlipButton"),
  publishedProviderList: document.querySelector("#publishedProviderList"),
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
  profileEditServices: document.querySelector("#profileEditServices"),
  profileEditTechnologies: document.querySelector("#profileEditTechnologies"),
  profileEditPartnerships: document.querySelector("#profileEditPartnerships"),
  profileEditActivities: document.querySelector("#profileEditActivities"),
  profileEditNotes: document.querySelector("#profileEditNotes"),
  profileEditMessage: document.querySelector("#profileEditMessage"),
};

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
  const label = String(status || "draft")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return `<span class="statusPill statusPill-${escapeHtml(status || "draft")}">${escapeHtml(label)}</span>`;
}

function emptyState(label) {
  return `<div class="emptyResults">${escapeHtml(label)}</div>`;
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
  const logoUrl = provider.logoUrl;

  if (
    logoUrl &&
    provider.domain &&
    SVG_LOGO_DOMAINS.has(provider.domain) &&
    String(logoUrl).startsWith(`/logos/${provider.domain}/`) &&
    String(logoUrl).endsWith("/logo.png")
  ) {
    return `/logos/${provider.domain}/logo.svg`;
  }

  return logoUrl;
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
    includePublish = false,
    includeManage = false,
    includeProfile = true,
  } = options;
  const actions = [
    includeProfile && provider.domain
      ? actionLink("profile", "Profile", `/?provider=${encodeURIComponent(provider.domain)}`)
      : "",
    includeEdit
      ? actionButton("edit", "Edit Profile", `data-edit-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
      : "",
    includePublish && provider.id
      ? actionButton("publish", "Publish", `data-publish-provider="${escapeHtml(provider.id)}"`)
      : "",
    includeManage
      ? actionButton("edit", "Edit Profile", `data-edit-provider="${escapeHtml(provider.id || provider.domain || "")}"`)
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
  const action = providerActions(provider, {
    includeEdit: includeAction,
    includePublish: includeAction,
    includeManage: compact,
    includeProfile: compact,
  });

  return `
    <article class="adminTableRow ${compact ? "adminPublishedRow" : "adminReviewRow"}">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain)}</strong>
            <span title="${escapeHtml(provider.domain || provider.website || "")}">${escapeHtml(provider.domain || provider.website || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell"><span>${escapeHtml(provider.country || provider.location || "Unknown")}</span></div>
      <div class="adminCell">${statusPill(provider.status || "published")}</div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
      <div class="adminCell adminCellAction">${action}</div>
    </article>
  `;
}

function compactProviderRow(provider) {
  const actions = [
    provider.id ? actionButton("edit", "Edit", `data-edit-provider="${escapeHtml(provider.id)}"`) : "",
    provider.id ? actionButton("publish", "Publish", `data-publish-provider="${escapeHtml(provider.id)}"`) : "",
  ].filter(Boolean).join("");

  return `
    <article class="adminTableRow adminReviewRow adminCompactRow">
      <div class="adminCell adminCellPrimary">
        <span class="adminProviderIdentity">
          ${providerLogo(provider)}
          <span>
            <strong>${escapeHtml(provider.companyName || provider.domain)}</strong>
            <span>${escapeHtml(provider.domain || "")}</span>
          </span>
        </span>
      </div>
      <div class="adminCell">${statusPill(provider.status || "draft")}</div>
      <div class="adminCell"><span>${escapeHtml(provider.confidenceScore || 0)}%</span></div>
      <div class="adminCell adminCellAction">${actions}</div>
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

  const filteredProviders = providers.filter((provider) => {
    if (nameFilter) {
      const nameText = `${provider.companyName || ""} ${provider.domain || ""}`.toLowerCase();
      if (!nameText.includes(nameFilter)) {
        return false;
      }
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

function textToList(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textToRecentActivities(value) {
  return textToList(value).map((title) => ({ title, source: "Admin edit" }));
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
  elements.profileEditCountry.value = provider.country || "";
  elements.profileEditServices.value = listToText(provider.services);
  elements.profileEditTechnologies.value = listToText(provider.technologies);
  elements.profileEditPartnerships.value = listToText(provider.vendorPartnerships);
  elements.profileEditActivities.value = listToText(provider.recentActivity);
  elements.profileEditNotes.value = listToText(provider.reviewNotes);
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
    <article class="adminTableRow adminJobRow adminCompactRow">
      <div class="adminCell adminCellPrimary">
        <strong>${escapeHtml(job.company_name || job.domain || job.url)}</strong>
        <span>${escapeHtml(job.domain || "")}</span>
      </div>
      <div class="adminCell">${statusPill(job.status)}</div>
      <div class="adminCell"><span>${escapeHtml(job.created_at ? new Date(job.created_at).toLocaleDateString() : "No date")}</span></div>
    </article>
  `;
}

function renderStats() {
  const queued = state.jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const failed = state.jobs.filter((job) => job.status === "failed").length;
  const review = state.providers.filter((provider) => provider.status && provider.status !== "published").length;
  const published = state.providers.filter((provider) => !provider.status || provider.status === "published").length;

  elements.queuedCount.textContent = queued;
  elements.reviewCount.textContent = review;
  elements.publishedCount.textContent = published;
  elements.failedCount.textContent = failed;
}

function bindPublishButtons() {
  document.querySelectorAll("[data-publish-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await publishProvider(button.dataset.publishProvider);
    });
  });

  document.querySelectorAll("[data-edit-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      openEditProfile(button.dataset.editProvider);
    });
  });

  document.querySelectorAll("[data-unpublish-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateProviderStatus(button.dataset.unpublishProvider, "draft");
    });
  });

  document.querySelectorAll("[data-delete-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteProvider(button.dataset.deleteProvider);
    });
  });

  document.querySelectorAll("[data-delete-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteJob(button.dataset.deleteJob);
    });
  });

  document.querySelectorAll("[data-run-job]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;

      try {
        await runScrapeJob(button.dataset.runJob);
      } catch (error) {
        elements.scrapeMessage.textContent = error.message;
        elements.scrapeMessage.classList.add("error");
        button.disabled = false;
      }
    });
  });
}

function renderLists() {
  const reviewProviders = state.providers.filter((provider) => provider.status && provider.status !== "published");
  const publishedProviders = state.providers.filter((provider) => !provider.status || provider.status === "published");
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

  elements.dashboardReviewList.innerHTML = reviewProviders.length
    ? `${tableHeader(["Company", "Status", "Confidence", "Actions"])}${reviewProviders.slice(0, 5).map(compactProviderRow).join("")}`
    : emptyState("No profiles need review.");

  elements.dashboardJobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Status", "Created"])}${state.jobs.slice(0, 5).map(compactJobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  elements.jobList.innerHTML = state.jobs.length
    ? `${tableHeader(["Company", "Requested by", "Status", "Created", "Actions"])}${visibleJobs.map(jobRow).join("")}`
    : emptyState("No scrape jobs yet.");

  elements.reviewProviderList.innerHTML = reviewProviders.length
    ? `${tableHeader(["Company", "Country", "Status", "Confidence", "Actions"])}${visibleReviewProviders.map((provider) => providerRow(provider, { includeAction: true })).join("")}`
    : emptyState("No draft profiles need review.");

  elements.publishedProviderList.innerHTML = filteredPublishedProviders.length
    ? `${tableHeader(["Company", "Country", "Status", "Confidence", "Actions"])}${visiblePublishedProviders.map((provider) => providerRow(provider, { compact: true })).join("")}`
    : emptyState("No published providers match the current filters.");

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
}

async function loadPublicProfilesForDevelopment() {
  const response = await fetch("/api/profiles").catch(() => null);
  const fallback = !response || !response.ok ? await fetch("/profiles.json") : response;
  const profiles = fallback.ok ? await fallback.json() : [];

  state.providers = Array.isArray(profiles)
    ? profiles.map((profile) => ({ ...profile, status: "published" }))
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
    state.jobsPage = 1;
    state.reviewPage = 1;
    state.publishedPage = 1;
  }

  renderStats();
  renderLists();
}

async function handleLogin(event) {
  event.preventDefault();
  elements.loginMessage.textContent = "";
  elements.loginMessage.classList.remove("error");

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
  } catch (error) {
    elements.loginMessage.textContent = error.message;
    elements.loginMessage.classList.add("error");
  }
}

async function handleScrapeSubmit(event) {
  event.preventDefault();
  elements.scrapeMessage.textContent = "Queueing scrape job...";
  elements.scrapeMessage.classList.remove("error");

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
  } catch (error) {
    elements.scrapeMessage.textContent = error.message;
    elements.scrapeMessage.classList.add("error");
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

async function publishProvider(id) {
  if (!id) {
    return;
  }

  if (DEV_ADMIN_ACCESS) {
    patchProviderInState(id, { status: "published" });
    renderStats();
    renderLists();
    return;
  }

  const response = await fetch("/api/admin-publish", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id, status: "published" }),
  });

  if (response.ok) {
    await refreshAdminState();
  }
}

async function updateProviderStatus(key, status) {
  if (!key) {
    return;
  }

  if (DEV_ADMIN_ACCESS) {
    patchProviderInState(key, { status });
    renderStats();
    renderLists();
    return;
  }

  const response = await fetch("/api/admin-provider", {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key, status }),
  });

  if (response.ok) {
    await refreshAdminState();
  }
}

async function deleteProvider(key) {
  if (!key || !window.confirm("Delete this provider from the admin list?")) {
    return;
  }

  if (DEV_ADMIN_ACCESS) {
    state.providers = state.providers.filter((provider) => providerKey(provider) !== key);
    renderStats();
    renderLists();
    return;
  }

  const response = await fetch("/api/admin-provider", {
    method: "DELETE",
    headers: adminHeaders(),
    body: JSON.stringify({ id: key }),
  });

  if (response.ok) {
    await refreshAdminState();
  }
}

async function deleteJob(id) {
  if (!id || !window.confirm("Delete this scrape job?")) {
    return;
  }

  if (DEV_ADMIN_ACCESS) {
    state.jobs = state.jobs.filter((job) => String(job.id || "") !== String(id));
    renderStats();
    renderLists();
    return;
  }

  const response = await fetch("/api/admin-job", {
    method: "DELETE",
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    window.alert(payload.error || "Failed to delete job.");
    return;
  }

  await refreshAdminState();
}

async function saveProfileEdit(event) {
  event.preventDefault();
  const key = elements.profileEditKey.value;
  const patch = {
    companyName: elements.profileEditName.value.trim(),
    logoUrl: elements.profileEditLogo.value.trim() || null,
    website: elements.profileEditWebsite.value.trim(),
    country: elements.profileEditCountry.value.trim(),
    services: textToList(elements.profileEditServices.value),
    technologies: textToList(elements.profileEditTechnologies.value),
    vendorPartnerships: textToList(elements.profileEditPartnerships.value),
    recentActivity: textToRecentActivities(elements.profileEditActivities.value),
    reviewNotes: textToList(elements.profileEditNotes.value),
  };

  elements.profileEditMessage.textContent = "Saving profile...";
  elements.profileEditMessage.classList.remove("error");

  try {
    if (DEV_ADMIN_ACCESS) {
      patchProviderInState(key, patch);
      elements.profileEditDialog.close();
      renderStats();
      renderLists();
      return;
    }

    const response = await fetch("/api/admin-provider", {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ id: key, profile: patch }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to save profile.");
    }

    elements.profileEditDialog.close();
    await refreshAdminState();
  } catch (error) {
    elements.profileEditMessage.textContent = error.message;
    elements.profileEditMessage.classList.add("error");
  }
}

function applyPublishedFilters(event) {
  event?.preventDefault();
  state.publishedFilters = {
    name: elements.publishedNameFilter.value,
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
  elements.publishedSortFilter.addEventListener("change", () => {
    state.publishedSortField = elements.publishedSortFilter.value;
    updatePublishedSortButton();
    applyPublishedFilters();
  });
  elements.publishedFlipButton.addEventListener("click", flipPublishedList);
  elements.profileEditForm.addEventListener("submit", saveProfileEdit);
  elements.profileEditClose.addEventListener("click", () => elements.profileEditDialog.close());
  elements.sidebarToggle.addEventListener("click", toggleSidebar);
  elements.refreshButton.addEventListener("click", refreshAdminState);
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
