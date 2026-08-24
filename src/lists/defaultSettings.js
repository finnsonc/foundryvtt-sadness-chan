import { SETTING_KEYS, DEFAULT_SETTINGS } from "../constants.js";

export const ERROR_MESSAGES = {
  NOT_ENOUGH_PERMISSIONS: "Sorry, but this command is only for the big guy.",
  RESET_SOMEONE_ELSE: "Wow, covering up for someone else. Normally, I would say you are a really nice guy, but I know you are a degenerate, so...",
  SETTINGS_RESET: "Who are you, again?",
  COUNTER_RESET: "Are you THAT embarrassed about your rolls?",
  LISTS_RESET: "Oh, good... I can be myself again. (◔_◔)",
  INVALID_ARGUMENTS: "Do you even know what you're doing?",
  NO_DATA: "Play a little before spamming your friends with your failures. -_-"
};

export const SETTINGS_DEFINITIONS = [
  {
    key: SETTING_KEYS.STATS_CMD,
    data: {
      name: "SADNESS_CHAN.Settings.StatsCmd.Name",
      hint: "SADNESS_CHAN.Settings.StatsCmd.Hint",
      type: String,
      default: DEFAULT_SETTINGS.STATS_CMD,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.DIE_TYPE,
    data: {
      name: "SADNESS_CHAN.Settings.DieType.Name",
      hint: "SADNESS_CHAN.Settings.DieType.Hint",
      type: Number,
      default: DEFAULT_SETTINGS.DIE_TYPE,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.CRT_FAIL,
    data: {
      name: "SADNESS_CHAN.Settings.CrtFail.Name",
      hint: "SADNESS_CHAN.Settings.CrtFail.Hint",
      type: Number,
      default: DEFAULT_SETTINGS.CRT_FAIL,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.CRT_SUCCESS,
    data: {
      name: "SADNESS_CHAN.Settings.CrtSuccess.Name",
      hint: "SADNESS_CHAN.Settings.CrtSuccess.Hint",
      type: Number,
      default: DEFAULT_SETTINGS.CRT_SUCCESS,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.FAIL_CHANCE,
    data: {
      name: "SADNESS_CHAN.Settings.FailChance.Name",
      hint: "SADNESS_CHAN.Settings.FailChance.Hint",
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: DEFAULT_SETTINGS.FAIL_CHANCE,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.SUCCESS_CHANCE,
    data: {
      name: "SADNESS_CHAN.Settings.SuccessChance.Name",
      hint: "SADNESS_CHAN.Settings.SuccessChance.Hint",
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: DEFAULT_SETTINGS.SUCCESS_CHANCE,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.SADNESS_TITLE,
    data: {
      name: "SADNESS_CHAN.Settings.Title.Name",
      hint: "SADNESS_CHAN.Settings.Title.Hint",
      type: String,
      default: DEFAULT_SETTINGS.SADNESS_TITLE,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.STATS_MESSAGE_VISIBILITY,
    data: {
      name: "SADNESS_CHAN.Settings.PublicStats.Name",
      hint: "SADNESS_CHAN.Settings.PublicStats.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.STATS_MESSAGE_VISIBILITY,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.COMMENT_MESSAGE_VISIBILITY,
    data: {
      name: "SADNESS_CHAN.Settings.PublicComments.Name",
      hint: "SADNESS_CHAN.Settings.PublicComments.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.COMMENT_MESSAGE_VISIBILITY,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.AVERAGE_TOGGLE,
    data: {
      name: "SADNESS_CHAN.Settings.ShowAverage.Name",
      hint: "SADNESS_CHAN.Settings.ShowAverage.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.AVERAGE_TOGGLE,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.PLOTTING,
    data: {
      name: "SADNESS_CHAN.Settings.Plotting.Name",
      hint: "SADNESS_CHAN.Settings.Plotting.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.PLOTTING,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.IMAGE_BORDER,
    data: {
      name: "SADNESS_CHAN.Settings.ImageBorder.Name",
      hint: "SADNESS_CHAN.Settings.ImageBorder.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.IMAGE_BORDER,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.RESET_LEVEL,
    data: {
      name: "SADNESS_CHAN.Settings.ResetLevel.Name",
      hint: "SADNESS_CHAN.Settings.ResetLevel.Hint",
      type: Number,
      choices: {
        1: "SADNESS_CHAN.Roles.Plebs",
        2: "SADNESS_CHAN.Roles.TrustedPlebs",
        3: "SADNESS_CHAN.Roles.BigManJr",
        4: "SADNESS_CHAN.Roles.BigMan"
      },
      default: DEFAULT_SETTINGS.RESET_LEVEL,
      scope: "world",
      config: true,
      restricted: true
    }
  },
  {
    key: SETTING_KEYS.DEBUG,
    data: {
      name: "SADNESS_CHAN.Settings.Debug.Name",
      hint: "SADNESS_CHAN.Settings.Debug.Hint",
      type: Boolean,
      default: DEFAULT_SETTINGS.DEBUG,
      scope: "client",
      config: true,
      restricted: false
    }
  }
];
