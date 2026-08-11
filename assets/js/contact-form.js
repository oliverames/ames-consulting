import { loadSiteConfig } from "./site-config.js";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 3;
const MIN_FILL_MS = 3_000;
const FORM_UNAVAILABLE_MESSAGE = "The form is unavailable right now. Please email me at oliver@ames.consulting.";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let turnstileRequested = false;

function requestTurnstile() {
  if (turnstileRequested || window.turnstile) {
    return;
  }

  turnstileRequested = true;
  const script = document.createElement("script");
  script.src = TURNSTILE_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.addEventListener("error", () => {
    turnstileRequested = false;
    script.remove();
  }, { once: true });
  document.head.append(script);
}

function getAttemptsKey() {
  return "ames_contact_attempt_timestamps";
}

function readAttemptTimestamps() {
  try {
    const raw = localStorage.getItem(getAttemptsKey());
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function writeAttemptTimestamps(values) {
  try {
    localStorage.setItem(getAttemptsKey(), JSON.stringify(values));
  } catch {
    // ignore storage write issues in privacy-restricted environments
  }
}

function pruneAttempts(values) {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  return values.filter((value) => value >= cutoff);
}

function isUsableEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== "string") {
    return false;
  }

  const trimmed = endpoint.trim();
  if (!trimmed) {
    return false;
  }

  return !trimmed.includes("replace-with");
}

function setStatus(node, message, tone = "info") {
  node.textContent = message;
  node.dataset.tone = tone;
}

async function initContactForm() {
  const form = document.getElementById("contact-form");
  const fallback = document.getElementById("contact-form-fallback");
  const status = document.getElementById("contact-form-status");
  const submitButton = document.getElementById("contact-submit");
  const startedAtInput = document.getElementById("contact-started-at");
  const honeypotInput = document.getElementById("contact-company-website");
  const projectType = form?.elements.namedItem("projectType");

  if (!(form instanceof HTMLFormElement) || !status || !submitButton || !startedAtInput || !honeypotInput) {
    return;
  }

  const config = await loadSiteConfig();
  const endpoint = isUsableEndpoint(config.contactFormEndpoint) ? config.contactFormEndpoint.trim() : "";

  form.hidden = false;
  if (fallback) {
    fallback.hidden = true;
  }

  startedAtInput.value = String(Date.now());
  form.addEventListener("focusin", requestTurnstile, { once: true });
  form.addEventListener("pointerdown", requestTurnstile, { once: true });

  const requestedProject = new URLSearchParams(location.search).get("project");
  if (requestedProject && projectType instanceof RadioNodeList) {
    projectType.value = requestedProject;
  } else if (requestedProject && projectType instanceof HTMLSelectElement) {
    const matchingOption = [...projectType.options].find((option) => option.text === requestedProject);
    if (matchingOption) projectType.value = matchingOption.value;
  }

  if (!endpoint) {
    setStatus(
      status,
      FORM_UNAVAILABLE_MESSAGE,
      "warn"
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    requestTurnstile();

    const now = Date.now();

    if (honeypotInput.value.trim().length > 0) {
      // Likely bot. Pretend success while dropping the payload.
      setStatus(status, config.contactFormSuccessMessage || "Thanks, your message was sent.", "ok");
      form.reset();
      startedAtInput.value = String(Date.now());
      return;
    }

    if (!endpoint) {
      setStatus(
        status,
        FORM_UNAVAILABLE_MESSAGE,
        "warn"
      );
      return;
    }

    const startedAt = Number(startedAtInput.value || 0);
    if (!Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) {
      setStatus(status, "Please take a moment to review your message before submitting.", "warn");
      return;
    }

    const recentAttempts = pruneAttempts(readAttemptTimestamps());
    if (recentAttempts.length >= RATE_MAX_ATTEMPTS) {
      setStatus(status, "Too many attempts in a short period. Please try again in a few minutes.", "warn");
      writeAttemptTimestamps(recentAttempts);
      return;
    }

    submitButton.disabled = true;
    setStatus(status, "Sending message...", "info");

    const payload = new FormData(form);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: payload
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Submission failed with status ${response.status}`);
      }

      recentAttempts.push(now);
      writeAttemptTimestamps(pruneAttempts(recentAttempts));

      setStatus(status, config.contactFormSuccessMessage || "Thanks, your message was sent.", "ok");
      form.reset();
      startedAtInput.value = String(Date.now());
      window.turnstile?.reset();
    } catch (error) {
      const message = error instanceof Error && error.message.toLowerCase().includes("spam protection")
        ? "Please complete the spam protection check and try again."
        : "Message could not be sent right now. Please try again shortly.";
      setStatus(status, message, "error");
      // Turnstile tokens are single-use and the server consumes them before
      // sending mail, so a failed submission must mint a fresh token or every
      // retry fails spam verification.
      window.turnstile?.reset();
    } finally {
      submitButton.disabled = false;
    }
  });
}

initContactForm().catch((error) => {
  const status = document.getElementById("contact-form-status");
  if (status) {
    setStatus(status, `Contact form unavailable: ${error.message}`, "error");
  }
});
