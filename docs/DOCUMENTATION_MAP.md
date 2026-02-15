# Documentation map — CLAWDBOT / JARVIS

**Single source for how docs are organized and what exists.** Use this to onboard someone or another Cursor session, or to find the right doc fast.

---

## Start here

| Goal | Doc |
|------|-----|
| **JARVIS plan (vision, tracks, next steps)** | [docs/JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) |
| **JARVIS roadmap (all tracks + 2026 ecosystem)** | [docs/JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) |
| **Repo map (where everything lives)** | [docs/REPO_INDEX.md](./REPO_INDEX.md) |
| **Teach a Cursor session how to use this repo** | [docs/CURSOR_SESSION_ONBOARDING.md](./CURSOR_SESSION_ONBOARDING.md) |
| **Handoff (current state, next steps)** | [docs/HANDOFF.md](./HANDOFF.md) |
| **Project overview, quick start** | [README.md](../README.md) |
| **Full setup, config, skills** | [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) |
| **Day-to-day ops** | [RUNBOOK.md](../RUNBOOK.md) |
| **Before public push (strip internal refs)** | [docs/PUBLIC_REPO_CHECKLIST.md](./PUBLIC_REPO_CHECKLIST.md) |
| **Modes, premium skills, Yellow/Hot Rod** | [docs/PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) |
| **Success metrics (north star, KPIs)** | [docs/METRICS.md](./METRICS.md) |

---

## By topic

### Edge / Supabase (hosted JARVIS, MCP, UI→Edge)

| Doc | Use |
|-----|-----|
| [JARVIS_EDGE_AUTH.md](./JARVIS_EDGE_AUTH.md) | Edge auth: required in cloud when token set; no auth locally; sync script. |
| [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md) | What changes when JARVIS runs behind the Edge Function. |
| [supabase/README.md](../supabase/README.md) | Deploy `jarvis` Edge Function, set secrets, REST. |
| [JARVIS_MCP_SUPABASE.md](./JARVIS_MCP_SUPABASE.md) | JARVIS MCP on Supabase (Edge + Vault); spec. |
| [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md) | Add JARVIS as MCP server in Cursor. |
| [JARVIS_SUPERPOWERS_UNLOCKED.md](./JARVIS_SUPERPOWERS_UNLOCKED.md) | What the setup unlocks (one URL, MCP, Vault, UI→Edge). |
| [JARVIS_UPDATES_AND_ENHANCEMENTS.md](./JARVIS_UPDATES_AND_ENHANCEMENTS.md) | Done vs next (UI→Edge, health, MCP, streaming). |

