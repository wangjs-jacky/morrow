# Reading Studio

一个面向 Obsidian 桌面版的深色阅读主题，附带可视化设置插件。在一张仿 Obsidian 的预览中查看侧栏、正文、笔记属性、行号与 Mermaid，选择风格并调整选项后点「应用」即可生效；「撤销」可恢复上一次配置。

Reading Studio 是独立主题，不会加载 Cupertino 的主题文件。「Cupertino 夜色」以 Cupertino 的浮动侧栏、分组工具按钮和胶囊式顶部标签为视觉参考，由本项目自己的 CSS 实现；五套风格共用这一桌面布局，各自保留配色与正文细节。

![原生 Obsidian 中的 Cupertino 夜色](design/packs/cupertino-night.png)

上图是 v0.2.1 的原生截图；当前开发版已重做顶部标签与侧栏结构，发布前会更新截图。

[对比五款原生预览](design/packs/)：[深色阅读](design/packs/deep-reading.png) · [Cupertino 夜色](design/packs/cupertino-night.png) · [极简石墨](design/packs/minimal-graphite.png) · [柔雾夜读](design/packs/soft-mist.png) · [棱镜聚焦](design/packs/prism-focus.png)。[查看真实笔记中的棱镜聚焦](design/preview-v2-prism.png)。

0.2.1 版继续打磨五款深色风格包：「深色阅读」「Cupertino 夜色」「极简石墨」「柔雾夜读」「棱镜聚焦」。侧栏、正文、属性区、Mermaid 和控制区各有辨识度；预览在常见桌面尺寸下能完整显示流程图，正文更易读，强调色更接近实际应用效果。行号、属性显隐、Mermaid、正文宽度及主题色仍可独立微调。浅色包尚未推出。预览使用虚构笔记，不读取或上传你的仓库内容。主题与插件均无运行时网络依赖。V1 保存的「深色阅读」配置可以继续使用。

当前开发版将「柔雾夜读」调整为雾面玻璃风格：侧栏、标签、属性和 Mermaid 卡片采用半透明层次与柔和高光，正文保留稳定深色背景以便阅读；「棱镜聚焦」的青色也更克制。预设 ID 和已保存设置保持兼容。上面的旧截图仍是 0.2.1 发布版效果。

## 安装

在 Mac 的「终端」粘贴这一条命令，**无需查找或输入仓库路径**：

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/obsidian-reading-studio/main/scripts/install.sh | bash
```

Obsidian 仓库（vault）只是本地笔记文件夹，**不需要 Git 或 GitHub**。安装器读取 Obsidian 在这台 Mac 上登记的仓库路径，确认其中存在 `.obsidian` 配置文件夹；如果只有一个有效仓库，或运行中的 Obsidian 仅标记了一个打开的仓库，就自动选中它。其他多仓库情况会显示名称供你选编号；找不到登记信息时才弹出文件夹选择窗口。

脚本会下载并校验 v0.2.1 主题包与插件包，备份原设置，再安装并启用主题、插件、深色模式、行号和属性显示。它只会停用旧的 `cupertino-reading`、`cupertino-mermaid` 两个样式片段；其他片段、设置及插件已保存的风格会保留。**安装后重启 Obsidian**；如果是首次使用第三方插件，Obsidian 仍可能要求你确认信任仓库。备份位置会在终端显示。

通过 SSH 的交互式终端运行同一条命令也会自动识别仓库。只有想指定其他仓库时，才需要把路径作为参数传入：

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/obsidian-reading-studio/main/scripts/install.sh | bash -s -- "/你的路径/Obsidian仓库"
```

也可以从 [Releases](https://github.com/wangjs-jacky/obsidian-reading-studio/releases) 手动下载同版本的两个 ZIP，解压后放进当前仓库的 `.obsidian` 目录：

```text
你的仓库/.obsidian/themes/Reading Studio/{manifest.json,theme.css}
你的仓库/.obsidian/plugins/reading-studio-controls/{manifest.json,main.js,styles.css}
```

手动安装时，在 Obsidian「设置 → 外观」中选择 **Reading Studio**，并把基础配色设为**深色**。在「设置 → 编辑器」中开启**显示行号**，把**文档中的属性**设为**可见**。最后在「设置 → 第三方插件」中启用 **Reading Studio Controls**。点击左侧调色盘图标，或从命令面板打开「Reading Studio Controls: 打开外观预览」。第一次启用第三方插件时，Obsidian 可能要求信任当前仓库。

打开设置界面后，先选择风格包，再点「自定义细节」试调。预览会即时变化，真实笔记只在点「应用」后切换。设置保存在插件数据中，重启后恢复；「撤销」恢复上一次应用前的完整风格和选项。「恢复默认」只重置**当前风格**尚未应用的草稿。

行号与属性的开关只控制**显示**，不会删除 YAML 或生成 Obsidian 没有启用的行号。如果官方编辑器设置不满足需要，插件会提示具体设置路径并阻止误报成功。插件不会修改 Markdown、YAML、其他主题文件或 Obsidian 的核心设置。若要直接编辑 YAML 源码，仍需使用 Obsidian 自己的源码视图或属性设置。

## 开发与验证

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run package:release
```

`npm run package:release` 在 `dist/` 生成两个可安装 ZIP。静态交互演示位于 `demo/`，运行 `npm run build:demo` 后用静态 HTTP 服务器打开；它与原生插件共用界面和预设控制器。浏览器交互脚本 `tests/e2e.ego.mjs` 用 Ego Browser 验证五套预览、Mermaid 完整显示、草稿、应用、刷新持久化、跨预设撤销及缺少前置条件时的提示。真实 Obsidian 的手动验收使用 `node scripts/install-test-vault.mjs` 生成**隔离测试仓库**，检查主题、插件、属性、行号及 Mermaid 的显示。

要重跑交互测试，在项目根目录用一个终端运行 `python3 -m http.server 4187`，另一个终端运行 `ego-browser nodejs < tests/e2e.ego.mjs`。静态演示地址为 `http://127.0.0.1:4187/demo/`；浏览器测试验证的是与插件共用的交互代码，真实 Obsidian 渲染仍需使用隔离仓库验收。

原始 [HTML 交互稿](design/prototype.html)、[V1 产品设计](docs/superpowers/specs/2026-09-28-obsidian-reading-studio-design.md)、[V2 风格包设计](docs/superpowers/specs/2026-09-28-theme-packs-v2-design.md) 和 [风格来源与扩展说明](docs/theme-inspiration.md) 已随仓库保存。`design/packs/` 内的五张图来自隔离 Obsidian 仓库，`design/preview-v2.png` 与 `design/preview.png` 留作旧版对照。

当前支持桌面版 Obsidian 1.8.0 及以上；已在 macOS 的 Obsidian 1.13.7 验证 0.2.1 的主题切换、属性、行号与 Mermaid。一键安装器还在 macOS 14.1.1 的 MacBook Air 上，针对已有 17 个第三方插件的仓库验证了安装、备份和重复执行；安装后的文件与设置已核对，Air 上重启后的界面效果仍需确认。尚未验证移动端，也未提交 Obsidian 官方主题或插件目录。主题 CSS 为本项目独立实现，不包含参考项目的源码。

## 许可证

MIT，见 [LICENSE](LICENSE)。
