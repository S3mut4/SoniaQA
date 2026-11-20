---
name: soniaqa
description: SoniaQA, a QA working method - spec-first exploration, checklists, test cases, bug reports with evidence, Playwright + TypeScript POM/fixtures/mocks, data-driven API tests and the STD-001 "Measure, don't game" standard. Use for test planning, app exploration, test automation or bug reporting.
---

# SoniaQA - a QA working method for Claude Code

**Purpose:** plan, explore, test and report in a fixed order, where every result has a source and every bug has evidence. A human reviewer approves the plan before any test is written.

## 1. Workflow for a new app or feature

Always in this order. Do not write test code before step 4.

1. **Find the spec**: requirements, Swagger / OpenAPI, a public spec (e.g. TodoMVC), the UI text. List what each source defines in a Sources table.
2. **Explore** the app (manually or with Playwright MCP). Record test ids, flows, requests and responses.
3. **Checklist per screen or endpoint**, plus **test cases only for complex flows**.
4. **The reviewer approves** the checklist. Only then write tests.
5. **Report** bugs (BUG-XX) and findings (FIND-XX). Keep open questions in their own section.
6. **Update** `docs/checklist.md` (Covered by, Status) and the README coverage table.

## 2. QA rules

- Every expected result has a source: **Spec** (requirement, Swagger), **Obs** (observed) or **Assum** (reasonable assumption). A failure based on Assum is a **recommendation**, not a bug.
- Observed behaviour is never accepted as correct when it contradicts the spec or common sense: flag it as a possible bug.
- Verify against real responses, never infer: field names, HTTP methods, status codes (e.g. PUT vs PATCH, 200 vs 201).
- No requirement means no pass/fail: mark the check `Skipped: no requirement` and add an open question.
- Classify checks as positive, boundary or negative. Test both sides of every boundary (499/500, 10000/10001).
- Every test and every assertion must be justified. Drop checks or improvement requests that duplicate existing coverage.
- Tests must be able to fail: break them on purpose once; run suspected flaky tests with `--repeat-each`.
- Blocked (a precondition cannot be met) and Skipped (no requirement or out of scope) are different statuses.
- Severity and priority can disagree: say so explicitly in the bug report.
- A bug needs the steps actually run and the result actually observed. Anything not verified reliably (e.g. a hash change instead of a real page reload) is reported as `Unconfirmed`, with what is missing to confirm it, never as a bug.
- IDs must match across artifacts: the bug ID in the checklist, the report, the test and the README.
- Security: always flag risks (internal details leaked in errors, trusting client data, access without login, credentials in URLs). Manipulate requests only in training environments or with authorization. When security is out of scope, still mention anything serious in one line.
- All test work follows **Standard STD-001: Measure, don't game** (section 9).

## 3. Templates

### Sources table (top of `docs/checklist.md`)

| Source | What it defines |
| --- | --- |
| Swagger `GET /api/...` (link) | Ranges, response fields, error codes |
| Observed in the app (month year) | UI flow, test ids, options |
| Assumption | Common UX/security practice where no requirement exists. Failures here are **recommendations**, not bugs |

Legend under the table: `Spec` / `Obs` / `Assum`; Type `Auto` / `Manual` / `Explo`; Status `Passed` / `Failed` / `Blocked` / `Skipped` / `Unconfirmed` / `To do`.

### Checklist (one table per screen or endpoint)

| ID | Check | Source | Priority | Type | Covered by | Status |
| --- | --- | --- | --- | --- | --- | --- |
| CALC-01 | Default state: amount 500, period 12, Apply Now disabled | Obs | High | Auto | calculator: default state | Passed |
| CALC-15 | Payment calculation is correct | - | - | - | | Skipped: no requirement |
| INC-02 | Invalid income (0, letters, decimals) is rejected | Assum | High | Auto | loan-flow: income validation | Failed: BUG-01 |

