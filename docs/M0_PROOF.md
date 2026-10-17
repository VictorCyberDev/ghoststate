# M0 Proof

**Verdict: D — M0 BLOCKED — CONCEPT NOT YET INVALIDATED.**
The blocker is the environment (no Lens Studio), not the concept. Do not pivot on this evidence. Do not hard-lock on it either.

## What the logic tests prove (and do not)

`m0-logic/` implements Checkpoint (id, name, per-item position+rotation), the state machine (`IDLE → SAVED → DIVERGED → RESTORING → RESTORED`, cancel returns to `DIVERGED`), the deterministic disturbance, and hysteresis alignment (enter `< 0.04 m`, leave `> 0.06 m`, NEAR `< 0.20 m`). 13 tests pass; typecheck passes; two deliberate mutations (remove hysteresis; complete at 2/3) were each caught. Output: `evidence/m0/logic-tests.txt`.

These prove the **rules**. They do not prove that dragging a prop in the Preview feels like restoring a setup. That is the M0 question and remains unanswered.

Design decisions to confirm in Preview: resolution is **latched** (an item that reached ALIGNED stays resolved if dragged out again, until cancel/new save). Rotation is stored but not yet used for alignment (translation first, per brief). Thresholds are untuned starting values.

## Core proof status

| Item | Status | Evidence |
|---|---|---|
| SAVE (3 transforms) | logic PASS / Preview UNPROVEN | tests 2; no scene |
| DISTURB (deterministic) | logic PASS / Preview UNPROVEN | tests 1, 2 |
| GHOST (exactly 3, readable) | logic count PASS / visual UNPROVEN | test 3; no rendering done |
| RESTORE (manual drag in Preview) | **BLOCKED** | no Lens Studio |
| HYSTERESIS | logic PASS / Preview UNPROVEN | tests 7, 8 |
| PARTIAL 2/3 never complete | logic PASS / Preview UNPROVEN | tests 9, 13 |
| COMPLETE 3/3 exactly once | logic PASS / Preview UNPROVEN | test 9 |
| CANCEL | logic PASS / Preview UNPROVEN | test 11 |
| Variant A / B | **UNPROVEN** | not built |
| Additive-display check | **BLOCKED** | |
| LEAF scenario (twice consecutively) | **BLOCKED** — not written, see below | |
| Cold read | **PENDING HUMAN TEST** | no clip exists yet |
| Out-of-view guidance | DEFERRED (optional; core spike not yet done) | |

## Hard closure criteria

Environment: all 6 **BLOCKED**. Interaction (3 props draggable): **BLOCKED**. Checkpoint/Alignment: logic only. Automation: **BLOCKED**. Design feasibility: **BLOCKED**. Integrity: PASS by construction (no recognition, camera CV, anchors, World Query, backend, runtime LLM, or persistence anywhere in the repo; M1 untouched).

## Kill / pivot conditions

1. Preview cannot produce a reliable restore flow — **NOT EVALUATED** (not run).
2. LEAF cannot exercise the interaction — **NOT EVALUATED**. Docs say `DefaultLeafInteractor` can trigger/drag/hover any SIK interactable, so it is plausible but unproven.
3. Ghost illegible in additive Preview — **NOT EVALUATED**.
4. Needs object recognition — **Not triggered on current evidence**: the loop uses a Preview stand-in button, which the official preview-limits table explicitly allows ("a hard-coded result … build what happens next for real").
5. Needs persistent anchors — **Not triggered**: in-memory only; the official docs list persistence as un-showable in Preview, so the demo must not depend on it.
6. Reads as a drag puzzle after one UX iteration — **NOT EVALUATED**. This is the main live risk.
7. Cold read fails twice — **NOT EVALUATED**.
8. A research assumption proved wrong — **Not triggered by docs**; nothing read contradicts the plan, but docs are not Preview.

## LEAF scenario (specified, not written)

I did not write LEAF TypeScript: I could not compile or run it, and an unrunnable test would pretend to be evidence.

- Given: saved checkpoint, `SIMULATE SETUP CHANGE` applied, `RESTORE SETUP` active.
- When: `DefaultLeafInteractor` drags the camera prop's SIK interactable from its disturbed pose to within 0.04 m of its saved pose (real drag path, not a direct call to the alignment function).
- Then: assert externally visible state: camera ghost object disabled, counter reads `1 / 3`, banner not shown.
- Must pass twice consecutively. Record any drag-precision flakiness honestly.

## Runbook to finish M0 (Mac Apple silicon 5.26+ or Windows 11)

1. Install Lens Studio ≥5.22. SPECS → Base Template → File > Save As. Copy this repo's `.agents/`, `skills-lock.json`, `docs/`, `m0-logic/`, `evidence/` into that folder (or clone this branch into it).
2. Open a terminal in the project folder (with the `.esproj` and `.mcp.json`) *after* Lens Studio is open. Start the agent; approve the `lens-studio` MCP server; install CLAD ([guide](https://developers.specs.com/docs/clad/setup/setup-ai/claude-code-setup)). Confirm `/mcp` shows it connected. Fill in `M0_TOOLCHAIN.md`.
3. Ask the agent to build: desk + camera/key-light/mic props (primitives are fine), all SIK-grabbable; SAVE / SIMULATE SETUP CHANGE / RESTORE / CANCEL buttons; one script wrapping the `RestoreController` logic from `m0-logic/src/ghoststate.ts`. Variant A ghost-only, Variant B ghost + trail. Use bright edge/halo, not dark fills.
4. `/specs-leaf-install-packages`, write the scenario above, run it twice in Preview.
5. Record two ~20 s Preview clips (A and B) with and without the additive simulation. Show the better one to someone with no explanation and ask: *"What do you think this does?"*

## Remaining unproven

Everything that requires Lens Studio: toolchain, interaction, ghost legibility, A/B comparison, additive display, LEAF, performance/log check, cold read.
