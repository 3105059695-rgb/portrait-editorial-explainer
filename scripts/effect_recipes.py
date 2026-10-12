#!/usr/bin/env python3
"""Small, explicit authoring recipes for every supported effect.

These describe the shipped renderer, not an AI recommendation service. Examples
are neutral demonstration copy and native artwork; callers supply episode facts.
"""
from __future__ import annotations

import copy
from source_episode import EFFECTS, PACK_EFFECTS, Invalid


def objects(*labels):
    return [{'id': f'item-{i + 1}', 'label': label} for i, label in enumerate(labels)]


def content(*labels, **fields):
    return {'items': objects(*labels), **fields}


# Each entry has only fields its own renderer uses. No generic catalog payload.
# recommended means useful semantic input, not an additional validator rule.
SPECS = {
    'feed-montage': ('资料快切', '实拍/资料', '快速建立多份资料的印象，再收束到一句结论。',
        '快切 资料 实拍 开场 印象', content('资料一', '资料二', '资料三', '资料四', result='观察共同线索'),
        'items', 'body kicker url result', (4, 10), '至少绘制 4 次、最多 10 次切换；不足 4 项会循环，超过 10 项不会全部进入主画面。'),
    'magazine-collage': ('杂志聚合', '排版', '多张独立纸张展开，聚焦一个对象，再用线连接结果。',
        '杂志 纸张 排版 聚合 线索', content('观察一', '观察二', '观察三', selectedId='item-2', result='形成结论'),
        'selectedId result', 'body kicker', (2, 5), '仅绘制前 5 项；selectedId 应位于前 5 项。'),
    'code-editor': ('代码工作区', '软件UI', '代码逐行出现，侧栏展开，终端状态变化，整屏带曲面与扫描线。',
        '代码 终端 编辑器 曲屏 编程', content('main.py', 'result.txt', code='draft = read_notes()\nresult = organize(draft)\nsave(result)', result='演示执行完成'),
        'code', 'body prompt result kicker url', (1, 8), '侧栏仅展示前 8 项；代码行数随画面高度截取，长代码应拆镜头。'),
    'idea-burst': ('概念组装', '插画', '碎片组装为中心物件，重点放射，随后由结论文字接走画面。',
        '灵感 概念 组装 强调', content('灵感', result='开始行动'),
        'result', 'emphasis kicker', (1, 1), '只使用第 1 项作为中心物件；没有素材时绘制灯泡。'),
    'document-write': ('文稿形成', '排版', '正文逐字形成，长文滚动，完成状态落在页尾。',
        '文稿 写作 正文 输入', content('草稿', body='先提出问题，再整理证据，最后给出结论。', result='草稿完成'),
        'body', 'emphasis url result kicker', (1, 1), '只用第 1 项标签作为默认文稿名称；正文最多 300 字符。'),
    'reference-search': ('检索并锁定', '软件UI', '候选网格出现，放大镜寻找指定对象，再让同一对象升到前景。',
        '搜索 检索 选择 放大镜 候选', content('线索一', '线索二', '线索三', '线索四', '线索五', '线索六', selectedId='item-2', result='选中'),
        'selectedId', 'result kicker', (6, 12), '固定 3 列；最少绘制 6 格，不足 6 项会循环。最多使用 12 项。'),
    'code-build': ('素材转代码', '软件UI', '第一个素材进入代码生成过程，正文与进度联动。',
        '代码 生成 构建 进度', content('输入素材', code='source = load_input()\nresult = build(source)\nexport(result)'),
        'code', 'url kicker', (1, 1), '仅显示第 1 项素材；可见代码行数随画面高度变化。'),
    'prompt-substitute': ('指令替换物件', '软件UI', '先展示原物件，输入指令，再按顺序翻成新的标签或素材。',
        '替换 指令 输入 翻牌 修改', {'items': [dict(it, replacementLabel=f'新方案{i+1}') for i, it in enumerate(objects('旧方案一', '旧方案二', '旧方案三', '旧方案四'))], 'prompt': '将四个旧方案改为新的方案'},
        'prompt items[].replacementLabel', 'kicker items[].replacementImage', (4, 9), '最少绘制 4 格，不足会循环；最多使用前 9 项。背面图片用 replacementImage。'),
    'kinetic-type': ('文字聚拢', '排版', '多层文字收缩后重新展开，以字形本身形成重点。',
        '文字 大字 聚拢 强调', content('发现', '理解', '行动', result='从理解到行动'),
        'items', 'body emphasis result', (1, 4), '最多使用前 4 项的标签；主要大字来自 title 或 emphasis。'),
    'challenge-split': ('问题对照', '排版', '把两个矛盾对象放到两侧，最后由结论将它们重新关联。',
        '问题 对立 双栏 矛盾', content('时间有限', '任务很多', result='先确定优先级'),
        'items result', 'body kicker', (2, 2), '只使用前 2 项；只有 1 项时两侧重复它。'),
    'rejection-grid': ('候选否决', '软件UI', '密集候选经过扫描，保留指定身份，其余逐步被否决。',
        '筛选 淘汰 否决 网格', content('候选一', '候选二', '候选三', selectedId='item-2', result='保留合适方案'),
        'selectedId', 'result kicker', (3, 12), '通过循环 items 铺成 9–36 格；同一身份可能出现多次，只有 selectedId 首次出现的格子保留。'),
    'workflow-route': ('步骤接力', '信息图', '步骤物件沿顺序连接，焦点从前一步交到下一步。',
        '流程 步骤 接力 因果', content('收集', '整理', '表达', result='完成一轮工作'),
        'items', 'result kicker', (2, 6), '只绘制前 6 项；超过 6 步请拆镜头，不能靠填 12 项显示全部。'),
    'object-array-flip': ('阵列翻面', '空间', '对象飞入立体阵列，依次翻面，选中对象收束到前景。',
        '阵列 翻牌 分类 重组 空间', {'items': [dict(it, replacementLabel=f'分类{i+1}') for i, it in enumerate(objects('资料一', '资料二', '资料三', '资料四'))], 'selectedId': 'item-2'},
        'selectedId items[].replacementLabel', 'body result items[].replacementImage kicker', (3, 12), '所有 items 进入阵列；selectedId 决定最终放大的对象。'),
    'comparison-bars': ('数值横向比较', '信息图', '按真实数值比例增长横柱，并圈出指定方案。',
        '比较 对比 数据 横柱', {'items': [dict(it, value=value) for it, value in zip(objects('方案一', '方案二'), (30, 70))], 'selectedId': 'item-2', 'result': '示例数值，请替换'},
        'items[].value selectedId', 'values metric body result kicker', (2, 5), '所有 1–12 项都会画；5 项以上标签趋密。item.value 优先于 values[index]。'),
    'premium-coins': ('价值卡与金币', '空间/信息图', '中心价值卡旋转建立，读数变化，金币穿过周围。',
        '价值 会员 价格 金币', content('方案价值', metric={'value': 80, 'unit': '分', 'label': '示例评分'}, body='数值仅用于演示'),
        'metric', 'body emphasis result kicker', (1, 1), '只用第 1 项标签作为卡片名称；卡面本身为程序图形，不读该项 image/video。'),
    'cost-columns': ('厚度柱状比较', '信息图', '带侧面厚度的柱体按本期数据增长。',
        '成本 柱状 数据 厚度 比较', {'items': [dict(it, value=value) for it, value in zip(objects('方案一', '方案二', '方案三'), (20, 45, 70))]},
        'items[].value', 'values metric result kicker', (2, 6), '所有 items 绘制；item.value 优先于 values[index]。'),
    'quota-ring': ('额度仪表', '信息图', '圆环由 100% 变到目标百分比，最后盖上结论标签。',
        '额度 百分比 仪表 圆环', content('剩余空间', metric={'value': 68, 'unit': '%', 'label': '示例剩余额度'}, result='关注剩余空间'),
        'metric', 'result kicker', (1, 1), '只读第 1 项标签作默认说明；圆环始终显示百分比，值渲染时钳制到 0–100。校验要求 metric.value > 0。'),
    'gallery-camera': ('透视图库', '空间', '相机穿行多行资料墙，再推到指定素材。',
        '图库 透视 穿行 资料墙 聚焦', content('资料一', '资料二', '资料三', '资料四', '资料五', '资料六', selectedId='item-2'),
        'selectedId', 'result kicker', (4, 12), '按列数至少铺 4 行，循环已有 items；selectedId 聚焦首次出现的位置。'),
    'curved-screen': ('整屏曲面', '软件UI/空间', '界面内容、素材和光标一起弯曲推进，字幕留在屏幕层。',
        '曲屏 鱼眼 网页 镜头', content('案例一', '案例二', '案例三', selectedId='item-2', kicker='示意界面', body='从多个案例找到重点'),
        'selectedId', 'body kicker url', (3, 6), '所有 items 进入网格；多行可能超出当前画面，可用相机或 focusY 聚焦。'),
    'window-detail': ('列表升详情', '软件UI', '选中的列表对象进入详情窗口，身份保持一致。',
        '详情 窗口 列表 选择', content('资料一', '资料二', '资料三', selectedId='item-2', body='这里展示选中资料的详细说明'),
        'selectedId body', 'kicker result', (2, 6), '全部 items 排入左侧网格；窄窗/过多行会超出可读区域。'),
    'unlock-reveal': ('解锁揭示', '软件UI', '锁具打开后，遮挡的列表内容露出，并出现完成状态。',
        '解锁 揭示 列表 权限', content('第一条内容', '第二条内容', result='内容已展开'),
        'items result', 'kicker', (1, 6), '所有 items 作为文字列表；不会显示 item 图片。'),
    'repository-copy': ('链接复制接力', '软件UI', '代码仓库示意页中，链接完成复制后飞到输入位置。',
        '仓库 复制 链接 接力', content('演示项目', 'README.md', 'main.py', url='example.test/demo', result='链接已带到下一步'),
        'url', 'selectedId body result kicker items[].value', (2, 5), '第 1 项是项目名，第 2–5 项是文件行；第 6 项起不会画文件行。url 是展示文字，不会访问网络。'),
    'prompt-send': ('输入并发送', '软件UI', '指令逐字进入输入框，发送后显示结果与选中素材。',
        '输入 发送 指令 结果', content('生成结果', prompt='将这些笔记整理成三个重点', result='三个重点已生成'),
        'prompt result', 'selectedId body kicker', (1, 1), '只展示 selectedId 对应的结果素材，未指定时使用第 1 项。'),
    'result-compare': ('结果纸张对照', '排版/资料', '多个结果纸张展开到不同位置，以连线和重点完成比较。',
        '结果 对照 纸张 前后', content('调整前', '调整后', result='观察具体差别'),
        'items', 'result kicker', (2, 3), '至少画 2 份；只有 1 项会重复。所有输入项都画，4 项以上单张高度明显缩小。'),
    'phone-focus': ('手机聚焦', '空间', '附件围绕手机建立，镜头最终推向手机中的选中内容。',
        '手机 屏幕 聚焦 附件', content('主画面', '附件一', '附件二', selectedId='item-1', result='把重点带到眼前'),
        'selectedId', 'result kicker', (1, 4), '手机用 selectedId；周围附件只取前 4 项。'),
    'curation-stamp': ('筛选与盖章', '软件UI/漫画', '扫描候选并逐个盖章，选中项保留，其他项退回。',
        '筛选 通过 退回 盖章', content('候选一', '候选二', '候选三', selectedId='item-2', result='保留合适内容'),
        'selectedId', 'result kicker', (3, 9), 'selectedId 决定唯一通过身份；省略则默认全部通过。不能用负 value 制造退回，校验禁止负数。'),
    'reward-transfer': ('奖励转移', '漫画', '奖励从一个来源沿弧线飞向其他对象，到达后再计数。',
        '奖励 分配 转移 归属', content('奖励来源', '接收者一', '接收者二', selectedId='item-1', metric={'value': 12, 'unit': '枚', 'label': '演示奖励'}),
        'selectedId metric', 'result kicker', (2, 5), 'selectedId 是来源，其余 items 是接收者；只有 1 项会发送给自身。'),
    'media-stage': ('素材空间窗口', '实拍/资料', '第一份资料展开成整屏，下一份横向接入，末尾轻推。',
        '实拍 资料 窗口 视频 数字人', content('第一份资料', '第二份资料', selectedId='item-1', body='在这里讲清楚资料表达的事情'),
        'selectedId', 'body result kicker', (1, 2), '只显示选中项与其后循环的 1 项；超过 2 项不会在一个镜头内全部显示。'),
    'creator-filmstrip': ('身份与胶片', '漫画', '主身份徽章、绶带与滚动作品胶片一起组成创作者场景。',
        '身份 创作者 胶片 作品', content('创作者', '作品一', '作品二', result='让作品被看见'),
        'items', 'avatar result kicker', (2, 8), '主身份默认第 1 项，avatar 可指定图片；胶片循环所有 items。'),
    'upload-beam': ('素材上传', '漫画', '资料沿弧线进入云端，到达数量同步上传进度。',
        '上传 云端 文件 进度', content('资料一', '资料二', '资料三', result='资料云'),
        'items', 'metric body result kicker', (1, 12), '循环 items 生成上传事件，默认至少 9 次；metric.events 用于事件数量，渲染上限 30。'),
    'remix-cube': ('立方体重组', '空间/漫画', '内容装进立方体不同面，旋转展示多个视角。',
        '重组 立方体 旋转 空间', content('观察', '尝试', '组合', '形成', '调整', '完成', result='换一个视角'),
        'items', 'result kicker', (3, 6), '六个面循环取 items；超过 6 项不会进入立方体面。前 2 项另作下方标签。'),
    'microphone-swing': ('发声物件摆动', '漫画', '麦克风或替换素材绕支点摆动，声线与重点气泡配合。',
        '声音 麦克风 发声 摆动', content('表达', result='把想法说清楚'),
        'items', 'emphasis result kicker', (1, 1), '只使用第 1 项素材；没有素材时绘制麦克风。'),
    'robot-meter': ('状态与仪表', '漫画/信息图', '主体状态变化并带动仪表增长，支持替换主体图片或视频。',
        '机器人 状态 成长 仪表 能力', content('学习助手', '理解', '尝试', '反馈', metric={'value': 80, 'unit': '%', 'label': '演示进度'}),
        'metric', 'body result kicker', (1, 4), '第 1 项作为主角，第 2–4 项作为标签；第 5 项起忽略。百分比单位时填充钳制到 0–100%。'),
    'coin-growth': ('金币堆增长', '漫画/信息图', '不同对象对应不同高度的厚金币堆，增长线与总指标联动。',
        '增长 金币 数据 收益', {'items': [dict(it, value=value) for it, value in zip(objects('阶段一', '阶段二', '阶段三'), (20, 40, 70))], 'metric': {'value': 130, 'unit': '点', 'label': '演示总量'}},
        'items[].value metric', 'values result kicker', (2, 8), '仅绘制前 8 项。此效果 values[index] 优先于 item.value；零值仍画 1 枚示意金币。'),
    'question-bounce': ('疑问重点弹入', '漫画', '夸张重点物件弹入，再以人物和气泡承接问题。',
        '疑问 问号 弹跳 重点', content('疑问', result='接下来寻找答案'),
        'items', 'emphasis body result kicker', (1, 1), '仅使用第 1 项素材；没有素材时绘制问号，shape 不改变问号。'),
    'consumable-ban': ('投入与禁用', '漫画', '消耗物抛入前景容器，之后出现明确禁用标记。',
        '消耗 禁止 丢弃 投入', content('一次性用品', result='减少无谓消耗'),
        'items result', 'body kicker', (1, 1), '仅使用第 1 项素材；没有素材时绘制杯子。'),
    'luxury-dome': ('玻璃罩价值', '漫画/空间', '主体进入带高光的玻璃罩，以标签或禁用章表达价值判断。',
        '价值 玻璃 展示 奢侈 禁用', content('重要物件', result='值得认真保留'),
        'items result', 'metric body kicker', (1, 1), '仅使用第 1 项素材；没有素材时绘制芯片。pack.labels[0] 为 ban 时加禁用符号。'),
    'sharing-network': ('关系与交换', '漫画', '多位角色围成关系网络，价值物件在节点周围流动。',
        '共享 关系 网络 交换 协作', content('创作', '研究', '表达', result='把成果连接起来'),
        'items', 'emphasis metric body result kicker', (3, 8), '至少画 3 位，不足时循环；最多画 12 位。每项可提供不同人物素材。'),
    'celebration-type': ('群像与结尾大字', '漫画', '主体、纸屑、群像与独立字粒形成有层次的结尾。',
        '结尾 庆祝 群像 大字', content('伙伴一', '伙伴二', '伙伴三', result='继续下一次创造'),
        'items', 'emphasis kicker result', (3, 8), '主物件取第 1 项；人群最少 3 位、最多前 8 项，不足时循环。'),
    'poster-route': ('海报连向结果', '传统连续链', '多张海报依次展开和聚焦，最后连到统一方法。',
        '海报 线索 聚合 连线', content('线索一', '线索二', '线索三', selectedId='item-2', result='共同方法'),
        'selectedId result', 'body emphasis', (3, 5), '校验强制 3–5 项，全部展示；是完整连续链，不是强制默认镜头。'),
    'selection-build': ('选择到替换连续链', '传统连续链', '文稿、检索、选中、代码、替换按同一条对象链连续发生。',
        '文稿 搜索 代码 替换 连续', {'items': [dict(it, replacementLabel=f'新物件{i+1}') for i, it in enumerate(objects('候选一', '候选二', '候选三', '候选四'))], 'selectedId': 'item-2', 'body': '先写清要解决的问题。', 'code': 'result = build(selected)', 'prompt': '把当前物件替换成新方案'},
        'items[].replacementLabel', 'result emphasis', (4, 9), '校验强制 4–9 个候选；前 4 项进入替换托盘。'),
    'ui-handoff': ('浏览到结果连续链', '传统连续链', '浏览、详情、复制、粘贴、发送、结果构成完整界面操作链。',
        '浏览 详情 复制 粘贴 发送 连续', content('资料一', '资料二', selectedId='item-2', url='example.test/demo', prompt='将这份资料整理成三个重点', result='三个重点已就绪'),
        'items', 'body emphasis', (2, 6), 'selectedId 指定详情与结果来源；url 是示意文字，不执行真实网页操作。'),
    'token-intake': ('票据吸入并计数', '信息图', '票据按弧线进入容器，真正到达后累加到目标值。',
        '票据 粒子 吸入 计数 消耗', content('输入票据', metric={'value': 120, 'unit': '份', 'label': '演示处理量', 'events': 12}, result='处理中'),
        'items', 'body result', (1, 12), '票据按 metric.events 次生成并循环 items；events 校验接受 2–160，默认 84。'),
    'creator-strip': ('身份胶片连续链', '传统连续链', '身份头像、绶带与连续滚动胶片构成一个场景。',
        '身份 胶片 作品 连续', content('作品一', '作品二', '作品三', result='每一份创作'),
        'items result', 'avatar body metric', (2, 8), '作品循环使用所有 items；头像由 content.avatar 或内置插画提供。'),
    'upload-progress': ('云端上传连续链', '传统连续链', '素材飞入云端后才累计进度，前景保持明确接收口。',
        '上传 云端 进度 连续', content('资料一', '资料二', '资料三', result='内容云'),
        'items result', '', (1, 12), '至少 6 次上传，items 不足时循环；不使用 metric.events。'),
    'ui-stage': ('自定义界面动作', '自由UI', '现有机制无法表达时，用节点和时间轨迹设计本期自己的界面变化。',
        '自定义 界面 节点 轨迹 自由', {'items': [], 'ui': {'label': '示意界面', 'nodes': [
            {'id': 'panel', 'type': 'panel', 'x': 70, 'y': 260, 'w': 404, 'h': 200, 'fill': '#fffdf6'},
            {'id': 'status', 'type': 'text', 'x': 106, 'y': 300, 'w': 330, 'h': 60, 'text': '整理中', 'fontSize': 28},
            {'id': 'progress', 'type': 'progress', 'x': 106, 'y': 392, 'w': 330, 'h': 18, 'value': 0}],
            'tracks': [{'nodeId': 'progress', 'frames': [{'at': 0.4, 'set': {'value': 0}}, {'at': 2.8, 'set': {'value': 1}}]},
                       {'nodeId': 'status', 'frames': [{'at': 2.8, 'set': {'text': '整理完成'}}]}]}},
        'ui.label', '', (0, 0), 'items 可为空，画面由 ui.nodes 生成；nodes 1–200，tracks 0–200。'),
}