- ID formats: UI checklists use screen or area prefix + number (`CALC-01`, `LOGIN-`, `DET-`, `GEN-` for cross-cutting); data-driven API case tables use `NN_NN` = endpoint number + case number (`01_23`). Bugs are always `BUG-NN` and findings `FIND-NN`.
- Check = one short sentence with the expected result. Security assumptions are marked `Assum (security)`.
- Covered by = `<spec>: <test name>`. Partial coverage is stated: `Passed (one direction)`.

API checks are worded as: `Positive|Negative: Successful|Unsuccessful <action> with <role>, using <data>. Response code <N> [and <body>].` Always include: no token, invalid token, malformed JSON (never 500) and special characters / HTML / SQL strings (400, or stored escaped, never 500).

### Test case (complex flows only)

```
### TC-01 <Flow> - <outcome>
**Precondition:** <data or state>

| # | Step | Expected result |
| --- | --- | --- |
| 1 | <action with values> | <observable result> |

Automated: `<spec>: <test name>`   (or "Manual")
```

For input validation with many values, one step per value with its expected result and a Status column; cite the standard used (e.g. E.164).

### Bug report

```
### BUG-01 <What> <where> when <condition>

| Field | Content |
| --- | --- |
| Steps to reproduce | 1. ... 2. ... |
| Actual result | ... |
| Expected result | ... (source: Spec/Assum) |
| Severity / Priority | Major / High: <one sentence on the impact> |
| Test | `<spec>: <test name>` (`test.fail`) |
```

Environment for all reports goes once above the reports (URL, browser, tool version, date). Severity: Critical / Major / Minor / Trivial. Priority: High / Medium / Low.

### Finding (FIND-XX)

A documentation or contract discrepancy that is not a functional bug (endpoint missing from Swagger, error body different from the documented one). Same table, with a `Type` field instead of Steps when there is nothing to reproduce.

### Open questions

A final section listing missing requirements and behaviours to confirm with the product owner.

## 4. Automation (Playwright + TypeScript)

- **Least code possible**: the smallest change that covers the request. No "just in case" abstractions.
- **Prefer the techniques the project already uses.** A new technique is proposed, not introduced silently (section 5).

### Project structure

```
config/env-data.ts    loads env/dev.env locally (not in CI) and throws on a missing variable
env/dev.env.example   template; env/dev.env is gitignored
tests/pages/          one page object per screen
tests/mocks/          one file per backend area
tests/fixtures.ts     page fixtures
tests/api/            API specs
tests/<feature>.spec.ts
docs/checklist.md
.github/workflows/playwright.yml
```

### Page objects

- One class per screen: `readonly` locators and actions. Assertions stay in the tests.
- Locators with `getByTestId`.
- **Navigation methods return the next page object**, so a flow reads as a chain: `const loginPopup = await smallLoanPage.apply();`

### Fixtures

- `tests/fixtures.ts` extends `base` with page fixtures that can be chained (`smallLoanPage` -> `loanDetailsPage` -> `incomePage`). Specs import `test` and `expect` from `./fixtures`.
- When a test needs other values than the fixture, use a small helper inside the spec (e.g. `goToIncomePage(smallLoanPage, amount, period)`). Move it out only when a second spec needs it.

### Tests

- Name: `<scenario> > <expected result>`, e.g. `"blacklisted user > loan declined even with high income"`. Group with `test.describe`.
- Retrying assertions: `expect(locator)`, `expect.poll`. No fixed waits.
- Known bugs: `test.fail(true, "BUG-01: <short description>")` so CI stays green and warns when the bug is fixed.

### Mocks

- In `tests/mocks/`, never in page objects: a page object models a screen, a mock models the backend.
- One function per endpoint and case (`mockDecision`, `mockDecisionError`). Match the URL with a predicate on `url.pathname`.
- Registered **before** the action that sends the request.
- Keep the shape of the real response.
- Only mock the method you need; let the rest through with `route.fallback()`.
- `{ times }` for temporary failures (retry scenarios); `route.continue({ postData })` to tamper with a real request.
- Error mocks include fake internal details (e.g. a stack trace line) and the test checks the UI does **not** show them.
- A mocked test only checks what the mock controls. The real flow is covered once end-to-end.

