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
    label: '静夜阅读',
    description: '克制的深灰页面，适合长时间阅读。',
    defaults: { preset: 'deep-reading', lines: true, properties: true, diagram: true, wide: false, accent: 'blue' },
  },
  {
    id: 'cupertino-night',
    label: '浮岛夜蓝',
    description: '悬浮侧栏与圆角标签，带来轻盈的蓝色夜景。',
    defaults: { preset: 'cupertino-night', lines: true, properties: true, diagram: true, wide: false, accent: 'blue' },
  },
  {
    id: 'minimal-graphite',
    label: '石墨极简',
    description: '灰黑中性色、直角线条与开阔正文。',
    defaults: { preset: 'minimal-graphite', lines: true, properties: true, diagram: true, wide: true, accent: 'blue' },
  },
  {
    id: 'soft-mist',
    label: '柔雾玻璃',
    description: '半透明雾面玻璃与柔和的紫色高光。',
    defaults: { preset: 'soft-mist', lines: true, properties: true, diagram: true, wide: false, accent: 'violet' },
  },
  {
    id: 'prism-focus',
    label: '青蓝聚焦',
    description: '冷青重点色与清晰的高对比结构。',
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
