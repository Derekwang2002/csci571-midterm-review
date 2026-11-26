const androidReturn = {
  id: 'android-activity-return',
  category: 'Android',
  title: '回到点餐页，7 份还在吗？',
  minutes: 4,
  summary: '把点餐页切到后台再返回，预测系统回调与草稿数量。',
  goal: '分开追踪 Activity 实例的寿命与草稿保存的位置。',
  predict: '返回页面时，会走哪条回调路径？显示框里还有几份？',
  setup: '安卓单窗口教学模型。点餐页把初始数量 0 加到 7，再按 Home 让页面完全不可见，最后从最近任务返回。数量来自 Activity 的整数字段，显示框只读取该字段。假设系统在需要时已给应用保存实例状态的机会。',
  refs: [{deck: 'android', start: 19, end: 20, label: 'Activity 创建、停止与重新显示'}],
  controls: [
    {key: 'background', label: '页面在后台期间', options: [
      ['reclaimed', '系统回收后台进程，任务仍在'], ['resident', '原进程与 Activity 都留在内存']
    ]},
    {key: 'draft', label: '数量保存方式', options: [
      ['field', '仅存在 Activity 字段'], ['bundle', '额外写入实例状态，在 onCreate 中读回']
    ]}
  ],
  answers: [
    ['restarted-seven', 'onRestart → onStart → onResume，显示 7'],
    ['created-zero', 'onCreate → onStart → onResume，显示 0'],
    ['created-seven', 'onCreate → onStart → onResume，显示 7']
  ],
  observe({background, draft}) {
    const resident = background === 'resident';
    const saved = draft === 'bundle';
    const value = resident || saved ? 7 : 0;
    const answer = resident ? 'restarted-seven' : saved ? 'created-seven' : 'created-zero';
    return {answer, rows: [
      ['按 Home 离开', 'onPause → onStop', '另一界面完全盖住点餐页，原页面离开前台并停止可见。'],
      ['后台发生什么', resident ? '原实例仍在，字段仍为 7' : '进程被回收，原实例消失',
        resident ? '同一块内存还能直接保存字段。' : '任务记录可以保留，旧进程里的字段已随实例消失。'],
      ['重新显示', resident ? 'onRestart → onStart → onResume' : 'onCreate → onStart → onResume',
        resident ? '停止过的同一个实例回到前台，不会再次经过 onCreate。' : '系统为原任务重新创建 Activity，然后使新实例可见并进入前台。'],
      ['读取数量', `显示 ${value} 份`,
        resident ? '显示框读取原实例的 7。此次没有创建新实例，也无需从 Bundle 恢复。'
          : saved ? '新实例初始化后，从系统回交的实例状态中恢复 7，随后更新显示框。'
            : '新实例的字段从默认值 0 开始，没有保存的数量可读回。']
    ]};
  },
  explanation: [
    'onStop 说明这次切换后页面已不可见。再回来时，先找是否还有那个实例；这决定会经过 onRestart 还是重新经过 onCreate。',
    'saved instance state 适合少量、暂时的界面状态。本例指定系统恢复原任务，用户主动关闭任务和下次全新启动属于不同情形。'
  ],
  challenges: [
    {prompt: '只看到屏幕上仍是 7，能判断走过 onRestart 吗？',
      answer: '不能。同一个实例能直接读出 7，新实例也可能从实例状态恢复 7。要再看创建或重启回调。'},
    {prompt: '若把保存数量的唯一机会放在 onDestroy，进程被系统直接回收时会怎样？',
      answer: '系统不保证此时调用 onDestroy，草稿可能丢失。应在适合保存状态的时机安排恢复所需的数据。'}
  ]
};

