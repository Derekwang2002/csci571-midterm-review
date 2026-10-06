// Each workbench owns its nodes, listeners and pending work.
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options = entries => entries.map(([value, label]) => `<option value="${html(value)}">${html(label)}</option>`).join('');
const ref = (deck, start, end, label) => ({deck, start, end, label});
function show(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return '-0';
  return JSON.stringify(value, (_, item) => typeof item === 'undefined' ? '[undefined]' : item, 2);
}
function workbench(root, controls, preview = '') {
  root.innerHTML = `<div class="experiment-grid"><div class="experiment-controls">${controls}</div><div class="experiment-preview">${preview}<pre class="lab-code" data-code tabindex="0" aria-label="本次执行的示例代码"></pre><pre class="lab-result" data-result role="status" aria-live="polite" aria-atomic="true">先预测，再运行。</pre></div></div>`;
  const controller = new AbortController();
  const $ = selector => root.querySelector(selector);
  return {
    $, code: text => { $('[data-code]').textContent = text; },
    result: text => { $('[data-result]').textContent = text; },
    on: (node, event, callback, settings = {}) => node.addEventListener(event, callback, {...settings, signal: controller.signal}),
    destroy: () => controller.abort()
  };
}
function selectedDemoMount(root, cases, label = '选择预设') {
  const ui = workbench(root, `<label>${label}<select data-choice>${options(cases.map((c, i) => [i, c.title]))}</select></label><button type="button" class="primary" data-run>执行并查看结果</button>`);
  const update = () => { ui.code(cases[+ui.$('[data-choice]').value].code); ui.result('先预测值、类型或错误，再运行。'); };
  ui.on(ui.$('[data-choice]'), 'change', update);
  ui.on(ui.$('[data-run]'), 'click', () => {
    const demo = cases[+ui.$('[data-choice]').value];
    const lines = [];
    try { demo.run((...values) => lines.push(values.map(show).join('  '))); }
    catch (error) { lines.push(`${error.name}: ${error.message}`); }
    ui.result(`${lines.join('\n')}\n\n${demo.why}`);
  });
  update();
  return ui.destroy;
}

const coercions = [
  ['"5" + 3', () => '5' + 3, '+ 在这里连接字符串，数字 3 被转成文字。'],
  ['"5" - 3', () => '5' - 3, '- 使用数值运算，字符串 "5" 先转成数字。'],
  ['[] == false', () => [] == false, '宽松相等进行转换：false → 0，数组 → 空字符串 → 0。'],
  ['Boolean([])', () => Boolean([]), '空数组仍是对象，布尔转换为 true；不会因为没有元素就变成 false。'],
  ['typeof null', () => typeof null, '结果是字符串 "object"。这是特殊规则，null 本身不是普通可访问属性的对象。'],
  ['null == undefined', () => null == undefined, '宽松相等专门规定 null 与 undefined 相等。'],
  ['null === undefined', () => null === undefined, '严格相等不进行跨类型转换，两者不同。'],
  ['NaN === NaN', () => NaN === NaN, 'NaN 严格比较时不等于自身，可用 Number.isNaN 检测。'],
  ['({}) === ({})', () => ({}) === ({}), '两个对象字面量各创建一个对象，身份不同。'],
  ['1 + 2 + "3"', () => 1 + 2 + '3', '按左结合先算 1+2，再连接字符串，得到 "33"。'],
  ['"1" + 2 + 3', () => '1' + 2 + 3, '先得到 "12"，再连接 3，得到 "123"。'],
  ['"a" * "b"', () => 'a' * 'b', '语法合法，但数值转换失败，结果是 number 类型的 NaN。'],
  ['0 || 7', () => 0 || 7, '逻辑或跳过假值 0，返回右操作数 7，并非总返回布尔值。'],
  ['0 ?? 7', () => 0 ?? 7, '拓展：空值合并只替换 null/undefined，因此保留 0。'],
  ['Boolean("false")', () => Boolean('false'), '非空字符串为真，内容拼成 false 也不会变成布尔 false。'],
  ['Boolean(new Boolean(false))', () => Boolean(new Boolean(false)), '包装结果是对象，放进布尔上下文仍为真。'],
  ['Number("")', () => Number(''), '显式数值转换把空字符串转换为 0，不代表业务上已经填写数字。'],
  ['Object.is(NaN, NaN)', () => Object.is(NaN, NaN), '拓展：Object.is 的比较规则与 === 不完全相同，它把 NaN 与自身视为相同。']
];

