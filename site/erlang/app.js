/* ============================================================
 * Erlang 二郎 · 需求澄清 Agent — 交互逻辑
 * 分层记忆 / 协作表格 / 持久存储 / 群聊自动播放 / 洋葱图 / 路线图
 * ============================================================ */

(function () {
  'use strict';

  let currentScene = null;
  let msgIdx = -1;
  let totalMsgs = 0;
  let timer = null;

  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }
  function renderText(t) {
    return esc(t).replace(/@([\u4e00-\u9fa5A-Za-z0-9]+)/g, '<span class="mention">@$1</span>');
  }

  function renderCaps() {
    $('capGrid').innerHTML = CAPABILITIES.map((c) =>
      '<div class="cap-card"><div class="cap-icon">' + c.icon + '</div>' +
      '<div class="cap-title">' + c.title + '</div>' +
      '<div class="cap-desc">' + esc(c.desc) + '</div></div>'
    ).join('');
  }

  function renderMemorySection() {
    const s = SCENARIOS[0];
    $('memorySources').innerHTML = s.sources.map((src) =>
      '<div class="ms-source"><span class="ms-src-icon">' + src.icon + '</span>' +
      '<span class="ms-src-type">' + esc(src.type) + '</span></div>'
    ).join('');
    $('normTitle').textContent = s.normalize.title;
    $('normItems').innerHTML = s.normalize.items.map((it) =>
      '<div class="norm-item"><span class="norm-from">' + esc(it.from) + '</span>' +
      '<span class="norm-arrow">→</span>' +
      '<span class="norm-to">' + esc(it.to) + '</span></div>'
    ).join('');
    $('memorySummary').innerHTML = s.memory.summary.map((m) =>
      '<div class="ms-sum"><span class="ms-sum-text">' + esc(m.text) + '</span>' +
      '<span class="ms-sum-ref">← ' + esc(m.ref) + '</span></div>'
    ).join('');
    $('memoryNote').textContent = s.memory.note;
  }

  function renderAgentsTable() {
    const rows = AGENTS.map((a) =>
      '<tr class="' + a.color + '">' +
        '<td class="agent-cell"><span class="agent-id">' + a.icon + ' ' + a.id + '</span></td>' +
        '<td>' + esc(a.hold) + '</td>' +
        '<td>' + esc(a.duty) + '</td>' +
        '<td class="goal-cell">' + esc(a.goal) + '</td>' +
      '</tr>'
    ).join('');
    const eRow = '<tr class="agent-e"><td class="agent-cell"><span class="agent-id">E …</span></td><td>（可扩展）</td><td>更多视角</td><td>—</td></tr>';
    $('agentsTable').innerHTML =
      '<thead><tr><th>Agent</th><th>持有</th><th>职责</th><th>目标</th></tr></thead>' +
      '<tbody>' + rows + eRow + '</tbody>';
  }

  function renderStorage() {
    $('storageFiles').innerHTML = STORAGE.files.map((f) =>
      '<span class="file-tag">' + f.icon + ' ' + esc(f.name) + '</span>'
    ).join('');
    $('projectTable').innerHTML =
      '<thead><tr>' + STORAGE.projectHead.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead>' +
      '<tbody>' + STORAGE.projectRows.map((r) =>
        '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>'
      ).join('') + '</tbody>';
    $('sessionTable').innerHTML =
      '<thead><tr>' + STORAGE.sessionHead.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead>' +
      '<tbody>' + STORAGE.sessionRows.map((r) =>
        '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>'
      ).join('') + '</tbody>';
  }

  /* ---- 平台架构图：层名侧边，组件直接撑起边界 ---- */
  function renderArch() {
    $('platformBox').innerHTML = ARCH.layers.slice().reverse().map((l) =>
      '<div class="arch-layer' + (l.external ? ' external' : '') + '" style="--lb:' + l.color + ';--la:' + l.accent + '">' +
        '<div class="arch-label">' + esc(l.name) + '</div>' +
        '<div class="arch-items">' +
          l.items.map((it) => '<span class="arch-item">' + esc(it) + '</span>').join('') +
        '</div>' +
      '</div>'
    ).join('');
  }

  /* ---- 路线图 ---- */
  function renderRoadmap() {
    $('roadmapBox').innerHTML = ROADMAP.map((phase) =>
      '<div class="rm-phase">' +
        '<div class="rm-head"><span class="rm-name">' + esc(phase.phase) + '</span>' +
        '<span class="rm-span">' + esc(phase.span) + '</span>' +
        '<span class="rm-tag">' + esc(phase.tag) + '</span></div>' +
        '<div class="rm-items">' + phase.items.map((it) =>
          '<div class="rm-item"><span class="rm-time">' + esc(it.time) + '</span>' +
          '<span class="rm-title">' + esc(it.title) + '</span></div>'
        ).join('') + '</div>' +
      '</div>'
    ).join('');
  }

  /* ---- 群聊 ---- */
  function renderSelector() {
    const sel = $('exampleSelector');
    sel.innerHTML = SCENARIOS.map((s, i) =>
      '<button class="example-btn' + (i === 0 ? ' active' : '') + '" data-id="' + s.id + '">' + esc(s.label) + '</button>'
    ).join('');
    sel.querySelectorAll('.example-btn').forEach((b) => {
      b.addEventListener('click', () => selectScene(b.dataset.id));
    });
    selectScene(SCENARIOS[0].id);
  }

  function selectScene(id) {
    currentScene = SCENARIOS.find((s) => s.id === id);
    document.querySelectorAll('.example-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.id === id);
    });
    renderChatHead();
    resetDemo();
  }

  function renderChatHead() {
    $('chatTitle').textContent = currentScene.label;
    $('chatSources').innerHTML = currentScene.sources.map((s) =>
      '<span class="src-tag">' + s.icon + ' ' + esc(s.type) + '</span>'
    ).join('');
  }

  function resetDemo() {
    clearTimeout(timer);
    hide($('docArea')); hide($('reviewArea'));
    msgIdx = -1; totalMsgs = 0;
    $('chatBody').innerHTML = '';
    $('playBtn').style.display = '';
    $('replayBtn').style.display = 'none';
    $('roundProgress').textContent = '';
    $('reviewStatus').textContent = '';
    $('reviewStatus').className = 'review-status';
  }

  function appendMessage(idx) {
    const m = currentScene.messages[idx];
    const isTool = (m.from === 'tool');
    const isHuman = (m.from === 'pm');
    const el = document.createElement('div');
    el.className = 'chat-msg' + (isTool ? ' tool' : '') + (isHuman ? ' human' : '') + ' ' + m.color;
    let html;
    if (isTool) {
      html = '<div class="msg-text">' + renderText(m.text) + '</div>';
    } else {
      html =
        '<div class="msg-avatar">' + m.icon + '</div>' +
        '<div class="msg-main">' +
          '<div class="msg-name">' + esc(m.name) + '</div>' +
          (m.attach ? '<div class="msg-attach">' +
            m.attach.map((a) => '<span class="attach-tag">📎 ' + esc(a) + '</span>').join('') +
          '</div>' : '') +
          '<div class="msg-bubble">' + renderText(m.text) + '</div>' +
          (m.punch ? '<div class="msg-punch">' + esc(m.punch) + '</div>' : '') +
        '</div>';
    }
    el.innerHTML = html;
    $('chatBody').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function startPlay() {
    totalMsgs = currentScene.messages.length;
    msgIdx = -1;
    $('chatBody').innerHTML = '';
    hide($('docArea')); hide($('reviewArea'));
    $('playBtn').style.display = 'none';
    $('replayBtn').style.display = 'none';
    $('roundProgress').textContent = '';
    playNext();
  }

  function playNext() {
    msgIdx++;
    if (msgIdx < totalMsgs) {
      appendMessage(msgIdx);
      $('roundProgress').textContent = (msgIdx + 1) + ' / ' + totalMsgs;
      timer = setTimeout(playNext, 1100);
    } else {
      show($('docArea')); renderDoc(); show($('reviewArea'));
      $('docArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('replayBtn').style.display = '';
      $('roundProgress').textContent = '已提单';
    }
  }

  $('playBtn').addEventListener('click', startPlay);
  $('replayBtn').addEventListener('click', () => {
    clearTimeout(timer);
    startPlay();
  });

  function renderDoc() {
    const d = currentScene.doc;
    const metaHtml = d.meta.map((m) =>
      '<div class="doc-meta"><div class="dm-v">' + esc(m.v) + '</div><div class="dm-k">' + esc(m.k) + '</div></div>'
    ).join('');
    const secHtml = d.sections.map((s) =>
      '<tr><th>' + esc(s.k) + '</th><td>' + esc(s.v) + '</td></tr>'
    ).join('');
    $('docCard').innerHTML =
      '<div class="doc-head"><div class="doc-title">' + esc(d.title) + '</div>' +
      '<div class="doc-req">' + esc(d.reqId) + '</div></div>' +
      '<div class="doc-meta-row">' + metaHtml + '</div>' +
      '<table class="doc-table"><tbody>' + secHtml + '</tbody></table>' +
      '<div class="doc-feed">' + esc(d.feed) + '</div>';
  }

  $('approveBtn').addEventListener('click', () => {
    $('reviewStatus').textContent = '✓ 已采纳 —— 进入开发队列。本次采纳进入「成功样本池」，强化提示词。';
    $('reviewStatus').className = 'review-status ok';
  });
  $('rejectBtn').addEventListener('click', () => {
    $('reviewStatus').textContent = '✗ 已驳回 —— 修正内容进入「反馈池」，按错误类型聚类，纳入下一轮提示词改进。';
    $('reviewStatus').className = 'review-status no';
  });

  renderCaps();
  renderMemorySection();
  renderAgentsTable();
  renderStorage();
  renderArch();
  renderRoadmap();
  renderSelector();
})();