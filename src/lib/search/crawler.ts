import * as cheerio from "cheerio";
import { SearchResult } from "../types";

export interface EnrichedSource extends SearchResult {
  fullContent?: string;
}

export async function enrichSourcesWithContent(
  sources: SearchResult[],
  maxToScrape = 4
): Promise<EnrichedSource[]> {
  const toScrape = sources.slice(0, maxToScrape);

  const scrapePromises = toScrape.map(async (source) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(source.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return { ...source, fullContent: source.snippet };
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Strip out scripts, styles, navigation, footer, ads
      $("script, style, noscript, nav, footer, header, svg, iframe, form").remove();

      // Extract paragraphs or main content
      let text = $("article, main, .post-content, #content, body")
        .find("p, h1, h2, h3, li")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 30)
        .join("\n\n");

      if (!text || text.length < 100) {
        text = $("body").text().replace(/\s+/g, " ").trim();
      }

      // Truncate to reasonable context window to avoid overloading prompt
      const cleanContent = text.slice(0, 1500);
      return {
        ...source,
        fullContent: cleanContent.length > 50 ? cleanContent : source.snippet,
      };
    } catch {
      return { ...source, fullContent: source.snippet };
    }
  });

  const scraped = await Promise.all(scrapePromises);
  // Keep the rest with snippet
  const remaining = sources.slice(maxToScrape).map((s) => ({
    ...s,
    fullContent: s.snippet,
  }));

  return [...scraped, ...remaining];
}
