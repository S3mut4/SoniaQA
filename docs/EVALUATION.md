# Evaluation

How SoniaQA was measured before calling it v1. STD-001.4 applies to this document too: each number says what it stands for and what it misses.

## Setup

- **Target:** a TodoMVC-style training web app (single page, no backend), with the [TodoMVC app spec](https://github.com/tastejs/todomvc/blob/master/app-spec.md) as the requirement source.
- **Task:** "explore the app, rank the top 10 features to automate, write a checklist and report possible bugs. Regular user actions only, no security testing."
- **Tooling:** Claude Code with Claude Opus (one run with Sonnet), Playwright MCP, Chrome.
- **Ground truth:** every bug claimed by a run was checked by hand in a separate browser.

## Rubric

8 criteria, 0-2 points each, 16 in total. They cover:

- bugs that are real and reproduced, with no invented results;
- evidence: steps actually run, a real page reload before any persistence claim;
- a source (`Spec` / `Obs` / `Assum`) on every checklist row, and assumptions not presented as bugs;
- `Unconfirmed` used for what could not be verified;
- coverage of the main features and risk ranking;
- the method's report format and open questions.

**What it misses:** one app, one reviewer, one run per configuration. Run-to-run variance is large (see B5 vs B6). The scores compare configurations on this app; they are not a general benchmark.

## Exploration runs

| Run | Configuration | Score | Cost | Notes |
| --- | --- | --- | --- | --- |
| A | No SoniaQA | 9 | $0.60 | Baseline |
| B | SoniaQA, report summarized by the main session | 13 | $1.56 | |
| B2 | SoniaQA + `Unconfirmed` rule, Opus | 16 | $2.08 | Full report copied into the chat: expensive |
| B2-S | Same with Sonnet | 10 | $1.14 | False claims, an invented test name, an assumption presented as a bug |
| B3 | Report written to a file | 13 | $1.68 | Prompt said "do not write files": no file written; missed the special-characters bug |
| B4 | + mandatory input classes (`& < > " ' /`, emoji, 1 char) | - | $1.14 | Found all bugs, but the main session told the agent to skip the file: not scorable |
| B5 | + agent description says the report file is always written | 15 | $1.29 | First run with the report in a file |
| B6 | `/soniaqa-explore` command | 16 | $1.53 | Found a new bug no earlier run had found, confirmed by hand |

## Test generation

From the B6 report, Claude (main session, with the skill) wrote page objects, a fixture and three specs:

| Round | Result | Issues found in review |
| --- | --- | --- |
| 1 | 13 tests, typecheck and run OK | Special-character bugs not covered; `test.fail` tests could hide a different failure; base URL hard-coded |
| 2 | 15 tests | One `test.fail` still failed on a precondition affected by another bug |
| 3 | 15 tests: 7 pass, 8 `test.fail` with bug IDs | None |

Rounds 1 and 2 cost $1.31 together; round 3 was a small change. Without human review, the first round would have looked green and complete.

## Lessons

1. **Rules beat hope.** Each rule added after a failed run fixed that failure: `Unconfirmed` for unverified results, a fixed list of input classes, a mandatory report file.
2. **The orchestrator can override the agent.** The agent's own rules were not enough: the main session rewrote the task. The fix went into the agent's description, which the main session reads.
3. **Opus vs Sonnet.** In one run each, Sonnet was cheaper but produced false claims. For exploration, accuracy is worth the cost.
4. **`test.fail` needs care.** It passes on any failure, so every step before the bug must be asserted, and preconditions affected by other open bugs must be compared against a baseline.
5. **Human review stays.** The agent found the bugs; the reviewer found what the tests did not prove.
