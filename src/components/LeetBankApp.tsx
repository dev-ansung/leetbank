import TurndownService from "turndown";
import katex from "katex";
import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Shuffle, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  ExternalLink,
  X,
  Lock,
  Sun,
  Moon,
  TrendingUp,
  RotateCcw,
  Plus
} from "lucide-react";
import catalogData from "../data/catalog.json";
import tracksData from "../data/tracks.json";
import companyData from "../data/companies.json";

// LaTeX Math Renderer for Big-O Complexities
function LatexMath({ math, label }: { math?: string; label: string }) {
  const renderedHtml = useMemo(() => {
    if (!math) return null;
    let clean = math.trim();
    if (clean.startsWith("$") && clean.endsWith("$")) {
      clean = clean.slice(1, -1).trim();
    }
    // Normalize common Big-O formats
    if (!clean.startsWith("O(") && !clean.startsWith("\\mathcal{O}(")) {
      if (clean.startsWith("O")) {
        // e.g. O(n)
      }
    }
    try {
      return katex.renderToString(clean, {
        throwOnError: false,
        displayMode: false
      });
    } catch {
      return null;
    }
  }, [math]);

  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80">
      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{label}:</span>
      {renderedHtml ? (
        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} className="inline-flex items-center" />
      ) : (
        <span className="font-mono text-xs">{math || "O(1)"}</span>
      )}
    </div>
  );
}

// Standardized HTML to Markdown converter powered by Turndown
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*"
});

turndownService.addRule("superscript", {
  filter: "sup",
  replacement: (content) => `^${content}`
});

turndownService.addRule("subscript", {
  filter: "sub",
  replacement: (content) => `_${content}`
});

turndownService.addRule("exampleBlock", {
  filter: (node) => node.nodeName === "DIV" && node.classList.contains("example-block"),
  replacement: (content) => `\n\`\`\`\n${content.trim()}\n\`\`\`\n`
});

function convertHtmlToMarkdown(problem: Problem, html?: string): string {
  if (!html) return `# ${problem.id}. ${problem.title}\n\n**Difficulty:** ${problem.difficulty}`;
  
  const bodyMd = turndownService.turndown(html);

  const header = `# ${problem.id}. ${problem.title}

- **Difficulty:** ${problem.difficulty}
- **Topics:** ${problem.topics ? problem.topics.join(", ") : "General"}
- **LeetCode Link:** https://leetcode.com/problems/${problem.slug}/

---

## Problem Statement

`;

  return header + bodyMd;
}

// Compact number formatter (e.g. 23.3M, 850.2K)
function formatCompactNumber(num?: number): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return "-";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Sorter & Filter Types
export type SortField = "id-asc" | "id-desc" | "title-asc" | "title-desc" | "diff-asc" | "diff-desc" | "ac-desc" | "ac-asc" | "accepted-desc" | "accepted-asc" | "submitted-desc" | "submitted-asc" | "access-desc" | "access-asc";

export interface FilterRule {
  id: string;
  field: "difficulty" | "topics" | "language" | "company" | "access";
  operator: "is" | "is_not";
  value: string;
}

interface Problem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  isPaidOnly?: boolean;
  acRate?: number;
  totalAcs?: number;
  totalSubmitted?: number;
}

const COMPANIES = [
  { id: "meta", name: "Meta" },
  { id: "google", name: "Google" },
  { id: "amazon", name: "Amazon" },
  { id: "microsoft", name: "Microsoft" },
  { id: "bloomberg", name: "Bloomberg" },
  { id: "apple", name: "Apple" },
  { id: "uber", name: "Uber" },
  { id: "bytedance", name: "ByteDance" },
  { id: "netflix", name: "Netflix" },
];

