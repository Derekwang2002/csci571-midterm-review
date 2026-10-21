"""Author the original final lectures and compact midterm recaps."""
from review_content import ROOT, write, example, question, section, link, build
from pathlib import Path
import json

# RESPONSIVE WEB DESIGN
r=[]
r.append(section('先知道这一讲在解决什么',[1,2,3],['同一份网页要在窄手机、平板、宽桌面上可读、可操作。复习主线是：先设置 viewport，再让尺寸可伸缩，最后用 media query 在必要的位置改变布局。','响应式不是把桌面截图整体缩小。文字、列数、导航和图片要随可用空间重排；Bootstrap 把常用布局规则包装成类名。'],['三个支柱：fluid grid、flexible images、media queries。','先掌握 CSS 原理，再读 Bootstrap 类名。']))
r.append(section('市场、历史与设备榜单：看过即可',[4,5,6,8,19,26],['这些页用市场份额、设备分辨率、兼容性与案例网址说明跨屏需求，不作为本版的背诵清单。第 5 页是嵌入媒体占位，PDF 中没有可读的完整视频内容。','屏幕比例、浏览器支持率和网站实例会变化。应记住“测试不同宽度”，不用记图表上的年份、排名与百分比。'],['发展历史按教授说明跳过；统计数据只提供背景。']))
r[-1]['kind']='background'
r.append(section('Mobile first 与同一 URL',[7,9,10,11],['Mobile first 是先保证小屏下的主要任务能完成，再在宽屏增加列数和辅助内容。例如商品页先显示名称、价格和购买按钮，宽屏再并排展示推荐栏。','单独的移动子域或站点会增加重定向、链接分享和维护成本；响应式页面通常让同一 URL 服务不同宽度。地理位置、触摸、横竖屏属于设备能力，不能仅根据“看起来像手机”就假设全部可用。'],['优先保证核心功能可用，不是删光内容。','屏幕宽度与设备能力是两回事。'],question=question('为什么手机布局通常从一列开始？同一 URL 有什么好处？','一列减少窄屏横向滚动，让主要操作先可用；同一 URL 减少重定向和多套页面维护，也方便分享。')))
r.append(section('Viewport：CSS 像素不等于物理像素',[12,13,14],['移动浏览器如果用很宽的默认布局视口，网页可能先按桌面宽度排版，再缩得很小。viewport 元信息让布局宽度跟随设备的 CSS 像素宽度。','课件第 12 页的 `width=590` 固定了布局宽度；常用写法是下面的 `width=device-width`。第 14 页部分数值是屏幕物理分辨率，不能直接代入 CSS 断点。例如 1170 个物理像素、DPR 为 3 的屏幕，在常见初始缩放条件下对应约 390 个 CSS 像素。'],['媒体查询的 width 看视口的 CSS 像素宽度。','`initial-scale=1` 设置初始缩放，不禁止用户放大。'],example=example('html','<meta name="viewport" content="width=device-width, initial-scale=1">','放在 HTML 的 head 中。随后 390 CSS px 的视口会匹配 max-width: 500px；不要用 1170 个物理像素作判断。'),question=question('设备物理宽度为 1170 px，布局视口为 390 CSS px，是否满足 max-width:500px？','满足。查询的是视口宽度 390 CSS px，不是物理分辨率。')))
r.append(section('Media queries：先判断条件，再参与层叠',[16,17,18,20],['`@media` 只是决定一组 CSS 是否参与计算。条件成立后，仍要按选择器优先级、来源顺序等规则决定最终样式。`min-width` 与 `max-width` 都包含边界；`and` 要求两边同时成立。','不写媒体类型时默认 all；screen 是屏幕。课件旧例中的 `max-device-width` 查询设备宽度，现已弃用；当前布局优先使用查询视口的 `max-width`。','`display:none` 不生成布局盒，后面的元素会补位，但节点仍在 DOM 中。`visibility:hidden` 看不见却通常保留布局空间。不要把关键提交按钮只因屏幕窄而隐藏。'],['先判断每条规则是否匹配，再判断哪条声明获胜。','隐藏布局盒不等于删除 DOM 节点。'],example=example('html','''<style>
.cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 600px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1000px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}
</style>
<div class="cards"><div>A</div><div>B</div><div>C</div></div>''','599px：一列；600px：两列；1000px：两个条件都成立，但后一条同优先级规则获胜，显示三列。这里的宽度指整个预览视口。'),question=question('上面的 CSS 在 1000px 时为什么是三列，而不是两列？','min-width:600px 和 min-width:1000px 均成立；选择器相同，后一条 grid-template-columns 声明覆盖前一条。'),links=[link('MDN：媒体查询的 width','https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/width')]))
r.append(section('弹性网格与图片：跟随父容器',[15,23,24,25],['Fluid layout 用相对尺寸随空间连续伸缩；adaptive layout 更强调在几个断点采用固定布局。实际页面经常组合两者：断点改列数，断点之间让列宽伸缩。','百分比换算是 target ÷ context × 100%。课件把 700px 放进 988px 的容器：700/988≈70.85%。context 是当前包含块，不一定是整个屏幕。','图片设置 `max-width:100%; height:auto`：最大不超过父容器，同时保持纵横比。与 `width:100%` 不同，max-width 本身不会强制把小图拉大。'],['百分比先找父容器。','图片只限制宽度时也要保留正确的高度比例。'],example=example('html','''<style>
.layout { width: 90%; max-width: 988px; margin: auto; }
.story { width: 70.85%; background: #eee; }
.story img { max-width: 100%; height: auto; }
</style>
<div class="layout"><div class="story">随父容器伸缩的内容区</div></div>''','父容器宽 988px 时 story 约 700px；父容器宽 500px 时约 354.25px。百分比不会一直保留原来的 700px。'),question=question('600px 的父容器中，一个 width:50% 的区域内放 max-width:100% 的 800px 图片，最大显示多宽？','约 300px（假设没有额外 padding/border 影响）。图片的百分比参照 300px 的区域，不是 600px 或整个视口。')))
r.append(section('用开发者工具检验断点',[21,22],['Firefox 与 Chrome 的响应式工具可改变视口大小、模拟触摸与部分设备条件。对着断点测试“前一点、正好、后一点”，比只看一个手机预设更能发现问题。','例如 min-width:600px 要看 599、600、601px；再检查横向滚动、图片溢出、按钮是否仍可操作。模拟器不能完全代替真实设备的浏览器与输入行为。'],['断点两侧都要验证。','先看实际视口宽度，不只看设备名称。']))
r.append(section('Bootstrap：CSS、JS 与版本分开读',[27,28,29,30,31,32,33,34],['Bootstrap 提供栅格、样式和交互组件。只用栅格需要 CSS；下拉菜单等交互组件还需要对应 JS。Bootstrap 5 的 bundle 包含 Popper，但不包含 CSS。','课件同时展示 3、4、5 代代码：不要混用类名和依赖。Bootstrap 5 不依赖 jQuery；第 31 页提到 Glyphicons 属于更早的版本语境，不是 Bootstrap 4/5 的统一目录规则。','浏览器兼容表、旧 IE 修复脚本和下载文件名是版本背景。读代码时抓住 viewport、引入 CSS、按需引入 JS 这条主线。'],['版本先确定，再判断类名与断点。','CSS 负责样式；JS 负责需要行为的组件。'],question=question('只引入 bootstrap.bundle.min.js，能让 col-6 显示为半宽列吗？','不能。栅格宽度来自 Bootstrap CSS；bundle 提供交互脚本及 Popper，不替代样式表。')))
r.append(section('12 列栅格：版本不同，断点不同',[35,36,39,50],['容器里面放 row，row 里面放列。数字表示占 12 份中的几份：`col-6` 是一半；三个 `col-4` 刚好占满一行。断点类一般是 min-width，从该宽度向上生效，直到更大的断点规则覆盖。','第 39 页标题与文字有混用：Bootstrap 4 的 sm 从 576px 开始，不是 768px；768px 是 v4 的 md，也是 v3 的 sm。考试读给定版本与代码，不能只背一个 md 数字。'],['v3 的 md 从 992px 开始；v4/v5 的 md 从 768px 开始。','Bootstrap 5 最小层无 xs 后缀，写 `.col-6`。'],table=dict(headers=['版本','最小层','sm','md','lg','xl','xxl'],rows=[['3','xs < 768','≥768','≥992','≥1200','—','—'],['4','无后缀 < 576','≥576','≥768','≥992','≥1200','—'],['5','无后缀 < 576','≥576','≥768','≥992','≥1200','≥1400']]),example=example('html','''<!-- 已引入 Bootstrap 5 CSS；每个卡片都使用这一组类 -->
<div class="row">
  <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">A</div>
  <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">B</div>
  <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">C</div>
  <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">D</div>
</div>''','Bootstrap 5 下：360px 每行 1 个；600px 每行 2 个；1000px 每行 3 个；1440px 每行 4 个。不要把 class 出现的先后顺序误当成断点大小。',preview=False),question=question('Bootstrap 5 的 col-12 col-sm-6 col-lg-4 在 800px 和 1000px 分别占几份？','800px 匹配 sm 但未到 lg，所以占 6/12；1000px 匹配 lg，占 4/12。'),links=[link('Bootstrap 5：栅格与六个断点','https://getbootstrap.com/docs/5.3/layout/grid/'),link('Bootstrap 3：旧课件的断点','https://getbootstrap.com/docs/3.4/css/')],anchor=50))
r.append(section('等宽、不等宽与嵌套：算清参照物',list(range(37,39))+list(range(40,46)),['课件用 12 个方块展示一行放 1、2、3、4 个时的变化。注意第 38 页是旧版 md 语境：992–1199px 时每行 3 个，因此 12 个方块共 4 行。','4+4+4 与 3+6+3 都等于 12；后一种中间列是旁边列的两倍。嵌套时，在父列里面再放 row，新的一行又有自己的 12 份。','父列占外层 8/12，里面两个 col-6 各占父列的一半，所以各相当于外层 4/12。这里说的是比例，实际内容宽度还受 gutter、padding 等影响。'],['每个 row 都重新划分 12 份。','内层比例 × 外层比例，不能把内层数字当成外层数字。'],example=example('html','''<!-- Bootstrap 5；视口达到 md 断点时 -->
<div class="row">
  <div class="col-md-8">
    <div class="row">
      <div class="col-6">内层 A</div>
      <div class="col-6">内层 B</div>
    </div>
  </div>
  <div class="col-md-4">外层 C</div>
</div>''','达到 md 后 A、B 各占父列一半；在外层比例上 A、B、C 都约为 1/3。窄屏下外层 md 列会改为堆叠。',preview=False),question=question('外层 col-md-9 中，内层 col-4 占外层整行的多少？','9/12 × 4/12 = 1/4；不要答 4/12。这里忽略 gutter 对内容盒实际像素宽度的影响。')))
r.append(section('混合断点、换行与 offset',[46,47,48,49],['给同一个元素多个断点类，就是给不同宽度写不同规则。课件 v3 的 `col-xs-12 col-md-8` 表示小屏占整行，到 992px 才变为 8/12；不能套用 v5 的 md=768。','同一行累计超过 12 会换行。offset 是给列前面留空位，计算时也占份额；例如 5 + offset 2 + 5 = 12。若在更大断点不再需要留白，就显式重置 offset 为 0。','v3 的 clearfix / visible-xs 用来处理 float 布局的清除；v5 使用 Flexbox 栅格，不要机械复制旧清除类。v5 偏移写 `offset-sm-2`，不是旧的 `col-sm-offset-2`。'],['数字相加时把 offset 算进去。','旧版清除浮动不等于现代栅格必需步骤。'],question=question('Bootstrap 3 中 col-xs-12 col-md-8 在 900px 占多少？','12/12。v3 的 md 是 ≥992px，900px 还没有启用 md-8。')))
r.append(section('ng-bootstrap：数据驱动现成组件',list(range(51,60)),['ng-bootstrap 是 Angular 的 Bootstrap 风格组件，不是 React Bootstrap。组件模板接收数据和状态，让框架负责同步界面；安装时需要匹配 Angular、Bootstrap CSS 以及组件所需依赖，不能只背课件中的版本号。','读例子时抓住两种方向：`[value]="progress"` 把组件数据传给进度条；`(closed)="closeAlert(alert)"` 处理关闭事件，再改变数据。Nav 的 activeId 决定当前页签；表格把数组逐项渲染为行。','第 59 页展示延迟自动关闭的消息。理解“消息出现 → 等待 → 清空状态 → 界面消失”，不需要记整个组件源码。若使用 debounceTime，新的消息会重新计算等待窗口。'],['方括号是属性绑定，圆括号是事件绑定。','状态改变后更新显示，与 React 的数据驱动思路可以对照。'],example=example('html','''<!-- Angular 模板片段；已导入对应 ng-bootstrap 组件 -->
<ngb-progressbar [value]="progress" [showValue]="true" />
<ngb-alert type="success" (closed)="message = ''">
  {{ message }}
</ngb-alert>''','progress=25 时显示 25% 的进度。点击 alert 的关闭按钮触发 closed，赋值 message=""；实际隐藏整块提示还需用条件渲染判断 message 是否为空，而不是以为清空文本就自动移除组件。',preview=False),question=question('[value]="25" 和 (closed)="closeAlert(alert)" 各是什么方向？','前者把数据传入组件属性；后者监听组件事件，由处理函数修改应用状态。'),anchor=56))
build('responsive','Responsive Web Design · 重点串讲','先判断视口，再推布局。重点练习媒体查询的边界、百分比参照物和 Bootstrap 栅格；版本历史与市场榜单只作背景。',['能按给定宽度推导实际列数。','能解释 viewport、fluid grid、flexible image。','能区分 Bootstrap 3/4/5 与 Angular 组件示例。'],r,'''
响应式网页的目标|本讲研究同一页面如何适应不同可用宽度，重点是布局规则而不是不同设备的型号。
三条技术主线|流式网格决定区域宽度，弹性图片避免溢出，媒体查询决定何时改变布局。
本讲内容地图|先学移动优先和视口，再读 CSS 断点，最后用 Bootstrap 的类名表达相同规则。
移动市场背景|市场份额用来说明移动访问的重要性，图中的年份和百分比无需记忆。
嵌入媒体占位|本页的 PDF 只有媒体占位区域，不能从静态页还原视频内容；复习不依赖该视频。
移动与桌面访问统计|图表证明访问环境多样，但具体访问占比不是响应式布局算法的输入。
Mobile first|先在窄屏完成主要操作，再在较宽屏幕增加列数和辅助信息，是渐进增强的思路。
屏幕分辨率统计|设备宽度很多，设计应适应连续空间，不能为榜单上的每种设备硬编码一套网页。
移动设备的能力|定位、触摸、旋转会影响交互；可用能力与视口宽度不是同一个判断条件。
三种移动站点方案|独立域名、移动子域和响应式单站点的区别在于 URL、维护与内容组织方式。
为什么保留同一 URL|同一地址可以让 CSS 适配布局，减少重定向、链接分享错误和多套页面维护。
Viewport 元信息|固定 width=590 不等于适应每台手机；常用 device-width 让布局视口随设备的 CSS 宽度设置。
响应式网站截图|对比截图时观察导航和内容如何重排，而不是只比较整页缩小了多少。
设备像素与 CSS 像素|高分辨率屏幕的物理像素数不能直接当作媒体查询中的 width；两者受到像素密度和缩放影响。
响应式定义与三支柱|流式布局、弹性媒体、媒体查询共同实现响应式；提出时间和人物不需要背。
媒体类型与查询条件|screen 限定屏幕，min-width:500px 表示视口宽度至少 500 CSS px；省略类型默认为 all。
旧版设备宽度查询|课件的 max-device-width 是旧写法。布局适配应优先看 viewport 的 max-width，而非设备物理尺寸。
组合查询与边界|and 表示同时满足；min-width 与 max-width 都包含边界，先列条件再推最终 CSS。
浏览器支持表|兼容性表是当时环境的快照；考试复习应掌握媒体查询含义，不背支持率。
隐藏内容的两种方式|display:none 不占布局空间，visibility:hidden 通常留空位；二者都不等于从 DOM 删除节点。
Firefox 响应式工具|拖动视口宽度并跨过断点，检查排列和溢出，是本页工具演示的核心。
Chrome 设备模拟|设备预设只是起点；还要手动检查临界宽度，模拟结果也不能保证真实设备完全一致。
Fluid 与 adaptive 布局|流式布局连续伸缩；自适应布局在特定宽度切换。两种思路可以组合使用。
把固定像素换成百分比|700/988≈70.85%，144/988≈14.575%；分母必须是相应属性的参照容器。
让图片适应容器|max-width:100% 限制最大宽度，height:auto 保留比例；小图片不会仅因 max-width 而被拉大。
案例网址页|实例帮助观察重排策略，不需要把网址清单作为记忆内容。
Bootstrap 的作用|框架把常见布局和组件写成可复用类名；仍需理解底层 CSS，品牌与历史只作背景。
开始使用 Bootstrap|先引入 CSS，再按交互需要引入 JS；包的版本必须与所用类名和组件 API 对应。
Bootstrap 4 兼容表|这是特定版本的浏览器支持说明，不代表所有 Bootstrap 版本都支持相同旧浏览器。
Bootstrap 5 兼容表|新版兼容范围与旧版不同；判断示例前先确认其版本，不混用旧 IE 配置。
旧版文件结构|CSS 和 JS 分工不同；页内 Glyphicons 字体描述来自更早的版本，不能套用为 v4 的通用结构。
Bootstrap 5 bundle|bundle 包含交互脚本所用的 Popper；CSS 仍需单独加载，min 表示压缩版本。
旧版基础模板|识别 head 中的 CSS、viewport 及页面末尾的脚本；旧浏览器补丁不作为核心背诵项。
Bootstrap 5 基础模板|v5 页面仍遵循元信息、CSS、HTML 内容、按需 JS 的结构，不再依赖 jQuery。
12 列栅格概览|行被分为 12 份，col 的数字表示份额；v3 有四层、v4 五层、v5 六层断点。
Bootstrap 4 与 5 对照|v5 增加 xxl 并移除 jQuery 依赖；考代码时更重要的是识别断点与类名所属版本。
十二个方块的重排|同样 12 个元素，每行列数改变就会改变总行数；元素数量并没有因响应式而减少。
旧版 md 区间示意|在课件 v3 的 992–1199px 区间，12 个方块每行 3 个，共 4 行；不要套用新版本 md 下限。
标题与断点文字混用|此页部分文字沿用 v3；v4 表格中的 sm=576、md=768、lg=992、xl=1200 才对应 v4。
栅格示例总览|先从截图数每行有几列，再回到 class 推宽度和断点，这样能检查自己的预测。
示例 head 结构|viewport 影响移动端布局，CSS 定义栅格；IE 条件注释是旧环境兼容代码。
等宽与不等宽截图|4+4+4 为三等份，3+6+3 则中间两倍宽；它们都占满 12 份。
等宽与不等宽源码|同一 row 内 col-md-4 重复三次，与 col-md-3、6、3 的布局不同，需结合该示例版本的 md。
两列与嵌套示意|外层 8+4 分成宽窄两块；宽块还能包含新的 row，形成独立的内层栅格。
嵌套栅格源码|父列 8/12 内的两个 col-6 各占父列一半，相当于外层的 4/12，而非外层的 6/12。
混合断点效果|同一组卡片在小屏可堆叠，到较宽断点改为多列；多个类是多套条件规则。
混合断点源码|旧例 col-xs-12 col-md-8 在 v3 的 992px 前为整行，达到后为三分之二行。
清除与偏移截图|offset 留出网格空位，clearfix 则处理旧 float 换行；二者不是同一个功能。
清除与偏移源码|5 列加 2 列偏移再加 5 列等于 12；较宽布局不需偏移时要显式归零。
Bootstrap 5 六个断点|最低层无后缀，sm 576、md 768、lg 992、xl 1200、xxl 1400；断点按最小宽度生效。
ng-bootstrap 是什么|它面向 Angular，提供 Bootstrap 风格组件，不能当作 React Bootstrap 直接导入 React。
组件依赖与兼容性|Angular、Bootstrap CSS 和组件相关依赖需要匹配；版本表用来选兼容组合，不用死记。
Angular 版本表|版本兼容矩阵属于环境说明，变化频繁；抓住安装组件需要匹配框架版本即可。
组件目录|导航、进度条、表格和提示框是现成 UI 组件；学习重点是传入状态与响应事件。
Nav 组件|activeId 表示当前活动页签，切换页签会改变状态，再让对应内容出现。
Progressbar 组件|value 属性驱动进度数值；striped、showValue 改变呈现，不改变所表达的进度本身。
Table 组件示例|数组中的每条记录生成表格的一行；格式化数字属于显示处理，不等于修改原始数据。
可关闭 Alert|closed 事件触发处理函数；从 alerts 数据中移除相应项后，界面才同步去掉那条提示。
自动关闭 Alert|延迟后清空消息状态可以自动隐藏提示；使用 debounceTime 时新消息会重置等待窗口。
''',['CSS 层叠决定命中的媒体查询最终显示什么。','React 与 Angular 都能把数据映射成组件；响应式 CSS 决定这些组件如何排列。'],['给定宽度，按条件与层叠顺序推导样式。','分别用 v3 和 v5 解释 col-md-6。','算清嵌套栅格与 offset，不把物理像素当 CSS 像素。'])

