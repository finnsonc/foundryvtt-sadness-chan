import { vi } from "vitest";

// In-memory settings database
const settingsStore = new Map();
const settingsDefs = new Map();

export function createMockUser(data) {
  const flags = {};
  return {
    ...data,
    flags,
    getFlag: vi.fn((scope, key) => flags[scope]?.[key]),
    setFlag: vi.fn((scope, key, val) => {
      if (!flags[scope]) flags[scope] = {};
      flags[scope][key] = val;
      return Promise.resolve(val);
    }),
    unsetFlag: vi.fn((scope, key) => {
      if (flags[scope]) delete flags[scope][key];
      return Promise.resolve();
    })
  };
}

export const usersArray = [
  createMockUser({ id: "user-1", _id: "user-1", name: "TestUser", active: true, role: 4, isGM: true }),
  createMockUser({ id: "user-2", _id: "user-2", name: "PlayerTwo", active: true, role: 1, isGM: false })
];

usersArray.get = (id) => usersArray.find((u) => u.id === id || u._id === id);
usersArray.find = Array.prototype.find.bind(usersArray);
usersArray.filter = Array.prototype.filter.bind(usersArray);
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

  static create(data) {
    MockChatMessage.created.push(data);
    return Promise.resolve(data);
  }

  static getSpeaker(obj) {
    return obj;
  }
}

export class MockApplicationV2 {
  constructor(options = {}) {
    this.options = options;
  }
  render() {
    return this;
  }
  close() {
    return Promise.resolve();
  }
}

export const MockHandlebarsApplicationMixin = (Base) => {
  return class extends Base {
    _prepareContext() {
      return {};
    }
  };
};

export function setupFoundryGlobals() {
  global.game = mockGame;
  global.Hooks = mockHooks;
  global.ChatMessage = MockChatMessage;
  global.ui = {
    notifications: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  };
  global.foundry = {
    applications: {
      api: {
        ApplicationV2: MockApplicationV2,
        HandlebarsApplicationMixin: MockHandlebarsApplicationMixin
      }
    },
    utils: {
      deepClone: (obj) => JSON.parse(JSON.stringify(obj))
    }
  };
}

export function resetMockStorage() {
  settingsStore.clear();
  MockChatMessage.created = [];
  mockHooks._hooks.clear();
  for (const u of usersArray) {
    for (const k in u.flags) {
      delete u.flags[k];
    }
  }
  mockGame.user = usersArray[0];
  mockGame.users.activeGM = usersArray[0];
}

// Automatically setup globals on import
setupFoundryGlobals();
