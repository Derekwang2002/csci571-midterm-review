import {renderFlow, renderScenario} from './study-figures.js?v=20261125';
const VERSION = '20261125';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich = value => esc(value).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const loaded = new Map();
const kinds = {concept:'重点理解',background:'背景 · 按需查阅',history:'发展历史 · 可跳过',admin:'课程安排'};
export const interpretationHref = id => `#/interpretations${id?'/'+id:''}`;
function getSummary(folder,id) {
 const key = `${folder}/${id}`;
 if (!loaded.has(key)) loaded.set(key,fetch(`content/${key}.json?v=${VERSION}`).then(r=>{
  if(!r.ok) throw new Error('总结暂时未能载入，请刷新重试。');
  return r.json();
 }).catch(e=>{loaded.delete(key);throw e}));
 return loaded.get(key);
}
// Keep the original full mapping for history labels and archived summaries.
export const getInterpretation = id => getSummary('interpretations',id);
const historyNotice = () => `<aside class="history-guidance"><strong>教授说明：发展历史无需复习或记忆</strong><p lang="en">Development &quot;history&quot; is not something that you have to recall or read again.</p><span>技术规则仍保留；历史、市场榜单与环境配置默认折叠。</span></aside>`;
export const finalScopeNotice = () => `<aside class="final-scope"><strong>Exam #2 · 12 月 3 日 17:00 · 60 分钟</strong><p>Syllabus 写明本次考试占课程总评 40%，以理论与代码分析为主，不要求写代码。<b>当前版本没有写明新旧内容的题量比例。</b></p><p>本次复习整理到 Web Intrusion（含）。期中内容按教师口头说明做少量回顾，旧 13 章每章保留一道核心自测。</p><a href="#/interpretations/syllabus">查看范围依据与复习顺序 →</a></aside>`;
function pageRanges(pages){const sorted=[...pages].sort((a,b)=>a-b),parts=[];for(let i=0;i<sorted.length;i++){let start=sorted[i],end=start;while(sorted[i+1]===end+1)end=sorted[++i];parts.push(start===end?String(start):`${start}–${end}`)}return parts.join('、')}
export function studyGroups(decks) {
 const lectures=decks.filter(d=>d.phase==='new');
 const start=lectures.findIndex(d=>d.id==='ajax');
 return [
  {phase:'new',title:'从页面布局到 REST',note:'画出界面、保存状态，再向资源接口请求数据。',decks:lectures.slice(0,start)},
  {phase:'new',title:'从 AJAX 到 Web Intrusion',note:'按课表顺序继续。每章有原理图、按页讲解和可以先猜后看的自测。',decks:lectures.slice(start)},
  {phase:'foundation',title:'Midterm 核心回顾',note:'13 章，每章精选核心规则与一道自测。',decks:decks.filter(d=>d.phase==='foundation')},
  {phase:'admin',title:'考试安排',note:'考试时间、成绩权重与复习范围的依据。',decks:decks.filter(d=>d.phase==='admin')}
 ];
}
const icons = {
  arrow: '<path d="M4 10h12m-5-5 5 5-5 5"/>',
  book: '<path d="M2 4.5c2.8-.8 5.4-.5 8 1 2.6-1.5 5.2-1.8 8-1v11c-2.8-.8-5.4-.5-8 1-2.6-1.5-5.2-1.8-8-1zM10 5.5v11"/>',
  print: '<path d="M5 7V3h10v4M5 14H3V8.5C3 7.7 3.7 7 4.5 7h11c.8 0 1.5.7 1.5 1.5V14h-2M5 12h10v5H5zM14 9.5h1"/>',
  chevron: '<path d="m7.5 4.5 5 5-5 5"/>'
};
function icon(name){
  return `<svg class="study-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}
export function interpretationIndex(decks){
  const groups=studyGroups(decks);
  return `<div class="study-directory">
    <div class="breadcrumb"><a href="#/">课程目录</a><span>/</span>期末复习</div>
    <header class="directory-header"><h1>期末复习手册</h1>
    <p class="interpretation-intro">从浏览器里的一次点击，读到服务器怎样返回数据、缓存省下哪段等待，以及谁有权查看私人订单。</p>
    <nav class="continue-chapters" aria-label="后半程复习入口"><a href="#/interpretations/ajax">从 AJAX 接着读 ${icon('arrow')}</a><a href="#/interpretations/intrusion">最后一讲 · Web Intrusion ${icon('chevron')}</a></nav></header>
    ${groups.map(group=>`<section class="study-group"><div class="section-top"><h2>${esc(group.title)}</h2><span>${group.decks.length} 份讲义</span></div>
    <div class="interpretation-index ${group.phase==='new'?'new-lectures':''}">${group.decks.map(d=>`<a href="${interpretationHref(d.id)}"><div><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p></div><span class="directory-page-count">${d.phase==='foundation'?'核心回顾':d.count+' 页'}</span><span class="interpretation-arrow" aria-hidden="true">${icon('chevron')}</span></a>`).join('')}</div></section>`).join('')}
    ${finalScopeNotice()}${historyNotice()}</div>`;
}
function renderTable(table) {
 if(!table) return '';
 return `<div class="study-table-wrap" tabindex="0" role="region" aria-label="知识点对照表"><table class="study-table"><thead><tr>${table.headers.map(h=>`<th scope="col">${rich(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${row.map(cell=>`<td>${rich(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderReferences(id, section, pages) {
  return `<details class="interpretation-refs"><summary>对应课件 · PDF ${pageRanges(section.pages)}</summary>
    <div class="interpretation-page-links">${section.pages.map(n=>`<a href="#/deck/${id}/${n}" title="${esc(pages[n-1].title)}"><span>P${n}</span>${esc(pages[n-1].title)}</a>`).join('')}</div></details>`;
}
function renderSectionBody(id, section, pages) {
  return `${section.paragraphs.map((p,i)=>`<p>${rich(p)}</p>${i===0?renderFlow(section.figure):''}`).join('')}
    ${renderScenario(id,section.pages)}${renderTable(section.table)}
    ${section.example?`<div class="code-box"><div class="code-toolbar"><span>${esc(section.example.lang)} · 推一遍结果</span></div><pre><code>${esc(section.example.code)}</code></pre></div><p class="example-note"><strong>结果与原因</strong> ${rich(section.example.explanation)}</p>`:''}
    <ul class="interpretation-points">${section.takeaways.map(p=>`<li>${rich(p)}</li>`).join('')}</ul>
    ${section.question?`<section class="quiz-block"><span class="block-label">自测</span><p>${rich(section.question.prompt)}</p><details><summary>查看答案与原因</summary><div class="answer">${rich(section.question.answer)}</div></details></section>`:''}
    ${section.links?.length?`<div class="study-links">${section.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('')}</div>`:''}
    ${renderReferences(id,section,pages)}`;
}
function renderSection(id, section, index, pages) {
  const sectionId=`interpretation-section-${index}`;
  if(section.kind!=='concept'){
    return `<details class="interpretation-history" id="${sectionId}"><summary><span class="interpretation-kind">${esc(kinds[section.kind])}</span><strong>${esc(section.title)}</strong><small>PDF ${pageRanges(section.pages)}</small></summary><div class="interpretation-history-body">${renderSectionBody(id,section,pages)}</div></details>`;
  }
  return `<section class="interpretation-section" id="${sectionId}"><div class="study-section-heading"><h2>${esc(section.title)}</h2><span class="interpretation-kind concept">PDF ${pageRanges(section.pages)}</span></div>${renderSectionBody(id,section,pages)}</section>`;
}
function bindChapterNavigation(main, side) {
  const toc=side.querySelector('.interpretation-toc');
  const buttons=[...toc.querySelectorAll('[data-scroll]')];
  const sections=buttons.map(button=>document.getElementById(button.dataset.scroll));
  let current=null, frame=0;
  function update(){
    frame=0;
    const boundary=(document.querySelector('.topbar')?.getBoundingClientRect().bottom??80)+26;
    const atEnd=window.scrollY>0 && window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2;
    const index=atEnd?sections.length-1:sections.findLastIndex((section,i)=>i===0||section.getBoundingClientRect().top<=boundary);
    const next=buttons[index];
    if(next===current)return;
    current?.removeAttribute('aria-current');
    next.setAttribute('aria-current','location');
    current=next;
  }
  const controller=new AbortController();
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  window.addEventListener('scroll',schedule,{passive:true,signal:controller.signal});
  window.addEventListener('resize',schedule,{signal:controller.signal});
  main.addEventListener('toggle',schedule,{capture:true,signal:controller.signal});
  window.addEventListener('hashchange',()=>{controller.abort();cancelAnimationFrame(frame)},{once:true});
  update();
  toc.addEventListener('click',event=>{
    const button=event.target.closest('[data-scroll]');
    if(!button)return;
    const target=document.getElementById(button.dataset.scroll);
    if(target.tagName==='DETAILS')target.open=true;
    const top=target.getBoundingClientRect().top+window.scrollY-(document.querySelector('.topbar')?.getBoundingClientRect().bottom??80)-16;
    window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
}
export async function showInterpretation(id,{decks,main,side,loadDeck,navBase,isCurrent,full=false}){
  const deck=decks.find(d=>d.id===id);
  if(!deck)throw new Error('没有找到这份讲义。');
  const compact=deck.phase!=='new'&&!full;
  const [summary,pages]=await Promise.all([getSummary(compact?'final-core':'interpretations',id),loadDeck(id)]);
  if(!isCurrent())return;
  const sections=summary.sections;
  const pageMap=new Map(sections.flatMap(s=>s.pages.map(n=>[n,s])));
  const original=deck.sourceMode==='study'?'逐页防护图解':'对照原始课件';
  const originalHref=`#/deck/${id}/${deck.corePages?.[0]||1}`;
  document.title=`${deck.title} · Final 复习 · CSCI 571`;
  side.innerHTML=navBase('interpretations')+`<label class="side-heading" for="interpretation-select">切换复习章节</label><select class="course-select" id="interpretation-select">${decks.map(d=>`<option value="${d.id}" ${d.id===id?'selected':''}>${d.phase==='new'?'新增 · ':d.phase==='foundation'?'核心 · ':''}${esc(d.title)}</option>`).join('')}</select>
    <div class="chapter-nav-label">本章目录</div><nav class="interpretation-toc" aria-label="总结章节"><button data-scroll="interpretation-start">章节概览</button>${sections.map((s,i)=>`<button data-scroll="interpretation-section-${i}" class="${s.kind!=='concept'?'history-toc':''}">${esc(s.title)}</button>`).join('')}<button data-scroll="interpretation-checklist">考前自查</button></nav><a href="${originalHref}" class="side-back">${original} ›</a>`;
  side.scrollTop=0;
  side.querySelector('#interpretation-select').onchange=e=>location.hash=interpretationHref(e.target.value);
  const mappedPages=pages.filter(p=>pageMap.has(p.page));
  const index=decks.indexOf(deck);
  const quizCount=sections.filter(s=>s.question).length;
  // This disclosure stays first to preserve the saved indexes for every details element.
  const guide=`<details class="interpretation-coverage"><summary>学习目标与${compact?'核心页对照':'全页覆盖对照'}</summary><div class="study-guide-body">
    <section class="interpretation-goals"><h2>复习目标</h2><ul>${summary.goals.map(g=>`<li>${rich(g)}</li>`).join('')}</ul></section>
    ${!compact?historyNotice():''}
    <h2>讲义页码</h2><p>${compact?'本章精选核心页，可点页码查看详解。':'页码按 PDF 阅读器顺序，可点页码查看详解。'}</p><div class="coverage-grid">${mappedPages.map(p=>{const section=pageMap.get(p.page);return `<a href="#/deck/${id}/${p.page}" class="${section.kind!=='concept'?'coverage-history':''}" title="${esc(p.title)} → ${esc(section.title)}">P${p.page}<span>${esc(kinds[section.kind])}</span></a>`}).join('')}</div></div></details>`;
  main.innerHTML=`<article class="interpretation" id="interpretation-start" data-reading-edition="${compact?'final-core':'full'}">
    <header class="chapter-header"><div class="breadcrumb"><a href="#/interpretations">期末复习</a><span>/</span>${esc(deck.title)}</div>
    <h1>${esc(summary.title)}</h1><p class="interpretation-intro">${rich(summary.intro)}</p>
    <div class="chapter-toolbar"><ul class="chapter-facts" aria-label="章节信息"><li>${pageMap.size} 页${compact?'精选':''}</li><li>${sections.length} 节</li>${quizCount?`<li>${quizCount} 道自测</li>`:''}</ul>
    <div class="interpretation-actions"><a href="${originalHref}" class="summary-open-original">${icon('book')}${original}</a><button id="print-interpretation">${icon('print')}打印本章</button>
    ${deck.phase==='foundation'?`<a class="summary-open-original" href="${interpretationHref(id)}${compact?'/full':''}">${compact?'完整串讲':'核心回顾'} ${icon('chevron')}</a>`:''}</div></div>
    ${full&&deck.phase==='foundation'?'<div class="notice">这里保留原有完整串讲，期末可优先阅读核心回顾。</div>':''}
    ${guide}</header>
    <div class="interpretation-sections">${sections.map((s,i)=>renderSection(id,s,i,pages)).join('')}</div>
    <section class="interpretation-connections"><h2>连接新旧知识</h2>${summary.connections.map(p=>`<p>${rich(p)}</p>`).join('')}</section>
    <section class="interpretation-checklist" id="interpretation-checklist"><h2>考前自查</h2><p class="muted">原创练习，题量与正式考试无关。</p><ol>${summary.examChecklist.map(p=>`<li>${rich(p)}</li>`).join('')}</ol></section>
    <nav class="pager" aria-label="其他讲义总结">${index>0?`<a href="${interpretationHref(decks[index-1].id)}"><small>上一章</small>${esc(decks[index-1].title)}</a>`:'<span></span>'}${index<decks.length-1?`<a href="${interpretationHref(decks[index+1].id)}"><small>下一章</small>${esc(decks[index+1].title)}</a>`:'<a href="#/interpretations">返回复习目录</a>'}</nav></article>`;
  main.querySelector('#print-interpretation').onclick=()=>window.print();
  bindChapterNavigation(main,side);
}
export function interpretationBanner(id){return `<div class="interpretation-reader-entry"><a href="${interpretationHref(id)}">本讲期末复习总结 <span aria-hidden="true">→</span></a><p class="reader-history-update" hidden></p></div>`}
export async function markHistoricalPage(id,page,{main,isCurrent}){
 try{const summary=await getInterpretation(id);if(!isCurrent())return;const section=summary.sections.find(s=>s.pages.includes(page));if(section?.kind==='history'){const note=main.querySelector('.reader-history-update');if(note){note.hidden=false;note.textContent='教授说明：本页属于发展历史，无需重读或记忆。原页中的历史记忆建议不再适用。'}}}catch{/* Detailed reading still works if the summary is temporarily unavailable. */}
}