# REACT
r=[]
r.append(section('React：用状态描述界面',[1,2,4,6,7],['React 的核心工作是把组件的输入映射为 UI。你写“当前数据应显示什么”，React 在重新渲染后把必要变化提交给页面；不用在每次点击后手动寻找和修改每个 DOM 节点。','单向数据流指数据通常从父组件传给子组件。Virtual DOM 是描述 UI 的内存表示，协调过程比较前后结果；它不保证任何场景都比手写 DOM 更快。','React 核心聚焦 UI，完整应用还会组合路由、数据请求和后端。课件“不能构建完整应用”应理解为核心库不包办所有功能；SSR 也是可支持的方案，不是所有 React 页面自动在服务器渲染。'],['state / props → render → 更新界面。','React 是 UI 库；浏览器、服务器与 Native 的运行环境要区分。'],question=question('计数器改变后，React 要把整个网页全部重建吗？','不需要。组件会产生新的 UI 描述，React 协调并把必要变化提交到宿主界面；重新 render 不等于把所有真实 DOM 节点删除重建。')))
r.append(section('起源与采用情况：可跳过',[3,5],['本组解释 React 的起源与使用它的公司。按教授说明不需要记发展时间、发明者或公司名单。','可以保留动机：页面交互变多后，用组件和数据流组织代码有助于管理复杂 UI。'],['理解问题背景即可，不背历史。']))
r[-1]['kind']='history'
r.append(section('JSX：JavaScript 里的 UI 表达式',[8,9],['JSX 看起来像 HTML，但它是 JavaScript 的语法扩展，需要工具转换。`className` 对应 CSS 类；花括号中放表达式，例如变量、计算结果或函数调用。组件名首字母大写，用来区别内置标签。','课件把 JSX 转成 `React.createElement` 来解释原理；现代 JSX transform 也可能使用 jsx/jsxs。要掌握“创建元素描述”这层含义，不要认为所有编译结果必须长得一样。'],['JSX 不是字符串，也不是浏览器原生 HTML 解析。','条件表达式可用三元运算；不能直接把 if 语句塞进 JSX 花括号。'],example=example('jsx','''function Greeting({ name, unread }) {
  return (
    <p className="greeting">
      Hi {name}，{unread > 0 ? `${unread} 条未读` : '没有新消息'}
    </p>
  );
}
// <Greeting name="Derek" unread={2} />''','渲染出的文字是“Hi Derek，2 条未读”。unread={2} 传数字；unread="2" 传字符串。JSX 花括号切换回 JS 表达式。'),question=question('title="count" 与 title={count} 有什么不同？','前者传入固定字符串 count；后者计算变量 count 的当前值作为属性。')))
r.append(section('组件与 props：谁拥有数据，谁负责修改',[10,11,12,13,16],['组件是可以重复使用的 UI 单元；同一个 Welcome 组件接收不同 name，就显示不同名字。props 是父组件给的输入，子组件不应直接改它；需要修改时，通过回调请拥有数据的父组件更新 state。','函数组件现在可以通过 Hooks 使用 state。课件“函数组件无状态、类组件有状态”是旧分类，不能作为现代 React 的规则。共享状态应放在共同父组件，让多个子组件得到同一份数据。'],['props 向下传；事件回调把修改请求传回数据拥有者。','state 传给孩子后，在孩子眼中就是 props。'],table=dict(headers=['项目','props','state'],rows=[['来源','父组件传入','组件自己持有'],['修改方式','子组件不直接修改','通过 setter / setState 请求更新'],['用途','配置、数据显示、回调','会随交互变化的数据']]),example=example('jsx','''import { useState } from 'react';
function CounterButton({ count, onAdd }) {
  return <button onClick={onAdd}>数量：{count}</button>;
}
export default function Cart() {
  const [count, setCount] = useState(0);
  return <CounterButton count={count}
    onAdd={() => setCount(n => n + 1)} />;
}''','Cart 拥有 count；CounterButton 只显示 props 并报告点击。每次点击最终加 1。onClick={onAdd} 传函数，onClick={onAdd()} 会在渲染时立即调用，含义不同。'),question=question('两个兄弟组件要同步显示同一个数量，应各自保存一份 state 吗？','通常把 state 提升到共同父组件，再把值与回调传给两个孩子，避免两份状态不同步。'),links=[link('React：组件、事件与共享状态','https://react.dev/learn')],anchor=16))
r.append(section('State：每次渲染看到一份快照',[14,15,18],['类组件通过 constructor / this.state 初始化，通过 setState 请求更新；函数组件通过 useState 获得当前值与 setter。直接给 state 对象赋值，不会按正常方式通知 React 重新渲染。','更新请求不会立即改掉当前事件处理函数读到的 state。依赖前一次结果时，传 updater 函数，让 React 按队列计算。两次 `setCount(count+1)` 都使用同一个快照值；两次 `setCount(n=>n+1)` 则连续加两次。','类的 setState 对对象作浅合并；Hook 的 setter 替换该状态值。所以更新 Hook 对象的一个字段时，通常用 `{...prev, field:newValue}` 保留其他字段。数组和对象也应创建新值，不直接原地修改。'],['读代码先标出此次 render 的 state 值，再处理更新队列。','类 setState 浅合并；useState setter 替换值。'],example=example('jsx','''import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  function addTwo() {
    setCount(n => n + 1);
    setCount(n => n + 1);
    console.log(count);
  }
  return <button onClick={addTwo}>{count}</button>;
}''','初始 0，第一次点击日志仍是 0；随后界面显示 2。若两行都改成 setCount(count+1)，第一次点击后界面是 1，因为两次都请求设置为 0+1。'),question=question('初始 n=5，同一事件中调用两次 setN(n+1)，与两次 setN(v=>v+1) 各得到多少？','前者得到 6；后者得到 7。前者两次都读取本次渲染快照 5，后者依次处理更新队列。'),links=[link('React：State 是快照','https://react.dev/learn/state-as-a-snapshot'),link('React：类组件 setState','https://react.dev/reference/react/Component')],anchor=15))
r.append(section('生命周期与 Effect：建立连接，也负责清理',[17],['类组件通常按 mount → update → unmount 理解：componentDidMount 可建立订阅，componentDidUpdate 响应变化，componentWillUnmount 清理。课件图中的 componentWillMount / WillReceiveProps / WillUpdate 是旧生命周期，不建议新代码照写。','函数组件用 Effect 与外部系统同步。依赖改变时先清理上一次 Effect，再运行新的；组件移除时也清理。Effect 并不是把类生命周期方法逐个改名，render 本身应保持纯粹。','空依赖数组表示 Effect 不依赖会变化的组件值；开发环境 Strict Mode 可能额外执行一轮 setup → cleanup 检查，因此“绝对只运行一次”不是可靠表述。'],['定时器、事件监听、订阅要成对清理。','依赖数组决定 Effect 何时重新同步。'],example=example('jsx','''import { useEffect, useState } from 'react';
export default function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <time>{now.toLocaleTimeString()}</time>;
}''','挂载后创建计时器，每秒请求更新 now；卸载时 clearInterval，避免组件消失后还继续工作。JSX 显示的是 state，不是定时器直接改 DOM。'),question=question('为什么不能只 setInterval 而不在 Effect 中返回清理函数？','组件卸载或 Effect 重建后，旧计时器仍可能继续运行，导致重复工作和资源泄漏。清理函数负责撤销之前建立的外部连接。'),links=[link('React：useEffect 与清理','https://react.dev/reference/react/useEffect')]))
r.append(section('React Bootstrap：状态控制组件行为',list(range(19,30)),['React Bootstrap 用 React 组件重写 Bootstrap 的交互行为，避免一边用 React 管理 UI、一边又用 Bootstrap JS 手动改同一块 DOM。样式仍需要 Bootstrap CSS。','课件先展示原始 alert 的 class / data-dismiss，再展示 `<Alert variant="danger" dismissible>`。variant 是外观，dismissible 提供关闭控件；应用通常还需要在 onClose 中更新状态，决定是否继续渲染。','导入 Button、Alert 等组件即可按 props 使用。课件中的 Jumbotron 等 API 属于旧版本示例，不保证在当前版本存在；重点理解组件组合和受控状态，不背完整组件清单。'],['安装组件库不等于已经加载 CSS。','把 UI 是否出现写成状态条件。'],example=example('jsx','''// React 项目中先安装 react-bootstrap 和 bootstrap
import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
export default function Notice() {
  const [show, setShow] = useState(true);
  return show ? (
    <Alert variant="success" dismissible onClose={() => setShow(false)}>
      保存成功
    </Alert>
  ) : <Button onClick={() => setShow(true)}>再显示</Button>;
}''','开始显示绿色提示；点击关闭，把 show 设为 false，改为显示按钮。按钮把 show 设回 true。不是手动删除 DOM 后希望 React 猜到变化。'),question=question('Alert 的 dismissible 和 onClose={() => setShow(false)} 分别做什么？','dismissible 提供关闭按钮；onClose 处理关闭动作并修改应用状态。条件渲染根据 show 决定是否继续显示 Alert。'),links=[link('React Bootstrap：安装与 CSS','https://react-bootstrap.github.io/docs/getting-started/introduction/')],anchor=25))
r.append(section('React Native：同一组件思想，不同宿主界面',list(range(30,36))+[39,40,41],['React DOM 把 React 组件渲染到浏览器 DOM；React Native 把它们映射到原生平台组件。不是把 HTML 网页塞进手机浏览器。逻辑可以复用，但 div、p、CSS 选择器不能原样搬过去。','常用组件有 View、Text、Image、TextInput、ScrollView。文字放在 Text 里面；样式是 JavaScript 对象，使用 camelCase，例如 backgroundColor。数字尺寸通常表达逻辑像素，不写成 "18px"。','课件的 JavaScriptCore / bridge 图描述特定旧架构，不代表所有现代 React Native 环境都使用同一个引擎和桥接方式。考试理解 JS 逻辑与平台渲染分工即可。'],['React 是组件模型；DOM 与 Native 是不同渲染目标。','Native 样式类似 CSS，但不是完整浏览器 CSS。'],example=example('jsx','''import { View, Text, StyleSheet } from 'react-native';
export default function Hello() {
  return <View style={styles.page}>
    <Text style={styles.title}>Hello Native</Text>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#922636' }
});''','在 React Native 项目中，View 占满可用区域并让 Text 居中。默认 flexDirection 为 column，因此 justifyContent 控制纵向主轴，alignItems 控制横向交叉轴。'),question=question('React Native 的 View、Text 可以直接用 div、p 替换吗？','不可以。Native 不使用浏览器 DOM 标签；View 和 Text 对应平台组件。共享的是 React 组件与状态思路，不是所有 HTML/CSS。'),links=[link('React Native：核心组件与原生组件','https://reactnative.dev/docs/intro-react-native-components')],anchor=39))
r.append(section('Expo、环境配置与其他工具：按需查阅',[36,37,38,42,43,44,45],['Expo 提供开发工具链；课件的 QR 码、同一局域网与刷新演示用于快速在设备上预览项目。环境版本要求会变，旧的 Node v6 等数字不应当作今天的安装要求。','Flutter、Xamarin、Ionic/Cordova 与热度图是生态对照。粗略区分：原生组件渲染与 WebView 承载网页是不同路线；不用记品牌发布时间、热度百分比或全部安装命令。'],['工具用于运行和预览，不能替代对组件与状态的理解。','背景页可跳过，遇到实际配置问题再查对应版本文档。']))
r[-1]['kind']='background'
build('react','React · 重点串讲','先理解数据如何变成界面，再读 JSX、props/state 和更新过程。保留课件的类组件代码阅读能力，同时补上函数组件与 Hooks，纠正旧版本表述。',['能读出 JSX 的结果和 props 的流向。','能推导 state 更新后的界面与当前日志。','能解释清理函数、React Bootstrap 与 Native 的分工。'],r,'''
React 主题|本讲把 UI 拆成组件，以 props 与 state 驱动显示，再扩展到组件库和原生移动界面。
React 内容地图|JSX、组件、状态与生命周期是主线；Hooks、路由等属于构建应用时继续组合的能力。
React 的起源|历史动机是管理复杂交互；创建时间和人物按教授说明不需要回忆。
React 的定位|核心库专注 UI，不包办全部后端与路由，但可以与生态工具组合构建完整 Web 应用。
采用 React 的公司|公司标志说明使用范围，不构成代码分析题需要背诵的清单。
React 特性|单向数据流、JSX、虚拟 UI 表示和 SSR 支持各有分工；SSR 不是每个 React 页面默认启用。
React 的设计原则|把界面拆成组件，用数据描述结果；改变状态后让 React 处理界面同步。
JSX 的写法|className 是 JSX 属性，花括号里写 JavaScript 表达式；字符串属性与表达式值要区分。
JSX 转换原理|createElement 示例说明 JSX 会转成创建元素描述的 JS；现代转换工具也可能生成 jsx/jsxs。
从页面识别组件|导航、列表、搜索框等可以划分为组件边界；边界应围绕可复用结构和状态职责。
函数与类组件|组件接受输入并返回界面描述。类组件通过 render，函数组件通过函数返回值描述 UI。
旧分类的限制|“函数组件无状态”是早期教材说法；现代函数组件可以用 useState 等 Hooks 管理状态。
Welcome 的 props|同一组件分别收到 Sara、Cahal、Edite 等 name 时，各自显示相应输入；组件代码无需复制。
Clock 类的初始化|constructor 调用 super(props)，this.state 保存初始 date；render 用当前状态构造时间显示。
setState 与状态更新|setState 请求更新而非立即改当前快照；类组件浅合并对象，Hook setter 则替换对应状态值。
State 与 props 的关系|父组件保存 state 并传给孩子，孩子把它看作 props；改变共享数据要回到拥有者处理。
生命周期图|区分挂载、更新、卸载；图中部分 Will 系列方法已过时，新代码要重视建立外部连接后的清理。
快速入门主题|条件渲染、列表、事件和共享状态贯穿组件代码；列表 key 用稳定身份帮助匹配，不能靠索引掩盖重排。
React Bootstrap 概览|React 组件封装 Bootstrap 风格的界面；库版本与 Bootstrap CSS 版本要匹配。
为什么重写 Bootstrap JS|React Bootstrap 用组件状态管理交互，避免另一个脚本直接修改 React 正在管理的 DOM。
npm 安装组件库|安装 react-bootstrap 与 bootstrap 提供包文件，应用仍需导入组件并加载 Bootstrap CSS。
通过 CDN 加载 CSS|样式可以由外链加载；CSS 只改变外观，不会自动实现 React 状态和事件处理。
按组件导入|单独导入 Button 能明确依赖；把 Button 写成 JSX 后，行为由其 props 与事件回调决定。
原始 Bootstrap Alert|旧 HTML 使用 class 和 data-dismiss 配合脚本实现关闭；这与 React 的状态驱动组件不同。
React Alert|variant 决定提示风格，dismissible 给出关闭控件，onClose 更新应用状态以控制显示。
组件文档目录|按钮、表单、导航等都可复用；学会读 props 与事件比背组件名称更有用。
组件与状态控制|状态拥有者把值传给 UI 组件，交互事件再请求改变状态，这是整套组件库的共同用法。
组合组件示例|Container、Button、Toast 等可以组合；课件 Jumbotron 属旧 API，不能直接假定当前版本仍提供。
React Bootstrap 参考|遇到导入路径、props 或版本差异时查对应官方文档；不必记住本页网址列表。
React Native 主题|从浏览器转到移动平台后，React 的组件思想仍可用，但宿主 UI 元素不同。
DOM 与 Native 渲染|React DOM 面向浏览器节点，React Native 面向平台组件；渲染目标决定可使用的标签和能力。
Native 架构示意|课件引擎与桥接图是特定架构示意；不要把 JavaScriptCore 和旧 bridge 当成所有版本的固定配置。
React 与 React Native|前者提供 UI 组件模型，后者面向原生平台；Node 常用于开发工具，并不是手机 UI 的 DOM 渲染器。
Native 核心组件|View 是容器，Text 显示文字，Image 显示图像，TextInput 收集输入，ScrollView 提供可滚动区域。
Native 样式|样式用 JS 对象与 camelCase 属性；fontSize:18 不等于浏览器 CSS 规则字符串。
安装环境的旧要求|课件列出的环境版本是当时要求，不应继续照抄旧 Node 版本安装；配置细节按当前项目查阅。
Expo Go 预览流程|开发服务器与设备建立连接后可用二维码打开项目；同一网络与正确连接地址会影响预览是否成功。
Expo 开发环境|Expo 帮助组织工具链和预览流程，但组件逻辑仍由 React 的 props、state 与事件驱动。
Hello World Native 源码|View 包住 Text，构成原生界面的容器和文字；不是 HTML 的 div 与 p。
Hello World 样式|flex:1 占用空间，alignItems 与 justifyContent 分别控制交叉轴和主轴对齐。
iOS 与 Android 输出|同一 React Native 组件可以在两种平台显示对应原生 UI，具体细节仍可能受平台行为影响。
Native 参考资料|文档用于查核心组件与平台差异，不需要背链接或工具安装步骤。
其他跨平台方案|Flutter、Xamarin 展示其他技术路线；先区分语言、运行方式与 UI 渲染目标，不背发展年份。
Ionic 与 Cordova|这些示例帮助理解基于 Web 技术和容器的移动方案，与 React Native 的原生组件渲染有所不同。
生态热度图|热度与采用率会随时间变化，不用于推导程序输出，也不列入本版核心记忆。
''',['DOM 课件解释真实节点；React 在其上增加组件与状态管理。','React 发起数据请求，Node 后端返回数据，JSON 连接两端。'],['解释 props、state、回调各自归谁负责。','推导两次直接 setter 与两次 updater 的区别。','指出旧生命周期与函数组件无状态说法的问题。','用 View/Text 与 div/p 比较 Native 和 Web。'])

