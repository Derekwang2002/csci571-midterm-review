import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {encodeBytes,requestModel,asyncWorkerSource} from '../labs-node-model.js';

test('browser byte results match actual Node Buffer, including truncated Unicode',()=>{
  for(const text of ['','Hello','中','🙂','A中🙂','e\u0301','\ud800','\uFEFFhello']){
    const buffer=Buffer.from(text,'utf8');
    for(let n=0;n<=buffer.length;n++){
      const actual=encodeBytes(text,n),expected=buffer.subarray(0,n);
      assert.equal(actual.total,buffer.length);
      assert.equal(actual.hex,expected.toString('hex'));
      assert.equal(actual.base64,expected.toString('base64'));
      assert.equal(actual.decoded,expected.toString('utf8'));
    }
  }
});
for(const mode of ['callback','await','sync']){
  for(const fail of [false,true]){
    test(`worker ${mode}, ${fail?'failure':'success'} preserves task ordering`,async()=>{
      const worker=new Worker(`const {parentPort}=require('node:worker_threads');
global.postMessage=data=>parentPort.postMessage(data);
${asyncWorkerSource()}
parentPort.on('message', data=>onmessage({data}));`,{eval:true});
      const lines=[];
      try{
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('Worker timed out')),3000);
          worker.on('error',e=>{clearTimeout(timer);reject(e)});
          worker.on('message',data=>{if(data.done){clearTimeout(timer);resolve()}else lines.push(data)});
          worker.postMessage({mode,delay:0,block:15,fail});
        });
        assert.equal(lines.map(line=>line.text[0]).join(''),{callback:'ACMB',await:'AMBC',sync:'ABCM'}[mode]);
        assert.equal(lines.find(line=>line.text[0]==='B').text,fail?'B: ENOENT':'B: file data');
      }finally{await worker.terminate()}
    });
  }
}
test('response depends on method, parser placement, content type and control flow',()=>{
  const base={method:'POST',id:'42',sort:'desc',route:'users',type:'application/json',body:'{"name":"Ada"}',parser:'before',gate:'next'};
  assert.deepEqual(requestModel(base).response,{id:'42',name:'Ada'});
  for(const patch of [{parser:'after'},{type:'text/plain'},{body:'{}'},{body:'{"name":3}'}])assert.equal(requestModel({...base,...patch}).status,422);
  assert.equal(requestModel({...base,body:'{' }).status,400);
  assert.deepEqual(requestModel({...base,method:'GET'}).response,{id:'42',sort:'desc'});
  assert.equal(requestModel({...base,gate:'block',body:'{'}).status,401);
  assert.equal(requestModel({...base,gate:'hang'}).status,null);
  assert.equal(requestModel({...base,route:'missing'}).status,404);
});
