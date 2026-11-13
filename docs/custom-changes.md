# Misskey 定制维护说明

## 基线与范围

- 上游：`misskey-dev/misskey`，正式版 `2026.11.0`（`dd7b4905d7`）。
- 定制仓库：`xxdif/misskey`；`develop` 跟踪上游开发，`custom/main` 保存定制。
- 定制集中于时间线、帖子详情、个人主页、主题、字体及 GHCR 手动发布。
- Node.js 要求 `^24.22.3 || ^26.13.1`，pnpm 为 `12.17.0`。

## 时间线与帖子详情

参考 Sharkey 的作者栏与回复布局，复用 Misskey 原有组件、数据和交互。

- `MkNote.vue`：作者栏位于正文上方，头像随容器宽度采用 48/46/44px；正文行高 1.4，桌面上下留白 18px、手机 14px。操作栏使用 flex 与主题间距，窄卡片支持横向滚动；悬停可用按钮时使用主题强调色。
- `MkNoteHeader.vue`：通过可选 `card` 属性和 `metadata` 插槽排列作者、账号、时间和服务器标签；昵称与账号两行不额外插入行距，与 Sharkey 保持一致；摘要继续使用原有单行作者信息。
- `MkInstanceTicker.vue`：服务器标签采用服务器主题色、5px 圆角、浅色文字和深色文字阴影；长名称省略，窄容器限制文字宽度。
- `MkNoteSub.vue`：摘要使用 48/46/44px 头像，详情回复列表使用 26–36px 头像；尺寸变量统一控制头像、缩进和连接线。`connected` 仅在实际显示的摘要上生成连接标记。
- `MkNoteDetailed.vue`：上下文头像与主帖头像居中对齐，连接线不跨越转发提示或删除占位。账号、角色图标和服务器标签保持同行，长账号省略、角色图标裁切，服务器标签最多占行宽 40%。
- `MkNote.vue`、`MkNoteDetailed.vue`、`MkNoteSimple.vue`：引用框使用实线和共享的 5px 圆角，保留媒体折叠与展开功能。

主时间线和主页帖子列表继续使用上游连续面板、0.5px 分隔线及分页器。主帖头像随顶部作者栏排列；引用内部保留吸顶头像设置。详情主帖头像尺寸、操作区留白、回复加载和五层上限沿用原有规则。

## 个人主页

- `pages/user/index.vue`、`home.vue`：5px 圆角限定在个人主页，资料卡使用半透明面板和横幅阴影；关注、资料字段、备注、统计和下拉刷新复用现有实现。
- `index.timeline.vue`：增加置顶标签，直接读取 `UserDetailed.pinnedNotes`；有置顶时默认显示置顶，否则显示普通帖子。精选、全部和附件沿用原有分页器，置顶随父级资料刷新。
- 分页参数通过独立 computed 读取用户 ID，同 ID 资料刷新不会额外重载帖子，避免与下拉刷新交叠时重复追加。
- `index.files.vue`、`index.activity.vue`：复用 `MkContainer` 的折叠能力，窄布局默认收起、宽布局默认展开。文件列表在正文首次可见时查询，活动图表通过 `MkLazy` 延迟挂载；重复折叠或滚动不会重复加载。
- `notes.vue`：帖子标签栏与主页样式一致，保留原有分页和下拉刷新。

## 主题与字体

- `frontend-shared/themes/` 增加蜜桃汽水、青柠游乐场、晴空俱乐部、葡萄软糖、琥珀电台五组明暗主题，共 10 个 JSON5 文件；在 `frontend-shared/js/theme.ts` 中注册。
- 保留原有内置主题名称、主题 ID、用户选择和实例默认主题配置。葡萄软糖浅色通用面板为 `#f8f5f7`，通过实例「品牌」设置可将其配置为默认主题。
- `public/loader/boot.js` 和 `pages/settings/preferences.vue`：默认使用系统字体，明确以 `t` / `f` 保存开启或关闭偏好。旧版缺失值初始化为开启，明确关闭后可跨刷新和账号切换保留；默认字号仍为上游 14px。
- `style.scss`：增加中英文及 emoji 字体回退，并定义共享引用圆角变量。
- `ui/_common_/navbar.vue`：展开导航文字继承基础字号；导航形状及行高沿用上游。
- `ui/visitor.vue`：停用未登录首页的 GitHub 角标及动画，保留原代码注释供同步时对照。

## GHCR 手动发布

`.github/workflows/docker-custom.yml` 仅接受 `workflow_dispatch`，且限定 `xxdif/misskey` 的 `custom/main`。构建 amd64/arm64 镜像，使用 `GITHUB_TOKEN` 发布至当前仓库的 GHCR 路径。

版本从根 `package.json` 读取，镜像标签为 `<version>-xxdif.<run_number>` 和 `sha-<commit>`；正式版使用 `latest`，预发布使用 `edge`。

## 差异与同步原则

定制相对 `2026.11.0` 限于上述前端、主题、测试、维护说明和独立工作流。后端、API 生成类型、数据库迁移、依赖锁文件及 `AGENTS.md` 与上游一致。

复用现有 `Paginator`、`MkContainer`、`MkLazy` 和可见性指令；不增加接口、资料字段、全局状态或组件副本。新增三个单测文件分别覆盖字体偏好、主页面板延迟加载、资料与时间线交叠刷新。

同步上游时备份本地补丁与历史，默认 merge 新 tag，逐项检查 `[custom]` 标记和上述组件。重点保留主题 ID、字体偏好、分页刷新约束和可见性加载条件；已有等价上游实现时再收敛定制。纯停用的上游代码保留为带原因的注释。

## 验证

- Node 24.22.3 / pnpm 12.17.0 下完成 frozen install、全仓构建、前端类型检查和 API 类型生成，以及 7 项后端 identicon 单测。
- 21 项前端定向测试通过，覆盖主题、字体、主页面板延迟加载与时间线刷新；变更文件 lint、SPDX 和 locale safety 通过。
- 隔离 PostgreSQL 18 完整迁移、最新迁移回退重跑及 schema 检查通过，未改动现有数据库。
- 浏览器验证沿用既有桌面及窄屏组件检查记录；本次整理未重新执行完整浏览器 E2E，未部署或触发镜像发布。
