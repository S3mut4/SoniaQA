# SoniaQA

A QA working method packaged for [Claude Code](https://code.claude.com/docs/en/overview): a skill, an exploration agent, a slash command and a Playwright + TypeScript workspace.

SoniaQA makes the AI work like a careful QA engineer: find the spec first, explore before writing code, give every expected result a source, report only bugs it actually reproduced, and never make a test pass by weakening it.

Built by Daniel during the QA Automation course at Tallinn Learning, on top of more than 20 years as a database administrator.

## Why

AI agents are fast at writing tests and at producing reports that *look* complete. SoniaQA is about the other part: results you can trust.

- **Spec first.** Every check is tagged `Spec`, `Obs` (observed) or `Assum` (assumption). A failure against an assumption is a recommendation, not a bug.
- **Evidence over claims.** A bug lists the steps actually run and the result actually observed. Anything not verified reliably is `Unconfirmed`, with what is missing to confirm it.
- **A human approves the plan.** No test code before the checklist is reviewed.
- **Standard STD-001 "Measure, don't game".** Green CI and test counts are signals, not goals. Known bugs use `test.fail` with a bug ID; agents stop and report instead of taking shortcuts.

## What is inside

| Path | What |
| --- | --- |
| `.claude/skills/soniaqa/SKILL.md` | The method: workflow, QA rules, templates, automation rules, references and STD-001 |
| `.claude/agents/soniaqa-explorer.md` | Agent that explores a web app with Playwright MCP and writes a report |
| `.claude/commands/soniaqa-explore.md` | `/soniaqa-explore <url> [scope]` |
| `.mcp.json` | Playwright MCP, pinned version |
| `config/env-data.ts`, `env/dev.env.example` | Environment loading: fails fast on a missing variable |
| `soniaqa-reports/` | Exploration reports |
| `tests/` | Playwright tests, written after review |
| `docs/EVALUATION.md` | How the method was measured: A/B runs, scores and cost |

## How it works

1. `/soniaqa-explore https://your-app.example.com` runs the `soniaqa-explorer` agent. It reads the spec, explores the app with Playwright MCP and writes a report: sources, features ranked by risk, a checklist per screen, test cases, bugs with evidence, `Unconfirmed` items, test ids and open questions.
2. You review the report and answer the open questions.
3. You ask Claude to write tests from the report. The skill gives it the structure: page objects, fixtures, `scenario > expected` test names, test ids, retrying assertions, and `test.fail("BUG-XX")` for known bugs.
4. You run and review the tests yourself before committing.

## Setup

```
npm install
npx playwright install chromium
cp env/dev.env.example env/dev.env
claude
```

Edit `BASE_URL` in `env/dev.env`. In Claude Code, approve the `playwright` MCP server for this project, then run `/soniaqa-explore <url>`.

To use SoniaQA in another project, copy `.claude/skills/`, `.claude/agents/` and `.claude/commands/` into that project's `.claude/` (or into `~/.claude/` for all projects).

## Results

Measured on a TodoMVC-style training app (details in [docs/EVALUATION.md](docs/EVALUATION.md)):

| | Without SoniaQA | With SoniaQA |
| --- | --- | --- |
| Exploration score (16-point rubric) | 9 | 16 |
| Cost per exploration | $0.60 | $1.30-1.55 |
| Report | in the chat | full report file, 5-line summary in the chat |

From the report, Claude wrote 15 Playwright tests (7 checks of working behaviour, 8 `test.fail` linked to bug IDs) for under $2, after two review rounds.

## Scripts

| Script | What |
| --- | --- |
| `npm test` | Run the tests |
| `npm run typecheck` | TypeScript check |
| `npm run prettier:check` | Formatting check |
| `npm run prettier:format` | Format the code |
