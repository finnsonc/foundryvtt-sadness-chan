import SettingsManager from "./SettingsManager.js";
import RollTracker from "./RollTracker.js";
import SadnessChan from "./SadnessChan.js";
import ListsEditor from "../apps/ListsEditor.js";
import ImportExport from "../apps/ImportExport.js";
import { handleSadnessCommand } from "../hooks/chatMessage.js";
import { MODULE_ID, SETTING_KEYS } from "../constants.js";

export async function runSelfTest() {
  console.group(`%cSadness Chan | In-World Automated Diagnostic Suite`, "color: #3b82f6; font-weight: bold; font-size: 14px;");
  
  const results = [];
  function assert(name, condition, detail = "") {
    const passed = Boolean(condition);
    results.push({ test: name, status: passed ? "PASS" : "FAIL", detail });
    if (passed) {
      console.log(`%c[PASS]%c ${name}`, "color: green; font-weight: bold;", "color: inherit;", detail ? `(${detail})` : "");
    } else {
      console.error(`%c[FAIL]%c ${name}`, "color: red; font-weight: bold;", "color: inherit;", detail);
    }
    return passed;
  }

  try {
    // 1. Settings Verification
    const statsCmd = SettingsManager.getSetting(SETTING_KEYS.STATS_CMD);
    assert("Settings: Read statsCmd", statsCmd === "!sadness", `Got: ${statsCmd}`);

    const lists = SettingsManager.getLists();
    assert("Settings: Load reaction lists", lists && lists.fail.length > 0 && lists.portraits.length > 0, `${lists.fail.length} fail comments, ${lists.portraits.length} portraits`);

    // 2. Local Asset Verification
    const samplePortrait = SadnessChan.getRandomPortrait(true);
    assert("Assets: Local portrait resolution", samplePortrait && samplePortrait.startsWith("modules/sadness-chan/assets/"), samplePortrait);

    // 3. Roll Tracking Engine
    const initialCounter = SettingsManager.getCounter();
    const testUserId = game.user.id;
    const testRolls = new Array(21).fill(0);
    testRolls[1] = 2;
    testRolls[20] = 3;

    await RollTracker.recordUserRolls(testUserId, game.user.name, testRolls);
    const updatedCounter = SettingsManager.getCounter();
    const userRolls = updatedCounter[testUserId]?.rolls;
    assert("RollTracker: Record rolls in database", userRolls && userRolls[1] >= 2 && userRolls[20] >= 3, `d1: ${userRolls?.[1]}, d20: ${userRolls?.[20]}`);

    const avg = RollTracker.getAverage(userRolls);
    assert("RollTracker: Compute rolling average", typeof avg === "number" && avg > 0, `Average: ${avg}`);

    // 4. Dynamic Message Templating
    const testTemplate = "[sc-name] rolled [sc-d1] ones with average [sc-avg]!";
    const formatted = SadnessChan.formatDynamicMessage(testTemplate, { name: game.user.name, rolls: userRolls });
    assert("SadnessChan: Dynamic message template expansion", formatted.includes(game.user.name) && formatted.includes("ones"), formatted);

    // 5. HTML Builders
    const chatHTML = SadnessChan.buildMessageHTML("Self-test mock comment", false);
    assert("HTML Builder: Message Card HTML", chatHTML.includes("sadness-chan-chat-message") && chatHTML.includes("Self-test mock comment"));

    const statsHTML = SadnessChan.buildStatsHTML({ name: game.user.name, rolls: userRolls }, true);
    assert("HTML Builder: Stats Card with Histogram", statsHTML.includes("sadness-chan-chat-stats") && statsHTML.includes("sc-histogram"));

    // 6. ApplicationV2 UI Instances
    let listsAppInstantiated = false;
    try {
      const listsApp = new ListsEditor();
      listsAppInstantiated = Boolean(listsApp);
    } catch (e) {
      console.warn("ListsEditor instantiation note:", e);
    }
    assert("ApplicationV2: ListsEditor initialization", listsAppInstantiated);

    let importExportInstantiated = false;
    try {
      const ieApp = new ImportExport();
      importExportInstantiated = Boolean(ieApp);
    } catch (e) {
      console.warn("ImportExport instantiation note:", e);
    }
    assert("ApplicationV2: ImportExport initialization", importExportInstantiated);

    // 7. Chat Command Dry Run
    let commandDryRunSuccess = false;
    try {
      await handleSadnessCommand("help", game.user);
      commandDryRunSuccess = true;
    } catch (e) {
      console.error("handleSadnessCommand error:", e);
    }
    assert("Chat Commands: Dry-run !sadness help", commandDryRunSuccess, "Posted help message to chat log");

  } catch (err) {
    console.error("Unexpected error during self-test:", err);
  }

  const passedCount = results.filter((r) => r.status === "PASS").length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.table(results);
  console.log(
    `%cSelf-Test Complete: ${passedCount}/${totalCount} Passed ${allPassed ? "🎉" : "⚠️"}`,
    allPassed ? "color: green; font-weight: bold; font-size: 13px;" : "color: red; font-weight: bold; font-size: 13px;"
  );
  console.groupEnd();

  if (ui?.notifications) {
    if (allPassed) {
      ui.notifications.info(`Sadness Chan: All ${totalCount} in-world automated tests passed!`);
    } else {
      ui.notifications.warn(`Sadness Chan: ${passedCount}/${totalCount} tests passed. Check console for details.`);
    }
  }

  return { passedCount, totalCount, allPassed, results };
}

export default runSelfTest;
