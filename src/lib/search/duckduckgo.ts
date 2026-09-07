import * as cheerio from "cheerio";
import { SearchResult, FocusMode } from "../types";

function extractCleanUrl(rawUrl: string): string {
  try {
    if (rawUrl.startsWith("//duckduckgo.com/l/?") || rawUrl.startsWith("/l/?")) {
      const parsed = new URL("https://duckduckgo.com" + (rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl));
      const uddg = parsed.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    }
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
  } catch {
    // fallback
  }
  return rawUrl;
}

function getDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

export async function searchDuckDuckGo(
  query: string,
  focusMode: FocusMode = "web",
  maxResults = 7
): Promise<SearchResult[]> {
  if (focusMode === "writing") {
    return [];
  }

  let searchQuery = query;
  if (focusMode === "academic") {
    searchQuery = `${query} (research paper OR study OR arxiv OR pubmed OR scholar)`;
  }

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const response = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "User-Agent": randomUserAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://html.duckduckgo.com",
        "Referer": "https://html.duckduckgo.com/",
      },
      body: new URLSearchParams({
        q: searchQuery,
        b: "",
        kl: "us-en",
      }).toString(),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo responded with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $(".result").each((index, element) => {
      if (results.length >= maxResults) return;

      const titleEl = $(element).find(".result__title .result__a");
      const snippetEl = $(element).find(".result__snippet");
      const urlEl = $(element).find(".result__url");

      const title = titleEl.text().trim();
      const rawHref = titleEl.attr("href") || urlEl.text().trim();
      const cleanUrl = extractCleanUrl(rawHref);
      const snippet = snippetEl.text().trim();

      if (title && cleanUrl && cleanUrl.startsWith("http")) {
        const domain = getDomain(cleanUrl);
        // Exclude ad or tracking domains if any
        if (!domain.includes("duckduckgo.com") && !domain.includes("adservice")) {
          results.push({
            id: results.length + 1,
            title,
            url: cleanUrl,
            snippet,
            domain,
            favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
          });
        }
      }
    });

    if (results.length > 0) {
      return results;
    }
  } catch (err) {
    console.warn("HTML DuckDuckGo search failed, trying Lite endpoint:", err);
  }

  // Fallback to Lite DuckDuckGo endpoint
  try {
    const liteResponse = await fetch(`https://lite.duckduckgo.com/lite/`, {
      method: "POST",
      headers: {
        "User-Agent": randomUserAgent,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ q: searchQuery }).toString(),
      signal: AbortSignal.timeout(5000),
    });

    if (liteResponse.ok) {
      const liteHtml = await liteResponse.text();
      const $ = cheerio.load(liteHtml);
      const liteResults: SearchResult[] = [];

      $("a.result-link").each((index, element) => {
        if (liteResults.length >= maxResults) return;
        const title = $(element).text().trim();
        const rawHref = $(element).attr("href") || "";
        const cleanUrl = extractCleanUrl(rawHref);
        
        // In lite mode, snippet is in the next td or sibling tr
        const snippet = $(element).closest("tr").next().find(".result-snippet").text().trim();

        if (title && cleanUrl.startsWith("http")) {
          const domain = getDomain(cleanUrl);
          liteResults.push({
            id: liteResults.length + 1,
            title,
            url: cleanUrl,
            snippet: snippet || title,
            domain,
            favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
          });
        }
      });

      if (liteResults.length > 0) {
        return liteResults;
      }
    }
  } catch (liteErr) {
    console.error("DuckDuckGo Lite search error:", liteErr);
  }

  return [];
}
