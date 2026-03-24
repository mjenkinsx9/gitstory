"""
Display skill evaluation scorecard as a ranked table.

Usage:
    python scorecard.py [--results-dir /path/to/results]
"""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Display skill scorecard")
    parser.add_argument("--results-dir", type=Path,
                        default=Path("/home/mjenkins/github/forge/.claude/skills/scripts/results"))
    args = parser.parse_args()

    scorecard_file = args.results_dir / "scorecard.json"
    if not scorecard_file.exists():
        print(f"No scorecard found at {scorecard_file}")
        print("Run batch_eval.py first.")
        return

    with open(scorecard_file) as f:
        scorecard = json.load(f)

    results = scorecard["results"]
    # Sort by trigger_rate descending, then specificity descending
    scored = [r for r in results if "error" not in r]
    errored = [r for r in results if "error" in r]

    scored.sort(key=lambda r: (r["trigger_rate"], r["specificity"]), reverse=True)

    print(f"\n{'='*90}")
    print(f"  SKILL TRIGGER SCORECARD  ({scorecard['timestamp'][:10]})")
    print(f"  {scorecard['total_skills']} skills evaluated")
    print(f"{'='*90}\n")

    # Header
    print(f"  {'Skill':<30} {'Trigger':>10} {'Specific':>10} {'Overall':>10} {'Desc Len':>10}")
    print(f"  {'-'*30} {'-'*10} {'-'*10} {'-'*10} {'-'*10}")

    for r in scored:
        trigger_str = f"{r['should_trigger_passed']}/{r['should_trigger_total']}"
        spec_str = f"{r['should_not_trigger_passed']}/{r['should_not_trigger_total']}"
        trigger_pct = f"({r['trigger_rate']:.0%})"
        spec_pct = f"({r['specificity']:.0%})"

        # Highlight skills with >20% trigger rate
        marker = " *" if r["trigger_rate"] > 0.2 else "  "

        print(f"{marker}{r['skill']:<30} {trigger_str:>5} {trigger_pct:>5} "
              f"{spec_str:>5} {spec_pct:>5} {r['overall_score']:>10} {r['description_length']:>10}")

    if errored:
        print(f"\n  ERRORS ({len(errored)}):")
        for r in errored:
            print(f"    {r['skill']}: {r['error'][:80]}")

    # Summary
    avg_trigger = sum(r["trigger_rate"] for r in scored) / len(scored) if scored else 0
    avg_spec = sum(r["specificity"] for r in scored) / len(scored) if scored else 0
    optimize_candidates = [r for r in scored if r["trigger_rate"] > 0.2]

    print(f"\n{'='*90}")
    print(f"  Average trigger rate: {avg_trigger:.1%}")
    print(f"  Average specificity:  {avg_spec:.1%}")
    print(f"  Optimization candidates (>20% trigger): {len(optimize_candidates)}")
    if optimize_candidates:
        print(f"  -> {', '.join(r['skill'] for r in optimize_candidates)}")
    print(f"{'='*90}\n")


if __name__ == "__main__":
    main()
