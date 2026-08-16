# dsh-gadgets

聚合包：一条命令同时启用 **dsh-skin**（外观定制）、**dsh-tidy**（对话整理）与 **dsh-task-alerts**（任务提醒）。

## 安装

```bash
dsh plugin --profile web add dsh-gadgets@0.4.1
```

> 锁版本可避免装到旧版（registry 正常时可不写版本号）。

装完重启 `dsh web` 进程，再硬刷新页面（Ctrl+F5）。

## 单独安装某个插件（与聚合包二选一，不要混装）

```bash
dsh plugin --profile web add dsh-skin        # 外观定制
dsh plugin --profile web add dsh-tidy        # 对话整理
dsh plugin --profile web add dsh-task-alerts # 任务提醒
```

## 包含的插件

- **dsh-skin 外观定制**：15 套预设皮肤、亮暗切换、字号四档、13 个颜色角色微调，中英文双语
- **dsh-tidy 对话整理**：消息折叠、右侧导航条（自动加载历史）、左下角总 Token 徽章，三个功能可分别开关，中英文双语
- **dsh-task-alerts 任务提醒**：任务完成 / 出错 / 需要审批 / 等待回答时提示音 + 弹窗，每事件独立开关与音色，中英文双语

详见各子包 README。

> 0.4.1 起自动加载；旧版本需手动往 `cordis.patch.yml` 插行。升级前若已手动插过行，先移除旧行再安装。
