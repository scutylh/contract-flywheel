// 站点完整性校验：纯 Node 内置模块，无浏览器 / 第三方依赖。
// 用法：node scripts/verify-site.mjs
// 覆盖：JS 语法 / traces.js 与 traces/*.json 同步 / 轨迹结构 / loop 页齐全 / 站内链接与锚点可达 / 无残留旧锚点。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const htmlFiles = [
  "index.html",
  "loops/loop-1.html", "loops/loop-2.html", "loops/loop-3.html",
  "products/loop1.html", "products/loop2.html", "products/loop3.html",
];

let failures = 0;
const check = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) failures++; };

// 1) JS 语法
for (const f of ["js/main.js", "js/traces.js"]) {
  const r = spawnSync(process.execPath, ["--check", join(site, f)], { encoding: "utf8" });
  check(r.status === 0, f + " 语法通过" + (r.status === 0 ? "" : " → " + r.stderr.trim().split("\n")[0]));
}

// 2) traces.js 与 traces/*.json 同步（与 build-traces.mjs 输出逐字一致）
const tracesDir = join(root, "traces");
const jsons = readdirSync(tracesDir).filter(f => /^loop\d+\.json$/.test(f)).sort();
const loops = jsons.map(f => JSON.parse(readFileSync(join(tracesDir, f), "utf8"))).sort((a, b) => a.id - b.id);
const expected = "// 本文件由 scripts/build-traces.mjs 生成，请勿手改；数据源在 traces/*.json\n" +
  "window.TRACES = " + JSON.stringify(loops, null, 2) + ";\n";
check(readFileSync(join(site, "js/traces.js"), "utf8") === expected, "traces.js 与 traces/*.json 同步");

// 3) 轨迹数据结构
check(loops.length === 3, "共 3 圈轨迹（实际 " + loops.length + "）");
for (const l of loops) {
  const ok = l.id && l.name && l.subtitle && l.trigger && l.trigger.body &&
    l.ratio && (l.ratio.human + l.ratio.agent === 100) &&
    Array.isArray(l.steps) && l.steps.length > 0 && l.steps.every(s => s.actor && s.title && s.body) &&
    Array.isArray(l.sediments) && l.sediments.length > 0;
  check(ok, `圈 ${l.id} 结构完整 · ${l.steps.length} 步 · 人${l.ratio.human}/AI${l.ratio.agent}`);
}

// 4) loop 页齐全 + 正确挂载
for (let id = 1; id <= 3; id++) {
  const p = join(site, "loops", `loop-${id}.html`);
  const html = existsSync(p) ? readFileSync(p, "utf8") : "";
  check(existsSync(p), `loops/loop-${id}.html 存在`);
  check(html.includes(`data-loop="${id}"`), `loop-${id} 页 body 带 data-loop=${id}`);
  check(html.includes('src="../js/traces.js"') && html.includes('src="../js/main.js"'), `loop-${id} 引入 traces.js + main.js`);
}

// 5) 站内链接 / 引用可达（含锚点）
const anchorRe = /(?:id|name)="([^"]+)"/g;
const anchors = html => { const s = new Set(); let m; while ((m = anchorRe.exec(html))) s.add(m[1]); return s; };
const cache = new Map();
const getHtml = p => { if (!cache.has(p)) cache.set(p, existsSync(p) ? readFileSync(p, "utf8") : null); return cache.get(p); };

for (const f of htmlFiles) {
  const p = join(site, f);
  const html = getHtml(p);
  const refRe = /(?:href|src)="([^"]+)"/g;
  let m, bad = 0;
  while ((m = refRe.exec(html))) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(v)) continue;
    const [pathPart, anchor] = v.split("#");
    if (!pathPart) { // 同页锚点
      if (anchor && !anchors(html).has(anchor)) { console.log(`    ✗ ${f} 锚点 #${anchor} 不存在`); bad++; }
      continue;
    }
    const target = resolve(dirname(p), pathPart);
    if (!existsSync(target)) { console.log(`    ✗ ${f} 引用不存在 → ${v}`); bad++; continue; }
    if (anchor && target.endsWith(".html")) {
      const tHtml = getHtml(target);
      if (tHtml && !anchors(tHtml).has(anchor)) { console.log(`    ✗ ${f} → ${v} 锚点 #${anchor} 不存在`); bad++; }
    }
  }
  check(bad === 0, `${f} 站内引用/锚点全部可达`);
}

// 6) 无残留旧锚点（重构前单页内的 #loop-N / data-goto）
const idxHtml = getHtml(join(site, "index.html"));
check(!/data-goto/.test(idxHtml), "index.html 无残留 data-goto");
check(!/id="loop-\d"/.test(idxHtml) && !/id="page-loop-/.test(idxHtml), "index.html 无内嵌 loop 宿主");

console.log("\n" + (failures === 0 ? "全部通过 ✓" : failures + " 项失败 ✗"));
process.exit(failures === 0 ? 0 : 1);
