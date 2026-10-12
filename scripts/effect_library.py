#!/usr/bin/env python3
"""Reusable reference effects: list/find/describe, generate catalog, or compose a brief.

No API keys, private paths, narration generation, or model calls are needed.
The agent chooses what the sentence means; this script resolves timing and geometry inputs.
"""
from __future__ import annotations
import argparse
import copy
import json
from pathlib import Path
import sys
from source_episode import EFFECTS, PACK_EFFECTS, Invalid, need, validate

# Source seconds identify observed mechanisms, not borrowed video assets.
ROWS = [
('feed-montage','素材快切与冲击推进','实拍/资料','0–2',3.2,'对多份实拍或资料快速建立印象；每个item可带video/image'),
('magazine-collage','杂志排版与连线聚合','排版','2–7',4,'多张海报分层展开，再连向同一个结果'),
('code-editor','代码编辑器与曲屏','软件UI','7–14',4,'侧栏、选择、代码与终端联动；代码正文由本期输入'),
('media-stage','实拍与空间窗口','实拍/资料','14–20',3.8,'视频/照片在独立空间窗口中切换；可使用真实拍摄和数字人'),
('idea-burst','灵感组装与放射线','插画','20–22.8',2.8,'一个概念或物件从碎片建立，重点向外扩散'),
('document-write','文稿逐行形成','排版','22.8–24.4',2.8,'本期正文随时间形成并聚焦关键内容'),
('reference-search','图库检索与放大镜','软件UI','24.4–26.35',3.6,'检索候选网格，移动放大镜，再锁定selectedId'),
('code-build','素材转代码与进度','软件UI','26.35–28.65',3.3,'选中素材进入生成过程，代码和完成进度同步'),
('prompt-substitute','输入指令与逐项替换','软件UI','28.65–31.08',3.6,'原物件先出现，输入新要求后翻成replacementImage/Label'),
('kinetic-type','大字叠层与聚拢','排版','31.08–33.3',2.8,'文字本身形成空间重点；文字、节奏、方向由本期设置'),
('object-array-flip','立体阵列飞入翻牌','空间','33.3–41.15',5.5,'物件分别走弧线入阵列，依次翻面，再重组到展示面'),
('challenge-split','双问题空间分栏','排版','41.15–43.3',2.8,'按当前论点建立两个或多个矛盾对象'),
('rejection-grid','网格筛选与否决','软件UI','43.3–45.83',3,'候选内容进入判断，焦点与否决状态随选择变化'),
('token-intake','票据弧线吸入计数','信息图','45.83–50.08',4.2,'票据进入箱口后才计数；支持指定最终指标和到达数量'),
('comparison-bars','对比柱与数值增长','信息图','50.08–53.45',3.4,'按真实value比例变化；名称、单位、数量可改'),
('premium-coins','会员卡与金币落下','空间/信息图','53.45–58.2',3.8,'中心对象旋转建立，金币落到对象周围'),
('cost-columns','厚度成本柱','信息图','58.2–62.43',3.6,'有侧面厚度的柱形按本期数值增长'),
('quota-ring','额度环与仪表','信息图','62.43–65.53',3,'额度弧线、读数与物件形成完整仪表'),
('gallery-camera','透视图库穿行','空间','65.53–68.67',4,'穿过多行真实素材墙，再选中具体item'),
('curved-screen','整屏曲面页面','软件UI/空间','68.67–70.7',3.5,'整张页面连内容一起弯曲推进，字幕保持屏幕层'),
('workflow-route','步骤对象接力','信息图','70.7–75',3.6,'2–12个步骤按实际先后连接，物件沿路径接力'),
('window-detail','列表升起详情窗','软件UI','75–80.1',3.6,'选中列表对象升成详情，保持素材身份一致'),
('unlock-reveal','解锁与内容揭示','软件UI','80.1–83.2',3.2,'模糊/遮挡资料经操作展开，并显示实际结果'),
('repository-copy','仓库复制与链接接力','软件UI','83.2–87.47',3.5,'页面、复制状态和url交接；产品界面明确标记示意'),
('prompt-send','链接输入并发送','软件UI','87.47–90.17',3.2,'本期指令逐字输入、发送并显示result'),
('result-compare','结果纸张并排比较','排版/资料','90.17–96.27',3.6,'使用不同结果素材进行侧向展示与相机聚焦'),
('curation-stamp','筛选标签与淘汰盖章','软件UI/漫画','96.27–101.6;105.55–110.33',3.8,'候选按selectedId作取舍，印章、标签、离场形成因果'),
('phone-focus','手机着色与附件汇聚','空间','101.6–105.55',4,'屏幕从低饱和转彩色，附件围绕本期主物件建立'),
('reward-transfer','奖励飞行与归属','漫画','110.33–114.27',3.2,'奖励从判断处飞向目标对象，数量可改'),
('creator-filmstrip','身份徽章与滚动胶片','漫画','114.27–118.03',3.8,'身份物件、绶带、作品胶片形成一体，作品可为图片/视频'),
('upload-beam','云端上传与进度','漫画','118.03–120.2',3,'本期素材依次离队飞入云端，实际上传动作同步进度'),
('remix-cube','三维方块重组','空间/漫画','120.2–121.55',3,'有多个面的立方体旋转，面内容来自本期items'),
('microphone-swing','麦克风弧摆与声线','漫画','121.55–123.25',3,'发声物件围绕支点摆动，声线与动作同步'),
('robot-meter','机器人状态仪表','漫画/信息图','123.25–125.2',3,'主体表情/状态和量表一起变化，可替换主体素材'),
('coin-growth','厚金币堆与增长箭头','漫画/信息图','125.2–127.8',3.4,'有侧面厚度的金币堆按本期values增长'),
('question-bounce','厚问号与弹性落点','漫画','127.8–129.67',2.8,'夸张重点物件弹入并保留停顿，允许换成其他图片物件'),
('consumable-ban','消耗物投入容器与禁用','漫画','129.67–132.47',3.6,'指定物件走抛物线进入前景容器，禁用标记随后落下'),
('luxury-dome','玻璃罩与价值盖章','漫画/空间','132.47–134.3',3.2,'主体进入带高光的玻璃罩，标签和盖章强调价值变化'),
('sharing-network','人物关系与价值交换','漫画','134.3–137.67',3.6,'关系网络围绕多人建立，物件在实际节点间传递'),
('celebration-type','人群庆祝与逐字聚合','漫画','137.67–140.5',3.8,'多个角色、字粒和纸屑独立运动，最后形成完整结尾'),
]

