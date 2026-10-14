# Clean History

**English** · [فارسی](README.fa.md)

A Chrome extension that removes adult and other inappropriate sites from your browsing history, automatically and in the background.

Once installed, you don't have to do anything. Pages from known adult sites are deleted from history the moment you visit them, and the whole history is rescanned periodically to catch anything that slipped through, including the address-bar suggestions those sites leave behind.

## Features

- **Removes on visit.** Every visited URL is checked as it is recorded, and matches are deleted right away.
- **Full history scan.** Runs when the extension is installed, every time Chrome starts, and every 30 minutes. You can also start one from the popup.
- **Cleans address-bar suggestions.** The root pages of blocked domains (`http`/`https`, with and without `www.`) are deleted directly, so they stop showing up when you type in the address bar.
- **Your own domains.** Add any extra domains in the popup, one per line. Subdomains are covered too.
- **Counter.** The popup shows how many URLs have been removed and when the last full scan ran.
- **On/off switch.** Pause automatic cleaning at any time.
- **English and Persian.** Both the extension and its popup are available in English and Persian (فارسی), with right-to-left layout for Persian.

## How matching works

A URL is removed if any of the following is true:

1. Its domain, or a parent of it, is in the built-in domain list or in your custom list.
2. Its domain, path or query contains a blocked keyword (English or Persian), such as `porn`, `xxx` or `سکس`.
3. Its domain name contains `sex`. This check only looks at the domain, so ordinary articles that mention the word are left alone.

Before keyword checks, a few harmless words are ignored so places like `essex.ac.uk` or `sussex.gov.uk` are not removed by mistake.

The lists live in [`blocklist.js`](blocklist.js) and are easy to extend.

## Installation

The extension is not on the Chrome Web Store yet, so install it from source:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right corner).
4. Click **Load unpacked** and choose the project folder.
5. Pin the extension from the puzzle-piece menu to reach the popup easily.

A full scan runs right after installation. It works in Chrome and other Chromium-based browsers (Edge, Brave, Opera, Vivaldi).

## Permissions

| Permission | Why it is needed |
| --- | --- |
| `history` | To read and delete history entries |
| `storage` | To save your settings, custom domains and the removal counter |
| `alarms` | To run the scan every 30 minutes |

## Privacy

Everything happens on your own computer. The extension makes no network requests, sends no data anywhere, and keeps nothing except its settings and a removal count in Chrome's local storage. Deleted URLs are not logged.

## Limitations

- It only cleans **browsing history**. It does not block sites, and it does not touch cookies, cache, downloads or saved passwords.
- Keyword matching can occasionally remove an innocent URL (for example, a page whose address contains `nude` as a color name). Use the on/off switch or edit `blocklist.js` if this matters to you.
- No list is complete. Sites that aren't in the list and have no blocked keyword in their address will stay; add them as custom domains.

## Project structure

```
manifest.json      Extension manifest (Manifest V3)
background.js      Service worker: matching, real-time removal, periodic scan
blocklist.js       Blocked domains, keywords and safe words
popup.html/.js     Settings popup
_locales/          Extension name and description in English and Persian
icons/             Extension icons
```

## Contributing

Suggestions for the domain and keyword lists are welcome. Open an issue or a pull request, and please include an example URL for any false positive you find.

## License

[MIT](LICENSE)
