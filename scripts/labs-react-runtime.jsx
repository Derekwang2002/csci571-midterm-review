import React,{useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';

const Code=({children})=><pre className="lab-code" tabIndex="0" aria-label="与当前选项对应的 React 示例">{children}</pre>;
const Metric=({label,children})=><div><small>{label}</small><strong>{children}</strong></div>;
const Docs=({href,children})=><p className="lab-note"><a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a></p>;
function StateLab({report}) {
  const [mode,setMode]=useState('value'),[times,setTimes]=useState(3),[step,setStep]=useState(1),[count,setCount]=useState(0),[last,setLast]=useState(null);
  function change(setter,value){setter(value);setCount(0);setLast(null)}
  function run(){
    const before=count;
    if(mode==='value')for(let i=0;i<times;i++)setCount(count+step);
    else if(mode==='updater')for(let i=0;i<times;i++)setCount(n=>n+step);
    else {setCount(count+step);setCount(n=>n*2)}
    setLast({before,inside:count});
  }
  const calls=mode==='mixed'?`setCount(count + ${step});\nsetCount(n => n * 2);`:Array.from({length:times},()=>mode==='value'?`setCount(count + ${step});`:`setCount(n => n + ${step});`).join('\n');
  useEffect(()=>{
    let v=last?.before??0;
    const queue=mode==='mixed'?`${v} → 替换为 ${v+step} → ×2`:
      Array.from({length:times},(_,i)=>{v=mode==='value'?(last?.before??0)+step:v+step;return `${i+1}: ${v}`}).join(' → ');
    report(last?`提交后 count = ${count}；处理器内仍读到 ${last.inside}`:'初始 count = 0，点击运行观察更新',[
      [`${mode==='value'?'值替换':mode==='updater'?'函数更新':'先替换再翻倍'}；步长 ${step}${mode==='mixed'?'':`；${times} 次`}`,last?queue:'尚未点击；修改参数会归零','React P15、18：把 setter 看成排队请求。值替换使用本次快照计算，函数更新接收前一个队列结果。'],
      ['事件处理器最后读取 count',last?String(last.inside):'尚未点击','React P15：setter 不改变当前处理器闭包中的变量，因此这里仍是点击前的值。'],
      ['React 实际提交的界面',String(count),'数字来自真实 useState 结果。与上行对照，可以区分事件中的快照和下一次 render。']
    ]);
  },[mode,times,step,count,last]);
  return <div className="experiment-grid"><div className="experiment-controls">
    <label>setter 写法<select value={mode} onChange={e=>change(setMode,e.target.value)}><option value="value">setCount(count + step)</option><option value="updater">setCount(n =&gt; n + step)</option><option value="mixed">先 count + step，再 n × 2</option></select></label>
    <label>一次点击调用次数<select value={times} disabled={mode==='mixed'} onChange={e=>change(setTimes,+e.target.value)}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
    <label>步长<select value={step} onChange={e=>change(setStep,+e.target.value)}>{[1,2,5].map(n=><option key={n}>{n}</option>)}</select></label>
    <button className="primary" onClick={run}>执行一次点击</button><p className="lab-note">修改参数会从 0 重新开始；连续点击保留 count。</p>
    <Docs href="https://react.dev/learn/queueing-a-series-of-state-updates">React：状态更新队列</Docs>
  </div><div className="experiment-preview"><div className="final-lab-metrics"><Metric label="真实界面 count">{count}</Metric><Metric label="处理器内读取">{last?last.inside:'—'}</Metric></div>
    <Code>{`const [count, setCount] = useState(0);\nfunction handleClick() {\n${calls.split('\n').map(l=>'  '+l).join('\n')}\n  console.log(count); // 当前 render 的快照\n}\nreturn <button onClick={handleClick}>{count}</button>;`}</Code>
  </div></div>;
}
function LocalCard({name}) {
  const [count,setCount]=useState(0);
  return <Card name={name} count={count} onAdd={()=>setCount(n=>n+1)}/>;
}
function Card({name,count,onAdd}) {
  return <div className="react-demo-card"><h3>{name}</h3><p>数量 <strong data-count>{count}</strong></p><button onClick={onAdd}>{name} +1</button></div>;
}
function PropsLab({report}) {
  const [mode,setMode]=useState('shared'),[name,setName]=useState('苹果'),[count,setCount]=useState(0);
  // LocalCard owns its own count; the parent never fabricates that child's state.
  const host=useRef(null),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const cards=[...host.current.querySelectorAll('[data-count]')].map(n=>n.textContent);
    report(`${mode==='shared'?'父组件共享 state':'子组件各自 state'} → 左 ${cards[0]} / 右 ${cards[1]}`,[
      [`状态位置：${mode==='shared'?'共同父组件':'两个 LocalCard 内部'}`,`左 ${cards[0]}；右 ${cards[1]}`,mode==='shared'?'React P16：两个孩子收到同一个 count prop；任一 onAdd 都更新父组件，因此两边同步。':'React P10–13：复用组件代码不等于共用状态，每个 LocalCard 实例都有独立 useState。'],
      [`左侧 name prop = ${name}`,`左侧显示“${name}”`,'React P13：修改 name prop 会重新渲染文字。只要组件类型、位置与 key 保持，已有 state 不会因为改名自动归零。'],
      ['点击 +1',mode==='shared'?'子组件 onAdd → 父 setCount → 新 count props':'当前 LocalCard 的 setCount','React P16：props 是输入。共享模式下，孩子用回调请求状态拥有者更新，不能直接改 props。']
    ]);
  },[mode,name,count,revision]);
  return <div className="experiment-grid"><div className="experiment-controls">
    <label>状态放在哪里<select value={mode} onChange={e=>{setMode(e.target.value);setCount(0)}}><option value="shared">父组件：两张卡片共享</option><option value="local">子组件：各自独立</option></select></label>
    <label>左侧 name prop<input value={name} maxLength={24} onChange={e=>setName(e.target.value)}/></label>
    <p className="lab-note">点击预览卡片的 +1。切换状态模式会重新挂载卡片；改名保留数量。</p>
    <Docs href="https://react.dev/learn/sharing-state-between-components">React：提升状态</Docs>
  </div><div className="experiment-preview"><div ref={host} className="react-demo-cards" onClick={()=>setRevision(n=>n+1)}>
    {mode==='shared'?<React.Fragment key="shared"><Card name={name} count={count} onAdd={()=>setCount(n=>n+1)}/><Card name="香蕉" count={count} onAdd={()=>setCount(n=>n+1)}/></React.Fragment>:<React.Fragment key="local"><LocalCard name={name}/><LocalCard name="香蕉"/></React.Fragment>}
    </div><Code>{mode==='shared'?`// Parent 拥有唯一的 count\nconst [count, setCount] = useState(0);\nconst onAdd = () => setCount(n => n + 1);\nreturn <>\n  <Card name=${JSON.stringify(name)} count={count} onAdd={onAdd} />\n  <Card name="香蕉" count={count} onAdd={onAdd} />\n</>;\n// Card 中：<button onClick={onAdd}>{count}</button>`:`function LocalCard({ name }) {\n  const [count, setCount] = useState(0);\n  return <Card name={name} count={count}\n    onAdd={() => setCount(n => n + 1)} />;\n}\n// 两个实例分别拥有一份 count\n<LocalCard name=${JSON.stringify(name)} />\n<LocalCard name="香蕉" />`}</Code></div></div>;
}
function Subscriber({room,deps,clean,model}) {
  const [messages,setMessages]=useState([]);
  useEffect(()=>{
    const listener=e=>setMessages(items=>[...items.slice(-4),`${room}: ${e.detail}`]);
    const id=model.add(room,listener);
    return ()=>{if(clean)model.remove(id);else model.log(`遗漏 cleanup ${room}；监听器仍存在`)};
  },deps==='room'?[room]:[]);
  return <div className="react-demo-card"><h3>组件当前 room：{room}</h3><p>收到的消息（最近 5 条）</p><ol data-messages>{messages.map((m,i)=><li key={i}>{m}</li>)}</ol>{!messages.length&&<p>尚未收到消息</p>}</div>;
}
function EffectsLab({report,model}) {
  const [room,setRoom]=useState('A'),[deps,setDeps]=useState('room'),[clean,setClean]=useState(true),[mounted,setMounted]=useState(true),[sendRoom,setSendRoom]=useState('A'),[message,setMessage]=useState('hello'),[revision,setRevision]=useState(0),[generation,setGeneration]=useState(0);
  useEffect(()=>{
    const off=model.subscribe(()=>setRevision(n=>n+1));
    setRevision(n=>n+1); // Child effects may have subscribed before this parent effect.
    return off;
  },[]);
  useEffect(()=>{
    report(`${mounted?'已挂载':'已卸载'} · 实际订阅 ${model.entries.size} 个`,[
      [`room=${room}；依赖 ${deps==='room'?'[room]':'[]'}`,`监听频道：${[...model.entries.values()].map(e=>e.room).join('、')||'无'}`,deps==='room'?'React P17 拓展：room 变更会先 cleanup 旧 Effect，再 setup 新 Effect。':'React P17 拓展：[] 只在本次挂载后 setup；改变 room prop 不会更换订阅。'],
      [`cleanup：${clean?'有':'故意遗漏'}；组件${mounted?'存在':'已卸载'}`,`${model.entries.size} 个活跃监听器`,clean?'清理会移除旧监听器；卸载后应为 0。':'本选项演示泄漏：旧监听器被保留，重复挂载会累积；切配置、重置或离开实验会强制清除。'],
      [`发送到 ${sendRoom}，内容 ${JSON.stringify(message)}`,model.lastSend||'尚未发送','只有该频道的监听器收到事件；卸载后的组件即使遗留监听器，也没有界面可更新。']
    ]);
  },[room,deps,clean,mounted,sendRoom,message,revision]);
  function configure(setter,value){model.clear();setter(value);setGeneration(n=>n+1)}
  return <div className="experiment-grid"><div className="experiment-controls">
    <label>组件 room<select value={room} onChange={e=>setRoom(e.target.value)}><option>A</option><option>B</option></select></label>
    <label>Effect 依赖<select value={deps} onChange={e=>configure(setDeps,e.target.value)}><option value="room">[room]：随频道同步</option><option value="empty">[]：仅挂载时订阅</option></select></label>
    <label>清理函数<select value={String(clean)} onChange={e=>configure(setClean,e.target.value==='true')}><option value="true">return unsubscribe</option><option value="false">故意遗漏 cleanup</option></select></label>
    <button onClick={()=>setMounted(v=>!v)}>{mounted?'卸载组件':'重新挂载'}</button>
    <label>消息发送频道<select value={sendRoom} onChange={e=>{setSendRoom(e.target.value);model.lastSend=''}}><option>A</option><option>B</option></select></label>
    <label>消息内容<input value={message} maxLength={40} onChange={e=>{setMessage(e.target.value);model.lastSend=''}}/></label>
    <button className="primary" onClick={()=>model.send(sendRoom,message)}>发送消息</button>
    <Docs href="https://react.dev/learn/synchronizing-with-effects">React：Effect 与 cleanup</Docs>
  </div><div className="experiment-preview"><div className="final-lab-metrics"><Metric label="实际活跃订阅">{model.entries.size}</Metric><Metric label="组件">{mounted?'已挂载':'已卸载'}</Metric></div>
    {mounted?<Subscriber key={generation} room={room} deps={deps} clean={clean} model={model}/>:<p className="lab-note">组件已卸载，观察订阅是否也被清除。</p>}
    <ol className="final-trace" aria-label="Effect 执行顺序">{model.logs.map((line,i)=><li key={i}>{line}</li>)}</ol>
    <Code>{`useEffect(() => {\n  const unsubscribe = subscribe(room, message => {\n    setMessages(items => [...items, message]);\n  });\n  ${clean?'return unsubscribe;':'// 故意漏掉 return unsubscribe;'}\n}, ${deps==='room'?'[room]':'[]'});\n// subscribe 是本实验的 EventTarget 包装，无网络连接。`}</Code>
  </div></div>;
}
function eventModel() {
  const bus=new EventTarget(),entries=new Map(),subscribers=new Set();
  let sequence=0;
  const model={entries,logs:[],lastSend:'',
    notify(){subscribers.forEach(fn=>fn())},
    subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn)},
    log(text){model.logs=[...model.logs.slice(-7),text];model.notify()},
    add(room,listener){const id=++sequence;entries.set(id,{room,listener});bus.addEventListener(room,listener);model.log(`setup ${room} · 订阅 #${id}`);return id},
    remove(id){const entry=entries.get(id);if(!entry)return;bus.removeEventListener(entry.room,entry.listener);entries.delete(id);model.log(`cleanup ${entry.room} · 订阅 #${id}`)},
    send(room,message){const n=[...entries.values()].filter(e=>e.room===room).length;model.lastSend=`本次匹配 ${n} 个监听器`;bus.dispatchEvent(new CustomEvent(room,{detail:message}));model.log(`发送 ${room}：${message} → ${n} 个监听器`)},
    clear(){for(const {room,listener} of entries.values())bus.removeEventListener(room,listener);entries.clear();model.logs=[];model.lastSend='';model.notify()}
  };return model;
}
export function mount(host,kind,report) {
  const root=createRoot(host),model=eventModel();
  const Component={state:StateLab,props:PropsLab,effects:EffectsLab}[kind];
  root.render(<Component report={report} model={model}/>);
  return()=>{root.unmount();model.clear()};
}
