import { MODULE_ID, SETTING_KEYS, DEFAULT_SETTINGS } from "../constants.js";
import { SETTINGS_DEFINITIONS } from "../lists/defaultSettings.js";
import {
  DEFAULT_CRIT_FAIL_COMMENTS,
  DEFAULT_CRIT_SUCCESS_COMMENTS,
  DEFAULT_FAIL_PORTRAITS,
  DEFAULT_SUCCESS_PORTRAITS
} from "../lists/defaultMessages.js";

export class SettingsManager {
  static _instance = null;

  static getInstance() {
    if (!this._instance) {
      this._instance = new SettingsManager();
    }
    return this._instance;
  }

  getDefaultLists() {
    return {
      fail: [...DEFAULT_CRIT_FAIL_COMMENTS],
      success: [...DEFAULT_CRIT_SUCCESS_COMMENTS],
      fail_portraits: [...DEFAULT_FAIL_PORTRAITS],
      portraits: [...DEFAULT_SUCCESS_PORTRAITS]
    };
  }

  registerSettings(ListsEditorClass, ImportExportClass) {
    // Register hidden world counter store
    game.settings.register(MODULE_ID, SETTING_KEYS.COUNTER, {
      type: Object,
      default: {},
      scope: "world",
      config: false,
      restricted: false
    });

    // Register hidden lists store
    game.settings.register(MODULE_ID, SETTING_KEYS.LISTS, {
      type: Object,
      default: this.getDefaultLists(),
      scope: "world",
      config: false,
      restricted: true
    });

    // Register UI menus
    if (ListsEditorClass) {
      game.settings.registerMenu(MODULE_ID, SETTING_KEYS.LISTS_EDITOR, {
        name: "SADNESS_CHAN.Menu.ListsEditor.Name",
        label: "SADNESS_CHAN.Menu.ListsEditor.Label",
        hint: "SADNESS_CHAN.Menu.ListsEditor.Hint",
        icon: "fas fa-edit",
        type: ListsEditorClass,
        restricted: true
      });
    }

    if (ImportExportClass) {
      game.settings.registerMenu(MODULE_ID, SETTING_KEYS.IMPORT_EXPORT, {
        name: "SADNESS_CHAN.Menu.ImportExport.Name",
        label: "SADNESS_CHAN.Menu.ImportExport.Label",
        hint: "SADNESS_CHAN.Menu.ImportExport.Hint",
        icon: "fas fa-file-import",
        type: ImportExportClass,
        restricted: true
      });
    }

    // Register visible settings
    for (const setting of SETTINGS_DEFINITIONS) {
      game.settings.register(MODULE_ID, setting.key, setting.data);
    }
  }

  getSetting(key) {
    try {
      return game.settings.get(MODULE_ID, key);
    } catch {
      return DEFAULT_SETTINGS[key] ?? null;
    }
  }

  async setSetting(key, value) {
    return game.settings.set(MODULE_ID, key, value);
  }

  getCounter() {
    const raw = this.getSetting(SETTING_KEYS.COUNTER);
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return foundry.utils.deepClone ? foundry.utils.deepClone(raw) : JSON.parse(JSON.stringify(raw));
  }

  async setCounter(counterData) {
    return this.setSetting(SETTING_KEYS.COUNTER, counterData || {});
  }

  getLists() {
    const raw = this.getSetting(SETTING_KEYS.LISTS);
    const defaults = this.getDefaultLists();
    if (!raw) return defaults;
    let lists = raw;
    if (typeof raw === "string") {
      try {
        lists = JSON.parse(raw);
      } catch {
        return defaults;
      }
    }
    return {
      fail: lists.fail?.length ? lists.fail : defaults.fail,
      success: lists.success?.length ? lists.success : defaults.success,
      fail_portraits: lists.fail_portraits?.length ? lists.fail_portraits : defaults.fail_portraits,
      portraits: lists.portraits?.length ? lists.portraits : defaults.portraits
    };
  }

  async setLists(listsData) {
    return this.setSetting(SETTING_KEYS.LISTS, listsData);
  }

  async resetLists() {
    return this.setLists(this.getDefaultLists());
  }

  async resetCounter() {
    return this.setCounter({});
  }

  async resetUserCounter(userId) {
    const counter = this.getCounter();
    if (counter[userId]?.rolls) {
      counter[userId].rolls.fill(0);
      await this.setCounter(counter);
    }
  }

  async resetAllSettings() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const settingKey = SETTING_KEYS[key];
      if (settingKey) {
        await this.setSetting(settingKey, value);
      }
    }
    await this.resetLists();
  }

  getPermissionLevel() {
    return this.getSetting(SETTING_KEYS.RESET_LEVEL) ?? DEFAULT_SETTINGS.RESET_LEVEL;
  }
}

export default SettingsManager.getInstance();
