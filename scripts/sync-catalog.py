#!/usr/bin/env python3
"""
Sync script: Fetches the latest canonical problem list and topic tags from
LeetCode official GraphQL API and updates src/data/catalog.json.
"""

import urllib.request
import json
import os
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CATALOG_FILE = os.path.join(SCRIPT_DIR, "../src/data/catalog.json")

GQL_URL = "https://leetcode.com/graphql"
GQL_QUERY = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      frontendQuestionId: questionFrontendId
      title
      titleSlug
      difficulty
      isPaidOnly
      acRate
      topicTags {
        name
        slug
      }
    }
  }
}
"""

def sync_catalog():
    print("🔄 Syncing catalog from LeetCode GraphQL API...")
    
    # Load existing catalog
    existing_catalog = []
    if os.path.exists(CATALOG_FILE):
        with open(CATALOG_FILE, "r", encoding="utf-8") as f:
            existing_catalog = json.load(f)
    
    catalog_map = {p["id"]: p for p in existing_catalog if "id" in p}
    
    limit = 100
    skip = 0
    total_fetched = 0
    
    while True:
        payload = {
            "query": GQL_QUERY,
            "variables": {
                "categorySlug": "",
                "limit": limit,
                "skip": skip,
                "filters": {}
            }
        }
        req = urllib.request.Request(
            GQL_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "LeetBank-Sync/1.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            
            q_data = data.get("data", {}).get("problemsetQuestionList", {})
            total = q_data.get("total", 4041)
            questions = q_data.get("questions", [])
            
            if not questions:
                break
                
            for q in questions:
                f_id = q.get("frontendQuestionId")
                if not f_id or not f_id.isdigit():
                    continue
                pid = int(f_id)
                topics = [t["name"] for t in q.get("topicTags", []) if "name" in t]
                ac_rate = round(float(q.get("acRate", 50.0)), 1)
                
                if pid in catalog_map:
                    # Update existing record
                    catalog_map[pid]["topics"] = topics
                    catalog_map[pid]["acRate"] = ac_rate
                    catalog_map[pid]["isPaidOnly"] = bool(q.get("isPaidOnly", False))
                else:
                    # Add newly published problem
                    catalog_map[pid] = {
                        "id": pid,
                        "slug": q.get("titleSlug", ""),
                        "title": q.get("title", ""),
                        "difficulty": q.get("difficulty", "Medium"),
                        "topics": topics,
                        "isPaidOnly": bool(q.get("isPaidOnly", False)),
                        "acRate": ac_rate,
                        "totalAcs": 0,
                        "totalSubmitted": 0
                    }
            
            total_fetched += len(questions)
            skip += len(questions)
            if skip >= total:
                break
            time.sleep(0.05)
        except Exception as e:
            print(f"⚠️ Error fetching page skip={skip}: {e}")
            break
            
    updated_catalog = sorted(catalog_map.values(), key=lambda p: p["id"])
    with open(CATALOG_FILE, "w", encoding="utf-8") as f:
        json.dump(updated_catalog, f, indent=2)
        
    print(f"✅ Catalog sync complete: {len(updated_catalog)} total problems saved.")

if __name__ == "__main__":
    sync_catalog()
