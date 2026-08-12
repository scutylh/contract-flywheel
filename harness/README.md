# harness —— 开发期 mini-harness

## 定位

fixture 驱动的迷你 harness：读入三圈输入素材，跑「需求提取 → Issue → 开发 → 评审」流水线，产出带步骤结构的 trace JSON（`traces/loopN.json`），供静态站回放。

## 当前状态（v0.1）

- `traces/*.json` 当前为**手工编排的 fixture**（关键内容完整，次要部分省略号）。
- `main.py` 提供 trace 结构校验，保证手工 fixture 与未来真实跑出的 trace 同构。
- 后续迭代：接入 LLM 适配器（`adapters/`），真实跑 pipeline 覆写 `traces/*.json`，再执行 `node scripts/build-traces.mjs` 重新打包。

## 设计

```
harness/
├── fixtures/    # 三圈输入素材（会议纪要原文、负责人反馈、新需求）
├── pipeline/    # extract → issue → code → review 的流水线步骤
├── adapters/    # LLM 适配器：fixture 回放模式 / 真实 API 模式
└── main.py      # 入口；当前实现 trace 校验
```

原则：trace 是唯一事实来源。页面不直接消费 harness 内部状态，只消费 trace JSON——回放稳定、可复盘、可重新生成。
