import {bench,ref,report,esc,numberControl,selectControl,metrics,viewport,viewportMarkup,links} from './labs-final-shared.js?v=20261020-labs';

const defaultCSS=`.cards { display: grid; grid-template-columns: 1fr; gap: 8px; }
@media (min-width: 600px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1000px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}`;
function media(root) {
  const ui=bench(root,numberControl('width','预览视口宽度（CSS px）',768,320,1440)+
    '<div class="lab-actions"><button data-width-preset="599">599 px</button><button data-width-preset="600">600 px</button><button data-width-preset="999">999 px</button><button data-width-preset="1000">1000 px</button></div>'+
    selectControl('hide','第二张卡片的显示方式',[['visible','正常显示'],['none','display: none'],['hidden','visibility: hidden']])+
    `<label>可编辑 CSS（输入后实时生效）<textarea data-css class="final-code-editor" spellcheck="false" maxlength="5000">${esc(defaultCSS)}</textarea></label>`,
    viewportMarkup+links([['MDN 媒体查询','https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries']]),
    '真实浏览器 CSS 渲染。预览按比例缩放以适应屏幕；下方测量值仍是指定视口的 CSS 像素。');
  const view=viewport(ui,'<main class="cards">'+[1,2,3,4,5,6].map(n=>`<div class="tile" id="card${n}">卡片 ${n}</div>`).join('')+'</main>');
  const update=()=>{
    const width=+ui.$('[data-width]').value,hide=ui.$('[data-hide]').value,css=ui.$('[data-css]').value;
    ui.code(`${css}\n/* 显示方式控件追加的规则 */\n#card2 { display: ${hide==='none'?'none':'block'}; visibility: ${hide==='hidden'?'hidden':'visible'}; }`);
    view.update(width,ui.$('[data-code]').textContent,(doc,win)=>{
      const layout=win.getComputedStyle(doc.querySelector('.cards'));
      const card=doc.querySelector('#card2'),style=win.getComputedStyle(card);
      const tracks=layout.gridTemplateColumns,slots=card.getClientRects().length;
      ui.$('[data-metrics]').innerHTML=metrics([['实际视口',`${win.innerWidth} px`],['浏览器计算列宽',tracks],['卡片 2 布局盒',slots?'保留':'无']]);
      report(root,`${win.innerWidth}px → grid-template-columns: ${tracks}`,[
        [`视口 ${width}px`, `≥600：${win.matchMedia('(min-width:600px)').matches}；≥1000：${win.matchMedia('(min-width:1000px)').matches}`, 'Responsive P16–18：min-width 包含等号。多个查询可同时成立，冲突时继续按 CSS 层叠规则决定。'],
        ['当前编辑的 .cards CSS',`display: ${layout.display}；列宽：${tracks}`,'这是浏览器的 computed style。编辑代码后，以这组实测值为准；非法 CSS 声明会被浏览器忽略。'],
        [`卡片 2：${hide}`,`display=${style.display}；visibility=${style.visibility}；${slots?'仍占位置':'不占位置'}`,'Responsive P20：none 移除布局盒，hidden 只隐藏绘制。两种方式都没有删除 DOM；代码里的其他规则也可能参与层叠。']
      ]);
    });
  };
  for(const field of ['width','hide','css'])ui.on(ui.$(`[data-${field}]`),'input',update);
  root.querySelectorAll('[data-width-preset]').forEach(button=>ui.on(button,'click',()=>{ui.$('[data-width]').value=button.dataset.widthPreset;update()}));
  update();return()=>{view.destroy();ui.destroy()};
}

