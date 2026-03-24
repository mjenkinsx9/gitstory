"""
Run baseline trigger evaluation for all skills that have trigger-eval.json.

Usage:
    python batch_eval.py [--skills-dir /path/to/skills] [--results-dir /path/to/results]

Uses run_eval.py from the skill-creator plugin to test each skill's
current description against its eval queries. Produces scorecard.json.
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SKIP_DIRS = {
    "forge-docs-reference",
    "firecrawl-scraper",
    "forge-docs-reference-workspace",
    "firecrawl-scraper-workspace",
    "scripts",
}

SKILL_CREATOR_SCRIPTS = Path(
    os.path.expanduser("~/.claude/plugins/marketplaces/claude-plugins-official/"
                       "plugins/skill-creator/skills/skill-creator/scripts")
)


def parse_skill_md(skill_dir: Path) -> dict:
    """Extract name and description from SKILL.md frontmatter."""
    content = (skill_dir / "SKILL.md").read_text()
    in_frontmatter = False
    name = skill_dir.name
    desc_lines = []
    reading_desc = False

    for line in content.split("\n"):
        if line.strip() == "---":
            if in_frontmatter:
                break
            in_frontmatter = True
            continue
        if in_frontmatter:
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("description:"):
                rest = line.split(":", 1)[1].strip()
                if rest and rest != ">":
                    desc_lines.append(rest)
                reading_desc = True
            elif reading_desc:
                stripped = line.strip()
                if stripped and not any(stripped.startswith(k) for k in ["name:", "---"]):
                    desc_lines.append(stripped)
                else:
                    reading_desc = False

    description = " ".join(desc_lines)
    return {"name": name, "description": description}


def run_skill_check(skill_dir: Path, check_file: Path) -> dict:
    """Run run_eval.py for a single skill and return results."""
    env = os.environ.copy()
    env.pop("CLAUDECODE", None)

    cmd = [
        sys.executable, "-m", "scripts.run_eval",
        "--eval-set", str(check_file),
        "--skill-path", str(skill_dir),
        "--runs-per-query", "1",
        "--num-workers", "5",
        "--timeout", "30",
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(SKILL_CREATOR_SCRIPTS.parent),
        env=env,
        timeout=300,
    )

    if result.returncode != 0:
        return {"error": result.stderr[:500]}

    try:
        output = result.stdout.strip()
        return json.loads(output)
    except (json.JSONDecodeError, ValueError) as e:
        return {"error": f"Parse error: {e}\nStdout: {result.stdout[:300]}"}


def main():
    parser = argparse.ArgumentParser(description="Batch baseline check for all skills")
    parser.add_argument("--skills-dir", type=Path, default=Path("/home/mjenkins/github/forge/.claude/skills"))
    parser.add_argument("--results-dir", type=Path, default=None)
    args = parser.parse_args()

    if args.results_dir is None:
        args.results_dir = args.skills_dir / "scripts" / "results"
    args.results_dir.mkdir(parents=True, exist_ok=True)

    skills = []
    for d in sorted(args.skills_dir.iterdir()):
        if not d.is_dir() or d.name in SKIP_DIRS:
            continue
        check_file = d / "trigger-eval.json"
        if check_file.exists() and (d / "SKILL.md").exists():
            skills.append((d, check_file))

    print(f"Found {len(skills)} skills with trigger-eval.json")
    print(f"Results will be saved to: {args.results_dir}\n")

    scorecard = {
        "timestamp": datetime.now().isoformat(),
        "total_skills": len(skills),
        "results": []
    }

    for i, (skill_dir, check_file) in enumerate(skills, 1):
        meta = parse_skill_md(skill_dir)
        print(f"[{i}/{len(skills)}] {skill_dir.name}...", end=" ", flush=True)

        result = run_skill_check(skill_dir, check_file)

        if "error" in result:
            print(f"ERROR: {result['error'][:100]}")
            scorecard["results"].append({
                "skill": skill_dir.name,
                "name": meta["name"],
                "error": result["error"],
            })
            continue

        queries = result.get("results", result.get("queries", []))
        should_trigger = [q for q in queries if q.get("should_trigger", False)]
        should_not = [q for q in queries if not q.get("should_trigger", False)]

        trigger_pass = sum(1 for q in should_trigger if q.get("pass", False))
        not_trigger_pass = sum(1 for q in should_not if q.get("pass", False))

        trigger_rate = trigger_pass / len(should_trigger) if should_trigger else 0
        specificity = not_trigger_pass / len(should_not) if should_not else 0

        entry = {
            "skill": skill_dir.name,
            "name": meta["name"],
            "description_length": len(meta["description"]),
            "should_trigger_passed": trigger_pass,
            "should_trigger_total": len(should_trigger),
            "trigger_rate": round(trigger_rate, 3),
            "should_not_trigger_passed": not_trigger_pass,
            "should_not_trigger_total": len(should_not),
            "specificity": round(specificity, 3),
            "overall_score": f"{trigger_pass + not_trigger_pass}/{len(queries)}",
        }
        scorecard["results"].append(entry)

        print(f"trigger={trigger_pass}/{len(should_trigger)} ({trigger_rate:.0%}), "
              f"specificity={not_trigger_pass}/{len(should_not)} ({specificity:.0%})")

    scorecard_file = args.results_dir / "scorecard.json"
    with open(scorecard_file, "w") as f:
        json.dump(scorecard, f, indent=2)

    print(f"\nScorecard saved to: {scorecard_file}")
    print("Run scorecard.py to see ranked results.")


if __name__ == "__main__":
    main()
