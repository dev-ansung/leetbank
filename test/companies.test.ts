import { describe, expect, it } from "bun:test";
import { CompanyService } from "../src/lib/companies";

describe("Company Tag & Recency Window TDD Suite", () => {
  it("should return list of supported top tech companies", () => {
    const companies = CompanyService.getSupportedCompanies();
    expect(companies.length).toBe(9);
    expect(companies).toContain("meta");
    expect(companies).toContain("google");
    expect(companies).toContain("amazon");
  });

  it("should filter questions by company and recency window", async () => {
    const metaQuestions = await CompanyService.getQuestionsForCompany("meta", "30-days");
    expect(metaQuestions.length).toBeGreaterThan(0);
  });

  it("should support all 4 standardized recency windows", async () => {
    const windows = ["30-days", "3-months", "6-months", "all-time"] as const;
    for (const win of windows) {
      const qs = await CompanyService.getQuestionsForCompany("google", win);
      expect(qs.length).toBeGreaterThan(0);
    }
  });

  it("should sync and parse raw company CSV datasets with algorithmic patterns", async () => {
    const metaQuestions = await CompanyService.getQuestionsForCompany("meta", "all-time");
    expect(metaQuestions.length).toBeGreaterThan(100);
    expect(metaQuestions[0].problemId).toBeGreaterThan(0);
  });
});
