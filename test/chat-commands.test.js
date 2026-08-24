import { describe, it, expect, beforeEach } from "vitest";
import { onChatMessage, handleSadnessCommand } from "../src/hooks/chatMessage.js";
import SettingsManager from "../src/services/SettingsManager.js";
import RollTracker from "../src/services/RollTracker.js";
import { resetMockStorage, MockChatMessage, mockGame } from "./mocks/foundry.js";

describe("Chat Command Handler", () => {
  beforeEach(() => {
    resetMockStorage();
    SettingsManager.registerSettings();
    mockGame.user = { id: "user-1", _id: "user-1", name: "TestUser", role: 4, isGM: true };
  });

  it("should ignore non-matching chat messages synchronously", () => {
    const handled = onChatMessage({}, "/roll 1d20", { user: "user-1" });
    expect(handled).toBe(true);
    expect(MockChatMessage.created.length).toBe(0);
  });

  it("should intercept matching chat command synchronously and return false", () => {
    const handled = onChatMessage({}, "!sadness help", { user: "user-1" });
    expect(handled).toBe(false);
  });

  it("should intercept !sadness and display help", async () => {
    await handleSadnessCommand("help", mockGame.user);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].content).toContain("Fine, I'll help you");
  });

  it("should display no data when user has no recorded rolls", async () => {
    await handleSadnessCommand("", mockGame.user);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].content).toContain("Play a little before spamming");
  });

  it("should display user stats when rolls are recorded", async () => {
    const rolls = new Array(21).fill(0);
    rolls[1] = 2;
    rolls[20] = 5;
    await RollTracker.recordUserRolls("user-1", "TestUser", rolls);

    await handleSadnessCommand("", mockGame.user);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].content).toContain("TestUser");
    expect(MockChatMessage.created[0].content).toContain("sadness-chan-chat-stats");
  });

  it("should allow GM to run reset commands", async () => {
    const rolls = new Array(21).fill(0);
    rolls[1] = 5;
    await RollTracker.recordUserRolls("user-1", "TestUser", rolls);

    await handleSadnessCommand("reset counter", mockGame.user);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].content).toContain("Are you THAT embarrassed");

    const counter = SettingsManager.getCounter();
    expect(counter).toEqual({});
  });

  it("should reject GM commands for non-GM users", async () => {
    mockGame.user = { id: "user-2", _id: "user-2", name: "PlayerTwo", role: 1, isGM: false };

    await handleSadnessCommand("all", mockGame.user);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].content).toContain("Sorry, but this command is only for the big guy.");
  });
});
