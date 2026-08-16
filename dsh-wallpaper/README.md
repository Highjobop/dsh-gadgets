[**English**](README.en.md) | [简体中文](README.md)

# 🖼️ dsh-wallpaper

> DeepSeek Harness 的**半透明壁纸背景**插件 —— 给对话区垫一张壁纸，主题感拉满，不改核心、不污染 React 树，卸载即还原。

纯浏览器端 DOM 驱动，零核心改动。设置 → 通用 →「壁纸背景」一行搞定：开关、图片、透明度、模糊。

## 功能

- **启用开关**：对话区主背景变为半透明，壁纸从内容区透出
- **图片**：粘贴图片 URL，或「选本地图片」（自动降采样为 ≤1200px JPEG dataURL，防超 localStorage 配额）
- **透明度**：10%–100% 可调，越低壁纸越明显
- **模糊**：0–20px，模糊背景让文字更易读
- **恢复默认**：一键清除壁纸并还原设置
- 全部设置 localStorage 持久化，重启不丢；与 dsh-skin 兼容（主题变化时自动重写透明令牌）

## 原理

- 全屏 fixed 层 `#dsw-wallpaper`（`z-index:-1`，`pointer-events:none`，不挡任何交互）垫底
- 三层透明化（全部用**结构性选择器/通用扫描**，不依赖哈希类名）：
  1. `--dsw-alias-bg-base` 令牌覆写为 transparent（**写在 body 上**——变量定义在 body，写在 html 不生效）
  2. 主框架 `#root [data-slot="root"] > div` 内联透明（其背景是 CSS-in-JS 硬编码白，非变量）
  3. 主列内扫描覆盖 ≥30% 视口的不透明层（如纯白根容器），置透明并用 dataset 标记，每层只清一次
- 气泡卡片、侧栏保持不透明，保证可读性
- 壁纸 URL 必须带引号 `url("...")`：未加引号的 data: URL 会被 CSSOM 校验拒绝（background-image 静默失效）

## 安装

需要 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（0.1.0-rc.6+）。

```bash
# dsh-gadgets 社区仓库（本仓库合并后可用）
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-wallpaper
# 或作者个人仓库（开发版）
dsh plugin --profile web add github:flyingpetals520/dsh-wallpaper
```

⚠️ 客户端插件无 `dsh.bundle` 字段，`dsh plugin add` 只装依赖**不会自动挂载**，
需手动在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-wallpaper
      name: dsh-wallpaper
```

然后重启 `dsh web`。

### 从 GitHub 安装（调试）

```bash
dsh plugin --profile web add github:flyingpetals520/dsh-wallpaper
```

## 结构

```
dsh-wallpaper/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：设置行 UI + 壁纸层 + 令牌覆写
└── cordis.patch.yml # bundle 组合补丁
```

## 兼容性说明

- 对话区透明依赖 `--dsw-alias-bg-base` 令牌（DSH 稳定设计令牌，非类名哈希），升级 DSH 一般不受影响
- 若 DSH 未来改变背景令牌结构，透明覆写会静默失效（壁纸层仍在，只是被不透明背景挡住），需按新版源码更新
- 与 dsh-skin 同写透明令牌时，本插件在 cordis.patch.yml 里 insert 在 skin **之后**，主题变化自动重写，优先级更高

## 开发注意

`file:` 依赖安装时 pnpm 会把文件**拷贝**进 profile 的 node_modules，之后改源码不会自动同步。
调试时改完执行 `cp -f lib/client.js ~/.dsh/profiles/web/node_modules/dsh-wallpaper/lib/client.js` 并重启 `dsh web`（浏览器刷新即可）。

## License

[MIT](LICENSE)
