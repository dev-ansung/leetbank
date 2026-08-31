import TurndownService from "turndown";
import tracksData from "../data/tracks.json";
import { CatalogService } from "./catalog";
import { CompanyService, type RecencyWindow } from "./companies";
import { ProblemFetcher } from "./fetcher";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

turndownService.addRule("superscript", {
  filter: "sup",
  replacement: (content) => `^${content}`,
});

turndownService.addRule("subscript", {
  filter: "sub",
  replacement: (content) => `_${content}`,
});

turndownService.addRule("exampleBlock", {
  filter: (node) => node.nodeName === "DIV" && node.classList.contains("example-block"),
  replacement: (content) => `\n\`\`\`\n${content.trim()}\n\`\`\`\n`,
});

export const MCP_TOOLS = [
  {
    name: "get_problem",
    description:
      "Fetches full problem details by ID (e.g. 1) or title slug (e.g. 'two-sum'). Returns the markdown problem statement, 19 starter code snippets, hints, and similar questions.",
    inputSchema: {
      type: "object",
      properties: {
        idOrSlug: {
          type: ["string", "number"],
          description: "Numerical problem ID (e.g. 1, 269) or URL title slug (e.g. 'two-sum', 'alien-dictionary')",
        },
      },
      required: ["idOrSlug"],
    },
  },
  {
    name: "search_problems",
    description:
      "Searches and filters the 4,041 LeetCode problem catalog by keyword, topic, difficulty, or access status.",
    inputSchema: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "Search keyword for problem title, slug, ID, or topic tag",
        },
        topic: {
          type: "string",
          description: "Filter by topic tag (e.g. 'Array', 'Dynamic Programming', 'Graph', 'Tree', 'Two Pointers')",
        },
        difficulty: {
          type: "string",
          enum: ["Easy", "Medium", "Hard", "All"],
          description: "Filter by difficulty level",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20, max: 100)",
        },
        offset: {
          type: "number",
          description: "Pagination offset (default: 0)",
        },
      },
    },
  },
  {
    name: "get_company_questions",
    description:
      "Retrieves interview question frequency datasets for top tech companies (Meta, Google, Amazon, Microsoft, Bloomberg, Apple, Uber, ByteDance, Netflix) across 4 recency windows.",
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description:
            "Target company name (e.g. 'meta', 'google', 'amazon', 'microsoft', 'bloomberg', 'apple', 'uber', 'bytedance', 'netflix')",
        },
        window: {
          type: "string",
          enum: ["30-days", "3-months", "6-months", "all-time"],
          description: "Interview recency timeframe (default: '30-days')",
        },
        limit: {
          type: "number",
          description: "Maximum number of questions to return (default: 20)",
        },
      },
      required: ["company"],
    },
  },
  {
    name: "get_solution",
    description:
      "Fetches multi-author reference solutions (walkccc concise implementations in Python3/C++/Java, or Doocs 16-language archive) with repository source links.",
    inputSchema: {
      type: "object",
      properties: {
        idOrSlug: {
          type: ["string", "number"],
          description: "Problem ID or slug",
        },
        author: {
          type: "string",
          enum: ["all", "walkccc", "doocs"],
          description: "Solution author/provider (default: 'all')",
        },
        language: {
          type: "string",
          description: "Programming language filter (e.g. 'python3', 'cpp', 'java', 'typescript', 'go', 'rust')",
        },
      },
      required: ["idOrSlug"],
    },
  },
  {
    name: "get_random_problem",
    description:
      "Picks a random LeetCode problem matching optional practice criteria (difficulty, topic, or practice track).",
    inputSchema: {
      type: "object",
      properties: {
        difficulty: {
          type: "string",
          enum: ["Easy", "Medium", "Hard"],
          description: "Difficulty filter",
        },
        topic: {
          type: "string",
          description: "Topic tag filter",
        },
        track: {
          type: "string",
          enum: ["blind-75", "grind-75", "neetcode-150", "top-150", "hot-100", "carl-200"],
          description: "Curated track filter",
        },
      },
    },
  },
  {
    name: "get_track_problems",
    description:
      "Retrieves curated practice curriculum roadmaps (Blind 75, Grind 75, NeetCode 150, Top 150 Interview, LeetCode Hot 100, Carl 200).",
    inputSchema: {
      type: "object",
      properties: {
        track: {
          type: "string",
          enum: ["blind-75", "grind-75", "neetcode-150", "top-150", "hot-100", "carl-200"],
          description: "Track identifier",
        },
      },
      required: ["track"],
    },
  },
];

