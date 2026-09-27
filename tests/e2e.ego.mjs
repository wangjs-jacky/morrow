import assert from 'node:assert/strict';

const baseUrl = process.env.READING_STUDIO_E2E_URL ?? 'http://127.0.0.1:4187/demo/';
const expectedSpaceId = Number(process.env.EGO_EXPECTED_SPACE_ID);
const expectedTargetId = process.env.EGO_EXPECTED_TARGET_ID;
const task = Number.isSafeInteger(expectedSpaceId) && expectedSpaceId > 0
  ? await taskSpace(expectedSpaceId)
  : await taskSpace('Reading Studio browser E2E');
const page = task.page('p1');
await page.goto(baseUrl);
if (expectedTargetId) assert.equal(page.targetId, expectedTargetId);
assert.equal(await page.url(), baseUrl);

await page.evaluate(() => localStorage.removeItem('reading-studio-demo-v1'));
await page.reload();
assert.equal(await page.evaluate(() => document.querySelector('[data-testid="status"]')?.textContent), '尚未应用');
await page.click('[data-action="customize"]');
await page.click('[data-action="toggle"][data-option="lines"]');
await page.click('[data-action="toggle"][data-option="properties"]');
await page.click('[data-action="toggle"][data-option="wide"]');
await page.click('[data-action="accent"][data-value="mint"]');
const draft = await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { lines: preview?.getAttribute('data-lines'), properties: preview?.getAttribute('data-properties'), wide: preview?.getAttribute('data-wide'), accent: preview?.getAttribute('data-accent'), applied: document.body.dataset.applied };
});
assert.deepEqual(draft, { lines: 'false', properties: 'false', wide: 'true', accent: 'mint', applied: 'false' });

await page.click('[data-action="apply"]');
await page.waitForFunction(() => document.body.dataset.applied === 'true');
await page.reload();
await page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.textContent === '已应用');
const saved = await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="preview"]');
  return { lines: preview?.getAttribute('data-lines'), properties: preview?.getAttribute('data-properties'), wide: preview?.getAttribute('data-wide'), accent: preview?.getAttribute('data-accent') };
});
assert.deepEqual(saved, { lines: 'false', properties: 'false', wide: 'true', accent: 'mint' });

await page.click('[data-action="undo"]');
await page.waitForFunction(() => document.body.dataset.applied === 'false');
assert.equal(await page.evaluate(() => document.querySelector('[data-testid="status"]')?.textContent), '尚未应用');

await page.goto(`${baseUrl}?theme=off`);
await page.click('[data-action="apply"]');
await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes('请先启用 Reading Studio 主题'));
assert.equal(await page.evaluate(() => document.body.dataset.applied), 'false');

await page.goto(baseUrl);
await page.click('[data-action="apply"]');
await page.waitForFunction(() => document.body.dataset.applied === 'true');
assert.equal(await page.evaluate(() => document.querySelector('[data-testid="status"]')?.textContent), '已应用');
console.log(JSON.stringify({ result: 'PASS', spaceId: task.spaceId, targetId: page.targetId, url: await page.url(), checks: ['draft', 'apply', 'reload', 'undo', 'prerequisite', 'reapply'] }));
