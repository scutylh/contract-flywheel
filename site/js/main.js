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
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
    var actor = step.actor;
    var body = step.lang === "diff"
      ? '<div class="step-body diff"><pre>' + renderDiff(step.body) + "</pre></div>"
      : '<div class="step-body"><pre>' + esc(step.body) + "</pre></div>";
    return (
      '<li class="step actor-' + actor + '">' +
        '<div class="step-head">' +
          '<span class="badge ' + actor + '">' + ACTOR_LABEL[actor] + "</span>" +
          '<span class="step-title">' + esc(step.title) + "</span>" +
          '<span class="kind-tag">' + (KIND_LABEL[step.kind] || step.kind) + "</span>" +
        "</div>" +
        body +
      "</li>"
    );
  }

  function loopHtml(loop) {
    var sediments = loop.sediments.map(function (s) {
      return "<li>" + esc(s) + "</li>";
    }).join("");
    var steps = loop.steps.map(stepHtml).join("");
    return (
      '<div class="loop-card">' +
        '<div class="loop-head">' +
          "<div><h3>" + esc(loop.name) + "</h3>" +
          '<div class="sub">' + esc(loop.subtitle) + " · 人机分工 人 " + loop.ratio.human + "% / Agent " + loop.ratio.agent + "%</div></div>" +
        "</div>" +
        '<div class="loop-body">' +
          '<div class="trigger"><div class="t-label">' + esc(loop.trigger.label) + "</div><pre>" + esc(loop.trigger.body) + "</pre></div>" +
          '<div class="controls">' +
            '<button class="btn" data-run>▶ 运行回放</button>' +
            '<button class="btn ghost" data-all>展开全部</button>' +
          "</div>" +
          '<ul class="steps">' + steps + "</ul>" +
          '<div class="sediments"><div class="s-title">本圈沉淀（进入下一圈的资产）</div><ul>' + sediments + "</ul></div>" +
        "</div>" +
      "</div>"
    );
  }

  function bindLoop(card) {
    var steps = card.querySelectorAll(".step");
    var runBtn = card.querySelector("[data-run]");
    var allBtn = card.querySelector("[data-all]");
    var timer = null;

    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      steps.forEach(function (s) { s.classList.remove("shown"); });
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
        steps[i].classList.add("shown");
        i++;
      }, 850);
    });
    allBtn.addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; }
      steps.forEach(function (s) { s.classList.add("shown"); });
      runBtn.disabled = false;
      runBtn.textContent = "↻ 重新回放";
    });
  }

  function renderLoops() {
    if (!window.TRACES) return;
    window.TRACES.forEach(function (loop) {
      var host = document.getElementById("loop-" + loop.id);
      if (!host) return;
      host.innerHTML = loopHtml(loop);
      bindLoop(host);
    });
  }

  /* 飞轮总览：比例条与节点点击跳转 */
  function bindFlywheel() {
    document.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function () {
        var target = document.getElementById(el.getAttribute("data-goto"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderLoops();
    bindFlywheel();
  });
})();
