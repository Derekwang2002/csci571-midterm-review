# CSCI 571 · Midterm 复习手册

根据 Fall 2026 本地课件制作的逐页中文复习网站，13 份讲义共 806 页，另含 10 页 syllabus。

在线阅读：https://derekwang2002.github.io/csci571-midterm-review/

- 每页原图、中文解释、复习要点与课件纠错。
- 252 个代码、报文或计算示例，104 道对应页面的自测题。
- 课程/页码导航、全文搜索、核心筛选与本地复习进度。
- IPv4 子网、CSS 盒模型、JSON 语法、JavaScript 类型转换交互实验。
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
- `scripts/validate.py`：检查页码完整性、字段、资产和基础内容质量。

## 使用说明

进度仅保存在当前浏览器 localStorage 中，不会上传。代码示例用于理解规则，部分是刻意展示错误的分析题。HTML 预览只展示静态 HTML/CSS，不执行脚本或表单提交。

考试安排依据本地 syllabus：2026-10-06 17:00，60 分钟，占 40%。题型为理论和可能的代码分析，不要求写代码。Web Basics 第 51 页明确标记考试相关内容起点。AI Basics 完整考试范围需以教师通知确认。重点标签用于学习安排，不代表试题分布预测。

原课件发布已获用户确认的教授授权；原图保留来源标记。中文讲解、示例、图示与网站代码为本次学习网站整理制作。外部资料仅作为少量补充，主要使用 MDN、Python、Flask、RFC 等官方文档。
