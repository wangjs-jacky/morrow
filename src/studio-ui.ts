import type { StudioController, StudioSettings } from './state.ts';
import { PRESETS, getPreset } from './presets.ts';
import type { UpdateActions, UpdateOffer } from './update.ts';

const optionLabels: Record<'lines' | 'properties' | 'diagram' | 'wide', string> = {
  lines: '显示行号',
  properties: '显示笔记属性',
  diagram: '优化 Mermaid',
  wide: '更宽的正文',
};

function switchMarkup(key: keyof typeof optionLabels, value: boolean): string {
  return `<div class="rs-setting"><span>${optionLabels[key]}</span><button type="button" class="rs-switch" role="switch" aria-label="${optionLabels[key]}" aria-checked="${value}" data-action="toggle" data-option="${key}"><span></span></button></div>`;
}

function previewMarkup(settings: StudioSettings): string {
  return `<div class="rs-preview" data-testid="preview" data-preset="${settings.preset}" data-lines="${settings.lines}" data-properties="${settings.properties}" data-diagram="${settings.diagram}" data-wide="${settings.wide}" data-accent="${settings.accent}">
    <div class="rs-chrome"><div class="rs-traffic"><i></i><i></i><i></i></div><span class="rs-tab">▤ &nbsp; 如何把复杂问题讲清楚 <span class="rs-tab-close">×</span></span><span class="rs-path">wiki / teach-me / 如何把复杂问题讲清楚</span></div>
    <div class="rs-preview-body"><div class="rs-rail"><span>▣</span><span>⌕</span><span>◇</span><span class="rs-rail-bottom">⚙</span></div>
      <aside class="rs-tree"><div class="rs-tree-head"><span>文件</span><span class="rs-tree-actions"><i>✎</i><i>＋</i><i>☷</i></span></div><div class="rs-folder">⌄ &nbsp; wiki <small>128</small></div><div class="rs-folder rs-indent">› &nbsp; ai <small>24</small></div><div class="rs-folder rs-indent">› &nbsp; design <small>18</small></div><div class="rs-folder rs-indent">⌄ &nbsp; teach-me <small>5</small></div><div class="rs-file rs-active">如何把复杂问题讲清楚</div><div class="rs-file">从问题到答案的路径</div><div class="rs-file">用一张图解释系统</div><div class="rs-tree-rule"></div><div class="rs-folder">› &nbsp; projects <small>36</small></div><div class="rs-folder">› &nbsp; notes <small>72</small></div></aside>
      <main class="rs-note"><div class="rs-note-bar"><span>如何把复杂问题讲清楚 <em>/ Live Preview 编辑视图</em></span><span>↻ &nbsp; ◫ &nbsp; ⋯</span></div><div class="rs-scroll"><article class="rs-article">
        <h2>如何把复杂问题讲清楚</h2><p class="rs-deck">一份关于表达、前置知识和理解路径的示例笔记</p>
        <div class="rs-properties"><strong>◇ &nbsp; 笔记属性</strong><div><span>article_id</span><b>NOTE-0084</b><span>tags</span><b><mark># teach-me</mark><mark># 表达方法</mark></b><span>type</span><b>topic</b><span>created_at</span><b>2026 / 09 / 28</b></div></div>
        <div class="rs-line" data-n="01"><h3>先给对方一座桥</h3></div><div class="rs-line" data-n="02"><p>解释一个新概念时，先找到对方已经理解的事物，再把新知识接上去。好的表达不依赖更多术语，而是让理解的路径更短。</p></div>
        <div class="rs-line" data-n="03"><div class="rs-diagram"><div class="rs-diagram-title"><strong>页面资源如何抵达浏览器</strong><span>Mermaid 预览</span></div>
          <svg viewBox="0 0 700 139" role="img" aria-label="浏览器请求 Caddy，Caddy 读取静态资源后返回内容"><g class="rs-flow-node"><rect x="18" y="5" width="160" height="36" rx="8"/><rect x="270" y="5" width="160" height="36" rx="8"/><rect x="522" y="5" width="160" height="36" rx="8"/></g><g class="rs-flow-text"><text x="98" y="29" text-anchor="middle">浏览器</text><text x="350" y="29" text-anchor="middle">Caddy</text><text x="602" y="29" text-anchor="middle">静态资源</text></g><g class="rs-flow-rail"><path d="M98 42v90M350 42v90M602 42v90"/></g><g class="rs-flow-arrow"><path d="M100 65h245"/><path d="M352 94h245"/><path d="M600 123H355" stroke-dasharray="5 5"/></g><g class="rs-flow-head"><path d="M345 65l-8-4v8z"/><path d="M597 94l-8-4v8z"/><path d="M355 123l8-4v8z"/></g><g class="rs-flow-label"><text x="225" y="57" text-anchor="middle">请求页面</text><text x="475" y="86" text-anchor="middle">读取文件</text><text x="475" y="116" text-anchor="middle">返回内容</text></g></svg>
        </div></div>
      </article></div></main></div>
    <div class="rs-preview-footer"><span>喜欢这张预览？</span><button type="button" class="rs-apply" data-action="apply">✓ &nbsp; 应用${getPreset(settings.preset)?.label ?? PRESETS[0].label}</button></div>
  </div>`;
}

