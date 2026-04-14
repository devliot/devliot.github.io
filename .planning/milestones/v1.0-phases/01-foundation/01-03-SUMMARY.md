---
phase: 01-foundation
plan: 03
subsystem: ci-cd
tags: [github-actions, github-pages, deployment, workflow_dispatch]
dependency_graph:
  requires: []
  provides: [github-pages-deployment-workflow]
  affects: []
tech_stack:
  added: [github-actions]
  patterns: [workflow_dispatch-only-deploy, oidc-pages-auth]
key_files:
  created:
    - .github/workflows/deploy.yml
  modified: []
decisions:
  - "D-11 honored: workflow_dispatch only trigger — no push or pull_request"
  - "D-13 honored: npm run build only, no lint or test step"
  - "D-12 honored: base path / configured in vite.config.ts, not in workflow"
  - "Permissions scoped to minimum required: contents:read, pages:write, id-token:write"
metrics:
  duration: "<1 minute"
  completed_date: "2026-04-10"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 03: GitHub Actions Deployment Workflow Summary

**One-liner:** Manual-dispatch-only GitHub Pages deployment using OIDC auth and upload-pages-artifact, with build-only CI (no lint/test).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create GitHub Actions deployment workflow | 1428860 | .github/workflows/deploy.yml |

## What Was Built

A single GitHub Actions workflow file (`.github/workflows/deploy.yml`) that:

- Triggers only on `workflow_dispatch` (manual "Run workflow" button in GitHub Actions UI) — no auto-deploy on push or PR per D-11
- Runs `npm ci` and `npm run build` only — no lint or test step per D-13
- Uses `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` to package the `dist/` directory
- Deploys via `actions/deploy-pages@v4` using OIDC token (no stored secrets)
- Scopes permissions to minimum: `contents: read`, `pages: write`, `id-token: write`
- Sets `concurrency.cancel-in-progress: false` to prevent a running deploy from being cancelled by a new trigger

## Key Implementation Details

The workflow uses two jobs:
1. **build**: checkout → setup Node.js (LTS, npm cache) → `npm ci` → `npm run build` → configure-pages → upload artifact
2. **deploy**: waits on `build`, deploys the uploaded artifact to GitHub Pages environment

The `environment` block in the deploy job exposes `steps.deployment.outputs.page_url` — this shows the live Pages URL in the Actions run summary.

## User Action Required Before First Deploy

Two prerequisites the user must complete manually (no CLI automation available):

1. **Push to main branch**: The workflow file must exist on the default branch (`main`) before the "Run workflow" button appears in the GitHub Actions UI (RESEARCH.md Pitfall 4).

2. **Enable GitHub Actions as Pages source**: Repo Settings → Pages → Source → select "GitHub Actions" (not "Deploy from a branch"). Without this, the deploy workflow will succeed (green check) but the Pages URL will not update (RESEARCH.md Pitfall 5).

## Deviations from Plan

None — plan executed exactly as written. The workflow YAML matches the specification in the plan and Pattern 5 from RESEARCH.md verbatim.

## Threat Surface

No new threat surface beyond what was analyzed in the plan's threat model:

- T-01-04 (Tampering/deploy.yml): Mitigated — workflow committed to repo, OIDC auth (no stored secrets), `workflow_dispatch` only (no external PR can trigger).
- T-01-05 (Elevation of Privilege): Mitigated — permissions set to `contents: read`, `pages: write`, `id-token: write`. No `contents: write` or `actions: write`.

## Known Stubs

None — this plan delivers a complete, functional workflow file with no placeholder content.

## Self-Check: PASSED

- [x] `.github/workflows/deploy.yml` exists: `test -f .github/workflows/deploy.yml` → FOUND
- [x] Commit 1428860 exists: `git log --oneline | grep 1428860` → FOUND
- [x] All 17 acceptance criteria verified via Python check script: all PASS
