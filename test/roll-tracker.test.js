import { describe, it, expect, beforeEach } from "vitest";
import { RollTracker } from "../src/services/RollTracker.js";
import SettingsManager from "../src/services/SettingsManager.js";
import { resetMockStorage } from "./mocks/foundry.js";

describe("RollTracker Service", () => {
  let tracker;

  beforeEach(() => {
    resetMockStorage();
    SettingsManager.registerSettings();
    tracker = new RollTracker();
  });

  it("should return default dieType of 20 and clamp out-of-range values", async () => {
    expect(tracker.getDieType()).toBe(20);

    await SettingsManager.setSetting("dieType", 100);
    expect(tracker.getDieType()).toBe(100);

    await SettingsManager.setSetting("dieType", 1);
    expect(tracker.getDieType()).toBe(20);

    await SettingsManager.setSetting("dieType", 2000);
    expect(tracker.getDieType()).toBe(1000);
  });

  it("should return crit values and bounds correctly", async () => {
    expect(tracker.getCritValue(false)).toBe(1);
    expect(tracker.getCritValue(true)).toBe(20);

    await SettingsManager.setSetting("crtSuccess", 19);
    expect(tracker.getCritValue(true)).toBe(19);
  });

  it("should calculate weighted roll averages accurately", () => {
    expect(tracker.getAverage([])).toBe(0);

    // 1 roll of 10 -> average is 10
    const rolls1 = new Array(21).fill(0);
    rolls1[10] = 1;
    expect(tracker.getAverage(rolls1)).toBe(10);

    // 2 rolls of 1 and 2 rolls of 20 -> (2*1 + 2*20)/4 = 42/4 = 10.5
    const rolls2 = new Array(21).fill(0);
    rolls2[1] = 2;
    rolls2[20] = 2;
    expect(tracker.getAverage(rolls2)).toBe(10.5);
  });

  it("should extract dice results matching the observed dieType only", () => {
    const mockRolls = [
      {
        dice: [
          {
            faces: 20,
            results: [
              { result: 1, active: true },
              { result: 20, active: true },
              { result: 7, active: false } // dropped die (disadvantage)
            ]
          },
          {
            faces: 6, // Damage die, should be ignored
            results: [{ result: 6, active: true }]
          }
        ]
      }
    ];

    const extracted = tracker.extractDiceRolls(mockRolls, 20);
    expect(extracted).not.toBeNull();
    expect(extracted[1]).toBe(1);
    expect(extracted[20]).toBe(1);
    expect(extracted[7]).toBe(0); // dropped die not counted
    expect(extracted[6]).toBe(0); // d6 not counted in d20 array
  });

  it("should record user rolls and accumulate counts in world counter", async () => {
    const userRolls1 = new Array(21).fill(0);
    userRolls1[1] = 1;
    userRolls1[20] = 2;

    await tracker.recordUserRolls("user-1", "Hero", userRolls1);

    let counter = SettingsManager.getCounter();
    expect(counter["user-1"]).toBeDefined();
    expect(counter["user-1"].rolls[1]).toBe(1);
    expect(counter["user-1"].rolls[20]).toBe(2);

    const userRolls2 = new Array(21).fill(0);
    userRolls2[1] = 3;

    await tracker.recordUserRolls("user-1", "Hero", userRolls2);
    counter = SettingsManager.getCounter();
    expect(counter["user-1"].rolls[1]).toBe(4);
    expect(counter["user-1"].rolls[20]).toBe(2);
  });
});
