const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();
const { normalizeProfile, normalizeProfiles } = require("./normalizeProfile");

const DEFAULT_ADMIN_EMAILS = ["phil@thegogrow.ch", "nunezkathleenm@gmail.com"];
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
const PUBLIC_PROVIDER_STATUSES = [
  "approved",
  "outreach_pending",
  "outreach_active",
  "claimed",
  "unclaimed",
];
const CONFIDENCE_GUARDRAIL_SCORE = 75;
const TAG_CATEGORIES = new Set(["services", "industries", "technologies", "vendor_partnerships"]);
const TAG_STATUSES = new Set(["candidate", "approved", "merged"]);
const OUTREACH_MESSAGE_CHANNELS = new Set(["email", "linkedin", "claim_invite"]);
const OUTREACH_MESSAGE_STEPS = new Set(["email_1", "email_2", "email_3", "linkedin_message", "claim_profile_invitation"]);
const OUTREACH_MESSAGE_STATUSES = new Set(["draft", "approved", "sent", "opened", "clicked", "replied"]);
const CLAIM_REQUEST_TYPES = new Set(["claim", "removal"]);
const PROVIDER_EVENT_STATUSES = new Set(["suggested", "approved", "expired", "archived"]);
const MARKET_SIGNAL_TYPES = new Set(["hiring", "news", "leadership", "tender", "technology", "partnership"]);
const MARKET_SIGNAL_STATUSES = new Set(["scraped", "reviewed", "approved", "archived"]);
const PROVIDER_LEAD_STATUSES = new Set(["new", "reviewed", "forwarded", "closed"]);
const SPRINT2_SCHEMA_CHECKS = [
  {
    table: "providers",
    required: true,
    columns: [
      "id",
      "domain",
      "company_name",
      "status",
      "claimed",
      "claimed_by_email",
      "claimed_at",
      "claim_verification_method",
      "removal_requested_at",
      "removed_at",
      "scraper_quality_log",
      "activity_log",
    ],
  },
  { table: "scrape_jobs", required: true, columns: ["id", "url", "status", "result_provider_id"] },
  { table: "tag_taxonomy", required: true, columns: ["id", "category", "name", "normalized_name", "status", "merge_target"] },
  { table: "outreach_contacts", required: false, columns: ["id", "provider_id", "name", "title", "email", "linkedin_url", "primary_contact"] },
  { table: "outreach_messages", required: false, columns: ["id", "provider_id", "contact_id", "channel", "message_step", "subject", "body", "status"] },
  { table: "claim_requests", required: false, columns: ["id", "provider_id", "domain", "email", "request_type", "status", "verification_method", "reviewed_by", "reviewed_at"] },
  { table: "provider_leads", required: false, columns: ["id", "provider_id", "domain", "email", "message", "status", "reviewed_by", "reviewed_at"] },
  { table: "success_stories", required: false, columns: ["id", "provider_id", "title", "status", "approved_by", "approved_at"] },
  { table: "provider_events", required: false, columns: ["id", "provider_id", "title", "starts_at", "status", "approved_by", "approved_at"] },
  { table: "market_signals", required: false, columns: ["id", "provider_id", "signal_type", "title", "status", "approved_by", "approved_at", "observed_at"] },
  { table: "activity_events", required: false, columns: ["id", "provider_id", "event_type", "label", "actor_email", "created_at"] },
  { table: "reviewer_feedback", required: false, columns: ["id", "provider_id", "reviewer_email", "feedback", "status_from", "status_to", "created_at"] },
];
const DEPLOYMENT_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS",
  "OPENROUTER_API_KEY",
];
const DEPLOYMENT_API_ROUTES = [
  "api/[...path].js",
];
const CANONICAL_AUDIT_HISTORY = {
  canonical: ["activity_events", "reviewer_feedback"],
  legacyFallback: "providers.activity_log",
  decision: "New audit entries should be written to normalized tables. providers.activity_log remains a compatibility fallback until existing rows are migrated.",
};

function normalizeLifecycleStatus(status, fallback = "scraped") {
  const value = String(status || "").trim().toLowerCase();

  if (value === "published") return "approved";
  if (value === "draft" || value === "needs_review") return "scraped";
  if (value === "archived") return "removed";

  return LIFECYCLE_STATUSES.has(value) ? value : fallback;
}

function normalizeDomain(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch (error) {
    return text.replace(/^www\./, "").toLowerCase();
  }
}

function normalizeTagName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeTagKey(value) {
  return normalizeTagName(value).toLowerCase();
}

function normalizeTagCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (!TAG_CATEGORIES.has(category)) {
    throw new Error("Unsupported tag category.");
  }

  return category;
}

function normalizeTagStatus(value, fallback = "candidate") {
  const status = String(value || "").trim().toLowerCase();

  return TAG_STATUSES.has(status) ? status : fallback;
}

function tagValuesForCategory(profile = {}, category) {
  if (category === "vendor_partnerships") {
    return Array.isArray(profile.vendorPartnerships) ? profile.vendorPartnerships : [];
  }

  return Array.isArray(profile?.[category]) ? profile[category] : [];
}

function confidenceScoreForProfile(profile = {}) {
  const score = Number.parseInt(profile.confidenceScore ?? profile.confidence_score, 10);

  return Number.isFinite(score) ? score : 0;
}

function automaticStatusForConfidence(status, profile = {}) {
  const normalizedStatus = normalizeLifecycleStatus(status);

  if (
    PUBLIC_PROVIDER_STATUSES.includes(normalizedStatus) &&
    confidenceScoreForProfile(profile) < CONFIDENCE_GUARDRAIL_SCORE
  ) {
    return "in_review";
  }

  return normalizedStatus;
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    adminEmails: (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };
}

function isSupabaseConfigured() {
  const config = supabaseConfig();

  return Boolean(config.url && config.anonKey && config.serviceRoleKey);
}

function normalizeSupabaseUrl(url) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error("SUPABASE_URL must be a valid Supabase project URL.");
  }

  if (!/\.supabase\.(co|in)$/.test(parsed.hostname)) {
    throw new Error("SUPABASE_URL must be your Supabase project URL, like https://your-project.supabase.co.");
  }

  return parsed.origin;
}

