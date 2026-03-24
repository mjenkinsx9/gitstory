#!/usr/bin/env python3
"""Run routing evaluation for skills using their REAL skill names.

Unlike run_eval.py from skill-creator (which creates temp command copies),
this script checks whether `claude -p` triggers the actual skill by name.

The key fix: instead of creating a temp command and checking if Claude
triggers THAT, we check if Claude calls `Skill` with the real skill name.
"""

import argparse
import json
import os
import select
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path


def find_project_root() -> Path:
    """Find the project root by walking up from cwd looking for .claude/."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def run_single_query(
    query: str,
    skill_name: str,
    timeout: int,
    project_root: str,
) -> bool:
    """Run a single query and return whether the real skill was triggered.

    Uses subprocess.run to capture ALL output, then searches for evidence
    that Claude called the Skill tool with the skill name. This avoids
    stream parsing bugs that plague the Popen approach.
    """
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    cmd = [
        "claude",
        "-p", query,
        "--output-format", "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--max-turns", "1",
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=project_root,
            env=env,
            timeout=timeout,
        )
        output = result.stdout
    except subprocess.TimeoutExpired:
        return False
    except Exception:
        return False

    # Parse each line of the stream-json output
    for line in output.split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        # Check full assistant messages for Skill tool calls
        if event.get("type") == "assistant":
            message = event.get("message", {})
            for content_item in message.get("content", []):
                if content_item.get("type") != "tool_use":
                    continue
                tool_name = content_item.get("name", "")
                tool_input = content_item.get("input", {})
                if tool_name == "Skill":
                    skill_val = tool_input.get("skill", "")
                    if skill_name in skill_val:
                        return True
                elif tool_name == "Read":
                    file_path = tool_input.get("file_path", "")
                    if skill_name in file_path and "SKILL.md" in file_path:
                        return True

    # Fallback: simple text search for the skill name in Skill tool context
    # This catches stream events where the full assistant message isn't emitted
    if f'"skill": "{skill_name}"' in output or f'"skill":"{skill_name}"' in output:
        return True

    return False


def main():
    parser = argparse.ArgumentParser(description="Run routing eval for a skill using real skill names")
    parser.add_argument("--skill-name", required=True, help="Real skill name (e.g., dockerfile-lint)")
    parser.add_argument("--eval-set", required=True, help="Path to trigger-eval.json")
    parser.add_argument("--num-workers", type=int, default=5, help="Parallel workers")
    parser.add_argument("--timeout", type=int, default=60, help="Timeout per query in seconds")
    parser.add_argument("--runs-per-query", type=int, default=1, help="Number of runs per query for stability")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    eval_set = json.loads(Path(args.eval_set).read_text())
    project_root = str(find_project_root())

    if args.verbose:
        print(f"Evaluating skill: {args.skill_name}", file=sys.stderr)
        print(f"Project root: {project_root}", file=sys.stderr)
        print(f"Eval queries: {len(eval_set)}", file=sys.stderr)

    results = []

    # Track results per query across multiple runs
    query_results: dict[str, list[bool]] = {}

    runs_per_query = args.runs_per_query or 1
    total_runs = len(eval_set) * runs_per_query

    if args.verbose:
        print(f"Running {runs_per_query} runs per query ({total_runs} total executions)", file=sys.stderr)

    with ProcessPoolExecutor(max_workers=args.num_workers) as executor:
        future_to_item = {}
        # Submit all runs for all queries
        for item in eval_set:
            for run_idx in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    args.skill_name,
                    args.timeout,
                    project_root,
                )
                future_to_item[future] = (item, run_idx)

        # Collect results
        for future in as_completed(future_to_item):
            item, run_idx = future_to_item[future]
            query = item["query"]
            try:
                triggered = future.result()
            except Exception as e:
                print(f"Warning: query failed: {e}", file=sys.stderr)
                triggered = False

            if query not in query_results:
                query_results[query] = []
            query_results[query].append(triggered)

    # Aggregate results per query
    for query, triggers in query_results.items():
        # Find the original item
        item = next(e for e in eval_set if e["query"] == query)
        should_trigger = item["should_trigger"]

        # Calculate trigger rate
        trigger_rate = sum(triggers) / len(triggers) if triggers else 0
        passed = (trigger_rate >= 0.5) == should_trigger

        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "trigger_rate": trigger_rate,
            "triggers": sum(triggers),
            "runs": len(triggers),
            "pass": passed,
        })

        if args.verbose:
            status = "PASS" if passed else "FAIL"
            print(f"  [{status}] triggered={triggered} expected={should_trigger}: {item['query'][:70]}", file=sys.stderr)

    # Summary
    total = len(results)
    passed = sum(1 for r in results if r["pass"])
    should_trigger = [r for r in results if r["should_trigger"]]
    should_not = [r for r in results if not r["should_trigger"]]
    tp = sum(1 for r in should_trigger if r["triggered"])
    fn = sum(1 for r in should_trigger if not r["triggered"])
    fp = sum(1 for r in should_not if r["triggered"])
    tn = sum(1 for r in should_not if not r["triggered"])

    accuracy = passed / total if total else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    output = {
        "skill_name": args.skill_name,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "accuracy": round(accuracy * 100, 1),
            "precision": round(precision * 100, 1),
            "recall": round(recall * 100, 1),
            "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        },
    }

    if args.verbose:
        print(f"\nAccuracy: {accuracy:.0%} ({passed}/{total})", file=sys.stderr)
        print(f"Precision: {precision:.0%}, Recall: {recall:.0%}", file=sys.stderr)
        print(f"TP={tp} FP={fp} TN={tn} FN={fn}", file=sys.stderr)

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