FIELD_INFO = {
    'items': '本期物件数组；每项必须有唯一 id 和 1–16 字符的 label，数量见单独说明。',
    'selectedId': '与 items 中实际 id 相同；决定被选择或聚焦的对象。',
    'body': '本期正文或解释，1–300 字符；可读长度由具体画面决定。',
    'code': '本期演示代码文本，1–1000 字符；只显示，不执行。',
    'prompt': '本期指令文本，1–100 字符。',
    'url': '展示用地址或文件名，1–160 字符；不会调用或访问该地址。',
    'result': '本期结果或短结论，1–40 字符；按当前布局保持简短。',
    'kicker': '标题上方或界面中的短标签，1–40 字符。',
    'emphasis': '重点文本，必须是 title 中连续子串且最多 24 字符。',
    'avatar': '相对于 --media-dir 的已提供头像图片路径，不能填私人绝对路径。',
    'metric': '对象 {value, unit, label, events?}；value > 0 且 <= 1e9，events 如使用必须为 2–160 整数。',
    'values': '1–12 个非负数；具体优先级见数量说明，不要与 item.value 填矛盾值。',
    'items[].value': '每个对象的真实非负数，不能用演示值冒充事实。',
    'items[].replacementLabel': '翻面后的本期标签，1–16 字符。',
    'items[].replacementImage': '翻面后的已提供图片路径，相对 --media-dir；省略则用标签/原物件或程序图形。',
    'ui': '自定义界面 {nodes, tracks, camera?, canvasHeight?, showTitle?, label?}。',
    'ui.label': '界面来源短标签；虚构操作请写“示意界面”。',
}

