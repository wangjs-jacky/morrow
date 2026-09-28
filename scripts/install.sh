#!/usr/bin/env bash
# One-command installer for the macOS desktop version of Obsidian.
set -euo pipefail

version=0.3.2
theme_sha=6219ea6a400bc7c38d595760c364faffee0eaab24d9d1f7e1c4c92fb4efe239f
plugin_sha=7ea37a469cf40f8cb5e204acef691563e32af3951da89a59bb0d9cc5263ea729
release_url="https://github.com/wangjs-jacky/morrow/releases/download/v${version}"
plugin_id=morrow-controls

fail() { printf '安装失败：%s\n' "$*" >&2; exit 1; }

detect_vault() {
  local registry="$HOME/Library/Application Support/obsidian/obsidian.json"
  local vault_id registered_path open_flag duplicate candidate_path index selection
  local -a vault_paths=() vault_names=() open_indices=()

  if [[ -f "$registry" ]] && plutil -convert json -o - "$registry" >/dev/null 2>&1; then
    while IFS= read -r vault_id; do
      registered_path=$(plutil -extract "vaults.$vault_id.path" raw -o - "$registry" 2>/dev/null || true)
      [[ -d "$registered_path/.obsidian" ]] || continue
      registered_path=$(cd "$registered_path" && pwd -P)
      duplicate=0
      for (( index=0; index<${#vault_paths[@]}; index++ )); do
        candidate_path=${vault_paths[index]}
        if [[ $candidate_path == "$registered_path" ]]; then duplicate=1; break; fi
      done
      [[ $duplicate -eq 0 ]] || continue
      vault_paths+=("$registered_path")
      vault_names+=("$(basename "$registered_path")")
      open_flag=$(plutil -extract "vaults.$vault_id.open" raw -o - "$registry" 2>/dev/null || true)
      if [[ $open_flag == true ]]; then open_indices+=("$((${#vault_paths[@]} - 1))"); fi
    done < <(plutil -extract vaults raw -o - "$registry" 2>/dev/null || true)
  fi

  if [[ ${#vault_paths[@]} -eq 1 ]]; then
    vault=${vault_paths[0]}
  elif [[ ${#open_indices[@]} -eq 1 ]] && pgrep -x Obsidian >/dev/null 2>&1; then
    vault=${vault_paths[${open_indices[0]}]}
  elif [[ ${#vault_paths[@]} -gt 1 ]]; then
    printf 'Obsidian 登记了多个仓库，请选编号（无需输入路径）：\n' >&2
    for (( index=0; index<${#vault_paths[@]}; index++ )); do
      printf '  %d. %s — %s\n' "$((index + 1))" "${vault_names[index]}" "${vault_paths[index]}" >&2
    done
    [[ -r /dev/tty ]] || fail '当前终端无法选择仓库；请在交互式终端运行安装命令。'
    printf '仓库编号：' >&2
    IFS= read -r selection < /dev/tty || fail '没有选择仓库。'
    [[ $selection =~ ^[0-9]+$ ]] || fail '请输入列表中的数字。'
    selection=$((10#$selection))
    (( selection >= 1 && selection <= ${#vault_paths[@]} )) || fail '仓库编号超出范围。'
    vault=${vault_paths[selection - 1]}
  else
    printf '没有找到 Obsidian 已登记的有效仓库，请在窗口中选择仓库文件夹。\n' >&2
    vault=$(osascript -e 'POSIX path of (choose folder with prompt "请选择 Obsidian 仓库文件夹")') || fail '没有选择仓库。'
  fi
  printf '已选择仓库：%s\n' "$vault" >&2
}

if [[ "$(uname -s)" != Darwin ]]; then
  fail '目前安装器只支持 macOS 桌面版 Obsidian。'
fi

case "${1:-}" in
  -h|--help)
    printf '用法：bash install.sh [Obsidian 仓库路径]\n不传路径时自动识别当前仓库；如果有多个候选仓库，会显示编号供选择。\n'
    exit 0
    ;;
esac
[[ $# -le 1 ]] || fail '只接受一个 Obsidian 仓库路径。'

if [[ $# -eq 1 ]]; then
  vault=$1
else
  detect_vault
fi
[[ -d "$vault/.obsidian" ]] || fail "找不到 $vault/.obsidian；请选择仓库根目录。"
vault=$(cd "$vault" && pwd -P)
config="$vault/.obsidian"
theme_target="$config/themes/Morrow"
plugin_target="$config/plugins/$plugin_id"

for target in "$theme_target" "$plugin_target" "$plugin_target/data.json" "$config/appearance.json" "$config/app.json" "$config/community-plugins.json"; do
  [[ ! -L "$target" ]] || fail "不修改符号链接：$target"
done
for target in "$theme_target" "$plugin_target"; do
  [[ ! -e "$target" || -d "$target" ]] || fail "安装位置不是文件夹：$target"
done

work=$(mktemp -d "${TMPDIR:-/tmp}/morrow-install.XXXXXX")
backup=''
commit_started=0
config_committed=0
theme_committed=0
plugin_committed=0
seed_key="_morrowInstallSeed$$"
appearance_seeded=0
app_seeded=0
theme_stage="$config/themes/.morrow-install-$$"
plugin_stage="$config/plugins/.morrow-install-$$"

cleanup() {
  result=$?
  trap - EXIT
  set +e
  if [[ $result -ne 0 && $commit_started -eq 1 ]]; then
    printf '安装未完成，正在恢复原设置…\n' >&2
    if [[ $config_committed -eq 1 ]]; then
      for name in appearance.json app.json community-plugins.json; do
        if [[ -f "$backup/$name" ]]; then
          cp -p "$backup/$name" "$config/$name"
        else
          rm -f "$config/$name"
        fi
      done
    fi
    if [[ $theme_committed -eq 1 ]]; then rm -rf "$theme_target"; fi
    if [[ $plugin_committed -eq 1 ]]; then rm -rf "$plugin_target"; fi
    if [[ -d "$backup/Morrow" ]]; then mv "$backup/Morrow" "$theme_target"; fi
    if [[ -d "$backup/$plugin_id" ]]; then mv "$backup/$plugin_id" "$plugin_target"; fi
  fi
  rm -rf "$theme_stage" "$plugin_stage" "$work"
  for name in appearance.json app.json community-plugins.json; do
    rm -f "$config/.morrow-$name-$$"
  done
  exit "$result"
}
trap cleanup EXIT

json_set() {
  file=$1 key=$2 type=$3 value=$4
  if plutil -extract "$key" raw -o - "$file" >/dev/null 2>&1; then
    plutil -replace "$key" -"$type" "$value" "$file"
  else
    plutil -insert "$key" -"$type" "$value" "$file"
  fi
}

prepare_json() {
  name=$1 default=$2 root_tag=$3
  if [[ -f "$config/$name" ]]; then
    plutil -convert json -o - "$config/$name" >/dev/null 2>&1 || fail "现有 $name 不是有效 JSON，未修改仓库。"
    cp -p "$config/$name" "$work/$name"
  else
    printf '%s\n' "$default" > "$work/$name"
  fi
  actual_tag=$(plutil -convert xml1 -o - "$work/$name" | awk '/^<plist version=/{getline; print; exit}')
  [[ $actual_tag == "$root_tag" || $actual_tag == "${root_tag%>}/>" ]] || fail "现有 $name 的结构不符合 Obsidian 配置，未修改仓库。"
  # macOS plutil cannot insert into an empty JSON object without a temporary key.
  if [[ $actual_tag == '<dict/>' ]]; then
    printf '{"%s":true}\n' "$seed_key" > "$work/$name"
    if [[ $name == appearance.json ]]; then appearance_seeded=1; else app_seeded=1; fi
  fi
}

printf '正在为 %s 安装 Morrow v%s…\n' "$vault" "$version"
for kind in theme plugin; do
  archive="$work/morrow-${kind}-v${version}.zip"
  curl --proto '=https' --tlsv1.2 -fL --connect-timeout 15 --max-time 60 \
    --retry 3 --retry-delay 1 -sS \
    "$release_url/morrow-${kind}-v${version}.zip" -o "$archive"
  if [[ $kind == theme ]]; then expected=$theme_sha; else expected=$plugin_sha; fi
  actual=$(shasum -a 256 "$archive" | awk '{print $1}')
  [[ $actual == "$expected" ]] || fail "$kind 下载文件校验失败，未修改仓库。"
  mkdir "$work/$kind"
  unzip -q "$archive" -d "$work/$kind"
done

[[ -f "$work/theme/Morrow/manifest.json" && -f "$work/theme/Morrow/theme.css" ]] || fail '主题包文件不完整。'
[[ -f "$work/plugin/$plugin_id/manifest.json" && -f "$work/plugin/$plugin_id/main.js" && -f "$work/plugin/$plugin_id/styles.css" ]] || fail '插件包文件不完整。'
[[ "$(plutil -extract version raw -o - "$work/plugin/$plugin_id/manifest.json")" == "$version" ]] || fail '插件版本与安装器不一致。'

prepare_json appearance.json '{}' '<dict>'
prepare_json app.json '{}' '<dict>'
prepare_json community-plugins.json '[]' '<array>'
json_set "$work/appearance.json" cssTheme string 'Morrow'
json_set "$work/appearance.json" theme string obsidian
json_set "$work/app.json" showLineNumber bool true
json_set "$work/app.json" propertiesInDocument string visible
if [[ $appearance_seeded -eq 1 ]]; then plutil -remove "$seed_key" "$work/appearance.json"; fi
if [[ $app_seeded -eq 1 ]]; then plutil -remove "$seed_key" "$work/app.json"; fi

# Keep other snippets; only remove the two known Cupertino overrides from the previous setup.
if [[ "$(plutil -type enabledCssSnippets "$work/appearance.json" 2>/dev/null || true)" == array ]]; then
  snippet_count=$(plutil -extract enabledCssSnippets raw -o - "$work/appearance.json")
  for (( index=snippet_count-1; index>=0; index-- )); do
    snippet=$(plutil -extract "enabledCssSnippets.$index" raw -o - "$work/appearance.json")
    if [[ $snippet == cupertino-reading || $snippet == cupertino-mermaid ]]; then
      plutil -remove "enabledCssSnippets.$index" "$work/appearance.json"
    fi
  done
fi

index=0
while existing=$(plutil -extract "$index" raw -o - "$work/community-plugins.json" 2>/dev/null); do
  if [[ $existing == "$plugin_id" ]]; then break; fi
  index=$((index + 1))
done
if [[ ${existing:-} != "$plugin_id" ]]; then
  # plutil -insert crashes on some macOS versions when a root-array index has two digits.
  normalized=$(plutil -convert json -o - "$work/community-plugins.json") || fail '无法读取插件列表，未修改仓库。'
  [[ $normalized == \[*\] ]] || fail 'community-plugins.json 不是插件列表，未修改仓库。'
  separator=','
  if [[ $index -eq 0 ]]; then separator=''; fi
  printf '%s%s"%s"]\n' "${normalized%]}" "$separator" "$plugin_id" > "$work/community-plugins.json"
  plutil -convert json -o - "$work/community-plugins.json" >/dev/null || fail '生成的插件列表无效，未修改仓库。'
fi

mkdir -p "$config/themes" "$config/plugins" "$config/morrow-backups"
[[ ! -e "$theme_stage" && ! -e "$plugin_stage" ]] || fail '发现未清理的安装临时文件，请重试。'
cp -R "$work/theme/Morrow" "$theme_stage"
cp -R "$work/plugin/$plugin_id" "$plugin_stage"
if [[ -f "$plugin_target/data.json" ]]; then
  cp -p "$plugin_target/data.json" "$plugin_stage/data.json"
fi

backup=$(mktemp -d "$config/morrow-backups/$(date +%Y%m%d-%H%M%S).XXXXXX")
for name in appearance.json app.json community-plugins.json; do
  if [[ -f "$config/$name" ]]; then cp -p "$config/$name" "$backup/$name"; fi
done

commit_started=1
if [[ -e "$theme_target" ]]; then mv "$theme_target" "$backup/Morrow"; fi
if [[ -e "$plugin_target" ]]; then mv "$plugin_target" "$backup/$plugin_id"; fi
mv "$theme_stage" "$theme_target"
theme_committed=1
mv "$plugin_stage" "$plugin_target"
plugin_committed=1
for name in appearance.json app.json community-plugins.json; do
  cp "$work/$name" "$config/.morrow-$name-$$"
  mv "$config/.morrow-$name-$$" "$config/$name"
  config_committed=1
done
commit_started=0

printf '\n安装完成：主题、插件、深色模式、行号和属性显示均已配置。\n'
printf '原设置备份：%s\n' "$backup"
printf '请重新启动 Obsidian；首次启用第三方插件时，可能还需在 Obsidian 中确认信任。\n'
