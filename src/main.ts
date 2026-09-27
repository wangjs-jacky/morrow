import { ItemView, Plugin, WorkspaceLeaf, normalizePath } from 'obsidian';
import { applyAppearance, checkEditorSettings, readPrerequisiteError } from './appearance.ts';
import { StudioController, type StudioSettings } from './state.ts';
import { mountStudio } from './studio-ui.ts';

const VIEW_TYPE = 'reading-studio-view';

class ReadingStudioView extends ItemView {
  private cleanup: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly controller: StudioController) {
    super(leaf);
  }

  getViewType(): string { return VIEW_TYPE; }
  getDisplayText(): string { return 'Reading Studio'; }
  getIcon(): string { return 'palette'; }

  async onOpen(): Promise<void> {
    this.cleanup = mountStudio(this.contentEl, this.controller);
  }

  async onClose(): Promise<void> {
    this.cleanup?.();
    this.cleanup = null;
  }
}

export default class ReadingStudioPlugin extends Plugin {
  private controller!: StudioController;

  async onload(): Promise<void> {
    this.controller = new StudioController({
      check: settings => this.checkPrerequisites(settings),
      save: state => this.saveData(state),
      render: settings => applyAppearance(document.body, settings),
    }, await this.loadData());

    this.registerView(VIEW_TYPE, leaf => new ReadingStudioView(leaf, this.controller));
    this.addRibbonIcon('palette', '打开 Reading Studio', () => { void this.openStudio(); });
    this.addCommand({ id: 'open-studio', name: '打开外观预览', callback: () => { void this.openStudio(); } });
    this.app.workspace.onLayoutReady(() => this.controller.restore());
  }

  onunload(): void {
    applyAppearance(document.body, null);
  }

  private async checkPrerequisites(settings: StudioSettings): Promise<string | null> {
    const visualProblem = readPrerequisiteError(document.body, getComputedStyle(document.body));
    if (visualProblem) return visualProblem;
    if (!settings.lines && !settings.properties) return null;
    try {
      const path = normalizePath(`${this.app.vault.configDir}/app.json`);
      const raw = await this.app.vault.adapter.read(path);
      return checkEditorSettings(settings, JSON.parse(raw));
    } catch {
      return checkEditorSettings(settings, null);
    }
  }

  private async openStudio(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('tab');
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
}
