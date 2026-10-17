# M0 Toolchain

Recorded 2026-10-17 from the agent session. Nothing below is claimed beyond its evidence.

| Item | Status | Evidence |
|---|---|---|
| Lens Studio | **NOT AVAILABLE** — requirement: 5.22+ (CLAD docs); macOS 12+ / Windows 11 only (ar.snap.com/download). Session is Linux x86_64, no display. | `uname -a` = Linux 6.18.44; no `Lens Studio` binary found; `DISPLAY` empty |
| SPECS project | **NOT CREATED** — Base Template is created inside Lens Studio GUI | no `.esproj` in repo |
| CLAD | **NOT INSTALLED** — needs `ls-clad` plugin and a running Lens Studio | n/a |
| MCP (`lens-studio`) | **NOT CONNECTED** — Lens Studio creates the MCP endpoint per open window; none exists | no `.mcp.json`, no lens-studio tools in session |
| Preview | **NOT RUN** | n/a |
| LEAF | **NOT INSTALLED** — ships as `Leaf.lspkg` from the in-editor Asset Library | n/a |
| Learn AR skill pack | **INSTALLED** | `skills-lock.json` (plan-lens, hash `ff87335…f793c`); source verified at raw.githubusercontent.com/challengepost/learn-specs README |
| Node / npm | v22.22.0 / 10.9.4 | `node -v` |
| `skills` CLI | 1.7.2 | `npx skills --version` |
| Agent client | Claude Code 2.1.302 (cloud container) | `claude --version` |

## Workarounds / failures

- Skill-pack install: ran the verified command `npx skills add challengepost/learn-specs --all -y`. It installed `plan-lens` to `.agents/skills/` with a symlink under `.claude/skills/`. It also wrote a duplicate `agent/` folder, which I deleted. Skill contents reviewed first: Markdown only, no executables.
- `github.com` pages return 403 through the session proxy; the official README was read via `raw.githubusercontent.com` instead.
- `plan-lens` interview intentionally **not** run (M1 work, per M0 scope).

## Next step to unblock

On a Mac (Apple silicon, 5.26+) or Windows 11 machine: install Lens Studio ≥5.22, create SPECS → Base Template → Save As, open a terminal in that folder, install CLAD per https://developers.specs.com/docs/clad/setup/setup-ai/claude-code-setup, then run `/specs-leaf-install-packages`. Record versions here.
