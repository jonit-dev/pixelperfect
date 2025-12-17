# UI 2.0: "Pro Studio" Recreation Proposal

This proposal outlines a complete reorganization of the `PixelPerfect` workspace to achieve a professional, immersive, and "2x better" user experience.

## Core Philosophy: Content First

The current UI wraps the image in heavy chrome (sidebars, strips). The new UI treats the image as the hero, with controls floating above it, similar to professional tools like Lightroom, Figma, or Linear.

## 1. The Layout: "Immersive Studio"

### Current

- Fixed Left Sidebar (White)
- Fixed Bottom Strip (White)
- Constrained Center Preview (Gray)

### Proposed "Pro Studio" Layout

- **Infinite Canvas**: The background becomes a dark neutral surface (`bg-zinc-950`) allowing images to pop.
- **Floating Command Panel (Right)**:
  - Detached, floating glassmorphic panel (`backdrop-blur-md`).
  - Collapsible to maximize viewing area.
  - Contains all "Batch Settings" and "Processing Options".
- **Floating Dock (Bottom)**:
  - Replaces the Queue Strip.
  - MacOS-style dock or floating bar for managing the image queue.
  - Thumbnails enlarge on hover.

## 2. The Interaction: "Tactile Control"

### Zoom & Pan

- **Current**: Static image fit to container.
- **Proposed**: true Pan/Zoom capabilities (using `react-zoom-pan-pinch` or similar). Users can inspect upscaling details at 400% zoom.

### "Lens" Comparison

- **Current**: Side-by-side or Slider.
- **Proposed**: "Magic Lens" mode. Hover over the original image to reveal a circle of the upscaled version.

## 3. Visual Language: "Glass & Neon"

- **Theme**: Dark Mode default for the workspace (easier on eyes for visual work).
- **Accents**: Neon Indigo/Purple gradients for "Magic" actions (AI processing).
- **Typography**: Inter/Geist Mono for technical details (resolution, scale).

## 4. Component Reorganization

### `Workspace.tsx`

- **Removes**: Rigid flex layout.
- **Adds**: `ZStack` layout (layers).
  - Layer 1: Canvas (Full screen)
  - Layer 2: UI Overlays (Pointer-events-none, children auto)

### `ControlPanel.tsx` (New)

- Replaces `BatchSidebar`.
- Uses Accordion groups to save vertical space.
- "ActionPanel" becomes a sticky footer within this floating panel.

### `DockQueue.tsx` (New)

- Replaces `QueueStrip`.
- Minimalist indicators for status (Green dot for done, Spinner for processing).

## Implementation Steps

1.  **Refactor Workspace**: Switch to absolute positioning/overlay layout.
2.  **Create Canvas**: Implement Pan/Zoom wrapper.
3.  **Styling Overhaul**: Apply Dark Mode variables to workspace components.
4.  **Polish**: Add entry animations (Framer Motion) for panels.

## "2x Better" Why?

- **Professionalism**: Feels like a tool, not a web page.
- **Focus**: Users focus on the _result_, not the settings.
- **Ergonomics**: Controls are clustered where needed; canvas is maximized.