const scopeCases = [
  {title:'var：块内声明仍在函数作用域', code:'function demo() {\n  var value = 10;\n  if (true) { var value = 20; console.log(value); }\n  console.log(value);\n}\ndemo();', run(log) { var value = 10; if (true) { var value = 20; log(value); } log(value); }, why:'两处 var 使用同一个函数作用域绑定，所以内外都是 20。'},
  {title:'let：块内同名绑定遮蔽外层', code:'let value = 10;\nif (true) { let value = 20; console.log(value); }\nconsole.log(value);', run(log) { let value = 10; if (true) { let value = 20; log(value); } log(value); }, why:'块内是另一份绑定，先输出 20，离开块后外层仍为 10。'},
  {title:'const：块作用域与重新赋值', code:'const value = 10;\nif (true) { const value = 20; console.log(value); }\ntry { value = 30; } catch (error) { console.log(error.name); }\nconsole.log(value);', run(log) { const value = 10; if (true) { const value = 20; log(value); } try { value = 30; } catch (error) { log(error.name); } log(value); }, why:'块内可以声明另一个绑定，但给外层 const 重新赋值会抛 TypeError；原值仍为 10。'},
  {title:'var：声明前读取', code:'console.log(value);\nvar value = 7;\nconsole.log(value);', run(log) { log(value); var value = 7; log(value); }, why:'var 提前初始化为 undefined，但赋值 7 仍发生在原位置。'},
  {title:'let：暂时性死区 TDZ', code:'try { console.log(value); } catch (error) { console.log(error.name); }\nlet value = 7;\nconsole.log(value);', run(log) { try { log(value); } catch (error) { log(error.name); } let value = 7; log(value); }, why:'第一次读取发生在 let 初始化前，抛 ReferenceError。这里明确捕获错误，后面的声明和输出才能继续。'},
  {title:'const：typeof 也无法绕过 TDZ', code:'try { console.log(typeof value); } catch (error) { console.log(error.name); }\nconst value = 7;\nconsole.log(value);', run(log) { try { log(typeof value); } catch (error) { log(error.name); } const value = 7; log(value); }, why:'对处于暂时性死区的词法绑定，typeof 同样抛 ReferenceError。它与从未声明过的名字不同。'},
  {title:'闭包 + var 循环：共享一份 i', code:'const callbacks = [];\nfor (var i = 0; i < 3; i++) callbacks.push(() => i);\nconsole.log(callbacks.map(fn => fn()));', run(log) { const callbacks = []; for (var i = 0; i < 3; i++) callbacks.push(() => i); log(callbacks.map(fn => fn())); }, why:'所有回调读取同一个 i；调用发生在循环结束后，此时 i 已为 3。'},
  {title:'闭包 + let 循环：每轮一份绑定', code:'const callbacks = [];\nfor (let i = 0; i < 3; i++) callbacks.push(() => i);\nconsole.log(callbacks.map(fn => fn()));', run(log) { const callbacks = []; for (let i = 0; i < 3; i++) callbacks.push(() => i); log(callbacks.map(fn => fn())); }, why:'let 循环为每次迭代建立对应绑定，因此三个回调分别读取 0、1、2。'},
  {title:'闭包 + const for...of', code:'const callbacks = [];\nfor (const i of [0, 1, 2]) callbacks.push(() => i);\nconsole.log(callbacks.map(fn => fn()));', run(log) { const callbacks = []; for (const i of [0, 1, 2]) callbacks.push(() => i); log(callbacks.map(fn => fn())); }, why:'这里每轮创建一个 const 绑定，所以合法。它不同于 for(const i=0; ...; i++) 对同一绑定执行 i++。'}
];

function mountReferences(root) {
  const entries = [['alias','两个变量共享对象'],['parameter','改参数属性，再重新赋参数'],['shallow','浅拷贝：顶层独立，嵌套共享'],['const','const：改字段与换对象']];
  const ui = workbench(root, `<label>观察哪种操作<select data-mode>${options(entries)}</select></label><label>初始 score（0–100）<input data-score type="number" value="10" min="0" max="100" step="1"></label><button type="button" class="primary" data-run>执行并画出引用关系</button>`);
  const render = (execute = false) => {
    const raw = ui.$('[data-score]').value, score = Number(raw), mode = ui.$('[data-mode]').value;
    if (raw === '' || !Number.isInteger(score) || score < 0 || score > 100) { ui.result('请输入 0–100 的整数。'); return; }
    const first = `const original = {score:${score}, nested:{count:1}};\n`;
    const snippets = {
      alias:'const other = original;\nother.score += 1;\nconsole.log(original.score, original === other);',
      parameter:'function change(item) {\n  item.score += 1;\n  item = {score:999};\n  return item;\n}\nconst returned = change(original);\nconsole.log(original.score, returned.score, original === returned);',
      shallow:'const copy = {...original};\ncopy.score += 1;\ncopy.nested.count += 1;\nconsole.log(original, copy);\nconsole.log(original === copy, original.nested === copy.nested);',
      const:'original.score += 1;\ntry { original = {score:999}; }\ncatch (error) { console.log(error.name); }\nconsole.log(original.score);'
    };
    ui.code(first + snippets[mode]);
    if (!execute) { ui.result('先判断是“修改对象内容”还是“让绑定指向另一个对象”。'); return; }
    const original = {score, nested:{count:1}};
    if (mode === 'alias') { const other = original; other.score += 1; ui.result(`original ─┐\n          ├─→ 同一个对象\nother ────┘\n\noriginal.score：${original.score}\noriginal === other：${original === other}`); }
    if (mode === 'parameter') {
      function change(item) { item.score += 1; item = {score:999}; return item; }
      const returned = change(original);
      ui.result(`original → 原对象 {score:${original.score}, …}\nreturned → 新对象 {score:${returned.score}}\n\n两者相同：${original === returned}\n参数获得引用值副本。修改字段可见，重新赋 item 不会重新绑定外面的 original。`);
    }
    if (mode === 'shallow') { const copy = {...original}; copy.score += 1; copy.nested.count += 1; ui.result(`original → 顶层对象 A ─nested─┐\ncopy     → 顶层对象 B ─nested─┴→ 同一个嵌套对象\n\noriginal：${show(original)}\ncopy：${show(copy)}\n顶层相同：${original === copy}\n嵌套相同：${original.nested === copy.nested}`); }
    if (mode === 'const') { original.score += 1; let errorName = ''; try { original = {score:999}; } catch (error) { errorName = error.name; } ui.result(`修改字段后 score：${original.score}\n尝试换对象：${errorName}\n\nconst 限制绑定重新赋值，没有冻结原对象。`); }
  };
  ui.on(ui.$('[data-mode]'), 'change', () => render()); ui.on(ui.$('[data-score]'), 'input', () => render()); ui.on(ui.$('[data-run]'), 'click', () => render(true)); render(); return ui.destroy;
}

