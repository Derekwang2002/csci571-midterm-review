"""Cookie / REST final notes. Numbering follows PDF positions, not printed footers."""
from review_content import build, example, question, section, link

c=[]
c.append(section('Cookie 是随请求出示的小纸条',[1,2,4,7,8,9],[
 'HTTP 不会因为你上一次登录成功，就自动知道下一次请求是谁。服务器可以给浏览器一张小纸条，例如 sid=abc；浏览器保存后，在符合规则的请求中把它带回来。服务器再用 abc 查登录状态、购物车或偏好。',
 'Cookie 保存的是数据，不是会运行的程序。它不能自行读取你的任意文件；服务端也不是直接翻阅浏览器的全部 Cookie，而是看到请求实际携带的值。个人信息通常来自用户提交、访问记录或后台关联。'],
 ['Cookie 是状态的载体，不等于完整的用户资料。','持久 Cookie 也可以只保存语言偏好，不一定用于追踪。'],
 question=question('浏览器只发送 sid=abc，服务器怎么知道用户是谁？','服务器可用 abc 查会话记录，再找到用户。Cookie 不必包含姓名和密码；身份关联可能在服务器端完成。')))
c.append(section('属性分工：范围、期限、发送与读取',[5,6,15],[
 '把属性分成四问：发给谁（Domain / Path）、存多久（Expires / Max-Age）、什么请求可携带（Secure / SameSite）、脚本能否读（HttpOnly）。这些规则共同生效，不能只满足一个就判定会发送。',
 '课件第 6 页把 Path 默认值写成 /，这不普遍成立：省略时根据设置 Cookie 的请求路径计算默认目录，例如 /docs/page 的默认 Path 是 /docs。省略 Domain 则是 host-only；显式 Domain=example.com 才能在满足其它条件时包含其子域。',
 'SameSite 比较的是 site，不只是 origin：同一站点的不同子域可能同站却跨源。Strict 限制跨站携带；显式 Lax 允许部分顶层安全方法导航，但通常不允许跨站 iframe / fetch；None 允许跨站资格且需 Secure，仍可能受浏览器策略阻止。Session Cookie 通常随会话结束失效，但会话恢复功能可能恢复它。'],
 ['Secure 不等于 HttpOnly；HttpOnly 也不阻止浏览器发送 Cookie。','Max-Age 和 Expires 同时出现时，以 Max-Age 为准。'],
 table=dict(headers=['属性','控制什么','不要误解为'],rows=[['Domain / Path','哪些主机与路径可收到','Path 是可靠的访问权限边界'],['Max-Age / Expires','到期时间','关标签页一定清掉全部 Cookie'],['Secure','通过安全连接携带','值被额外加密存储'],['HttpOnly','禁止 document.cookie 读写','禁止发起带 Cookie 的请求'],['SameSite','跨站携带条件','CORS 或完整的身份认证']]),
 question=question('HTTPS 页面上 sid 带 Secure; HttpOnly。document.cookie 能读它吗？同站请求还能带它吗？','脚本不能读这个 HttpOnly Cookie；符合 Domain、Path、期限及其它规则的同站请求仍可携带。Secure 与 HttpOnly 分别控制传输和脚本访问。'),
 links=[link('RFC 6265：Cookie 的范围、默认路径与替换规则','https://www.rfc-editor.org/rfc/rfc6265.html#section-5.1.4'),link('MDN：Set-Cookie 属性','https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie')]))
c.append(section('完整往返：Set-Cookie → Cookie',[20,21,22],[
 '服务器响应里的 Set-Cookie 指挥浏览器保存；后续请求里的 Cookie 只携带符合条件的 name=value，通常不把 Path、HttpOnly 等属性一起回传。若一次设置两个 Cookie，要发两条 Set-Cookie。课件的图片请求也能携带 Cookie，并非只有整页导航才会携带。',
 '对普通未分区 Cookie，更新和删除要对准同名、同 Domain、同 Path 的记录。删除通常用 Max-Age=0 或过去的 Expires；只在 / 下删除，可能删不掉原先 Path=/account 的 Cookie。缓存协商的 304 与 Cookie 的发送是两件事。'],
 ['响应设置，后续请求携带；不要把两个 header 的方向写反。','判断发送时依次检查范围、期限、Secure、SameSite 与浏览器策略。'],
 example=example('http','''HTTP/1.1 200 OK
Set-Cookie: sid=abc; Path=/account; Secure; HttpOnly; SameSite=Lax

GET /account/profile HTTP/1.1
Host: shop.example
Cookie: sid=abc

HTTP/1.1 200 OK
Set-Cookie: sid=; Path=/account; Max-Age=0; Secure; HttpOnly; SameSite=Lax''',
 '三段依次是首次响应、稍后的同站 HTTPS 请求、注销响应，省略无关头和正文。请求 /account/profile 匹配 Path；/catalog 和 /accounting 不匹配。删除时继续使用同一主机与 Path=/account。'),
 question=question('Path=/account 的 Cookie 会发到 /accounting 吗？为什么设置 Path=/ 的同名空值不一定删掉它？','不会，路径匹配要求目录边界；/accounting 不是 /account 的子路径。Path 不同可形成两条同名记录，删除必须匹配原来的 Path。')))
c.append(section('JavaScript：写一个，读可见的一组',[23,27,28,29,30],[
 '读取 document.cookie 得到分号分隔的字符串，不是数组；赋值一次通常设置一个 Cookie，不会把整罐 Cookie 替换掉。只有当前页面可见且非 HttpOnly 的记录能读到，属性本身不出现在这个读取字符串里。',
 '下面用 days 统一表示天数，以 Max-Age 秒数设置期限。课件第 27 页的 expires 参数是 Date 对象，而第 32 页传入 30；直接拼接两段代码会类型不匹配。第 29 页删除赋值还缺少名字后的等号。这里同时修正这些问题。',
 '第 28 页正则示例含排版引号，且任意名字直接拼入正则会有特殊字符问题。下面按分号拆分，再只切掉名字前缀，可保留值里的等号；空值与找不到也分开处理。示例约定名字为简单标识符、相同名字只在 Path=/ 保存一份；不尝试读 HttpOnly 或代替服务端认证。'],
 ['写入一条 ≠ 清空其它 Cookie。','删除与写入的路径保持一致，值统一 encode / decode。'],
 example=example('js','''// 在允许 Cookie 的 HTTP(S) 页面中运行；名称使用简单标识符。
function setCookie(name, value, days = 30) {
  const seconds = Math.floor(days * 86400);
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${seconds}; SameSite=Lax`;
}
function getCookie(name) {
  const prefix = name + '=';
  const pair = document.cookie.split(';').map(s => s.trim())
    .find(s => s.startsWith(prefix));
  if (pair === undefined) return null;
  const value = pair.slice(prefix.length);
  try { return decodeURIComponent(value); } catch { return value; }
}
function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
setCookie('reviewName', 'Ada = A; B');
console.log(getCookie('reviewName')); // Ada = A; B
deleteCookie('reviewName');
console.log(getCookie('reviewName')); // null''',
 '运行环境需允许写 Cookie，并且没有同名的其它路径记录。30 天转换为 2592000 秒；分号编码成 %3B，避免被当成属性分隔符。这里保存的是普通偏好；HttpOnly 登录 Cookie 应由服务器用 Set-Cookie 设置。'),
 question=question('已有 a=1，再执行 document.cookie="b=2; Path=/"，是否把 a 删除？','不会。setter 设置一条 Cookie；只要 a 仍在当前页面可见且未过期，读取字符串里可以同时包含 a 和 b。')))
