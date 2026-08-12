// 将 traces/*.json 打包为 site/js/traces.js（window.TRACES）
// 用法：node scripts/build-traces.mjs
// 说明：纯静态站不做运行时 fetch（兼容 file:// 直开），轨迹数据在构建期注入。
//       harness 真实跑出的 trace 覆写 traces/*.json 后，重跑本脚本即可。
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tracesDir = join(root, "traces");

const loops = readdirSync(tracesDir)
  .filter((f) => /^loop\d+\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(tracesDir, f), "utf-8")))
  .sort((a, b) => a.id - b.id);

const out = "// 本文件由 scripts/build-traces.mjs 生成，请勿手改；数据源在 traces/*.json\n" +
  "window.TRACES = " + JSON.stringify(loops, null, 2) + ";\n";

writeFileSync(join(root, "site", "js", "traces.js"), out, "utf-8");
console.log(`bundled ${loops.length} loops -> site/js/traces.js`);
