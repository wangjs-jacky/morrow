import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, sanitizePersisted, StudioController } from '../src/state.ts';
import { PRESETS } from '../src/presets.ts';

function host(overrides = {}) {
  const calls = { saves: [], renders: [] };
  return {
    calls,
    check: async () => null,
    save: async value => { calls.saves.push(structuredClone(value)); },
    render: value => { calls.renders.push(structuredClone(value)); },
    ...overrides,
  };
}

test('unknown saved settings normalize to safe V1 defaults', () => {
  assert.deepEqual(sanitizePersisted(null), {
    version: 1, applied: null, previous: null, canUndo: false,
  });
  assert.deepEqual(sanitizePersisted({ version: 999, applied: { accent: 'orange' } }),
    sanitizePersisted(null));
  assert.equal(DEFAULT_SETTINGS.preset, 'deep-reading');
});

test('draft changes do not save or change appearance before Apply', () => {
  const adapter = host();
  const studio = new StudioController(adapter, null);
  studio.setOption('wide', true);
  studio.setOption('accent', 'mint');
  assert.equal(studio.draft.wide, true);
  assert.equal(studio.draft.accent, 'mint');
  assert.equal(studio.applied, null);
  assert.deepEqual(adapter.calls, { saves: [], renders: [] });
  studio.resetDraft();
  assert.deepEqual(studio.draft, DEFAULT_SETTINGS);
});

test('a failed prerequisite leaves committed state unchanged', async () => {
  const adapter = host({ check: async () => '启用 Reading Studio 主题' });
  const studio = new StudioController(adapter, null);
  const result = await studio.apply();
  assert.deepEqual(result, { ok: false, message: '启用 Reading Studio 主题' });
  assert.equal(studio.applied, null);
  assert.deepEqual(adapter.calls, { saves: [], renders: [] });
});

test('a failed save does not change the visible appearance', async () => {
  const adapter = host({ save: async () => { throw new Error('disk full'); } });
  const studio = new StudioController(adapter, null);
  const result = await studio.apply();
  assert.equal(result.ok, false);
  assert.match(result.message, /保存失败/);
  assert.equal(studio.applied, null);
  assert.deepEqual(adapter.calls.renders, []);
});

test('apply persists exact options; reload and Undo restore the previous state', async () => {
  let saved;
  const adapter = host({ save: async value => { saved = structuredClone(value); } });
  const studio = new StudioController(adapter, null);
  studio.setOption('lines', false);
  studio.setOption('accent', 'violet');
  assert.equal((await studio.apply()).ok, true);
  assert.equal(saved.applied.lines, false);
  assert.equal(saved.applied.accent, 'violet');
  assert.equal(saved.canUndo, true);

  const reloaded = new StudioController(adapter, saved);
  reloaded.restore();
  assert.equal(adapter.calls.renders.at(-1).accent, 'violet');
  assert.deepEqual(reloaded.draft, saved.applied);
  assert.equal((await reloaded.undo()).ok, true);
  assert.equal(saved.applied, null);
  assert.equal(saved.canUndo, false);
  assert.equal(adapter.calls.renders.at(-1), null);
});

test('five packs expose distinct Chinese choices and the required default options', () => {
  assert.deepEqual(PRESETS.map(pack => pack.id), [
    'deep-reading', 'cupertino-night', 'minimal-graphite', 'soft-mist', 'prism-focus',
  ]);
  assert.deepEqual(PRESETS.map(pack => [pack.defaults.accent, pack.defaults.wide]), [
    ['blue', false], ['blue', false], ['blue', true], ['violet', false], ['mint', true],
  ]);
  for (const pack of PRESETS) {
    assert.match(pack.label, /[\u4e00-\u9fff]/);
    assert.match(pack.description, /[\u4e00-\u9fff]/);
    assert.deepEqual(
      [pack.defaults.preset, pack.defaults.lines, pack.defaults.properties, pack.defaults.diagram],
      [pack.id, true, true, true],
    );
  }
  assert.deepEqual(PRESETS[0].defaults, DEFAULT_SETTINGS);
});

test('V1 deep-reading saves retain their options and missing fields use deep-reading defaults', () => {
  const saved = sanitizePersisted({ version: 1, applied: {
    preset: 'deep-reading', lines: false, properties: false, diagram: false, wide: true, accent: 'mint',
  }, previous: null, canUndo: false });
  assert.deepEqual(saved.applied, {
    preset: 'deep-reading', lines: false, properties: false, diagram: false, wide: true, accent: 'mint',
  });
  assert.deepEqual(sanitizePersisted({ version: 1, applied: { preset: 'deep-reading' }, previous: null }).applied,
    DEFAULT_SETTINGS);
});

