---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: 2026-04-10T00:00:00Z
updated: 2026-04-10T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Lit.js components render in browser
expected: Run `npm run dev`, open localhost:5173, confirm header with DEVLIOT link, hero text, and footer are visible
result: [pending]

### 2. Hash-based route resolution
expected: Navigate to `/#/article/hello`, confirm article stub renders with slug "hello"
result: [pending]

### 3. 404 route fallback
expected: Navigate to `/#/nonexistent`, confirm "404 -- Page not found" text appears
result: [pending]

### 4. Navigation and browser history
expected: Click DEVLIOT title in header to navigate home, use browser back/forward buttons between routes
result: [pending]

### 5. GitHub Pages deployment
expected: Push to main, enable Actions source in Pages settings, trigger workflow_dispatch, confirm site is live
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
