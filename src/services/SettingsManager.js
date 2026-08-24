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
    if (!game.user?.isGM) {
      // Non-GM users cannot write to world settings in the server database
      return;
    }
    try {
      return await game.settings.set(MODULE_ID, key, value);
    } catch (err) {
      console.warn(`sadness-chan | Unable to persist setting ${key}:`, err);
    }
  }

  getCounter() {
    const result = {};

    // 1. Read from User document flags (accessible by all users)
    if (game.users) {
      for (const u of game.users) {
        const uId = u.id || u._id;
        const rolls = u.getFlag ? u.getFlag(MODULE_ID, "rolls") : u.flags?.[MODULE_ID]?.rolls;
        if (Array.isArray(rolls) && rolls.length > 0) {
          result[uId] = {
            id: uId,
            name: u.name,
            rolls: foundry.utils.deepClone ? foundry.utils.deepClone(rolls) : JSON.parse(JSON.stringify(rolls))
          };
        }
      }
    }

    // 2. Merge with legacy world setting store
    const raw = this.getSetting(SETTING_KEYS.COUNTER);
    if (raw) {
      let legacy = raw;
      if (typeof raw === "string") {
        try {
          legacy = JSON.parse(raw);
        } catch {
          legacy = {};
        }
      }
      for (const [id, data] of Object.entries(legacy)) {
        if (!result[id] && data && Array.isArray(data.rolls)) {
          result[id] = foundry.utils.deepClone ? foundry.utils.deepClone(data) : JSON.parse(JSON.stringify(data));
        }
      }
    }

    return result;
  }

  async setCounter(counterData) {
    if (counterData && typeof counterData === "object") {
      for (const [uId, data] of Object.entries(counterData)) {
        const user = game.users?.get(uId);
        if (user && Array.isArray(data?.rolls) && typeof user.setFlag === "function") {
          await user.setFlag(MODULE_ID, "rolls", data.rolls);
        }
      }
    }
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
    if (game.users) {
      for (const u of game.users) {
        if (typeof u.unsetFlag === "function") {
          await u.unsetFlag(MODULE_ID, "rolls");
        }
      }
    }
    return this.setCounter({});
  }

  async resetUserCounter(userId) {
    const user = game.users?.get(userId) || (game.user?.id === userId ? game.user : null);
    if (user && typeof user.unsetFlag === "function") {
      await user.unsetFlag(MODULE_ID, "rolls");
    }
    if (game.user?.isGM) {
      const counter = this.getCounter();
      if (counter[userId]?.rolls) {
        counter[userId].rolls.fill(0);
        await this.setCounter(counter);
      }
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
