CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topics TEXT NOT NULL,
  is_paid_only INTEGER DEFAULT 0,
  ac_rate TEXT,
  total_accepted TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_frequencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  company TEXT NOT NULL,
  window TEXT NOT NULL,
  frequency_percent REAL NOT NULL,
  pattern TEXT,
  priority TEXT,
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Seed sample high-frequency questions
INSERT OR REPLACE INTO problems (id, slug, title, difficulty, topics, is_paid_only, ac_rate, total_accepted)
VALUES 
  (1, 'two-sum', 'Two Sum', 'Easy', 'Array, Hash Table', 0, '58.1%', '23.3M'),
  (269, 'alien-dictionary', 'Alien Dictionary', 'Hard', 'Array, String, Graph, Topological Sort', 1, '35.4%', '420K'),
  (253, 'meeting-rooms-ii', 'Meeting Rooms II', 'Medium', 'Array, Two Pointers, Greedy, Sorting, Heap', 1, '51.2%', '1.1M'),
  (1249, 'minimum-remove-to-make-valid-parentheses', 'Minimum Remove to Make Valid Parentheses', 'Medium', 'String, Stack', 0, '71.5%', '850K'),
  (146, 'lru-cache', 'LRU Cache', 'Medium', 'Hash Table, Linked List, Design, Doubly-Linked List', 0, '44.8%', '2.1M');

INSERT INTO company_frequencies (problem_id, company, window, frequency_percent, pattern, priority)
VALUES
  (1249, 'meta', '30-days', 100.0, 'Sorting / Prefix / Scan', 'High'),
  (269, 'meta', '30-days', 85.0, 'Graph / Topological Sort', 'High'),
  (1, 'meta', '30-days', 75.0, 'Hash Table / Two Pointers', 'High'),
  (269, 'google', '30-days', 90.0, 'Topological Sort', 'High'),
  (146, 'amazon', '30-days', 100.0, 'LRU Cache / Doubly Linked List', 'High');
