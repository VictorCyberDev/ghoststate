import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LAYOUT, DISTURBED_LAYOUT, ENTER_ALIGNED_M, LEAVE_ALIGNED_M, NEAR_M, ITEM_IDS,
  RestoreController, distance, nextStatus,
  type AlignStatus, type ItemId, type Poses,
} from "../src/ghoststate.ts";

const at = (p: Poses, id: ItemId, dx: number): Poses => ({
  ...p,
  [id]: { ...p[id], position: { ...p[id].position, x: p[id].position.x + dx } },
});
// Current layout where `ids` sit exactly on target and the rest stay disturbed.
const withAligned = (ids: ItemId[]): Poses => {
  const out = { ...DISTURBED_LAYOUT };
  for (const id of ids) out[id] = DEFAULT_LAYOUT[id];
  return out;
};
const diverged = () => {
  const c = new RestoreController();
  assert.ok(c.save(DEFAULT_LAYOUT));
  assert.deepEqual(c.simulateChange(), DISTURBED_LAYOUT);
  return c;
};

test("disturbance is deterministic and every item is beyond NEAR", () => {
  const c1 = diverged();
  const c2 = diverged();
  assert.deepEqual(c1.snapshot(), c2.snapshot());
  for (const id of ITEM_IDS) {
    assert.ok(distance(DEFAULT_LAYOUT[id].position, DISTURBED_LAYOUT[id].position) > NEAR_M);
  }
});

test("save captures all 3 transforms; state flow IDLE->SAVED->DIVERGED", () => {
  const c = new RestoreController();
  assert.equal(c.snapshot().state, "IDLE");
  c.save(DEFAULT_LAYOUT);
  assert.equal(c.snapshot().state, "SAVED");
  for (const id of ITEM_IDS) assert.deepEqual(c.savedPose(id), DEFAULT_LAYOUT[id]);
  c.simulateChange();
  assert.equal(c.snapshot().state, "DIVERGED");
});

test("restore renders exactly 3 ghosts", () => {
  const c = diverged();
  assert.ok(c.startRestore(DISTURBED_LAYOUT));
  assert.deepEqual([...c.snapshot().ghosts].sort(), [...ITEM_IDS].sort());
  assert.equal(c.snapshot().ghosts.length, 3);
});

test("restore is refused unless DIVERGED", () => {
  const c = new RestoreController();
  assert.equal(c.startRestore(DISTURBED_LAYOUT), false);
  c.save(DEFAULT_LAYOUT);
  assert.equal(c.startRestore(DISTURBED_LAYOUT), false);
});

test("FAR stays unresolved", () => {
  assert.equal(nextStatus("FAR", 1.0), "FAR");
  const c = diverged();
  c.startRestore(DISTURBED_LAYOUT);
  assert.equal(c.snapshot().resolvedCount, 0);
  assert.equal(c.snapshot().items.camera.status, "FAR");
});

test("entering <4 cm causes ALIGNED; exactly 4 cm does not", () => {
  assert.equal(nextStatus("NEAR", ENTER_ALIGNED_M - 0.001), "ALIGNED");
  assert.equal(nextStatus("NEAR", ENTER_ALIGNED_M), "NEAR");
});

test("4-6 cm after entering does not flicker; >6 cm leaves", () => {
  assert.equal(nextStatus("ALIGNED", 0.05), "ALIGNED");
  assert.equal(nextStatus("ALIGNED", LEAVE_ALIGNED_M), "ALIGNED");
  assert.equal(nextStatus("ALIGNED", LEAVE_ALIGNED_M + 0.001), "NEAR");
  assert.equal(nextStatus("ALIGNED", NEAR_M + 0.01), "FAR");
  // Not yet aligned: the same 5 cm reading must NOT align (it is inside the dead band only after entry).
  assert.equal(nextStatus("NEAR", 0.05), "NEAR");
});

