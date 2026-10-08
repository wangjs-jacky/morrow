import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeColorMode } from '../src/color-mode.ts';

test('native mode uses Obsidian config, maps all modes and unsubscribes', () => {
  let theme = 'obsidian';
  const handlers = new Set();
  const calls = [];
  const host = {
    changeTheme(value) { calls.push(value); theme = value; handlers.forEach(fn => fn('theme')); },
    vault: {
      getConfig: key => key === 'theme' ? theme : undefined,
      on: (name, fn) => handlers.add(fn), off: (name, fn) => handlers.delete(fn),
    },
  };
  const mode = nativeColorMode(host);
  assert.equal(mode.get(), 'dark');
  let changes = 0;
  const unsubscribe = mode.subscribe(() => changes++);
  for (const value of ['light', 'system', 'dark']) { mode.set(value); assert.equal(mode.get(), value); }
  assert.deepEqual(calls, ['moonstone', 'system', 'obsidian']);
  assert.equal(changes, 3);
  handlers.forEach(fn => fn('cssTheme'));
  assert.equal(changes, 3);
  theme = 'moonstone'; handlers.forEach(fn => fn('theme'));
  assert.equal(mode.get(), 'light');
  unsubscribe(); assert.equal(handlers.size, 0);
  assert.equal(nativeColorMode(host).get(), 'light');
});

test('unsupported native API gives an actionable error', () => {
  const mode = nativeColorMode({ vault: {} });
  assert.throws(() => mode.set('light'), /设置 → 外观/);
});
