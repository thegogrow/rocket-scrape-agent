const state = {
  profiles: [],
  filtered: [],
  selectedDomain: null,
  profileMode: false,
  activeDetailTab: "overview",
  sortMode: "recommended",
  filters: {
    country: [],
    service: [],
    technology: [],
    partner: [],
    industry: [],
  },
  filterSearches: {
    country: "",
    service: "",
    technology: "",
    partner: "",
    industry: "",
  },
};

const elements = {
  status: document.querySelector("#status"),
  searchHero: document.querySelector(".searchHero"),
  homePage: document.querySelector("#homePage"),
  providersPage: document.querySelector("#providersPage"),
  navTabs: document.querySelectorAll("[data-nav-tab]"),
  searchInput: document.querySelector("#searchInput"),
  filterSearchInput: document.querySelector("#filterSearchInput"),
  filterDrawerButton: document.querySelector("#filterDrawerButton"),
  filterDrawerClose: document.querySelector("#filterDrawerClose"),
  countryFilter: document.querySelector("#countryFilter"),
  serviceFilter: document.querySelector("#serviceFilter"),
  technologyFilter: document.querySelector("#technologyFilter"),
  partnerFilter: document.querySelector("#partnerFilter"),
  industryFilter: document.querySelector("#industryFilter"),
  activeFilters: document.querySelector("#activeFilters"),
  resetButton: document.querySelector("#resetButton"),
  profileList: document.querySelector("#profileList"),
  detailContent: document.querySelector("#detailContent"),
};

const FILTER_DEFS = [
  {
    key: "country",
    label: "Country",
    container: elements.countryFilter,
    values(profile) {
      return [profile.companyLocation?.country || profile.country].filter(Boolean);
    },
  },
  {
    key: "service",
    label: "Service",
    container: elements.serviceFilter,
    values(profile) {
      return Array.isArray(profile.services) ? profile.services : [];
    },
  },
  {
    key: "technology",
    label: "Technology",
    container: elements.technologyFilter,
    values(profile) {
      return Array.isArray(profile.technologies) ? profile.technologies : [];
    },
  },
  {
    key: "partner",
    label: "Vendor Partner",
    container: elements.partnerFilter,
    values(profile) {
      return Array.isArray(profile.vendorPartnerships) ? profile.vendorPartnerships : [];
    },
  },
  {
    key: "industry",
    label: "Industries",
    container: elements.industryFilter,
    values(profile) {
      return getIndustries(profile);
    },
  },
];

const CATEGORY_RULES = [
  { name: "Commerce", match: ["commerce", "ecommerce", "retail", "shopify", "salesforce", "sap"] },
  { name: "Cloud Migration", match: ["cloud migration", "migration", "aws", "azure", "google cloud"] },
  { name: "DevOps", match: ["devops", "ci/cd", "platform engineering", "site reliability", "sre"] },
  { name: "Security", match: ["security", "compliance", "audit", "zero trust"] },
  { name: "Data & AI", match: ["data", "ai", "analytics", "machine learning", "intelligence"] },
  { name: "Managed Services", match: ["managed services", "service management", "operations", "appops"] },
  { name: "Software Engineering", match: ["software engineering", "application", "development", "engineering"] },
];

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

function logoUrlForProfile(profile) {
  const logoUrl = profile.logoUrl;

  if (
    logoUrl &&
    profile.domain &&
    SVG_LOGO_DOMAINS.has(profile.domain) &&
    String(logoUrl).startsWith(`/logos/${profile.domain}/`) &&
    String(logoUrl).endsWith("/logo.png")
  ) {
    return `/logos/${profile.domain}/logo.svg`;
  }

  return logoUrl;
}

