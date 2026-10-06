import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {labs, relatedLabLinks} from '../labs.js';

const readJSON = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url),'utf8'));
const decks = await readJSON('content/decks.json');
const seen = new Set();
const referenced = new Set();
let challenges=0;
for (const lab of labs) {
  assert.match(lab.id,/^[a-z][a-z0-9-]+$/);
  assert(!seen.has(lab.id),`Duplicate experiment: ${lab.id}`);
  seen.add(lab.id);
  for (const field of ['title','category','summary','goal','predict']) assert(lab[field]?.trim(),`${lab.id}: missing ${field}`);
  assert.equal(typeof lab.mount,'function',`${lab.id}: missing mount`);
  assert(lab.minutes>0,`${lab.id}: invalid estimated time`);
  assert(lab.explanation.length>=2 && lab.explanation.every(p=>p.trim()),`${lab.id}: explanations missing`);
  assert(lab.challenges.length>=1 && lab.challenges.every(q=>q.prompt?.trim()&&q.answer?.trim()),`${lab.id}: incomplete questions`);
  challenges+=lab.challenges.length;
  assert(lab.refs.length,`${lab.id}: missing slide references`);
  for (const ref of lab.refs) {
    const deck=decks.find(deck=>deck.id===ref.deck);
    assert(deck,`${lab.id}: unknown deck ${ref.deck}`);
    const end=ref.end||ref.start;
    assert(Number.isInteger(ref.start)&&Number.isInteger(end)&&ref.start>=1&&end>=ref.start&&end<=deck.count,`${lab.id}: invalid page range`);
    const slides=await readJSON(`content/${ref.deck}.json`);
    const summary=await readJSON(`content/interpretations/${ref.deck}.json`);
    const history=new Set(summary.sections.filter(section=>section.kind==='history').flatMap(section=>section.pages));
    for(let page=ref.start;page<=end;page++) {
      assert(slides.some(slide=>slide.page===page),`${lab.id}: missing original page ${page}`);
      assert(!history.has(page),`${lab.id}: references excluded development history on ${ref.deck}:${page}`);
      assert(relatedLabLinks(ref.deck,page).includes(`#/lab/${lab.id}`),`${lab.id}: missing reverse link`);
      referenced.add(`${ref.deck}:${page}`);
    }
  }
}
console.log(JSON.stringify({experiments:labs.length,categories:Object.fromEntries([...new Set(labs.map(lab=>lab.category))].map(category=>[category,labs.filter(lab=>lab.category===category).length])),challenges,linkedSlides:referenced.size,errors:[]},null,2));
