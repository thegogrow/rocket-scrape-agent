// Self-serve profile editor for public/profile-access.html - lets a company
// edit its own listing from the claim link and publish immediately. Field
// helpers here (escapeHtml, logo preview, focus codes) intentionally mirror
// the read-only rendering in public/app.js (renderDetail and friends) so
// this page looks like the public profile it's editing. Kept as small,
// duplicated pure functions rather than importing app.js, since app.js is a
// non-module script wired to the list/filter page state this page doesn't have.

const elements = {
  accessDomain: document.querySelector("#accessDomain"),
  accessStatus: document.querySelector("#accessStatus"),
  statusBanner: document.querySelector("#accessStatusBanner"),
  statusMessage: document.querySelector("#accessStatusMessage"),
  introBar: document.querySelector("#accessIntroBar"),
  companyName: document.querySelector("#accessCompanyName"),
  profileLink: document.querySelector("#accessProfileLink"),
  editForm: document.querySelector("#ownerEditForm"),
  editFieldset: document.querySelector("#editFieldset"),
  logoPreview: document.querySelector("#logoPreview"),
  logoFile: document.querySelector("#fieldLogoFile"),
  logoUploadStatus: document.querySelector("#logoUploadStatus"),
  verifiedBadge: document.querySelector("#verifiedBadge"),
  domainLine: document.querySelector("#domainLine"),
  focusStrip: document.querySelector("#focusStrip"),
  saveBar: document.querySelector("#saveBar"),
  saveButton: document.querySelector("#saveButton"),
  saveMessage: document.querySelector("[data-save-message]"),
  removalPanel: document.querySelector("#removalPanel"),
  removalForm: document.querySelector("#removalForm"),
  removalMessage: document.querySelector("[data-removal-message]"),
};

const fields = {
  companyName: document.querySelector("#fieldCompanyName"),
  description: document.querySelector("#fieldDescription"),
  logoUrl: document.querySelector("#fieldLogoUrl"),
  website: document.querySelector("#fieldWebsite"),
  country: document.querySelector("#fieldCountry"),
  city: document.querySelector("#fieldCity"),
  linkedinUrl: document.querySelector("#fieldLinkedin"),
  githubUrl: document.querySelector("#fieldGithub"),
};

const state = {
  token: "",
  domain: "",
  tags: { services: [], technologies: [], industries: [] },
};

const tagInputs = {};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initials(companyName, domain) {
  return String(companyName || domain || "?")
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function updateLogoPreview() {
  const label = escapeHtml(fields.companyName.value || state.domain);
  const fallback = escapeHtml(initials(fields.companyName.value, state.domain));
  const url = fields.logoUrl.value.trim();

  elements.logoPreview.innerHTML = url
    ? `<img src="${escapeHtml(url)}" alt="${label} logo" onerror="this.parentElement.textContent='${fallback}'" />`
    : fallback;
}

function updateFocusStrip() {
  const text = [fields.description.value, tagInputs.services?.getValues(), tagInputs.technologies?.getValues()]
    .flat(2)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const codes = [];

  if (/cloud|aws|azure|gcp|kubernetes|k8s|platform/.test(text)) codes.push(["CLD", "Cloud"]);
  if (/platform|developer|devops|gitops|ci\/cd|sre/.test(text)) codes.push(["PLT", "Platform Engineering"]);
  if (/security|zero trust|compliance|cyber/.test(text)) codes.push(["SEC", "Security"]);
  if (/\bai\b|data|machine learning|analytics|mlops/.test(text)) codes.push(["AI", "AI & Data"]);

  const finalCodes = codes.length ? codes.slice(0, 3) : [["ENG", "Engineering"]];

  elements.focusStrip.innerHTML = `
    ${finalCodes.map(([code]) => `<span>${escapeHtml(code)}</span>`).join("")}
    <small>${escapeHtml(finalCodes.map(([, label]) => label).join(" · "))}</small>
  `;
}

// Minimal tag-input widget: type + Enter/comma to add a chip, click a chip's
// x to remove it. Deliberately lighter than admin.html's tag-picker
// (src/api/tags.js suggestions via <datalist>, not a hard-locked select) so
// a company can add something not already in the taxonomy without friction.
function createTagInput(container, { initialValues = [], suggestions = [], placeholder }) {
  const values = [...initialValues];
  const chipRow = document.createElement("div");
  chipRow.className = "chips";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "tagInputField";
  input.placeholder = placeholder;

  const datalistId = `tagSuggestions-${container.dataset.tagField}`;
  const datalist = document.createElement("datalist");
  datalist.id = datalistId;
  datalist.innerHTML = suggestions.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
  input.setAttribute("list", datalistId);

  function render() {
    chipRow.innerHTML = values
      .map(
        (value, index) => `
          <span class="chip">
            ${escapeHtml(value)}
            <button type="button" data-remove-index="${index}" aria-label="Remove ${escapeHtml(value)}">&times;</button>
          </span>
        `
      )
      .join("");

    chipRow.querySelectorAll("[data-remove-index]").forEach((button) => {
      button.addEventListener("click", () => {
        values.splice(Number(button.dataset.removeIndex), 1);
        render();
        updateFocusStrip();
      });
    });
  }

  function addFromInput() {
    const text = input.value.trim().replace(/,+$/, "");

    if (text && !values.some((value) => value.toLowerCase() === text.toLowerCase())) {
      values.push(text);
      render();
      updateFocusStrip();
    }

    input.value = "";
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFromInput();
    }
  });

  input.addEventListener("blur", addFromInput);

  container.innerHTML = "";
  container.append(chipRow, input, datalist);
  render();

  return {
    getValues: () => [...values],
    setValues: (nextValues) => {
      values.length = 0;
      values.push(...(Array.isArray(nextValues) ? nextValues : []));
      render();
    },
  };
}