# NODE
r=[]
r.append(section('Node：浏览器外执行 JavaScript',[1,2,3,4],['Node.js 是基于 V8 的 JavaScript 运行时，不是另一门语言，也不是浏览器。它提供文件、网络、进程等服务器能力；不会自动提供 window 或 document。','非阻塞 I/O 让程序等待文件或网络时继续处理其他工作，完成后再处理结果。它不意味着普通 JS 计算会自动并行；一个很长的同步循环仍会阻塞当前事件循环。','课件目录提到 Authentication / Angular，但正文主要展开 Node 核心 API、模块、服务器框架与生态。不要把目录的一行扩写成课件没有实际讲授的完整认证系统。'],['异步 I/O ≠ CPU 密集 JS 自动并行。','浏览器与 Node 都能执行 JS，但宿主 API 不同。'],example=example('js','''console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');''','在 Node 中输出 A、C、B。0ms 表示尽早安排回调，不表示打断当前同步代码；真正的 I/O 回调同样需要等待适当的调度时机。'),question=question('Node 使用非阻塞 I/O，为什么一个 5 秒的同步 while 循环仍让其他请求变慢？','循环占住当前执行 JS 的线程，事件循环暂时无法运行其他回调；非阻塞 I/O 不会自动把这段 CPU 计算搬到其他线程。'),anchor=4))
r.append(section('发布、工具热度与安装历史：按需查',[5,25,31,34,35],['版本支持周期、框架热度、旧 AWS 编译命令、安装截图和链接属于环境背景。当前安装应选项目支持的版本，而不是照抄课件多年以前的版本号或用 sudo 启动普通学习程序。','这组页面不增加代码分析规则。复习先放在模块、异步结果、HTTP 报文和路由流程上。'],['不背版本发布时间、热度排名或旧编译步骤。']))
r[-1]['kind']='background'
r.append(section('CommonJS 与 ES Modules',[6,7],['CommonJS 常用 `require` / `module.exports`；ESM 常用 `import` / `export`。明确文件模式能避免“代码看着对却运行失败”：`.cjs` 用 CommonJS，`.mjs` 用 ESM；package.json 的 type 也可以指定 .js 的模式。','课件第 12 页用 require 却命名为 .mjs，会混淆模式。本版把该例改成 .cjs。ESM 的静态结构有利于工具分析依赖与 tree shaking，但不表示 Node 自动删除所有没用的代码。','ESM 可以动态 import，也支持 top-level await；不要简化成“ESM 的每条 import 都等于后台异步执行”。模块模式与业务函数是否异步是两个问题。'],['CJS：require / module.exports；ESM：import / export。','Node ESM 的相对导入通常要写完整扩展名。'],example=example('js','''// math.mjs
export const twice = n => n * 2;

// app.mjs（另一个文件）
import { twice } from './math.mjs';
console.log(twice(3)); // 6''','把两个片段分别保存到对应文件，再运行 node app.mjs。浏览器也有 ESM，但 node:fs 等 Node 专属 API 不能直接搬到浏览器。'),question=question('一个 run.mjs 中直接写 const fs = require("fs")，为什么可能报 require is not defined？','扩展名 .mjs 使它按 ESM 执行，默认没有 CommonJS 的 require。改用 import，或把 CommonJS 示例保存为 .cjs。'),links=[link('Node：ECMAScript modules','https://nodejs.org/api/esm.html')]))
r.append(section('fs：回调、Promise、同步调用',[9,12,13],['文件 API 的三种常见风格要分清：同步方法直接返回结果但阻塞；回调方法把结果交给 `(err, data)`；Promise 方法供 await 等待。await 暂停的是这个 async 流程，不是让整个 Node 进程停工。','回调式 readFile 先检查 err 再用 data。没指定编码通常得到 Buffer，指定 utf8 得到字符串。readFile 的返回值不是文件内容，不能在调用后一行直接拿到异步结果。'],['结果在哪个位置到达，是读异步代码的第一步。','异常要在回调中检查 err，或在 await 外用 try/catch。'],example=example('js','''// read.mjs；先在同一目录准备 message.txt
import { readFile } from 'node:fs/promises';
console.log('开始');
try {
  const text = await readFile('./message.txt', 'utf8');
  console.log(text.trim());
} catch (error) {
  console.log('读取失败：', error.code);
}
console.log('结束');''','message.txt 内容为 hello 时依次输出“开始 / hello / 结束”。文件不存在时输出“开始 / 读取失败： ENOENT / 结束”。await 后面的流程等待此读取完成，但运行时仍能处理其他 I/O。'),question=question('const result = fs.readFile(path, callback) 后立即打印 result，能得到文件内容吗？','不能。回调式 readFile 的文件结果在 callback 的 data 参数中到达；result 不是文件内容。'),links=[link('Node：文件系统 API','https://nodejs.org/api/fs.html')],anchor=13))
r.append(section('Buffer：字节与字符串编码',[10,11],['Buffer 是字节序列，适合文件和网络数据。字符串是字符层面的表示，必须指定编码才能在两者之间转换；字符数与字节数不必相同。','hex 与 base64 是编码，不是加密。转成 base64 不会让敏感数据自动保密；只要按同样编码规则就能还原。'],['Buffer.length 数字节；字符串 length 数 UTF-16 code units。','同一数据可以显示为文本、十六进制或 base64。'],example=example('js','''const bytes = Buffer.from('中', 'utf8');
console.log('中'.length);       // 1
console.log(bytes.length);      // 3
console.log(bytes.toString('hex'));    // e4b8ad
console.log(bytes.toString('base64')); // 5Lit
console.log(Buffer.from('5Lit', 'base64').toString('utf8')); // 中''','这个汉字在 UTF-8 中需要 3 个字节，在 JS 的 UTF-16 字符串中占 1 个 code unit。不要进一步推成“所有字符的 string.length 都等于 1”，例如部分 emoji 会占两个。'),question=question('Buffer.from("中").length 为什么不是 1？','默认 UTF-8 编码下“中”占三个字节；Buffer 数字节，不是屏幕上看到的字形数量。')))
r.append(section('断言、测试与静态检查',[14,17],['断言表达预期，失败就抛出错误；测试把这些预期组织成可重复运行的检查。课件 `1 == 2` 是故意失败的例子，不是 Node 断言 API 损坏。','Lint 根据源码结构检查风格和可疑写法；测试实际运行代码并验证行为。语法正确、lint 通过，不代表业务结果正确。'],['assert 与 test 用来验证结果。','Lint 不能代替运行、边界检查和测试。'],example=example('js','''// sum.test.mjs；运行 node --test sum.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
test('两个数相加', () => {
  assert.equal(1 + 2, 3);
});''','本例通过；把预期 3 改成 4 就失败。断言的实际值与预期值要分清。使用 strict 版本避免宽松相等掩盖类型差异。'),question=question('程序把 1+2 写成了 1+3，但语法完全正确。Lint 一定能发现吗？','不能保证。它可能符合所有静态规则，需要像 assert.equal(result,3) 这样的行为测试发现结果错误。')))
r.append(section('Streams 与 pipeline：边读边处理',[15],['readFile 通常把整个文件读入内存；stream 可以分块读、处理、写。pipeline 把多个流连起来，并处理错误传播和背压，让下游来不及时上游不要无限堆积数据。','gzip 是转换流：输入普通字节，输出压缩字节。使用 Promise 版 pipeline 并 await，才能知道整个链条已经完成，而不是刚创建流就宣布写入成功。'],['readable → transform → writable。','流降低整文件缓冲需求，但不是零内存。'],example=example('js','''// gzip.mjs；先准备 input.txt
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
try {
  await pipeline(createReadStream('input.txt'),
    createGzip(), createWriteStream('input.txt.gz'));
  console.log('压缩完成');
} catch (error) {
  console.error('压缩失败：', error.message);
}''','读取、压缩和写入按块衔接。只有 pipeline 成功完成才打印“压缩完成”；input.txt 不存在时进入 catch。'),question=question('为什么处理大文件时可能选 stream 而不是 readFile？','stream 可分块处理并通过背压控制速度，避免一次把整个文件读入内存；readFile 则通常先获得完整内容。')))
r.append(section('HTTP：请求对象进入，响应对象出去',[8,16],['`createServer((req,res)=>...)` 注册处理请求的函数；listen 开始监听端口。req 提供 method、url、headers 等信息，res 用来设置状态码、响应头和 body。`res.end` 标记响应结束。','Node 的 HTTP 模块不会自动提供 Express 风格路由，也不会自动把请求 body 解析成 JSON。req 是可读流，res 是可写流；`http.get` 则用于作为客户端发起请求，角色不同。'],['先看方法与路径，再构造状态、头、body。','客户端 HTTP 方法和服务器处理函数不能混为一谈。'],example=example('js','''// server.mjs；运行 node server.mjs
import { createServer } from 'node:http';
createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && path === '/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Hello' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(9090, '127.0.0.1');''','GET http://127.0.0.1:9090/hello 返回 200 与 {"message":"Hello"}；GET /missing 返回 404。这里为简化演示，所有其他请求也返回 404。loopback 地址只允许本机访问。'),question=question('createServer 已创建但没有调用 listen，浏览器能连到指定端口吗？','不能仅靠创建对象开始接收连接；listen 才让服务器监听地址与端口。'),anchor=16))
r.append(section('包与框架：哪些能力由谁提供',[18,19,20,22,23,24],['npm 等工具管理依赖与 scripts。package.json 描述依赖范围和命令，lockfile 记录具体解析结果。Node 内置的 fs/http 不需要 npm install；Express 等第三方包需要安装。','框架在 HTTP 上补上路由、中间件、解析、验证等能力。Fastify 强调插件、schema 和 hooks；Hono 用 Context 组织请求响应，`await next()` 前后可包裹后续处理；Elysia 常把类型和验证 schema 放在路由定义附近。','课件对框架的速度、流行程度或异步支持有简化。Express 5 能将返回 Promise 的路由错误交给错误处理；不能背成“Express 不支持 async/await”。选择题重点是概念分工，而不是某个框架永远最快。'],['框架包装重复工作，不改变 HTTP 请求响应本质。','schema 验证必须在使用不可信输入前执行。'],table=dict(headers=['工具/概念','作用','例子'],rows=[['npm','管理依赖与脚本','npm install express'],['路由','方法 + 路径 → 处理函数','GET /users/:id'],['解析','字节转换成数据对象','JSON body → req.body'],['验证','检查数据满足约束','name 必须是非空字符串'],['中间件 / hook','在请求流程中插入处理','记录日志、认证、统一错误处理']]),example=example('js','''// Hono 中间件片段（需已创建 app）
app.use('*', async (c, next) => {
  console.log('before');
  await next();
  console.log('after');
});
app.get('/hello', c => {
  console.log('handler');
  return c.text('Hello');
});''','正常 GET /hello 的日志顺序是 before → handler → after。await next() 把后续处理包在中间；这与只从上到下读静态代码不同。片段需要 Hono 项目和对应运行适配器，不能当成无依赖 Node 文件直接执行。'),question=question('JSON parser 与 schema validator 是同一件事吗？','不是。parser 把合法 JSON 文本变成 JS 值；validator 再检查该值是否符合字段、类型、长度等业务要求。'),links=[link('Express 5：异步错误处理','https://expressjs.com/en/guide/error-handling/')],anchor=23))
r.append(section('Express：沿着请求走一遍',[21],['中间件按注册顺序运行。`next()` 让处理继续；发送响应后通常 return，防止继续执行到另一次发送。`express.json()` 必须放在读取 JSON body 的路由前。','路径参数、查询参数、请求体来自不同位置：`/users/7?sort=name` 中 id 来自 params、sort 来自 query；POST 的 JSON 字段来自 body。参数最初通常是字符串或解析结果，还需要验证。','课件的静态文件中间件可能直接结束请求；放在它后面的日志中间件不一定会执行。请求流程要看“谁调用 next、谁结束响应”，不能假设所有 app.use 都会跑完。'],['先解析，再验证，再处理业务，再响应。','params、query、body 三者不能互换。'],example=example('js','''// app.mjs；先 npm install express，再 node app.mjs
import express from 'express';
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, sort: req.query.sort ?? 'name' });
});
app.post('/users', (req, res) => {
  if (typeof req.body?.name !== 'string' || !req.body.name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  res.status(201).json({ name: req.body.name.trim() });
});
app.listen(3000, '127.0.0.1');''','GET /users/7?sort=date → 200，{"id":"7","sort":"date"}。POST /users，Content-Type:application/json，body {"name":" Ada "} → 201，{"name":"Ada"}。空对象或缺少正确解析出的 name → 400。本例只演示校验与响应，并未把用户保存到数据库。'),question=question('为什么把 express.json() 放在 POST 路由后面可能导致 req.body 不可用？','前面的路由执行时还没经过解析；如果已经结束响应，后面的 parser 也不会补救。应先注册 parser，再读取 body 并验证。')))
r.append(section('常用包：按问题分类，不背清单',[26,27,28,29,30],['CORS 是服务器用响应头告诉浏览器哪些来源可读取响应，不是身份认证；express.json 提供内置 JSON body 解析。Socket.IO 用于事件通信；MongoDB driver 访问数据库，Mongoose 提供对象建模；Passport 提供认证策略组织能力。','fetch / axios 是 HTTP 客户端。fetch 收到 404 仍通常得到正常 Response，需要检查 response.ok；网络层失败才会走拒绝。库名称只是工具，先判断是解析、通信、存储还是认证问题。','xml2js 把 XML 解析为 JS 数据；回调先检查 error，再使用 result。转换数据格式不会自动验证业务规则，也不会自动存数据库。'],['CORS、认证、解析、数据库是不同层的问题。','HTTP 错误状态不等于网络调用一定抛异常。'],example=example('js','''// xml.cjs；先 npm install xml2js
const { parseString } = require('xml2js');
parseString('<root>Hello xml2js!</root>', (err, result) => {
  if (err) return console.error(err.message);
  console.log(result.root); // Hello xml2js!
});''','这个简单根节点解析后 root 对应字符串。更复杂的 XML，尤其重复元素，会有不同对象/数组结构；不要把一个简单例子推成所有 XML 都得到同样形状。'),question=question('fetch 得到 HTTP 404，是否一定进入 catch？','不一定。通常会 resolve 一个 status=404、ok=false 的 Response；代码需要检查 ok 或 status。网络失败等才会 reject。'),anchor=29))
r.append(section('云 SDK 与部署监听地址',[32,33],['云 SDK 让 Node 程序调用云服务；部署平台负责运行你的程序。能在本地调用 AWS SDK，不等于应用已经部署在 AWS。','把本地 HTTP 程序放到托管容器时，常见要求是监听平台给出的 PORT，并绑定 0.0.0.0 接收容器外部流量。只监听 127.0.0.1 可能导致平台健康检查无法连接。具体平台配置按部署文档确认。'],['调用云 API 与托管应用是两件事。','端口、监听地址、环境变量共同影响可访问性。'],example=example('js','''// 部署时替换本地 Express 示例最后一行
const port = Number(process.env.PORT || 8080);
app.listen(port, '0.0.0.0');''','本地没有 PORT 时用 8080；平台传入 PORT 时使用平台端口。此片段需放在已经创建 app 的 Express 程序内，不是独立完整服务器。'),question=question('程序在容器内只绑定 127.0.0.1，为什么外部入口可能连不上？','它只接收容器自身 loopback 的连接；平台入口通常需要程序在可对外接收连接的接口如 0.0.0.0 上监听。')))
build('node','Node.js · 重点串讲','把 Node 当成会处理文件和 HTTP 的 JavaScript 运行时。读题时追踪：模块怎样加载、结果什么时候到达、请求经过哪些处理、最终发送什么响应。',['能区分 CJS/ESM、同步/回调/Promise。','能跟踪 HTTP 与 Express 的一次完整请求。','能解释 Buffer、streams、包与云部署各自解决的问题。'],r,'''
Node.js 主题|本讲把 JavaScript 放到浏览器外运行，重点转向文件、网络、模块与后端请求处理。
Node 能力概览|运行时提供底层 API，包管理器安装扩展，框架包装路由与中间件，这三层分工不同。
本讲目录的边界|目录提及认证和 Angular，但正文重点是 Node API 与框架示例，不应把未展开的标题当成完整教学内容。
事件驱动与非阻塞 I/O|等待 I/O 时可以处理其他任务，但普通 JS 长循环仍会阻塞当前事件循环。
版本与支持周期|课件的具体版本号和发布时间会过期；理解支持周期，不背旧版本为当前安装要求。
两种模块系统|require/module.exports 属于 CommonJS，import/export 属于 ESM；先确定文件的执行模式。
模块系统比较|静态依赖结构有利于工具分析，动态 import 仍可按需加载；模块系统不同于业务函数是否异步。
HTTP 核心模块|createServer 接收请求并生成响应；request/get 发起客户端请求；两种角色不要混淆。
文件系统 API|回调、Promise 与同步方法的结果交付方式不同，是否指定文本编码决定得到字符串还是 Buffer。
Buffer 的作用|文件和网络传输面对字节，Buffer 表示字节序列；字符串需要编码后才能变为字节。
Buffer 编码转换|同一字节序列可转成 hex、base64 或 UTF-8 文本；base64 是可逆编码，不是加密。
CommonJS 读文件例子|require 风格应放在 .cjs 等 CommonJS 环境；课件命名 .mjs 会与其代码风格冲突。
Promise 读文件例子|fs/promises 配合 await 获得读取结果，错误由 try/catch 处理；文件路径相对运行时工作目录。
断言与单元测试|assert 用预期检查实际值；故意让 1 与 2 比较失败，是展示错误报告而非 API 失效。
流式压缩文件|读取流经过 gzip 转换流写入目标；pipeline 负责连接、错误传播与背压，await 等待完成。
创建 HTTP 服务器|listen 才开始监听，处理函数根据 req 构造 res；writeHead 设置状态与头，end 结束响应。
静态分析与 lint|AST 分析能发现部分结构或风格问题，但不能保证运行时业务结果正确，需要与测试配合。
包管理工具|npm、pnpm、Yarn 负责依赖管理等任务；它们不是新的 JavaScript 运行时或 HTTP 协议。
npm 命令与项目文件|install 安装依赖，run 执行 scripts；package.json 描述项目，lockfile 记录具体依赖解析。
框架选择与版本差异|不同框架提供路由、验证和插件等抽象；Express 5 能处理返回 Promise 的路由错误，不能沿用过时评价。
Express 请求链|中间件按顺序执行，解析和验证应早于业务处理；next 继续，发送响应通常结束本次处理。
Fastify 示例|schema、插件与 hooks 帮助组织请求处理；课件 MyPlugin 是占位依赖，不能缺少定义就直接运行。
Hono 示例|Context 封装请求与响应，await next() 允许中间件包裹后续处理，形成 before/handler/after 顺序。
Elysia 示例|路由附近的类型 schema 可以约束请求体，如 name 最小长度；验证通过后才进入正常业务处理。
框架采用率图|图表属于某个时间点的生态背景，不证明某个框架永远更快，也不用背下载量。
CORS 与 body parser|CORS 管理浏览器跨源读取许可，parser 把 body 变成数据；两者都不等于认证。
异步与通信工具包|xml2js、Socket.IO 等解决不同任务；旧 Promise 工具名只作生态背景，不需要逐项死记。
测试与数据库工具|Jest 组织测试，MongoDB driver 连接数据库，Mongoose 提供对象建模；不能把它们当同一层工具。
HTTP 客户端与认证包|fetch/axios 发请求，Passport 组织认证策略；得到 404 Response 时仍需显式检查状态。
xml2js 转换示例|parseString 把 XML 转成 JS 结构，先处理 err 再使用 result；简单根文本可直接读 result.root。
AWS 上的旧安装步骤|手动下载编译的命令是历史环境示例，不适合当作今天部署 Node 的统一流程。
AWS SDK|SDK 让程序调用云服务 API，与把整个程序托管在云上是不同操作。
Google Cloud 托管|部署时关心平台端口、监听地址与环境；本地 loopback 服务器不能自动成为外部可访问服务。
桌面安装说明|macOS 与 Windows 的安装截图只说明配置入口；具体版本要求按当前项目环境确认。
Node 参考资料|遇到 API 和模块差异再查官方文档，复习优先回到异步、数据、HTTP 和路由的主线。
''',['JS 基础提供函数、对象、回调；HTTP 课件提供状态码和报文结构。','React 在客户端呈现 JSON 数据，Node 在服务器验证输入、访问服务并返回响应。'],['追踪异步结果与错误处理的位置。','解释同一文件为何在 .cjs 与 .mjs 下可能不同。','按方法、路径、query、body 推导响应。','区分 CORS、认证、解析、验证与数据库。'])