export async function handleMcpToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "get_problem": {
      const { idOrSlug } = args;
      const detail = await ProblemFetcher.fetchProblem(idOrSlug);
      const markdownStatement = detail.descriptionHtml
        ? turndownService.turndown(detail.descriptionHtml)
        : "No statement available.";

      const formatted = {
        id: detail.id,
        title: detail.title,
        slug: detail.slug,
        difficulty: detail.difficulty,
        topics: detail.topics,
        isPaidOnly: detail.isPaidOnly,
        leetcodeUrl: `https://leetcode.com/problems/${detail.slug}/`,
        statementMarkdown: markdownStatement,
        hints: detail.hints,
        similarQuestions: detail.similarQuestions,
        starterCodeLanguages: Object.keys(detail.starterCode),
        starterCodeSnippets: detail.starterCode,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }

    case "search_problems": {
      const { q, topic, difficulty, limit = 20, offset = 0 } = args;
      const allResults = CatalogService.search({
        search: q,
        topic,
        difficulty: difficulty === "All" ? undefined : difficulty,
      });

      const paginated = allResults.slice(offset, offset + Math.min(limit, 100));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total: allResults.length,
                offset,
                limit: Math.min(limit, 100),
                problems: paginated,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_company_questions": {
      const { company, window = "30-days", limit = 20 } = args;
      const questions = await CompanyService.getQuestionsForCompany(company, window as RecencyWindow);
      const limited = questions.slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                company,
                window,
                total: questions.length,
                questions: limited,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_solution": {
      const { idOrSlug, author = "all", language } = args;
      const detail = await ProblemFetcher.fetchProblem(idOrSlug);
      let solutions = detail.solutions;

      if (author && author !== "all") {
        solutions = solutions.filter((s) => s.source === author);
      }

      if (language) {
        const langLower = language.toLowerCase();
        solutions = solutions.filter(
          (s) => s.langSlug.toLowerCase() === langLower || s.language.toLowerCase() === langLower,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: detail.id,
                title: detail.title,
                totalSolutions: solutions.length,
                solutions: solutions.map((s) => ({
                  author: s.source || "doocs",
                  language: s.language,
                  langSlug: s.langSlug,
                  code: s.code,
                  referenceUrl: s.referenceUrl,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_random_problem": {
      const { difficulty, topic, track } = args;
      let pool = CatalogService.getAll();

      if (difficulty) pool = pool.filter((p) => p.difficulty === difficulty);
      if (topic) pool = pool.filter((p) => p.topics.some((t) => t.toLowerCase() === topic.toLowerCase()));
      if (track) {
        const cleanTrack = track.replace(/[-_]/g, "").toLowerCase();
        const trackObj = tracksData.tracks.find((t) => t.id.replace(/[-_]/g, "").toLowerCase() === cleanTrack);
        if (trackObj) {
          const trackSet = new Set(trackObj.problemIds);
          pool = pool.filter((p) => trackSet.has(p.id));
        }
      }

      if (pool.length === 0) pool = CatalogService.getAll();
      const randomProblem = pool[Math.floor(Math.random() * pool.length)];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: randomProblem.id,
                title: randomProblem.title,
                slug: randomProblem.slug,
                difficulty: randomProblem.difficulty,
                topics: randomProblem.topics,
                leetcodeUrl: `https://leetcode.com/problems/${randomProblem.slug}/`,
                leetbankUrl: `https://leetbank.pages.dev/${randomProblem.id}`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "get_track_problems": {
      const { track } = args;
      const cleanTrack = track.replace(/[-_]/g, "").toLowerCase();
      const trackObj = tracksData.tracks.find((t) => t.id.replace(/[-_]/g, "").toLowerCase() === cleanTrack);
      if (!trackObj) {
        throw new Error(
          `Track '${track}' not found. Supported tracks: blind-75, grind-75, neetcode-150, top-150, hot-100, carl-200`,
        );
      }

      const allProblems = CatalogService.getAll();
      const problemMap = new Map(allProblems.map((p) => [p.id, p]));
      const resolved = trackObj.problemIds.map((id) => problemMap.get(id)).filter(Boolean);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                trackId: trackObj.id,
                name: trackObj.name,
                description: trackObj.description,
                total: resolved.length,
                problems: resolved,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}
