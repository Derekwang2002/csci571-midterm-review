const q = (root, selector) => root.querySelector(selector);
const qa = (root, selector) => [...root.querySelectorAll(selector)];
const pretty = value => JSON.stringify(value, null, 2);

function mountForms(root) {
  root.innerHTML = `
    <div class="experiment-grid">
      <div class="experiment-controls">
        <fieldset>
          <legend>改变 student 控件的属性</legend>
          <label class="lab-inline"><input type="checkbox" data-option="named" checked> 有 name="student"</label>
          <label class="lab-inline"><input type="checkbox" data-option="disabled"> disabled</label>
          <label class="lab-inline"><input type="checkbox" data-option="readonly"> readonly</label>
          <label class="lab-inline"><input type="checkbox" data-option="required" checked> required</label>
        </fieldset>
        <label for="data-form-method">模拟 HTTP 方法</label>
        <select id="data-form-method"><option>GET</option><option>POST</option></select>
        <form data-demo-form novalidate autocomplete="off">
          <label for="data-form-student">姓名（student）</label>
          <input id="data-form-student" name="student" value="Derek" required>
          <label for="data-form-email">邮箱（email，type="email"，required）</label>
          <input id="data-form-email" type="email" name="email" value="student@example.com" required>
          <label class="lab-inline"><input type="checkbox" name="newsletter" value="yes" checked> 订阅通知（newsletter=yes）</label>
          <fieldset>
            <legend>复习主题（两个 checkbox 共用 name="topic"）</legend>
            <label class="lab-inline"><input type="checkbox" name="topic" value="HTML" checked> HTML</label>
            <label class="lab-inline"><input type="checkbox" name="topic" value="CSS"> CSS</label>
          </fieldset>
          <label for="data-form-days">复习日期（name="day"，multiple）</label>
          <select id="data-form-days" name="day" multiple size="3">
            <option value="Mon" selected>星期一</option><option value="Tue">星期二</option><option value="Wed" selected>星期三</option>
          </select>
          <p class="lab-note">多选可使用 Ctrl / Command 点击；键盘也可使用方向键配合 Shift。以当前设备的原生选择控件为准。</p>
          <label for="data-form-note">备注（观察空格、&amp; 和 + 的编码）</label>
          <input id="data-form-note" name="note" value="A &amp; B + C">
          <input type="hidden" name="course" value="CSCI 571">
          <p class="lab-note">表单还包含一个隐藏字段：course=CSCI 571。实验按钮没有 name，因此不成为提交字段。即使按钮有 name，new FormData(form) 也不会自动纳入它；需要 new FormData(form, event.submitter) 才会考虑本次提交按钮。</p>
          <div class="lab-actions"><button type="submit" class="primary">检查并生成数据</button><button type="button" data-reset>恢复默认</button></div>
        </form>
      </div>
      <div class="experiment-preview">
        <p class="lab-note">点击按钮后调用原生 checkValidity() 和 FormData。这里只显示数据，submit 事件始终 preventDefault()。</p>
        <pre class="lab-code" data-code></pre>
        <pre class="lab-result" data-result aria-live="polite">先预测哪些字段会出现，然后点击“检查并生成数据”。</pre>
      </div>
    </div>`;
  const form = q(root, '[data-demo-form]');
  const student = q(root, '#data-form-student');
  const method = q(root, '#data-form-method');
  const result = q(root, '[data-result]');
  const option = name => q(root, `[data-option="${name}"]`);
  function sync() {
    if (option('named').checked) student.name = 'student';
    else student.removeAttribute('name');
    student.disabled = option('disabled').checked;
    student.readOnly = option('readonly').checked;
    student.required = option('required').checked;
    form.method = method.value.toLowerCase();
    q(root, '[data-code]').textContent = [
      '// novalidate 让 submit 事件进入演示处理器；校验由代码显式执行。',
      'form.addEventListener("submit", event => {',
      '  event.preventDefault();',
      '  const valid = form.checkValidity();',
      '  const data = new FormData(form);',
      '  // 有 name 的提交按钮需传第二参数 event.submitter 才会被考虑。',
      '  const pairs = [...data.entries()];',
      '  const topics = data.getAll("topic");',
      '  const encoded = new URLSearchParams(data).toString();',
      '  // 这里只展示；不调用 fetch，也不真正提交。',
      '});',
      '',
      `// student：name=${student.hasAttribute('name') ? '"student"' : '无'}，disabled=${student.disabled}`,
      `// readonly=${student.readOnly}，required=${student.required}，willValidate=${student.willValidate}`
    ].join('\n');
  }
  function markStale() {
    sync();
    result.className = 'lab-result';
    result.textContent = '控件已改变。先预测结果，再点击“检查并生成数据”查看当前快照。';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    sync();
    const valid = form.checkValidity();
    const data = new FormData(form);
    const pairs = [...data.entries()];
    const encoded = new URLSearchParams(data).toString();
    const invalid = [...form.elements].filter(control => control.willValidate && !control.validity.valid);
    const status = invalid.map(control => {
      const flags = ['valueMissing', 'typeMismatch', 'patternMismatch', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'tooLong', 'tooShort', 'badInput', 'customError']
        .filter(flag => control.validity[flag]);
      return `${control.name || control.id}：${flags.join(', ')}\n  ${control.validationMessage}`;
    });
    const request = method.value === 'GET'
      ? `GET /submit?${encoded} HTTP/1.1\nHost: example.com\n\n（此示意请求没有表单请求体）`
      : `POST /submit HTTP/1.1\nHost: example.com\nContent-Type: application/x-www-form-urlencoded\n\n${encoded}`;
    result.className = `lab-result${valid ? '' : ' error'}`;
    result.textContent = [
      `form.checkValidity() → ${valid}`,
      `student.willValidate → ${student.willValidate}`,
      valid ? '当前参与校验的控件均通过。' : `校验未通过：\n${status.join('\n')}`,
      '',
      'new FormData(form) 的条目（同名字段保留多条）：',
      pretty(pairs),
      `getAll("topic") → ${pretty(data.getAll('topic'))}`,
      `getAll("day") → ${pretty(data.getAll('day'))}`,
      '',
      `若用 ${method.value} 和默认表单编码构造请求，数据位置如下：`,
      request,
      '',
      valid ? '以上仅为快照，没有发送网络请求。' : 'FormData 构造器本身不执行约束校验，非法值也可能进入此快照。常规未设 novalidate 的用户提交会被浏览器阻止；本实验只为观察而生成快照，没有发送。'
    ].join('\n');
  });
  qa(root, '[data-option]').forEach(control => control.addEventListener('change', markStale));
  method.addEventListener('change', markStale);
  form.addEventListener('input', markStale);
  form.addEventListener('change', markStale);
  q(root, '[data-reset]').addEventListener('click', () => {
    form.reset();
    option('named').checked = true;
    option('disabled').checked = false;
    option('readonly').checked = false;
    option('required').checked = true;
    method.value = 'GET';
    markStale();
  });
  sync();
}

