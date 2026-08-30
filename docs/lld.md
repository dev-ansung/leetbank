# Low-Level Design (LLD) - LeetBank

This document details the code structure, module breakdown, edge handlers, and error recovery policies for **LeetBank**.

---

## 1. Directory Structure

```text
leetbank/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── data/
│   │   ├── catalog.json           # 4,037 Canonical problems (ID, slug, title, diff, topics)
│   │   └── tracks/                # Curated lists: blind75.json, neetcode150.json, grind75.json
│   ├── lib/
│   │   ├── fetcher.ts             # Upstream GraphQL + Doocs Mirror fetcher
│   │   ├── cache.ts               # Cloudflare KV & Cache API client
│   │   ├── modernizer.ts          # Python 3.14 PEP 8 / 585 / 604 modernizer
│   │   └── html-cleaner.ts        # HTML entity decoder (&quot; -> ") and sanitizer
│   ├── components/
│   │   ├── Navbar.astro           # Header with search trigger & theme toggle
│   │   ├── ProblemTable.tsx       # Fast client-side fuzzy filterable table
│   │   ├── CodeSnippet.tsx        # Multi-language syntax-highlighted code viewer
│   │   ├── TestCaseCards.tsx      # Clean test case input & expected cards
│   │   ├── SolutionTabs.tsx       # Multi-language reference solutions viewer
│   │   ├── HintAccordion.tsx      # Progressive hints with spoiler blur
│   │   └── RoadmapPills.tsx       # Roadmap filter chips
│   ├── pages/
│   │   ├── index.astro            # Home dashboard (/)
│   │   ├── [id].astro             # Problem SSR page (/:id or /:slug)
│   │   └── api/
│   │       ├── problems.ts        # GET /api/problems (Catalog search)
│   │       └── problem/
│   │           └── [id].ts        # GET /api/problem/:id (Detail JSON)
├── wrangler.jsonc                 # Cloudflare Pages / Workers configuration
├── astro.config.mjs               # Astro + Cloudflare adapter config
├── package.json
└── tsconfig.json
```

---

## 2. Core Service Modules

### A. `lib/html-cleaner.ts`
Decodes HTML entities and normalizes string values from LeetCode output:
```typescript
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}
```

### B. `lib/fetcher.ts`
Unified upstream fetcher handling GraphQL queries and Doocs mirror fallback:
```typescript
export class ProblemFetcher {
  static async fetchProblem(idOrSlug: string | number): Promise<ProblemDetail> {
    // 1. Resolve canonical problem from catalog
    // 2. Fetch GraphQL data
    // 3. Fallback to mirror if isPaidOnly or failed
    // 4. Extract 19 starter code snippets and 16 reference solutions
    // 5. Decode HTML entities in test cases
  }
}
```

---

## 3. Error Handling & Fault-Tolerance Policy
1. **Upstream Rate Limit (429) / Down**: Transparently falls back to Doocs GitHub mirror.
2. **Missing Test Cases**: Generates fallback schema based on parameter metadata.
3. **Invalid Problem ID/Slug**: Returns standard 404 page with a search shortcut back to the home dashboard.
