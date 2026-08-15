# dsh-gadgets

聚合包：一次安装同时启用 **dsh-skin**（外观定制）、**dsh-tidy**（对话整理）与 **dsh-task-alerts**（任务提醒）。

```bash
dsh plugin --profile web add dsh-gadgets
```

装完重启 dsh web 即可。只想用其中一个，也可以单独安装：

```bash
dsh plugin --profile web add dsh-skin    # 外观定制
dsh plugin --profile web add dsh-tidy    # 对话整理
dsh plugin --profile web add dsh-task-alerts  # 任务提醒
```

## 包含的插件

- **dsh-skin 外观定制**：15 套预设皮肤（亮/暗各一套）、亮暗/跟随系统切换、字号四档（覆盖官方硬编码界面文字）、13 个颜色角色取色器 + HEX 微调、界面控件联动换肤；中英文双语，localStorage 持久化。
- **dsh-tidy 对话整理**：消息折叠（每回合只留最后一条回答）、右侧导航条（悬停提示 + 自动加载历史）、左下角总 Token 徽章（上下文占用 ≥60%/≥80% 变色警示）；三个功能可在 **设置 → 通用 →「对话整理」** 中分别开关；中英文双语。
- **dsh-task-alerts 任务提醒**：任务完成 / 出错 / 需要审批 / 等待回答时播放提示音（Web Audio 合成，零音频资源）+ 弹出通知；手动停止不算完成；每事件独立开关与音色、音量可调；中英文双语。

详见各子包 README（`dsh-skin/README.md`、`dsh-tidy/README.md`、`dsh-task-alerts/README.md`）。

> 若之前已手动安装过 dsh-skin/dsh-tidy/dsh-task-alerts（cordis.patch.yml 已有对应行），
> 装聚合包前先移除旧行，避免重复插入。
