import test from 'node:test';
import assert from 'node:assert/strict';
import {COOKIE_CLOCK,parseCookie,storeCookie,cookieChecks,cookieString,liveCookies,defaultPath,pathMatches,siteOf,domainMatches} from '../labs-cookie-model.js';
import {initialResources,resourceRequest,representation,readSimulatedResponse} from '../labs-rest-model.js';
const origin='https://shop.example.test/account/login';
const cookie=(line,extra={})=>parseCookie(line,{url:origin,...extra}).cookie;
const context={url:origin,now:COOKIE_CLOCK};

test('default Path and directory boundaries follow the setting request URL',()=>{
  for(const [path,expected] of [['/','/'],['/login','/'],['/account/login','/account'],['/account/','/account'],['/a/b/c','/a/b']])assert.equal(defaultPath(path),expected);
  assert(pathMatches('/account/profile','/account'));assert(pathMatches('/account','/account'));
  assert(!pathMatches('/accounting','/account'));assert(!pathMatches('/account','/account/'));
  assert.equal(cookie('theme=green').path,'/account');
});
test('host-only differs from Domain, and unrelated domain settings are rejected',()=>{
  const request={url:'https://api.example.test/account/profile'};
  assert.equal(cookieChecks(cookie('sid=1'),request).allowed,false);
  assert.equal(cookieChecks(cookie('sid=1; Domain=example.test'),request).allowed,true);
  assert.equal(parseCookie('sid=1; Domain=other.test',{url:origin}).accepted,false);
  assert(!domainMatches('notexample.test','example.test'));
  assert(domainMatches('api.example.test','example.test'));
  assert.equal(siteOf('https://shop.example.test:8443/x'),'https://example.test');
});
test('Secure limits transport; HttpOnly limits script visibility, not sending',()=>{
  const c=cookie('sid=1; Path=/; Secure; HttpOnly');
  assert(cookieChecks(c,{url:origin}).allowed);
  assert(!cookieChecks(c,{url:origin,script:true}).allowed);
  assert(!cookieChecks(c,{url:'http://shop.example.test/account/profile'}).allowed);
  assert.equal(parseCookie('sid=1; Secure',{url:'http://shop.example.test/'}).accepted,false);
  assert.equal(parseCookie('sid=1; SameSite=None',{url:origin}).accepted,false);
  assert.equal(parseCookie('sid=1; Partitioned',{url:origin}).accepted,false);
});
test('Cookie jar retains different paths, sends both, and deletion matches the full scope',()=>{
  let jar=storeCookie([],'theme=green; Path=/account',context).jar;
  jar=storeCookie(jar,'theme=blue; Path=/',context).jar;
  assert.equal(jar.length,2);
  assert.equal(cookieString(jar,{url:origin}),'theme=green; theme=blue');
  jar=storeCookie(jar,'theme=; Path=/; Max-Age=0',context).jar;
  assert.equal(cookieString(jar,{url:origin}),'theme=green');
  jar=storeCookie(jar,'theme=; Path=/account; Max-Age=0',context).jar;
  assert.equal(jar.length,0);
});
test('script cannot create, overwrite, or delete HttpOnly records',()=>{
  let jar=storeCookie([],'sid=secret; Path=/; HttpOnly',context).jar;
  for(const line of ['sid=changed; Path=/','sid=; Path=/; Max-Age=0','new=1; HttpOnly']){
    const result=storeCookie(jar,line,{...context,script:true});
    assert.equal(result.accepted,false);assert.deepEqual(result.jar,jar);
  }
  assert.equal(cookieString(jar,{url:origin,script:true}),'');
  assert.equal(cookieString(jar,{url:origin}),'sid=secret');
});
test('Max-Age wins over Expires, expires at the boundary and restarts on overwrite',()=>{
  let jar=storeCookie([],'x=1; Max-Age=60; Expires=Wed, 31 Dec 2025 00:00:00 GMT',context).jar;
  assert.equal(jar[0].expiresAt,COOKIE_CLOCK+60000);
  assert.equal(liveCookies(jar,COOKIE_CLOCK+59999).length,1);
  assert.equal(liveCookies(jar,COOKIE_CLOCK+60000).length,0);
  jar=storeCookie(jar,'x=2; Max-Age=60',{...context,now:COOKIE_CLOCK+30000}).jar;
  assert.equal(jar[0].expiresAt,COOKIE_CLOCK+90000);
  assert.equal(cookie('empty=').value,'');
  assert.equal(cookie('encoded=A%3B%20B%3D1').value,'A%3B%20B%3D1');
});
test('explicit SameSite cross-site matrix: only safe top navigation gets Lax exception',()=>{
  const request={url:'https://widget.test/content',topSite:'https://shop.test'};
  const expected={strict:[false,false,false,false],lax:[false,false,true,false],none:[true,true,true,true]};
  for(const same of Object.keys(expected)){
    const c=cookie(`sid=1; Path=/; SameSite=${same}; Secure`,{url:'https://widget.test/'});
    const cases=[['embed','GET'],['embed','POST'],['navigation','GET'],['navigation','POST']];
    assert.deepEqual(cases.map(([mode,method])=>cookieChecks(c,{...request,mode,method}).allowed),expected[same]);
    assert(cookieChecks(c,{url:request.url,topSite:'https://widget.test',mode:'embed',method:'POST'}).allowed);
  }
  const strict=cookie('sid=1; Path=/; SameSite=Strict; Secure',{url:'https://widget.test/'});
  assert(!cookieChecks(strict,{...request,topSite:'http://widget.test',mode:'embed'}).allowed);
});
test('third-party blocking and partition key are independent from SameSite=None',()=>{
  const request={url:'https://widget.test/content',topSite:'https://shop.test',mode:'embed',blockThirdParty:true};
  const plain=cookie('sid=A; Path=/; SameSite=None; Secure',{url:request.url});
  const partitioned=cookie('sid=A; Path=/; SameSite=None; Secure; Partitioned',{url:request.url,topSite:request.topSite});
  assert(!cookieChecks(plain,request).allowed);assert(cookieChecks(partitioned,request).allowed);
  assert(!cookieChecks(partitioned,{...request,topSite:'https://news.test'}).allowed);
  assert(!cookieChecks(partitioned,{...request,credentials:'omit'}).allowed);
});
test('unsupported Cookie syntax produces an explicit teaching-subset error',()=>{
  for(const input of ['missing_equals','x=含 空格','x=1; Unknown=value','x=1; Max-Age=1.5','x=1\nSet-Cookie:y=2'])assert.throws(()=>parseCookie(input,{url:origin}));
});

