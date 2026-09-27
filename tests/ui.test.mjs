import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { StudioController } from '../src/state.ts';
import { mountStudio } from '../src/studio-ui.ts';

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
  assert.match(root.textContent, /侧栏|文件/);
  assert.match(root.textContent, /笔记属性/);
  assert.match(root.textContent, /Mermaid/);
  assert.match(root.textContent, /Live Preview/);
  assert.doesNotMatch(root.textContent, /阅读视图/);
  assert.equal(root.querySelector('[data-preset="minimal"]').disabled, true);
  cleanup();
});

test('customization changes preview only until Apply; Reset restores the draft', () => {
  const { root, studio, calls } = setup();
  click(root, '[data-action="customize"]');
  click(root, '[data-action="toggle"][data-option="lines"]');
  click(root, '[data-action="accent"][data-value="mint"]');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.lines, 'false');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'mint');
  assert.equal(studio.applied, null);
  assert.deepEqual(calls.saves, []);
  click(root, '[data-action="reset"]');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.lines, 'true');
  assert.equal(root.querySelector('[data-testid="preview"]').dataset.accent, 'blue');
});

test('Apply and Undo update visible status and persisted state', async () => {
  const { root, calls } = setup();
  click(root, '[data-action="apply"]');
  await settle();
  assert.match(root.querySelector('[data-testid="status"]').textContent, /已应用/);
  assert.equal(calls.saves.length, 1);
  click(root, '[data-action="undo"]');
  await settle();
  assert.match(root.querySelector('[data-testid="status"]').textContent, /尚未应用/);
  assert.equal(calls.saves.length, 2);
});

test('blocked Apply shows the prerequisite instead of success', async () => {
  const { root, calls } = setup(async () => '请先启用 Reading Studio 主题');
  click(root, '[data-action="apply"]');
  await settle();
  assert.match(root.querySelector('[role="status"]').textContent, /请先启用 Reading Studio 主题/);
  assert.match(root.querySelector('[data-testid="status"]').textContent, /尚未应用/);
  assert.deepEqual(calls.saves, []);
});
