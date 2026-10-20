import {bench,ref,report,pending,invalid,esc,numberControl,selectControl,metrics,links} from './labs-final-shared.js?v=20261020-labs';
import {encodeBytes,requestModel,asyncWorkerSource} from './labs-node-model.js?v=20261020-labs';
function asyncLab(root) {
  const ui=bench(root,selectControl('mode','读取写法',[['callback','fs.readFile：回调'],['await','fs/promises：await'],['sync','fs.readFileSync：同步']])+
    numberControl('delay','模拟 I/O 等待（0–300 ms）',80,0,300)+numberControl('block','额外同步 CPU 工作（0–200 ms）',0,0,200)+
    selectControl('fail','文件结果',[['no','成功：file data'],['yes','失败：ENOENT']])+
    '<button class="primary" data-run>执行并观察时间线</button>',
    '<ol class="final-trace" data-trace aria-label="本次执行时间线"></ol><div data-metrics></div>'+links([['Node 文件 API','https://nodejs.org/api/fs.html']]),
    '浏览器 Worker 实际运行 JavaScript 任务与微任务；用定时器模拟文件等待，不读取本机文件。它不是完整 Node 事件循环模拟，不用于推断 nextTick、setImmediate 或 I/O phase 的细节。');
  let worker,timer,disposed=false;
  const stop=()=>{worker?.terminate();worker=null;clearTimeout(timer);ui.$('[data-run]').disabled=false};
  const read=()=>({mode:ui.$('[data-mode]').value,delay:+ui.$('[data-delay]').value,block:+ui.$('[data-block]').value,fail:ui.$('[data-fail]').value==='yes'});
  const update=()=>{
    stop();const p=read();ui.$('[data-block]').disabled=p.mode==='await';
    const readCode={callback:"readFile('demo.txt', 'utf8', (err, data) => {\n  console.log('B:', err ? err.code : data);\n});",await:"try {\n  const data = await readFile('demo.txt', 'utf8');\n  console.log('B:', data);\n} catch (err) { console.log('B:', err.code); }",sync:"try {\n  const data = readFileSync('demo.txt', 'utf8');\n  console.log('B:', data);\n} catch (err) { console.log('B:', err.code); }"}[p.mode];
    ui.code(`// 对应的 Node 示例；下面时间线的 I/O 等待由浏览器模拟\nimport { ${p.mode==='sync'?'readFileSync':'readFile'} } from '${p.mode==='await'?'node:fs/promises':'node:fs'}';\nconsole.log('A: start');\nqueueMicrotask(() => console.log('M: microtask'));\n${readCode}\n${p.mode==='await'?'':`// 本实验另加 ${p.block}ms 同步 CPU 工作\n`}console.log('C: ${p.mode==='await'?'after await':'synchronous tail'}');`);
    ui.$('[data-trace]').replaceChildren();ui.$('[data-metrics]').innerHTML=metrics([['模拟 I/O',`${p.delay} ms`],['CPU 工作',p.mode==='await'?'本模式不添加':`${p.block} ms`]]);
    pending(root,`${p.mode} / ${p.fail?'ENOENT':'成功'} / I/O ${p.delay}ms`);
  };
  ui.on(ui.$('[data-run]'),'click',()=>{
    stop();const p=read(),lines=[];ui.$('[data-trace]').replaceChildren();ui.$('[data-run]').disabled=true;
    report(root,'正在记录本次执行顺序',[],'running');
    const url=URL.createObjectURL(new Blob([asyncWorkerSource()],{type:'text/javascript'}));
    try{worker=new Worker(url)}catch(error){URL.revokeObjectURL(url);stop();invalid(root,error.message);return}
    URL.revokeObjectURL(url);
    worker.onmessage=({data})=>{
      if(disposed)return;
      if(data.done){
        stop();
        report(root,lines.map(l=>l.text[0]).join(' → '),[
          [`${p.mode}；I/O ${p.delay}ms；${p.fail?'失败':'成功'}`,lines.map(l=>`${l.ms}ms ${l.text}`).join('\n'),p.mode==='callback'?'Node P4、9：注册回调后继续执行同步尾部；微任务在同步栈结束后执行，文件回调稍后交付结果。':p.mode==='await'?'Node P13：await 暂停当前 async 函数后续代码，先让微任务运行；读取完成后才继续 B、C。':'Node P9：同步读取阻塞当前线程，B、C 在同步栈内执行完，微任务 M 才有机会执行。'],
          [p.mode==='await'?'await 暂停':`同步 CPU ${p.block}ms`,p.mode==='await'?'C 在 B 后':p.mode==='sync'?'B 后的 CPU 工作推迟 C 和 M':'C 前的 CPU 工作推迟 M 和 B','异步 I/O 不会让同一线程上的 CPU 密集循环自动并行。这里耗时是浏览器实测近似值，不是 Node 性能基准。'],
          [`文件结果 ${p.fail?'ENOENT':'file data'}`,lines.find(l=>l.text.startsWith('B:'))?.text||'',p.mode==='callback'?'回调方式先检查 err；失败不能当成成功数据使用。':'同步 throw / Promise reject 在 try/catch 中处理；失败不表示后续代码一定不执行。']
        ]);return;
      }
      lines.push(data);
      ui.$('[data-trace]').innerHTML=lines.map(l=>`<li><strong>${l.ms} ms</strong> ${esc(l.text)}</li>`).join('');
    };
    worker.onerror=()=>{stop();invalid(root,'Worker 无法执行，请重置后重试。')};
    timer=setTimeout(()=>{stop();invalid(root,'执行超时，已停止；请重试。')},3000);
    worker.postMessage(p);
  });
  for(const f of ['mode','delay','block','fail'])ui.on(ui.$(`[data-${f}]`),'input',update);
  update();return()=>{disposed=true;stop();ui.destroy()};
}

function bufferLab(root) {
  const ui=bench(root,'<label>输入字符串<textarea data-text maxlength="240" spellcheck="false">A中🙂</textarea></label>'+
    selectControl('preset','填入示例',[['mixed','A中🙂'],['ascii','Hello'],['chinese','中'],['emoji','🙂']])+
    selectControl('slice','解码范围',[['all','全部字节'],['prefix','只取前 N 个字节']])+
    numberControl('limit','前 N 个字节',2,0,8),
    '<div data-metrics></div><div class="byte-strip" data-bytes aria-label="UTF-8 字节"></div><dl class="encoding-output" data-output></dl>'+links([['Node Buffer','https://nodejs.org/api/buffer.html']]),
    '浏览器用 TextEncoder/TextDecoder 实际编码解码，并展示等价的 Node Buffer 代码。此处没有 Node Buffer 对象；字节结果可复制到 Node 核对。');
  const update=()=>{
    const text=ui.$('[data-text]').value,all=encodeBytes(text),slice=ui.$('[data-slice]').value==='prefix';
    ui.$('[data-limit]').max=all.total;ui.$('[data-limit]').disabled=!slice;
    const limit=slice?+ui.$('[data-limit]').value:all.total,result=encodeBytes(text,limit);
    ui.code(`const text = ${JSON.stringify(text)};\nconst buf = Buffer.from(text, 'utf8');\nconsole.log(text.length, buf.length);\nconst selected = ${slice?`buf.subarray(0, ${limit})`:'buf'};\nconsole.log(selected.toString('hex'));\nconsole.log(selected.toString('base64'));\nconsole.log(selected.toString('utf8'));`);
    ui.$('[data-metrics]').innerHTML=metrics([['string.length',all.units],['Unicode 码点',all.points],['Buffer 总字节',all.total]]);
    ui.$('[data-bytes]').innerHTML=result.bytes.map((n,i)=>`<span><small>[${i}]</small>${n.toString(16).padStart(2,'0')}</span>`).join('')||'<span>空字节序列</span>';
    ui.$('[data-output]').innerHTML=[['hex',result.hex],['base64',result.base64],['UTF-8 解码',JSON.stringify(result.decoded)]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)||'（空）'}</dd>`).join('');
    report(root,`${all.units} 个 UTF-16 单元 → ${all.total} 字节；当前解码 ${limit} 字节`,[
      [`输入 ${JSON.stringify(text)}`,`length=${all.units}；码点=${all.points}；UTF-8 bytes=${all.total}`,'Node P10：字符串 length 数 UTF-16 code units，Buffer.length 数字节，二者都不等于用户看到的“字数”。emoji 常用两个 UTF-16 单元和四个 UTF-8 字节。'],
      [slice?`取前 ${limit} 字节`:'保留所有字节',JSON.stringify(result.decoded),result.decoded.includes('\uFFFD')?'本次含替换字符 �：常见原因是截断了一个多字节字符（也可能输入本身就含 �）。按字节切片不保证完整字符。':'字节解码得到这里显示的字符串。空字节序列得到空字符串；UTF-8 字符边界与字符串索引不同。'],
      ['同一组选中字节',`hex=${result.hex||'空'}；base64=${result.base64||'空'}`,'Node P11：hex 与 base64 是字节的不同文本表示，都是可逆编码，不是加密。']
    ]);
  };
  for(const f of ['text','slice','limit'])ui.on(ui.$(`[data-${f}]`),'input',update);
  ui.on(ui.$('[data-preset]'),'change',()=>{ui.$('[data-text]').value={mixed:'A中🙂',ascii:'Hello',chinese:'中',emoji:'🙂'}[ui.$('[data-preset]').value];update()});
  update();return ui.destroy;
}

function requestLab(root) {
  const ui=bench(root,selectControl('method','HTTP 方法',[['GET','GET：读 params/query'],['POST','POST：读 JSON body']])+
    selectControl('route','请求路径',[['users','/users/:id'],['missing','/missing：路由不存在']])+
    '<label>URL 中的 id<input data-id value="42" maxlength="24"></label>'+
    selectControl('sort','query：sort',[['asc','asc'],['desc','desc']])+
    selectControl('parser','express.json() 的位置',[['before','在业务路由之前'],['after','在业务路由之后']])+
    selectControl('type','Content-Type',[['application/json','application/json'],['text/plain','text/plain']])+
    '<label>请求 body（可编辑 JSON）<textarea data-body maxlength="1000" spellcheck="false">{"name":"Ada"}</textarea></label>'+
    selectControl('gate','第一个中间件的行为',[['next','调用 next()'],['block','返回 401，结束响应'],['hang','漏掉 next()，也不响应']])+
    '<button class="primary" data-run>发送模拟请求</button>',
    '<div data-metrics></div><ol class="final-trace" data-trace aria-label="中间件执行路径"></ol><pre class="lab-code" data-response aria-label="模拟 HTTP 响应">尚未发送</pre>'+links([['Express 中间件','https://expressjs.com/en/guide/using-middleware.html']]),
    '浏览器中的 Express 请求链教学模拟；没有启动 Node 服务器，也没有发送网络请求。支持本页列出的路由和选项，响应由当前输入逐步计算。下方提供可在 Node 运行的对应服务代码。');
  const read=()=>Object.fromEntries(['method','route','id','sort','parser','type','body','gate'].map(k=>[k,ui.$(`[data-${k}]`).value]));
  const path=p=>p.route==='users'?`/users/${encodeURIComponent(p.id)}?sort=${p.sort}`:'/missing';
  const update=()=>{
    const p=read();ui.$('[data-id]').disabled=p.route!=='users';ui.$('[data-sort]').disabled=p.route!=='users';
    ui.code(`import express from 'express';\nconst app = express();\napp.use((req,res,next) => {\n  ${p.gate==='next'?'next();':p.gate==='block'?'res.status(401).json({error:"blocked"});':'// 缺少 next() 和响应，请求会挂起'}\n});\n${p.parser==='before'?'app.use(express.json());':''}\napp.get('/users/:id', (req,res) => {\n  res.json({id:req.params.id, sort:req.query.sort});\n});\napp.post('/users/:id', (req,res) => {\n  if (typeof req.body?.name !== 'string' || !req.body.name.trim())\n    return res.status(422).json({error:'name required'});\n  res.status(201).json({id:req.params.id, name:req.body.name});\n});\n${p.parser==='after'?'app.use(express.json());':''}\napp.use((req,res) => res.status(404).json({error:'not found'}));\napp.use((err,req,res,next) => res.status(400).json({error:'invalid JSON'}));\napp.listen(3000);\n// 请求：${p.method} ${path(p)}\n// Content-Type: ${p.type}\n// body:\n${p.body.split('\n').map(line=>'// '+line).join('\n')}`);
    ui.$('[data-trace]').replaceChildren();ui.$('[data-response]').textContent='尚未发送；上次结果已清除。';
    ui.$('[data-metrics]').innerHTML=metrics([['当前请求',`${p.method} ${path(p)}`]]);
    pending(root,`${p.method} ${path(p)}`);
  };
  ui.on(ui.$('[data-run]'),'click',()=>{
    const p=read(),out=requestModel(p);
    // The model deliberately restricts IDs so its route semantics stay unambiguous.
    if(p.route==='users'&&!p.id.trim()){invalid(root,'请填写 URL 中的 id。');return}
    ui.$('[data-trace]').innerHTML=out.trace.map(t=>`<li>${esc(t)}</li>`).join('');
    ui.$('[data-response]').textContent=out.status===null?'无响应：请求停在第一个中间件。':`HTTP ${out.status}\nContent-Type: application/json\n\n${JSON.stringify(out.response,null,2)}`;
    ui.$('[data-metrics]').innerHTML=metrics([['请求',`${p.method} ${path(p)}`],['响应',out.status??'挂起'],['req.body',out.parsed===undefined?'undefined':JSON.stringify(out.parsed)]]);
    report(root,`${p.method} ${path(p)} → ${out.status??'挂起，无响应'}`,[
      [`首个中间件：${p.gate}`,p.gate==='next'?'继续进入后续层':p.gate==='block'?'401，后续层未执行':'挂起，后续层未执行','Node P21：next() 才进入下一层。发送响应结束处理；既不 next 也不响应会让请求等待。'],
      [`parser 在路由${p.parser==='before'?'前':'后'}；${p.type}`,out.parsed===undefined?'本次未得到解析后的 body':JSON.stringify(out.parsed),'Node P21、26：JSON parser 按注册顺序运行，还要匹配 Content-Type。已发送响应的路由不会自动回头执行后置 parser。语法坏的 JSON 在 parser 处返回 400。'],
      [`${p.method} ${path(p)}`,out.status===null?'没有 HTTP 响应':`${out.status}: ${JSON.stringify(out.response)}`,
        out.status===201?'POST 从 req.body.name 取数据；id 仍来自 URL 的 req.params。':out.status===200?'GET 在本例读取 params.id 与 query.sort，不从 body 中读取 name。':out.status===422?'POST 已命中，但没有非空字符串 name；检查 parser 位置、Content-Type 和 JSON 字段。':out.status===404?'方法/路径没有命中所列路由，最终到 404 兜底。':out.status===400?'JSON parser 解析失败；尚未进入正常响应。':out.status===401?'gate 已发送响应；参数和 body 不再影响本次结果。':'gate 没调用 next，也没结束响应。'],
    ]);
  });
  for(const f of ['method','route','id','sort','parser','type','body','gate'])ui.on(ui.$(`[data-${f}]`),'input',update);
  update();return ui.destroy;
}
export const nodeLabs=[
  {id:'node-async',category:'Node',title:'异步读取与执行顺序',minutes:8,summary:'选择 callback、await 或同步读取，改变等待与 CPU 时间，逐条观察输出。',goal:'区分等待 I/O、阻塞线程与暂停 async 函数。',predict:'文件等待时间是 0，回调能抢在同步尾部之前执行吗？',refs:[ref('node',4,4,'事件循环与非阻塞'),ref('node',9,9,'文件 API'),ref('node',13,13,'Promise / await')],mount:asyncLab,explanation:['回调读取登记后返回，结果稍后交付；同步读取在完成前不让同一线程继续运行。','await 暂停当前 async 函数的后续代码，不阻塞整个线程。本实验只比较示例代码的任务关系，不重现 Node 的所有阶段。'],challenges:[{prompt:'把 I/O 等待设成 0，callback 模式输出顺序是什么？',answer:'本实验仍是 A → C → M → B。0ms 不代表同步执行，定时器回调仍需等同步栈和微任务完成。'},{prompt:'异步读取注册后执行一个长 JS 循环，回调能在同一线程中途插入吗？',answer:'不能。CPU 工作不让出当前线程，回调只能等它完成；使用异步 I/O 不等于所有代码自动并行。'}]},
  {id:'node-buffer',category:'Node',title:'Buffer、UTF-8 与编码',minutes:6,summary:'输入中文或 emoji，看逐个字节，截断字节后比较 hex、base64 和 UTF-8 解码。',goal:'分清字符串长度、Unicode 码点数、UTF-8 字节数与编码表示。',predict:'“中”的 string.length 与 Buffer.length 分别是多少？只保留前 2 个字节呢？',refs:[ref('node',10,11,'Buffer 与编码转换')],mount:bufferLab,explanation:['Buffer 存的是字节。文本先按编码变成字节，同一字节序列可以显示成 hex 或 base64。','字节切片可能切断 UTF-8 多字节字符，解码器会用替换字符表示无法组成字符的部分。'],challenges:[{prompt:'“A中🙂”有多少个 UTF-16 单元、Unicode 码点、UTF-8 字节？',answer:'4 个 UTF-16 单元，3 个 Unicode 码点，8 个 UTF-8 字节。不要把这些计数都叫作“字符数”。'}]},
  {id:'node-express',category:'Node',title:'Express 中间件与请求数据',minutes:9,summary:'改请求方法、URL、JSON 和中间件顺序，查看实际走过的层与模拟响应。',goal:'定位 req.params、req.query、req.body，以及 next()/响应对请求链的影响。',predict:'把 express.json() 放到 POST 路由后面，合法 JSON 一定能被路由读取吗？',refs:[ref('node',16,16,'HTTP 请求与响应'),ref('node',21,21,'Express 请求链'),ref('node',26,26,'body parser')],mount:requestLab,explanation:['中间件按注册顺序处理；parser 应放在读取 body 的业务路由前。','本实验只实现所展示的请求链；真实 Express 还有路由匹配、错误处理中间件和流式请求等更多行为。'],challenges:[{prompt:'JSON 语法正确，为什么 POST 仍返回 422？',answer:'检查 Content-Type、parser 顺序、name 是否是非空字符串。语法正确只是一个条件，不等于业务字段有效。'},{prompt:'中间件不调用 next() 也不发送响应，是否自动跳到 404？',answer:'不会。请求停在该中间件，不能进入后面的路由或 404 处理。'}]}
];
