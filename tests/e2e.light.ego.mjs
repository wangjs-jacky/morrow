import assert from 'node:assert/strict';

const task = await taskSpace(Number(process.env.EGO_EXPECTED_SPACE_ID));
const page = task.page('p1');
assert.equal((await task.tabs()).find(tab => tab.label === 'p1')?.targetId, process.env.EGO_EXPECTED_TARGET_ID);
const baseUrl = process.env.MORROW_E2E_URL;
await page.goto(`${baseUrl}?mode=light`);
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
const presets = ['deep-reading', 'cupertino-night', 'minimal-graphite', 'soft-mist', 'prism-focus'];
for (const preset of presets) {
  await page.click(`[data-action="preset"][data-preset="${preset}"]`);
  for (const accent of ['blue', 'violet', 'mint']) {
    await page.click(`[data-action="accent"][data-value="${accent}"]`);
    const colors = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('.rs-preview'));
      const channel = name => style.getPropertyValue(name).trim();
      return { note: channel('--rs-note'), accent: channel('--rs-preview-accent'), diagramFits: document.querySelector('.rs-diagram').getBoundingClientRect().bottom <= document.querySelector('.rs-scroll').getBoundingClientRect().bottom };
    });
    assert.match(colors.note, /^#f/);
    assert.ok(['#245fa8', '#7042aa', '#176958'].includes(colors.accent));
    assert.equal(colors.diagramFits, true);
  }
}
await page.click('[data-action="preset"][data-preset="soft-mist"]');
await page.click('[data-action="apply"]');
await page.waitForFunction(() => document.body.dataset.preset === 'soft-mist');
await page.click('[data-action="preset"][data-preset="prism-focus"]');
await page.click('[data-action="apply"]');
await page.click('[data-action="undo"]');
assert.equal(await page.evaluate(() => document.body.dataset.preset), 'soft-mist');
await page.click('[data-action="mode"][data-mode="dark"]');
assert.equal(await page.evaluate(() => document.body.classList.contains('theme-dark')), true);
assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.rs-preview')).getPropertyValue('--rs-note').trim()), '#1a293b');
await page.click('[data-action="mode"][data-mode="light"]');
await page.reload();
assert.equal(await page.evaluate(() => document.body.classList.contains('theme-light')), true);
assert.equal(await page.evaluate(() => document.body.dataset.preset), 'soft-mist');
await page.click('[data-action="mode"][data-mode="system"]');
await page.cdp('Emulation.setEmulatedMedia', { features: [{name:'prefers-color-scheme', value:'dark'}] });
await page.waitForFunction(() => document.body.classList.contains('theme-dark'));
await page.cdp('Emulation.setEmulatedMedia', { features: [{name:'prefers-color-scheme', value:'light'}] });
await page.waitForFunction(() => document.body.classList.contains('theme-light'));
await page.click('[data-action="mode"][data-mode="light"]');
await page.cdp('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: false});
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
await page.cdp('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false});
console.log({ result: 'PASS', checks: ['15 light preset/accent combinations', 'apply and undo', 'mode toggle', 'reload persistence', 'live system mode', '390px overflow'] });
const { captureVerifiedBrowserStep } = await import('file:///Users/jacky/Deployments/paws-cli/releases/native-stream-1e766691-20261008/packages/happy-cli/scripts/capture-browser-step.mjs');
cliLog(await captureVerifiedBrowserStep({ cdp, pageInfo, currentTab, listTaskSpaces, useOrCreateTaskSpace }, baseUrl, {sessionId:process.env.HAPPY_CAPTURE_SESSION_ID,runId:process.env.HAPPY_CAPTURE_RUN_ID,skillName:'ego-browser',taskSpaceId:task.spaceId,targetId:process.env.EGO_EXPECTED_TARGET_ID}));
