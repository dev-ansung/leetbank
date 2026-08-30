import { describe, expect, it } from "bun:test";
import { CatalogService } from "../src/lib/catalog";

describe("CatalogService TDD Suite", () => {
  it("should load the full canonical catalog of 4,037 problems", () => {
    const all = CatalogService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(4000);
  });

  it("should search problems by numerical ID or slug with instant matching", () => {
    const twoSum = CatalogService.find(1);
    expect(twoSum).toBeDefined();
    expect(twoSum?.title).toBe("Two Sum");
    expect(twoSum?.slug).toBe("two-sum");

    const alien = CatalogService.find("alien-dictionary");
    expect(alien).toBeDefined();
    expect(alien?.id).toBe(269);
    expect(alien?.difficulty).toBe("Hard");
    expect(alien?.isPaidOnly).toBe(true);
  });

  it("should filter problems by difficulty and topic tags", () => {
    const easyArray = CatalogService.search({
      difficulty: "Easy",
      topic: "Array",
    });
    expect(easyArray.length).toBeGreaterThan(0);
    expect(easyArray.every((p) => p.difficulty === "Easy")).toBe(true);
    expect(easyArray.every((p) => p.topics.includes("Array"))).toBe(true);
  });

  it("should filter problems by curated roadmaps (e.g. Blind 75)", () => {
    const blind75 = CatalogService.getRoadmap("blind75");
    expect(blind75.length).toBe(75);
    expect(blind75.some((p) => p.slug === "two-sum")).toBe(true);
    expect(blind75.some((p) => p.id === 269)).toBe(true); // Alien Dictionary is in Blind 75
  });

  it("should pick a random problem matching criteria", () => {
    const randomHard = CatalogService.getRandom({ difficulty: "Hard" });
    expect(randomHard).toBeDefined();
    expect(randomHard.difficulty).toBe("Hard");
  });
});
