// Each preview has its own document; site-wide CSS cannot change experiment results.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const baseCSS='html{font:15px/1.65 system-ui,sans-serif;color:#26334b;background:white}body{margin:16px}*{box-sizing:content-box}';
const policy=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">`;
const frameHTML=(css,body)=>`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">${policy}<style>${baseCSS}${css}</style></head><body>${body}</body></html>`;
const frameTag=(title,height=280)=>`<iframe data-frame title="${esc(title)}" sandbox="allow-same-origin" style="display:block;width:100%;height:${height}px;border:1px solid #d7dfeb;border-radius:6px;background:white"></iframe>`;
const resultTag='<div data-result class="lab-result" aria-live="polite" aria-atomic="true"></div>';
const codeTag='<pre data-code class="lab-code" tabindex="0" aria-label="实验当前代码"></pre>';
const ref=(deck,start,end,label)=>({deck,start,end,label});
const number=value=>Number(value).toFixed(1).replace(/\.0$/,'');
const docRoot=frame=>frame.contentDocument?.documentElement;
function lifecycle(root){
 const cleanups=[],frames=new Set();let disposed=false;
 const q=selector=>root.querySelector(selector);
 const on=(selector,event,handler)=>{const node=q(selector);node.addEventListener(event,handler);cleanups.push(()=>node.removeEventListener(event,handler));return node;};
 const later=fn=>{const id=requestAnimationFrame(()=>{frames.delete(id);if(!disposed)fn();});frames.add(id);};
 const observe=(node,fn)=>{if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(()=>later(fn));observer.observe(node);cleanups.push(()=>observer.disconnect());};
 return{q,on,later,observe,cleanup(){disposed=true;cleanups.forEach(fn=>fn());frames.forEach(cancelAnimationFrame);}};
}
function domTree(node,depth=0,lines=[]){
 if(lines.length>=220)return lines;
 const indent='  '.repeat(depth);
 if(node.nodeType===9)lines.push('#document');
 else if(node.nodeType===10)lines.push(`${indent}<!DOCTYPE ${node.name}>`);
 else if(node.nodeType===1){const attrs=Array.from(node.attributes,a=>` ${a.name}=${JSON.stringify(a.value)}`).join('');lines.push(`${indent}<${node.localName}${attrs}>`);}
 else if(node.nodeType===3&&node.nodeValue.trim())lines.push(`${indent}#text ${JSON.stringify(node.nodeValue)}`);
 else if(node.nodeType===8)lines.push(`${indent}<!-- ${node.nodeValue} -->`);
 else return lines;
 for(const child of node.childNodes)domTree(child,depth+1,lines);return lines;
}