function mountArrays(root) {
  const methods = [['map','map：每项加参数'],['filter','filter：保留 ≥ 参数的项'],['reduce','reduce：累加，以参数为初值'],['push','push：在末尾加入参数'],['pop','pop：移除最后一项'],['reverse','reverse：原地反转'],['sort','sort：按数值升序'],['concat','concat：生成追加后的新数组']];
  const ui = workbench(root, `<label>数字数组（逗号分隔，最多 30 项；可留空）<input data-array value="3, 1, 4, 2" maxlength="240" spellcheck="false"></label><label>数组方法<select data-method>${options(methods)}</select></label><label>参数或累加初值<input data-number type="number" value="2" min="-1000000" max="1000000"></label><button type="button" class="primary" data-run>执行一次</button><p class="lab-note">每次从输入重新创建数组，便于公平比较；变异方法不会悄悄改掉输入框。</p>`);
  const render = (execute = false) => {
    const text = ui.$('[data-array]').value.trim(), parts = text ? text.split(',').map(x => x.trim()) : [];
    const data = parts.map(Number), parameter = Number(ui.$('[data-number]').value), method = ui.$('[data-method]').value;
    if (parts.length > 30 || parts.some(x => x === '') || data.some(x => !Number.isFinite(x) || Math.abs(x) > 1e6)) { ui.result('使用逗号分隔最多 30 个有限数字，每项绝对值不超过 1,000,000；不支持空槽。'); return; }
    const usesParameter = ['map','filter','reduce','push','concat'].includes(method);
    ui.$('[data-number]').disabled = !usesParameter;
    if (usesParameter && (ui.$('[data-number]').value === '' || !Number.isFinite(parameter) || Math.abs(parameter) > 1e6)) { ui.result('参数需为绝对值不超过 1,000,000 的有限数字。'); return; }
    const calls = {map:`map(n => n + ${parameter})`,filter:`filter(n => n >= ${parameter})`,reduce:`reduce((sum, n) => sum + n, ${parameter})`,push:`push(${parameter})`,pop:'pop()',reverse:'reverse()',sort:'sort((a, b) => a - b)',concat:`concat(${parameter})`};
    ui.code(`const input = ${JSON.stringify(data)};\nconst result = input.${calls[method]};\nconsole.log(result);\nconsole.log(input);\nconsole.log(result === input);`);
    if (!execute) { ui.result('预测三件事：返回什么、原数组怎样变化、是否返回原数组本身。'); return; }
    const before = [...data]; let result;
    switch (method) {
      case 'map': result = data.map(n => n + parameter); break;
      case 'filter': result = data.filter(n => n >= parameter); break;
      case 'reduce': result = data.reduce((sum, n) => sum + n, parameter); break;
      case 'push': result = data.push(parameter); break;
      case 'pop': result = data.pop(); break;
      case 'reverse': result = data.reverse(); break;
      case 'sort': result = data.sort((a, b) => a - b); break;
      case 'concat': result = data.concat(parameter); break;
    }
    const why = {map:'返回新数组；此回调只做数值加法，不修改原数组。',filter:'返回符合条件的新数组，原数组保持原值。',reduce:'返回累加值；空数组也可使用给定初值。',push:'修改原数组，返回新长度。',pop:'修改原数组，返回移除值；空数组返回 undefined。',reverse:'原地修改，返回原数组本身。',sort:'原地排序并返回原数组；比较函数保证数值顺序。',concat:'返回新数组，不扩充原数组。'};
    ui.result(`执行前：${show(before)}\n返回值：${show(result)}\n返回值类型：${typeof result}${Array.isArray(result) ? '（数组）' : ''}\n执行后 input：${show(data)}\nresult === input：${result === data}\n\n${why[method]}`);
  };
  ui.on(ui.$('[data-array]'), 'input', () => render()); ui.on(ui.$('[data-number]'), 'input', () => render()); ui.on(ui.$('[data-method]'), 'change', () => render()); ui.on(ui.$('[data-run]'), 'click', () => render(true)); render(); return ui.destroy;
}

