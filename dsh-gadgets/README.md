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

- **dsh-skin 外观定制**：15 套预设皮肤、亮暗切换、字号四档、13 个颜色角色微调，中英文双语
- **dsh-tidy 对话整理**：消息折叠、右侧导航条（自动加载历史）、左下角总 Token 徽章，三个功能可分别开关，中英文双语
- **dsh-task-alerts 任务提醒**：任务完成 / 出错 / 需要审批 / 等待回答时提示音 + 弹窗，每事件独立开关与音色，中英文双语

详见各子包 README（`dsh-skin/README.md`、`dsh-tidy/README.md`、`dsh-task-alerts/README.md`）。

> 若之前已手动安装过 dsh-skin/dsh-tidy/dsh-task-alerts（cordis.patch.yml 已有对应行），
> 装聚合包前先移除旧行，避免重复插入。