function logoMarkup(profile, large = false) {
  const label = escapeHtml(profile.companyName || profile.domain);
  const fallback = escapeHtml(initials(profile));
  const className = large ? "logoBox logoLarge" : "logoBox";
  const logoUrl = logoUrlForProfile(profile);

  if (!logoUrl) {
    return `<div class="${className}" aria-label="${label}">${fallback}</div>`;
  }

  return `<div class="${className}"><img src="${escapeHtml(logoUrl)}" alt="${label} logo" onerror="this.parentElement.textContent='${fallback}'" /></div>`;
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

function chipButtons(values, type, emptyLabel = "None found", warn = false) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];

  if (list.length === 0) {
    return `<span class="chip ${warn ? "warn" : ""}">${escapeHtml(emptyLabel)}</span>`;
  }

  return list
    .map(
      (value) =>
        `<button class="chip chipButton" type="button" data-tag-type="${escapeHtml(type)}" data-tag-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`
    )
    .join("");
}

function limitedChipButtons(values, type, emptyLabel = "None found", warn = false) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];

  if (list.length === 0) {
    return `<div class="chips">${chips([], emptyLabel, warn)}</div>`;
  }

  return `
    <div class="chipDisclosure" data-chip-disclosure>
      <div class="chips chipDisclosureList" data-chip-list>
        ${list
          .map(
            (value) =>
              `<button class="chip chipButton" type="button" data-tag-type="${escapeHtml(type)}" data-tag-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`
          )
          .join("")}
      </div>
      <button class="chipMoreButton" type="button" data-chip-toggle aria-expanded="false" hidden>Show more</button>
    </div>
  `;
}

function fieldTitle(label, values) {
  const count = Array.isArray(values) ? values.filter(Boolean).length : 0;

  return `${escapeHtml(label)}${count > 0 ? ` <span>${count}</span>` : ""}`;
}

function getIndustries(profile) {
  const industries = Array.isArray(profile.industries) ? profile.industries.filter(Boolean) : [];

  if (industries.length > 0) {
    return industries;
  }

  return Array.isArray(profile.focusAreas) ? profile.focusAreas.filter(Boolean) : [];
}

function locationParts(profile) {
  if (profile.companyLocation && typeof profile.companyLocation === "object") {
    return {
      city: profile.companyLocation.city || null,
      country: profile.companyLocation.country || profile.country || null,
    };
  }

  if (profile.location && typeof profile.location === "object") {
    return {
      city: profile.location.city || profile.location.locality || null,
      country: profile.location.country || profile.country || null,
    };
  }

  const country = profile.country || null;
  const location = String(profile.location || "").trim();

  if (!location) {
    return { city: null, country };
  }

  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts.length > 1 ? parts.slice(0, -1).join(", ") : parts[0],
    country: country || (parts.length > 1 ? parts[parts.length - 1] : null),
  };
}

function locationMarkup(profile) {
  const location = locationParts(profile);
  const country = location.country ? `<span><strong>Country</strong>${escapeHtml(location.country)}</span>` : "";
  const city = location.city ? `<span><strong>City</strong>${escapeHtml(location.city)}</span>` : "";

  if (!country && !city) {
    return `<div class="locationObject mutedLocation" aria-label="Company location">Location not published</div>`;
  }

  return `
    <div class="locationObject" aria-label="Company location">
      ${country}
      ${city}
    </div>
  `;
}

