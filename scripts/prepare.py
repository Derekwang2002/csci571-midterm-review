from pathlib import Path
import subprocess,json,concurrent.futures
from PIL import Image,ImageDraw
SITE=Path(__file__).resolve().parents[1]
ROOT=SITE.parent
(ROOT/'tmp/midterm').mkdir(parents=True,exist_ok=True)
DECKS=[('intro','CourseIntro','课程导览','网站、浏览器与云计算'),('web','internetwebbasics','Internet 与 Web','基础架构、URL 与 Web 历史'),('html','HTML','HTML','结构、链接、表格与媒体'),('css','HTMLStyleSheets','CSS','选择器、层叠与盒模型'),('jsbasics','jsbasics','JavaScript 基础','类型、作用域、数组与函数'),('json','json','JSON','数据交换、解析与同源策略'),('python','python','Python 与后端','语言基础、Flask 与 Web 框架'),('dom','dom','DOM','节点树、查询、遍历与修改'),('forms','FormsAndCGIMechanism','Forms 与 CGI','表单提交与服务器交互'),('vibe','CSCI571_Vibe_Coding','Vibe Coding','提示、测试、调试与迭代'),('ai','AIbasics','AI Basics','AI 概念、协作与编码原则'),('jsadvanced','jsadvanced','JavaScript 进阶','浏览器对象、转换与正则'),('http','HTTPProtocol','HTTP 与网络','报文、缓存、寻址与子网'),('syllabus','CSCI571_syllabus_Fall_2026_v3','考试与课程安排','范围依据、评分与考试要求')]
def process(row):
 slug,stem,title,desc=row
 folder=SITE/'assets/slides'/slug;folder.mkdir(parents=True,exist_ok=True)
 src=ROOT/'tmp/review-source'/slug;src.mkdir(parents=True,exist_ok=True)
 txt=ROOT/'tmp/midterm'/(stem+'.txt')
 if not txt.exists(): subprocess.run(['pdftotext','-layout',str(ROOT/(stem+'.pdf')),str(txt)],check=True)
 pages=txt.read_text().split('\f')
 if not pages[-1].strip():pages.pop()
 (src/'pages.json').write_text(json.dumps([{'page':i+1,'text':t} for i,t in enumerate(pages)],ensure_ascii=False,indent=2))
 subprocess.run(['pdftoppm','-jpeg','-jpegopt','quality=85','-scale-to','1440',str(ROOT/(stem+'.pdf')),str(src/'render')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 files=sorted(src.glob('render-*.jpg'))
 for i,f in enumerate(files,1): f.rename(folder/f'{i:03}.jpg')
 for start in range(0,len(pages),9):
  sheet=Image.new('RGB',(1500,1245),'#e8e8e8');d=ImageDraw.Draw(sheet)
  for j,n in enumerate(range(start,min(start+9,len(pages)))):
   img=Image.open(folder/f'{n+1:03}.jpg');img.thumbnail((490,380))
   x=j%3*500+(500-img.width)//2;y=j//3*415+26
   sheet.paste(img,(x,y));d.text((j%3*500+12,j//3*415+5),f'{slug} / PDF PAGE {n+1}',fill='black')
  sheet.save(src/f'contact-{start//9+1:02}.jpg',quality=88)
 return {'id':slug,'file':stem+'.pdf','title':title,'description':desc,'count':len(pages),'sourcePages':[{'page':i+1,'text':t} for i,t in enumerate(pages)]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 data=list(pool.map(process,DECKS))
(SITE/'content/sources.json').write_text(json.dumps({d['id']:d['sourcePages'] for d in data},ensure_ascii=False))
for d in data:del d['sourcePages']
(SITE/'content/decks.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print(json.dumps([(d['id'],d['count']) for d in data]))
