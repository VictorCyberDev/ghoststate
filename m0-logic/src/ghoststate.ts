// GhostState M0: pure restore logic. No Lens Studio APIs here, so it runs under Node.
// A Lens Studio script would feed it world poses and render from snapshot().

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };
export type Pose = { position: Vec3; rotation: Quat };

export type ItemId = "camera" | "light" | "microphone";
export const ITEM_IDS: readonly ItemId[] = ["camera", "light", "microphone"];
export type Poses = Record<ItemId, Pose>;

export type Checkpoint = { id: string; name: string; items: Poses };

export type RestoreState = "IDLE" | "SAVED" | "DIVERGED" | "RESTORING" | "RESTORED";
export type AlignStatus = "FAR" | "NEAR" | "ALIGNED";

// Starting values from the M0 brief; tune after Preview scale is known.
export const ENTER_ALIGNED_M = 0.04;
export const LEAVE_ALIGNED_M = 0.06;
export const NEAR_M = 0.2;

const q0: Quat = { x: 0, y: 0, z: 0, w: 1 };
const pose = (x: number, y: number, z: number): Pose => ({ position: { x, y, z }, rotation: q0 });

// Deterministic Preview stand-in for "the setup changed". Not randomised, so runs are repeatable.
// Positions in metres, desk-local. Each disturbed item is well beyond NEAR_M from DEFAULT_LAYOUT.
export const DEFAULT_LAYOUT: Poses = {
  camera: pose(-0.4, 0.15, 0.0),
  light: pose(0.0, 0.3, -0.25),
  microphone: pose(0.35, 0.1, 0.1),
};
export const DISTURBED_LAYOUT: Poses = {
  camera: pose(-0.1, 0.15, 0.4),
  light: pose(0.5, 0.3, 0.2),
  microphone: pose(-0.3, 0.1, -0.35),
};

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// Hysteresis: enter ALIGNED below ENTER, leave only above LEAVE.
export function nextStatus(prev: AlignStatus, d: number): AlignStatus {
  if (prev === "ALIGNED") {
    if (d <= LEAVE_ALIGNED_M) return "ALIGNED";
  } else if (d < ENTER_ALIGNED_M) {
    return "ALIGNED";
  }
  return d < NEAR_M ? "NEAR" : "FAR";
}

const clonePose = (p: Pose): Pose => ({ position: { ...p.position }, rotation: { ...p.rotation } });
const clonePoses = (p: Poses): Poses => ({
  camera: clonePose(p.camera),
  light: clonePose(p.light),
  microphone: clonePose(p.microphone),
});

export type ItemView = { status: AlignStatus; resolved: boolean; distance: number };
export type Snapshot = {
  state: RestoreState;
  checkpointName: string | null;
  resolvedCount: number;
  total: number;
  ghosts: ItemId[];
  bannerVisible: boolean; // "SETUP RESTORED 3 / 3"
  completions: number;
  items: Record<ItemId, ItemView>;
};

export class RestoreController {
  private state: RestoreState = "IDLE";
  private checkpoint: Checkpoint | null = null;
  private status: Record<ItemId, AlignStatus> = { camera: "FAR", light: "FAR", microphone: "FAR" };
  private resolved: Record<ItemId, boolean> = { camera: false, light: false, microphone: false };
  private last: Record<ItemId, number> = { camera: Infinity, light: Infinity, microphone: Infinity };
  private completions = 0;
  readonly log: string[] = [];

  private enter(next: RestoreState): void {
    this.log.push(`${this.state}->${next}`);
    this.state = next;
  }

  private clearProgress(): void {
    for (const id of ITEM_IDS) {
      this.status[id] = "FAR";
      this.resolved[id] = false;
      this.last[id] = Infinity;
    }
  }

  // SAVE SETUP. Rejected mid-restore so a retry can't leak ghosts across checkpoints.
  save(poses: Poses, name = "Podcast"): boolean {
    if (this.state === "RESTORING") return false;
    this.checkpoint = { id: "cp-1", name, items: clonePoses(poses) };
    this.clearProgress();
    this.enter("SAVED");
    return true;
  }

  // SIMULATE SETUP CHANGE: Preview stand-in. Returns the fixed disturbed poses to apply to the scene.
  simulateChange(): Poses | null {
    if (!this.checkpoint || this.state === "RESTORING") return null;
    this.clearProgress();
    this.enter("DIVERGED");
    return clonePoses(DISTURBED_LAYOUT);
  }

  // RESTORE SETUP: only from DIVERGED.
  startRestore(current: Poses): boolean {
    if (this.state !== "DIVERGED" || !this.checkpoint) return false;
    this.clearProgress();
    this.enter("RESTORING");
    this.update(current);
    return true;
  }

  // Feed current world poses each frame / on drag end.
  update(current: Poses): void {
    if (this.state !== "RESTORING" || !this.checkpoint) return;
    for (const id of ITEM_IDS) {
      const d = distance(current[id].position, this.checkpoint.items[id].position);
      this.last[id] = d;
      this.status[id] = nextStatus(this.status[id], d);
      if (this.status[id] === "ALIGNED") this.resolved[id] = true; // latched until cancel/save
    }
    if (ITEM_IDS.every((id) => this.resolved[id])) {
      this.completions += 1;
      this.enter("RESTORED");
    }
  }

  // Cancel: RESTORING -> DIVERGED, ghosts and progress cleared, no completion.
  cancel(): boolean {
    if (this.state !== "RESTORING") return false;
    this.clearProgress();
    this.enter("DIVERGED");
    return true;
  }

  snapshot(): Snapshot {
    const resolvedCount = ITEM_IDS.filter((id) => this.resolved[id]).length;
    const items = {} as Record<ItemId, ItemView>;
    for (const id of ITEM_IDS) {
      items[id] = { status: this.status[id], resolved: this.resolved[id], distance: this.last[id] };
    }
    return {
      state: this.state,
      checkpointName: this.checkpoint?.name ?? null,
      resolvedCount,
      total: ITEM_IDS.length,
      ghosts: this.state === "RESTORING" ? ITEM_IDS.filter((id) => !this.resolved[id]) : [],
      bannerVisible: this.state === "RESTORED",
      completions: this.completions,
      items,
    };
  }

  savedPose(id: ItemId): Pose | null {
    return this.checkpoint ? clonePose(this.checkpoint.items[id]) : null;
  }
}