c.append(section('编码能保存特殊字符，但不是加密',[24,25,26],[
 'Cookie 的值含空格、中文、分号时，先编码再保存，读取时解码。课件 escape / unescape 属于旧接口；这里用 encodeURIComponent / decodeURIComponent。不要用 encodeURI 替代单个值的编码，它会保留一些 URI 分隔符。',
 '编码只是在不同语法之间搬运字符。知道 %20 表示空格，任何人都能还原；它不会隐藏密码，也不证明值没有被修改。'],
 ['编码、加密、签名分别解决格式、保密、完整性问题。'],
 example=example('js','''const value = 'A; B=1';
const encoded = encodeURIComponent(value);
console.log(encoded);                       // A%3B%20B%3D1
console.log(decodeURIComponent(encoded));   // A; B=1
console.log(encodeURI(value));              // A;%20B=1''',
 'encodeURI 保留了分号和等号，因此不能直接替代 Cookie 值的 encodeURIComponent。输出仍然是可以还原的普通文本。'),
 question=question('Cookie 里显示 name=Ada%20Lovelace，是否说明姓名已经加密？','没有。这里只是百分号编码，decodeURIComponent 可以直接还原 Ada Lovelace。')))
c.append(section('表单偏好：保存数据，再用代码恢复界面',[31,32,33],[
 '课件表单让用户输入名字、选择背景色，保存成 Cookie。页面下次加载时要主动读取，再赋值给输入框或样式；Cookie 不会自动把背景染绿。HTML 的 name 用于提交/分组，checked 表示某个 radio 当前选中。',
 '更新同一范围的 Cookie 可以直接覆盖，不必先删除。下面复用上一节 helpers，使用白名单颜色，并给没有选择、没有旧值的情况提供默认值。'],
 ['表单输入 → Cookie 文本 → 下次读取 → DOM 更新，是四个步骤。','第 32 页传 30，必须与 helper 的“天数”参数约定一致。'],
 example=example('html','''<!-- 先加载上一节的 setCookie / getCookie helper -->
<form id="prefs">
  <input id="review-name" name="name" aria-label="名字">
  <label><input type="radio" name="color" value="white" checked>白色</label>
  <label><input type="radio" name="color" value="lightgreen">浅绿</label>
  <button>保存偏好</button>
</form>
<script>
const form = document.querySelector('#prefs');
const nameInput = document.querySelector('#review-name');
const allowed = ['white', 'lightgreen'];
const stored = getCookie('reviewColor');
const color = allowed.includes(stored) ? stored : 'white';
nameInput.value = getCookie('reviewName') ?? '';
form.querySelector(`[value="${color}"]`).checked = true;
document.body.style.backgroundColor = color;
form.addEventListener('submit', event => {
  event.preventDefault();
  const selected = form.querySelector('[name="color"]:checked')?.value;
  const next = allowed.includes(selected) ? selected : 'white';
  setCookie('reviewName', nameInput.value, 30);
  setCookie('reviewColor', next, 30);
  document.body.style.backgroundColor = next;
});
</script>''',
 '选择浅绿并保存后，当前页面变浅绿；刷新时先读 reviewColor，再恢复 radio 与背景。独立片段依赖前一节 helpers 和允许 Cookie 的页面环境。',preview=False),
 question=question('只保存 reviewColor=lightgreen，刷新后的页面会自动变绿吗？','不会。初始化脚本必须读取 Cookie，并显式设置 DOM 样式；还应恢复 radio 的 checked 状态，避免选项与结果不一致。')))
c.append(section('第三方追踪：同一个服务出现在多个站点',[14,16,34,35,36],[
 '“第三方”描述访问上下文。你在 shop.example 页面里加载 tracker.example 的资源，对该上下文来说 tracker 是第三方。页面不能直接为任意无关域设置 Cookie；通常是浏览器请求 tracker 时，由 tracker 的响应设置自己的 Cookie。',
 '若同一第三方又嵌入 news.example，浏览器策略允许未分区的跨站 Cookie 时，tracker 可能再次收到同一个 ID，于是把两个站点的访问关联起来。第 36 页还画了发布者与广告服务器之间的消息转交：服务端转发数据不等于浏览器允许一个网站任意读取另一个网站的 Cookie。'],
 ['区分当前顶层站点、实际请求目标与 Cookie 所属域。','广告画像可存在服务器数据库中；Cookie 只保存关联 ID。'],
 table=dict(headers=['所在页面','实际请求目标','可能发生什么'],rows=[['shop.example','tracker.example/ad','第三方响应设置 id=7'],['news.example','tracker.example/ad','若策略允许，收到同一个 id=7'],['news.example','news.example/article','不会因此把 tracker 的 Cookie 直接交给 news']]),
 question=question('shop.example 能直接执行 document.cookie="id=7; Domain=tracker.example"，给无关域放 Cookie 吗？','不能。域设置要满足浏览器的域匹配规则；常见跨站追踪依靠嵌入资源向 tracker 发请求，由 tracker 设置和接收自己的 Cookie。')))
c.append(section('Analytics 与 conversion：识别访问和结果',[37,38],[
 'Analytics 统计访问、停留、来源等行为；conversion 把某个广告接触与后来的购买等目标行为关联起来。例子：广告点击记下 campaign=A，购买时上报 order=42 与关联标识，用于判断这次活动是否带来转化。',
 '“只用随机 ID、不存姓名”不自动等于完全匿名：只要能持续关联同一个人的行为，仍有可识别或可关联性。课件中的某个产品期限和实现方式只是案例，不是所有 Cookie 都固定保存 30 天。'],
 ['分析关注行为统计；转化关注广告接触与目标行为的关联。'],
 question=question('一个随机 Cookie ID 不含姓名，为什么仍能用于画像？','服务器可把同一个 ID 的多次访问与行为累积在一起；可关联性不要求 Cookie 里直接写真实姓名。')))
