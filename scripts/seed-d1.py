#!/usr/bin/env python3
"""
Seed script: Populates all 4,037 problems, company frequencies, and roadmaps into Cloudflare D1.
"""

import json
import os
import sqlite3
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, "..")
CATALOG_FILE = os.path.join(BASE_DIR, "src/data/catalog.json")
COMPANIES_FILE = os.path.join(BASE_DIR, "src/data/companies.json")
SQL_OUTPUT_FILE = os.path.join(BASE_DIR, "seed_data.sql")

print("🔄 Generating D1 SQL migration file...")

with open(CATALOG_FILE, "r", encoding="utf-8") as f:
    catalog = json.load(f)

with open(COMPANIES_FILE, "r", encoding="utf-8") as f:
    comp_data = json.load(f)

sql_statements = [
    "-- Cloudflare D1 Full Seed Migration",
    "PRAGMA foreign_keys = OFF;",
    """CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
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
);""",
    "CREATE INDEX IF NOT EXISTS idx_problems_diff ON problems(difficulty);",
    "CREATE INDEX IF NOT EXISTS idx_problems_paid ON problems(is_paid_only);",
    "CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);",
    """CREATE TABLE IF NOT EXISTS company_frequencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  company TEXT NOT NULL,
  window TEXT NOT NULL,
  frequency_percent REAL NOT NULL,
  pattern TEXT,
  priority TEXT
);""",
    "CREATE INDEX IF NOT EXISTS idx_comp_freq ON company_frequencies(company, window, frequency_percent DESC);",
    """CREATE TABLE IF NOT EXISTS roadmap_problems (
  roadmap_id TEXT NOT NULL,
  problem_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (roadmap_id, problem_id)
);""",
    "DELETE FROM problems;",
    "DELETE FROM company_frequencies;",
    "DELETE FROM roadmap_problems;"
]

# 1. Insert 4,037 problems in batches
print(f"  ✓ Preparing {len(catalog)} problems...")
batch_size = 100
for i in range(0, len(catalog), batch_size):
    batch = catalog[i:i + batch_size]
    values = []
    for p in batch:
        pid = p["id"]
        slug = p["slug"].replace("'", "''")
        title = p["title"].replace("'", "''")
        diff = p["difficulty"]
        topics = ", ".join(p.get("topics", [])).replace("'", "''")
        paid = 1 if p.get("isPaidOnly") else 0
        ac = (p.get("acRate") or "").replace("'", "''")
        acc = (p.get("totalAccepted") or "").replace("'", "''")
        values.append(f"({pid}, '{slug}', '{title}', '{diff}', '{topics}', {paid}, '{ac}', '{acc}')")
    sql_statements.append(f"INSERT OR REPLACE INTO problems (id, slug, title, difficulty, topics, is_paid_only, ac_rate, total_accepted) VALUES {', '.join(values)};")

# 2. Insert company frequencies
companies_root = comp_data.get("companies", comp_data)
comp_rows = []
for comp, windows in companies_root.items():
    if comp == "_meta": continue
    for win, questions in windows.items():
        for q in questions:
            pid = q["id"]
            freq = q["freq"]
            pattern = (q.get("pattern") or "").replace("'", "''")
            prio = (q.get("priority") or "Medium").replace("'", "''")
            comp_rows.append(f"({pid}, '{comp}', '{win}', {freq}, '{pattern}', '{prio}')")

print(f"  ✓ Preparing {len(comp_rows)} company frequency rows...")
for i in range(0, len(comp_rows), 100):
    batch = comp_rows[i:i + 100]
    sql_statements.append(f"INSERT INTO company_frequencies (problem_id, company, window, frequency_percent, pattern, priority) VALUES {', '.join(batch)};")

with open(SQL_OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_statements) + "\n")

print(f"✅ Generated {SQL_OUTPUT_FILE} ({os.path.getsize(SQL_OUTPUT_FILE)} bytes)!")