LAYOUT = {
    'rejection-grid': {'columns': '整数 3–6 生效，默认 5；校验的 1–2 会钳制为 3。', 'density': '最终格数 9–36，且不少于 columns*3；默认 25。'},
    'object-array-flip': {'columns': '整数 2–5 生效；超出会钳制，默认 ceil(sqrt(items.length))。'},
    'premium-coins': {'density': '飘落金币数量 3–36 生效，默认 16。'},
    'gallery-camera': {'columns': '校验接受 1–6，渲染至少 3，默认 5。', 'speed': '0.1–4；控制前段图库行进速度，默认 1。'},
    'curved-screen': {'columns': '2–4 生效，默认 3。', 'angle': '-80..80 度，默认 -4；建议小角度。', 'depth': '0–2000 曲率位移，默认 72；建议约 40–140，过大严重扭曲。', 'focusX': '绝对逻辑坐标 0–544，默认 272。', 'focusY': '绝对逻辑坐标 0–2000，默认画面高度的 0.44。'},
    'window-detail': {'columns': '整数 1–6，默认 3；按候选数量保证详情仍可读。', 'labels': '前 2 项依次是详情栏标题和按钮文字。'},
    'unlock-reveal': {'labels': '前 2 项依次是操作按钮、处理中状态。'},
    'repository-copy': {'labels': '第 1 项是接收区提示。'},
    'prompt-send': {'labels': '前 3 项依次是工作区标题、输入提示、已发送状态。'},
    'curation-stamp': {'columns': '2–4 生效，默认 3。', 'labels': '恰好提供至少 2 项才有完整状态：通过文字、退回文字。'},
    'reward-transfer': {'density': '奖励粒子数量 3–30 生效，默认 12；总值来自 metric.value。'},
    'media-stage': {'direction': 'left 向左接入，right 向右；当前 up/down 也会按 right 渲染，请不要填。'},
    'creator-filmstrip': {'angle': '-80..80 度，默认 -5；胶片倾角。', 'speed': '0.1–4；胶片滚动速度。'},
    'remix-cube': {'angle': '-80..80 度，默认 -4；立方体倾角。', 'depth': '0.6–1.7 生效，默认 1；控制透视，不与 curved-screen 共用数值。', 'speed': '0.1–4；旋转圈数倍率。'},
    'microphone-swing': {'speed': '0.1–4；麦克风摆动速度。'},
    'question-bounce': {'angle': '-80..80 度，默认 -7；重点物件倾角。'},
    'luxury-dome': {'labels': '第 1 项等于 ban 才显示禁用标记，其他文字不会作为章面文字出现。'},
    'sharing-network': {'speed': '0.1–4；价值物件绕行速度。'},
    'celebration-type': {'density': '纸屑数量 20–100 生效，默认 58；同时影响射线数 8–32。', 'speed': '0.1–4；纸屑飘落速度。'},
}