const jsonPresets = [
  ['对象与数组', '{"course":"CSCI 571","topics":["HTML","CSS"],"ready":true}'],
  ['合法根值：数字', '42'],
  ['合法根值：null', 'null'],
  ['错误：单引号', "{'ready':true}"],
  ['错误：尾随逗号', '{"ready":true,}'],
  ['错误：undefined', '{"value":undefined}'],
  ['错误：NaN', '{"value":NaN}'],
  ['错误：Infinity 字面量', '{"value":Infinity}'],
  ['合法语法但数值溢出', '{"huge":1e400,"negative":-1e400}'],
  ['重复键：实际留下哪个值？', '{"score":60,"score":95}'],
  ['错误：两个根值', '{}{}'],
  ['大整数：注意 Number 精度', '{"id":9007199254740993}']
];

const serializationCases = [
  {
    label: '对象中的 undefined / NaN / Infinity',
    code: 'const source = {keep: 1, missing: undefined, score: NaN, huge: Infinity};\nconst text = JSON.stringify(source);\nconst restored = JSON.parse(text);',
    make: () => ({ keep: 1, missing: undefined, score: NaN, huge: Infinity }),
    note: '对象的 missing 属性被省略；NaN 与 Infinity 变成 null。重新 parse 得不到原来的 undefined、NaN 或 Infinity。'
  },
  {
    label: '数组中的 undefined / NaN / Infinity',
    code: 'const source = [1, undefined, NaN, Infinity];\nconst text = JSON.stringify(source);\nconst restored = JSON.parse(text);',
    make: () => [1, undefined, NaN, Infinity],
    note: '数组位置会保留：这三个值都变成 null，数组长度仍为 4。它与对象成员被省略的规则不同。'
  },
  {
    label: '根值 undefined',
    code: 'const text = JSON.stringify(undefined);\n// text 是 JavaScript 的 undefined，不是字符串 "undefined"。',
    make: () => undefined,
    note: '这里没有生成 JSON 文本，不能把结果当作合法 JSON 字符串继续解析。'
  },
  {
    label: 'reviver：undefined 删除，null 保留',
    code: 'const source = JSON.parse(\'{"keep":1,"drop":2,"nil":3}\', (key, value) => {\n  if (key === "drop") return undefined;\n  if (key === "nil") return null;\n  return value;\n});\nconst text = JSON.stringify(source);',
    make: () => JSON.parse('{"keep":1,"drop":2,"nil":3}', (key, value) => key === 'drop' ? undefined : key === 'nil' ? null : value),
    note: 'reviver 返回 undefined 删除 drop，返回 null 仍保留 nil。不能把“返回 null”当成删除字段。'
  }
];

