import {markupLabs} from './labs-markup.js?v=20261006-feedback';
import {javascriptLabs} from './labs-javascript.js?v=20261006-feedback';
import {dataLabs} from './labs-data.js?v=20261006-feedback';
import {responsiveLabs} from './labs-responsive.js?v=20261020-labs';
import {reactLabs} from './labs-react.js?v=20261020-labs';
import {nodeLabs} from './labs-node.js?v=20261020-labs';
import {cookieLabs} from './labs-cookies.js?v=20261021-protocol-labs2';
import {restLabs} from './labs-rest.js?v=20261021-protocol-labs2';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories = ['Responsive', 'React', 'Node', 'Cookie', 'REST', 'HTML', 'CSS', 'JavaScript', 'DOM', '数据与网络'];
export const labs = [...responsiveLabs, ...reactLabs, ...nodeLabs, ...cookieLabs, ...restLabs, ...markupLabs, ...javascriptLabs, ...dataLabs].sort((a,b) => categories.indexOf(a.category)-categories.indexOf(b.category));
const labHref = id => `#/lab/${id}`;
const pageHref = (deck,page) => `#/deck/${deck}/${page}`;
const deckNames = {responsive:'Responsive',react:'React',node:'Node',cookies:'Cookie',rest:'REST',html:'HTML',css:'CSS',jsbasics:'JavaScript Basics',jsadvanced:'JavaScript Advanced',dom:'DOM',forms:'HTML Forms',json:'JSON',http:'HTTP',web:'Web Basics'};
const pageRange = ref => `P${ref.start}${ref.end && ref.end!==ref.start ? '–'+ref.end : ''}`;

export function relatedLabLinks(deck,page) {
  const matches = labs.filter(lab => lab.refs.some(ref => ref.deck===deck && page>=ref.start && page<=(ref.end || ref.start)));
  if (!matches.length) return '';
  return `<aside class="related-labs"><span class="block-label">动手验证本页知识点</span>${matches.map(lab => `<a href="${labHref(lab.id)}">${esc(lab.title)} <span>进入实验 →</span></a>`).join('')}</aside>`;
}

