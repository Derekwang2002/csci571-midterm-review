import {report, pending, invalid} from './lab-feedback.js?v=20261006-feedback';
export {report, pending, invalid};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const options = entries => entries.map(([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
export const ref = (deck,start,end,label) => ({deck,start,end,label});
export function bench(root,controls,preview,note) {
  root.innerHTML = `<p class="lab-runtime-note">${esc(note)}</p><div class="experiment-grid"><div class="experiment-controls">${controls}</div><div class="experiment-preview">${preview}<pre class="lab-code" data-code tabindex="0" aria-label="与当前选项对应的代码"></pre></div></div>`;
  const abort = new AbortController();
  const $ = selector => root.querySelector(selector);
  return {$, code: value => $('[data-code]').textContent=value,
    on: (node,event,fn) => node.addEventListener(event,fn,{signal:abort.signal}),
    destroy: () => abort.abort()};
}
export const numberControl = (name,label,value,min,max) => `<label>${label}<input data-${name} type="range" value="${value}" min="${min}" max="${max}"></label>`;
export const selectControl = (name,label,entries) => `<label>${label}<select data-${name}>${options(entries)}</select></label>`;
export const metrics = entries => `<div class="final-lab-metrics">${entries.map(([label,value])=>`<div><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div>`;
export function links(items) {
  return `<p class="lab-note">补充阅读：${items.map(([title,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>`).join(' · ')}</p>`;
}
// The iframe keeps the requested CSS viewport width even on a narrow phone.
// Only the visual surface is scaled; computed layout is measured before scaling.
export function viewport(ui,html) {
  const frame=ui.$('iframe'), wrap=frame.parentElement;
  let width=768, alive=true, ready=false, scheduled=0, measure=()=>{}, css='';
  const scale=() => {
    const factor=Math.min(1,wrap.clientWidth/width);
    frame.style.width=`${width}px`;
    frame.style.transform=`scale(${factor})`;
    wrap.style.height=`${Math.ceil(420*factor)}px`;
  };
  const refresh=() => {
    scale(); cancelAnimationFrame(scheduled);
    scheduled=requestAnimationFrame(()=>{if(alive&&ready)measure(frame.contentDocument,frame.contentWindow)});
  };
  ui.on(frame,'load',()=>{
    if(!alive)return;
    ready=true; frame.contentDocument.querySelector('#custom').textContent=css; refresh();
  });
  frame.srcdoc=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{font:20px/1.5 system-ui;background:#fff;color:#252b36}body{margin:0}*{box-sizing:border-box}.tile{padding:12px;border:2px solid #922636;background:#f6e9ec;text-align:center}#custom{display:none}</style><style id="custom"></style><body>${html}</body></html>`;
  const observer=new ResizeObserver(refresh); observer.observe(wrap);
  return {
    update(nextWidth,nextCSS,callback) {
      width=nextWidth;css=nextCSS;measure=callback;
      if(ready)frame.contentDocument.querySelector('#custom').textContent=css;
      refresh();
    },
    destroy(){alive=false;observer.disconnect();cancelAnimationFrame(scheduled);}
  };
}
export const viewportMarkup = '<div class="final-viewport"><iframe title="按指定 CSS 像素宽度渲染的真实页面" sandbox="allow-same-origin"></iframe></div><div data-metrics></div>';
