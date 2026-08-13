/* ============================================================
 * Erlang 二郎 · 需求澄清 Agent — 演示数据
 * 场景 A：金蝶云星空 · 供应链云 · 合同单字段提取回填
 * ============================================================ */

const SCENARIOS = [
  {
    id: "contract-extract",
    label: "金蝶合同单字段提取回填",
    tag: "财务 · 合同审核",

    /* 多源：四类原始材料，无内容 */
    sources: [
      { type: "会议记录文本", icon: "📝" },
      { type: "聊天记录", icon: "💬" },
      { type: "扫描件", icon: "🖼️" },
      { type: "录音", icon: "🎙️" }
    ],

    /* 归一化 */
    normalize: {
      title: "四类原始材料统一转成文本，标注对应原始文件",
      items: [
        { from: "录音", to: "转写" },
        { from: "扫描件", to: "OCR" },
        { from: "聊天记录", to: "导出" }
      ]
    },

    /* 分层记忆：摘要引用原始文件段落 */
    memory: {
      summary: [
        { text: "需求：合同关键字段自动提取回填（金额 / 账期 / 付款条件）", ref: "会议记录文本 #2" },
        { text: "约束：回填金蝶现有合同单 + 复用审批流", ref: "聊天记录 #1" },
        { text: "输出：金蝶合同单扩展字段，法务在审批流复核", ref: "会议记录文本 #2" }
      ],
      note: "摘要做索引，原文做证据——每条摘要可回溯到原始文件的具体段落"
    },

    /* 群聊：项目经理发起，Agent 接力，最后提单 */
    messages: [
      { from: "pm", icon: "👤", name: "项目经理 Lyn", color: "pm", text: "@Analyst 这里有几份原始材料，帮我整理一下需求。", attach: ["会议记录文本", "聊天记录", "扫描件", "录音"] },
      { from: "analyst", icon: "🧭", name: "Analyst", color: "agent", text: "收到。数据已归一化，分层记忆已建立。" },
      { from: "analyst", icon: "🧭", name: "Analyst", color: "agent", text: "需求：新建「合同信息提取系统」——PDF 上传 → 字段识别 → 结果展示页，覆盖全部合同类型。@Coder 核对下代码现状" },
      { from: "coder", icon: "🛠", name: "Coder", color: "accent", text: "金蝶云星空的合同单和审批流本来就有，封装层已打通读写 API。不是「新建系统」，是回填到合同单扩展字段。", punch: "戳破「新建系统」" },
      { from: "coder", icon: "🛠", name: "Coder", color: "accent", text: "@Estimator 估一下周期" },
      { from: "estimator", icon: "⚖️", name: "Estimator", color: "reviewer", text: "新建 ≈ 2 周，回填扩展字段 ≈ 3 天。验收线：50 份历史合同回归 ≥ 95%。", punch: "2 周 vs 3 天" },
      { from: "estimator", icon: "⚖️", name: "Estimator", color: "reviewer", text: "@Verifier 终审权限和边界" },
      { from: "verifier", icon: "🔐", name: "Verifier", color: "human", text: "权限挂金蝶审批流角色：系统写只读、法务可改、业务只读。", punch: "回溯原文兜底：聊天记录 #1「扫描件要人工录」、会议记录文本 #3「金额按大写算」" },
      { from: "verifier", icon: "🔐", name: "Verifier", color: "human", text: "验证通过。@项目经理 Lyn 请确认" },
      { from: "pm", icon: "👤", name: "项目经理 Lyn", color: "pm", text: "确认。@流程工具 提单" },
      { from: "tool", icon: "⚙️", name: "流程工具", color: "system", text: "已提单 REQ-2026-0047，进入开发队列 ✓" }
    ],

    /* 开发文档 */
    doc: {
      title: "金蝶合同单字段提取回填 · 开发文档",
      reqId: "REQ-2026-0047",
      meta: [
        { k: "周期", v: "≈ 3 天" },
        { k: "验收线", v: "≥ 95%" },
        { k: "范围", v: "金额 / 账期 / 付款条件" }
      ],
      sections: [
        { k: "目标", v: "合同关键字段自动提取，回填金蝶合同单，法务在审批流复核" },
        { k: "输出", v: "金蝶合同单扩展字段（+ 置信度 + 原文定位）" },
        { k: "权限", v: "系统写只读 / 法务可改 / 业务只读（挂金蝶审批流角色）" },
        { k: "验收", v: "50 份历史合同回归，三字段准确率 ≥ 95%" },
        { k: "本期边界", v: "不做审批流改造、不做对外通知；扫描件走人工录入" }
      ],
      feed: "→ 需求已提单，进入主项目开发自动化流水线。"
    }
  }
];