async function supabaseFetch(path, options = {}) {
  const config = supabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function rowToProfile(row) {
  return normalizeProfile({
    id: row.id,
    domain: row.domain,
    country: row.country,
    city: row.city,
    companyName: row.company_name,
    website: row.website,
    description: row.description,
    services: row.services || [],
    focusAreas: row.focus_areas || [],
    industries: row.industries || [],
    technologies: row.technologies || [],
    vendorPartnerships: row.vendor_partnerships || [],
    successStories: row.success_stories || [],
    solutions: row.solutions || [],
    location: row.location,
    confidenceScore: row.confidence_score || 0,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    logoUrl: row.logo_url,
    claimed: row.claimed,
    claimedByEmail: row.claimed_by_email,
    claimedAt: row.claimed_at,
    claimVerificationMethod: row.claim_verification_method,
    removalRequestedAt: row.removal_requested_at,
    removedAt: row.removed_at,
    subscriptionTier: row.subscription_tier,
    recentActivity: row.recent_activity || [],
    reviewNotes: row.review_notes || [],
    scraperQualityLog: row.scraper_quality_log || {},
    activityLog: row.activity_log || [],
    files: row.files || {},
    sourceData: row.source_data || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function rowToOutreachContact(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name || "",
    title: row.title || "",
    email: row.email || "",
    linkedinUrl: row.linkedin_url || "",
    seniority: row.seniority || "",
    source: row.source || "",
    primaryContact: Boolean(row.primary_contact),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeOutreachContacts(contacts = []) {
  let primaryAssigned = false;

  return (Array.isArray(contacts) ? contacts : [])
    .map((contact) => ({
      name: String(contact.name || "").trim(),
      title: String(contact.title || contact.role || "").trim(),
      email: String(contact.email || "").trim(),
      linkedinUrl: String(contact.linkedinUrl || contact.linkedin_url || "").trim(),
      seniority: String(contact.seniority || "").trim(),
      source: String(contact.source || "").trim(),
      primaryContact: Boolean(contact.primaryContact || contact.primary_contact),
    }))
    .filter((contact) => (
      contact.name ||
      contact.title ||
      contact.email ||
      contact.linkedinUrl ||
      contact.seniority ||
      contact.source
    ))
    .map((contact) => {
      const primaryContact = contact.primaryContact && !primaryAssigned;

      if (primaryContact) {
        primaryAssigned = true;
      }

      return { ...contact, primaryContact };
    });
}

async function listOutreachContacts(providerIds = []) {
  const ids = providerIds.filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await supabaseFetch(
      `/rest/v1/outreach_contacts?select=*&provider_id=in.(${ids.map(encodeURIComponent).join(",")})&order=primary_contact.desc,name.asc`
    );

    return rows.map(rowToOutreachContact);
  } catch (error) {
    if (/outreach_contacts|relation/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function replaceProviderOutreachContacts(providerId, contacts = []) {
  const normalizedContacts = normalizeOutreachContacts(contacts);

  try {
    await supabaseFetch(`/rest/v1/outreach_contacts?provider_id=eq.${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (normalizedContacts.length === 0 && /outreach_contacts|relation/i.test(error.message)) {
      return [];
    }

    throw error;
  }

  if (normalizedContacts.length === 0) {
    return [];
  }

  const rows = await supabaseFetch("/rest/v1/outreach_contacts", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(normalizedContacts.map((contact) => ({
      provider_id: providerId,
      name: contact.name || null,
      title: contact.title || null,
      email: contact.email || null,
      linkedin_url: contact.linkedinUrl || null,
      seniority: contact.seniority || null,
      source: contact.source || null,
      primary_contact: contact.primaryContact,
    }))),
  });

  return rows.map(rowToOutreachContact);
}

function normalizeOutreachMessageChannel(value, fallback = "email") {
  const channel = String(value || "").trim().toLowerCase();

  return OUTREACH_MESSAGE_CHANNELS.has(channel) ? channel : fallback;
}

function normalizeOutreachMessageStep(value, fallback = "email_1") {
  const step = String(value || "").trim().toLowerCase();

  return OUTREACH_MESSAGE_STEPS.has(step) ? step : fallback;
}

function normalizeOutreachMessageStatus(value, fallback = "draft") {
  const status = String(value || "").trim().toLowerCase();

  return OUTREACH_MESSAGE_STATUSES.has(status) ? status : fallback;
}

function rowToOutreachMessage(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    contactId: row.contact_id,
    channel: row.channel,
    messageStep: row.message_step,
    subject: row.subject || "",
    body: row.body || "",
    status: row.status,
    generatedBy: row.generated_by || "",
    approvedBy: row.approved_by || "",
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToClaimRequest(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    domain: row.domain || "",
    email: row.email || "",
    requestType: row.request_type || "claim",
    status: row.status || "pending",
    verificationMethod: row.verification_method || "",
    reviewedBy: row.reviewed_by || "",
    reviewedAt: row.reviewed_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProviderLead(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    domain: row.domain || "",
    name: row.name || "",
    company: row.company || "",
    email: row.email || "",
    message: row.message || "",
    status: row.status || "new",
    reviewedBy: row.reviewed_by || "",
    reviewedAt: row.reviewed_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSuccessStory(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    title: row.title || "",
    shortText: row.short_text || "",
    link: row.link || "",
    sourceUrl: row.source_url || "",
    status: row.status || "draft",
    featured: Boolean(row.featured),
    approvedBy: row.approved_by || "",
    approvedAt: row.approved_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProviderEvent(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    title: row.title || "",
    startsAt: row.starts_at,
    location: row.location || "",
    online: Boolean(row.online),
    sourceUrl: row.source_url || "",
    status: row.status || "suggested",
    featured: Boolean(row.featured),
    approvedBy: row.approved_by || "",
    approvedAt: row.approved_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMarketSignal(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    signalType: row.signal_type || "news",
    title: row.title || "",
    sourceUrl: row.source_url || "",
    status: row.status || "scraped",
    approvedBy: row.approved_by || "",
    approvedAt: row.approved_at,
    metadata: row.metadata || {},
    observedAt: row.observed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToActivityEvent(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    eventType: row.event_type || "activity",
    label: row.label || "Activity",
    summary: row.summary || "",
    actorEmail: row.actor_email || "",
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function rowToReviewerFeedback(row = {}) {
  return {
    id: row.id,
    providerId: row.provider_id,
    reviewerEmail: row.reviewer_email || "",
    feedback: row.feedback || "neutral",
    statusFrom: row.status_from || "",
    statusTo: row.status_to || "",
    qualityMissing: row.quality_missing || [],
    qualityIncorrect: row.quality_incorrect || [],
    qualityAdded: row.quality_added || [],
    notes: row.notes || "",
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function normalizeOutreachMessages(messages = []) {
  const byStep = new Map();

  for (const message of Array.isArray(messages) ? messages : []) {
    const normalizedMessage = {
      contactId: message.contactId || message.contact_id || null,
      channel: normalizeOutreachMessageChannel(message.channel),
      messageStep: normalizeOutreachMessageStep(message.messageStep || message.message_step),
      subject: String(message.subject || "").trim(),
      body: String(message.body || "").trim(),
      status: normalizeOutreachMessageStatus(message.status),
      generatedBy: String(message.generatedBy || message.generated_by || "").trim(),
      approvedBy: String(message.approvedBy || message.approved_by || "").trim(),
      approvedAt: message.approvedAt || message.approved_at || null,
      sentAt: message.sentAt || message.sent_at || null,
      metadata: message.metadata && typeof message.metadata === "object" ? message.metadata : {},
    };

    if (!normalizedMessage.body) {
      continue;
    }

    byStep.set(normalizedMessage.messageStep, normalizedMessage);
  }

  return [...byStep.values()];
}

async function listOutreachMessages(providerIds = []) {
  const ids = providerIds.filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await supabaseFetch(
      `/rest/v1/outreach_messages?select=*&provider_id=in.(${ids.map(encodeURIComponent).join(",")})&order=message_step.asc,created_at.asc`
    );

    return rows.map(rowToOutreachMessage);
  } catch (error) {
    if (/outreach_messages|relation/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function replaceProviderOutreachMessages(providerId, messages = []) {
  const normalizedMessages = normalizeOutreachMessages(messages);

  try {
    await supabaseFetch(`/rest/v1/outreach_messages?provider_id=eq.${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (normalizedMessages.length === 0 && /outreach_messages|relation/i.test(error.message)) {
      return [];
    }

    throw error;
  }

  if (normalizedMessages.length === 0) {
    return [];
  }

  const rows = await supabaseFetch("/rest/v1/outreach_messages", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(normalizedMessages.map((message) => ({
      provider_id: providerId,
      contact_id: message.contactId,
      channel: message.channel,
      message_step: message.messageStep,
      subject: message.subject || null,
      body: message.body,
      status: message.status,
      generated_by: message.generatedBy || null,
      approved_by: message.approvedBy || null,
      approved_at: message.approvedAt,
      sent_at: message.sentAt,
      metadata: message.metadata,
    }))),
  });

  return rows.map(rowToOutreachMessage);
}

async function listClaimRequests() {
  try {
    const rows = await supabaseFetch("/rest/v1/claim_requests?select=*&order=created_at.desc&limit=200");

    return rows.map(rowToClaimRequest);
  } catch (error) {
    if (/claim_requests|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function listProviderLeads() {
  try {
    const rows = await supabaseFetch("/rest/v1/provider_leads?select=*&order=created_at.desc&limit=200");

    return rows.map(rowToProviderLead);
  } catch (error) {
    if (/provider_leads|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function updateProviderLeadStatus(id, { status, reviewedBy } = {}) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (!PROVIDER_LEAD_STATUSES.has(normalizedStatus)) {
    throw new Error("Lead status must be new, reviewed, forwarded, or closed.");
  }

  const rows = await supabaseFetch(`/rest/v1/provider_leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      status: normalizedStatus,
      reviewed_by: reviewedBy || null,
      reviewed_at: normalizedStatus === "new" ? null : new Date().toISOString(),
    }),
  });
  const lead = rowToProviderLead(rows[0]);
  const provider = lead.providerId
    ? (await supabaseFetch(`/rest/v1/providers?select=*&id=eq.${encodeURIComponent(lead.providerId)}&limit=1`))[0]
    : await findProviderByDomain(lead.domain);

  await logActivityEvent({
    providerId: provider?.id || lead.providerId || null,
    eventType: "provider_lead_status_changed",
    label: "Lead status changed",
    summary: `${lead.email} marked ${normalizedStatus} for ${lead.domain}.`,
    actorEmail: reviewedBy,
    metadata: {
      providerLeadId: id,
      status: normalizedStatus,
      requesterEmail: lead.email,
    },
  });

  return lead;
}

async function listApprovedSuccessStories(providerIds = []) {
  const ids = providerIds.filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await supabaseFetch(
      `/rest/v1/success_stories?select=*&provider_id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.approved&order=featured.desc,created_at.desc`
    );

    return rows.map(rowToSuccessStory);
  } catch (error) {
    if (/success_stories|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function listApprovedUpcomingProviderEvents(providerIds = []) {
  const ids = providerIds.filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await supabaseFetch(
      `/rest/v1/provider_events?select=*&provider_id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.approved&starts_at=gte.${encodeURIComponent(new Date().toISOString())}&order=featured.desc,starts_at.asc`
    );

    return rows.map(rowToProviderEvent);
  } catch (error) {
    if (/provider_events|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function listSuccessStories() {
  try {
    const rows = await supabaseFetch("/rest/v1/success_stories?select=*&order=created_at.desc&limit=500");

    return rows.map(rowToSuccessStory);
  } catch (error) {
    if (/success_stories|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function replaceProviderSuccessStories(providerId, stories = []) {
  const normalizedStories = (Array.isArray(stories) ? stories : [])
    .map((story) => {
      const status = String(story.status || "draft").trim().toLowerCase();
      const normalizedStatus = ["suggested", "draft", "approved", "archived"].includes(status) ? status : "draft";

      return {
        id: story.id || "",
        title: String(story.title || "").trim(),
        shortText: String(story.shortText || story.short_text || "").trim(),
        link: String(story.link || "").trim(),
        sourceUrl: String(story.sourceUrl || story.source_url || "").trim(),
        status: normalizedStatus,
        featured: Boolean(story.featured),
        approvedBy: String(story.approvedBy || story.approved_by || "").trim(),
        approvedAt: story.approvedAt || story.approved_at || null,
        metadata: story.metadata && typeof story.metadata === "object" ? story.metadata : {},
      };
    })
    .filter((story) => story.title || story.shortText || story.link || story.sourceUrl);

  await supabaseFetch(`/rest/v1/success_stories?provider_id=eq.${encodeURIComponent(providerId)}`, {
    method: "DELETE",
  });

  if (normalizedStories.length === 0) {
    return [];
  }

  const rows = await supabaseFetch("/rest/v1/success_stories", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(normalizedStories.map((story) => ({
      provider_id: providerId,
      title: story.title || "Untitled success story",
      short_text: story.shortText || null,
      link: story.link || null,
      source_url: story.sourceUrl || null,
      status: story.status,
      featured: story.featured,
      approved_by: story.status === "approved" ? story.approvedBy || null : null,
      approved_at: story.status === "approved" ? story.approvedAt || new Date().toISOString() : null,
      metadata: story.metadata,
    }))),
  });

  return rows.map(rowToSuccessStory);
}

async function listProviderEvents() {
  try {
    const rows = await supabaseFetch("/rest/v1/provider_events?select=*&order=starts_at.asc&limit=500");

    return rows.map(rowToProviderEvent);
  } catch (error) {
    if (/provider_events|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

function normalizeProviderEventStatus(value, fallback = "suggested") {
  const status = String(value || "").trim().toLowerCase();

  return PROVIDER_EVENT_STATUSES.has(status) ? status : fallback;
}

async function replaceProviderEvents(providerId, events = []) {
  const normalizedEvents = (Array.isArray(events) ? events : [])
    .map((event) => ({
      id: event.id || "",
      title: String(event.title || "").trim(),
      startsAt: event.startsAt || event.starts_at || "",
      location: String(event.location || "").trim(),
      online: Boolean(event.online),
      sourceUrl: String(event.sourceUrl || event.source_url || "").trim(),
      status: normalizeProviderEventStatus(event.status),
      featured: Boolean(event.featured),
      approvedBy: String(event.approvedBy || event.approved_by || "").trim(),
      approvedAt: event.approvedAt || event.approved_at || null,
      metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
    }))
    .filter((event) => event.title || event.startsAt || event.location || event.sourceUrl)
    .map((event) => ({
      ...event,
      title: event.title || "Untitled provider event",
      startsAt: event.startsAt && !Number.isNaN(new Date(event.startsAt).getTime())
        ? new Date(event.startsAt).toISOString()
        : new Date().toISOString(),
    }));

  await supabaseFetch(`/rest/v1/provider_events?provider_id=eq.${encodeURIComponent(providerId)}`, {
    method: "DELETE",
  });

  if (normalizedEvents.length === 0) {
    return [];
  }

  const rows = await supabaseFetch("/rest/v1/provider_events", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(normalizedEvents.map((event) => ({
      provider_id: providerId,
      title: event.title,
      starts_at: event.startsAt,
      location: event.location || null,
      online: event.online,
      source_url: event.sourceUrl || null,
      status: event.status,
      featured: event.featured,
      approved_by: event.status === "approved" ? event.approvedBy || null : null,
      approved_at: event.status === "approved" ? event.approvedAt || new Date().toISOString() : null,
      metadata: event.metadata,
    }))),
  });

  return rows.map(rowToProviderEvent);
}

async function listMarketSignals() {
  try {
    const rows = await supabaseFetch("/rest/v1/market_signals?select=*&order=observed_at.desc&limit=500");

    return rows.map(rowToMarketSignal);
  } catch (error) {
    if (/market_signals|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function listApprovedMarketSignals(providerIds = []) {
  const ids = providerIds.filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  try {
    const rows = await supabaseFetch(
      `/rest/v1/market_signals?select=*&provider_id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.approved&order=observed_at.desc&limit=500`
    );

    return rows.map(rowToMarketSignal);
  } catch (error) {
    if (/market_signals|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

function normalizeMarketSignalType(value, fallback = "news") {
  const type = String(value || "").trim().toLowerCase();

  return MARKET_SIGNAL_TYPES.has(type) ? type : fallback;
}

function normalizeMarketSignalStatus(value, fallback = "scraped") {
  const status = String(value || "").trim().toLowerCase();

  return MARKET_SIGNAL_STATUSES.has(status) ? status : fallback;
}

async function replaceProviderMarketSignals(providerId, signals = []) {
  const normalizedSignals = (Array.isArray(signals) ? signals : [])
    .map((signal) => ({
      id: signal.id || "",
      signalType: normalizeMarketSignalType(signal.signalType || signal.signal_type),
      title: String(signal.title || "").trim(),
      sourceUrl: String(signal.sourceUrl || signal.source_url || "").trim(),
      status: normalizeMarketSignalStatus(signal.status),
      approvedBy: String(signal.approvedBy || signal.approved_by || "").trim(),
      approvedAt: signal.approvedAt || signal.approved_at || null,
      observedAt: signal.observedAt || signal.observed_at || "",
      metadata: signal.metadata && typeof signal.metadata === "object" ? signal.metadata : {},
    }))
    .filter((signal) => signal.title || signal.sourceUrl)
    .map((signal) => ({
      ...signal,
      title: signal.title || "Untitled market signal",
      observedAt: signal.observedAt && !Number.isNaN(new Date(signal.observedAt).getTime())
        ? new Date(signal.observedAt).toISOString()
        : new Date().toISOString(),
    }));

  await supabaseFetch(`/rest/v1/market_signals?provider_id=eq.${encodeURIComponent(providerId)}`, {
    method: "DELETE",
  });

  if (normalizedSignals.length === 0) {
    return [];
  }

  const rows = await supabaseFetch("/rest/v1/market_signals", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(normalizedSignals.map((signal) => ({
      provider_id: providerId,
      signal_type: signal.signalType,
      title: signal.title,
      source_url: signal.sourceUrl || null,
      status: signal.status,
      approved_by: signal.status === "approved" ? signal.approvedBy || null : null,
      approved_at: signal.status === "approved" ? signal.approvedAt || new Date().toISOString() : null,
      observed_at: signal.observedAt,
      metadata: signal.metadata,
    }))),
  });

  return rows.map(rowToMarketSignal);
}

async function listActivityEvents() {
  try {
    const rows = await supabaseFetch("/rest/v1/activity_events?select=*&order=created_at.desc&limit=100");

    return rows.map(rowToActivityEvent);
  } catch (error) {
    if (/activity_events|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

async function listReviewerFeedback() {
  try {
    const rows = await supabaseFetch("/rest/v1/reviewer_feedback?select=*&order=created_at.desc&limit=200");

    return rows.map(rowToReviewerFeedback);
  } catch (error) {
    if (/reviewer_feedback|relation|PGRST205|42P01/i.test(error.message)) {
      return [];
    }

    throw error;
  }
}

function incrementCount(target, key, amount = 1) {
  const normalizedKey = String(key || "unknown").trim() || "unknown";
  target[normalizedKey] = (target[normalizedKey] || 0) + amount;
}

function emailDomain(value) {
  return String(value || "").trim().toLowerCase().split("@").at(1) || "";
}

function providerDomainMatchesEmail(providerDomain, email) {
  const domain = normalizeDomain(providerDomain);
  const mailDomain = normalizeDomain(emailDomain(email));

  return Boolean(domain && mailDomain && (mailDomain === domain || mailDomain.endsWith(`.${domain}`)));
}

async function checkTableReadiness(check) {
  try {
    await supabaseFetch(
      `/rest/v1/${check.table}?select=${check.columns.map(encodeURIComponent).join(",")}&limit=0`
    );

    return {
      table: check.table,
      required: check.required,
      ok: true,
      columns: check.columns,
    };
  } catch (error) {
    return {
      table: check.table,
      required: check.required,
      ok: false,
      columns: check.columns,
      error: error.message,
    };
  }
}

async function checkSupabaseReadiness() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      configured: false,
      tables: [],
      warnings: [{
        severity: "error",
        title: "Supabase is not configured",
        detail: "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      }],
    };
  }

  const tables = await Promise.all(SPRINT2_SCHEMA_CHECKS.map(checkTableReadiness));
  const warnings = tables
    .filter((table) => !table.ok)
    .map((table) => ({
      severity: table.required ? "error" : "warning",
      title: table.required ? `Required table not ready: ${table.table}` : `Optional feature table missing: ${table.table}`,
      detail: table.error,
    }));

  return {
    ok: warnings.every((warning) => warning.severity !== "error"),
    configured: true,
    checkedAt: new Date().toISOString(),
    tables,
    warnings,
  };
}

function checkDeploymentReadiness() {
  const env = DEPLOYMENT_ENV_VARS.map((name) => ({
    name,
    present: Boolean(process.env[name]),
  }));
  const routes = DEPLOYMENT_API_ROUTES.map((route) => ({
    route,
    exists: fs.existsSync(path.resolve(process.cwd(), route)),
  }));
  const warnings = [
    ...env
      .filter((item) => !item.present)
      .map((item) => ({
        severity: item.name === "OPENROUTER_API_KEY" ? "warning" : "error",
        title: `Missing env var: ${item.name}`,
        detail: item.name === "OPENROUTER_API_KEY"
          ? "Outreach generation will fail until this is set."
          : "Admin or Supabase API routes need this in deployment.",
      })),
    ...routes
      .filter((item) => !item.exists)
      .map((item) => ({
        severity: "error",
        title: `Missing API route: ${item.route}`,
        detail: "The route file is required for Sprint 2 admin workflows.",
      })),
  ];

  return {
    ok: warnings.every((warning) => warning.severity !== "error"),
    checkedAt: new Date().toISOString(),
    env,
    routes,
    warnings,
  };
}

async function getOperationalReadiness() {
  const [schema, deployment] = await Promise.all([
    checkSupabaseReadiness(),
    Promise.resolve(checkDeploymentReadiness()),
  ]);

  return {
    ok: schema.ok && deployment.ok,
    schema,
    deployment,
    auditHistory: CANONICAL_AUDIT_HISTORY,
    warnings: [...(schema.warnings || []), ...(deployment.warnings || [])],
  };
}

// Canonical audit history is activity_events plus reviewer_feedback. Legacy
// provider.activityLog entries are included here only as a migration fallback.
function buildActivityTimeline({ providers = [], claimRequests = [], providerLeads = [], activityEvents = [], reviewerFeedback = [] } = {}) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const providerByDomain = new Map(providers.map((provider) => [provider.domain, provider]));
  const entries = activityEvents.map((event) => {
    const provider = providerById.get(event.providerId);

    return {
      type: event.eventType,
      label: event.label,
      summary: event.summary,
      actorEmail: event.actorEmail,
      providerDomain: provider?.domain || "",
      providerName: provider?.companyName || provider?.company_name || "",
      createdAt: event.createdAt,
    };
  });

  for (const provider of providers) {
    for (const entry of Array.isArray(provider.activityLog) ? provider.activityLog : []) {
      entries.push({
        type: entry.type || "profile_activity",
        label: entry.label || "Profile activity",
        summary: entry.summary || "",
        actorEmail: entry.adminEmail || entry.admin_email || entry.by || "",
        providerDomain: provider.domain || "",
        providerName: provider.companyName || provider.company_name || provider.domain || "",
        createdAt: entry.createdAt || entry.created_at || entry.at,
      });
    }
  }

  for (const request of claimRequests) {
    const provider = providerByDomain.get(request.domain);
    entries.push({
      type: request.requestType === "removal" ? "removal_requested" : "claim_requested",
      label: request.requestType === "removal" ? "Removal requested" : "Claim requested",
      summary: `${request.email} submitted a ${request.requestType || "claim"} request.`,
      actorEmail: request.email,
      providerDomain: request.domain,
      providerName: provider?.companyName || provider?.company_name || request.domain,
      createdAt: request.createdAt,
    });
  }

  for (const lead of providerLeads) {
    const provider = providerByDomain.get(lead.domain);
    entries.push({
      type: "lead_submitted",
      label: "Lead submitted",
      summary: `${lead.email} requested a brokered introduction.`,
      actorEmail: lead.email,
      providerDomain: lead.domain,
      providerName: provider?.companyName || provider?.company_name || lead.domain,
      createdAt: lead.createdAt,
    });
  }

  for (const feedback of reviewerFeedback) {
    const provider = providerById.get(feedback.providerId);
    entries.push({
      type: "reviewer_feedback",
      label: "Reviewer feedback",
      summary: [
        feedback.feedback ? `feedback ${feedback.feedback}` : "",
        feedback.statusFrom || feedback.statusTo ? `${feedback.statusFrom || "unknown"} to ${feedback.statusTo || "unknown"}` : "",
        feedback.notes || "",
      ].filter(Boolean).join("; "),
      actorEmail: feedback.reviewerEmail,
      providerDomain: provider?.domain || "",
      providerName: provider?.companyName || provider?.company_name || "",
      createdAt: feedback.createdAt,
    });
  }

  return entries
    .filter((entry) => entry.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 100);
}

function buildOperationalMetrics({
  providers = [],
  jobs = [],
  claimRequests = [],
  providerLeads = [],
  outreachMessages = [],
  successStories = [],
  providerEvents = [],
  marketSignals = [],
} = {}) {
  const statusCounts = {};
  const outreachStatusCounts = {};
  const signalCounts = {};
  const now = Date.now();

  for (const provider of providers) {
    incrementCount(statusCounts, normalizeLifecycleStatus(provider.status));
  }

  for (const message of outreachMessages) {
    incrementCount(outreachStatusCounts, message.status || "draft");
  }

  for (const signal of marketSignals) {
    const type = signal.signalType || "news";
    signalCounts[type] ||= {};
    incrementCount(signalCounts[type], signal.status || "scraped");
  }

  return {
    profilesByStatus: statusCounts,
    approvedProfiles: statusCounts.approved || 0,
    outreachPending: statusCounts.outreach_pending || 0,
    outreachActive: statusCounts.outreach_active || 0,
    claimedProfiles: providers.filter((provider) => provider.claimed || normalizeLifecycleStatus(provider.status) === "claimed").length,
    removalRequests: claimRequests.filter((request) => request.requestType === "removal" && request.status === "pending").length +
      (statusCounts.removal_requested || 0),
    leadsSubmitted: providerLeads.length,
    openLeads: providerLeads.filter((lead) => lead.status === "new").length,
    approvedSuccessStories: successStories.filter((story) => story.status === "approved").length,
    upcomingApprovedEvents: providerEvents.filter((event) => (
      event.status === "approved" && new Date(event.startsAt).getTime() >= now
    )).length,
    signalsByTypeAndStatus: signalCounts,
    scrapeFailures: jobs.filter((job) => job.status === "failed").length,
    reviewBacklog: providers.filter((provider) => ["scraped", "in_review"].includes(normalizeLifecycleStatus(provider.status))).length,
    lowConfidenceProfiles: providers.filter((provider) => confidenceScoreForProfile(provider) < CONFIDENCE_GUARDRAIL_SCORE).length,
    outreachMessagesByStatus: outreachStatusCounts,
    emailEngagement: {
      sent: outreachStatusCounts.sent || 0,
      opened: outreachStatusCounts.opened || 0,
      clicked: outreachStatusCounts.clicked || 0,
      replied: outreachStatusCounts.replied || 0,
      enabled: false,
    },
  };
}

function mergeSuccessStoriesIntoProfiles(profiles = [], successStories = []) {
  const storiesByProviderId = new Map();

  for (const story of successStories) {
    const existingStories = storiesByProviderId.get(story.providerId) || [];
    existingStories.push(story);
    storiesByProviderId.set(story.providerId, existingStories);
  }

  return profiles.map((profile) => {
    const approvedStories = storiesByProviderId.get(profile.id) || [];

    if (approvedStories.length === 0) {
      return profile;
    }

    return {
      ...profile,
      successStories: approvedStories.map((story) => ({
        title: story.title,
        shortText: story.shortText,
        link: story.link || story.sourceUrl,
        sourceUrl: story.sourceUrl,
        featured: story.featured,
      })),
    };
  });
}

function mergeProviderEventsIntoProfiles(profiles = [], providerEvents = []) {
  const eventsByProviderId = new Map();

  for (const event of providerEvents) {
    const existingEvents = eventsByProviderId.get(event.providerId) || [];
    existingEvents.push(event);
    eventsByProviderId.set(event.providerId, existingEvents);
  }

  return profiles.map((profile) => ({
    ...profile,
    providerEvents: (eventsByProviderId.get(profile.id) || []).map((event) => ({
      title: event.title,
      startsAt: event.startsAt,
      location: event.location,
      online: event.online,
      sourceUrl: event.sourceUrl,
      featured: event.featured,
    })),
  }));
}

function mergeMarketSignalsIntoProfiles(profiles = [], marketSignals = []) {
  const signalsByProviderId = new Map();

  for (const signal of marketSignals) {
    const existingSignals = signalsByProviderId.get(signal.providerId) || [];
    existingSignals.push(signal);
    signalsByProviderId.set(signal.providerId, existingSignals);
  }

  return profiles.map((profile) => ({
    ...profile,
    marketSignals: (signalsByProviderId.get(profile.id) || []).map((signal) => ({
      signalType: signal.signalType,
      title: signal.title,
      sourceUrl: signal.sourceUrl,
      observedAt: signal.observedAt,
      metadata: signal.metadata || {},
    })),
  }));
}

async function createClaimRequest({ domain, email, requestType = "claim", metadata = {} } = {}) {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedType = CLAIM_REQUEST_TYPES.has(String(requestType || "").trim().toLowerCase())
    ? String(requestType || "").trim().toLowerCase()
    : "claim";

  if (!normalizedDomain) {
    throw new Error("Provider domain is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("A valid email is required.");
  }

  const provider = await findProviderByDomain(normalizedDomain);
  const domainMatch = providerDomainMatchesEmail(normalizedDomain, normalizedEmail);
  const verificationMethod = normalizedType === "claim"
    ? (domainMatch ? "email_domain_match" : "email_domain_mismatch")
    : "manual_review";
  const rows = await supabaseFetch("/rest/v1/claim_requests", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      provider_id: provider?.id || null,
      domain: normalizedDomain,
      email: normalizedEmail,
      request_type: normalizedType,
      status: "pending",
      verification_method: verificationMethod,
      metadata: {
        ...metadata,
        emailDomain: emailDomain(normalizedEmail),
        domainMatch,
      },
    }),
  });

  return rows[0];
}

async function logActivityEvent({
  providerId,
  eventType,
  label,
  summary,
  actorEmail,
  metadata = {},
} = {}) {
  try {
    const rows = await supabaseFetch("/rest/v1/activity_events", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        provider_id: providerId || null,
        event_type: eventType,
        label,
        summary: summary || null,
        actor_email: actorEmail || null,
        metadata,
      }),
    });

    return rows[0] || null;
  } catch (error) {
    if (/activity_events|relation|PGRST205|42P01/i.test(error.message)) {
      return null;
    }

    throw error;
  }
}

async function logReviewerFeedback(providerId, {
  reviewerEmail,
  feedback,
  statusFrom,
  statusTo,
  scraperQualityLog = {},
  metadata = {},
} = {}) {
  const normalizedFeedback = String(feedback || "").trim().toLowerCase();

  if (!["up", "down", "neutral"].includes(normalizedFeedback)) {
    return null;
  }

  try {
    const rows = await supabaseFetch("/rest/v1/reviewer_feedback", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        provider_id: providerId,
        reviewer_email: reviewerEmail || null,
        feedback: normalizedFeedback,
        status_from: statusFrom || null,
        status_to: statusTo || null,
        quality_missing: Array.isArray(scraperQualityLog.missing) ? scraperQualityLog.missing : [],
        quality_incorrect: Array.isArray(scraperQualityLog.incorrect) ? scraperQualityLog.incorrect : [],
        quality_added: Array.isArray(scraperQualityLog.added) ? scraperQualityLog.added : [],
        notes: scraperQualityLog.notes || null,
        metadata,
      }),
    });

    return rows[0] || null;
  } catch (error) {
    if (/reviewer_feedback|relation|PGRST205|42P01/i.test(error.message)) {
      return null;
    }

    throw error;
  }
}

async function reviewClaimRequest(id, { status, reviewedBy } = {}) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (!["approved", "rejected"].includes(normalizedStatus)) {
    throw new Error("Claim request status must be approved or rejected.");
  }

  const requestRows = await supabaseFetch(
    `/rest/v1/claim_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  const current = requestRows[0];

  if (!current) {
    throw new Error("Claim request not found.");
  }

  const provider = current.provider_id
    ? (await supabaseFetch(`/rest/v1/providers?select=*&id=eq.${encodeURIComponent(current.provider_id)}&limit=1`))[0]
    : await findProviderByDomain(current.domain);
  const reviewedAt = new Date().toISOString();
  const rows = await supabaseFetch(`/rest/v1/claim_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      status: normalizedStatus,
      reviewed_by: reviewedBy || null,
      reviewed_at: reviewedAt,
    }),
  });
  const reviewedRequest = rowToClaimRequest(rows[0]);
  const eventType = current.request_type === "removal"
    ? (normalizedStatus === "approved" ? "removal_requested" : "removal_rejected")
    : (normalizedStatus === "approved" ? "claim_verified" : "claim_rejected");
  const label = current.request_type === "removal"
    ? (normalizedStatus === "approved" ? "Removal approved" : "Removal rejected")
    : (normalizedStatus === "approved" ? "Claim verified" : "Claim rejected");

  if (provider && normalizedStatus === "approved") {
    const providerPatch = current.request_type === "removal"
      ? {
          status: "removal_requested",
          claimed: false,
          removal_requested_at: reviewedAt,
        }
      : {
          status: "claimed",
          claimed: true,
          claimed_by_email: current.email,
          claimed_at: reviewedAt,
          claim_verification_method: current.verification_method || "manual_review",
        };

    await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(provider.id)}`, {
      method: "PATCH",
      body: JSON.stringify(providerPatch),
    });
  }

  await logActivityEvent({
    providerId: provider?.id || current.provider_id || null,
    eventType,
    label,
    summary: `${current.email} ${normalizedStatus} for ${current.domain}.`,
    actorEmail: reviewedBy,
    metadata: {
      claimRequestId: id,
      requestType: current.request_type,
      requesterEmail: current.email,
      verificationMethod: current.verification_method,
    },
  });

  return reviewedRequest;
}

async function createProviderLead({ domain, name, company, email, message, metadata = {} } = {}) {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedMessage = String(message || "").trim();

  if (!normalizedDomain) {
    throw new Error("Provider domain is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("A valid email is required.");
  }

  if (normalizedMessage.length < 10) {
    throw new Error("Please include a short message.");
  }

  const provider = await findProviderByDomain(normalizedDomain);
  const rows = await supabaseFetch("/rest/v1/provider_leads", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      provider_id: provider?.id || null,
      domain: normalizedDomain,
      name: String(name || "").trim() || null,
      company: String(company || "").trim() || null,
      email: normalizedEmail,
      message: normalizedMessage,
      status: "new",
      metadata,
    }),
  });

  return rows[0];
}

function profileToRow(profile, status = "scraped") {
  const normalizedProfile = normalizeProfile(profile);
  const requestedStatus = normalizedProfile.claimed ? "claimed" : normalizeLifecycleStatus(status);
  const normalizedStatus = automaticStatusForConfidence(requestedStatus, normalizedProfile);

  return {
    domain: normalizedProfile.domain,
    country: normalizedProfile.companyLocation.country,
    city: normalizedProfile.companyLocation.city,
    company_name: normalizedProfile.companyName,
    website: normalizedProfile.website,
    description: normalizedProfile.description,
    services: normalizedProfile.services,
    focus_areas: normalizedProfile.focusAreas,
    industries: normalizedProfile.industries,
    technologies: normalizedProfile.technologies,
    vendor_partnerships: normalizedProfile.vendorPartnerships,
    success_stories: normalizedProfile.successStories,
    solutions: normalizedProfile.solutions,
    location: normalizedProfile.location,
    confidence_score: normalizedProfile.confidenceScore,
    github_url: normalizedProfile.githubUrl,
    linkedin_url: normalizedProfile.linkedinUrl,
    logo_url: normalizedProfile.logoUrl,
    claimed: normalizedProfile.claimed,
    claimed_by_email: normalizedProfile.claimedByEmail || null,
    claimed_at: normalizedProfile.claimedAt || null,
    claim_verification_method: normalizedProfile.claimVerificationMethod || null,
    removal_requested_at: normalizedProfile.removalRequestedAt || null,
    removed_at: normalizedProfile.removedAt || null,
    subscription_tier: normalizedProfile.subscriptionTier,
    recent_activity: normalizedProfile.recentActivity,
    review_notes: normalizedProfile.reviewNotes,
    scraper_quality_log: normalizedProfile.scraperQualityLog,
    activity_log: normalizedProfile.activityLog || [],
    files: normalizedProfile.files,
    source_data: normalizedProfile.sourceData,
    status: normalizedStatus,
  };
}

function jobPatchToRow(patch = {}) {
  return {
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.error !== undefined ? { error: patch.error } : {}),
    ...(patch.resultProviderId !== undefined ? { result_provider_id: patch.resultProviderId } : {}),
  };
}

async function loadBundledProfiles() {
  const profilesPath = path.resolve(process.cwd(), "public", "profiles.json");

  if (!(await fs.pathExists(profilesPath))) {
    return [];
  }

  const profiles = await fs.readJson(profilesPath);

  return normalizeProfiles(profiles);
}

async function seedPublishedProvidersIfMissing(providers) {
  const hasPublishedProviders = providers.some((provider) => PUBLIC_PROVIDER_STATUSES.includes(normalizeLifecycleStatus(provider.status)));

  if (hasPublishedProviders) {
    return providers;
  }

  const bundledProfiles = await loadBundledProfiles();

  if (bundledProfiles.length === 0) {
    return providers;
  }

  const existingDomains = new Set(
    providers
      .map((provider) => provider.domain)
      .filter(Boolean)
  );
  const rows = bundledProfiles
    .filter((profile) => !existingDomains.has(profile?.domain))
    .filter((profile) => profile?.domain && (profile.companyName || profile.domain))
    .map((profile) => profileToRow(profile, "approved"));

  if (rows.length === 0) {
    return providers;
  }

  await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  return supabaseFetch("/rest/v1/providers?select=*&order=status.asc,company_name.asc&limit=1000");
}

function tagRowsFromProviders(providers = [], status = "approved") {
  const byKey = new Map();

  providers.forEach((provider) => {
    ["services", "industries", "technologies", "vendor_partnerships"].forEach((category) => {
      tagValuesForCategory(provider, category).forEach((value) => {
        const name = normalizeTagName(value);
        const normalizedName = normalizeTagKey(name);

        if (!name || byKey.has(`${category}:${normalizedName}`)) {
          return;
        }

        byKey.set(`${category}:${normalizedName}`, {
          category,
          name,
          normalized_name: normalizedName,
          status,
        });
      });
    });
  });

  return [...byKey.values()];
}

function tagRowToClient(row = {}) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    status: row.status,
    mergeTarget: row.merge_target || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingTagTaxonomyTable(error) {
  const message = String(error?.message || "");

  return message.includes("tag_taxonomy") || message.includes("PGRST205") || message.includes("42P01");
}

async function syncExistingTagsFromProviders(providers = []) {
  const rows = tagRowsFromProviders(providers, "approved");

  if (rows.length === 0) {
    return;
  }

  try {
    await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(rows),
    });
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }
  }
}

async function syncCandidateTagsFromProfile(profile = {}) {
  const rows = tagRowsFromProviders([profile], "candidate");

  if (rows.length === 0) {
    return;
  }

  try {
    await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(rows),
    });
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }
  }
}

async function listTagTaxonomy(providerRows = []) {
  try {
    const rows = await supabaseFetch("/rest/v1/tag_taxonomy?select=*&order=category.asc,status.asc,name.asc");

    return rows.map(tagRowToClient);
  } catch (error) {
    if (!isMissingTagTaxonomyTable(error)) {
      throw error;
    }

    return tagRowsFromProviders(providerRows, "approved").map((row) => tagRowToClient({
      ...row,
      id: `${row.category}:${row.normalized_name}`,
      merge_target: null,
    }));
  }
}

async function listApprovedTagTaxonomy() {
  const tags = await listTagTaxonomy();

  return tags.filter((tag) => tag.status === "approved");
}

async function findProviderByDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return null;
  }

  const rows = await supabaseFetch(
    `/rest/v1/providers?select=*&domain=eq.${encodeURIComponent(normalizedDomain)}&limit=1`
  );

  return rows[0] ? rowToProfile(rows[0]) : null;
}

async function findActiveScrapeJobByDomain(domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return null;
  }

  const rows = await supabaseFetch(
    `/rest/v1/scrape_jobs?select=*&domain=eq.${encodeURIComponent(normalizedDomain)}&status=in.(queued,running)&order=created_at.desc&limit=1`
  );

  return rows[0] || null;
}

function replaceTagInList(values = [], fromName, toName) {
  const fromKey = normalizeTagKey(fromName);
  const target = normalizeTagName(toName);
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => (normalizeTagKey(value) === fromKey ? target : value))
    .map(normalizeTagName)
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeTagKey(value);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

async function replaceProviderTag(category, fromName, toName) {
  const field = normalizeTagCategory(category);
  const rows = await supabaseFetch(`/rest/v1/providers?select=id,${field}`);
  const updates = rows
    .map((row) => ({
      id: row.id,
      values: replaceTagInList(row[field], fromName, toName),
      changed: JSON.stringify(row[field] || []) !== JSON.stringify(replaceTagInList(row[field], fromName, toName)),
    }))
    .filter((row) => row.changed);

  for (const update of updates) {
    await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(update.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: update.values }),
    });
  }
}

