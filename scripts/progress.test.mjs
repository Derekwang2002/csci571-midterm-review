import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressStore, PROGRESS_PREFIX} from '../progress.js';

class Storage {
  values=new Map(); blocked=false;
  get length(){return this.values.size}
  key(index){return [...this.values.keys()][index]??null}
  getItem(key){return this.values.get(key)??null}
  setItem(key,value){if(this.blocked)throw new Error('QuotaExceededError');this.values.set(key,String(value))}
}
const decks=[{id:'html',title:'HTML',count:73},{id:'css',title:'CSS',count:75}];
const create=(storage,options={})=>createProgressStore({storage,decks,labIds:['css-box'],...options});
const bookmark={route:'#/interpretations/html',title:'HTML 整体总结',y:1800,anchor:'interpretation-section-4',offset:-30,open:[2,5]};
const quiz={pool:['html:14','css:26'],index:1,correct:1,revealed:true,started:123456789,finishedAt:null,deck:'all',mode:'core'};

test('reload preserves old markers and migrates them before an old tab overwrites legacy keys',()=>{
  const storage=new Storage();storage.setItem('571-done',JSON.stringify(['html:14','bad:1','css:900']));storage.setItem('571-weak',JSON.stringify(['css:26','html:14']));
  const first=create(storage);
  assert.deepEqual([...first.readMarks().done],['html:14']);
  assert.deepEqual([...first.readMarks().weak],['css:26']);
  storage.setItem('571-done','[]');storage.setItem('571-weak','[]');
  const reload=create(storage);assert(reload.readMarks().done.has('html:14'));assert(reload.readMarks().weak.has('css:26'));
});
test('stale tabs update only the page they changed',()=>{
  const storage=new Storage(),a=create(storage),b=create(storage);
  a.setMark('html:14','done');b.setMark('css:26','weak');a.saveReading(bookmark);
  const reload=create(storage);assert(reload.readMarks().done.has('html:14'));assert(reload.readMarks().weak.has('css:26'));
  b.setMark('html:14','weak');assert(!a.readMarks().done.has('html:14'));assert(a.readMarks().weak.has('html:14'));
});
test('removing a legacy marker stays removed after reopening',()=>{
  const storage=new Storage();storage.setItem('571-done','["html:14"]');
  create(storage).setMark('html:14','none');assert(!create(storage).readMarks().done.has('html:14'));
});
test('reading location, expanded sections and quiz state survive reopening',()=>{
  const storage=new Storage(),first=create(storage);first.saveReading(bookmark);first.saveQuiz(quiz);
  const reload=create(storage);assert.equal(reload.lastReading().route,bookmark.route);assert.equal(reload.getReading(bookmark.route).offset,-30);assert.deepEqual(reload.getReading(bookmark.route).open,[2,5]);assert.deepEqual(reload.getQuiz(),quiz);
});
test('a legacy last-read page is included in exported backups',()=>{
  const storage=new Storage();storage.setItem('571-last','{"id":"html","page":14}');
  const backup=create(storage).exportData(),destination=create(new Storage());destination.importData(backup);
  assert.equal(destination.lastReading().route,'#/deck/html/14');
});
test('backup roundtrip merges markers and restores reading/quiz data',()=>{
  const source=create(new Storage());source.setMark('html:14','done');source.saveReading(bookmark);source.saveQuiz(quiz);
  const dest=create(new Storage());dest.setMark('css:26','weak');dest.importData(JSON.parse(JSON.stringify(source.exportData())));
  assert(dest.readMarks().done.has('html:14'));assert(dest.readMarks().weak.has('css:26'));assert.equal(dest.lastReading().route,bookmark.route);assert.deepEqual(dest.getQuiz(),quiz);
});
test('invalid backup is rejected completely before any records change',()=>{
  const store=create(new Storage());store.setMark('css:26','done');const before=store.exportData();
  assert.throws(()=>store.importData({...before,done:['html:14'],readings:[{...bookmark,route:'javascript:alert(1)'}]}));
  assert(store.readMarks().done.has('css:26'));assert(!store.readMarks().done.has('html:14'));
  assert.throws(()=>store.importData({...before,quiz:{...quiz,index:3}}));
});
test('malformed stored data cannot break startup or invent progress',()=>{
  const storage=new Storage();storage.setItem('571-done','{}');storage.setItem('571-weak','"bad"');storage.setItem('571-last','{');storage.setItem(PROGRESS_PREFIX+'quiz',JSON.stringify({...quiz,pool:['html:999']}));
  const store=create(storage);assert.equal(store.readMarks().done.size,0);assert.equal(store.readMarks().weak.size,0);assert.equal(store.getQuiz(),null);assert.equal(store.lastReading(),null);
});
test('failed writes preserve the current session for export and never claim durable saving',()=>{
  const storage=new Storage(),store=create(storage);store.setMark('html:14','done');storage.blocked=true;
  store.setMark('html:14','weak');assert(!store.isAvailable());assert(store.readMarks().weak.has('html:14'));assert(!store.readMarks().done.has('html:14'));assert.deepEqual(store.exportData().weak,['html:14']);
});
