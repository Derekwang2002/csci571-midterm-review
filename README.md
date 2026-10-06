# CSCI 571 · Midterm 复习手册

根据 Fall 2026 本地课件制作的逐页中文复习网站，13 份讲义共 806 页，另含 10 页 syllabus。

在线阅读：https://derekwang2002.github.io/csci571-midterm-review/

- 每页原图、中文解释、复习要点与课件纠错。
- 252 个代码、报文或计算示例，104 道对应页面的自测题。
- 课程/页码导航、全文搜索、核心筛选与本地复习进度。
- 19 个课件关联实验：HTML、CSS、JavaScript、DOM、JSON、URL 与 IPv4；含可操作示例、结果解释与自查题。
- 无需构建或后端，可部署到 GitHub Pages。

## 本地查看

```sh
python3 -m http.server 5710
```

打开 `http://127.0.0.1:5710`。需要通过 HTTP 加载，不使用 file://。

## 内容结构

- `content/decks.json`：课件目录、原文件名和页数。
- `content/<course>.json`：逐页讲解；页码是 PDF 阅读器页序，不是页脚编号。
- `content/sources.json`：按页提取的原文；图表仍以原图为准。
- `assets/slides/<course>/NNN.jpg`：原始课件逐页图片。
- `assets/diagrams/`：辅助教学示意图。
- `labs.js` / `labs.css`：实验目录、筛选、独立路由、课件映射及共用样式。
- `labs-markup.js` / `labs-javascript.js` / `labs-data.js`：实验内容与真实浏览器交互。
- `scripts/validate.py`：检查页码完整性、字段、资产和基础内容质量。

## 使用说明

进度仅保存在当前浏览器 localStorage 中，不会上传。代码示例用于理解规则，部分是刻意展示错误的分析题。逐页讲解中的 HTML 预览只展示静态 HTML/CSS。实验室另提供受控的 JavaScript、DOM 和表单演示；表单仅展示本地解析出的数据，不实际发送请求。

考试安排依据本地 syllabus：2026-10-06 17:00，60 分钟，占 40%。题型为理论和可能的代码分析，不要求写代码。Web Basics 第 51 页明确标记考试相关内容起点。AI Basics 完整考试范围需以教师通知确认。重点标签用于学习安排，不代表试题分布预测。

原课件发布已获用户确认的教授授权；原图保留来源标记。中文讲解、示例、图示与网站代码为本次学习网站整理制作。外部资料仅作为少量补充，主要使用 MDN、Python、Flask、RFC 等官方文档。

## 整体总结与串讲 · 2026-10-05

新增 `#/interpretations` 总结目录及每份课件的独立串讲页。通过连贯解释、基础补充、代码示例和考前自查连接知识点，并为每张原始幻灯片提供恰好一个分组归属。

教授补充：Development "history" is not something that you have to recall or read again. 发展历史在新总结中单独标记并默认折叠，原始历史页附加范围更新提醒。涉及实际语法、协议行为和原理的混合页继续解释技术内容。

原 `content/*.json` 和全部 `assets/` 文件保持不变，所有新总结保存在 `content/interpretations/`。运行 `python3 scripts/validate_interpretations.py` 检查新总结的页码覆盖与字段结构。

## 交互实验室 · 2026-10-05

`#/lab` 支持按技术筛选和关键词搜索；`#/lab/<id>` 可直接打开一个实验。每个实验包含学习目标、预测问题、可修改控件、真实浏览器结果、通俗解释和折叠答案，可一键重置。展开“对应课件”可访问相关的每一页及整讲总结，相关逐页讲解也增加了反向实验入口。

- HTML：解析修复与字符实体、表格合并、原生表单验证及提交字段。
- CSS：选择器匹配、层叠与继承、盒模型、定位与浮动、媒体查询。
- JavaScript：类型转换、作用域与闭包、对象引用、数组方法、正则表达式、事件循环。
- DOM：节点树与节点操作、事件传播及默认行为。
- 数据与网络：JSON 解析、相对 URL 与同源判断、IPv4 子网。

发展历史不进入练习范围；超出原页的辅助知识在解释中注明。实验扩充不改动原有课件讲解、图片与整体总结。

19 个实验包含 44 道实验自查题，对应 135 个不同课件页面。运行 `node scripts/validate_labs.mjs` 检查描述字段、页码范围、发展历史排除及课件反向链接。
