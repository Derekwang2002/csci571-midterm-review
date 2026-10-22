// A bounded teaching model for the .test hosts used by the Cookie labs.
// It never reads/writes the visitor's cookies or makes network requests.
export const COOKIE_CLOCK = Date.UTC(2026, 0, 1);
export const COOKIE_HOSTS = ['example.test','shop.example.test','api.example.test','other.test','widget.test','shop.test','news.test'];
export function cookieURL(value) {
  const url = new URL(value);
  if (!['http:','https:'].includes(url.protocol) || !COOKIE_HOSTS.includes(url.hostname) || url.username || url.password)
    throw Error('本实验只处理下拉菜单中的 HTTP(S) .test 主机。');
  return url;
}
export const siteOf = value => {const u=cookieURL(value);return `${u.protocol}//${u.hostname.split('.').slice(-2).join('.')}`};
export const domainMatches = (host,domain) => host===domain || host.endsWith('.'+domain);
export function defaultPath(path) {return !path.startsWith('/')||path.lastIndexOf('/')===0?'/':path.slice(0,path.lastIndexOf('/'))}
export const pathMatches = (request,path) => request===path || request.startsWith(path) && (path.endsWith('/') || request[path.length]==='/');
const rejected = reason => ({accepted:false,reason,cookie:null});
export function parseCookie(line,{url,now=COOKIE_CLOCK,script=false,topSite=siteOf(url)}={}) {
  const source=cookieURL(url), attrs=new Map();
  if (/[\r\n]/.test(line)) throw Error('只填一条 Cookie 字符串，不包含换行。');
  const [pair,...parts]=line.trim().replace(/^Set-Cookie:\s*/i,'').split(';');
  const split=pair.indexOf('='), name=pair.slice(0,split).trim(), value=pair.slice(split+1).trim();
  if(split<1 || !/^[A-Za-z0-9_-]+$/.test(name) || name.startsWith('__'))
    throw Error('名字使用字母、数字、_、-，后面加 =；本实验不展开 __ 前缀规则。');
  if(!/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/.test(value))
    throw Error('本实验使用未加引号的 Cookie 值；空格、中文等请先 encodeURIComponent。');
  const supported=['domain','path','secure','httponly','samesite','max-age','expires','partitioned'];
  for(const part of parts) {
    if(!part.trim())continue;
    const at=part.indexOf('='), key=(at<0?part:part.slice(0,at)).trim().toLowerCase();
    if(!supported.includes(key))throw Error(`本实验未覆盖属性 ${key}；请使用页面列出的属性。`);
    attrs.set(key,at<0?'':part.slice(at+1).trim());
  }
  const domain=(attrs.get('domain')||'').toLowerCase().replace(/^\./,'');
  if(domain && (!COOKIE_HOSTS.includes(domain)||!domainMatches(source.hostname,domain)))
    return rejected(`Domain=${domain} 不能由 ${source.hostname} 设置；需匹配设置主机或其可用父域。`);
  const secure=attrs.has('secure'),httpOnly=attrs.has('httponly'),partitioned=attrs.has('partitioned');
  const sameSite=(attrs.get('samesite')||'Lax').toLowerCase();
  if(!['strict','lax','none'].includes(sameSite))throw Error('SameSite 在本实验中选择 Strict、Lax 或 None。');
  if(secure && source.protocol!=='https:')return rejected('本实验的普通 .test HTTP 来源不能设置 Secure Cookie。');
  if(sameSite==='none'&&!secure)return rejected('SameSite=None 需要 Secure；这条 Cookie 未被保存。');
  if(partitioned&&!secure)return rejected('Partitioned 需要 Secure；这条 Cookie 未被保存。');
  if(script && httpOnly)return rejected('document.cookie 不能设置 HttpOnly Cookie；应由服务器响应设置。');
  let expiresAt=null;
  if(attrs.has('expires')) {
    const time=Date.parse(attrs.get('expires'));
    if(!Number.isFinite(time))throw Error('本实验请用有效的 Expires HTTP 日期，例如 Thu, 01 Jan 2026 00:01:00 GMT。');
    expiresAt=time;
  }
  if(attrs.has('max-age')) {
    if(!/^-?\d+$/.test(attrs.get('max-age')))throw Error('本实验的 Max-Age 需为整数秒。');
    const seconds=Number(attrs.get('max-age'));
    if(!Number.isSafeInteger(seconds)||Math.abs(seconds)>31536000)throw Error('本实验的 Max-Age 范围为正负 31536000 秒。');
    expiresAt=now+Math.max(0,seconds)*1000;
  }
  const path=attrs.get('path')?.startsWith('/')?attrs.get('path'):defaultPath(source.pathname);
  return {accepted:true,reason:'通过本实验的设置检查',cookie:{name,value,domain:domain||source.hostname,hostOnly:!domain,path,secure,httpOnly,sameSite,partitioned,partitionKey:partitioned?siteOf(topSite):null,expiresAt,createdAt:now}};
}
export const cookieKey = c => JSON.stringify([c.name,c.domain,c.path,c.partitionKey]);
export const liveCookies = (jar,now) => jar.filter(c=>c.expiresAt===null||c.expiresAt>now);
export function storeCookie(jar,line,context) {
  const current=liveCookies(jar,context.now??COOKIE_CLOCK),parsed=parseCookie(line,context);
  if(!parsed.accepted)return {...parsed,jar:current};
  const c=parsed.cookie,index=current.findIndex(item=>cookieKey(item)===cookieKey(c));
  if(context.script && index>=0 && current[index].httpOnly)return {...rejected('脚本不能覆盖或删除同一范围的 HttpOnly Cookie。'),jar:current};
  const next=current.filter(item=>cookieKey(item)!==cookieKey(c));
  const deleted=c.expiresAt!==null&&c.expiresAt<=(context.now??COOKIE_CLOCK);
  if(!deleted)next.push({...c,createdAt:index>=0?current[index].createdAt:c.createdAt});
  return {...parsed,jar:next,reason:deleted?(index>=0?'已删除匹配的记录':'没有同名、同 Domain、同 Path 的记录可删'):index>=0?'已覆盖同一范围的记录':'已保存一条新记录'};
}
export function cookieChecks(c,{url,now=COOKIE_CLOCK,topSite=siteOf(url),mode='navigation',method='GET',blockThirdParty=false,script=false,credentials='include'}) {
  const target=cookieURL(url),same=siteOf(url)===siteOf(topSite),cross=!same;
  const safe=['GET','HEAD','OPTIONS','TRACE'].includes(method);
  const rows=[
    {rule:'Domain',pass:c.hostOnly?target.hostname===c.domain:domainMatches(target.hostname,c.domain),why:c.hostOnly?`host-only：只匹配 ${c.domain}`:`匹配 ${c.domain} 及其子域`},
    {rule:'Path',pass:pathMatches(target.pathname,c.path),why:`${target.pathname} 对照 ${c.path}，按目录边界匹配`},
    {rule:'期限',pass:c.expiresAt===null||c.expiresAt>now,why:c.expiresAt===null?'会话 Cookie，当前模拟会话未结束':`当前 ${new Date(now).toISOString()}；到期 ${new Date(c.expiresAt).toISOString()}`},
    {rule:'Secure',pass:!c.secure||target.protocol==='https:',why:c.secure?'需要 HTTPS 请求':'未设置 Secure，本项不限制 HTTP/HTTPS'},
  ];
  if(script)rows.push({rule:'HttpOnly',pass:!c.httpOnly,why:c.httpOnly?'document.cookie 不可见；不妨碍浏览器在合格请求中携带':'普通 Cookie 可被当前范围的脚本读取'});
  else {
    rows.push({rule:'SameSite',pass:same||c.sameSite==='none'||c.sameSite==='lax'&&mode==='navigation'&&safe,why:same?'来源上下文与目标同站':c.sameSite==='none'?'None 允许跨站资格，仍要通过其它规则':c.sameSite==='lax'?`跨站 Lax 需顶层安全方法导航；当前 ${mode==='navigation'?'顶层导航':'嵌入/子资源'} ${method}`:'Strict 阻止此跨站请求携带'});
    rows.push({rule:'credentials',pass:credentials!=='omit',why:credentials==='omit'?'本次 fetch 明确省略凭据':'本实验允许携带凭据（不代表已通过 Cookie 筛选）'});
  }
  rows.push({rule:'分区',pass:!c.partitioned||c.partitionKey===siteOf(topSite),why:c.partitioned?`写入分区 ${c.partitionKey}；当前顶层站点 ${siteOf(topSite)}`:'未分区，不按顶层站点拆分 Cookie 罐'});
  rows.push({rule:'第三方策略',pass:!cross||mode==='navigation'||!blockThirdParty||c.partitioned,why:!cross?'当前同站':mode==='navigation'?'本选项只模拟阻止嵌入场景的未分区第三方 Cookie':blockThirdParty?(c.partitioned?'该策略允许通过其它检查的分区 Cookie':'当前策略阻止未分区第三方 Cookie'):'当前策略允许未分区第三方 Cookie'});
  return {allowed:rows.every(row=>row.pass),rows};
}
export function cookieString(jar,context) {
  return jar.filter(c=>cookieChecks(c,context).allowed).sort((a,b)=>b.path.length-a.path.length||a.createdAt-b.createdAt).map(c=>`${c.name}=${c.value}`).join('; ');
}
