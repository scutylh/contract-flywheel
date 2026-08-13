/* 开发自动化 —— 人机分工愿景（当前 / 未来，上下并列）+ 中台架构分层图 */
(function () {
  "use strict";

  var DIVISION_PLAY = {
    actions: ["需求结构化", "编码", "测试验证", "上线"],
    stages: [
      {
        label: "当前",
        humanPct: [70, 60, 50, 100],
        humanLabel: ["审核需求文档", "写关键逻辑", "逐条复核", "批准合并"],
        agentPct: [30, 40, 50, 0],
        agentLabel: ["需求文档解析", "生成代码框架", "回归集自动跑", "自动部署"]
      },
      {
        label: "未来 · 3-5 年",
        humanPct: [10, 0, 5, 20],
        humanLabel: ["确认需求", "（退出）", "抽检结果", "一键确认"],
        agentPct: [90, 100, 95, 80],
        agentLabel: ["需求自主提取", "全量编码", "全量回归", "自动上线"]
      }
    ]
  };

  /* ---- 中台架构：分层堆叠（自下而上，上层依赖下层） ---- */
  var ARCH = {
    layers: [
      { name: "底座层", color: "#f5f3ff", accent: "#6d28d9", items: ["Agent Runtime", "公共组件下沉", "数据接口标准化"] },
      { name: "能力层", color: "#f0fdf4", accent: "#15803d", items: ["Skill 复用", "编排调度"] },
      { name: "护栏层", color: "#fef9c3", accent: "#ca8a04", items: ["审核 + 门禁", "沙箱内测试", "评估 + 回归"] },
      { name: "工具层", color: "#eff6ff", accent: "#0369a1", items: ["嵌入工作流的工具", "版本管理 + 灰度发布"] }
    ]
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- 上下分工表：当前 + 未来，同时呈现 ---- */
  function renderDivisionPlay(container) {
    var D = DIVISION_PLAY;
    var cols = D.actions.length;
    var grid = "grid-template-columns:" + 112 + "px repeat(" + cols + ",1fr)";

    function matrixHtml(st) {
      var head = '<div class="dm-corner">分工</div>' + D.actions.map(function (a) {
        return '<div class="dm-h">' + esc(a) + '</div>';
      }).join("");
      function lane(kind) {
        var pcts = kind === "human" ? st.humanPct : st.agentPct;
        var labels = kind === "human" ? st.humanLabel : st.agentLabel;
        var cells = D.actions.map(function (_, j) {
          return '<div class="dm-cell' + (pcts[j] <= 0 ? ' empty' : '') + '">' +
            '<div class="dm-bar"><div class="dm-fill ' + kind + '" style="width:' + pcts[j] + '%"></div></div>' +
            '<div class="dm-label">' + esc(labels[j]) + '</div>' +
            '<div class="dm-pct">' + pcts[j] + '%</div>' +
          '</div>';
        }).join("");
        return '<div class="dm-row" style="' + grid + '">' +
          '<div class="dm-lane ' + kind + '">' + (kind === "human" ? "人类" : "Agent") + '</div>' +
          cells + '</div>';
      }
      return '<div class="dm">' +
        '<div class="dm-row" style="' + grid + '">' + head + '</div>' +
        lane("human") + lane("agent") + '</div>';
    }

    container.innerHTML =
      '<div class="division-stage"><div class="ds-label">' + esc(D.stages[0].label) + '</div>' + matrixHtml(D.stages[0]) + '</div>' +
      '<div class="division-stage"><div class="ds-label">' + esc(D.stages[1].label) + '</div>' + matrixHtml(D.stages[1]) + '</div>';
  }

  /* ---- 平台架构图：层名竖排，组件撑起边界（复刻二郎） ---- */
  function renderArch() {
    var box = document.getElementById("archBox");
    if (!box) return;
    box.innerHTML = ARCH.layers.slice().reverse().map(function (l) {
      return '<div class="arch-layer" style="--lb:' + l.color + ';--la:' + l.accent + '">' +
        '<div class="arch-label">' + esc(l.name) + '</div>' +
        '<div class="arch-items">' +
          l.items.map(function (it) { return '<span class="arch-item">' + esc(it) + '</span>'; }).join('') +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dp = document.querySelector("[data-division-play]");
    if (dp) renderDivisionPlay(dp);
    renderArch();
  });
})();