function labIndex(main) {
  document.title = '交互实验室 · CSCI 571';
  const path = ['responsive-media','react-state','node-express','cookie-scope','cookie-samesite','rest-methods'].map(id => labs.find(lab => lab.id===id)).filter(Boolean);
  main.innerHTML = `<div class="breadcrumb"><a href="#/">课程目录</a><span>/</span>交互实验室</div>
    <header class="laboratory-head">
      <h1>交互实验室</h1>
      <p>先预测结果，再改一个参数，观察浏览器或程序怎样响应。</p>
    </header>
    <details class="lab-path">
      <summary>期末优先练习 <small>${path.length} 个实验</small></summary>
      <ol>${path.map(lab => `<li><a href="${labHref(lab.id)}">${esc(lab.title)}</a></li>`).join('')}</ol>
    </details>
    <div class="lab-index-tools">
      <label class="lab-search" for="lab-search">查找实验<input id="lab-search" type="search" placeholder="搜索名称或知识点" autocomplete="off"></label>
      <div class="lab-filters" role="group" aria-label="按技术筛选实验">${['全部',...categories].map((category,i) => `<button type="button" data-category="${esc(category)}" aria-pressed="${i===0}" class="${i===0?'selected':''}">${esc(category)}<small>${i===0?labs.length:labs.filter(lab=>lab.category===category).length}</small></button>`).join('')}</div>
    </div>
    <p class="lab-match-count" role="status" aria-live="polite"></p><div class="laboratory-list"></div>
    <p class="lab-scope-note">页码按 PDF 页序标注。“拓展”实验用于辅助理解。</p>`;
  let selected = '全部';
  const render = () => {
    const words = main.querySelector('#lab-search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const visible = labs.filter(lab => (selected==='全部'||lab.category===selected) && words.every(word => [lab.title,lab.category,lab.summary,lab.goal,...lab.refs.map(ref=>ref.label)].join(' ').toLowerCase().includes(word)));
    main.querySelector('.lab-match-count').textContent = `显示 ${visible.length} / ${labs.length} 个实验`;
    main.querySelector('.laboratory-list').innerHTML = visible.length ? visible.map(lab => `
      <a class="laboratory-card" href="${labHref(lab.id)}">
        <div class="laboratory-card-meta"><span>${esc(lab.category)}</span><small>${lab.minutes} 分钟</small></div>
        <div class="laboratory-card-content"><div class="laboratory-card-title"><h2>${esc(lab.title)}</h2></div><p>${esc(lab.summary)}</p></div>
        <div class="laboratory-card-bottom"><span>${esc([...new Set(lab.refs.map(ref => `${deckNames[ref.deck] || ref.deck} ${pageRange(ref)}`))].join(' · '))}</span><b aria-hidden="true">›</b></div>
      </a>`).join('') : '<div class="empty">没有匹配的实验。可以换一个关键词或选择“全部”。</div>';
  };
  main.querySelectorAll('[data-category]').forEach(button => button.onclick = () => {
    selected=button.dataset.category;
    main.querySelectorAll('[data-category]').forEach(item => {item.classList.toggle('selected',item===button);item.setAttribute('aria-pressed',String(item===button))});
    render();
  });
  main.querySelector('#lab-search').oninput=render;
  render();
}

export function renderLab(main,id) {
  if (!id) {labIndex(main);return () => {}}
  const lab = labs.find(item => item.id===id);
  if (!lab) {main.innerHTML='<div class="empty"><h1>没有找到这个实验</h1><a href="#/lab">返回实验目录 →</a></div>';return () => {}}
  const index = labs.indexOf(lab);
  document.title = `${lab.title} · 交互实验室 · CSCI 571`;
  main.innerHTML = `<div class="breadcrumb"><a href="#/lab">交互实验室</a><span>/</span>${esc(lab.category)}</div>
    <div class="lab-workspace-nav"><a href="#/lab">‹ 所有实验</a><label for="lab-jump">切换实验</label><select id="lab-jump">${categories.map(category=>`<optgroup label="${esc(category)}">${labs.filter(item=>item.category===category).map(item=>`<option value="${esc(item.id)}" ${item.id===id?'selected':''}>${esc(item.title)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <header class="experiment-head"><h1>${esc(lab.title)}</h1><p>${esc(lab.summary)}</p></header>
    <details class="lab-mapping"><summary><span>对应课件</span> ${esc([...new Set(lab.refs.map(ref=>`${deckNames[ref.deck] || ref.deck} ${pageRange(ref)}`))].join(' · '))}<b>展开逐页对照</b></summary><div>${lab.refs.map(ref => `<section><strong>${esc(deckNames[ref.deck] || ref.deck)} · ${esc(ref.label)}</strong><div class="lab-page-links">${Array.from({length:(ref.end||ref.start)-ref.start+1},(_,i)=>ref.start+i).map(page=>`<a href="${pageHref(ref.deck,page)}" aria-label="${esc(deckNames[ref.deck] || ref.deck)} PDF 第 ${page} 页">P${page}</a>`).join('')}<a class="lab-summary-link" href="#/interpretations/${ref.deck}">本讲整体总结 →</a></div></section>`).join('')}</div></details>
    <div class="experiment-brief"><div><span class="block-label">这次要弄懂</span><p>${esc(lab.goal)}</p></div><div><span class="block-label">动手前，先预测</span><p>${esc(lab.predict)}</p></div></div>
    <section class="experiment-stage" aria-label="${esc(lab.title)}操作区"><div class="experiment-stage-head"><h2>实验操作</h2><button id="reset-experiment" type="button">重置实验 ↺</button></div><div class="lab-verdicts" aria-live="polite" aria-atomic="true"></div><div id="experiment-slot" class="lab experiment-workbench"></div><span id="lab-reset-status" class="visually-hidden" role="status"></span></section>
    <section class="experiment-explanation"><h2>结果解释</h2><div class="lab-current-explanation"></div><details class="lab-general-rules"><summary>通用规则与补充</summary>${lab.explanation.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</details></section>
    <section class="experiment-challenges"><h2>自测</h2>${lab.challenges.map((challenge,i)=>`<div class="experiment-challenge"><p><span>${String(i+1).padStart(2,'0')}</span>${esc(challenge.prompt)}</p><details><summary>核对答案与原因</summary><p>${esc(challenge.answer)}</p></details></div>`).join('')}</section>
    <nav class="pager" aria-label="前后实验">${index>0?`<a href="${labHref(labs[index-1].id)}"><small>上一个实验</small>${esc(labs[index-1].title)}</a>`:'<a href="#/lab"><small>实验目录</small>返回实验目录</a>'}${index<labs.length-1?`<a href="${labHref(labs[index+1].id)}"><small>下一个实验</small>${esc(labs[index+1].title)}</a>`:'<a href="#/lab"><small>实验目录</small>返回实验目录</a>'}</nav>
    <footer>页码采用 PDF 页序。可返回原页对照，也可从原页直接进入相关实验。</footer>`;
  let cleanup;
  const reports = new Map();
  const slot = main.querySelector('#experiment-slot');
  const states = {ready:'本次结果', pending:'等待执行', running:'正在运行', error:'检查输入'};
  const renderReports = () => {
    const values = [...reports.values()];
    main.querySelector('.lab-verdicts').innerHTML = values.map(item => `<div class="lab-verdict ${esc(item.state)}"><span>${states[item.state] || '本次结果'}</span><strong>${esc(item.title)}</strong></div>`).join('');
    main.querySelector('.lab-current-explanation').innerHTML = values.map(item => `<article class="lab-feedback ${esc(item.state)}"><h3>${esc(item.title)}</h3><div class="lab-feedback-head" aria-hidden="true"><span>当前选项 / 操作</span><span>实际结果</span><span>为什么</span></div>${item.rows.map(([choice,result,reason]) => `<div class="lab-feedback-row"><div><small>当前选项 / 操作</small><strong>${esc(choice)}</strong></div><div><small>实际结果</small><span>${esc(result)}</span></div><div><small>为什么</small><span>${esc(reason)}</span></div></div>`).join('')}</article>`).join('');
  };
  const onResult = event => { reports.set(event.detail.key, event.detail); renderReports(); };
  slot.addEventListener('lab-result', onResult);
  const mount = () => {
    if (typeof cleanup==='function') cleanup();
    cleanup=null;
    const slot=main.querySelector('#experiment-slot');
    reports.clear(); renderReports();
    slot.replaceChildren();
    try {
      cleanup=lab.mount(slot);
      slot.querySelectorAll('.lab-result').forEach((output,index) => {
        const details=document.createElement('details'),summary=document.createElement('summary');
        details.className='lab-raw-result';
        summary.textContent=id==='json-parser' ? `${index===0?'解析':'序列化'}的原始输出` : '原始输出与测量明细';
        output.before(details); details.append(summary,output);
      });
    } catch(error) {slot.innerHTML=`<div class="lab-result error">实验暂时未能运行：${esc(error.message)}。请点击重置实验重试。</div>`;console.error(error)}
  };
  main.querySelector('#lab-jump').onchange=event => location.hash=labHref(event.target.value);
  main.querySelector('#reset-experiment').onclick=() => {mount();main.querySelector('#lab-reset-status').textContent='实验已恢复默认设置'};
  mount();
  return () => {slot.removeEventListener('lab-result', onResult);if(typeof cleanup==='function') cleanup()};
}
