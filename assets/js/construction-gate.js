(function () {
  const STORAGE_KEY = "amesConsultingConstructionAccess";
  const PASSWORD = "cows";

  function storageAvailable() {
    try {
      const testKey = "__ames_construction_gate_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  const canStoreAccess = storageAvailable();
  if (canStoreAccess && window.localStorage.getItem(STORAGE_KEY) === "true") {
    document.documentElement.classList.add("construction-authenticated");
  }

  function initializeGate() {
    const gate = document.getElementById("construction-gate");
    const form = document.getElementById("construction-gate-form");
    const input = document.getElementById("construction-gate-password");
    const error = document.getElementById("construction-gate-error");

    if (!gate || !form || !input || !error) return;
    if (document.documentElement.classList.contains("construction-authenticated")) return;

    const pageElements = [...document.body.children].filter((element) => element !== gate && element.tagName !== "SCRIPT");
    for (const element of pageElements) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    function unlock() {
      if (canStoreAccess) window.localStorage.setItem(STORAGE_KEY, "true");
      document.documentElement.classList.add("construction-authenticated");
      for (const element of pageElements) {
        element.inert = false;
        element.removeAttribute("aria-hidden");
      }
      document.querySelector(".skip-link, a, button, input, select, textarea")?.focus({ preventScroll: true });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const enteredPassword = input.value.trim().toLowerCase();
      if (enteredPassword === PASSWORD) {
        error.textContent = "";
        unlock();
        return;
      }

      error.textContent = "That password did not work. Try again.";
      input.value = "";
      input.focus();
    });

    input.addEventListener("input", () => {
      error.textContent = "";
    });

    window.setTimeout(() => input.focus(), 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGate, { once: true });
  } else {
    initializeGate();
  }
})();
