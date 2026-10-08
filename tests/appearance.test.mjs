import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { DEFAULT_SETTINGS } from '../src/state.ts';
import { applyAppearance, checkEditorSettings, readPrerequisiteError } from '../src/appearance.ts';

const themeCss = readFileSync(new URL('../theme/theme.css', import.meta.url), 'utf8');

test('appearance classes are namespaced and restore removes only owned classes', () => {
  const dom = new JSDOM('<body class="theme-dark third-party morrow-custom"></body>');
  const body = dom.window.document.body;
  applyAppearance(body, { ...DEFAULT_SETTINGS, lines: false, properties: false, wide: true, accent: 'mint' });
  assert.equal(body.classList.contains('morrow-active'), true);
  assert.equal(body.classList.contains('morrow-no-lines'), true);
  assert.equal(body.classList.contains('morrow-hide-properties'), true);
  assert.equal(body.classList.contains('morrow-wide'), true);
  assert.equal(body.classList.contains('morrow-accent-mint'), true);
  assert.equal(body.classList.contains('morrow-preset-deep-reading'), true);
  applyAppearance(body, null);
  assert.equal([...body.classList].some(name => name.startsWith('morrow-preset-')), false);
  assert.equal(body.classList.contains('morrow-active'), false);
  assert.equal(body.classList.contains('morrow-no-lines'), false);
  assert.equal(body.classList.contains('morrow-hide-properties'), false);
  assert.equal(body.classList.contains('morrow-wide'), false);
  assert.equal(body.classList.contains('morrow-accent-mint'), false);
  assert.equal(body.classList.contains('morrow-custom'), true);
  assert.equal(body.classList.contains('third-party'), true);
});

test('switching between all presets replaces only the applied preset class', () => {
  const ids = ['deep-reading', 'cupertino-night', 'minimal-graphite', 'soft-mist', 'prism-focus'];
  const dom = new JSDOM('<body class="theme-dark third-party morrow-custom"></body>');
  const body = dom.window.document.body;
  for (const preset of ids) {
    applyAppearance(body, { ...DEFAULT_SETTINGS, preset, diagram: true, accent: 'violet' });
    assert.deepEqual([...body.classList].filter(name => name.startsWith('morrow-preset-')), [`morrow-preset-${preset}`]);
    assert.equal(body.classList.contains('morrow-mermaid'), true);
    assert.equal(body.classList.contains('morrow-accent-violet'), true);
    assert.equal(body.classList.contains('theme-dark'), true);
    assert.equal(body.classList.contains('third-party'), true);
    assert.equal(body.classList.contains('morrow-custom'), true);
  }
  applyAppearance(body, { ...DEFAULT_SETTINGS, preset: 'deep-reading', diagram: false, accent: 'blue' });
  assert.equal(body.classList.contains('morrow-mermaid'), false);
  assert.equal(body.classList.contains('morrow-accent-violet'), false);
  assert.equal(body.classList.contains('morrow-preset-prism-focus'), false);
});

test('five native packs have distinct surfaces and the registry default accents', () => {
  const dom = new JSDOM(`<style>${themeCss}</style><body class="theme-dark"></body>`);
  const body = dom.window.document.body;
  const expected = [
    ['deep-reading', 'blue', '#1d222a', '#191e25', '#222a34', '#73aef0'],
    ['cupertino-night', 'blue', '#1c2230', '#202638', '#273248', '#82b7f7'],
    ['minimal-graphite', 'blue', '#202020', '#222222', '#292929', '#9ab5d3'],
    ['soft-mist', 'violet', '#1a293b', '#233349', '#2a3c52', '#c2a8eb'],
    ['prism-focus', 'mint', '#18263b', '#142033', '#21334a', '#79bfca'],
  ];
  for (const [preset, accent, note, sidebar, metadata, highlight] of expected) {
    applyAppearance(body, { ...DEFAULT_SETTINGS, preset, accent });
    const style = dom.window.getComputedStyle(body);
    assert.equal(style.getPropertyValue('--rs-note').trim(), note, `${preset} note`);
    assert.equal(style.getPropertyValue('--rs-sidebar').trim(), sidebar, `${preset} sidebar`);
    assert.equal(style.getPropertyValue('--rs-metadata').trim(), metadata, `${preset} properties`);
    assert.equal(style.getPropertyValue('--rs-accent').trim(), highlight, `${preset} accent`);
    assert.notEqual(style.getPropertyValue('--rs-mermaid-node').trim(), '', `${preset} Mermaid`);
  }
  applyAppearance(body, { ...DEFAULT_SETTINGS, preset: 'soft-mist', accent: 'blue' });
  assert.equal(dom.window.getComputedStyle(body).getPropertyValue('--rs-accent').trim(), '#73aef0');
  applyAppearance(body, { ...DEFAULT_SETTINGS, preset: 'prism-focus', accent: 'violet' });
  assert.equal(dom.window.getComputedStyle(body).getPropertyValue('--rs-accent').trim(), '#a797f4');
  applyAppearance(body, { ...DEFAULT_SETTINGS, preset: 'deep-reading', accent: 'violet' });
  const deepReading = dom.window.getComputedStyle(body);
  assert.equal(deepReading.getPropertyValue('--color-base-05').trim(), '#1c2027');
  assert.equal(deepReading.getPropertyValue('--rs-mermaid-stroke').trim(), '#b5a9fa');
  applyAppearance(body, { ...DEFAULT_SETTINGS, preset: 'deep-reading', accent: 'mint' });
  assert.equal(dom.window.getComputedStyle(body).getPropertyValue('--rs-mermaid-stroke').trim(), '#8bd1b9');
});