async function updateTagTaxonomy({ id, category, name, status, mergeTarget }) {
  const normalizedStatus = normalizeTagStatus(status, "approved");
  const patch = {};

  if (name !== undefined) {
    const normalizedName = normalizeTagName(name);

    if (!normalizedName) {
      throw new Error("Tag name is required.");
    }

    patch.name = normalizedName;
    patch.normalized_name = normalizeTagKey(normalizedName);
  }

  if (status !== undefined) {
    patch.status = normalizedStatus;
  }

  if (mergeTarget !== undefined) {
    const targetName = normalizeTagName(mergeTarget);

    if (!targetName) {
      throw new Error("Choose a merge target.");
    }

    patch.status = "merged";
    patch.merge_target = targetName;
  }

  if (!id) {
    const tagCategory = normalizeTagCategory(category);
    const tagName = normalizeTagName(name);

    if (!tagName) {
      throw new Error("Tag name is required.");
    }

    const rows = await supabaseFetch("/rest/v1/tag_taxonomy?on_conflict=category,normalized_name", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        category: tagCategory,
        name: tagName,
        normalized_name: normalizeTagKey(tagName),
        status: normalizedStatus,
      }),
    });

    return tagRowToClient(rows[0]);
  }

  const currentRows = await supabaseFetch(
    `/rest/v1/tag_taxonomy?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  const current = currentRows[0];

  if (!current) {
    throw new Error("Tag not found.");
  }

  const nextName = patch.name || current.name;

  if (patch.name && normalizeTagKey(patch.name) !== normalizeTagKey(current.name)) {
    await replaceProviderTag(current.category, current.name, patch.name);
  }

  if (mergeTarget !== undefined) {
    await replaceProviderTag(current.category, current.name, mergeTarget);
    patch.name = current.name;
    patch.normalized_name = normalizeTagKey(current.name);
  }

  const rows = await supabaseFetch(`/rest/v1/tag_taxonomy?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      ...patch,
      ...(mergeTarget === undefined ? { merge_target: null } : {}),
    }),
  });

  if (patch.status === "approved" || normalizedStatus === "approved") {
    await replaceProviderTag(current.category, current.name, nextName);
  }

  return tagRowToClient(rows[0]);
}

