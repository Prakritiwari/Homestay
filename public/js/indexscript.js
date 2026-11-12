// Show/hide GST info on listing cards when the tax toggle is switched on
(() => {
  const taxSwitch = document.getElementById("flexswitchCheckDefault");
  if (!taxSwitch) return;

  const toggleTaxInfo = () => {
    document.querySelectorAll(".tax-info").forEach((info) => {
      info.style.display = taxSwitch.checked ? "inline" : "none";
    });
  };

  taxSwitch.addEventListener("change", toggleTaxInfo);
  toggleTaxInfo(); // sync with the checkbox's initial state on load
})();