test("jitter across the band produces exactly one transition (no boundary flicker)", () => {
  let s: AlignStatus = "NEAR";
  const seq: AlignStatus[] = [];
  // approach, then jitter 3.9<->5.9 cm, then drift out
  for (const d of [0.1, 0.045, 0.039, 0.055, 0.041, 0.059, 0.042, 0.058, 0.061, 0.07]) {
    s = nextStatus(s, d);
    seq.push(s);
  }
  const transitions = seq.filter((v, i) => i > 0 && v !== seq[i - 1]).length;
  assert.deepEqual(seq, ["NEAR", "NEAR", "ALIGNED", "ALIGNED", "ALIGNED", "ALIGNED", "ALIGNED", "ALIGNED", "NEAR", "NEAR"]);
  assert.equal(transitions, 2); // one entry, one exit
});

test("0/3, 1/3, 2/3 never restored; 3/3 restored exactly once", () => {
  const c = diverged();
  c.startRestore(DISTURBED_LAYOUT);
  const check = (ids: ItemId[], count: number) => {
    c.update(withAligned(ids));
    const s = c.snapshot();
    assert.equal(s.resolvedCount, count);
    assert.equal(s.bannerVisible, false, `${count}/3 must not show restored`);
    assert.equal(s.state, "RESTORING");
    assert.equal(s.completions, 0);
    assert.equal(s.ghosts.length, 3 - count);
  };
  check([], 0);
  check(["camera"], 1);
  check(["camera", "light"], 2);
  c.update(withAligned([...ITEM_IDS]));
  let s = c.snapshot();
  assert.equal(s.state, "RESTORED");
  assert.equal(s.resolvedCount, 3);
  assert.equal(s.bannerVisible, true);
  assert.equal(s.completions, 1);
  assert.deepEqual(s.ghosts, []);
  for (let i = 0; i < 5; i++) c.update(withAligned([...ITEM_IDS]));
  c.update(DISTURBED_LAYOUT); // dragging away afterwards must not re-fire or unrestore
  s = c.snapshot();
  assert.equal(s.completions, 1);
  assert.equal(s.state, "RESTORED");
});

test("resolution is latched: an aligned item dragged out to 7 cm stays resolved", () => {
  const c = diverged();
  c.startRestore(DISTURBED_LAYOUT);
  c.update(withAligned(["microphone"]));
  c.update(at(withAligned(["microphone"]), "microphone", 0.07));
  const s = c.snapshot();
  assert.equal(s.items.microphone.resolved, true);
  assert.equal(s.items.microphone.status, "NEAR");
  assert.equal(s.resolvedCount, 1);
});

test("cancel clears ghosts/progress, returns to DIVERGED, fires no completion; retry is clean", () => {
  const c = diverged();
  c.startRestore(DISTURBED_LAYOUT);
  c.update(withAligned(["camera", "light"]));
  assert.equal(c.snapshot().resolvedCount, 2);
  assert.ok(c.cancel());
  let s = c.snapshot();
  assert.equal(s.state, "DIVERGED");
  assert.equal(s.resolvedCount, 0);
  assert.deepEqual(s.ghosts, []);
  assert.equal(s.completions, 0);
  assert.equal(c.cancel(), false);
  // retry: no leakage from the cancelled attempt
  c.startRestore(DISTURBED_LAYOUT);
  s = c.snapshot();
  assert.equal(s.resolvedCount, 0);
  assert.equal(s.ghosts.length, 3);
  c.update(withAligned([...ITEM_IDS]));
  assert.equal(c.snapshot().completions, 1);
});

test("save and simulateChange are refused mid-restore", () => {
  const c = diverged();
  c.startRestore(DISTURBED_LAYOUT);
  assert.equal(c.save(DEFAULT_LAYOUT), false);
  assert.equal(c.simulateChange(), null);
  assert.equal(c.snapshot().state, "RESTORING");
});

test("invariant: state RESTORED iff resolvedCount === 3, across a sweep of subsets", () => {
  for (let mask = 0; mask < 8; mask++) {
    const ids = ITEM_IDS.filter((_, i) => mask & (1 << i));
    const c = diverged();
    c.startRestore(DISTURBED_LAYOUT);
    c.update(withAligned(ids));
    const s = c.snapshot();
    assert.equal(s.state === "RESTORED", s.resolvedCount === 3, `mask ${mask}`);
    assert.equal(s.bannerVisible, ids.length === 3);
  }
});