const req=(state,method,path='/books/7',body='',type='application/json')=>resourceRequest(state,{method,path,body,type});
test('GET / HEAD / OPTIONS preserve resources and HEAD / 204 responses have no body',()=>{
  const initial=initialResources();
  const get=req(initial,'GET'),head=req(initial,'HEAD'),options=req(initial,'OPTIONS');
  assert.equal(get.status,200);assert.equal(JSON.parse(get.body).price,10);
  assert.equal(head.status,200);assert.equal(head.body,'');
  assert.equal(options.status,204);assert.equal(options.body,'');assert.match(options.headers.Allow,/PATCH/);
  for(const result of [get,head,options])assert.deepEqual(result.state,initial);
});
test('POST twice creates two distinct resources and usable Location paths',()=>{
  const before=initialResources(),one=req(before,'POST','/books','{"title":"React","price":20}'),two=req(one.state,'POST','/books','{"title":"React","price":20}');
  assert.equal(one.status,201);assert.equal(two.status,201);
  assert.equal(one.headers.Location,'/books/8');assert.equal(two.headers.Location,'/books/9');
  assert.equal(two.state.books.length,3);assert.equal(before.books.length,1);
  assert.equal(JSON.parse(req(two.state,'GET',two.headers.Location).body).title,'React');
});
test('repeated PUT is idempotent; create-at-URI does not collide with subsequent POST IDs',()=>{
  let result=req(initialResources(),'PUT','/books/7','{"title":"New","price":20}');
  const repeated=req(result.state,'PUT','/books/7','{"title":"New","price":20}');assert.deepEqual(repeated.state.books,result.state.books);
  result=req(result.state,'PUT','/books/10','{"title":"Ten","price":10}');assert.equal(result.status,201);
  const post=req(result.state,'POST','/books','{"title":"Next","price":11}');assert.equal(post.headers.Location,'/books/11');
  assert.equal(req(initialResources(),'PUT','/books/7','{"price":20}').status,422);
});
test('fixed-price PATCH may be idempotent, increment PATCH applies each time',()=>{
  let fixed=req(initialResources(),'PATCH','/books/7','{"price":20}');
  assert.deepEqual(req(fixed.state,'PATCH','/books/7','{"price":20}').state,fixed.state);
  let increment=req(initialResources(),'PATCH','/books/7','{"increment":1}');
  increment=req(increment.state,'PATCH','/books/7','{"increment":1}');assert.equal(increment.state.books[0].price,12);
});
test('DELETE 204 then 404 leaves the same absent resource',()=>{
  const one=req(initialResources(),'DELETE'),two=req(one.state,'DELETE');
  assert.equal(one.status,204);assert.equal(two.status,404);assert.deepEqual(one.state,two.state);
  assert.equal(req(one.state,'HEAD').body,'');
});
test('bad method/path, body syntax/type/schema never mutate resources',()=>{
  const initial=initialResources();
  for(const [method,path,body,type,status] of [
    ['GET','/missing','','application/json',404],['POST','/books/7','{}','application/json',405],
    ['POST','/books','{','application/json',400],['POST','/books','{}','text/plain',415],
    ['POST','/books','{"title":"Bad","price":-1}','application/json',422],
    ['PATCH','/books/7','{"id":8}','application/json',422],['PATCH','/books/7','{"increment":-11}','application/json',422],
    ['GET','/books/99999999999999999','','application/json',400]
  ]){const result=req(initial,method,path,body,type);assert.equal(result.status,status);assert.deepEqual(result.state,initial)}
});
test('representation negotiation, HTML escaping and JSONP parsing are separate concerns',()=>{
  assert.equal(representation({format:'html',accept:'application/json'}).status,406);
  const html=representation({format:'html',accept:'text/html',title:'<b>A & B</b>'});
  assert.equal(html.status,200);assert.match(html.body,/&lt;b&gt;A &amp; B&lt;\/b&gt;/);
  assert.throws(()=>JSON.parse(representation({format:'jsonp',accept:'text/javascript'}).body),SyntaxError);
  assert.equal(JSON.parse(representation({format:'json',accept:'application/json',title:'Web'}).body).title,'Web');
});
test('actual Response decoding separates HTTP failure, JSON failure, empty body and network failure',async()=>{
  assert.equal((await readSimulatedResponse({status:404,guard:false})).fulfilled,true);
  assert.equal((await readSimulatedResponse({status:404,guard:true})).message,'HTTP 404');
  assert.equal((await readSimulatedResponse({status:200,body:'<h1>Hi</h1>'})).error,'SyntaxError');
  assert.equal((await readSimulatedResponse({status:204})).error,'SyntaxError');
  assert.equal((await readSimulatedResponse({status:204,reader:'skip'})).fulfilled,true);
  const failure=await readSimulatedResponse({network:true});assert.equal(failure.error,'TypeError');assert.equal(failure.status,undefined);
});
