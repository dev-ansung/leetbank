# Critical User Journeys (CUJs) - LeetBank

This document defines the 5 core Critical User Journeys (CUJs) for **LeetBank** (`leetcode.anprogrammer.org`), a high-performance Cloudflare-hosted LeetCode question bank and interactive study dashboard.

---

## CUJ 1: Instant Dashboard Discovery & Filtering (`GET /`)

### User Goal
Quickly locate a target question or explore curated practice tracks among 4,037 indexed LeetCode problems without lag or page reloads.

### User Flow
```mermaid
flowchart TD
    A["User visits leetcode.anprogrammer.org"] --> B["Client loads bundled catalog.json (150KB)"]
    B --> C["User presses '/' key to focus search"]
    C --> D["Types query (e.g. 'two sum', '269', 'trie')"]
    D --> E["Instant in-memory fuzzy filtering (< 1ms)"]
    E --> F["User selects Roadmap chip (e.g. Blind 75, NeetCode 150)"]
    F --> G["Presses Enter or clicks problem row"]
    G --> H["Navigates to /269 or /alien-dictionary"]
```

### Key Requirements & Constraints
* **0 Network Requests**: Dashboard search executes strictly in client memory.
* **Keyboard-First Ergonomics**:
  * `/` focuses search bar.
  * `j` / `k` or `ArrowDown` / `ArrowUp` navigates table rows.
  * `Enter` opens the selected problem.
  * `r` selects a random problem.
  * `Esc` clears filters and search queries.
* **Curated Roadmap Pills**: Instant single-click filtering for Blind 75, NeetCode 150, Grind 75, and Top Interview 150.

---

## CUJ 2: Company-Targeted Interview Preparation with Recency Windows

### User Goal
Target practice questions asked by specific top tech companies (Meta, Google, Amazon, Microsoft, Apple, Bloomberg, Uber, ByteDance, Netflix) filtered by recency window (`Last 30 Days`, `3 Months`, `6 Months`, `All-Time`) with exact frequency rankings and pattern tags.

### User Flow
```mermaid
flowchart TD
    A["User selects Company Pill (e.g. 'Meta')"] --> B["Selects Recency Window (e.g. 'Last 30 Days')"]
    B --> C["Table instantly filters to 23 high-frequency Meta questions"]
    C --> D["Displays Frequency % (e.g. 100%, 75%), Pattern, and Priority"]
    D --> E["User sorts by highest frequency score"]
    E --> F["Opens top-ranked problem (e.g. #1249 Minimum Remove to Make Valid Parentheses)"]
```

### Key Requirements & Constraints
* **Recency Windows**:
  * `Last 30 Days` (Active interview cycle hotlist).
  * `Last 3 Months` (Recent quarter trends).
  * `Last 6 Months` (Standard prep window).
  * `All-Time` (Core historical classics).
* **Metadata Enriched**: Displays exact frequency %, algorithmic pattern tags (e.g. `Sliding Window / Prefix Scan`), and revision priority (`High` / `Medium`).

---

## CUJ 3: Direct Problem Study & Multi-Language Practice (`GET /:id_or_slug`)

### User Goal
Read a clean, distraction-free problem statement with mathematical formulas, inspect decoded example test cases, switch starter templates across 19 languages, reveal hints, and examine reference solutions.

### User Flow
```mermaid
flowchart TD
    A["User navigates to /269 or /alien-dictionary"] --> B["Edge Worker checks Cloudflare Cache"]
    B -->|Cache Hit (< 20ms)| C["Renders pre-cached Problem Page"]
    B -->|Cache Miss| D["Lazy-fetches upstream statement & solutions"]
    D --> E["Populates Edge Cache (7-day TTL)"]
    E --> C
    C --> F["User reads problem statement with KaTeX math"]
    C --> G["Inspects decoded test cases (JSON inputs & outputs)"]
    C --> H["Switches starter code language tab (Python / TS / Go / Rust / C++)"]
    C --> I["Clicks 'Copy Code' or 'Open in VS Code'"]
    C --> J["Reveals progressive hint accordion"]
    C --> K["Views optimal reference solution and Big-O complexity"]
```

### Key Requirements & Constraints
* **Clean Typography & Math**: Renders KaTeX LaTeX mathematical expressions seamlessly without visual distortion.
* **Decoded Test Cases**: No raw HTML entities (e.g. `&quot;bab&quot;` must be rendered as `"bab"`).
* **Multi-Language Selector**:
  * 19 starter code languages from official LeetCode snippets.
  * 16 reference solution languages with Big-O time and space complexity annotations.
* **Actionable Controls**: One-click "Copy Code Snippet", "Copy JSON Test Cases", and "Open in VS Code" handler.

---

## CUJ 4: Paywall & Premium Problem Bypass

### User Goal
Access locked/premium LeetCode problems (e.g. `#269 Alien Dictionary`, `#253 Meeting Rooms II`) with complete descriptions and verified reference solutions.

### User Flow
```mermaid
flowchart TD
    A["User requests /269 (Alien Dictionary)"] --> B["GraphQL returns isPaidOnly = true / null content"]
    B --> C["Edge Worker transparently queries GitHub Doocs Mirror"]
    C --> D["Extracts complete description, examples, and Python/Java/C++ solutions"]
    D --> E["Unescapes HTML & formats test cases"]
    E --> F["Renders complete problem page without paywall blocker"]
    F --> G["Caches result at Cloudflare Edge"]
```

### Key Requirements & Constraints
* **Automatic Fallback**: Zero user intervention required; the system falls back to the mirror on any 403, paywall flag, or empty GraphQL response.
* **Parity**: Premium questions feature the same rich test cases and multi-language solution tabs as free questions.

---

## CUJ 5: Developer & Automation JSON API (`GET /api/...`)

### User Goal
Programmatically retrieve problem metadata, statements, test cases, and code templates for IDE extensions, CLI tools, or automated scripts.

### Endpoints
* `GET /api/problems`: Returns the lightweight catalog index (filterable by `difficulty`, `topic`, `roadmap`, `company`, `window`, `search`).
* `GET /api/problem/:id_or_slug`: Returns hydrated problem JSON payload with statement HTML, test cases, starter code map, and reference solutions.
