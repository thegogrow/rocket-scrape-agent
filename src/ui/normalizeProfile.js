function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeString(value) {
  const text = String(value || "").trim();

  return text || null;
}

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

const COUNTRY_RULES = [
  { country: "Switzerland", match: ["switzerland", "swiss", "schweiz", "suisse", "zurich", "zürich", "bern", "basel", "lausanne", "zug", "winterthur", "st. gallen"] },
  { country: "Germany", match: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "köln", "cologne", "düsseldorf", "stuttgart", "karlsruhe", "münster", "hannover", "dortmund", "leipzig", "nuremberg", "nürnberg", "bonn", "bremen", "mannheim", "wiesbaden"] },
  { country: "Austria", match: ["austria", "österreich", "vienna", "wien", "graz", "salzburg"] },
  { country: "United Kingdom", match: ["united kingdom", "uk", "england", "london", "manchester", "edinburgh", "leeds"] },
  { country: "United States", match: ["united states", "usa", "u.s.", "new york", "san francisco", "seattle", "austin", "boston", "denver", "los angeles", "chicago", "irvine", "atlanta", "washington"] },
  { country: "Poland", match: ["poland", "warsaw", "wrocław", "wroclaw", "kraków", "krakow"] },
  { country: "Netherlands", match: ["netherlands", "amsterdam", "alkmaar", "utrecht", "rotterdam"] },
  { country: "Finland", match: ["finland", "helsinki", "tampere"] },
  { country: "Sweden", match: ["sweden", "stockholm", "umeå", "umea"] },
  { country: "Denmark", match: ["denmark", "copenhagen", "aalborg"] },
  { country: "France", match: ["france", "paris"] },
  { country: "Italy", match: ["italy", "italia", "milan", "milano", "rome", "roma"] },
  { country: "Spain", match: ["spain", "madrid", "barcelona"] },
  { country: "Portugal", match: ["portugal", "lisbon", "porto"] },
  { country: "Israel", match: ["israel", "tel aviv", "haifa"] },
  { country: "Canada", match: ["canada", "toronto", "montreal", "montréal", "vancouver"] },
  { country: "Ireland", match: ["ireland", "dublin"] },
  { country: "India", match: ["india", "bangalore", "bengaluru", "pune", "hyderabad"] },
  { country: "Argentina", match: ["argentina", "buenos aires"] },
  { country: "Ukraine", match: ["ukraine", "kyiv", "lviv"] },
  { country: "Romania", match: ["romania", "bucharest", "cluj"] },
  { country: "South Korea", match: ["south korea", "korea", "seoul"] },
];

const CITY_RULES = [
  { city: "Zurich", country: "Switzerland", match: ["zurich", "zürich"] },
  { city: "Bern", country: "Switzerland", match: ["bern"] },
  { city: "Basel", country: "Switzerland", match: ["basel"] },
  { city: "Lausanne", country: "Switzerland", match: ["lausanne"] },
  { city: "Zug", country: "Switzerland", match: ["zug"] },
  { city: "St. Gallen", country: "Switzerland", match: ["st. gallen"] },
  { city: "Berlin", country: "Germany", match: ["berlin"] },
  { city: "Munich", country: "Germany", match: ["munich", "münchen"] },
  { city: "Hamburg", country: "Germany", match: ["hamburg"] },
  { city: "Frankfurt", country: "Germany", match: ["frankfurt"] },
  { city: "Cologne", country: "Germany", match: ["cologne", "köln"] },
  { city: "Düsseldorf", country: "Germany", match: ["düsseldorf"] },
  { city: "Stuttgart", country: "Germany", match: ["stuttgart"] },
  { city: "Karlsruhe", country: "Germany", match: ["karlsruhe"] },
  { city: "Münster", country: "Germany", match: ["münster"] },
  { city: "Hanover", country: "Germany", match: ["hannover", "hanover"] },
  { city: "Dortmund", country: "Germany", match: ["dortmund"] },
  { city: "Leipzig", country: "Germany", match: ["leipzig"] },
  { city: "Vienna", country: "Austria", match: ["vienna", "wien"] },
  { city: "London", country: "United Kingdom", match: ["london"] },
  { city: "Leeds", country: "United Kingdom", match: ["leeds"] },
  { city: "Warsaw", country: "Poland", match: ["warsaw"] },
  { city: "Wrocław", country: "Poland", match: ["wrocław", "wroclaw"] },
  { city: "Kraków", country: "Poland", match: ["kraków", "krakow"] },
  { city: "Amsterdam", country: "Netherlands", match: ["amsterdam"] },
  { city: "Alkmaar", country: "Netherlands", match: ["alkmaar"] },
  { city: "Helsinki", country: "Finland", match: ["helsinki"] },
  { city: "Stockholm", country: "Sweden", match: ["stockholm"] },
  { city: "Umeå", country: "Sweden", match: ["umeå", "umea"] },
  { city: "Copenhagen", country: "Denmark", match: ["copenhagen"] },
  { city: "Aalborg", country: "Denmark", match: ["aalborg"] },
  { city: "Paris", country: "France", match: ["paris"] },
  { city: "Milan", country: "Italy", match: ["milan", "milano"] },
  { city: "Tel Aviv", country: "Israel", match: ["tel aviv"] },
  { city: "Toronto", country: "Canada", match: ["toronto"] },
  { city: "Montreal", country: "Canada", match: ["montreal", "montréal"] },
  { city: "New York", country: "United States", match: ["new york"] },
  { city: "San Francisco", country: "United States", match: ["san francisco"] },
  { city: "Seattle", country: "United States", match: ["seattle"] },
  { city: "Denver", country: "United States", match: ["denver"] },
  { city: "Boston", country: "United States", match: ["boston"] },
  { city: "Austin", country: "United States", match: ["austin"] },
  { city: "Los Angeles", country: "United States", match: ["los angeles"] },
  { city: "Chicago", country: "United States", match: ["chicago"] },
  { city: "Dublin", country: "Ireland", match: ["dublin"] },
  { city: "Bengaluru", country: "India", match: ["bengaluru", "bangalore"] },
  { city: "Seoul", country: "South Korea", match: ["seoul"] },
];

