export type CompanyId =
  | "google"
  | "meta"
  | "amazon"
  | "microsoft"
  | "bloomberg"
  | "apple"
  | "uber"
  | "bytedance"
  | "netflix";

export type RecencyWindow = "30-days" | "3-months" | "6-months" | "all-time";

export interface CompanyQuestion {
  problemId: number;
  title?: string;
  difficulty?: string;
  frequencyPercent: number;
  pattern?: string;
  priority?: "High" | "Medium" | "Low";
  notes?: string;
}

const SUPPORTED_COMPANIES: CompanyId[] = [
  "google",
  "meta",
  "amazon",
  "microsoft",
  "bloomberg",
  "apple",
  "uber",
  "bytedance",
  "netflix",
];

// In-memory sample data fallback
const LOCAL_COMPANY_DATA: Record<string, Record<string, CompanyQuestion[]>> = {
  meta: {
    "30-days": [
      { problemId: 1249, title: "Minimum Remove to Make Valid Parentheses", difficulty: "Medium", frequencyPercent: 100.0, pattern: "Sorting / Prefix / Scan", priority: "High" },
      { problemId: 339, title: "Nested List Weight Sum", difficulty: "Medium", frequencyPercent: 85.0, pattern: "Two Pointers / Recursion", priority: "High" },
      { problemId: 1, title: "Two Sum", difficulty: "Easy", frequencyPercent: 75.0, pattern: "Hash Table / Two Pointers", priority: "High" },
      { problemId: 20, title: "Valid Parentheses", difficulty: "Easy", frequencyPercent: 70.0, pattern: "Stack / String", priority: "High" },
      { problemId: 1004, title: "Max Consecutive Ones III", difficulty: "Medium", frequencyPercent: 65.0, pattern: "Sliding Window", priority: "Medium" },
      { problemId: 269, title: "Alien Dictionary", difficulty: "Hard", frequencyPercent: 60.0, pattern: "Graph / Topological Sort", priority: "High" }
    ],
    "3-months": [
      { problemId: 1, frequencyPercent: 95.0, pattern: "Hash Table", priority: "High" },
      { problemId: 1249, frequencyPercent: 90.0, pattern: "Stack / Scan", priority: "High" },
      { problemId: 269, frequencyPercent: 80.0, pattern: "Topological Sort", priority: "High" }
    ],
    "6-months": [
      { problemId: 1, frequencyPercent: 100.0, pattern: "Hash Table", priority: "High" },
      { problemId: 269, frequencyPercent: 90.0, pattern: "Topological Sort", priority: "High" }
    ],
    "all-time": [
      { problemId: 1, frequencyPercent: 100.0, pattern: "Hash Table", priority: "High" },
      { problemId: 269, frequencyPercent: 90.0, pattern: "Topological Sort", priority: "High" },
      { problemId: 253, frequencyPercent: 85.0, pattern: "Intervals / Heap", priority: "High" }
    ]
  },
  google: {
    "30-days": [
      { problemId: 2007, frequencyPercent: 100.0, pattern: "Hash Map / Sorting", priority: "High" },
      { problemId: 269, frequencyPercent: 90.0, pattern: "Graph / Topological Sort", priority: "High" },
      { problemId: 1, frequencyPercent: 85.0, pattern: "Hash Table", priority: "High" }
    ],
    "all-time": [
      { problemId: 1, frequencyPercent: 100.0, pattern: "Hash Table", priority: "High" },
      { problemId: 200, frequencyPercent: 95.0, pattern: "BFS / DFS Grid", priority: "High" },
      { problemId: 269, frequencyPercent: 90.0, pattern: "Topological Sort", priority: "High" },
      { problemId: 23, frequencyPercent: 85.0, pattern: "Priority Queue / Merge", priority: "High" },
      { problemId: 4, frequencyPercent: 80.0, pattern: "Binary Search", priority: "High" },
      { problemId: 42, frequencyPercent: 78.0, pattern: "Two Pointers / Stack", priority: "High" },
      { problemId: 146, frequencyPercent: 75.0, pattern: "LRU Cache", priority: "High" },
      { problemId: 3, frequencyPercent: 72.0, pattern: "Sliding Window", priority: "High" },
      { problemId: 56, frequencyPercent: 70.0, pattern: "Intervals", priority: "High" },
      { problemId: 121, frequencyPercent: 68.0, pattern: "Dynamic Programming", priority: "High" },
      { problemId: 15, frequencyPercent: 65.0, pattern: "Two Pointers", priority: "High" }
    ]
  }
};

export class CompanyService {
  static getSupportedCompanies(): CompanyId[] {
    return SUPPORTED_COMPANIES;
  }

  static async getQuestionsForCompany(company: string, window: RecencyWindow = "all-time"): Promise<CompanyQuestion[]> {
    const compKey = company.toLowerCase();
    const data = LOCAL_COMPANY_DATA[compKey]?.[window] || LOCAL_COMPANY_DATA[compKey]?.["all-time"] || [];
    return [...data].sort((a, b) => b.frequencyPercent - a.frequencyPercent);
  }

  static parseCompanyCsv(company: string, window: RecencyWindow, csvContent: string): CompanyQuestion[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idIdx = headers.findIndex((h) => h === "id" || h === "problem" || h === "problem id");
    const freqIdx = headers.findIndex((h) => h.includes("freq"));
    const titleIdx = headers.findIndex((h) => h === "title");
    const diffIdx = headers.findIndex((h) => h === "difficulty");
    const patternIdx = headers.findIndex((h) => h === "pattern");
    const priorityIdx = headers.findIndex((h) => h.includes("priority"));
    const notesIdx = headers.findIndex((h) => h === "notes");

    const result: CompanyQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      if (row.length === 0 || !row[0]) continue;

      const pid = parseInt(row[idIdx !== -1 ? idIdx : 0], 10);
      if (isNaN(pid)) continue;

      let freq = 50.0;
      if (freqIdx !== -1 && row[freqIdx]) {
        freq = parseFloat(row[freqIdx].replace("%", "").trim()) || 50.0;
      }

      result.push({
        problemId: pid,
        title: titleIdx !== -1 ? row[titleIdx] : undefined,
        difficulty: diffIdx !== -1 ? row[diffIdx] : undefined,
        frequencyPercent: freq,
        pattern: patternIdx !== -1 ? row[patternIdx]?.trim() : undefined,
        priority: priorityIdx !== -1 ? (row[priorityIdx]?.trim() as any) : undefined,
        notes: notesIdx !== -1 ? row[notesIdx]?.trim() : undefined,
      });
    }

    return result.sort((a, b) => b.frequencyPercent - a.frequencyPercent);
  }
}
