import companyData from "../data/companies.json";

export type CompanyId =
  | "google"
  | "meta"
  | "amazon"
  | "microsoft"
  | "bloomberg"
  | "apple"
  | "uber"
  | "bytedance"
  | "netflix";

export type RecencyWindow = "30-days" | "3-months" | "6-months" | "all-time";

export interface CompanyQuestion {
  problemId: number;
  title?: string;
  difficulty?: string;
  frequencyPercent: number;
  pattern?: string;
  priority?: "High" | "Medium" | "Low";
  notes?: string;
}

const SUPPORTED_COMPANIES: CompanyId[] = [
  "meta",
  "google",
  "amazon",
  "microsoft",
  "bloomberg",
  "apple",
  "uber",
  "bytedance",
  "netflix",
];

export class CompanyService {
  private static rawData = companyData as any;
  private static data = (companyData as any).companies || companyData as Record<string, Record<string, Array<{ id: number; freq: number; pattern: string; priority: string }>>>;

  static getSupportedCompanies(): CompanyId[] {
    return SUPPORTED_COMPANIES;
  }

  static getLastFetchedDate(): string {
    return this.rawData?._meta?.lastFetched || "2026-08-30";
  }

  static async getQuestionsForCompany(company: string, window: RecencyWindow = "all-time"): Promise<CompanyQuestion[]> {
    const compKey = company.toLowerCase();
    const rawList = this.data[compKey]?.[window] || this.data[compKey]?.["all-time"] || [];
    return rawList.map((item: any) => ({
      problemId: item.id,
      frequencyPercent: item.freq,
      pattern: item.pattern,
      priority: item.priority as any
    })).sort((a: any, b: any) => b.frequencyPercent - a.frequencyPercent);
  }

  static parseCompanyCsv(company: string, window: RecencyWindow, csvContent: string): CompanyQuestion[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idIdx = headers.findIndex((h) => h === "id" || h === "problem" || h === "problem id");
    const freqIdx = headers.findIndex((h) => h.includes("freq"));
    const titleIdx = headers.findIndex((h) => h === "title");
    const diffIdx = headers.findIndex((h) => h === "difficulty");
    const patternIdx = headers.findIndex((h) => h === "pattern");
    const priorityIdx = headers.findIndex((h) => h.includes("priority"));
    const notesIdx = headers.findIndex((h) => h === "notes");

    const result: CompanyQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      if (row.length === 0 || !row[0]) continue;

      const pid = parseInt(row[idIdx !== -1 ? idIdx : 0], 10);
      if (isNaN(pid)) continue;

      let freq = 50.0;
      if (freqIdx !== -1 && row[freqIdx]) {
        freq = parseFloat(row[freqIdx].replace("%", "").trim()) || 50.0;
      }

      result.push({
        problemId: pid,
        title: titleIdx !== -1 ? row[titleIdx] : undefined,
        difficulty: diffIdx !== -1 ? row[diffIdx] : undefined,
        frequencyPercent: freq,
        pattern: patternIdx !== -1 ? row[patternIdx]?.trim() : undefined,
        priority: priorityIdx !== -1 ? (row[priorityIdx]?.trim() as any) : undefined,
        notes: notesIdx !== -1 ? row[notesIdx]?.trim() : undefined,
      });
    }

    return result.sort((a, b) => b.frequencyPercent - a.frequencyPercent);
  }
}
