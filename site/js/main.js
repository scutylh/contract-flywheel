/* contract-flywheel — 三圈飞轮回放与渲染 */
(function () {
  "use strict";

  var ACTOR_LABEL = {
    agent: "Agent",
    human: "人工",
    mixed: "人机协作",
    reviewer: "评审组 Agent",
    system: "系统"
  };
  var ACTOR_COLOR = {
    agent: "#6d28d9",
    human: "#b45309",
    mixed: "MIX",
    reviewer: "#0f766e",
    system: "#64748b"
  };
  var KIND_LABEL = {
    extract: "需求提取",
    issue: "生成 Issue",
    clarify: "反问澄清",
    confirm: "边界确认",
    input: "需求输入",
    retrieve: "资产检索",
    code: "代码开发",
    review: "审查",
    approve: "人工审核",
    deploy: "上线"
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 「圈 1 · 从 0 到可用」→「从 0 到可用」 */
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

  function maxLoopId() {
    var m = 0;
    if (window.TRACES) window.TRACES.forEach(function (l) { m = Math.max(m, l.id); });
    return m;
  }

  /* diff 着色：+ Agent 新增 / ± 人工修改 / - 删除 / 其余常规 */
  function renderDiff(text) {
    return text.split("\n").map(function (line) {
      var cls = "dl-dim";
      if (line.indexOf("±") === 0) cls = "dl-human";
      else if (line.indexOf("+") === 0) cls = "dl-add";
      else if (line.indexOf("-") === 0) cls = "dl-del";
      return '<span class="' + cls + '">' + esc(line) + "</span>";
    }).join("\n");
  }

  function stepHtml(step) {
    var body = step.lang === "diff"
      ? '<div class="step-body diff"><pre>' + renderDiff(step.body) + "</pre></div>"
      : '<div class="step-body"><pre>' + esc(step.body) + "</pre></div>";
    return (
      '<li class="step actor-' + step.actor + '">' +
        '<div class="step-head">' +
          '<span class="badge ' + step.actor + '">' + ACTOR_LABEL[step.actor] + "</span>" +
          '<span class="step-title">' + esc(step.title) + "</span>" +
          '<span class="kind-tag">' + (KIND_LABEL[step.kind] || step.kind) + "</span>" +
        "</div>" +
        body +
      "</li>"
    );
  }

  /* 环形图：每个步骤一段弧，回放时逐段点亮 */
  function arcPath(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var large = a1 - a0 > Math.PI ? 1 : 0;
    return "M " + x0.toFixed(1) + " " + y0.toFixed(1) +
           " A " + r + " " + r + " 0 " + large + " 1 " +
           x1.toFixed(1) + " " + y1.toFixed(1);
  }

  function ringHtml(loop) {
    var n = loop.steps.length;
    var cx = 100, cy = 100, r = 78;
    var gap = 0.12; // 弧度间隙
    var out = ['<svg viewBox="0 0 200 200" class="ring" role="img" aria-label="圈 ' + loop.id + ' 步骤环">'];
    out.push('<defs><linearGradient id="gmix-' + loop.id + '" x1="0" y1="0" x2="1" y2="1">' +
             '<stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#6d28d9"/>' +
             "</linearGradient></defs>");
    out.push('<circle cx="100" cy="100" r="78" fill="none" stroke="#eef1f6" stroke-width="13"/>');
    for (var i = 0; i < n; i++) {
      var a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + gap / 2;
      var a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - gap / 2;
      out.push('<path class="seg" data-seg="' + i + '" d="' + arcPath(cx, cy, r, a0, a1) +
               '" fill="none" stroke="#dde3ec" stroke-width="13" stroke-linecap="butt"/>');
    }
    out.push('<text x="100" y="96" text-anchor="middle" class="ring-loop">圈 ' + loop.id + "</text>");
    out.push('<text x="100" y="116" text-anchor="middle" class="ring-ratio">人 ' + loop.ratio.human +
             " · Agent " + loop.ratio.agent + "</text>");
    out.push("</svg>");
    return out.join("");
  }

  function heroHtml(loop) {
    return (
      '<div class="wrap">' +
        '<a class="back" href="../index.html">← 返回飞轮总览</a>' +
        '<span class="loop-tag l' + loop.id + '">圈 ' + loop.id + ' · 执行回放</span>' +
        '<h1>' + esc(shortName(loop)) + '</h1>' +
        '<p class="sub">' + esc(loop.subtitle) + '</p>' +
        '<div class="hero-ratio">' +
          '<span class="h">人工 ' + loop.ratio.human + '%</span>' +
          '<span class="a">Agent ' + loop.ratio.agent + '%</span>' +
        '</div>' +
      '</div>'
    );
  }

  function vizHtml(loop) {
    var traits = (loop.traits || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");
    return (
      ringHtml(loop) +
      '<div class="viz-ratio"><div class="ratio-bar">' +
        '<div class="h" style="width:' + loop.ratio.human + '%"></div>' +
        '<div class="a" style="width:' + loop.ratio.agent + '%"></div>' +
      '</div>' +
      '<div class="legend"><span><i style="background:#d9a05b"></i>人工 ' + loop.ratio.human + '%</span>' +
      '<span><i style="background:#6d28d9"></i>Agent ' + loop.ratio.agent + '%</span></div></div>' +
      '<ul class="traits">' + traits + '</ul>' +
      '<a class="product-link" href="../products/loop' + loop.id + '.html">→ 查看本圈交付的产品</a>'
    );
  }

  function mainHtml(loop) {
    var steps = loop.steps.map(stepHtml).join("");
    var sediments = loop.sediments.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("");
    return (
      '<div class="trigger"><div class="t-label">' + esc(loop.trigger.label) + '</div><pre>' + esc(loop.trigger.body) + '</pre></div>' +
      '<div class="controls">' +
        '<button class="btn" data-run>▶ 运行回放</button>' +
        '<button class="btn ghost" data-all>展开全部</button>' +
      '</div>' +
      '<ul class="steps">' + steps + '</ul>' +
      '<div class="sediments"><div class="s-title">本圈沉淀（进入下一圈的资产）</div><ul>' + sediments + '</ul></div>'
    );
  }

  function navHtml(loop) {
    var links = [];
    var prev = loop.id > 1 ? loop.id - 1 : null;
    var next = loop.id < maxLoopId() ? loop.id + 1 : null;
    if (prev) links.push('<a class="navlink" href="loop-' + prev + '.html">← 圈 ' + prev + '</a>');
    if (next) links.push('<a class="navlink" href="loop-' + next + '.html">圈 ' + next + ' →</a>');
    links.push('<a class="navlink" href="../products/loop' + loop.id + '.html">本圈产品</a>');
    links.push('<a class="navlink" href="../index.html#engineering">工程设计</a>');
    return links.join("");
  }

  function pnavHtml(loop) {
    var prev = findLoop(loop.id - 1);
    var next = findLoop(loop.id + 1);
    var left = prev
      ? '<a href="loop-' + prev.id + '.html">← 上一圈 · ' + esc(shortName(prev)) + '</a>'
      : '<span></span>';
    var right = next
      ? '<a href="loop-' + next.id + '.html">下一圈 · ' + esc(shortName(next)) + ' →</a>'
      : '<a href="../index.html#engineering">看支撑它的工程设计 →</a>';
    return left + right;
  }

  function bindLoop(card, loop) {
    var steps = card.querySelectorAll(".step");
    var segs = card.querySelectorAll(".seg");
    var runBtn = card.querySelector("[data-run]");
    var allBtn = card.querySelector("[data-all]");
    var timer = null;

    function lightSeg(i) {
      var color = ACTOR_COLOR[loop.steps[i].actor];
      segs[i].style.stroke = color === "MIX" ? "url(#gmix-" + loop.id + ")" : color;
      segs[i].classList.add("lit");
    }

    function showStep(i) {
      steps.forEach(function (s) { s.classList.remove("current"); });
      steps[i].classList.add("shown");
      steps[i].classList.add("current");
      lightSeg(i);
    }

    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      steps.forEach(function (s) { s.classList.remove("shown", "current"); });
      segs.forEach(function (sg) { sg.classList.remove("lit"); sg.style.stroke = ""; });
      runBtn.disabled = false;
      runBtn.textContent = "▶ 运行回放";
    }

    runBtn.addEventListener("click", function () {
      reset();
      runBtn.disabled = true;
      runBtn.textContent = "回放中…";
      var i = 0;
      timer = setInterval(function () {
        if (i >= steps.length) {
          clearInterval(timer); timer = null;
          runBtn.disabled = false;
          runBtn.textContent = "↻ 重新回放";
          return;
        }
        showStep(i);
        i++;
      }, 850);
    });

    allBtn.addEventListener("click", function () {
      reset();
      steps.forEach(function (s, i) { s.classList.add("shown"); lightSeg(i); });
      runBtn.textContent = "↻ 重新回放";
    });
  }

  /* 独立 loop 页：读 body[data-loop]，渲染页头 + 环形图 + 回放主体 + 导航 */
  function renderLoopPage() {
    var id = document.body.getAttribute("data-loop");
    var loop = findLoop(id);
    if (!loop) return;

    var hero = document.querySelector("[data-loop-hero]");
    if (hero) hero.innerHTML = heroHtml(loop);
    var viz = document.querySelector("[data-loop-viz]");
    if (viz) viz.innerHTML = vizHtml(loop);
    var main = document.querySelector("[data-loop-main]");
    if (main) main.innerHTML = mainHtml(loop);
    var nav = document.querySelector("[data-loop-nav]");
    if (nav) nav.innerHTML = navHtml(loop);
    var pnav = document.querySelector("[data-loop-pnav]");
    if (pnav) pnav.innerHTML = pnavHtml(loop);

    var split = document.querySelector(".loop-split");
    if (split) bindLoop(split, loop);
  }

  /* 门户：飞轮节点点击跳转对应圈的独立回放页 */
  function bindFlywheel() {
    document.querySelectorAll("[data-href]").forEach(function (el) {
      el.addEventListener("click", function () {
        window.location.href = el.getAttribute("data-href");
      });
    });
  }

  /* 右侧页码圆点：随滚动高亮当前页 */
  function bindDots() {
    var pages = document.querySelectorAll("[data-page]");
    var dots = document.querySelectorAll(".pagedots a[data-page]");
    if (!pages.length || !dots.length) return;
    var map = {};
    dots.forEach(function (d) { map[d.getAttribute("data-page")] = d; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          dots.forEach(function (d) { d.classList.remove("on"); });
          var d = map[e.target.getAttribute("data-page")];
          if (d) d.classList.add("on");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    pages.forEach(function (p) { io.observe(p); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.hasAttribute("data-loop")) {
      renderLoopPage();
    } else {
      bindFlywheel();
      bindDots();
    }
  });
})();