PALETTE=['#b8c8b4','#d1bedf','#e8c997','#adcbd0','#e2ae94','#c0cfa1']
def item_set(labels):
    shapes=['square','circle','diamond','chip','cup','person']
    return [{'id':f'item-{i+1}','label':label,'color':PALETTE[i%6], 'shape':shapes[i%6], 'value':[36,72,48,90,60,54][i%6], 'replacementLabel':f'新{label}'[:16]} for i,label in enumerate(labels)]

def scene_content(name,title):
    c={'items':item_set(['原始素材','方案选择','执行结果','共享成果']), 'selectedId':'item-2',
       'body':'从本期内容出发，找到重点。让物件发生变化，再把变化交给下一个镜头。',
       'code':'const input = await readMaterials();\nconst result = transform(input);\nawait render(result);',
       'prompt':'根据本期材料，重新设计物件与镜头', 'url':'example.test/project',
       'result':'本期结果已就绪','kicker':'可编辑机制演示','metric':{'value':1280,'unit':'次','label':'已处理','events':32},
       'values':[24,58,82,46], 'pack':{'columns':2,'angle':-10}}
    if name in ('object-array-flip','gallery-camera','curation-stamp','reference-search'):
        c['items']=item_set(['原始素材','方案选择','执行结果','共享成果','现场记录','关键证据'])
        c['pack']['columns']=3
    if name in ('comparison-bars','cost-columns','result-compare'):
        c['items']=item_set(['原始方案','调整方案']);c['values']=[36,72]
    media_effects=('feed-montage','magazine-collage','media-stage','reference-search','gallery-camera','curved-screen','window-detail','unlock-reveal','repository-copy','result-compare','phone-focus','creator-filmstrip')
    if name in media_effects:
        for j,it in enumerate(c['items']):
            it['image']=['scene-a.jpg','scene-b.jpg','scene-c.jpg'][j%3]
            it['label']=['地球影像','飞船记录','月面资料'][j%3]
        if name in ('feed-montage','media-stage'):
            c['items'][0].pop('image');c['items'][0]['video']='media-sample.mp4';c['items'][0]['label']='摄影动画示例'
        if name=='media-stage':c['selectedId']='item-1'
        c['kicker']='NASA 摄影 · 来源见素材说明'
    if name=='curved-screen':c['pack']['depth']=115
    if name=='creator-filmstrip': c['items'][0]['shape']='person'
    if name=='consumable-ban': c['items'][0]['shape']='cup'
    if name=='luxury-dome': c['items'][0]['shape']='chip'
    if name=='quota-ring': c['metric']={'value':68,'unit':'%','label':'剩余额度'}
    if name=='token-intake': c.pop('pack')
    return c

