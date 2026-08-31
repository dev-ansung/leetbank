import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Building2, 
  Calendar, 
  Code2, 
  BookOpen, 
  Lightbulb, 
  Check, 
  Copy, 
  ExternalLink,
  ChevronRight,
  X,
  Lock,
  Layers,
  Sun,
  Moon,
  Terminal
} from "lucide-react";
import catalogData from "../data/catalog.json";

// Types
interface Problem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  isPaidOnly?: boolean;
}

// Reusable Copyable Block Component
function CopyBlock({ content, label, language }: { content: string; label?: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {(label || language) && (
        <div className="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-mono">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{label || language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600 transition cursor-pointer"
          >
            {copied ? <Check className="size-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
      {!label && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/90 dark:bg-zinc-800/90 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 backdrop-blur transition cursor-pointer shadow-sm"
        >
          {copied ? <Check className="size-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      )}
      <pre className="p-3.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

// Sample Company Data for POC demonstration
const COMPANY_DATA: Record<string, Record<string, Array<{ id: number; freq: number; pattern: string; priority: string }>>> = {
  meta: {
    "30-days": [
      { id: 1249, freq: 100, pattern: "Sorting / Prefix / Scan", priority: "High" },
      { id: 339, freq: 85, pattern: "Two Pointers / Recursion", priority: "High" },
      { id: 1, freq: 75, pattern: "Hash Table / Two Pointers", priority: "High" },
      { id: 20, freq: 70, pattern: "Stack / String", priority: "High" },
      { id: 1004, freq: 65, pattern: "Sliding Window", priority: "Medium" },
      { id: 269, freq: 60, pattern: "Graph / Topological Sort", priority: "High" },
    ],
    "3-months": [
      { id: 1, freq: 95, pattern: "Hash Table", priority: "High" },
      { id: 1249, freq: 90, pattern: "Stack / Scan", priority: "High" },
      { id: 269, freq: 80, pattern: "Topological Sort", priority: "High" },
      { id: 236, freq: 75, pattern: "Tree LCA", priority: "High" },
    ],
    "all-time": [
      { id: 1, freq: 100, pattern: "Hash Table", priority: "High" },
      { id: 269, freq: 90, pattern: "Topological Sort", priority: "High" },
      { id: 253, freq: 85, pattern: "Intervals / Heap", priority: "High" },
    ]
  },
  google: {
    "30-days": [
      { id: 2007, freq: 100, pattern: "Hash Map / Sorting", priority: "High" },
      { id: 269, freq: 90, pattern: "Graph / Topological Sort", priority: "High" },
      { id: 1, freq: 85, pattern: "Hash Table", priority: "High" },
      { id: 23, freq: 80, pattern: "Priority Queue / Merge", priority: "High" },
    ],
    "all-time": [
      { id: 1, freq: 100, pattern: "Hash Table", priority: "High" },
      { id: 200, freq: 95, pattern: "BFS / DFS Grid", priority: "High" },
      { id: 269, freq: 90, pattern: "Topological Sort", priority: "High" },
    ]
  },
  amazon: {
    "30-days": [
      { id: 1, freq: 100, pattern: "Hash Table", priority: "High" },
      { id: 200, freq: 90, pattern: "Graph / Matrix DFS", priority: "High" },
      { id: 146, freq: 85, pattern: "LRU Cache / Doubly Linked List", priority: "High" },
    ],
    "all-time": [
      { id: 146, freq: 100, pattern: "LRU Cache", priority: "High" },
      { id: 200, freq: 95, pattern: "Matrix BFS/DFS", priority: "High" },
    ]
  }
};

const BLIND_75_IDS = new Set([1, 15, 20, 21, 23, 33, 49, 53, 55, 56, 57, 70, 73, 76, 79, 91, 98, 100, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 152, 153, 190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230, 235, 238, 242, 252, 253, 268, 269, 295, 297, 300, 322, 338, 347, 371, 417, 424, 435, 572, 647]);

export function LeetBankApp() {
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedCompany, selectedWindow]);

  // Initialize theme state on mount
  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("All");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string>("30-days");
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "solution" | "code">("statement");
  const [selectedCodeLang, setSelectedCodeLang] = useState<string>("python3");
  const [visibleCount, setVisibleCount] = useState<number>(50);



  // Keyboard shortcut listener ('/' to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      if (e.key === "Escape") {
        setActiveProblem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered problem list
  const filteredProblems = useMemo(() => {
    let list = catalogData as Problem[];

    if (selectedCompany && COMPANY_DATA[selectedCompany]) {
      const compMap = COMPANY_DATA[selectedCompany][selectedWindow] || COMPANY_DATA[selectedCompany]["all-time"] || [];
      const compIds = new Set(compMap.map(c => c.id));
      list = list.filter(p => compIds.has(p.id));
    }

    if (selectedRoadmap === "blind75") {
      list = list.filter(p => BLIND_75_IDS.has(p.id));
    }

    if (selectedDifficulty !== "All") {
      list = list.filter(p => p.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.id.toString() === q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.topics.some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedCompany, selectedWindow]);

  const CODE_TEMPLATES: Record<string, string> = {
    python3: `class Solution:
    def two_sum(self, nums: list[int], target: int) -> list[int]:
        # Python 3.14 PEP 585 / 604 Modernized
        pass`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
    
};`,
    golang: `func twoSum(nums []int, target int) []int {
    
}`,
    rust: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`
  };

  const REFERENCE_SOLUTIONS: Record<string, string> = {
    python3: `class Solution:
    def two_sum(self, nums: list[int], target: int) -> list[int]:
        d = {}
        for i, x in enumerate(nums):
            if (y := target - x) in d:
                return [d[y], i]
            d[x] = i`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
    golang: `func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, x := range nums {
        if j, ok := m[target-x]; ok {
            return []int{j, i}
        }
        m[x] = i
    }
    return nil
}`
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-150">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
              LB
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              LeetBank
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            4,037 problems
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Light / Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="size-8 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          
          <a 
            href="https://github.com/anprogrammer/leetbank" 
            target="_blank" 
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Clean Minimal Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            LeetCode Question Bank
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fast edge-hosted question index, company interview frequencies, and reference solutions.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
          {/* Top Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, or topic (Press '/' to focus)..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-10 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-mono">
              /
            </kbd>
          </div>

          {/* Companies Filter Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[75px]">
                Companies:
              </span>
              {[
                { id: "meta", label: "Meta" },
                { id: "google", label: "Google" },
                { id: "amazon", label: "Amazon" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                    selectedCompany === c.id
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              {selectedCompany && (
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recency Windows */}
            {selectedCompany && (
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg">
                <span className="text-[11px] text-zinc-400 ml-1.5 mr-0.5">Window:</span>
                {[
                  { id: "30-days", label: "30 Days" },
                  { id: "3-months", label: "3 Months" },
                  { id: "all-time", label: "All-Time" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWindow(w.id)}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      selectedWindow === w.id
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tracks Filter Row */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[75px]">
              Tracks:
            </span>
            {[
              { id: "All", label: "All Problems" },
              { id: "blind75", label: "Blind 75" },
              { id: "neetcode150", label: "NeetCode 150" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRoadmap(r.id); setSelectedCompany(null); }}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                  selectedRoadmap === r.id && !selectedCompany
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem List Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {filteredProblems.length} questions
            </span>
            <div className="flex items-center gap-1">
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`text-xs px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    selectedDifficulty === d
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div 
            onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 200) {
                setVisibleCount((prev) => Math.min(filteredProblems.length, prev + 50));
              }
            }}
            className="divide-y divide-zinc-200 dark:divide-zinc-800/80 max-h-[700px] overflow-y-auto"
          >
            {filteredProblems.slice(0, visibleCount).map((p) => {
              const diffStyle = 
                p.difficulty === "Easy" ? "text-emerald-600 dark:text-emerald-400" :
                p.difficulty === "Medium" ? "text-amber-600 dark:text-amber-400" :
                "text-rose-600 dark:text-rose-400";

              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProblem(p)}
                  className="px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 w-10 shrink-0">
                      #{p.id}
                    </span>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition truncate">
                      {p.title}
                    </span>
                    {p.isPaidOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex gap-1">
                      {p.topics.slice(0, 2).map((t) => (
                        <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${diffStyle}`}>
                      {p.difficulty}
                    </span>
                    <ChevronRight className="size-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition" />
                  </div>
                </div>
              );
            })}

            {visibleCount < filteredProblems.length && (
              <div className="p-4 text-center border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(filteredProblems.length, prev + 100))}
                  className="text-xs px-4 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-medium transition cursor-pointer"
                >
                  Load More ({filteredProblems.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Problem Detail Modal */}
      {activeProblem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-mono font-medium text-zinc-500">
                  #{activeProblem.id}
                </span>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeProblem.title}
                </h2>
                <span className="text-xs text-zinc-500 font-medium">
                  • {activeProblem.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`https://leetcode.com/problems/${activeProblem.slug}`}
                  target="_blank"
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                >
                  LeetCode <ExternalLink className="size-3" />
                </a>
                <button
                  onClick={() => setActiveProblem(null)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 bg-zinc-50/50 dark:bg-zinc-900/50">
              {[
                { id: "statement", label: "Statement" },
                { id: "code", label: "Starter Code (19)" },
                { id: "solution", label: "Solutions & Big-O" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
              {activeTab === "statement" && (
                <div className="flex flex-col gap-4">
                  <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="mb-2">
                      Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.
                    </p>
                    <p>
                      You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
                    </p>
                  </div>

                  {/* Formatted Test Cases with Individual Copy Buttons */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Example Test Cases
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <CopyBlock 
                        label="Example 1"
                        content={`Input: nums = [2, 7, 11, 15], target = 9
Expected: [0, 1]`}
                      />
                      <CopyBlock 
                        label="Example 2"
                        content={`Input: nums = [3, 2, 4], target = 6
Expected: [1, 2]`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "code" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["python3", "typescript", "golang", "rust", "cpp", "java"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedCodeLang(lang)}
                        className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition cursor-pointer ${
                          selectedCodeLang === lang
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <CopyBlock
                    language={selectedCodeLang}
                    content={CODE_TEMPLATES[selectedCodeLang] || CODE_TEMPLATES.python3}
                  />
                </div>
              )}

              {activeTab === "solution" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        Time: O(N)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        Space: O(N)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {["python3", "typescript", "golang"].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSelectedCodeLang(l)}
                          className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium transition cursor-pointer ${
                            selectedCodeLang === l
                              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CopyBlock
                    label={`Reference ${selectedCodeLang} Solution`}
                    content={REFERENCE_SOLUTIONS[selectedCodeLang] || REFERENCE_SOLUTIONS.python3}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
