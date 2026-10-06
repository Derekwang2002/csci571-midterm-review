// Markers have separate keys so saving one page cannot replace another tab's work.
export const PROGRESS_PREFIX = 'csci571-progress-v1:';
export function createProgressStore({decks, labIds=[], storage, onError=()=>{}}) {
  const counts=new Map(decks.map(deck=>[deck.id,deck.count]));
  const titles=new Map(decks.map(deck=>[deck.id,deck.title]));
  const memory=new Map();
  const dirty=new Set();
  let available=true;
  try {storage ??= globalThis.localStorage; if(!storage) throw new Error('Storage unavailable')} catch {available=false}
  const fail=()=>{available=false;onError()};
  const get=key=>{
    if(dirty.has(key))return memory.get(key)??null;
    try {const value=storage?.getItem(key);if(value!==null&&value!==undefined){const parsed=JSON.parse(value);memory.set(key,parsed);return parsed}}
    catch(error){if(!(error instanceof SyntaxError))fail()}
    return memory.get(key)??null;
  };
  const put=(key,value)=>{
    memory.set(key,value);
    try {if(!storage)throw new Error('Storage unavailable');storage.setItem(key,JSON.stringify(value));dirty.delete(key);available=dirty.size===0;return true}
    catch {dirty.add(key);fail();return false}
  };
  const validPage=key=>{
    if(typeof key!=='string')return false;
    const [id,page,...rest]=key.split(':');
    return !rest.length&&/^\d+$/.test(page)&&+page>=1&&+page<=counts.get(id);
  };
  const validRoute=route=>{
    if(typeof route!=='string')return false;
    const parts=route.split('/');
    if(parts[0]!=='#')return false;
    if(parts[1]==='deck')return parts.length===4&&validPage(`${parts[2]}:${parts[3]}`);
    if(parts[1]==='interpretations')return parts.length===3&&counts.has(parts[2]);
    return parts[1]==='lab'&&parts.length===3&&labIds.includes(parts[2]);
  };
  const validReading=value=>value&&validRoute(value.route)&&Number.isFinite(value.y)&&value.y>=0&&typeof value.title==='string'&&value.title.length<=300&&(!value.anchor||/^interpretation-(section-\d+|checklist)$/.test(value.anchor))&&Number.isFinite(value.offset)&&Array.isArray(value.open)&&value.open.length<=300&&value.open.every(n=>Number.isInteger(n)&&n>=0&&n<300);
  const validQuiz=value=>value&&Array.isArray(value.pool)&&value.pool.length>0&&value.pool.length<=20&&new Set(value.pool).size===value.pool.length&&value.pool.every(validPage)&&Number.isInteger(value.index)&&value.index>=0&&value.index<=value.pool.length&&Number.isInteger(value.correct)&&value.correct>=0&&value.correct<=value.index&&typeof value.revealed==='boolean'&&Number.isFinite(value.started)&&value.started>0&&(value.finishedAt===null||Number.isFinite(value.finishedAt)&&value.finishedAt>=value.started)&&['core','all','weak'].includes(value.mode)&&(value.deck==='all'||counts.has(value.deck));
  const markKey=key=>PROGRESS_PREFIX+'mark:'+key;
  const readingKey=route=>PROGRESS_PREFIX+'reading:'+route;
  const ownKeys=()=>{
    const keys=new Set(memory.keys());
    try {for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(PROGRESS_PREFIX))keys.add(key)}}catch{fail()}
    return [...keys];
  };
  // Read legacy data without deleting it. Explicit new markers override legacy snapshots.
  function readMarks(){
    const legacyDone=get('571-done'),legacyWeak=get('571-weak');
    const done=new Set(Array.isArray(legacyDone)?legacyDone.filter(validPage):[]);
    const weak=new Set(Array.isArray(legacyWeak)?legacyWeak.filter(validPage):[]);
    for(const key of done)weak.delete(key);
    for(const storageKey of ownKeys()){
      if(!storageKey.startsWith(PROGRESS_PREFIX+'mark:'))continue;
      const key=storageKey.slice((PROGRESS_PREFIX+'mark:').length),record=get(storageKey);
      if(!validPage(key)||!['done','weak','none'].includes(record?.status))continue;
      done.delete(key);weak.delete(key);
      if(record.status==='done')done.add(key);
      if(record.status==='weak')weak.add(key);
    }
    return {done,weak};
  }
  function setMark(key,status){
    if(!validPage(key)||!['done','weak','none'].includes(status))throw new Error('无效的课件进度');
    put(markKey(key),{status,updatedAt:Date.now()});
    return readMarks();
  }
  function getReading(route){const value=get(readingKey(route));return validReading(value)?value:null}
  function saveReading(value){
    if(!validReading(value))return;
    const saved={...value,updatedAt:Date.now()};
    put(readingKey(value.route),saved);put(PROGRESS_PREFIX+'last',value.route);
  }
  function lastReading(){
    const route=get(PROGRESS_PREFIX+'last');
    if(validRoute(route)){const saved=getReading(route);if(saved)return saved}
    const last=get('571-last');
    if(last&&validPage(`${last.id}:${last.page}`))return {route:`#/deck/${last.id}/${last.page}`,title:`${titles.get(last.id)} · P${last.page}`,y:0,offset:0,open:[]};
    return null;
  }
  function getQuiz(){const value=get(PROGRESS_PREFIX+'quiz');return validQuiz(value)?value:null}
  function saveQuiz(value){if(!validQuiz(value))throw new Error('无效的自测进度');put(PROGRESS_PREFIX+'quiz',value)}
  function exportData(){
    const marks=readMarks();
    const readings=ownKeys().filter(key=>key.startsWith(PROGRESS_PREFIX+'reading:')).map(get).filter(validReading);
    const last=lastReading();if(last&&!readings.some(record=>record.route===last.route))readings.push(last);
    return {app:'csci571-midterm-review',version:1,exportedAt:new Date().toISOString(),done:[...marks.done],weak:[...marks.weak],readings,last:last?.route??null,quiz:getQuiz()};
  }
  function importData(value){
    if(!value||value.app!=='csci571-midterm-review'||value.version!==1||!Array.isArray(value.done)||!Array.isArray(value.weak)||!value.done.every(validPage)||!value.weak.every(validPage)||value.done.some(key=>value.weak.includes(key))||!Array.isArray(value.readings)||!value.readings.every(validReading)||(value.last!==null&&!validRoute(value.last))||(value.quiz!==null&&!validQuiz(value.quiz)))throw new Error('备份格式或课件页码不正确；当前进度未修改。');
    for(const key of value.done)put(markKey(key),{status:'done',updatedAt:Date.now()});
    for(const key of value.weak)put(markKey(key),{status:'weak',updatedAt:Date.now()});
    for(const record of value.readings)put(readingKey(record.route),record);
    if(value.last)put(PROGRESS_PREFIX+'last',value.last);
    if(value.quiz)saveQuiz(value.quiz);
    return readMarks();
  }
  // Verify writes at startup; a blocked store must never claim that data was saved.
  put(PROGRESS_PREFIX+'storage-check',1);
  const initial=readMarks();
  for(const [status,keys] of [['done',initial.done],['weak',initial.weak]])for(const key of keys){
    if(!['done','weak','none'].includes(get(markKey(key))?.status))put(markKey(key),{status,updatedAt:Date.now()});
  }
  return {readMarks,setMark,getReading,saveReading,lastReading,getQuiz,saveQuiz,exportData,importData,isAvailable:()=>available,validRoute};
}