# Compact final recaps: old detailed notes and existing page IDs remain intact.
decks=json.loads((ROOT/'content/decks.json').read_text())
next(d for d in decks if d['id']=='web')['description']='基础架构、URL 与请求响应'
def core(slug,title,sections,prompt,answer,anchor,connections):
    for s in sections:s['kind']='concept'
    sections[-1]['question']=question(prompt,answer)
    data=dict(id=slug,title=title+' · 旧章核心回顾',intro='只回顾这一章最值得保留的规则。能解释下面的例子并回答一道自测后，就可以继续新增课件；这不是正式题量或命题预测。',goals=[s['title'] for s in sections],sections=sections,connections=connections,examChecklist=[prompt],compact=True)
    write(Path('content/final-core')/(slug+'.json'),data)
    deck=next(d for d in decks if d['id']==slug)
    deck['corePages']=sorted({p for s in sections for p in s['pages']})
    assert anchor in deck['corePages']
    deck['coreQuestion']=dict(page=anchor,**question(prompt,answer))

core('intro','课程导览',[
section('浏览器、服务器与云的分工',[7,8,9,10,17,18,23,24,25,26],['浏览器负责请求资源、解析 HTML/CSS、执行客户端 JS；服务器处理请求、访问数据并返回响应。数据库通常由后端访问，不能把所有网站工作都归给浏览器。','云服务的核心是管理责任边界：IaaS 提供基础设施，使用者仍管理较多系统与应用；PaaS 承担更多运行环境管理；SaaS 直接提供可使用的软件。具体产品排名与市场份额不用背。'],['同一页面可以发出多次请求。','云端运行不等于客户端职责消失。'],example=example('text','浏览器点“搜索” → 后端收到查询 → 查询数据 → 返回 JSON → 浏览器渲染列表','后端返回的是数据；列表的布局和交互仍由客户端 HTML/CSS/JS 完成。'))],
'搜索页拿到 JSON 后由谁生成可见列表？云托管是否改变这一步？','在这种客户端渲染设计中由浏览器生成列表；云托管改变服务器运行位置或管理方式，不自动改变前后端分工。',8,['连接新课件：React 管界面，Node 管后端请求，Responsive CSS 管布局。'])
core('web','Internet 与 Web',[
section('网络、Web 与 URL',[52,53,54,55,56,57,58],['Internet 是网络互联基础设施；Web 是运行其上的应用体系，常用 URL 定位资源、HTTP 交换请求响应、HTML 组织文档链接。两者不是同义词。','URL 分清 scheme、host、port、path、query、fragment。fragment 留给客户端，不包含在通常的 HTTP 请求目标中；拼接查询值时编码该值，避免 & 等字符被当成分隔符。'],['URL 的路径不一定是服务器磁盘上的真实文件路径。','同源看 scheme、host、有效 port，不看 path。'],example=example('js',"const u = new URL('https://example.com:8443/items?q=web#details');\nconsole.log(u.pathname); // /items\nconsole.log(u.search);   // ?q=web\nconsole.log(u.hash);     // #details",'请求目标是 /items?q=web；#details 由浏览器端解释。端口 8443 与默认 HTTPS 443 不同。'))],
'https://example.com/a 与 https://example.com/b#top 是否同源？fragment 会发给服务器吗？','同源：scheme、host、默认端口相同。路径和 fragment 不影响同源判断；fragment 不随通常的 HTTP 请求目标发送。',56,['Node 路由解析 path/query；React 可以处理页面状态或客户端路由。'])
core('html','HTML',[
section('结构与属性：源码最终成为 DOM',[14,15,20,21,23,24,35,36,37,42,45,58],['HTML 表达语义结构，CSS 决定主要外观，JS 添加行为。id 应在文档内唯一，class 可共享；浏览器可能修复无效嵌套，因此原始源码不一定与最终 DOM 完全一致。','表格按“网格位置”读：colspan 横跨列，rowspan 纵跨行，被占的位置下一行不要重复补格。实体 &lt; 显示 <，不是开始新标签；img 的 alt 描述内容，src 指向资源。'],['标签、属性、文本是不同部分。','合并单元格后数逻辑列数，不只数 td 标签。'],example=example('html','''<table border="1">
  <tr><th rowspan="2">A</th><td>B</td></tr>
  <tr><td>C</td></tr>
</table>''','总计两列：左侧 A 占两行；右侧上面 B、下面 C。第二行不能再给 A 的位置添加一个单元格。'))],
'例子第二行只有一个 td，为什么整张表仍是两列？','第一行 A 的 rowspan=2 已占用第二行第一列；第二行的 C 填在第二列。',36,['JSX 借用了 HTML 风格写法，但 className、事件与表达式要按 React 规则理解。'])
core('css','CSS',[
section('先匹配，再层叠；再计算盒子',[18,19,20,26,27,28,39,40,41,53,54],['先判断选择器是否匹配，再在适用声明中比较层叠。相同来源、重要性和层的普通规则下，通常按 ID、class/attribute/pseudo-class、元素三档比较 specificity；相同再看后写者。继承只在属性适用时补值，不等于父元素选择器权重与子元素直接规则竞争。','content-box 的 width 只指内容区；border-box 的 width 包含 padding 与 border，不含 margin。relative 保留原位置；absolute 脱离普通流，并根据包含块定位。'],['!important 不是简单给 specificity 加分。','计算外占宽度时分清 width 的盒子范围。'],example=example('css','''#note { color: red; }
.note { color: blue; }
.box { width: 200px; padding: 10px; border: 2px solid; }
/* <p id="note" class="note">Hi</p> */''','同层同来源普通声明下文字是红色。box 默认 content-box，边框盒宽 200+20+4=224px；改成 border-box 则边框盒宽200px，内容区宽176px。'))],
'默认 content-box，width:200px、左右 padding 各10px、左右 border 各2px，边框盒多宽？改为 border-box 呢？','前者 224px；后者 200px。margin 不包含在这两个边框盒数值中。',39,['新增响应式内容还要在层叠前判断 @media 条件是否成立。'])
core('jsbasics','JavaScript 基础',[
section('作用域、类型与引用',[23,24,31,32,33,34,37,38,41,42,43],['let/const 是块作用域，var 是函数作用域。const 限制绑定重新赋值，不会冻结对象。对象与数组赋给另一个变量后，两者可能指向同一对象。','函数是值：传 f 是传函数，写 f() 是立即调用。输入框的 value 是字符串，需要按题意转换成数值；空字符串、0、null、undefined 等是假值，但 []、{} 都是真值。'],['先标注类型和引用关系，再推输出。','修改共享对象与把变量指向新对象是两种操作。'],example=example('js','''const a = [1];
const b = a;
b.push(2);
console.log(a.length); // 2
const c = [...a];
c.push(3);
console.log(a.length, c.length); // 2 3''','a 和 b 共享同一个数组；c 是浅拷贝后的新数组。浅拷贝不会递归复制嵌套对象。'))],
'const obj={n:1}; obj.n=2 合法吗？obj={n:3} 呢？','前者合法：修改对象属性没有重绑变量。后者不合法：const 绑定不能被重新赋值。',32,['React state 更新需要创建新对象；Node 回调和中间件都依赖函数值。'])
core('json','JSON',[
section('文本格式与 JS 值分开',[3,4,5,6,7,15,19,22,32],['JSON 是数据文本格式，不是任意 JS 代码。键和字符串用双引号；允许对象、数组、字符串、数字、true/false/null，不允许 undefined、函数、注释和尾随逗号。根值不必是对象。','JSON.parse 把文本变成 JS 值；stringify 反向序列化，但不保证保存所有 JS 特性。例如对象中的 undefined 属性通常被省略，数组中的 undefined 位置变为 null。同源限制与 CORS 属浏览器访问控制，不是 JSON 语法。'],['合法 JSON 与字段满足业务要求是两回事。','不要用 eval 代替 JSON.parse。'],example=example('js','''const text = JSON.stringify({ a: undefined, b: [undefined, 2] });
console.log(text); // {"b":[null,2]}
console.log(JSON.parse(text).b[1]); // 2''','对象属性 a 被省略；数组位置保留为 null。序列化后再解析不一定等于原始对象。'))],
'{"ok":true,} 是合法 JSON 吗？JSON.parse 与 stringify 分别向哪个方向转换？','不是，末尾多了逗号。parse：JSON 文本 → JS 值；stringify：JS 值 → JSON 文本，部分值可能丢失或被替换。',22,['React 与 Node 常通过 JSON 交换数据；Node 的 JSON parser 不代替输入验证。'])
core('python','Python 与后端',[
section('对象共享与请求处理',[9,10,23,26,39,40,46,47,58,59,65],['赋值通常让名字指向对象；可变列表的别名会一起看到修改，浅拷贝只复制外层。函数默认参数在定义时求值，默认可变列表可能跨调用共享，应常用 None 后在函数内创建。','后端框架把方法与路径映射到函数，函数读取输入并返回数据。Flask 的路径参数、request.args 与 JSON body 来源不同；返回 JSON 不等于把 Python 对象直接放到浏览器内存。'],['== 比内容，is 比身份。','后端仍要检查字段、类型和边界。'],example=example('python','''def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
print(add(1))  # [1]
print(add(2))  # [2]''','若改成 items=[] 默认参数，未显式传列表的两次调用会共享同一个列表，第二次得到 [1, 2]。'))],
'为什么 def add(x, items=[]) 可能让两次调用的结果串在一起？','默认列表在函数定义时创建，后续省略该参数的调用复用同一对象。用 None 作为默认值，在每次调用内部创建新列表可避免此共享。',40,['Node Express 与 Flask 都在做路由、解析、验证、响应；语言不同，职责相通。'])
core('dom','DOM',[
section('节点、集合与修改结果',[5,6,7,11,12,19,20,25,27,28,29,30],['DOM 把文档表示成树，元素节点与文本节点都在其中。children 只看元素，childNodes 还包含文本/注释；源码中的空白可能成为文本节点。','querySelectorAll 返回静态 NodeList；getElementsByTagName 等常见集合是 live，会随文档变化。appendChild 已有节点会移动它；cloneNode 才创建副本。textContent 写文本，innerHTML 会解析标记并替换内容。'],['数节点前先确定是否算空白文本。','遍历 live 集合并删除成员可能跳过元素。'],example=example('html','''<ul id="a"><li id="item">One</li></ul>
<ul id="b"></ul>
<script>
  const item = document.getElementById('item');
  document.getElementById('b').appendChild(item);
  console.log(document.querySelectorAll('#a li').length); // 0
</script>''','One 被从 a 移到 b，没有复制出第二个 li。若需要复制，可 appendChild(item.cloneNode(true))，同时避免重复 id。'))],
'把已有 li appendChild 到另一个 ul 后，原 ul 中还会留一份吗？','不会，已有节点被移动；只有显式克隆才会得到另一个节点。',7,['React 管理 DOM 更新时，不要随意用其他脚本移动同一批节点。'])
core('forms','Forms 与 CGI',[
section('哪些值提交，提交到哪里',[4,5,6,7,18,19,20,28,37,38,42,47],['表单提交主要使用有 name、未 disabled 且满足提交条件的控件。未选中的 checkbox/radio 不提交；readonly 与 disabled 不同，readonly 的可提交字段通常仍会提交。id 不是提交字段名。','GET 通常把编码后字段放 URL query；POST 通常放请求体，Content-Type 说明编码格式。POST 本身不等于加密，传输保护依赖 HTTPS。CGI 是 Web 服务器与外部程序的接口：读取请求输入，输出响应头、空行和内容。'],['字段是否出现与字段值是否为空要分开判断。','方法、输入位置、编码格式分别判断。'],example=example('html','''<form method="get" action="/search">
  <input name="q" value="web tech" readonly>
  <input name="debug" value="1" disabled>
  <input type="checkbox" name="new" value="yes">
  <button>搜索</button>
</form>''','不勾复选框时，典型请求目标为 /search?q=web+tech。q 提交；debug 因 disabled 不提交；new 因未选中不提交。'))],
'例子中 readonly、disabled 和未勾选 checkbox 哪些值会提交？','q 会提交；debug 和 new 不提交。readonly 只限制编辑，disabled 排除提交，未选中的 checkbox 不产生该字段。',6,['Node 中 params、query、body 的区别来自这些请求输入位置。'])
core('vibe','Vibe Coding',[
section('把要求变成能验收的行为',[2,5,21,24,25,28,29,38,39,41,43],['有效循环是：说清输入输出与约束 → 生成 → 运行 → 观察具体错误 → 修改 → 回归。代码生成成功和页面“看起来像”都不是正确性证据。','提示里给正常例子、边界例子与失败条件。调试时保留报错和复现步骤；修复一个地方后回测原本正确的路径，尤其检查类型、异步竞态和前后端接口。'],['先定义可观察的验收标准。','生成、测试、部署验证是不同阶段。'],example=example('text','需求：把摄氏度转换成华氏度。\n规则：F = C × 9/5 + 32。\n验收：0 → 32；100 → 212；-40 → -40。\n异常：空输入提示填写，非数字提示错误。','只测试 0 会漏掉很多计算与类型错误；输入来自表单时还要确认字符串转换。'))],
'AI 生成的温度转换器在 0℃ 时显示 32℉，能说明程序正确了吗？','不能。还应测试 100、负数、空值、非数字等，以及交互和错误提示；单个样例通过不足以证明所有行为正确。',5,['新增 React/Node 示例也按输入、状态变化、可见结果来检查。'])
core('ai','AI Basics',[
section('模型能力、工具行动与人的验证',[6,32,33,34,35,38,39,40,41,57,58,59,60],['感知型系统识别输入，生成型系统产生内容，代理型流程会结合目标、工具与反馈执行步骤。模型输出一段“已完成”文字，不等于外部操作真的发生；要查看工具结果与最终状态。','Software 1.0 强调人写显式规则，2.0 强调从数据学参数，3.0 强调通过自然语言等方式指导模型。它们是理解编程方式的框架，不是说新方式会完全替代旧方式。','保留工程原则：先想清楚、尽量简单、只改必要范围、围绕目标验证。芯片品牌、集群规模、采用率和发展年份不放进核心记忆。'],['区分模型生成的内容与工具造成的状态改变。','以实际结果检查任务是否达成。'],example=example('text','目标：查找并显示天气。\n模型：决定调用天气工具。\n工具：返回温度与观测时间。\n程序：检查结果后显示；失败时说明缺失。','没有工具结果时，不能把模型生成的温度当成一次真实查询结果。'))],
'模型说“我已经保存文件”与文件真的保存成功之间，缺少什么证据？','需要实际写入动作及成功结果，必要时读取文件确认内容。语言输出本身不是外部状态已改变的证明。',38,['Vibe Coding 和代理工具都要落实到可检查的输入、动作与结果。'])
core('jsadvanced','JavaScript 进阶',[
section('转换、比较与正则返回值',[26,27,43,44,45,46,47,48,49,50,51,52,53,54,63],['+ 可能做字符串连接，其它数值运算通常触发数值转换；=== 不做类型转换，对象比较看引用身份。传入对象时共享其引用值：修改属性能被外部看到，给参数重新赋值则不会重绑外部变量。','正则 test 返回布尔值，exec 返回匹配结果或 null；捕获组可用于读取与替换。带 g/y 的正则有 lastIndex 状态，重复 test 不一定得到相同结果。闭包保留对词法环境的访问，不是复制一张永久冻结的变量快照。'],['先写类型，再推运算。','正则题要看 flags、捕获组和调用次数。'],example=example('js','''console.log('5' + 1);     // "51"
console.log('5' - 1);     // 4
console.log(5 === '5');   // false
console.log({} === {});   // false
const re = /a/g;
console.log(re.test('a'), re.test('a')); // true false''','第二次 test 从上次成功后的 lastIndex=1 开始，因此在长度 1 的字符串中失败；失败后 lastIndex 会复位。'))],
'为什么同一个 /a/g 连续两次 test("a") 得到 true、false？','全局正则维护 lastIndex。第一次成功后位置为 1，第二次从那里继续找不到 a；不能把它当成每次都从头的无状态判断。',50,['Node 的输入验证与 React 的事件处理都会遇到类型和闭包问题。'])
core('http','HTTP 与网络',[
section('报文、方法、状态码与缓存',[23,24,25,26,31,32,33,38,40,42,43,49],['请求读 method、目标、headers、可选 body；响应读 status、headers、可选 body。GET 语义上安全且幂等，PUT/DELETE 通常幂等但不安全；幂等看重复执行的预期效果，不要求每次状态码相同。','200 成功，201 创建，3xx 重定向或验证，4xx 客户端侧请求问题，5xx 服务器问题。缓存仍新鲜可直接使用；过期后可用 ETag / If-None-Match 验证，未改变时 304 不携带新的资源表示，客户端复用已缓存 body。'],['Content-Type 解释 body 的格式。','CORS 不等于认证，HTTPS 不等于业务一定正确。'],example=example('http','''GET /items HTTP/1.1
Host: example.com
If-None-Match: "v3"

HTTP/1.1 304 Not Modified
ETag: "v3"''','这是请求与响应的示意。服务器确认当前表示仍匹配 v3，浏览器更新缓存信息并复用原 body；304 不是“服务器返回空白页面”。')),
section('分层与子网：只保留计算骨架',[50,51,54,63,64,65,66,71,72,73,74],['DNS 解析名字，IP 负责寻址与路由，端口定位传输端点，HTTP 表达应用层请求响应。HTTP 的状态码与 TCP 连接是否建立不是同一个问题。','IPv4 /n 表示 n 位网络前缀。/26 留 6 位，块大小 64；在普通子网题中扣网络地址和广播地址，剩 62 个主机地址。例如 192.168.1.70/26 属于 .64–.127，主机范围 .65–.126。'],['先算块大小，再找所在区间。','/31、/32 有特殊用途，别把减 2 机械套到所有前缀。'])],
'192.168.1.70/26 的网络地址、广播地址和普通可用主机数分别是多少？','网络地址 192.168.1.64，广播地址 192.168.1.127；普通可用主机数 2^6−2=62。',71,['Node HTTP 示例把这些报文规则落成代码；路由框架没有改变协议语义。'])

