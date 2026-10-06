export function createReadingTracker(store,main){
  let active=null,timer=null,restoring=false,generation=0;
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  function snapshot(){
    if(!active||restoring)return;
    const sections=[...main.querySelectorAll('.interpretation-section[id],.interpretation-history[id],#interpretation-checklist')];
    const anchor=sections.filter(node=>node.getBoundingClientRect().top<=110).at(-1);
    store.saveReading({route:active.route,title:active.title,y:Math.max(0,window.scrollY),anchor:anchor?.id??null,offset:anchor?anchor.getBoundingClientRect().top:0,open:[...main.querySelectorAll('details')].flatMap((node,index)=>node.open?[index]:[])});
  }
  function flush(){clearTimeout(timer);timer=null;snapshot()}
  const queue=()=>{if(!active||restoring)return;clearTimeout(timer);timer=setTimeout(flush,180)};
  window.addEventListener('scroll',queue,{passive:true});
  main.addEventListener('toggle',queue,true);
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
  return {
    stop(){flush();active=null;restoring=false;generation++},
    async start(route,title){
      if(!store.validRoute(route))return;
      const token=++generation,saved=store.getReading(route);
      active={route,title};restoring=true;
      if(saved){const details=main.querySelectorAll('details');for(const index of saved.open)if(details[index])details[index].open=true}
      // Wait for typeface layout, but do not block reading if a font request stalls.
      let timeout;
      await Promise.race([document.fonts?.ready??Promise.resolve(),new Promise(resolve=>{timeout=setTimeout(resolve,1000)})]);
      clearTimeout(timeout);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(token!==generation)return;
      const anchor=saved?.anchor?document.getElementById(saved.anchor):null;
      if(saved)window.scrollTo({top:Math.max(0,anchor?window.scrollY+anchor.getBoundingClientRect().top-saved.offset:saved.y),behavior:'instant'});
      restoring=false;
      // Store the restored position synchronously, including a newly opened lecture.
      flush();
    },
    flush
  };
}
