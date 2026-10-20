// Verify the bounded browser model against a real Express server.
// npm install --prefix tmp/final-smoke --save-exact express@5.3.0
import express from '../tmp/final-smoke/node_modules/express/index.js';
import http from 'node:http';
import assert from 'node:assert/strict';
import {requestModel} from '../labs-node-model.js';
let checked=0;
for(const parser of ['before','after'])for(const gate of ['next','block']){
  const app=express();
  app.use((req,res,next)=>gate==='next'?next():res.status(401).json({error:'blocked'}));
  if(parser==='before')app.use(express.json());
  app.get('/users/:id',(req,res)=>res.json({id:req.params.id,sort:req.query.sort}));
  app.post('/users/:id',(req,res)=>{
    if(typeof req.body?.name!=='string'||!req.body.name.trim())return res.status(422).json({error:'name required'});
    res.status(201).json({id:req.params.id,name:req.body.name});
  });
  if(parser==='after')app.use(express.json());
  app.use((req,res)=>res.status(404).json({error:'not found'}));
  app.use((err,req,res,next)=>res.status(400).json({error:'invalid JSON'}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try{
    for(const method of ['GET','POST'])for(const route of ['users','missing'])for(const type of ['application/json','text/plain'])for(const body of ['{"name":"Ada"}','{}','{','null','[]']){
      const p={method,route,type,body,parser,gate,id:'中 /42',sort:'desc'};
      const actual=await new Promise((resolve,reject)=>{
        const req=http.request({hostname:'127.0.0.1',port:server.address().port,method,path:route==='users'?`/users/${encodeURIComponent(p.id)}?sort=desc`:'/missing',headers:{'Content-Type':type,'Content-Length':Buffer.byteLength(body)}},res=>{
          let data='';res.on('data',chunk=>data+=chunk);res.on('end',()=>resolve({status:res.statusCode,response:JSON.parse(data)}));
        });
        req.on('error',reject);req.end(body);
      });
      const expected=requestModel(p);
      assert.equal(actual.status,expected.status,JSON.stringify(p));
      assert.deepEqual(actual.response,expected.response,JSON.stringify(p));
      checked++;
    }
  }finally{await new Promise(resolve=>server.close(resolve))}
}
console.log(`Compared ${checked} request combinations with actual Express: passed`);
