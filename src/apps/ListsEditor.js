import SettingsManager from "../services/SettingsManager.js";
import { MODULE_ID } from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ListsEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-lists-editor`,
    classes: [`${MODULE_ID}-app`],
    tag: "form",
    window: {
      title: "SADNESS_CHAN.Menu.ListsEditor.Title",
      icon: "fas fa-edit",
      resizable: true
    },
    position: {
      width: 580,
      height: "auto"
    },
    form: {
      handler: ListsEditor.formHandler,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/lists-editor.hbs`
    }
  };

  async _prepareContext(options = {}) {
    const lists = SettingsManager.getLists();
    return {
      moduleName: MODULE_ID,
      lists: {
        fail: lists.fail?.join("\n") || "",
        success: lists.success?.join("\n") || "",
        fail_portraits: lists.fail_portraits?.join("\n") || "",
        portraits: lists.portraits?.join("\n") || ""
      }
    };
  }

  static parseLines(value, fallback = []) {
    if (typeof value !== "string") return fallback;
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  static async formHandler(event, form, formData) {
    const data = formData.object || {};
    const old = SettingsManager.getLists();

    const updated = {
      fail: ListsEditor.parseLines(data.fail, old.fail),
      success: ListsEditor.parseLines(data.success, old.success),
      fail_portraits: ListsEditor.parseLines(data.fail_portraits, old.fail_portraits),
      portraits: ListsEditor.parseLines(data.portraits, old.portraits)
    };

    await SettingsManager.setLists(updated);
    if (ui?.notifications?.info) {
      ui.notifications.info(game.i18n?.localize("SADNESS_CHAN.Notifications.ListsSaved") || "Lists updated successfully!");
    }
  }
}

export default ListsEditor;