function grid(root) {
  const ui=bench(root,selectControl('version','Bootstrap 版本',[['5','v5：md 从 768px 开始'],['3','v3：md 从 992px 开始']])+
    numberControl('width','视口宽度（CSS px）',850,320,1500)+
    selectControl('span','达到 md 后，每张卡片占几列',[['4','col-md-4：每张占 4/12'],['6','col-md-6：每张占 6/12'],['3','col-md-3：每张占 3/12']])+
    selectControl('nested','布局类型',[['plain','6 张等宽卡片'],['nested','外层 8/12，内层各 6/12']]),
    viewportMarkup+links([['Bootstrap 5 栅格','https://getbootstrap.com/docs/5.3/layout/grid/'],['Bootstrap 3 栅格','https://getbootstrap.com/docs/3.4/css/#grid']]),
    '真实 CSS 渲染的 12 列教学模型：只实现本实验用到的列宽、换行和断点，不加载完整 Bootstrap 组件或 gutter 样式。');
  const view=viewport(ui,`<div class="row" id="outer">${Array.from({length:6},(_,i)=>`<div class="column tile">${i+1}</div>`).join('')}</div><div class="row" id="nest"><div class="parent tile"><div class="row"><div class="child tile">内层 A</div><div class="child tile">内层 B</div></div></div><div class="sibling tile">外层 4</div></div>`);
  const update=()=>{
    const version=ui.$('[data-version]').value,width=+ui.$('[data-width]').value,span=+ui.$('[data-span]').value,nested=ui.$('[data-nested]').value==='nested',bp=version==='3'?992:768;
    ui.$('[data-span]').disabled=nested;
    ui.code(`<!-- Bootstrap ${version}，md ≥ ${bp}px -->\n<div class="row">\n${nested?'  <div class="col-md-8">\\n    <div class="row">\\n      <div class="col-6">A</div>\\n      <div class="col-6">B</div>\\n    </div>\\n  </div>\\n  <div class="col-md-4">外层 4</div>'.replaceAll('col-6',version==='3'?'col-xs-6':'col-6'):`  <!-- 共 6 张 -->\n  <div class="${version==='3'?'col-xs-12':'col-12'} col-md-${span}">卡片</div>`}\n</div>`);
    view.update(width,`.row{display:flex;flex-wrap:wrap}.column,.parent,.sibling{width:100%}.child{width:50%}.parent{padding:0;border:0;outline:2px solid #922636;outline-offset:-2px}#outer{display:${nested?'none':'flex'}}#nest{display:${nested?'flex':'none'}}@media(min-width:${bp}px){.column{width:${span/12*100}%}.parent{width:66.6666667%}.sibling{width:33.3333333%}}`,(doc,win)=>{
      const active=win.matchMedia(`(min-width:${bp}px)`).matches;
      const target=doc.querySelector(nested?'.parent':'.column'),w=target.getBoundingClientRect().width;
      const cw=doc.querySelector('.child').getBoundingClientRect().width;
      ui.$('[data-metrics]').innerHTML=metrics([['md 查询',`${active?'已触发':'未触发'} · ${win.innerWidth}px`],[nested?'父列宽度':'每张卡片',`${w.toFixed(1)} px`],[nested?'内层 A 宽度':'每行卡片数',nested?`${cw.toFixed(1)} px`:String(active?12/span:1)]]);
      report(root,`Bootstrap ${version} · ${width}px · ${active?'md 生效':'使用基础列宽'}`,[
        [`版本 v${version}，视口 ${width}px`,`md 下限 ${bp}px；当前${active?'达到':'未达到'}`,'Responsive P35、38–39、50：相同 md 名称不等于相同断点。课件 P39 的标题和部分文字混用了版本。'],
        [nested?'8/12 父列 + 6/12 子列':`col-md-${span}`,nested?`父 ${w.toFixed(1)}px；子 ${cw.toFixed(1)}px`:`6 张卡片分成 ${active?Math.ceil(6/(12/span)):6} 行`,
          nested?`Responsive P45：子宽 = 父宽 × 1/2；当前相当于外层 ${active?'1/3':'1/2'}。未到 md 时父列先占整行。`:`Responsive P42–43：达到断点后每张占 ${span}/12；未到断点则基础类占满一行。`]
      ]);
    });
  };
  for(const f of ['version','width','span','nested'])ui.on(ui.$(`[data-${f}]`),'input',update);
  update();return()=>{view.destroy();ui.destroy()};
}

