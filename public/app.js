const state = {
  profiles: [],
  tags: [],
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
  storiesPage: document.querySelector("#storiesPage"),
  eventsPage: document.querySelector("#eventsPage"),
  signalsPage: document.querySelector("#signalsPage"),
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

const STATIC_STORIES = [
  {
    title: "Modernising energy trading platforms with Kubernetes and GitOps on Azure",
    vertical: "Energy",
    size: "700",
    location: "CH",
    provider: "VSHN AG",
    domain: "vshn.ch",
    focus: ["CLD", "PLT"],
    result: "15x more frequent releases",
  },
  {
    title: "Scaling a regulated fintech from 2M to 6M users",
    vertical: "Fintech",
    size: "200+",
    location: "CH",
    provider: "Puzzle ITC",
    domain: "puzzle.ch",
    focus: ["CLD", "SEC"],
    result: "Zero downtime during migration",
  },
  {
    title: "From API calls to business answers: the strategic lift of an AI-native approach",
    vertical: "Logistics",
    size: "10-50",
    location: "DE",
    provider: "Appvia",
    domain: "appvia.io",
    focus: ["AI", "PLT"],
    result: "Internal platform launched in 8 weeks",
  },
];

const STATIC_EVENTS = [
  { day: "14", month: "JUL", type: "Webinar", title: "Zero Trust in practice - securing hybrid cloud estates", provider: "Adfinis", time: "11:00-12:00 CET", location: "Online" },
  { day: "22", month: "JUL", type: "In-person", title: "Platform engineering meetup Bern", provider: "acend gmbh", time: "17:30-21:00", location: "Bern, CH" },
  { day: "27", month: "AUG", type: "In-person", title: "Kubernetes community day Zurich", provider: "VSHN AG", time: "09:00-18:00", location: "Zurich, CH" },
];

const STATIC_SIGNALS = [
  { day: "07", month: "JUL", type: "Hiring", company: "Helvetia Insurance", headline: "Posted 9 AI / ML engineering roles in the last 30 days", source: "Job listings - LinkedIn, jobs.ch", match: "Matches AI & Data" },
  { day: "05", month: "JUL", type: "Leadership", company: "Migros Group", headline: "Appointed a new Head of Infrastructure starting September", source: "Company announcement", match: "Warm intro window" },
  { day: "03", month: "JUL", type: "Tender", company: "Canton of Vaud", headline: "Public tender: sovereign cloud platform for cantonal services", source: "simap.ch - deadline 15 Aug", match: "Matches Digital Sovereignty" },
  { day: "01", month: "JUL", type: "Project", company: "BKW Energie", headline: "Announced group-wide platform modernisation programme", source: "Press release + earnings call", match: "Modernisation budget confirmed" },
];

const FILTER_DEFS = [
  {
    key: "country",
    label: "Country",
    container: elements.countryFilter,
    values(profile) {
      return profile.filterBuckets?.countries || [normalizeCountryName(profile.companyLocation?.country || profile.country)].filter(Boolean);
    },
  },
  {
    key: "service",
    label: "Service",
    tagCategory: "services",
    container: elements.serviceFilter,
    values(profile) {
      return profile.filterBuckets?.services || normalizeServices(profile.services);
    },
  },
  {
    key: "technology",
    label: "Technology",
    tagCategory: "technologies",
    container: elements.technologyFilter,
    values(profile) {
      return profile.filterBuckets?.technologies || normalizeTechnologies(profile.technologies);
    },
  },
  {
    key: "partner",
    label: "Partnerships",
    tagCategory: "vendor_partnerships",
    container: elements.partnerFilter,
    values(profile) {
      return profile.filterBuckets?.partnerships || normalizePartnerships(profile.vendorPartnerships);
    },
  },
  {
    key: "industry",
    label: "Industries",
    tagCategory: "industries",
    container: elements.industryFilter,
    values(profile) {
      return profile.filterBuckets?.industries || getIndustries(profile);
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

const PUBLIC_PROFILE_STATUSES = new Set([
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
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

const SERVICE_BUCKET_RULES = [
  { name: "Cloud Migration & Modernization", match: ["cloud migration", "migration", "modernization", "modernisation", "modernize", "legacy modernization", "it modernization"] },
  { name: "Cloud Services", match: ["amazon", "aws", "azure", "microsoft cloud", "google cloud", "gcp", "cloud services", "cloud solutions", "cloud platform"] },
  { name: "Managed Services", match: ["managed services", "managed service", "application management", "service management", "operations", "managed kubernetes"] },
  { name: "Software Engineering", match: ["software engineering", "software development", "custom software", "application development", "web development", "app development"] },
  { name: "Platform Engineering", match: ["platform engineering", "internal developer platform", "developer platform", "platform"] },
  { name: "DevOps & Automation", match: ["devops", "devsecops", "automation", "infrastructure automation", "infrastructure as code", "ci/cd", "cicd", "gitops"] },
  { name: "Cybersecurity", match: ["cybersecurity", "cyber security", "security", "it security", "cloud security", "zero trust"] },
  { name: "Data & AI", match: ["data", "analytics", "artificial intelligence", "ai", "machine learning", "ml", "genai", "generative ai"] },
  { name: "Business Applications", match: ["sap", "salesforce", "servicenow", "microsoft 365", "dynamics 365", "power bi", "workday"] },
  { name: "Observability & Reliability", match: ["observability", "monitoring", "sre", "site reliability", "datadog", "new relic", "prometheus", "grafana"] },
  { name: "Testing & QA", match: ["test automation", "testing", "qa", "quality assurance"] },
  { name: "IoT & Edge", match: ["iot", "internet of things", "edge"] },
  { name: "UX/UI & Product Design", match: ["ux", "ui", "ux/ui", "product design", "customer experience"] },
  { name: "Mobile Development", match: ["mobile development", "mobile app", "ios", "android"] },
  { name: "Cost Optimization", match: ["cost optimization", "cost optimisation", "finops"] },
  { name: "Digital Sovereignty", match: ["digital sovereignty", "sovereign cloud", "sovereignty"] },
  { name: "Project Management", match: ["project management", "program management", "delivery management"] },
  { name: "Support & Operations", match: ["support", "operations support", "managed support"] },
  { name: "Process Automation", match: ["process automation", "workflow automation"] },
  { name: "Sustainability", match: ["sustainability", "green it", "carbon"] },
  { name: "IT Consulting", match: ["consulting", "it consulting", "business consulting", "strategy", "advisory"] },
  { name: "Application Modernization", match: ["application modernization", "application modernisation", "app modernization", "app modernisation"] },
  { name: "System Integration", match: ["system integration", "systems integration", "integration"] },
  { name: "Training & Enablement", match: ["training", "enablement", "workshop", "coaching"] },
  { name: "Digital Transformation", match: ["digital transformation", "digital workplace", "transformation"] },
];

const TECHNOLOGY_BUCKET_RULES = [
  { name: "AWS", match: ["amazon", "aws", "amazon web services", "amazon eks", "eks", "lambda", "cloudformation"] },
  { name: "Microsoft Azure", match: ["azure", "microsoft azure", "aks", "azure kubernetes", "microsoft fabric"] },
  { name: "Google Cloud", match: ["google cloud", "gcp", "google cloud platform", "gke"] },
  { name: "Kubernetes", match: ["kubernetes", "k8s", "openshift", "open shift", "helm", "cilium", "service mesh"] },
  { name: "Artificial Intelligence", match: ["artificial intelligence", "ai", "genai", "generative ai", "machine learning", "ml", "mlops", "llm"] },
  { name: "DevOps & CI/CD", match: ["devops", "ci/cd", "cicd", "gitops", "jenkins", "gitlab ci", "github actions"] },
  { name: "Terraform", match: ["terraform", "hashicorp terraform"] },
  { name: "Docker", match: ["docker", "containers", "containerization", "containerisation"] },
  { name: "Linux", match: ["linux", "ubuntu", "debian", "red hat enterprise linux", "rhel"] },
  { name: "SAP", match: ["sap", "s/4hana", "s4hana"] },
  { name: "Salesforce", match: ["salesforce"] },
  { name: "ServiceNow", match: ["servicenow"] },
  { name: "Databricks", match: ["databricks"] },
  { name: "Snowflake", match: ["snowflake"] },
  { name: "PostgreSQL", match: ["postgresql", "postgres"] },
  { name: "Power BI", match: ["power bi", "powerbi"] },
  { name: "Microsoft 365", match: ["microsoft 365", "office 365", "m365"] },
  { name: "OpenStack", match: ["openstack", "open stack"] },
  { name: "Java", match: ["java"] },
  { name: "Python", match: ["python"] },
  { name: "Go", match: ["go", "golang"] },
  { name: "Scala", match: ["scala"] },
  { name: "TypeScript", match: ["typescript", "type script"] },
  { name: "JavaScript", match: ["javascript", "node.js", "nodejs", "node"] },
  { name: "React", match: ["react", "react.js", "reactjs"] },
  { name: "Angular", match: ["angular"] },
  { name: "Prometheus", match: ["prometheus"] },
  { name: "Security", match: ["security", "cybersecurity", "zero trust", "iam"] },
  { name: "IoT", match: ["iot", "internet of things"] },
  { name: "Ansible", match: ["ansible", "red hat ansible"] },
  { name: "GitLab", match: ["gitlab", "gitlab ci"] },
  { name: "GitHub", match: ["github", "github actions"] },
  { name: "OpenAI", match: ["openai", "chatgpt"] },
  { name: "Anthropic", match: ["anthropic", "claude", "claude code"] },
  { name: "Observability", match: ["grafana", "datadog", "new relic", "observability"] },
  { name: "Apache Kafka", match: ["apache kafka", "kafka"] },
  { name: "MySQL", match: ["mysql"] },
  { name: "Oracle", match: ["oracle"] },
  { name: "Cloudflare", match: ["cloudflare"] },
  { name: "VMware", match: ["vmware"] },
  { name: ".NET", match: [".net", "dotnet"] },
  { name: "PHP", match: ["php"] },
  { name: "Rust", match: ["rust"] },
  { name: "Argo CD", match: ["argocd", "argo cd"] },
  { name: "Puppet", match: ["puppet"] },
  { name: "Keycloak", match: ["keycloak"] },
  { name: "Ceph", match: ["ceph"] },
  { name: "KubeVirt", match: ["kubevirt"] },
  { name: "Open Source", match: ["open source", "oss"] },
  { name: "Microservices", match: ["microservices"] },
  { name: "Secrets Management", match: ["openbao", "vault", "secrets management"] },
];

const PARTNERSHIP_BUCKET_RULES = [
  { name: "AWS", match: ["amazon", "aws", "amazon web services"] },
  { name: "Microsoft", match: ["microsoft", "azure"] },
  { name: "Google Cloud", match: ["google cloud", "google cloud platform", "gcp"] },
  { name: "Kubernetes / CNCF", match: ["kubernetes", "cncf", "cloud native computing foundation"] },
  { name: "Salesforce", match: ["salesforce"] },
  { name: "SAP", match: ["sap"] },
  { name: "Red Hat", match: ["red hat", "redhat"] },
  { name: "Databricks", match: ["databricks"] },
  { name: "Snowflake", match: ["snowflake"] },
  { name: "ServiceNow", match: ["servicenow"] },
  { name: "Atlassian", match: ["atlassian"] },
  { name: "GitHub", match: ["github"] },
  { name: "NVIDIA", match: ["nvidia"] },
  { name: "Adobe", match: ["adobe"] },
  { name: "Oracle", match: ["oracle"] },
  { name: "Anthropic", match: ["anthropic", "claude"] },
  { name: "dbt", match: ["dbt"] },
  { name: "HashiCorp", match: ["hashicorp"] },
  { name: "OpenAI", match: ["openai"] },
  { name: "Cisco", match: ["cisco"] },
  { name: "Dell Technologies", match: ["dell"] },
  { name: "HP", match: ["hp", "hewlett packard"] },
  { name: "Lenovo", match: ["lenovo"] },
  { name: "SUSE", match: ["suse", "rancher"] },
  { name: "Linux Foundation", match: ["linux foundation", "lpi"] },
  { name: "Palo Alto Networks", match: ["palo alto"] },
  { name: "NetApp", match: ["netapp"] },
  { name: "CrowdStrike", match: ["crowdstrike"] },
  { name: "New Relic", match: ["new relic"] },
  { name: "Nutanix", match: ["nutanix"] },
  { name: "Rubrik", match: ["rubrik"] },
  { name: "Workday", match: ["workday"] },
  { name: "Harness", match: ["harness"] },
  { name: "Monday.com", match: ["monday.com", "monday"] },
  { name: "IONOS", match: ["ionos"] },
];

const COUNTRY_BUCKET_RULES = [
  { name: "United States", match: ["united states", "usa", "u.s.", "us"] },
  { name: "United Kingdom", match: ["united kingdom", "uk", "u.k.", "great britain", "england"] },
  { name: "Switzerland", match: ["switzerland", "swiss", "schweiz", "suisse"] },
  { name: "Germany", match: ["germany", "deutschland"] },
  { name: "Netherlands", match: ["netherlands", "the netherlands", "holland"] },
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
  return profile.logoUrl;
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
        <button class="chip chipMoreButton" type="button" data-chip-toggle aria-expanded="false" hidden>Show more</button>
      </div>
    </div>
  `;
}

function fieldTitle(label, values) {
  const count = Array.isArray(values) ? values.filter(Boolean).length : 0;

  return `${escapeHtml(label)}${count > 0 ? ` <span>${count}</span>` : ""}`;
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bucketMatch(text, keyword) {
  const normalizedText = String(text || "").toLowerCase();
  const normalizedKeyword = String(keyword || "").toLowerCase();
  const compactText = normalizedText.replace(/[^a-z0-9]+/g, "");
  const compactKeyword = normalizedKeyword.replace(/[^a-z0-9]+/g, "");

  if (!normalizedText || !normalizedKeyword) {
    return false;
  }

  if (compactText === compactKeyword) {
    return true;
  }

  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`, "i").test(normalizedText);
}

function normalizeBucketName(value, rules) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const rule = rules.find((item) => item.match.some((keyword) => bucketMatch(text, keyword)));

  return rule?.name || text;
}

function normalizeBucketList(values, rules, maxItems = 8, fallbackName = null) {
  return uniqueList(values)
    .map((value) => {
      const text = String(value || "").trim();
      const rule = rules.find((item) => item.match.some((keyword) => bucketMatch(text, keyword)));
      const normalized = rule?.name || text;

      return !rule && fallbackName ? fallbackName : normalized;
    })
    .filter(Boolean)
    .reduce((items, value) => {
      if (!items.some((item) => item.toLowerCase() === value.toLowerCase())) {
        items.push(value);
      }

      return items;
    }, [])
    .slice(0, maxItems);
}

function normalizeServices(values) {
  return normalizeBucketList(values, SERVICE_BUCKET_RULES, 100, "Other Services");
}

function normalizeTechnologies(values) {
  return normalizeBucketList(values, TECHNOLOGY_BUCKET_RULES, 100, "Other Technologies");
}

function normalizePartnerships(values) {
  return normalizeBucketList(values, PARTNERSHIP_BUCKET_RULES, 100, "Other Partnerships");
}

function normalizeCountryName(value) {
  return normalizeBucketName(value, COUNTRY_BUCKET_RULES);
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

function normalizeLifecycleStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (!value || value === "published") return "approved";
  if (value === "draft" || value === "needs_review") return "scraped";
  if (value === "archived") return "removed";

  return value;
}

function isPublicProfile(profile = {}) {
  return PUBLIC_PROFILE_STATUSES.has(normalizeLifecycleStatus(profile.status));
}

function publicProfilesFromPayload(payload) {
  return Array.isArray(payload) ? payload.filter(isPublicProfile) : [];
}

function getIndustries(profile) {
  return normalizeIndustryList(profile.industries, profile.focusAreas);
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
  const inferredCountry = country || (parts.length > 1 ? parts[parts.length - 1] : null);
  const city = parts.length > 1
    ? parts.slice(0, -1).join(", ")
    : parts[0] && parts[0].toLowerCase() !== String(inferredCountry || "").toLowerCase()
      ? parts[0]
      : null;

  return {
    city,
    country: inferredCountry,
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

function publicTagsFromPayload(payload) {
  return (Array.isArray(payload) ? payload : [])
    .filter((tag) => tag?.status === "approved")
    .map((tag) => ({
      category: String(tag.category || "").trim(),
      name: String(tag.name || "").trim(),
      status: tag.status,
    }))
    .filter((tag) => tag.category && tag.name);
}

function approvedFilterTagValues(filterDef) {
  if (!filterDef.tagCategory) {
    return [];
  }

  const seen = new Set();

  return state.tags
    .filter((tag) => tag.category === filterDef.tagCategory && tag.status === "approved")
    .map((tag) => tag.name)
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.localeCompare(right));
}

function filterOptionValues(filterDef, counts, selected) {
  const approvedValues = approvedFilterTagValues(filterDef);

  if (approvedValues.length === 0) {
    return [...counts.keys()].sort((left, right) => left.localeCompare(right));
  }

  return approvedValues.filter((value) => counts.has(value) || selected.has(value));
}

function renderFilterOptions(filterDef) {
  const counts = countFilterValues(filterDef);
  const selected = new Set(state.filters[filterDef.key]);
  const search = state.filterSearches[filterDef.key].toLowerCase();
  const values = filterOptionValues(filterDef, counts, selected)
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
              <strong>${counts.get(value) || 0}</strong>
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

function valuesForFilterKey(profile, key) {
  const filterDef = filterDefForKey(key);

  return filterDef ? filterDef.values(profile) : [];
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
      if (!listMatchesSelected(valuesForFilterKey(profile, "country"), countries)) return false;
      if (!listMatchesSelected(valuesForFilterKey(profile, "service"), services)) return false;
      if (!listMatchesSelected(valuesForFilterKey(profile, "technology"), technologies)) return false;
      if (!listMatchesSelected(valuesForFilterKey(profile, "partner"), partners)) return false;
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
        <h2>Provider index<span>.</span></h2>
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
    <div class="providerGrid providerIndexRows">
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
  const services = normalizeServices(profile.services).slice(0, 3);
  const industries = getIndustries(profile).slice(0, 2);
  const technologies = normalizeTechnologies(profile.technologies).slice(0, 3);
  const tags = [...services.slice(0, 2), ...technologies.slice(0, 2)];
  const description = profile.description || services.join(", ") || "Profile details available.";
  const verifiedBadge = profile.claimed ? `<span class="verifiedBadge" aria-label="Verified profile">Verified</span>` : "";
  const locationText = [location.city, location.country].filter(Boolean).join(", ");
  const partnerCount = normalizePartnerships(profile.vendorPartnerships).filter((value) => value !== "Other Partnerships").length;
  const score = Math.max(0, Math.min(100, Number.parseInt(profile.confidenceScore, 10) || 0));

  return `
    <button class="profileCard${active}" type="button" data-domain="${escapeHtml(profile.domain)}">
      <span class="cardTop">
        ${logoMarkup(profile)}
        <span class="cardHeading">
          <span class="cardTitleRow"><span class="cardTitle">${escapeHtml(profile.companyName)}</span>${verifiedBadge}</span>
          <span class="cardMeta">${escapeHtml(locationText || profile.domain)}</span>
        </span>
      </span>
      <span class="cardText">${escapeHtml(description).slice(0, 180)}</span>
      <span class="cardTags">${chips(tags, "No tags found")}</span>
      <span class="cardStats">
        <span><strong>${partnerCount}</strong> partners</span>
        <span><strong>${score}%</strong> evidence</span>
        <span>${industries.map(escapeHtml).join(" / ") || "Software & Technology"}</span>
      </span>
    </button>
  `;
}

function bindProfileCards() {
  elements.profileList.querySelectorAll(".profileCard").forEach((button) => {
    button.addEventListener("click", () => {
      openProviderDetail(button.dataset.domain);
    });
  });
}

function providerDetailUrl(domain) {
  const url = new URL(window.location.href);
  url.searchParams.set("provider", domain);
  url.hash = "";

  return `${url.pathname}${url.search}${url.hash}`;
}

function providerListUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("provider");
  url.hash = "";

  return `${url.pathname}${url.search}${url.hash}`;
}

function openProviderDetail(domain, options = {}) {
  const { pushHistory = true, scroll = true } = options;

  if (!domain || !state.profiles.some((profile) => profile.domain === domain)) {
    return;
  }

  state.selectedDomain = domain;
  state.activeDetailTab = "overview";
  state.profileMode = true;

  if (pushHistory) {
    window.history.pushState({ provider: domain }, "", providerDetailUrl(domain));
  }

  renderDetail();

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function closeProviderDetail(options = {}) {
  const { pushHistory = false, scroll = true } = options;

  state.profileMode = false;
  document.body.classList.remove("profileMode");
  elements.detailContent.closest(".detail").hidden = true;
  elements.detailContent.innerHTML = "";
  state.selectedDomain = null;

  if (pushHistory) {
    window.history.pushState({ provider: null }, "", providerListUrl());
  }

  renderList();

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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

function providerLocationText(profile) {
  const location = locationParts(profile);
  return [location.city, location.country].filter(Boolean).join(", ") || "Location not published";
}

function providerFocusCodes(profile) {
  const text = [
    profile.services,
    profile.technologies,
    profile.focusAreas,
    profile.description,
  ].flat(2).filter(Boolean).join(" ").toLowerCase();
  const codes = [];

  if (/cloud|aws|azure|gcp|kubernetes|k8s|platform/.test(text)) codes.push(["CLD", "Cloud"]);
  if (/platform|developer|devops|gitops|ci\/cd|sre/.test(text)) codes.push(["PLT", "Platform Engineering"]);
  if (/security|zero trust|compliance|cyber/.test(text)) codes.push(["SEC", "Security"]);
  if (/\bai\b|data|machine learning|analytics|mlops/.test(text)) codes.push(["AI", "AI & Data"]);

  return codes.length ? codes.slice(0, 3) : [["ENG", "Engineering"]];
}

function providerActionMarkup(profile) {
  const website = profile.website || (profile.domain ? `https://${profile.domain}` : "");
  const contactHref = `mailto:hello@rocketengineers.co?subject=${encodeURIComponent(`Introduction to ${profile.companyName || profile.domain}`)}`;

  return `
    <div class="providerActions">
      <a class="providerPrimaryAction" href="${escapeHtml(contactHref)}">Contact provider</a>
      ${website ? `<a class="providerSecondaryAction" href="${escapeHtml(website)}" target="_blank" rel="noreferrer">Visit ${escapeHtml(profile.domain || "website")} -></a>` : ""}
    </div>
  `;
}

function providerFactsMarkup(profile, industries) {
  const location = locationParts(profile);
  const website = profile.website || (profile.domain ? `https://${profile.domain}` : "");
  const score = Math.max(0, Math.min(100, Number.parseInt(profile.confidenceScore, 10) || 0));
  const rows = [
    ["Headquarters", [location.city, location.country].filter(Boolean).join(", ") || "Not published"],
    ["Website", profile.domain || "Not published", website],
    ["Category", getProfileCategory(profile)],
    ["Industries", industries.slice(0, 2).join(", ") || "Software & Technology"],
    ["Evidence", `${score}%`],
    ["Verified", profile.claimed ? "by Rocket Engineers" : "Not yet verified"],
  ];

  if (profile.linkedinUrl) rows.splice(3, 0, ["LinkedIn", "Company profile", profile.linkedinUrl]);
  if (profile.githubUrl) rows.splice(4, 0, ["GitHub", "Repository profile", profile.githubUrl]);

  return rows.map(([label, value, url]) => `
    <div class="providerFactRow">
      <span>${escapeHtml(label)}</span>
      ${
        url
          ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(value)} -></a>`
          : `<strong>${escapeHtml(value)}</strong>`
      }
    </div>
  `).join("");
}

function providerStoriesListMarkup(profile) {
  const structuredStories = Array.isArray(profile.successStories) ? profile.successStories.filter(Boolean) : [];
  const fallbackStories = caseStudyItems(profile);
  const stories = structuredStories.length
    ? structuredStories.slice(0, 2).map((story) => ({
        title: typeof story === "string" ? story : story.title || story.name || "Customer story",
        meta: typeof story === "string" ? "Customer proof" : story.shortText || story.summary || story.description || "Customer proof",
      }))
    : fallbackStories.slice(0, 2).map((story) => ({
        title: story.title || "Customer story",
        meta: [story.sourceType, story.date].filter(Boolean).join(" · ") || "Customer proof",
      }));

  if (stories.length === 0) {
    stories.push(
      { title: `${profile.companyName || "Provider"} implementation proof`, meta: "Static proof slot" },
      { title: "Platform team enablement and delivery story", meta: "Static proof slot" }
    );
  }

  return stories.map((story) => `
    <article class="providerStoryRow">
      <div class="providerStoryThumb">photo</div>
      <div>
        <h4>${escapeHtml(story.title)}</h4>
        <p>${escapeHtml(story.meta)}</p>
      </div>
    </article>
  `).join("");
}

function providerUpcomingEventMarkup(profile) {
  return `
    <article class="providerEventCard">
      <div class="providerEventDate">
        <strong>22</strong>
        <span>JUL</span>
      </div>
      <div>
        <h4>${escapeHtml(getProfileCategory(profile))} briefing</h4>
        <p>${escapeHtml(providerLocationText(profile))} · 17:30-21:00</p>
        <span>Provider event</span>
      </div>
    </article>
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
  const focusCodes = providerFocusCodes(profile);
  elements.detailContent.innerHTML = `
    <div class="profileBackBar">
      <button class="backButton" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6" /><path d="M10 12h10" /></svg>
        All providers
      </button>
    </div>
    <div class="listingDetail detailSingleColumn">
      <div class="listingMain">
        <section class="providerProfileHero" aria-label="Provider profile header">
          <div class="providerHeaderIdentity">
            ${logoMarkup(profile, true)}
            <div>
              <div class="detailTitleRow">
                <h1>${escapeHtml(profile.companyName)}</h1>
                ${profile.claimed ? `<span class="verifiedBadge" aria-label="Verified profile">Verified</span>` : ""}
              </div>
              <p class="platformLine">${escapeHtml(providerLocationText(profile))}${profile.domain ? ` - ${escapeHtml(profile.domain)}` : ""}</p>
              <div class="providerFocusStrip">
                ${focusCodes.map(([code]) => `<span>${escapeHtml(code)}</span>`).join("")}
                <small>${escapeHtml(focusCodes.map(([, label]) => label).join(" · "))}</small>
              </div>
            </div>
          </div>
          ${providerActionMarkup(profile)}
        </section>

        <section class="providerProfileGrid">
          <div class="providerProfileMain">
            <section class="providerProfileBlock">
              <span class="eyebrow">About</span>
              <p>${escapeHtml(profile.description || "No company introduction available.")}</p>
            </section>
            <section class="providerProfileBlock">
              <span class="eyebrow">Services</span>
              <div class="chips">${chipButtons(profile.services, "service", "No services found")}</div>
              <span class="eyebrow providerSubEyebrow">Technologies</span>
              <div class="chips">${chipButtons(profile.technologies, "technology", "No technologies found", true)}</div>
              <span class="eyebrow providerSubEyebrow">Industries</span>
              <div class="chips">${chipButtons(industries, "industry", "No industries found", true)}</div>
            </section>
            <section class="providerProfileBlock">
              <div class="providerBlockHeader">
                <span class="eyebrow">Success stories</span>
                <a href="#stories" data-profile-page="stories">All stories -></a>
              </div>
              ${providerStoriesListMarkup(profile)}
            </section>
          </div>
          <aside class="providerProfileAside">
            <section>
              <span class="eyebrow">Facts</span>
              <div class="providerFacts">${providerFactsMarkup(profile, industries)}</div>
            </section>
            <section>
              <span class="eyebrow">Upcoming event</span>
              ${providerUpcomingEventMarkup(profile)}
              <a class="providerInlineLink" href="#events" data-profile-page="events">Register -></a>
            </section>
          </aside>
        </section>

        ${
          adminVisible
            ? `
              <nav class="detailTabs" aria-label="Profile sections">
                ${detailTabsMarkup(adminVisible)}
              </nav>
              ${overviewPanelMarkup(profile, industries)}
              ${partnershipsPanelMarkup(profile)}
            `
            : ""
        }
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
        <section class="providerIntroFooter">
          <span>Interested but not sure? Rocket Engineers can broker the introduction.</span>
          <a href="mailto:hello@rocketengineers.co?subject=${encodeURIComponent(`Introduction to ${profile.companyName || profile.domain}`)}">Request an introduction -></a>
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

  elements.detailContent.querySelectorAll("[data-tag-type]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTagFilter(button.dataset.tagType, button.dataset.tagValue);
    });
  });

  initializeChipDisclosures();

  elements.detailContent.querySelector(".backButton").addEventListener("click", () => {
    if (new URLSearchParams(window.location.search).has("provider")) {
      window.history.back();
      return;
    }

    closeProviderDetail();
  });

  elements.detailContent.querySelectorAll("[data-profile-page]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeProviderDetail({ pushHistory: false, scroll: false });
      setActivePage(link.dataset.profilePage);
      window.history.pushState({ page: link.dataset.profilePage }, "", `#${link.dataset.profilePage}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function initializeChipDisclosures() {
  elements.detailContent.querySelectorAll("[data-chip-disclosure]").forEach((disclosure) => {
    const list = disclosure.querySelector("[data-chip-list]");
    const button = disclosure.querySelector("[data-chip-toggle]");
    const chips = [...list.querySelectorAll(".chipButton")];
    const rowFor = (chip) => Math.round(chip.offsetTop - list.offsetTop);
    const rows = [...new Set(chips.map(rowFor))];

    if (rows.length <= 3) {
      button.hidden = true;
      return;
    }

    const visibleRows = new Set(rows.slice(0, 3));
    chips.forEach((chip) => {
      chip.classList.toggle("overflowChip", !visibleRows.has(rowFor(chip)));
    });

    button.hidden = false;
    button.dataset.moreLabel = `+${list.querySelectorAll(".overflowChip").length} more`;
    button.dataset.lessLabel = "Show less";
    button.textContent = button.dataset.moreLabel;

    while (rowFor(button) > rows[2]) {
      const lastVisibleChip = chips.filter((chip) => !chip.classList.contains("overflowChip")).at(-1);

      if (!lastVisibleChip) {
        break;
      }

      lastVisibleChip.classList.add("overflowChip");
      button.dataset.moreLabel = `+${list.querySelectorAll(".overflowChip").length} more`;
      button.textContent = button.dataset.moreLabel;
    }

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
  closeProviderDetail({ scroll: false });
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
    selectOnly("service", normalizeBucketName(value, SERVICE_BUCKET_RULES) || value);
  } else if (type === "technology") {
    selectOnly("technology", normalizeBucketName(value, TECHNOLOGY_BUCKET_RULES) || value);
  } else if (type === "vendor") {
    selectOnly("partner", normalizeBucketName(value, PARTNERSHIP_BUCKET_RULES) || value);
  } else if (type === "industry") {
    selectOnly("industry", value);
  }

  exitProfileMode();
  applyFilters();
  window.history.pushState({ provider: null }, "", providerListUrl());
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFilters() {
  clearFilterInputs();
  exitProfileMode();
  applyFilters();
}

function providerByDomain(domain) {
  return state.profiles.find((profile) => profile.domain === domain);
}

function miniProviderMarkup(domain, name) {
  const profile = providerByDomain(domain);

  if (!profile) {
    return `<span class="miniProvider"><span class="miniInitials">${escapeHtml(String(name || "?").slice(0, 2))}</span>${escapeHtml(name || domain)}</span>`;
  }

  return `
    <button class="miniProvider miniProviderButton" type="button" data-static-provider="${escapeHtml(profile.domain)}">
      ${logoMarkup(profile)}
      <span>${escapeHtml(profile.companyName || name || domain)}</span>
    </button>
  `;
}

function staticShell(title, kicker, copy, meta = "") {
  return `
    <div class="staticShell">
      <section class="staticHero">
        <div>
          <span class="eyebrow">${escapeHtml(kicker)}</span>
          <h1>${escapeHtml(title)}<span>.</span></h1>
          <p>${escapeHtml(copy)}</p>
        </div>
        ${meta ? `<aside>${meta}</aside>` : ""}
      </section>
    </div>
  `;
}

function bindStaticProviderLinks(root) {
  root.querySelectorAll("[data-static-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      setActivePage("providers");
      openProviderDetail(button.dataset.staticProvider);
    });
  });
}

function renderStoriesPage() {
  elements.storiesPage.innerHTML = `
    ${staticShell(
      "Success stories",
      "Customer proof",
      "Customer proof examples for the marketplace, using the same Rocket Engineers visual language.",
      `<strong>${STATIC_STORIES.length}</strong><span>featured stories</span><strong>Static</strong><span>preview content</span>`
    )}
    <div class="staticShell staticGrid">
      <section class="staticPanel">
        <div class="panelHeader">
          <div>
            <h2>Success Stories</h2>
            <p>Static examples for the page 10 direction.</p>
          </div>
        </div>
        <div class="storyList">
          ${STATIC_STORIES.map((story) => `
            <article class="storyCard">
              <div class="storyMeta">
                <span>${escapeHtml(story.vertical)}</span>
                <span>${escapeHtml(story.size)} company size</span>
                <span>${escapeHtml(story.location)}</span>
              </div>
              <h3>${escapeHtml(story.title)}</h3>
              <div class="storyFooter">
                ${miniProviderMarkup(story.domain, story.provider)}
                <strong>${escapeHtml(story.result)}</strong>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  `;
  bindStaticProviderLinks(elements.storiesPage);
}

function renderEventsPage() {
  elements.eventsPage.innerHTML = `
    ${staticShell(
      "Events",
      "Provider calendar",
      "Webinars, meetups, and in-person sessions from provider teams.",
      `<strong>${STATIC_EVENTS.length}</strong><span>upcoming events</span><strong>Static</strong><span>preview content</span>`
    )}
    <div class="staticShell staticGrid">
      <section class="staticPanel">
        <div class="eventList">
          ${STATIC_EVENTS.map((event) => `
            <article class="eventRow">
              <time><strong>${escapeHtml(event.day)}</strong><span>${escapeHtml(event.month)}</span></time>
              <div>
                <span class="eyebrow">${escapeHtml(event.type)}</span>
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.provider)} - ${escapeHtml(event.time)} - ${escapeHtml(event.location)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderSignalsPage() {
  elements.signalsPage.innerHTML = `
    ${staticShell(
      "Signals Pro",
      "Premium intelligence",
      "A static GTM signals feed for providers: hiring movement, public tenders, leadership changes, and project announcements.",
      `<strong>${STATIC_SIGNALS.length}</strong><span>matched signals</span><strong>Weekly</strong><span>digest cadence</span>`
    )}
    <div class="staticShell">
      <section class="staticPanel">
        <div class="signalList">
          ${STATIC_SIGNALS.map((signal) => `
            <article class="signalRow">
              <time><strong>${escapeHtml(signal.day)}</strong><span>${escapeHtml(signal.month)}</span></time>
              <div>
                <span class="signalType">${escapeHtml(signal.type)}</span>
                <h3>${escapeHtml(signal.company)}</h3>
                <p>${escapeHtml(signal.headline)}</p>
                <small>${escapeHtml(signal.source)}</small>
              </div>
              <strong>${escapeHtml(signal.match)}</strong>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderStaticPages() {
  elements.homePage.innerHTML = `
    ${staticShell(
      "Rocket Engineers",
      "Provider marketplace",
      "Find cloud, DevOps, platform engineering, security, and software partners from live profile evidence.",
      `<strong>${state.profiles.length}</strong><span>public providers</span><strong>5</strong><span>marketplace sections</span>`
    )}
    <div class="staticShell staticGrid threeColumnStatic">
      ${[
        ["Provider index", "Search and filter live provider profiles by country, services, technologies, partnerships, and industries.", "providers"],
        ["Success stories", "Browse static customer proof while the content model is being built out.", "stories"],
        ["Events", "Preview provider webinars, meetups, and technical sessions.", "events"],
        ["Signals Pro", "Preview the premium intelligence feed for provider GTM teams.", "signals"]
      ].map(([title, copy, page]) => `
        <button class="workspaceCard homeNavCard" type="button" data-home-page="${escapeHtml(page)}">
          <span class="eyebrow">Open</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(copy)}</p>
        </button>
      `).join("")}
    </div>
  `;
  elements.homePage.querySelectorAll("[data-home-page]").forEach((button) => {
    button.addEventListener("click", () => {
      setActivePage(button.dataset.homePage);
      window.history.pushState({ page: button.dataset.homePage }, "", button.dataset.homePage === "providers" ? providerListUrl() : `#${button.dataset.homePage}`);
    });
  });
  renderStoriesPage();
  renderEventsPage();
  renderSignalsPage();
}

function setActivePage(page) {
  const validPages = new Set(["home", "providers", "stories", "events", "signals"]);
  const requestedPage = validPages.has(page) ? page : "providers";

  elements.searchHero.hidden = requestedPage !== "providers";
  elements.homePage.hidden = requestedPage !== "home";
  elements.providersPage.hidden = requestedPage !== "providers";
  elements.storiesPage.hidden = requestedPage !== "stories";
  elements.eventsPage.hidden = requestedPage !== "events";
  elements.signalsPage.hidden = requestedPage !== "signals";

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
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const key = button.dataset.clearFilter;
      state.filters[key] = [];
      renderFilterOptions(filterDefForKey(key));
      applyFilters();
    });
  });

  document.querySelectorAll("[data-filter-group-header]").forEach((header) => {
    header.addEventListener("click", () => {
      toggleFilterGroup(header.closest(".filterGroup"));
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
      window.history.pushState({ page: tab.dataset.navTab }, "", tab.dataset.navTab === "providers" ? providerListUrl() : `#${tab.dataset.navTab}`);
    });
  });

  window.addEventListener("popstate", () => {
    syncPageFromLocation();
    syncProviderRouteFromLocation({ scroll: true });
  });
}

function syncPageFromLocation() {
  const page = window.location.hash.replace("#", "");
  setActivePage(page || "providers");
}

function toggleFilterGroup(group) {
  const toggle = group.querySelector("[data-toggle-filter-group]");
  const expanded = group.classList.toggle("isCollapsed") === false;

  toggle.setAttribute("aria-expanded", String(expanded));
}

function closeFilterDrawer() {
  document.body.classList.remove("filtersOpen");
  elements.filterDrawerButton.setAttribute("aria-expanded", "false");
}

function syncProviderRouteFromLocation(options = {}) {
  const { replaceHistory = false, scroll = false } = options;
  const requestedProvider = new URLSearchParams(window.location.search).get("provider");
  const providerExists = requestedProvider && state.profiles.some((profile) => profile.domain === requestedProvider);

  if (replaceHistory) {
    window.history.replaceState(
      { provider: providerExists ? requestedProvider : null },
      "",
      providerExists ? providerDetailUrl(requestedProvider) : providerListUrl()
    );
  }

  if (providerExists) {
    openProviderDetail(requestedProvider, { pushHistory: false, scroll });
    return;
  }

  if (state.profileMode) {
    closeProviderDetail({ pushHistory: false, scroll });
  }
}

async function loadProfiles() {
  let response = await fetch("/api/profiles");

  if (!response.ok) {
    response = await fetch("/profiles.json");
  }

  if (!response.ok) {
    throw new Error(`Failed to load profiles: ${response.status}`);
  }

  state.profiles = publicProfilesFromPayload(await response.json());

  if (!Array.isArray(state.profiles) || state.profiles.length === 0) {
    response = await fetch("/profiles.json");

    if (!response.ok) {
      throw new Error(`Failed to load static profiles: ${response.status}`);
    }

    state.profiles = publicProfilesFromPayload(await response.json());
  }

  state.filtered = state.profiles;
  state.tags = await loadApprovedTags();
  state.selectedDomain = null;
  elements.status.textContent = `${state.profiles.length} loaded`;
  populateFilters();
  renderStaticPages();
  bindEvents();
  applyFilters();
  syncPageFromLocation();
  syncProviderRouteFromLocation({ replaceHistory: true });
}

async function loadApprovedTags() {
  try {
    const response = await fetch("/api/tags");

    if (!response.ok) {
      return [];
    }

    return publicTagsFromPayload(await response.json());
  } catch (error) {
    return [];
  }
}

loadProfiles().catch((error) => {
  elements.status.textContent = "Load failed";
  elements.detailContent.className = "detailContent empty";
  elements.detailContent.textContent = error.message;
});
