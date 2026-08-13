# contract-flywheel

**AI-native development —— 从一句话，到上线的功能。**

入职前作业。别人交规划，这里交的是规划第一步已经在跑的样子：把软件开发最贵的环节——「从人说的话到能跑的代码」——拆成两半，用两个工具补上。

- **二郎 Erlang · 需求澄清工具**：从模糊的原始信息到可落地的需求文档（前半段 · 听懂需求）
- **鲁班 · Agentic 开发**：需求澄清之后，AI 自动构建上线（后半段 · AI 构建）

## 站点结构

纯静态演示站（`site/`，nginx 直发即可）。5 个平级页面共用一套顶部导航与底部导航：

```
site/
├── index.html           # 首页：两个工具 · 一条链路
├── erlang/              # 二郎 Erlang · 需求澄清工具（独立 demo）
├── automation/          # 鲁班 · Agentic 开发
├── mindmap/             # 思维导图（markmap，工作拆解视图）
├── gantt/               # 甘特图（0-1 年计划：二郎 + 鲁班两条线）
├── css/
│   ├── common.css       # 公共组件：变量 + 顶栏 + 底部导航 + 通用段样式
│   └── home.css         # 首页专属样式
└── js/
    └── nav.js           # 公共底部导航（5 页，读 body 的 data-nav / data-base）
```

## 仓库结构

```
├── docs/                # 愿景 + 作业计划
├── harness/             # 开发期 mini-harness（fixture 驱动）
├── traces/              # 执行轨迹 JSON（数据源）
├── demos/               # 独立 demo（含附录存档 demos/appendix/）
├── scripts/
│   └── verify-site.mjs  # 站点自检
└── site/                # 纯静态演示站
```

## 本地预览

```bash
cd site && python -m http.server 8080
# 打开 http://localhost:8080
```

## 工作流

1. 修改页面 / 数据
2. 站点自检：`node scripts/verify-site.mjs`（JS 语法 / 5 页 data-nav / 链接与锚点可达）
3. 部署：`site/` 整个目录 nginx 直发，无常驻后端

## 诚实声明

演示业务数据为模拟数据；执行轨迹由自研 mini-harness 组织，LLM 调用以录制 fixture 回放呈现。选择回放而非实时调用，是为保证评审任何时刻打开都看到一致、可复盘的过程。

> 唯一的外部依赖：思维导图页通过 CDN 引入 markmap（`cdn.jsdelivr.net`）渲染，离线打开时该页会空白，其余页面不受影响。

---

作者：于林海 · 15767206657