function numericWarnings(value) {
  const pending = [{ value, path: '$' }];
  const warnings = [];
  while (pending.length) {
    const item = pending.pop();
    if (typeof item.value === 'number') {
      if (!Number.isFinite(item.value)) warnings.push(`${item.path} → ${String(item.value)}：超出 Number 有限范围；stringify 会改为 null。`);
      else if (Number.isInteger(item.value) && !Number.isSafeInteger(item.value)) warnings.push(`${item.path} → ${item.value}：不在安全整数范围，不能保证保留输入整数的每一位。`);
    } else if (item.value !== null && typeof item.value === 'object') {
      for (const [key, child] of Object.entries(item.value)) pending.push({ value: child, path: `${item.path}[${JSON.stringify(key)}]` });
    }
  }
  return warnings;
}

function mountJSON(root) {
  root.innerHTML = `
    <div class="experiment-grid">
      <div class="experiment-controls">
        <label for="data-json-preset">解析预设</label>
        <select id="data-json-preset">${jsonPresets.map((item, index) => `<option value="${index}">${item[0]}</option>`).join('')}</select>
        <label for="data-json-input">JSON 文本（可直接修改，实时解析）</label>
        <textarea id="data-json-input" rows="10" spellcheck="false"></textarea>
        <pre class="lab-code">const value = JSON.parse(text);
const rootType = value === null ? "null"
  : Array.isArray(value) ? "array" : typeof value;
JSON.stringify(value, null, 2);</pre>
      </div>
      <div class="experiment-preview"><pre class="lab-result" data-parse-result aria-live="polite"></pre></div>
    </div>
    <div class="experiment-grid">
      <div class="experiment-controls">
        <label for="data-json-serialize">从 JavaScript 值序列化，再解析回来</label>
        <select id="data-json-serialize">${serializationCases.map((item, index) => `<option value="${index}">${item.label}</option>`).join('')}</select>
        <pre class="lab-code" data-serialize-code></pre>
      </div>
      <div class="experiment-preview"><pre class="lab-result" data-serialize-result aria-live="polite"></pre></div>
    </div>`;
  const input = q(root, '#data-json-input');
  const output = q(root, '[data-parse-result]');
  function parse() {
    let value;
    try {
      value = JSON.parse(input.value);
    } catch (error) {
      output.className = 'lab-result error';
      output.textContent = `非法 JSON\n${error.message}\n\n先检查双引号、逗号、括号和字面量。错误位置与措辞由当前浏览器给出。`;
      return;
    }
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    const warnings = numericWarnings(value);
    let normalized;
    try { normalized = pretty(value); }
    catch { normalized = '解析成功，但嵌套过深，当前浏览器无法把结果格式化显示。'; }
    output.className = 'lab-result';
    output.textContent = [
      `合法 JSON · 根类型：${type}`,
      warnings.length ? `\n数值提醒：\n${warnings.join('\n')}` : '',
      '\nJSON.stringify(value, null, 2) 的结果：',
      normalized,
      '\n重复键提醒：JSON.parse 接受同一对象中的重复成员名，并留下最后一个值。其他解析器未必一致；交换数据时应使用唯一键。'
    ].filter(Boolean).join('\n');
  }
  function serialize() {
    const item = serializationCases[Number(q(root, '#data-json-serialize').value)];
    q(root, '[data-serialize-code]').textContent = item.code;
    const text = JSON.stringify(item.make());
    q(root, '[data-serialize-result]').textContent = text === undefined
      ? `JSON.stringify 的返回值：undefined\n返回类型：undefined\n\n${item.note}`
      : `JSON.stringify 的返回值（字符串内容）：\n${text}\n\nJSON.parse 后再格式化：\n${pretty(JSON.parse(text))}\n\n${item.note}`;
  }
  q(root, '#data-json-preset').addEventListener('change', event => {
    input.value = jsonPresets[Number(event.target.value)][1];
    parse();
  });
  input.addEventListener('input', parse);
  q(root, '#data-json-serialize').addEventListener('change', serialize);
  input.value = jsonPresets[0][1];
  parse();
  serialize();
}

