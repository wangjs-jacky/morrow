# Morrow

一个面向 Obsidian 桌面版的明暗双配色阅读主题，附带可视化设置插件。在一张仿 Obsidian 的预览中查看侧栏、正文、笔记属性、行号与 Mermaid，选择风格并调整选项后点「应用」即可生效；「撤销」可恢复上一次配置。

Morrow 是独立主题，不会加载 Cupertino 的主题文件。「浮岛夜蓝」以 Cupertino 的浮动侧栏、分组工具按钮和胶囊式顶部标签为视觉参考，由本项目自己的 CSS 实现；五套风格共用这一桌面布局，各自保留配色与正文细节。

0.4.1 版提供五款支持明暗配色的风格包：「静夜阅读」「浮岛夜蓝」「石墨极简」「柔雾玻璃」「青蓝聚焦」。进入界面时，「自定义细节」默认展开，所有选项直接可见。侧栏、正文、属性区、Mermaid 和控制区各有辨识度；预览在常见桌面尺寸下能完整显示流程图，正文更易读，强调色更接近实际应用效果。行号、属性显隐、Mermaid、正文宽度及主题色仍可独立微调。在 Morrow 面板右上角直接点击「浅色 / 深色 / 跟随系统」即可切换，立即生效并由 Obsidian 自动保存；与外观设置双向同步，不影响预设的应用和撤销。预览使用虚构笔记，不读取或上传你的仓库内容。V1 保存的「静夜阅读」配置可以继续使用。

「柔雾玻璃」采用雾面玻璃风格：侧栏、标签、属性和 Mermaid 卡片采用半透明层次与柔和高光，正文保留稳定深色背景以便阅读；「青蓝聚焦」的青色也更克制。预设 ID 和已保存设置保持兼容。

## 安装

在 Mac 的「终端」粘贴这一条命令，**无需查找或输入仓库路径**：

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/main/scripts/install.sh | bash
```

Obsidian 仓库（vault）只是本地笔记文件夹，**不需要 Git 或 GitHub**。安装器读取 Obsidian 在这台 Mac 上登记的仓库路径，确认其中存在 `.obsidian` 配置文件夹；如果只有一个有效仓库，或运行中的 Obsidian 仅标记了一个打开的仓库，就自动选中它。其他多仓库情况会显示名称供你选编号；找不到登记信息时才弹出文件夹选择窗口。

脚本会下载并校验 v0.4.1 主题包与插件包，备份原设置，再安装并启用主题、插件、行号和属性显示，保留已有的浅色、深色或跟随系统配色。它只会停用旧的 `cupertino-reading`、`cupertino-mermaid` 两个样式片段；其他片段、设置及插件已保存的风格会保留。**安装后重启 Obsidian**；如果是首次使用第三方插件，Obsidian 仍可能要求你确认信任仓库。备份位置会在终端显示。

## 更新

打开 Morrow 时，配套插件会检查 GitHub 上最新且包含完整主题包、插件包的 Release。如果有新版本，界面会提示并提供「复制更新命令」按钮；把命令粘贴到 Mac 终端执行，完成后重启 Obsidian。命令固定指向检测到的版本，插件不会自行运行安装脚本；如果剪贴板不可用，界面会显示可手动复制的完整命令。检查只向 GitHub 请求版本信息，不上传笔记内容；网络失败不影响主题操作。目前这种 ZIP 安装方式不会收到 Obsidian 内置的更新提示。也可以随时重新运行上面的安装命令；它会识别仓库、校验发布包、备份旧文件，并保留插件设置。

通过 SSH 的交互式终端运行同一条命令也会自动识别仓库。只有想指定其他仓库时，才需要把路径作为参数传入：

```bash
curl -fsSL https://raw.githubusercontent.com/wangjs-jacky/morrow/main/scripts/install.sh | bash -s -- "/你的路径/Obsidian仓库"
```

也可以从 [Releases](https://github.com/wangjs-jacky/morrow/releases) 手动下载同版本的两个 ZIP，解压后放进当前仓库的 `.obsidian` 目录：

```text
你的仓库/.obsidian/themes/Morrow/{manifest.json,theme.css}
你的仓库/.obsidian/plugins/morrow-controls/{manifest.json,main.js,styles.css}
```

手动安装时，在 Obsidian「设置 → 外观」中选择 **Morrow**，并按喜好选择**浅色、深色或跟随系统**基础配色。在「设置 → 编辑器」中开启**显示行号**，把**文档中的属性**设为**可见**。最后在「设置 → 第三方插件」中启用 **Morrow Controls**。点击左侧调色盘图标，或从命令面板打开「Morrow Controls: 打开外观预览」。第一次启用第三方插件时，Obsidian 可能要求信任当前仓库。

打开设置界面后，「自定义细节」默认展开；选择风格包即可试调。预览会即时变化，真实笔记只在点「应用」后切换。设置保存在插件数据中，重启后恢复；「撤销」恢复上一次应用前的完整风格和选项。「恢复默认」只重置**当前风格**尚未应用的草稿。

行号与属性的开关只控制**显示**，不会删除 YAML 或生成 Obsidian 没有启用的行号。如果官方编辑器设置不满足需要，插件会提示具体设置路径并阻止误报成功。插件不会修改 Markdown、YAML 或其他主题文件；明暗切换仅更新 Obsidian 的基础配色设置。若要直接编辑 YAML 源码，仍需使用 Obsidian 自己的源码视图或属性设置。

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

可编辑的 [HTML 交互稿](design/prototype.html)、[V1 产品设计](docs/superpowers/specs/2026-09-28-morrow-design.md)、[V2 风格包设计](docs/superpowers/specs/2026-09-28-theme-packs-v2-design.md) 和 [风格来源与扩展说明](docs/theme-inspiration.md) 已随仓库保存。

当前支持桌面版 Obsidian 1.8.0 及以上。新版安装器在包含另外 17 个插件的临时仓库中通过了备份、预设保留和重复安装检查；这个版本的原生界面效果尚未视觉验收。尚未验证移动端，也未提交 Obsidian 官方主题或插件目录。主题 CSS 为本项目独立实现，不包含参考项目的源码。

## 许可证

MIT，见 [LICENSE](LICENSE)。
