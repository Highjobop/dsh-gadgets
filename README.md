[**English**](README.en.md) | [简体中文](README.md)

# dsh-gadgets 🧰

> DeepSeek Harness 的轻量小玩意合集 —— 不改核心、不装大框架，每个都是几个小功能，装了就舒服。

**定位：轻量、简洁。** 纯浏览器端 DOM 驱动（对照官方源码的稳定 data 属性），零核心改动、无死循环、不污染 React 树；全部代码可读，卸载即还原。

## 包含的小玩意

### 🎨 dsh-skin —— 外观定制（中英文双语）
- 15 套预设皮肤（海盐白 → 薰衣草紫，亮/暗各一套）
- 亮/暗/跟随系统一键切换
- 字号：小 / 中 / 大 / 特大（覆盖组合令牌 + 官方硬编码的界面文字：输入框、气泡、侧栏）
- 13 个颜色角色自由微调（取色器 + HEX 输入）
- 换肤自动联动界面控件：输入框、聊天气泡、按钮、对话/轨迹 tab、Deep diving 渐变、侧栏
- 全部选择 localStorage 持久化，重启不丢

### 📦 dsh-tidy —— 对话整理（中英文双语）
- **消息折叠**：左上角按钮切换「简洁 / 完整」，折叠时每回合只保留最后一条回答
- **导航条**：右侧短横杠对应每条提问，悬停显示摘要、点击跳转、自动高亮，自动加载历史
- **总 Token 徽章**：左下角显示会话总 token，上下文占用 ≥60% 变色、≥80% 变红提示
- **设置开关**：设置 → 通用 →「对话整理」三个功能可分别开关
- 折叠模式 localStorage 持久化，默认完整

### 🔔 dsh-task-alerts —— 任务提醒（中英文双语）
- **任务完成 / 出错**：整轮任务结束播放提示音 + 弹窗，手动停止不算完成
- **需要审批 / 等待回答**：播放提示音 + 弹窗，标签页附加 ⚠ 标记，始终提醒
- **提示音与弹窗**：6 种音色、音量可调；浏览器通知，未授权自动用页面内悬浮提示
- **设置**：设置 → 通用 →「任务提醒」四个事件独立开关 + 音色/音量/弹窗

## 安装

需要 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（0.1.0-rc.6+）。

### 推荐：npm 一条命令装齐（聚合包）

```bash
dsh plugin --profile web add dsh-gadgets@0.4.1
```

> 锁版本可避免装到旧版（registry 正常时可不写版本号）。

装完**重启 dsh web 进程**（不是只刷新浏览器），再硬刷新页面。只想用其中一个（与聚合包二选一，不要混装）：

```bash
dsh plugin --profile web add dsh-skin    # 外观定制
dsh plugin --profile web add dsh-tidy    # 对话整理
dsh plugin --profile web add dsh-task-alerts  # 任务提醒
```

### 或从 GitHub 仓库安装（调试）

```bash
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-task-alerts
```

## 结构

```
dsh-gadgets/        # 聚合包：一条命令装齐（npm 包名 dsh-gadgets）
dsh-skin/           # 外观定制插件（设置 → 通用 → 个性化外观）
dsh-tidy/           # 对话整理插件（折叠按钮 + 导航条 + 总 Token 徽章，可开关）
dsh-task-alerts/    # 任务提醒插件（完成 / 审批 / 回答 → 提示音 + 弹窗）
README.md / README.en.md   # 本文件（中 / 英）
```

## 兼容性

- 颜色令牌覆盖基于官方稳定 data 属性与主题令牌，跨版本稳定
- 字号/侧栏覆盖依赖当前构建的类名哈希（`.uV2eYG_*`、`.gdEzaW_bubble`、`.pI_x6G_sidebarCol`），DSH 升级后若失效请按新版源码更新类名（代码中已注明）

## 许可

MIT
