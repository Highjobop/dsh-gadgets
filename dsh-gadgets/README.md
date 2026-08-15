# dsh-gadgets

聚合包：一次安装同时启用 **dsh-skin**（外观定制）、**dsh-tidy**（对话整理）与 **dsh-notify**（任务提醒）。

```bash
dsh plugin --profile web add dsh-gadgets
```

装完重启 dsh web 即可。只想用其中一个，也可以单独安装：

```bash
dsh plugin --profile web add dsh-skin    # 外观定制
dsh plugin --profile web add dsh-tidy    # 对话整理
dsh plugin --profile web add dsh-notify  # 任务提醒
```

> 若之前已手动安装过 dsh-skin/dsh-tidy/dsh-notify（cordis.patch.yml 已有对应行），
> 装聚合包前先移除旧行，避免重复插入。