const parserLab={
 id:'html-parser',category:'HTML',title:'源码为什么会变成另一棵 DOM 树？',minutes:8,
 summary:'编辑 HTML，对照浏览器修复后的结构、正文文本与字符引用。',
 goal:'区分源码、解析得到的节点和屏幕呈现；说明字符引用为什么不会再生成标签。',
 predict:'把 div 放在 p 内，再写一个结束 p，最终会有几个 p？&amp;lt; 会显示什么？',
 refs:[ref('html',17,20,'元素与浏览器容错'),ref('html',42,44,'编码与字符引用')],
 explanation:[
 '浏览器先按 HTML 解析规则建立树，再进行布局。遇到不能继续包含块元素的 p，解析器会结束前面的 p；后面的孤立结束标签也可能引起恢复行为。因此“源代码看起来嵌套”不保证 DOM 真正按这个顺序嵌套。树中 html、head、body 也可能是解析器补出来的。',
 '字符引用属于当前解析过程的一部分。正文中的 &lt;strong&gt; 产生文字 <strong>，不会把这段文字再次解释为 strong 元素；&amp;lt; 则只解码一层。右侧 textContent 是 DOM 正文文本，不等于 innerHTML，也不保证只包含可见文字。',
 '拓展：实验用 DOMParser 的 text/html 模式观察实际解析结果，预览使用独立文档。它不是 HTML 合法性验证器，也不运行脚本；能出现预览不代表源码符合内容模型。'],
 challenges:[
 {prompt:'在“段落被自动关闭”预设中，为什么有两个 p？',answer:'div 开始标签先结束第一个 p；遇到末尾孤立的 </p> 时，HTML 解析器按恢复规则插入再关闭一个空 p。中间文字因此并不属于你原以为的同一个段落。'},
 {prompt:'怎样让页面显示字面文字 <p>，而不创建 p 元素？',answer:'在正文写 &lt;p&gt;。字符引用得到的尖括号进入文本节点，当前解析过程不会再把这些字符作为标签读取。'}],
 mount(root){
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-parser-preset">选择起点</label><select id="markup-parser-preset"><option value="repair">段落被自动关闭</option><option value="head">head 中误放正文</option><option value="entities">字符引用只解码一层</option><option value="void">空元素与普通元素</option></select><label for="markup-parser-source">可编辑 HTML 源码（最多 16,000 字符）</label><textarea id="markup-parser-source" rows="9" maxlength="16000" spellcheck="false"></textarea><div class="lab-actions"><button type="button" data-reset>恢复当前预设</button></div><p class="lab-note">输入后自动解析。树中省略纯空白文本节点，最多显示 220 行。</p>${resultTag}</div><div class="experiment-preview"><p class="lab-note">浏览器实际预览</p>${frameTag('HTML 解析结果预览',190)}<p class="lab-note">DOM 树（实际解析结果）</p>${codeTag}</div></div>`;
 const life=lifecycle(root),{q,on}=life;
 const presets={repair:'<p>段落 A<div>块 B</div>尾部 C</p>',head:'<head>本来想藏在 head 的文字<oddtag>未知元素里的文字</oddtag></head>',entities:'<p>&lt;strong&gt;不是粗体&lt;/strong&gt;</p>\n<p>&amp;lt; 与 &#60; 与 &#x3C;</p>\n<p>中文 😀</p>',void:'<p>A<br>B</p>\n<hr>\n<div/>这段文字仍然属于 div<p>新段落</p>'};
 const update=()=>{
 const doc=new DOMParser().parseFromString(q('textarea').value,'text/html'),tree=domTree(doc),text=doc.body.textContent;
 q('[data-code]').textContent=tree.join('\n')+(tree.length>=220?'\n… 已达显示上限':'');
 q('[data-result]').textContent=`body.textContent = ${JSON.stringify(text)}\np 元素数：${doc.body.getElementsByTagName('p').length}\n文本 Unicode 码点数：${[...text].length}\n文本 UTF-8 字节数：${new TextEncoder().encode(text).length}\n（最后两项不包含 HTML 标签，也不是整个文件的字节数。）`;
 const meta=doc.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content="default-src 'none'; style-src 'unsafe-inline'; img-src data:";doc.head.prepend(meta);
 q('[data-frame]').srcdoc=(doc.doctype?`<!doctype ${doc.doctype.name}>`:'')+doc.documentElement.outerHTML;
 };
 const reset=()=>{q('textarea').value=presets[q('select').value];update();};
 on('select','change',reset);on('textarea','input',update);on('[data-reset]','click',reset);reset();return life.cleanup;
 }
};

const tableLab={
 id:'html-table',category:'HTML',title:'把 rowspan / colspan 放进网格',minutes:6,
 summary:'在固定的 4 × 4 逻辑网格里合并左上角，再核对真实单元格数量。',goal:'按占用位置推导表格，而不是只数每行有几个 td。',
 predict:'把 A 设为 rowspan=2、colspan=3，4 × 4 网格里还剩几个真实单元格？',refs:[ref('html',35,41,'表格、跨格与对齐')],
 explanation:[
 'rowspan 和 colspan 都包含起始位置自身。A 占据两行三列时，共覆盖六个逻辑位置，却仍然只是一个元素。后续行必须跳过已经被 A 占据的位置，再从空位开始填入自己的单元格。',
 '本实验主动生成没有重叠的完整 4 × 4 表格，让你集中观察跨格。改变纵向对齐只移动格内文字，不改变格子的跨度；DOM 自动出现 tbody 也不会额外增加数据行。缺格或重叠的任意源码，需要另行分析表格布局。'],
 challenges:[{prompt:'rowspan=2、colspan=3 时，有多少个单元格元素？',answer:'11 个。A 用一个元素占六格，其余十个位置各用一个单元格：1 + (16 − 6) = 11。下方结果还会读取浏览器 DOM 的实际数量核对。'},{prompt:'将 vertical-align 从 top 改成 bottom，逻辑行数会改变吗？',answer:'不会。它只调整文字在单元格内部的垂直位置，四个 tr 与 rowspan/colspan 保持原样。'}],
 mount(root){
 const options=[1,2,3,4].map(n=>`<option${n===2?' selected':''}>${n}</option>`).join('');
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-rowspan">A 跨越的总行数</label><select id="markup-rowspan">${options}</select><label for="markup-colspan">A 跨越的总列数</label><select id="markup-colspan">${options}</select><label for="markup-valign">A 内文字的纵向对齐</label><select id="markup-valign"><option>middle</option><option>top</option><option>bottom</option></select>${codeTag}</div><div class="experiment-preview">${frameTag('合并单元格真实表格',330)}${resultTag}</div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');let grid=[];
 const measure=()=>{const table=docRoot(frame)?.querySelector('table');if(!table)return;const cells=Array.from(table.rows).flatMap(row=>Array.from(row.cells)),a=cells[0],rect=a.getBoundingClientRect();q('[data-result]').textContent=`实际 DOM：${table.rows.length} 个 tr，${cells.length} 个 th/td\nA 的 DOM 属性：rowSpan=${a.rowSpan}，colSpan=${a.colSpan}\nA 的实际边框盒：${number(rect.width)} × ${number(rect.height)} CSS px\n\n按源码推导的逻辑占位（A 重复表示同一元素）：\n${grid.map(row=>row.map(x=>x.padEnd(4)).join(' ')).join('\n')}`;};
 const update=()=>{
 const rs=Number(q('#markup-rowspan').value),cs=Number(q('#markup-colspan').value);grid=Array.from({length:4},()=>Array(4).fill(''));const rows=[];
 for(let r=0;r<4;r++){const cells=[];for(let c=0;c<4;c++){if(r<rs&&c<cs){grid[r][c]='A';if(r===0&&c===0)cells.push(`<th rowspan="${rs}" colspan="${cs}">A</th>`);}else{const name=`${r+1},${c+1}`;grid[r][c]=name;cells.push(`<td>${name}</td>`);}}rows.push(`  <tr>${cells.join('')}</tr>`);}
 const source=`<table>\n  <caption>4 × 4 逻辑网格</caption>\n${rows.join('\n')}\n</table>`;q('[data-code]').textContent=`th { vertical-align: ${q('#markup-valign').value}; }\n${source}`;q('[data-result]').textContent='浏览器正在布局表格…';
 frame.srcdoc=frameHTML(`table{border-collapse:collapse;width:100%;table-layout:fixed}tr{height:54px}td,th{border:2px solid #8a9bb7;text-align:center;padding:0}th{background:#e1eaf9;color:#25477f;vertical-align:${q('#markup-valign').value}}caption{padding-bottom:12px}`,source);
 };
 on('[data-frame]','load',measure);['#markup-rowspan','#markup-colspan','#markup-valign'].forEach(s=>on(s,'change',update));life.observe(frame,measure);update();return life.cleanup;
 }
};

