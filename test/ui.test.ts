import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { LeetBankApp } from "../src/components/LeetBankApp";

describe("LeetBankApp SSR & UI Component TDD Suite", () => {
  it("should render LeetBankApp without ReferenceError or missing symbol", () => {
    const html = renderToString(React.createElement(LeetBankApp));
    expect(html).toBeDefined();
    expect(html).toContain("LeetBank");
    expect(html).toContain("4,037 Questions");
    expect(html).toContain("Companies:");
    expect(html).toContain("Tracks:");
  });

  it("should render LeetBankApp with initialProblemId=1 without error", () => {
    const html = renderToString(React.createElement(LeetBankApp, { initialProblemId: 1 }));
    expect(html).toBeDefined();
    expect(html).toContain("Two Sum");
  });

  it("should render uniform topic buttons in the problemset ribbon", () => {
    const html = renderToString(React.createElement(LeetBankApp));
    expect(html).toContain("Array");
    expect(html).toContain("Dynamic Programming");
    expect(html).toContain("Hash Table");
  });
});
