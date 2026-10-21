"""Author-maintained final review notes. Page numbers are PDF positions, not footers."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def write(path,data):
    (ROOT/path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def example(lang,code,explanation,**extra):return dict(lang=lang,code=code.strip(),explanation=explanation,**extra)
def question(prompt,answer):return dict(prompt=prompt,answer=answer)
def section(title,pages,paragraphs,takeaways,**extra):
    return dict(title=title,pages=sorted(pages),kind='concept',paragraphs=paragraphs,takeaways=takeaways,**extra)
def link(label,url):return dict(label=label,url=url)
def build(slug,title,intro,goals,sections,page_notes,connections,checklist):
    notes=[line.split('|',1) for line in page_notes.strip().splitlines()]
    rows=[]
    for n,(heading,note) in enumerate(notes,1):
        matches=[s for s in sections if n in s['pages']]
        assert len(matches)==1,(slug,n)
        s=matches[0];priority='core' if s['kind']=='concept' else 'skim'
        row=dict(page=n,title=heading,section=s['title'],priority=priority,summary=note,
                 explanation=[note,*s['paragraphs']],takeaways=s['takeaways'])
        if n==s.get('anchor',s['pages'][0]):
            for key in ('example','question','links'):
                if key in s:row[key]=s[key]
        rows.append(row)
    assert sorted(p for s in sections for p in s['pages'])==list(range(1,len(rows)+1))
    write(Path('content')/(slug+'.json'),rows)
    write(Path('content/interpretations')/(slug+'.json'),dict(id=slug,title=title,intro=intro,goals=goals,sections=sections,connections=connections,examChecklist=checklist))

