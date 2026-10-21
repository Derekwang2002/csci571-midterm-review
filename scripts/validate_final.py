"""Validate final-focused coverage and compact recap/quiz consistency."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((ROOT/p).read_text())
decks=read('content/decks.json');errors=[];stats=[]
for d in decks:
 try:
  slug=d['id'];folder='interpretations' if d['phase']=='new' else 'final-core'
  data=read(f'content/{folder}/{slug}.json');all_pages=[];questions=[]
  for s in data['sections']:
   all_pages+=s['pages']
   if s.get('question'):
    assert s['question']['prompt'].strip() and s['question']['answer'].strip()
    questions.append(s['question'])
   if s.get('table'):
    t=s['table'];assert t['headers'] and t['rows']
    assert all(len(row)==len(t['headers']) for row in t['rows'])
   for l in s.get('links',[]):assert l['url'].startswith('https://') and l['label']
  assert len(all_pages)==len(set(all_pages))
  assert all(1<=p<=d['count'] for p in all_pages)
  chars=sum(len(x) for s in data['sections'] for x in s['paragraphs'])
  if d['phase']=='new':
   assert sorted(all_pages)==list(range(1,d['count']+1)),'New lectures must cover every PDF page'
   notes=read(f'content/{slug}.json')
   assert [p['question'] for p in notes if p.get('question')]==[s['question'] for s in sorted(data['sections'],key=lambda s:s.get('anchor',s['pages'][0])) if s.get('question')],'Reader and summary quizzes must agree'
   assert questions,'New lectures need review questions'
  if d['phase']=='foundation':
   assert sorted(all_pages)==d['corePages']
   assert len(questions)==1,'Exactly one core question per old chapter'
   assert d['coreQuestion']['page'] in d['corePages']
   assert questions[0]=={k:d['coreQuestion'][k] for k in ('prompt','answer')}
   assert len(data['sections'])<=2 and chars<650,'Recap must stay concise'
   old=read(f'content/interpretations/{slug}.json')
   history={p for s in old['sections'] if s['kind']=='history' for p in s['pages']}
   assert not history.intersection(all_pages),'History must not become core'
  stats.append(dict(id=slug,sections=len(data['sections']),pages=len(all_pages),questions=len(questions),chars=chars))
 except Exception as e:errors.append(f"{d['id']}: {e}")
assert {'responsive':59,'react':45,'node':35,'cookies':54,'rest':36}.items() <= {d['id']:d['count'] for d in decks if d['phase']=='new'}.items()
assert sum(d['phase']=='foundation' for d in decks)==13
print(json.dumps(dict(stats=stats,errors=errors),ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
