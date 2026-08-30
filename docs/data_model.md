# Data Model & TypeScript Schemas - LeetBank

This document defines the core data structures, TypeScript interfaces, and validation schemas used throughout **LeetBank**.

---

## 1. Core Domain Types

```typescript
export type Difficulty = "Easy" | "Medium" | "Hard";

export type RecencyWindow = "30-days" | "3-months" | "6-months" | "all-time";

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

export interface CompanyFrequency {
  company: CompanyId;
  companyName: string;
  window: RecencyWindow;
  frequencyPercent: number; // e.g. 100.0, 75.0
  pattern?: string;        // e.g. "Hashing / Sliding Window"
  priority?: "High" | "Medium" | "Low";
  notes?: string;
}

export type SupportedLanguage =
  | "python3"
  | "typescript"
  | "javascript"
  | "golang"
  | "rust"
  | "cpp"
  | "java"
  | "csharp"
  | "c"
  | "swift"
  | "kotlin"
  | "ruby"
  | "php"
  | "dart"
  | "scala"
  | "elixir"
  | "erlang"
  | "racket"
  | "sql";

export interface RoadmapTrack {
  id: string; // e.g. "blind75", "neetcode150", "grind75"
  name: string;
  description: string;
  problemIds: number[];
}
```

---

## 2. Catalog Index Schema (`catalog.json`)

```typescript
export interface ProblemSummary {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  isPaidOnly: boolean;
  acRate?: string;        // e.g. "58.1%"
  totalAccepted?: string; // e.g. "23.3M"
  companyFrequencies?: CompanyFrequency[];
}
```

---

## 3. Hydrated Problem Detail Schema (`ProblemDetail`)

```typescript
export interface TestCase {
  id: number;
  name: string;
  input: Record<string, any> | any[];
  expected: any;
}

export interface SolutionEntry {
  language: string;
  langSlug: string;
  code: string;
  timeComplexity?: string;  // e.g. "O(N)"
  spaceComplexity?: string; // e.g. "O(N)"
  explanation?: string;
}

export interface ProblemDetail extends ProblemSummary {
  descriptionHtml: string;
  stats: {
    totalAccepted: string;
    totalSubmission: string;
    acRate: string;
    likes?: number;
    dislikes?: number;
  };
  starterCode: Record<string, string>; // Maps langSlug -> starter snippet
  solutions: SolutionEntry[];
  testCases: TestCase[];
  hints: string[];
  similarProblems: {
    id?: number;
    title: string;
    slug: string;
    difficulty: Difficulty;
  }[];
  source: "leetcode" | "mirror";
  cachedAt: number; // Unix timestamp
}
```
