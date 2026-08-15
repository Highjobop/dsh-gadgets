# dsh-task-alerts

DSH（DeepSeek Harness）任务提醒插件（轻量，纯浏览器端，**中英文双语**）：**任务完成 / 出错 / 需要审批 / 等待回答** 时发出**提示音**并弹出**提示窗口**，人不在电脑前也能第一时间知道。实现思路参考社区同类插件（dsh-notification、dsh-win-notify、dsh-notify-sound、dsh-notify-bark）并与官方 client 快照对齐。

- **任务完成 / 出错 / 阻塞**：整轮任务结束（含审批等待、子代理）播放提示音 + 弹窗，**手动停止不算完成**，出错/阻塞单独提示；前台也提醒（可开「仅后台提醒」）
- **需要审批 / 等待回答**：待审批、计划待审或模型提问时播放提示音 + 弹窗，标签页标题附加 ⚠ 标记——始终提醒
- **中英文**：界面与通知文本跟随 DSH 语言设置（zh/en）自动切换

## 提醒方式

- **提示音**：Web Audio 合成的音色库（零音频资源）——6 种音色可选、音量滑条可调（默认 50%）
- **弹窗**：浏览器 Notification；未授权自动改用页面内右上角悬浮提示（点击可跳转会话）
- **设置**：设置 → 通用 →「任务提醒」——完成/审批/回答/出错四个事件独立开关与音色，外加提示音/音量/弹窗开关与测试按钮，localStorage 持久化

## 工作原理

信号直接读官方 client **sessions 列表快照**（`sessions.list`，与官方侧栏同源，无需自定义 host API）：

- 结束 = 顶层会话 `running` 位 **true→false**。官方 `running` 在整个任务（含审批等待、子代理）期间保持 true，回合之间不翻转，任务彻底结束才翻 false——不会中途误报；首次观察只记录状态、不提醒（重启不轰炸）。
- 结束语义 = 边沿触发后查 `session.history` 最近一条 `turn/end` 的 `reason.kind`（`completed` / `error` / `aborted` / `blocked` / `max-tokens` / `interrupted`）：**手动停止不提醒**、出错单独提示、阻塞单独提示（参考 dsh-win-notify / dsh-notify-bark 的事件语义）；历史拉取失败时保守按完成处理。
- 审批/回答 = 会话 `pendingInteraction` 从无到有的边沿（`approval` / `plan-review` / `question`），延迟约 2.5 秒再响，期间消失自动取消（参考 dsh-win-notify 的 `approvalWaitMs` 防打扰）。

安全设计：只读官方快照 + 自身状态机，不碰 React 树、不注入任何节点到 `[data-chat-flow]`；悬浮提示挂在 `document.body` 浮动层；卸载完全还原（移除样式/悬浮层/订阅/监听/定时器，恢复页面标题）。

> 多标签页说明：每个打开的 DSH 标签页会各自检测并提醒一次（浏览器限制，插件无法跨标签页去重）；建议只保留一个前台标签页，或把不用的标签页关掉。

## 安装

```bash
dsh plugin --profile web add dsh-task-alerts   # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-task-alerts
```

或手动：包放 `~/.dsh/profiles/node_modules/dsh-task-alerts`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-task-alerts, name: dsh-task-alerts }]`，重启 DSH。

## 兼容性说明

- 依赖官方 client `sessions` 服务列表快照的 `byId[*].running / pendingInteraction / parentId / origin` 字段（与官方侧栏状态同源，跨版本稳定；DSH 构建更新后若字段改名，状态检测会静默失效，请按新版源码更新）。
- 结束语义依赖 `session.history` 返回的最近 `turn/end` 事件（DSH 默认挂载）；拉取失败时保守按完成处理，不影响基本提醒。
- 设置条目挂官方 `settings.general.item` 槽（与「语言」「外观」同级，参考 dsh-skin 的折叠行样式）；槽不可用时插件其余功能不受影响。
- 浏览器通知需用户授权；授权被拒时自动使用页面内悬浮提示，功能不缺失。

## 结构

```
dsh-task-alerts/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：状态机检测 + 音色库 + 弹窗/悬浮提示 + 设置页
└── cordis.patch.yml # bundle 组合补丁
```