def compose(brief):
    need(isinstance(brief,dict) and isinstance(brief.get('shots'),list) and brief['shots'],'brief needs shots')
    p={'version':3,'title':brief.get('title','本期竖屏讲解'), 'width':brief.get('width',1080),'height':brief.get('height',1920),'fps':brief.get('fps',30),
       'duration':0,'timing':brief.get('timing','demo'),'source':brief.get('source',{'type':'demo','roughcut':'not-needed'}),
       'media':brief.get('media',{}),'sample':{'duration':brief.get('sampleDuration',12),'reason':'本期开头，按完整话语边界截取'},'captions':brief.get('captions',[]),'scenes':[]}
    clock=0
    for i,shot in enumerate(brief['shots']):
        effect=shot['effect']; need(effect in EFFECTS,f'Unknown effect {effect}')
        duration=shot.get('duration',3.6); need(isinstance(duration,(int,float)) and 1<=duration<=120,'shot duration1..120')
        transition=shot.get('enter',{'type':'cut','duration':0})
        start=round(clock-transition['duration'],4); clock=round(start+duration,4)
        names=EFFECTS[effect]; marks=shot.get('marks',{name:round(duration*(.18+.64*j/max(1,len(names)-1)),4) for j,name in enumerate(names)})
        s={'id':shot.get('id',f'shot-{i+1}'),'start':start,'end':clock,'mechanism':effect,'intent':shot.get('intent',shot['title']),
           'title':shot['title'],'presenter':shot.get('presenter','hidden'),'marks':marks,'content':copy.deepcopy(shot['content']),'enter':transition}
        for k in ('accent','background','camera','markCues','sounds'):
            if k in shot:s[k]=copy.deepcopy(shot[k])
        p['scenes'].append(s)
    p['duration']=clock
    p['sample']['duration']=min(p['sample']['duration'],clock)
    return p

def catalog():
    shots=[]
    for i,(name,title,group,source,duration,meaning) in enumerate(ROWS):
        shots.append({'effect':name,'title':title,'duration':duration,'intent':meaning,'content':scene_content(name,title),
                      'enter':{'type':'cut','duration':0} if i==0 else {'type':'window' if group.startswith('软件') else 'circle','duration':.18,'x':50,'y':50},
                      'sounds':[{'at':0,'name':'whoosh','volume':.17},{'at':round(duration*.5,3),'name':'tick' if 'UI' in group else 'pop','volume':.2},{'at':round(duration*.82,3),'name':'chime' if i%3==0 else 'drop','volume':.16}]})
        if name=='media-stage':shots[-1]['marks']={'reveal':duration*.35,'act':duration*.7,'resolve':duration*.9}
    p=compose({'title':'原片剪辑机制全集 · 可编辑演示','width':540,'height':960,'shots':shots,'sampleDuration':12})
    p['captions']=[{'id':f'effect-{i}','start':s['start']+.22,'end':s['end']-.08,'text':f'{i+1:02d}  {s["title"]}'} for i,s in enumerate(p['scenes'])]
    return p

