export type Accent = 'blue' | 'violet' | 'mint';

export interface StudioSettings {
  preset: 'deep-reading';
  lines: boolean;
  properties: boolean;
  diagram: boolean;
  wide: boolean;
  accent: Accent;
}

export interface PersistedState {
  version: 1;
  applied: StudioSettings | null;
  previous: StudioSettings | null;
  canUndo: boolean;
}

export interface StudioHost {
  check(settings: StudioSettings): Promise<string | null> | string | null;
  save(state: PersistedState): Promise<void>;
  render(settings: StudioSettings | null): void;
}

export const DEFAULT_SETTINGS: StudioSettings = Object.freeze({
  preset: 'deep-reading',
  lines: true,
  properties: true,
  diagram: true,
  wide: false,
  accent: 'blue',
});

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSettings(value: unknown): StudioSettings | null {
  if (!record(value) || value.preset !== 'deep-reading') return null;
  const accents: Accent[] = ['blue', 'violet', 'mint'];
  return {
    preset: 'deep-reading',
    lines: typeof value.lines === 'boolean' ? value.lines : DEFAULT_SETTINGS.lines,
    properties: typeof value.properties === 'boolean' ? value.properties : DEFAULT_SETTINGS.properties,
    diagram: typeof value.diagram === 'boolean' ? value.diagram : DEFAULT_SETTINGS.diagram,
    wide: typeof value.wide === 'boolean' ? value.wide : DEFAULT_SETTINGS.wide,
    accent: accents.includes(value.accent as Accent) ? value.accent as Accent : DEFAULT_SETTINGS.accent,
  };
}

export function sanitizePersisted(value: unknown): PersistedState {
  const empty: PersistedState = { version: 1, applied: null, previous: null, canUndo: false };
  if (!record(value) || value.version !== 1) return empty;
  const applied = value.applied === null ? null : normalizeSettings(value.applied);
  if (!applied) return empty;
  return {
    version: 1,
    applied,
    previous: value.previous === null ? null : normalizeSettings(value.previous),
    canUndo: value.canUndo === true,
  };
}

export class StudioController {
  private readonly host: StudioHost;
  private data: PersistedState;
  private currentDraft: StudioSettings;

  constructor(host: StudioHost, persisted: unknown) {
    this.host = host;
    this.data = sanitizePersisted(persisted);
    this.currentDraft = { ...(this.data.applied ?? DEFAULT_SETTINGS) };
  }

  get draft(): StudioSettings { return { ...this.currentDraft }; }
  get applied(): StudioSettings | null { return this.data.applied ? { ...this.data.applied } : null; }
  get canUndo(): boolean { return this.data.canUndo; }

  setOption<K extends Exclude<keyof StudioSettings, 'preset'>>(key: K, value: StudioSettings[K]): void {
    const next = normalizeSettings({ ...this.currentDraft, [key]: value });
    if (next) this.currentDraft = next;
  }

  resetDraft(): void {
    this.currentDraft = { ...DEFAULT_SETTINGS };
  }

  restore(): void {
    this.host.render(this.applied);
  }

  async apply(): Promise<{ ok: boolean; message: string }> {
    try {
      const problem = await this.host.check(this.currentDraft);
      if (problem) return { ok: false, message: problem };
      const next: PersistedState = {
        version: 1,
        applied: { ...this.currentDraft },
        previous: this.applied,
        canUndo: true,
      };
      await this.host.save(next);
      this.host.render(next.applied);
      this.data = next;
      return { ok: true, message: '已应用深色阅读' };
    } catch (error) {
      return { ok: false, message: `保存失败：${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async undo(): Promise<{ ok: boolean; message: string }> {
    if (!this.data.canUndo) return { ok: false, message: '没有可撤销的应用' };
    try {
      if (this.data.previous) {
        const problem = await this.host.check(this.data.previous);
        if (problem) return { ok: false, message: problem };
      }
      const next: PersistedState = {
        version: 1,
        applied: this.data.previous ? { ...this.data.previous } : null,
        previous: null,
        canUndo: false,
      };
      await this.host.save(next);
      this.host.render(next.applied);
      this.data = next;
      this.currentDraft = { ...(next.applied ?? DEFAULT_SETTINGS) };
      return { ok: true, message: next.applied ? '已恢复上一个效果' : '已恢复应用前的外观' };
    } catch (error) {
      return { ok: false, message: `恢复失败：${error instanceof Error ? error.message : String(error)}` };
    }
  }
}
