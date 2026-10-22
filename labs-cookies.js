import {bench,ref,report,invalid,esc,selectControl,metrics,links} from './labs-final-shared.js?v=20261020-labs';
import {COOKIE_CLOCK,parseCookie,storeCookie,liveCookies,cookieChecks,cookieString,siteOf} from './labs-cookie-model.js?v=20261021-protocol-labs';
const textControl=(name,label,value)=>`<label>${label}<input data-${name} value="${esc(value)}" maxlength="100"></label>`;
const checkControl=(name,label,checked=false)=>`<label class="lab-inline"><input data-${name} type="checkbox" ${checked?'checked':''}>${label}</label>`;
const output=(name,label)=>`<h3>${label}</h3><pre class="lab-code" data-${name} aria-label="${label}"></pre>`;
const stages=values=>`<ol class="protocol-stages">${values.map(([label,value])=>`<li><small>${esc(label)}</small><strong>${esc(value)}</strong></li>`).join('')}</ol>`;
const checkTable=rows=>`<div class="protocol-table" tabindex="0" role="region" aria-label="Cookie 筛选规则"><table><thead><tr><th>规则</th><th>结果</th><th>当前依据</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${esc(r.rule)}</th><td class="${r.pass?'protocol-pass':'protocol-fail'}">${r.pass?'通过':'阻止'}</td><td>${esc(r.why)}</td></tr>`).join('')}</tbody></table></div>`;
const jarTable=(jar,now)=>`<div class="protocol-table" tabindex="0" role="region" aria-label="教学 Cookie 存储"><table><thead><tr><th>name=value</th><th>Domain / Path</th><th>属性</th><th>剩余时间</th></tr></thead><tbody>${jar.length?jar.map(c=>`<tr><td>${esc(c.name+'='+c.value)}</td><td>${esc(c.domain)}${c.hostOnly?' (host-only)':''}<br>${esc(c.path)}</td><td>${c.secure?'Secure ':''}${c.httpOnly?'HttpOnly ':''}${esc(c.sameSite)}${c.partitioned?' / 分区 '+esc(c.partitionKey):''}</td><td>${c.expiresAt===null?'当前会话':Math.max(0,Math.ceil((c.expiresAt-now)/1000))+' 秒'}</td></tr>`).join(''):'<tr><td colspan="4">Cookie 罐为空</td></tr>'}</tbody></table></div>`;
const sourceOptions=[['https://shop.example.test/account/login','HTTPS · shop.example.test/account/login'],['https://api.example.test/account/login','HTTPS · api.example.test/account/login'],['http://shop.example.test/account/login','HTTP · shop.example.test/account/login']];
const targetOptions=[['https://shop.example.test','HTTPS · shop.example.test'],['https://api.example.test','HTTPS · api.example.test'],['https://other.test','HTTPS · other.test'],['http://shop.example.test','HTTP · shop.example.test']];
const cookieDocs=links([['Cookie 属性','https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie']]);
const requestText=(url,value)=>{const u=new URL(url);return `GET ${u.pathname}${u.search} HTTP/1.1\nHost: ${u.host}\n${value?'Cookie: '+value:'（未发送 Cookie 请求头）'}`};
const cleanPath=value=>{if(!value.startsWith('/')||value.startsWith('//')||/[?#]/.test(value))throw Error('路径从单个 / 开始；本实验不在路径输入中处理 query 或 fragment。');return value};
function scopeLab(root) {
  const presets={session:'sid=abc; Path=/account; Secure; HttpOnly; SameSite=Lax',domain:'sid=abc; Domain=example.test; Path=/account; Secure; HttpOnly; SameSite=Lax',default:'theme=green; SameSite=Lax',invalid:'sid=abc; Domain=other.test; Path=/; Secure; SameSite=Lax'};
  const ui=bench(root,selectControl('preset','一键场景',[['session','host-only + HttpOnly'],['domain','父域共享给子域'],['default','省略 Path 与 Domain'],['invalid','拒绝无关 Domain']])+selectControl('source','首次响应来自',sourceOptions)+
    '<label>Set-Cookie（可编辑；一条响应头值）<textarea data-header spellcheck="false" maxlength="600"></textarea></label>'+selectControl('target','后续请求的主机',targetOptions)+textControl('path','后续请求路径','/account/profile')+
    '<p class="lab-note">改动即重新推演。每次从空 Cookie 罐开始；固定为同站请求，期限以 2026-01-01 00:00 UTC 判断。跨站与 Partitioned 请用“SameSite 与第三方分区”实验。</p>',
    '<div data-stages></div><div data-metrics></div><div data-checks></div>'+output('request','后续请求报文')+output('script','目标页面的 document.cookie')+cookieDocs,
    'Cookie 收发规则的教学模拟：使用虚构 .test 域名，不访问这些服务器。展示所列属性的设置与筛选规则；不模拟浏览器配额、公共后缀列表、前缀、会话恢复和全部隐私策略。未写 SameSite 时按显式 Lax 推演，不模拟默认 Lax 的宽限期。');
  ui.$('[data-header]').value=presets.session;
  const update=()=>{
    for(const key of ['request','script'])ui.$(`[data-${key}]`).textContent='';
    for(const key of ['checks','metrics','stages'])ui.$(`[data-${key}]`).replaceChildren();
    try {
      const source=ui.$('[data-source]').value,url=ui.$('[data-target]').value+cleanPath(ui.$('[data-path]').value),line=ui.$('[data-header]').value;
      ui.code(`// 首次响应头\nSet-Cookie: ${line}\n\n// 后续请求目标\n${url}`);
      const parsed=parseCookie(line,{url:source});
      if(parsed.cookie?.partitioned)throw Error('Partitioned 请在“SameSite 与第三方分区”实验中比较；本页只隔离同站作用域规则。');
      if(!parsed.accepted){ui.$('[data-stages]').innerHTML=stages([['① 收到 Set-Cookie',source],['② 保存','拒绝'],['③ 后续发送','无 Cookie']]);ui.$('[data-request]').textContent=requestText(url,'');ui.$('[data-script]').textContent='""';report(root,'Cookie 未保存：后续请求无法携带',[['当前响应头',line,parsed.reason]]);return}
      const c=parsed.cookie,context={url,topSite:siteOf(url)},net=cookieChecks(c,context),visible=cookieString([c],{...context,script:true});
      ui.$('[data-stages]').innerHTML=stages([['① 响应设置',c.name+'='+c.value],['② 浏览器保存',c.domain+' '+c.path],['③ 后续请求',net.allowed?'携带 Cookie':'不携带 Cookie']]);
      ui.$('[data-metrics]').innerHTML=metrics([['已保存',c.expiresAt!==null&&c.expiresAt<=COOKIE_CLOCK?'立即到期':'是'],['请求携带',net.allowed?'是':'否'],['脚本可读',visible?'是':'否']]);
      ui.$('[data-checks]').innerHTML=checkTable(net.rows.slice(0,4));
      ui.$('[data-request]').textContent=requestText(url,net.allowed?`${c.name}=${c.value}`:'');ui.$('[data-script]').textContent=JSON.stringify(visible);
      report(root,`请求${net.allowed?'携带':'不携带'} Cookie；脚本${visible?'可以读取':'读不到'}`,net.rows.slice(0,4).map(row=>[row.rule,row.pass?'通过':'阻止',row.why]).concat([
        [`HttpOnly=${c.httpOnly}`,visible||'document.cookie 为空',!c.httpOnly?'脚本仍需满足当前主机、路径、期限与 Secure 条件。':'HttpOnly 只阻止脚本读取，不会因此阻止浏览器的网络发送。'],
        ['首次响应与后续请求',`${source} → ${url}`,`Cookies PDF 6、20–22：${c.hostOnly?'没有 Domain，所以是 host-only。':'显式 Domain 允许匹配父域及其子域。'} 实际 Path=${c.path}；省略时从设置 URL 的目录推导。`]
      ]));
    }catch(error){ui.code('输入待修正');invalid(root,error.message)}
  };
  for(const name of ['source','target','path','header'])ui.on(ui.$(`[data-${name}]`),'input',update);
  ui.on(ui.$('[data-preset]'),'change',()=>{ui.$('[data-header]').value=presets[ui.$('[data-preset]').value];update()});
  update();return ui.destroy;
}
function lifecycleLab(root) {
  const presets={account:'theme=green; Path=/account; Max-Age=60; SameSite=Lax',root:'theme=blue; Path=/; Max-Age=120; SameSite=Lax',wrong:'theme=; Path=/; Max-Age=0; SameSite=Lax',right:'theme=; Path=/account; Max-Age=0; SameSite=Lax',session:'visit=1; Path=/; SameSite=Lax',httpOnly:'sid=abc; Path=/; Secure; HttpOnly; SameSite=Lax',precedence:'theme=green; Path=/account; Max-Age=60; Expires=Wed, 31 Dec 2025 00:00:00 GMT; SameSite=Lax'};
  const ui=bench(root,selectControl('preset','载入操作（之后点击执行）',[['account','写入 /account，60 秒'],['root','同名写入 /，120 秒'],['wrong','删除 / 的同名 Cookie'],['right','删除 /account 的同名 Cookie'],['session','写入会话 Cookie'],['httpOnly','服务器设置 HttpOnly'],['precedence','Max-Age 与过去的 Expires 同时出现']])+
    selectControl('writer','写入入口',[['server','服务器 Set-Cookie'],['script','脚本 document.cookie']])+
    '<label>赋值字符串（可编辑，不含外围引号）<textarea data-header spellcheck="false" maxlength="600"></textarea></label><button class="primary" data-apply>执行这次写入 / 删除</button>'+textControl('path','观察页面与请求路径','/account/profile')+
    '<div class="lab-actions"><button data-tick="30">时间前进 30 秒</button><button data-tick="60">时间前进 60 秒</button><button data-end>结束模拟会话</button></div>',
    '<div data-metrics></div><p class="protocol-notice" data-action role="status"></p><div data-jar></div>'+output('request','当前请求携带的 Cookie')+output('script','当前页面的 document.cookie')+cookieDocs,
    '有状态的教学 Cookie 罐：写入、覆盖、删除和模拟时钟都作用于本实验。起点为 2026-01-01 00:00:00 UTC，来源固定 https://shop.example.test/account/login。结束会话只清掉 session Cookie，不模拟浏览器会话恢复。重置或离开实验清空这个临时 Cookie 罐。');
  let jar=[],now=COOKIE_CLOCK,last='尚未写入。先执行默认值，再试不同 Path 的删除。',draft=true;
  ui.$('[data-header]').value=presets.account;
  const render=()=>{
    jar=liveCookies(jar,now);ui.$('[data-jar]').innerHTML=jarTable(jar,now);
    ui.$('[data-metrics]').innerHTML=metrics([['模拟时间',new Date(now).toISOString().slice(11,19)+' UTC'],['有效 Cookie',jar.length]]);
    ui.$('[data-action]').textContent=last+(draft?' 下一次写入草稿尚未执行；下方仍显示当前 Cookie 罐。':'');
    const line=ui.$('[data-header]').value,writer=ui.$('[data-writer]').value;
    ui.code(writer==='server'?`// 下一次响应\nSet-Cookie: ${line}`:`// 下一次脚本赋值（不执行任意 JS）\ndocument.cookie = ${JSON.stringify(line)};`);
    try {
      const path=cleanPath(ui.$('[data-path]').value),url='https://shop.example.test'+path,context={url,now};
      const net=cookieString(jar,context),visible=cookieString(jar,{...context,script:true});
      ui.$('[data-request]').textContent=requestText(url,net);ui.$('[data-script]').textContent=JSON.stringify(visible);
      report(root,`${jar.length} 条有效记录 · ${draft?'下一次操作尚未执行':last}`,[['最近动作',last,'Cookie 罐只在执行写入、删除、前进时间或结束会话时改变。'],[writer==='script'?'document.cookie 草稿':'Set-Cookie 草稿',draft?'等待执行':line,'Cookies PDF 23、27–32：一次赋值设置一条；同 name / Domain / Path 的记录才被覆盖或删除。'],
        [`观察路径 ${path}`,net||'没有 Cookie 请求头','Cookies PDF 22：同名不同 Path 可同时存在；本例较长匹配路径排在前面。不能仅按名字推断是哪条记录。'],
        ['当前脚本读取',JSON.stringify(visible),'HttpOnly 被排除，其他可见 Cookie 用分号分隔；读取值不包含 Path、Max-Age 等属性。'],
        [`时钟 +${(now-COOKIE_CLOCK)/1000} 秒`,`${jar.length} 条尚未过期`, 'Max-Age 从每次设置时起计时，优先于 Expires；到期点立即失效。结束模拟会话清掉没有持久期限的记录。']
      ]);
    }catch(error){ui.$('[data-request]').textContent='路径待修正';ui.$('[data-script]').textContent='';invalid(root,error.message)}
  };
  ui.on(ui.$('[data-apply]'),'click',()=>{
    try {
      const result=storeCookie(jar,ui.$('[data-header]').value,{url:'https://shop.example.test/account/login',now,script:ui.$('[data-writer]').value==='script'});
      jar=result.jar;last=result.reason;draft=false;render();
    }catch(error){draft=true;render();ui.$('[data-action]').textContent='输入没有执行：'+error.message;invalid(root,error.message)}
  });
  for(const name of ['header','writer'])ui.on(ui.$(`[data-${name}]`),'input',()=>{draft=true;render()});
  ui.on(ui.$('[data-path]'),'input',render);
  ui.on(ui.$('[data-preset]'),'change',()=>{ui.$('[data-header]').value=presets[ui.$('[data-preset]').value];draft=true;render()});
  for(const button of root.querySelectorAll('[data-tick]'))ui.on(button,'click',()=>{const before=jar.length;now+=Number(button.dataset.tick)*1000;jar=liveCookies(jar,now);last=`时间前进 ${button.dataset.tick} 秒，${before-jar.length} 条到期`;render()});
  ui.on(ui.$('[data-end]'),'click',()=>{const before=jar.length;jar=jar.filter(c=>c.expiresAt!==null);last=`会话结束，移除 ${before-jar.length} 条 session Cookie`;render()});
  render();return ui.destroy;
}
function crossSiteLab(root) {
  const sites=[['https://shop.test','https://shop.test'],['https://news.test','https://news.test'],['https://widget.test','https://widget.test'],['http://widget.test','http://widget.test（不同 scheme）']];
  const ui=bench(root,selectControl('same','SameSite',[['lax','Lax'],['strict','Strict'],['none','None']])+
    selectControl('mode','请求场景',[['embed','iframe / 子资源请求'],['navigation','从当前站点发起顶层导航']])+selectControl('method','请求方法',[['GET','GET'],['POST','POST']])+
    selectControl('top','请求发起时的顶层站点',sites)+checkControl('secure','Secure',true)+checkControl('partition','Partitioned（按顶层站点分区）')+
    selectControl('stored','已有 Cookie 的分区键',sites)+checkControl('block','阻止嵌入场景的未分区第三方 Cookie')+
    '<p class="lab-note">请求目标固定为 https://widget.test/content。从已有 Cookie 快照比较发送资格，不模拟跨站写入许可、重定向或完整 CORS。CHIPS 只在嵌入场景比较；切换顶层导航会关闭分区。顶层导航用发起导航的站点判断 SameSite。</p>',
    '<div data-stages></div><div data-checks></div>'+output('request','本次请求报文')+links([['CHIPS 分区规则','https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies/Partitioned_cookies']]),
    '跨站发送教学模型。SameSite、分区键和“阻止未分区第三方 Cookie”分别判断；所有条件共同通过才发送。本实验使用显式 SameSite，不模拟默认 Lax 的临时宽限期；真实浏览器策略可能更严格。');
  const update=()=>{
    const navigation=ui.$('[data-mode]').value==='navigation';
    if(navigation)ui.$('[data-partition]').checked=false;
    ui.$('[data-partition]').disabled=navigation;ui.$('[data-block]').disabled=navigation;
    const same=ui.$('[data-same]').value,partitioned=ui.$('[data-partition]').checked,secure=ui.$('[data-secure]').checked,top=ui.$('[data-top]').value,stored=ui.$('[data-stored]').value,mode=ui.$('[data-mode]').value,method=ui.$('[data-method]').value,block=ui.$('[data-block]').checked;
    ui.$('[data-stored]').disabled=!partitioned;
    const line=`sid=A; Path=/; SameSite=${same}${secure?'; Secure':''}${partitioned?'; Partitioned':''}`;
    ui.code(`// 教学快照，非当前真实 Cookie\n${line}\n${partitioned?'// 分区键：'+stored:'// 未分区'}\n// 顶层上下文：${top}\n// 目标：https://widget.test/content`);
    ui.$('[data-checks]').replaceChildren();ui.$('[data-stages]').replaceChildren();
    const parsed=parseCookie(line,{url:'https://widget.test/content',topSite:stored});
    if(!parsed.accepted){ui.$('[data-request]').textContent='Cookie 配置无效：'+parsed.reason;invalid(root,parsed.reason);return}
    const result=cookieChecks(parsed.cookie,{url:'https://widget.test/content',topSite:top,mode,method,blockThirdParty:block});
    ui.$('[data-stages]').innerHTML=stages([['顶层上下文',top],['请求目标','https://widget.test'],['发送结果',result.allowed?'Cookie: sid=A':'没有 Cookie 头']]);
    ui.$('[data-checks]').innerHTML=checkTable(result.rows.filter(r=>['SameSite','分区','第三方策略'].includes(r.rule)));
    ui.$('[data-request]').textContent=`${method} /content HTTP/1.1\nHost: widget.test\n${result.allowed?'Cookie: sid=A':'（未发送 Cookie 请求头）'}`;
    report(root,`${same} / ${partitioned?'已分区':'未分区'} → ${result.allowed?'携带 sid=A':'不携带'}`,result.rows.filter(r=>['SameSite','分区','第三方策略'].includes(r.rule)).map(r=>[r.rule,r.pass?'通过':'阻止',r.why]).concat([
      ['当前请求场景',`${mode==='navigation'?'顶层导航':'嵌入/子资源'} ${method}`, 'Cookies PDF 6、15–16：Lax 的跨站例外是顶层安全方法导航。GET 的 iframe 与 POST 的顶层导航都不满足这个例外。'],
      ['Secure='+secure,secure?'HTTPS 条件满足':'未设置 Secure', 'Cookies PDF 42：None 和 Partitioned 都需要 Secure；分区不会绕开 SameSite 或 HTTPS 的要求。']
    ]));
  };
  for(const control of root.querySelectorAll('select,input'))ui.on(control,'input',update);
  update();return ui.destroy;
}
export const cookieLabs=[
  {id:'cookie-scope',category:'Cookie',title:'Cookie 的收发与作用域',minutes:8,summary:'编辑 Set-Cookie、切换目标主机和路径，看到哪些规则阻止发送，哪些 Cookie 仅对脚本隐藏。',goal:'区分保存、网络携带和 document.cookie 可见性，推导 host-only、Domain、Path、Secure、HttpOnly。',predict:'Cookie 带 HttpOnly 时，浏览器还会把它发给服务器吗？/account 与 /accounting 匹配吗？',refs:[ref('cookies',5,6,'属性与默认范围'),ref('cookies',20,23,'收发、范围与脚本')],mount:scopeLab,explanation:['响应 Set-Cookie 设置记录；后续请求 Cookie 携带通过筛选的 name=value。脚本读取与网络发送不是同一条规则。','本实验隔离同站场景，重点看域、路径、期限与传输。要研究跨站上下文，请使用 SameSite 与分区实验。'],challenges:[{prompt:'host-only Cookie 能发到设置主机的兄弟子域吗？怎样改变？',answer:'不能。显式 Domain=example.test 可让匹配的子域有发送资格，但 Path、Secure、期限等仍需通过。'},{prompt:'Path=/account 为什么匹配 /account/profile 却不匹配 /accounting？',answer:'匹配要求完整路径或目录边界，不是任意字符串前缀。HttpOnly 也不会改变这个判断。'}]},
  {id:'cookie-lifecycle',category:'Cookie',title:'Cookie 写入、删除与过期',minutes:9,summary:'操作临时 Cookie 罐，重复写入同名不同 Path，推进时间并观察删除、过期和 HttpOnly。',goal:'用实际前后记录理解 setter、覆盖键、匹配删除、Max-Age 与会话 Cookie。',predict:'在 /account 写了 theme 后，用 Path=/ 的同名过期值能删掉它吗？',refs:[ref('cookies',22,24,'覆盖、脚本与编码'),ref('cookies',27,33,'设置、读取、删除与偏好恢复')],mount:lifecycleLab,explanation:['每次操作修改实验里的 Cookie 记录，不接触复习网站的登录或学习进度。读取结果只含当前范围内脚本可见的值。','设置同名、同 Domain、同 Path 的 Cookie 才会覆盖。时间前进后到期记录移除；Max-Age 优先于 Expires。'],challenges:[{prompt:'同名 Cookie 分别在 / 和 /account，/account/profile 请求可能带几条？',answer:'两条都可能携带。本实验较长路径的记录排在前面，服务器不能仅凭名字假设只会有一个值。'},{prompt:'把写入入口换成 document.cookie，再尝试覆盖现有 HttpOnly sid，会发生什么？',answer:'不能覆盖或删除同一范围的 HttpOnly Cookie。客户端脚本不能绕过 HttpOnly；服务端可用匹配的 Set-Cookie 更新。'}]},
  {id:'cookie-samesite',category:'Cookie',title:'SameSite 与第三方分区',minutes:8,summary:'切换导航/嵌入、GET/POST 和顶层站点，对比 Lax、Strict、None、第三方策略及 CHIPS 分区。',goal:'按当前上下文逐项解释跨站 Cookie 为什么发出或被阻止。',predict:'SameSite=None 是否保证跨站一定发送？Partitioned 能跨 shop.test 和 news.test 共享 ID 吗？',refs:[ref('cookies',6,6,'SameSite 属性'),ref('cookies',15,16,'分类与第三方上下文'),ref('cookies',39,42,'第三方用途与 CHIPS')],mount:crossSiteLab,explanation:['SameSite 决定跨站请求的携带资格，第三方策略和分区键还会进一步筛选。通过一个条件不表示最终会发送。','CHIPS 在顶层站点之间分开保存状态。同一 widget 在另一个顶层站点下不能自动取到原分区的 Cookie。'],challenges:[{prompt:'跨站 Lax：GET 顶层导航、GET iframe、POST 顶层导航分别怎样？',answer:'在本实验的显式 Lax 规则下，仅 GET 顶层导航获得例外；另两者被 SameSite 阻止。'},{prompt:'None + Secure + Partitioned，为什么仍可能没有 Cookie 头？',answer:'检查当前顶层站点是否与记录的分区键一致。分区不一致时，即使 SameSite 和 HTTPS 条件通过，也不会携带这条记录。'}]}
];
