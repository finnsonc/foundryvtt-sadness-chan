import { describe, it, expect, beforeEach } from "vitest";
import { SadnessChan } from "../src/services/SadnessChan.js";
import SettingsManager from "../src/services/SettingsManager.js";
import { resetMockStorage, MockChatMessage } from "./mocks/foundry.js";

describe("SadnessChan Service", () => {
  let sadness;

  beforeEach(() => {
    resetMockStorage();
    SettingsManager.registerSettings();
    sadness = new SadnessChan();
  });

  it("should replace dynamic tags correctly", () => {
    const rolls = new Array(21).fill(0);
    rolls[1] = 5;
    rolls[20] = 3;
    rolls[10] = 2; // total: 5*1 + 3*20 + 2*10 = 85 / 10 = 8.5 -> ceil is 9

    const userData = {
      name: "Tobby",
      rolls
    };

    const template = "Hey [sc-name], you rolled [sc-d1] ones and [sc-d20] twenties with avg [sc-avg]!";
    const formatted = sadness.formatDynamicMessage(template, userData);

    expect(formatted).toBe("Hey Tobby, you rolled 5 ones and 3 twenties with avg 9!");
  });

  it("should evaluate shouldWhisper based on dice outcomes and chance setting", async () => {
    const noCrit = new Array(21).fill(0);
    noCrit[10] = 1;
    expect(sadness.shouldWhisper(noCrit, 20, 1)).toBe(false);

    const withCrit = new Array(21).fill(0);
    withCrit[1] = 1;

    // Default chance is 1.0
    expect(sadness.shouldWhisper(withCrit, 20, 1)).toBe(true);

    await SettingsManager.setSetting("failComChance", 0.0);
    expect(sadness.shouldWhisper(withCrit, 20, 1)).toBe(false);
  });

  it("should format chat card HTML with portrait and title", () => {
    const html = sadness.buildMessageHTML("Test message", true);
    expect(html).toContain("sadness-chan-chat-message");
    expect(html).toContain("Test message");
    expect(html).toContain("Sadness Chan");
  });

  it("should format stats card HTML with rolls data and average", () => {
    const rolls = new Array(21).fill(0);
    rolls[1] = 4;
    rolls[20] = 7;

    const html = sadness.buildStatsHTML({ name: "PlayerOne", rolls }, true);
    expect(html).toContain("PlayerOne");
    expect(html).toContain("sadness-chan-chat-stats");
    expect(html).toContain("sc-histogram");
    expect(html).toContain("avg");
  });

  it("should send a public chat message by default and whisper when configured", async () => {
    // Default is public message (whisper: [])
    await sadness.sendWhisper("user-1", "A public message", false);
    expect(MockChatMessage.created.length).toBe(1);
    expect(MockChatMessage.created[0].whisper).toEqual([]);
    expect(MockChatMessage.created[0].content).toContain("A public message");

    // When whisper mode is enabled (commentWhisperToggle: false)
    await SettingsManager.setSetting("commentWhisperToggle", false);
    await sadness.sendWhisper("user-1", "A private message", false);
    expect(MockChatMessage.created.length).toBe(2);
    expect(MockChatMessage.created[1].whisper).toEqual(["user-1"]);
    expect(MockChatMessage.created[1].content).toContain("A private message");
  });
});