c.append(section('CHIPS：按顶层站点分开保存第三方状态',[39,40,41,42],[
 '第三方状态也用于嵌入支付、客服、视频和登录，不全是广告。完全禁止共享状态可能影响这些功能，所以课件比较了分区 Cookie、Storage Access、相关网站集合与 FedCM 等不同机制；它们不是同一功能的别名。',
 'CHIPS 给 Cookie 增加顶层站点这一分区维度。同一 widget.example 嵌在 shop.example 和 news.example 下时，分别使用两个 Cookie 罐；在 shop 里的 ID 不会因为同属 widget 就自动搬到 news。'],
 ['Partitioned 必须配 Secure；跨站场景还要考虑 SameSite。','分区保留每个嵌入场景的状态，不提供跨顶层站点的共享 ID。'],
 table=dict(headers=['分区键（简化）','第三方主机','保存的值'],rows=[['https://shop.example','widget.example','sid=A'],['https://news.example','widget.example','sid=B']]),
 example=example('http','Set-Cookie: __Host-widget=A; Path=/; Secure; SameSite=None; Partitioned',
 '由 HTTPS 的 widget.example 响应设置。__Host- 要求 Secure、Path=/ 且不写 Domain；Partitioned 按顶层站点分区。能否接受/携带还受浏览器支持和策略影响，None 不是绕过限制的开关。'),
 question=question('分区 Cookie 在 shop 下保存 sid=A，切到 news 嵌入同一个 widget，会自动拿到 A 吗？','不会，两者的顶层站点分区不同；news 下可能是尚未设置，或已有独立的 sid=B。'),
 links=[link('MDN：CHIPS 与分区键','https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies/Partitioned_cookies')]))
c.append(section('Storage Access 与 FedCM：按用途辨别',[43,44],[
 'Storage Access API 让嵌入内容在满足条件、获得许可后请求访问未分区的状态。它不是无条件把所有网站的数据打开；初次请求通常应放在用户点击处理函数中，并处理拒绝。FedCM 则聚焦通过身份提供者完成联合登录，不是通用 Cookie 读写接口。',
 '第 43 页的示意代码不能原样使用：选项名是 cookies（复数）；无参数调用成功后兑现为 undefined，不会返回可调用 handle.cookies.set 的对象。下面使用无参数形式，再读当前文档可见的 Cookie；HttpOnly 仍不可读。'],
 ['CHIPS 分开保存；Storage Access 申请访问未分区状态；FedCM 处理联合身份。'],
 example=example('js','''// 放在需要访问状态的 iframe 中；页面已有 #connect 和 #status。
document.querySelector('#connect').addEventListener('click', async () => {
  const status = document.querySelector('#status');
  if (!document.requestStorageAccess) {
    status.textContent = '当前浏览器不支持';
    return;
  }
  try {
    await document.requestStorageAccess();
    status.textContent = '已获准访问当前嵌入来源的相应状态';
    // 此处可按业务读取 document.cookie，或重新加载嵌入内容。
  } catch {
    status.textContent = '未获准，继续使用无共享登录的界面';
  }
});''',
 '这是嵌入页面的代码片段，不会在复习网站里弹出权限请求。成功、拒绝、不支持三种分支都明确反馈；获取许可不等于已完成用户登录。'),
 question=question('希望同一个嵌入组件在两个站点各保留独立状态，应优先理解 CHIPS 还是 FedCM？','CHIPS。它解决分区存储；FedCM 解决联合身份登录，不能代替通用的组件状态存储。'),
 links=[link('MDN：requestStorageAccess 参数与返回值','https://developer.mozilla.org/en-US/docs/Web/API/Document/requestStorageAccess')]))
c.append(section('隐私控制：信号、拦截与用途分类',[45,47,48],[
 'Do Not Track 是表达偏好的信号，不等于技术上阻止请求；浏览器的 Cookie 设置与内容拦截器则可以限制存储或资源加载。某些“退出追踪”机制用 Cookie 记住退出选择，清空 Cookie 可能同时清掉这个选择。',
 '第 48 页的 necessary、performance、functional、targeting 是用途分类，和 Secure、HttpOnly 等协议属性不是同一维度。会话 Cookie 也可能用于追踪；一个分类标签本身不能证明它的实际行为。'],
 ['看机制实际阻止什么，再看它如何记住选择。','用途分类不改变 Cookie 的发送规则。'],
 question=question('某 Cookie 被标为 functional，就代表它带有 HttpOnly 吗？','不代表。functional 是用途标签，HttpOnly 是控制脚本访问的协议属性，两者独立。')))
c.append(section('认证、Session 与 Token：不要混成一件事',[49,50,51],[
 'Authentication 问“你是谁”，authorization 问“你能做什么”。认证证据常分知道的秘密、持有的设备/凭据、生物特征；用户名是标识，密码加 PIN 仍属于同一类因素。OAuth 主要解决授权，不能把“用了 OAuth”直接等同于完整的身份登录协议。',
 'Session 常见流程是登录后发不透明 ID，服务器用 ID 查会话表；自包含 token 则携带声明，服务器验证后使用。Cookie / Authorization header 描述怎样传凭据，Session / JWT 描述凭据和验证机制：Cookie 里也能装 JWT，header 里也能装不透明 token。',
 '“无状态”是指请求处理不依赖服务器记住前一次客户端会话上下文，不是不能有用户数据库。采用 JWT 也可能为了撤销、刷新令牌等保留服务端记录；不能只看 token 的格式就断言整个系统无状态。'],
 ['先分传输位置，再分服务端怎样验证。','JWT 不是 Cookie 的替代语法，它们可以组合。'],
 table=dict(headers=['比较','常见服务端 Session','自包含已签名 Token'],rows=[['客户端携带','随机会话 ID','声明与签名'],['主要验证步骤','查会话表及有效性','验签并检查声明'],['退出/撤销','可以使会话记录失效','需设计过期、撤销或其它策略'],['是否可以放 Cookie','可以','也可以']]),
 question=question('看到 Cookie: token=某个JWT，能否断定它就是“服务器保存会话表”的方案？','不能。Cookie 只说明携带方式。需要继续看服务器是查会话表，还是验证 token 中的签名与声明，或结合两者。')))
