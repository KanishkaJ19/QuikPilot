import { describe, it, expect } from "vitest";
import { createGroup, addExpense, computeBalances, assertBalanced, settleUp } from "./ledger.js";

function group() {
  return createGroup("g", "Test", [
    { id: "u1", name: "A" },
    { id: "u2", name: "B" },
    { id: "u3", name: "C" },
  ]);
}

describe("computeBalances", () => {
  it("credits the payer and debits each participant", () => {
    const g = group();
    addExpense(g, { description: "Dinner", amountMinor: 900, paidBy: "u1", participants: ["u1", "u2", "u3"] });
    const b = computeBalances(g);
    expect(b.u1).toBe(600);
    expect(b.u2).toBe(-300);
    expect(b.u3).toBe(-300);
  });

  it("balances to zero on an amount that does not divide evenly", () => {
    const g = group();
    addExpense(g, { description: "Taxi", amountMinor: 1000, paidBy: "u1", participants: ["u1", "u2", "u3"] });
    assertBalanced(computeBalances(g));
  });

  it("[QTRK-701] correctly allocates values for any participant count, including handling remainders consistently", () => {
    const g = createGroup("g2", "Test Group 2", [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
      { id: "p3", name: "P3" },
      { id: "p4", name: "P4" },
      { id: "p5", name: "P5" },
    ]);

    // Test with an amount that divides evenly
    addExpense(g, { description: "Even Split", amountMinor: 1000, paidBy: "p1", participants: ["p1", "p2", "p3", "p4", "p5"] });
    let b = computeBalances(g);
    expect(b.p1).toBe(800);
    expect(b.p2).toBe(-200);
    expect(b.p3).toBe(-200);
    expect(b.p4).toBe(-200);
    expect(b.p5).toBe(-200);
    assertBalanced(b);

    // Test with an amount that does not divide evenly (remainder 1)
    addExpense(g, { description: "Uneven Split 1", amountMinor: 1001, paidBy: "p1", participants: ["p1", "p2", "p3", "p4", "p5"] });
    b = computeBalances(g);
    // Initial balances: p1: 800, p2: -200, p3: -200, p4: -200, p5: -200
    // New expense: 1001 / 5 = 200 remainder 1. Shares: 201, 200, 200, 200, 200
    // p1: 800 - 201 + 1001 = 1599
    // p2: -200 - 200 = -400
    // p3: -200 - 200 = -400
    // p4: -200 - 200 = -400
    // p5: -200 - 200 = -400
    expect(b.p1).toBe(1599);
    expect(b.p2).toBe(-400);
    expect(b.p3).toBe(-400);
    expect(b.p4).toBe(-400);
    expect(b.p5).toBe(-400);
    assertBalanced(b);

    // Test with an amount that does not divide evenly (remainder 4)
    addExpense(g, { description: "Uneven Split 4", amountMinor: 1004, paidBy: "p2", participants: ["p1", "p2", "p3", "p4", "p5"] });
    b = computeBalances(g);
    // Initial balances: p1: 1599, p2: -400, p3: -400, p4: -400, p5: -400
    // New expense: 1004 / 5 = 200 remainder 4. Shares: 201, 201, 201, 201, 200
    // p1: 1599 - 201 = 1398
    // p2: -400 - 201 + 1004 = 403
    // p3: -400 - 201 = -601
    // p4: -400 - 201 = -601
    // p5: -400 - 200 = -600
    expect(b.p1).toBe(1398);
    expect(b.p2).toBe(403);
    expect(b.p3).toBe(-601);
    expect(b.p4).toBe(-601);
    expect(b.p5).toBe(-600);
    assertBalanced(b);
  });

  it("handles expenses with a single participant correctly", () => {
    const g = group();
    addExpense(g, { description: "Solo Lunch", amountMinor: 500, paidBy: "u1", participants: ["u1"] });
    const b = computeBalances(g);
    expect(b.u1).toBe(0);
    expect(b.u2).toBe(0);
    expect(b.u3).toBe(0);
    assertBalanced(b);
  });

  it("handles expenses with two participants correctly", () => {
    const g = group();
    addExpense(g, { description: "Coffee", amountMinor: 300, paidBy: "u1", participants: ["u1", "u2"] });
    const b = computeBalances(g);
    expect(b.u1).toBe(150);
    expect(b.u2).toBe(-150);
    expect(b.u3).toBe(0);
    assertBalanced(b);
  });

  it("handles multiple expenses with varying participant counts", () => {
    const g = group();
    addExpense(g, { description: "Dinner", amountMinor: 900, paidBy: "u1", participants: ["u1", "u2", "u3"] });
    addExpense(g, { description: "Solo Snack", amountMinor: 100, paidBy: "u2", participants: ["u2"] });
    addExpense(g, { description: "Movie", amountMinor: 600, paidBy: "u3", participants: ["u1", "u3"] });

    const b = computeBalances(g);
    // Expense 1 (900, u1 pays, u1,u2,u3 participate): u1: 600, u2: -300, u3: -300
    // Expense 2 (100, u2 pays, u2 participates): u1: 600, u2: -300, u3: -300 (no change to balances)
    // Expense 3 (600, u3 pays, u1,u3 participate): u1: 600 - 300 = 300, u2: -300, u3: -300 - 300 + 600 = 0
    expect(b.u1).toBe(300);
    expect(b.u2).toBe(-300);
    expect(b.u3).toBe(0);
    assertBalanced(b);
  });

  it("[QTRK-702] throws an error if participants array is empty", () => {
    const g = group();
    expect(() => addExpense(g, { description: "Empty Participants", amountMinor: 100, paidBy: "u1", participants: [] })).toThrow("Participants array cannot be empty.");
  });

  it("[QTRK-703] throws an error if participants array contains duplicate members", () => {
    const g = group();
    expect(() => addExpense(g, { description: "Duplicate Participants", amountMinor: 100, paidBy: "u1", participants: ["u1", "u1"] })).toThrow("Participants array contains duplicate members.");
  });

  it("[QTRK-704] throws an error if paidBy is not in participants", () => {
    const g = group();
    expect(() => addExpense(g, { description: "Payer Not Participant", amountMinor: 100, paidBy: "u1", participants: ["u2", "u3"] })).toThrow("PaidBy member must be in the participants list.");
  });

  it("[QTRK-705] throws an error if any participant is not a valid group member", () => {
    const g = group();
    expect(() => addExpense(g, { description: "Invalid Participant", amountMinor: 100, paidBy: "u1", participants: ["u1", "u4"] })).toThrow("Participant u4 is not a member of the group.");
  });

  it("[QTRK-706] throws an error if paidBy is not a valid group member", () => {
    const g = group();
    expect(() => addExpense(g, { description: "Invalid Payer", amountMinor: 100, paidBy: "u4", participants: ["u1"] })).toThrow("PaidBy member u4 is not a member of the group.");
  });
});

describe("settleUp", () => {
  it("produces payments that clear every balance", () => {
    const g = group();
    addExpense(g, { description: "Hotel", amountMinor: 3000, paidBy: "u1", participants: ["u1", "u2", "u3"] });
    const payments = settleUp(computeBalances(g));
    const net = {};
    for (const p of payments) {
      net[p.from] = (net[p.from] ?? 0) - p.amountMinor;
      net[p.to] = (net[p.to] ?? 0) + p.amountMinor;
    }
    expect(net.u2).toBe(-1000);
    expect(net.u3).toBe(-1000);
    expect(net.u1).toBe(2000);
  });
});
