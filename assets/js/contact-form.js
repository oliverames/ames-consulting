import { loadSiteConfig } from "/assets/js/site-config.js";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 3;
const MIN_FILL_MS = 3_000;

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
  const status = document.getElementById("contact-form-status");
  const submitButton = document.getElementById("contact-submit");
  const startedAtInput = document.getElementById("contact-started-at");
  const honeypotInput = document.getElementById("contact-company-website");

  if (!(form instanceof HTMLFormElement) || !status || !submitButton || !startedAtInput || !honeypotInput) {
    return;
  }

  const config = await loadSiteConfig();
  const endpoint = isUsableEndpoint(config.contactFormEndpoint) ? config.contactFormEndpoint.trim() : "";

  startedAtInput.value = String(Date.now());

  if (!endpoint) {
    setStatus(
      status,
      "Form endpoint is not configured yet. Add contactFormEndpoint in site.config.json to enable submissions.",
      "warn"
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

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
        "Form endpoint is not configured yet. Add contactFormEndpoint in site.config.json to enable submissions.",
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
        throw new Error(`Submission failed with status ${response.status}`);
      }

      recentAttempts.push(now);
      writeAttemptTimestamps(pruneAttempts(recentAttempts));

      setStatus(status, config.contactFormSuccessMessage || "Thanks, your message was sent.", "ok");
      form.reset();
      startedAtInput.value = String(Date.now());
    } catch {
      setStatus(status, "Message could not be sent right now. Please try again shortly.", "error");
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
