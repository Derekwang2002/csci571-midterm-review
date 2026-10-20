// A deliberately bounded teaching model, not a Node or Express runtime.
export function encodeBytes(text,limit) {
  const all=new TextEncoder().encode(text),bytes=all.slice(0,limit??all.length);
  return {units:text.length,points:[...text].length,total:all.length,bytes:[...bytes],
    hex:[...bytes].map(n=>n.toString(16).padStart(2,'0')).join(''),
    base64:btoa(String.fromCharCode(...bytes)),decoded:new TextDecoder('utf-8',{ignoreBOM:true}).decode(bytes)};
}
export function requestModel({method,id,sort,route,type,body,parser,gate}) {
  const trace=[],rows=[];
  const result={trace,rows,status:null,response:null,parsed:undefined};
  const finish=(status,response)=>{result.status=status;result.response=response;return result};
  trace.push('1. gate 中间件');
  if(gate==='block'){trace.push('res.status(401).json(...) → 结束');return finish(401,{error:'blocked'})}
  if(gate==='hang'){trace.push('既没 next() 也没发送响应 → 停在这里');return result}
  trace.push('next() → 继续');
  if(parser==='before'){
    trace.push('2. express.json()');
    if(type==='application/json'&&body.trim()){
      try{
        result.parsed=JSON.parse(body);
        if(result.parsed===null||typeof result.parsed!=='object')throw Error('strict JSON');
        trace.push('JSON body 解析成功');
      }catch{trace.push('解析失败 → 错误处理中间件');return finish(400,{error:'invalid JSON'})}
    }else trace.push(type==='application/json'?'空 body，无可用字段':'Content-Type 不匹配，跳过 JSON 解析');
  }
  trace.push(`3. ${method} ${route==='users'?'/users/:id':'/missing'}`);
  if(route==='users'){
    if(method==='GET'){
      trace.push('req.params.id + req.query.sort → 200');
      return finish(200,{id,sort});
    }
    if(typeof result.parsed?.name!=='string'||!result.parsed.name.trim()){
      trace.push('req.body?.name 校验失败 → 422');
      return finish(422,{error:'name required'});
    }
    trace.push('req.body.name → 201');
    return finish(201,{id,name:result.parsed.name});
  }
  if(parser==='after'){
    trace.push('4. 路由未命中，才到末尾的 express.json()');
    if(type==='application/json'&&body.trim()){
      try{
        const value=JSON.parse(body);
        if(value===null||typeof value!=='object')throw Error('strict JSON');
        result.parsed=value;trace.push('JSON body 解析成功');
      }catch{trace.push('解析失败 → 错误处理中间件');return finish(400,{error:'invalid JSON'})}
    }
  }
  trace.push('5. 兜底处理 → 404');return finish(404,{error:'not found'});
}

// Runs in a Worker: real JS tasks/microtasks, with an explicitly simulated I/O source.
export function asyncWorkerSource() {
  return `onmessage = async ({data: p}) => {
  const start = performance.now();
  const log = text => postMessage({text,ms:Math.round(performance.now()-start)});
  const busy = ms => { const end=performance.now()+ms; while(performance.now()<end){} };
  const read = cb => setTimeout(() => cb(p.fail ? new Error('ENOENT') : null,'file data'),p.delay);
  log('A: start');
  queueMicrotask(() => log('M: microtask'));
  if(p.mode==='sync') {
    busy(p.delay);
    log(p.fail?'B: ENOENT':'B: file data');
    busy(p.block);
    log('C: synchronous tail');
  } else if(p.mode==='await') {
    try { const value=await new Promise((resolve,reject)=>read((err,value)=>err?reject(err):resolve(value))); log('B: '+value); }
    catch(error){ log('B: '+error.message); }
    log('C: after await');
  } else {
    read((err,value)=>{log('B: '+(err?err.message:value));postMessage({done:true})});
    busy(p.block);
    log('C: synchronous tail');
  }
  if(p.mode!=='callback') setTimeout(()=>postMessage({done:true}),0);
};`;
}