function mountRegex(root) {
  const presets = [
    {name:'捕获与全局 exec',pattern:'d(b+)d',flags:'g',text:'cdbbdbsbz dbd',replacement:'[$1]'},
    {name:'交换姓名',pattern:'(\\w+)\\s(\\w+)',flags:'',text:'Ada Lovelace',replacement:'$2, $1'},
    {name:'单词后必须有空白',pattern:'\\w+\\s',flags:'g',text:'fee fi fo fum',replacement:'[$&]'},
    {name:'电话：相同分隔符',pattern:'^\\d{3}([-.])\\d{3}\\1\\d{4}$',flags:'',text:'213-555-0123',replacement:'matched'},
    {name:'预查：数字、小写、大写',pattern:'^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$',flags:'',text:'Abc123',replacement:'valid'}
  ];
  const ui = workbench(root, `<label>填入预设<select data-preset>${options(presets.map((p,i) => [i,p.name]))}</select></label><label>pattern（不含两侧斜杠，最多 120 字符）<input data-pattern maxlength="120" spellcheck="false"></label><label>flags（g、i、m、s、u、y）<input data-flags maxlength="6" spellcheck="false"></label><label>待匹配文本（最多 500 字符）<textarea data-text maxlength="500" spellcheck="false"></textarea></label><label>操作<select data-method>${options(['test','exec','match','replace'].map(x=>[x,x]))}</select></label><label>replace 替换内容（$1 是第一组，$& 是完整匹配）<input data-replacement maxlength="120" spellcheck="false"></label><div class="lab-actions"><button type="button" class="primary" data-run>执行一次</button><button type="button" data-reset>重置 lastIndex</button></div><p class="lab-note">同一模式持续复用。连续点 exec/test，观察 g/y 怎样改变 lastIndex。修改模式、flags、文本会重置状态。匹配在独立 Worker 中运行，超时将停止。</p>`);
  let worker = null, timer = null, disposed = false, busy = false, token = 0;
  const workerCode = `let regexp = null; let signature = '';
onmessage = event => {
  const {id, pattern, flags, text, method, replacement} = event.data;
  try {
    const nextSignature = JSON.stringify([pattern, flags]);
    if (!regexp || signature !== nextSignature) { regexp = new RegExp(pattern, flags); signature = nextSignature; }
    const before = regexp.lastIndex;
    let value;
    if (method === 'test') value = regexp.test(text);
    if (method === 'exec') value = regexp.exec(text);
    if (method === 'match') value = text.match(regexp);
    if (method === 'replace') value = text.replace(regexp, replacement);
    const isArray = Array.isArray(value);
    const resultType = value === null ? 'null' : isArray ? 'Array' : typeof value;
    postMessage({id, before, after:regexp.lastIndex, resultType,
      result:isArray ? Array.from(value) : value,
      matchIndex:isArray ? value.index : undefined,
      groups:isArray ? value.groups : undefined});
  } catch (error) { postMessage({id, error:error.name + ': ' + error.message}); }
};`;
  const stop = () => { token++; if (timer !== null) clearTimeout(timer); timer = null; if (worker) worker.terminate(); worker = null; busy = false; ui.$('[data-run]').disabled = false; };
  const read = () => ({pattern:ui.$('[data-pattern]').value,flags:ui.$('[data-flags]').value,text:ui.$('[data-text]').value,method:ui.$('[data-method]').value,replacement:ui.$('[data-replacement]').value});
  const update = (reset = false) => {
    if (reset) stop();
    const p = read();
    ui.$('[data-replacement]').disabled = p.method !== 'replace';
    const call = ['test','exec'].includes(p.method) ? `re.${p.method}(${JSON.stringify(p.text)})` : `${JSON.stringify(p.text)}.${p.method}(re${p.method === 'replace' ? ', ' + JSON.stringify(p.replacement) : ''})`;
    ui.code(`// 创建后持续复用；点“重置”才重新创建\nconst re = new RegExp(${JSON.stringify(p.pattern)}, ${JSON.stringify(p.flags)});\nconsole.log(re.lastIndex);\nconst result = ${call};\nconsole.log(result, re.lastIndex);`);
    if (reset) ui.result('状态已重置，下一次从 lastIndex = 0 开始。');
  };
  const loadPreset = () => { const p = presets[+ui.$('[data-preset]').value]; for (const key of ['pattern','flags','text','replacement']) ui.$(`[data-${key}]`).value = p[key]; update(true); };
  ui.on(ui.$('[data-preset]'), 'change', loadPreset);
  for (const field of ['pattern','flags','text']) ui.on(ui.$(`[data-${field}]`), 'input', () => update(true));
  ui.on(ui.$('[data-replacement]'), 'input', () => { stop(); update(false); ui.result('替换文字已改变，状态重置。'); });
  ui.on(ui.$('[data-method]'), 'change', () => { if (busy) stop(); update(false); ui.result('操作已切换；未在执行中切换时沿用同一个正则的 lastIndex。'); });
  ui.on(ui.$('[data-reset]'), 'click', () => update(true));
  ui.on(ui.$('[data-run]'), 'click', () => {
    if (busy || disposed) return;
    const p = read();
    if (p.pattern.length > 120 || p.text.length > 500 || p.replacement.length > 120 || !/^[gimsuy]*$/.test(p.flags) || p.flags.length > 6) { ui.result('输入超过上限，或 flags 含不支持的字符。重复 flag 将由真实 RegExp 构造器报告。'); return; }
    if (typeof Worker !== 'function') { ui.result('当前环境无法运行 Worker，因此不执行自定义正则。请在支持 Worker 的浏览器打开本页。'); return; }
    try {
      if (!worker) {
        const url = URL.createObjectURL(new Blob([workerCode], {type:'text/javascript'}));
        try { worker = new Worker(url); } finally { URL.revokeObjectURL(url); }
        worker.onmessage = event => {
          const message = event.data;
          if (disposed || message.id !== token) return;
          clearTimeout(timer); timer = null; busy = false; ui.$('[data-run]').disabled = false;
          if (message.error) { ui.result(message.error); return; }
          const extra = message.resultType === 'Array' ? `\n数组附加属性 index：${show(message.matchIndex)}\n数组附加属性 groups：${show(message.groups)}` : '';
          ui.result(`执行前 lastIndex：${message.before}\n原生返回类型：${message.resultType}${message.resultType === 'Array' ? '（typeof 为 object）' : ''}\n${message.resultType === 'Array' ? '数组元素' : '返回值'}：${show(message.result)}${extra}\n执行后 lastIndex：${message.after}\n\nexec 成功时返回数组，失败时返回 null：result[0] 是完整匹配，后续项是捕获组。这里把数组元素与附加属性分行展示。match 使用 g 时返回全部完整匹配，不附带同样的捕获信息；groups 只保存命名捕获组。replace 返回新字符串。`);
        };
        worker.onerror = () => { if (disposed) return; stop(); ui.result('Worker 执行失败，状态已重置；可换一个预设重试。'); };
      }
      busy = true; ui.$('[data-run]').disabled = true; ui.result('正在独立 Worker 中匹配…');
      const id = ++token;
      timer = setTimeout(() => { if (disposed || id !== token) return; stop(); ui.result('匹配超过 800 ms，已终止 Worker 并重置状态。嵌套重复等模式可能导致大量回溯；请缩短文本或简化模式。'); }, 800);
      worker.postMessage({id, ...p});
    } catch (error) { stop(); ui.result(`${error.name}: ${error.message}\n当前环境无法启动正则 Worker。`); }
  });
  loadPreset();
  return () => { disposed = true; stop(); ui.destroy(); };
}

