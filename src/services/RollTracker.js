import SettingsManager from "./SettingsManager.js";
import { SETTING_KEYS } from "../constants.js";

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
    const counter = SettingsManager.getCounter();

    if (!counter[userId] || !Array.isArray(counter[userId].rolls)) {
      const initialRolls = this.createZeroArray(dieType + 1);
      for (let i = 1; i <= dieType; i++) {
        initialRolls[i] = recentRolls[i] || 0;
      }
      counter[userId] = {
        id: userId,
        name: userName || "Unknown User",
        rolls: initialRolls
      };
    } else {
      const stored = counter[userId];
      stored.name = userName || stored.name;

      // Ensure storage array is sized to current dieType
      while (stored.rolls.length <= dieType) {
        stored.rolls.push(0);
      }

      for (let i = 1; i <= dieType; i++) {
        stored.rolls[i] = (stored.rolls[i] || 0) + (recentRolls[i] || 0);
      }
    }

    await SettingsManager.setCounter(counter);
    return counter[userId];
  }
}

export default RollTracker.getInstance();
