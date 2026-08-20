
# Remotion Prompt — Noderift "AI Mode" Demo Video

Paste this whole thing into your IDE's AI assistant (Cursor / Claude Code / etc.) inside a fresh Remotion project.

---

## Project brief

Build a Remotion video composition that demos the "AI Mode" feature of a product called **Noderift** — a visual node-based AI workflow automation tool. No human, no face, no screen recording. Everything is a hand-built animated UI mockup rendered in React/Remotion.

- **Resolution:** 1920x1080, 30fps
- **Total length:** ~24 seconds (720 frames) — adjust timings below if it needs to run longer
- **Style:** dark theme, clean SaaS product-demo look. Background `#0B0D12`, accent color `#6C5CE7` (purple) or swap for Noderift's real brand color if different, node cards `#171923` with a soft border `#2A2E3A`, text white/`#E4E6EB` with muted gray `#8B92A5` for secondary text.
- **Font:** Inter or similar clean sans-serif.

Structure the project as one root `<Composition>` with a `Sequence` per scene below. Use `useCurrentFrame()`, `interpolate()`, and `spring()` for all animation — no external video/audio assets required, but leave hooks for a soft background music track and light UI "blip" sound effects on node creation.

---

## Scene-by-scene breakdown

### Scene 1 — Empty canvas (frames 0–60, ~2s)

- Fade in on a blank workflow canvas: subtle dot-grid background, a minimal top toolbar with the Noderift logo top-left.
- A toggle/pill button labeled **"AI Mode"** sits top-right, idle state (outline only).

### Scene 2 — Activate AI Mode (frames 60–90, ~1s)

- Cursor (a simple circular dot, not a real OS cursor icon) moves to the "AI Mode" pill and clicks it.
- On click: the pill fills with the accent color, and a prompt input bar slides up from the bottom-center of the canvas, similar to a command palette (like Spotlight/Raycast style), with a placeholder "Describe the workflow you want to build…".

### Scene 3 — Typing the prompt (frames 90–180, ~3s)

- Text types itself character-by-character into the input bar (use `text.slice(0, frame - startFrame)` driven by frame count).
- Prompt text: **"Scrape today's tech news headlines and email me a summary every morning"**
- Blinking cursor at the end of the text while typing.

### Scene 4 — Submit (frames 180–210, ~1s)

- Cursor dot moves to a small submit/arrow button at the end of the input bar and clicks it.
- Input bar compresses/docks to a small floating chip at the top of the canvas showing the prompt in condensed form, clearing the center of the canvas for what's next.

### Scene 5 — AI "thinking" steps (frames 210–360, ~5s)

- A slim vertical list of reasoning steps appears one at a time, top-left of canvas, each line fading/sliding in above the last (stagger ~30 frames apart), styled like a lightweight chain-of-thought / status log:
  1. "Understanding your request…"
  2. "I'll help you build this workflow."
  3. "Planning steps: fetch → summarize → send"
  4. "Generating nodes…"
- Each line gets a small animated checkmark or spinner-to-check transition once the next line appears, so it reads as "done, done, done, working."

### Scene 6 — Nodes appear one by one (frames 360–510, ~5s)

- Four node cards pop into the canvas in sequence (stagger ~35 frames each), each with a scale+fade spring animation (`spring()` with slight overshoot), positioned left-to-right in a simple horizontal flow:
  1. **Trigger** — "Every day at 8:00 AM"
  2. **Scrape** — "Fetch tech news headlines"
  3. **Summarize** — "AI: condense into digest"
  4. **Send Email** — "Deliver summary"
- Each node card: icon top-left, title bold, subtitle muted gray, rounded corners, soft shadow/glow in accent color right as it pops in, settling to a subtle static border.

### Scene 7 — Edges connect the nodes (frames 510–600, ~3s)

- Immediately after each pair of adjacent nodes exists, an SVG connector line animates drawing itself from output to input (`stroke-dasharray`/`stroke-dashoffset` animated via `interpolate()`), left to right, one connector after another.
- Small arrowhead at the end of each completed connector.

### Scene 8 — Workflow runs (frames 600–690, ~3s)

- Once fully connected, a bright dot/pulse travels along the full connector path left to right.
- As the pulse passes through each node, that node briefly glows/highlights (accent-colored ring pulse) to sell "this step just executed."
- Optional: a small green checkmark badge appears on each node after the pulse passes it.

### Scene 9 — End card (frames 690–720, ~1s)

- Quick cut/fade to the Noderift logo centered, tagline underneath: **"Describe it. Watch it build itself."**
- Small "noderift.fun" text at the bottom.

---

## Technical implementation notes

- Break each scene into its own component file (`Scene1Canvas.tsx`, `Scene2Activate.tsx`, etc.) composed via `<Sequence from={} durationInFrames={}>` in `Video.tsx`.
- Build a reusable `<CursorDot>` component that takes `x`, `y`, and `clickFrame` props and animates position with `interpolate()` plus a small scale-down "click" bounce at `clickFrame`.
- Build a reusable `<NodeCard>` component (icon, title, subtitle, appearFrame) so Scene 6 is just four instances with staggered `appearFrame` values.
- Build a `<Connector>` component that takes two node positions and a `drawFrame` start point, rendering an SVG `<path>` with animated dash offset.
- For the traveling pulse in Scene 8, precompute the full path length and move a circle along it using frame-based percentage progress — no need for exact `getPointAtLength` if the layout is a simple straight/elbow line; straight-line lerp between node positions is enough.
- Keep all copy (prompt text, thinking steps, node labels) in a single constants file at the top so it's easy to tweak without touching animation logic.

---

## What to ask me for if unclear

If any timing feels off once you preview it, the fix is almost always adjusting `durationInFrames` per Sequence and the stagger offsets in Scenes 5–7 — not the animation logic itself.![1786627669771](image/video-scripts/1786627669771.jpg)![1786627782209](image/video-scripts/1786627782209.jpg)![1786627674360](image/video-scripts/1786627674360.jpg)![1786627678922](image/video-scripts/1786627678922.jpg)![1786627680094](image/video-scripts/1786627680094.jpg)![1786627780593](image/video-scripts/1786627780593.jpg)![1786627093379](image/video-scripts/1786627093379.png)
