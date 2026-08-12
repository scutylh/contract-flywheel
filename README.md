# contract-flywheel

**从一段会议纪要到自进化飞轮 —— 合同审核 Agent 的三圈迭代。**

入职前作业。别人交规划，这里交的是规划的第一步已经在跑的样子：同一套合同审核系统迭代三圈，人机分工从「人 70% / Agent 30%」走到「Agent 95% / 人仅确认」。

- 圈 1 · 从 0 到可用：会议纪要 → 需求单 → 人机协作开发 → 双审上线（合同关键信息提取）
- 圈 2 · 听懂反馈：模糊反馈 → Agent 反问澄清 → 边界收窄 → 账期提醒上线
- 圈 3 · 接近自治：新需求 → Agent 检索历史资产自主开发 → Agent 评审 → 人工一键确认

## 仓库结构

```
├── docs/
│   ├── vision.md        # 3-5 年愿景原文
│   └── PLAN-v0.1.md     # 作业计划（版本化管理）
├── harness/             # 开发期 mini-harness（fixture 驱动，见 harness/README.md）
├── traces/              # 三圈执行轨迹 JSON（页面回放的唯一数据源）
├── scripts/
│   └── build-traces.mjs # traces/*.json → site/js/traces.js 打包脚本
└── site/                # 纯静态演示站（nginx 直发即可）
    ├── index.html       # 门户：飞轮总览 + 工程设计 + 90 天 + 附录
    ├── loops/           # 每圈独立回放页（执行轨迹 + 播放 + 沉淀）
    │   ├── loop-1.html
    │   ├── loop-2.html
    │   └── loop-3.html
    └── products/        # 每圈交付的产品页（界面 mock + 验收数据）
```

## 本地预览

```bash
cd site && python -m http.server 8080
# 打开 http://localhost:8080
```

## 工作流

1. 修改/生成轨迹：`traces/loopN.json`
2. 校验：`python harness/main.py`
3. 打包进页面：`node scripts/build-traces.mjs`
4. 站点自检：`node scripts/verify-site.mjs`（语法 / 轨迹同步 / 链接与锚点可达）
5. 部署：`site/` 整个目录 nginx 直发，无常驻后端

## 诚实声明

演示业务数据为模拟数据；执行轨迹由 mini-harness 组织，LLM 调用以录制 fixture 回放呈现。选择回放而非实时调用，是为保证评审任何时刻打开都看到一致、可复盘的过程。

---

作者：于林海 · 15767206657
