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
  TrendingUp,
  Loader2
} from "lucide-react";
import catalogData from "../data/catalog.json";
import tracksData from "../data/tracks.json";
import companyData from "../data/companies.json";

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

const BLIND_75_IDS = new Set([
  1, 11, 15, 19, 20, 21, 23, 33, 39, 48, 49, 53, 54, 55, 56, 57, 62, 70, 73, 76,
  79, 91, 98, 100, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 152, 153,
  190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230, 235, 238, 242,
  252, 253, 261, 268, 269, 295, 297, 300, 322, 323, 338, 347, 371, 417, 424, 435,
  438, 572, 647, 1143, 146, 287
]);

const NEETCODE_150_IDS = new Set([
  1, 11, 15, 20, 21, 22, 23, 33, 36, 39, 40, 42, 45, 46, 48, 49, 51, 53, 54, 55,
  56, 57, 62, 70, 72, 73, 74, 76, 78, 79, 84, 90, 91, 98, 100, 102, 104, 105, 110,
  115, 121, 124, 125, 127, 128, 130, 131, 133, 134, 138, 139, 141, 143, 146, 150,
  152, 153, 155, 167, 190, 191, 198, 199, 200, 202, 206, 207, 208, 210, 211, 212,
  213, 215, 217, 226, 230, 235, 238, 239, 242, 252, 253, 261, 268, 269, 286, 287,
  295, 297, 300, 309, 312, 322, 323, 329, 332, 338, 347, 355, 371, 416, 417, 424,
  435, 494, 518, 543, 567, 572, 621, 647, 684, 695, 703, 704, 739, 743, 746, 763,
  778, 787, 846, 853, 875, 973, 981, 994, 1046, 1143, 1448, 1584, 1851, 1899, 2013
]);

const COMPANY_LIST = [
  { id: "meta", label: "Meta" },
  { id: "google", label: "Google" },
  { id: "amazon", label: "Amazon" },
  { id: "microsoft", label: "Microsoft" },
  { id: "bloomberg", label: "Bloomberg" },
  { id: "apple", label: "Apple" },
  { id: "uber", label: "Uber" },
  { id: "bytedance", label: "ByteDance" },
  { id: "netflix", label: "Netflix" },
];

