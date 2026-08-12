# Story-Deck 重构 Implementation Plan（横向翻页叙事）

> **For Hermes:** 本计划可直接逐任务执行；构建产物为纯静态站，验证用 `node scripts/build-traces.mjs` + `node scripts/verify-site.mjs` + 本地 http.server 手测。

**Goal:** 把 contract-flywheel 站点从「多页网站」重构为「6 章横向翻页的叙事 deck」：首页 → 圈1 → 圈2 → 圈3 → 90天 → 附录。每圈页含「分工矩阵(静态) → 回放横轴(点击聚焦) → 产品演示」，圈3 末尾含三圈「演一遍」recap。

**Architecture:** 多文件章节 + 统一翻页壳。每章一个 HTML 文件，共享 `js/main.js` 提供章节进度条、悬浮箭头(带「查看上一/下一章节」文字)、键盘 ←/→、进入滑入动画。两个共享组件(分工矩阵、回放横轴)由 JS 数据驱动渲染，数据源 `traces/*.json`（新增 `division` 字段）。

**Tech Stack:** 原生 HTML/CSS/JS，零第三方依赖；Node 用于打包(`scripts/build-traces.mjs`) 与自检(`scripts/verify-site.mjs`)。

---

## 章节结构（6 章，左右翻页）

| # | 章 | 文件 | 内容 |
|---|---|---|---|
| 1 | 首页 | `site/index.html` | hero + 飞轮三圈 + 翻页提示 |
| 2 | 圈1 | `site/loops/loop-1.html` | 圈头 → 分工矩阵 → 回放横轴 → 产品演示 |
| 3 | 圈2 | `site/loops/loop-2.html` | 同上 |
| 4 | 圈3 | `site/loops/loop-3.html` | 同上 + 末尾「演一遍」recap |
| 5 | 90天 | `site/plan90.html` | 90天计划 + 三张表(权限/能力边界/回放评估，临时停靠) |
| 6 | 附录 | `site/appendix.html` | 本作业开发方式 + 源码文档 + 诚实声明 |

`site/products/` 目录整体退役（产品 mock 并入对应圈页 ③ 段）。

## 轴语法（核心交互隐喻）

- **左右 = 前进**（翻章节、回放步骤推进，都沿时间轴）
- **上下 = 下钻**（章节内深入细节）

## 两个共享组件

### 组件① 分工矩阵（双模式）
- **静态模式**：动作 = 列(需求 / 编码 / 测试验证 / 上线)，两栏 = 上「人」/ 下「Agent」，每列一根上下堆叠分割条显示本圈占比；圈2/3 可加「较上一圈变化」角标。
- **演一遍模式**：同一组件播放 圈1→圈2→圈3 占比动画一次（人段变薄、编码人段消失）。
- 数据：`traces/*.json` 每圈 `division: [{action, human, agent, humanPct, agentPct}]`。

### 组件② 回放横轴（点击聚焦，弃自动横滚）
- 环形图 N 弧 → 横轴 N 节点（节点色 = 角色色），节点下方步骤标题。
- 点击节点 → 平滑居中 + 高亮 + 相邻隐去/降透明 + 下方展示详情(角色徽章 + 正文/diff)。
- 轴溢出 → 轴本身横向滚动(scroll + snap)。
- **环 → 轴 morph**：最后尝试，做不出不影响交付。

## 数据模型变更

`traces/loopN.json` 每圈新增 `division`，其余字段(trigger/steps/sediments/ratio/traits)不变；`build-traces.mjs` 整体序列化、无需改动。

```json
"division": [
  { "action": "需求结构化", "human": "整理纪要成需求单", "agent": "五段式需求单模板", "humanPct": 70, "agentPct": 30 },
  { "action": "编码",       "human": "改 diff 关键处",  "agent": "生成代码",       "humanPct": 60, "agentPct": 40 },
  { "action": "测试验证",   "human": "人工复核",        "agent": "回归集自动跑",   "humanPct": 50, "agentPct": 50 },
  { "action": "上线",       "human": "批准合并",        "agent": "自动部署",       "humanPct": 100, "agentPct": 0 }
]
```

## 任务分解

### Task 1: 数据 — 加 division
- 修改 `traces/loop1.json`、`traces/loop2.json`、`traces/loop3.json`，各加 `division`（4 动作，占比跨圈演变，编码人段 圈3 = 0）。
- 运行 `node scripts/build-traces.mjs` 重打包 `site/js/traces.js`。

### Task 2: 章节壳（进度条 + 箭头 + 翻页）
- `site/js/main.js`：章节导航模块 —— 读 `body[data-chapter]`/`body[data-total]`，渲染底部 6 点进度条 + 两侧悬浮箭头(带「查看上一/下一章节」文字)；键盘 ←/→ 与箭头点击跳相邻章节并写 `sessionStorage.cfw-dir`；页面加载按方向做滑入动画。
- `site/css/style.css`：进度条、箭头、滑入动画、章节布局。

### Task 3: 首页（第1章）
- `site/index.html`：hero + 飞轮三圈(节点点击 → 圈页) + 「左右翻页 / 点击节点」提示 + 章节壳。

### Task 4: 两个组件（JS 渲染）
- `site/js/main.js`：`divisionMatrix(loop)` 静态矩阵、`playDivision()` 演一遍、`replayAxis(loop)` 横轴 + 点击聚焦交互。

### Task 5: 圈页 ×3
- `site/loops/loop-1/2/3.html`：圈头 + ① 矩阵 + ② 横轴 + ③ 产品演示(合并原 `site/products/*.html`)；loop-3 末尾加「演一遍」。

### Task 6: 90天 + 附录
- `site/plan90.html`（90天计划 + 三张表）、`site/appendix.html`（从 index 抽出）。

### Task 7: 自检
- 扩展 `scripts/verify-site.mjs`：6 文件存在、章节 data 属性正确、链接/锚点可达、无残留旧锚点；运行全绿。

## 验证

- `node scripts/build-traces.mjs` —— 数据同步
- `node scripts/verify-site.mjs` —— 结构完整性
- 本地 `python -m http.server` + 浏览器手测翻页 / 聚焦 / 演一遍

## 风险 / 取舍

- 环→轴 morph 为可选，最后尝试，不成不影响交付。
- 跨文件翻页用「进入滑入」近似 deck 感（真·跨页无缝滑动需 SPA 或 View Transitions，暂不引入，保持零依赖 + file:// 可直开）。
- 三张表形态未定，先整体停靠 plan90 页。