### API tests (data-driven)

```
helpers/helpers.ts            one request helper per endpoint
test-data/<endpoint>.data.ts  one case table per endpoint
tests/<endpoint>.spec.ts      one loop per spec
```

- One helper per endpoint, using the `request` fixture and `baseURL`, with optional params (`params = {}`), so "missing parameter" cases go through the same helper.
- One data file per endpoint. Each row: `{ id, category, description, params | data, status, expected }`, grouped by category with a comment.
- One loop per spec; the test name comes from the row: `` `${id} [${category}] ${description}` ``.
- Assert the status and the **full body** with `toEqual`; error bodies as `{ error: expect.any(String) }`.
- Cases with a different HTTP method or URL (404, 405) are standalone tests next to the loop.
- The README case table (`ID | Category | Test case | Expected result`) uses the same IDs as the data rows and the test names.
- Scope: **V1** = the requested cases; **V2** = backlog, added as new data rows without changing the specs.
- Data in `.ts` by default: it allows `expect.any()`, generated values (`"a".repeat(60)`), raw buffers for invalid JSON, comments and type checking. Use JSON only when the data is edited outside code or shared with other tools (e.g. Postman, a spreadsheet).
- Invalid-type cases: the helper accepts `unknown` (or a separate raw helper). No `as unknown as` casts.
- Read possibly empty bodies with `text()`, not `json()`, so the assertion fails instead of the parsing.
- Cleanup in `finally`; teardown checks with GET before DELETE; never leave stale test data.

### Credentials and CI

- Credentials in `env/*.env` locally and GitHub repository secrets in CI. Never in code, URLs or reports.
- CI on push and PR to `main`: `npm ci`, typecheck, Prettier check, install Chromium, tests, upload the HTML report.

### Style and Git

- Code style is whatever the project's Prettier outputs (double quotes, semicolons, `printWidth: 100`). Prettier covers every source folder (`tests`, `helpers`, `test-data`, `config`) and `prettier:check` runs in CI.
- Meaningful names. Short lowercase comments only to explain *why*.
- Before committing: `npm run typecheck`, `npm run prettier:check`, the tests.
- Branches `feature/<topic>` or `fix/<topic>` from an up-to-date `main`. Small PRs, imperative English commit messages and short PR descriptions.

### README (deliverable)

Sections: purpose, configuration (install, env file, variables), running the tests, scripts table, project structure, Page Object Model, Mocks, test coverage table (`Spec | Test | What it checks`), Continuous Integration and secrets, Known issues (BUG/FIND list), useful commands.

## 5. New techniques, methods and sources

- Anything not listed in section 8 (References) and not already used in the project is **new**. Mark it in the answer as **`NEW:`** with its link and one line on why it is used.
- A better technique is never introduced silently: state the problem it solves in the current code, a minimal example and the cost of adopting it. The reviewer decides.
- End the answer with a **"Candidates for SoniaQA"** list of everything marked `NEW:`.
- Nothing enters the method without the reviewer's approval. Once approved, it goes to References.

## 6. Collaboration

- Propose before executing; no hidden decisions. Flag every judgment call.
- When two options are valid, ask to pick the one most likely to succeed. When the reviewer decides, push back if the other option looks better.
- Correct mistakes plainly, and always propose better alternatives.
- Step by step: one item at a time during reviews, always giving file and line.
- If a problem seems unsolvable: stop, review the context (why, what for, limits) and say so clearly.
- Cite sources when using the web.

## 7. When running as a subagent

There is no live conversation with the reviewer, so:

- Do only the task you were given. Do not write or change code, tests or files unless the task or your agent definition says so (e.g. `soniaqa-explorer` writes its own report file).
- Do not guess past a blocker (missing credentials, missing spec): note it and continue with what you can do.
- Follow STD-001 (section 9), in particular STD-001.5 and STD-001.6: a correct result, not a finished task; stop and report when the task cannot be done properly.
- End with: what you did, the artifacts in the templates above, the judgment calls you made, open questions for the reviewer and the "Candidates for SoniaQA" list.

