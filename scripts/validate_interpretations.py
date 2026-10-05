from pathlib import Path
from collections import Counter
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[];stats=[]
for deck in json.loads((ROOT/'content/decks.json').read_text()):
    path=ROOT/'content/interpretations'/f'{deck["id"]}.json'
    if not path.exists():errors.append(f'Missing {path.name}');continue
    try:
        data=json.loads(path.read_text())
        assert data['id']==deck['id']
        for field in ('title','intro'):assert isinstance(data[field],str) and data[field].strip(),field
        for field in ('goals','connections','examChecklist'):assert isinstance(data[field],list) and all(isinstance(x,str) and x.strip() for x in data[field]),field
        counter=Counter()
        for n,section in enumerate(data['sections'],1):
            assert section['kind'] in ('concept','background','history','admin'),f'section {n}: kind'
            assert section['title'].strip(),f'section {n}: title'
            assert section['pages'] and all(type(p)==int for p in section['pages']),f'section {n}: pages'
            assert section['pages']==sorted(section['pages']),f'section {n}: order'
            counter.update(section['pages'])
            for field in ('paragraphs','takeaways'):
                assert section[field] and all(isinstance(p,str) and p.strip() for p in section[field]),f'section {n}: {field}'
            if section.get('example'):
                for field in ('lang','code','explanation'):assert section['example'][field].strip(),f'section {n}: example {field}'
        assert sorted(counter)==list(range(1,deck['count']+1)),'Page coverage differs from original'
        assert all(v==1 for v in counter.values()),'Duplicate page coverage'
        stats.append(dict(id=deck['id'],pages=sum(counter.values()),sections=len(data['sections']),history_pages=sum(len(s['pages']) for s in data['sections'] if s['kind']=='history'),explanation_chars=sum(len(p) for s in data['sections'] for p in s['paragraphs'])))
    except Exception as error:errors.append(f'{deck["id"]}: {error}')
print(json.dumps(dict(decks=len(stats),pages=sum(s['pages'] for s in stats),stats=stats,errors=errors),ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
