# 已认可 V3 的竖屏口播机制样例

这是 2026-10-10 用户认可的 V3 历史案例机制提取。不是新的主题成片，也没有附带原用户人物、口播、克隆声音或访谈截图。默认运行会看到明确标注的「待放入口播视频」图块与中性访谈占位图，输出静音。

## 运行

```shell
npm ci
npm run check
npm run dev
npm run render
```

`npm run render -- 0.6 2.8 5.6 7.6 9.8` 可导出这些时间点的静帧。默认完整导出是 `out/presenter-v3-example.mp4`。首次安装依赖和 Remotion 浏览器可能联网；依赖与浏览器已缓存后，本项目仅引用本地字体和素材，可离线导出。也可由调用环境提供 `REMOTION_BROWSER_EXECUTABLE` 指定本机已有兼容浏览器；不要把作者机器路径写进源代码。

## 媒体接口

修改 `src/mediaConfig.ts`，所有非空路径均相对于 `public/`：

```ts
presenterVideo: 'media/presenter.mp4',
voiceTrack: 'media/voice.wav',
referenceImage: 'media/interview-placeholder.svg',
```

- `presenterVideo: string | null`：默认 `null`，显示人物占位图。人物视频始终静音且使用统一时钟连续播放，不因换镜头重启。适配新片应重设裁切，避免遮脸、手势和字幕。
- `voiceTrack: string | null`：默认 `null`。只有此轨输出声音；人物自带音轨不会同时混入。需要源口播时先单独提取，再填到这里。提供至少覆盖目标时长的媒体。
- `referenceImage: string`：默认 `media/interview-placeholder.svg`，由项目自身绘制，不是真实照片。访谈全屏、圆形照片框及胶片格都读取同一配置。现有裁切按 **2992 × 1060 双人画布**设计；换图需要按实际主体重画裁切，不能只改路径。

有真实素材后，还必须依据新稿重新导演镜头、字幕与音效，才具备正式成片条件。

## 本例边界与时点

固定 **1080 × 1920 / 50 fps / 537 帧（10.74 秒）**，字幕和所有镜头都是历史「想去 OpenAI 上班」案例的专用时点。`captions.json` 保留该段历史台词，不能被当作新选题文案。帧数、字幕 cue、关键词事件、场景分界和人物运动须一起改，不能拉长音乐或复制动画来适配长稿。

| 历史时间 | 可复用的机制 | 换主题须重做 |
| --- | --- | --- |
| 0–2.28 s | 人物先建立注意力，品牌纸牌推近带出下一景 | 人物裁切、品牌/实物、关键词落点 |
| 2.04–4.35 s | 同一世界坐标中的推近、回拉，分别看清条件 | 语义物件、镜头焦点、可读停留 |
| 4.15–6.32 s | 场景路线与公文包行动，包面撑开为下个视窗 | 原因→行动→结果的对象关系 |
| 6.14–8.39 s | 曲面访谈屏、扫描纹理、轻暗角与时长重音 | 可追溯真实材料、可读UI、强调数字 |
| 8.08–10.74 s | 整屏漫画切换，问号牵线进入胶片，末端打结落版 | 这一稿的核心问题、信息串联路径 |

保留的是连续对象接力、主次大小、速度对比、材质和结果停留，不是每条视频都必须出现公文包、求职、访谈或问号。不要退回到每句字幕配一张卡的静态 PPT。

## 文件与来源

- `src/FilmV3.tsx`：总时钟、镜头/蒙版、曲面屏、人物层、字幕；时间只来自 Remotion `useCurrentFrame()`。
- `src/CareerActionV3.tsx` / `src/ComicThreadV3.tsx` / `src/PropsV2.tsx`：本地矢量原生机制，直接按绝对时间求状态，可 seek。
- `src/PresenterPlaceholder.tsx` / `public/media/interview-placeholder.svg`：原创中性占位素材，不涉及真实人物。
- `public/media/lens-map-v3.png`：程序生成的径向位移图；曲面屏的数学滤镜数据，不是参考截图。
- `public/media/openai-wordmark.svg`：历史案例所用 OpenAI 官方黑色字标。来源 https://openai.com/brand/ 与 https://cdn.openai.com/brand/OpenAI-Logos-2025.zip 。商标归原权利人；新主题应换成对应真实来源材料。本样例不构成品牌背书。
- 字体通过已锁定的 `@fontsource` 包本地加载；随对应包附带许可证。没有 CDN 字体加载。
- `package-lock.json` 与包名/版本一致，保留既有已固定依赖版本。无真实音频、人物视频、密钥、签名URL、浏览器或 node_modules。

## 验证口径

源码检查、占位渲染成功只证明机制可运行，不能证明新主题已制作、真实人物口型准确、完整主观音画审查通过或平台准许发布。历史 V3 的用户风格认可不能自动转移到新成片。交付前按新项目核对可读画面、完整解码、音轨单次播放、字幕边界及素材来源。
