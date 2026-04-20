# UI/UX Design Decisions

## Responsive Layout

The presentation editor uses Tailwind's responsive breakpoints (sm/md).
On small screens, buttons become horizontally scrollable and the slide
canvas limits its height to 55vh to ensure controls remain accessible.

## Drag and Drop Interactions

Elements can be moved by clicking and dragging the element body, and
resized by dragging the 5px corner handles. This replaces manual
position/size input fields for a more intuitive editing experience.

## Visual Feedback for Selection

When an element is selected via single click, a blue border appears
around it and 5px black handles appear at each corner, providing clear
visual indication of the selected state and available interactions.

## Modal-based Editing

All element creation and property editing uses shadcn Dialog modals,
providing a consistent and focused editing experience. Double-clicking
an element opens its edit modal with pre-filled current values.

## Slide Panel with Mini Previews

The slide control panel shows mini-previews of each slide including
background and element content, allowing users to quickly identify
and navigate to specific slides. Slides can be reordered via drag
and drop within the panel.

## Background Customization

The background modal provides three options (solid, gradient, image)
with clear toggle buttons showing the active selection. Users can
set both per-slide and default backgrounds in the same modal.

## Keyboard Shortcuts

- Left/Right Arrow: Navigate between slides
- Delete: Remove the currently selected element
- Escape: Deselect the current element
- Ctrl+C: Copy the selected element
- Ctrl+V: Paste the copied element (offset by 5%)
