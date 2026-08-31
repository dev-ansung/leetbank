import { describe, expect, it } from "bun:test";
import { CatalogService } from "../src/lib/catalog";

describe("CatalogService TDD Suite", () => {
  it("should load the full canonical catalog of 4,000+ problems", () => {
    const catalog = CatalogService.getAll();
    expect(catalog.length).toBeGreaterThanOrEqual(4037);
  });

  it("should search problems by numerical ID or slug with instant matching", () => {
    const p1 = CatalogService.find(1);
    expect(p1?.title).toBe("Two Sum");

    const p2 = CatalogService.find("two-sum");
    expect(p2?.id).toBe(1);

    const alien = CatalogService.find(269);
    expect(alien?.slug).toBe("alien-dictionary");
    expect(alien?.isPaidOnly).toBe(true);
  });

  it("should filter problems by difficulty and topic tags", () => {
    const hardProblems = CatalogService.search({ difficulty: "Hard" });
    expect(hardProblems.length).toBeGreaterThan(50);
    expect(hardProblems.every((p) => p.difficulty === "Hard")).toBe(true);

    const dpProblems = CatalogService.search({ topic: "Dynamic Programming" });
    expect(dpProblems.length).toBeGreaterThan(30);
  });

  it("should filter problems by curated tracks (Blind 75, Grind 75, NeetCode 150, Top 150, Hot 100, Carl 200)", () => {
    const tracks = CatalogService.getTracks();
    expect(tracks.length).toBe(6);

    const blind75 = CatalogService.getRoadmap("blind75");
    expect(blind75.length).toBe(75);

    const grind75 = CatalogService.getRoadmap("grind75");
    expect(grind75.length).toBe(75);

    const neetcode150 = CatalogService.getRoadmap("neetcode150");
    expect(neetcode150.length).toBeGreaterThan(140);

    const top150 = CatalogService.getRoadmap("top150");
    expect(top150.length).toBeGreaterThan(140);

    const hot100 = CatalogService.getRoadmap("hot100");
    expect(hot100.length).toBe(100);

    const carl200 = CatalogService.getRoadmap("carl200");
    expect(carl200.length).toBeGreaterThan(100);
  });

  it("should pick a random problem matching criteria", () => {
    const randomMedium = CatalogService.getRandom({ difficulty: "Medium" });
    expect(randomMedium.difficulty).toBe("Medium");
  });
});
