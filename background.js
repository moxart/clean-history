import { BLOCKED_DOMAINS, BLOCKED_KEYWORDS, SAFE_WORDS } from "./blocklist.js";

const SCAN_ALARM = "periodic-scan";
const SCAN_INTERVAL_MINUTES = 30;
const PENDING_REMOVAL_DELAY_MS = 1000;

async function getSettings() {
  const { enabled = true, customDomains = [], removedCount = 0 } =
    await chrome.storage.local.get(["enabled", "customDomains", "removedCount"]);
  return { enabled, customDomains, removedCount };
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches the domain anywhere in the URL (e.g. in redirect parameters), but notexample.com does not match example.com
function textContainsDomain(text, domain) {
  return new RegExp(`(^|[^a-z0-9-])${escapeRegExp(domain)}($|[^a-z0-9-])`).test(text);
}

// Redirect URLs are sometimes encoded more than once
function fullyDecode(text) {
  for (let i = 0; i < 3; i++) {
    let decoded;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      break;
    }
    if (decoded === text) break;
    text = decoded;
  }
  return text;
}

function isBlocked(rawUrl, customDomains) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const fullUrl = fullyDecode(url.href).toLowerCase();
  const domains = [...BLOCKED_DOMAINS, ...customDomains];
  if (domains.some((d) => textContainsDomain(fullUrl, d))) return true;

  let text = fullyDecode(hostname + url.pathname + url.search).toLowerCase();
  for (const safe of SAFE_WORDS) text = text.replaceAll(safe, "");

  if (BLOCKED_KEYWORDS.some((k) => text.includes(k))) return true;
  // "sex" is only checked in the domain name so ordinary articles and pages aren't removed
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

// Each domain's home page, the most common source of address-bar suggestions
function rootUrls(domain) {
  return ["http://", "https://"].flatMap((scheme) =>
    ["", "www."].flatMap((www) => [`${scheme}${www}${domain}/`, `${scheme}${www}${domain}`])
  );
}

async function scanAllHistory() {
  const { enabled, customDomains } = await getSettings();
  if (!enabled) return 0;
  const domains = [...BLOCKED_DOMAINS, ...customDomains];

  // An empty search doesn't always return everything, so each domain and keyword is searched separately too
  // The domain name without its TLD is searched too, to find URLs that contain the domain encoded
  const domainNames = domains.map((d) => d.split(".")[0]);
  const queries = [...new Set(["", ...domains, ...domainNames, ...BLOCKED_KEYWORDS])];
  const results = await Promise.all(queries.map(searchHistory));
  const matches = new Set(
    results.flat().map((item) => item.url).filter((url) => url && isBlocked(url, customDomains))
  );
  const removed = await removeUrls([...matches]);

  // Delete the domains' home pages directly, even if the search didn't find them
  await Promise.all(domains.flatMap(rootUrls).map((url) => chrome.history.deleteUrl({ url })));

  await chrome.storage.local.set({ lastScan: Date.now() });
  return removed;
}

chrome.history.onVisited.addListener(async (item) => {
  const { enabled, customDomains } = await getSettings();
  if (enabled && item.url && isBlocked(item.url, customDomains)) {
    pendingUrls.delete(item.url);
    await removeUrls([item.url]);
  }
});

// Intermediate pages in a redirect chain (like an Anubis bot-check page) don't show up in history search
// and don't trigger onVisited, so blocked URLs a tab passes through are recorded and removed afterwards
const pendingUrls = new Set();

async function rememberBlockedNavigation({ url, frameId }) {
  if (frameId !== 0) return;
  const { enabled, customDomains } = await getSettings();
  if (enabled && isBlocked(url, customDomains)) pendingUrls.add(url);
}

async function removePendingUrls() {
  const urls = [...pendingUrls];
  pendingUrls.clear();
  await removeUrls(urls);
}

chrome.webNavigation.onBeforeNavigate.addListener(rememberBlockedNavigation);
chrome.webNavigation.onCommitted.addListener(rememberBlockedNavigation);
chrome.webNavigation.onCompleted.addListener(({ frameId }) => {
  if (frameId === 0) setTimeout(removePendingUrls, PENDING_REMOVAL_DELAY_MS);
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
