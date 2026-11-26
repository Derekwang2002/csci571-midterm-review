const ajaxPrediction = {
  id: 'ajax-response-order',
  category: 'AJAX',
  title: '两次搜索之后，候选框里是哪一道菜？',
  minutes: 4,
  summary: '改变两份搜索结果的返回顺序，追踪每次回调对同一个候选框的写入。',
  goal: '根据请求的开始和完成时间、当前输入与回调条件，判断最终显示哪份建议。',
  predict: '两次请求都成功返回后，候选框留着哪个关键词的结果？',
  setup: '这是每次输入都向服务器查询的变体。0 ms 输入「面」，请求 A；40 ms 时改成「面包」，请求 B。B 耗时固定为 60 ms。输入框最后停在「面包」，两个响应都带着各自的关键词。',
  refs: [{deck: 'ajax', start: 13, end: 16, label: '异步交互的时间线与客户端处理'}],
  explanation: [
    '每个响应的完成时刻等于发出时刻加上它自己的耗时。两个请求同时在途时，发起顺序不足以决定回调顺序。',
    '候选框只保留最后一次被允许写入的结果。和当前输入比对关键词，可以处理本例的两种不同查询；同一个关键词反复出现时，递增的请求序号还能区分批次。'
  ],
  challenges: [{
    prompt: '为什么课件中一次下载全部州名、此后仅本地过滤的补全例子，连续按键时没有这两份远端搜索结果的竞争？',
    answer: '州名只在初始化时取一次。列表准备好以后，每次按键直接过滤内存数组，不会为这两个前缀分别启动网络请求。'
  }],
  controls: [
    {key: 'firstDuration', label: 'A 的网络耗时', options: [['180', '180 ms'], ['70', '70 ms']]},
    {key: 'callback', label: '响应回调的写入规则', options: [['all', '每次回调都写入'], ['matching', '只写入与当前输入匹配的响应']]}
  ],
  answers: [['noodle', '「面」的结果：牛肉面'], ['bread', '「面包」的结果：法棍']],
  observe({firstDuration, callback}) {
    const responses = [
      {id: 'noodle', name: 'A', query: '面', dish: '牛肉面', start: 0, duration: Number(firstDuration)},
      {id: 'bread', name: 'B', query: '面包', dish: '法棍', start: 40, duration: 60}
    ];
    const finish = request => request.start + request.duration;
    const timeline = responses.map(request => ({
      label: `请求 ${request.name} · ${request.query}`, start: request.start, end: finish(request)
    }));
    responses.sort((a, b) => finish(a) - finish(b));
    let displayed;
    const rows = responses.map(request => {
      const time = finish(request);
      const input = time < 40 ? '面' : '面包';
      const accepted = callback === 'all' || request.query === input;
      if (accepted) displayed = request;
      const reason = callback === 'all' ? '规则允许每个成功回调写入。' :
        `当前输入是「${input}」，与响应关键词「${request.query}」${accepted ? '相同' : '不同'}。`;
      return [
        `${time} ms · ${request.name} 返回`,
        accepted ? `候选框写入「${request.dish}」` : `跳过「${request.dish}」，保留已有内容`,
        `${request.start} + ${request.duration} = ${time} ms。${reason}`
      ];
    });
    rows.push(['两个回调结束', `输入「面包」；候选框显示「${displayed.dish}」`, `最后一次实际写入来自请求 ${displayed.name}，关键词为「${displayed.query}」。`]);
    return {answer: displayed.id, rows, timeline};
  }
};

