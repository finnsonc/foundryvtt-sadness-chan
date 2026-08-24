import SettingsManager from "./SettingsManager.js";
import { MODULE_ID, SETTING_KEYS } from "../constants.js";

export class RollTracker {
  static _instance = null;

  static getInstance() {
    if (!this._instance) {
      this._instance = new RollTracker();
    }
    return this._instance;
  }

  getDieType() {
    const raw = Number(SettingsManager.getSetting(SETTING_KEYS.DIE_TYPE));
    if (isNaN(raw) || raw < 2) return 20;
    return Math.min(Math.max(raw, 2), 1000);
  }

  getCritValue(isSuccess = true) {
    const dieType = this.getDieType();
    const key = isSuccess ? SETTING_KEYS.CRT_SUCCESS : SETTING_KEYS.CRT_FAIL;
    const fallback = isSuccess ? dieType : 1;
    const val = Number(SettingsManager.getSetting(key));
    if (isNaN(val)) return fallback;

    if (isSuccess) {
      return Math.min(Math.max(val, 1), dieType);
    }
    return Math.max(val, 1);
  }

  getAverage(rolls) {
    if (!Array.isArray(rolls) || rolls.length === 0) return 0;
    let totalScore = 0;
    let totalRolls = 0;
    for (let i = 1; i < rolls.length; i++) {
      const count = rolls[i] || 0;
      totalScore += i * count;
      totalRolls += count;
    }
    if (totalRolls === 0) return 0;
    return Math.round((totalScore / totalRolls) * 10) / 10;
  }

  getHistogramData(rolls) {
    if (!Array.isArray(rolls) || rolls.length <= 1) return [];
    const counts = rolls.slice(1);
    const max = Math.max(...counts, 0);
    return counts.map((count, idx) => {
      const face = idx + 1;
      const height = max > 0 ? Math.round((count / max) * 100) : 0;
      return {
        face,
        count,
        height
      };
    });
  }

  createZeroArray(length) {
    return new Array(length).fill(0);
  }

  getUserRolls(userOrId) {
    let user = userOrId;
    if (typeof userOrId === "string") {
      user = game.users?.get(userOrId) || (game.user?.id === userOrId ? game.user : null);
    }
    const dieType = this.getDieType();
    if (!user) return this.createZeroArray(dieType + 1);

    const flagRolls = user.getFlag ? user.getFlag(MODULE_ID, "rolls") : user.flags?.[MODULE_ID]?.rolls;
    if (Array.isArray(flagRolls) && flagRolls.length > 0) {
      return flagRolls;
    }

    const legacy = SettingsManager.getCounter()[user.id || user._id]?.rolls;
    if (Array.isArray(legacy) && legacy.length > 0) {
      return legacy;
    }

    return this.createZeroArray(dieType + 1);
  }

  extractDiceRolls(rolls, dieType = this.getDieType()) {
    if (!rolls) return null;
    const rollList = Array.isArray(rolls) ? rolls : [rolls];
    const recentRolls = this.createZeroArray(dieType + 1);
    let foundMatchingDice = false;

    for (const roll of rollList) {
      if (!roll) continue;

      // Extract from dice array or terms
      const dice = roll.dice || [];
      const terms = roll.terms || [];
      const diceTerms = dice.length > 0 ? dice : terms.filter((t) => t && (t.faces !== undefined || t.results !== undefined));

      for (const die of diceTerms) {
        if (Number(die.faces) !== dieType || !Array.isArray(die.results)) continue;

        for (const res of die.results) {
          // Check if roll was not dropped/ignored (e.g. advantage/disadvantage)
          if (res.active === false || res.discarded === true) continue;
          const val = Number(res.result ?? res.roll);
          if (val >= 1 && val <= dieType) {
            recentRolls[val] += 1;
            foundMatchingDice = true;
          }
        }
      }
    }

    return foundMatchingDice ? recentRolls : null;
  }

  async recordUserRolls(userId, userName, recentRolls) {
    if (!userId || !Array.isArray(recentRolls)) return;
    const dieType = this.getDieType();
    const user = game.users?.get(userId) || (game.user?.id === userId ? game.user : null);
    const existing = this.getUserRolls(user || userId);
    const updatedRolls = [...existing];

    while (updatedRolls.length <= dieType) {
      updatedRolls.push(0);
    }

    for (let i = 1; i <= dieType; i++) {
      updatedRolls[i] = (updatedRolls[i] || 0) + (recentRolls[i] || 0);
    }

    const userData = {
      id: userId,
      name: userName || user?.name || "Player",
      rolls: updatedRolls
    };

    // 1. Always persist to User document flags (players always have write permission to their own flags!)
    if (user && typeof user.setFlag === "function") {
      try {
        await user.setFlag(MODULE_ID, "rolls", updatedRolls);
      } catch (err) {
        console.warn("sadness-chan | Could not save user flag:", err);
      }
    }

    // 2. If user is GM, also sync to world counter setting
    if (game.user?.isGM) {
      try {
        const counter = SettingsManager.getCounter();
        counter[userId] = userData;
        await SettingsManager.setCounter(counter);
      } catch (err) {
        console.warn("sadness-chan | Could not sync world counter setting:", err);
      }
    }

    return userData;
  }
}

export default RollTracker.getInstance();