function mountEventLoop(root) {
  const ui = workbench(root, `<label>执行流程<select data-scenario>${options([['basic','同步 → Promise 微任务 → 定时器'],['nested','微任务中再排微任务，定时器中再排任务'],['await','async/await 在哪里暂停']])}</select></label><label>定时器延迟（0–1000 ms）<input data-delay type="number" min="0" max="1000" step="1" value="0"></label><div class="lab-actions"><button type="button" class="primary" data-run>真实运行序列</button><button type="button" data-cancel>停止并清空</button></div><p class="lab-note">Promise 微任务与 async/await 的调度细节是理解课件的拓展。时间仅记录当前实验的实际观测，不是浏览器实时性保证。</p>`);
  let disposed = false, token = 0; const timers = new Set();
  const cancel = () => { token++; timers.forEach(clearTimeout); timers.clear(); ui.$('[data-run]').disabled = false; };
  const read = () => {
    const raw = ui.$('[data-delay]').value, delay = Number(raw);
    if (raw === '' || !Number.isInteger(delay) || delay < 0 || delay > 1000) return null;
    return {delay, scenario:ui.$('[data-scenario]').value};
  };
  const code = () => {
    cancel(); const p = read(); if (!p) { ui.result('延迟需为 0–1000 的整数。'); return; }
    const codes = {
      basic:`console.log("S1 同步开始");\nsetTimeout(() => console.log("T1 定时器"), ${p.delay});\nPromise.resolve().then(() => console.log("M1 Promise"));\nconsole.log("S2 同步结束");`,
      nested:`console.log("S1 同步开始");\nPromise.resolve().then(() => {\n  console.log("M1 第一层微任务");\n  Promise.resolve().then(() => console.log("M2 新增微任务"));\n});\nsetTimeout(() => {\n  console.log("T1 第一个定时器");\n  Promise.resolve().then(() => console.log("M3 定时器后的微任务"));\n  setTimeout(() => console.log("T2 第二个定时器"), ${p.delay});\n}, ${p.delay});\nconsole.log("S2 同步结束");`,
      await:`console.log("A 同步开始");\nasync function task() {\n  console.log("B await 之前");\n  await Promise.resolve();\n  console.log("D await 之后");\n}\ntask();\nconsole.log("C 调用者继续");\nsetTimeout(() => console.log("T 定时器"), ${p.delay});`
    };
    ui.code(codes[p.scenario]); ui.result('先排出标签的先后顺序，再点运行。');
  };
  ui.on(ui.$('[data-scenario]'), 'change', code); ui.on(ui.$('[data-delay]'), 'input', code);
  ui.on(ui.$('[data-cancel]'), 'click', () => { cancel(); ui.result('已停止；已排队的微任务会被忽略，不会更新输出。'); });
  ui.on(ui.$('[data-run]'), 'click', () => {
    const p = read(); if (!p) { ui.result('延迟需为 0–1000 的整数。'); return; }
    cancel(); const id = token, started = performance.now(), lines = []; ui.$('[data-run]').disabled = true;
    const alive = () => !disposed && id === token;
    const log = message => { if (!alive()) return; lines.push(`${lines.length + 1}. ${message}  (+${(performance.now()-started).toFixed(1)} ms)`); ui.result(lines.join('\n')); };
    const finish = () => { if (alive()) { ui.$('[data-run]').disabled = false; ui.result(lines.join('\n') + '\n\n完成。微任务检查点会继续处理新加入的微任务，然后才有机会执行下一项定时器任务。'); } };
    const schedule = callback => { const timer = setTimeout(() => { timers.delete(timer); if (alive()) callback(); }, p.delay); timers.add(timer); };
    if (p.scenario === 'basic') { log('S1 同步开始'); schedule(() => { log('T1 定时器'); finish(); }); Promise.resolve().then(() => log('M1 Promise')); log('S2 同步结束'); }
    if (p.scenario === 'nested') {
      log('S1 同步开始'); Promise.resolve().then(() => { if (!alive()) return; log('M1 第一层微任务'); Promise.resolve().then(() => log('M2 新增微任务')); });
      schedule(() => { log('T1 第一个定时器'); Promise.resolve().then(() => log('M3 定时器后的微任务')); schedule(() => { log('T2 第二个定时器'); finish(); }); }); log('S2 同步结束');
    }
    if (p.scenario === 'await') { log('A 同步开始'); async function task() { log('B await 之前'); await Promise.resolve(); log('D await 之后'); } task(); log('C 调用者继续'); schedule(() => { log('T 定时器'); finish(); }); }
  });
  code(); return () => { disposed = true; cancel(); ui.destroy(); };
}

function mountTree(root) {
  const ui = workbench(root, `<label>树操作<select data-operation>${options([['append','把首个元素 append 到末尾'],['clone','clone 首个元素并追加'],['repeat','replaceChildren(first, first)'],['reverse','反转所有直接 childNodes'],['text','给 textContent 赋值'],['html','给 innerHTML 赋值']])}</select></label><label>内容预设（用于 textContent / innerHTML）<select data-content>${options([['bold','<b>新文字</b>'],['paragraphs','<p>C</p><p>D</p>'],['plain','A & B']])}</select></label><div class="lab-actions"><button type="button" class="primary" data-run>执行一步</button><button type="button" data-reset>重建初始树</button></div><p class="lab-note">可连续操作；节点 # 编号表示对象身份。所有内容都来自有限预设，方便比较文本与标记解析。</p>`, '<div data-tree aria-label="实际 DOM 预览" style="padding:16px;border:1px solid currentColor;margin-bottom:16px"></div>');
  let identities = new WeakMap(), serial = 0;
  const identify = node => { if (!identities.has(node)) identities.set(node, ++serial); return identities.get(node); };
  const box = ui.$('[data-tree]');
  const describe = () => `childNodes：${box.childNodes.length}，children：${box.children.length}\n` + Array.from(box.childNodes, (node, i) => `${i}: #${identify(node)} ${node.nodeName}（nodeType=${node.nodeType}） ${show(node.textContent)}`).join('\n') + `\n\ntextContent：${show(box.textContent)}\ninnerHTML：${show(box.innerHTML)}`;
  const payloads = {bold:'<b>新文字</b>', paragraphs:'<p>C</p><p>D</p>', plain:'A & B'};
  const update = () => {
    const op = ui.$('[data-operation]').value, value = payloads[ui.$('[data-content]').value];
    ui.$('[data-content]').disabled = !['text','html'].includes(op);
    const operations = {append:'box.appendChild(box.firstElementChild);',clone:'box.appendChild(box.firstElementChild.cloneNode(true));',repeat:'const first = box.firstElementChild;\nbox.replaceChildren(first, first);',reverse:'for (let i = box.childNodes.length - 1; i >= 0; i--) {\n  box.appendChild(box.childNodes[i]);\n}',text:`box.textContent = ${JSON.stringify(value)};`,html:`box.innerHTML = ${JSON.stringify(value)};`};
    ui.code('// box 是预览中的容器；需要首元素的操作会先检查它存在\nconst staticList = box.querySelectorAll("p");\nconst liveList = box.getElementsByTagName("p");\n' + operations[op] + '\nconsole.log(box.childNodes.length, box.children.length);\nconsole.log(staticList.length, liveList.length);');
  };
  const reset = () => { identities = new WeakMap(); serial = 0; box.replaceChildren(document.createTextNode('\n')); const a = document.createElement('p'); a.textContent='A'; const b = document.createElement('p'); b.textContent='B'; box.append(a, document.createTextNode('\n'), document.createComment('注释'), b, document.createTextNode('\n')); update(); ui.result('初始真实树：\n' + describe()); };
  ui.on(ui.$('[data-operation]'), 'change', update); ui.on(ui.$('[data-content]'), 'change', update); ui.on(ui.$('[data-reset]'), 'click', reset);
  ui.on(ui.$('[data-run]'), 'click', () => {
    const op = ui.$('[data-operation]').value, value = payloads[ui.$('[data-content]').value], first = box.firstElementChild;
    if (['append','clone','repeat'].includes(op) && !first) { ui.result('当前没有元素子节点，无法执行此步。请先重建初始树，或用 innerHTML 创建元素。'); return; }
    const before = describe(), staticList = box.querySelectorAll('p'), liveList = box.getElementsByTagName('p'), oldStatic = staticList.length, oldLive = liveList.length;
    if (op === 'append') box.appendChild(first);
    if (op === 'clone') box.appendChild(first.cloneNode(true));
    if (op === 'repeat') box.replaceChildren(first, first);
    if (op === 'reverse') for (let i=box.childNodes.length-1;i>=0;i--) box.appendChild(box.childNodes[i]);
    if (op === 'text') box.textContent = value;
    if (op === 'html') box.innerHTML = value;
    ui.result(`执行前：\n${before}\n\n执行后：\n${describe()}\n\n同一次操作前查询的 p 列表：\n静态 querySelectorAll：${oldStatic} → ${staticList.length}\n实时 getElementsByTagName：${oldLive} → ${liveList.length}\n静态列表不自动补入/删掉成员，仍持有原来查询到的节点引用。`);
  });
  reset(); return ui.destroy;
}

