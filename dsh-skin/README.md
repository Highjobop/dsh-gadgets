# dsh-skin

DSH（DeepSeek Harness）的外观自定义插件（轻量，**中英文双语**）—— 设置 → 通用 →「个性化外观」展开行：

- **显示模式**：亮色 / 暗色 / 跟随系统（行内直接切换）
- **预设皮肤**：15 套全定制配色（13 个语义令牌、亮/暗各一套）：海盐白、石墨灰、莓果红、珊瑚红、樱花粉、暖阳橙、摩卡棕、奶油米、柠檬黄、薄荷绿、森林绿、极光青、天际青、海盐蓝、薰衣草紫
- **字号**：小 / 中（默认）/ 大 / 特大 —— 覆盖组合令牌（markdown/Deep diving/侧栏等）**以及官方硬编码的界面文字**（输入框、user 气泡、侧栏全部元素），带 `!important`
- **自定义样式**（折叠区）：13 个颜色角色（背景/卡片/浮层/侧栏/文字/边框/主题色/错误/成功/警告），取色器 + HEX 输入；已保存的微调不被预设覆盖
- **界面控件联动**：换肤时输入框、聊天气泡（品牌色 10% 混入卡片色）、加号/goal 条/新会话框、开始按钮、对话/轨迹 tab、Deep diving 渐变全部跟随主题色；深色模式下对话区背景轻微提亮降饱和并与侧栏保持层次
- **恢复默认**：一键还原（同时清空自定义色）
- **中英文**：界面文本跟随 DSH 语言设置（zh/en）自动切换

持久化在 **localStorage**（第三方命名空间无法通过 settings RPC 写入，这是官方网关白名单限制），重启后自动恢复；加载时校验脏数据（预设/字号/颜色非法自动回退默认）。

## 安装

```bash
dsh plugin --profile web add dsh-skin    # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-skin
```

或手动：包放 `~/.dsh/profiles/node_modules/dsh-skin`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-skin, name: dsh-skin }]`，重启 DSH。

## 原理

- `theme.overrideTokens()` 换肤（同 source 整体替换、不叠层）+ `theme.setTheme()` 切模式；监听 `theme/change` 让控件颜色即时跟随亮暗切换。
- 字号覆盖组件实际消费的组合令牌（`--dsw-font-*`）与硬编码界面文字（输入框 `.uV2eYG_*`、user 气泡 `.gdEzaW_bubble`、侧栏 `.pI_x6G_sidebarCol *`），inline `!important` 优先级最高。

## 兼容性说明

**字号/控件联动依赖当前 DSH 构建的类名哈希**（`.uV2eYG_*`、`.gdEzaW_bubble`、`.pI_x6G_sidebarCol`）——DSH 升级后若哈希变化，这些覆盖会静默失效（颜色令牌覆盖不受影响，仍基于稳定 data 属性与主题令牌）。失效时需按新版源码更新类名。

## 结构

```
dsh-skin/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：设置行 UI + 令牌覆写 + 字号 + 控件联动
└── cordis.patch.yml # bundle 组合补丁
```
