# dsh-notify

DSH（DeepSeek Harness）任务提醒插件（轻量，纯浏览器端，**中英文双语**）：**任务完成 / 出错 / 需要审批 / 等待回答** 时发出**提示音**并弹出**提示窗口**，人不在电脑前也能第一时间知道。实现思路参考社区同类插件（dsh-notification、dsh-win-notify、dsh-notify-sound、dsh-notify-bark）并与官方 client 快照对齐。

- **任务完成**：会话运行彻底结束时（含审批等待、子代理运行在内的整轮任务）播放提示音，并弹出「任务完成」通知——**前台也提醒**（默认；如需不打扰可开启「仅页面不在前台时提醒」）。完成边沿会自动查 `session.history` 中最近 `turn/end` 的原因区分结束语义：**手动停止（aborted）静默不算完成**；**出错（error）单独红色 ✕「任务出错」通知**；**阻塞（blocked）「任务阻塞」通知**。
- **需要审批 / 计划待审**：会话出现待审批操作时播放提示音，弹出「需要审批」通知，并给标签页标题附加 `⚠ 需要审批` 标记（全部解决后自动还原）——**始终提醒**，不会错过。审批/回答类提醒**延迟约 2.5 秒**才响：快速自动决定（或你已当场处理）的不打扰，期间已解决会自动取消。
- **等待回答**：模型向你提问（`ask_user`）时播放提示音，弹出「等待回答」通知——同样始终提醒。
- **中英文**：界面与通知文本跟随 DSH 语言设置（zh/en）自动切换；语言设置不可用时默认中文。

## 提醒方式

- **提示音**：Web Audio 合成的**音色库**（**零音频资源**，不打包任何声音文件）——6 种音色可选：**叮咚 / 清脆 / 三连音 / 闷响 / 柔和 / 电子哔**（英文界面显示 Ding / Chime / Triple / Deep / Soft / Beep）；**音量滑条**可调（**默认 50%**，调整后记住上次的音量）；音频上下文在首次点击页面时解锁，符合浏览器自动播放策略。
- **弹窗**：**页面内右上角悬浮提示始终显示**（最可靠的弹窗，点击可跳转该会话，8 秒自动消失，最多同屏 4 条）；浏览器 **Notification** 已授权时作为附加通道（人不在电脑前也能收到系统通知），未授权也不影响页面弹窗。
- **设置**：设置 → 通用 → **「任务提醒」**（与「语言」「外观」「Agent 预设」同级的第二层条目）：每个事件一行 = **开关 + 说明 + 音色下拉 + 试听**（合并成一个部分）——任务完成 / 需要审批 / 等待回答 / 任务出错四个事件各自独立开关与音色，外加提示音开关 + 音量滑条、「仅页面不在前台时提醒」开关（默认关，前台也提醒）、通知弹窗开关，以及测试按钮（发测试通知、授权浏览器通知）；全部 **localStorage** 持久化，重启不丢（旧版设置自动迁移）。

## 工作原理

信号直接读官方 client **sessions 列表快照**（`sessions.list`，与官方侧栏同源，无需自定义 host API）：

- 结束 = 顶层会话 `running` 位 **true→false**。官方 `running` 在整个任务（含审批等待、子代理）期间保持 true，回合之间不翻转，任务彻底结束才翻 false——不会中途误报；首次观察只记录状态、不提醒（重启不轰炸）。
- 结束语义 = 边沿触发后查 `session.history` 最近一条 `turn/end` 的 `reason.kind`（`completed` / `error` / `aborted` / `blocked` / `max-tokens` / `interrupted`）：**手动停止不提醒**、出错单独提示、阻塞单独提示（参考 dsh-win-notify / dsh-notify-bark 的事件语义）；历史拉取失败时保守按完成处理。
- 审批/回答 = 会话 `pendingInteraction` 从无到有的边沿（`approval` / `plan-review` / `question`），延迟约 2.5 秒再响，期间消失自动取消（参考 dsh-win-notify 的 `approvalWaitMs` 防打扰）。

安全设计：只读官方快照 + 自身状态机，不碰 React 树、不注入任何节点到 `[data-chat-flow]`；悬浮提示挂在 `document.body` 浮动层；卸载完全还原（移除样式/悬浮层/订阅/监听/定时器，恢复页面标题）。

## 安装

```bash
dsh plugin --profile web add dsh-notify   # npm 发布版
# 或聚合包：dsh plugin --profile web add dsh-gadgets
# 或 GitHub 调试：dsh plugin --profile web add github:Highjobop/dsh-gadgets#path=dsh-notify
```

或手动：包放 `~/.dsh/profiles/node_modules/dsh-notify`，在 `cordis.patch.yml` 加一行 `- insert: [{ id: dsh-notify, name: dsh-notify }]`，重启 DSH。

## 兼容性说明

- 依赖官方 client `sessions` 服务列表快照的 `byId[*].running / pendingInteraction / parentId / origin` 字段（与官方侧栏状态同源，跨版本稳定；DSH 构建更新后若字段改名，状态检测会静默失效，请按新版源码更新）。
- 结束语义依赖 `session.history` 返回的最近 `turn/end` 事件（DSH 默认挂载）；拉取失败时保守按完成处理，不影响基本提醒。
- 设置条目挂官方 `settings.general.item` 槽（与「语言」「外观」同级，参考 dsh-skin 的折叠行样式）；槽不可用时插件其余功能不受影响。
- 浏览器通知需用户授权；授权被拒时自动使用页面内悬浮提示，功能不缺失。

## 结构

```
dsh-notify/
├── package.json     # dsh.client 声明
├── lib/index.js     # host 半边（空激活载体）
├── lib/client.js    # 浏览器半边：状态机检测 + 音色库 + 弹窗/悬浮提示 + 设置页
└── cordis.patch.yml # bundle 组合补丁
```
