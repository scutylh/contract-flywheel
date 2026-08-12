// 本文件由 scripts/build-traces.mjs 生成，请勿手改；数据源在 traces/*.json
window.TRACES = [
  {
    "id": 1,
    "name": "圈 1 · 从 0 到可用",
    "subtitle": "会议纪要 → 需求单 → 人机协作开发 → 双审上线",
    "ratio": {
      "human": 70,
      "agent": 30
    },
    "trigger": {
      "label": "输入 · 法务例会纪要（2026-07-28）",
      "body": "参会：法务 王律师 / 业务运营 张姐 / 系统负责人 李总\n\n王律师：现在每份合同审批都要人肉翻 PDF，一份二三十页，金额、账期、付款条件全靠肉眼核对，一天最多审 8 份，已经积压 40 多份。\n张姐：业务侧经常问“我的合同到哪了”，我们也答不上来。\n李总：先把关键信息提取做出来——金额、账期、付款条件三项，提取出来整理进现有的合同流程表，法务在表里复核。其他以后再说。"
    },
    "steps": [
      {
        "actor": "agent",
        "kind": "extract",
        "title": "需求结构化提取",
        "body": "需求单 #REQ-2026-0047\n来源：法务例会纪要 2026-07-28\n目标：合同关键信息自动提取，法务复核提效\n提取字段：合同金额 / 账期 / 付款条件\n输出：写入现有「合同流程表」（新增 3 列 + 提取置信度 + 原文定位）\n验收标准：近 3 个月 50 份历史合同回归，三项字段准确率 ≥ 95%\n本期边界：不做审批流改造、不做对外通知"
      },
      {
        "actor": "agent",
        "kind": "issue",
        "title": "生成 Issue #12",
        "body": "[REQ-2026-0047] 合同关键信息提取（金额/账期/付款条件）\n\n- 新增 contract_extract 工作流：PDF → 文本解析 → 字段提取 → 写流程表\n- 每条提取结果带原文定位（页码 + 段落），供法务一键复核\n- 提取置信度低于阈值的结果自动标黄，强制人工确认\n- 验收：50 份历史合同回归，准确率 ≥ 95%"
      },
      {
        "actor": "mixed",
        "kind": "code",
        "title": "人机协作开发 · contract_extract.py",
        "lang": "diff",
        "body": "+ # --- 以下由 Agent 生成 ---\n+ def extract_fields(pdf_path: str) -> ExtractResult:\n+     text = pdf_parse(pdf_path)                      # 复用 pdf_parse 组件\n+     amount = match_amount(text)                     # 金额（含大小写）\n+     term = match_payment_term(text)                 # 账期\n+     conds = match_payment_conditions(text)          # 付款条件\n+     return ExtractResult(amount, term, conds,\n+         confidence=score(text), loc=locate(text))\n+ \n± # --- 人工修改：金额大小写不一致时以中文大写为准（李总评审意见） ---\n±     if amount.has_conflict():\n±         amount = amount.prefer_uppercase_cn()\n± \n± # --- 人工修改：置信度阈值 0.85 → 0.92，低于阈值必须人工确认 ---\n± CONFIDENCE_THRESHOLD = 0.92\n+ \n+ def run(contract_id: str):\n+     result = extract_fields(fetch(contract_id))\n+     sheet_writer.append_row(FLOW_SHEET, result)     # 写入流程表\n+     ...                                             # 余下 40 行略"
      },
      {
        "actor": "agent",
        "kind": "review",
        "title": "Agent 自审（提交 MR 前）",
        "body": "✓ 字段缺失兜底逻辑已覆盖（未约定 → 显式标记「未约定」，不留空）\n✓ 回归用例 50 份历史合同全部通过，准确率 96.0%\n⚠ 提醒：付款条件存在「分期付款」表述未覆盖 → 已补充 3 条用例并修复\n⚠ 提醒：扫描件 PDF 无文本层 → 已在 Issue 中标注为已知边界，本期走人工录入"
      },
      {
        "actor": "human",
        "kind": "approve",
        "title": "人工审核 · 李总",
        "body": "审核意见：通过。\n1. 金额大小写不一致的冲突处理已按评审意见修改，符合财务惯例。\n2. 置信度阈值 0.92 合理，标黄强制人工确认这条保留——宁可慢，不可错。\n3. 扫描件边界已知悉，下期评估 OCR 组件。\n\n操作：批准 MR !12，合并上线。"
      },
      {
        "actor": "system",
        "kind": "deploy",
        "title": "上线",
        "body": "contract_extract v1 已上线。\n法务复核入口：合同流程表（新增 金额 / 账期 / 付款条件 / 置信度 / 原文定位 5 列）。\n积压 40 份合同批量重跑完成，37 份自动通过，3 份标黄进入人工确认。"
      }
    ],
    "sediments": [
      "需求单模板 v1（来源/目标/字段/验收/边界 五段式）",
      "contract-extract Skill v1（字段提取 + 原文定位 + 置信度标黄）",
      "双审流程记录（Agent 自审 → 人工审核）",
      "能力边界表第 1 行：字段提取类 · 辅助级（需人工审核）· 准确率 96%"
    ]
  },
  {
    "id": 2,
    "name": "圈 2 · 听懂反馈",
    "subtitle": "模糊反馈 → Agent 反问澄清 → 边界收窄 → 账期提醒上线",
    "ratio": {
      "human": 50,
      "agent": 50
    },
    "trigger": {
      "label": "输入 · 负责人反馈（评审会上一句话）",
      "body": "李总：提取做得不错。但账期得有人盯啊——提醒要发给对应的人，不同的人负责不同的合同。"
    },
    "steps": [
      {
        "actor": "agent",
        "kind": "clarify",
        "title": "Agent 主动反问澄清（不直接动手）",
        "body": "收到反馈「账期提醒发给对应的人」。语义存在三处缺口，需要澄清：\n\n1.「对应的人」指谁？现有组织数据里，合同可关联的角色有：法务复核人 / 业务对接人 / 部门负责人。\n2.「不同的人负责不同的合同」——按什么维度分？按客户？按合同类型？按金额区间？\n3. 提醒触发时机：账期到期前 N 天提醒？N 是多少？\n\n在确认前，我不会改动任何代码。"
      },
      {
        "actor": "human",
        "kind": "input",
        "title": "负责人确认 · 李总",
        "body": "本期只发法务复核人，按流程表里的「负责人」字段来。到期前 7 天提醒。"
      },
      {
        "actor": "agent",
        "kind": "confirm",
        "title": "Agent 复述边界，二次确认",
        "body": "边界确认：\n· 本期仅实现「账期到期前 7 天，提醒流程表中登记的法务复核人」。\n· 业务对接人、部门负责人的分发规则，待组织维度数据明确后另立 Issue（已记录为 #18）。\n· 提醒文案模板需人工审核后才允许发送。\n\n是这样吗？——李总：对。"
      },
      {
        "actor": "mixed",
        "kind": "code",
        "title": "人机协作开发 · payment_reminder.py",
        "lang": "diff",
        "body": "+ # --- 以下由 Agent 生成 ---\n+ def daily_scan():\n+     rows = sheet_reader.query(FLOW_SHEET,\n+         where=\"payment_term - today <= 7 AND status = 'active'\")\n+     for row in rows:\n+         notify.send(role=\"legal_reviewer\",\n+                     user=row.owner,\n+                     template=\"payment_due_7d\",\n+                     payload=row)\n+ \n± # --- 人工修改：同一法务名下多份合同到期，合并为一条汇总提醒，避免轰炸 ---\n±     for owner, rows in group_by(rows, \"owner\"):\n±         notify.send_digest(role=\"legal_reviewer\",\n±                            user=owner,\n±                            template=\"payment_due_7d_digest\",\n±                            payload=rows)\n+ \n+ schedule(cron=\"0 9 * * *\", job=daily_scan)   # 每早 9 点扫描\n+ ...                                          # 余下 30 行略"
      },
      {
        "actor": "agent",
        "kind": "review",
        "title": "Agent 自审",
        "body": "✓ 复用圈 1 的流程表读取与圈 1 沉淀的置信度边界，未改动提取链路\n✓ 提醒模板「payment_due_7d_digest」已提交人工审核（模板未通过前不发送）\n✓ 新增评估用例 2 条：模糊指派 → 角色枚举 → 边界确认 的澄清路径\n⚠ 提醒：流程表中 5 份历史合同「负责人」字段为空 → 兜底策略：发法务组长并标注待补录"
      },
      {
        "actor": "human",
        "kind": "approve",
        "title": "人工审核 · 李总",
        "body": "审核意见：通过。\n1. 合并汇总提醒的改动好，这正是人比 Agent 更懂业务体感的地方。\n2. 负责人为空的兜底发组长，可以。\n3. 文案模板我已审，准许启用。\n\n操作：批准 MR !15，合并上线。"
      },
      {
        "actor": "system",
        "kind": "deploy",
        "title": "上线",
        "body": "payment_reminder v1 已上线。\n每日 09:00 扫描，到期前 7 天汇总提醒法务复核人；负责人缺失的合同提醒法务组长并标注待补录。\n上线首周：发出提醒 23 条，零误报，法务确认及时率从 61% → 94%。"
      }
    ],
    "sediments": [
      "澄清式交互 Skill v1（模糊指派 → 角色枚举 → 边界确认 → 二次复述）",
      "notify 组件入组件库（按角色分发 / 汇总摘要 / 模板人工审核闸门）",
      "评估用例 +2：模糊反馈澄清路径回归",
      "能力边界表第 2 行：定时提醒类 · 辅助级（需人工审核）· 首周零误报"
    ]
  },
  {
    "id": 3,
    "name": "圈 3 · 接近自治",
    "subtitle": "新需求 → Agent 检索历史资产自主开发 → Agent 评审 → 人工一键确认",
    "ratio": {
      "human": 5,
      "agent": 95
    },
    "trigger": {
      "label": "输入 · 新需求（法务提出，表述已接近结构化）",
      "body": "王律师：希望系统能提取合同里的准入条件关键词——比如「独家」「排他」「最惠国」——命中就在流程表里标红，并且审核结果同步发给业务组。"
    },
    "steps": [
      {
        "actor": "agent",
        "kind": "retrieve",
        "title": "Agent 检索历史代码、约束与组件",
        "body": "检索资产库：\n· contract_extract 工作流（圈 1）→ 字段提取管线可直接复用，关键词提取是其特例\n· notify 组件（圈 2）→ 已支持按角色分发；「业务组」角色在圈 2 澄清中已枚举登记\n· 约束记录：流程表写入必须带置信度（圈 1 双审记录）；对外通知模板需人工已审（圈 2）\n· 组件库：pdf_parse / field_extract / sheet_writer / notify\n\n结论：无需新建管线。改动 = 关键词配置 + extract 管线挂接 + notify 增加业务组路由。预估 < 120 行，落入「自治交付」边界。"
      },
      {
        "actor": "agent",
        "kind": "code",
        "title": "Agent 自主开发（全程无人工介入编码）",
        "lang": "diff",
        "body": "+ # --- 本圈全部代码由 Agent 生成 ---\n+ # keywords.yaml（外置配置，符合「共性组件下沉」约束）\n+ #   独家: [独家, 独家代理, 独家授权]\n+ #   排他: [排他, 排他性]\n+ #   最惠国: [最惠国, 最惠国待遇, 最惠国条款]\n+ \n+ def match_access_keywords(text: str) -> list[KeywordHit]:\n+     hits = []\n+     for kw, synonyms in load(\"keywords.yaml\").items():\n+         for m in find_any(text, synonyms):\n+             hits.append(KeywordHit(kw, context=text[m-50:m+50]))  # 命中上下文前后 50 字\n+     return hits\n+ \n+ # 挂接圈 1 管线 + 圈 2 通知路由\n+ pipeline.after(\"field_extract\", match_access_keywords)\n+ pipeline.on(\"keyword_hit\", sheet_writer.flag_red)\n+ pipeline.on(\"review_done\", notify.route(role=\"business_group\"))\n+ ...                                    # 余下 80 行略"
      },
      {
        "actor": "reviewer",
        "kind": "review",
        "title": "评审组 Agent 审查 MR !19",
        "body": "评审结论：通过（2 条建议，均已处理）\n✓ 完整复用 contract_extract 管线与 notify 组件，未重复造轮子\n✓ 关键词表外置为 yaml 配置，业务可自行维护，符合「共性组件下沉」约束\n✓ 命中结果带置信度写入流程表，遵守圈 1 沉淀的写入约束\n\n建议 1：关键词命中应记录上下文（前后 50 字），便于法务复核 → 已采纳并实现\n建议 2：「最惠国」存在多种写法 → 已采纳加同义词表；同义词自动扩召另立优化 Issue #21"
      },
      {
        "actor": "human",
        "kind": "approve",
        "title": "人工一键确认 · 李总",
        "body": "本圈人工未读代码全文，只看三样东西：\n1. 检索记录 —— 改动确实落在已验证资产之上；\n2. 评审组 Agent 意见 —— 通过，两条建议均已闭环；\n3. 回归报告 —— 圈 1/圈 2 用例全绿，新增用例 8 条通过。\n\n操作：一键确认，批准上线。耗时 40 秒。"
      },
      {
        "actor": "system",
        "kind": "deploy",
        "title": "上线",
        "body": "access_keywords v1 已上线。\n命中准入关键词的合同在流程表自动标红，审核结果自动同步业务组。\n从需求提出到上线：3.5 小时（圈 1 同类改动耗时 3 天）。"
      }
    ],
    "sediments": [
      "能力边界表第 3 行：关键词提取 + 通知路由类 · 自治级（人工仅确认）· 成功率 1/1",
      "Agent 评审规则 v1（复用检查 / 约束遵守 / 用例回归 三段式）",
      "自治交付准入条件：复用已验证组件 且 改动 < 150 行 且 回归全绿",
      "优化 Issue #21：关键词同义词自动扩召"
    ]
  }
];
