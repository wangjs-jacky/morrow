import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, sanitizePersisted, StudioController } from '../src/state.ts';

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
