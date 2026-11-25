"""Prepare final lecture PDFs (or selected IDs); preserve existing assets and phases."""
from pathlib import Path
import subprocess,json,concurrent.futures,sys
from PIL import Image,ImageDraw
SITE=Path(__file__).resolve().parents[1];ROOT=SITE.parent
NEW=[('responsive','responsive.pdf','Responsive Web Design','视口、媒体查询、弹性布局与 Bootstrap 栅格'),('react','React.pdf','React','组件、props/state、生命周期与 React Native'),('node','Node.pdf','Node.js','异步 I/O、模块、HTTP 与后端路由'),('cookies','Cookies-and-Privacy.pdf','Cookies 与 Privacy','Cookie 收发与作用域、跨站状态、Session 与 JWT'),('rest','WebServices.pdf','Web Services 与 REST','资源与表示、HTTP 方法、无状态请求与 API 设计')]
NEW += [
 ('ajax','ajax.pdf','AJAX 与局部更新','从点击到局部刷新，读懂 XHR、Fetch 与跨源响应'),
 ('servers','WebServers.pdf','Web 服务器','从 URL 找到资源，理解虚拟主机、访问控制与日志'),
 ('performance','WebPerformance.pdf','安全通信与服务器性能','TLS 怎样建立信任，负载均衡与缓存怎样减少等待'),
 ('android','AndroidMobileDesign.pdf','Android 移动应用','从屏幕到组件，理解 Activity、Intent 与界面生命周期'),
 ('ios','iOSMobileDesign.pdf','iOS 移动应用','跟踪 Swift、UIKit 和 SwiftUI 中用户动作与界面状态'),
 ('highperformance','HighPerformanceWebsites.pdf','高性能网站','读请求瀑布图，判断请求数、缓存、压缩与加载顺序的影响'),
 ('lambda','Serverless-Lambda.pdf','Serverless 与 AWS Lambda','从常驻服务器到按事件执行，串起网关、函数与存储'),
 ('functions','Serverless-Functions.pdf','Google Cloud Run functions','跟踪一次 HTTP 调用如何触发函数，区分部署、运行与计费'),
 ('html5','HTML5.pdf','HTML5 与浏览器能力','语义、媒体、图形、存储与 Web API 各解决什么问题'),
 ('intrusion','Web Intrusion.pdf','Web Intrusion · Web 安全','从账户、浏览器到数据库，判断信任边界与防护位置'),
]
selected=set(sys.argv[1:]) or {row[0] for row in NEW}
assert selected <= {row[0] for row in NEW},'Unknown lecture ID'
TEMP=ROOT/'tmp/final-source';TEMP.mkdir(parents=True,exist_ok=True)
def prepare(row):
 slug,file,title,description=row
 if slug=='intrusion':
  info=subprocess.check_output(['pdfinfo',str(ROOT/file)]).decode().splitlines()
  count=int(next(line.split(':',1)[1] for line in info if line.startswith('Pages:')))
  return dict(id=slug,file=file,title=title,description=description,count=count,phase='new',sourceMode='study'),None
 dest=SITE/'assets/slides'/slug;dest.mkdir(parents=True,exist_ok=True)
 text=subprocess.check_output(['pdftotext','-layout',str(ROOT/file),'-'],stderr=subprocess.DEVNULL).decode()
 pages=text.split('\f');pages=pages[:-1] if not pages[-1].strip() else pages
 records=[{'page':i+1,'text':p.strip()} for i,p in enumerate(pages)]
 (TEMP/(slug+'-layout.json')).write_text(json.dumps(records,ensure_ascii=False,indent=2))
 if len(list(dest.glob('*.jpg')))!=len(pages):
  subprocess.run(['pdftoppm','-jpeg','-jpegopt','quality=85','-scale-to','1440',str(ROOT/file),str(TEMP/(slug+'-render'))],check=True,stderr=subprocess.DEVNULL)
  for i,path in enumerate(sorted(TEMP.glob(slug+'-render-*.jpg')),1):path.replace(dest/f'{i:03}.jpg')
 for start in range(0,len(pages),9):
  sheet=Image.new('RGB',(1500,960),'#eee');draw=ImageDraw.Draw(sheet)
  for j,n in enumerate(range(start,min(start+9,len(pages)))):
   pic=Image.open(dest/f'{n+1:03}.jpg');pic.thumbnail((490,290));x=j%3*500+(500-pic.width)//2;y=j//3*320+25
   sheet.paste(pic,(x,y));draw.text((j%3*500+8,j//3*320+6),f'{slug} PDF {n+1}',fill='black')
  sheet.save(TEMP/f'{slug}-contact-{start//9+1:02}.jpg',quality=90)
 return dict(id=slug,file=file,title=title,description=description,count=len(pages),phase='new'),records
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(prepare,[row for row in NEW if row[0] in selected]))
decks=json.loads((SITE/'content/decks.json').read_text());sources=json.loads((SITE/'content/sources.json').read_text())
by_id={d['id']:d for d in decks}
for d,_ in results:by_id[d['id']]=d
ordered=[by_id[row[0]] for row in NEW if row[0] in by_id]+[d for d in decks if d['id'] not in {row[0] for row in NEW}]
for d,records in results:
 if records is None:sources.pop(d['id'],None)
 else:sources[d['id']]=records
(SITE/'content/decks.json').write_text(json.dumps(ordered,ensure_ascii=False,indent=2)+'\n')
(SITE/'content/sources.json').write_text(json.dumps(sources,ensure_ascii=False))
print([(d['id'],d['count']) for d,_ in results])
