import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vaultRoot = join(projectRoot, '.test-vault');
const config = join(vaultRoot, '.obsidian');
const themeDir = join(config, 'themes', 'Reading Studio');
const pluginDir = join(config, 'plugins', 'reading-studio-controls');

await mkdir(themeDir, { recursive: true });
await mkdir(pluginDir, { recursive: true });
for (const file of ['manifest.json', 'theme.css']) {
  await copyFile(join(projectRoot, 'theme', file), join(themeDir, file));
}
for (const file of ['manifest.json', 'main.js', 'styles.css']) {
  await copyFile(join(projectRoot, 'plugin', file), join(pluginDir, file));
}

await writeFile(join(config, 'appearance.json'), JSON.stringify({
  cssTheme: 'Reading Studio', theme: 'obsidian', enabledCssSnippets: [],
}, null, 2));
await writeFile(join(config, 'app.json'), JSON.stringify({
  livePreview: true, showLineNumber: true, propertiesInDocument: 'visible', readableLineLength: true,
}, null, 2));
await writeFile(join(config, 'community-plugins.json'), JSON.stringify(['reading-studio-controls'], null, 2));
await writeFile(join(vaultRoot, 'Reading Studio 示例.md'), `---
article_id: DEMO-0001
tags:
  - design
  - reading
type: example
created_at: 2026-09-28
---

# 如何把复杂问题讲清楚

解释一个新概念时，先找到对方已经理解的事物，再把新知识接上去。

## 用流程图承载关系

\`\`\`mermaid
sequenceDiagram
    participant 浏览器
    participant Caddy
    participant OSS
    浏览器->>Caddy: 请求页面
    Caddy->>OSS: 读取静态资源
    OSS-->>Caddy: 返回内容
    Caddy-->>浏览器: 返回页面
\`\`\`
`);

console.log(vaultRoot);