const serverPrediction = {
  id: 'servers-virtual-host',
  category: 'Web 服务器',
  title: '同一台服务器会送来哪家店的菜单？',
  minutes: 3,
  summary: '给定两个名称虚拟主机和实际文件，沿主机名与 URL 路径找出 HTTP 响应。',
  goal: '从请求主机名选出 DocumentRoot，再在该站点内查找资源。',
  predict: '浏览器最终会收到什么？',
  setup: '两个站点共用一个 IP 和端口。cafe.example 的文档根 /srv/cafe 只有 menu.txt（咖啡）；tea.example 的文档根 /srv/tea 有 menu.txt（红茶）和 special.txt（桂花乌龙）。按普通静态文件映射处理，没有重写、别名或缓存。',
  refs: [
    {deck: 'servers', start: 11, end: 13, label: 'DocumentRoot、目录树与虚拟主机'},
    {deck: 'servers', start: 46, end: 47, label: '按主机名选择站点'}
  ],
  explanation: [
    'IP 和端口把连接送到监听服务。名称虚拟主机继续查看请求的主机名，才能知道应使用哪个站点的配置。',
    '选中站点后，静态路径相对于该站点的文档根解析。一个站点缺少文件，即使同一台机器上的另一个站点有同名文件，也不会自动改去另一站取。'
  ],
  challenges: [{
    prompt: '两家店都新增了 /hours.txt，两个域名会因此返回完全相同的时间表吗？',
    answer: '要看各自文档根下 hours.txt 的内容。URL 路径相同，只说明两边请求的相对文件名相同。'
  }],
  controls: [
    {key: 'host', label: 'HTTP 请求主机名', options: [['tea.example', 'tea.example'], ['cafe.example', 'cafe.example']]},
    {key: 'path', label: 'URL 路径', options: [['/menu.txt', '/menu.txt'], ['/special.txt', '/special.txt']]}
  ],
  answers: [['coffee', '200 · 咖啡'], ['tea', '200 · 红茶'], ['special', '200 · 桂花乌龙'], ['missing', '404 · 找不到文件']],
  observe({host, path}) {
    const sites = {
      'cafe.example': {root: '/srv/cafe', files: {'/menu.txt': ['coffee', '咖啡']}},
      'tea.example': {root: '/srv/tea', files: {'/menu.txt': ['tea', '红茶'], '/special.txt': ['special', '桂花乌龙']}}
    };
    const site = sites[host];
    const file = site.files[path];
    return {
      answer: file ? file[0] : 'missing',
      rows: [
        ['选择站点', site.root, `Host 是 ${host}，它在这台服务器上对应这个文档根。`],
        ['映射路径', site.root + path, `从选中的根目录查找 ${path.slice(1)}。`],
        ['返回 HTTP 响应', file ? `200 · ${file[1]}` : '404 · 找不到文件', file ? '文件存在，响应正文来自这个文件。' : '选中的站点没有这个文件。另一个虚拟主机的文件不在此次查找范围内。']
      ]
    };
  }
};

const cachePrediction = {
  id: 'performance-cache-validation',
  category: '服务器性能',
  title: '第二次打开菜单，服务器要重发正文吗？',
  minutes: 4,
  summary: '改变缓存年龄和源站版本，追踪浏览器是否发请求，以及菜单正文来自哪里。',
  goal: '区分缓存的新鲜期与资源版本变化，并判断何时进行 ETag 条件验证。',
  predict: '这次普通 GET 将走哪条路径？',
  setup: '浏览器已有 /menu 的完整 v1 正文，ETag 为 "v1"，Cache-Control 为 max-age=60。假设只有该浏览器缓存和源站，浏览器允许正常复用，不强制刷新。菜单仍存在，下列年龄已计入全部流逝时间。',
  refs: [
    {deck: 'performance', start: 49, end: 51, label: '新鲜度、验证与 ETag'},
    {deck: 'performance', start: 53, end: 55, label: '304、200 与复用条件'},
    {deck: 'performance', start: 57, end: 57, label: '缓存请求决策图'}
  ],
  explanation: [
    '当前年龄严格小于新鲜期时，这个实验直接使用缓存。此刻源站是否已改内容，并不会自动通知浏览器。',
    '一旦达到新鲜期边界，已有副本仍在。浏览器可以携带其 ETag 发条件 GET；源站匹配时只回复 304，不匹配时发回 200 和完整新正文。'
  ],
  challenges: [{
    prompt: '只把 max-age 改为 0，浏览器仍保存着 v1，源站也是 v1。还需要走网络吗？',
    answer: '需要。即使年龄为零也没有可直接使用的新鲜期，此处可用已保存的 ETag 进行条件验证，得到 304 后继续使用 v1 正文。'
  }],
  controls: [
    {key: 'age', label: '再次读取时的缓存年龄', options: [['60', '60 秒'], ['59', '59 秒'], ['90', '90 秒']]},
    {key: 'origin', label: '此刻源站菜单的 ETag', options: [['v1', '"v1"'], ['v2', '"v2"']]}
  ],
  answers: [['local', '直接复用本地正文'], ['validated', '发送请求，源站返回 304'], ['download', '发送请求，源站返回 200 和正文']],
  observe({age, origin}) {
    const fresh = Number(age) < 60;
    const rows = [['判定新鲜度', fresh ? '副本仍新鲜' : '副本已过期', `当前年龄 ${age} 秒${fresh ? '小于' : '已达到或超过'} 60 秒的新鲜期。`]];
    if (fresh) {
      rows.push(['网络请求', '0 次', '本例允许直接复用，浏览器没有向源站询问版本。']);
      rows.push(['屏幕上的菜单', '本地 v1', `源站此时是 ${origin}；本次读取只使用已保存的 v1。`]);
      return {answer: 'local', rows};
    }
    const matches = origin === 'v1';
    rows.push(['条件请求', 'If-None-Match: "v1"', '浏览器把本地副本的版本交给源站核对。']);
    rows.push(['源站回复', matches ? '304 · 无正文' : '200 · 返回 v2 正文', `请求标签为 "v1"，源站为 "${origin}"，${matches ? '匹配，可以沿用本地正文。' : '不匹配，浏览器用收到的新菜单替换旧副本。'}`]);
    return {answer: matches ? 'validated' : 'download', rows};
  }
};