const selectorsLab={
 id:'css-selectors',category:'CSS',title:'选择器到底选中了谁？',minutes:7,
 summary:'输入真实 CSS 选择器，直接查看匹配节点和高亮结果。',goal:'区分同一元素的组合条件、后代、直接子代以及 class/id。',
 predict:'p.note、p .note、#garden > p 的匹配数相同吗？先在树中手动圈出来。',refs:[ref('css',18,25,'选择器、嵌套与继承范围')],
 explanation:[
 'p.note 要求一个元素同时是 p 并具有 note 类；p .note 要求 note 元素位于某个 p 内部，可以隔着更多层祖先。空格连接的是两个位置，不能当作排版空白随意添加。拓展的 > 组合器进一步要求直接父子关系。',
 '高亮只表示当前选择器直接匹配的元素。某个子元素最终呈现与父元素相同的颜色，可能来自继承，不代表它也匹配了给父元素写的选择器。输入非法语法时，下方显示浏览器实际抛出的错误；伪元素也不是 querySelectorAll 能返回的 DOM 元素。'],
 challenges:[{prompt:'p.note 与 p .note 在这个样本中分别匹配几项？',answer:'前者匹配 A、B、E 三个段落；后者只匹配 C 段落内部标为 D 的 span。空格把“同一元素”变成了“祖先与后代”。'},{prompt:'#garden p 与 #garden > p 的区别是什么？',answer:'前者包含 A、B、C、E 四个段落；后者只有直接属于 garden 的 A、E，跳过 group 容器内的 B、C。'}],
 mount(root){
 const sample=`<section id="garden">\n  <p class="note">A <span class="tag">内层 tag</span></p>\n  <div class="group">\n    <p class="note featured">B</p>\n    <p>C <span class="note">D</span></p>\n  </div>\n  <p id="last" class="note">E</p>\n</section>`;
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-selector-preset">比较常见选择器</label><select id="markup-selector-preset">${['p.note','p .note','#garden p','#garden > p','.note','#last','.group > p','.featured'].map(x=>`<option>${esc(x)}</option>`).join('')}</select><label for="markup-selector-input">可输入 CSS 选择器</label><input id="markup-selector-input" value="p.note" spellcheck="false" maxlength="300">${codeTag}${resultTag}</div><div class="experiment-preview">${frameTag('CSS 选择器匹配与高亮',380)}<p class="lab-note">蓝色背景和粗轮廓表示直接匹配；结果列表列出真实节点。查询范围是这段样本，不包括实验控件。</p></div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');let marked=[];q('[data-code]').textContent=sample;
 const update=()=>{const scope=docRoot(frame)?.querySelector('main');if(!scope)return;marked.forEach(el=>el.removeAttribute('style'));marked=[];const output=q('[data-result]');try{marked=Array.from(scope.querySelectorAll(q('#markup-selector-input').value));const names=marked.map(el=>`${el.localName}${el.id?'#'+el.id:''}${Array.from(el.classList,c=>'.'+c).join('')} → ${el.textContent.trim().replace(/\s+/g,' ')}`);marked.forEach(el=>{el.style.outline='3px solid #3155a6';el.style.outlineOffset='2px';el.style.backgroundColor='#dce9ff';});output.className='lab-result';output.textContent=`实际匹配 ${marked.length} 个元素\n${names.length?names.join('\n'):'没有元素满足这个选择器。'}`;}catch(error){output.className='lab-result error';output.textContent=`选择器无法解析\n${error.name}: ${error.message}`;}};
 on('[data-frame]','load',update);on('#markup-selector-input','input',update);on('#markup-selector-preset','change',()=>{q('#markup-selector-input').value=q('#markup-selector-preset').value;update();});
 frame.srcdoc=frameHTML('section{padding:12px;border:1px solid #bdc8d9}p{padding:8px;margin:10px 0}span{padding:2px}.group{border:1px dashed #9aabc2;padding:6px 14px}',`<main>${sample}</main>`);return life.cleanup;
 }
};

