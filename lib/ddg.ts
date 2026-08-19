import "server-only";

/**
 * Performs a keyless search pass query on DuckDuckGo Lite.
 * Parses the raw HTML results and formats snippets to feed into Anthropic Claude.
 */
export async function searchWebDuckDuckGo(query: string): Promise<string> {
  try {
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: `q=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }

    const html = await res.text();

    const links: { href: string; title: string }[] = [];
    const linkRegex = /href="([^"]+)"[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        href: match[1],
        title: match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
      });
    }

    const snippets: string[] = [];
    const snippetRegex = /class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/g;
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
    }

    let compiled = "";
    const count = Math.min(links.length, snippets.length, 5);
    for (let i = 0; i < count; i++) {
      compiled += `[${i + 1}] Title: ${links[i].title}\nLink: ${links[i].href}\nSnippet: ${snippets[i]}\n\n`;
    }

    return compiled || "No web search results found.";
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return `Error retrieving search results: ${(error as Error).message}`;
  }
}
