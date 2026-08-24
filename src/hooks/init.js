import SettingsManager from "../services/SettingsManager.js";
import ListsEditor from "../apps/ListsEditor.js";
import ImportExport from "../apps/ImportExport.js";
import { MODULE_ID } from "../constants.js";

export function onInit() {
  SettingsManager.registerSettings(ListsEditor, ImportExport);
  console.log(`${MODULE_ID} | Initialized and prepared to collect tears.`);
}

export default onInit;