const cascadeLab={
 id:'css-cascade',category:'CSS',title:'让浏览器裁决样式竞争',minutes:10,
 summary:'切换选择器、顺序、!important 与行内声明，读取真正的 computedStyle。',goal:'按属性分析层叠，区分直接声明、继承和自定义属性的传递。',
 predict:'先写 #target 红色，再写 .note 蓝色，谁赢？给蓝色加 !important 后呢？',refs:[ref('css',26,31,'层叠、权重、继承与变量')],
 explanation:[
 '本实验把竞争限定在同一来源、没有 @layer 的作者样式中。先判断重要性；普通规则之间再比较选择器权重，仍相同才比较源顺序。内部 style 和外部 CSS 并没有固定的先天高低。这里使用真实浏览器计算颜色，不用简化的权重打分器代替浏览器。',
 '父元素的绿色声明即使带 !important，也不会以同样的“竞争权重”传给子元素。只要子元素得到自己的有效 color 声明，就先使用自己的声明；没有自己的 color 时才沿祖先链继承。border-width 默认不继承，可与颜色一起观察。',
 '把规则 A 的值改为 var(--accent) 后，可观察变量沿父子关系继承并在目标元素上取值。拓展：实际层叠还包含来源、层、动画和过渡等因素，本实验没有把这些因素伪装成已经覆盖的规则。'],
 challenges:[
 {prompt:'保持 A 为 #target、B 为 .note，两条都是普通规则，反转顺序会改变颜色吗？',answer:'不会。A 的 id 权重高于 B 的类权重，源顺序还没有机会决定结果。把两条都改为 .note 后，后写规则才获胜。'},
 {prompt:'禁用 A、B 和行内颜色后，目标与 span 为什么变绿？',answer:'目标 p 没有自己的 color 声明，于是从绿色父容器继承；内部 span 再从 p 继承。父容器的边框宽度不会按同样方式传下去。'},
 {prompt:'普通行内 purple 和 B 的 royalblue !important 谁赢？',answer:'作者样式中的 !important 蓝色赢过普通行内颜色。若行内本身也使用 !important，本实验条件下则是行内紫色获胜。'}],
 mount(root){
 const selectors=['#target','.note','p.note','p','禁用'],options=selected=>selectors.map(s=>`<option${s===selected?' selected':''}>${s}</option>`).join('');
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-rule-a">规则 A 的选择器</label><select id="markup-rule-a">${options('#target')}</select><label for="markup-a-important">规则 A 的重要性</label><select id="markup-a-important"><option value="">普通</option><option value=" !important">!important</option></select><label for="markup-a-value">规则 A 的颜色值</label><select id="markup-a-value"><option>crimson</option><option>var(--accent)</option></select><label for="markup-rule-b">规则 B 的选择器（颜色 royalblue）</label><select id="markup-rule-b">${options('.note')}</select><label for="markup-b-important">规则 B 的重要性</label><select id="markup-b-important"><option value="">普通</option><option value=" !important">!important</option></select><label for="markup-rule-order">源顺序</label><select id="markup-rule-order"><option value="ab">先 A，后 B</option><option value="ba">先 B，后 A</option></select><label for="markup-inline">目标元素的行内 color</label><select id="markup-inline"><option value="">无</option><option value="purple">purple</option><option value="purple !important">purple !important</option></select><label for="markup-variable">父元素定义的 --accent</label><select id="markup-variable"><option>darkorange</option><option>teal</option><option>crimson</option></select><label for="markup-local-variable">目标元素是否覆盖 --accent</label><select id="markup-local-variable"><option value="">继续继承</option><option value="goldenrod">局部改为 goldenrod</option></select></div><div class="experiment-preview">${frameTag('CSS 层叠真实计算结果',210)}${resultTag}${codeTag}</div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');
 const update=()=>{
 const scope=docRoot(frame);if(!scope?.querySelector('#target'))return;
 const a=q('#markup-rule-a').value,b=q('#markup-rule-b').value;
 const rules=[a==='禁用'?'/* A 已禁用 */':`${a} { color: ${q('#markup-a-value').value}${q('#markup-a-important').value}; }`,b==='禁用'?'/* B 已禁用 */':`${b} { color: royalblue${q('#markup-b-important').value}; }`];
 if(q('#markup-rule-order').value==='ba')rules.reverse();
 const parentRule=`#parent { color: seagreen !important; border: 3px solid seagreen; --accent: ${q('#markup-variable').value}; }`;
 scope.querySelector('#experiment-rules').textContent=`${parentRule}\n${rules.join('\n')}`;
 const target=scope.querySelector('#target'),inline=q('#markup-inline').value,local=q('#markup-local-variable').value;
 target.style.cssText=`${inline?`color:${inline};`:''}${local?`--accent:${local};`:''}`;
 const style=frame.contentWindow.getComputedStyle(target),child=frame.contentWindow.getComputedStyle(scope.querySelector('#child'));
 q('[data-result]').textContent=`getComputedStyle(target).color → ${style.color}\n内部 span 的 color → ${child.color}\n父容器 border-top-width → ${frame.contentWindow.getComputedStyle(scope.querySelector('#parent')).borderTopWidth}\n目标 border-top-width → ${style.borderTopWidth}\n目标 --accent → ${style.getPropertyValue('--accent').trim()}\n结果由浏览器实际计算；RGB 格式与颜色名称可能不同。`;
 q('[data-code]').textContent=`${parentRule}\n${rules.join('\n')}\n\n<div id="parent">\n  <p id="target" class="note"${target.getAttribute('style')?` style="${target.getAttribute('style')}"`:''}>\n    目标 p <span id="child">继承颜色的 span</span>\n  </p>\n</div>`;
 };
 on('[data-frame]','load',update);
 ['#markup-rule-a','#markup-rule-b','#markup-a-important','#markup-b-important','#markup-a-value','#markup-rule-order','#markup-inline','#markup-variable','#markup-local-variable'].forEach(s=>on(s,'change',update));
 frame.srcdoc=frameHTML('#parent{padding:14px}#target{font-size:20px;margin:12px 0}#child{display:block;font-size:15px}','<style id="experiment-rules"></style><div id="parent">父容器<p id="target" class="note">目标 p<span id="child">继承颜色的 span</span></p></div>');return life.cleanup;
 }
};

