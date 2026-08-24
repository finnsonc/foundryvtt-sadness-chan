import SettingsManager from "../services/SettingsManager.js";
import SadnessChan from "../services/SadnessChan.js";
import { SETTING_KEYS, DEFAULT_SETTINGS } from "../constants.js";
import { ERROR_MESSAGES } from "../lists/defaultSettings.js";

/**
 * Legacy "chatMessage" hook handler (works in Foundry ≤v13).
 * In v14 the ChatLog was rebuilt as ApplicationV2 and this hook may no longer
 * fire, so we also register a preCreateChatMessage handler as fallback.
 */
export function onChatMessage(chatLog, messageText, chatData) {
  if (!messageText || typeof messageText !== "string") return true;
  const match = matchCommand(messageText);
  if (!match) return true;

  console.log(`sadness-chan | chatMessage hook intercepted: "${messageText}"`);
  handleSadnessCommand(match.args, game.user).catch(console.error);
  return false;
}

/**
 * Foundry v14-compatible hook: fires when a ChatMessage document is about to be
 * persisted. If the content looks like a sadness command, we execute the command
 * and return false to prevent the raw text from being saved as a chat message.
 */
export function onPreCreateChatMessage(document, data, options, userId) {
  if (userId && userId !== game.user?.id) return true;
  const content = (data?.content || document?.content || "").trim();
  if (!content) return true;

  const match = matchCommand(content);
  if (!match) return true;

  console.log(`sadness-chan | preCreateChatMessage hook intercepted: "${content}"`);
  handleSadnessCommand(match.args, game.user).catch(console.error);
  return false; // Prevent the raw command text from being saved
}

/**
 * Strip HTML tags and normalize whitespace/entities (handles PF2e, ProseMirror,
 * and other rich text chat inputs that wrap or format message strings).
 */
