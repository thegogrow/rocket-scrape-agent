const state = {
  profiles: [],
  filtered: [],
  selectedDomain: null,
  activeCategory: null,
  profileMode: false,
  quickFilter: "all",
  activeDetailTab: "overview",
  adminJobs: [],
  adminProviders: [],
};

const elements = {
  status: document.querySelector("#status"),
  authButton: document.querySelector("#authButton"),
  authModal: document.querySelector("#authModal"),
  authCloseButton: document.querySelector("#authCloseButton"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  searchHero: document.querySelector(".searchHero"),
  homePage: document.querySelector("#homePage"),
  adminPage: document.querySelector("#adminPage"),
  adminSetupNotice: document.querySelector("#adminSetupNotice"),
  adminLoginPanel: document.querySelector("#adminLoginPanel"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminEmail: document.querySelector("#adminEmail"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLoginMessage: document.querySelector("#adminLoginMessage"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  adminSignedInAs: document.querySelector("#adminSignedInAs"),
  adminSignOutButton: document.querySelector("#adminSignOutButton"),
  adminRefreshButton: document.querySelector("#adminRefreshButton"),
  scrapeForm: document.querySelector("#scrapeForm"),
  scrapeUrl: document.querySelector("#scrapeUrl"),
  scrapeCompanyName: document.querySelector("#scrapeCompanyName"),
  scrapeMessage: document.querySelector("#scrapeMessage"),
  jobList: document.querySelector("#jobList"),
  adminProviderList: document.querySelector("#adminProviderList"),
  providersPage: document.querySelector("#providersPage"),
  navTabs: document.querySelectorAll("[data-nav-tab]"),
  searchInput: document.querySelector("#searchInput"),
  filterSearchInput: document.querySelector("#filterSearchInput"),
  countryFilter: document.querySelector("#countryFilter"),
  countryOptions: document.querySelector("#countryOptions"),
  serviceFilter: document.querySelector("#serviceFilter"),
  serviceOptions: document.querySelector("#serviceOptions"),
  technologyFilter: document.querySelector("#technologyFilter"),
  technologyOptions: document.querySelector("#technologyOptions"),
  partnerFilter: document.querySelector("#partnerFilter"),
  partnerOptions: document.querySelector("#partnerOptions"),
  confidenceFilter: document.querySelector("#confidenceFilter"),
  confidenceValue: document.querySelector("#confidenceValue"),
  resetButton: document.querySelector("#resetButton"),
  profileList: document.querySelector("#profileList"),
  detailContent: document.querySelector("#detailContent"),
};

const DEMO_ACCOUNT = {
  email: "phil@thegogrow.ch",
  password: "REscraper26!",
};

const CATEGORY_RULES = [
  { name: "Commerce", match: ["commerce", "ecommerce", "retail", "shopify", "salesforce", "sap"] },
  { name: "Cloud Migration", match: ["cloud migration", "migration", "aws", "azure", "google cloud"] },
  { name: "DevOps", match: ["devops", "ci/cd", "platform engineering", "site reliability", "sre"] },
  { name: "Security", match: ["security", "compliance", "audit", "zero trust"] },
  { name: "Data & AI", match: ["data", "ai", "analytics", "machine learning", "intelligence"] },
  { name: "Managed Services", match: ["managed services", "service management", "operations", "appops"] },
  { name: "Software Engineering", match: ["software engineering", "application", "development", "engineering"] },
];

function getProfileCategory(profile) {
  const text = [
    profile.services,
    profile.technologies,
    profile.focusAreas,
    profile.description,
    profile.industries,
  ]
    .flat(2)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const category = CATEGORY_RULES.find((rule) =>
    rule.match.some((keyword) => text.includes(keyword))
  );

  return category?.name || "IT & Administration";
}

function isCloudNativeProfile(profile) {
  const text = [
    profile.services,
    profile.technologies,
    profile.focusAreas,
    profile.description,
    profile.vendorPartnerships,
  ]
    .flat(2)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /cloud|kubernetes|devops|platform|container|terraform|aws|azure|google cloud|openshift/.test(text);
}

function isIndustryProfile(profile) {
  const text = [
    profile.industries,
    profile.services,
    profile.focusAreas,
    profile.description,
  ]
    .flat(2)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    (Array.isArray(profile.industries) && profile.industries.length > 0) ||
    /bank|finance|insurance|health|manufactur|retail|public sector|government|automotive|travel|hospitality|education|energy|telecom|media|commerce/.test(text)
  );
}

function matchesQuickFilter(profile) {
  if (state.quickFilter === "all") {
    return true;
  }

  if (state.quickFilter === "Cloud Native") {
    return isCloudNativeProfile(profile);
  }

  if (state.quickFilter === "Industries") {
    return isIndustryProfile(profile);
  }

  if (state.quickFilter === "Vendor Programs") {
    return Array.isArray(profile.vendorPartnerships) && profile.vendorPartnerships.length > 0;
  }

  if (state.quickFilter === "Switzerland" || state.quickFilter === "Germany") {
    return profile.country === state.quickFilter || String(profile.location || "").includes(state.quickFilter);
  }

  return true;
}

function renderQuickFilters() {
  document.querySelectorAll(".categoryTile").forEach((button) => {
    const isActive = button.dataset.quickFilter === state.quickFilter;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function uniqueSorted(values) {
  return [...new Set(values.flat().filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function logoMarkup(profile, large = false) {
  const label = escapeHtml(profile.companyName || profile.domain);
  const fallback = escapeHtml(initials(profile));
  const className = large ? "logoBox logoLarge" : "logoBox";

  if (!profile.logoUrl) {
    return `<div class="${className}" aria-label="${label}">${fallback}</div>`;
  }

  return `<div class="${className}"><img src="${escapeHtml(profile.logoUrl)}" alt="${label} logo" onerror="this.parentElement.textContent='${fallback}'" /></div>`;
}

function starRatingMarkup(score) {
  const normalizedScore = Math.max(0, Math.min(100, Number.parseInt(score, 10) || 0));
  const starFill = `${normalizedScore}%`;

  return `
    <span class="confidenceRating" aria-label="${normalizedScore}% confidence">
      <span class="starRating" style="--rating: ${starFill}">
        <span class="starBase" aria-hidden="true">★★★★★</span>
        <span class="starFill" aria-hidden="true">★★★★★</span>
      </span>
      <span class="confidencePercent">${normalizedScore}%</span>
    </span>
  `;
}

function chips(values, emptyLabel = "None found", warn = false) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];

  if (list.length === 0) {
    return `<span class="chip ${warn ? "warn" : ""}">${escapeHtml(emptyLabel)}</span>`;
  }

  return list.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("");
}

function optionList(datalist, values) {
  datalist.innerHTML = "";

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    datalist.appendChild(option);
  });
}

function populateFilters() {
  optionList(elements.countryOptions, uniqueSorted(state.profiles.map((profile) => profile.country)));
  optionList(elements.serviceOptions, uniqueSorted(state.profiles.map((profile) => profile.services)));
  optionList(
    elements.technologyOptions,
    uniqueSorted(state.profiles.map((profile) => profile.technologies))
  );
  optionList(
    elements.partnerOptions,
    uniqueSorted(state.profiles.map((profile) => profile.vendorPartnerships))
  );
}

function valueMatchesText(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function listMatchesText(values, query) {
  return Array.isArray(values) && values.some((value) => valueMatchesText(value, query));
}

function profileSearchText(profile) {
  return [
    profile.companyName,
    profile.domain,
    profile.website,
    profile.country,
    profile.description,
    profile.location,
    profile.services,
    profile.technologies,
    profile.vendorPartnerships,
    profile.recentActivity?.map((activity) => activity.title),
  ]
    .flat(2)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function applyFilters() {
  const query = [elements.searchInput.value, elements.filterSearchInput.value]
    .join(" ")
    .trim()
    .toLowerCase();
  const country = elements.countryFilter.value.trim().toLowerCase();
  const service = elements.serviceFilter.value.trim().toLowerCase();
  const technology = elements.technologyFilter.value.trim().toLowerCase();
  const partner = elements.partnerFilter.value.trim().toLowerCase();
  const confidence = Number.parseInt(elements.confidenceFilter.value, 10);

  elements.confidenceValue.textContent = confidence;
  renderQuickFilters();

  state.filtered = state.profiles
    .filter((profile) => {
      if (query && !profileSearchText(profile).includes(query)) return false;
      if (country && !valueMatchesText(profile.country, country) && !valueMatchesText(profile.location, country)) return false;
      if (service && !listMatchesText(profile.services, service)) return false;
      if (technology && !listMatchesText(profile.technologies, technology)) return false;
      if (partner && !listMatchesText(profile.vendorPartnerships, partner)) return false;
      if ((profile.confidenceScore || 0) < confidence) return false;
      if (!matchesQuickFilter(profile)) return false;
      return true;
    })
    .sort((left, right) => (right.confidenceScore || 0) - (left.confidenceScore || 0));

  renderList();

  if (state.profileMode && !state.filtered.some((profile) => profile.domain === state.selectedDomain)) {
    state.selectedDomain = state.filtered[0]?.domain || null;
  }

  if (state.profileMode) {
    renderDetail();
  }
}

function renderList() {
  const listProfiles = state.activeCategory
    ? state.filtered.filter((profile) => getProfileCategory(profile) === state.activeCategory)
    : state.filtered;

  document.body.classList.toggle("categoryMode", Boolean(state.activeCategory));

  if (listProfiles.length === 0) {
    elements.profileList.innerHTML = `<div class="emptyResults">No providers match the current filters.</div>`;
    return;
  }

  if (state.activeCategory) {
    const cards = listProfiles.map(cardMarkup).join("");

    elements.profileList.innerHTML = `
      <section class="categoryPage">
        <div class="categoryPageHeader">
          <div class="categoryTitleBlock">
            <button class="backButton categoryBackButton" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /><path d="M10 12h10" /></svg>
              Back to providers
            </button>
            <h2>${escapeHtml(state.activeCategory)}</h2>
          </div>
          <span>${listProfiles.length} provider${listProfiles.length === 1 ? "" : "s"}</span>
        </div>
        <div class="categoryCards categoryPageGrid">${cards}</div>
      </section>
    `;

    bindProfileCards();
    elements.profileList.querySelector(".categoryBackButton").addEventListener("click", () => {
      state.activeCategory = null;
      document.body.classList.remove("categoryMode");
      renderList();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return;
  }

  const groupedProfiles = new Map();

  listProfiles.forEach((profile) => {
    const category = getProfileCategory(profile);

    if (!groupedProfiles.has(category)) {
      groupedProfiles.set(category, []);
    }

    groupedProfiles.get(category).push(profile);
  });

  elements.profileList.innerHTML = [...groupedProfiles.entries()]
    .map(([category, profiles]) => {
      const visibleProfiles = profiles.slice(0, 2);
      const cards = visibleProfiles.map(cardMarkup).join("");

      return `
        <section class="categorySection">
          <div class="categoryHeader">
            <div>
              <h3>${escapeHtml(category)}</h3>
            </div>
            <button class="moreButton" type="button" data-category="${escapeHtml(category)}">
              More in ${escapeHtml(category)} <span aria-hidden="true">›</span>
            </button>
          </div>
          <div class="categoryCards">${cards}</div>
        </section>
      `;
    })
    .join("");

  bindProfileCards();

  elements.profileList.querySelectorAll(".moreButton").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      renderList();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function cardMarkup(profile) {
  const active = profile.domain === state.selectedDomain ? " active" : "";
  const services = profile.services.slice(0, 3).join(", ") || "No services listed";
  const tags = [...profile.services.slice(0, 2), ...profile.technologies.slice(0, 2)];
  const description = profile.description || services;

  return `
    <button class="profileCard${active}" type="button" data-domain="${escapeHtml(profile.domain)}">
      <span class="cardTop">
        ${logoMarkup(profile)}
        <span class="cardHeading">
          <span class="cardTitle">${escapeHtml(profile.companyName)}</span>
          <span class="cardMeta">${escapeHtml(profile.domain)}</span>
          <span class="ratingLine">
            ${starRatingMarkup(profile.confidenceScore)}
          </span>
        </span>
      </span>
      <span class="cardText">${escapeHtml(description).slice(0, 220)}</span>
      <span class="cardTags">${chips(tags, "No tags found")}</span>
    </button>
  `;
}

function bindProfileCards() {
  elements.profileList.querySelectorAll(".profileCard").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDomain = button.dataset.domain;
      state.activeDetailTab = "overview";
      state.profileMode = true;
      state.activeCategory = null;
      document.body.classList.remove("categoryMode");
      renderDetail();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function linkMarkup(url, label) {
  if (!url) {
    return "";
  }

  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function activityMarkup(profile) {
  const activity = Array.isArray(profile.recentActivity) ? profile.recentActivity : [];

  if (activity.length === 0) {
    return `<div class="activityItem">No recent activity found.</div>`;
  }

  return activity
    .map((item) => {
      const meta = [item.date, item.sourceType, item.source ? linkMarkup(item.source, "source") : null]
        .filter(Boolean)
        .join(" · ");

      return `
        <div class="activityItem">
          <div>${escapeHtml(item.title)}</div>
          <div class="activityMeta">${meta || "No date or source available"}</div>
        </div>
      `;
    })
    .join("");
}

function evidenceStatusMarkup(label, available) {
  return `
    <div class="evidenceItem">
      <span>${escapeHtml(label)}</span>
      <strong class="${available ? "available" : "missing"}">${available ? "Available" : "Missing"}</strong>
    </div>
  `;
}

function evidenceSummaryMarkup(profile) {
  return `
    <div class="evidenceGrid">
      ${evidenceStatusMarkup("Website content first", Boolean(profile.files?.sourceBundle || profile.description))}
      ${evidenceStatusMarkup("Logo source", Boolean(profile.logoUrl || profile.files?.logo))}
      ${evidenceStatusMarkup("Company enrichment", Boolean(profile.files?.enrichment))}
      ${evidenceStatusMarkup("GitHub support only", Boolean(profile.githubUrl || profile.files?.github))}
    </div>
  `;
}

function dataQualityMarkup(profile) {
  const notes = Array.isArray(profile.reviewNotes) ? profile.reviewNotes : [];

  if (notes.length === 0) {
    return `<div class="noteItem">No data quality issues flagged.</div>`;
  }

  return notes.map((note) => `<div class="noteItem">${escapeHtml(note)}</div>`).join("");
}

function renderDetail() {
  const profile = state.profiles.find((item) => item.domain === state.selectedDomain);

  if (!profile) {
    state.profileMode = false;
    state.activeCategory = null;
    document.body.classList.remove("profileMode");
    document.body.classList.remove("categoryMode");
    elements.detailContent.closest(".detail").hidden = true;
    elements.detailContent.className = "detailContent empty";
    elements.detailContent.textContent = "";
    return;
  }

  document.body.classList.add("profileMode");
  elements.detailContent.closest(".detail").hidden = false;
  elements.detailContent.className = "detailContent";
  elements.detailContent.innerHTML = `
    <button class="backButton" type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /><path d="M10 12h10" /></svg>
      Back to providers
    </button>
    <div class="listingDetail">
      <aside class="listingSidebar">
        ${logoMarkup(profile, true)}
        <h3>${escapeHtml(profile.companyName)}</h3>
        <p>By ${escapeHtml(profile.domain)}</p>
        <div class="sidebarRating">${starRatingMarkup(profile.confidenceScore)}</div>
        <div class="priceBox">
          <strong>Profile Evidence</strong>
          <span>Generated from website, enrichment, GitHub support data, and logo sources.</span>
        </div>
        <a class="getItNow" href="${escapeHtml(profile.website || "#")}" target="_blank" rel="noreferrer">Visit Website</a>
        ${profile.githubUrl ? `<a class="tryIt" href="${escapeHtml(profile.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}

        <div class="sidebarBlock">
          <h4>Business Need</h4>
          <div class="chips">${chips([getProfileCategory(profile)])}</div>
        </div>
        <div class="sidebarBlock">
          <h4>Services</h4>
          <div class="chips">${chips(profile.services.slice(0, 4), "No services found")}</div>
        </div>
        <div class="sidebarBlock">
          <h4>Compatible With</h4>
          <div class="chips">${chips(profile.technologies.slice(0, 4), "No technologies found", true)}</div>
        </div>
      </aside>

      <div class="listingMain">
        <section class="listingHero">
          <div>
            <h2>${escapeHtml(profile.companyName)}</h2>
            <p class="publisher">By ${escapeHtml(profile.domain)}</p>
            <p class="platformLine">${escapeHtml(getProfileCategory(profile))} Provider</p>
            <div class="detailLinks">
              ${[linkMarkup(profile.website, "Website"), linkMarkup(profile.linkedinUrl, "LinkedIn"), linkMarkup(profile.githubUrl, "GitHub")]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <p class="listingDescription">${escapeHtml(profile.description || "No description available.")}</p>
        </section>

        <section class="mediaStrip" aria-label="Profile preview">
          <div class="mediaCard">
            <div class="mediaPreview">${logoMarkup(profile, true)}</div>
            <p>Logo and profile identity</p>
          </div>
          <div class="mediaCard">
            <div class="mediaPreview sourcePreview">
              <strong>Source Checks</strong>
              <span>Website content, logo source, enrichment data, and GitHub support coverage</span>
            </div>
            <p>Evidence coverage and review notes</p>
          </div>
        </section>

        <nav class="detailTabs" aria-label="Profile sections">
          <button type="button" data-detail-tab="overview" class="${state.activeDetailTab === "overview" ? "active" : ""}">Overview</button>
          <button type="button" data-detail-tab="activity" class="${state.activeDetailTab === "activity" ? "active" : ""}">Recent Activity</button>
          <button type="button" data-detail-tab="quality" class="${state.activeDetailTab === "quality" ? "active" : ""}">Data Quality</button>
          <button type="button" data-detail-tab="evidence" class="${state.activeDetailTab === "evidence" ? "active" : ""}">Evidence Summary</button>
        </nav>

        <section data-detail-panel="overview" class="detailPanel ${state.activeDetailTab === "overview" ? "active" : ""}">
          <h3>Overview</h3>
          <div class="highlightGrid">
            <div class="highlightCard"><span>Country</span>${escapeHtml(profile.country || "Unknown")}</div>
            <div class="highlightCard"><span>Location</span>${escapeHtml(profile.location || "Unknown")}</div>
            <div class="highlightCard"><span>Domain</span>${escapeHtml(profile.domain)}</div>
          </div>

          <section class="section">
            <h3>Technologies</h3>
            <div class="chips">${chips(profile.technologies, "No technologies found", true)}</div>
          </section>

          <section class="section">
            <h3>Vendor Partnerships</h3>
            <div class="chips">${chips(profile.vendorPartnerships, "No explicit partnerships found", true)}</div>
          </section>
        </section>

        <section data-detail-panel="activity" class="detailPanel ${state.activeDetailTab === "activity" ? "active" : ""}">
          <h3>Recent Activity</h3>
          <div class="activity">${activityMarkup(profile)}</div>
        </section>

        <section data-detail-panel="quality" class="detailPanel ${state.activeDetailTab === "quality" ? "active" : ""}">
          <h3>Data Quality Notes</h3>
          <div class="notes">
            ${dataQualityMarkup(profile)}
          </div>
        </section>

        <section data-detail-panel="evidence" class="detailPanel ${state.activeDetailTab === "evidence" ? "active" : ""}">
          <h3>Evidence Summary</h3>
          ${evidenceSummaryMarkup(profile)}
        </section>
      </div>
    </div>
  `;

  elements.detailContent.querySelectorAll("[data-detail-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDetailTab = button.dataset.detailTab;
      renderDetail();
    });
  });

  elements.detailContent.querySelector(".backButton").addEventListener("click", () => {
    state.profileMode = false;
    state.activeCategory = null;
    document.body.classList.remove("profileMode");
    document.body.classList.remove("categoryMode");
    elements.detailContent.closest(".detail").hidden = true;
    elements.detailContent.innerHTML = "";
    state.selectedDomain = null;
    renderList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function resetFilters() {
  elements.searchInput.value = "";
  elements.filterSearchInput.value = "";
  elements.countryFilter.value = "";
  elements.serviceFilter.value = "";
  elements.technologyFilter.value = "";
  elements.partnerFilter.value = "";
  elements.confidenceFilter.value = "0";
  state.quickFilter = "all";
  state.profileMode = false;
  state.selectedDomain = null;
  state.activeCategory = null;
  document.body.classList.remove("profileMode");
  document.body.classList.remove("categoryMode");
  elements.detailContent.closest(".detail").hidden = true;
  elements.detailContent.innerHTML = "";
  applyFilters();
}

function setActivePage(page) {
  elements.searchHero.hidden = page !== "providers";
  elements.homePage.hidden = page !== "home";
  elements.adminPage.hidden = page !== "admin";
  elements.providersPage.hidden = page !== "providers";

  if (page === "admin") {
    refreshAdminState();
  }

  elements.navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.navTab === page);
  });
}

function adminToken() {
  return window.localStorage.getItem("rocketEngineersAdminToken");
}

function adminEmail() {
  return window.localStorage.getItem("rocketEngineersAdminEmail");
}

function setAdminSession(session) {
  window.localStorage.setItem("rocketEngineersAdminToken", session.accessToken);
  window.localStorage.setItem("rocketEngineersAdminEmail", session.email);
}

function clearAdminSession() {
  window.localStorage.removeItem("rocketEngineersAdminToken");
  window.localStorage.removeItem("rocketEngineersAdminEmail");
}

function renderAdminShell(configured = true) {
  const signedIn = Boolean(adminToken());

  elements.adminSetupNotice.hidden = configured;
  elements.adminLoginPanel.hidden = !configured || signedIn;
  elements.adminWorkspace.hidden = !configured || !signedIn;
  elements.adminSignedInAs.textContent = signedIn ? `Signed in as ${adminEmail()}` : "";
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${adminToken()}`,
    "Content-Type": "application/json",
  };
}

function adminItemMarkup(title, meta, status, body = "", action = "") {
  return `
    <article class="adminItem">
      <div class="adminItemHeader">
        <strong>${escapeHtml(title)}</strong>
        ${status ? `<span class="statusPill">${escapeHtml(status)}</span>` : ""}
      </div>
      ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
      ${action}
    </article>
  `;
}

function renderAdminLists() {
  elements.jobList.innerHTML =
    state.adminJobs.length === 0
      ? `<div class="emptyResults">No scrape jobs yet.</div>`
      : state.adminJobs
          .map((job) =>
            adminItemMarkup(
              job.company_name || job.domain || job.url,
              `${job.url} · ${job.created_at ? new Date(job.created_at).toLocaleString() : "No date"}`,
              job.status,
              job.error || ""
            )
          )
          .join("");

  elements.adminProviderList.innerHTML =
    state.adminProviders.length === 0
      ? `<div class="emptyResults">No database providers yet.</div>`
      : state.adminProviders
          .map((provider) => {
            const action =
              provider.status === "published"
                ? ""
                : `<button class="secondaryAction" type="button" data-publish-provider="${escapeHtml(provider.id || "")}">Publish</button>`;

            return adminItemMarkup(
              provider.companyName || provider.domain,
              provider.website || provider.domain,
              provider.status || "draft",
              `${(provider.services || []).slice(0, 3).join(", ") || "No services yet"}`,
              action
            );
          })
          .join("");

  elements.adminProviderList.querySelectorAll("[data-publish-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      await publishAdminProvider(button.dataset.publishProvider);
    });
  });
}

async function refreshAdminState() {
  try {
    const response = await fetch(
      "/api/admin-state",
      adminToken() ? { headers: adminHeaders() } : {}
    );
    const payload = await response.json();

    if (payload.configured === false) {
      renderAdminShell(false);
      return;
    }

    renderAdminShell(true);

    if (!adminToken()) {
      return;
    }

    if (!response.ok) {
      throw new Error(payload.error || "Failed to load admin state.");
    }

    renderAdminShell(payload.configured !== false);
    state.adminJobs = payload.jobs || [];
    state.adminProviders = payload.providers || [];
    renderAdminLists();
  } catch (error) {
    elements.adminLoginMessage.textContent = error.message;
    elements.adminLoginMessage.classList.add("error");
    clearAdminSession();
    renderAdminShell(true);
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  elements.adminLoginMessage.textContent = "";
  elements.adminLoginMessage.classList.remove("error");

  try {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: elements.adminEmail.value,
        password: elements.adminPassword.value,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Admin sign in failed.");
    }

    setAdminSession(payload);
    elements.adminPassword.value = "";
    await refreshAdminState();
  } catch (error) {
    elements.adminLoginMessage.textContent = error.message;
    elements.adminLoginMessage.classList.add("error");
  }
}

async function handleScrapeSubmit(event) {
  event.preventDefault();
  elements.scrapeMessage.textContent = "Queueing scrape job...";
  elements.scrapeMessage.classList.remove("error");

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

    elements.scrapeMessage.textContent = "Scrape job queued.";
    elements.scrapeUrl.value = "";
    elements.scrapeCompanyName.value = "";
    await refreshAdminState();
  } catch (error) {
    elements.scrapeMessage.textContent = error.message;
    elements.scrapeMessage.classList.add("error");
  }
}

async function publishAdminProvider(id) {
  if (!id) {
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

function currentUserEmail() {
  return window.localStorage.getItem("rocketEngineersUserEmail");
}

function renderAuthState() {
  const email = currentUserEmail();

  elements.authButton.textContent = email || "Sign Up";
  elements.authButton.title = email ? "Signed in" : "Sign up or sign in";
}

function openAuthModal() {
  elements.authModal.hidden = false;
  elements.authEmail.value = currentUserEmail() || DEMO_ACCOUNT.email;
  elements.authPassword.value = "";
  elements.authMessage.textContent = "";
  elements.authMessage.classList.remove("error");
  elements.authEmail.focus();
}

function closeAuthModal() {
  elements.authModal.hidden = true;
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const email = elements.authEmail.value.trim().toLowerCase();
  const password = elements.authPassword.value;

  if (email !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    elements.authMessage.textContent = "Email or password is incorrect.";
    elements.authMessage.classList.add("error");
    return;
  }

  window.localStorage.setItem("rocketEngineersUserEmail", DEMO_ACCOUNT.email);
  elements.authMessage.textContent = "Signed in.";
  elements.authMessage.classList.remove("error");
  renderAuthState();
  closeAuthModal();
}

function bindEvents() {
  [
    elements.searchInput,
    elements.filterSearchInput,
    elements.countryFilter,
    elements.serviceFilter,
    elements.technologyFilter,
    elements.partnerFilter,
    elements.confidenceFilter,
  ].forEach((element) => {
    element.addEventListener("input", applyFilters);
    element.addEventListener("change", applyFilters);
  });

  elements.resetButton.addEventListener("click", resetFilters);
  elements.adminLoginForm.addEventListener("submit", handleAdminLogin);
  elements.scrapeForm.addEventListener("submit", handleScrapeSubmit);
  elements.adminRefreshButton.addEventListener("click", refreshAdminState);
  elements.adminSignOutButton.addEventListener("click", () => {
    clearAdminSession();
    renderAdminShell(true);
  });
  elements.authButton.addEventListener("click", openAuthModal);
  elements.authCloseButton.addEventListener("click", closeAuthModal);
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.authModal.addEventListener("click", (event) => {
    if (event.target === elements.authModal) {
      closeAuthModal();
    }
  });

  elements.navTabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      setActivePage(tab.dataset.navTab);
    });
  });

  document.querySelectorAll(".categoryTile").forEach((button) => {
    button.addEventListener("click", () => {
      state.quickFilter = button.dataset.quickFilter || "all";
      state.profileMode = false;
      state.activeCategory = null;
      state.selectedDomain = null;
      document.body.classList.remove("profileMode");
      document.body.classList.remove("categoryMode");
      elements.detailContent.closest(".detail").hidden = true;
      elements.detailContent.innerHTML = "";
      renderQuickFilters();
      applyFilters();
    });
  });
}

async function loadProfiles() {
  let response = await fetch("/api/profiles");

  if (!response.ok) {
    response = await fetch("/profiles.json");
  }

  if (!response.ok) {
    throw new Error(`Failed to load profiles: ${response.status}`);
  }

  state.profiles = await response.json();

  if (!Array.isArray(state.profiles) || state.profiles.length === 0) {
    response = await fetch("/profiles.json");

    if (!response.ok) {
      throw new Error(`Failed to load static profiles: ${response.status}`);
    }

    state.profiles = await response.json();
  }

  state.filtered = state.profiles;
  state.selectedDomain = null;
  elements.status.textContent = `${state.profiles.length} loaded`;
  populateFilters();
  bindEvents();
  renderAuthState();
  renderQuickFilters();
  applyFilters();
}

loadProfiles().catch((error) => {
  elements.status.textContent = "Load failed";
  elements.detailContent.className = "detailContent empty";
  elements.detailContent.textContent = error.message;
});