function setStatus(message) {
  elements.statusBanner.hidden = false;
  elements.statusMessage.textContent = message;
}

function setSaveMessage(text, isError = false) {
  elements.saveMessage.textContent = text;
  elements.saveMessage.classList.toggle("error", isError);
}

function getToken() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

function setToken(token) {
  state.token = token;
  const url = new URL(window.location.href);
  url.searchParams.set("token", token);
  window.history.replaceState({}, "", url);
}

async function fetchTagSuggestions() {
  try {
    const response = await fetch("/api/tags");
    const tags = response.ok ? await response.json() : [];
    const byCategory = { services: [], technologies: [], industries: [] };

    for (const tag of Array.isArray(tags) ? tags : []) {
      if (byCategory[tag.category]) {
        byCategory[tag.category].push(tag.name);
      }
    }

    return byCategory;
  } catch (error) {
    return { services: [], technologies: [], industries: [] };
  }
}

function populateForm(profile) {
  state.domain = profile.domain || "";
  fields.companyName.value = profile.companyName || "";
  fields.description.value = profile.description || "";
  fields.logoUrl.value = profile.logoUrl || "";
  fields.website.value = profile.website || "";
  fields.country.value = profile.country || "";
  fields.city.value = profile.city || "";
  fields.linkedinUrl.value = profile.linkedinUrl || "";
  fields.githubUrl.value = profile.githubUrl || "";
  elements.domainLine.textContent = profile.domain || "";
  elements.verifiedBadge.hidden = !profile.claimed;
  elements.accessDomain.textContent = profile.companyName || profile.domain || "";
  elements.accessStatus.textContent = profile.claimed
    ? "Claimed - you're set up to manage this listing"
    : "Unclaimed - edit and publish below to claim it";

  tagInputs.services.setValues(profile.services);
  tagInputs.technologies.setValues(profile.technologies);
  tagInputs.industries.setValues(profile.industries);

  updateLogoPreview();
  updateFocusStrip();
}

function collectFormProfile() {
  return {
    companyName: fields.companyName.value.trim(),
    description: fields.description.value.trim(),
    logoUrl: fields.logoUrl.value.trim(),
    website: fields.website.value.trim(),
    country: fields.country.value.trim(),
    city: fields.city.value.trim(),
    linkedinUrl: fields.linkedinUrl.value.trim(),
    githubUrl: fields.githubUrl.value.trim(),
    services: tagInputs.services.getValues(),
    technologies: tagInputs.technologies.getValues(),
    industries: tagInputs.industries.getValues(),
  };
}

