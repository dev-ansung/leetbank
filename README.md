# 🏦 LeetBank

> Ultra-fast, zero-paywall LeetCode question bank with 4,037 unlocked problems, company interview tracks, multi-author reference solutions, and 19 starter code languages deployed on Cloudflare Pages and D1 Edge.

[![Deployment](https://img.shields.io/badge/deployment-Cloudflare%20Pages-f38020?logo=cloudflare)](https://leetbank.pages.dev)
[![Database](https://img.shields.io/badge/database-Cloudflare%20D1%20SQLite-007acc?logo=sqlite)](https://developers.cloudflare.com/d1/)
[![Sync Pipeline](https://img.shields.io/badge/sync%20pipeline-weekly%20cron-blue?logo=githubactions)](https://github.com/dev-ansung/leetbank/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/tests-21%20passed-emerald)](#)
[![Linter](https://img.shields.io/badge/linter-Biome-60a5fa?logo=biome)](https://biomejs.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## About

LeetBank provides an instant, distraction-free environment for algorithmic practice and technical interview preparation. It unifies all 4,037 LeetCode problems (both free and locked premium questions) with multi-author reference implementations, company frequency filters, and official multi-language starter code.

### Why LeetBank?
- **Zero Paywalls**: Access complete statements, diagrams, and starter code for paywalled problems without a subscription.
- **Multi-Author Solutions**: Compare concise algorithmic implementations from **walkccc** with comprehensive 16-language archives from **Doocs**.
- **Company & Recency Filtering**: Filter questions asked in real interviews at Meta, Google, Amazon, and more across 4 recency windows.
- **Always Up to Date**: Automated weekly GitHub Actions cron synchronizes newly released contest problems, topic tags, and company frequency datasets.
- **Edge Speed**: Sub-millisecond queries powered by Cloudflare Pages and D1 SQLite.

---

## Preview

| Problemset Dashboard | Problem Statement & Details | Multi-Author Solutions |
| :---: | :---: | :---: |
| <img src="./assets/dashboard_light.png" alt="LeetBank Problemset Dashboard" width="100%" /> | <img src="./assets/problem_modal_light.png" alt="LeetBank Problem Detail" width="100%" /> | <img src="./assets/solutions_modal_light.png" alt="LeetBank Solutions" width="100%" /> |

---

## Features

- 🔓 **4,037 Complete Problems**: Statements, formatted examples, constraints, and follow-ups for all public and premium problems.
- 📚 **Multi-Author Solutions**: Instant toggling between **walkccc** (clean Python3, C++, Java) and **Doocs** (16 languages) with direct GitHub source links.
- 🏢 **Company Interview Sets**: Curated question frequency lists for 9 top companies (**Meta**, **Google**, **Amazon**, **Microsoft**, **Bloomberg**, **Apple**, **Uber**, **ByteDance**, **Netflix**) across 4 recency windows (**30 Days**, **3 Months**, **6 Months**, **All-Time**).
- 🎯 **Curated Practice Roadmaps**: Built-in problem tracks for **Blind 75**, **Grind 75**, **NeetCode 150**, **Top 150 Interview**, **LeetCode Hot 100**, and **Carl 200**.
- 🏷️ **Official Topic Taxonomy**: Synchronized multi-tag associations with uniform filter badges.
- 💡 **Progressive Hints & Similar Questions**: Collapsible hint disclosure cards and clickable related problems graph.
- 💻 **19 Starter Code Languages**: Official templates for `Python3`, `TypeScript`, `C++`, `Java`, `Go`, `Rust`, `Swift`, `Kotlin`, `C#`, `PHP`, `Ruby`, `Scala`, and more.
- 📋 **1-Click Markdown Copying**: Export clean GitHub Flavored Markdown problem descriptions.

---

## 🔄 Automated Data Freshness Pipeline

To ensure the problem catalog and company question sets never go stale, LeetBank runs an automated synchronization pipeline:

```mermaid
flowchart TD
    Cron["GitHub Actions Weekly Cron (Every Monday 04:00 UTC)"] -->|"1. Fetch New Problems"| LC_GQL["LeetCode Official GraphQL"]
    Cron -->|"2. Sync Interview Frequencies"| Comp_Tracker["Company Interview Tracker CSVs"]
    
    LC_GQL -->|"New IDs + Topic Tags"| CatalogJSON["src/data/catalog.json"]
    Comp_Tracker -->|"30d / 3m / 6m / All-Time"| CompJSON["src/data/companies.json"]
    
    CatalogJSON -->|"3. Automated Test Suite"| BunTest["bun test (21 Tests)"]
    CompJSON -->|"3. Automated Test Suite"| BunTest
    
    BunTest -->|"4. Deploy Latest Build"| CF_Pages["Cloudflare Pages Deployment"]
    
    User["User opens problem"] -.->|"On-Demand Fetch"| LiveSol["Live walkccc & Doocs Raw Repositories"]
```

1. **Weekly Problemset Sync**:
   * Runs automatically every Monday at 04:00 UTC (following LeetCode's weekly contests).
   * Queries LeetCode GraphQL `problemsetQuestionList` to ingest newly published problem IDs, updated acceptance stats, and official topic tags.
2. **Company Interview Frequency Refresh**:
   * Pulls the latest frequency CSVs for Meta, Google, Amazon, Microsoft, and others across the 4 recency windows (`30 Days`, `3 Months`, `6 Months`, `All-Time`).
3. **Live Multi-Author Solutions**:
   * Solutions from `walkccc/LeetCode` and `doocs/leetcode` are pulled directly from their repositories, ensuring any upstream community additions and corrections are available immediately.
4. **Automated CI/CD Verification**:
   * Runs the full `bun test` suite and deploys the updated edge build to Cloudflare Pages automatically.

---

## Quick Start (Local Development)

### Requirements
- [Bun](https://bun.sh) (>= 1.1)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/dev-ansung/leetbank.git
cd leetbank

# 2. Install dependencies
bun install

# 3. Start local development server
bun dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Running Tests & Linter

```bash
# Run test suite
bun test

# Run Biome linter check
bun run lint

# Auto-format and fix lint issues
bun run lint:fix
```

---

## Architecture

```mermaid
flowchart TD
    User["Client (Browser / API Client)"] -->|"HTTPS"| EdgeRouter["Cloudflare Pages / Workers Edge Router"]

    subgraph CF_Edge["Cloudflare Edge Layer"]
        EdgeRouter -->|"Catalog Search"| CatalogEngine["Catalog & Filter Engine"]
        EdgeRouter -->|"Company Sets"| CompanyEngine["Company & Recency Join Engine"]
        EdgeRouter -->|"Problem Detail"| CacheController["Cache-Aside Problem Controller"]
        
        CacheController -->|"1. Fast DB Read (< 5ms)"| D1_DB[("Cloudflare D1 Database")]
        CatalogEngine <-->|"Indexed SQL Queries"| D1_DB
        CompanyEngine <-->|"Company / Window Lookups"| D1_DB
    end

    subgraph Upstream_Ingestion["Upstream Ingestion (On Cache-Miss)"]
        CacheController -->|"2. Fetch Upstream in Parallel"| Ingest["Ingestion Pipeline"]
        Ingest -->|"Official Statements & Snippets"| LC_GQL["LeetCode GraphQL API"]
        Ingest -->|"Mirror Solutions & Locked Statements"| Doocs_CDN["Doocs LeetCode Archive"]
        Ingest -->|"Concise Multi-Lang Solutions"| Walkccc_CDN["walkccc / LeetCode Repository"]
        Ingest -->|"3. Cache to D1"| D1_DB
    end
```

---

## API Reference

### 1. `GET /api/problems`
Search, filter, and paginate through the problem catalog.

```bash
curl -s "https://leetbank.pages.dev/api/problems?difficulty=Medium&topic=Array&limit=10" | jq .
```

| Parameter | Type | Description | Default |
| :--- | :---: | :--- | :---: |
| `difficulty` | `string` | Filter by `Easy`, `Medium`, or `Hard` | `All` |
| `topic` | `string` | Filter by topic tag (e.g. `Array`, `Dynamic Programming`) | `undefined` |
| `q` | `string` | Search query for ID, title, slug, or topic | `undefined` |
| `limit` | `number` | Number of items per page | `50` |
| `offset` | `number` | Pagination offset | `0` |

---

### 2. `GET /api/problem/:id`
Fetch complete problem detail (HTML statement, 19 starter code snippets, multi-author reference solutions, hints, similar questions).

```bash
curl -s "https://leetbank.pages.dev/api/problem/1" | jq .
```

---

### 3. `GET /api/companies`
Fetch company interview question datasets with frequency metadata.

```bash
curl -s "https://leetbank.pages.dev/api/companies?company=meta&window=30-days" | jq .
```

| Parameter | Type | Description | Default |
| :--- | :---: | :--- | :---: |
| `company` | `string` | `meta`, `google`, `amazon`, `microsoft`, `bloomberg`, `apple`, `uber`, `bytedance`, `netflix` | `undefined` |
| `window` | `string` | `30-days`, `3-months`, `6-months`, `all-time` | `all-time` |

---

### 4. `GET /api/d1-health`
Returns live Cloudflare D1 database connection telemetry and record counts.

---

## Acknowledgments

- [LeetCode](https://leetcode.com) for the original algorithmic problemset and GraphQL API.
- [walkccc/LeetCode](https://github.com/walkccc/LeetCode) by **@walkccc** for concise, high-quality multi-language reference solutions.
- [doocs/leetcode](https://github.com/doocs/leetcode) by **@doocs** for comprehensive open-source algorithmic solutions across 16 programming languages.
- [Tech Interview Handbook](https://www.techinterviewhandbook.org/grind75) by **Yangshun Tay** for the Grind 75 curriculum.
- [NeetCode](https://neetcode.io) for the NeetCode 150 practice roadmap.

---

## License

This project is open source under the [MIT License](LICENSE).  
For educational and interview preparation purposes. LeetCode is a registered trademark of LeetCode LLC.