function mountEvents(root) {
  const inputId = 'lab-dom-events-native-checkbox';
  const ui = workbench(root, `<label>监听阶段<select data-phase>${options([['both','捕获与冒泡都监听'],['bubble','只记录冒泡监听器'],['capture','只记录捕获监听器']])}</select></label><label>在哪个监听器停止传播<select data-stop>${options([['none','不停止'],['target','复选框目标'],['inner','内层容器（首次到达该监听器时）']])}</select></label><label><input type="checkbox" data-prevent>在目标监听器调用 preventDefault()</label><div class="lab-actions"><button type="button" class="primary" data-click>触发一次真实 click</button><button type="button" data-reset>重置为未选中</button></div><p class="lab-note">捕获及事件阶段细节是课件的拓展。复选框默认动作是真实的选中切换；页面不会提交表单或导航。</p>`, `<label for="${inputId}">也可直接点击这个复选框</label><div data-outer style="padding:18px;border:2px solid currentColor;margin-bottom:16px">外层 outer<div data-inner style="padding:18px;border:1px dashed currentColor;margin-top:10px">内层 inner<div style="margin-top:10px"><input id="${inputId}" data-native type="checkbox"></div></div></div>`);
  const outer = ui.$('[data-outer]'), inner = ui.$('[data-inner]'), target = ui.$('[data-native]');
  let eventsController = null, disposed = false, token = 0, settledChecked = false, lines = [], settleTimer = null;
  const cancelSettlement = () => { token++; if (settleTimer !== null) clearTimeout(settleTimer); settleTimer = null; };
  const name = node => node === outer ? 'outer' : node === inner ? 'inner' : node === target ? 'checkbox' : node.nodeName.toLowerCase();
  const configure = () => {
    cancelSettlement(); if (eventsController) eventsController.abort(); eventsController = new AbortController();
    const signal = eventsController.signal, phase = ui.$('[data-phase]').value, stop = ui.$('[data-stop]').value, prevent = ui.$('[data-prevent]').checked;
    ui.code(`// 三层：outer > inner > checkbox\n// 每个选定阶段的监听器都记录以下数据\nfunction handler(event) {\n  console.log(event.eventPhase, event.target, event.currentTarget);\n  ${prevent ? 'if (event.currentTarget === checkbox) event.preventDefault();' : '// 不取消默认动作'}\n  ${stop !== 'none' ? `if (event.currentTarget === ${stop === 'target' ? 'checkbox' : 'inner'}) event.stopPropagation();` : '// 不停止传播'}\n}\n// capture: true 表示捕获监听器；false 表示冒泡监听器\n// stopPropagation 不取消默认动作，也不中断同一轮监听器队列；\n// 但目标捕获与目标冒泡是两轮，前一轮停止会阻止后一轮进入。`);
    outer.addEventListener('click', event => {
      cancelSettlement(); const id = token, before = settledChecked;
      lines = [`点击前已稳定的 checked：${before}`];
      // Checkbox pre-activation may toggle before listeners; inspect settled state after dispatch.
      settleTimer = setTimeout(() => {
        settleTimer = null;
        if (disposed || id !== token) return;
        settledChecked = target.checked;
        lines.push(`最终 defaultPrevented：${event.defaultPrevented}`, `默认动作结束后的 checked：${settledChecked}`, '注意：复选框在分发前可能先预切换；取消后恢复，最终状态以这里为准。');
        ui.result(lines.join('\n'));
      }, 0);
    }, {capture:true, signal});
    for (const node of [outer, inner, target]) {
      for (const capture of [true, false]) {
        if ((phase === 'bubble' && capture) || (phase === 'capture' && !capture)) continue;
        node.addEventListener('click', event => {
          const stage = {1:'捕获阶段',2:'目标阶段',3:'冒泡阶段'}[event.eventPhase];
          const actions = [];
          if (prevent && event.currentTarget === target) { event.preventDefault(); actions.push('preventDefault'); }
          if ((stop === 'target' && event.currentTarget === target) || (stop === 'inner' && event.currentTarget === inner)) { event.stopPropagation(); actions.push('stopPropagation'); }
          lines.push(`${lines.length}. ${stage} / ${capture ? '捕获监听器' : '冒泡监听器'}：target=${name(event.target)}，currentTarget=${name(event.currentTarget)}${actions.length ? ' → ' + actions.join(' + ') : ''}`);
          ui.result(lines.join('\n'));
        }, {capture, signal});
      }
    }
    ui.result(`当前 checked：${target.checked}。先预测哪些监听器会收到事件，以及最终是否选中。`);
  };
  for (const control of ['phase','stop','prevent']) ui.on(ui.$(`[data-${control}]`), 'change', configure);
  ui.on(ui.$('[data-click]'), 'click', () => target.click());
  ui.on(ui.$('[data-reset]'), 'click', () => { cancelSettlement(); target.checked = false; settledChecked = false; ui.result('已恢复未选中。属性赋值不会自动触发 click。'); });
  configure(); return () => { disposed = true; cancelSettlement(); if (eventsController) eventsController.abort(); ui.destroy(); };
}

