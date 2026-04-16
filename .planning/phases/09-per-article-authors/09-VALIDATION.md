---
phase: 9
slug: per-article-authors
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.x |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/per-article-authors.spec.ts` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/per-article-authors.spec.ts`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | AUTHOR-02 | — | N/A | e2e | `npx playwright test tests/per-article-authors.spec.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | AUTHOR-02 | — | N/A | e2e | `npx playwright test tests/per-article-authors.spec.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | AUTHOR-03 | — | N/A | e2e | `npx playwright test tests/per-article-authors.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/per-article-authors.spec.ts` — stubs for AUTHOR-02, AUTHOR-03
- [ ] Build step (`npm run build`) must succeed before OG page tests

*Existing Playwright infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Byline visual alignment | AUTHOR-02 | Visual layout check | Inspect article header in browser, verify byline sits alongside date/reading time |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
