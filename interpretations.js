const VERSION = '20261018-final';
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
export const finalScopeNotice = () => `<aside class="final-scope"><strong>Exam #2 · 12 月 3 日 17:00 · 60 分钟</strong><p>Syllabus 写明本次考试占课程总评 40%，以理论与代码分析为主，不要求写代码。<b>当前版本没有写明新旧内容的题量比例。</b></p><p>按教师口头补充，旧内容少量抽查：本站将旧章压缩为核心回顾，每章一道自测；这不是正式题量预测。目前新增的三份课件也不等于 final 的完整最终范围。</p><a href="#/interpretations/syllabus">查看范围依据与复习顺序 →</a></aside>`;
function pageRanges(pages){const sorted=[...pages].sort((a,b)=>a-b),parts=[];for(let i=0;i<sorted.length;i++){let start=sorted[i],end=start;while(sorted[i+1]===end+1)end=sorted[++i];parts.push(start===end?String(start):`${start}–${end}`)}return parts.join('、')}
export function studyGroups(decks) {
 return [
  {phase:'new',title:'01 · 新增重点',note:'先理解原理，再推代码结果。原页逐一对应，背景内容折叠。'},
  {phase:'foundation',title:'02 · Midterm 核心回顾',note:'13 章，每章少量关键规则 + 一道自测。能解释就继续，不必重读所有旧页。'},
  {phase:'admin',title:'03 · 考试安排',note:'区分 syllabus 已确认信息、教师口头补充与本站复习建议。'}
 ].map(group=>({...group,decks:decks.filter(d=>d.phase===group.phase)}));
}
export function interpretationIndex(decks){
 return `<div class="breadcrumb"><a href="#/">课程目录</a><span>/</span>期末复习</div><span class="eyebrow">FINAL STUDY EDITION</span><h1>新增重点，旧章抓核心</h1><p class="interpretation-intro">Responsive Web Design → React → Node：从页面布局，到状态与组件，再到服务器请求处理。先走完这条主线，再回顾旧章。</p>${finalScopeNotice()}${studyGroups(decks).map(group=>`<section class="study-group"><div class="section-top"><div><h2>${group.title}</h2><p>${group.note}</p></div></div><div class="interpretation-index ${group.phase==='new'?'new-lectures':''}">${group.decks.map(d=>`<a href="${interpretationHref(d.id)}"><span class="course-index">${d.phase==='new'?'NEW':d.phase==='foundation'?'CORE':'INFO'}</span><div><h2>${esc(d.title)}</h2><p>${esc(d.description)}</p><small>${d.phase==='new'?`全部 ${d.count} 页对照 · 例子与自测`:d.phase==='foundation'?'核心摘要 · 1 道自测 · 原页按需展开':'来源与范围说明'}</small></div><span class="interpretation-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>`).join('')}${historyNotice()}`;
}
function renderTable(table) {
 if(!table) return '';
 return `<div class="study-table-wrap" tabindex="0" role="region" aria-label="知识点对照表"><table class="study-table"><thead><tr>${table.headers.map(h=>`<th scope="col">${rich(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${row.map(cell=>`<td>${rich(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export async function showInterpretation(id,{decks,main,side,loadDeck,navBase,isCurrent,full=false}){
 const deck=decks.find(d=>d.id===id);if(!deck)throw new Error('没有找到这份讲义。');
 const compact=deck.phase!=='new'&&!full;
 const [summary,pages]=await Promise.all([getSummary(compact?'final-core':'interpretations',id),loadDeck(id)]);if(!isCurrent())return;
 const label=compact?'旧章核心回顾':full&&deck.phase!=='new'?'原有完整串讲 · 参考':'新增重点串讲';
 document.title=`${deck.title} · Final 复习 · CSCI 571`;
 side.innerHTML=navBase('interpretations')+`<label class="side-heading" for="interpretation-select">切换复习章节</label><select class="course-select" id="interpretation-select">${decks.map(d=>`<option value="${d.id}" ${d.id===id?'selected':''}>${d.phase==='new'?'新增 · ':d.phase==='foundation'?'核心 · ':''}${esc(d.title)}</option>`).join('')}</select><nav class="interpretation-toc" aria-label="总结章节"><button data-scroll="interpretation-start">本讲主线与复习目标</button>${summary.sections.map((s,i)=>`<button data-scroll="interpretation-section-${i}" class="${s.kind!=='concept'?'history-toc':''}"><small>${String(i+1).padStart(2,'0')}${s.kind!=='concept'?' · 按需':''}</small>${esc(s.title)}</button>`).join('')}<button data-scroll="interpretation-checklist">考前自查</button></nav><a href="#/deck/${id}/${deck.corePages?.[0]||1}" class="side-back">按需查看原页讲解 ›</a>`;
 side.scrollTop=0;
 side.querySelector('#interpretation-select').onchange=e=>location.hash=interpretationHref(e.target.value);
 const pageMap=new Map();summary.sections.forEach((s,i)=>s.pages.forEach(page=>pageMap.set(page,{s,i})));
 const refs=section=>`<details class="interpretation-refs"><summary>对应课件：PDF ${pageRanges(section.pages)}（${section.pages.length} 页）</summary><div class="interpretation-page-links">${section.pages.map(n=>`<a href="#/deck/${id}/${n}" title="${esc(pages[n-1].title)}"><span>P${n}</span>${esc(pages[n-1].title)}</a>`).join('')}</div></details>`;
 const body=section=>`${section.paragraphs.map(p=>`<p>${rich(p)}</p>`).join('')}${renderTable(section.table)}${section.example?`<div class="code-box"><div class="code-toolbar"><span>${esc(section.example.lang).toUpperCase()} · 推一遍结果</span></div><pre><code>${esc(section.example.code)}</code></pre></div><p class="example-note"><strong>结果与原因：</strong>${rich(section.example.explanation)}</p>`:''}<ul class="interpretation-points">${section.takeaways.map(p=>`<li>${rich(p)}</li>`).join('')}</ul>${section.question?`<section class="quiz-block"><span class="block-label">停一下 · 自测</span><p>${rich(section.question.prompt)}</p><details><summary>查看答案与原因</summary><div class="answer">${rich(section.question.answer)}</div></details></section>`:''}${section.links?.length?`<div class="study-links">${section.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">官方补充 · ${esc(l.label)} ↗</a>`).join('')}</div>`:''}${refs(section)}`;
 const index=decks.findIndex(d=>d.id===id);
 const mappedPages=compact?pages.filter(p=>pageMap.has(p.page)):pages;
 main.innerHTML=`<article class="interpretation" id="interpretation-start" data-reading-edition="${compact?'final-core':'full'}"><div class="breadcrumb"><a href="#/interpretations">期末复习</a><span>/</span>${esc(deck.title)}</div><span class="eyebrow">${id==='syllabus'?'FINAL · 考试安排':label}</span><h1>${esc(summary.title)}</h1><p class="interpretation-intro">${rich(summary.intro)}</p><div class="interpretation-actions"><a href="#/deck/${id}/${deck.corePages?.[0]||1}" class="summary-open-original">对照原始课件 ↗</a><button id="print-interpretation">打印本章</button>${deck.phase==='foundation'?`<a class="summary-open-original" href="${interpretationHref(id)}${compact?'/full':''}">${compact?'按需展开原有完整串讲':'返回期末核心回顾'} →</a>`:''}</div>${full&&deck.phase==='foundation'?'<div class="notice">这里保留的是原有完整串讲，供查漏补缺。期末优先复习核心回顾，不需要把旧内容全部重读。</div>':''}${!compact?historyNotice():''}<section class="interpretation-goals"><span class="block-label">复习目标</span><ul>${summary.goals.map(g=>`<li>${rich(g)}</li>`).join('')}</ul></section><details class="interpretation-coverage"><summary>${compact?'核心页对照':'全页覆盖对照'} · ${pageMap.size}${compact?' 页':` / ${deck.count} 页`}</summary><p>${compact?'只列支撑核心回顾的课件页；其余细节按需查看，不作为本版的通读任务。':'每页均归入对应章节；历史与背景部分可按需展开。'}</p><div class="coverage-grid">${mappedPages.map(p=>{const match=pageMap.get(p.page);return `<a href="#/deck/${id}/${p.page}" class="${match?.s.kind!=='concept'?'coverage-history':''}" title="${esc(p.title)} → ${esc(match?.s.title)}">P${p.page}<span>${esc(kinds[match?.s.kind]||'')}</span></a>`}).join('')}</div></details><div class="interpretation-sections">${summary.sections.map((s,i)=>s.kind!=='concept'?`<details class="interpretation-history" id="interpretation-section-${i}"><summary><span class="interpretation-kind">${String(i+1).padStart(2,'0')} · ${kinds[s.kind]}</span><strong>${esc(s.title)}</strong><small>PDF ${pageRanges(s.pages)}</small></summary><div class="interpretation-history-body">${body(s)}</div></details>`:`<section class="interpretation-section" id="interpretation-section-${i}"><span class="interpretation-kind concept">${String(i+1).padStart(2,'0')} · ${compact?'只保留核心':'重点理解'}</span><h2>${esc(s.title)}</h2>${body(s)}</section>`).join('')}</div><section class="interpretation-connections"><span class="block-label">连接新旧知识</span>${summary.connections.map(p=>`<p>${rich(p)}</p>`).join('')}</section><section class="interpretation-checklist" id="interpretation-checklist"><h2>考前自查</h2><p class="muted">这是原创练习，不是正式题量或命题预测。</p><ol>${summary.examChecklist.map(p=>`<li>${rich(p)}</li>`).join('')}</ol></section><nav class="pager" aria-label="其他讲义总结">${index>0?`<a href="${interpretationHref(decks[index-1].id)}"><small>上一章</small>${esc(decks[index-1].title)}</a>`:'<span></span>'}${index<decks.length-1?`<a href="${interpretationHref(decks[index+1].id)}"><small>下一章</small>${esc(decks[index+1].title)}</a>`:'<a href="#/interpretations">返回复习目录</a>'}</nav><footer>Final 复习版 · 页码按 PDF 阅读器页序<br>发展历史无需记忆；范围以教师最新通知为准。</footer></article>`;
 main.querySelector('#print-interpretation').onclick=()=>window.print();
 side.querySelectorAll('[data-scroll]').forEach(button=>button.onclick=()=>{const target=main.querySelector('#'+button.dataset.scroll);if(!target)return;if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start',behavior:'smooth'});side.classList.remove('open');document.querySelector('#menu').setAttribute('aria-expanded','false')});
}
export function interpretationBanner(id){return `<div class="interpretation-reader-entry"><a href="${interpretationHref(id)}">本讲期末复习总结 <span aria-hidden="true">→</span></a><p class="reader-history-update" hidden></p></div>`}
export async function markHistoricalPage(id,page,{main,isCurrent}){
 try{const summary=await getInterpretation(id);if(!isCurrent())return;const section=summary.sections.find(s=>s.pages.includes(page));if(section?.kind==='history'){const note=main.querySelector('.reader-history-update');if(note){note.hidden=false;note.textContent='教授说明：本页属于发展历史，无需重读或记忆。原页中的历史记忆建议不再适用。'}}}catch{/* Detailed reading still works if the summary is temporarily unavailable. */}
}
