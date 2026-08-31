import { describe, expect, it } from "bun:test";
import { ProblemFetcher } from "../src/lib/fetcher";

describe("ProblemFetcher Upstream & Paywall Bypass TDD Suite", () => {
  it("should fetch public problems from LeetCode GraphQL with starter code and solutions", async () => {
    const detail = await ProblemFetcher.fetchProblem(1);
    expect(detail.id).toBe(1);
    expect(detail.slug).toBe("two-sum");
    expect(detail.title).toBe("Two Sum");
    expect(detail.difficulty).toBe("Easy");
    expect(detail.descriptionHtml.length).toBeGreaterThan(50);
    expect(detail.solutions.length).toBeGreaterThan(0);
    expect(detail.solutions.some((s) => s.source === "walkccc")).toBe(true);
    expect(detail.solutions.some((s) => s.source === "doocs")).toBe(true);
  });

  it("should bypass paywall for premium/locked problems via Doocs mirror with real signatures", async () => {
    const detail = await ProblemFetcher.fetchProblem(269); // Alien Dictionary (Premium)
    expect(detail.id).toBe(269);
    expect(detail.slug).toBe("alien-dictionary");
    expect(detail.isPaidOnly).toBe(true);
    expect(detail.descriptionHtml.length).toBeGreaterThan(50);
    expect(detail.solutions.length).toBeGreaterThan(0);
  });

  it("should resolve unknown slug dynamically without defaulting incorrectly", async () => {
    const detail = await ProblemFetcher.fetchProblem("valid-parentheses");
    expect(detail.id).toBe(20);
    expect(detail.title).toBe("Valid Parentheses");
    expect(detail.difficulty).toBe("Easy");
  });
});
