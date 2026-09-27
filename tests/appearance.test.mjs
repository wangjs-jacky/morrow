import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { DEFAULT_SETTINGS } from '../src/state.ts';
import { applyAppearance, checkEditorSettings, readPrerequisiteError } from '../src/appearance.ts';

test('appearance classes are namespaced and restore removes only owned classes', () => {
  const dom = new JSDOM('<body class="theme-dark third-party"></body>');
  const body = dom.window.document.body;
  applyAppearance(body, { ...DEFAULT_SETTINGS, lines: false, properties: false, wide: true, accent: 'mint' });
  assert.equal(body.classList.contains('reading-studio-active'), true);
  assert.equal(body.classList.contains('reading-studio-no-lines'), true);
  assert.equal(body.classList.contains('reading-studio-hide-properties'), true);
  assert.equal(body.classList.contains('reading-studio-wide'), true);
  assert.equal(body.classList.contains('reading-studio-accent-mint'), true);
  applyAppearance(body, null);
  assert.equal([...body.classList].some(name => name.startsWith('reading-studio-')), false);
  assert.equal(body.classList.contains('third-party'), true);
});

test('theme sentinel and dark mode must both be present', () => {
  const dom = new JSDOM('<body class="theme-dark"></body>');
  const body = dom.window.document.body;
  const style = value => ({ getPropertyValue: () => value });
  assert.match(readPrerequisiteError(body, style('')), /启用 Reading Studio 主题/);
  body.classList.replace('theme-dark', 'theme-light');
  assert.match(readPrerequisiteError(body, style('ready')), /深色模式/);
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
