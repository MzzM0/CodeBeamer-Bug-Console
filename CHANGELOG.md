# 更新日志

## v1.0.4 - 2026-06-03

- 取消页面心跳触发的自动关闭机制，本地服务只通过 `stop-local.bat` 手动关闭。
- `Bug Analyzer` 默认筛选值改为通过当前登录用户解析邮箱，避免首次自动填入工号导致筛选不到结果。
- 新增 `/api/current-user` 本地代理接口，用于只读获取当前 CodeBeamer 登录用户信息。
- 优化切换用户名时的 `Bug Analyzer` 自动填充行为：系统自动填充值会随用户刷新，手动输入值不被强制覆盖。

## v1.0.3 - 2026-05-29

- 新增项目与 Bugs Tracker 的上次选择记忆，减少重复选择操作。
- 增强 `Analyzing -> Decision` 流转表单，支持 `Bug Tester`、可选的 `Bug Initial Investigation`，以及 `Comment` 的统一填写与逐条填写切换。
- `Bug Impacted Team` 改为多选，并在界面中补充 `按住 Ctrl 可多选` 的中文提示。
- 优化筛选与选择联动逻辑，当项目、Tracker、Affected Variant/s 或状态变化时自动清空已勾选 Bug，避免误操作。
- 优化界面布局、历史输入记忆与回显体验，并继续保留免安装 Node 的发布方式。

## v1.0.2 - 2026-05-28

- `Analyzing -> Decision` 中的 `Comment` 改为可选项，留空时本次不添加 Comment。
- 修复评论接口提交方式，改为使用 `multipart/form-data` 调用 CodeBeamer 的 comments API。
- 修复多行文本回读校验，将 `LF` 与 `CRLF` 视为等价，避免误报失败。
- 调整页面双栏布局，避免左侧区域被右侧 Bug 列表拖拽错位。
- 保留免安装 Node 的本地运行方式，并更新发布包到 `v1.0.2`。

## 约定

- 后续每次升版打包时，都会同步更新本文件。
