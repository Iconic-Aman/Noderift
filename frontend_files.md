# Frontend UI Port Plan

We are porting the `workflow-automation-canvas` (Next.js) to our `frontend` (Vite + React) directory. Here is the list of files we will create/update:

## Configuration & Root
- `frontend/index.html` — Main HTML entry point
- `frontend/package.json` — Dependencies (already created)
- `frontend/vite.config.ts` — Vite config (already created)
- `frontend/tsconfig.json` — TypeScript configuration
- `frontend/postcss.config.js` — PostCSS configuration for Tailwind
- `frontend/tailwind.config.js` — Tailwind CSS configuration (if using v3/v4 config)

## Source Files (`frontend/src/`)

### Core Setup
- `src/main.tsx` — React application mount point
- `src/App.tsx` — Main application component (port of `app/page.tsx`)
- `src/index.css` — Global styles (port of `app/globals.css` with Tailwind directives)

### Types & Utils
- `src/types/workflow.ts` — Type definitions for nodes and configurations
- `src/lib/utils.ts` — Utility functions (`cn` for Tailwind class merging)
- `src/lib/node-templates.ts` — Definitions for all available workflow nodes

### Workflow Components (`src/components/workflow/`)
- `top-navbar.tsx` — Top navigation bar with save/run actions
- `node-palette.tsx` — Left sidebar with draggable node templates
- `workflow-node.tsx` — Custom React Flow node component (the card on the canvas)
- `node-icons.tsx` — SVG icons for different node types
- `node-config-panel.tsx` — Right sidebar for configuring selected nodes
