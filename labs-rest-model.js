export const initialResources = () => ({books:[{id:7,title:'Web',price:10}],nextId:8});
export const METHOD_INFO = {
  GET:['读表示',true,true],HEAD:['只读响应头',true,true],OPTIONS:['查询允许的方法',true,true],
  POST:['向集合创建成员',false,false],PUT:['替换指定资源',false,true],PATCH:['按约定局部修改',false,false],DELETE:['删除指定资源',false,true]
};
const clone = value => JSON.parse(JSON.stringify(value));
const escapeHTML = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resourceRequest(state,{method,path,body='',type='application/json'}) {
  const next=clone(state),before=clone(state.books);
  const finish=(status,data,why,headers={})=>({state:next,before,after:clone(next.books),status,headers:{...(status===204?{}:{'Content-Type':'application/json'}),...headers},body:method==='HEAD'||status===204?'':JSON.stringify(data,null,2),why});
  if(!Object.hasOwn(METHOD_INFO,method))throw Error('请选择本实验支持的 HTTP 方法。');
  if(!/^\/books(?:\/[1-9]\d*)?$/.test(path))return finish(404,{error:'not found'},'本示例只定义 /books 与 /books/正整数 路由。');
  const collection=path==='/books',id=collection?null:Number(path.split('/')[2]),index=next.books.findIndex(b=>b.id===id);
  if(!collection&&!Number.isSafeInteger(id))return finish(400,{error:'invalid id'},'本示例的 ID 必须是安全范围内的正整数。');
  const allow=collection?'GET, HEAD, POST, OPTIONS':'GET, HEAD, PUT, PATCH, DELETE, OPTIONS';
  if(!allow.split(', ').includes(method))return finish(405,{error:'method not allowed'},`${path} 没有定义 ${method}；请查看 Allow。`,{Allow:allow});
  if(method==='OPTIONS')return finish(204,null,'列出该路径支持的方法，不改变资源；OPTIONS 不等于自动通过 CORS。',{Allow:allow});
  if(method==='GET'||method==='HEAD') {
    if(!collection&&index<0)return finish(404,{error:'not found'},'路由形式有效，但这本书已经不存在。');
    return finish(200,collection?next.books:next.books[index],method==='HEAD'?'状态及表示元信息类似 GET，但响应不含正文。':'返回当前资源表示，不改变资源。');
  }
  if(method==='DELETE') {
    if(index<0)return finish(404,{error:'not found'},'资源已不存在；重复 DELETE 可以返回不同状态码，最终效果仍相同。');
    next.books.splice(index,1);return finish(204,null,'删除该资源；204 不携带正文。');
  }
  if((method==='PATCH')&&index<0)return finish(404,{error:'not found'},'本示例 PATCH 不创建缺失资源。');
  if(type!=='application/json')return finish(415,{error:'application/json required'},'此示例的写入路由只接受 application/json；尚未修改资源。');
  let data;try{data=JSON.parse(body)}catch{return finish(400,{error:'invalid JSON'},'请求体不是合法 JSON；尚未修改资源。')}
  if(!data||typeof data!=='object'||Array.isArray(data))return finish(422,{error:'object required'},'JSON 合法，但本接口要求对象。');
  const validTitle=t=>typeof t==='string'&&t.trim().length>0&&t.length<=80;
  const validPrice=p=>typeof p==='number'&&Number.isFinite(p)&&p>=0;
  if(method==='POST'||method==='PUT') {
    if(Object.keys(data).some(k=>!['title','price'].includes(k))||!validTitle(data.title)||!validPrice(data.price))
      return finish(422,{error:'title and non-negative price required'},'本接口要求完整的 title、price；id 来自 URL 或服务器，不能靠 body 改写。');
    if(method==='POST') {
      const book={id:next.nextId++,title:data.title,price:data.price};next.books.push(book);
      return finish(201,book,'POST 在集合中创建新成员；再次发送会再创建一个。',{Location:`/books/${book.id}`});
    }
    const book={id,title:data.title,price:data.price};
    if(index<0){next.books.push(book);next.nextId=Math.max(next.nextId,id+1);return finish(201,book,'PUT 在指定 URI 创建资源；再发同样请求会替换该 URI。',{Location:path})}
    next.books[index]=book;return finish(200,book,'PUT 完整替换 title、price；重复相同请求保持相同资源值。');
  }
  // A deliberately explicit teaching contract, not RFC 6902 JSON Patch.
  const fields=Object.keys(data),increment=Object.hasOwn(data,'increment');
  if(increment) {
    if(fields.length!==1||typeof data.increment!=='number'||!Number.isFinite(data.increment)||!validPrice(next.books[index].price+data.increment))
      return finish(422,{error:'invalid increment'},'increment 必须单独使用，且结果价格不能为负或非有限数。');
    next.books[index].price+=data.increment;
  } else {
    if(!fields.length||fields.some(k=>!['title','price'].includes(k))||Object.hasOwn(data,'title')&&!validTitle(data.title)||Object.hasOwn(data,'price')&&!validPrice(data.price))
      return finish(422,{error:'invalid partial fields'},'PATCH 接受非空的 title/price 子集，或单独的 increment；不能修改 id。');
    Object.assign(next.books[index],data);
  }
  return finish(200,next.books[index],increment?'本例约定 increment 为价格增量；重复请求会重复累加。':'只修改给定字段；price=固定值这种 PATCH 操作可以幂等，PATCH 方法整体不保证。');
}
export function representation({format='auto',accept='application/json',title='Web'}) {
  const types={json:'application/json',html:'text/html',xml:'application/xml',jsonp:'text/javascript'};
  const selected=format==='auto'?(accept==='*/*'?'json':Object.keys(types).find(k=>types[k]===accept)):format;
  if(!selected||!types[selected]||accept!=='*/*'&&accept!==types[selected])return {status:406,selected:null,headers:{'Content-Type':'application/json','Vary':'Accept'},body:JSON.stringify({error:'no acceptable representation'})};
  const data={id:7,title,links:{self:'/books/7'}};
  const body={json:JSON.stringify(data,null,2),html:`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><h1>${escapeHTML(title)}</h1><p>Book #7</p><a href="/books/7">本书资源</a></html>`,xml:`<book id="7"><title>${escapeHTML(title)}</title></book>`,jsonp:`showBook(${JSON.stringify(data)});`}[selected];
  return {status:200,selected,headers:{'Content-Type':types[selected],'Vary':'Accept'},body};
}
export async function readSimulatedResponse({status=200,body='{"title":"Web"}',type='application/json',reader='json',guard=true,network=false}) {
  const trace=[];let response;
  try {
    // Actual Fetch Response decoding, with a locally supplied response / failure.
    response=await (network?Promise.reject(new TypeError('模拟网络失败')):Promise.resolve(new Response(status===204?null:body,{status,headers:{'Content-Type':type}})));
    trace.push(`取得 Response：status=${response.status}，ok=${response.ok}`);
    if(guard&&!response.ok)throw Error(`HTTP ${response.status}`);
    trace.push(guard?'response.ok 检查通过':'未检查 response.ok');
    const data=reader==='skip'?undefined:await response[reader]();
    trace.push(reader==='skip'?'跳过正文解析':`response.${reader}() 成功`);
    return {fulfilled:true,data,trace,ok:response.ok,status:response.status};
  } catch(error) {trace.push(`${error.name}: ${error.message}`);return {fulfilled:false,error:error.name,message:error.message,trace,ok:response?.ok,status:response?.status}}
}
export const statusText = status => ({200:'OK',201:'Created',204:'No Content',400:'Bad Request',404:'Not Found',405:'Method Not Allowed',406:'Not Acceptable',415:'Unsupported Media Type',422:'Unprocessable Content',500:'Internal Server Error'})[status]||'';
export const responseText = out => `HTTP/1.1 ${out.status} ${statusText(out.status)}\n${Object.entries(out.headers).map(([k,v])=>`${k}: ${v}`).join('\n')}\n\n${out.body}`;
