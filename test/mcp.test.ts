import { describe, expect, it } from "bun:test";
import { handleMcpToolCall, MCP_TOOLS } from "../src/lib/mcp";

describe("Remote Edge MCP Protocol & Tools TDD Suite", () => {
  it("should expose all 6 canonical MCP tools with JSON schemas", () => {
    expect(MCP_TOOLS.length).toBe(6);
    const toolNames = MCP_TOOLS.map((t) => t.name);
    expect(toolNames).toContain("get_problem");
    expect(toolNames).toContain("search_problems");
    expect(toolNames).toContain("get_company_questions");
    expect(toolNames).toContain("get_solution");
    expect(toolNames).toContain("get_random_problem");
    expect(toolNames).toContain("get_track_problems");

    for (const tool of MCP_TOOLS) {
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("should execute 'get_problem' tool and return Markdown statement with 19 starter code snippets", async () => {
    const res = await handleMcpToolCall("get_problem", { idOrSlug: 1 });
    expect(res.content).toBeDefined();
    expect(res.content[0].type).toBe("text");

    const payload = JSON.parse(res.content[0].text);
    expect(payload.id).toBe(1);
    expect(payload.title).toBe("Two Sum");
    expect(payload.statementMarkdown.length).toBeGreaterThan(50);
    expect(payload.starterCodeSnippets.python3).toBeDefined();
    expect(payload.starterCodeLanguages.length).toBeGreaterThanOrEqual(10);
  });

  it("should execute 'search_problems' tool with filtering", async () => {
    const res = await handleMcpToolCall("search_problems", {
      q: "two-sum",
      limit: 5,
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.total).toBeGreaterThanOrEqual(1);
    expect(payload.problems[0].title).toContain("Two Sum");
  });

  it("should execute 'get_company_questions' tool across recency windows", async () => {
    const res = await handleMcpToolCall("get_company_questions", {
      company: "meta",
      window: "30-days",
      limit: 10,
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.company).toBe("meta");
    expect(payload.window).toBe("30-days");
    expect(payload.questions.length).toBeGreaterThan(0);
    expect(payload.questions[0].problemId).toBeDefined();
  });

  it("should execute 'get_solution' tool for walkccc and doocs", async () => {
    const resWalkccc = await handleMcpToolCall("get_solution", {
      idOrSlug: 1,
      author: "walkccc",
      language: "python3",
    });
    const payloadWalkccc = JSON.parse(resWalkccc.content[0].text);
    expect(payloadWalkccc.id).toBe(1);
    expect(payloadWalkccc.solutions[0].author).toBe("walkccc");
    expect(payloadWalkccc.solutions[0].code).toContain("twoSum");

    const resDoocs = await handleMcpToolCall("get_solution", {
      idOrSlug: 1,
      author: "doocs",
    });
    const payloadDoocs = JSON.parse(resDoocs.content[0].text);
    expect(payloadDoocs.solutions.length).toBeGreaterThan(5);
  });

  it("should execute 'get_random_problem' tool matching criteria", async () => {
    const res = await handleMcpToolCall("get_random_problem", {
      difficulty: "Easy",
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.id).toBeGreaterThan(0);
    expect(payload.difficulty).toBe("Easy");
  });

  it("should execute 'get_track_problems' tool for Blind 75", async () => {
    const res = await handleMcpToolCall("get_track_problems", {
      track: "blind-75",
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.trackId).toBe("blind75");
    expect(payload.total).toBe(75);
    expect(payload.problems.length).toBe(75);
  });
});