test('known packs normalize missing options against their own defaults and unknown IDs are rejected', () => {
  const saved = sanitizePersisted({ version: 1, applied: {
    preset: 'soft-mist', accent: 'invalid', wide: 'invalid', lines: false,
  }, previous: null, canUndo: false });
  assert.deepEqual(saved.applied, {
    preset: 'soft-mist', lines: false, properties: true, diagram: true, wide: false, accent: 'violet',
  });
  assert.deepEqual(sanitizePersisted({ version: 1, applied: { preset: 'unknown' }, previous: null, canUndo: true }),
    { version: 1, applied: null, previous: null, canUndo: false });
  const invalidPrevious = sanitizePersisted({ version: 1, applied: { preset: 'deep-reading' },
    previous: { preset: 'unknown' }, canUndo: true });
  assert.equal(invalidPrevious.canUndo, false);
  assert.equal(invalidPrevious.previous, null);
});

test('selecting a pack rebuilds only the draft and Reset restores that pack defaults', () => {
  const adapter = host();
  const studio = new StudioController(adapter, null);
  studio.setOption('lines', false);
  assert.equal(studio.selectPreset('prism-focus'), true);
  assert.deepEqual(studio.draft, {
    preset: 'prism-focus', lines: true, properties: true, diagram: true, wide: true, accent: 'mint',
  });
  studio.setOption('accent', 'blue');
  studio.setOption('wide', false);
  studio.resetDraft();
  assert.deepEqual(studio.draft, {
    preset: 'prism-focus', lines: true, properties: true, diagram: true, wide: true, accent: 'mint',
  });
  assert.equal(studio.selectPreset('unknown'), false);
  assert.equal(studio.draft.preset, 'prism-focus');
  assert.equal(studio.applied, null);
  assert.deepEqual(adapter.calls, { saves: [], renders: [] });
});

test('cross-pack Apply, reload, and Undo preserve complete configurations and report pack labels', async () => {
  let saved;
  const adapter = host({ save: async value => { saved = structuredClone(value); } });
  const studio = new StudioController(adapter, null);
  studio.selectPreset('cupertino-night');
  studio.setOption('properties', false);
  assert.deepEqual(await studio.apply(), { ok: true, message: '已应用 Cupertino 夜色' });
  const first = structuredClone(saved.applied);
  studio.selectPreset('prism-focus');
  studio.setOption('lines', false);
  assert.deepEqual(await studio.apply(), { ok: true, message: '已应用 棱镜聚焦' });
  assert.deepEqual(saved.previous, first);
  assert.deepEqual(saved.applied, {
    preset: 'prism-focus', lines: false, properties: true, diagram: true, wide: true, accent: 'mint',
  });
  const reloaded = new StudioController(adapter, saved);
  assert.deepEqual(reloaded.draft, saved.applied);
  assert.deepEqual(await reloaded.undo(), { ok: true, message: '已恢复上一个效果' });
  assert.deepEqual(saved.applied, first);
  assert.deepEqual(reloaded.draft, first);
  assert.equal(saved.canUndo, false);
});

test('Apply saves the draft checked at click time when the user switches packs during an async check', async () => {
  let releaseCheck;
  let checked;
  let saved;
  const adapter = host({
    check: async settings => {
      checked = structuredClone(settings);
      await new Promise(resolve => { releaseCheck = resolve; });
      return null;
    },
    save: async value => { saved = structuredClone(value); },
  });
  const studio = new StudioController(adapter, null);
  studio.selectPreset('soft-mist');
  studio.setOption('lines', false);
  const applying = studio.apply();
  assert.deepEqual(checked, {
    preset: 'soft-mist', lines: false, properties: true, diagram: true, wide: false, accent: 'violet',
  });

  studio.selectPreset('prism-focus');
  studio.setOption('properties', false);
  releaseCheck();
  assert.deepEqual(await applying, { ok: true, message: '已应用 柔雾夜读' });
  assert.deepEqual(saved.applied, checked);
  assert.deepEqual(studio.applied, checked);
  assert.deepEqual(adapter.calls.renders.at(-1), checked);
  assert.equal(studio.draft.preset, 'prism-focus');
  assert.equal(studio.draft.properties, false);
});
