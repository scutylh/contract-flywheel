"""contract-flywheel mini-harness — v0.1

当前版本：校验 traces/loopN.json 的结构完整性（手工 fixture 与未来真实跑出的 trace 同构）。
后续版本：fixture 驱动流水线真实跑出 trace，覆写 traces/*.json。

用法：
    python harness/main.py            # 校验全部 trace
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACES_DIR = ROOT / "traces"

LOOP_REQUIRED = {"id", "name", "subtitle", "ratio", "trigger", "steps", "sediments"}
STEP_REQUIRED = {"actor", "kind", "title", "body"}
ACTORS = {"agent", "human", "mixed", "reviewer", "system"}
KINDS = {"extract", "issue", "clarify", "confirm", "input", "retrieve", "code", "review", "approve", "deploy"}


def validate_loop(data: dict, path: Path) -> list[str]:
    errors: list[str] = []
    missing = LOOP_REQUIRED - data.keys()
    if missing:
        errors.append(f"{path.name}: 缺少字段 {missing}")
        return errors

    ratio = data["ratio"]
    if ratio.get("human", 0) + ratio.get("agent", 0) != 100:
        errors.append(f"{path.name}: ratio 之和应为 100，实际 {ratio}")

    for i, step in enumerate(data["steps"]):
        miss = STEP_REQUIRED - step.keys()
        if miss:
            errors.append(f"{path.name} step[{i}]: 缺少字段 {miss}")
            continue
        if step["actor"] not in ACTORS:
            errors.append(f"{path.name} step[{i}]: 未知 actor {step['actor']!r}")
        if step["kind"] not in KINDS:
            errors.append(f"{path.name} step[{i}]: 未知 kind {step['kind']!r}")
        if step["kind"] == "code" and step.get("lang") != "diff":
            errors.append(f"{path.name} step[{i}]: code 步骤建议 lang='diff'")

    if not data["sediments"]:
        errors.append(f"{path.name}: sediments 为空——每圈必须有沉淀物，否则飞轮不成立")
    return errors


def main() -> int:
    files = sorted(TRACES_DIR.glob("loop*.json"))
    if not files:
        print("未找到 traces/loopN.json")
        return 1

    all_errors: list[str] = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        errors = validate_loop(data, f)
        all_errors.extend(errors)
        status = "FAIL" if errors else "OK"
        print(f"[{status}] {f.name}: {data.get('name', '?')} · {len(data.get('steps', []))} 步 · 沉淀 {len(data.get('sediments', []))} 项")

    if all_errors:
        print("\n".join(all_errors))
        return 1
    print("\n全部 trace 校验通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
