from pathlib import Path
import json,collections,sys,re
root=Path(__file__).resolve().parents[1]
decks=json.loads((root/'content/decks.json').read_text());sources=json.loads((root/'content/sources.json').read_text())
errors=[];stats=[];all_summaries=[]
for d in decks:
 file=root/'content'/(d['id']+'.json')
 if not file.exists(): errors.append(f'Missing {file}');continue
 rows=json.loads(file.read_text())
 if [p['page'] for p in rows]!=list(range(1,d['count']+1)):errors.append(f"{d['id']}: incomplete/duplicate page sequence")
 if len(sources[d['id']])!=d['count']:errors.append(f"{d['id']}: missing source text pages")
 for p in rows:
  ident=f"{d['id']}:{p['page']}"
  for f in ['title','section','priority','summary','explanation','takeaways']:
   if not p.get(f):errors.append(f'{ident}: missing {f}')
  if p.get('priority') not in ['core','support','skim','admin']:errors.append(f'{ident}: bad priority')
  if not isinstance(p.get('explanation'),list) or not all(isinstance(s,str) and s.strip() for s in p['explanation']):errors.append(f'{ident}: bad paragraphs')
  if not (root/'assets/slides'/d['id']/f"{p['page']:03}.jpg").exists():errors.append(f'{ident}: missing image')
  if p.get('example'):
   for f in ['lang','code','explanation']:
    if not p['example'].get(f):errors.append(f'{ident}: example missing {f}')
  if p.get('question'):
   for f in ['prompt','answer']:
    if not p['question'].get(f):errors.append(f'{ident}: question missing {f}')
  all_summaries.append(p['summary'])
 stats.append({'id':d['id'],'pages':len(rows),'examples':sum('example' in x for x in rows),'questions':sum('question' in x for x in rows),'explanation_chars':sum(len(x['summary'])+sum(map(len,x['explanation'])) for x in rows)})
for summary,count in collections.Counter(all_summaries).items():
 if count>1:errors.append(f'Duplicate summary x{count}: {summary[:60]}')
print(json.dumps({'stats':stats,'pages':sum(d['pages'] for d in stats),'examples':sum(d['examples'] for d in stats),'questions':sum(d['questions'] for d in stats),'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
