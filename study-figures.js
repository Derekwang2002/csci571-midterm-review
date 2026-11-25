// The values in the timing figures are teaching assumptions, in milliseconds.
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => (
  {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]
));
const inline = text => escapeHtml(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');

export function renderFlow(figure) {
  if (!figure) return '';
  const nodes = figure.steps.map(step =>
    `<li><strong>${inline(step.label)}</strong><span>${inline(step.detail)}</span></li>`
  ).join('');
  return `<figure class="concept-flow"><figcaption>${inline(figure.title)}</figcaption><ol>${nodes}</ol><p>${inline(figure.caption)}</p></figure>`;
}

const figures = {
  ajax: {
    title:'点「刷新菜单」后，屏幕上有什么？',
    setup:'页面保留旧菜单，只在收到并解析新菜单后替换列表。切换网络状态，看同一块界面如何变化。',
    cases:[
      {name:'等待响应', steps:[['浏览器','发出请求'],['服务器','正在查菜单'],['屏幕','旧菜单 · 刷新中']], result:'发出请求后，事件处理器就能交还控制权。等待期间，浏览器仍有机会处理滚动和点击。'},
      {name:'成功返回', steps:[['浏览器','收到 200'],['程序','解析 JSON'],['屏幕','显示新菜单']], result:'收到 HTTP 响应、读完正文、更新 DOM 是三件事。界面在更新 DOM 后才切换。'},
      {name:'返回 404', steps:[['浏览器','收到 404'],['程序','检查 response.ok'],['屏幕','旧菜单 · 提示失败']], result:'404 也是一个 HTTP 响应。这里由程序检查状态并保留旧列表；fetch 本身通常会给出 Response。'}
    ],
    url:'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', source:'MDN · Using Fetch'
  },
  cache: {
    title:'再打开同一张菜单图片，要等多久？',
    setup:'浏览器已存有图片和 ETag，max-age 为 60 秒。假设一次网络往返要 80 ms，传完整张图另需 120 ms，忽略本地读取和处理时间。',
    scale:200,
    cases:[
      {name:'30 秒后', bars:[['网络往返',0],['图片正文',0]], result:'0 ms 网络等待。缓存仍然新鲜，在这个例子里浏览器直接使用本地图片。'},
      {name:'90 秒后 · 图片未变', bars:[['网络往返',80],['图片正文',0]], result:'80 ms。浏览器带上 ETag 询问服务器，304 表示已有表示仍可使用，省去了正文传输。'},
      {name:'90 秒后 · 图片更新', bars:[['网络往返',80],['图片正文',120]], result:'200 ms。旧标签与新图不匹配，服务器用 200 返回新图片，浏览器还要等正文传完。'}
    ],
    url:'https://www.rfc-editor.org/rfc/rfc9111.html', source:'RFC 9111 · HTTP Caching'
  },
  lambda: {
    title:'同一个函数，为什么两次等待时间会不同？',
    setup:'假设初始化运行环境需要 90 ms，处理一份订单需要 30 ms。图中只计算这两项。',
    scale:120,
    cases:[
      {name:'新建环境', bars:[['初始化',90],['处理订单',30]], result:'120 ms。平台先准备环境并完成初始化，然后才调用处理函数。'},
      {name:'复用就绪环境', bars:[['初始化',0],['处理订单',30]], result:'30 ms。这个已初始化的环境可直接处理事件。下一次调用可能换到另一个环境，因此订单要保存在持久存储中。'}
    ],
    url:'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html', source:'AWS · Lambda 运行环境'
  },
  access: {
    title:'已经登录，能读这张订单吗？',
    setup:'餐厅规定顾客只能读自己的订单。服务器收到请求后，要分别回答两个问题。',
    cases:[
      {name:'小林读自己的订单', steps:[['认证','会话有效 · 小林'],['授权','订单属于小林'],['响应','返回订单']], result:'身份已确认，订单归属也符合规则，服务器可以返回这张订单。'},
      {name:'小林读别人的订单', steps:[['认证','会话有效 · 小林'],['授权','订单属于小周'],['响应','拒绝读取']], result:'登录成功只回答了「你是谁」。只有服务端核对具体订单的归属，才能决定能否返回数据。'},
      {name:'访客读订单', steps:[['认证','没有有效身份'],['授权','缺少顾客身份'],['响应','要求登录']], result:'服务端无法确认来访者是谁，因此不能把这张私人订单交给对方。'}
    ],
    url:'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html', source:'OWASP · Authorization'
  }
};

// PDF positions tie the same worked example to the chapter and its reader page.
const examples = {ajax:[28,'ajax'],performance:[50,'cache'],highperformance:[23,'cache'],lambda:[30,'lambda'],intrusion:[51,'access']};

function scenarioBody(spec, index) {
  const state = spec.cases[index];
  let graphic;
  if (state.bars) {
    const total = state.bars.reduce((sum, [,duration]) => sum + duration, 0);
    const segments = state.bars.map(([,ms], i) =>
      `<i class="timing-segment segment-${i}" style="width:${ms/spec.scale*100}%"></i>`
    ).join('');
    const legend = state.bars.map(([label,ms], i) =>
      `<span><i class="swatch segment-${i}"></i>${label} <b>${ms} ms</b></span>`
    ).join('');
    graphic = `<div class="timing-total"><span>合计</span><strong>${total} <small>ms</small></strong></div><div aria-hidden="true" class="timing-track">${segments}</div><div class="timing-scale"><span>0 ms</span><span>${spec.scale} ms</span></div><div class="timing-legend">${legend}</div>`;
  } else {
    graphic = '<ol class="scenario-path">'+state.steps.map(([who,what])=>
      `<li><small>${who}</small><strong>${what}</strong></li>`).join('')+'</ol>';
  }
  return `${graphic}<p class="scenario-result">${state.result}</p>`;
}

export function renderScenario(deck, pages) {
  const match = examples[deck];
  if (!match || !pages.includes(match[0])) return '';
  const id = match[1], spec = figures[id];
  const choices = spec.cases.map((state,index) =>
    `<button type="button" data-case="${index}" aria-pressed="${index===0}">${state.name}</button>`
  ).join('');
  return `<figure class="scenario" data-scenario="${id}"><figcaption>${spec.title}</figcaption><p class="scenario-setup">${spec.setup}</p><div class="scenario-options" role="group" aria-label="选择情境">${choices}</div><div class="scenario-output" aria-live="polite">${scenarioBody(spec,0)}</div><a class="scenario-source" href="${spec.url}" target="_blank" rel="noopener noreferrer">${spec.source} ↗</a></figure>`;
}

export function selectScenario(button) {
  const figure = button.closest('[data-scenario]');
  if (!figure) return;
  const index = Number(button.dataset.case);
  figure.querySelectorAll('[data-case]').forEach(option =>
    option.setAttribute('aria-pressed',String(option===button)));
  figure.querySelector('.scenario-output').innerHTML = scenarioBody(figures[figure.dataset.scenario],index);
}
