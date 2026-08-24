import "./styles/sadness-chan.scss";
import { onInit } from "./hooks/init.js";
import { onChatMessage, onPreCreateChatMessage, handleSadnessCommand } from "./hooks/chatMessage.js";
import { onCreateChatMessage } from "./hooks/createChatMessage.js";
import SettingsManager from "./services/SettingsManager.js";
import RollTracker from "./services/RollTracker.js";
import SadnessChan from "./services/SadnessChan.js";
import ListsEditor from "./apps/ListsEditor.js";
import ImportExport from "./apps/ImportExport.js";
import { runSelfTest } from "./services/SelfTest.js";
import { MODULE_ID } from "./constants.js";

// Register Foundry lifecycle hooks
Hooks.once("init", onInit);
Hooks.on("chatMessage", onChatMessage);              // Legacy (≤v13)
Hooks.on("preCreateChatMessage", onPreCreateChatMessage); // v14 fallback
Hooks.on("createChatMessage", onCreateChatMessage);

// Expose public API on ready
Hooks.once("ready", () => {
  const module = game.modules?.get(MODULE_ID);
  if (module) {
    module.api = {
      settings: SettingsManager,
      tracker: RollTracker,
      sadness: SadnessChan,
      apps: {
        ListsEditor,
        ImportExport
      },
      executeCommand: (cmd = "") => {
        const clean = cmd.replace(/^[!/]?sadness\s*/i, "");
        return handleSadnessCommand(clean, game.user);
      },
      showStats: (user = game.user) => {
        return handleSadnessCommand("", user);
      },
      runSelfTest
    };
  }
  console.log(`${MODULE_ID} | Ready hook complete. API registered.`);
});
