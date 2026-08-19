# Noderift Demo Video — Professional Revision Brief

**Use this as a direct prompt** for an AI coding agent (Claude Code, Cursor, etc.) working inside the Remotion project, or as your own implementation checklist. Audio/SFX/music are intentionally out of scope for this pass — leave clearly marked hooks so they're trivial to wire in later.

---

## 0. Context for the agent

This is a 30-second Remotion product demo for **Noderift** — an AI-native alternative to n8n. The core hook: the user describes a workflow in plain English and an AI agent (LangGraph `create_react_agent`) builds the node graph live on canvas — no manual dragging. The current cut works but reads as "good," not "professional." The gap is entirely in **motion physics, pacing, camera dynamics, and logical/visual accuracy** — not the color system or layout, which are already solid and should be preserved.

**Non-negotiables:**
- Keep the existing dark navy (`#0a0e1a`-ish) background, blue accent (`#3b82f6`-ish) brand palette, and current typography (bold sans, white/blue two-tone headlines).
- Keep total runtime in the 30–35s range. A few extra seconds are fine if they add real content (see Scene 11).
- Every new animation must use spring physics, not linear/ease interpolation. No new element should "just appear" — everything enters with either a spring pop, a clip-path wipe, or a tracked camera move.
- Leave `// SFX:` and `// MUSIC BEAT:` comments at every hit point (listed inline below) so audio sync is a 10-minute job later, not a re-edit.

---

## 1. Global motion rules

Apply these as house rules across every scene, not just the ones called out below:

```tsx
// Standard "pop in" spring — use for nodes, cards, buttons, badges
const pop = spring({
  fps,
  frame: frame - delay,
  config: { damping: 12, stiffness: 140, mass: 0.8 }, // slight overshoot
});

// Standard "settle" spring — use for text blocks, panels
const settle = spring({
  fps,
  frame: frame - delay,
  config: { damping: 18, stiffness: 100, mass: 1 }, // no overshoot, smooth
});
```

- **No scene should be perfectly static.** Even "hold" frames need a slow ambient drift: background scale `1.0 → 1.02` over the scene duration, or the dotted-grid background layer panning at ~2px/sec. This alone kills the "slideshow" feeling.
- **Text entrances:** replace plain opacity fades with a clip-path wipe (`inset(0 100% 0 0)` → `inset(0 0% 0 0)`) combined with a small upward translate (8px → 0). Reads far more premium than a fade.
- **Every transition between major scenes** gets a 12–18 frame cross-fade minimum (currently some cuts happen in 1–2 frames — verified via frame extraction, e.g. the card→chat-UI transition around 0:15). Nothing should be a hard cut except the very first frame-in from black.

---

## 2. Scene-by-scene rewrite

### Scene 1 — Problem statement (target: 0:00–0:04, was 0:00–0:03)
- Cut "Building workflows takes hours." hold time from ~3s to ~2.5s max.
- **Add background motion behind the text**: a faint, heavily-dimmed (10–15% opacity) node graph in the back layer, with 2-3 nodes being slowly dragged by a ghost cursor, wires re-routing manually. This visually *shows* the pain point instead of just stating it — and sets up a payoff later when the AI does it instantly.
- `// SFX: low ambient hum starts`

### Scene 2 — "Meet Noderift" (target: 0:04–0:06)
- Keep as-is structurally. Add a subtle scale-in overshoot on the logo icon (currently just a fade) using the `pop` spring above.
- `// SFX: soft chime on logo pop`

### Scene 3 — Tagline (target: 0:06–0:09)
- Replace the generic "The AI-powered workflow automation tool" with your actual positioning line, split as a two-part reveal:
  - Line 1 (0:06–0:07.5): **"No dragging. No wiring."**
  - Line 2 (0:07.5–0:09): **"Just describe it."** (in accent blue, matching your existing two-tone treatment)
- This is punchier than a generic descriptor and directly telegraphs the differentiator before you demonstrate it.
- `// MUSIC BEAT: on "Just describe it."`

### Scene 4 — Prompt gallery (target: 0:09–0:12, was 0:09–0:12 but static)
- Cards currently sit frozen. Give each card a slow, independent idle float (sine-wave translateY, amplitude ~4px, offset phase per card) so the scene feels alive even before selection.
- Trim from ~3s to ~2.5s — five cards is plenty of read time at this pace.

### Scene 5 — Card select → chat UI morph (target: 0:12–0:14.5)
- This is your best existing transition (shared-element morph) — just extend it. Currently resolves in ~2 frames; stretch to 15–20 frames with the `settle` spring so the card visibly glides and scales into the chat bubble position while the top nav bar wipes in from the top edge (not a hard appear).
- `// SFX: whoosh on morph`