export const javascriptLabs = [
  {
    id:'js-coercion', category:'JavaScript', title:'类型转换：值与类型一起看', minutes:5,
    summary:'比较字符串拼接、数值转换、短路、包装对象和相等规则。',
    goal:'能逐步解释结果的值和 typeof，而不是只记一组答案。',
    predict:'[] == false 与 Boolean([]) 会不会得出相同真假？为什么？',
    refs:[ref('jsadvanced',47,49,'运算符、隐式转换与相等'),ref('jsbasics',24,24,'原始类型与 typeof')],
    explanation:['先按运算符决定采用哪条转换规则，再计算值，最后问结果本身是什么类型。宽松相等的转换和 Boolean 的转换是不同算法，不能互相套用。','数组和普通对象在布尔上下文为真，但比较对象时还可能发生转原始值；两个对象相互比较则通常关注身份。?? 与 Object.is 的选项作为细节拓展。'],
    challenges:[{prompt:'为什么 typeof null 的实验结果类型还是 string？',answer:'表达式 typeof null 返回文字 "object"，因此这个返回值自身的类型为 string。'},{prompt:'1+2+"3" 与 "1"+2+3 各得什么？',answer:'分别是字符串 "33" 和 "123"，因为加法按左结合逐步计算。'}],
    mount(root) { return selectedDemoMount(root, coercions.map(([title, calculate, why]) => ({title,code:`const value = ${title};\nconsole.log(value, typeof value);`,run(log){const value=calculate();log(value,typeof value);},why})), '选择表达式'); }
  },
  {
    id:'js-scope', category:'JavaScript', title:'作用域与闭包：名字究竟指向谁', minutes:6,
    summary:'比较 var、let、const、暂时性死区和循环闭包。',
    goal:'区分函数作用域、块作用域、初始化时机与回调保存的绑定。',
    predict:'循环结束后再执行三个回调，var 与 let 会各自输出什么？',
    refs:[ref('jsbasics',31,32,'变量作用域与 TDZ'),ref('jsadvanced',63,63,'闭包')],
    explanation:['作用域决定名字在哪里可见，初始化规则决定此时能不能读取。var 的 undefined 和 let/const 的 ReferenceError 不是随机差异。','闭包保留访问变量绑定的能力，不只是把当时的数字复制进函数。var 循环共享绑定，let 循环会产生每轮对应的绑定；const for...of 则每轮初始化新绑定。'],
    challenges:[{prompt:'为什么 TDZ 预设报错后还能输出 7？',answer:'示例显式使用 try/catch 捕获了第一次读取错误；未捕获的异常会中断当前执行路径。'},{prompt:'const 对象和 const 数字的共同限制是什么？',answer:'都不能给该绑定重新赋值；对象内部能否修改是另一件事。'}],
    mount(root) { return selectedDemoMount(root, scopeCases, '选择作用域实验'); }
  },
  {
    id:'js-references', category:'JavaScript', title:'对象引用：改内容还是换指向', minutes:5,
    summary:'观察共享对象、参数重新赋值、浅拷贝与 const 的真实结果。',
    goal:'能画出变量指向的对象，解释哪些修改会被外部观察到。',
    predict:'函数先改 item.score，再令 item 指向新对象，外面的 original 会变成哪个对象？',
    refs:[ref('jsadvanced',43,44,'传值与对象身份'),ref('jsbasics',37,37,'嵌套对象')],
    explanation:['JavaScript 参数按值传递。对象参数得到的是引用值的副本，所以可以改到共享对象，却不能靠重新赋参数替换调用者的变量。','展开语法的浅拷贝只复制一层属性。顶层分开以后，嵌套属性如果仍引用同一个对象，内部修改依然会同时被两边观察到；浅拷贝属于对课件引用模型的延伸。'],
    challenges:[{prompt:'为什么浅拷贝后改 score 不影响原对象，改 nested.count 却影响？',answer:'score 是复制过来的数值；nested 是复制过来的引用值，仍指向同一个嵌套对象。'},{prompt:'const 能阻止 original.score += 1 吗？',answer:'不能。这只改对象字段，不给 original 绑定重新赋值。'}],mount:mountReferences
  },
  {
    id:'js-arrays', category:'JavaScript', title:'数组方法：返回值与原数组分两栏', minutes:5,
    summary:'输入数字，比较 map/filter/reduce 与 push/pop/reverse/sort/concat。',
    goal:'分别判断方法返回什么、原数组是否变化、返回的是否仍是同一数组。',
    predict:'push 返回新数组，还是新长度？reverse 返回一份副本吗？',
    refs:[ref('jsbasics',33,36,'数组、遍历与原地修改'),ref('jsadvanced',63,63,'map 与 reduce')],
    explanation:['方法名不能代替返回值分析。push 和 pop 会修改原数组，但分别返回长度和被移除项；reverse、sort 则返回原数组本身。','本实验只使用数字与不修改外部状态的回调。map/filter 产生新数组，reduce 累加成一个值，concat 产生追加后的数组；不能把这种结论扩张成所有自定义回调都没有副作用。'],
    challenges:[{prompt:'空数组 pop 与带初值的 reduce 分别返回什么？',answer:'pop 返回 undefined；reduce 返回给定初值。'},{prompt:'为什么排序提供 (a,b)=>a-b？',answer:'它按数字大小比较，避免默认按字符串表示排序导致 10 排在 2 前面。'}],mount:mountArrays
  },
  {
    id:'js-regex', category:'JavaScript', title:'正则实验：匹配结果与 lastIndex', minutes:7,
    summary:'修改模式、flags、输入和操作，真实观察捕获、替换以及全局搜索状态。',
    goal:'能区别 test、exec、match、replace 的返回形式，并解释 g/y 的状态变化。',
    predict:'对同一个全局正则连续点 exec，第二次会从哪里开始？找不到后 lastIndex 又是多少？',
    refs:[ref('jsadvanced',50,58,'正则、捕获、标志与校验')],
    explanation:['exec 成功返回完整匹配与捕获组，test 返回布尔；带 g/y 的两种调用会更新 lastIndex，失败时会重置。换操作后仍使用同一个正则对象，才能看清状态。','match 带 g 时收集完整匹配，replace 根据 $1 等捕获生成新字符串。自定义表达式在 Worker 内执行并设置超时，复杂回溯不会持续占用页面主线程。'],
    challenges:[{prompt:'为什么 /\\w+\\s/g 不匹配最后没有空格的 fum？',answer:'模式要求单词后必须还有空白，最后一个单词不满足整个模式。'},{prompt:'电话模式的 \\1 与 [-.] 有什么区别？',answer:'\\1 要求与第一捕获组的具体分隔符相同；再写 [-.] 则允许换成集合里的另一种字符。'}],mount:mountRegex
  },
  {
    id:'js-event-loop', category:'JavaScript', title:'事件循环：真实运行同步、微任务与定时器', minutes:6,
    summary:'用三段有限程序观察 Promise、async/await 和 setTimeout 的先后顺序。',
    goal:'从当前调用栈与后续任务解释日志顺序，而不是把异步当成同时执行。',
    predict:'setTimeout(...,0) 写在 Promise.then 前面，哪一个回调先运行？',
    refs:[ref('jsbasics',3,3,'引擎与事件循环'),ref('jsbasics',6,6,'阻塞与异步机制'),ref('json',24,24,'等待 Promise 结果')],
    explanation:['当前同步代码先完成，Promise 回调在微任务检查点处理，定时器回调则作为后续任务运行。零毫秒不意味着打断当前同步执行。','微任务和 async/await 的具体调度作为课件理解拓展。这里只比较同一段受控程序，不把显示的毫秒数当作固定保证；切换实验或离开页面会取消定时器并忽略旧微任务输出。'],
    challenges:[{prompt:'为什么 await Promise.resolve() 之后的日志仍在调用者后面？',answer:'await 会暂停该 async 函数的后续部分，即使 Promise 已完成，也要让出当前同步路径再恢复。'},{prompt:'微任务里又排一个微任务，它一定要等下一次定时器之后吗？',answer:'不用；同一微任务检查点会继续处理新加入的微任务，然后才有机会执行下一任务。'}],mount:mountEventLoop
  },
  {
    id:'dom-tree', category:'DOM', title:'DOM 树：文本、元素、移动与复制', minutes:7,
    summary:'对真实节点连续执行操作，并同时查看节点身份、childNodes、children 和查询列表。',
    goal:'把树结构、节点对象身份和文本/HTML 解析连接起来。',
    predict:'同一个 p 传给 replaceChildren 两次，会出现一个 p 还是两个？',
    refs:[ref('dom',5,8,'节点树、查询与修改'),ref('dom',19,19,'反转 childNodes'),ref('dom',25,28,'节点类型与空白')],
    explanation:['childNodes 包括文本与注释，children 只包括元素；缩进和换行也能产生节点。输出里的编号代表本次实验中的对象身份，移动保留编号，克隆产生新编号。','textContent 把尖括号当文字，innerHTML 解析预设标记并重建内部子树。实时集合跟着树变化，静态 NodeList 保持查询时的成员，但其中节点本身仍可改变。'],
    challenges:[{prompt:'append 已存在节点为何不增加一个副本？',answer:'一个节点在树里只能有一个位置，append 会移动它。cloneNode 才创建另一个节点对象。'},{prompt:'设置 textContent 后，原先的静态 p 列表为什么还有成员？',answer:'静态查询结果不会自动删去成员，仍保留原节点引用，即使它们已脱离预览树。'}],mount:mountTree
  },
  {
    id:'dom-events', category:'DOM', title:'DOM 事件：传播路径与默认动作', minutes:7,
    summary:'点击嵌套复选框，观察捕获、目标、冒泡以及是否真正取消选中变化。',
    goal:'区分 target/currentTarget、传播控制和默认行为取消。',
    predict:'stopPropagation 会不会阻止复选框选中？preventDefault 会不会让外层监听器收不到事件？',
    refs:[ref('jsbasics',13,14,'事件入口与常见事件'),ref('jsadvanced',35,36,'监听器与事件日志'),ref('jsadvanced',58,58,'取消默认提交行为')],
    explanation:['target 是最初的目标，currentTarget 是当前正在运行监听器的节点；到外层监听器时，target 仍是那个复选框。捕获阶段的完整路径和阶段编号是理解课件的拓展。','preventDefault 请求取消可取消事件的默认动作，不停止传播；stopPropagation 不取消默认动作，也不中断同一轮的监听器队列。不过目标捕获与目标冒泡会分两轮调用：在目标捕获中停止，后面的目标冒泡组也不会进入。若在内层捕获阶段就停止，目标监听器根本没有机会取消默认动作。'],
    challenges:[{prompt:'目标捕获监听器 stopPropagation 后，本实验的目标冒泡监听器还会运行吗？',answer:'不会。两组在不同遍历阶段调用；stopPropagation 不打断同一轮内其余监听器，但会阻止之后的调用轮次。stopImmediatePropagation 则连当前轮的其余监听器也停止。'},{prompt:'为什么最终 checked 要等事件分发完再观察？',answer:'复选框可能先做预激活切换；若 click 被取消，浏览器随后恢复状态。实验在后续定时器任务中读取最终状态，避免把监听器之间的中间状态当作结果。'}],mount:mountEvents
  }
];
