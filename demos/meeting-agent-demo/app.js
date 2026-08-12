/* ============================================================
 * 会智 · Meeting-to-Issue Agent — 交互逻辑
 * ============================================================ */

(function () {
  'use strict';

  /* ---- State ---- */
  let currentExample = null;
  let selectedIssueId = null;

  /* ---- DOM refs ---- */
  const $ = (id) => document.getElementById(id);
  const exampleSelector = $('exampleSelector');
  const inputText = $('inputText');
  const runBtn = $('runBtn');
  const processingArea = $('processingArea');
  const processingBar = $('processingBar');
  const extractionArea = $('extractionArea');
  const extractionGrid = $('extractionGrid');
  const issuesArea = $('issuesArea');
  const issueGrid = $('issueGrid');
  const workflowArea = $('workflowArea');
  const reviewArea = $('reviewArea');
  const reviewStatus = $('reviewStatus');
  const approveBtn = $('approveBtn');
  const rejectBtn = $('rejectBtn');

  /* ============================================================
   * 1. Example Selector
   * ============================================================ */
  function initExampleSelector() {
    EXAMPLES.forEach((ex, i) => {
      const btn = document.createElement('button');
      btn.className = 'example-btn' + (i === 0 ? ' active' : '');
      btn.textContent = ex.label;
      btn.addEventListener('click', () => selectExample(ex.id));
      exampleSelector.appendChild(btn);
    });
    selectExample(EXAMPLES[0].id);
  }

  function selectExample(id) {
    currentExample = EXAMPLES.find((e) => e.id === id);
    inputText.value = currentExample.rawText;
    document.querySelectorAll('.example-btn').forEach((b) => {
      b.classList.toggle('active', b.textContent === currentExample.label);
    });
    // Reset downstream
    hide(processingArea);
    hide(extractionArea);
    hide(issuesArea);
    hide(workflowArea);
    hide(reviewArea);
  }

  /* ============================================================
   * 2. Run Agent
   * ============================================================ */
  runBtn.addEventListener('click', runAgent);

  function runAgent() {
    if (!inputText.value.trim()) return;
    // Find matching example (or use current)
    const text = inputText.value.trim();
    const matched = EXAMPLES.find((e) => e.rawText.trim() === text);
    currentExample = matched || currentExample;

    // Show processing steps
    show(processingArea);
    processingBar.innerHTML = '';
    PROCESSING_STEPS.forEach((s) => {
      const div = document.createElement('div');
      div.className = 'proc-step';
      div.innerHTML =
        '<div class="num">STEP ' + s.step + '</div>' +
        '<div class="name">' + s.name + '</div>' +
        '<div class="desc">' + s.desc + '</div>';
      processingBar.appendChild(div);
    });

    // Show extraction results
    show(extractionArea);
    renderExtraction(currentExample.extraction);

    // Show issues
    show(issuesArea);
    renderIssues(currentExample.issues);

    // Hide workflow/review until issue selected
    hide(workflowArea);
    hide(reviewArea);

    // Scroll to processing
    processingArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ============================================================
   * 3. Render Extraction
   * ============================================================ */
  function renderExtraction(ext) {
    const topicsHtml = ext.topics.map((t) =>
      '<div class="ext-item">' + t.title +
      (t.participants ? ' <span class="tag">' + t.participants.join('、') + '</span>' : '') +
      '</div>'
    ).join('');

    const decisionsHtml = ext.decisions.map((d) =>
      '<div class="ext-item">' + d.text +
      ' <span class="tag">' + d.topic + '</span></div>'
    ).join('');

    const actionsHtml = ext.actionItems.map((a) =>
      '<div class="ext-item">' + a.text + ' → <strong>' + a.owner + '</strong> · ' + a.deadline + '</div>'
    ).join('');

    extractionGrid.innerHTML =
      '<div class="ext-card"><h4>议题</h4>' + topicsHtml + '</div>' +
      '<div class="ext-card"><h4>决策</h4>' + decisionsHtml + '</div>' +
      '<div class="ext-card" style="grid-column: 1 / -1;"><h4>待办 / Action Items</h4>' + actionsHtml + '</div>';
  }

  /* ============================================================
   * 4. Render Issues
   * ============================================================ */
  function renderIssues(issues) {
    issueGrid.innerHTML = '';
    issues.forEach((iss) => {
      const card = document.createElement('div');
      card.className = 'issue-card';
      card.dataset.issueId = iss.id;
      const prioClass = 'prio-' + iss.priority.toLowerCase();
      card.innerHTML =
        '<div class="issue-head">' +
          '<span class="issue-priority ' + prioClass + '">' + iss.priority + '</span>' +
          '<span class="issue-type">' + iss.type + '</span>' +
        '</div>' +
        '<h4>' + iss.title + '</h4>' +
        '<p class="desc">' + iss.description + '</p>' +
        '<div class="issue-meta">' +
          '<span><strong>负责人</strong> ' + iss.assignee + '</span>' +
          '<span><strong>截止</strong> ' + iss.deadline + '</span>' +
        '</div>';
      card.addEventListener('click', () => selectIssue(iss.id));
      issueGrid.appendChild(card);
    });
  }

  /* ============================================================
   * 5. Select Issue → Show Workflow + Review
   * ============================================================ */
  function selectIssue(issueId) {
    selectedIssueId = issueId;
    const issue = currentExample.issues.find((i) => i.id === issueId);
    if (!issue) return;

    // Highlight selected card
    document.querySelectorAll('.issue-card').forEach((c) => {
      c.classList.toggle('selected', c.dataset.issueId === issueId);
    });

    // Render workflow
    show(workflowArea);
    const wf = issue.workflow;
    const flowHtml = wf.steps.map((s, i) => {
      const isLast = i === wf.steps.length - 1;
      return (
        '<div class="wf-node">' +
          '<div class="wf-node-dot">' + (i + 1) + '</div>' +
          '<div class="wf-node-body">' +
            '<div class="name">' + s.node + '</div>' +
            '<div class="desc">' + s.desc + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    workflowArea.innerHTML =
      '<div class="workflow-panel">' +
        '<h3>' + issue.title + ' — 工作流草案</h3>' +
        '<p class="wf-sub">Agent 基于 Issue 类型自动推理工作流步骤，并生成提示词草案供人工审核</p>' +
        '<div class="wf-flow">' + flowHtml + '</div>' +
        '<div class="prompt-block">' +
          '<div class="prompt-label">提示词草案 · Prompt Draft</div>' +
          '<pre>' + escapeHtml(wf.promptDraft) + '</pre>' +
        '</div>' +
      '</div>';

    // Show review
    show(reviewArea);
    reviewStatus.textContent = '';
    reviewStatus.className = 'review-status';

    workflowArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ============================================================
   * 6. Review Actions
   * ============================================================ */
  approveBtn.addEventListener('click', function () {
    if (!selectedIssueId) return;
    reviewStatus.textContent = '✓ 已通过 — Issue 进入开发队列。提取结果进入「成功样本池」，强化当前 prompt。';
    reviewStatus.className = 'review-status ok';
  });

  rejectBtn.addEventListener('click', function () {
    if (!selectedIssueId) return;
    reviewStatus.textContent = '✗ 已驳回 — 修正内容进入「反馈池」，按错误类型聚类，下一轮 prompt 迭代时自动纳入。';
    reviewStatus.className = 'review-status no';
  });

  /* ============================================================
   * 7. Evolution Timeline
   * ============================================================ */
  function initEvolution() {
    const timeline = $('evoTimeline');
    timeline.innerHTML = EVOLUTION_HISTORY.map((e) => {
      const items = (e.problems || e.improvements || []).map((p) =>
        '<li>' + p + '</li>'
      ).join('');
      const label = e.problems ? '问题' : '改进';
      return (
        '<div class="evo-entry">' +
          '<span class="evo-ver">' + e.version + '</span>' +
          '<span class="evo-date">' + e.date + '</span>' +
          '<div class="evo-acc">准确率 <strong>' + e.accuracy + '%</strong></div>' +
          '<div class="evo-change">' + e.change + '</div>' +
          '<ul class="evo-list">' + items + '</ul>' +
        '</div>'
      );
    }).join('');
  }

  /* ============================================================
   * 8. Accuracy Chart (SVG)
   * ============================================================ */
  function initChart() {
    const svg = $('accuracyChart');
    const data = EVOLUTION_HISTORY.map((e) => e.accuracy);
    const labels = EVOLUTION_HISTORY.map((e) => e.version);

    // Layout
    const W = 440, H = 200;
    const padL = 40, padR = 20, padT = 20, padB = 40;
    const plotW = W - padL - padR;  // 380
    const plotH = H - padT - padB;  // 140

    // Y: 0-100 → plotT..(plotT+plotH)
    const yScale = (v) => padT + plotH - (v / 100) * plotH;
    // X: 4 points evenly
    const xScale = (i, n) => padL + (i / (n - 1)) * plotW;

    // Grid lines (50%, 75%, 100%)
    let gridStr = '';
    [50, 75, 100].forEach((v) => {
      const y = yScale(v);
      gridStr += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y +
        '" stroke="#234870" stroke-width="1" stroke-dasharray="3,4"/>';
      gridStr += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" fill="#6b82a0" font-size="10" text-anchor="end">' + v + '%</text>';
    });

    // Line path
    const points = data.map((v, i) => xScale(i, data.length) + ',' + yScale(v));
    const linePath = 'M ' + points.join(' L ');

    // Area fill
    const areaPath = 'M ' + padL + ',' + (padT + plotH) + ' L ' +
      points.join(' L ') + ' L ' + (W - padR) + ',' + (padT + plotH) + ' Z';

    // Points + labels
    let pointsStr = '';
    data.forEach((v, i) => {
      const x = xScale(i, data.length);
      const y = yScale(v);
      pointsStr += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#c9a961" stroke="#0a1628" stroke-width="2"/>';
      pointsStr += '<text x="' + x + '" y="' + (y - 10) + '" fill="#c9a961" font-size="11" font-weight="600" text-anchor="middle">' + v + '%</text>';
      pointsStr += '<text x="' + x + '" y="' + (H - padB + 18) + '" fill="#6b82a0" font-size="10" text-anchor="middle">' + labels[i] + '</text>';
    });

    // Axes
    const axesStr =
      '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + plotH) + '" stroke="#234870" stroke-width="1.5"/>' +
      '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '" stroke="#234870" stroke-width="1.5"/>';

    svg.innerHTML =
      '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#c9a961" stop-opacity="0.25"/>' +
        '<stop offset="100%" stop-color="#c9a961" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      gridStr + axesStr +
      '<path d="' + areaPath + '" fill="url(#areaGrad)"/>' +
      '<path d="' + linePath + '" fill="none" stroke="#c9a961" stroke-width="2.5"/>' +
      pointsStr;
  }

  /* ============================================================
   * 9. Correction Table
   * ============================================================ */
  function initCorrections() {
    const tbl = $('correctionTable');
    tbl.innerHTML =
      '<thead><tr>' +
        '<th>日期</th><th>场景</th><th>字段</th><th>原始输出</th><th>人工修正</th><th>反馈</th><th>生效版本</th>' +
      '</tr></thead><tbody>' +
      CORRECTION_RECORDS.map((r) =>
        '<tr>' +
          '<td>' + r.date + '</td>' +
          '<td>' + r.example + '</td>' +
          '<td>' + r.field + '</td>' +
          '<td class="field-orig">' + r.original + '</td>' +
          '<td class="field-corr">' + r.corrected + '</td>' +
          '<td>' + r.feedback + '</td>' +
          '<td>' + r.versionApplied + '</td>' +
        '</tr>'
      ).join('') +
      '</tbody>';
  }

  /* ============================================================
   * 10. Metrics
   * ============================================================ */
  function initMetrics() {
    const grid = $('metricsGrid');
    grid.innerHTML = METRICS.map((m) =>
      '<div class="metric-card">' +
        '<div class="metric-value">' + m.value + '</div>' +
        '<div class="metric-trend">vs v1.0 ' + m.trend + '</div>' +
        '<div class="metric-label">' + m.label + '</div>' +
        '<div class="metric-desc">' + m.desc + '</div>' +
      '</div>'
    ).join('');
  }

  /* ============================================================
   * 11. Human-AI Split Table
   * ============================================================ */
  function initSplitTable() {
    const tbl = $('splitTable');
    tbl.innerHTML =
      '<thead><tr>' +
        '<th>阶段</th><th>AI 负责</th><th>人工负责</th>' +
      '</tr></thead><tbody>' +
      HUMAN_AI_SPLIT.map((s) =>
        '<tr>' +
          '<td class="stage-cell">' + s.stage + '</td>' +
          '<td class="ai-cell">' + s.ai + '</td>' +
          '<td class="human-cell">' + s.human + '</td>' +
        '</tr>'
      ).join('') +
      '</tbody>';
  }

  /* ============================================================
   * 12. Architecture Cards
   * ============================================================ */
  function initArchitecture() {
    const grid = $('archGrid');
    const cards = [
      {
        title: '为什么选「会议纪要 → Issue」',
        body: '会议是需求产生的最高频场景。纪要→Issue 是从口语到结构化的第一跳，也是 Agent 最容易证明价值的切片。',
        list: ['贴合中台"边开发边用边反馈"现状', 'HR/财务/法务三线通用', '0-1年内可落地闭环'],
      },
      {
        title: 'Agent 工作流设计原则',
        body: '不是全自动——每个环节都设计了人机边界，低置信度自动路由人工，高风险终审不放手。',
        list: ['上下文组装：议题切分 + 历史修正注入', '工具集成：OCR/规则引擎/IM对接', '失败恢复：置信度兜底 + 人工队列'],
      },
      {
        title: '评估体系',
        body: '没有评估就没有迭代。120 份标注纪要做回归集，每次 prompt 变更必须跑全量，准确率不降才允许发布。',
        list: ['标注集：120份真实纪要 + 人工标注', '回归测试：prompt 变更触发全量', '反馈池：人工修正按错误类型聚类'],
      },
      {
        title: '技术实现',
        body: '本页为纯前端 mock 演示，展示交互逻辑与 Agent 设计。真实系统接入 LLM API + 后端服务，架构不变。',
        list: ['演示层：静态 HTML/CSS/JS，零依赖', '生产层：LLM API + Node 服务 + DB', '部署：静态文件可直接部署到任意服务器'],
      },
    ];
    grid.innerHTML = cards.map((c) =>
      '<div class="arch-card">' +
        '<h4>' + c.title + '</h4>' +
        '<p>' + c.body + '</p>' +
        '<ul>' + c.list.map((l) => '<li>' + l + '</li>').join('') + '</ul>' +
      '</div>'
    ).join('');
  }

  /* ============================================================
   * Utils
   * ============================================================ */
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ============================================================
   * Init
   * ============================================================ */
  initExampleSelector();
  initEvolution();
  initChart();
  initCorrections();
  initMetrics();
  initSplitTable();
  initArchitecture();

})();
