import { ProblemFetcher } from "../src/lib/fetcher";

function convertHtmlToMarkdown(problem: any, html?: string, testCases?: any[]): string {
  if (!html) return `# ${problem.id}. ${problem.title}\n\n**Difficulty:** ${problem.difficulty}`;
  
  let md = html;

  // 1. Convert specific block elements before stripping tags
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Example blocks
  md = md.replace(/<strong class="example">([\s\S]*?)<\/strong>/gi, "\n### $1\n");
  md = md.replace(/<div class="example-block">([\s\S]*?)<\/div>/gi, (_, block) => {
    const text = block.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return `\n\`\`\`\n${text}\n\`\`\`\n`;
  });

  // Pre / Code blocks
  md = md.replace(/<pre>([\s\S]*?)<\/pre>/gi, (_, codeContent) => {
    const cleanCode = codeContent.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g, "").trim();
    return `\n\`\`\`\n${cleanCode}\n\`\`\`\n`;
  });
  
  // Superscripts / Subscripts
  md = md.replace(/<sup>([\s\S]*?)<\/sup>/gi, "^$1");
  md = md.replace(/<sub>([\s\S]*?)<\/sub>/gi, "_$1");

  // Inline formatting
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`");
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, "\n$1\n");
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, "\n$1\n");

  // Paragraphs & breaks
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Strip ONLY valid HTML tags (preserves mathematical <=, >=, <, >)
  md = md.replace(/<\/?(?:html|body|div|span|p|a|ul|ol|li|strong|b|em|i|u|s|sub|sup|code|pre|h1|h2|h3|h4|h5|h6|table|tr|td|th|tbody|thead|tfoot|font|section|article|header|footer|nav|aside|blockquote|hr|br)[^>]*>/gi, "");

  // Decode standard HTML entities
  md = md.replace(/&nbsp;/g, " ")
         .replace(/&lt;/g, "<")
         .replace(/&gt;/g, ">")
         .replace(/&amp;/g, "&")
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'");

  // Clean excessive blank lines & trim whitespace
  md = md.replace(/[ \t]+\n/g, "\n")
         .replace(/\n{3,}/g, "\n\n")
         .trim();

  // Prepend standardized metadata header
  const header = `# ${problem.id}. ${problem.title}

- **Difficulty:** ${problem.difficulty}
- **Topics:** ${problem.topics ? problem.topics.join(", ") : "General"}
- **LeetCode Link:** https://leetcode.com/problems/${problem.slug}/

---

## Problem Statement

`;

  return header + md;
}

const p = await ProblemFetcher.fetchProblem(1);
console.log(convertHtmlToMarkdown(p, p.descriptionHtml));
