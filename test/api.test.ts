import { describe, expect, it } from "bun:test";
import { handleGetProblemDetail, handleGetProblems } from "../src/lib/api-handlers";

describe("Edge REST API Handlers TDD Suite", () => {
  it("GET /api/problems should return catalog search results with pagination", async () => {
    const req = new Request("https://leetcode.anprogrammer.org/api/problems?difficulty=Medium&limit=10");
    const res = await handleGetProblems(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.total).toBeGreaterThan(0);
    expect(json.problems.length).toBe(10);
    expect(json.problems.every((p: any) => p.difficulty === "Medium")).toBe(true);
  });

  it("GET /api/problem/:id should return complete problem detail JSON", async () => {
    const req = new Request("https://leetcode.anprogrammer.org/api/problem/1");
    const res = await handleGetProblemDetail(req, "1");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe(1);
    expect(json.title).toBe("Two Sum");
    expect(json.starterCode).toBeDefined();
    expect(json.testCases).toBeDefined();
  });
});
