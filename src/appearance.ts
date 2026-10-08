import type { StudioSettings } from './state.ts';

const OWNED_CLASSES = [
  'morrow-active',
  'morrow-no-lines',
  'morrow-hide-properties',
  'morrow-mermaid',
  'morrow-wide',
  'morrow-accent-blue',
  'morrow-accent-violet',
  'morrow-accent-mint',
  'morrow-preset-deep-reading',
  'morrow-preset-cupertino-night',
  'morrow-preset-minimal-graphite',
  'morrow-preset-soft-mist',
  'morrow-preset-prism-focus',
];

export function applyAppearance(body: HTMLElement, settings: StudioSettings | null): void {
  body.classList.remove(...OWNED_CLASSES);
  if (!settings) return;
  body.classList.add('morrow-active', `morrow-preset-${settings.preset}`, `morrow-accent-${settings.accent}`);
  if (!settings.lines) body.classList.add('morrow-no-lines');
  if (!settings.properties) body.classList.add('morrow-hide-properties');
  if (settings.diagram) body.classList.add('morrow-mermaid');
  if (settings.wide) body.classList.add('morrow-wide');
}

export function readPrerequisiteError(
  body: HTMLElement,
  style: Pick<CSSStyleDeclaration, 'getPropertyValue'>,
): string | null {
  if (style.getPropertyValue('--morrow-theme-active').trim() !== 'ready') {
    return '请先在 Obsidian「外观 → 主题」中启用 Morrow 主题';
  }
  return null;
}

export function checkEditorSettings(settings: StudioSettings, nativeConfig: unknown): string | null {
  if (!settings.lines && !settings.properties) return null;
  if (typeof nativeConfig !== 'object' || nativeConfig === null || Array.isArray(nativeConfig)) {
    return '无法确认 Obsidian 编辑器设置；请检查行号与文档中的属性';
  }
  const config = nativeConfig as Record<string, unknown>;
  if (settings.lines && config.showLineNumber !== true) {
    return '请先在 Obsidian「编辑器」设置中开启显示行号';
  }
  if (settings.properties && config.propertiesInDocument !== 'visible') {
    return '请先在 Obsidian「编辑器」设置中将文档中的属性设为可见';
  }
  return null;
}