const boxLab={
 id:'css-box',category:'CSS',title:'200px 到底量到哪一条边？',minutes:6,
 summary:'固定 width:200px，改变 padding、border 与 box-sizing，实测浏览器生成的盒子。',goal:'计算并核对内容宽、内边距、边框盒宽，说明 margin 为什么另算。',
 predict:'width=200、padding=20、border=4 时，content-box 与 border-box 各有多宽？',refs:[ref('css',39,42,'盒模型与实际输出')],
 explanation:[
 'content-box 下 width 指定内容区，左右 padding 与 border 继续向外扩展。border-box 下，同一个 width 已包含内边距与边框，内容区会缩小。margin 始终位于边框盒外，本实验的棕色外部空间用来观察它。',
 '预览中的蓝色区域表示 padding，深色表示 border，白色表示内容区。输出用 getBoundingClientRect、clientWidth、offsetWidth 和 computedStyle 读取结果，再与公式核对。拓展：这些量在变换、滚动条或小数像素下可能有差异；本实验不施加 transform。',
 '水平外边距不会套用纵向 margin 折叠规则。本实验只测宽度；课件相邻块的纵向折叠问题需要按正常流、父子边界等条件分别分析。'],
 challenges:[{prompt:'padding=20、border=4 时，两种模式的实际边框盒宽分别是多少？',answer:'content-box 为 200 + 40 + 8 = 248px；border-box 为 200px，内容区是 152px。margin 不参与这两个边框盒宽度。'},{prompt:'把每侧 margin 从 12 改为 24，getBoundingClientRect().width 会增加吗？',answer:'不会。它测的是边框盒，margin 在外部；周围的占位和位置会改变。'}],
 mount(root){
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-box-mode">box-sizing</label><select id="markup-box-mode"><option>content-box</option><option>border-box</option></select><label for="markup-box-padding">每侧 padding：<span data-padding>20</span>px</label><input id="markup-box-padding" type="range" min="0" max="50" value="20"><label for="markup-box-border">每侧 border：<span data-border>4</span>px</label><input id="markup-box-border" type="range" min="0" max="15" value="4"><label for="markup-box-margin">每侧 margin：<span data-margin>12</span>px</label><input id="markup-box-margin" type="range" min="0" max="30" value="12">${codeTag}</div><div class="experiment-preview">${frameTag('CSS 盒模型实际尺寸',250)}${resultTag}</div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');
 const update=()=>{
 const scope=docRoot(frame),box=scope?.querySelector('#box');if(!box)return;
 const p=Number(q('#markup-box-padding').value),b=Number(q('#markup-box-border').value),m=Number(q('#markup-box-margin').value),mode=q('#markup-box-mode').value;
 q('[data-padding]').textContent=p;q('[data-border]').textContent=b;q('[data-margin]').textContent=m;
 box.style.cssText=`width:200px;padding:${p}px;border:${b}px solid #516987;margin:${m}px;box-sizing:${mode}`;
 const rect=box.getBoundingClientRect(),style=frame.contentWindow.getComputedStyle(box),horizontal=Number.parseFloat(style.paddingLeft)+Number.parseFloat(style.paddingRight)+Number.parseFloat(style.borderLeftWidth)+Number.parseFloat(style.borderRightWidth);
 q('[data-code]').textContent=`.box {\n  width: 200px;\n  box-sizing: ${mode};\n  padding: ${p}px;\n  border: ${b}px solid #516987;\n  margin: ${m}px;\n}`;
 q('[data-result]').textContent=`实际边框盒宽：${number(rect.width)}px\n实际内容区宽：${number(rect.width-horizontal)}px\nclientWidth（内容 + padding）：${box.clientWidth}px\noffsetWidth（取整边框盒）：${box.offsetWidth}px\ncomputed width：${style.width}\n水平 margin 总和：${m*2}px（不在上述边框盒内）\n\n核对：${mode==='content-box'?`200 + 2×${p} + 2×${b} = ${200+2*p+2*b}`:`200 − 2×${p} − 2×${b} = ${200-2*p-2*b}（内容区）`}`;
 };
 on('[data-frame]','load',update);on('#markup-box-mode','change',update);['padding','border','margin'].forEach(name=>on(`#markup-box-${name}`,'input',update));
 frame.srcdoc=frameHTML('body{background:#f5e6bb;margin:12px;display:flow-root}#box{background:#dce8fa}#content{min-height:60px;background:white;overflow-wrap:anywhere;color:#315077}p{font-size:12px;margin:0}','<p>浅棕：外部空间 · 蓝色：padding · 深色：border</p><div id="box"><div id="content">内容区<br>content</div></div>');return life.cleanup;
 }
};

