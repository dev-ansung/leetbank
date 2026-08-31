import { describe, expect, it } from "bun:test";
import { ProblemFetcher } from "../src/lib/fetcher";

describe("ProblemFetcher Upstream & Paywall Bypass TDD Suite", () => {
  it("should fetch public problems from LeetCode GraphQL with 19 starter code snippets", async () => {
    const problem = await ProblemFetcher.fetchProblem("two-sum");
    expect(problem.id).toBe(1);
    expect(problem.title).toBe("Two Sum");
    expect(problem.difficulty).toBe("Easy");
    expect(problem.descriptionHtml).toContain("array of integers");

    // Verify official untouched starter code
    expect(problem.starterCode["python3"]).toBeDefined();
    expect(problem.starterCode["python3"]).toContain("def twoSum");
    expect(problem.starterCode["typescript"]).toBeDefined();
    expect(problem.starterCode["golang"]).toBeDefined();
    expect(problem.starterCode["rust"]).toBeDefined();
    expect(problem.starterCode["cpp"]).toBeDefined();
    expect(problem.starterCode["java"]).toBeDefined();

    // Verify parsed test cases from real HTML
    expect(problem.testCases.length).toBeGreaterThanOrEqual(2);
    expect(problem.testCases[0].input).toContain("nums = [2,7,11,15]");
    expect(problem.testCases[0].expected).toContain("[0,1]");
  });

  it("should bypass paywall for premium/locked problems via Doocs mirror with real signatures", async () => {
    const alien = await ProblemFetcher.fetchProblem(269);
    expect(alien.id).toBe(269);
    expect(alien.slug).toBe("alien-dictionary");
    expect(alien.title).toBe("Alien Dictionary");
    expect(alien.difficulty).toBe("Hard");
    expect(alien.isPaidOnly).toBe(true);
    expect(alien.descriptionHtml.length).toBeGreaterThan(50);

    // Verify real solutions and extracted starter signatures
    expect(alien.solutions.length).toBeGreaterThan(0);
    const pySolution = alien.solutions.find((s) => s.langSlug === "python" || s.langSlug === "python3");
    expect(pySolution).toBeDefined();
    expect(pySolution?.code).toContain("def alienOrder");

    // Verify starter code generated from solution signature
    expect(alien.starterCode["python3"]).toBeDefined();
    expect(alien.starterCode["python3"]).toContain("def alienOrder");
  });
});
