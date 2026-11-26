const lambdaState = {
  id: 'lambda-state-scope',
  category: 'AWS Lambda',
  title: '第二次调用还能读到预订吗？',
  minutes: 2,
  summary: '让两个 Lambda 调用先后处理同一张预订单，比较它们能读到的状态。',
  goal: '判断一条记录可以被哪些执行环境读取。',
  predict: '第一次调用记下“已确认”，第二次调用按同一个订单号查询。它会读到什么？',
  setup: '在本地模型中，两次调用按顺序执行。第一次写入已经完成，两次之间没有删除记录。外部数据库的写入立即可见。',
  refs: [{deck: 'lambda', start: 28, end: 30, label: '函数执行环境与状态'}],
  controls: [
    {key: 'storage', label: '第一次写入的位置', options: [['memory', '执行环境的内存'], ['database', '外部数据库']]},
    {key: 'environment', label: '第二次调用的环境', options: [['new', '分配新环境'], ['reused', '复用第一次的环境']]}
  ],
  answers: [['confirmed', '读到“已确认”'], ['missing', '没有这条记录']],
  observe({storage, environment}) {
    const firstMemory = new Map();
    const database = new Map();
    const external = storage === 'database';
    const reuse = environment === 'reused';
    const firstStore = external ? database : firstMemory;
    firstStore.set('R7', '已确认');
    const nextMemory = reuse ? firstMemory : new Map();
    const nextStore = external ? database : nextMemory;
    const value = nextStore.get('R7');
    const readReason = external
      ? '两次调用都连接到同一个数据库，查询的是同一条记录。'
      : reuse ? '这次查询使用的正是第一次写入时的那块内存。' : '第一次写入的记录只在前一个环境的内存里。';
    return {
      answer: value === undefined ? 'missing' : 'confirmed',
      rows: [
        ['第一次写入', external ? '数据库记录 R7' : '内存记录 R7', '保存的预订状态为“已确认”。'],
        ['第二次分配', reuse ? '原来的环境' : '新的环境', reuse ? '本次继续使用第一次调用的那块内存。' : '该环境拥有自己的一块空内存。'],
        ['按 R7 查询', value ?? '没有这条记录', readReason]
      ]
    };
  },
  explanation: [
    '内存挂在具体的执行环境上。平台可能复用它，也可能把下一笔请求交给另一个环境。',
    '订单号解决“查哪一条”。要让每个环境都查得到，还需要共同可访问的持久存储。'
  ],
  challenges: [{
    prompt: '第一次和第二次查询恰好落在同一环境。一次读到了内存记录，足以保证明天也读到吗？',
    answer: '不能保证。明天可能分配到新的执行环境，预订状态应写入可持久保存并能共同访问的存储。'
  }]
};

const bucketNames = {menu: '菜单图片桶', avatar: '头像图片桶'};
const cloudTrigger = {
  id: 'functions-trigger-match',
  category: 'Cloud Run functions',
  title: '哪一个动作会叫醒函数？',
  minutes: 2,
  summary: '给餐厅的一次网页请求或图片上传，找出匹配它的函数入口。',
  goal: '根据输入来源和订阅范围判断会触发哪个处理函数。',
  predict: '当选中的动作发生时，哪段业务代码会执行？',
  setup: '餐厅部署两个函数：一个处理菜单查询网址的 GET 请求，一个订阅某个存储桶的对象创建事件并制作图片预览。两者互不调用。模型假设权限已配置，忽略重复投递。',
  refs: [
    {deck: 'functions', start: 6, end: 7, label: 'HTTP 与存储触发器'},
    {deck: 'functions', start: 21, end: 23, label: '部署入口与一次调用'}
  ],
  controls: [
    {key: 'input', label: '刚刚发生的动作', options: [['http', '浏览器请求菜单网址'], ['menu', '上传图片到菜单桶'], ['avatar', '上传图片到头像桶']]},
    {key: 'bucket', label: '图片预览函数订阅的桶', options: [['menu', '菜单图片桶'], ['avatar', '头像图片桶']]}
  ],
  answers: [['menu-query', '菜单查询函数'], ['preview', '图片预览函数'], ['neither', '两个都不执行']],
  observe({input, bucket}) {
    const http = input === 'http';
    const match = !http && input === bucket;
    const httpReason = http ? '浏览器访问了菜单查询端点。' : '动作发生在存储桶，没有请求菜单查询端点。';
    const eventReason = http
      ? '这次查询没有在任何桶中新建对象。'
      : '本次事件来自' + bucketNames[input] + '，函数订阅的是' + bucketNames[bucket] + '。';
    return {
      answer: http ? 'menu-query' : match ? 'preview' : 'neither',
      rows: [
        ['输入来源', http ? '浏览器 · HTTP GET' : bucketNames[input] + ' · 新对象', http ? '顾客希望收到当前菜单。' : '存储服务发出了对象创建事件。'],
        ['菜单查询入口', http ? '匹配，处理请求' : '未匹配', httpReason],
        ['预览事件入口', match ? '匹配，制作预览' : '未匹配', eventReason]
      ]
    };
  },
  explanation: [
    'HTTP 函数处理发到业务网址的请求，可以把结果回给请求者。存储触发器表达的是“哪个桶里发生哪类变化时，通知哪段代码”。',
    '两个函数都已部署，只说明它们已经准备好。要预测某一次执行，还要看这次输入走哪条路径。'
  ],
  challenges: [{
    prompt: '只更改图片预览订阅的桶，浏览器的菜单查询会改由另一个函数处理吗？',
    answer: '不会。这个变动改变了对象创建事件的接收范围，菜单查询网址与其 HTTP 处理函数仍按原配置关联。'
  }]
};