ILLUSTRATED = set('creator-filmstrip upload-beam remix-cube microphone-swing robot-meter coin-growth question-bounce consumable-ban luxury-dome sharing-network celebration-type'.split())
RAYS = set('creator-filmstrip remix-cube robot-meter question-bounce luxury-dome sharing-network celebration-type'.split())
SPATIAL_WEB = set('object-array-flip comparison-bars premium-coins cost-columns quota-ring gallery-camera curved-screen window-detail unlock-reveal repository-copy prompt-send result-compare phone-focus curation-stamp reward-transfer media-stage'.split())
# Only the indicated effects consume item media, not every field accepted by schema.
MEDIA = set('feed-montage magazine-collage idea-burst reference-search code-build prompt-substitute challenge-split rejection-grid workflow-route object-array-flip gallery-camera curved-screen window-detail prompt-send result-compare phone-focus curation-stamp reward-transfer media-stage creator-filmstrip upload-beam remix-cube microphone-swing robot-meter coin-growth question-bounce consumable-ban luxury-dome sharing-network celebration-type'.split())
LEGACY_MEDIA = set('poster-route selection-build ui-handoff creator-strip upload-progress'.split())


def describe(effect):
    if effect not in SPECS:
        raise Invalid(f'Unknown effect: {effect}. Use list or find to choose an effect.')
    title, group, purpose, tags, example, recommended, optional, count, behavior = SPECS[effect]
    required = ['items']
    if effect == 'ui-stage': required += ['ui']
    if effect == 'selection-build': required += ['selectedId', 'body', 'code', 'prompt']
    if effect == 'ui-handoff': required += ['selectedId', 'url', 'prompt', 'result']
    if effect == 'token-intake': required += ['metric']
    rec = [k for k in recommended.split() if k not in required]
    opt = [k for k in optional.split() if k not in required and k not in rec]
    fields = {kind: {k: FIELD_INFO[k] for k in values} for kind, values in [('required', required), ('recommended', rec), ('optional', opt)]}
    layout = copy.deepcopy(LAYOUT.get(effect, {}))
    if effect in PACK_EFFECTS:
        if effect not in ('feed-montage', 'code-editor', 'kinetic-type', 'media-stage', 'curved-screen', 'celebration-type'):
            layout['showTitle'] = 'false 隐藏标题；默认 true。不会隐藏整镜头字幕。'
        if effect in RAYS:
            layout.setdefault('density', '射线数量 8–32 生效，默认 22。')
            layout['focusX'] = '射线中心绝对逻辑坐标 0–544；默认 272。'
            layout['focusY'] = '射线中心绝对逻辑坐标 0–2000；默认画面高度的 0.44。'
    refs = ['references/full-effects-guide.md', 'references/source-style-contract.md']
    if effect in ILLUSTRATED: refs.append('references/illustrated-pack-usage.md')
    if effect in SPATIAL_WEB: refs.append('references/spatial-web-pack-usage.md')
    if effect == 'ui-stage': refs.append('references/ui-composition-contract.md')
    duration = 7 if effect in ('selection-build', 'ui-handoff') else 4
    shot = {'effect': effect, 'title': title, 'duration': duration, 'content': copy.deepcopy(example)}
    if effect == 'ui-stage': shot['marks'] = {'resolve': 2.8}
    accepted = [0, 12] if effect == 'ui-stage' else [3, 5] if effect == 'poster-route' else [4, 9] if effect == 'selection-build' else [1, 12]
    if effect in MEDIA:
        media_note = '只把你已提供的素材路径放进对应 items[].image 或 video；两者不可同时设置。路径相对 --media-dir。未提供时使用原生演示图形，不能冒充真实照片。'
    elif effect in LEGACY_MEDIA:
        media_note = '传统链使用 items[].image（相对 --media-dir）；不要依赖 items[].video，视频素材请选新机制包。'
    elif effect == 'ui-stage':
        media_note = '图片使用 ui.nodes 中 type=image 的 image 路径；相对 --media-dir。该自由UI节点不提供 video 类型。'
    else:
        media_note = '本机制主要读取文字或数据；不要为 items 填 image/video 后期待自动显示。'
    return {
        'effect': effect, 'title': title, 'group': group, 'purpose': purpose, 'tags': tags.split(),
        'marks': {'required': list(EFFECTS[effect]), 'unit': '镜头本地秒，含 resolve；compose 会自动填 demo 时间。ui-stage 示例显式让 resolve 与状态完成时刻一致。',
                  'rule': 'resolve 后至少留 0.15 秒；正式制作按测量口播改写，不把演示时长当字幕对齐。'},
        'content_fields': fields,
        'items_count': {'validator_accepts': accepted, 'recommended': list(count), 'rendering_behavior': behavior},
        'layout_parameters': {'content.pack': layout, 'camera': 'shot.camera：at,x,y,scale,rotate?；逻辑宽544，独立相机轨迹。' if effect in PACK_EFFECTS else 'content.ui.camera：at,x,y,scale；画布默认544×720。' if effect == 'ui-stage' else '此传统链没有可配置相机轨迹；需要时改用新机制包或 ui-stage。'},
        'media': media_note, 'references': refs,
        'example_notice': '以下是可运行的最小用途演示 shot，文字和数值不是本期事实；必须换成本期内容。不访问链接，不附带或虚构用户素材。',
        'shot': shot,
        'composition_note': '将 shot 放入 brief.shots，按表达需要组合到总时长至少10秒，再用 compose --out 生成；不要固定按目录轮播。',
    }