## 8. References

Checked sources only. Add new ones through the "Candidates for SoniaQA" review (section 5).

### Techniques

| Technique | Reference |
| --- | --- |
| Page Object Model | [Playwright POM](https://playwright.dev/docs/pom), [Selenium POM guide](https://selenium.dev/documentation/test_practices/encouraged/page_object_models) (best on theory and returning the next page), [Martin Fowler - Page Object](https://martinfowler.com/bliki/PageObject.html), [BrowserStack - POM with Playwright](https://www.browserstack.com/guide/page-object-model-with-playwright) |
| Fixtures | [Playwright fixtures](https://playwright.dev/docs/test-fixtures) |
| Mocks and network | [Playwright mock APIs](https://playwright.dev/docs/mock), [Playwright network](https://playwright.dev/docs/network) |
| API testing | [Playwright API testing](https://playwright.dev/docs/api-testing) |
| Data-driven tests | [Playwright parameterize tests](https://playwright.dev/docs/test-parameterize) |
| `test.fail`, tags | [Playwright annotations](https://playwright.dev/docs/test-annotations) |
| Projects | [Playwright projects](https://playwright.dev/docs/test-projects) |
| Exploration with AI | [Playwright MCP](https://github.com/microsoft/playwright-mcp) |
| Skills and subagents | [Claude Code skills](https://code.claude.com/docs/en/skills), [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) |
| Writing standards (MUST, SHOULD, MAY) | [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) |

### Standards used as Spec

| Standard | Used for |
| --- | --- |
| [E.164 (ITU)](https://www.itu.int/rec/t-rec-e.164/en), [E.164 (Wikipedia)](https://en.wikipedia.org/wiki/E.164) | Phone number validation |
| [RFC 5322](https://datatracker.ietf.org/doc/html/rfc5322) | Email format, unless the API spec is stricter |
| [TodoMVC app spec](https://github.com/tastejs/todomvc/blob/master/app-spec.md) | Expected behaviour of TodoMVC-style apps |

### Why the rules exist

| Rule | Real case |
| --- | --- |
| STD-001 Measure, don't game | [OpenAI agents broke into Hugging Face to cheat the ExploitGym evaluation (July 2026)](https://www.scworld.com/news/hugging-face-attacker-revealed-to-be-openai-agents-that-escaped-testing-sandbox) |

## 9. Standards

### STD-001: Measure, don't game

| ID | Version | Status | Owner | Date |
| --- | --- | --- | --- | --- |
| STD-001 | 1.0 | Active | Project owner | 2026-11-18 |

**Scope:** all test work, manual and automated, done by people, Claude or any agent.
**Keywords:** MUST, MUST NOT and SHOULD are used as defined in RFC 2119.

**Principle:** "When a measure becomes a target, it ceases to be a good measure" (Goodhart's law). Green CI, test counts and Passed checks are signals of quality, not the goal.

#### Tests and metrics

- **STD-001.1** A test MUST NOT be made to pass by weakening it: no loosened assertions, no expected values copied from the actual result, no mocks that hide the failure.
- **STD-001.2** `test.fail` and `skip` MUST reference a bug report ID or a written reason.
- **STD-001.3** A failing test MUST be reported, not silenced.
- **STD-001.4** A proposed metric MUST state what it stands for, what it misses and how it could be gamed.

#### Agents

- **STD-001.5** The goal is a correct result, not a finished task. An agent MUST NOT take shortcuts around the task: changing tests or data to make them pass, looking for answer keys, or acting outside the given scope.
- **STD-001.6** If a task cannot be done properly, the agent MUST stop and report why.

#### Exceptions

Only the project owner can approve an exception. It MUST be written down (PR description or checklist) with the rule ID and the reason.

**Rationale:** see "Why the rules exist" (section 8).
