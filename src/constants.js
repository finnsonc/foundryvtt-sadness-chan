export const MODULE_ID = "sadness-chan";
export const MODULE_PATH = `modules/${MODULE_ID}/`;

export const SETTING_KEYS = {
  FAIL_CHANCE: "failComChance",
  SUCCESS_CHANCE: "successComChance",
  STATS_CMD: "statsCmd",
  DIE_TYPE: "dieType",
  CRT_FAIL: "crtFail",
  CRT_SUCCESS: "crtSuccess",
  COUNTER: "counter",
  LISTS: "lists",
  LISTS_EDITOR: "listsEditor",
  STATS_MESSAGE_VISIBILITY: "statsWhisperToggle",
  COMMENT_MESSAGE_VISIBILITY: "commentWhisperToggle",
  AVERAGE_TOGGLE: "averageToggle",
  PLOTTING: "plotting",
  IMAGE_BORDER: "imageBorder",
  SADNESS_TITLE: "sadnessTitle",
  RESET_LEVEL: "resetLevel",
  IMPORT_EXPORT: "importExport",
  DEBUG: "debug"
};

export const DEFAULT_SETTINGS = {
  FAIL_CHANCE: 1.0,
  SUCCESS_CHANCE: 1.0,
  STATS_CMD: "!sadness",
  DIE_TYPE: 20,
  CRT_FAIL: 1,
  CRT_SUCCESS: 20,
  STATS_MESSAGE_VISIBILITY: true,
  COMMENT_MESSAGE_VISIBILITY: true,
  AVERAGE_TOGGLE: true,
  PLOTTING: true,
  IMAGE_BORDER: true,
  SADNESS_TITLE: "Sadness Chan",
  RESET_LEVEL: 4,
  DEBUG: false
};