c.append(section('JWT：能读声明，不等于通过认证',[52,53],[
 '课件展示的是常见 JWS compact 形式：header.payload.signature。前两段是 JSON 的 Base64URL 编码，第三段是签名字节的编码，并不是“三段 JSON”。JWT 也存在加密封装，不能把所有 JWT 都限定为这种三段形式。',
 '把 payload 解码出来，只说明你读到了声明；验签才检查它是否被篡改，之后仍要检查 exp、nbf、iss、aud 等适用条件。HS256 使用共享密钥做 HMAC；RS256 使用非对称签名，不能把两者的密钥使用方式混为一谈。',
 'iat 是签发时间，不是到期时间；exp 用 Unix 秒表示。下面只练习“已通过验签后”的过期判断，不是完整认证代码，也不要把 Date.now() 的毫秒直接与 exp 比较。'],
 ['解码 ≠ 验签 ≠ 解密；普通签名 JWT 的 payload 不保密。','到 exp 时已过期：比较 now < exp，而不是 <=。'],
 example=example('js','''// 仅演示已验签声明中的 exp 检查；不是完整 JWT 验证器。
const claims = { sub: 'user-7', iat: 1700000000, exp: 1700003600 };
function beforeExpiry(claims, nowSeconds) {
  return Number.isFinite(claims.exp) && nowSeconds < claims.exp;
}
console.log(beforeExpiry(claims, 1700003599)); // true
console.log(beforeExpiry(claims, 1700003600)); // false
// 使用真实时钟时：Math.floor(Date.now() / 1000)''',
 '本例给定固定时钟，便于推演边界，不声称 token 当前有效。实际认证应由合适的库固定允许的算法、验证签名，并校验所需 issuer、audience、时间和权限。'),
 question=question('把 payload 中 sub 改成 admin，再重新 Base64URL 编码，会得到有效的管理员 JWT 吗？','不会。改动签名覆盖的内容后，原签名不能通过验证；仅能解码或生成三段字符串，不代表拥有有效身份。'),
 links=[link('RFC 7519：JWT 声明与验证','https://www.rfc-editor.org/rfc/rfc7519.html')]))
c.append(section('发展时间线：按教授要求跳过',[3,17,18],[
 '这些页讲隐私事件、第三方 Cookie 政策时间线及转向。按教授说明，不要求重读或回忆发展历史；不把罚款、年份或政策发布日期编入自测。',
 '其中的浏览器计划是课件当时的背景，不作为当前所有浏览器行为的保证。技术判断仍回到属性、站点上下文和实际策略。'],['跳过年份与事件，保留技术机制的区别。']))
c[-1]['kind']='history'
c.append(section('浏览器界面、产品截图与参考页',[10,11,12,13,19,46,54],[
 '这些页展示 Chrome、Firefox、Safari 的设置、Cookie 列表、阻止选项以及参考链接。能辨认名称、值、域、路径、期限即可；菜单位置、默认策略和旧产品界面不用背。',
 '在浏览器里看见已存 Cookie，不代表当前每个请求都会携带它。实际调试要同时查看存储列表与 Network 请求头，再对照范围、SameSite 等条件。'],['设置截图作背景；“存在”和“发送”分别检查。']))
c[-1]['kind']='background'