write(Path('content/final-core/syllabus.json'),dict(id='syllabus',title='Final · 范围依据与复习顺序',compact=True,intro='以当前 Fall 2026 v3 syllabus 和教师最新通知为准。本页区分已写明的考试安排与口头补充，避免把课程总评分比例误当成考题比例。',goals=['先学新增课件，再回顾旧章核心。','用理论解释与代码结果检验理解。'],sections=[
section('Syllabus 明确写出的安排',[4,5],['Exam #2：2026 年 12 月 3 日（周四）17:00，60 分钟，占课程总评 40%。考试以理论为主，也可能分析代码，不要求现场写代码。','当前 syllabus 没有写出 final 中 midterm 内容的具体百分比。总评占比 40% 不是旧知识在 final 中的占比。期末项目演示是另一个考核项目，不要把 12 月 10 日演示时间当作这场笔试时间。'],['考试日期与要求来自 syllabus PDF 第 4–5 页。','最终安排以教师最新通知为准。']),
section('本站的复习取舍',[8],['按你转述的教师说明：旧内容只少量抽查，大致每章一题。因此旧 13 章只保留核心回顾与一道自测；这个安排是复习策略，不是正式题量承诺。','已收录的期末新增课件作为优先学习内容，具体章节与页数见复习目录。它们不代表 final 的全部最终范围；收到后续材料后继续补充，范围以教师最新通知为准。','发展历史按教授原话无需重读和记忆；混在历史页中的技术规则另行保留。先读新课串讲并做代码推演，再扫旧章核心；答不出的概念才展开原页。'],['复习顺序：新增串讲 → 对照代码 → 旧章核心 → 薄弱页。','页码采用 PDF 阅读器序号，不采用幻灯片页脚编号。'])],connections=['新旧知识连成一条请求链：响应式界面 → React 状态与组件 → HTTP / JSON → Node 路由 → Cookie 与身份 → REST 资源接口。'],examChecklist=['能否说明 40% 是课程成绩权重，而不是旧内容题量比例？','是否把当前新增课件与最终完整范围区分开？']))
write(Path('content/decks.json'),decks)
print('Wrote 139 new slide notes, 3 full interpretations, 13 compact recaps and final syllabus guide.')
