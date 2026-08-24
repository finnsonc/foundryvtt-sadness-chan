import SettingsManager from "../services/SettingsManager.js";
import { MODULE_ID } from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImportExport extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-import-export`,
    classes: [`${MODULE_ID}-app`],
    tag: "form",
    window: {
      title: "SADNESS_CHAN.Menu.ImportExport.Title",
      icon: "fas fa-file-import",
      resizable: true
    },
    position: {
      width: 580,
      height: "auto"
    },
    actions: {
      import: ImportExport.onImport,
      copy: ImportExport.onCopy
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/import-export.hbs`
    }
  };

  async _prepareContext(options = {}) {
    const counter = SettingsManager.getCounter();
    return {
      moduleName: MODULE_ID,
      counterJson: JSON.stringify(counter, null, 2)
    };
  }

  static async onImport(event, target) {
    const form = target.closest("form");
    const textarea = form?.querySelector('textarea[name="counter"]');
    const value = textarea ? textarea.value : "";

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Invalid format: Must be a JSON object.");
      }
      await SettingsManager.setCounter(parsed);
      if (ui?.notifications?.info) {
        ui.notifications.info(game.i18n?.localize("SADNESS_CHAN.Notifications.ImportSuccess") || "History successfully imported!");
      }
      if (this.close) this.close();
    } catch (err) {
      if (ui?.notifications?.error) {
        ui.notifications.error(game.i18n?.localize("SADNESS_CHAN.Notifications.InvalidJson") || "Invalid JSON format.");
      }
      console.error(err);
    }
  }

  static async onCopy(event, target) {
    const form = target.closest("form");
    const textarea = form?.querySelector('textarea[name="counter"]');
    const value = textarea ? textarea.value : "";

    try {
      await navigator.clipboard.writeText(value);
      if (ui?.notifications?.info) {
        ui.notifications.info(game.i18n?.localize("SADNESS_CHAN.Notifications.CopySuccess") || "History copied to clipboard!");
      }
    } catch (err) {
      console.error("Clipboard write error:", err);
    }
  }
}

export default ImportExport;
