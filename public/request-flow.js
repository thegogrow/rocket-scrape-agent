const form = document.querySelector("[data-request-flow]");
const message = document.querySelector("[data-request-message]");
const domainOptions = document.querySelector("#providerDomainOptions");
const legacyAccessPage = document.querySelector("[data-legacy-access-page]");

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

// claim.html/remove.html no longer host a request form directly - a
// provider-specific outreach link now lands on the self-serve editor at
// /profile-access instead. Keep redirecting any old ?token= links here so
// already-sent emails and bookmarks keep working.
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
  if (!domainOptions || !form) {
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
  data.domain = normalizeDomain(data.domain);

  submitButtons.forEach((button) => {
    button.disabled = true;
  });
  setMessage("Submitting request...");

  try {
    if (flow === "lead") {
      await submitJson("/api/provider-lead", data);
      setMessage("Request received. Rocket Engineers will review it before any introduction.");
    }

    form.reset();
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
    loadProviderOptions();
  }
}