build('cookies','Cookies 与 Privacy · 重点串讲',
 '先掌握收发与作用域，再读 JavaScript 保存偏好，最后串起第三方状态、Session 和 JWT。所有页都可对照；政策时间线和浏览器菜单只作背景。',
 ['能判断某个请求是否携带 Cookie、脚本能否读取。','能解释设置、读取、覆盖与删除代码。','能区分分区状态、Session、JWT 与传输位置。'],c,'''
Cookie 这一讲学什么|主线是浏览器保存状态、服务器识别后续请求，再延伸到跨站场景与身份认证。
内容路线|先看 Cookie 数据与属性，再看 JavaScript 操作，最后理解隐私机制和认证方案。
Safari 隐私事件背景|本页的历史事件与金额无需背诵；考试复习转向浏览器怎样限制第三方状态。
Cookie 的定义|Cookie 是浏览器保存、按条件随请求发送的小段数据，不是能自行执行的程序。
一条 Cookie 有哪些字段|name/value 是数据；domain、path、期限等元信息由浏览器用来决定保存与发送。
属性与默认范围|Domain、Path、Expires、Secure、HttpOnly 分工不同；尤其不要把默认 Path 一律记成根路径。
为什么网站需要 Cookie|登录会话、偏好和购物车可借助标识关联后续请求，但具体业务状态也可能放在服务器。
网站怎样积累信息|用户输入与访问请求可被关联记录；Cookie 并不会凭空获得姓名、地址或任意磁盘内容。
Cookie 做不到什么|它没有自主执行能力，也不能越过浏览器域规则随意读取别的网站 Cookie。
Chrome 设置截图|界面只用来理解浏览器可查看和控制 Cookie；菜单名称与位置不用记忆。
Firefox 设置截图|识别隐私与站点数据控制的用途即可，不把旧版设置路径当成核心知识。
Firefox 存储列表|列表里的名称、域、路径和到期信息可以辅助判断作用域；看到记录不等于所有请求都会带上。
Safari 设置截图|不同浏览器有不同的隐私控制界面，技术判断仍应回到具体请求与策略。
第三方 Cookie 的实例|以嵌入服务的请求为参照判断第一方或第三方，不按公司名字简单分类。
Cookie 的几种分类|生命周期、HttpOnly、Secure、SameSite 是不同维度；Session Cookie 不保证浏览器恢复会话后一定消失。
跨站追踪的请求链|两个网站嵌入同一第三方时，第三方可能利用它自己域下的标识关联访问。
第三方 Cookie 政策历史|浏览器阶段性计划属于发展历史，不把路线图中的年份与进度作为记忆任务。
政策转向与应用追踪背景|这里的政策事件提供动机，不代表某种默认行为永远适用于所有用户和浏览器。
浏览器隐私策略对比|默认阻止行为受版本与用户设置影响；此页作背景，不能替代当前请求的实际检查。
浏览器处理流程|响应 Set-Cookie 进入存储；新请求时再按范围、到期、传输与跨站规则筛选。
原始 HTTP 往返|图片等子资源请求也可携带 Cookie；响应设置头与后续请求携带头的名称和方向不同。
范围、覆盖与删除|同名但不同 Path 的 Cookie 可以同时存在；删除要匹配原记录的域与路径。
document.cookie 的读写模型|getter 返回当前可见 Cookie 字符串，setter 一次设置一条；不是给数组整体赋值。
特殊字符编码|值中的分号等字符应编码，避免被当成 Cookie 语法；编码本身不提供保密性。
escape 旧示例|旧课件用 escape 处理文本；复习时改用 encodeURIComponent，并区分它与 encodeURI。
编码输出截图|空格变成转义序列只是表示形式改变，解码后仍能恢复原文。
设置 Cookie 的函数|课件使用 Date 类型的过期参数；若调用传入天数，helper 必须先完成换算。
读取 Cookie 的函数|读取要按完整名字匹配，并保留空值与值中的等号；不要直接复制排版弯引号或未转义的正则。
删除 Cookie 的函数|名字后必须有等号，再设置过期；同时匹配原来的 Domain 和 Path。
复用 Cookie helpers|把读写删除函数放在独立脚本有利于复用，但引用脚本后仍需实际调用它们。
名字与颜色表单|先区分 input 的 name、value、checked，再判断保存函数真正取到了什么值。
保存偏好的事件代码|天数和 Date 参数不能混用；同范围写入可以直接覆盖，未选中颜色要有默认处理。
恢复偏好的结果|背景色来自读取 Cookie 后的样式赋值；Cookie 的存在不会自动改变 DOM。
广告网络的参与者|发布者提供页面，广告主投放，广告网络做匹配，访问者的浏览器发起资源请求。
画像与标识关联|Cookie 可以只放匿名形式的 ID，服务器再用它关联访问与广告选择记录。
广告数据流图|区分浏览器到站点的请求和发布者到广告服务的转发；两者不代表跨域脚本可以任意读 Cookie。
Analytics 行为统计|访问来源、页面与行为可用于统计；不含姓名的标识仍可能关联同一个人的多次活动。
Conversion 转化关联|把广告接触与后续购买等目标关联起来；课件期限是案例设置，不是 Cookie 的通用固定寿命。
第三方状态的正常用途|跨站组件、支付或登录也可能依赖状态，不能把所有第三方 Cookie 都等同于广告。
嵌入内容与登录体验|视频、文档、评论等嵌入内容需要区分所属来源，以及是否能获得相应登录状态。
替代机制的内容地图|CHIPS、Storage Access、存储分区、相关网站集合和 FedCM 面向不同用途，不应互换名称。
CHIPS 分区示意|同一第三方在不同顶层站点下各自保存 Cookie；分区键阻止自动共用同一份状态。
Storage Access API|嵌入页面可以请求访问未分区状态，但需满足浏览器条件；注意课件选项和返回值写法需修正。
FedCM 联合身份|这套机制围绕身份提供者与依赖方的登录交互，不是通用的跨站数据读写接口。
退出追踪与浏览器控制|偏好信号、Cookie 策略和真正的资源拦截是不同机制；删除退出 Cookie 可能同时丢掉退出选择。
Do Not Track 设置截图|旧界面展示如何发送偏好信号；不需要背位置，也不要把信号理解为强制拦截。
内容拦截器的作用|规则可拦截某些资源或请求；是否拦截要看规则和实际请求，不由 Cookie 名称自动决定。
按用途分类 Cookie|necessary、performance、functional、targeting 描述用途，不能据此推断 HttpOnly 或 Secure 属性。
认证因素与身份|用户名用于标识；密码、持有物、生物特征属于不同证据类别，多个密码类秘密不自动变成多因素。
原生认证与凭据存储|认证流程、凭据保存位置和随请求携带方式分别判断；Cookie 与内存或 localStorage 并非同一个传输模型。
有状态与无状态认证|会话表查询与自包含 token 验证是常见对比，但 Cookie 可以承载任一种凭据。
JWT 的三段结构|常见签名 JWT 包含编码后的 header、payload、signature；第三段不是普通 JSON，解码也不等于验签。
JWT 声明与时间|iat 表示签发，exp 表示过期，单位为秒；即使还未过期，也必须验证签名和其它所需声明。
课件参考链接|参考页供追查来源，不增加新的背诵任务；关键规则已在相应章节附少量官方文档。
''',
 ['HTTP 提供 header 与请求响应；Cookie 在其上关联多次访问。','DOM / 表单负责采集和恢复偏好；Node 可以设置 HttpOnly Cookie。','与 REST 对照：保存资源数据、保留客户端会话上下文、携带凭据是三个不同问题。'],
 ['能否按 Domain、Path、期限、Secure、SameSite 判断发送？','能否说明 HttpOnly Cookie 为什么仍会随请求发送？','能否修正删除缺少等号、Path 不一致、Date 与天数混用？','能否画出同一第三方在两个顶层站点下的分区？','能否区分 JWT 解码、验签、过期检查，以及 Cookie 的携带方式？'])

r=[]
r.append(section('Web Service：让程序通过约定接口取数据',[1,2,3,4,5],[
 '人可以打开网页看书名，程序则希望拿到结构明确的数据。Web Service 把能力通过网络接口提供给程序：输入什么、用什么方法、返回什么结构，双方先有约定，客户端就不必猜页面里哪个 div 是价格。',
 '课件列出的 SOAP、REST、Cloud Services 不完全处于同一分类层次：SOAP 是消息协议，REST 是架构风格，Cloud Services 描述服务与部署能力。设计接口时把通信方式、传输协议、数据格式、认证和运行平台分开判断；JSON 或 Protobuf 是格式，不是完整架构。'],
 ['先读接口的输入输出契约，再看具体 SDK。','同一个云服务可以同时提供不同风格的 API。'],
 question=question('某服务部署在云端、返回 JSON，是否就一定是 REST？','不一定。部署位置和数据格式不足以证明 REST；还要看资源、统一接口、无状态通信等设计约束。')))
r.append(section('资源、表示与无状态请求',[8,10],[
 '把书看作资源，用 /books/7 标识它；客户端收到的是它的一份表示，例如 JSON。资源本身不是某个必须位于磁盘上的 7.json 文件。REST 强调客户端与服务器分离、无状态、可缓存性、统一接口、分层，code-on-demand 是可选约束。',
 '无状态要求每次请求足够完整，不依赖服务器记住“这个用户上一页刚选了哪本书”。GET /books/7 明确说明要哪本；只有 GET /selected-book、需要查之前会话才知道书号，就体现了对会话上下文的依赖。服务器保存图书数据库并不违反无状态。',
 '课件第 10 页用“不使用 Cookie”强调避免服务器会话上下文；实际分析应追问请求是否自包含，不能只看有没有 Cookie。REST 本身也不提供加密或认证；HTTPS 提供传输保护，80/443 是否能通过防火墙取决于策略，并非永远开放。'],
 ['资源是被操作的对象；URI 标识它，表示是传输的内容。','无状态 ≠ 不存数据库，也不等于请求完全没有凭据。'],
 question=question('GET /books/7 时服务器查询数据库，是否违反 REST 的无状态约束？','不违反，数据库保存的是资源状态。关键是请求已说明资源与所需信息，不依赖服务器记住此前客户端的会话步骤。'),
 links=[link('Fielding：REST 的约束与无状态通信','https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm')]))
