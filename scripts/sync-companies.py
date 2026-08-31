#!/usr/bin/env python3
"""
Sync script: Fetches latest company interview frequency CSVs from upstream GitHub
and compiles them into src/data/companies.json with updated lastFetched metadata.
"""

import urllib.request
import csv
import io
import json
import os
from datetime import datetime, timezone

COMPANIES = ["meta", "google", "amazon", "microsoft", "bloomberg", "apple", "uber", "bytedance", "netflix"]
WINDOWS_MAP = {
    "30-days": "thirty-days.csv",
    "3-months": "three-months.csv",
    "6-months": "six-months.csv",
    "all-time": "all.csv"
}

BASE_URL = "https://raw.githubusercontent.com/Kali-Prem/leetcode-company-wise-interview-questions/main"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "../src/data/companies.json")

now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")

company_index = {
    "_meta": {
        "lastFetched": now_iso,
        "source": "https://github.com/Kali-Prem/leetcode-company-wise-interview-questions"
    },
    "companies": {}
}

print(f"🔄 Syncing company interview datasets (Last Fetched: {now_iso})...")

for company in COMPANIES:
    company_index["companies"][company] = {}
    for win_key, csv_name in WINDOWS_MAP.items():
        url = f"{BASE_URL}/{company}/{csv_name}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LeetBank-Sync/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read().decode("utf-8")
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
                
                parsed_list = []
                for r in rows:
                    p_id = r.get("ID") or r.get("id") or r.get("Problem") or r.get("Problem ID")
                    if not p_id or not p_id.strip().isdigit():
                        continue
                    
                    freq_str = r.get("Frequency %") or r.get("Frequency") or "50%"
                    try:
                        freq = float(freq_str.replace("%", "").strip())
                    except ValueError:
                        freq = 50.0

                    pattern = r.get("Pattern") or r.get("Topic Tags") or ""
                    priority = r.get("Revision Priority") or "Medium"

                    parsed_list.append({
                        "id": int(p_id),
                        "freq": freq,
                        "pattern": pattern.strip(),
                        "priority": priority.strip()
                    })

                parsed_list.sort(key=lambda x: x["freq"], reverse=True)
                company_index["companies"][company][win_key] = parsed_list
                print(f"  ✓ {company.upper():<10} [{win_key:<8}]: {len(parsed_list)} problems")
        except Exception:
            company_index["companies"][company][win_key] = []

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(company_index, f)

print(f"✅ Successfully compiled {OUTPUT_FILE}!")
