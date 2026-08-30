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
});