### Scene 6 — AI thinking checklist (target: 0:14.5–0:16.5)
- Swap the generic checklist copy for your **actual agent tool calls** — this is free authenticity that most demo videos can't fake:
  ```
  ✓ Understanding your request...
  ✓ Plan: schedule trigger → Gmail → save to Excel
  ✓ get_available_nodes()
  ✓ add_node(), add_node(), add_node()
  • connect_nodes()...
  ```
- Real function names read as "this is a real engineering system," not a mockup — worth more than any visual polish here.

### Scene 7 — Canvas build (target: 0:16.5–0:20)
- Add a slow camera zoom (scale 0.96 → 1.0) centered on the node cluster as it builds, instead of a fixed static frame. This alone fixes most of the "too much empty black space" feedback without changing the layout.
- Each node's pop-in should stagger by ~6 frames and use the overshoot `pop` spring, not fade.
- `// SFX: soft pop per node, three quick hits`

### Scene 8 — Connect the output button to Code Node (cosmetic only)
- Confirmed: the 3-node graph (Schedule Trigger → Gmail Trigger → Code Node) is accurate to the product — Code Node generates the Excel file directly, no dedicated Excel node exists or is needed. Nothing to fix about the workflow logic.
- Purely visual polish: draw a short connector line from Code Node down to the "Download Excel Output" button so it reads as "this button is that node's output" instead of sitting in open canvas space with no line pointing to it.

### Scene 9 — Execution run (target: 0:21.5–0:25.5)
- Keep the traveling-dot-along-connector effect — it's good. **Fix the bug**: there's a stray purple particle that appears in isolated empty space near the top-right around 0:27–0:28 with no connection to any node or line (confirmed across consecutive frame extracts). Either delete it, or repurpose it as a deliberate "data packet" that travels from Code Node down along the new connector to the download button, in sync with execution.
- `// SFX: sequential ding per node completion, pitch rising each time`

### Scene 10 — Completion + download (target: 0:25.5–0:28)
- Add a simple animated cursor (small SVG pointer, drop-shadow, ~24px) that moves from off-frame to the "Download Excel Output" button and does a small scale-pulse on "click." Nothing currently in the video implies a user is present — this one addition makes the whole ending read as an interaction rather than something that just happens on its own.
- `// SFX: click, then a satisfying success ding when button turns green`

### Scene 11 — **NEW: second example, fast cut** (insert at 0:28–0:30)
- You tease 5 different automation prompts in Scene 4 but only ever deliver 1. Add a 2-second speed-ramped montage showing a *second* prompt building almost instantly — e.g. "Alert Slack on new GitHub issue" — nodes snapping into place at 3-4x the speed of Scene 7, no dwell time. This single addition proves "AI builds *any* workflow," not just the one you happened to demo, and pays off the promise the gallery scene made.
- Use hard, fast cuts here deliberately (contrast with the smooth pacing elsewhere) — it should feel like a highlight reel, not a second full walkthrough.

### Scene 12 — Outro (target: 0:30–0:33)
- Keep as-is: logo, "Describe it. Watch it build itself.", `noderift.fun`. This scene is clean — don't over-engineer it.
- Optional: if this cut is going on X/Twitter as part of your build-in-public devlog, consider a small secondary end-card variant with a "Day X" tag to tie it into your existing devlog series. Skip this if it's going on the landing page hero — keep that version purely product-focused.

---

## 3. Technical polish (apply regardless of scene)

- **Export bitrate:** current file is ~785kbps at 1080p30, which is low enough to show early gradient banding under scrutiny (visible when contrast-boosted on the background glow). Re-render closer to **8–12 Mbps** — platforms like YouTube/X recompress on upload, so you want headroom going in.
- **Browser chrome on app screens:** consider wrapping the canvas/chat UI scenes in a thin, minimal browser bar showing the real `noderift.fun` (or `testing.noderift.fun`) URL. This is a small trust signal — it tells viewers this is a live product, not a Figma mockup, without saying so explicitly.
- **Background variation:** Scenes 1–3 currently reuse the exact same centered radial vignette. Nudge the vignette center or intensity slightly per scene (even 5-10%) so consecutive scenes don't feel like reused templates.

---

## 4. Why these specific changes (priority order if time is limited)

1. Scene 8 (connect the output button to Code Node) — small cosmetic fix, workflow logic itself is already correct.
2. Scene 1 + camera drift throughout — fixes the "static slideshow" feeling, which is the most common reason polished-looking demos still feel amateur.
3. Scene 11 (second example) — pays off a promise the video already makes and costs only ~2 seconds.
4. Spring easing pass — cheap to implement, disproportionate impact on perceived quality.
5. Cursor simulation — small addition, makes the ending feel interactive rather than automatic.
