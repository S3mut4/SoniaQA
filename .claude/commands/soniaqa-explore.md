---
description: Explore a web app with the soniaqa-explorer agent and save a SoniaQA report to soniaqa-reports/
argument-hint: <url> [scope]
---

Use the soniaqa-explorer agent to explore $ARGUMENTS with the Playwright MCP.

- Scope: regular user actions only, no security testing.
- I want: the top 10 features to automate ranked by risk, a checklist per screen, possible bugs, findings and open questions.
- Do not write tests and do not change project files. The agent's report in soniaqa-reports/ is its output and must be written.
- When it finishes, give me only what the agent returns (report path, counts, top 3 risks). Do not rewrite or summarize the report.
