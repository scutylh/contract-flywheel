/* contract-flywheel — 6 章横向翻页叙事 + 分工矩阵 + 回放横轴 */
(function () {
  "use strict";

  var CHAPTERS = [
    { file: "index.html",        label: "首页" },
    { file: "loops/loop-1.html", label: "圈 1" },
    { file: "loops/loop-2.html", label: "圈 2" },
    { file: "loops/loop-3.html", label: "圈 3" },
    { file: "plan90.html",       label: "90 天" },
    { file: "appendix.html",     label: "附录" }
  ];

  var ACTOR_LABEL = {
    agent: "Agent", human: "人工", mixed: "人机协作",
    reviewer: "评审组 Agent", system: "系统"
  };
  var KIND_LABEL = {
    extract: "需求提取", issue: "生成 Issue", clarify: "反问澄清",
    confirm: "边界确认", input: "需求输入", retrieve: "资产检索",
    code: "代码开发", review: "审查", approve: "人工审核", deploy: "上线"
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function shortName(loop) {
    return String(loop.name || "").replace(/^圈\s*\d+\s*·\s*/, "");
  }
  function findLoop(id) {
    if (!window.TRACES) return null;
    for (var i = 0; i < window.TRACES.length; i++) {
      if (String(window.TRACES[i].id) === String(id)) return window.TRACES[i];
    }
    return null;
  }

  function renderDiff(text) {
    return text.split("\n").map(function (line) {
      var cls = "dl-dim";
      if (line.indexOf("±") === 0) cls = "dl-human";
      else if (line.indexOf("+") === 0) cls = "dl-add";
      else if (line.indexOf("-") === 0) cls = "dl-del";
      return '<span class="' + cls + '">' + esc(line) + "</span>";
    }).join("\n");
  }

  /* ================= 章节壳 ================= */
  function basePrefix() {
    var b = document.body.getAttribute("data-base") || "";
    return b ? b.replace(/\/+$/, "") + "/" : "";
  }
  function currentChapter() {
    var n = parseInt(document.body.getAttribute("data-chapter") || "1", 10);
    return Math.max(1, Math.min(CHAPTERS.length, n));
  }
  function chapterUrl(i) {
    return basePrefix() + CHAPTERS[i - 1].file;
  }
  function go(next) {
    if (next < 1 || next > CHAPTERS.length) return;
    try { sessionStorage.setItem("cfw-dir", next > currentChapter() ? "next" : "prev"); } catch (e) {}
    window.location.href = chapterUrl(next);
  }

  function initChapterShell() {
    var ch = currentChapter();
    var base = basePrefix();

    var topbar = document.querySelector("[data-topbar]");
    if (topbar) topbar.innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="' + base + 'index.html">contract-flywheel</a>' +
        '<span class="pos">第 <b>' + ch + '</b> 章 / 共 ' + CHAPTERS.length + ' 章</span>' +
      '</div>';

    var progress = document.querySelector("[data-progress]");
    if (progress) {
      progress.innerHTML = '<div class="wrap">' + CHAPTERS.map(function (c, i) {
        return '<a href="' + chapterUrl(i + 1) + '"' + (i + 1 === ch ? ' class="on"' : '') +
          '><span class="bar"></span>' + c.label + '</a>';
      }).join("") + '</div>';
    }

    var arrows = document.querySelector("[data-arrows]");
    if (arrows) {
      var prevHref = ch > 1 ? chapterUrl(ch - 1) : "#";
      var nextHref = ch < CHAPTERS.length ? chapterUrl(ch + 1) : "#";
      arrows.innerHTML =
        '<a class="prev' + (ch <= 1 ? ' hide' : '') + '" href="' + prevHref + '">' +
          '<span class="ch">‹</span>查看上一章节</a>' +
        '<a class="next' + (ch >= CHAPTERS.length ? ' hide' : '') + '" href="' + nextHref + '">' +
          '查看下一章节<span class="ch">›</span></a>';
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(ch + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(ch - 1); }
    });

    // 进入方向 → 滑入动画
    var dir = null;
    try { dir = sessionStorage.getItem("cfw-dir"); } catch (e) {}
    if (dir === "next") document.body.classList.add("enter-next");
    else if (dir === "prev") document.body.classList.add("enter-prev");
  }

  /* ================= 分工矩阵 ================= */
  function divisionMatrixHtml(loop) {
    var div = loop.division || [];
    var cols = div.length || 1;
    var grid = "grid-template-columns:" + (112) + "px repeat(" + cols + ",1fr)";

    var head = '<div class="dm-corner">分工</div>' + div.map(function (d) {
      return '<div class="dm-h">' + esc(d.action) + '</div>';
    }).join("");

    function lane(kind) {
      var cells = div.map(function (d) {
        var pct = kind === "human" ? d.humanPct : d.agentPct;
        var label = kind === "human" ? d.human : d.agent;
        var empty = pct <= 0;
        return '<div class="dm-cell' + (empty ? ' empty' : '') + '">' +
          '<div class="dm-bar"><div class="dm-fill ' + kind + '" style="width:' + pct + '%"></div></div>' +
          '<div class="dm-label">' + esc(label) + '</div>' +
          '<div class="dm-pct">' + pct + '%</div>' +
        '</div>';
      }).join("");
      return '<div class="dm-row" style="' + grid + '">' +
        '<div class="dm-lane ' + kind + '">' + (kind === "human" ? '人类' : 'Agent') + '</div>' +
        cells + '</div>';
    }

    return '<div class="dm">' +
      '<div class="dm-row" style="' + grid + '">' + head + '</div>' +
      lane("human") + lane("agent") + '</div>';
  }

  /* ================= 回放横轴 ================= */
  function stepBodyHtml(step) {
    var body = step.lang === "diff" ? renderDiff(step.body) : esc(step.body);
    return '<div class="step-body"><pre>' + body + '</pre></div>';
  }

  function replayHtml(loop) {
    var steps = loop.steps || [];
    var nodes = steps.map(function (s, i) {
      return '<button class="ra-node actor-' + s.actor + '" data-i="' + i + '" type="button">' +
        '<span class="dot"></span><span class="ra-title">' + esc(s.title) + '</span></button>';
    }).join("");
    var cards = steps.map(function (s, i) {
      return '<article class="ra-card actor-' + s.actor + '" data-i="' + i + '">' +
        '<div class="step-head" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<span class="badge ' + s.actor + '">' + ACTOR_LABEL[s.actor] + '</span>' +
          '<span class="step-title">' + esc(s.title) + '</span>' +
          '<span class="kind-tag">' + (KIND_LABEL[s.kind] || s.kind) + '</span>' +
        '</div>' + stepBodyHtml(s) + '</article>';
    }).join("");
    var sediments = (loop.sediments || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("");
    return '<div class="trigger"><div class="t-label">' + esc(loop.trigger.label) + '</div><pre>' + esc(loop.trigger.body) + '</pre></div>' +
      '<div class="ra-scroller"><div class="ra-canvas">' +
        '<div class="ra-axis">' + nodes + '</div>' +
        '<div class="ra-track">' + cards + '</div>' +
      '</div></div>' +
      '<div class="sediments"><div class="s-title">本圈沉淀（进入下一圈的资产）</div><ul>' + sediments + '</ul></div>';
  }

  function bindReplay(container) {
    var nodes = container.querySelectorAll(".ra-node");
    var cards = container.querySelectorAll(".ra-card");
    var scroller = container.querySelector(".ra-scroller");

    function focus(i) {
      [nodes, cards].forEach(function (list) {
        list.forEach(function (el, j) {
          el.classList.toggle("on", j === i);
          el.classList.remove("dim-adj", "dim-far");
          if (j !== i) el.classList.add(Math.abs(j - i) === 1 ? "dim-adj" : "dim-far");
        });
      });
      var card = cards[i];
      if (card && scroller && typeof scroller.scrollTo === "function") {
        var sr = scroller.getBoundingClientRect();
        var cr = card.getBoundingClientRect();
        var left = cr.left - sr.left + scroller.scrollLeft;
        scroller.scrollTo({ left: Math.max(0, left - (scroller.clientWidth - card.offsetWidth) / 2), behavior: "smooth" });
      }
    }

    nodes.forEach(function (n, i) { n.addEventListener("click", function () { focus(i); }); });
    cards.forEach(function (c, i) { c.addEventListener("click", function () { focus(i); }); });
    if (nodes.length) focus(0);
  }

  /* ================= 演一遍（recap） ================= */
  function renderRecap(container) {
    if (!window.TRACES || window.TRACES.length < 3) return;
    var idx = 0;
    container.innerHTML =
      '<div class="recap-toolbar">' +
        '<button class="btn" data-play>▶ 演一遍</button>' +
        '<div class="recap-dots">' + window.TRACES.map(function (_, i) {
          return '<span class="recap-dot' + (i === 0 ? ' on' : '') + '"></span>';
        }).join("") + '</div>' +
        '<span class="recap-stage-label">圈 ' + window.TRACES[0].id + '</span>' +
      '</div>' +
      '<div class="dm" data-dm>' + divisionMatrixHtml(window.TRACES[0]) + '</div>';

    var dm = container.querySelector("[data-dm]");
    var dots = container.querySelectorAll(".recap-dot");
    var label = container.querySelector(".recap-stage-label");
    var btn = container.querySelector("[data-play]");
    var timer = null;

    function setLoop(i) {
      var loop = window.TRACES[i];
      var N = loop.division.length;
      var fills = dm.querySelectorAll(".dm-fill");
      var labels = dm.querySelectorAll(".dm-label");
      var pcts = dm.querySelectorAll(".dm-pct");
      var cells = dm.querySelectorAll(".dm-cell");
      loop.division.forEach(function (d, j) {
        // 人类行（前 N 格）
        fills[j].style.width = d.humanPct + "%";
        pcts[j].textContent = d.humanPct + "%";
        labels[j].textContent = d.human;
        cells[j].classList.toggle("empty", d.humanPct <= 0);
        // Agent 行（后 N 格）
        fills[j + N].style.width = d.agentPct + "%";
        pcts[j + N].textContent = d.agentPct + "%";
        labels[j + N].textContent = d.agent;
        cells[j + N].classList.toggle("empty", d.agentPct <= 0);
      });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
      label.textContent = "圈 " + loop.id;
      idx = i;
    }

    btn.addEventListener("click", function () {
      if (timer) return;
      idx = 0;
      setLoop(0);
      btn.textContent = "回放中…";
      timer = setInterval(function () {
        if (idx >= window.TRACES.length - 1) {
          clearInterval(timer); timer = null;
          btn.textContent = "↻ 重新演一遍";
          return;
        }
        setLoop(idx + 1);
      }, 1400);
    });
  }

  /* ================= 圈页渲染 ================= */
  function renderLoopPage() {
    var loop = findLoop(document.body.getAttribute("data-loop"));
    if (!loop) return;

    var head = document.querySelector("[data-loop-head]");
    if (head) head.innerHTML =
      '<a class="back" href="' + basePrefix() + 'index.html">← 返回首页</a>' +
      '<span class="loop-tag l' + loop.id + '">圈 ' + loop.id + ' · 执行回放</span>' +
      '<h1>' + esc(shortName(loop)) + '</h1>' +
      '<p class="sub">' + esc(loop.subtitle) + '</p>' +
      '<div class="hero-ratio">' +
        '<span class="h">人工 ' + loop.ratio.human + '%</span>' +
        '<span class="a">Agent ' + loop.ratio.agent + '%</span>' +
      '</div>';

    var div = document.querySelector("[data-division]");
    if (div) div.innerHTML = divisionMatrixHtml(loop);

    var replay = document.querySelector("[data-replay]");
    if (replay) { replay.innerHTML = replayHtml(loop); bindReplay(replay); }

    var recap = document.querySelector("[data-recap]");
    if (recap) renderRecap(recap);
  }

  /* ================= 首页飞轮跳转 ================= */
  function bindFlywheel() {
    document.querySelectorAll("[data-href]").forEach(function (el) {
      el.addEventListener("click", function () {
        try { sessionStorage.setItem("cfw-dir", "next"); } catch (e) {}
        window.location.href = el.getAttribute("data-href");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initChapterShell();
    if (document.body.hasAttribute("data-loop")) renderLoopPage();
    else bindFlywheel();
  });
})();
