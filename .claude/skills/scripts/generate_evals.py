"""
Generate trigger-eval.json files for all skills using the Anthropic API.

Usage:
    python generate_evals.py [--skills-dir /path/to/skills] [--force]

Reads each skill's SKILL.md, uses Claude to generate 20 eval queries
(10 should-trigger, 10 should-not-trigger), writes trigger-eval.json
into each skill directory.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import anthropic

SKIP_DIRS = {
    "forge-docs-reference",
    "firecrawl-scraper",
    "forge-docs-reference-workspace",
    "firecrawl-scraper-workspace",
    "scripts",
}

SYSTEM_PROMPT = """You are a skill evaluation expert. Given a Claude Code skill's SKILL.md content, generate exactly 20 evaluation queries to test whether the skill triggers correctly.

Output a JSON array of objects with "query" and "should_trigger" fields.

IMPORTANT CONTEXT: These queries will be tested with `claude -p <query>` (a single-turn Claude Code invocation). Claude will only consult the skill if it believes the skill contains knowledge it LACKS. If Claude can handle the query from its training data alone, it will NOT trigger the skill regardless of the description quality.

Rules for should-trigger queries (exactly 10):
- Write queries that REQUIRE the skill's unique knowledge — procedures, project-specific rules, artifact formats, or checklists that Claude cannot know from training
- Reference the skill's specific artifacts by name when possible (e.g., "create a SPEC.md", "run the autoresearch loop")
- Include explicit invocations ("use X skill to...") and implicit need-based queries ("I need to ship this code following our workflow")
- AVOID queries about general knowledge Claude already has (e.g., "what are Dockerfile best practices" — Claude knows this without a skill)
- The best trigger queries describe a TASK the skill helps accomplish, not a QUESTION Claude can answer from memory

Rules for should-NOT-trigger queries (exactly 10):
- Write near-miss queries that share keywords or domain but need something different
- Include adjacent domains where a different skill/tool is more appropriate
- Avoid obviously unrelated queries (those don't test anything useful)
- Include queries that touch on the skill's domain but from a different angle

Output ONLY the JSON array, no other text."""


def get_skill_dirs(skills_dir: Path) -> list[Path]:
    """Find all skill directories with SKILL.md files."""
    dirs = []
    for d in sorted(skills_dir.iterdir()):
        if not d.is_dir() or d.name in SKIP_DIRS:
            continue
        skill_md = d / "SKILL.md"
        if skill_md.exists():
            dirs.append(d)
    return dirs


def generate_eval_queries(client: anthropic.Anthropic, skill_content: str, skill_name: str) -> list[dict]:
    """Use Claude to generate eval queries for a skill."""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Generate 20 trigger evaluation queries for this skill:\n\nSkill name: {skill_name}\n\n---\n{skill_content}\n---"
        }]
    )

    text = response.content[0].text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    return json.loads(text)


def main():
    parser = argparse.ArgumentParser(description="Generate trigger-eval.json for all skills")
    parser.add_argument("--skills-dir", type=Path, default=Path("/home/mjenkins/github/forge/.claude/skills"))
    parser.add_argument("--force", action="store_true", help="Overwrite existing trigger-eval.json files")
    args = parser.parse_args()

    client = anthropic.Anthropic()
    skill_dirs = get_skill_dirs(args.skills_dir)

    print(f"Found {len(skill_dirs)} skills to process")
    print(f"Skipping: {', '.join(sorted(SKIP_DIRS))}\n")

    for i, skill_dir in enumerate(skill_dirs, 1):
        eval_file = skill_dir / "trigger-eval.json"
        if eval_file.exists() and not args.force:
            print(f"[{i}/{len(skill_dirs)}] {skill_dir.name}: trigger-eval.json exists (skip, use --force to overwrite)")
            continue

        skill_md = (skill_dir / "SKILL.md").read_text()
        print(f"[{i}/{len(skill_dirs)}] {skill_dir.name}: generating eval queries...", end=" ", flush=True)

        try:
            queries = generate_eval_queries(client, skill_md, skill_dir.name)

            # Validate structure
            assert isinstance(queries, list), "Expected list"
            assert len(queries) == 20, f"Expected 20 queries, got {len(queries)}"
            for q in queries:
                assert "query" in q and "should_trigger" in q, f"Missing fields: {q.keys()}"

            with open(eval_file, "w") as f:
                json.dump(queries, f, indent=2)

            should = sum(1 for q in queries if q["should_trigger"])
            shouldnt = sum(1 for q in queries if not q["should_trigger"])
            print(f"OK ({should} trigger, {shouldnt} non-trigger)")

        except Exception as e:
            print(f"FAILED: {e}")
            continue

    print("\nDone! Run batch_eval.py next.")


if __name__ == "__main__":
    main()
