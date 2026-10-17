# GhostState

Entry for the **Learn AR with SPECS** hackathon (Snap / Devpost).

**Thesis (unvalidated):** save a setup as a spatial checkpoint; after the setup changes, SPECS shows where each item goes back.

## Status: Milestone 0 — BLOCKED (not failed)

M0 asks one question: does the interaction feel like *restore my setup*, or just *drag objects into outlines*?

That question can only be answered in the Lens Studio Preview, which has **not been run yet**. The agent session that produced this branch was headless Linux; Lens Studio ships for macOS and Windows only. So:

- Proven here: the pure restore/alignment/state logic (13 Node tests, mutation-checked).
- **Not proven:** SPECS project, CLAD, MCP, Preview, LEAF, SIK dragging, ghost legibility, Variant A/B, additive display, cold read.

Details and the verdict: [`docs/M0_PROOF.md`](docs/M0_PROOF.md). Steps to finish M0 on a Mac/Windows machine are in the same file.

## Preview disclosure

Everything is designed for the Lens Studio Preview (no SPECS hardware). "Simulate Setup Change" is a deterministic Preview stand-in. GhostState makes no claim of recognising real objects, using camera vision, or persisting anchors. State is in memory only.

## Layout

- `docs/` — `MILESTONES.md`, `M0_TOOLCHAIN.md`, `M0_PROOF.md`, `M0_CLAD_MCP_LOG.md`
- `m0-logic/` — pure TypeScript logic + tests (`cd m0-logic && npm test`); no Lens Studio APIs
- `evidence/m0/` — captured test output
- `.agents/`, `skills-lock.json` — official `challengepost/learn-specs` skill pack (`plan-lens`)

No Lens Studio project exists yet; it must be created in Lens Studio (SPECS → Base Template → Save As).