const privateOrder = {
  id: 'intrusion-order-access',
  category: 'Web Intrusion',
  title: '这张私人订单可以交给谁？',
  minutes: 2,
  summary: '扮演餐厅服务端，用一张虚构订单检验会话和订单归属。',
  goal: '区分识别来访者与批准读取某一条记录。',
  predict: '给定会话状态和订单归属，餐厅 API 会作出什么决定？',
  setup: '餐厅规定只有顾客本人可以读取自己的订单。这个本地模型约定返回三种业务结果：200 返回订单，401 要求登录，403 拒绝读取。所有身份和订单都是虚构的。',
  refs: [{deck: 'intrusion', start: 51, end: 53, label: '会话与对象级授权'}],
  controls: [
    {key: 'session', label: '服务端收到的会话', options: [['valid', '小林的有效会话'], ['expired', '小林已过期的会话'], ['none', '没有会话']]},
    {key: 'owner', label: '这张订单属于谁', options: [['zhou', '小周'], ['lin', '小林']]}
  ],
  answers: [['allow', '200 · 返回订单'], ['login', '401 · 要求登录'], ['deny', '403 · 拒绝读取']],
  observe({session, owner}) {
    const authenticated = session === 'valid';
    const owned = owner === 'lin';
    const rows = [
      ['认证', authenticated ? '已确认是小林' : '没有有效身份',
        authenticated ? '服务端已核实该会话有效。' : session === 'expired' ? '会话超过有效期，无法据此确认本次访问者。' : '本次请求没有提供会话凭据。']
    ];
    if (!authenticated) {
      rows.push(['订单授权', '未进入这一步', '当前没有已确认的顾客可供核对。'],
                ['响应', '401 · 要求登录', '请先建立有效会话，不返回订单内容。']);
      return {answer: 'login', rows};
    }
    rows.push(['订单授权', owned ? '符合归属条件' : '归属不符', owned ? '该订单登记在当前顾客小林名下。' : '当前顾客与这条订单的所有者不同。'],
              ['响应', owned ? '200 · 返回订单' : '403 · 拒绝读取', owned ? '身份与这条记录的读取条件均已核实。' : '服务端已经认出了顾客，仍需保护其他顾客的订单。']);
    return {answer: owned ? 'allow' : 'deny', rows};
  },
  explanation: [
    '认证建立本次请求的身份。授权要继续比较当前身份与具体资源的访问规则，所以同一位顾客读两张不同订单，结果可能不同。',
    '会话过期时，服务端需要重新验证身份。在这套规则下，知道订单属于自己也不能替代有效会话。'
  ],
  challenges: [{
    prompt: '顾客重新登录成功后，为什么一道“拒绝读取”仍可能出现？',
    answer: '重新登录使身份得到确认。若该订单属于另一位顾客，订单归属检查仍会拒绝交付内容。'
  }]
};

export const cloudPredictions = [lambdaState, cloudTrigger, privateOrder];
