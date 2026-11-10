# 更新日志

## v2.1.0 - 2026-11-10

- 在“我的 Bug 总览”增加跨分页保留的多选能力，并提供本页兼容项全选、清空选择和已选批次提示。
- 新增“批量流转所选”桥接：从跨项目总览带入所选 Bug 后，自动打开独立批量流转工作区，避免总览与复杂流程表单挤在同一界面。
- 同一批次强制限制为同一项目、同一 Tracker、同一流程状态；首条选择会锁定兼容范围，不兼容项自动禁用。
- 新增 `/api/bugs/selected` 接口，只读取所选 Bug 的完整 Item 与字段数据，并验证项目、Tracker 归属，避免重新加载整个 Tracker。
- 统一普通 Tracker 选择与跨项目总览的 Bug/Defect Tracker 识别逻辑。

## v2.0.0 - 2026-11-10

- 工具升级为“我的 Bug 工作台”，登录后默认跨项目汇总当前用户相关的 Bug。
- 新增 `/api/my-bugs` 聚合接口：读取全部可访问项目、识别 Bug Tracker，并按当前用户 ID、邮箱和用户名匹配负责人、创建人、Owner、Bug Analyzer、Bug Tester、Bug Approver、Reporter 等关系。
- 新增项目、本人角色、状态、关键词筛选及独立分页，并显示未关闭数量、涉及项目和关联角色统计。
- 新增 CodeBeamer 当前用户登录标识、跨项目扫描统计和部分项目读取失败警告；单个项目、Tracker 或 Item 失败时不再中断整个总览。
- 页面重构为“我的 Bug 总览 / 批量流转工具”双视图，原有单 Tracker 批量流转、字段填写、校验和回读功能继续保留。
- 更新页面标题、使用说明和响应式样式。
## v1.0.7 - 2026-07-03

- 将 `runtime/node.exe` 纳入 GitHub 源码仓库，使 clone 后的仓库也能直接运行 `launch-local.bat`，无需额外安装 Node.js。
- 调整 `.gitignore`，继续忽略 `release/` 发布包，但保留根目录 `runtime/` 作为运行依赖。

## v1.0.6 - 2026-07-03

- 在 Bug 列表工具栏新增 `刷新列表` 按钮，可在当前项目和 Bugs Tracker 下重新从 CodeBeamer 拉取 Bug 数据。
- 刷新时保留当前筛选条件并重新应用筛选，同时清空已勾选 Bug 和校验结果，避免 CodeBeamer 页面外部操作后列表状态不同步。

## v1.0.5 - 2026-06-10

- 兼容不同 Bugs Tracker 的 `Status` 枚举差异，`Implementing` 与旧拼写 `Implmenting` 会根据当前 item 可用选项自动匹配，回读校验也视为等价。
- 将关闭态统一对齐为 CodeBeamer 真实枚举 `Closed`，并兼容旧的 `Close` 写法。
- 优化 `Bug Analyzer` 筛选记忆：首次登录默认填充当前用户邮箱，已有记忆时恢复上次内容，最近记录保留 3 条去重值，并支持将空白筛选作为一种历史状态。
- 在逐条填写区域为每个 Bug 标题添加真实 CodeBeamer 链接，点击后可在新标签页打开对应 Bug，便于填写根因、方案和 Comment。
- 为 `WikiTextField` 写入增加 CodeBeamer Wiki 文本格式化，普通文本会自动套用字体、字号和颜色样式，并在回读校验时忽略格式标记差异。
- 新增当前用户开机自启安装与卸载脚本：`install-startup.bat` / `uninstall-startup.bat`。
- 补充 GitHub 源码管理说明，并整理 `.gitignore` / `.gitattributes`，避免运行日志、发布包、导出 JSON 和本地分析文档入库。

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