const waterfallPrediction = {
  id: 'highperformance-critical-path',
  category: '高性能网站',
  title: '招牌菜主图最早什么时候能显示？',
  minutes: 4,
  summary: '把同一张主图写进 HTML 或放进外部样式表，计算下载能重叠多少时间。',
  goal: '从资源的发现时刻和独立耗时推导首屏依赖链的完成时刻。',
  predict: '这张主图最早在计时器的哪个时刻具备绘制条件？',
  setup: '以 HTML 已解析、外部 CSS 开始下载为 0 ms。CSS 下载固定为 120 ms。HTML 图片可以立即发现；若作为背景图出现，其 URL 只写在外部 CSS 中，等 CSS 完整到达后才发现。浏览器需要 CSS 和图片都就绪才绘制该主图。模型允许两个下载并行，忽略带宽争抢、解析、解码与绘制耗时。',
  refs: [
    {deck: 'highperformance', start: 2, end: 2, label: '页面资源的瀑布图'},
    {deck: 'highperformance', start: 8, end: 10, label: '并行请求与网络计时'},
    {deck: 'highperformance', start: 26, end: 26, label: '样式发现与首次绘制'}
  ],
  explanation: [
    '资源自己的耗时从它能够发请求时才开始计算。当图片地址在 HTML 中已给出，两项工作可以重叠，等得最久的一项决定何时都就绪。',
    '当图片 URL 依赖外部 CSS，下载完 CSS 才知道去哪里取图片。这段必经的等待会把图片的开始时刻向后推，即使网络原本有并行能力。'
  ],
  challenges: [{
    prompt: '让 HTML 中的图片与 CSS 同时开始，CSS 耗时 120 ms，图片从 80 ms 加快到 40 ms。主图最早绘制时刻改变多少？',
    answer: '在当前模型里为 0 ms。两种情况下都要等 CSS 的 120 ms；缩短已经更早结束的那一项，并没有改变两者都就绪的时刻。'
  }],
  controls: [
    {key: 'discovery', label: '主图 URL 出现的位置', options: [['css', '外部 CSS 的背景图'], ['html', 'HTML 中的图片元素']]},
    {key: 'imageDuration', label: '主图下载耗时', options: [['80', '80 ms'], ['180', '180 ms']]}
  ],
  answers: [['120', '120 ms'], ['180', '180 ms'], ['200', '200 ms'], ['300', '300 ms']],
  observe({discovery, imageDuration}) {
    const cssEnd = 120;
    const imageStart = discovery === 'css' ? cssEnd : 0;
    const imageEnd = imageStart + Number(imageDuration);
    const ready = Math.max(cssEnd, imageEnd);
    return {
      answer: String(ready),
      timeline: [
        {label: '样式表', start: 0, end: cssEnd},
        {label: '主图', start: imageStart, end: imageEnd}
      ],
      rows: [
        ['样式表', `0 → ${cssEnd} ms`, 'HTML 已经给出 CSS 的地址，计时开始时即请求。'],
        ['主图', `${imageStart} → ${imageEnd} ms`, `${discovery === 'css' ? 'CSS 返回后才发现该图片。' : 'HTML 已给出图片地址，能和样式表一起开始。'}${imageStart} + ${imageDuration} = ${imageEnd} ms。`],
        ['两项都就绪', `${ready} ms`, `取两个结束时刻的较晚值：max(${cssEnd}, ${imageEnd}) = ${ready}。此时${imageEnd > cssEnd ? '主图' : '样式表'}最后就绪。`]
      ]
    };
  }
};

export const webPredictions = [ajaxPrediction, serverPrediction, cachePrediction, waterfallPrediction];
