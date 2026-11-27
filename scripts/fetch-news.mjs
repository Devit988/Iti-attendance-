import { writeFileSync } from "node:fs";

const FEEDS = [
  {
    cat: "india",
    label: "India",
    url: "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
    limit: 8
  },
  {
    cat: "wb",
    label: "West Bengal",
    url: "https://news.google.com/rss/search?q=(%22West+Bengal%22+OR+Kolkata)+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
    limit: 7
  },
  {
    cat: "bn",
    label: "বাংলা",
    url: "https://news.google.com/rss?hl=bn&gl=IN&ceid=IN:bn",
    limit: 8
  },
  {
    cat: "pib",
    label: "Govt / PIB",
    url: "https://news.google.com/rss/search?q=site:pib.gov.in+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
    limit: 6
  },
  {
    cat: "exams",
    label: "Exams & Jobs",
    url: "https://news.google.com/rss/search?q=(RRB+OR+SSC+OR+NCVT+OR+ITI+OR+%22government+job%22)+India+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
    limit: 8
  },
  {
    cat: "tech",
    label: "Sci & Tech",
    url: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en",
    limit: 6
  }
];

function decodeEntities(str) {
  return String(str || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</\\s*${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function parseRss(xml, feed) {
  const items = [];
  const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of matches) {
    let title = getTag(block, "title");
    const link = getTag(block, "link");
    const pubDate = getTag(block, "pubDate");
    let source = getTag(block, "source") || feed.label;

    // Strip trailing " - Source Name" from Google News titles
    const dashIdx = title.lastIndexOf(" - ");
    if (dashIdx > 20 && title.length - dashIdx < 50) {
      if (!getTag(block, "source")) source = title.slice(dashIdx + 3).trim();
      title = title.slice(0, dashIdx).trim();
    }

    if (feed.cat === "pib") source = "PIB India";

    if (!title || !link || !/^https?:\/\//i.test(link)) continue;

    const ts = Date.parse(pubDate);
    items.push({
      title,
      link,
      source,
      cat: feed.cat,
      date: Number.isNaN(ts) ? new Date().toISOString() : new Date(ts).toISOString()
    });

    if (items.length >= feed.limit) break;
  }
  return items;
}

async function main() {
  const all = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": "ITI-CONNECT-NewsBot/1.0" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      all.push(...parseRss(xml, feed));
    } catch (err) {
      console.warn(`Skipped ${feed.cat}:`, err.message);
    }
  }

  if (!all.length) {
    console.error("No news fetched; keeping existing news.json");
    process.exit(1);
  }

  // Deduplicate by normalized title (supports Bengali + English) and sort newest first
  const seen = new Set();
  const unique = [];
  for (const item of all.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))) {
    const key = item.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 60);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    items: unique.slice(0, 45)
  };

  writeFileSync("news.json", JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Saved ${payload.items.length} items to news.json`);
}

main();