const urlPresets = [
  ['相对路径与默认 HTTPS 端口', 'https://www.usc.edu/dept/cs/index.html', '../index.html?topic=C%2B%2B#section2', 'https://WWW.USC.EDU:443/other'],
  ['只换路径、查询和片段', 'https://example.com/a/b.html', '/news?q=web#top', 'https://example.com/other?id=9#end'],
  ['非默认端口改变来源', 'https://example.com/a/', 'index.html', 'https://example.com:8443/a/index.html'],
  ['HTTP 与 HTTPS', 'https://example.com/a/', 'index.html', 'http://example.com/a/index.html'],
  ['子域名不同', 'https://example.com/a/', 'index.html', 'https://www.example.com/a/index.html'],
  ['HTTP 的显式默认端口', 'http://example.com:80/a/', 'b', 'http://EXAMPLE.COM/b'],
  ['基准地址末尾没有斜杠', 'https://example.com/dir', 'child', 'https://example.com/dir/child'],
  ['基准地址末尾有斜杠', 'https://example.com/dir/', 'child', 'https://example.com/dir/child'],
  ['继承协议的 // 引用', 'https://example.com/a/', '//cdn.example.com/lib.js', 'https://cdn.example.com:443/other.js']
];

function mountURL(root) {
  root.innerHTML = `
    <div class="experiment-grid">
      <div class="experiment-controls">
        <label for="data-url-preset">比较场景</label>
        <select id="data-url-preset">${urlPresets.map((item, index) => `<option value="${index}">${item[0]}</option>`).join('')}</select>
        <label for="data-url-base">基准 URL（绝对 HTTP / HTTPS 地址）</label>
        <input id="data-url-base" type="text" spellcheck="false">
        <label for="data-url-reference">目标引用（可为相对路径或绝对 URL）</label>
        <input id="data-url-reference" type="text" spellcheck="false">
        <label for="data-url-compare">比较地址（相对地址也以同一基准解析）</label>
        <input id="data-url-compare" type="text" spellcheck="false">
        <pre class="lab-code" data-url-code></pre>
      </div>
      <div class="experiment-preview"><pre class="lab-result" data-url-result aria-live="polite"></pre></div>
    </div>`;
  const baseInput = q(root, '#data-url-base');
  const referenceInput = q(root, '#data-url-reference');
  const compareInput = q(root, '#data-url-compare');
  const result = q(root, '[data-url-result]');
  function update() {
    q(root, '[data-url-code]').textContent = `const base = new URL(${JSON.stringify(baseInput.value)});\nconst target = new URL(${JSON.stringify(referenceInput.value)}, base);\nconst other = new URL(${JSON.stringify(compareInput.value)}, base);\nconst sameOrigin = target.origin === other.origin;`;
    try {
      const base = new URL(baseInput.value);
      const target = new URL(referenceInput.value, base);
      const other = new URL(compareInput.value, base);
      if (![base, target, other].every(url => ['http:', 'https:'].includes(url.protocol))) {
        result.className = 'lab-result error';
        result.textContent = '本实验比较 HTTP / HTTPS 来源，请使用这两种协议。data:、file: 等 URL 的 origin 可能为 "null"；两个 "null" 字符串不能据此证明同源。';
        return;
      }
      const effectivePort = url => url.port || (url.protocol === 'https:' ? '443（默认）' : '80（默认）');
      result.className = 'lab-result';
      result.textContent = [
        `解析后的目标：\n${target.href}`,
        `\nscheme：${target.protocol}`,
        `hostname：${target.hostname}`,
        `URL.port：${JSON.stringify(target.port)}（默认端口被规范化为空字符串）`,
        `有效端口：${effectivePort(target)}`,
        `path：${target.pathname}`,
        `query：${target.search || '（无）'}`,
        `fragment：${target.hash || '（无）'}`,
        '\n查询参数解码后（保留重复项）：',
        pretty([...target.searchParams.entries()]),
        `\nHTTP 请求目标示意：${target.pathname}${target.search}`,
        'fragment 不属于此请求目标。',
        `\n比较地址：${other.href}`,
        `目标 origin：${target.origin}`,
        `比较 origin：${other.origin}`,
        `目标 vs 比较地址：${target.origin === other.origin ? '同源' : '不同源'}`,
        `目标 vs 基准地址：${target.origin === base.origin ? '同源' : '不同源'}`,
        '\n这里只解析字符串，没有访问这些地址。同源结果本身不表示资源存在，也不代表服务器是否设置了 CORS 授权。'
      ].join('\n');
    } catch (error) {
      result.className = 'lab-result error';
      result.textContent = `URL 无法解析：${error.message}\n基准地址需包含协议和主机，例如 https://example.com/dir/page.html。`;
    }
  }
  function preset() {
    const [, base, reference, compare] = urlPresets[Number(q(root, '#data-url-preset').value)];
    baseInput.value = base;
    referenceInput.value = reference;
    compareInput.value = compare;
    update();
  }
  q(root, '#data-url-preset').addEventListener('change', preset);
  [baseInput, referenceInput, compareInput].forEach(input => input.addEventListener('input', update));
  preset();
}