def find(query):
    """Literal term matching only; predictable, offline, no model inference."""
    terms = query.casefold().split()
    if not terms:
        raise Invalid('find needs a nonempty keyword')
    result = []
    for effect, spec in SPECS.items():
        title, group, purpose, tags = spec[:4]
        haystack = f'{effect} {title} {group} {purpose} {tags}'.casefold()
        if all(term in haystack for term in terms):
            result.append({'effect': effect, 'title': title, 'group': group, 'purpose': purpose})
    return result


def format_description(recipe):
    lines = [f'{recipe["effect"]} · {recipe["title"]} [{recipe["group"]}]', recipe['purpose'],
             '选择：按当前话语的表达用途选择，先复用，表达不了再设计；不是固定镜头顺序。',
             '动作 marks：' + ' → '.join(recipe['marks']['required']), recipe['marks']['unit'], recipe['marks']['rule']]
    for kind, label in [('required', '必填（校验要求）'), ('recommended', '建议（表达需要）'), ('optional', '可选')]:
        lines.append(f'content {label}：')
        fields = recipe['content_fields'][kind]
        lines.extend(f'  {name}: {value}' for name, value in fields.items())
        if not fields: lines.append('  无额外字段')
    counts = recipe['items_count']
    lines += [f'items：校验接受 {counts["validator_accepts"]}，建议 {counts["recommended"]}；{counts["rendering_behavior"]}',
              '实际可用 content.pack 参数：']
    lines.extend(f'  {k}: {v}' for k, v in recipe['layout_parameters']['content.pack'].items())
    if not recipe['layout_parameters']['content.pack']: lines.append('  无；不要随意填全局 schema 里但此组件不读取的参数。')
    lines += [recipe['layout_parameters']['camera'], recipe['media'], '参考：' + ', '.join(recipe['references']),
              recipe['example_notice']]
    import json
    lines += [json.dumps(recipe['shot'], ensure_ascii=False, indent=2), recipe['composition_note']]
    return '\n'.join(lines)