function stripHTML(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check whether a string starts with the configured sadness command.
 * Returns { args } on match, or null if no match.
 */
function matchCommand(text) {
  const trimmed = stripHTML(text);
  const lower = trimmed.toLowerCase();
  const configuredCmd = (SettingsManager.getSetting(SETTING_KEYS.STATS_CMD) || "!sadness").trim().toLowerCase();

  if (lower === configuredCmd || lower.startsWith(configuredCmd + " ")) {
    return { args: trimmed.slice(configuredCmd.length).trim() };
  }
  if (lower === "!sadness" || lower.startsWith("!sadness ")) {
    return { args: trimmed.slice(8).trim() };
  }
  if (lower === "/sadness" || lower.startsWith("/sadness ")) {
    return { args: trimmed.slice(8).trim() };
  }
  return null;
}

export async function handleSadnessCommand(args, user) {
  const currentUser = user || game.user;
  const userId = currentUser?.id || currentUser?._id;
  const isGM = Boolean(game.user?.isGM || currentUser?.isGM || (currentUser?.role && currentUser.role >= 4));
  const permissionLevel = SettingsManager.getPermissionLevel();
  const userRole = currentUser?.role ?? game.user?.role ?? 1;
  const hasResetRole = userRole >= permissionLevel || isGM;
  const lowerArgs = (args || "").toLowerCase();

  if (!args) {
    return sendUserStats(userId, currentUser);
  }

  if (lowerArgs === "all") {
    if (!isGM) {
      return sendChatMessage(ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, userId);
    }
    return sendAllUsersStats(userId);
  }

  if (lowerArgs === "help") {
    return sendHelpMessage(userId);
  }

  if (lowerArgs.startsWith("reset")) {
    const resetArg = args.slice(5).trim();
    const lowerResetArg = resetArg.toLowerCase();

    if (lowerResetArg === "settings") {
      if (!isGM) return sendChatMessage(ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, userId);
      await SettingsManager.resetAllSettings();
      return sendChatMessage(ERROR_MESSAGES.SETTINGS_RESET, userId);
    }

    if (lowerResetArg === "lists") {
      if (!isGM) return sendChatMessage(ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, userId);
      await SettingsManager.resetLists();
      return sendChatMessage(ERROR_MESSAGES.LISTS_RESET, userId);
    }

    if (lowerResetArg === "counter" || lowerResetArg === "me") {
      if (!hasResetRole) return sendChatMessage(ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, userId);
      if (isGM && lowerResetArg === "counter") {
        await SettingsManager.resetCounter();
      } else {
        await SettingsManager.resetUserCounter(userId);
      }
      return sendChatMessage(ERROR_MESSAGES.COUNTER_RESET, userId);
    }

    if (resetArg) {
      if (!isGM) return sendChatMessage(ERROR_MESSAGES.NOT_ENOUGH_PERMISSIONS, userId);
      const targetUser = game.users?.find((u) => u.name.toLowerCase() === lowerResetArg);
      if (targetUser) {
        await SettingsManager.resetUserCounter(targetUser.id || targetUser._id);
        return sendChatMessage(ERROR_MESSAGES.RESET_SOMEONE_ELSE, userId);
      }
      return sendChatMessage(ERROR_MESSAGES.INVALID_ARGUMENTS, userId);
    }
  }

  return sendChatMessage(ERROR_MESSAGES.INVALID_ARGUMENTS, userId);
}

async function sendUserStats(userId, user) {
  const counter = SettingsManager.getCounter();
  const targetId = userId || game.user?.id;
  const userData = counter[targetId];

  if (!userData || !userData.rolls || userData.rolls.every((v) => !v)) {
    return sendChatMessage(ERROR_MESSAGES.NO_DATA, targetId);
  }

  const isPublic = Boolean(SettingsManager.getSetting(SETTING_KEYS.STATS_MESSAGE_VISIBILITY));
  const html = SadnessChan.buildStatsHTML(userData, true);
  const title = SettingsManager.getSetting(SETTING_KEYS.SADNESS_TITLE) || DEFAULT_SETTINGS.SADNESS_TITLE;

  return ChatMessage.create(
    {
      author: targetId,
      user: targetId,
      content: html,
      whisper: isPublic ? [] : [targetId],
      speaker: ChatMessage.getSpeaker ? ChatMessage.getSpeaker({ alias: title }) : { alias: title }
    },
    { chatBubble: false }
  );
}

async function sendAllUsersStats(userId) {
  const counter = SettingsManager.getCounter();
  const activeUsers = game.users ? game.users.filter((u) => u.active) : [];
  const targetId = userId || game.user?.id;

  let combinedHTML = "";
  let count = 0;

  for (const u of activeUsers) {
    const uId = u.id || u._id;
    const userData = counter[uId];
    if (userData && userData.rolls) {
      combinedHTML += SadnessChan.buildStatsHTML(userData, count === 0);
      count++;
    }
  }

  if (!combinedHTML) {
    return sendChatMessage(ERROR_MESSAGES.NO_DATA, targetId);
  }

  const isPublic = Boolean(SettingsManager.getSetting(SETTING_KEYS.STATS_MESSAGE_VISIBILITY));
  const title = SettingsManager.getSetting(SETTING_KEYS.SADNESS_TITLE) || DEFAULT_SETTINGS.SADNESS_TITLE;

  return ChatMessage.create(
    {
      author: targetId,
      user: targetId,
      content: combinedHTML,
      whisper: isPublic ? [] : [targetId],
      speaker: ChatMessage.getSpeaker ? ChatMessage.getSpeaker({ alias: title }) : { alias: title }
    },
    { chatBubble: false }
  );
}

async function sendHelpMessage(userId) {
  const command = SettingsManager.getSetting(SETTING_KEYS.STATS_CMD) || "!sadness";
  const targetId = userId || game.user?.id;
  const content = `
    <p>Are you that useless that you need help? Fine, I'll help you:</p>
    <p><b>${command}</b> - View your sadness statistics.</p>
    <p><b>${command} all</b> - AOE happiness (GM only).</p>
    <p><b>${command} reset counter</b> - Makes me forget how much of a disappointment you are.</p>
    <p><b>${command} reset settings</b> - Reset all settings to defaults (GM only).</p>
    <p><b>${command} reset lists</b> - Reset custom comment and portrait lists (GM only).</p>
    <p><b>${command} reset &lt;username&gt;</b> - Reset someone else's stats (GM only).</p>
  `;
  return sendChatMessage(content, targetId);
}

async function sendChatMessage(content, userId) {
  const targetId = userId || game.user?.id;
  const isPublic = Boolean(SettingsManager.getSetting(SETTING_KEYS.STATS_MESSAGE_VISIBILITY));
  const formatted = SadnessChan.buildMessageHTML(content);
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

export default onChatMessage;