/* ---- 三个能力 ---- */
const CAPABILITIES = [
  { icon: "🗂", title: "分层记忆", desc: "多源归一化，摘要做索引、原文做证据" },
  { icon: "🤝", title: "多 Agent 协作", desc: "Analyst / Coder / Estimator / Verifier 接力纠偏" },
  { icon: "💾", title: "持久存储", desc: "按项目制沉淀三层数据，越用越准" }
];

/* ---- 多 Agent 协作（英文名，无盲区列） ---- */
const AGENTS = [
  { id: "Analyst", icon: "🧭", color: "agent", hold: "会议原始记录", duty: "整理并出需求草稿", goal: "意图一致" },
  { id: "Coder", icon: "🛠", color: "accent", hold: "代码仓 + Skill", duty: "核对代码现状", goal: "现状吻合" },
  { id: "Estimator", icon: "⚖️", color: "reviewer", hold: "历史周期 / 预算", duty: "评估周期预算", goal: "资源可行" },
  { id: "Verifier", icon: "🔐", color: "human", hold: "业务规则 / 权限", duty: "终审权限合规", goal: "权限合规" }
];

/* ---- 持久存储：三层结构 ---- */
const STORAGE = {
  files: [
    { icon: "🎙️", name: "录音" },
    { icon: "🖼️", name: "图片" },
    { icon: "💬", name: "聊天记录（文本）" },
    { icon: "📝", name: "会议纪要" }
  ],
  projectHead: ["项目 ID", "开展时间", "进度", "发起人"],
  projectRows: [
    ["PRJ-2026-011", "2026-08-13", "需求澄清中", "项目经理 Lyn"]
  ],
  sessionHead: ["Session ID", "Agent", "原始输入", "反馈"],
  sessionRows: [
    ["S-011-A", "Analyst", "4 份原始材料", "归一化 + 分层记忆建立"],
    ["S-011-C", "Coder", "Analyst 需求草稿", "戳破「新建」，改「回填扩展字段」"]
  ]
};

/* ---- 平台架构：分层堆叠（自下而上，上层依赖下层） ---- */
const ARCH = {
  layers: [
    { name: "底座层", color: "#f5f3ff", accent: "#6d28d9", items: ["Agent Runtime", "需求澄清 Skill", "持续改进 Skill"] },
    { name: "能力层", color: "#f0fdf4", accent: "#15803d", items: ["多源接入", "归一化", "分层记忆", "多 Agent 协作", "持久存储"] },
    { name: "连接层", color: "#eff6ff", accent: "#0369a1", items: ["Connectors"] },
    { name: "外部生态", color: "#f9fafb", accent: "#6b7280", external: true, items: ["金蝶", "飞书", "微信", "录音", "扫描件"] }
  ]
};

/* ---- 完成计划：路线图 ---- */
const ROADMAP = [
  {
    phase: "最小闭环", span: "4 个月", tag: "MVP",
    items: [
      { time: "第 1 月", title: "Agent 底座 + 多源接入 + 归一化 + 分层记忆" },
      { time: "第 2 月", title: "多 Agent 协作流水线" },
      { time: "第 3 月", title: "持久存储 + 需求提单" },
      { time: "第 4 月", title: "最小闭环跑通 + 上线打磨" }
    ]
  },
  {
    phase: "持续改进", span: "第 5 个月起", tag: "迭代",
    items: [
      { time: "第 5-8 月", title: "反馈闭环 + 提示词迭代（持续改进 Skill）" },
      { time: "第 9-12 月", title: "能力沉淀 + 规模化" }
    ]
  }
];