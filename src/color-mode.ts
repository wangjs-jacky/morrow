export type ColorMode = 'light' | 'dark' | 'system';
export interface ColorModeActions {
  get(): ColorMode;
  set(mode: ColorMode): void | Promise<void>;
  subscribe(listener: () => void): () => void;
}

// Obsidian's own appearance settings use these internal APIs. Keep the bridge
// isolated and capability-checked; never rewrite appearance.json behind the app.
interface NativeThemeHost {
  changeTheme?(theme: string): void;
  vault: {
    getConfig?(key: string): unknown;
    on(name: string, listener: (key: string) => void): unknown;
    off(name: string, listener: (key: string) => void): void;
  };
}
export function nativeColorMode(app: unknown): ColorModeActions {
  const host = app as NativeThemeHost;
  return {
    get: () => {
      const theme = host.vault.getConfig?.('theme');
      return theme === 'moonstone' ? 'light' : theme === 'obsidian' ? 'dark' : 'system';
    },
    set: mode => {
      if (!host.changeTheme || !host.vault.getConfig) {
        throw new Error('此 Obsidian 版本不支持面板切换，请在「设置 → 外观 → 基础配色」中切换。');
      }
      host.changeTheme({ light: 'moonstone', dark: 'obsidian', system: 'system' }[mode]);
    },
    subscribe: listener => {
      const onConfig = (key: string) => { if (key === 'theme') listener(); };
      host.vault.on('config-changed', onConfig);
      return () => host.vault.off('config-changed', onConfig);
    },
  };
}
