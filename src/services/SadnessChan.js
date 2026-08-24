import SettingsManager from "./SettingsManager.js";
import RollTracker from "./RollTracker.js";
import { MODULE_ID, SETTING_KEYS, DEFAULT_SETTINGS } from "../constants.js";

export class SadnessChan {
  static _instance = null;

  static getInstance() {
    if (!this._instance) {
      this._instance = new SadnessChan();
    }
    return this._instance;
  }

  getRandomPortrait(isSuccess = true) {
    const lists = SettingsManager.getLists();
    const portraitList = isSuccess ? lists.portraits : lists.fail_portraits;
    if (!portraitList || portraitList.length === 0) return "";
    const index = Math.floor(Math.random() * portraitList.length);
    return portraitList[index];
  }

  getRandomComment(isSuccess = true) {
    const lists = SettingsManager.getLists();
    const commentList = isSuccess ? lists.success : lists.fail;
    if (!commentList || commentList.length === 0) {
      return isSuccess ? "What are you trying to prove?" : "One more fail added to the collection.";
    }
    const index = Math.floor(Math.random() * commentList.length);
    return commentList[index];
  }

  formatDynamicMessage(template, userData) {
    if (!template || typeof template !== "string") return "";
    const rolls = userData?.rolls || [];
    const name = userData?.name || "Someone";
    const avg = Math.ceil(RollTracker.getAverage(rolls));

    let result = template.replace(/\[sc-name\]/g, name);
    result = result.replace(/\[sc-avg\]/g, String(avg));
    result = result.replace(/\[sc-d([0-9]{1,4})\]/g, (_match, face) => {
      const idx = Number(face);
      return String(rolls[idx] || 0);
    });

    return result;
  }

  getWhisperChance(isSuccess) {
    const key = isSuccess ? SETTING_KEYS.SUCCESS_CHANCE : SETTING_KEYS.FAIL_CHANCE;
    const fallback = isSuccess ? DEFAULT_SETTINGS.SUCCESS_CHANCE : DEFAULT_SETTINGS.FAIL_CHANCE;
    const chance = Number(SettingsManager.getSetting(key));
    if (isNaN(chance)) return fallback;
    return Math.min(Math.max(chance, 0), 1);
  }

  shouldWhisper(recentRolls, successVal, failVal) {
    if (!Array.isArray(recentRolls)) return false;
    const critSuccessCount = recentRolls[successVal] || 0;
    const critFailCount = recentRolls[failVal] || 0;

    if (critSuccessCount === 0 && critFailCount === 0) {
      return false;
    }

    const isSuccess = critSuccessCount > critFailCount;
    const chance = this.getWhisperChance(isSuccess);
    if (chance <= 0) return false;
    if (chance >= 1) return true;
    return Math.random() < chance;
  }

  buildMessageHTML(content, isSuccess = true) {
    const title = SettingsManager.getSetting(SETTING_KEYS.SADNESS_TITLE) || DEFAULT_SETTINGS.SADNESS_TITLE;
    const showBorder = SettingsManager.getSetting(SETTING_KEYS.IMAGE_BORDER) ?? true;
    const portrait = this.getRandomPortrait(isSuccess);
    const borderClass = showBorder ? "" : "no-border";

    return `
      <div class="${MODULE_ID}-chat-message">
        <div class="${MODULE_ID}-chat-message-header">
          ${portrait ? `<img src="${portrait}" alt="Sadness Chan" class="${MODULE_ID}-chat-message-header__portrait ${borderClass}" />` : ""}
          <h3 class="${MODULE_ID}-chat-message-header__name">${title}</h3>
        </div>
        <div class="${MODULE_ID}-chat-message-body">
          ${content}
        </div>
      </div>
    `;
  }

