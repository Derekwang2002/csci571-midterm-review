# CSCI 571 · Final 复习手册

Fall 2026 中文复习网站，部署到 [GitHub Pages](https://derekwang2002.github.io/csci571-midterm-review/#/interpretations)。无构建步骤或后端。

- 新增 Responsive Web Design（59 页）、React（45 页）、Node（35 页），139 页均有原图、逐页说明与分组串讲，包含 23 个关键示例和 27 道自测。
- 旧 13 章默认显示核心回顾，每章 1–2 节、一例和一道自测。完整旧讲解仍可按需展开，不再作为期末通读任务。
- 全部资料共 955 页（16 份讲义 945 页 + syllabus 10 页）。页码均为 PDF 阅读器页序。
- 默认自测题池：新增 27 题 + 旧章 13 题，每轮随机最多 20 题；比例不代表正式考试分布。旧题库仍可选择。
- 19 个交互实验、44 道实验挑战、135 个原有课件页面映射保留。
- 已掌握/待复习、阅读位置、展开状态和自测进度保存于当前浏览器；支持导出和合并导入。继续使用原存储命名空间与页面 ID。

## 范围依据

当前 `CSCI571_syllabus_Fall_2026_v3.pdf` 第 4–5 页：Exam #2 为 2026-12-03 17:00，60 分钟，占课程总评 40%，以理论和可能的代码分析为主，不要求写代码。**该 syllabus 没有写明 final 中新旧内容的具体比例，40% 不是旧内容题量占比。**

按用户转述的教师说明，midterm 内容只少量抽查、大致每章一题，因此本版压缩旧章；不承诺正式题量。新增三份讲义是目前可用的新材料，不代表最终完整考试范围，后续课件仍应补充。发展历史按教授原话无需重读或记忆，混合页面中的技术规则保留。

课件中的旧版 Bootstrap、React 生命周期、模块扩展名与框架表述均有必要澄清；少量官方链接用于核对这些差异。示例包含完整小程序和明确标注环境的片段，结果解释与代码放在一起。

## 本地查看与校验

```sh
python3 -m http.server 5710
python3 scripts/validate.py
python3 scripts/validate_interpretations.py
python3 scripts/validate_final.py
node scripts/validate_labs.mjs
node --test scripts/progress.test.mjs
node --check app.js
node --check interpretations.js
```

打开 `http://127.0.0.1:5710`，不要直接使用 file://。本地与线上网址的浏览器存储相互独立，可用进度备份迁移。

## 内容维护

- `content/decks.json`：目录、phase、新旧重点页与旧章核心自测；ID 保持稳定。
- `content/<id>.json` / `assets/slides/<id>/NNN.jpg`：完整逐页讲解与原图。
- `content/sources.json`：逐页文字提取；代码截图和图表以原图为准。
- `content/interpretations/<id>.json`：全部页面恰好分组一次的完整串讲。
- `content/final-core/<id>.json`：旧章核心摘要及 final 范围说明；只精选相关页，不声称全页覆盖。
- `scripts/prepare_final.py`：提取、渲染三份新 PDF；需要 Poppler、Pillow，输入 PDF 位于站点父目录。
- `scripts/write_final_content.py`：本次新增讲解和旧章摘要的维护源；运行后生成对应 JSON 与目录字段。
- `interpretations.js` / `final.css`：分组目录、摘要、表格、自测与官方链接。
- `progress.js` / `reading-progress.js` / `progress-view.js`：持久化、备份及恢复。
- `labs*.js` / `labs.css` / `lab-feedback.js`：原有实验与按选项联动的结果反馈。

`#/interpretations/<旧章 id>` 默认是核心回顾；`#/interpretations/<旧章 id>/full` 可看原有完整串讲。逐页原始优先级属于旧版，阅读页会提醒以期末核心回顾为准。

原课件发布已获用户确认的教授授权，原图保留来源标记。中文解释、示例和页面为学习用途整理。
