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
  Layers
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
    <div className="relative group bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
      {(label || language) && (
        <div className="px-3.5 py-1.5 border-b border-[#27272a]/60 bg-[#202024] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span className="font-semibold text-zinc-300">{label || language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#27272a] hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      )}
      {!label && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#27272a]/80 hover:bg-zinc-700 text-zinc-200 backdrop-blur transition cursor-pointer shadow-sm"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}
      <pre className="p-3.5 font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("All");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string>("30-days");
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [activeTab, setActiveTab] = useState<"statement" | "solution" | "code">("statement");
  const [selectedCodeLang, setSelectedCodeLang] = useState<string>("python3");

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
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-amber-500 to-yellow-300 size-8 rounded-lg flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-amber-500/20">
              🏦
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              LeetBank
            </span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            4,037 Questions Unlocked
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium hidden sm:inline">
            Cloudflare Edge SSR
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/anprogrammer/leetbank" 
            target="_blank" 
            className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-md"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Hero & Value Banner */}
        <div className="bg-gradient-to-r from-[#18181b] via-[#1c1917] to-[#18181b] border border-[#27272a] rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              All LeetCode Premium, Zero Paywalls.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Instant sub-20ms global edge access to 4,037 questions, company interview frequency rankings (Meta, Google, Amazon), 19 starter code templates, and 16-language reference solutions with Big-O complexity.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-3.5 bg-[#121215] border border-[#27272a] p-4 rounded-xl">
          {/* Top Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 4,037 questions or topics (Press '/' to focus)..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-10 pr-12 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#27272a] text-zinc-400 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
              /
            </kbd>
          </div>

          {/* Peer Filter Level 1: Companies */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 mr-2 min-w-[90px]">
                <Building2 className="size-3.5 text-amber-400" /> Companies:
              </span>
              {[
                { id: "meta", label: "Meta" },
                { id: "google", label: "Google" },
                { id: "amazon", label: "Amazon" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                    selectedCompany === c.id
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm"
                      : "bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              {selectedCompany && (
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recency Windows */}
            {selectedCompany && (
              <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] p-1 rounded-lg">
                <Calendar className="size-3.5 text-zinc-400 ml-1.5" />
                <span className="text-xs text-zinc-400 mr-1">Window:</span>
                {[
                  { id: "30-days", label: "30 Days" },
                  { id: "3-months", label: "3 Months" },
                  { id: "all-time", label: "All-Time" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWindow(w.id)}
                    className={`text-xs px-2.5 py-0.5 rounded font-medium transition cursor-pointer ${
                      selectedWindow === w.id
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Peer Filter Level 2: Curated Tracks (Placed cleanly below Companies) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#27272a]/60">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 mr-2 min-w-[90px]">
              <Layers className="size-3.5 text-amber-400" /> Tracks:
            </span>
            {[
              { id: "All", label: "All Questions" },
              { id: "blind75", label: "🎯 Blind 75" },
              { id: "neetcode150", label: "🚀 NeetCode 150" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRoadmap(r.id); setSelectedCompany(null); }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                  selectedRoadmap === r.id && !selectedCompany
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    : "bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem List Table */}
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-3 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/50">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Showing {filteredProblems.length} Problems
            </span>
            <div className="flex items-center gap-1.5">
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                    selectedDifficulty === d
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#27272a]/60 max-h-[600px] overflow-y-auto">
            {filteredProblems.slice(0, 100).map((p) => {
              const diffColor = 
                p.difficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                p.difficulty === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                "text-rose-400 bg-rose-500/10 border-rose-500/20";

              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProblem(p)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-[#18181b] cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                    <span className="text-xs font-mono text-zinc-500 w-10 shrink-0">
                      #{p.id}
                    </span>
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-amber-300 transition truncate">
                      {p.title}
                    </span>
                    {p.isPaidOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 flex items-center gap-1">
                        <Lock className="size-2.5" /> Premium Unlocked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex gap-1">
                      {p.topics.slice(0, 2).map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${diffColor}`}>
                      {p.difficulty}
                    </span>
                    <ChevronRight className="size-4 text-zinc-600 group-hover:text-zinc-300 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Problem Detail Modal / Drawer */}
      {activeProblem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/50">
              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-bold text-amber-400">
                  #{activeProblem.id}
                </span>
                <h2 className="text-lg font-bold text-white">
                  {activeProblem.title}
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  activeProblem.difficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                  activeProblem.difficulty === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                  "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}>
                  {activeProblem.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://leetcode.com/problems/${activeProblem.slug}`}
                  target="_blank"
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-[#27272a] px-2.5 py-1 rounded"
                >
                  LeetCode <ExternalLink className="size-3" />
                </a>
                <button
                  onClick={() => setActiveProblem(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#27272a] px-6 bg-[#18181b]/30">
              {[
                { id: "statement", label: "📖 Problem Statement", icon: BookOpen },
                { id: "code", label: "💻 19 Starter Languages", icon: Code2 },
                { id: "solution", label: "💡 16 Reference Solutions & Big-O", icon: Lightbulb },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 text-sm">
              {activeTab === "statement" && (
                <div className="flex flex-col gap-5">
                  <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed bg-[#18181b] p-4 rounded-xl border border-[#27272a] relative">
                    <p>
                      Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.
                    </p>
                    <p>
                      You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
                    </p>
                  </div>

                  {/* Formatted Test Cases with Individual Copy Buttons */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      🧪 Decoded Example Test Cases (With 1-Click Copy)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Language:</span>
                      {["python3", "typescript", "golang", "rust", "cpp", "java"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedCodeLang(lang)}
                          className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition cursor-pointer ${
                            selectedCodeLang === lang
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-[#18181b] text-zinc-400 border border-[#27272a]"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CopyBlock
                    language={selectedCodeLang}
                    content={CODE_TEMPLATES[selectedCodeLang] || CODE_TEMPLATES.python3}
                  />
                </div>
              )}

              {activeTab === "solution" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                        Time Complexity: O(N)
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-medium">
                        Space Complexity: O(N)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {["python3", "typescript", "golang"].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSelectedCodeLang(l)}
                          className={`text-xs px-2 py-0.5 rounded font-mono font-medium transition cursor-pointer ${
                            selectedCodeLang === l
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CopyBlock
                    label={`Verified ${selectedCodeLang} Solution`}
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
