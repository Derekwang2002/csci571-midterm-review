"""Prepare only the three new lecture PDFs; preserve existing slide assets and IDs."""
from pathlib import Path
import subprocess,json,concurrent.futures
from PIL import Image,ImageDraw
SITE=Path(__file__).resolve().parents[1];ROOT=SITE.parent
NEW=[('responsive','responsive.pdf','Responsive Web Design','视口、媒体查询、弹性布局与 Bootstrap 栅格'),('react','React.pdf','React','组件、props/state、生命周期与 React Native'),('node','Node.pdf','Node.js','异步 I/O、模块、HTTP 与后端路由')]
TEMP=ROOT/'tmp/final-source';TEMP.mkdir(parents=True,exist_ok=True)
def prepare(row):
 slug,file,title,description=row;dest=SITE/'assets/slides'/slug;dest.mkdir(parents=True,exist_ok=True)
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
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(prepare,NEW))
decks=json.loads((SITE/'content/decks.json').read_text());sources=json.loads((SITE/'content/sources.json').read_text());newids={r[0]['id'] for r in results}
old=[dict(d,phase='admin' if d['id']=='syllabus' else 'foundation') for d in decks if d['id'] not in newids]
for d,records in results:sources[d['id']]=records
(SITE/'content/decks.json').write_text(json.dumps([r[0] for r in results]+old,ensure_ascii=False,indent=2)+'\n')
(SITE/'content/sources.json').write_text(json.dumps(sources,ensure_ascii=False))
print([(d['id'],d['count']) for d,_ in results])
