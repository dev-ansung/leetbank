import { decodeHtmlEntities } from "./html-cleaner";
import { CatalogService } from "./catalog";

export interface TestCase {
  id: number;
  name: string;
  input: string;
  expected?: string;
  explanation?: string;
}

export interface SolutionEntry {
  language: string;
  langSlug: string;
  code: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  explanation?: string;
}

export interface ProblemDetail {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  isPaidOnly: boolean;
  descriptionHtml: string;
  starterCode: Record<string, string>;
  solutions: SolutionEntry[];
  testCases: TestCase[];
  hints: string[];
  source: "leetcode" | "mirror";
  cachedAt: number;
}

export class ProblemFetcher {
  static async fetchProblem(idOrSlug: string | number): Promise<ProblemDetail> {
    const canonical = CatalogService.find(idOrSlug);
    const slug = canonical?.slug || String(idOrSlug);
    const pid = canonical?.id || (typeof idOrSlug === "number" ? idOrSlug : parseInt(String(idOrSlug), 10) || 1);
    const title = canonical?.title || slug;
    const difficulty = canonical?.difficulty || "Medium";
    const topics = canonical?.topics || [];
    const isPaid = canonical?.isPaidOnly || false;

    // 1. Fetch LeetCode Official GraphQL API
    const gqlData = await this.fetchGraphQL(slug);
    let descriptionHtml = gqlData?.content ? decodeHtmlEntities(gqlData.content) : "";
    const starterCode: Record<string, string> = {};

    if (gqlData?.codeSnippets && gqlData.codeSnippets.length > 0) {
      for (const snippet of gqlData.codeSnippets) {
        starterCode[snippet.langSlug] = snippet.code;
      }
    }

    // 2. Fetch Solutions and fallback statement for paywalled problems from Mirror
    let solutions: SolutionEntry[] = [];
    const mirrorData = await this.fetchDoocsMirror(pid, title, slug);

    if (mirrorData) {
      if (!descriptionHtml || isPaid) {
        descriptionHtml = mirrorData.descriptionHtml;
      }
      solutions = mirrorData.solutions;

      // If official starter code was paywalled, construct starter signatures from mirror solutions
      if (Object.keys(starterCode).length === 0 && mirrorData.starterCode) {
        Object.assign(starterCode, mirrorData.starterCode);
      }
    }

    // 3. Extract test cases universally from HTML description <pre> blocks
    const testCases = this.extractTestCasesFromHtml(descriptionHtml, gqlData?.exampleTestcaseList);

    return {
      id: pid,
      slug,
      title,
      difficulty,
      topics,
      isPaidOnly: isPaid,
      descriptionHtml,
      starterCode,
      solutions,
      testCases,
      hints: gqlData?.hints || [],
      source: isPaid ? "mirror" : "leetcode",
      cachedAt: Date.now()
    };
  }

