# 已认可的竖屏编辑式讲解案例（静音）

本工程保留用户于 2026-10-09 认可的 V4 视觉及字幕动作时间。用于观察、编辑和迁移动作机制；它不是可直接发布的新一期成片，也不是只替换标题就能泛用的模板。

## 使用

```shell
npm ci
npm run check
npm run dev
npm run render
```

导出 `out/approved-reference-silent.mp4`。`ApprovedReference` 为 816×1080、30 fps、1800 帧（60 秒）；内部舞台为 544×720，并整体放大 1.5 倍。这是原案例的真实比例，**不是 9:16**。做 1080×1920 新片时，应重新布置安全区、镜头、字幕和对象轨迹，不能直接纵向拉伸此例。

## 包含与改动

- 保留已认可的 `SyncedOpening`、`SyncedResearchEditor`、`SyncedProof`、`SyncedComic`、`CalibratedPosters` 及 39 条原字幕。
- 从原共享 `KineticOpening` 单独提取 `PaperRelay` 及其内部绘图/缓动依赖，移除未参与 V4 的旧场景。
- 字体导入独立为 `fonts.ts`，不再通过旧 `Film` 载入早期场景。
- 删除音频组件，默认静音；不含阿刁声音、声音克隆样本、音乐、私人路径或原参考视频。字幕时间仍保留原旁白依据，不应拿来对齐任意新音频。
- 所有动画由 Remotion 帧数计算，没有依赖墙上时钟或随机执行时间。渲染不调用任何声音/图像生成服务。
- `package-lock.json` 保留原案例依赖版本，只修改根项目名称；安装依赖需要访问 npm 镜像。

## 资产来源

只有两个图像资产：

1. `public/assets/catalog-page.png`：历史案例使用的 OpenAI 数学目录第一页图片，来自 [官方 overview.pdf](https://github.com/openai/math/blob/main/overview.pdf)，在原项目中于 2026-10-09 下载、转为图片。保留上游 Apache 2.0 许可证 `public/assets/math-license.txt`。不是本技能的通用背景图。
2. `public/assets/kinetic-opening/lens-map.png`：程序生成的鱼眼位移场，控制模拟编辑器的曲面畸变；不含原参考视频画面。

SHA256 与文件大小记录在 `asset-manifest.json`。其余纸张、符号、镜头、漫画对象由本地 React/SVG 代码生成。字体来自锁定的 Fontsource npm 包；字体许可随依赖安装保留。

## 内容事实边界

OpenAI、719、372、300、42%、三篇撤回、14 篇修订，以及片中日期，都是本例制作时的历史讲稿内容。此包不重新核验这些事实，也不证明它们适用于当前日期；新视频必须替换讲稿、重新查证来源，并从新音频建立语义时间轴。历史来源：[发布文章](https://openai.com/index/sharing-ai-progress-in-mathematics/)、[研究仓库](https://github.com/openai/math)、[历史更新](https://github.com/openai/math/blob/main/history.md)。

## 迁移方式

先观察“同一对象在字幕关键词到来时改变状态”的关系，再按新主题重新设计对象：选中 → 拖出 → 归组，结果 → 验证，错误 → 撤回/修订，研究页 → 证明 → 检查 → 修改。只迁移动作语法与视觉质量，不机械保留数学内容、开头三张纸、60 秒时长或全部固定时间。
