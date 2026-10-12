# 通用分镜渲染引擎 v2

当前竖屏口播优先采用 `scene.editorial`：主题素材图层、共享相机、曲屏证据、精确表面开窗、可变数量胶片与竖向人物窗。`editorial` 的动作使用场景局部秒数，允许负时间预演；字幕与场景边界使用整片时间。使用 Skill 生成本期工程时，`src/episode.json` 会被本期数据替换；下述客户问题示例仅指模板原始示例。日常直接按内容剪辑，必要成片检查后交视频，不默认要求参考对照报告。

本目录是独立 Remotion 工程。`src/episode.json` 决定每期主题、镜头顺序、时长、字幕、对象、媒体、动作落点和人物状态；没有旧案例职业叙事或固定 10.74 秒时间轴。默认 18.6 秒客户问题整理示例是静音草案，不能作为已实测成片。

```sh
npm ci
npm run check
npm run dev
node render.cjs 1.2 6.5
node render.cjs
```

Composition 为 `AdaptivePortrait`。全片输出 `out/adaptive-portrait.mp4`；数字参数单位为秒，输出 `out/frame-<seconds>.png`。在任意工作目录调用该脚本都会以工程目录解析路径。可用环境变量 `REMOTION_BROWSER_EXECUTABLE` 指定已有 Chromium/Edge；`RENDER_CONCURRENCY` 指定正整数并发数。首次没有浏览器时 Remotion 可能需要下载渲染浏览器。字体通过固定版本的本地 npm 包加载，镜头和素材不请求外部服务。

## 数据和时间

- 按 `duration` 和 `fps` 计算 `ceil(duration * fps)` 帧。画布读取 v2 的 1080 × 1920，内部逻辑坐标为 540 × 960。
- `objects` 的身份、形状、标签、细节和 `assetId`；`scenes` 的机制、引用顺序、标题、人物、度量、资料；每个 `beat` 的 `action/at/targetId/withId` 均参与绘制或运动。动作开始于落点前，`at` 时完成；一个对象的多次移动依次累计。
- `captions` 按根时间播放；`cueIds/cueId` 与 `intent` 是编译器的校验/语义信息，不另行生成旁白文字。`title` 为项目标题元数据；画面标题来自每镜 `title`。
- `voice` 是唯一主声音，`music` 可选并以 0.14 音量铺底；人物始终静音。音频和人物视频均放在全片根时间轴，不随切镜重启。人物层、字幕层不受世界镜头或曲屏滤镜影响。
- `theme` 的四个颜色可替换默认近白、墨黑、铁锈橙、浅紫。`renderMode:'draft'`、未实测时间、demo来源、缺失旁白或必需人物时始终显示草案角标。

## 八类机制

| 机制 | 自动布局和语义动作 |
| --- | --- |
| object-focus | 单主体大物件、多物体主从构图；focus 推近指定物体，result 给出落点反馈 |
| compare-pan | 按对象数排列物理纸面；分别推近被 focus/select 的对象，再拉回保留比较关系 |
| route-transfer | 根据 transfer 的 target/with 确定移动物与终点，第三对象为起点；同一物沿弧线移动到终点 |
| group-sort | 根据 group.withId 确定容器；多个条目分别归入可见叠放槽位，容器后置 |
| evidence-zoom | 真资料图或显式“示意界面”；屏幕外壳、顶部栏、内容一起曲屏畸变与镜头推近 |
| metric-build | 只读取 metric.value/total/unit；count 在指定落点完成计数，具有整体值时显示部分进度 |
| question-thread | 浅紫漫画关系构图；同一对象保持身份，connect 按口播连接对象，连线终点随对象运动 |
| presenter | 供开场/停顿/结尾；full 画面保持人物清楚，pip 为左下圆形，hidden 隐藏人物层 |

`transition` 属于**离开的镜头**。circle/window 在该镜结尾最多 0.46 秒内揭示下一镜的真实起始内容，旧场景保留在窗口外；不会先铺纯色再换镜。match 根据相邻镜头相同对象 id 对齐位置和大小，然后平滑进入新构图。没有共享对象的 match 等同普通切换。cut 直接切镜。

## 素材与扩展边界

每个媒体路径相对于 `public/`，缺失文件会明确失败。对象 `assetId` 优先于十类基础图形；本期插图/品牌图保留原透明轮廓，证据图使用物理边框。实际支持静态 SVG、PNG、JPEG、WebP；资料截图按 contain 完整展示。资产视频、动画 GIF、外部 URL、网页互动、智能抠图和3D模型不在此版支持范围。主人物可用 Remotion 支持的视频，主旁白可用本地声音文件。

十类基础物体是可复用图形，不等于真实产品外观；具体品牌、接口、截图请提供本期图像。无资料时只生成带“示意”标识的图解；无人物时显示明确素材占位。工具不会创造来源、台词或统计数据。图片中的焦点自动按对象布局位置给出；需要准确点击截图中的某个像素区域时，应扩展专用机制和契约字段。

最多六对象的布局是可解释的基础动作字典。极长标签、密集短镜或全新叙事结构仍需在预览中调整分镜，必要时扩展 `SceneView.tsx`/`timeline.ts`。这套引擎复用 V3 的物理线条、层次、镜头和真实内容转场方法，不保证任意输入自动达到逐镜艺术指导或原案例逐像素复刻。
