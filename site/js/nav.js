/* 公共底部导航 —— 5 个平级页面，当前页高亮
 * 页面约定：<body data-nav="home|erlang|automation|mindmap|gantt" data-base="相对根前缀">
 * 容器：<nav class="site-nav" data-navbar></nav> */
(function () {
  "use strict";

  var NAV = [
    { id: "home",       label: "首页",         href: "index.html" },
    { id: "erlang",     label: "二郎 · 需求澄清工具", href: "erlang/index.html" },
    { id: "automation", label: "鲁班 · Agentic 开发", href: "automation/index.html" },
    { id: "mindmap",    label: "思维导图",     href: "mindmap/index.html" },
    { id: "gantt",      label: "甘特图",       href: "gantt/index.html" }
  ];

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  document.addEventListener("DOMContentLoaded", function () {
    var el = document.querySelector("[data-navbar]");
    if (!el) return;
    var cur = document.body.getAttribute("data-nav") || "";
    var base = (document.body.getAttribute("data-base") || "").replace(/\/+$/, "");
    var pre = base ? base + "/" : "";
    el.innerHTML = '<div class="wrap">' + NAV.map(function (n) {
      var on = n.id === cur;
      var attr = on ? ' class="on" aria-current="page"' : ' href="' + pre + n.href + '"';
      return '<a' + attr + '><span class="bar"></span>' + esc(n.label) + '</a>';
    }).join("") + '</div>';
  });
})();
