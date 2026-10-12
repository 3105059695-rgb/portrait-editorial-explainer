# 轻量模型独立分镜试用

使用 `gpt-6-luna`，推理等级 `low`，在没有本任务历史上下文的独立执行中测试。它只得到 Skill 入口和以下六句字幕/演示时点，被要求不查看 `examples/storyboards`、不修改 TSX 或校验器。

| 字幕 | 演示区间（秒） |
| --- | --- |
| 拍完旅行照片，先别急着全发出去。 | 0–2.4 |
| 把模糊和重复的照片挑出来。 | 2.4–5.7 |
| 再把保留下来的照片按地点分组。 | 5.7–8.9 |
| 从每组里选出最能讲故事的一张。 | 8.9–12.0 |
| 把它们连起来，再看顺序是不是自然。 | 12.0–15.6 |
| 最后保留原图，导出要分享的版本。 | 15.6–19.2 |

模型读取了 `SKILL.md`、导演手册、分镜契约及校验 CLI 帮助。生成 [travel-photo.json](travel-photo.json)，首次 draft 校验 0 错误、3 条预期草案警告，未修改校验器，未修复结构数据。无真实照片、人物或声音；没有伪造资产路径，timing 明确为 estimated。

在仓库根目录复现：

```shell
python scripts/validate_storyboard.py examples/model-evaluation/travel-photo.json --mode draft --json
python scripts/compile_storyboard.py --input examples/model-evaluation/travel-photo.json --out ../travel-photo-demo --draft
cd ../travel-photo-demo
npm ci
npm run check
npm run render
```

后续编译、渲染和视觉检查由主任务执行，记录见 [V2 验证](../../docs/VALIDATION-V2.md)。本文件不把这些工作冒充为轻量模型自己完成；同时也不是对所有轻量/本地模型的基准测试。

`intent` 中部分描述超出结构化动作，例如第一镜提到“停住手指”，而 plan 没有手指对象或对应组件；渲染只会呈现结构化的照片和聚焦。该输入原样保留用于说明边界：自然语言意图不会自动变成任何想象中的复杂动作。交付正式作品时应按实际画面修正意图、补素材或扩展组件。
