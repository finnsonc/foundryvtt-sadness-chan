import RollTracker from "../services/RollTracker.js";
import SadnessChan from "../services/SadnessChan.js";

export async function onCreateChatMessage(chatMessage, options, userId) {
  if (!chatMessage) return;

  const activeGM = game.users?.activeGM;
  const isGM = Boolean(game.user?.isGM);
  const isPrimaryGM = activeGM ? activeGM.id === game.user?.id : isGM;
  const isAuthor = chatMessage.author?.id === game.user?.id || chatMessage.user?.id === game.user?.id;

  // 1. If an active GM is online: only the primary active GM processes the roll
  if (activeGM && !isPrimaryGM) {
    return;
  }

  // 2. If NO GM is online: only the rolling author processes the reaction
  if (!activeGM && !isAuthor) {
    return;
  }

  const rolls = chatMessage.rolls && chatMessage.rolls.length > 0 ? chatMessage.rolls : chatMessage.roll ? [chatMessage.roll] : null;
  if (!rolls) return;

  const rollingUser = chatMessage.author || chatMessage.user || game.users?.get(userId);
  if (!rollingUser) return;

  const recentRolls = RollTracker.extractDiceRolls(rolls);
  if (!recentRolls) return;

  const uId = rollingUser.id || rollingUser._id;
  const uName = rollingUser.name || "Player";

  try {
    await RollTracker.recordUserRolls(uId, uName, recentRolls);
  } catch (err) {
    console.warn("sadness-chan | Could not record roll to world database:", err);
  }

  try {
    await SadnessChan.handleRollWhisper(recentRolls, rollingUser);
  } catch (err) {
    console.error("sadness-chan | Error generating roll reaction:", err);
  }
}

export default onCreateChatMessage;