const TRACK_MAP = new Map<string, Set<number>>();
tracksData.tracks.forEach((t) => {
  TRACK_MAP.set(t.id, new Set(t.problemIds));
});

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" /> Copied!
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-zinc-800 dark:text-zinc-200 max-h-80 leading-relaxed scrollbar-thin">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export function LeetBankApp({ initialProblemId }: { initialProblemId?: number | string }) {
  // Navigation & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string>("30-days");
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedAccess, setSelectedAccess] = useState<"all" | "free" | "premium">("all");

  // Sorter & Filter Popovers
  const [sortBy, setSortBy] = useState<SortField>("id-asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [matchMode, setMatchMode] = useState<"all" | "any">("all");
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);

  // Active Problem Modal
  const [activeProblem, setActiveProblem] = useState<Problem | null>(() => {
    if (!initialProblemId) return null;
    const num = Number(initialProblemId);
    if (!isNaN(num)) {
      return (catalogData as Problem[]).find((p) => p.id === num) || null;
    }
    return (catalogData as Problem[]).find((p) => p.slug === String(initialProblemId)) || null;
  });

  const [activeTab, setActiveTab] = useState<"description" | "starter" | "solution">("description");
  const [selectedStarterLang, setSelectedStarterLang] = useState("python3");
  const [selectedSolLang, setSelectedSolLang] = useState("python3");
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [isDark, setIsDark] = useState(false);

  // Live Detail API Fetching
  const [problemDetail, setProblemDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Theme Sync
  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains("dark");
    setIsDark(isDarkTheme);
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

  // Keyboard shortcut '/' to focus search, 'Escape' to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      if (e.key === "Escape") {
        setActiveProblem(null);
        setShowSortMenu(false);
        setShowFilterMenu(false);
        window.history.pushState(null, "", "/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch live problem details from Edge API
  useEffect(() => {
    if (!activeProblem) {
      setProblemDetail(null);
      return;
    }

    let isMounted = true;
    setLoadingDetail(true);
    setProblemDetail(null);

    fetch(`/api/problem/${activeProblem.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setProblemDetail(data);
          setLoadingDetail(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeProblem]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600) {
        setVisibleCount((prev) => prev + 50);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedAccess, selectedTopic, selectedCompany, selectedWindow, filterRules, sortBy]);

  // Top topics ranked by frequency
  const sortedTopics = useMemo(() => {
    const counts = new Map<string, number>();
    (catalogData as Problem[]).forEach((p) => {
      p.topics.forEach((t) => {
        if (t && t !== "Algorithms") {
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  }, []);

  const catalogMap = useMemo(() => {
    const map = new Map<number, Problem>();
    (catalogData as Problem[]).forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  // Pick Random Problem
  const handlePickRandom = () => {
    if (filteredProblems.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredProblems.length);
    const picked = filteredProblems[randomIdx];
    setActiveProblem(picked);
    window.history.pushState(null, "", "/" + picked.id);
  };

  // Column Header Sort Toggle
  const handleHeaderSort = (field: "id" | "title" | "difficulty" | "ac" | "accepted" | "submitted" | "access") => {
    if (field === "id") {
      setSortBy(sortBy === "id-asc" ? "id-desc" : "id-asc");
    } else if (field === "title") {
      setSortBy(sortBy === "title-asc" ? "title-desc" : "title-asc");
    } else if (field === "difficulty") {
      setSortBy(sortBy === "diff-asc" ? "diff-desc" : "diff-asc");
    } else if (field === "ac") {
      setSortBy(sortBy === "ac-desc" ? "ac-asc" : "ac-desc");
    } else if (field === "accepted") {
      setSortBy(sortBy === "accepted-desc" ? "accepted-asc" : "accepted-desc");
    } else if (field === "submitted") {
      setSortBy(sortBy === "submitted-desc" ? "submitted-asc" : "submitted-desc");
    } else if (field === "access") {
      setSortBy(sortBy === "access-desc" ? "access-asc" : "access-desc");
    }
  };

  // Main Filtering & Sorting Pipeline
  const { filteredProblems, companyMetaMap } = useMemo(() => {
    let compMap: Record<number, { pattern: string; priority: string }> = {};

    const effectiveCompany = selectedCompany || filterRules.find(r => r.field === "company")?.value;
    if (effectiveCompany) {
      const cData = ((companyData as any).companies || companyData)[effectiveCompany];
      const winList = cData?.[selectedWindow] || cData?.["all-time"] || [];
      winList.forEach((q: any) => {
        compMap[q.id] = { pattern: q.pattern, priority: q.priority };
      });
    }

    let list = catalogData as Problem[];



    // 2. Tracks Filter
    if (selectedRoadmap && selectedRoadmap !== "All") {
      const trackIds = TRACK_MAP.get(selectedRoadmap);
      if (trackIds) {
        list = list.filter((p) => trackIds.has(p.id));
      }
    }

    // 3. Company Quick Filter
    if (selectedCompany) {
      const cData = ((companyData as any).companies || companyData)[selectedCompany];
      const winList = cData?.[selectedWindow] || cData?.["all-time"] || [];
      const compIds = new Set<number>(winList.map((q: any) => q.id));
      list = list.filter((p) => compIds.has(p.id));
    }

    // 4. Quick Topic Chip Filter
    if (selectedTopic) {
      list = list.filter((p) => p.topics.includes(selectedTopic));
    }

    // 5. Difficulty Filter
    if (selectedDifficulty !== "All") {
      list = list.filter((p) => p.difficulty === selectedDifficulty);
    }

    // 6. Access Filter
    if (selectedAccess === "free") {
      list = list.filter((p) => !p.isPaidOnly);
    } else if (selectedAccess === "premium") {
      list = list.filter((p) => !!p.isPaidOnly);
    }

    // 7. Multi-Rule Custom Filters
    if (filterRules.length > 0) {
      list = list.filter((p) => {
        const ruleResults = filterRules.map((rule) => {
          let matches = false;
          if (rule.field === "difficulty") {
            matches = p.difficulty.toLowerCase() === rule.value.toLowerCase();
          } else if (rule.field === "topics") {
            matches = p.topics.some(t => t.toLowerCase() === rule.value.toLowerCase());
          } else if (rule.field === "access") {
            matches = rule.value === "free" ? !p.isPaidOnly : !!p.isPaidOnly;
          } else if (rule.field === "company") {
            matches = compMap[p.id] !== undefined;
          } else if (rule.field === "language") {
            matches = true;
          }

          return rule.operator === "is" ? matches : !matches;
        });

        return matchMode === "all"
          ? ruleResults.every(Boolean)
          : ruleResults.some(Boolean);
      });
    }

    // 8. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.id.toString() === q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 9. Sorting
    const sorted = [...list].sort((a, b) => {
      const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      const acA = (a as any).acRate ?? 50;
      const acB = (b as any).acRate ?? 50;

      const acsA = a.totalAcs || 0;
      const acsB = b.totalAcs || 0;
      const subA = a.totalSubmitted || 0;
      const subB = b.totalSubmitted || 0;

      switch (sortBy) {
        case "id-asc":
          return a.id - b.id;
        case "id-desc":
          return b.id - a.id;
        case "title-asc":
          return a.title.localeCompare(b.title) || a.id - b.id;
        case "title-desc":
          return b.title.localeCompare(a.title) || a.id - b.id;
        case "diff-asc":
          return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2) || a.id - b.id;
        case "diff-desc":
          return (diffOrder[b.difficulty] || 2) - (diffOrder[a.difficulty] || 2) || a.id - b.id;
        case "ac-desc":
          return acB - acA || a.id - b.id;
        case "ac-asc":
          return acA - acB || a.id - b.id;
        case "accepted-desc":
          return acsB - acsA || a.id - b.id;
        case "accepted-asc":
          return acsA - acsB || a.id - b.id;
        case "submitted-desc":
          return subB - subA || a.id - b.id;
        case "submitted-asc":
          return subA - subB || a.id - b.id;
        case "access-desc":
          return (b.isPaidOnly ? 1 : 0) - (a.isPaidOnly ? 1 : 0) || a.id - b.id;
        case "access-asc":
          return (a.isPaidOnly ? 1 : 0) - (b.isPaidOnly ? 1 : 0) || a.id - b.id;
        default:
          return a.id - b.id;
      }
    });

    return { filteredProblems: sorted, companyMetaMap: compMap };
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedAccess, selectedTopic, selectedCompany, selectedWindow, filterRules, matchMode, sortBy, catalogMap]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-zinc-950 dark:text-white font-semibold text-sm tracking-tight hover:opacity-80 transition">
            <span className="text-base">🏦</span>
            <span>LeetBank</span>
          </a>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">
            4,037 Questions
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="size-8 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          
          <a 
            href="https://github.com/dev-ansung/leetbank" 
            target="_blank" 
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main LeetCode-Style Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        
        {/* 1. Top Topic Ribbon with Counts & Expand/Collapse */}
        <div className={`flex items-center gap-1.5 ${isTopicsExpanded ? "flex-wrap" : "overflow-x-auto scrollbar-none flex-nowrap pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"}`}>
          {(isTopicsExpanded ? sortedTopics : sortedTopics.slice(0, 12)).map(({ topic, count }) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === topic
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{topic}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{count}</span>
            </button>
          ))}
          <button
            onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
            className="text-xs px-2 py-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 font-medium transition cursor-pointer"
          >
            {isTopicsExpanded ? (
              <>Collapse <ChevronUp className="size-3" /></>
            ) : (
              <>Expand <ChevronDown className="size-3" /></>
            )}
          </button>
        </div>



        {/* 3. Companies & Tracks Navigation Bar */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
          {/* Companies Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap w-full sm:w-auto pb-0.5 -mx-1 px-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[70px]">
                Companies:
              </span>
              {COMPANIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)}
                  className={`text-xs px-2.5 py-0.5 rounded-md border font-medium transition cursor-pointer ${
                    selectedCompany === c.id
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {c.name}
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

            {selectedCompany && (
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg">
                <span className="text-[10px] text-zinc-400 ml-1.5 mr-0.5">Window:</span>
                {[
                  { id: "30-days", label: "30 Days" },
                  { id: "3-months", label: "3 Months" },
                  { id: "6-months", label: "6 Months" },
                  { id: "all-time", label: "All-Time" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWindow(w.id)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition cursor-pointer ${
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

          {/* Tracks Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap w-full pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 pb-0.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[70px]">
              Tracks:
            </span>
            <button
              onClick={() => { setSelectedRoadmap("All"); setSelectedCompany(null); }}
              className={`text-xs px-2.5 py-0.5 rounded-md border font-medium transition cursor-pointer ${
                selectedRoadmap === "All" && !selectedCompany
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              All Problems (4,037)
            </button>
            {tracksData.tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => { setSelectedRoadmap(track.id); setSelectedCompany(null); }}
                className={`text-xs px-2.5 py-0.5 rounded-md border font-medium transition cursor-pointer ${
                  selectedRoadmap === track.id && !selectedCompany
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Action Bar (Search Input + Sorter + Filter Popovers + Shuffle) */}
        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 size-4 text-zinc-400 dark:text-zinc-500" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search questions...'
              className="w-full pl-10 pr-12 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition"
            />
            <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-700">
                /
              </kbd>
            </div>
          </div>

          {/* Sorter Popover Button */}
          <div className="relative">
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                sortBy !== "id-asc"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title="Sort Problems"
            >
              <ArrowUpDown className="size-4" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-56 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-30 flex flex-col gap-0.5">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Sort By
                </div>
                {[
                  { id: "id-asc", label: "Question ID (Ascending)" },
                  { id: "id-desc", label: "Question ID (Descending)" },
                  { id: "diff-asc", label: "Difficulty (Easy → Hard)" },
                  { id: "diff-desc", label: "Difficulty (Hard → Easy)" },
                  { id: "access-desc", label: "Access (Premium First)" },
                  { id: "access-asc", label: "Access (Free First)" },
                  { id: "ac-desc", label: "Acceptance (High → Low)" },
                  { id: "ac-asc", label: "Acceptance (Low → High)" },
                                  ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id as SortField); setShowSortMenu(false); }}
                    className={`w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-left flex items-center justify-between transition cursor-pointer ${
                      sortBy === opt.id
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check className="size-3.5 text-zinc-900 dark:text-zinc-100" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 text-xs font-medium relative ${
                filterRules.length > 0
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title="Custom Filters"
            >
              <SlidersHorizontal className="size-4" />
              {filterRules.length > 0 && (
                <span className="size-2 rounded-full bg-blue-500 absolute -top-0.5 -right-0.5" />
              )}
            </button>

            {showFilterMenu && (
              <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-96 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-30 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Match</span>
                    <select
                      value={matchMode}
                      onChange={(e) => setMatchMode(e.target.value as any)}
                      className="text-xs px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                    >
                      <option value="all">All</option>
                      <option value="any">Any</option>
                    </select>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">of the following:</span>
                  </div>

                  <button
                    onClick={() => setFilterRules([])}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" /> Reset
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {filterRules.length === 0 ? (
                    <div className="text-xs text-zinc-400 py-3 text-center">
                      No custom filter rules active. Add a rule below!
                    </div>
                  ) : (
                    filterRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-1.5 text-xs">
                        <select
                          value={rule.field}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, field: val, value: val === "difficulty" ? "Easy" : val === "access" ? "free" : val === "company" ? "meta" : "Array" } : r));
                          }}
                          className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                        >
                          <option value="difficulty">Difficulty</option>
                          <option value="topics">Topics</option>
                          <option value="access">Access</option>
                          <option value="company">Company</option>
                                                    <option value="language">Language</option>
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, operator: val } : r));
                          }}
                          className="px-1.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                        >
                          <option value="is">is</option>
                          <option value="is_not">is not</option>
                        </select>

                        {rule.field === "difficulty" && (
                          <select
                            value={rule.value}
                            onChange={(e) => setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                            className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        )}

                        {rule.field === "topics" && (
                          <select
                            value={rule.value}
                            onChange={(e) => setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                            className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium truncate"
                          >
                            {sortedTopics.map(t => (
                              <option key={t.topic} value={t.topic}>{t.topic}</option>
                            ))}
                          </select>
                        )}

                        {rule.field === "access" && (
                          <select
                            value={rule.value}
                            onChange={(e) => setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                            className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                          >
                            <option value="free">Free Only</option>
                            <option value="premium">Premium</option>
                          </select>
                        )}

                        {rule.field === "company" && (
                          <select
                            value={rule.value}
                            onChange={(e) => setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                            className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                          >
                            {COMPANIES.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}



                        {rule.field === "language" && (
                          <select
                            value={rule.value}
                            onChange={(e) => setFilterRules(filterRules.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                            className="flex-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                          >
                            {["Python3", "TypeScript", "Go", "Rust", "C++", "Java", "Swift", "Kotlin"].map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => setFilterRules(filterRules.filter(r => r.id !== rule.id))}
                          className="p-1 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    const newRule: FilterRule = {
                      id: Math.random().toString(36).substring(7),
                      field: "difficulty",
                      operator: "is",
                      value: "Medium"
                    };
                    setFilterRules([...filterRules, newRule]);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add Filter Rule
                </button>
              </div>
            )}
          </div>

          {/* Pick Random (Shuffle) Button */}
          <button
            onClick={handlePickRandom}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Pick Random Question"
          >
            <Shuffle className="size-4" />
          </button>
        </div>

        {/* 5. Clean LeetCode Problemset Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm mt-1">
          {/* Table Header with Split ID & Title Columns */}
          <div className="px-4 py-2.5 bg-zinc-50/90 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center justify-between select-none">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => handleHeaderSort("id")}
                className="w-10 text-left flex items-center gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer shrink-0"
                title="Sort by Question ID"
              >
                <span>#</span>
                {sortBy === "id-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "id-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
              </button>

              <button
                onClick={() => handleHeaderSort("title")}
                className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer truncate"
                title="Sort alphabetically by Title"
              >
                <span>Title ({filteredProblems.length})</span>
                {sortBy === "title-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "title-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
              <button
                onClick={() => handleHeaderSort("accepted")}
                className="w-14 sm:w-16 text-right hidden md:flex items-center justify-end gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Sort by Total Accepted"
              >
                <span>Accepted</span>
                {sortBy === "accepted-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "accepted-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
              </button>

              <button
                onClick={() => handleHeaderSort("submitted")}
                className="w-16 text-right hidden lg:flex items-center justify-end gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Sort by Total Submissions"
              >
                <span>Submissions</span>
                {sortBy === "submitted-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "submitted-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
              </button>

              <button
                onClick={() => handleHeaderSort("ac")}
                className="w-12 sm:w-14 text-right hidden sm:flex items-center justify-end gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Sort by Acceptance Rate"
              >
                <span>Acceptance</span>
                {sortBy === "ac-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "ac-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
              </button>

              <button
                onClick={() => handleHeaderSort("difficulty")}
                className="w-12 text-right sm:text-center flex items-center justify-end sm:justify-center gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Sort by Difficulty"
              >
                <span>Difficulty</span>
                {sortBy === "diff-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "diff-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
              </button>

              <button
                onClick={() => handleHeaderSort("access")}
                className="w-14 text-right hidden md:flex items-center justify-end gap-0.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Sort by Access (Premium / Free)"
              >
                <span>Access</span>
                {sortBy === "access-desc" && <ChevronDown className="size-3 text-zinc-900 dark:text-white" />}
                {sortBy === "access-asc" && <ChevronUp className="size-3 text-zinc-900 dark:text-white" />}
              </button>
            </div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredProblems.slice(0, visibleCount).map((p, idx) => {
              const compMeta = companyMetaMap[p.id];
              return (
                <div
                  key={p.id}
                  onClick={() => { setActiveProblem(p); window.history.pushState(null, "", "/" + p.id); }}
                  className={`px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition cursor-pointer group ${
                    idx % 2 === 1 ? "bg-zinc-50/30 dark:bg-zinc-900/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 w-8 shrink-0">
                      {p.id}.
                    </span>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition truncate">
                      {p.title}
                    </span>

                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
                    {/* Accepted (Hidden on mobile & small tablet, visible on md+) */}
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-14 sm:w-16 text-right hidden md:block" title={`Total Accepted: ${(p.totalAcs || 0).toLocaleString()}`}>
                      {formatCompactNumber(p.totalAcs)}
                    </span>

                    {/* Submissions (Hidden on mobile/tablet, visible on lg+) */}
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-16 text-right hidden lg:block" title={`Total Submissions: ${(p.totalSubmitted || 0).toLocaleString()}`}>
                      {formatCompactNumber(p.totalSubmitted)}
                    </span>

                    {/* Acceptance Rate (Hidden on mobile, visible on sm+) */}
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-12 sm:w-14 text-right hidden sm:block">
                      {p.acRate !== undefined ? `${p.acRate.toFixed(1)}%` : "50.0%"}
                    </span>

                    {/* Difficulty (Always visible) */}
                    <span
                      className={`text-xs font-medium w-12 text-right sm:text-center ${
                        p.difficulty === "Easy"
                          ? "text-teal-600 dark:text-teal-400"
                          : p.difficulty === "Medium"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.difficulty === "Medium" ? "Med." : p.difficulty}
                    </span>

                    {/* Access (Hidden on mobile, visible on md+) */}
                    <div className="w-14 text-right hidden md:flex items-center justify-end">
                      {p.isPaidOnly ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                          <Lock className="size-2.5" /> Premium
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Free</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProblems.length === 0 && (
              <div className="py-16 text-center text-zinc-400 text-xs">
                No matching questions found for the active filters.
              </div>
            )}
          </div>
        </div>

        {/* Load More Button */}
        {filteredProblems.length > visibleCount && (
          <div className="flex justify-center py-3">
            <button
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="text-xs px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Load More ({filteredProblems.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </main>

      {/* Interactive Problem Modal */}
      {activeProblem && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveProblem(null);
              window.history.pushState(null, "", "/");
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border-0 sm:border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs font-mono text-zinc-400 shrink-0">
                  #{activeProblem.id}
                </span>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white truncate">
                  {activeProblem.title}
                </h2>
                <span className="text-xs text-zinc-500 font-medium">
                  • {activeProblem.difficulty}
                </span>
                {activeProblem.isPaidOnly && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    Premium
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`https://leetcode.com/problems/${activeProblem.slug}/`}
                  target="_blank"
                  className="text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                >
                  <span>LeetCode</span>
                  <ExternalLink className="size-3" />
                </a>
                <button
                  onClick={() => { setActiveProblem(null); window.history.pushState(null, "", "/"); }}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Header */}
            <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
              <button
                onClick={() => setActiveTab("description")}
                className={`py-2.5 font-medium border-b-2 transition cursor-pointer ${
                  activeTab === "description"
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Statement
              </button>
              <button
                onClick={() => setActiveTab("starter")}
                className={`py-2.5 font-medium border-b-2 transition cursor-pointer ${
                  activeTab === "starter"
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Starter Code ({problemDetail?.starterCode ? Object.keys(problemDetail.starterCode).length : 19})
              </button>
              <button
                onClick={() => setActiveTab("solution")}
                className={`py-2.5 font-medium border-b-2 transition cursor-pointer ${
                  activeTab === "solution"
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Solutions & Big-O ({problemDetail?.solutions ? problemDetail.solutions.length : 0})
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col gap-6">
              {loadingDetail && (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <div className="size-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Fetching live problem statement & solutions...</span>
                </div>
              )}

              {!loadingDetail && activeTab === "description" && (
                <div className="flex flex-col gap-4">
                  {/* Statement Top Action Bar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Problem Statement
                    </h3>
                    <button
                      onClick={() => {
                        const md = convertHtmlToMarkdown(activeProblem, problemDetail?.descriptionHtml);
                        navigator.clipboard.writeText(md);
                        setCopiedMarkdown(true);
                        setTimeout(() => setCopiedMarkdown(false), 2000);
                      }}
                      className="text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedMarkdown ? (
                        <>
                          <Check className="size-3 text-emerald-500" /> Copied Markdown!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copy Markdown
                        </>
                      )}
                    </button>
                  </div>

                  {/* HTML Statement */}
                  <div 
                    className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-900/30"
                    dangerouslySetInnerHTML={{ 
                      __html: problemDetail?.descriptionHtml || `<p>Problem statement for #${activeProblem.id} (${activeProblem.title}) is loading...</p>` 
                    }} 
                  />

                  {/* Decoded Test Cases */}
                  {problemDetail?.testCases && problemDetail.testCases.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Example Test Cases
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {problemDetail.testCases.map((tc: any, idx: number) => (
                          <div key={idx} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                              <span>Example {idx + 1}</span>
                              <button
                                onClick={() => {
                                  const inStr = typeof tc.input === "object" ? JSON.stringify(tc.input) : String(tc.input ?? "");
                                  const outStr = typeof tc.expected === "object" ? JSON.stringify(tc.expected) : String(tc.expected ?? "");
                                  const text = `Input: ${inStr}\nOutput: ${outStr}`;
                                  navigator.clipboard.writeText(text);
                                }}
                                className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
                              >
                                <Copy className="size-3" /> Copy
                              </button>
                            </div>
                            <div className="font-mono text-[11px] flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
                              <div><span className="text-zinc-400">Input: </span>{typeof tc.input === "object" ? JSON.stringify(tc.input) : String(tc.input ?? "")}</div>
                              <div><span className="text-zinc-400">Expected: </span>{typeof tc.expected === "object" ? JSON.stringify(tc.expected) : String(tc.expected ?? "")}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loadingDetail && activeTab === "starter" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {problemDetail?.starterCode && Object.keys(problemDetail.starterCode).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedStarterLang(lang)}
                        className={`text-[11px] px-2.5 py-1 rounded font-mono font-medium transition cursor-pointer border ${
                          selectedStarterLang === lang
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <CopyBlock
                    label={`Official ${selectedStarterLang} Starter Code`}
                    content={
                      problemDetail?.starterCode?.[selectedStarterLang] || 
                      problemDetail?.starterCode?.["python3"] || 
                      "// Starter code snippet"
                    }
                  />
                </div>
              )}

              {!loadingDetail && activeTab === "solution" && (
                <div className="flex flex-col gap-3">
                  {problemDetail?.solutions && problemDetail.solutions.length > 0 ? (
                    <>
                      {(() => {
                        const activeSol = problemDetail.solutions.find((s: any) => (s.langSlug || s.language.toLowerCase()) === selectedSolLang) || problemDetail.solutions[0];
                        return (
                          <>
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <LatexMath label="Time" math={activeSol?.timeComplexity || "O(N)"} />
                                <LatexMath label="Space" math={activeSol?.spaceComplexity || "O(1)"} />
                              </div>

                              <div className="flex items-center gap-1 flex-wrap">
                                {problemDetail.solutions.map((sol: any, idx: number) => {
                                  const solKey = sol.langSlug || `${sol.language.toLowerCase()}-${idx}`;
                                  const isSelected = (selectedSolLang === solKey) || (!selectedSolLang && idx === 0);
                                  return (
                                    <button
                                      key={`${solKey}-${idx}`}
                                      onClick={() => setSelectedSolLang(solKey)}
                                      className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium transition cursor-pointer border ${
                                        isSelected
                                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                                          : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                                      }`}
                                    >
                                      {sol.language}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <CopyBlock
                              label={`Reference Solution (${activeSol?.language || selectedSolLang})`}
                              content={activeSol?.code || "// Reference solution"}
                            />
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      No reference solution available for this problem yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