Code: **supabase/functions/jarvis/** (Edge Function), **apps/jarvis-ui/** (UI; `NEXT_PUBLIC_JARVIS_EDGE_URL` for Edge backend).

### Olive (separate repo)

| Doc | Use |
|-----|-----|
| [OLIVE_PROJECT_README.md](./OLIVE_PROJECT_README.md) | Olive overview, try it, feedback, beta testers. |
| [OLIVE_LIST_PARSING_SPEC.md](./OLIVE_LIST_PARSING_SPEC.md) | List/Smart Paste: parser, rate limits. |
| [OLIVE_NOTES_FOR_TRANSFER.md](./OLIVE_NOTES_FOR_TRANSFER.md) | Notes to copy when opening Olive repo. |

### JARVIS product & agent (plan, tools, behavior)

| Doc | Use |
|-----|-----|
| [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) | Vision, tracks (Windows/ROG, UI, modes, Edge/MCP, showcase), current state, next 6–12 months. |
| [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) | Single roadmap: all tracks (Windows, UI, Edge, cutting-edge, next wave), status, and 2026 ecosystem backlog. |
| [PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) | Modes (Blue/Yellow/Hot Rod), premium skills, how to get Yellow or Hot Rod. |
| [jarvis/TOOLS.md](../jarvis/TOOLS.md) | All tools/skills and when to use them; repo scripts; platform CLIs. |
| [COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) | Skill marketplace, contributors, hero/premium skills. |
| [HERO_SKILLS_NEXT.md](./HERO_SKILLS_NEXT.md) | Focus Pro and Notion: what’s done, what’s next (timer, Notion create/query, MCP). |
| [NOTION_AGENTIC_WORKSPACE_2026.md](./NOTION_AGENTIC_WORKSPACE_2026.md) | Strategic analysis: Notion API 2026, MCP, data_source_id, agentic workflows; use for Notion skill roadmap. |
| [ZENDESK_CXO_SIDEKICK_BLUEPRINT.md](./ZENDESK_CXO_SIDEKICK_BLUEPRINT.md) | Zendesk CXO Sidekick: account config, tickets, SLAs, webhooks, incremental exports, ReAct/multi-agent; use for Zendesk skill roadmap. |
| [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md) | Zendesk Sidekick: C-suite & business-owner user stories (visibility, tickets, people, orgs, config); maps stories to tools and gaps. |
| [ZENDESK_SIDEKICK_GAPS_CLOSURE.md](./ZENDESK_SIDEKICK_GAPS_CLOSURE.md) | Zendesk gaps and how they were closed (org search doc, SLA script) or deferred; how to run SLA check. |
| [ZENDESK_SIDEKICK_PLAYBOOK.md](./ZENDESK_SIDEKICK_PLAYBOOK.md) | Zendesk Sidekick: step-by-step flows (tickets by entity/product, by tag/keyword, by form/field, VoC, account view, scripts). |
| [ZENDESK_BOTS_AND_WORKFLOWS.md](./ZENDESK_BOTS_AND_WORKFLOWS.md) | Zendesk triggers, automations, macros (read-only); how they relate to bots and AI workflows; what the Sidekick can manage. |
| [jarvis/AGENTS.md](../jarvis/AGENTS.md) | How JARVIS behaves by context (Discord, PM, deep work, etc.). |
| [JARVIS_CUTTING_EDGE.md](./JARVIS_CUTTING_EDGE.md) | Prioritized improvements to make JARVIS best-in-class (memory, long context, orchestration, UI). |
| [JARVIS_MEMORY_CONSOLIDATION.md](./JARVIS_MEMORY_CONSOLIDATION.md) | Memory consolidation/decay: pruning messages, stale summaries, prefs dedup; script outline. |
| [JARVIS_ARCHIVIST.md](./JARVIS_ARCHIVIST.md) | Archivist: embeddings + structured "versions" of conversations (topics, decisions, entities) so bots can search and query long-term memory. |
| [JARVIS_VISION_BACKLOG.md](./JARVIS_VISION_BACKLOG.md) | Vision/screen backlog: use cases, options (paste image, MCP, local VLM), when to implement. |
| [REPO_INDEX.md](./REPO_INDEX.md) | Full map: skills paths, key docs, apps, Olive, ignored. |
| [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) | Build flow: JARVIS + BEAST MODE, Code Roach, Echeo, workflow_dispatch, sessions_spawn. |
| [JARVIS_OWNS_SHIPPING.md](./JARVIS_OWNS_SHIPPING.md) | JARVIS owns the full ship flow (build → quality → deploy); no handoff to user. shipAccess, guardrails. |
| [JARVIS_NEURAL_FARM_CURSOR_CHOICES.md](./JARVIS_NEURAL_FARM_CURSOR_CHOICES.md) | Canonical choices JARVIS gives for Cursor + Neural Farm (Base URL, key, model, start command). |
| [JARVIS_TEAM_DEPLOY_AND_RUN.md](./JARVIS_TEAM_DEPLOY_AND_RUN.md) | How JARVIS deploys and runs his agent team (CLIs, workflows, token, index). |
| [JARVIS_OPTIMAL_TEAM_SETUP.md](./JARVIS_OPTIMAL_TEAM_SETUP.md) | Optimal setup: team roster (config/team-agents.json), team-status.js, ensure-team-ready.js, one-time checklist. |
| [AUTONOMOUS_RELEASES.md](./AUTONOMOUS_RELEASES.md) | How close we are to autonomous releases; run-autonomous-release.js (build → quality → deploy). |
| [LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md](./LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md) | Long-running agents: what exists (autonomous JARVIS, sessions_spawn, pipeline); gap (“manage a slew”); options (registry, queue, status). |
| [ORCHESTRATION_SCRIPTS.md](./ORCHESTRATION_SCRIPTS.md) | Index of pipeline scripts (run-team-pipeline, run-team-quality) and background/scheduled agents. |

### Pixel / Android (edge node, voice)

| Doc | Use |
|-----|-----|
| [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md) | **One path to working JARVIS on Pixel:** Termux+Termux:API (F-Droid), sshd, one Mac command (pixel-sync-and-start.sh). Start here. |
| [PIXEL_TROUBLESHOOTING.md](./PIXEL_TROUBLESHOOTING.md) | SSH unreachable, WiFi/location fail, gateway /tmp, permission denied, "no such file" — fixes and inline diagnostics. |
| [TERMUX_INSTALL_OFFICIAL.md](./TERMUX_INSTALL_OFFICIAL.md) | Termux + Termux:API from same source (F-Droid direct APK or GitHub); per official termux-app README. |
| [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) | **Sovereign Mobile Nexus:** architecture reference for high-fidelity autonomous agent on Pixel (ADB bypass, hybrid model, senses/hands/soul, ADB/skill tables). |
| [PIXEL_TEST_CHECKLIST.md](./PIXEL_TEST_CHECKLIST.md) | Verify Pixel setup: ADB, stack, voice node, /voice, /speak, pixel-sensors skill. Run after setup or changes. |
| [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) | **Pixel roadmap:** phases (foundation, polish, perfection, Sovereign Nexus, stretch), status, next steps. Single place for "what's next for JARVIS on Pixel." |
| [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md) | One-page max JARVIS on Pixel 8 Pro: one-time hardening, daily startup, voice, optional tweaks. |
| [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) | **GOD MODE checklist:** persistent server (ADB, swap, fake standby), RPC/Vulkan, voice DevOps, Cursor/BEAST/Echeo integration. |
| [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) | Exact commands: ADB, PulseAudio, FIFO TTS, Whisper install, voice node, Termux:API/F-Droid, Tailscale/Proot/latency. |
| [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md) | How to demo and use: browser chat/voice, gateway+TTS demo, full voice node. |
| [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md) | Custom wake word (e.g. "Hey JARVIS"): openWakeWord, Colab, .onnx for when onnxruntime is available on Termux. |
| [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md) | Architecture: Tensor G3, voice pipeline, mapping to JARVIS scripts. |
| [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md) | Chat and voice from the Pixel (18888, /voice, shortcuts). |
| [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md) | Wake lock, Termux:Boot, cron (plan-execute, heartbeat). |
| [SOUL_AND_PERSONA.md](./SOUL_AND_PERSONA.md) | Where SOUL/persona lives (workspace, ~/.jarvis/SOUL.md), voice system_prompt_file. |
| [SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md) | Copy to ~/.jarvis/SOUL.md for JARVIS identity and constraints. |

### Vault / secrets

| Doc | Use |
|-----|-----|
| [VAULT_MIGRATION.md](./VAULT_MIGRATION.md) | Migrate secrets to Supabase Vault. |
| [SETUP_VAULT_AND_ACCESS.md](./SETUP_VAULT_AND_ACCESS.md) | Vault setup and access. |
| [VAULT_ONE_PROJECT_FOR_ALL.md](./VAULT_ONE_PROJECT_FOR_ALL.md) | One Supabase project for Vault. |

### UI, Railway, other

| Doc | Use |
|-----|-----|
| [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) | Product/UX spec for JARVIS chat UI. |
| [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) | Phased UI roadmap. |
| [JARVIS_VOICE.md](./JARVIS_VOICE.md) | Voice in/out (Web UI, voice-control skill); voice polish backlog checklist. |
| [JARVIS_INSTEAD_OF_SIRI_MACOS.md](./JARVIS_INSTEAD_OF_SIRI_MACOS.md) | **Talk to JARVIS instead of Siri** on macOS Tahoe 26+: disable Siri, run at login, Web UI voice, keyboard shortcut. |
| [JARVIS_WAKE_WORD_ROADMAP.md](./JARVIS_WAKE_WORD_ROADMAP.md) | **"Hey JARVIS" wake-by-speech:** approach comparison (browser / native macOS / Electron), phased roadmap (POC → MVP → production → multi-platform), decisions log. |
| [JARVIS_UI_VOICE_UAT.md](./JARVIS_UI_VOICE_UAT.md) | Voice, theme & conversation UAT; local setup; checklist. |
| [JARVIS_RAILWAY.md](./JARVIS_RAILWAY.md) | Run gateway on Railway; Edge proxies to it. |
| [JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md) | Gateway: how to send meta (tools_used, structured_result) for UI 2.6/2.7. |
| [GATEWAY_IMPLEMENTER.md](./GATEWAY_IMPLEMENTER.md) | **For gateway implementers:** one-page entry point; contract + checklist; copy or link from gateway repo. |
| [COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) | Skill marketplace, contributors, hero/premium skills. |

---

## How we document

- **REPO_INDEX** = canonical map of the repo (paths, key docs, apps). Keep it updated when adding major areas.
- **CURSOR_SESSION_ONBOARDING** = what to read first and @ mention when teaching another Cursor session; includes Edge/Supabase.
- **DOCUMENTATION_MAP** (this file) = topic-based index and “start here” so nothing is orphaned.
- **README / DEVELOPER_GUIDE** = overview and full setup; they link to REPO_INDEX and Edge/onboarding where relevant.

When you add a new major area (e.g. a new product or integration), add it to **REPO_INDEX** (Key docs or a new section) and to **DOCUMENTATION_MAP** under the right topic. When adding a **product or pattern** that affects the portfolio, update clawd **PRODUCTS.md** and consider citing **AGENTIC_AUTONOMY_2026_ECOSYSTEM.md** (see **JARVIS_MASTER_ROADMAP.md** §3 item 9). When the **2026 agentic landscape** changes (new protocols, major players, security guidance), refresh **AGENTIC_AUTONOMY_2026_ECOSYSTEM.md** or add a dated addendum.
