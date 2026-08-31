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

## 🗄️ Data Model

Cloudflare D1 (Globally Replicated SQLite) persists the canonical catalog, company frequency mappings, and cached problem statements:

```mermaid
erDiagram
    PROBLEMS ||--o{ COMPANY_FREQUENCIES : "tracks frequency"
    PROBLEMS ||--o{ ROADMAP_PROBLEMS : "indexed in roadmaps"

    PROBLEMS {
        int id PK "Canonical Problem ID"
        string slug UK "URL slug"
        string title "Problem title"
        string difficulty "Easy | Medium | Hard"
        string topics "Comma-separated topic tags"
        int is_paid_only "0: Free, 1: Premium"
        string ac_rate "Acceptance percentage"
        string total_accepted "Total submission count"
        string description_html "Cached full problem statement HTML"
        string starter_code_json "Cached official starter languages (19)"
        string solutions_json "Cached multi-language reference solutions"
        string test_cases_json "Cached structured test cases"
        string hints_json "Cached problem hints"
        timestamp cached_at "Last upstream edge cache timestamp"
        timestamp created_at "Record creation timestamp"
    }

    COMPANY_FREQUENCIES {
        int id PK "Surrogate Key"
        int problem_id FK "References PROBLEMS(id)"
        string company "meta | google | amazon | microsoft | ..."
        string window "30-days | 3-months | 6-months | all-time"
        float frequency_percent "Interview frequency percentage"
        string pattern "Algorithmic pattern tag"
        string priority "High | Medium | Low"
    }

    ROADMAP_PROBLEMS {
        string roadmap_id PK "blind75 | neetcode150"
        int problem_id PK, FK "References PROBLEMS(id)"
        int order_index "Sequential track ordering"
    }
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
