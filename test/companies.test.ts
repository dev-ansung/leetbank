import { describe, expect, it } from "bun:test";
import { CompanyService } from "../src/lib/companies";

describe("Company Tag & Recency Window TDD Suite", () => {
  it("should return list of supported top tech companies", () => {
    const companies = CompanyService.getSupportedCompanies();
    expect(companies).toContain("google");
    expect(companies).toContain("meta");
    expect(companies).toContain("amazon");
    expect(companies).toContain("microsoft");
    expect(companies).toContain("bloomberg");
    expect(companies).toContain("apple");
  });

  it("should filter questions by company and recency window", async () => {
    const meta30Days = await CompanyService.getQuestionsForCompany("meta", "30-days");
    expect(meta30Days.length).toBeGreaterThan(0);

    const first = meta30Days[0];
    expect(first.problemId).toBeDefined();
    expect(first.frequencyPercent).toBeGreaterThan(0);
    expect(first.pattern).toBeDefined();
  });

  it("should sort company questions in descending order of interview frequency", async () => {
    const googleAll = await CompanyService.getQuestionsForCompany("google", "all-time");
    expect(googleAll.length).toBeGreaterThan(10);
    for (let i = 0; i < googleAll.length - 1; i++) {
      expect(googleAll[i].frequencyPercent).toBeGreaterThanOrEqual(googleAll[i + 1].frequencyPercent);
    }
  });

  it("should support all 4 standardized recency windows", async () => {
    const windows = ["30-days", "3-months", "6-months", "all-time"] as const;
    for (const w of windows) {
      const list = await CompanyService.getQuestionsForCompany("meta", w);
      expect(Array.isArray(list)).toBe(true);
    }
  });

  it("should sync and parse raw company CSV datasets with algorithmic patterns", () => {
    const sampleCsv = `ID,URL,Title,Difficulty,Acceptance %,Frequency %,Topic Tags,Pattern,Revision Priority,Notes
1249,https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses,Minimum Remove to Make Valid Parentheses,Medium,71.5%,62.5%,Arrays; Strings,Sorting / Prefix / Scan,High,Must revise
1,https://leetcode.com/problems/two-sum,Two Sum,Easy,57.5%,100.0%,Arrays,Two Pointers,High,Core`;

    const parsed = CompanyService.parseCompanyCsv("meta", "30-days", sampleCsv);
    expect(parsed.length).toBe(2);
    expect(parsed[0].problemId).toBe(1249);
    expect(parsed[0].frequencyPercent).toBe(62.5);
    expect(parsed[0].pattern).toBe("Sorting / Prefix / Scan");
    expect(parsed[0].priority).toBe("High");
    expect(parsed[1].problemId).toBe(1);
    expect(parsed[1].frequencyPercent).toBe(100.0);
  });
});
