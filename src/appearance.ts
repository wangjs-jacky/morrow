import type { StudioSettings } from './state.ts';

const OWNED_CLASSES = [
  'reading-studio-active',
  'reading-studio-no-lines',
  'reading-studio-hide-properties',
  'reading-studio-mermaid',
  'reading-studio-wide',
  'reading-studio-accent-blue',
  'reading-studio-accent-violet',
  'reading-studio-accent-mint',
  'reading-studio-preset-deep-reading',
  'reading-studio-preset-cupertino-night',
  'reading-studio-preset-minimal-graphite',
  'reading-studio-preset-soft-mist',
  'reading-studio-preset-prism-focus',
];

export function applyAppearance(body: HTMLElement, settings: StudioSettings | null): void {
  body.classList.remove(...OWNED_CLASSES);
  if (!settings) return;
  body.classList.add('reading-studio-active', `reading-studio-preset-${settings.preset}`, `reading-studio-accent-${settings.accent}`);
  if (!settings.lines) body.classList.add('reading-studio-no-lines');
  if (!settings.properties) body.classList.add('reading-studio-hide-properties');
  if (settings.diagram) body.classList.add('reading-studio-mermaid');
  if (settings.wide) body.classList.add('reading-studio-wide');
}

export function readPrerequisiteError(
  body: HTMLElement,
  style: Pick<CSSStyleDeclaration, 'getPropertyValue'>,
): string | null {
  if (style.getPropertyValue('--reading-studio-theme-active').trim() !== 'ready') {
    return '请先在 Obsidian「外观 → 主题」中启用 Reading Studio 主题';
  }
  if (!body.classList.contains('theme-dark')) {
    return '请在 Obsidian「外观 → 基础配色」中选择深色模式';
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