r.append(section('HTTP 方法：动作、安全性与幂等性',[16],[
 '先问要读、创建、整体替换、局部修改还是删除，再选方法。safe 表示请求语义是读取，不要求服务器绝对不记日志；idempotent 表示重复同一请求的预期资源效果与做一次相同，不要求响应文本或状态码每次相同。',
 'DELETE /books/7 第一次删掉资源、第二次返回不存在，仍可幂等。POST /orders 重试却可能创建两笔订单。PATCH 取决于操作：“价格设为 20”可以幂等，“价格加 1”通常不幂等；不要把 PATCH 与 PUT 都简单记成任意更新。'],
 ['safe 方法也应幂等；幂等方法不一定 safe。','重试是否会重复创建，是判断方法语义的好例子。'],
 table=dict(headers=['方法','典型用途','Safe','幂等'],rows=[['GET','取得表示','是','是'],['HEAD','类似 GET，但响应没有内容体','是','是'],['OPTIONS','询问通信选项','是','是'],['POST','提交处理 / 创建集合成员','否','不保证'],['PUT','在指定 URI 创建或替换表示','否','是'],['PATCH','应用局部修改','否','不保证'],['DELETE','删除目标资源的关联','否','是']]),
 example=example('text','''初始：/books/7 的 price = 10
PUT 同一完整表示 {"id":7,"title":"Web","price":20} 两次 → 20
PATCH 操作「price 增加 1」两次 → 12
DELETE /books/7 两次 → 资源仍不存在（响应可不同）''',
 '三个实验各自从初始状态开始。PUT 重复相同替换保持结果；增量 PATCH 每次都有新效果；DELETE 的幂等性看最终资源状态。'),
 question=question('DELETE 第一次返回 204，第二次返回 404，是否因此不幂等？','不是。幂等比较预期资源效果，不要求响应一致；两次之后资源都不存在。'),
 links=[link('RFC 9110：safe 与 idempotent','https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2'),link('RFC 5789：PATCH 方法','https://www.rfc-editor.org/rfc/rfc5789.html#section-2')]))
r.append(section('同一资源可以返回 HTML、XML 或 JSON',[11,12,14,20],[
 '课件用同一套图书操作对照 HTML、XML、JSON。表示格式会变化，资源“书 7”仍然是同一个概念。Accept 描述客户端希望收到的类型；Content-Type 描述这条消息实际使用的类型。',
 '第 20 页称 HTML 不适合作为 REST 响应，不能把它记成协议禁令：第 11 页已经展示 HTML 与链接的 REST 交互，REST 也不限定只能 JSON。第 14 页的 text/json 应改为常用的 application/json；JSON 的引号、逗号和数组结构仍须合法。',
 '表示中的链接给客户端下一步可做的动作，例如书详情里给出订购链接。统一接口不只是把函数名换成 URL；还涉及可识别的资源、自描述消息与通过表示驱动交互。'],
 ['先读 Content-Type，再决定怎样解析 body。','HTML 可以是资源表示；JSON 格式本身也不能证明 REST。'],
 example=example('http','''GET /books/7 HTTP/1.1
Host: api.example
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Vary: Accept

{"id":7,"title":"Web","links":{"self":"/books/7","orders":"/orders"}}''',
 '这是请求与响应的两段报文。若服务支持 HTML，Accept:text/html 可得到 HTML 表示；不支持的类型可能得到 406。Vary:Accept 告诉缓存区分按此请求头选择的表示。'),
 question=question('Accept:application/json 与响应 Content-Type:text/html 谁决定 response.json() 能否正确解析？','解析器面对的是实际响应 body，Content-Type 描述服务器发来的类型；请求中的 Accept 不会把 HTML 自动变成 JSON。应先检查响应状态与类型。')))
r.append(section('创建订单：请求体、201 与 Location',[13,15],[
 'POST /orders 表示向订单集合提交新订单。请求的 Content-Type 让服务器知道怎样读正文；成功创建后，201 Created 表达结果，Location 指向新资源。Location 不是响应格式，也不表示浏览器一定像 302 那样自动跳转。',
 'XML 与 JSON 的两个课件例子描述同一流程。下面改用有效 JSON，补上明确字段；真正的价格、权限和库存仍由服务端校验，不能因为客户端提交了某个值就信任它。'],
 ['请求 Content-Type 管输入格式；201 / Location 管创建结果。'],
 example=example('http','''POST /orders HTTP/1.1
Host: api.example
Content-Type: application/json

{"bookId":7,"quantity":2}

HTTP/1.1 201 Created
Location: /orders/42
Content-Type: application/json

{"id":42,"bookId":7,"quantity":2}''',
 '上半是请求，下半是成功响应，不是一条混合报文。客户端随后可 GET /orders/42；重复发同样 POST 则可能又创建 /orders/43。'),
 question=question('创建成功后返回 201 和 Location:/orders/42，客户端怎样读取新订单？','发 GET /orders/42。201 说明创建成功，Location 标识新资源；它并不自动证明重试 POST 不会产生重复订单。')))
r.append(section('URI 与输入位置：让请求意图清楚',[36],[
 '优先用逻辑资源名：GET /books/7 读书，POST /orders 建订单，DELETE /orders/42 删订单；不要把实现文件名或动词堆进 URL。GET /deleteOrder?id=42 会让预取或爬虫误触发修改，不应这样设计。',
 'Query string 很适合筛选、排序、分页，例如 /books?author=Ada&page=2；“减少 query”不等于禁止 query。资源读取通常用 GET，但复杂搜索也可能按接口约定用 POST 携带较大的条件，课件第 16 页已提到这种例外，不把第 36 页的 always 机械套到所有 API。'],
 ['路径标识资源，query 表达筛选等参数，body 放约定的提交内容。','路径中有名词只是设计线索，不足以证明完全遵守 REST。'],
 example=example('js','''const url = new URL('/books', 'https://api.example');
url.searchParams.set('author', 'Ada & Bob');
url.searchParams.set('page', '2');
console.log(url.href);
// https://api.example/books?author=Ada+%26+Bob&page=2
console.log(url.searchParams.get('author')); // Ada & Bob''',
 'URLSearchParams 对单个参数编码，& 被写为 %26，不会把作者名拆成新参数。不要先把值编码一次，再交给 searchParams 重复编码。'),
 question=question('GET /books?author=Ada&page=2 是否因为使用 query string 就不符合资源化设计？','不是。query 可表达集合筛选与分页；要判断请求的语义和资源接口，而不是看到问号就否定。')))
