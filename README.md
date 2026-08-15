[**English**](README.en.md) | [简体中文](README.md)

# dsh-gadgets 🧰

> DeepSeek Harness 的轻量小玩意合集 —— 不改核心、不装大框架，每个都是几个小功能，装了就舒服。

**定位：轻量、简洁。** 纯浏览器端 DOM 驱动（对照官方源码的稳定 data 属性），零核心改动、无死循环、不污染 React 树；全部代码可读，卸载即还原。

## 包含的小玩意

### 🎨 dsh-skin —— 外观定制
- 15 套预设皮肤（海盐白 → 薰衣草紫，亮/暗各一套）
- 亮/暗/跟随系统一键切换
- 字号：小 / 中 / 大 / 特大（覆盖组合令牌 + 官方硬编码的界面文字：输入框、气泡、侧栏）
- 13 个颜色角色自由微调（取色器 + HEX 输入）
- 换肤自动联动界面控件：输入框、聊天气泡、按钮、对话/轨迹 tab、Deep diving 渐变、侧栏
- 全部选择 localStorage 持久化，重启不丢

### 📦 dsh-tidy —— 对话整理
- **消息折叠**：对话区左上角按钮切换「简洁 / 完整」——折叠时每个回合只保留最后一条回答，中间的思考、工具调用、中间输出全部隐藏
- **导航条**：右侧短横杠节点（每条提问一个），悬停才读取前几个字、点击跳转、自动高亮，可滚轮滑动
- **自动加载历史**：打开会话自动点「加载更早」（按钮就绪才点、最多 8 页、无增长即停），加载不卡页面、横杠实时增长
- **总 Token 徽章**：对话区左下角圆角矩形，只显示会话总 token，与折叠按钮左对齐、与底部统计行底对齐；上下文占用 ≥60% 变发送按钮同款色、≥80% 变红并提示"上下文快满了"
- 折叠模式 localStorage 持久化，默认完整

## 安装

需要 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（0.1.0-rc.6+）。

### 推荐：npm 一条命令装齐（聚合包）

```bash
dsh plugin --profile web add dsh-gadgets
```

装完重启 dsh web 即可。只想用其中一个：

```bash
dsh plugin --profile web add dsh-skin    # 外观定制
dsh plugin --profile web add dsh-tidy    # 对话整理
```

### 或从 GitHub 仓库安装（调试）

```bash
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
```

手动安装：把对应目录放到 `~/.dsh/profiles/node_modules/`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-skin, name: dsh-skin }]`（或 `dsh-tidy`），重启 DSH。

## 结构

```
dsh-gadgets/
├── dsh-skin/     # 外观定制插件（设置 → 通用 → 个性化外观）
├── dsh-tidy/     # 对话整理插件（折叠按钮 + 导航条，常开）
└── README.md
```

## 兼容性

- 颜色令牌覆盖基于官方稳定 data 属性与主题令牌，跨版本稳定
- 字号/侧栏覆盖依赖当前构建的类名哈希（`.uV2eYG_*`、`.gdEzaW_bubble`、`.pI_x6G_sidebarCol`），DSH 升级后若失效请按新版源码更新类名（代码中已注明）

## 许可

MIT
