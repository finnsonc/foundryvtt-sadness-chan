import RollTracker from "../services/RollTracker.js";
import SadnessChan from "../services/SadnessChan.js";

export async function onCreateChatMessage(chatMessage, options, userId) {
  if (!chatMessage) return;

  // In multiplayer, only the primary active GM (or author if no GM) processes world setting writes
  const isPrimaryGM = game.users?.activeGM?.id === game.user?.id;
  const isAuthor = chatMessage.author?.id === game.user?.id || chatMessage.user?.id === game.user?.id;

  if (!isPrimaryGM && (!isAuthor || game.users?.activeGM)) {
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

  await RollTracker.recordUserRolls(uId, uName, recentRolls);
  await SadnessChan.handleRollWhisper(recentRolls, rollingUser);
}

export default onCreateChatMessage;