const COUNTRY_NAMES = new Set(COUNTRY_RULES.map((rule) => rule.country.toLowerCase()));

function uniqueList(values) {
  const seen = new Set();

  return asArray(values)
    .map(normalizeString)
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
  const text = normalizeString(value);

  if (!text) {
    return null;
  }

  const rule = rules.find((item) => item.match.some((keyword) => bucketMatch(text, keyword)));

  return rule?.name || text;
}

function normalizeBucketList(values, rules, maxItems = 8, fallbackName = null) {
  return uniqueList(values)
    .map((value) => {
      const text = normalizeString(value);
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
  return normalizeBucketList(values, SERVICE_BUCKET_RULES, 8);
}

function normalizeTechnologies(values) {
  return normalizeBucketList(values, TECHNOLOGY_BUCKET_RULES, 10);
}

function normalizePartnerships(values) {
  return normalizeBucketList(values, PARTNERSHIP_BUCKET_RULES, 8);
}

function normalizeCountryName(value) {
  return normalizeBucketName(value, COUNTRY_BUCKET_RULES);
}

function normalizeFilterBuckets(profile = {}) {
  return {
    countries: [normalizeCountryName(profile.companyLocation?.country || profile.country)].filter(Boolean),
    services: normalizeBucketList(profile.services, SERVICE_BUCKET_RULES, 100, "Other Services"),
    technologies: normalizeBucketList(profile.technologies, TECHNOLOGY_BUCKET_RULES, 100, "Other Technologies"),
    partnerships: normalizeBucketList(profile.vendorPartnerships, PARTNERSHIP_BUCKET_RULES, 100, "Other Partnerships"),
    industries: normalizeIndustries(profile.industries, [profile.focusAreas, profile.services]),
  };
}

function normalizeScraperQualityLog(value = {}) {
  return {
    missing: uniqueList(value.missing),
    incorrect: uniqueList(value.incorrect),
    added: uniqueList(value.added),
    notes: normalizeString(value.notes) || "",
  };
}

function normalizeIndustryName(value) {
  const text = normalizeString(value);

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

function normalizeIndustries(values, fallbackValues = []) {
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

function countryFromLocationText(locationText) {
  const text = String(locationText || "").toLowerCase();
  const rule = COUNTRY_RULES.find((item) =>
    item.match.some((keyword) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, "i").test(text))
  );

  return rule?.country || null;
}

function cityFromLocationText(locationText, country = null) {
  const text = String(locationText || "").toLowerCase();
  const rules = country
    ? CITY_RULES.filter((item) => item.country === country)
    : CITY_RULES;
  const rule = rules.find((item) =>
    item.match.some((keyword) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, "i").test(text))
  );

  return rule?.city || null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countryFromDomain(profile = {}) {
  const rawDomain = normalizeString(profile.domain) || normalizeString(profile.website);

  if (!rawDomain) {
    return null;
  }

  let hostname = rawDomain;

  try {
    hostname = new URL(/^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`).hostname;
  } catch (error) {
    hostname = rawDomain;
  }

  const domain = hostname.toLowerCase().replace(/^www\./, "");
  const countryBySuffix = [
    [".co.il", "Israel"],
    [".com.au", "Australia"],
    [".co.uk", "United Kingdom"],
  ];
  const suffixMatch = countryBySuffix.find(([suffix]) => domain.endsWith(suffix));

  if (suffixMatch) {
    return suffixMatch[1];
  }

  const tld = domain.split(".").pop();
  const countryByTld = {
    at: "Austria",
    ch: "Switzerland",
    de: "Germany",
    dk: "Denmark",
    fi: "Finland",
    fr: "France",
    io: null,
    nl: "Netherlands",
    pl: "Poland",
    se: "Sweden",
    uk: "United Kingdom",
  };

  return countryByTld[tld] || null;
}

function cleanCityCandidate(city, country) {
  const value = normalizeString(city);

  if (!value) {
    return null;
  }

  const lowerValue = value.toLowerCase();

  if (
    COUNTRY_NAMES.has(lowerValue) ||
    lowerValue === String(country || "").toLowerCase() ||
    /\b(global|worldwide|europe|north america|south america|asia pacific|apac|emea|locations?|countries|offices?)\b/i.test(value)
  ) {
    return null;
  }

  return value;
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
    profile.country,
    profile.city,
    structuredLocation.country,
    structuredLocation.city,
    enrichmentLocation.country,
    enrichmentLocation.state,
    enrichmentLocation.city,
    sourceBundle?.websiteData?.metadata?.title,
    sourceBundle?.websiteData?.metadata?.description,
  ]
    .filter(Boolean)
    .join(" ");
  const inferredCountry = countryFromLocationText(locationText);
  const legacyCity =
    legacyParts.length > 1
      ? legacyParts.slice(0, -1).join(", ")
      : legacyParts[0] && legacyParts[0].toLowerCase() !== String(inferredCountry || "").toLowerCase()
        ? legacyParts[0]
        : null;
  const domainCountry = countryFromDomain(profile);
  const country =
    domainCountry ||
    normalizeString(structuredLocation.country) ||
    normalizeString(profile.country) ||
    normalizeString(enrichmentLocation.country) ||
    inferredCountry;

  return {
    country,
    city:
      cleanCityCandidate(structuredLocation.city || structuredLocation.locality, country) ||
      cleanCityCandidate(profile.city, country) ||
      cleanCityCandidate(enrichmentLocation.city || enrichmentLocation.locality, country) ||
      cleanCityCandidate(legacyCity, country) ||
      cityFromLocationText(locationText, country),
  };
}

function normalizeProfile(profile = {}, options = {}) {
  const sourceBundle = options.sourceBundle || null;
  const companyLocation = locationFromProfile(profile, sourceBundle);
  const rawSubscriptionTier = normalizeString(profile.subscriptionTier || profile.subscription_tier || profile.plan) || "free";
  const subscriptionTier = ["premium", "pro", "paid"].includes(rawSubscriptionTier.toLowerCase()) ? "premium" : "free";
  const industries = normalizeIndustries(profile.industries, [profile.focusAreas, profile.services]);
  const filterBuckets = normalizeFilterBuckets({ ...profile, industries });

  return {
    ...profile,
    country: companyLocation.country,
    city: companyLocation.city,
    companyLocation,
    services: normalizeServices(profile.services),
    focusAreas: uniqueList(profile.focusAreas),
    industries,
    technologies: normalizeTechnologies(profile.technologies),
    vendorPartnerships: normalizePartnerships(profile.vendorPartnerships),
    filterBuckets,
    successStories: asArray(profile.successStories),
    solutions: asArray(profile.solutions),
    recentActivity: asArray(profile.recentActivity),
    reviewNotes: asArray(profile.reviewNotes),
    scraperQualityLog: normalizeScraperQualityLog(profile.scraperQualityLog),
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
  normalizeIndustries,
  normalizeCountryName,
  normalizeFilterBuckets,
  normalizePartnerships,
  normalizeProfile,
  normalizeProfiles,
  normalizeScraperQualityLog,
  normalizeServices,
  normalizeTechnologies,
};