async function signInWithPassword(email, password) {
  const config = supabaseConfig();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!config.url || !config.anonKey) {
    throw new Error("Supabase Auth is not configured");
  }

  if (!config.adminEmails.includes(normalizedEmail)) {
    throw new Error("This email is not allowed to access admin.");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const payload = JSON.parse(text);
      message = payload.msg || payload.message || payload.error_description || payload.error || text;
    } catch (error) {
      message = text;
    }

    throw new Error(message || "Invalid admin email or password");
  }

  const payload = await response.json();
  const userEmail = String(payload.user?.email || "").toLowerCase();

  if (!config.adminEmails.includes(userEmail)) {
    throw new Error("This user is not allowed to access admin.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    email: userEmail,
  };
}

async function verifyAdminToken(authHeader) {
  const config = supabaseConfig();
  const token = String(authHeader || "").replace(/^Bearer\s+/i, "");

  if (!config.url || !config.anonKey || !token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${normalizeSupabaseUrl(config.url)}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const user = await response.json();
  const email = String(user.email || "").toLowerCase();

  if (!config.adminEmails.includes(email)) {
    throw new Error("Unauthorized");
  }

  return { email, id: user.id };
}

async function listPublishedProviders() {
  const statusList = PUBLIC_PROVIDER_STATUSES.join(",");
  const rows = await supabaseFetch(
    `/rest/v1/providers?select=*&status=in.(${statusList})&order=company_name.asc`
  );
  const profiles = rows.map(rowToProfile);
  const providerIds = profiles.map((profile) => profile.id);
  const [successStories, providerEvents, marketSignals] = await Promise.all([
    listApprovedSuccessStories(providerIds),
    listApprovedUpcomingProviderEvents(providerIds),
    listApprovedMarketSignals(providerIds),
  ]);

  return mergeMarketSignalsIntoProfiles(
    mergeProviderEventsIntoProfiles(mergeSuccessStoriesIntoProfiles(profiles, successStories), providerEvents),
    marketSignals
  );
}

async function listAdminState() {
  const [jobs, providerRows, claimRequests, providerLeads] = await Promise.all([
    supabaseFetch("/rest/v1/scrape_jobs?select=*&order=created_at.desc&limit=100"),
    supabaseFetch("/rest/v1/providers?select=*&order=status.asc,company_name.asc&limit=1000"),
    listClaimRequests(),
    listProviderLeads(),
  ]);
  const providers = await seedPublishedProvidersIfMissing(providerRows);
  const providerIds = providers.map((provider) => provider.id);
  const [
    outreachContacts,
    outreachMessages,
    successStories,
    providerEvents,
    marketSignals,
    activityEvents,
    reviewerFeedback,
  ] = await Promise.all([
    listOutreachContacts(providerIds),
    listOutreachMessages(providerIds),
    listSuccessStories(),
    listProviderEvents(),
    listMarketSignals(),
    listActivityEvents(),
    listReviewerFeedback(),
  ]);
  const contactsByProviderId = new Map();
  const messagesByProviderId = new Map();

  for (const contact of outreachContacts) {
    const existingContacts = contactsByProviderId.get(contact.providerId) || [];
    existingContacts.push(contact);
    contactsByProviderId.set(contact.providerId, existingContacts);
  }

  for (const message of outreachMessages) {
    const existingMessages = messagesByProviderId.get(message.providerId) || [];
    existingMessages.push(message);
    messagesByProviderId.set(message.providerId, existingMessages);
  }

  const providerProfiles = providers.map((row) => ({
    ...rowToProfile(row),
    outreachContacts: contactsByProviderId.get(row.id) || [],
    outreachMessages: messagesByProviderId.get(row.id) || [],
    managedSuccessStories: successStories.filter((story) => story.providerId === row.id),
    managedProviderEvents: providerEvents.filter((event) => event.providerId === row.id),
    managedMarketSignals: marketSignals.filter((signal) => signal.providerId === row.id),
  }));
  const timeline = buildActivityTimeline({
    providers: providerProfiles,
    claimRequests,
    providerLeads,
    activityEvents,
    reviewerFeedback,
  });
  const metrics = buildOperationalMetrics({
    providers: providerProfiles,
    jobs,
    claimRequests,
    providerLeads,
    outreachMessages,
    successStories,
    providerEvents,
    marketSignals,
  });

  await syncExistingTagsFromProviders(providers);
  const tags = await listTagTaxonomy(providers);
  const readiness = await getOperationalReadiness();

  return {
    activityEvents: timeline,
    claimRequests,
    jobs,
    metrics,
    providerLeads,
    providers: providerProfiles,
    readiness,
    tags,
  };
}

async function createScrapeJob({ url, companyName, requestedBy, allowExisting = false }) {
  const domain = normalizeDomain(url);
  const existingProvider = await findProviderByDomain(domain);

  if (existingProvider && !allowExisting) {
    throw new Error(`${existingProvider.companyName || existingProvider.domain || domain} already exists.`);
  }

  const existingJob = await findActiveScrapeJobByDomain(domain);

  if (existingJob) {
    throw new Error(`${existingJob.company_name || existingJob.domain || domain} already exists as a queued scrape.`);
  }

  const rows = await supabaseFetch("/rest/v1/scrape_jobs", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      url,
      domain,
      company_name: companyName || null,
      status: "queued",
      requested_by: requestedBy,
    }),
  });

  return rows[0];
}

