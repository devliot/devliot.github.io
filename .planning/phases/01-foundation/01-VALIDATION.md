---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 1 is CI build validation only (D-13) |
| **Config file** | None required |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Build must exit 0
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | — | N/A | build | `npm run build` | N/A | pending |
| 01-01-02 | 01 | 1 | INFRA-02 | — | N/A | build | `npm run build && ls dist/index.html` | N/A | pending |
| 01-02-01 | 02 | 2 | INFRA-04 | — | N/A | build | `npm run build` | N/A | pending |
| 01-02-02 | 02 | 2 | INFRA-04 | — | N/A | build | `npm run build` | N/A | pending |
| 01-02-03 | 02 | 2 | INFRA-04 | — | N/A | manual | Visual browser verification | N/A | pending |
| 01-03-01 | 03 | 2 | INFRA-03 | — | N/A | file-check | `test -f .github/workflows/deploy.yml && python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Phase 1 validation is `npm run build` (automated) plus visual smoke tests (manual). No test framework needed per D-13.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Pages deploys on manual dispatch | INFRA-03 | Requires actual GitHub Actions run | Trigger workflow_dispatch in Actions tab, verify live URL updates |
| Hash-based routing resolves | INFRA-04 | Requires browser navigation | Navigate to `/#/article/hello` in browser, verify no 404 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