export function LeetBankApp({ initialProblemId }: { initialProblemId?: number | string }) {
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("All");
  const [selectedAccess, setSelectedAccess] = useState<"all" | "free" | "premium">("all");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string>("all-time");
  
  // Problem modal & live detail state
  const [activeProblem, setActiveProblem] = useState<Problem | null>(() => {
    if (!initialProblemId) return null;
    const num = Number(initialProblemId);
    if (!isNaN(num)) {
      return (catalogData as Problem[]).find((p) => p.id === num) || null;
    }
    return (catalogData as Problem[]).find((p) => p.slug === String(initialProblemId)) || null;
  });
  const [problemDetail, setProblemDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"statement" | "code" | "solution">("statement");
  const [selectedCodeLang, setSelectedCodeLang] = useState<string>("python3");
  const [selectedSolLang, setSelectedSolLang] = useState<string>("python3");
  const [visibleCount, setVisibleCount] = useState<number>(50);

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

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedAccess, selectedTopic, selectedCompany, selectedWindow]);

  // Fetch live problem details from API whenever activeProblem changes
  useEffect(() => {
    if (!activeProblem) {
      setProblemDetail(null);
      return;
    }

    let isMounted = true;
    setLoadingDetail(true);

    fetch(`/api/problem/${activeProblem.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setProblemDetail(data);
          setLoadingDetail(false);

          // Select first available starter language
          if (data.starterCode) {
            const availableLangs = Object.keys(data.starterCode);
            if (availableLangs.includes("python3")) {
              setSelectedCodeLang("python3");
            } else if (availableLangs.length > 0) {
              setSelectedCodeLang(availableLangs[0]);
            }
          }

          // Select first available solution language
          if (data.solutions && data.solutions.length > 0) {
            const pySol = data.solutions.find((s: any) => s.langSlug === "python" || s.langSlug === "python3");
            if (pySol) {
              setSelectedSolLang(pySol.langSlug || pySol.language.toLowerCase());
            } else {
              setSelectedSolLang(data.solutions[0].langSlug || data.solutions[0].language.toLowerCase());
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeProblem]);

  // Keyboard shortcut listener ('/' to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      if (e.key === "Escape") {
        setActiveProblem(null);
        window.history.pushState(null, "", "/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Quick lookup map for catalog problems
  const catalogMap = useMemo(() => {
    const map = new Map<number, Problem>();
    (catalogData as Problem[]).forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  // Filtered problem list with company metadata
  const { filteredProblems, companyMetaMap } = useMemo(() => {
    const compMap = new Map<number, { freq: number; pattern: string; priority: string }>();
    const companiesRoot = (companyData as any).companies || companyData;

    if (selectedCompany && companiesRoot[selectedCompany]) {
      const cData = companiesRoot[selectedCompany];
      const winList = cData[selectedWindow] || cData["all-time"] || [];
      winList.forEach((item: any) => {
        compMap.set(item.id, { freq: item.freq, pattern: item.pattern, priority: item.priority });
      });

      // Build ordered list based on company frequency
      let ordered: Problem[] = [];
      winList.forEach((item: any) => {
        const found = catalogMap.get(item.id);
        if (found) {
          ordered.push(found);
        } else {
          ordered.push({
            id: item.id,
            slug: `problem-${item.id}`,
            title: item.pattern || `Problem #${item.id}`,
            difficulty: "Medium",
            topics: ["Algorithms"]
          });
        }
      });

      if (selectedAccess === "free") {
        ordered = ordered.filter((p) => !p.isPaidOnly);
      } else if (selectedAccess === "premium") {
        ordered = ordered.filter((p) => !!p.isPaidOnly);
      }

      if (selectedTopic) {
        ordered = ordered.filter((p) => p.topics.includes(selectedTopic));
      }

      if (selectedDifficulty !== "All") {
        ordered = ordered.filter((p) => p.difficulty === selectedDifficulty);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        ordered = ordered.filter((p) => 
          p.id.toString() === q ||
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.topics.some((t) => t.toLowerCase().includes(q))
        );
      }

      return { filteredProblems: ordered, companyMetaMap: compMap };
    }

    let list = catalogData as Problem[];

    if (selectedRoadmap && selectedRoadmap !== "All") {
      const trackIds = TRACK_MAP.get(selectedRoadmap);
      if (trackIds) {
        list = list.filter((p) => trackIds.has(p.id));
      }
    }

    if (selectedAccess === "free") {
      list = list.filter((p) => !p.isPaidOnly);
    } else if (selectedAccess === "premium") {
      list = list.filter((p) => !!p.isPaidOnly);
    }

    if (selectedTopic) {
      list = list.filter((p) => p.topics.includes(selectedTopic));
    }

    if (selectedDifficulty !== "All") {
      list = list.filter((p) => p.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.id.toString() === q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    return { filteredProblems: list, companyMetaMap: compMap };
  }, [searchQuery, selectedDifficulty, selectedRoadmap, selectedAccess, selectedTopic, selectedCompany, selectedWindow, catalogMap]);

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
            href="https://github.com/dev-ansung/leetbank" 
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
            Fast edge-hosted question index, company interview frequencies, and official starter templates.
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
              {COMPANY_LIST.map((c) => (
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
                  { id: "6-months", label: "6 Months" },
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
            <button
              onClick={() => { setSelectedRoadmap("All"); setSelectedCompany(null); }}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                selectedRoadmap === "All" && !selectedCompany
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              All Problems (4,037)
            </button>
            {tracksData.tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => { setSelectedRoadmap(track.id); setSelectedCompany(null); }}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                  selectedRoadmap === track.id && !selectedCompany
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>

          {/* Access Filter Row (Free vs Premium) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[75px]">
              Access:
            </span>
            {[
              { id: "all", label: "All Access" },
              { id: "free", label: "Free Only" },
              { id: "premium", label: "🔒 Premium" },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAccess(a.id as any)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                  selectedAccess === a.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Topics Filter Row (Ranked by Frequency) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium min-w-[75px]">
              Topics:
            </span>
            <button
              onClick={() => setSelectedTopic(null)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                !selectedTopic
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              All Topics
            </button>
            {sortedTopics.slice(0, 16).map(({ topic, count }) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                className={`text-xs px-2 py-1 rounded-md border font-medium transition cursor-pointer flex items-center gap-1 ${
                  selectedTopic === topic
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{topic}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Problem List Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {filteredProblems.length} questions {selectedCompany ? `(${selectedCompany.toUpperCase()} • ${selectedWindow.replace("-", " ")})` : ""}
              </span>
              {selectedCompany && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                  • Last fetched: {(companyData as any)._meta?.lastFetched || "2026-08-30"}
                </span>
              )}
            </div>

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

              const compMeta = companyMetaMap.get(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => { setActiveProblem(p); window.history.pushState(null, "", "/" + p.id); }}
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
                    {compMeta && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center gap-1 font-mono">
                        <TrendingUp className="size-2.5 text-blue-500" /> {compMeta.freq.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {compMeta?.pattern && (
                      <span className="hidden md:inline text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 max-w-[180px] truncate">
                        {compMeta.pattern}
                      </span>
                    )}
                    {!compMeta && (
                      <div className="hidden sm:flex gap-1">
                        {p.topics.slice(0, 2).map((t) => (
                          <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
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
                {activeProblem.isPaidOnly && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    Premium
                  </span>
                )}
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
                  onClick={() => { setActiveProblem(null); window.history.pushState(null, "", "/"); }}
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
                { id: "code", label: `Starter Code (${problemDetail?.starterCode ? Object.keys(problemDetail.starterCode).length : "..."})` },
                { id: "solution", label: `Solutions & Big-O (${problemDetail?.solutions ? problemDetail.solutions.length : "..."})` },
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
              {loadingDetail && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="size-5 animate-spin text-zinc-500" />
                  <span>Fetching live official problem data & starter templates...</span>
                </div>
              )}

              {!loadingDetail && activeTab === "statement" && (
                <div className="flex flex-col gap-4">
                  <div 
                    className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 prose dark:prose-invert max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: problemDetail?.descriptionHtml || "<p>Statement loaded from Edge.</p>" }}
                  />

                  {/* Formatted Test Cases with Individual Copy Buttons */}
                  {problemDetail?.testCases && problemDetail.testCases.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2">
                      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Example Test Cases
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {problemDetail.testCases.map((tc: any) => (
                          <CopyBlock 
                            key={tc.id}
                            label={tc.name || `Example ${tc.id}`}
                            content={`Input: ${typeof tc.input === "object" ? JSON.stringify(tc.input, null, 2) : tc.input}${tc.expected !== null && tc.expected !== undefined ? `\nExpected: ${typeof tc.expected === "object" ? JSON.stringify(tc.expected) : tc.expected}` : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loadingDetail && activeTab === "code" && (
                <div className="flex flex-col gap-3">
                  {/* Starter Language Tabs */}
                  {problemDetail?.starterCode && Object.keys(problemDetail.starterCode).length > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.keys(problemDetail.starterCode).map((lang) => (
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
                        content={problemDetail.starterCode[selectedCodeLang] || `// No snippet for ${selectedCodeLang}`}
                      />
                    </>
                  ) : (
                    <div className="p-4 text-center text-zinc-500">
                      No starter code snippet available for this problem.
                    </div>
                  )}
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
                                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-zinc-700">
                                  Time: {activeSol?.timeComplexity || "O(N)"}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-zinc-700">
                                  Space: {activeSol?.spaceComplexity || "O(1)"}
                                </span>
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
                    <div className="p-4 text-center text-zinc-500">
                      No reference solution available.
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
