# 🏦 LeetBank

> Ultra-fast, zero-paywall LeetCode question bank and interview preparation platform deployed on **Cloudflare Edge** with **Cloudflare D1 SQL Database**.

[![CI](https://github.com/dev-ansung/leetbank/actions/workflows/deploy.yml/badge.svg)](https://github.com/dev-ansung/leetbank/actions/workflows/deploy.yml)
[![Deployment](https://img.shields.io/badge/deployment-Cloudflare%20Pages-f38020?logo=cloudflare)](https://leetbank.pages.dev)
[![Database](https://img.shields.io/badge/database-Cloudflare%20D1%20SQLite-007acc?logo=sqlite)](https://developers.cloudflare.com/d1/)
[![Tests](https://img.shields.io/badge/tests-22%20passed-emerald)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## 🏛️ High-Level System Architecture (HLD)

LeetBank is built as an edge-native application leveraging Cloudflare's serverless infrastructure:

```mermaid
flowchart TD
    User["Client (Browser / IDE)"] -->|"HTTPS Requests"| EdgeRouter["Cloudflare Edge Router (Astro SSR)"]

    subgraph CF_Edge["Cloudflare Edge Infrastructure"]
        EdgeRouter -->|"Catalog & Search API"| CatalogQuery["SQL Catalog & Filter Engine"]
        EdgeRouter -->|"Company Questions API"| CompanyQuery["SQL Company Frequency Join"]
        EdgeRouter -->|"Problem Detail API"| CacheAside["Cache-Aside Problem Controller"]
        
        CacheAside -->|"1. Fast DB Read (under 5ms)"| D1_DB[("Cloudflare D1 Database")]
        CatalogQuery <-->|"Indexed SQL Queries"| D1_DB
        CompanyQuery <-->|"SQL Joins (Company + Window)"| D1_DB
    end

    subgraph Upstream_Ingestion["Upstream Ingestion (On Cache-Miss)"]
        CacheAside -->|"2. If not cached in D1"| IngestEngine["Dual-Source Ingestion Engine"]
        IngestEngine -->|"Primary"| LC_GQL["LeetCode GraphQL API (19 Starter Languages)"]
        IngestEngine -->|"Paywall Fallback"| Doocs_CDN["GitHub Doocs Mirror CDN (Statements + Solutions)"]
        IngestEngine -->|"3. Persist fetched payload"| D1_DB
    end

    subgraph CI_CD["Automated Freshness Pipeline"]
        GHA["GitHub Actions (Weekly Cron)"] -->|"wrangler d1 execute"| D1_DB
    end
```

---

## 🗄️ Cloudflare D1 Database Architecture

Cloudflare D1 (Globally Replicated SQLite) serves as the persistent single source of truth:

```sql
-- 1. Canonical Problem Catalog & Edge Content Cache
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
  topics TEXT NOT NULL,
  is_paid_only INTEGER DEFAULT 0,
  ac_rate TEXT,
  total_accepted TEXT,
  description_html TEXT,
  starter_code_json TEXT,
  solutions_json TEXT,
  test_cases_json TEXT,
  hints_json TEXT,
  cached_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_is_paid ON problems(is_paid_only);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);

-- 2. Company Interview Frequency Datasets
CREATE TABLE IF NOT EXISTS company_frequencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  company TEXT NOT NULL,
  window TEXT NOT NULL,
  frequency_percent REAL NOT NULL,
  pattern TEXT,
  priority TEXT,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comp_freq ON company_frequencies(company, window, frequency_percent DESC);

-- 3. Curated Roadmaps (Blind 75, NeetCode 150)
CREATE TABLE IF NOT EXISTS roadmap_problems (
  roadmap_id TEXT NOT NULL,
  problem_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (roadmap_id, problem_id),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
```

---

## 🔄 Core Data Flows

### 1. Problem Detail Cache-Aside Pattern (`GET /api/problem/:id`)
1. **D1 Read**: Worker queries `SELECT * FROM problems WHERE id = ? OR slug = ?`.
2. **Cache Hit**: If `description_html` and `starter_code_json` are populated, returns the cached payload in **$< 5\text{ms}$**.
3. **Cache Miss**:
   * Fetches official starter code and metadata from LeetCode GraphQL.
   * If locked or solutions missing, queries GitHub Doocs Mirror CDN.
   * Parses statements, test cases, and Big-$O$ complexity.
   * Asynchronously updates D1 with the parsed payload so subsequent hits worldwide are instant.

### 2. Company Filtering & Ranking (`GET /api/companies?company=amazon&window=30-days`)
* Executes an indexed SQL join between `problems` and `company_frequencies` ordered by `frequency_percent DESC`.

---

## 🚀 Live Endpoints

| Route | Description | Latency |
| :--- | :--- | :---: |
| **`GET /`** | Interactive Dashboard (Search, Tracks, Companies, Topics) | $< 10\text{ms}$ |
| **`GET /:id`** | Dynamic Edge SSR Problem View (e.g. `/234`, `/269`) | $< 50\text{ms}$ |
| **`GET /api/problems`** | SQL Catalog Filter & Pagination API | $< 15\text{ms}$ |
| **`GET /api/problem/:id`** | Problem Detail (Statements, 19 Starter Code, Solutions) | $< 5\text{ms}$ (Cached) |
| **`GET /api/companies`** | Company Interview Frequencies & Pattern Tags | $< 10\text{ms}$ |
| **`GET /api/d1-health`** | Cloudflare D1 Live Connection Telemetry | $< 6\text{ms}$ |

---

## 💻 Tech Stack

* **Edge Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/) + [Cloudflare Workers](https://workers.cloudflare.com/)
* **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Edge SQLite)
* **Framework**: [Astro 5](https://astro.build/) (Edge SSR Mode) + [React 19](https://react.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn-ui](https://ui.shadcn.com/) design tokens
* **Testing**: [Bun Test](https://bun.sh/) (22 unit & integration tests)