  buildStatsHTML(userData, displayPortrait = true) {
    const title = SettingsManager.getSetting(SETTING_KEYS.SADNESS_TITLE) || DEFAULT_SETTINGS.SADNESS_TITLE;
    const showBorder = SettingsManager.getSetting(SETTING_KEYS.IMAGE_BORDER) ?? true;
    const showAverage = SettingsManager.getSetting(SETTING_KEYS.AVERAGE_TOGGLE) ?? false;
    const showPlotting = SettingsManager.getSetting(SETTING_KEYS.PLOTTING) ?? true;
    const borderClass = showBorder ? "" : "no-border";

    const rolls = userData?.rolls || [];
    const critFailFace = RollTracker.getCritValue(false);
    const critSuccessFace = RollTracker.getCritValue(true);
    const critFailCount = rolls[critFailFace] || 0;
    const critSuccessCount = rolls[critSuccessFace] || 0;
    const avgValue = RollTracker.getAverage(rolls);

    const portrait = displayPortrait ? this.getRandomPortrait(true) : null;
    const histogramData = showPlotting ? RollTracker.getHistogramData(rolls) : [];

    let histogramHTML = "";
    if (showPlotting && histogramData.length > 0) {
      histogramHTML = `
        <div class="sc-histogram">
          ${histogramData
            .map(
              (bar) => `
            <div class="bar" style="height: ${bar.height}%;" data-value="${bar.count}" title="Face ${bar.face}: ${bar.count} rolls">
              <div class="sc-bar-index">${bar.face}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    const averageDieHTML = showAverage
      ? `
      <li class="${MODULE_ID}-chat-stats-body__rolls-roll">
        <span class="${MODULE_ID}-chat-stats-body__rolls-roll-dice avg"><span>${avgValue}</span></span>
        <span class="${MODULE_ID}-chat-stats-body__rolls-roll-count">avg</span>
      </li>
    `
      : "";

    return `
      <div class="${MODULE_ID}-chat-stats">
        ${
          displayPortrait && portrait
            ? `
          <div class="${MODULE_ID}-chat-stats-header">
            <img src="${portrait}" alt="Sadness Chan" class="${MODULE_ID}-chat-stats-header__portrait ${borderClass}" />
            <h3 class="${MODULE_ID}-chat-stats-header__name">${title}</h3>
          </div>
        `
            : ""
        }
        <div class="${MODULE_ID}-chat-stats-body">
          <h2 class="${MODULE_ID}-chat-stats-body__username">${userData.name || "Unknown"}</h2>
          <ol class="${MODULE_ID}-chat-stats-body__rolls">
            <li class="${MODULE_ID}-chat-stats-body__rolls-roll">
              <span class="${MODULE_ID}-chat-stats-body__rolls-roll-dice min">${critFailFace}</span>
              <span class="${MODULE_ID}-chat-stats-body__rolls-roll-count">${critFailCount}</span>
            </li>
            ${averageDieHTML}
            <li class="${MODULE_ID}-chat-stats-body__rolls-roll">
              <span class="${MODULE_ID}-chat-stats-body__rolls-roll-dice max">${critSuccessFace}</span>
              <span class="${MODULE_ID}-chat-stats-body__rolls-roll-count">${critSuccessCount}</span>
            </li>
          </ol>
          ${histogramHTML}
        </div>
      </div>
    `;
  }

  async sendWhisper(userId, content, isSuccess = true) {
    const isPublic = Boolean(SettingsManager.getSetting(SETTING_KEYS.COMMENT_MESSAGE_VISIBILITY));
    const formatted = this.buildMessageHTML(content, isSuccess);
    const targetId = userId || game.user?.id;
    const title = SettingsManager.getSetting(SETTING_KEYS.SADNESS_TITLE) || DEFAULT_SETTINGS.SADNESS_TITLE;

    return ChatMessage.create(
      {
        author: targetId,
        user: targetId,
        content: formatted,
        whisper: isPublic ? [] : [targetId],
        speaker: ChatMessage.getSpeaker ? ChatMessage.getSpeaker({ alias: title }) : { alias: title }
      },
      { chatBubble: false }
    );
  }

  async handleRollWhisper(recentRolls, user) {
    if (!recentRolls || !user) return;
    const critSuccessFace = RollTracker.getCritValue(true);
    const critFailFace = RollTracker.getCritValue(false);

    if (!this.shouldWhisper(recentRolls, critSuccessFace, critFailFace)) {
      return;
    }

    const isSuccess = (recentRolls[critSuccessFace] || 0) >= (recentRolls[critFailFace] || 0);
    const rawComment = this.getRandomComment(isSuccess);
    const counter = SettingsManager.getCounter();
    const userData = counter[user.id || user._id] || { name: user.name, rolls: recentRolls };

    const comment = this.formatDynamicMessage(rawComment, userData);
    return this.sendWhisper(user.id || user._id, comment, isSuccess);
  }
}

export default SadnessChan.getInstance();
