# 风格包灵感与扩展方式

Morrow 的预设是本项目独立编写的 CSS 变量和局部规则，**不是**以下主题的 fork，也没有直接复制它们的 CSS、图片或宣传截图。我们研究其视觉语言与功能侧重，再用自己的共享基础和风格包实现类似的阅读目标。名称仅为说明设计方向，不表示上游项目参与或认可。

| 参考项目 | 本项目借鉴的方向 | 仓库与许可 |
| --- | --- | --- |
| Cupertino | 原生感、圆角、低噪声侧栏 | [源码](https://github.com/svnaxis/obsidian-cupertino) · [MIT](https://github.com/svnaxis/obsidian-cupertino/blob/main/LICENSE.txt) |
| Minimal | 克制的黑灰层级和留白 | [源码](https://github.com/kepano/obsidian-minimal) · [MIT](https://github.com/kepano/obsidian-minimal/blob/master/LICENSE) |
| Catppuccin | 柔和粉彩与低刺激对比 | [源码](https://github.com/catppuccin/obsidian) · [MIT](https://github.com/catppuccin/obsidian/blob/main/LICENSE) |
| Prism | 鲜明的内容层级与重点色 | [源码](https://github.com/damiankorcz/Prism-Theme) · [MIT](https://github.com/damiankorcz/Prism-Theme/blob/main/LICENSE) |

另外调研了 [Things](https://github.com/colineckert/obsidian-things) 和 [AnuPpuccin](https://github.com/AnubisNekhet/AnuPpuccin)。Things 的 README 说明它以 Minimal 为基础；若将来复制其代码，应核对并保留其继承链署名。AnuPpuccin 使用 [GPL-3.0](https://github.com/AnubisNekhet/AnuPpuccin/blob/main/LICENSE)，不能在不处理兼容性和许可义务的情况下直接拼接到当前 MIT 主题。

## 何谓“继承风格”

Obsidian 同时只启用一份主题。直接把多个上游 `theme.css` 拼在一起，会造成全局选择器冲突、升级耦合和署名问题。Morrow 用一份基础主题定义通用排版、文件树、属性区与 Mermaid 组件；每个风格包用 `morrow-preset-<id>` 的 body 类覆盖 CSS 变量和少量独特规则。插件的预览也用同一预设 ID 选择相应的视觉令牌。行号、属性、Mermaid、宽度和强调色作为正交开关继续叠加。

桌面版的侧栏容器、分组工具按钮和胶囊式顶部标签由本项目的共享 CSS 独立绘制。它们不会随 Cupertino 主题自动更新；切换到 Morrow 时，原 Cupertino 主题不会同时运行。

新增风格的最小步骤：在 `src/presets.ts` 注册 ID、文案与默认选项；在 `theme/theme.css` 定义真实 Obsidian 的风格变量/局部规则；在 `plugin/styles.css` 定义对应预览令牌；最后补充状态、界面与真实 Obsidian 验收。新包应同时检查侧栏、正文、属性区、Mermaid 和可读性，不以只改一个颜色视为新主题。优先使用 [Obsidian 官方 CSS 变量](https://docs.obsidian.md/Reference/CSS%20variables/About%20styling)。

V2 先提供深色包。Obsidian [公开插件 API](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts) 提供深浅色状态读取，没有公开的基础配色切换接口；未来浅色包需要清楚处理此边界，不能只改预览却声称已经应用。
