import { BLOCKED_DOMAINS, BLOCKED_KEYWORDS, SAFE_WORDS } from "./blocklist.js";

const SCAN_ALARM = "periodic-scan";
const SCAN_INTERVAL_MINUTES = 30;

async function getSettings() {
  const { enabled = true, customDomains = [], removedCount = 0 } =
    await chrome.storage.local.get(["enabled", "customDomains", "removedCount"]);
  return { enabled, customDomains, removedCount };
}

function hostnameMatchesDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith("." + domain);
}

function isBlocked(rawUrl, customDomains) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const domains = [...BLOCKED_DOMAINS, ...customDomains];
  if (domains.some((d) => hostnameMatchesDomain(hostname, d))) return true;

  let text = hostname + url.pathname + url.search;
  try {
    text = decodeURIComponent(text);
  } catch {}
  text = text.toLowerCase();
  for (const safe of SAFE_WORDS) text = text.replaceAll(safe, "");

  if (BLOCKED_KEYWORDS.some((k) => text.includes(k))) return true;
  // «sex» فقط در نام دامنه بررسی می‌شود تا مقاله‌ها و صفحات عادی حذف نشوند
  return hostname.replace(new RegExp(SAFE_WORDS.join("|"), "g"), "").includes("sex");
}

async function removeUrls(urls) {
  if (urls.length === 0) return 0;
  await Promise.all(urls.map((url) => chrome.history.deleteUrl({ url })));
  const { removedCount } = await getSettings();
  await chrome.storage.local.set({ removedCount: removedCount + urls.length });
  return urls.length;
}

const searchHistory = (text) =>
  chrome.history.search({ text, startTime: 0, maxResults: 1000000 });

// صفحه‌ی اصلی هر دامنه، که پیشنهاد خودکار نوار آدرس بیشتر از همه از آن می‌آید
function rootUrls(domain) {
  return ["http://", "https://"].flatMap((scheme) =>
    ["", "www."].flatMap((www) => [`${scheme}${www}${domain}/`, `${scheme}${www}${domain}`])
  );
}

async function scanAllHistory() {
  const { enabled, customDomains } = await getSettings();
  if (!enabled) return 0;
  const domains = [...BLOCKED_DOMAINS, ...customDomains];

  // جستجوی خالی همیشه همه چیز را برنمی‌گرداند، پس هر دامنه و کلمه جداگانه هم جستجو می‌شود
  const queries = ["", ...domains, ...BLOCKED_KEYWORDS];
  const results = await Promise.all(queries.map(searchHistory));
  const matches = new Set(
    results.flat().map((item) => item.url).filter((url) => url && isBlocked(url, customDomains))
  );
  const removed = await removeUrls([...matches]);

  // حذف مستقیم صفحه‌ی اصلی دامنه‌ها، حتی اگر در جستجو پیدا نشده باشند
  await Promise.all(domains.flatMap(rootUrls).map((url) => chrome.history.deleteUrl({ url })));

  await chrome.storage.local.set({ lastScan: Date.now() });
  return removed;
}

chrome.history.onVisited.addListener(async (item) => {
  const { enabled, customDomains } = await getSettings();
  if (enabled && item.url && isBlocked(item.url, customDomains)) {
    await removeUrls([item.url]);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SCAN_ALARM, { periodInMinutes: SCAN_INTERVAL_MINUTES });
  scanAllHistory();
});

chrome.runtime.onStartup.addListener(scanAllHistory);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCAN_ALARM) scanAllHistory();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "scan-now") {
    scanAllHistory().then((removed) => sendResponse({ removed }));
    return true;
  }
});