const ipv4 = number => [24, 16, 8, 0].map(shift => (number >>> shift) & 255).join('.');
const binaryIPv4 = number => [24, 16, 8, 0].map(shift => ((number >>> shift) & 255).toString(2).padStart(8, '0')).join(' ');
const prefixMask = bits => bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
const subnetPresets = ['74.125.127.104/26', '192.168.1.8/24', '192.168.1.64/26', '192.168.1.127/26', '10.0.0.0/0', '192.0.2.10/31', '192.0.2.10/32'];

function mountSubnet(root) {
  root.innerHTML = `
    <div class="experiment-grid">
      <div class="experiment-controls">
        <label for="data-subnet-preset">例题与边界预设</label>
        <select id="data-subnet-preset">${subnetPresets.map((value, index) => `<option value="${index}">${value}</option>`).join('')}</select>
        <label for="data-subnet-input">IPv4 地址 / CIDR 前缀</label>
        <input id="data-subnet-input" value="74.125.127.104/26" spellcheck="false" aria-describedby="data-subnet-hint">
        <p class="lab-note" id="data-subnet-hint">四段十进制数各为 0–255；斜杠后的前缀为 0–32，例如 192.168.1.8/24。含前导零的段也按十进制解释。</p>
        <label for="data-subnet-parent">可选：把哪个前缀当作父网？</label>
        <select id="data-subnet-parent"><option value="">不计算子网个数</option><option value="8">/8</option><option value="16">/16</option><option value="24">/24</option></select>
        <pre class="lab-code">// /0 必须单独处理：JS 的移位位数会按 32 取模。
const mask = prefix === 0 ? 0
  : (0xffffffff &lt;&lt; (32 - prefix)) &gt;&gt;&gt; 0;
const network = (ip &amp; mask) &gt;&gt;&gt; 0;
const last = (network | ~mask) &gt;&gt;&gt; 0;
const count = 2 ** (32 - prefix);</pre>
      </div>
      <div class="experiment-preview"><pre class="lab-result" data-subnet-result aria-live="polite"></pre></div>
    </div>`;
  const input = q(root, '#data-subnet-input');
  const result = q(root, '[data-subnet-result]');
  function update() {
    const match = input.value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!match || match.slice(1, 5).some(part => Number(part) > 255) || Number(match[5]) > 32) {
      result.className = 'lab-result error';
      result.textContent = '请输入四段 0–255 的 IPv4 地址和 0–32 的前缀，例如 192.168.1.8/24。不要填写负数、小数、缺少斜杠或 /33。';
      return;
    }
    const bits = Number(match[5]);
    const number = match.slice(1, 5).reduce((value, part) => (value * 256 + Number(part)) >>> 0, 0);
    const mask = prefixMask(bits);
    const network = (number & mask) >>> 0;
    const last = (network | ~mask) >>> 0;
    const size = 2 ** (32 - bits);
    const lines = [
      `输入地址  ${ipv4(number)}/${bits}`,
      `网络位    ${bits} 位；主机位 ${32 - bits} 位`,
      `掩码      ${ipv4(mask)}`,
      `IP 二进制 ${binaryIPv4(number)}`,
      `掩码位    ${binaryIPv4(mask)}`,
      `AND 结果  ${binaryIPv4(network)}`,
      `前缀地址  ${ipv4(network)}/${bits}`,
      `地址总数  2^${32 - bits} = ${size}`
    ];
    if (bits <= 30) {
      lines.push(
        `网络地址  ${ipv4(network)}`,
        `广播地址  ${ipv4(last)}`,
        `普通子网可用主机  ${size} - 2 = ${size - 2}`,
        `主机范围  ${ipv4(network + 1)} – ${ipv4(last - 1)}`,
        `输入所处位置  ${number === network ? '网络地址，不是普通主机地址' : number === last ? '广播地址，不是普通主机地址' : '按普通子网位划分，位于主机范围'}`,
        '以上是普通子网公式，未扣除保留或特殊用途地址。'
      );
      if (bits === 0) lines.push('/0 覆盖整个 IPv4 地址空间；4294967294 只是减 2 的算术结果，不表示这些地址都能实际分配为普通主机。');
    } else if (bits === 31) {
      lines.push(`两个端点  ${ipv4(network)} 与 ${ipv4(last)}`, '/31 在支持这种用法的点到点链路中可使用两个地址，不设普通子网意义上的网络/广播保留地址，不套用减 2 公式。');
    } else {
      lines.push(`唯一地址  ${ipv4(network)}`, '/32 表示一个地址或主机路由；没有另一个主机地址，也不套用减 2 公式。');
    }
    const parentValue = q(root, '#data-subnet-parent').value;
    if (parentValue !== '') {
      const parentBits = Number(parentValue);
      if (parentBits > bits) lines.push(`\n所选 /${parentBits} 比 /${bits} 更小，不能作为它的父网；父网前缀必须不大于当前前缀。`);
      else {
        const parent = (number & prefixMask(parentBits)) >>> 0;
        lines.push(`\n指定父网  ${ipv4(parent)}/${parentBits}`, `用于细分的位数  ${bits} - ${parentBits} = ${bits - parentBits}`, `/${bits} 子网个数  2^${bits - parentBits} = ${2 ** (bits - parentBits)}`, '这个子网数依赖你指定的父网，不能仅从主机地址猜出。');
      }
    }
    result.className = 'lab-result';
    result.textContent = lines.join('\n');
  }
  q(root, '#data-subnet-preset').addEventListener('change', event => {
    input.value = subnetPresets[Number(event.target.value)];
    update();
  });
  input.addEventListener('input', update);
  q(root, '#data-subnet-parent').addEventListener('change', update);
  update();
}

