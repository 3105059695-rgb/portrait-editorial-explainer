# 全机制示例中的真实摄影素材

这些文件用于展示真实照片、视频解码、画面裁切和镜头运动，不能当作某个新主题的必选素材。做新一期时，用当前内容对应的真实材料替换。默认几何图形仍可离线运行。

## 来源与使用依据

三张照片均下载自 NASA 官方网站；各来源页署名 NASA 或 NASA/JSC，没有标记第三方摄影版权。核对日期：2026-10-12。

[NASA 官方媒体使用指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)说明，NASA 内容通常不受美国版权保护，允许教育和信息用途，并要求标注来源、避免暗示 NASA 背书；网站内第三方版权作品不随之获得授权。NASA 标识、人物形象和商业宣传另有规则。本包选择地球、飞船和月面历史摄影，没有单独提取 NASA 标志，也没有使用可辨认的人物肖像。

这些照片随教学示例保留 NASA 来源署名，**不重新声明为本仓库的 MIT 原创作品，也不宣称已获得 NASA 对本 Skill 的审核或认可**。如果将例图用于广告、商品包装或其他宣传用途，应自行核对官方条款；通常应直接换成本期有使用权的素材。

| 包内文件 | 摄影内容及来源署名 | 官方说明页 | 实际下载地址 |
|---|---|---|---|
| `examples/full-effects/media/scene-a.jpg` | Apollo 17 “Blue Marble”，地球全景；NASA / Apollo 17 crew | [Apollo 17: Blue Marble](https://www.nasa.gov/image-article/apollo-17-blue-marble/) | [NASA JPEG](https://www.nasa.gov/wp-content/uploads/2023/03/as17-148-22727_lrg.jpg) |
| `examples/full-effects/media/scene-b.jpg` | Apollo 15 指令及服务舱，月球轨道；NASA/JSC | [View of the Apollo 15 Command/Service Module in Lunar Orbit](https://science.nasa.gov/resource/view-of-the-apollo-15-commandservice-module-in-lunar-orbit/) | [NASA 1200px JPEG](https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/2023/08/detail_as15-88-11974_orig.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg) |
| `examples/full-effects/media/scene-c.jpg` | Apollo 11 静海基地月面与登月舱；NASA，Neil Armstrong 拍摄 | [Lunar Module at Tranquility Base](https://www.nasa.gov/image-article/lunar-module-tranquility-base/) | [NASA JPEG](https://www.nasa.gov/wp-content/uploads/2023/03/as11-40-5961hr.jpg) |

原图尺寸分别为 1041×1041、1200×1241、1041×1048，合计约 0.49 MiB。图像内的摄影测量十字线、月面阴影属于原始照片，没有新增水印或品牌标志。

## 视频文件是什么

`examples/full-effects/media/media-sample.mp4` 是本仓库用上述**三张静态照片制作的移动与缩放演示**，每张 2 秒，6 秒共 180 帧；720×960、30 fps、H.264、无音轨、约 0.84 MiB。它不是 NASA 原始实拍运动影像，不能用作“现场视频”的事实证据。照片不发生内容生成，只做镜头平移、缩放、黑边填充和剪接。

示例配置应将其放入 `item.video`，照片放入 `item.image`；生成工程后均为工程内相对路径。视频中的声音由时间线独立音效事件提供，不来自 NASA。

已检查：三张照片可解码并逐张查看；MP4 全部 180 帧可解码，时长 6 秒；每个照片段前后帧哈希不同，确认文件含连续镜头运动。此说明不替代 Remotion 工程对嵌入视频的实际渲染检查。

## 重建视频

安装 FFmpeg 后，在 `examples/full-effects/media` 目录执行以下命令。命令使用 `-n`，不会覆盖已有结果。

```bash
ffmpeg -n -i scene-a.jpg -i scene-b.jpg -i scene-c.jpg -filter_complex "[0:v]scale=2160:-2,pad=2160:2880:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='1.02+0.08*on/59':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=60:s=720x960:fps=30,format=yuv420p,setsar=1,setpts=PTS-STARTPTS[a];[1:v]scale=2160:-2,pad=2160:2880:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='1.10-0.07*on/59':x='iw/2-iw/zoom/2+20*on/59':y='ih/2-ih/zoom/2':d=60:s=720x960:fps=30,format=yuv420p,setsar=1,setpts=PTS-STARTPTS[b];[2:v]scale=2160:-2,pad=2160:2880:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='1.04+0.09*on/59':x='iw/2-iw/zoom/2-25*on/59':y='ih/2-ih/zoom/2+10*on/59':d=60:s=720x960:fps=30,format=yuv420p,setsar=1,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[out]" -map "[out]" -c:v libx264 -crf 20 -preset medium -an -movflags +faststart media-sample.mp4
```

NASA 来源材料仅为演示素材；剪辑脚本、组件与独立生成的音效仍按仓库许可证发布。
