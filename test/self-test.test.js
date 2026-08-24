import { describe, it, expect, beforeEach } from "vitest";
import { runSelfTest } from "../src/services/SelfTest.js";
import SettingsManager from "../src/services/SettingsManager.js";
import { resetMockStorage, mockGame } from "./mocks/foundry.js";

describe("In-World Diagnostic Suite", () => {
  beforeEach(() => {
    resetMockStorage();
    SettingsManager.registerSettings();
    mockGame.user = { id: "user-1", _id: "user-1", name: "TestUser", role: 4, isGM: true };
  });

  it("should successfully execute all diagnostic checks", async () => {
    const report = await runSelfTest();
    expect(report.totalCount).toBeGreaterThanOrEqual(7);
    expect(report.passedCount).toBe(report.totalCount);
    expect(report.allPassed).toBe(true);
  });
});
