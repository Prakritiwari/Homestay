// Reservation date picker + live price preview on the listing page
(() => {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const price = Number(form.dataset.price || 0);
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  const preview = document.getElementById("bookingPreview");

  if (!checkIn || !checkOut || !preview) return;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const nightsEl = document.getElementById("previewNights");
  const subtotalEl = document.getElementById("previewSubtotal");
  const taxEl = document.getElementById("previewTax");
  const totalEl = document.getElementById("previewTotal");

  const toDate = (value) => new Date(`${value}T00:00:00.000Z`);
  const toInputDate = (date) => date.toISOString().slice(0, 10);
  const startOfToday = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  };
  const inr = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  const today = startOfToday();
  checkIn.min = toInputDate(today);
  if (!checkOut.min) checkOut.min = toInputDate(new Date(today.getTime() + MS_PER_DAY));

  const updatePreview = () => {
    if (!checkIn.value || !checkOut.value) {
      preview.classList.add("d-none");
      return;
    }

    const start = toDate(checkIn.value);
    const end = toDate(checkOut.value);
    const nights = Math.round((end - start) / MS_PER_DAY);

    if (!Number.isFinite(nights) || nights < 1) {
      preview.classList.add("d-none");
      return;
    }

    const subtotal = Math.round(price * nights);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;

    nightsEl.textContent = `${nights} night${nights === 1 ? "" : "s"}`;
    subtotalEl.textContent = inr(subtotal);
    taxEl.textContent = inr(tax);
    totalEl.textContent = inr(total);
    preview.classList.remove("d-none");
  };

  checkIn.addEventListener("change", () => {
    if (!checkIn.value) {
      updatePreview();
      return;
    }

    const nextDay = new Date(toDate(checkIn.value).getTime() + MS_PER_DAY);
    checkOut.min = toInputDate(nextDay);

    if (!checkOut.value || toDate(checkOut.value) <= toDate(checkIn.value)) {
      checkOut.value = toInputDate(nextDay);
    }

    updatePreview();
  });

  checkOut.addEventListener("change", updatePreview);
  updatePreview();
})();

// Checkout: switch payment method fields + light input formatting
(() => {
  const form = document.getElementById("paymentForm");
  if (!form) return;

  const methodInputs = form.querySelectorAll('input[name="booking[paymentMethod]"]');
  const methodGroups = form.querySelectorAll("[data-payment-fields]");

  const syncPaymentFields = () => {
    const selected = form.querySelector('input[name="booking[paymentMethod]"]:checked');
    const method = selected ? selected.value : "card";

    methodGroups.forEach((group) => {
      const active = group.dataset.paymentFields === method;
      group.classList.toggle("d-none", !active);

      group.querySelectorAll("input, select").forEach((field) => {
        field.disabled = !active;
        if (field.dataset.required === "true") {
          field.required = active;
        }
      });
    });
  };

  methodInputs.forEach((input) => input.addEventListener("change", syncPaymentFields));
  syncPaymentFields();

  const cardNumber = document.getElementById("cardNumber");
  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      const digits = cardNumber.value.replace(/\D/g, "").slice(0, 19);
      cardNumber.value = digits.replace(/(.{4})/g, "$1 ").trim();
    });
  }

  const cardExpiry = document.getElementById("cardExpiry");
  if (cardExpiry) {
    cardExpiry.addEventListener("input", () => {
      const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
      cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });
  }

  const cardCvv = document.getElementById("cardCvv");
  if (cardCvv) {
    cardCvv.addEventListener("input", () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
    });
  }
})();