function countFilterValues(filterDef) {
  const counts = new Map();

  state.profiles.forEach((profile) => {
    filterDef.values(profile).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  return counts;
}

function renderFilterOptions(filterDef) {
  const counts = countFilterValues(filterDef);
  const selected = new Set(state.filters[filterDef.key]);
  const search = state.filterSearches[filterDef.key].toLowerCase();
  const values = [...counts.keys()]
    .filter((value) => !search || value.toLowerCase().includes(search))
    .sort((left, right) => left.localeCompare(right));

  filterDef.container.innerHTML = values.length
    ? values
        .map((value) => {
          const inputId = `filter-${filterDef.key}-${value.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
          const checked = selected.has(value) ? " checked" : "";

          return `
            <label class="filterOption" for="${escapeHtml(inputId)}">
              <input id="${escapeHtml(inputId)}" type="checkbox" value="${escapeHtml(value)}" data-filter-option="${escapeHtml(filterDef.key)}"${checked} />
              <span>${escapeHtml(value)}</span>
              <strong>${counts.get(value)}</strong>
            </label>
          `;
        })
        .join("")
    : `<div class="filterOptionEmpty">No matching options.</div>`;
}

function populateFilters() {
  FILTER_DEFS.forEach(renderFilterOptions);
}

function valueMatchesText(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function listMatchesSelected(values, selected) {
  if (selected.length === 0) {
    return true;
  }

  return Array.isArray(values) && values.some((value) => selected.includes(String(value || "")));
}

function valueMatchesSelected(value, selected) {
  if (selected.length === 0) {
    return true;
  }

  return selected.includes(String(value || ""));
}

function profileSearchText(profile) {
  return [
    profile.companyName,
    profile.domain,
    profile.website,
    profile.companyLocation?.country,
    profile.companyLocation?.city,
    profile.description,
    profile.focusAreas,
    profile.industries,
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
  const countries = state.filters.country;
  const services = state.filters.service;
  const technologies = state.filters.technology;
  const partners = state.filters.partner;
  const industries = state.filters.industry;

  state.filtered = state.profiles.filter((profile) => {
      if (query && !profileSearchText(profile).includes(query)) return false;
      if (!valueMatchesSelected(profile.companyLocation?.country || profile.country, countries)) return false;
      if (!listMatchesSelected(profile.services, services)) return false;
      if (!listMatchesSelected(profile.technologies, technologies)) return false;
      if (!listMatchesSelected(profile.vendorPartnerships, partners)) return false;
      if (!listMatchesSelected(getIndustries(profile), industries)) return false;
      return true;
    });

  renderList();

  if (state.profileMode && !state.filtered.some((profile) => profile.domain === state.selectedDomain)) {
    state.selectedDomain = state.filtered[0]?.domain || null;
  }

  if (state.profileMode) {
    renderDetail();
  }

  renderActiveFilters();
}

function renderList() {
  const listProfiles = sortProfiles(state.filtered);

  if (listProfiles.length === 0) {
    elements.profileList.innerHTML = `<div class="emptyResults">No providers match the current filters.</div>`;
    return;
  }

  elements.profileList.innerHTML = `
    <div class="resultsToolbar">
      <div class="resultsHeader">
        <h2>${listProfiles.length} provider${listProfiles.length === 1 ? "" : "s"}</h2>
        <span>${resultSummaryText(listProfiles.length)}</span>
      </div>
      <label class="sortControl">
        <span>Sort</span>
        <select id="sortMode">
          <option value="recommended" ${state.sortMode === "recommended" ? "selected" : ""}>Recommended</option>
          <option value="name" ${state.sortMode === "name" ? "selected" : ""}>Name A-Z</option>
          <option value="country" ${state.sortMode === "country" ? "selected" : ""}>Country</option>
          <option value="verified" ${state.sortMode === "verified" ? "selected" : ""}>Verified first</option>
        </select>
      </label>
    </div>
    <div class="providerGrid">
      ${listProfiles.map(cardMarkup).join("")}
    </div>
  `;

  elements.profileList.querySelector("#sortMode").addEventListener("change", (event) => {
    state.sortMode = event.target.value;
    renderList();
  });
  bindProfileCards();
}

function resultSummaryText(count) {
  if (count === state.profiles.length) {
    return "Showing all providers";
  }

  return `${count} of ${state.profiles.length} match current filters`;
}

function sortProfiles(profiles) {
  const list = [...profiles];
  const byConfidence = (left, right) => (right.confidenceScore || 0) - (left.confidenceScore || 0);
  const byName = (left, right) => String(left.companyName || left.domain).localeCompare(String(right.companyName || right.domain));

  if (state.sortMode === "name") {
    return list.sort(byName);
  }

  if (state.sortMode === "country") {
    return list.sort((left, right) => {
      const leftLocation = locationParts(left);
      const rightLocation = locationParts(right);
      const leftKey = [leftLocation.country, leftLocation.city, left.companyName || left.domain].filter(Boolean).join(" ");
      const rightKey = [rightLocation.country, rightLocation.city, right.companyName || right.domain].filter(Boolean).join(" ");
      return leftKey.localeCompare(rightKey);
    });
  }

  if (state.sortMode === "verified") {
    return list.sort((left, right) => Number(Boolean(right.claimed)) - Number(Boolean(left.claimed)) || byConfidence(left, right) || byName(left, right));
  }

  return list.sort((left, right) => byConfidence(left, right) || byName(left, right));
}

function renderActiveFilters() {
  const activeFilters = FILTER_DEFS.flatMap((filterDef) =>
    state.filters[filterDef.key].map((value) => ({ ...filterDef, value }))
  );

  if (activeFilters.length === 0) {
    elements.activeFilters.hidden = true;
    elements.activeFilters.innerHTML = "";
    return;
  }

  elements.activeFilters.hidden = false;
  elements.activeFilters.innerHTML = `
    <span>Active filters</span>
    ${activeFilters
      .map(
        (filter) => `
          <button type="button" data-remove-filter="${escapeHtml(filter.key)}" data-filter-value="${escapeHtml(filter.value)}">
            ${escapeHtml(filter.label)}: ${escapeHtml(filter.value)} <span aria-hidden="true">×</span>
          </button>
        `
      )
      .join("")}
  `;
}

function cardMarkup(profile) {
  const active = profile.domain === state.selectedDomain ? " active" : "";
  const location = locationParts(profile);
  const services = profile.services.slice(0, 3);
  const industries = getIndustries(profile).slice(0, 2);
  const vendorCount = Array.isArray(profile.vendorPartnerships) ? profile.vendorPartnerships.length : 0;
  const tags = [...services.slice(0, 2), ...industries.slice(0, 2)];
  const description = profile.description || services.join(", ") || "Profile details available.";
  const verifiedBadge = profile.claimed ? `<span class="verifiedBadge" aria-label="Verified profile">✓ Verified</span>` : "";
  const locationText = [location.city, location.country].filter(Boolean).join(", ");

  return `
    <button class="profileCard${active}" type="button" data-domain="${escapeHtml(profile.domain)}">
      <span class="cardTop">
        ${logoMarkup(profile)}
        <span class="cardHeading">
          <span class="cardTitleRow"><span class="cardTitle">${escapeHtml(profile.companyName)}</span>${verifiedBadge}</span>
          <span class="cardMeta">${escapeHtml(locationText || profile.domain)}</span>
        </span>
      </span>
      <span class="cardText">${escapeHtml(description).slice(0, 155)}</span>
      <span class="cardFacts">
        <span>${escapeHtml(profile.domain)}</span>
        <span>${vendorCount} vendor partner${vendorCount === 1 ? "" : "s"}</span>
      </span>
      <span class="cardTags">${chips(tags, "No tags found")}</span>
      <span class="cardActions">
        <span>View profile</span>
        ${profile.website ? "<span>Website available</span>" : ""}
      </span>
    </button>
  `;
}

function bindProfileCards() {
  elements.profileList.querySelectorAll(".profileCard").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDomain = button.dataset.domain;
      state.activeDetailTab = "overview";
      state.profileMode = true;
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

function profileLinkSetMarkup(profile) {
  const links = [
    { label: "Website", url: profile.website },
    { label: "LinkedIn", url: profile.linkedinUrl },
    { label: "GitHub", url: profile.githubUrl },
  ];

  return links
    .map((link) =>
      link.url
        ? `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
        : `<span class="mutedLink">${escapeHtml(link.label)}</span>`
    )
    .join("");
}

function isAdminVisitor() {
  return Boolean(
    window.localStorage.getItem("rocketEngineersAdminToken") &&
      window.localStorage.getItem("rocketEngineersAdminEmail")
  );
}

function visibleDetailTabs(adminVisible) {
  return [
    { key: "overview", label: "Overview" },
    { key: "partnerships", label: "Partnerships" },
    ...(adminVisible
      ? [
          { key: "activity", label: "Recent Activity" },
          { key: "quality", label: "Data Quality" },
          { key: "outreach", label: "Outreach Status" },
        ]
      : []),
  ];
}

function detailTabsMarkup(adminVisible) {
  return visibleDetailTabs(adminVisible)
    .map(
      (tab) =>
        `<button type="button" data-detail-tab="${tab.key}" class="${state.activeDetailTab === tab.key ? "active" : ""}">${escapeHtml(tab.label)}</button>`
    )
    .join("");
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

function activityChannelItems(profile, channel) {
  const activity = Array.isArray(profile.recentActivity) ? profile.recentActivity : [];

  return activity.filter((item) => {
    const text = [item.sourceType, item.source, item.title].filter(Boolean).join(" ").toLowerCase();

    if (channel === "linkedin") {
      return text.includes("linkedin");
    }

    if (channel === "github") {
      return text.includes("github");
    }

    return /blog|article|news|press|webinar|podcast|publication|report|case[ _-]?study|whitepaper/.test(text);
  });
}

function activityChannelsMarkup(profile) {
  const channels = [
    { key: "linkedin", label: "Activity on LinkedIn" },
    { key: "blog", label: "Activity on Blog" },
    { key: "github", label: "Activity on GitHub" },
  ];

  return channels
    .map((channel) => {
      const items = activityChannelItems(profile, channel.key);
      const content =
        items.length > 0
          ? activityMarkup({ recentActivity: items })
          : `<div class="activityItem">No ${channel.label.toLowerCase()} found.</div>`;

      return `
        <section class="activityChannel">
          <h4>${escapeHtml(channel.label)}</h4>
          <div class="activity">${content}</div>
        </section>
      `;
    })
    .join("");
}

function caseStudyItems(profile) {
  const activity = Array.isArray(profile.recentActivity) ? profile.recentActivity : [];

  return activity.filter((item) =>
    /case[ _-]?study|success story|customer story/i.test([item.sourceType, item.title].filter(Boolean).join(" "))
  );
}

function editableEntryLink(entry, fallbackLabel) {
  const url = entry?.link || entry?.url || entry?.source || "";

  if (!url) {
    return "";
  }

  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(fallbackLabel)}</a>`;
}

function editableEntriesMarkup(entries, fallbackItems = []) {
  const structuredEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];

  if (structuredEntries.length > 0) {
    return structuredEntries
      .map((entry) => {
        if (typeof entry === "string") {
          return `<article class="editableEntry"><h4>${escapeHtml(entry)}</h4></article>`;
        }

        const title = entry.title || entry.name || "Untitled";
        const text = entry.shortText || entry.text || entry.summary || entry.description || "";

        return `
          <article class="editableEntry">
            <h4>${escapeHtml(title)}</h4>
            ${text ? `<p>${escapeHtml(text)}</p>` : ""}
            ${editableEntryLink(entry, "Open link")}
          </article>
        `;
      })
      .join("");
  }

  if (fallbackItems.length > 0) {
    return activityMarkup({ recentActivity: fallbackItems });
  }

  return "";
}

function successStoriesMarkup(profile) {
  return editableEntriesMarkup(
    profile.successStories,
    caseStudyItems(profile)
  );
}

function solutionsMarkup(profile) {
  return editableEntriesMarkup(profile.solutions);
}

function qualityClass(score) {
  const normalizedScore = Math.max(0, Math.min(100, Number.parseInt(score, 10) || 0));

  if (normalizedScore >= 80) {
    return "green";
  }

  if (normalizedScore >= 60) {
    return "orange";
  }

  return "red";
}

function evidenceStatusMarkup(label, available, quality = "red") {
  return `
    <div class="evidenceItem quality-${quality}">
      <span>${escapeHtml(label)}</span>
      <strong class="${available ? "available" : "missing"}">${available ? "Available" : "Missing"}</strong>
    </div>
  `;
}

function evidenceSummaryMarkup(profile) {
  const quality = qualityClass(profile.confidenceScore);

  return `
    <div class="evidenceGrid sourceQualityGrid">
      ${evidenceStatusMarkup("Website content first", Boolean(profile.files?.sourceBundle || profile.description), quality)}
      ${evidenceStatusMarkup("Logo source", Boolean(profile.logoUrl || profile.files?.logo), quality)}
      ${evidenceStatusMarkup("Company enrichment", Boolean(profile.files?.enrichment), quality)}
      ${evidenceStatusMarkup("GitHub support only", Boolean(profile.githubUrl || profile.files?.github), quality)}
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

function overviewPanelMarkup(profile, industries) {
  const successStories = successStoriesMarkup(profile);
  const solutions = solutionsMarkup(profile);

  return `
    <section data-detail-panel="overview" class="detailPanel ${state.activeDetailTab === "overview" ? "active" : ""}">
      <section class="section firstSection">
        <h3>Company Introduction</h3>
        <p class="description">${escapeHtml(profile.description || "No company introduction available.")}</p>
      </section>

      ${
        successStories
          ? `<section class="section">
              <h3>Success Stories</h3>
              <div class="editableEntryList">${successStories}</div>
            </section>`
          : ""
      }

      ${
        solutions
          ? `<section class="section">
              <h3>Solutions</h3>
              <div class="editableEntryList">${solutions}</div>
            </section>`
          : ""
      }
    </section>
  `;
}

function partnershipsPanelMarkup(profile) {
  return `
    <section data-detail-panel="partnerships" class="detailPanel ${state.activeDetailTab === "partnerships" ? "active" : ""}">
      <h3>Partnerships</h3>
      <div class="chips">${chipButtons(profile.vendorPartnerships, "vendor", "No explicit vendor partnerships found", true)}</div>
    </section>
  `;
}

function qualityPanelMarkup(profile) {
  const normalizedScore = Math.max(0, Math.min(100, Number.parseInt(profile.confidenceScore, 10) || 0));
  const quality = qualityClass(normalizedScore);

  return `
    <section data-detail-panel="quality" class="detailPanel ${state.activeDetailTab === "quality" ? "active" : ""}">
      <h3>Data Quality</h3>
      <div class="qualitySummary quality-${quality}">
        <div>
          <span>Scoring</span>
          ${starRatingMarkup(normalizedScore)}
        </div>
        <strong>${normalizedScore}%</strong>
      </div>

      <section class="section">
        <h3>Sources Checked</h3>
        ${evidenceSummaryMarkup(profile)}
      </section>

      <section class="section">
        <h3>Review Notes</h3>
        <div class="notes">${dataQualityMarkup(profile)}</div>
      </section>
    </section>
  `;
}

function renderDetail() {
  const profile = state.profiles.find((item) => item.domain === state.selectedDomain);
  const industries = getIndustries(profile || {});

  if (!profile) {
    state.profileMode = false;
    document.body.classList.remove("profileMode");
    elements.detailContent.closest(".detail").hidden = true;
    elements.detailContent.className = "detailContent empty";
    elements.detailContent.textContent = "";
    return;
  }

  const adminVisible = isAdminVisitor();
  const allowedTabs = visibleDetailTabs(adminVisible).map((tab) => tab.key);

  if (!allowedTabs.includes(state.activeDetailTab)) {
    state.activeDetailTab = "overview";
  }

  document.body.classList.add("profileMode");
  elements.detailContent.closest(".detail").hidden = false;
  elements.detailContent.className = "detailContent";
  elements.detailContent.innerHTML = `
    <button class="backButton" type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /><path d="M10 12h10" /></svg>
      Back to providers
    </button>
    <div class="listingDetail detailSingleColumn">
      <div class="listingMain">
        <section class="providerHeader providerHeaderFull" aria-label="Provider card header">
          <div class="providerHeaderIdentity">
            ${logoMarkup(profile, true)}
            <div>
              <div class="detailTitleRow">
                <h2>${escapeHtml(profile.companyName)}</h2>
                ${profile.claimed ? `<span class="verifiedBadge" aria-label="Verified profile">✓ Verified</span>` : ""}
              </div>
              <p class="publisher">By ${escapeHtml(profile.domain)}</p>
              <p class="platformLine">${escapeHtml(getProfileCategory(profile))} Provider</p>
            </div>
          </div>

          <div class="headerField">
            <h3>Company Location</h3>
            ${locationMarkup(profile)}
          </div>

          <div class="headerField">
            <h3>Links</h3>
            <div class="detailLinks linkSet">${profileLinkSetMarkup(profile)}</div>
          </div>

          <div class="headerField">
            <h3>${fieldTitle("Services", profile.services)}</h3>
            ${limitedChipButtons(profile.services, "service", "No services found")}
          </div>

          <div class="headerField">
            <h3>${fieldTitle("Technologies", profile.technologies)}</h3>
            ${limitedChipButtons(profile.technologies, "technology", "No technologies found", true)}
          </div>

          <div class="headerField">
            <h3>${fieldTitle("Industries", industries)}</h3>
            ${limitedChipButtons(industries, "industry", "No industries found", true)}
          </div>

          <div class="headerField">
            <h3>${fieldTitle("Vendor Programs", profile.vendorPartnerships)}</h3>
            ${limitedChipButtons(profile.vendorPartnerships, "vendor", "No explicit vendor programs found", true)}
          </div>
        </section>

        <nav class="detailTabs" aria-label="Profile sections">
          ${detailTabsMarkup(adminVisible)}
        </nav>

        ${overviewPanelMarkup(profile, industries)}
        ${partnershipsPanelMarkup(profile)}
        ${
          adminVisible
            ? `
              <section data-detail-panel="activity" class="detailPanel ${state.activeDetailTab === "activity" ? "active" : ""}">
                <h3>Recent Activity</h3>
                ${activityChannelsMarkup(profile)}
              </section>
              ${qualityPanelMarkup(profile)}
              <section data-detail-panel="outreach" class="detailPanel ${state.activeDetailTab === "outreach" ? "active" : ""}">
                <h3>Outreach Status</h3>
                <div class="noteItem">TBD.</div>
              </section>
            `
            : ""
        }
      </div>
    </div>
  `;

  elements.detailContent.querySelectorAll("[data-detail-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDetailTab = button.dataset.detailTab;
      renderDetail();
    });
  });

  elements.detailContent.querySelectorAll("[data-tag-type]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTagFilter(button.dataset.tagType, button.dataset.tagValue);
    });
  });

  initializeChipDisclosures();

  elements.detailContent.querySelector(".backButton").addEventListener("click", () => {
    state.profileMode = false;
    document.body.classList.remove("profileMode");
    elements.detailContent.closest(".detail").hidden = true;
    elements.detailContent.innerHTML = "";
    state.selectedDomain = null;
    renderList();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initializeChipDisclosures() {
  elements.detailContent.querySelectorAll("[data-chip-disclosure]").forEach((disclosure) => {
    const list = disclosure.querySelector("[data-chip-list]");
    const button = disclosure.querySelector("[data-chip-toggle]");
    const chipRows = [...list.querySelectorAll(".chipButton")].reduce((rows, chip) => {
      const row = Math.round(chip.offsetTop - list.offsetTop);

      if (!rows.includes(row)) {
        rows.push(row);
      }

      return rows;
    }, []);
    const allowedRows = chipRows.slice(0, 3);
    const hiddenCount = [...list.querySelectorAll(".chipButton")].filter(
      (chip) => !allowedRows.includes(Math.round(chip.offsetTop - list.offsetTop))
    ).length;

    if (hiddenCount === 0) {
      button.hidden = true;
      list.style.removeProperty("--chip-collapsed-height");
      return;
    }

    const lastVisibleRow = allowedRows[allowedRows.length - 1] || 0;
    const lastVisibleChip = [...list.querySelectorAll(".chipButton")]
      .filter((chip) => Math.round(chip.offsetTop - list.offsetTop) === lastVisibleRow)
      .at(-1);
    const collapsedHeight = lastVisibleChip
      ? (lastVisibleChip.offsetTop - list.offsetTop) + lastVisibleChip.offsetHeight
      : 0;

    list.style.setProperty("--chip-collapsed-height", `${collapsedHeight}px`);
    button.hidden = false;
    button.dataset.moreLabel = `+${hiddenCount} more`;
    button.dataset.lessLabel = "Show less";
    button.textContent = button.dataset.moreLabel;

    button.addEventListener("click", () => {
      const expanded = disclosure.classList.toggle("isExpanded");

      button.textContent = expanded ? button.dataset.lessLabel : button.dataset.moreLabel;
      button.setAttribute("aria-expanded", String(expanded));
    });
  });
}

function clearFilterInputs() {
  elements.searchInput.value = "";
  elements.filterSearchInput.value = "";
  Object.keys(state.filters).forEach((key) => {
    state.filters[key] = [];
  });
  Object.keys(state.filterSearches).forEach((key) => {
    state.filterSearches[key] = "";
  });
  document.querySelectorAll("[data-filter-search]").forEach((input) => {
    input.value = "";
  });
  populateFilters();
}

function exitProfileMode() {
  state.profileMode = false;
  state.selectedDomain = null;
  document.body.classList.remove("profileMode");
  elements.detailContent.closest(".detail").hidden = true;
  elements.detailContent.innerHTML = "";
}

function filterDefForKey(key) {
  return FILTER_DEFS.find((filterDef) => filterDef.key === key);
}

function selectOnly(filterKey, value) {
  state.filters[filterKey] = [value];
  renderFilterOptions(filterDefForKey(filterKey));
}

function removeFilterValue(filterKey, value) {
  state.filters[filterKey] = state.filters[filterKey].filter((item) => item !== value);
  renderFilterOptions(filterDefForKey(filterKey));
}

function applyTagFilter(type, value) {
  if (!value) {
    return;
  }

  clearFilterInputs();
  if (type === "service") {
    selectOnly("service", value);
  } else if (type === "technology") {
    selectOnly("technology", value);
  } else if (type === "vendor") {
    selectOnly("partner", value);
  } else if (type === "industry") {
    selectOnly("industry", value);
  }

  exitProfileMode();
  applyFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFilters() {
  clearFilterInputs();
  exitProfileMode();
  applyFilters();
}

function setActivePage(page) {
  const requestedPage = page === "home" ? "home" : "providers";

  elements.searchHero.hidden = requestedPage !== "providers";
  elements.homePage.hidden = requestedPage !== "home";
  elements.providersPage.hidden = requestedPage !== "providers";

  elements.navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.navTab === requestedPage);
  });
}

