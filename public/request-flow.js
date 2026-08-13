const form = document.querySelector("[data-request-flow]");
const message = document.querySelector("[data-request-message]");
const domainOptions = document.querySelector("#providerDomainOptions");
const legacyAccessPage = document.querySelector("[data-legacy-access-page]");
const accessElements = {
  actions: document.querySelector("#accessActions"),
  companyName: document.querySelector("#accessCompanyName"),
  domain: document.querySelector("#accessDomain"),
  status: document.querySelector("#accessStatus"),
  intro: document.querySelector("#accessIntro"),
  profileLink: document.querySelector("#accessProfileLink"),
  existingRequest: document.querySelector("#accessExistingRequest"),
};

const REQUEST_STATUS_LABEL = { pending: "pending review", approved: "approved", rejected: "declined" };

function formatRequestDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  try {
    return new Date(isoDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch (error) {
    return "";
  }
}

// Shown instead of the form once a request already exists for this link, so
// reopening it later (or right after submitting) doesn't look like a blank,
// unused page inviting a duplicate submission.
function showExistingRequestNotice({ requestType, status, createdAt }) {
  if (!accessElements.existingRequest || !form) {
    return;
  }

  const actionLabel = requestType === "removal" ? "removal" : "claim";
  const statusLabel = REQUEST_STATUS_LABEL[status] || status;
  const dateLabel = formatRequestDate(createdAt);

  accessElements.existingRequest.textContent = `You already submitted a ${actionLabel} request${dateLabel ? ` on ${dateLabel}` : ""}. Status: ${statusLabel}. We'll email you once it's reviewed if it's still pending.`;
  accessElements.existingRequest.hidden = false;
  form.hidden = true;
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function normalizeDomain(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch (error) {
    return text.replace(/^www\./i, "").toLowerCase();
  }
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function profileAccessUrl(token) {
  return `/profile-access?token=${encodeURIComponent(token)}`;
}

function redirectLegacyAccessPage() {
  if (!legacyAccessPage) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    window.location.replace(profileAccessUrl(token));
    return true;
  }

  return false;
}

async function loadProfiles() {
  let response = await fetch("/api/profiles");

  if (!response.ok) {
    response = await fetch("/profiles.json");
  }

  if (!response.ok) {
    return [];
  }

  const profiles = await response.json();

  return Array.isArray(profiles) ? profiles : [];
}

async function loadProviderOptions() {
  if (!domainOptions || !form || form.dataset.requestFlow === "access") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedDomain = normalizeDomain(params.get("domain"));

  if (requestedDomain) {
    form.elements.domain.value = requestedDomain;
  }

  try {
    const profiles = await loadProfiles();
    const domains = profiles
      .map((profile) => normalizeDomain(profile.domain))
      .filter(Boolean)
      .slice(0, 250);

    domainOptions.innerHTML = domains
      .map((domain) => `<option value="${escapeHtml(domain)}"></option>`)
      .join("");
  } catch (error) {
    // The form remains usable with manual domain entry.
  }
}

async function loadProviderAccess() {
  if (!form || form.dataset.requestFlow !== "access") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    accessElements.actions.hidden = true;
    accessElements.domain.textContent = "Provider not selected";
    accessElements.status.textContent = "Open this page from a provider profile or outreach link.";
    return;
  }

  form.elements.token.value = token;
  accessElements.status.textContent = "Loading profile details";

  let link = null;

  try {
    const response = await fetch(`/api/resolve-outreach-link?token=${encodeURIComponent(token)}`);
    link = response.ok ? await response.json() : null;
  } catch (error) {
    link = null;
  }

  if (!link) {
    accessElements.actions.hidden = true;
    accessElements.domain.textContent = "Link not found";
    accessElements.status.textContent = "This link is invalid or has expired. Reply to the outreach email for a new one.";
    return;
  }

  form.elements.domain.value = link.domain;
  accessElements.domain.textContent = link.domain;
  const status = link.claimed ? "claimed" : link.status || "unclaimed";

  accessElements.companyName.textContent = link.companyName
    ? `${link.companyName} profile access`
    : `${link.domain} profile access`;
  accessElements.intro.textContent = link.companyName
    ? `Rocket Engineers has a provider profile for ${link.companyName}. Use this page to request ownership review or removal for this company only.`
    : "Use this provider-specific page to request ownership review or removal for this company only.";
  accessElements.status.textContent = `${titleCase(status)} profile`;
  accessElements.profileLink.href = `/?provider=${encodeURIComponent(link.domain)}`;
  accessElements.profileLink.hidden = false;

  if (link.existingRequest) {
    showExistingRequestNotice(link.existingRequest);
  }
}

async function submitJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

async function handleSubmit(event) {
  event.preventDefault();

  const submitButtons = Array.from(form.querySelectorAll("button[type='submit']"));
  const flow = form.dataset.requestFlow;
  const data = Object.fromEntries(new FormData(form).entries());
  const submitter = event.submitter;
  data.domain = normalizeDomain(data.domain);

  submitButtons.forEach((button) => {
    button.disabled = true;
  });
  setMessage("Submitting request...");

  const requestType = flow === "access"
    ? submitter?.value || data.requestType || "claim"
    : flow === "removal" ? "removal" : "claim";

  try {
    if (flow === "lead") {
      await submitJson("/api/provider-lead", data);
      setMessage("Request received. Rocket Engineers will review it before any introduction.");
    } else {
      await submitJson("/api/claim-request", {
        domain: data.domain,
        email: data.email,
        requestType,
        token: flow === "access" ? data.token : undefined,
        metadata: {
          source: flow === "access" ? "provider_access_page" : "public_profile",
          message: data.message || "",
        },
      });
      setMessage(requestType === "removal"
        ? `Removal request received. We'll review it and email ${data.email} once it's decided.`
        : `Claim request received. We'll review it and email ${data.email} once it's decided.`);
    }

    if (flow === "access") {
      // Don't reset-and-reshow the form - it's already answered now, so keep
      // it answered (matches reopening the same link later, which now shows
      // the same notice via the existingRequest check on page load).
      showExistingRequestNotice({ requestType, status: "pending", createdAt: new Date().toISOString() });
    } else {
      form.reset();
    }
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    submitButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

if (!redirectLegacyAccessPage()) {
  if (form) {
    form.addEventListener("submit", handleSubmit);
    loadProviderAccess();
    loadProviderOptions();
  }
}
