const STRINGS = {
  en: {
    locale: "en-US",
    dir: "ltr",
    title: "Clean History",
    enabled: "Automatic cleaning enabled",
    removed: "URLs removed:",
    lastScan: "Last full scan:",
    scan: "Scan entire history now",
    scanning: "Scanning...",
    scanDone: (n) => `${n} URL(s) removed.`,
    customLabel: "Custom domains to remove (one per line):",
    save: "Save domains",
    saved: "Saved."
  },
  fa: {
    locale: "fa-IR",
    dir: "rtl",
    title: "پاک‌کن تاریخچه نامناسب",
    enabled: "پاک‌سازی خودکار فعال باشد",
    removed: "تعداد آدرس‌های حذف‌شده:",
    lastScan: "آخرین بررسی کامل:",
    scan: "همین الان کل تاریخچه را بررسی کن",
    scanning: "در حال بررسی...",
    scanDone: (n) => `${n} آدرس حذف شد.`,
    customLabel: "دامنه‌های دلخواه برای حذف (هر خط یک دامنه):",
    save: "ذخیره دامنه‌ها",
    saved: "ذخیره شد."
  }
};

const $ = (id) => document.getElementById(id);
let lang = "en";
const t = () => STRINGS[lang];

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = t().dir;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t()[el.dataset.i18n];
  });
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  $("msg").textContent = "";
}

async function render() {
  const { enabled = true, customDomains = [], removedCount = 0, lastScan } =
    await chrome.storage.local.get(["enabled", "customDomains", "removedCount", "lastScan"]);
  $("enabled").checked = enabled;
  $("count").textContent = removedCount.toLocaleString(t().locale);
  $("lastScan").textContent = lastScan ? new Date(lastScan).toLocaleString(t().locale) : "—";
  $("custom").value = customDomains.join("\n");
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    lang = btn.dataset.lang;
    await chrome.storage.local.set({ language: lang });
    applyLanguage();
    render();
  });
});

$("enabled").addEventListener("change", (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
});

$("scan").addEventListener("click", async () => {
  $("scan").disabled = true;
  $("msg").textContent = t().scanning;
  const { removed } = await chrome.runtime.sendMessage({ type: "scan-now" });
  $("msg").textContent = t().scanDone(removed.toLocaleString(t().locale));
  $("scan").disabled = false;
  render();
});

$("save").addEventListener("click", async () => {
  const customDomains = $("custom").value
    .split("\n")
    .map((line) => line.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0])
    .filter(Boolean);
  await chrome.storage.local.set({ customDomains });
  $("msg").textContent = t().saved;
  render();
});

(async () => {
  const { language } = await chrome.storage.local.get("language");
  if (language in STRINGS) lang = language;
  applyLanguage();
  render();
})();