const swiftBinding = {
  id: 'ios-state-binding',
  category: 'iOS',
  title: '改了一份数量，哪两个数字会更新？',
  minutes: 4,
  summary: '用订单与明细两个计数器追踪 SwiftUI 的 @State 和 @Binding。',
  goal: '能指出一份可变数据由谁持有，点击实际写到了哪里。',
  predict: '一次加一后，父视图和子视图将分别显示多少？',
  setup: 'SwiftUI 状态教学模型。父视图在 @State 中存订单数量 2，子视图第一次出现时也显示 2。两个视图各有自己的“加一”按钮。整个过程中子视图的身份保持不变，只按所选位置的按钮一次。',
  refs: [{deck: 'ios', start: 52, end: 55, label: '数据驱动更新与状态包装器'}],
  controls: [
    {key: 'connection', label: '子视图如何拿到数量', options: [
      ['copy', '@State，创建时以父视图传来的值初始化'],
      ['binding', '@Binding，父视图传入 $quantity']
    ]},
    {key: 'button', label: '按哪一个加一按钮', options: [
      ['child', '点子视图的“加一”'], ['parent', '点父视图的“加一”']
    ]}
  ],
  answers: [
    ['two-three', '父视图 2，子视图 3'],
    ['three-two', '父视图 3，子视图 2'],
    ['three-three', '父视图 3，子视图 3']
  ],
  observe({connection, button}) {
    const shared = connection === 'binding';
    const inChild = button === 'child';
    const parent = shared || !inChild ? 3 : 2;
    const child = shared || inChild ? 3 : 2;
    return {answer: shared ? 'three-three' : inChild ? 'two-three' : 'three-two', rows: [
      ['第一次显示', '父 2，子 2', shared ? '子视图经 Binding 读取父视图的数量。' : '子视图在创建时把数值 2 存到自己的状态里。'],
      ['执行加一', shared || !inChild ? '父层存储由 2 变为 3' : '子层存储由 2 变为 3',
        shared && inChild ? '点的是子按钮，但 Binding 的 setter 会写回父层。'
          : inChild ? '子按钮直接修改子视图拥有的 State。' : '父按钮直接修改父视图拥有的 State。'],
      ['下一次显示', `父 ${parent}，子 ${child}`,
        shared ? '父子再次读取同一份数据，因此两个显示同步。'
          : inChild ? '子视图自己的值已变，父视图持有的数量仍为 2。'
            : '即使子视图被重新求值，同一身份下已建立的 @State 仍保留原值 2。']
    ]};
  },
  explanation: [
    '@State 为当前视图身份保存一份状态。用父层传来的整数初始化子层状态，相当于建立第二份存储。',
    '@Binding 让子视图通过一个读写入口访问上层数据。预测结果时先标明按钮写哪块存储，再看各个数字读自哪里。'
  ],
  challenges: [
    {prompt: '最初两个数字恰好相同，能说明它们共享存储吗？',
      answer: '不能。可以用相同的 2 初始化两份独立状态。修改其中一份后，观察另一处读取的结果才能区分。'},
    {prompt: '如果移除持有局部 @State 的子视图，再以新身份创建它，之前的推论哪里会变？',
      answer: '新身份会获得新的状态存储，初始值可以取自此刻父层传来的数量。旧身份的局部值不再由新视图沿用。'}
  ]
};

const webStorage = {
  id: 'html5-storage-tabs',
  category: 'HTML5',
  title: '新标签读到哪一份订票草稿？',
  minutes: 5,
  summary: '追踪两个同源标签，区分存储的共享、初始复制与独立会话。',
  goal: '沿写入、开页、再次写入的时间顺序判断一个键的可见值。',
  predict: 'A 写入“靠窗”，打开 B，再由 A 改成“过道”。最后 B 读取 seat，得到什么？',
  setup: 'Web Storage 教学模型。A 和 B 属于同一浏览器配置、同一 origin，允许使用存储。每次实验从空存储开始。A 写入 seat，B 打开后一直没有写操作；两个标签保持打开。模型只使用本次临时数据。',
  refs: [{deck: 'html5', start: 36, end: 37, label: 'localStorage 与 sessionStorage 的作用域'}],
  controls: [
    {key: 'store', label: '两个标签使用的 API', options: [
      ['session', 'sessionStorage'], ['local', 'localStorage']
    ]},
    {key: 'opening', label: 'B 的打开方式', options: [
      ['opener', '由 A 打开，保留 opener'], ['independent', '独立新开同源标签，没有 opener']
    ]}
  ],
  answers: [
    ['window', '字符串“靠窗”'], ['aisle', '字符串“过道”'], ['missing', 'null（没有这个键）']
  ],
  observe({store, opening}) {
    const local = store === 'local';
    const copied = !local && opening === 'opener';
    const answer = local ? 'aisle' : copied ? 'window' : 'missing';
    return {answer, rows: [
      ['A 第一次写入', 'A 中 seat = “靠窗”', `A 调用 ${local ? 'localStorage' : 'sessionStorage'}.setItem 保存字符串。`],
      ['打开 B', local || copied ? 'B 可读到“靠窗”' : 'B 读到 null',
        local ? '两个同源标签访问同一块 localStorage。'
          : copied ? 'B 有 opener，创建时获得 A 当时 sessionStorage 的副本。'
            : 'B 有独立的页会话，且没有从 opener 取得初始副本。'],
      ['A 写入“过道”后，B 再读取', local ? '“过道”' : copied ? '“靠窗”' : 'null',
        local ? '两者读写同一块存储，A 的第二次写入对 B 可见。'
          : copied ? '初始复制只发生一次，A 改写自己的副本不会改变 B 的值。'
            : 'A 的修改仍留在 A 的页会话，B 从未创建这个键。']
    ]};
  },
  explanation: [
    'localStorage 按 origin 等边界隔离。同一浏览器配置中的普通同源顶层标签可读取彼此随后写入的键；读取缺失键时 getItem 返回 null。',
    'sessionStorage 还按顶层标签的页会话分开。在本例中保留 opener 会带来一份初始副本；两个会话后续各自读写。刷新原标签通常继续同一会话。'
  ],
  challenges: [
    {prompt: 'B 已复制 A 的 sessionStorage。现在 B 先把自己的 seat 改成“前排”，A 会读到“前排”吗？',
      answer: '不会。初始复制已经结束，B 改的是自己页会话里的副本。'},
    {prompt: 'B 的 sessionStorage 已有“靠窗”，只刷新 B，不关闭标签，接着读取会怎样？',
      answer: '同源重载继续当前页会话。若应用没有主动清除或覆盖该键，B 仍会读到“靠窗”。'}
  ]
};

export const clientPredictions = [androidReturn, swiftBinding, webStorage];
