# dsh-tidy

DSH（DeepSeek Harness）对话整理插件（轻量，**常开无开关**）：

- **消息折叠**：对话区左上角一个按钮切换「已折叠 / 全放开」。折叠时**每个回合只保留最后一条 assistant 回答**——中间的思考过程、工具调用、中间输出全部隐藏；展开则全部显示。选择持久化在 **localStorage**（默认全放开），重启后保持。
- **导航条**：对话区右缘一列**短横杠节点**（每个节点对应一条你的提问），**悬停显示该消息前几个字**，点击平滑跳转，当前阅读位置自动高亮；容器可滚轮上下滑动（上限 100 个节点）。启动时**自动加载全部历史**（自动点「加载更早」最多 20 次，加载期间暂停导航重建避免卡顿）。

## 安全设计

纯浏览器端 DOM 驱动，零核心改动：

- **绝不向 React 管理的 `[data-chat-flow]` 子树插入任何节点**：折叠只改既有元素的 `style.display`；按钮/导航条挂在 `document.body` 浮动层。
- **observer 收窄**：body 只观察 `childList`，仅 `[data-chat-flow]` 容器观察子树；所有回调 rAF 节流，watchdog 每秒一次完整调度（覆盖对话视图晚挂载的启动顺序）。
- **匹配真实 DOM 契约**（对照官方源码）：`flowItem` 内递归找 `[data-chat-call-id]` / `[data-variant="think"]`，排除 `[data-subcalls]` 内子调用；**user / turn-tail 是回合边界**（保持可见）；导航锚点用气泡结构检测（`[class*="bubble"]`）排除 pending steering 与回合尾行。
- 卸载完全还原（恢复所有 display、移除按钮/导航条、断开观察器）。

## 安装

```bash
dsh plugin --profile web add dsh-tidy    # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
```

或手动：包放 `~/.dsh/profiles/node_modules/dsh-tidy`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-tidy, name: dsh-tidy }]`，重启 DSH。

## 兼容性说明

- 自动加载历史依赖「加载更早」按钮（`button` 文本或 `.Md3f7G_older` 类名回退）——DSH 构建更新后若失效会静默跳过（导航条仍可用，只是不自动加载）。
- 其余选择器均为官方 data 属性（`data-chat-flow` / `data-chat-call-id` / `data-variant="think"` / `data-time-hover-root`），跨版本稳定。

## 结构

```
dsh-tidy/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：折叠控制器 + 导航条 + 自动加载
└── cordis.patch.yml # bundle 组合补丁
```