test('native visibility toggles beat theme visibility rules and clear on restore', () => {
  const dom = new JSDOM(`<style>.metadata-container,.cm-lineNumbers { display: block !important; }</style><style>${themeCss}</style><body class="theme-dark"><div class="metadata-container"></div><div class="markdown-source-view mod-cm6"><div class="cm-lineNumbers"></div></div></body>`);
  const body = dom.window.document.body;
  const metadata = body.querySelector('.metadata-container');
  const lines = body.querySelector('.cm-lineNumbers');
  applyAppearance(body, { ...DEFAULT_SETTINGS, properties: false, lines: false });
  assert.equal(dom.window.getComputedStyle(metadata).display, 'none');
  assert.equal(dom.window.getComputedStyle(lines).display, 'none');
  applyAppearance(body, null);
  assert.equal(dom.window.getComputedStyle(metadata).display, 'block');
  assert.equal(dom.window.getComputedStyle(lines).display, 'block');
});

test('theme sentinel is required in both light and dark mode', () => {
  const dom = new JSDOM('<body class="theme-dark"></body>');
  const body = dom.window.document.body;
  const style = value => ({ getPropertyValue: () => value });
  assert.match(readPrerequisiteError(body, style('')), /启用 Morrow 主题/);
  body.classList.replace('theme-dark', 'theme-light');
  assert.equal(readPrerequisiteError(body, style('ready')), null);
  body.classList.replace('theme-light', 'theme-dark');
  assert.equal(readPrerequisiteError(body, style('ready')), null);
});

test('editor prerequisites depend on requested visual options', () => {
  assert.match(checkEditorSettings(DEFAULT_SETTINGS, { showLineNumber: false, propertiesInDocument: 'visible' }), /行号/);
  assert.match(checkEditorSettings(DEFAULT_SETTINGS, { showLineNumber: true, propertiesInDocument: 'hidden' }), /属性/);
  assert.equal(checkEditorSettings({ ...DEFAULT_SETTINGS, lines: false, properties: false }, {}), null);
  assert.match(checkEditorSettings(DEFAULT_SETTINGS, null), /无法确认/);
  assert.equal(checkEditorSettings(DEFAULT_SETTINGS, { showLineNumber: true, propertiesInDocument: 'visible' }), null);
});

test('all light packs retain readable surfaces, diagram colors and reversible visibility', () => {
  const dom = new JSDOM(`<style>${themeCss}</style><body class="theme-light"><div class="metadata-container"></div><div class="markdown-source-view mod-cm6"><div class="cm-lineNumbers"></div></div></body>`);
  const body = dom.window.document.body;
  const luminance = hex => {
    const values = hex.match(/[0-9a-f]{2}/gi).map(pair => {
      const n = parseInt(pair, 16) / 255;
      return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  for (const preset of ['deep-reading', 'cupertino-night', 'minimal-graphite', 'soft-mist', 'prism-focus']) {
    for (const accent of ['blue', 'violet', 'mint']) {
      applyAppearance(body, { ...DEFAULT_SETTINGS, preset, accent, properties: false, lines: false });
      const style = dom.window.getComputedStyle(body);
      const token = name => style.getPropertyValue(`--rs-${name}`).trim();
      for (const [foreground, background] of [['text', 'note'], ['muted', 'note'], ['link', 'note'], ['nav-file-text', 'nav-file-active'], ['mermaid-text', 'mermaid-node'], ['mermaid-note-text', 'mermaid-note']]) {
        const contrast = (luminance(token(background)) + .05) / (luminance(token(foreground)) + .05);
        assert.ok(contrast >= 4.5, `${preset}/${accent}: ${foreground} on ${background}: ${contrast}`);
      }
      assert.equal(dom.window.getComputedStyle(body.querySelector('.metadata-container')).display, 'none');
      assert.equal(dom.window.getComputedStyle(body.querySelector('.cm-lineNumbers')).display, 'none');
      assert.equal(body.classList.contains('theme-light'), true);
      body.classList.replace('theme-light', 'theme-dark');
      assert.notEqual(dom.window.getComputedStyle(body).getPropertyValue('--rs-note'), style.getPropertyValue('--rs-note'));
      body.classList.replace('theme-dark', 'theme-light');
    }
  }
  applyAppearance(body, null);
  assert.notEqual(dom.window.getComputedStyle(body.querySelector('.metadata-container')).display, 'none');
  assert.equal(body.className, 'theme-light');
});