def example():
    specs=[('media-stage','先腾出一张桌面',3.5,['桌面','设备','参考资料']),
           ('reference-search','找到你真正要做的事',3.6,['阅读','写作','会议','收纳','学习','休息']),
           ('object-array-flip','按用途重新安排物件',4.6,['笔记本','水杯','资料','台灯','耳机','键盘']),
           ('comparison-bars','把时间留给重点',3.1,['整理前','整理后','深度工作']),
           ('sharing-network','成果分享给伙伴',3.4,['设计','写作','研究','剪辑','教学']),
           ('celebration-type','让每次开始轻一点',3.2,['创造','专注','分享'])]
    shots=[]
    for i,(effect,title,duration,labels) in enumerate(specs):
        content=scene_content(effect,title);content['items']=item_set(labels);content['selectedId']='item-2'
        # This example uses its own native objects, not the catalog's NASA media.
        content['kicker']='可编辑机制演示'
        content['values']=[25,65,85] if effect=='comparison-bars' else [30+10*j for j in range(len(labels))]
        content['body']='先确定这一刻最重要的任务，再为它准备工具和资料。';content['result']='开始今天的创作';content['pack']={'columns':3,'angle':16,'direction':'right'}
        # Preserve this published example's chosen transitions and timings;
        # new briefs use a direct cut unless they explicitly choose otherwise.
        transition={'type':'cut','duration':0} if i==0 else {'type':'circle','duration':.22,'x':50,'y':50}
        shots.append({'effect':effect,'title':title,'duration':duration,'content':content,'intent':title,'enter':transition})
    return compose({'title':'换题组合：整理创作桌面','width':540,'height':960,'shots':shots,'sampleDuration':11.26})

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['list','catalog','example','compose','describe','find'])
    parser.add_argument('brief',nargs='?',help='brief.json, effect name, or quoted search keywords')
    parser.add_argument('--out',type=Path);parser.add_argument('--media-dir',type=Path)
    parser.add_argument('--json',action='store_true',help='Machine-readable describe/find output')
    args=parser.parse_args()
    if args.command in ('describe','find'):
        from effect_recipes import describe, find, format_description
        need(args.brief,f'{args.command} needs an effect name or keyword')
        need(args.out is None and args.media_dir is None,'describe/find write to stdout; omit --out and --media-dir')
        if args.command=='describe':
            recipe=describe(args.brief)
            print(json.dumps(recipe,ensure_ascii=False,indent=2) if args.json else format_description(recipe))
        else:
            results=find(args.brief)
            if args.json:print(json.dumps(results,ensure_ascii=False,indent=2))
            else:
                print('按字面关键词匹配，不调用模型；按表达用途选取，不必逐个使用。')
                for row in results:print(f'{row["effect"]:22} {row["title"]} | {row["group"]} | {row["purpose"]}')
                if not results:print('未找到匹配入口；试用更短的关键词，或运行 list。')
        return
    need(not args.json,'--json is supported by describe/find only')
    if args.command=='list':
        for name,title,group,source,duration,meaning in ROWS: print(f'{name:22} {title} | {group} | {meaning}')
        print('Additional legacy chains/free UI:',', '.join(n for n in EFFECTS if n not in {r[0] for r in ROWS}));return
    need(args.out,'--out is required');need(not args.out.exists(),'Output exists; choose a new path')
    if args.command=='catalog':p=catalog()
    elif args.command=='example':p=example()
    else:
        need(args.brief,'compose needs brief.json');p=compose(json.loads(Path(args.brief).read_text(encoding='utf-8-sig')))
    media_root=args.media_dir or (Path(__file__).resolve().parents[1]/'examples/full-effects/media' if args.command=='catalog' else None)
    validate(p,media_dir=media_root)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Written {args.out.name}: {len(p["scenes"])} scenes, {p["duration"]} seconds; timings={p["timing"]}')

if __name__=='__main__':
    if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8');sys.stderr.reconfigure(encoding='utf-8')
    try:main()
    except (Invalid,KeyError,TypeError,ValueError,OSError) as e:print(f'ERROR: {e}',file=sys.stderr);sys.exit(1)