  private static async fetchGraphQL(slug: string): Promise<any> {
    const url = "https://leetcode.com/graphql";
    const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        isPaidOnly
        difficulty
        content
        hints
        codeSnippets {
          lang
          langSlug
          code
        }
        exampleTestcaseList
      }
    }
    `;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "LeetBank/1.0"
        },
        body: JSON.stringify({ query, variables: { titleSlug: slug } })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.question;
    } catch {
      return null;
    }
  }

  private static async fetchDoocsMirror(
    probId: number,
    title: string,
    slug: string
  ): Promise<{ descriptionHtml: string; solutions: SolutionEntry[]; starterCode: Record<string, string> } | null> {
    const startRange = Math.floor(probId / 100) * 100;
    const endRange = startRange + 99;
    const rangeStr = `${String(startRange).padStart(4, "0")}-${String(endRange).padStart(4, "0")}`;
    const baseUrl = `https://raw.githubusercontent.com/doocs/leetcode/main/solution/${rangeStr}`;

    const candidates = [
      `${String(probId).padStart(4, "0")}.${title}`,
      `${String(probId).padStart(4, "0")}.${slug}`
    ];

    for (const folder of candidates) {
      for (const filename of ["README_EN.md", "README.md"]) {
        const url = `${baseUrl}/${encodeURIComponent(folder)}/${filename}`;
        try {
          const res = await fetch(url, { headers: { "User-Agent": "LeetBank/1.0" } });
          if (res.ok) {
            const md = await res.text();
            return this.parseMirrorMarkdown(md);
          }
        } catch {}
      }
    }
    return null;
  }

  private static parseMirrorMarkdown(md: string): {
    descriptionHtml: string;
    solutions: SolutionEntry[];
    starterCode: Record<string, string>;
  } {
    let descriptionHtml = "";
    const descMatch = md.match(/<!-- description:start -->([\s\S]*?)<!-- description:end -->/);
    if (descMatch) {
      descriptionHtml = decodeHtmlEntities(descMatch[1].trim());
    } else {
      const rawDesc = md.split(/## Solutions|## 解法|<!-- tabs:start -->/)[0];
      descriptionHtml = `<p>${rawDesc.replace(/#.*\n/g, "").trim()}</p>`;
    }

    // Extract clean concise mathematical Big-O notation
    const cleanBigO = (text?: string): string | undefined => {
      if (!text) return undefined;
      const m = text.match(/O\([^)]+\)/);
      if (m) return m[0];
      const cleaned = text.replace(/is\s+/i, "").replace(/[`$]/g, "").split(",")[0].trim();
      return cleaned || undefined;
    };

    const timeMatch = md.match(/time\s+complexity:?\s*([^\n\r.]+)/i);
    const spaceMatch = md.match(/space\s+complexity:?\s*([^\n\r.]+)/i);
    const parsedTime = cleanBigO(timeMatch?.[1]) || "O(N)";
    const parsedSpace = cleanBigO(spaceMatch?.[1]) || "O(1)";

    const solutions: SolutionEntry[] = [];
    const starterCode: Record<string, string> = {};
    const codeBlocks = md.matchAll(/####\s+([A-Za-z0-9+# ]+)[^\n]*\n[\s\S]*?```([a-z0-9]+)?\n([\s\S]*?)```/g);

    const langCounts: Record<string, number> = {};

    for (const m of codeBlocks) {
      const rawLang = m[1].trim();
      langCounts[rawLang] = (langCounts[rawLang] || 0) + 1;
      const count = langCounts[rawLang];
      const langName = count > 1 ? `${rawLang} (Approach ${count})` : rawLang;
      const baseSlug = (m[2] || rawLang).toLowerCase().replace(/\+/g, "p").replace(/#/g, "sharp");
      const langSlug = count > 1 ? `${baseSlug}-${count}` : baseSlug;
      const fullCode = m[3].trim();

      solutions.push({
        language: langName,
        langSlug,
        code: fullCode,
        timeComplexity: parsedTime,
        spaceComplexity: parsedSpace
      });

      // Extract starter signature from solution code for paywalled problems
      if (langSlug.includes("python") || langName.toLowerCase().includes("python")) {
        const sigMatch = fullCode.match(/(class\s+Solution[\s\S]*?def\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*(?:->\s*[^:]+)?:)/);
        if (sigMatch) {
          starterCode["python3"] = `${sigMatch[1]}\n        pass`;
        }
      } else if (langSlug.includes("typescript") || langName.toLowerCase().includes("typescript")) {
        const sigMatch = fullCode.match(/(function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*:\s*[^{]+)/);
        if (sigMatch) {
          starterCode["typescript"] = `${sigMatch[1]} {\n    \n};`;
        }
      } else if (langSlug.includes("cpp") || langSlug.includes("c++")) {
        const sigMatch = fullCode.match(/(class\s+Solution\s*{\s*public:\s*[^{]+)/);
        if (sigMatch) {
          starterCode["cpp"] = `${sigMatch[1]} {\n        \n    }\n};`;
        }
      } else if (langSlug.includes("java")) {
        const sigMatch = fullCode.match(/(class\s+Solution\s*{\s*public\s+[^{]+)/);
        if (sigMatch) {
          starterCode["java"] = `${sigMatch[1]} {\n        \n    }\n};`;
        }
      }
    }

    return { descriptionHtml, solutions, starterCode };
  }

  private static extractTestCasesFromHtml(html: string, rawExampleList?: string[]): TestCase[] {
    const cases: TestCase[] = [];

    // Extract from <pre> blocks in HTML (e.g. Input: ... Output: ...)
    const preBlocks = html.matchAll(/<pre>([\s\S]*?)<\/pre>/gi);
    let id = 1;

    for (const block of preBlocks) {
      const text = decodeHtmlEntities(block[1].replace(/<[^>]+>/g, "")).trim();
      const inputMatch = text.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
      const outputMatch = text.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
      const explMatch = text.match(/Explanation:\s*([\s\S]*?)$/i);

      if (inputMatch) {
        cases.push({
          id: id++,
          name: `Example ${id - 1}`,
          input: inputMatch[1].trim(),
          expected: outputMatch ? outputMatch[1].trim() : undefined,
          explanation: explMatch ? explMatch[1].trim() : undefined
        });
      }
    }

    // Fallback to raw example test cases if no pre tags found
    if (cases.length === 0 && rawExampleList && rawExampleList.length > 0) {
      return rawExampleList.map((t, idx) => ({
        id: idx + 1,
        name: `Example ${idx + 1}`,
        input: decodeHtmlEntities(t)
      }));
    }

    return cases;
  }
}
