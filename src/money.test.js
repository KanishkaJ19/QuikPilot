import { describe, it, expect } from "vitest";
import { toMinor, fromMinor, splitEvenly } from "./money.js";

describe("toMinor", () => {
  it("converts a decimal string to integer minor units", () => {
    expect(toMinor("12.50")).toBe(1250);
  });

  it("returns null for a non-numeric value", () => {
    expect(toMinor("abc")).toBe(null);
  });
});

describe("fromMinor", () => {
  it("renders minor units with two decimal places", () => {
    expect(fromMinor(1250)).toBe("12.50");
    expect(fromMinor(5)).toBe("0.05");
  });
});

describe("splitEvenly", () => {
  it("splits an exactly divisible amount", () => {
    expect(splitEvenly(900, 3)).toEqual([300, 300, 300]);
  });

  it("distributes the remainder so the parts sum to the total", () => {
    const parts = splitEvenly(1000, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000);
  });
});