r.append(section('客户端调用：原始 HTTP、SDK 与凭据',[6],[
 '手写 fetch 与使用服务商 SDK 最终都可能发 HTTP 请求。SDK 包装序列化、请求和响应解析，并不免除你理解状态码、配额、身份与错误的责任。OAuth 描述授权机制；Bearer token 表示持有该凭据即可作为访问证明的一种使用方式。',
 '客户端代码先检查 HTTP 状态再解析数据：fetch 得到 404 通常仍兑现为 Response，不会自动进入 catch。下面展示调用形状，接口与凭据均是占位值；需要对应服务器、权限和浏览器跨源配置才能真实调用。'],
 ['CORS、认证、HTTPS、数据解析分别解决不同问题。'],
 example=example('js','''async function loadBook(apiBase, accessToken) {
  const response = await fetch(new URL('/books/7', apiBase), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
// 有真实 API 时调用：await loadBook(apiBase, accessToken)
// 200 + {"id":7,"title":"Web"} → 返回对象
// 404 → 抛出 Error("HTTP 404")''',
 '函数本身不发送请求，调用时才发送。Authorization 不会自动产生有效 token；服务器仍要验证。跨源时还需服务器允许相应请求，不能靠客户端加一个 CORS 响应头解决。'),
 question=question('fetch 返回 404 时，为什么直接写 response.json() 可能把错误对象当成正常数据？','HTTP 404 通常不会让 fetch 自动拒绝；如果错误响应也是 JSON，它仍可被解析。先检查 response.ok，再走成功数据处理。')))
r.append(section('REST、SOAP、RPC、GraphQL 如何比较',[9],[
 '用“接口围绕什么组织”来区分：REST 围绕资源与统一接口；RPC 围绕远程调用方法；SOAP 规定 XML 消息封装；GraphQL 用 schema 和查询语言表达所需字段。它们都可能使用 HTTP，但不因此成为同一种接口。',
 '不要背“某个永远更简单/强大”。例如只要书名时，GraphQL 可表达选择 title；REST 可以提供适合该场景的表示或字段筛选。复杂度还取决于缓存、错误模型、版本与实现需求。'],
 ['协议、架构风格、查询语言和数据格式分层比较。'],
 table=dict(headers=['方式','读书 7 的示意','抓住的区别'],rows=[['REST 风格 HTTP','GET /books/7','资源 + 方法'],['JSON-RPC','{"method":"getBook","params":[7],"id":1,"jsonrpc":"2.0"}','远程方法调用'],['SOAP','XML Envelope 中放请求消息','消息封装与约定'],['GraphQL','{ book(id:7) { title } }','按 schema 查询字段']]),
 question=question('请求 body 使用 JSON-RPC 的 method:getBook，就因为 JSON + HTTP 而变成 REST 吗？','不会。这个例子围绕远程方法调用组织接口；数据格式和传输协议不改变它的接口风格。')))
r.append(section('读懂 Flickr 示例：JSONP 不是 JSON',[21,22,23,24],[
 '课件第 23–24 页虽然标题写 JSON，实际正文带 jsonFlickrApi(...) 包装：这是 JSONP，即一段函数调用形式的 JavaScript。JSON.parse 只接受 JSON 文本，不能直接解析这一整段调用。URL 写 format=json 也不能替代检查实际响应。',
 '把示例里的数据对象单独看：photos 是分页容器，photo 才是照片数组，page / pages / perpage / total 描述分页。不要对外层对象直接调用 map；更不要为了解析不可信响应而 eval。下面只用本地数据练习结构读取，不访问旧课件里的服务或 key。'],
 ['先辨认是否有回调包装，再定位真正的数组。'],
 example=example('js','''const raw = '{"photos":{"page":1,"pages":10,"photo":[{"id":"7","title":"Sun"},{"id":"8","title":"Moon"}]}}';
const data = JSON.parse(raw);
console.log(data.photos.photo.map(item => item.title)); // ["Sun", "Moon"]
const jsonp = `jsonFlickrApi(${raw})`;
try { JSON.parse(jsonp); } catch (error) {
  console.log(error.name); // SyntaxError
}''',
 '第一段是合法 JSON，所以得到对象和标题数组；加上函数名后就成了 JavaScript 调用语法。该错误与是否跨域无关，是数据语法不匹配。'),
 question=question('JSON.parse("jsonFlickrApi({\"photos\":{}})") 为什么失败？','整段是函数调用语法，不是 JSON。JSONP 的回调包装不能直接交给 JSON.parse；应按接口提供的纯 JSON 方式请求，或使用契约规定的处理方式。')))
r.append(section('地图与商品案例：读请求和数据结构',[25,26,29,30],[
 '地图例子区分地址查坐标（geocoding）、坐标查地址（reverse geocoding）及其它资源查询。掌握“输入参数 → 服务处理 → 结构化响应”，不用背旧服务 URL、产品 key 或固定参数列表；实际接入时另查当时接口契约。',
 '第 29 页的数据流把客户端、消息处理层和数据层分开，第 30 页展示商品相关实体关系。XML/HTTP 只是消息格式与传输组合，图上的标签不能证明它满足 REST 全部约束。响应字段要按层级读取，不能把实体 ID 与展示名称混淆。'],
 ['接口参数与字段来自契约，不从服务商名称推断。'],
 example=example('js','''const response = {
  resources: [{ name: 'Campus', point: { coordinates: [34.02, -118.29] } }]
};
// 本例明确约定 coordinates 顺序为 [latitude, longitude]。
const place = response.resources[0];
const [lat, lon] = place.point.coordinates;
console.log(`${place.name}: lat=${lat}, lon=${lon}`);
// Campus: lat=34.02, lon=-118.29''',
 '这是便于练习的本地响应结构，不声称与任何服务的当前字段完全相同。其它接口可能规定 [longitude, latitude]，读取前必须确认顺序。'),
 question=question('看到 coordinates:[34.02,-118.29]，能否只凭数组名称确定第一项是纬度？','不能。要看接口契约；本例特意声明 [latitude, longitude]，另一些格式会用相反顺序。')))
r.append(section('API 调试工具：会配置请求即可',[17,18,19],[
 'Postman、Hoppscotch、Apidog 的截图展示同类工作：选方法、填 URL、设置 headers/body，发请求后检查状态、响应头和正文。课程重点是读懂 HTTP，不是记各工具套餐或按钮坐标。',
 '例如测试 POST /orders 时，确认 Content-Type:application/json、body 是有效 JSON，再核对 201 与 Location；仅看到一个漂亮的 JSON 窗口，不代表响应状态正确。'],['工具是观察请求的入口；HTTP 方法与内容仍由你配置。']))
