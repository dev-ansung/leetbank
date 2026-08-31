import { describe, expect, it } from "bun:test";
import { decodeHtmlEntities, sanitizeHtml } from "../src/lib/html-cleaner";

describe("HTML Entity Decoder & Sanitizer TDD Suite", () => {
  it("should unescape &quot; quotes in test case outputs correctly", () => {
    const raw = "&quot;babad&quot;";
    const decoded = decodeHtmlEntities(raw);
    expect(decoded).toBe('"babad"');
  });

  it("should decode standard XML/HTML entities", () => {
    const input = "&lt;div class=&quot;example&quot;&gt;5 &amp; 10 &#39;test&#39; &nbsp;&lt;/div&gt;";
    const decoded = decodeHtmlEntities(input);
    expect(decoded).toBe("<div class=\"example\">5 & 10 'test'  </div>");
  });

  it("should decode numeric decimal character entities", () => {
    const input = "&#34;hello&#34; &#39;world&#39;";
    const decoded = decodeHtmlEntities(input);
    expect(decoded).toBe("\"hello\" 'world'");
  });

  it("should sanitize harmful script tags while preserving pre and code blocks", () => {
    const dangerous = '<p>Description</p><script>alert("hack")</script><pre><code>nums = [1, 2]</code></pre>';
    const clean = sanitizeHtml(dangerous);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("<p>Description</p>");
    expect(clean).toContain("<pre><code>nums = [1, 2]</code></pre>");
  });
});