export function mountStudio(container: HTMLElement, controller: StudioController, updateActions?: UpdateActions): () => void {
  container.classList.add('morrow');
  let expanded = true;
  let message = '';
  let busy = false;
  let updateOffer: UpdateOffer | null = null;
  let copyState: 'idle' | 'copied' | 'manual' = 'idle';
  let disposed = false;

  const render = () => {
    const settings = controller.draft;
    container.dataset.preset = settings.preset;
    container.dataset.accent = settings.accent;
    const applied = controller.applied;
    const dirty = applied !== null && JSON.stringify(applied) !== JSON.stringify(settings);
    container.innerHTML = `<div class="rs-shell"><header class="rs-heading"><div><span class="rs-eyebrow">ONE PREVIEW. YOUR STYLE.</span><h1>一张预览，选好你的主题。</h1><p>正文、侧栏、笔记属性和流程图，都在这张预览里。</p></div><span class="rs-step">选主题 → 调细节 → 应用</span></header>
      ${updateOffer ? `<div class="rs-update" aria-live="polite"><div><strong data-update-version></strong><p>${copyState === 'copied' ? '命令已复制。请粘贴到 Mac 终端执行，完成后重启 Obsidian。' : copyState === 'manual' ? '自动复制失败，请手动复制下面的命令，粘贴到 Mac 终端执行。' : '复制更新命令，粘贴到 Mac 终端执行，完成后重启 Obsidian。'}</p>${copyState === 'manual' ? '<textarea class="rs-update-command" aria-label="更新命令" readonly></textarea>' : ''}</div><button type="button" data-action="copy-update">复制更新命令</button></div>` : ''}
      <div class="rs-stage">${previewMarkup(settings)}
        <aside class="rs-customizer" ${expanded ? '' : 'hidden'}><div class="rs-custom-head"><div><h2>自定义这个主题</h2><p>调整后，预览会立即变化</p></div><button type="button" data-action="close" aria-label="关闭设置">×</button></div>
        ${switchMarkup('lines', settings.lines)}${switchMarkup('properties', settings.properties)}${switchMarkup('diagram', settings.diagram)}${switchMarkup('wide', settings.wide)}
        <div class="rs-setting rs-colors"><span>主题色</span><div><button type="button" data-action="accent" data-value="blue" aria-label="蓝色" aria-pressed="${settings.accent === 'blue'}" class="rs-blue"></button><button type="button" data-action="accent" data-value="violet" aria-label="紫色" aria-pressed="${settings.accent === 'violet'}" class="rs-violet"></button><button type="button" data-action="accent" data-value="mint" aria-label="薄荷绿" aria-pressed="${settings.accent === 'mint'}" class="rs-mint"></button></div></div>
        <div class="rs-custom-foot"><span>调整仅在点击应用后保存</span><button type="button" data-action="reset">恢复默认</button></div></aside></div>
      <footer class="rs-controls"><div class="rs-presets"><span>主题预设</span><div class="rs-preset-list" role="group" aria-label="主题预设">${PRESETS.map(preset => `<button type="button" class="rs-preset${settings.preset === preset.id ? ' rs-selected' : ''}" data-action="preset" data-preset="${preset.id}" aria-pressed="${settings.preset === preset.id}" title="${preset.description}">${preset.label}</button>`).join('')}</div></div><div class="rs-control-end"><span data-testid="status">${applied ? (dirty ? '有未应用的调整' : '已应用') : '尚未应用'}</span><button type="button" data-action="undo" ${controller.canUndo ? '' : 'disabled'}>撤销</button><button type="button" data-action="customize" aria-expanded="${expanded}">自定义细节</button></div></footer>
      <p class="rs-footnote">示例笔记仅用于预览，不包含你的仓库内容。行号和属性显示还需要 Obsidian 编辑器设置配合。</p><div class="rs-toast" role="status" aria-live="polite"></div></div>`;
    const status = container.querySelector('[role="status"]');
    if (status) status.textContent = message;
    const updateVersion = container.querySelector('[data-update-version]');
    if (updateVersion && updateOffer) updateVersion.textContent = `发现新版本 v${updateOffer.version}`;
    const updateCommand = container.querySelector<HTMLTextAreaElement>('.rs-update-command');
    if (updateCommand && updateOffer) updateCommand.value = updateOffer.command;
    const apply = container.querySelector<HTMLButtonElement>('[data-action="apply"]');
    if (apply) apply.disabled = busy;
  };

  const handleClick = async (event: Event) => {
    const target = event.target as Element;
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button || busy) return;
    const action = button.dataset.action;
    message = '';
    if (action === 'preset') controller.selectPreset(button.dataset.preset as StudioSettings['preset']);
    else if (action === 'customize') expanded = !expanded;
    else if (action === 'close') expanded = false;
    else if (action === 'reset') { controller.resetDraft(); message = '已恢复预设默认值，尚未应用'; }
    else if (action === 'copy-update' && updateActions && updateOffer) {
      try {
        await updateActions.copy(updateOffer.command);
        copyState = 'copied';
      } catch {
        copyState = 'manual';
      }
    } else if (action === 'toggle') {
      const key = button.dataset.option as 'lines' | 'properties' | 'diagram' | 'wide';
      controller.setOption(key, !controller.draft[key]);
    } else if (action === 'accent') {
      controller.setOption('accent', button.dataset.value as StudioSettings['accent']);
    } else if (action === 'apply' || action === 'undo') {
      busy = true;
      render();
      const result = action === 'apply' ? await controller.apply() : await controller.undo();
      message = result.message;
      busy = false;
    }
    if (disposed) return;
    render();
    if (action === 'copy-update' && copyState === 'manual') {
      const command = container.querySelector<HTMLTextAreaElement>('.rs-update-command');
      command?.focus();
      command?.select();
    }
  };

  container.addEventListener('click', handleClick);
  render();
  if (updateActions) {
    void Promise.resolve().then(() => updateActions.check()).then(offer => {
      if (disposed || !offer) return;
      updateOffer = offer;
      render();
    }).catch(() => {});
  }
  return () => {
    disposed = true;
    container.removeEventListener('click', handleClick);
    container.classList.remove('morrow');
    delete container.dataset.preset;
    delete container.dataset.accent;
    container.innerHTML = '';
  };
}