function bindEvents() {
  [
    elements.searchInput,
    elements.filterSearchInput,
  ].forEach((element) => {
    element.addEventListener("input", applyFilters);
    element.addEventListener("change", applyFilters);
  });

  FILTER_DEFS.forEach((filterDef) => {
    filterDef.container.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-filter-option]");

      if (!checkbox) {
        return;
      }

      if (checkbox.checked) {
        state.filters[filterDef.key] = [...new Set([...state.filters[filterDef.key], checkbox.value])];
      } else {
        state.filters[filterDef.key] = state.filters[filterDef.key].filter((value) => value !== checkbox.value);
      }

      applyFilters();
    });
  });

  document.querySelectorAll("[data-filter-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.filterSearch;
      state.filterSearches[key] = input.value.trim();
      renderFilterOptions(filterDefForKey(key));
    });
  });

  document.querySelectorAll("[data-clear-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.clearFilter;
      state.filters[key] = [];
      renderFilterOptions(filterDefForKey(key));
      applyFilters();
    });
  });

  document.querySelectorAll("[data-toggle-filter-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".filterGroup");
      const collapsed = !group.classList.toggle("isCollapsed");
      button.setAttribute("aria-expanded", String(collapsed));
    });
  });

  elements.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");

    if (!button) {
      return;
    }

    removeFilterValue(button.dataset.removeFilter, button.dataset.filterValue);
    applyFilters();
  });

  elements.resetButton.addEventListener("click", resetFilters);

  elements.filterDrawerButton.addEventListener("click", () => {
    document.body.classList.add("filtersOpen");
    elements.filterDrawerButton.setAttribute("aria-expanded", "true");
  });

  elements.filterDrawerClose.addEventListener("click", closeFilterDrawer);

  elements.navTabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      setActivePage(tab.dataset.navTab);
    });
  });

}

function closeFilterDrawer() {
  document.body.classList.remove("filtersOpen");
  elements.filterDrawerButton.setAttribute("aria-expanded", "false");
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
  applyFilters();

  const requestedProvider = new URLSearchParams(window.location.search).get("provider");

  if (requestedProvider && state.profiles.some((profile) => profile.domain === requestedProvider)) {
    state.selectedDomain = requestedProvider;
    state.activeDetailTab = "overview";
    state.profileMode = true;
    renderDetail();
  }
}

loadProfiles().catch((error) => {
  elements.status.textContent = "Load failed";
  elements.detailContent.className = "detailContent empty";
  elements.detailContent.textContent = error.message;
});
