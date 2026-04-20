"""CLI orchestrator: runs Research -> Strategy -> Creative and writes a report.

Usage:
    python main.py examples/sample_business.json
    python main.py examples/sample_business.json --output output/kairaa.md
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from app.agents.creative import run_creative_agent
from app.agents.research import run_research_agent
from app.agents.strategy import run_strategy_agent
from app.config import config
from app.report import render_markdown
from app.schemas import BusinessInput, FullReport

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

console = Console(legacy_windows=False)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate an ad strategy + creatives for a small business."
    )
    parser.add_argument(
        "input_file",
        type=Path,
        help="Path to a JSON file with BusinessInput fields (see examples/).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Where to write the markdown report. Defaults to output/<business>.md",
    )
    parser.add_argument(
        "--quiet", action="store_true", help="Suppress per-iteration agent logs"
    )
    args = parser.parse_args()

    try:
        config.validate()
    except RuntimeError as e:
        console.print(f"[red]Config error:[/red] {e}")
        return 1

    if not args.input_file.exists():
        console.print(f"[red]Input file not found:[/red] {args.input_file}")
        return 1

    business = BusinessInput(**json.loads(args.input_file.read_text(encoding="utf-8")))
    output_path = args.output or Path("output") / f"{_slug(business.business_name)}.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    verbose = not args.quiet

    console.print(Panel.fit(
        f"[bold]{business.business_name}[/bold]\n"
        f"Industry: {business.industry}\n"
        f"Budget: ₹{business.monthly_ad_budget_inr:,}/month\n"
        f"Goal: {business.primary_goal}",
        title="Business brief",
    ))

    console.print("\n[cyan][1/3] Running Research Agent...[/cyan]")
    research = run_research_agent(business, verbose=verbose)
    console.print(
        f"[green]OK[/green] — analyzed {len(research.competitors_analyzed)} competitors, "
        f"{len(research.sample_ads)} sample ads, {len(research.gaps_and_opportunities)} opportunities."
    )

    console.print("\n[cyan][2/3] Running Strategy Agent...[/cyan]")
    strategy = run_strategy_agent(business, research, verbose=verbose)
    console.print(
        f"[green]OK[/green] — {len(strategy.audience_segments)} audience segments, "
        f"{len(strategy.budget_allocation)} platforms, {len(strategy.first_30_days_plan)}-step plan."
    )

    console.print("\n[cyan][3/3] Running Creative Agent...[/cyan]")
    creatives = run_creative_agent(business, strategy, verbose=verbose)
    console.print(f"[green]OK[/green] — {len(creatives.variants)} ad variants generated.")

    report = FullReport(
        business=business,
        research=research,
        strategy=strategy,
        creatives=creatives,
    )
    output_path.write_text(render_markdown(report), encoding="utf-8")

    json_path = output_path.with_suffix(".json")
    json_path.write_text(report.model_dump_json(indent=2), encoding="utf-8")

    console.print(f"\n[bold green]Done.[/bold green]")
    console.print(f"  Report: [bold]{output_path}[/bold]")
    console.print(f"  JSON:   [bold]{json_path}[/bold]")
    return 0


def _slug(name: str) -> str:
    return "".join(c.lower() if c.isalnum() else "_" for c in name).strip("_")


if __name__ == "__main__":
    sys.exit(main())
