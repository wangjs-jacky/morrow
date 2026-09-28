import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { StudioController } from '../src/state.ts';
import { mountStudio } from '../src/studio-ui.ts';
import { PRESETS } from '../src/presets.ts';
import { readFileSync } from 'node:fs';

function setup(check = async () => null) {
  const dom = new JSDOM('<div id="root"></div>');
  const root = dom.window.document.getElementById('root');
  const calls = { saves: [], renders: [] };
  const host = {
    check,
    save: async state => { calls.saves.push(structuredClone(state)); },
    render: settings => { calls.renders.push(structuredClone(settings)); },
  };
  const studio = new StudioController(host, null);
  const cleanup = mountStudio(root, studio);
  return { dom, root, studio, calls, cleanup };
}

const click = (root, selector) => {
  const button = root.querySelector(selector);
  assert.ok(button, `missing ${selector}`);
  button.click();
};
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

test('one preview includes the promised surfaces and truthful editing mode', () => {
  const { root, cleanup } = setup();
  assert.equal(root.querySelector('.rs-customizer').hidden, false);
  assert.equal(root.querySelector('[data-action="customize"]').getAttribute('aria-expanded'), 'true');
  assert.match(root.textContent, /侧栏|文件/);
  assert.match(root.textContent, /笔记属性/);
  assert.match(root.textContent, /Mermaid/);
  assert.match(root.textContent, /Live Preview/);
  assert.doesNotMatch(root.textContent, /阅读视图/);
  const buttons = [...root.querySelectorAll('button[data-action="preset"]')];
  assert.deepEqual(buttons.map(button => button.dataset.preset), PRESETS.map(preset => preset.id));
  assert.ok(buttons.every(button => !button.disabled));
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.preset, 'deep-reading');
  cleanup();
});

test('each preset switches the same draft preview and Apply label without saving', () => {
  const { root, studio, calls, cleanup } = setup();
  for (const preset of PRESETS) {
    click(root, `button[data-action="preset"][data-preset="${preset.id}"]`);
    assert.equal(root.querySelectorAll('[data-testid="preview"]').length, 1);
    assert.equal(root.querySelector('[data-testid="preview"]').dataset.preset, preset.id);
    assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, preset.defaults.accent);
    assert.equal(root.dataset.preset, preset.id);
    assert.equal(root.dataset.accent, preset.defaults.accent);
    assert.match(root.querySelector('[data-action="apply"]').textContent, new RegExp(preset.label));
    assert.equal(root.querySelectorAll('button[data-action="preset"][aria-pressed="true"]').length, 1);
    assert.equal(root.querySelector('button[data-action="preset"][aria-pressed="true"]').dataset.preset, preset.id);
    assert.equal(studio.applied, null);
    assert.deepEqual(calls.saves, []);
  }
  cleanup();
});

test('customization changes preview only until Apply; Reset restores the draft', () => {
  const { root, studio, calls } = setup();
  click(root, '[data-action="toggle"][data-option="lines"]');
  click(root, '[data-action="accent"][data-value="mint"]');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.lines, 'false');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'mint');
  assert.equal(root.dataset.accent, 'mint');
  assert.equal(studio.applied, null);
  assert.deepEqual(calls.saves, []);
  click(root, '[data-action="reset"]');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.lines, 'true');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'blue');
});

test('Reset restores the selected pack defaults without changing its identity', () => {
  const { root, studio, cleanup } = setup();
  click(root, '[data-action="preset"][data-preset="soft-mist"]');
  click(root, '[data-action="toggle"][data-option="lines"]');
  click(root, '[data-action="accent"][data-value="mint"]');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'mint');
  click(root, '[data-action="reset"]');
  assert.deepEqual(studio.draft, PRESETS.find(preset => preset.id === 'soft-mist').defaults);
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.preset, 'soft-mist');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'violet');
  cleanup();
});

test('customizer can be closed and reopened after starting expanded', () => {
  const { root, cleanup } = setup();
  click(root, '[data-action="close"]');
  assert.equal(root.querySelector('.rs-customizer').hidden, true);
  assert.equal(root.querySelector('[data-action="customize"]').getAttribute('aria-expanded'), 'false');
  click(root, '[data-action="customize"]');
  assert.equal(root.querySelector('.rs-customizer').hidden, false);
  cleanup();
});

test('preview stylesheet defines distinct surfaces for every pack', () => {
  const css = readFileSync(new URL('../plugin/styles.css', import.meta.url), 'utf8');
  const surfaces = ['preview-bg', 'sidebar', 'note', 'properties', 'diagram', 'node'];
  const values = new Map();
  for (const preset of PRESETS.slice(1)) {
    const rule = css.match(new RegExp(`\\.rs-preview\\[data-preset="${preset.id}"\\] \\{([^}]+)\\}`));
    assert.ok(rule, `missing ${preset.id} preview tokens`);
    values.set(preset.id, surfaces.map(surface => {
      const color = rule[1].match(new RegExp(`--rs-${surface}: (#[0-9a-f]+)`));
      assert.ok(color, `${preset.id} missing ${surface}`);
      return color[1];
    }));
  }
  for (let index = 0; index < surfaces.length; index++) {
    assert.equal(new Set([...values.values()].map(colors => colors[index])).size, 4, `${surfaces[index]} should differ across packs`);
  }
});

test('Apply and Undo update visible status and persisted state', async () => {
  const { root, calls } = setup();
  click(root, '[data-action="apply"]');
  await settle();
  assert.match(root.querySelector('[data-testid="status"]').textContent, /已应用/);
  assert.equal(calls.saves.length, 1);
  click(root, '[data-action="preset"][data-preset="prism-focus"]');
  assert.match(root.querySelector('[data-testid="status"]').textContent, /未应用/);
  assert.equal(calls.saves.length, 1);
  click(root, '[data-action="apply"]');
  await settle();
  assert.equal(calls.saves.at(-1).applied.preset, 'prism-focus');
  click(root, '[data-action="undo"]');
  await settle();
  assert.match(root.querySelector('[data-testid="status"]').textContent, /已应用/);
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.preset, 'deep-reading');
  assert.equal(calls.saves.length, 3);
});

test('blocked Apply shows the prerequisite instead of success', async () => {
  const { root, calls } = setup(async () => '请先启用 Morrow 主题');
  click(root, '[data-action="apply"]');
  await settle();
  assert.match(root.querySelector('[role="status"]').textContent, /请先启用 Morrow 主题/);
  assert.match(root.querySelector('[data-testid="status"]').textContent, /尚未应用/);
  assert.deepEqual(calls.saves, []);
});
