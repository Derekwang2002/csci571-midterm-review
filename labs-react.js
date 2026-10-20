import {ref,report,invalid} from './labs-final-shared.js?v=20261020-labs';
function runtime(kind) {
  return root=>{
    let disposed=false,cleanup;
    root.innerHTML='<p class="lab-runtime-note">使用本地打包的 React 19 与 React DOM 实际渲染。控件会改变组件参数，代码、界面与解释同步更新。Hooks 用于解释课件原理；本实验未启用开发模式的 StrictMode 重复检查。</p><div data-react-host>正在加载 React…</div>';
    import('./assets/labs/react-runtime.js?v=20261020-labs').then(module=>{
      if(!disposed)cleanup=module.mount(root.querySelector('[data-react-host]'),kind,(title,rows)=>report(root,title,rows));
    }).catch(error=>{if(!disposed){root.querySelector('[data-react-host]').textContent='React 加载失败，请重置重试。';invalid(root,error.message)}});
    return()=>{disposed=true;cleanup?.()};
  };
}
export const reactLabs=[
  {id:'react-state',category:'React',title:'状态快照与批量更新',minutes:8,summary:'改变 setter 写法、重复次数和步长，观察事件中的旧快照与提交后的新状态。',goal:'按队列顺序解释替换更新与函数更新，避免把 setState 当成同步赋值。',predict:'一次点击执行三次 setCount(count+1)，0 会变成 1 还是 3？',refs:[ref('react',14,16,'状态、setState 与 props'),ref('react',18,18,'事件与状态')],mount:runtime('state'),explanation:['同一次 render 的事件处理器读取固定快照；setter 只排队请求更新。','函数更新 n=>n+1 依次接收队列中的中间值。useState setter 替换值，区别于类组件 setState 对对象的浅合并。'],challenges:[{prompt:'count=5，依次 setCount(count+2)、setCount(n=>n*2)，结果是多少？',answer:'先替换为 7，再把队列中的 7 乘 2，得到 14。处理器内直接读取 count 仍是 5。'},{prompt:'分三次点击，每次只调用一次 setCount(count+1)，为什么能加三次？',answer:'每次点击后 React 都提交新状态；下一次点击的处理器使用新 render 的快照。'}]},
  {id:'react-props',category:'React',title:'Props 与共享状态',minutes:6,summary:'两张商品卡片共用一个组件，切换独立 state 与提升到父组件的共享 state。',goal:'找出状态所有者，追踪 props 向下、回调向上的路径。',predict:'点左侧 +1，右侧什么时候会一起改变？修改 name prop 会重置数量吗？',refs:[ref('react',10,13,'组件与 props'),ref('react',16,16,'state 与 props'),ref('react',18,18,'共享状态')],mount:runtime('props'),explanation:['组件函数可以复用，但每个挂载实例默认拥有独立 state。','共享值只存到共同父组件，孩子通过 props 读取并通过 onAdd 回调请求父组件更新。'],challenges:[{prompt:'父组件把 count 传入两个子组件后，谁拥有这个 state？',answer:'父组件。孩子收到的 count 是 props；孩子触发回调，父组件 setter 更新 state，再向两个孩子传入新 props。'}]},
  {id:'react-effects',category:'React',title:'Effect 依赖与清理',minutes:8,summary:'切换频道、发一条消息、卸载组件，直接观察订阅数量和 setup/cleanup 顺序。',goal:'理解依赖变化时先清理旧 Effect 再建立新的同步，发现空依赖与遗漏清理的问题。',predict:'订阅 room A 后切到 B，依赖写 [] 会听哪个频道？卸载但不 cleanup 会怎样？',refs:[ref('react',17,17,'挂载、更新、卸载')],mount:runtime('effects'),explanation:['Hooks 是对课件生命周期概念的现代补充。依赖 [room] 在 room 变化时重新同步；[] 不跟随 room 更新。','清理函数在下次 setup 前和卸载时执行。本例使用浏览器 EventTarget 演示订阅，不连接聊天服务器。实验重置/离开时会清除所有演示监听器。'],challenges:[{prompt:'初始 A，依赖 [room] 且有 cleanup；切 B 再卸载，日志顺序是什么？',answer:'setup A → cleanup A → setup B → cleanup B。卸载后订阅数为 0。'},{prompt:'使用 [] 时，在 A 挂载后切 B，界面标题为什么可能与实际订阅不一致？',answer:'组件可以用新 prop 重新渲染标题，但 Effect 没有重新运行，监听器闭包仍关联 A。'}]}
];
