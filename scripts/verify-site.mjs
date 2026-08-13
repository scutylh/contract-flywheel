// 站点完整性校验：纯 Node 内置模块，无浏览器 / 第三方依赖。
// 用法：node scripts/verify-site.mjs
// 覆盖：JS 语法 / 5 个平级页面与 data-nav / 站内链接与锚点可达。
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");

const PAGES = [
  { file: "index.html",            nav: "home" },
  { file: "erlang/index.html",     nav: "erlang" },
  { file: "automation/index.html", nav: "automation" },
  { file: "mindmap/index.html",    nav: "mindmap" },
  { file: "gantt/index.html",      nav: "gantt" },
];
const JS_FILES = ["js/nav.js", "erlang/app.js", "erlang/data.js", "automation/app.js"];

let failures = 0;
const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) failures++; };

// 1) JS 语法
for (const f of JS_FILES) {
  const r = spawnSync(process.execPath, ["--check", join(site, f)], { encoding: "utf8" });
  check(r.status === 0, f + " 语法通过" + (r.status === 0 ? "" : " → " + r.stderr.trim().split("\n")[0]));
}

// 2) 页面齐全 + data-nav 正确
const anchorRe = /(?:id|name)="([^"]+)"/g;
const anchors = (html) => { const s = new Set(); let m; while ((m = anchorRe.exec(html))) s.add(m[1]); return s; };
const cache = new Map();
const getHtml = (p) => { if (!cache.has(p)) cache.set(p, existsSync(p) ? readFileSync(p, "utf8") : null); return cache.get(p); };

PAGES.forEach((c) => {
  const p = join(site, c.file);
  const html = existsSync(p) ? readFileSync(p, "utf8") : "";
  check(existsSync(p), c.file + " 存在");
  check(html.includes(`data-nav="${c.nav}"`), c.file + ` data-nav=${c.nav} 正确`);
});

// 3) 站内链接 / 引用可达（含锚点）
for (const c of PAGES) {
  const p = join(site, c.file);
  const html = getHtml(p);
  const refRe = /(?:href|src)="([^"]+)"/g;
  let m, bad = 0;
  while ((m = refRe.exec(html))) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(v)) continue;
    const [pathPart, anchor] = v.split("#");
    if (!pathPart) {
      if (anchor && !anchors(html).has(anchor)) { console.log(`    ✗ ${c.file} 锚点 #${anchor} 不存在`); bad++; }
      continue;
    }
    const target = resolve(dirname(p), pathPart);
    if (!existsSync(target)) { console.log(`    ✗ ${c.file} 引用不存在 → ${v}`); bad++; continue; }
    if (anchor && target.endsWith(".html")) {
      const tHtml = getHtml(target);
      if (tHtml && !anchors(tHtml).has(anchor)) { console.log(`    ✗ ${c.file} → ${v} 锚点 #${anchor} 不存在`); bad++; }
    }
  }
  check(bad === 0, c.file + " 站内引用/锚点全部可达");
}

console.log("\n" + (failures === 0 ? "全部通过 ✓" : failures + " 项失败 ✗"));
process.exit(failures === 0 ? 0 : 1);
