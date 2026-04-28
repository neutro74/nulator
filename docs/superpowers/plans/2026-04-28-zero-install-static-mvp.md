# Zero-Install Static MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and host nulator's first balanced MVP as a zero-dependency static web app that works on Vercel without local package installation.

**Architecture:** The app uses static HTML, CSS, and browser JavaScript modules. VM lifecycle behavior lives in a small pure module that can be tested with Node's built-in `node:test` runner and reused by the browser UI.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node built-in test runner, Vercel static hosting.

---

## File Structure

- `index.html`: Static app shell and semantic layout.
- `styles.css`: Desktop-like VM manager styling, responsive layout, light/dark capable tokens.
- `src/vm-engine.mjs`: Pure VM model, seeded VMs, lifecycle actions, snapshots, activity log, hardware classifier.
- `src/app.mjs`: Browser UI state, rendering, event handlers, localStorage persistence, capability detection.
- `test/vm-engine.test.mjs`: Node built-in tests for VM engine behavior.
- `package.json`: Metadata and `node --test` script only. No dependencies.
- `vercel.json`: Static hosting configuration.

## Task 1: VM Engine Tests

**Files:**
- Create: `test/vm-engine.test.mjs`

- [ ] **Step 1: Write failing tests**

Write tests for start, pause, resume, stop, reset, snapshot, clone, and hardware classification behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/vm-engine.test.mjs`
Expected: FAIL because `src/vm-engine.mjs` does not exist yet.

## Task 2: VM Engine Implementation

**Files:**
- Create: `src/vm-engine.mjs`

- [ ] **Step 1: Implement pure VM behavior**

Create the functions imported by `test/vm-engine.test.mjs`. Use deterministic IDs based on the VM name and timestamp where possible, immutable updates, newest activity first, and safe invalid-action behavior through `lastError`.

- [ ] **Step 2: Run tests to verify they pass**

Run: `node --test test/vm-engine.test.mjs`
Expected: PASS.

## Task 3: Static UI

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.mjs`

- [ ] **Step 1: Build semantic app shell**

Create the dashboard layout with sidebar, toolbar, VM details, viewer, settings panels, snapshots, and hardware capability sections.

- [ ] **Step 2: Wire browser behavior**

Use `src/vm-engine.mjs` from the browser, persist VM inventory to `localStorage`, detect browser capabilities, and render actions without a backend.

## Task 4: Hosting Metadata

**Files:**
- Create: `package.json`
- Create: `vercel.json`

- [ ] **Step 1: Add zero-dependency metadata**

Use package scripts that rely only on Node:

```json
{
  "scripts": {
    "test": "node --test test/*.test.mjs"
  }
}
```

- [ ] **Step 2: Add Vercel static routing**

Use `vercel.json` to serve the static app and keep browser routing simple.

## Task 5: Verification And Deploy

**Files:**
- Modify: none unless verification exposes issues.

- [ ] **Step 1: Run tests**

Run: `node --test test/*.test.mjs`
Expected: PASS.

- [ ] **Step 2: Commit files to GitHub**

Use the GitHub connector because local `git` is unavailable.

- [ ] **Step 3: Deploy with Vercel**

Use the Vercel connector to deploy the current static project.

## Self-Review

- Spec coverage: The plan covers the hosted UI shell, fake lifecycle, snapshots, local persistence, hardware profile detection, tests, GitHub, and Vercel hosting.
- Placeholder scan: No unresolved TODO/TBD placeholders are used as implementation requirements.
- Type consistency: VM action function names match between tests and implementation tasks.
