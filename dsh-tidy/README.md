# dsh-tidy

DSH（DeepSeek Harness）对话整理插件（轻量，**常开无开关**）：

- **消息折叠**：对话区左上角一个按钮切换「简洁 / 完整」。折叠时**每个回合只保留最后一条 assistant 回答**——中间的思考过程、工具调用、中间输出全部隐藏；展开则全部显示。选择持久化在 **localStorage**（默认完整），重启后保持。
- **导航条**：对话区右缘一列**短横杠节点**（每个节点对应一条你的提问），**悬停才读取该消息前几个字**作为提示（懒加载，不拖慢页面），点击平滑跳转，当前阅读位置自动高亮；容器可滚轮上下滑动（上限 100 个节点）。启动时**轻量自动加载历史**：按钮就绪（非加载中）才点击、最多 8 页、内容不再增长即停、12 秒硬上限——加载期间横杠实时增长且页面不卡顿。注：DSH 自动压缩（compaction）会把旧回合并入摘要块，压缩后的提问在 DOM 中不再是独立行，导航条只统计真实渲染出的提问行。
- **总 Token 徽章**：对话区左下角圆角矩形，**只显示会话总 token**（输入 + 输出，切换会话立即刷新、同一会话 10 秒低频轮询、页面隐藏时暂停，数据读官方 `session.history` 投影）。左缘与折叠按钮对齐，底缘与底部统计行（"74 轮 · 757 步"）对齐；统计行在会话运行中不渲染时自动退回对齐对话列底边。

## 安全设计

纯浏览器端 DOM 驱动，零核心改动：

- **绝不向 React 管理的 `[data-chat-flow]` 子树插入任何节点**：折叠只改既有元素的 `style.display`；按钮/导航条/徽章挂在 `document.body` 浮动层。
- **observer 收窄**：body 只观察 `childList`，仅 `[data-chat-flow]` 容器观察子树；所有回调 rAF 节流，watchdog 每秒一次完整调度（覆盖对话视图晚挂载的启动顺序）；折叠扫描 ≥150ms 节流。
- **匹配真实 DOM 契约**（对照官方源码）：`flowItem` 内递归找 `[data-chat-call-id]` / `[data-variant="think"]`，排除 `[data-subcalls]` 内子调用；**user / turn-tail 是回合边界**（保持可见）；导航锚点用气泡结构检测（`[class*="bubble"]`）排除 pending steering 与回合尾行。
- 卸载完全还原（恢复所有 display、移除按钮/导航条/徽章、断开观察器）。

## 安装

```bash
dsh plugin --profile web add dsh-tidy    # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-tidy
```

或手动：包放 `~/.dsh/profiles/node_modules/dsh-tidy`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-tidy, name: dsh-tidy }]`，重启 DSH。

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