async function callProfileEdit(body) {
  const response = await fetch("/api/profile-edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function handleSaveSubmit(event) {
  event.preventDefault();
  elements.saveButton.disabled = true;
  setSaveMessage("Publishing...");

  try {
    const result = await callProfileEdit({ token: state.token, profile: collectFormProfile() });
    setToken(result.editToken);
    populateForm(result.profile);
    elements.profileLink.href = `/?provider=${encodeURIComponent(state.domain)}`;
    elements.profileLink.hidden = false;
    elements.saveButton.textContent = "Publish changes";
    setSaveMessage("Published. Your public profile is up to date.");
  } catch (error) {
    setSaveMessage(error.message, true);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function handleRemovalSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(elements.removalForm).entries());
  const submitButton = elements.removalForm.querySelector("button[type='submit']");

  submitButton.disabled = true;
  setRemovalMessage("Submitting request...");

  try {
    const response = await fetch("/api/claim-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: state.domain,
        email: data.email,
        requestType: "removal",
        token: state.token,
        metadata: { source: "provider_access_page", message: data.message || "" },
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Request failed.");
    }

    setRemovalMessage(`Removal request received. We'll review it and email ${data.email} once it's decided.`);
    elements.removalForm.reset();
  } catch (error) {
    setRemovalMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
}

function setRemovalMessage(text, isError = false) {
  elements.removalMessage.textContent = text;
  elements.removalMessage.classList.toggle("error", isError);
}

function setLogoStatus(text, isError = false) {
  elements.logoUploadStatus.textContent = text;
  elements.logoUploadStatus.classList.toggle("error", isError);
}

// Uploads straight to Supabase Storage via src/api/profile-edit-logo.js,
// then immediately publishes just the logoUrl field via the normal PATCH
// path (unlike every other field, which waits for the page-level Publish
// button) - a logo is a single, self-contained, low-ambiguity change, so
// requiring a separate click after the file picker already closed added
// friction without adding real protection. applyOwnerProfileEdit still logs
// a before/after snapshot for this like any other save, so it's revertible
// from admin.js's activity timeline. The Logo URL field stays in sync so a
// company can still paste an existing hosted URL there instead, if they'd
// rather not upload a file - that path still waits for Publish like normal.
async function handleLogoFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  setLogoStatus("Uploading...");

  try {
    const uploadResponse = await fetch(`/api/profile-edit-logo?token=${encodeURIComponent(state.token)}`, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const uploadPayload = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error || "Upload failed.");
    }

    setLogoStatus("Publishing...");
    const result = await callProfileEdit({ token: state.token, profile: { logoUrl: uploadPayload.logoUrl } });
    setToken(result.editToken);
    // Only sync the logo field/preview here, not a full populateForm() - the
    // rest of the form may hold in-progress, not-yet-published edits from
    // the owner, and overwriting those with the (otherwise unchanged)
    // server response would silently discard them.
    fields.logoUrl.value = result.profile.logoUrl || "";
    updateLogoPreview();
    setLogoStatus("Logo updated and published.");
  } catch (error) {
    setLogoStatus(error.message, true);
  } finally {
    event.target.value = "";
  }
}

async function init() {
  const token = getToken();

  if (!token) {
    setStatus("Open this page from your outreach email or profile access link.");
    elements.accessDomain.textContent = "No provider selected";
    elements.accessStatus.textContent = "Open this page from your outreach email.";
    return;
  }

  state.token = token;

  const [linkResponse, tagSuggestions] = await Promise.all([
    fetch(`/api/profile-edit?token=${encodeURIComponent(token)}`),
    fetchTagSuggestions(),
  ]);
  const payload = await linkResponse.json().catch(() => ({}));

  if (!linkResponse.ok) {
    setStatus(payload.error || "This link is invalid or has expired. Reply to the outreach email for a new one.");
    elements.accessDomain.textContent = "Link not found";
    elements.accessStatus.textContent = "This link is invalid or has expired.";
    return;
  }

  if (!payload.editable) {
    elements.accessDomain.textContent = payload.companyName || payload.domain || "Profile unavailable";
    elements.accessStatus.textContent = payload.reason === "removed" ? "Removed from the directory" : "No longer editable";
    setStatus(
      payload.reason === "removed"
        ? `${payload.companyName || payload.domain || "This profile"} has been removed from the directory and is no longer editable.`
        : "This profile is no longer editable from this link."
    );
    return;
  }

  tagInputs.services = createTagInput(document.querySelector('[data-tag-field="services"]'), {
    suggestions: tagSuggestions.services,
    placeholder: "Add a service and press Enter",
  });
  tagInputs.technologies = createTagInput(document.querySelector('[data-tag-field="technologies"]'), {
    suggestions: tagSuggestions.technologies,
    placeholder: "Add a technology and press Enter",
  });
  tagInputs.industries = createTagInput(document.querySelector('[data-tag-field="industries"]'), {
    suggestions: tagSuggestions.industries,
    placeholder: "Add an industry and press Enter",
  });

  populateForm(payload.profile);
  elements.introBar.hidden = false;
  elements.companyName.textContent = payload.profile.companyName
    ? `Editing ${payload.profile.companyName}`
    : "Editing your provider profile";
  elements.editFieldset.hidden = false;
  elements.saveBar.hidden = false;
  elements.removalPanel.hidden = false;
  elements.saveButton.textContent = payload.profile.claimed ? "Publish changes" : "Claim & publish profile";

  if (payload.profile.domain) {
    elements.profileLink.href = `/?provider=${encodeURIComponent(payload.profile.domain)}`;
    elements.profileLink.hidden = false;
  }

  fields.companyName.addEventListener("input", () => {
    updateLogoPreview();
  });
  fields.description.addEventListener("input", updateFocusStrip);
}

elements.editForm.addEventListener("submit", handleSaveSubmit);
elements.removalForm.addEventListener("submit", handleRemovalSubmit);
elements.logoFile.addEventListener("change", handleLogoFileChange);

init();
