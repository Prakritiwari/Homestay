// Lenis smooth scrolling
(() => {
  if (typeof Lenis === "undefined") return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  const raf = (time) => {
    lenis.raf(time);
    window.requestAnimationFrame(raf);
  };
  window.requestAnimationFrame(raf);

  window.__lenis = lenis;

  // Smooth in-page anchors, offset for the sticky navbar
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: -88 });
    });
  });
})();

// Bootstrap-style client validation
(() => {
  "use strict";

  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// Show/hide GST totals on listing cards
(() => {
  const taxSwitches = document.querySelectorAll("#flexswitchCheckDefault");
  if (!taxSwitches.length) return;

  const STORAGE_KEY = "homestay-show-gst";
  const cards = document.querySelectorAll(".price-base, .price-total");

  const applyState = (showTotals) => {
    document.querySelectorAll(".price-base").forEach((el) => {
      el.classList.toggle("d-none", showTotals);
    });
    document.querySelectorAll(".price-total").forEach((el) => {
      el.classList.toggle("d-none", !showTotals);
    });
  };

  let showTotals = false;
  try {
    showTotals = localStorage.getItem(STORAGE_KEY) === "true";
  } catch (e) {
    showTotals = false;
  }

  taxSwitches.forEach((taxSwitch) => {
    taxSwitch.checked = showTotals;
    taxSwitch.addEventListener("change", () => {
      showTotals = taxSwitch.checked;
      try {
        localStorage.setItem(STORAGE_KEY, String(showTotals));
      } catch (e) {
        /* storage unavailable */
      }
      applyState(showTotals);
    });
  });

  if (cards.length) {
    applyState(showTotals);
  }
})();

// Filter panel: price range presets
(() => {
  const presets = document.querySelectorAll("[data-price-preset]");
  if (!presets.length) return;

  const minInput = document.getElementById("filterMinPrice");
  const maxInput = document.getElementById("filterMaxPrice");
  if (!minInput || !maxInput) return;

  const syncActive = () => {
    presets.forEach((preset) => {
      const matches =
        preset.dataset.min === minInput.value.trim() &&
        preset.dataset.max === maxInput.value.trim();
      preset.classList.toggle("active", matches);
    });
  };

  presets.forEach((preset) => {
    preset.addEventListener("click", () => {
      minInput.value = preset.dataset.min;
      maxInput.value = preset.dataset.max;
      syncActive();
    });
  });

  [minInput, maxInput].forEach((input) => input.addEventListener("input", syncActive));
  syncActive();
})();

// Auto-dismiss flash messages
(() => {
  const alerts = document.querySelectorAll(".alert-dismissible");
  alerts.forEach((alert) => {
    window.setTimeout(() => {
      if (window.bootstrap && bootstrap.Alert) {
        bootstrap.Alert.getOrCreateInstance(alert).close();
      } else {
        alert.remove();
      }
    }, 5000);
  });
})();

// Loading state on submit buttons
(() => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (event.defaultPrevented || !form.checkValidity()) return;

      const button = form.querySelector('button[type="submit"], button:not([type])');
      if (!button || button.disabled) return;

      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Working...';
    });
  });
})();

// Image previews for file inputs
(() => {
  const inputs = document.querySelectorAll("input[type='file'][data-image-preview]");

  inputs.forEach((input) => {
    const preview = document.getElementById(input.getAttribute("data-image-preview"));
    if (!preview) return;

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        preview.classList.add("d-none");
        preview.removeAttribute("src");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    });
  });
})();

// Slight shadow on the navbar after scrolling
(() => {
  const navbar = document.querySelector(".site-navbar");
  if (!navbar) return;

  const update = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
})();
