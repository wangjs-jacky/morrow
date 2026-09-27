import type { StudioSettings } from './state.ts';

type PackDefaults = {
  preset: string;
  lines: boolean;
  properties: boolean;
  diagram: boolean;
  wide: boolean;
  accent: 'blue' | 'violet' | 'mint';
};

export const PRESETS = [
  {
    id: 'deep-reading',
    label: '深色阅读',
    description: '沉稳的深色页面，适合长时间阅读。',
    defaults: { preset: 'deep-reading', lines: true, properties: true, diagram: true, wide: false, accent: 'blue' },
  },
  {
    id: 'cupertino-night',
    label: 'Cupertino 夜色',
    description: '圆角与柔和侧栏，保持清晰的阅读焦点。',
    defaults: { preset: 'cupertino-night', lines: true, properties: true, diagram: true, wide: false, accent: 'blue' },
  },
  {
    id: 'minimal-graphite',
    label: '极简石墨',
    description: '中性色和开阔的扁平布局。',
    defaults: { preset: 'minimal-graphite', lines: true, properties: true, diagram: true, wide: true, accent: 'blue' },
  },
  {
    id: 'soft-mist',
    label: '柔雾夜读',
    description: '柔和粉彩与收拢的正文宽度。',
    defaults: { preset: 'soft-mist', lines: true, properties: true, diagram: true, wide: false, accent: 'violet' },
  },
  {
    id: 'prism-focus',
    label: '棱镜聚焦',
    description: '鲜明的对比和醒目的重点。',
    defaults: { preset: 'prism-focus', lines: true, properties: true, diagram: true, wide: true, accent: 'mint' },
  },
] as const satisfies readonly { id: string; label: string; description: string; defaults: PackDefaults }[];

export type PresetId = (typeof PRESETS)[number]['id'];
export type Preset = (typeof PRESETS)[number];

export function getPreset(id: string): Preset | null {
  return PRESETS.find(preset => preset.id === id) ?? null;
}

export function presetDefaults(id: string): StudioSettings | null {
  const preset = getPreset(id);
  return preset ? { ...preset.defaults } : null;
}