async function getScrapeJob(id) {
  const rows = await supabaseFetch(
    `/rest/v1/scrape_jobs?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  return rows[0] || null;
}

async function getNextQueuedScrapeJob() {
  const rows = await supabaseFetch(
    "/rest/v1/scrape_jobs?select=*&status=eq.queued&order=created_at.asc&limit=1"
  );

  return rows[0] || null;
}

async function updateScrapeJob(id, patch) {
  const rows = await supabaseFetch(`/rest/v1/scrape_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(jobPatchToRow(patch)),
  });

  return rows[0] || null;
}

async function upsertProvider(profile, status = "scraped") {
  const rows = await supabaseFetch("/rest/v1/providers?on_conflict=domain", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(profileToRow(profile, status)),
  });

  const provider = rowToProfile(rows[0]);
  await syncCandidateTagsFromProfile(provider);

  return provider;
}

async function uploadProviderLogo({ domain, filename, contentType, body }) {
  const config = supabaseConfig();
  const objectPath = `${domain}/${filename}`;
  const response = await fetch(
    `${normalizeSupabaseUrl(config.url)}/storage/v1/object/provider-logos/${objectPath}`,
    {
      method: "PUT",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": contentType,
        "Cache-Control": "3600",
        "x-upsert": "true",
      },
      body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase logo upload failed: ${response.status}`);
  }

  return `${normalizeSupabaseUrl(config.url)}/storage/v1/object/public/provider-logos/${objectPath}`;
}

async function publishProvider(id, status = "approved") {
  const normalizedStatus = normalizeLifecycleStatus(status, "approved");
  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status: normalizedStatus }),
  });

  return rowToProfile(rows[0]);
}

async function updateProvider(id, profilePatch = {}, status, { reviewedBy } = {}) {
  const normalizedStatus = status ? normalizeLifecycleStatus(status) : null;
  const previousRows = await supabaseFetch(
    `/rest/v1/providers?select=id,status&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  const previousStatus = normalizeLifecycleStatus(previousRows[0]?.status || "", "scraped");
  const rowPatch = {
    ...(profilePatch.companyName !== undefined ? { company_name: profilePatch.companyName } : {}),
    ...(profilePatch.logoUrl !== undefined ? { logo_url: profilePatch.logoUrl } : {}),
    ...(profilePatch.website !== undefined ? { website: profilePatch.website } : {}),
    ...(profilePatch.country !== undefined ? { country: profilePatch.country } : {}),
    ...(profilePatch.city !== undefined ? { city: profilePatch.city } : {}),
    ...(profilePatch.companyLocation !== undefined
      ? {
          country: profilePatch.companyLocation?.country || null,
          city: profilePatch.companyLocation?.city || null,
        }
      : {}),
    ...(profilePatch.claimed !== undefined ? { claimed: Boolean(profilePatch.claimed) } : {}),
    ...(profilePatch.claimedByEmail !== undefined ? { claimed_by_email: profilePatch.claimedByEmail || null } : {}),
    ...(profilePatch.claimedAt !== undefined ? { claimed_at: profilePatch.claimedAt || null } : {}),
    ...(profilePatch.claimVerificationMethod !== undefined ? { claim_verification_method: profilePatch.claimVerificationMethod || null } : {}),
    ...(profilePatch.removalRequestedAt !== undefined ? { removal_requested_at: profilePatch.removalRequestedAt || null } : {}),
    ...(profilePatch.removedAt !== undefined ? { removed_at: profilePatch.removedAt || null } : {}),
    ...(profilePatch.subscriptionTier !== undefined ? { subscription_tier: profilePatch.subscriptionTier || "free" } : {}),
    ...(profilePatch.services !== undefined ? { services: profilePatch.services || [] } : {}),
    ...(profilePatch.industries !== undefined ? { industries: profilePatch.industries || [] } : {}),
    ...(profilePatch.technologies !== undefined ? { technologies: profilePatch.technologies || [] } : {}),
    ...(profilePatch.vendorPartnerships !== undefined ? { vendor_partnerships: profilePatch.vendorPartnerships || [] } : {}),
    ...(profilePatch.successStories !== undefined ? { success_stories: profilePatch.successStories || [] } : {}),
    ...(profilePatch.solutions !== undefined ? { solutions: profilePatch.solutions || [] } : {}),
    ...(profilePatch.recentActivity !== undefined ? { recent_activity: profilePatch.recentActivity || [] } : {}),
    ...(profilePatch.reviewNotes !== undefined ? { review_notes: profilePatch.reviewNotes || [] } : {}),
    ...(profilePatch.scraperQualityLog !== undefined ? { scraper_quality_log: profilePatch.scraperQualityLog || {} } : {}),
    ...(profilePatch.activityLog !== undefined ? { activity_log: profilePatch.activityLog || [] } : {}),
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
  };

  const rows = await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(rowPatch),
  });

  const provider = rowToProfile(rows[0]);
  if (profilePatch.outreachContacts !== undefined) {
    provider.outreachContacts = await replaceProviderOutreachContacts(id, profilePatch.outreachContacts);
  }

  if (profilePatch.outreachMessages !== undefined) {
    provider.outreachMessages = await replaceProviderOutreachMessages(id, profilePatch.outreachMessages);
  }

  if (profilePatch.managedSuccessStories !== undefined) {
    provider.managedSuccessStories = await replaceProviderSuccessStories(id, profilePatch.managedSuccessStories);
  }

  if (profilePatch.managedProviderEvents !== undefined) {
    provider.managedProviderEvents = await replaceProviderEvents(id, profilePatch.managedProviderEvents);
  }

  if (profilePatch.managedMarketSignals !== undefined) {
    provider.managedMarketSignals = await replaceProviderMarketSignals(id, profilePatch.managedMarketSignals);
  }

  if (profilePatch.scraperQualityLog !== undefined) {
    await logReviewerFeedback(id, {
      reviewerEmail: reviewedBy,
      feedback: profilePatch.scraperQualityLog.feedback || "neutral",
      statusFrom: previousStatus,
      statusTo: normalizeLifecycleStatus(rows[0]?.status || provider.status || previousStatus),
      scraperQualityLog: profilePatch.scraperQualityLog,
      metadata: {
        providerDomain: provider.domain,
      },
    });
  }

  await syncExistingTagsFromProviders([rows[0]]);

  return provider;
}

async function deleteProvider(id) {
  await supabaseFetch(`/rest/v1/providers?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return { id, deleted: true };
}

async function deleteScrapeJob(id) {
  await supabaseFetch(`/rest/v1/scrape_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return { id, deleted: true };
}

module.exports = {
  createClaimRequest,
  createProviderLead,
  createScrapeJob,
  deleteProvider,
  deleteScrapeJob,
  getNextQueuedScrapeJob,
  getScrapeJob,
  getOperationalReadiness,
  isSupabaseConfigured,
  listAdminState,
  listApprovedTagTaxonomy,
  listOutreachContacts,
  listOutreachMessages,
  listTagTaxonomy,
  listPublishedProviders,
  logActivityEvent,
  normalizeLifecycleStatus,
  profileToRow,
  publishProvider,
  reviewClaimRequest,
  signInWithPassword,
  supabaseFetch,
  supabaseConfig,
  updateTagTaxonomy,
  updateProviderLeadStatus,
  updateScrapeJob,
  updateProvider,
  uploadProviderLogo,
  upsertProvider,
  verifyAdminToken,
};
