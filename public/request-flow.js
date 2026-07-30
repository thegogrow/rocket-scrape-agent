const form = document.querySelector("[data-request-flow]");
const message = document.querySelector("[data-request-message]");
const domainOptions = document.querySelector("#providerDomainOptions");
const legacyAccessPage = document.querySelector("[data-legacy-access-page]");
const accessElements = {
  actions: document.querySelector("#accessActions"),
  unavailable: document.querySelector("#accessUnavailable"),
  companyName: document.querySelector("#accessCompanyName"),
  domain: document.querySelector("#accessDomain"),
  status: document.querySelector("#accessStatus"),
  intro: document.querySelector("#accessIntro"),
  profileLink: document.querySelector("#accessProfileLink"),
};

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
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

function profileAccessUrl(domain) {
  return `/profile-access?domain=${encodeURIComponent(normalizeDomain(domain))}`;
}

function redirectLegacyAccessPage() {
  if (!legacyAccessPage) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const domain = normalizeDomain(params.get("domain"));

  if (domain) {
    window.location.replace(profileAccessUrl(domain));
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
      .map((domain) => `<option value="${domain}"></option>`)
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
  const requestedDomain = normalizeDomain(params.get("domain"));

  if (!requestedDomain) {
    accessElements.actions.hidden = true;
    accessElements.unavailable.hidden = false;
    accessElements.domain.textContent = "Provider not selected";
    accessElements.status.textContent = "Open this page from a provider profile or outreach link.";
    return;
  }

  form.elements.domain.value = requestedDomain;
  accessElements.domain.textContent = requestedDomain;
  accessElements.status.textContent = "Loading profile details";

  const profiles = await loadProfiles();
  const profile = profiles.find((item) => normalizeDomain(item.domain) === requestedDomain);
  const claimed = Boolean(profile?.claimed);
  const status = claimed ? "claimed" : profile?.status || "unclaimed";

  accessElements.companyName.textContent = profile?.companyName
    ? `${profile.companyName} profile access`
    : `${requestedDomain} profile access`;
  accessElements.intro.textContent = profile?.companyName
    ? `Rocket Engineers has a provider profile for ${profile.companyName}. Use this page to request ownership review or removal for this company only.`
    : "Use this provider-specific page to request ownership review or removal for this company only.";
  accessElements.status.textContent = `${titleCase(status)} profile`;
  accessElements.profileLink.href = `/?provider=${encodeURIComponent(requestedDomain)}`;
  accessElements.profileLink.hidden = false;

  if (!profile) {
    accessElements.status.textContent = "Profile details unavailable; request can still be reviewed manually.";
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

  try {
    if (flow === "lead") {
      await submitJson("/api/provider-lead", data);
      setMessage("Request received. Rocket Engineers will review it before any introduction.");
    } else {
      const requestType = flow === "access"
        ? submitter?.value || data.requestType || "claim"
        : flow === "removal" ? "removal" : "claim";

      await submitJson("/api/claim-request", {
        domain: data.domain,
        email: data.email,
        requestType,
        metadata: {
          source: flow === "access" ? "provider_access_page" : "public_profile",
          message: data.message || "",
        },
      });
      setMessage(requestType === "removal"
        ? "Removal request received for manual review."
        : "Claim request received for manual verification.");
    }

    const submittedDomain = data.domain;
    form.reset();

    if (flow === "access") {
      form.elements.domain.value = submittedDomain;
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