const layoutLab={
 id:'css-layout',category:'CSS',title:'移动盒子，正常流会留下什么？',minutes:9,
 summary:'对照 static、relative、absolute 与 float，并实测盒子和后续内容的位置。',goal:'说明保留占位、脱离正常流、定位包含块与文字绕流的区别。',
 predict:'目标 A 向右移动后，后面的文字会补到它原来的位置吗？哪一种模式会绕开它？',refs:[ref('css',53,56,'float 与绝对定位'),ref('dom',16,18,'left/top 与累计移动')],
 explanation:[
 'static 留在正常流，left/top 不产生定位偏移。relative 在正常布局完成后移动呈现位置，原有空间仍保留，后续内容不会自动补位。absolute 则脱离正常流，后续内容像它没有正常占位一样布局，而且通常不会绕开它。',
 '本例让外层 canvas 始终 relative；内层 stage 可以切换。绝对定位元素使用最近的定位包含块，所以改变 stage 的 position 会改变偏移参考。这里的简化条件没有 transform 等其他能建立包含块的属性。float:left 另有浮动布局规则，会缩短旁边文字行可用的宽度。',
 '拓展：stage 使用 display:flow-root 容纳浮动。这不是 float 自动撑高任何父元素的证明。“+50px”先对数值状态累加，再补 px 写入 CSS；改变位置并不会重排 DOM 子节点。'],
 challenges:[
 {prompt:'在 relative 模式下增加 top，后续块 B 的纵坐标会跟着增加吗？',answer:'不会仅因相对偏移而增加。A 原来的正常流位置仍被保留，它只是视觉上移动；观察 B 的实测纵坐标即可核对。'},
 {prompt:'为何 absolute 和 float 都不像普通块占位，但文字行为不同？',answer:'absolute 通常不为文字留绕流区域，可能覆盖文字；float 会影响附近行盒，使文字绕到浮动盒侧边，再在其下方恢复宽度。'},
 {prompt:'left 初值 20px，累计点击三次 +50px，最终是多少？',answer:'170px。代码维护数值 20，再执行三次加 50，最后拼接 px；不能直接把字符串 "20px" 与 50 相加。'}],
 mount(root){
 root.innerHTML=`<div class="experiment-grid"><div class="experiment-controls"><label for="markup-layout-mode">目标 A 的布局模式</label><select id="markup-layout-mode"><option>static</option><option selected>relative</option><option>absolute</option><option value="float">float:left</option></select><label for="markup-layout-parent">内层 stage 的 position</label><select id="markup-layout-parent"><option>relative</option><option>static</option></select><label for="markup-layout-left">left：<span data-left>20</span>px</label><input id="markup-layout-left" type="range" min="0" max="300" value="20"><label for="markup-layout-top">top：<span data-top>12</span>px</label><input id="markup-layout-top" type="range" min="0" max="100" value="12"><div class="lab-actions"><button type="button" data-move>left 累计 +50px</button><button type="button" data-reset>偏移归零</button></div>${codeTag}</div><div class="experiment-preview">${frameTag('正常流与定位布局比较',390)}${resultTag}</div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');
 const update=()=>{
 const scope=docRoot(frame),target=scope?.querySelector('#move');if(!target)return;
 const mode=q('#markup-layout-mode').value,left=Number(q('#markup-layout-left').value),top=Number(q('#markup-layout-top').value),parent=q('#markup-layout-parent').value;
 q('[data-left]').textContent=left;q('[data-top]').textContent=top;q('[data-move]').disabled=left>250;
 const stage=scope.querySelector('#stage');stage.style.position=parent;
 target.style.cssText=`position:${mode==='float'?'static':mode};float:${mode==='float'?'left':'none'};left:${left}px;top:${top}px`;
 const a=target.getBoundingClientRect(),s=stage.getBoundingClientRect(),after=scope.querySelector('#after').getBoundingClientRect(),style=frame.contentWindow.getComputedStyle(target);
 const prose=scope.querySelector('#prose'),range=frame.contentDocument.createRange();range.setStart(prose.firstChild,0);range.setEnd(prose.firstChild,5);const textRect=range.getBoundingClientRect();
 q('[data-result]').textContent=`实际 position=${style.position}，float=${style.cssFloat}\n相对 stage 外边框左上角：\nA 左/上：${number(a.left-s.left)} / ${number(a.top-s.top)}px\n正文首字 左/上：${number(textRect.left-s.left)} / ${number(textRect.top-s.top)}px\n后续块 B 顶部：${number(after.top-s.top)}px\n\n${mode==='absolute'?`定位参考：${parent==='relative'?'内层 stage':'外层 canvas'} 的 padding box。`:(mode==='float'?'当前为静态浮动，left/top 不产生定位位移。':mode==='static'?'static 下 left/top 不移动盒子。':'relative 保留原位置的正常流占位。')}\n坐标含边框/内边距等基准差异，不能把实测坐标直接等同 left/top。`;
 q('[data-code]').textContent=`#canvas { position: relative; padding: 18px; }\n#stage { position: ${parent}; display: flow-root; padding: 12px; }\n#move {\n  position: ${mode==='float'?'static':mode};\n  float: ${mode==='float'?'left':'none'};\n  left: ${left}px; top: ${top}px;\n  width: 86px; height: 72px;\n  margin: 0 12px 8px 0;\n}\n/* 累计按钮的核心逻辑（JavaScript）：\n   x += 50; element.style.left = x + "px"; */`;
 };
 on('[data-frame]','load',update);['#markup-layout-mode','#markup-layout-parent'].forEach(s=>on(s,'change',update));['#markup-layout-left','#markup-layout-top'].forEach(s=>on(s,'input',update));
 on('[data-move]','click',()=>{q('#markup-layout-left').value=Number(q('#markup-layout-left').value)+50;update();});on('[data-reset]','click',()=>{q('#markup-layout-left').value=0;q('#markup-layout-top').value=0;update();});life.observe(frame,update);
 frame.srcdoc=frameHTML('body{margin:8px}#canvas{position:relative;padding:18px;border:1px solid #b7c4d8;background:#f4f7fb}#stage{padding:12px;border:2px dashed #a7b8d1;background:white;display:flow-root}#before{height:32px;color:#65758d}#move{width:86px;height:72px;margin:0 12px 8px 0;background:#dce9ff;border:2px solid #3155a6;text-align:center}#prose{margin:0;font-size:14px;line-height:1.7}#after{background:#e7f1e9;border-top:2px solid #69957b;margin-top:8px;padding:8px;font-size:13px}','<div id="canvas"><div id="stage"><div id="before">前方正常块</div><div id="move">目标 A</div><p id="prose">观察这段正文如何排版。相对定位保留原来的位置；绝对定位可能覆盖文字；左浮动则让附近文字从它的右侧开始。当文字低于浮动盒之后，行宽恢复。缩窄预览区域，换行位置也会改变。</p><div id="after">后续块 B</div></div></div>');return life.cleanup;
 }
};

