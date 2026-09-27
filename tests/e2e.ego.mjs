import assert from 'node:assert/strict';

const baseUrl = process.env.READING_STUDIO_E2E_URL ?? 'http://127.0.0.1:4187/demo/';
const expectedSpaceId = Number(process.env.EGO_EXPECTED_SPACE_ID);
const expectedTargetId = process.env.EGO_EXPECTED_TARGET_ID;
const task = Number.isSafeInteger(expectedSpaceId) && expectedSpaceId > 0
  ? await taskSpace(expectedSpaceId)
  : await taskSpace('Reading Studio V2 browser E2E');
const page = task.page('p1');
const tab = (await task.tabs()).find(item => item.label === 'p1');
if (expectedTargetId) assert.equal(tab?.targetId, expectedTargetId);
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto(baseUrl);
assert.equal(await page.url(), baseUrl);

await page.evaluate(() => localStorage.removeItem('reading-studio-demo-v1'));
await page.reload();
assert.equal(await page.evaluate(() => document.querySelector('[data-testid="status"]')?.textContent), '尚未应用');

const presetIds = ['deep-reading', 'cupertino-night', 'minimal-graphite', 'soft-mist', 'prism-focus'];
assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('[data-action="preset"]')].map(button => button.dataset.preset)), presetIds);
const surfaces = [];
for (const preset of presetIds) {
  await page.click(`[data-action="preset"][data-preset="${preset}"]`, { label: `preview ${preset} preset` });
  const surface = await page.evaluate(() => {
    const preview = document.querySelector('[data-testid="preview"]');
    const style = getComputedStyle(preview);
    return {
      preset: preview?.getAttribute('data-preset'),
      sidebar: style.getPropertyValue('--rs-sidebar').trim(),
      note: style.getPropertyValue('--rs-note').trim(),
      properties: style.getPropertyValue('--rs-properties').trim(),
      diagram: style.getPropertyValue('--rs-diagram').trim(),
      uiAccent: getComputedStyle(document.querySelector('.reading-studio')).getPropertyValue('--rs-ui-accent').trim(),
      selectedBorder: getComputedStyle(document.querySelector('.rs-preset.rs-selected')).borderTopColor,
      diagramVisible: document.querySelector('.rs-diagram').getBoundingClientRect().bottom <= document.querySelector('.rs-scroll').getBoundingClientRect().bottom,
      controlsVisible: document.querySelector('.rs-controls').getBoundingClientRect().bottom <= innerHeight,
      selectedCount: document.querySelectorAll('[data-action="preset"][aria-pressed="true"]').length,
      applied: document.body.dataset.applied,
    };
  });
  assert.equal(surface.preset, preset);
  assert.equal(surface.selectedCount, 1);
  assert.equal(surface.applied, 'false');
  assert.equal(surface.diagramVisible, true, `${preset} Mermaid must fit in the preview`);
  assert.equal(surface.controlsVisible, true, `${preset} choices must remain visible`);
  assert.notEqual(surface.uiAccent, '');
  surfaces.push(surface);
}
for (const property of ['sidebar', 'note', 'properties', 'diagram']) {
  assert.equal(new Set(surfaces.map(surface => surface[property])).size, 5, `${property} surface should differ by preset`);
}
assert.equal(new Set(surfaces.map(surface => surface.uiAccent)).size, 5, 'studio controls should inherit each preset accent');
assert.equal(new Set(surfaces.map(surface => surface.selectedBorder)).size, 5, 'selected preset border should follow the active accent');

await page.click('[data-action="preset"][data-preset="soft-mist"]');
await page.click('[data-action="customize"]');
await page.click('[data-action="toggle"][data-option="lines"]');
await page.click('[data-action="toggle"][data-option="properties"]');
await page.click('[data-action="toggle"][data-option="wide"]');
await page.click('[data-action="accent"][data-value="mint"]');
const draft = await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { preset: preview?.getAttribute('data-preset'), lines: preview?.getAttribute('data-lines'), properties: preview?.getAttribute('data-properties'), wide: preview?.getAttribute('data-wide'), accent: preview?.getAttribute('data-accent'), applied: document.body.dataset.applied };
});
assert.deepEqual(draft, { preset: 'soft-mist', lines: 'false', properties: 'false', wide: 'true', accent: 'mint', applied: 'false' });

await page.click('[data-action="apply"]', { label: 'apply customized soft mist' });
await page.waitForFunction(() => document.body.dataset.preset === 'soft-mist');
await page.reload();
await page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.textContent === '已应用');
const saved = await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { preset: preview?.getAttribute('data-preset'), lines: preview?.getAttribute('data-lines'), properties: preview?.getAttribute('data-properties'), wide: preview?.getAttribute('data-wide'), accent: preview?.getAttribute('data-accent'), applied: document.body.dataset.preset };
});
assert.deepEqual(saved, { preset: 'soft-mist', lines: 'false', properties: 'false', wide: 'true', accent: 'mint', applied: 'soft-mist' });

await page.click('[data-action="preset"][data-preset="prism-focus"]');
assert.equal(await page.evaluate(() => document.body.dataset.preset), 'soft-mist');
await page.click('[data-action="apply"]', { label: 'apply prism focus preset' });
await page.waitForFunction(() => document.body.dataset.preset === 'prism-focus');
await page.click('[data-action="undo"]', { label: 'undo prism focus preset' });
await page.waitForFunction(() => document.body.dataset.preset === 'soft-mist');
assert.deepEqual(await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { preset: preview?.getAttribute('data-preset'), lines: preview?.getAttribute('data-lines'), properties: preview?.getAttribute('data-properties'), accent: preview?.getAttribute('data-accent') };
}), { preset: 'soft-mist', lines: 'false', properties: 'false', accent: 'mint' });

await page.click('[data-action="preset"][data-preset="prism-focus"]');
await page.click('[data-action="customize"]');
await page.click('[data-action="toggle"][data-option="lines"]');
await page.click('[data-action="reset"]');
assert.deepEqual(await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { preset: preview?.getAttribute('data-preset'), lines: preview?.getAttribute('data-lines'), accent: preview?.getAttribute('data-accent') };
}), { preset: 'prism-focus', lines: 'true', accent: 'mint' });

for (const [query, expected] of [['theme=off', '请先启用 Reading Studio 主题'], ['mode=light', '深色模式'], ['lines=off', '显示行号'], ['properties=off', '属性']]) {
  await page.goto(`${baseUrl}?${query}`);
  await page.click('[data-action="preset"][data-preset="cupertino-night"]');
  await page.click('[data-action="apply"]');
  await page.waitForFunction(value => document.querySelector('[role="status"]')?.textContent?.includes(value), expected);
  assert.equal(await page.evaluate(() => document.body.dataset.preset), 'soft-mist');
}

await page.goto(baseUrl);
await page.click('[data-action="preset"][data-preset="cupertino-night"]');
await page.click('[data-action="apply"]', { label: 'apply cupertino night preset' });
await page.waitForFunction(() => document.body.dataset.preset === 'cupertino-night');
console.log(JSON.stringify({ result: 'PASS', spaceId: task.spaceId, targetId: page.targetId, url: await page.url(), checks: ['five-preview-surfaces', 'draft', 'apply', 'reload', 'cross-pack-undo', 'reset', 'prerequisites', 'cupertino-apply'] }));
