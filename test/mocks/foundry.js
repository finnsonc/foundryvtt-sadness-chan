import { vi } from "vitest";

// In-memory settings database
const settingsStore = new Map();
const settingsDefs = new Map();

const usersArray = [
  { id: "user-1", _id: "user-1", name: "TestUser", active: true, role: 4, isGM: true },
  { id: "user-2", _id: "user-2", name: "PlayerTwo", active: true, role: 1, isGM: false }
];

usersArray.get = (id) => usersArray.find((u) => u.id === id || u._id === id);
usersArray.activeGM = usersArray[0];

export const mockGame = {
  settings: {
    register: vi.fn((module, key, data) => {
      const fullKey = `${module}.${key}`;
      settingsDefs.set(fullKey, data);
      if (!settingsStore.has(fullKey)) {
        settingsStore.set(fullKey, data.default);
      }
    }),
    registerMenu: vi.fn(),
    get: vi.fn((module, key) => {
      const fullKey = `${module}.${key}`;
      return settingsStore.get(fullKey);
    }),
    set: vi.fn((module, key, value) => {
      const fullKey = `${module}.${key}`;
      settingsStore.set(fullKey, value);
      return Promise.resolve(value);
    })
  },
  user: usersArray[0],
  users: usersArray,
  modules: new Map([["sadness-chan", {}]]),
  i18n: {
    localize: vi.fn((k) => k),
    format: vi.fn((k, data) => `${k}`)
  }
};

export const mockHooks = {
  _hooks: new Map(),
  on: vi.fn((name, fn) => {
    if (!mockHooks._hooks.has(name)) mockHooks._hooks.set(name, []);
    mockHooks._hooks.get(name).push(fn);
  }),
  once: vi.fn((name, fn) => {
    mockHooks.on(name, fn);
  }),
  callAll: (name, ...args) => {
    const list = mockHooks._hooks.get(name) || [];
    for (const fn of list) fn(...args);
  }
};

export class MockChatMessage {
  static created = [];
  static async create(data, options = {}) {
    const msg = { ...data, options, id: `msg-${Math.random().toString(36).slice(2, 7)}` };
    MockChatMessage.created.push(msg);
    return msg;
  }
  static getSpeaker(data = {}) {
    return { alias: data.alias || "Sadness Chan" };
  }
  static clear() {
    MockChatMessage.created = [];
  }
}

export class MockApplicationV2 {
  constructor(options = {}) {
    this.options = options;
  }
  render() {}
  close() {}
}

export const MockHandlebarsApplicationMixin = (BaseClass) => {
  return class extends BaseClass {};
};

export const mockFoundry = {
  utils: {
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    mergeObject: (target, source) => Object.assign(target, source)
  },
  applications: {
    api: {
      ApplicationV2: MockApplicationV2,
      HandlebarsApplicationMixin: MockHandlebarsApplicationMixin
    }
  }
};

export const mockUi = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
};

// Set globals on NodeJS global scope
globalThis.game = mockGame;
globalThis.Hooks = mockHooks;
globalThis.ChatMessage = MockChatMessage;
globalThis.foundry = mockFoundry;
globalThis.ui = mockUi;

export function resetMockStorage() {
  settingsStore.clear();
  MockChatMessage.clear();
}