const responsiveLab={
 id:'css-responsive',category:'CSS',title:'媒体查询看的是哪个宽度？',minutes:6,
 summary:'真正改变 iframe 视口，在 599 / 600 / 601px 处检查媒体查询的边界。',goal:'用实际 viewport 与 matchMedia 核对 min-width 的包含边界，以及布局声明如何生效。',
 predict:'min-width:600px 在恰好 600px 时成立吗？外层网页很窄时，实验视口还可以是 800px 吗？',refs:[ref('css',34,35,'媒体类型与宽度条件')],
 explanation:[
 '这里调节的是内嵌文档的实际布局视口，不是画一张缩小截图。媒体查询针对这个文档的视口计算，所以外层网站和实验可以同时处在不同宽度。min-width 包含边界，600px 时规则已经适用。CSS px 也不是设备屏幕物理像素的计数。',
 '媒体条件只决定声明是否参与层叠。示例还要明确把布局改为三列，不能指望一个媒体查询自动修复固定宽度。拓展：示例用 Grid 展示效果，Grid 的具体算法不是这两页媒体查询的全部内容。',
 '当前实验观察屏幕宽度条件；没有把 screen 的结果伪装成 print。较宽 iframe 可以在预览区域横向滚动，保留真实宽度，避免用 transform 缩放后误把可见尺寸当作视口。'],
 challenges:[{prompt:'分别点击 599、600、601，三列从哪一个宽度开始？',answer:'600px。min-width:600px 包含等号，实际 matchMedia 会在 600 和 601 返回 true。'},{prompt:'把父页面窗口缩窄，为什么设置为 800px 的实验仍保持三列？',answer:'实验 iframe 的 CSS 宽度保持 800px，内部有自己的视口。外层通过横向滚动容纳它；媒体条件仍按内层视口判断。'}],
 mount(root){
 const css=`.cards { display: grid; grid-template-columns: 1fr; gap: 12px; }\n@media (min-width: 600px) {\n  .cards { grid-template-columns: repeat(3, 1fr); }\n}`;
 root.innerHTML=`<div class="experiment-controls"><label for="markup-viewport">iframe 的宽度：<span data-width>599</span> CSS px</label><input id="markup-viewport" type="range" min="280" max="1000" step="1" value="599"><div class="lab-actions"><button type="button" data-width-599>599px</button><button type="button" data-width-600>600px</button><button type="button" data-width-601>601px</button><button type="button" data-width-800>800px</button></div></div><div class="experiment-grid"><div>${codeTag}${resultTag}</div><div class="experiment-preview" style="min-width:0"><p class="lab-note">真实视口预览；区域较窄时请横向滚动。</p><div tabindex="0" role="region" aria-label="可横向滚动的媒体查询预览" style="overflow:auto;max-width:100%;border:1px solid #d7dfeb;border-radius:6px">${frameTag('媒体查询的真实 iframe 视口',280)}</div></div></div>`;
 const life=lifecycle(root),{q,on}=life,frame=q('[data-frame]');frame.style.border='0';frame.style.maxWidth='none';frame.style.minWidth='0';q('[data-code]').textContent=css;
 const measure=()=>{const scope=docRoot(frame),cards=scope?.querySelector('.cards');if(!cards)return;const win=frame.contentWindow,query=win.matchMedia('(min-width: 600px)');q('[data-result]').textContent=`iframe window.innerWidth：${win.innerWidth} CSS px\n媒体条件 (min-width: 600px)：${query.matches}\n媒体类型 screen：${win.matchMedia('screen').matches}\n实际 grid-template-columns：\n${win.getComputedStyle(cards).gridTemplateColumns}\niframe 边框盒宽：${number(frame.getBoundingClientRect().width)}px\n外层滚动容器的宽度不会替代这个视口。`;};
 const update=()=>{const width=Number(q('#markup-viewport').value);q('[data-width]').textContent=width;frame.style.width=`${width}px`;life.later(measure);};
 on('[data-frame]','load',update);on('#markup-viewport','input',update);[599,600,601,800].forEach(width=>on(`[data-width-${width}]`,'click',()=>{q('#markup-viewport').value=width;update();}));life.observe(frame,measure);frame.style.width='599px';
 frame.srcdoc=frameHTML(`${css}.card{padding:14px;background:#e4ecfa;border:1px solid #b8cbea}h2{font-size:18px;margin:0 0 14px}`,'<h2>同一份 HTML，条件改变布局</h2><div class="cards"><div class="card">01 · HTML</div><div class="card">02 · CSS</div><div class="card">03 · JavaScript</div></div>');return life.cleanup;
 }
};

export const markupLabs=[parserLab,tableLab,selectorsLab,cascadeLab,boxLab,layoutLab,responsiveLab];
