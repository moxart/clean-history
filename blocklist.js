// Domains removed outright, along with their subdomains
export const BLOCKED_DOMAINS = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "youporn.com", "tube8.com", "spankbang.com", "eporner.com", "tnaflix.com",
  "beeg.com", "porn.com", "youjizz.com", "motherless.com", "hqporner.com",
  "chaturbate.com", "stripchat.com", "bongacams.com", "cam4.com", "livejasmin.com",
  "myfreecams.com", "camsoda.com", "onlyfans.com", "fansly.com", "brazzers.com",
  "bangbros.com", "realitykings.com", "naughtyamerica.com", "rule34.xxx",
  "e-hentai.org", "exhentai.org", "nhentai.net", "hanime.tv", "hentaihaven.xxx",
  "literotica.com", "fapello.com", "thothub.to", "erome.com", "imagefap.com",
  "porntrex.com", "txxx.com", "hclips.com", "sxyprn.com", "porngo.com",
  "4tube.com", "porntube.com", "drtuber.com", "sunporno.com", "fuq.com",
  "efukt.com", "heavy-r.com", "adultfriendfinder.com", "manyvids.com", "clips4sale.com"
];

// A URL is removed if one of these words appears in its domain or path
export const BLOCKED_KEYWORDS = [
  "porn", "xxx", "xvideo", "hentai", "nsfw", "milf", "camgirl", "sexcam",
  "xhamster", "redtube", "onlyfans", "nude", "naked", "erotic", "fetish",
  "pussy", "boobs", "blowjob", "hardcore", "escort", "xnxx", "pornhub", "youporn",
  "spankbang", "chaturbate", "brazzers", "bangbros", "fansly", "rule34", "camwhore",
  "sextape", "sexvideo", "livesex", "cumshot", "creampie", "gangbang", "bukkake",
  "deepthroat", "handjob", "footjob", "jerkoff", "masturbat", "orgasm", "threesome",
  "bdsm", "bondage", "striptease", "upskirt", "topless", "shemale", "hotwife",
  "cuckold", "incest", "stepsis", "ahegao", "futanari", "lewd", "dildo",
  "سکس", "پورن", "سکسی", "شهوانی", "جنده"
];

// Prevents false positives (e.g. essex.ac.uk)
export const SAFE_WORDS = ["essex", "sussex", "middlesex", "wessex", "sextant", "sextet"];
