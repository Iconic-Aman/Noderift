# Noderift demo — Gmail-to-Excel workflow — integration steps

1. Copy this whole `noderift-demo` folder into your Remotion project's `src/` folder.
2. Open your project's existing `src/Root.tsx`:
   - If it's basically empty (default blank template), just replace its contents
     with this folder's `Root.tsx`.
   - If it already registers other compositions, copy the `<Composition ... />`
     block from this folder's `Root.tsx` into your existing `RemotionRoot`, and add:
     `import {NoderiftDemo, TOTAL_DURATION} from './noderift-demo/NoderiftDemo';`
3. Run `npx remotion studio` (or `npm run dev`, whichever your template uses).
4. Open `NoderiftDemo` in the sidebar — it should just play.

No API key, no external calls, nothing paid — fully self-contained.

## What it shows (~28s)
1. Blank canvas → click "AI Mode"
2. Prompt types itself in: "Every day at 8:00 AM, get all mail from
   xyz@gmail.com and save it into an excel sheet."
3. A short "thinking" log (3 lines)
4. Three nodes pop in one by one: **Schedule Trigger → Gmail Trigger → Code Node**
5. Connectors draw themselves between them
6. A **"▶ Run"** button appears — click it, and each node lights up
   blue (running) then green (done), left to right
7. A **"⬇ Download Excel"** button appears and gets clicked → "✓ Downloaded"
8. End card: logo + tagline

## What to tweak
- **`constants.ts`** — prompt text, the 3 node titles/subtitles/icons/colors,
  and the thinking-step lines. Easiest file to edit without touching animation logic.
- **`NoderiftDemo.tsx`** — the `T` object at the top controls every timing value
  (30 = 1 second at 30fps). Adjust there if any beat feels too fast or slow.
- **Colors** — `COLORS.running` (blue) and `COLORS.success` (green) control the
  node status badge colors during the run sequence.

## If something doesn't compile
Most likely a TypeScript strictness issue on the `IconKey` union type or an
unused-import lint warning — quick fixes, not structural problems.
