import { describe, it, expect, beforeEach } from "vitest";
import ListsEditor from "../src/apps/ListsEditor.js";
import ImportExport from "../src/apps/ImportExport.js";
import SettingsManager from "../src/services/SettingsManager.js";
import { resetMockStorage } from "./mocks/foundry.js";

describe("Application Forms", () => {
  beforeEach(() => {
    resetMockStorage();
    SettingsManager.registerSettings();
  });

  describe("ListsEditor", () => {
    it("should parse newline-delimited strings to array", () => {
      const input = "Line 1\n  Line 2  \n\nLine 3\n";
      const result = ListsEditor.parseLines(input);
      expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
    });

    it("should update lists settings on form submit", async () => {
      const formData = {
        object: {
          fail: "Fail one\nFail two",
          success: "Win one",
          fail_portraits: "modules/sadness-chan/assets/portraits/sadness-chan-disappointed.jpg",
          portraits: "modules/sadness-chan/assets/portraits/sadness-chan-success.jpg"
        }
      };

      await ListsEditor.formHandler({}, {}, formData);

      const lists = SettingsManager.getLists();
      expect(lists.fail).toEqual(["Fail one", "Fail two"]);
      expect(lists.success).toEqual(["Win one"]);
      expect(lists.fail_portraits).toEqual(["modules/sadness-chan/assets/portraits/sadness-chan-disappointed.jpg"]);
      expect(lists.portraits).toEqual(["modules/sadness-chan/assets/portraits/sadness-chan-success.jpg"]);
    });
  });

  describe("ImportExport", () => {
    it("should prepare formatted JSON context", async () => {
      await SettingsManager.setCounter({
        "user-1": { name: "Tester", rolls: [0, 1, 2] }
      });

      const app = new ImportExport();
      const context = await app._prepareContext();
      expect(context.counterJson).toContain('"user-1"');
      expect(context.counterJson).toContain('"TestUser"');
    });
  });
});
