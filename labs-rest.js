import {bench,ref,report,pending,invalid,esc,selectControl,metrics,links} from './labs-final-shared.js?v=20261020-labs';
import {initialResources,METHOD_INFO,resourceRequest,representation,readSimulatedResponse,responseText} from './labs-rest-model.js?v=20261021-protocol-labs';
const output=(name,label)=>`<h3>${label}</h3><pre class="lab-code" data-${name} aria-label="${label}"></pre>`;
const json=value=>JSON.stringify(value,null,2);
const methods=Object.entries(METHOD_INFO).map(([method,[label]])=>[method,`${method} · ${label}`]);
const docs=links([['HTTP 方法语义','https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2']]);
function methodLab(root) {
  const presetValues={get:['GET','/books/7',''],post:['POST','/books','{"title":"React","price":20}'],put:['PUT','/books/7','{"title":"Web","price":20}'],patch:['PATCH','/books/7','{"price":20}'],increment:['PATCH','/books/7','{"increment":1}'],delete:['DELETE','/books/7',''],head:['HEAD','/books/7',''],options:['OPTIONS','/books/7','']};
  const ui=bench(root,selectControl('preset','载入请求（资源状态继续保留）',[['get','GET 读取书 7'],['post','POST 创建新书'],['put','PUT 完整替换'],['patch','PATCH 设置固定价格'],['increment','PATCH 价格加 1'],['delete','DELETE 删除'],['head','HEAD 只有响应头'],['options','OPTIONS 查询方法']])+
    selectControl('method','HTTP 方法',methods)+'<label>资源路径<input data-path value="/books/7" maxlength="80"></label>'+selectControl('type','请求 Content-Type',[['application/json','application/json'],['text/plain','text/plain']])+
    '<label>请求 JSON body（可编辑）<textarea data-body spellcheck="false" maxlength="1200"></textarea></label><div class="lab-actions"><button class="primary" data-run>发送一次</button><button data-twice>同样请求连续发送两次</button></div><button data-follow disabled>GET 上次 Location</button><button data-resource-reset>只重置资源数据</button>',
    '<div data-metrics></div><p class="protocol-notice" data-notice role="status"></p>'+output('request','准备发送的请求')+output('response','本次响应')+
    '<div class="protocol-state-pair"><div>'+output('before','执行前的资源')+'</div><div>'+output('after','当前资源')+'</div></div><div data-history></div>'+docs,
    '浏览器内的有状态 API 教学模拟，不发送真实网络请求。初始只有 book 7，price=10；方法、路径、Content-Type 与 JSON 会真实驱动本示例的路由和数据变化。状态码来自下面的示例契约，并非所有 REST API 都必须返回相同代码。');
  let state=initialResources(),history=[],location=null;
  const read=()=>({method:ui.$('[data-method]').value,path:ui.$('[data-path]').value.trim(),type:ui.$('[data-type]').value,body:ui.$('[data-body]').value});
  const update=()=>{
    const p=read(),writes=['POST','PUT','PATCH'].includes(p.method);ui.$('[data-body]').disabled=!writes;ui.$('[data-type]').disabled=!writes;
    ui.$('[data-request]').textContent=`${p.method} ${p.path} HTTP/1.1\nHost: api.example.test${writes?'\nContent-Type: '+p.type+'\n\n'+p.body:'\n（本请求不使用 body）'}`;
    ui.$('[data-response]').textContent='请求已改变，尚未发送；上次响应已清除。';ui.$('[data-before]').textContent='发送后展示';ui.$('[data-after]').textContent=json(state.books);
    const info=METHOD_INFO[p.method];ui.$('[data-metrics]').innerHTML=metrics([['Safe',info[1]?'是':'否'],['方法是否保证幂等',info[2]?'是':'否'],['当前资源数',state.books.length]]);
    ui.$('[data-notice]').textContent='输入是下一次请求；当前资源保留到显式操作或重置。历史记录是先前请求，带有各自的输入与结果。';
    ui.code(`// 本实验的资源契约（示意）\nGET /books          → 列出资源\nGET /books/:id      → 读取，缺失 404\nPOST /books         → title + price，新 ID，201 + Location\nPUT /books/:id      → 完整 title + price，替换 200 / 新建 201\nPATCH /books/:id    → title/price 子集，或 {"increment":1}\nDELETE /books/:id   → 首次 204 / 缺失 404\nHEAD /books/:id     → GET 的元信息，不返回 body\nOPTIONS /books/:id  → 204 + Allow\n\n// PATCH 的 increment 是本示例自定义 JSON 契约，\n// 不是 JSON Patch（RFC 6902）的语法。`);
    pending(root,`${p.method} ${p.path}；当前 ${state.books.length} 条资源`);
  };
  const send=(times=1)=>{
    const p=read(),before=state.books.map(b=>({...b})),results=[];
    try {
      for(let i=0;i<times;i++){
        const out=resourceRequest(state,p);state=out.state;results.push(out);
        history.push({method:p.method,path:p.path,status:out.status,count:state.books.length,body:['POST','PUT','PATCH'].includes(p.method)?p.body:''});
        if(out.headers.Location)location=out.headers.Location;
      }
      const out=results.at(-1),changed=json(before)!==json(state.books),info=METHOD_INFO[p.method];
      ui.$('[data-before]').textContent=json(before);ui.$('[data-after]').textContent=json(state.books);
      ui.$('[data-response]').textContent=results.map((r,i)=>(times>1?`第 ${i+1} 次\n`:'')+responseText(r)).join('\n\n────────\n\n');
      ui.$('[data-metrics]').innerHTML=metrics([['状态码',results.map(r=>r.status).join(' → ')],['资源发生变化',changed?'是':'否'],['当前资源数',state.books.length]]);
      ui.$('[data-notice]').textContent=out.why;ui.$('[data-follow]').disabled=!location;ui.$('[data-follow]').textContent=location?`GET 上次 Location：${location}`:'GET 上次 Location';
      ui.$('[data-history]').innerHTML=`<h3>最近请求（最多 8 条）</h3><ol class="protocol-history">${history.slice(-8).map(h=>`<li><strong>${esc(h.method+' '+h.path)} → ${h.status}</strong><span>${h.count} 条资源${h.body?'；body '+esc(h.body):''}</span></li>`).join('')}</ol>`;
      report(root,`${p.method} ${p.path} × ${times} → ${results.map(r=>r.status).join(' → ')}`,[[`方法 ${p.method}`,`Safe=${info[1]}；方法幂等保证=${info[2]}`,'REST PDF 16：safe 看是否要求修改；幂等看重复操作的预期资源效果，不看状态码是否相同。'],
        [`路径 ${p.path}`,out.headers.Location?`新资源 ${out.headers.Location}`:out.headers.Allow?`Allow: ${out.headers.Allow}`:`${out.status}`,out.why],
        [['POST','PUT','PATCH'].includes(p.method)?`${p.type}；body ${p.body}`:'当前方法不使用请求体',out.status>=400?`请求被拒绝（${out.status}）`:changed?'资源已变化':'资源保持不变','本例 PUT 需要完整字段，PATCH 可只给 price；增量操作会累加。解析失败、校验失败和路由失败都不会修改资源。'],
        [`连续发送 ${times} 次`,`${json(before)} → ${json(state.books)}`,times===2?'比较两次响应和当前资源。POST 可重复创建，增量 PATCH 可重复累加；PUT / DELETE 即使响应不同，重复效果仍可能相同。':'可点击“同样请求连续发送两次”，从当前状态继续比较；要从相同起点比较不同方法，先重置资源数据。']
      ]);
    }catch(error){ui.$('[data-response]').textContent='没有执行：'+error.message;invalid(root,error.message)}
  };
  for(const name of ['method','path','type','body'])ui.on(ui.$(`[data-${name}]`),'input',update);
  ui.on(ui.$('[data-preset]'),'change',()=>{const [method,path,body]=presetValues[ui.$('[data-preset]').value];ui.$('[data-method]').value=method;ui.$('[data-path]').value=path;ui.$('[data-body]').value=body;update()});
  ui.on(ui.$('[data-run]'),'click',()=>send());ui.on(ui.$('[data-twice]'),'click',()=>send(2));
  ui.on(ui.$('[data-follow]'),'click',()=>{ui.$('[data-method]').value='GET';ui.$('[data-path]').value=location;update();send()});
  ui.on(ui.$('[data-resource-reset]'),'click',()=>{state=initialResources();history=[];location=null;ui.$('[data-follow]').disabled=true;ui.$('[data-follow]').textContent='GET 上次 Location';ui.$('[data-history]').replaceChildren();update()});
  update();return ui.destroy;
}
function representationLab(root) {
  const ui=bench(root,selectControl('format','服务器提供的表示',[['auto','按 Accept 选择（支持下面四类）'],['json','仅 JSON'],['html','仅 HTML'],['xml','仅 XML'],['jsonp','仅 JSONP / JavaScript']])+
    selectControl('accept','请求 Accept',[['application/json','application/json'],['text/html','text/html'],['application/xml','application/xml'],['text/javascript','text/javascript'],['application/yaml','application/yaml（本例不支持）'],['*/*','*/*（任意）']])+
    '<label>同一资源的 title<input data-title value="Web" maxlength="80"></label>'+selectControl('decoder','客户端解析方式',[['json','JSON.parse(response body)'],['text','直接读取文本']]),
    '<div data-metrics></div>'+output('response','响应类型与正文')+output('decoded','客户端得到什么')+'<div data-preview></div>'+links([['HTTP 表示与元信息','https://www.rfc-editor.org/rfc/rfc9110.html#section-8']]),
    '资源固定为 /books/7。表示协商由本地模型计算；JSON.parse 实际执行，HTML 用无脚本 iframe 实际渲染。此模型的 Accept 只支持菜单中的单一类型或 */*，不实现完整权重语法。');
  const update=()=>{
    const p={format:ui.$('[data-format]').value,accept:ui.$('[data-accept]').value,title:ui.$('[data-title]').value},decoder=ui.$('[data-decoder]').value,out=representation(p);
    ui.$('[data-response]').textContent=responseText(out);ui.$('[data-preview]').replaceChildren();
    let decoded,error;
    try{decoded=decoder==='json'?JSON.parse(out.body):out.body}catch(e){error=e.name}
    ui.$('[data-decoded]').textContent=error?`${error}：正文不是合法 JSON`:typeof decoded==='string'?decoded:json(decoded);
    ui.$('[data-metrics]').innerHTML=metrics([['HTTP 状态',out.status],['Content-Type',out.headers['Content-Type']],['解析结果',error||'成功']]);
    if(out.selected==='html'){
      const heading=document.createElement('h3');heading.textContent='HTML 表示的实际效果';
      const frame=document.createElement('iframe');frame.title='HTML 资源表示预览';frame.setAttribute('sandbox','');frame.srcdoc=out.body;ui.$('[data-preview]').append(heading,frame);
    }
    ui.code(`GET /books/7 HTTP/1.1\nAccept: ${p.accept}\n\n// 客户端选择\n${decoder==='json'?'JSON.parse(body)':'body // 当作文本读取'}`);
    report(root,`${out.status} / ${out.headers['Content-Type']} → ${error||'解析成功'}`,[[`Accept: ${p.accept}`,out.status===406?'没有可接受表示':`选择 ${out.selected}`,out.status===406?'本示例按 Accept 严格选择；服务器没有匹配表示时返回 406。':'REST PDF 11–15、20：同一资源可有不同表示；Accept 是请求偏好，Content-Type 描述实际响应。'],
      [`解析方式 ${decoder}`,error||typeof decoded,error?out.selected==='jsonp'?'JSONP 是 showBook(...) 的 JavaScript 调用，不是可直接 JSON.parse 的 JSON。':'HTML / XML 也可以作为资源表示，但不能直接当作 JSON 解析。':out.status===406?'错误响应的 body 也可以是合法 JSON；解析成功不代表请求成功。':decoder==='text'?'读取文本不判断它是否为合法 JSON。':'本次正文满足 JSON 语法，得到 JavaScript 数据。'],
      ['资源 /books/7',`title=${p.title}`,out.status===406?'该资源标题未进入错误响应。':'资源标识未变化；只改变响应表示。HTML 内容已转义，并在无脚本 iframe 中展示。']
    ]);
  };
  for(const field of ['format','accept','title','decoder'])ui.on(ui.$(`[data-${field}]`),'input',update);
  update();return ui.destroy;
}
function clientLab(root) {
  const ui=bench(root,selectControl('status','模拟请求结果',[['200','200 OK'],['201','201 Created'],['204','204 No Content'],['400','400 Bad Request'],['404','404 Not Found'],['500','500 Internal Server Error'],['network','网络失败：没有 HTTP 响应']])+
    '<label>响应 body（可编辑）<textarea data-body spellcheck="false" maxlength="1200">{"title":"Web"}</textarea></label>'+selectControl('reader','读取正文',[['json','response.json()'],['text','response.text()'],['skip','不读取正文']])+
    selectControl('guard','先检查 response.ok？',[['yes','是：失败状态立即抛错'],['no','否：直接进入正文读取']])+'<button class="primary" data-run>执行客户端代码</button>',
    '<div data-metrics></div><ol class="final-trace" data-trace aria-label="客户端执行顺序"></ol>'+output('result','最终 Promise 结果')+links([['MDN：检查 fetch 的状态','https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_response_status']]),
    '不连接外部服务。HTTP 结果用本地 Response 对象提供，response.json() / text() 与 Promise 分支由浏览器实际执行；网络失败是显式构造的拒绝。可改响应正文，比较 HTTP 错误、解析错误与没有响应。');
  let version=0,disposed=false;
  const read=()=>({status:+ui.$('[data-status]').value,network:ui.$('[data-status]').value==='network',body:ui.$('[data-body]').value,reader:ui.$('[data-reader]').value,guard:ui.$('[data-guard]').value==='yes'});
  const update=()=>{
    version++;const p=read();ui.$('[data-body]').disabled=p.network||p.status===204;ui.$('[data-reader]').disabled=p.network;ui.$('[data-guard]').disabled=p.network;
    ui.$('[data-run]').disabled=false;ui.$('[data-trace]').replaceChildren();ui.$('[data-result]').textContent='输入改变后旧结果已清除，等待执行。';ui.$('[data-metrics]').innerHTML=metrics([['将提供的响应',p.network?'无 HTTP 响应':p.status],['正文',p.network||p.status===204?'无':`${p.body.length} 字符`]]);
    ui.code(`// 示意调用；本实验用本地 Response 替代网络结果\ntry {\n  const response = await fetch('/books/7');\n  ${p.guard?"if (!response.ok) throw new Error('HTTP ' + response.status);":'// 不检查 response.ok'}\n  ${p.reader==='skip'?'const data = undefined;':`const data = await response.${p.reader}();`}\n  console.log('fulfilled', data);\n} catch (error) {\n  console.log('rejected', error.name, error.message);\n}`);
    pending(root,p.network?'模拟网络失败':`${p.status} / ${p.reader} / ${p.guard?'检查':'不检查'} ok`);
  };
  ui.on(ui.$('[data-run]'),'click',async()=>{
    const current=++version,p=read();ui.$('[data-run]').disabled=true;report(root,'正在执行本次客户端代码',[],'running');
    const result=await readSimulatedResponse(p);if(disposed||current!==version)return;
    ui.$('[data-run]').disabled=false;ui.$('[data-trace]').innerHTML=result.trace.map(line=>`<li>${esc(line)}</li>`).join('');
    ui.$('[data-result]').textContent=result.fulfilled?`fulfilled\n${result.data===undefined?'undefined':json(result.data)}`:`rejected\n${result.error}: ${result.message}`;
    ui.$('[data-metrics]').innerHTML=metrics([['Response',p.network?'未取得':result.status],['response.ok',p.network?'不存在':String(result.ok)],['Promise',result.fulfilled?'fulfilled':'rejected']]);
    report(root,`${p.network?'网络失败':p.status} → ${result.fulfilled?'fulfilled':'rejected'}`,[[`请求结果 ${p.network?'网络失败':p.status}`,p.network?'没有 Response':`ok=${result.ok}`,p.network?'在解析正文之前就拒绝；这与服务器返回 404 不同。':'REST PDF 6 / Node PDF 26：fetch 收到 404 仍可取得 Response，必须自行判断 HTTP 成功与否。'],
      [`检查 ok：${p.guard?'是':'否'}`,p.network?'未到达此步骤':p.guard&&!result.ok?'主动抛出 HTTP 错误':'继续处理正文',p.network?'前一阶段失败，后面的选项没有执行。':p.guard?'只允许 200–299 的 ok 状态继续。':'错误响应如果带合法 JSON，仍可能被成功解析；不要把这当作业务成功。'],
      [`正文读取 ${p.reader}`,p.network||p.guard&&!result.ok?'未执行':result.fulfilled?'读取成功或按选择跳过':result.error,p.status===204?'204 没有正文；调用 json() 会因空文本而失败，选择跳过正文可正常结束。':p.reader==='json'?'json() 按 JSON 语法解析，合法性取决于正文，而不是只看状态或 Content-Type。':'text() 交付字符串；跳过读取则得到 undefined。']
    ]);
  });
  for(const field of ['status','body','reader','guard'])ui.on(ui.$(`[data-${field}]`),'input',update);
  update();return()=>{disposed=true;version++;ui.destroy()};
}
export const restLabs=[
  {id:'rest-methods',category:'REST',title:'HTTP 方法与资源变化',minutes:10,summary:'编辑路径和 JSON，观察 GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS 的报文与资源前后变化。',goal:'通过重复发送理解 safe、幂等、201 / Location 和不同错误状态。',predict:'同样的 POST、PUT、增量 PATCH 各发两次，会得到相同的资源状态吗？',refs:[ref('rest',13,16,'创建、方法与参数'),ref('rest',36,36,'资源 URI 与操作语义'),ref('node',21,21,'路由处理')],mount:methodLab,explanation:['状态码与具体行为由示例接口契约定义；REST 没有强制每个 API 的全部细节一致。这个实验的数据只保留在当前操作区。','幂等比较重复请求的预期资源效果，响应可以不同。例子里的 PATCH 增量是自定义契约，固定值修改可以幂等，而增量通常不幂等。'],challenges:[{prompt:'DELETE 同一资源两次返回 204 → 404，为什么仍符合幂等？',answer:'最终资源都不存在；幂等不要求重复响应的状态码或文本一致。'},{prompt:'PUT 只提交 {"price":20}，为什么本例返回 422？PATCH 呢？',answer:'本例 PUT 要求完整 title 和 price；PATCH 允许 title/price 的非空子集，因此可只修改 price。'},{prompt:'POST 连发两次后怎样查看新资源？',answer:'每次响应有独立的 201 / Location；点击 GET 上次 Location 可读取最后创建的资源。普通 POST 不承诺自动去重。'}]},
  {id:'rest-representations',category:'REST',title:'表示格式、Accept 与 JSONP',minutes:7,summary:'同一资源切换 JSON、HTML、XML、JSONP，比较 Content-Type、实际画面和 JSON 解析结果。',goal:'区分资源与表示、请求偏好与响应类型，并识别 JSONP 包装。',predict:'返回 HTML 就不算 REST 吗？format=json 的接口返回回调包装后还能直接 JSON.parse 吗？',refs:[ref('rest',11,15,'同一资源的 HTML / XML / JSON'),ref('rest',20,20,'响应格式'),ref('rest',23,24,'JSONP 与 JSON')],mount:representationLab,explanation:['Accept 描述客户端愿意接收的格式；Content-Type 描述服务端实际发出的格式。请求偏好不会自动把正文转换成 JSON。','JSONP 是 JavaScript 回调调用。直接 JSON.parse 整段包装会失败；HTML 同样可以作为资源表示，课件第 20 页的绝对化表述不适合作为协议规则。'],challenges:[{prompt:'把服务器设为仅 HTML，Accept 设为 application/json，本例返回什么？',answer:'406。此示例严格匹配可提供的表示。选 text/html 后可得到 200 和 HTML 实际预览。'},{prompt:'为什么一个 406 错误响应仍可能被成功 JSON.parse？',answer:'HTTP 状态和正文语法是不同维度。服务器可用合法 JSON 表达错误；解析成功不等于业务成功。'}]},
  {id:'rest-client',category:'REST',title:'客户端的状态检查与解析',minutes:7,summary:'修改响应状态、正文与解析方式，实际运行 Promise 与 Response 解码，定位错误发生在哪一步。',goal:'分清网络失败、HTTP 错误、JSON 错误和 204 无正文。',predict:'404 + 合法 JSON，在不检查 response.ok 时会进入成功还是错误分支？',refs:[ref('rest',6,6,'客户端访问 API'),ref('rest',16,16,'HTTP 请求'),ref('rest',20,20,'响应正文'),ref('node',26,26,'HTTP 客户端')],mount:clientLab,explanation:['实验用本地 Response 提供模拟服务端结果，解析和 Promise 行为实际由浏览器执行。没有访问第三方 API。','HTTP 错误状态一般不让 fetch 自动拒绝；response.ok 检查和 JSON 解析又各自可能抛错。后一步是否执行取决于前一步是否成功。'],challenges:[{prompt:'204 是成功状态，为什么 response.json() 仍会失败？',answer:'ok 为 true，但 204 没有正文；空文本不是 JSON。本例选择跳过正文后可正常结束。'},{prompt:'网络失败与 404 的第一个区别是什么？',answer:'网络失败没有可用 Response；404 通常仍有 Response 和 status，可以由客户端读取或按 ok 检查抛错。'}]}
];