function fluid(root) {
  const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect width="400" height="160" fill="#922636"/><text x="200" y="90" text-anchor="middle" fill="white" font-size="28">400 × 160</text></svg>');
  const ui=bench(root,numberControl('width','父容器宽度（CSS px）',600,240,900)+numberControl('percent','子容器占父容器的百分比',70,20,100)+
    selectControl('fit','图片 CSS',[['max','max-width:100%; height:auto'],['full','width:100%; height:auto'],['fixed','width:400px; height:160px']]),
    viewportMarkup,'真实浏览器测量。图片固有大小为 400 × 160；外层绿色线框、内层虚线分别标出百分比的参照。');
  const view=viewport(ui,`<div id="parent"><div id="child"><img alt="固有大小为 400 乘 160 的示例图" src="${image}"></div></div>`);
  const update=()=>{
    const width=+ui.$('[data-width]').value,percent=+ui.$('[data-percent]').value,fit=ui.$('[data-fit]').value;
    const rule={max:'max-width:100%; height:auto',full:'width:100%; height:auto',fixed:'width:400px; height:160px'}[fit];
    ui.code(`#parent { width: ${width}px; }\n#child { width: ${percent}%; }\nimg { ${rule}; }`);
    view.update(width,`#parent{width:100%;outline:3px solid #498675;outline-offset:-3px;min-height:200px}#child{width:${percent}%;outline:2px dashed #836034;min-height:200px}img{display:block;${rule}}`,doc=>{
      const parent=doc.querySelector('#parent').getBoundingClientRect().width,child=doc.querySelector('#child').getBoundingClientRect().width,img=doc.querySelector('img').getBoundingClientRect();
      ui.$('[data-metrics]').innerHTML=metrics([['父容器',`${parent}px`],['子容器',`${child.toFixed(1)}px`],['实际图片',`${img.width.toFixed(1)} × ${img.height.toFixed(1)}`]]);
      report(root,`子容器 ${child.toFixed(1)}px → 图片 ${img.width.toFixed(1)}px`,[
        [`父 ${width}px；子 ${percent}%`,`${parent} × ${percent/100} = ${child.toFixed(1)}px`,'Responsive P24：百分比先找参照容器。这里 child 的百分比相对 parent，图片的百分比又相对 child。'],
        [rule,`${img.width.toFixed(1)} × ${img.height.toFixed(1)}px${img.width>child+0.1?'，溢出子容器':''}`,{max:'Responsive P25：只限制最大宽度；容器大于 400px 时不主动放大，小于 400px 时缩小。',full:'Responsive P25 的对照：width:100% 主动填满容器，容器大于固有宽度时也会放大。',fixed:'固定 400px 不随父容器缩小；子容器小于 400px 时会溢出。'}[fit]]
      ]);
    });
  };
  for(const f of ['width','percent','fit'])ui.on(ui.$(`[data-${f}]`),'input',update);
  update();return()=>{view.destroy();ui.destroy()};
}

export const responsiveLabs=[
  {id:'responsive-media',category:'Responsive',title:'媒体查询与隐藏方式',minutes:8,summary:'拖动视口、直接改 CSS，观察断点边界、列数与隐藏元素的占位。',goal:'把媒体查询是否成立、层叠后的样式、实际布局区分开。',predict:'599 → 600px 会发生什么？隐藏卡片后后面的卡片是否补位？',refs:[ref('responsive',12,12,'viewport'),ref('responsive',16,18,'媒体查询与断点'),ref('responsive',20,20,'隐藏与布局')],mount:media,explanation:['min-width 包含边界值；媒体查询判断视口而非物理屏幕像素。','本实验运行你输入的 CSS；下方显示真实 computed style，语法无效的声明遵循浏览器的忽略规则。'],challenges:[{prompt:'1000px 时 600px 查询还成立吗？',answer:'成立。两个 min-width 查询都匹配；默认样式中后面的三列声明覆盖前面的两列。'},{prompt:'display:none 后 querySelector 能找到该卡片吗？',answer:'能。它没有布局盒，但 DOM 节点仍在。'}]},
  {id:'responsive-grid',category:'Responsive',title:'Bootstrap 断点与嵌套栅格',minutes:7,summary:'切换 v3/v5、改变列份额，用实测宽度理解 12 列和嵌套比例。',goal:'先确认 Bootstrap 版本，再读断点和父子比例。',predict:'850px 下同一个 col-md-4 在 v3 和 v5 中是否同宽？',refs:[ref('responsive',35,35,'12 列与版本'),ref('responsive',38,39,'旧版与混用说明'),ref('responsive',42,45,'等分与嵌套'),ref('responsive',47,47,'混合断点'),ref('responsive',50,50,'v5 断点')],mount:grid,explanation:['Bootstrap 3 的 md 从 992px 开始，Bootstrap 4/5 从 768px 开始。','嵌套 row 会把自己的父容器重新分成 12 份，子列比例不能直接当成最外层比例。'],challenges:[{prompt:'在 md 已生效时，父列 col-md-8 内的 col-6 占最外层几份？',answer:'8/12 × 6/12 = 1/3，即最外层 4/12；低于 md 时父列整行，子列相当于最外层一半。'}]},
  {id:'responsive-fluid',category:'Responsive',title:'百分比布局与弹性图片',minutes:5,summary:'改变父宽和百分比，对照 max-width、width 与固定宽度的实际差异。',goal:'判断百分比的参照和图片是否缩放、放大或溢出。',predict:'子容器 600px，固有宽 400px，max-width:100% 会把图片放大吗？',refs:[ref('responsive',23,25,'流式布局与弹性图片')],mount:fluid,explanation:['这里子容器宽度相对父容器计算，图片宽度相对子容器计算。','max-width 是上限；width 是要求的宽度。height:auto 随宽度保持固有比例。'],challenges:[{prompt:'父宽 600px、子宽 50%，图片用 max-width:100%，最终多宽？',answer:'子宽 300px，图片从固有 400px 缩到 300px，高度变为 120px。'}]}
];
