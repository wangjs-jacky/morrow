import { StudioController, type PersistedState, type StudioSettings } from './state.ts';
import { mountStudio } from './studio-ui.ts';

const STORAGE_KEY = 'reading-studio-demo-v1';
const query = new URLSearchParams(window.location.search);
const root = document.getElementById('app');
if (!root) throw new Error('Missing demo root');

let saved: unknown = null;
try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); } catch { saved = null; }

const host = {
  check(settings: StudioSettings): string | null {
    if (query.get('theme') === 'off') return '请先启用 Reading Studio 主题';
    if (query.get('mode') === 'light') return '请在 Obsidian 外观设置中选择深色模式';
    if (settings.lines && query.get('lines') === 'off') return '请先在 Obsidian 编辑器设置中开启显示行号';
    if (settings.properties && query.get('properties') === 'off') return '请先将文档中的属性设为可见';
    return null;
  },
  async save(state: PersistedState): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  render(settings: StudioSettings | null): void {
    document.body.dataset.applied = settings ? 'true' : 'false';
    document.body.dataset.preset = settings?.preset ?? '';
    document.body.dataset.accent = settings?.accent ?? '';
  },
};

const controller = new StudioController(host, saved);
controller.restore();
mountStudio(root, controller);
