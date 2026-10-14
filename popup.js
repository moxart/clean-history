// The popup has its own language switch, so it reads the locale files directly
// instead of chrome.i18n, which always follows the browser's language
const LANGUAGES = {
  en: { locale: "en-US", dir: "ltr" },
  fa: { locale: "fa-IR", dir: "rtl" }
};

const messages = {};

async function loadMessages(language) {
  const response = await fetch(chrome.runtime.getURL(`_locales/${language}/messages.json`));
  messages[language] = await response.json();
}

const $ = (id) => document.getElementById(id);
let lang = "en";
const t = (key) => messages[lang][key].message;
const scanDoneMessage = (count) => t("scanDone").replace("$COUNT$", count);

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGUAGES[lang].dir;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.textContent = messages[btn.dataset.lang].languageName.message;
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  $("msg").textContent = "";
}

async function render() {
  const { enabled = true, customDomains = [], removedCount = 0, lastScan } =
    await chrome.storage.local.get(["enabled", "customDomains", "removedCount", "lastScan"]);
  $("enabled").checked = enabled;
  $("count").textContent = removedCount.toLocaleString(LANGUAGES[lang].locale);
  $("lastScan").textContent = lastScan ? new Date(lastScan).toLocaleString(LANGUAGES[lang].locale) : "—";
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
  $("msg").textContent = t("scanning");
  const { removed } = await chrome.runtime.sendMessage({ type: "scan-now" });
  $("msg").textContent = scanDoneMessage(removed.toLocaleString(LANGUAGES[lang].locale));
  $("scan").disabled = false;
  render();
});

$("save").addEventListener("click", async () => {
  const customDomains = $("custom").value
    .split("\n")
    .map((line) => line.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0])
    .filter(Boolean);
  await chrome.storage.local.set({ customDomains });
  $("msg").textContent = t("saved");
  render();
});

(async () => {
  await Promise.all(Object.keys(LANGUAGES).map(loadMessages));
  const { language } = await chrome.storage.local.get("language");
  if (language in LANGUAGES) lang = language;
  applyLanguage();
  render();
})();