export const dataLabs = [
  {
    id: 'html-forms',
    category: 'HTML',
    title: '表单里看得见的值，都会被提交吗？',
    minutes: 8,
    summary: '改变 name、disabled、readonly 与选择状态，观察浏览器实际收集的字段和校验结果。',
    goal: '能从控件的当前状态推出 FormData 条目，解释校验、字段收集与 GET / POST 数据位置的区别。',
    predict: '把姓名设为 readonly 与 disabled，分别会不会保留 student 字段？选中两个 topic 时会出现一项还是两项？',
    refs: [{ deck: 'forms', start: 5, end: 13, label: '表单属性与输入类型' }, { deck: 'forms', start: 18, end: 36, label: 'checkbox、选择框与字段分组' }, { deck: 'forms', start: 37, end: 37, label: 'HTTP 数据位置与编码' }],
    explanation: [
      'FormData 收集的是字段名和值。id 负责标签关联，不能代替 name；没有 name、被 disabled 禁用、或未勾选的 checkbox 都不会贡献这里的字段。readonly 文本框仍可贡献值，但不参加约束校验。多个成功控件共用 name 时会形成多个条目，getAll() 才能完整取回，转成普通对象可能丢掉重复项。本例按钮没有 name；若需收集有 name 的提交按钮，应使用 new FormData(form, event.submitter)，只传 form 不会自动纳入该按钮。',
      'required 检查是否缺值，type="email" 检查基本格式，都不能证明输入在现实中正确。checkValidity() 返回当前校验结果，FormData 构造器却不负责校验。本实验显式取消提交并把两种结果并排显示，让你看到“能收集字段”和“通过校验”是两件事。',
      '这里全部是文本字段，所以可用 URLSearchParams 展示 application/x-www-form-urlencoded。GET 将编码结果放在查询部分，POST 示例放在请求体；空格成为 +，数据本身的 + 成为 %2B，& 成为 %26。普通 HTML 表单不会因为改为 POST 就自动产生 JSON。'
    ],
    challenges: [
      { prompt: '删掉姓名的内容并取消它的 name，但保留 required，会通过校验吗？', answer: '不会。name 决定字段是否被收集，不决定是否校验。这个可编辑、未禁用的 required 输入仍触发 valueMissing；它不会出现在 FormData 中。' },
      { prompt: '姓名为空，同时开启 readonly 与 required，会怎样？', answer: '这个文本框的 willValidate 为 false，不参加约束校验；若仍有 name 且未 disabled，FormData 中仍有 student=""。是否整体通过还取决于邮箱等其他控件。' },
      { prompt: '取消 newsletter，选中两个 topic、两个 day，应该怎样读取结果？', answer: 'newsletter 字段缺席，topic 和 day 各有两条同名记录。使用 data.getAll("topic")、data.getAll("day")；不能期待未勾选项自动变成 false。' }
    ],
    mount: mountForms
  },
  {
    id: 'json-parser',
    category: '数据与网络',
    title: 'JSON 合法，不代表往返后没有损失',
    minutes: 7,
    summary: '实时解析 JSON，区分根类型、语法错误、数值溢出和 stringify 的信息损失。',
    goal: '能判断现代 JSON 的合法文本，并解释 parse / stringify 在 JavaScript 值与 JSON 文本之间的转换。',
    predict: '42、Infinity、1e400 哪些能被 JSON.parse 接受？对象和数组里的 undefined 序列化后是否相同？',
    refs: [{ deck: 'json', start: 4, end: 20, label: 'JSON 值、文法与重复键' }, { deck: 'json', start: 41, end: 43, label: 'parse 与 reviver' }],
    explanation: [
      '现代 JSON 的根可以是任意一个 JSON 值，包括数字、字符串、布尔值和 null；不一定是对象或数组。JSON 文本要遵守自己的文法：字符串和成员名用双引号，没有 undefined、NaN、Infinity 字面量，也不能在最后一个成员后加逗号。浏览器的解析成功只证明语法被接受。',
      '1e400 符合 JSON 数字文法，但超出 JavaScript Number 的有限范围，parse 会得到 Infinity。再次 stringify 时它变成 null，说明“合法文本”不等于“运行时精确保存”。重复键在本浏览器中保留最后一个值，也不代表所有解析器都作同样处理。',
      'JSON 不能保存所有 JavaScript 值。对象属性值为 undefined 时被省略，数组成员为 undefined 时变成 null；NaN、Infinity 也变成 null。reviver 是另外一个转换阶段：返回 undefined 删除成员，返回 null 保留成员并把值设为 null。'
    ],
    challenges: [
      { prompt: '输入 "false" 与 false，根类型各是什么？', answer: '带双引号的是 string，不带双引号的是 boolean。解析后的非空字符串 "false" 在 JavaScript 条件判断中仍为真。' },
      { prompt: '{"score":60,"score":95} 能解析吗？为什么不应依赖这种写法？', answer: 'JSON.parse 接受，并留下 score:95。重复成员名会损害跨实现的一致性，交换数据时应让同一对象中的键唯一。' },
      { prompt: 'JSON.stringify({x:undefined,y:NaN}) 再 parse 后得到什么？', answer: '{"y":null}。x 被省略，y 从 NaN 变成 null，不能还原原对象。' }
    ],
    mount: mountJSON
  },
  {
    id: 'url-origin',
    category: '数据与网络',
    title: '先解析 URL，再判断是否同源',
    minutes: 6,
    summary: '改变相对引用、协议、主机和端口，让 URL API 展示规范化地址与 origin。',
    goal: '能解析相对 URL，区分路径、查询、片段，并用协议、主机、有效端口判断 HTTP(S) 同源。',
    predict: 'https://example.com 与 https://EXAMPLE.COM:443/a 同源吗？把基准 /dir 改成 /dir/，child 的完整路径会不会变？',
    refs: [{ deck: 'html', start: 51, end: 52, label: 'URL 结构与相对引用' }, { deck: 'json', start: 32, end: 32, label: '同源比较' }, { deck: 'web', start: 57, end: 58, label: '端口与百分号编码' }],
    explanation: [
      '相对路径必须结合基准地址。基准为 /dir/page.html 时，child 替换最后一个路径段，得到 /dir/child；基准为 /dir/ 时，child 接在目录后；基准为 /dir 时，最后一段会被替换而得到 /child。用 new URL(reference, base) 可以看到浏览器实际解析的结果。',
      '常见 HTTP(S) 来源由协议、主机与有效端口组成，路径、查询和片段不参与比较。URL API 会把主机名规范化，并省略协议的默认端口，所以 HTTPS 的显式 :443 与省略端口得到相同 origin；:8443 则不同。子域名不同也意味着主机不同。',
      '查询与片段不是一回事：? 后的内容属于查询，# 后的内容由客户端解释，不放进这里展示的 HTTP 请求目标。URLSearchParams 解码时 + 可表示空格，%2B 才表示真正的加号。同源策略的比较结果也不能直接回答“能不能发送请求”或“服务器是否允许脚本读取响应”。'
    ],
    challenges: [
      { prompt: '基准 https://a.test/x/y.html，引用 ../z?q=1#top 的目标与请求目标分别是什么？', answer: '完整 URL 为 https://a.test/z?q=1#top；HTTP 请求目标为 /z?q=1，片段 #top 不包含在其中。' },
      { prompt: 'https://a.test:443/x 与 https://a.test/y 同源吗？与 http://a.test:443/x 呢？', answer: '前一组同源，443 是 HTTPS 默认端口。后一组不同源，因为协议不同；给 HTTP 指定 443 端口不会把它变成 HTTPS。' },
      { prompt: 'URL 路径不同，是否意味着跨源？', answer: '不一定。HTTP(S) 的 origin 比较不包含路径、查询或片段；应先比较协议、主机和有效端口。' }
    ],
    mount: mountURL
  },
  {
    id: 'ipv4-subnet',
    category: '数据与网络',
    title: '把 CIDR 子网计算拆成每一位',
    minutes: 7,
    summary: '观察逐位 AND、掩码、广播与主机范围，再比较 /0、/31、/32 边界。',
    goal: '能从 IPv4 / 前缀推出地址区间，并说明主机数公式与父网假设的适用条件。',
    predict: '74.125.127.104/26 的最后一个八位组落在哪个 64 地址块？/31 是否也要从两个地址中减去两个？',
    refs: [{ deck: 'http', start: 73, end: 73, label: '74.125.127.104/26 子网例题' }],
    explanation: [
      'IPv4 有 32 位，/26 表示前 26 位为前缀，剩下 6 位可变化，所以共有 2^6=64 个地址。把地址与掩码逐位 AND，会清空主机位而得到区间起点。例题的掩码是 255.255.255.192，104 所在的最后字节区间是 64–127。',
      '普通子网把主机位全 0 用作网络地址，全 1 用作广播地址，因此本例可用范围是 .65–.126，共 62 个。这个减 2 公式有适用条件：/31 可用于两个端点的点到点链路，/32 表示单个地址或主机路由；/0 包含整个 IPv4 空间，普通减 2 的算术结果也不能当成实际可分配地址数。',
      '“子网有多少个”还需要父网。把一个 /8 划成 /26，增加 18 位前缀，得到 2^18 个 /26；把 /24 划成 /26，只有 2^2=4 个。实际所属子网始终按题目给定的 /26 计算，不能用父网地址代替它。'
    ],
    challenges: [
      { prompt: '本例为何不是 74.0.0.0/8？', answer: '题目给的是 /26，实际子网是 74.125.127.64/26。74.0.0.0/8 只能是在另行指定 /8 父网时的父网地址。' },
      { prompt: '将输入改为 192.168.1.127/26，这个地址能作普通主机吗？', answer: '不能。其 /26 区间为 .64–.127，.127 的 6 位主机位全为 1，是该普通子网的广播地址。' },
      { prompt: '/31 和 /32 为什么不能机械套用 2^(32-prefix)-2？', answer: '/31 在点到点用法中两个地址都用于端点；/32 只有一个地址，用来表示主机或主机路由。它们不按普通子网保留网络与广播地址的方式解释。' }
    ],
    mount: mountSubnet
  }
];
