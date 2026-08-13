# contract-flywheel

**开发流程的 AI 化 —— 从需求澄清到开发自动化。**

入职前作业。别人交规划，这里交的是规划的第一步已经在跑的样子：把软件开发最贵的环节——「从人说的话到能跑的代码」——拆成两半，用两个工具补上。

- **二郎 Erlang · 需求澄清工具**：从模糊的原始信息到可落地的需求文档
- **开发自动化**：需求澄清之后，开发过程的自动化

## 仓库结构

```
├── docs/
│   ├── vision.md        # 个人愿景（非共识，供参考）
│   └── PLAN-v0.1.md     # 作业计划（版本化管理）
├── harness/             # 开发期 mini-harness（fixture 驱动）
├── traces/              # 执行轨迹 JSON（数据源）
├── demos/               # 独立 demo
├── scripts/
│   └── verify-site.mjs  # 站点自检
└── site/                # 纯静态演示站（nginx 直发即可）
    ├── index.html       # 首页：两个入口（需求澄清 + 开发自动化）
    ├── automation.html  # 开发自动化（人机愿景 / 流水线 / 中台架构 / 产品设计 / 节奏）
    ├── appendix.html    # 附录（开发方式 + 源码 + 诚实声明）
    └── erlang/          # 二郎 Erlang · 需求澄清工具（独立 demo）
```

## 本地预览

```bash
cd site && python -m http.server 8080
# 打开 http://localhost:8080
```

## 工作流

1. 修改页面 / 数据
2. 站点自检：`node scripts/verify-site.mjs`（语法 / 章节 / 链接与锚点可达）
3. 部署：`site/` 整个目录 nginx 直发，无常驻后端

## 诚实声明

演示业务数据为模拟数据；执行轨迹由自研 mini-harness 组织，LLM 调用以录制 fixture 回放呈现。选择回放而非实时调用，是为保证评审任何时刻打开都看到一致、可复盘的过程。

---

作者：于林海 · 15767206657