# SoniaQA workspace

- This project uses the SoniaQA skill (`.claude/skills/soniaqa`) and the `soniaqa-explorer` agent.
- Explore an app with `/soniaqa-explore <url> [scope]`. The report goes to `soniaqa-reports/`.
- Tests are written only after a human has reviewed the checklist.
- Never commit or push unless asked. Credentials only in `env/dev.env`, never in code, URLs or reports.
