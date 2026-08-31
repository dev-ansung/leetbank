import TurndownService from "turndown";
import { ProblemFetcher } from "../src/lib/fetcher";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

// Custom rule for superscripts (e.g. 10^4)
turndownService.addRule("superscript", {
  filter: "sup",
  replacement: (content) => `^${content}`,
});

// Custom rule for subscripts (e.g. nums_i)
turndownService.addRule("subscript", {
  filter: "sub",
  replacement: (content) => `_${content}`,
});

// Custom rule for example blocks
turndownService.addRule("exampleBlock", {
  filter: (node) => node.nodeName === "DIV" && node.classList.contains("example-block"),
  replacement: (content) => `\n\`\`\`\n${content.trim()}\n\`\`\`\n`,
});

function convertHtmlToMarkdownWithTurndown(problem: any, html?: string): string {
  if (!html) return `# ${problem.id}. ${problem.title}\n\n**Difficulty:** ${problem.difficulty}`;

  const bodyMd = turndownService.turndown(html);

  const header = `# ${problem.id}. ${problem.title}

- **Difficulty:** ${problem.difficulty}
- **Topics:** ${problem.topics ? problem.topics.join(", ") : "General"}
- **LeetCode Link:** https://leetcode.com/problems/${problem.slug}/

---

## Problem Statement

`;

  return header + bodyMd;
}

const p = await ProblemFetcher.fetchProblem(1);
console.log(convertHtmlToMarkdownWithTurndown(p, p.descriptionHtml));
