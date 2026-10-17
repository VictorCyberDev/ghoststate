# M0 CLAD / MCP Evidence Log

Only real actions are listed. **No CLAD or Lens Studio MCP action has occurred**, so there is no scene evidence yet and no red→green history to preserve.

| Action | Tool | Result | Evidence |
|---|---|---|---|
| Verify official skill source and command | curl (raw.githubusercontent) | PASS | README lists `npx skills add challengepost/learn-specs --all -y` |
| Install Learn AR skill pack | `skills` CLI | PASS | `skills-lock.json`; `.agents/skills/plan-lens/` |
| Read CLAD / LEAF / setup docs | curl (developers.specs.com) | PASS (docs only) | Lens Studio ≥5.22; LEAF = `Leaf.lspkg`; `DefaultLeafInteractor` can trigger/drag SIK interactables |
| Create Camera/Light/Mic props via MCP | CLAD/MCP | **BLOCKED** | no Lens Studio |
| MCP scene inspection / property write | CLAD/MCP | **BLOCKED** | no Lens Studio |
| Preview launch, log read | CLAD/MCP | **BLOCKED** | no Lens Studio |
| LEAF discover/run | LEAF | **BLOCKED** | no Lens Studio |
| Pure logic tests (13) + typecheck + 2 mutation checks | Node test runner, tsc | PASS | `evidence/m0/logic-tests.txt` (not CLAD; plain Node) |
