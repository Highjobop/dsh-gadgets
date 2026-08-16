# dsh-tidy

DSH（DeepSeek Harness）对话整理插件（轻量，**中英文双语**）。三个功能**默认开启**，可在 **设置 → 通用 →「对话整理」** 中分别开关：

- **消息折叠**：对话区左上角按钮切换「简洁 / 完整」——折叠时每个回合只保留最后一条回答，隐藏思考与工具调用；选择持久化在 localStorage（默认完整）
- **导航条**：对话区右缘短横杠对应每条提问，悬停显示消息摘要、点击跳转、自动高亮，启动时自动加载全部历史
- **总 Token 徽章**：对话区左下角只显示会话总 token（与折叠按钮左对齐、与底部统计行底对齐）；上下文占用 ≥60% 变发送按钮同款色、≥80% 变红并提示"上下文快满了"

## 安全设计

纯浏览器端 DOM 驱动，零核心改动：

- **绝不向 React 管理的 `[data-chat-flow]` 子树插入任何节点**：折叠只改既有元素的 `style.display`；按钮/导航条/徽章挂在 `document.body` 浮动层。
- **observer 收窄**：body 只观察 `childList`，仅 `[data-chat-flow]` 容器观察子树；所有回调 rAF 节流，watchdog 每秒一次完整调度（覆盖对话视图晚挂载的启动顺序）；折叠扫描 ≥150ms 节流。
- **匹配真实 DOM 契约**（对照官方源码）：`flowItem` 内递归找 `[data-chat-call-id]` / `[data-variant="think"]`，排除 `[data-subcalls]` 内子调用；**user / turn-tail 是回合边界**（保持可见）；导航锚点用气泡结构检测（`[class*="bubble"]`）排除 pending steering 与回合尾行。
- 卸载完全还原（恢复所有 display、移除按钮/导航条/徽章、断开观察器）。
- 设置开关：**设置 → 通用 →「对话整理」**（与「语言」「外观」「任务提醒」同级的折叠条目，展开后是三个开关行）——消息折叠 / 导航条 / 总 Token 徽章，状态存 localStorage，切换即时启停对应功能（无需刷新）。
- 国际化：所有用户可见文本注册进官方 locale 服务（`dsh-tidy` 命名空间，中英双语）；切换语言后设置页/导航标签即时重渲染，折叠按钮/导航条提示/徽章文本立即刷新，无需刷新页面。

## 安装

```bash
dsh plugin --profile web add dsh-tidy    # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets@0.4.1
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
```

## 兼容性说明

- 自动加载历史依赖「加载更早」按钮（`button` 文本或 `.Md3f7G_older` 类名回退）——DSH 构建更新后若失效会静默跳过（导航条仍可用，只是不自动加载）。
- 总 Token 徽章读 `session.history` 返回的 `projections.values.tokenUsage/sessionStats`（依赖部署挂载 session-projection 注册表，DSH 默认挂载）；当前会话 id 读 client `sessions` 服务的选中项，拿不到时退回最近更新会话。
- 其余选择器均为官方 data 属性（`data-chat-flow` / `data-chat-call-id` / `data-variant="think"` / `data-time-hover-root` / `data-composer-seat` / `data-conversation-scroll`），跨版本稳定。

## 结构

```
dsh-tidy/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：折叠控制器 + 导航条 + 自动加载 + 总 Token 徽章
└── cordis.patch.yml # bundle 组合补丁
```