r[-1]['kind']='background'
r.append(section('云平台、目录与产品配额：背景阅读',[7,27,28,31,32,33,34,35],[
 '这些页展示计算托管、存储、内容交付、商品 API、搜索与云同步等应用。云平台提供运行或服务能力，SDK 让程序调用服务，REST 描述接口设计；三者不互相替代。“无需自己维护服务器”也不等于没有服务器在执行。',
 'App Engine 的旧配额、EC2 的示例价格、支持语言/操作系统与产品目录会变化，不作为背诵清单，也不当成当前服务承诺。第 34 页的可编程搜索重在理解把外部能力集成到自己页面。'],['保留“托管应用”和“调用 API”的区别，跳过产品榜单、价格和历史版本。']))
r[-1]['kind']='background'

build('rest','Web Services 与 REST · 重点串讲',
 '围绕图书和订单读懂一条 API 请求：资源在哪里、方法做什么、正文是什么格式、服务器怎样回应。少背产品列表，多练方法语义、无状态与代码结果。',
 ['能按资源与动作选择 URI、方法和输入位置。','能区分 safe / idempotent，以及 JSON / JSONP。','能解释 Accept、Content-Type、201、Location 与无状态通信。'],r,'''
Web Services 与 REST|本讲把前面的 HTTP、JSON、Node 串成程序之间的接口设计与调用流程。
内容地图|先分清服务类型，再看 REST 方法、格式与认证，最后把云服务当作应用场景。
从网页到程序接口|人阅读网页，程序通过有明确输入输出的 API 获取能力，不必依赖抓取页面结构。
几类 Web Services|SOAP、REST 与云服务描述不同维度；不能把部署位置和接口风格当成互斥分类。
设计 API 的考虑维度|通信模式、协议、数据格式、认证与平台要分别判断；采用 JSON 不自动定义接口架构。
调用方式与访问凭据|直接 HTTP 与 SDK 都要遵守接口契约；OAuth、Bearer、错误状态与访问额度属于不同问题。
云服务范围|托管、存储、备份、内容交付等是能力分类，费用与产品例子作背景，不逐项背诵。
REST 的资源视角|URI 标识资源，表示传递其状态，统一接口组织操作；创始人和年份不进入记忆任务。
接口风格比较|REST、SOAP、RPC、GraphQL 的组织方式不同，不能只根据是否使用 HTTP 或 JSON 判断。
无状态与传输保护|每次请求应自包含；资源数据库不违反无状态，REST 本身也不自动提供加密或认证。
HTML 图书流程|书单链接、详情链接和订购动作展示 HTML 也能承载资源表示与下一步交互。
XML 图书表示|同一书单和详情可用 XML 表达；改变格式不等于改变了被标识的资源。
XML 创建订单|客户端 POST 订单信息，服务器以 201 Created 与 Location 标识新建资源。
JSON 图书表示|JSON 对象和链接表达书单与详情；Content-Type 应使用 application/json，而非课件的 text/json。
JSON 创建订单|请求体需要有效 JSON；成功响应的 Location 可供下一次 GET 获取新订单。
方法与复杂参数|区分 GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS；safe 与幂等也要分别判断。
Postman 请求检查|会设置方法、地址、headers 和正文即可，套餐功能与配额不作为核心考点。
Hoppscotch 请求检查|工具换了，仍然要对照同一套 HTTP 请求与响应字段，不靠界面名称推断结果。
Apidog 请求检查|调试窗口只是载体；状态码正确、正文类型正确和业务数据正确是三项独立检查。
响应格式的边界|JSON、XML、CSV、HTML 都可作为表示；不要把“REST 不能返回 HTML”当成协议规则。
Flickr 接口案例|按实际请求和响应理解接口，不使用课件里的示例 key，也不从服务品牌推断完整 REST 约束。
Flickr 网站截图|这页提供照片服务的应用背景；复习重点在相邻页面的请求和响应数据结构。
JSONP 响应文本|jsonFlickrApi(...) 是 JavaScript 回调调用，不能把整段直接交给 JSON.parse。
分页对象与照片数组|photos 包含分页元信息，photos.photo 才是要逐项遍历的数组。
地图查询的输入|地理编码与反向地理编码输入不同；地址和坐标参数应遵守具体接口约定并正确编码。
地图响应约定|格式参数和回调参数可能改变返回方式；最终应核对真实 Content-Type 与正文结构。
AWS 服务与价格示例|计算服务、实例与收费方式用于说明云能力；旧价格和机型不用记，也不视作当前报价。
商品服务的调用者|联盟站点、商家和开发者说明不同 API 消费者，产品名称与旧参与流程只作背景。
商品服务数据流|分清客户端、消息处理与数据存储；XML 加 HTTP 不自动等于完全遵守 REST。
商品数据模型|实体之间有 ID 与关联，读取嵌套响应先沿正确字段路径定位，不用背完整商品字段树。
Google API 目录|目录展示可调用能力的范围，不是本章需要记忆的产品清单。
App Engine 托管|平台负责运行应用，开发者仍需实现请求处理；调用 API 与把应用托管在云端是不同动作。
托管配额截图|旧配额、版本和收费表会变化，作为背景即可，不用于推断考试题量或当前平台限制。
可编程搜索集成|外部搜索服务可以嵌入自己的页面；重点是调用与展示的分工，不是配置界面的旧名称。
iCloud 开发者能力|云同步与存储说明另一类服务场景，历史操作系统和套餐规格不列入核心记忆。
REST 设计原则|用逻辑资源 URI、正确方法和可跟随链接表达操作；query 可用于筛选，GET 不应用于删除等修改动作。
''',
 ['HTTP 旧章提供报文规则；Node / Express 把方法、路径、body 映射到处理函数。','React 发请求后用返回的资源表示更新状态；界面如何布局仍交给 Responsive CSS。','Cookie / Token 解释凭据怎样携带；REST 的无状态约束要求另行检查会话依赖。'],
 ['能否为图书查询、订单创建、替换、局部修改和删除选择方法？','能否说明重复 DELETE 响应不同仍可幂等？','能否解释 201 + Location，以及 Accept 和 Content-Type 的方向？','能否指出 HTML 可作为表示，JSONP 不等于 JSON？','能否区分资源数据库与此前请求的会话上下文？'])

print('Wrote Cookies (54 pages) and REST (36 pages), with examples and final-review questions.')
