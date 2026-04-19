# UI/UX Design Decisions

## Responsive Layout

The presentation editor uses a responsive layout with Tailwind's breakpoint
system (sm/md). On small screens, buttons become scrollable horizontally
and the slide canvas limits its height to 55vh to ensure controls remain
accessible.

## Drag and Drop Interactions

Elements can be moved by clicking and dragging the element body, and
resized by dragging the corner handles. This replaces the manual
position/size input fields for a more intuitive editing experience.

## Visual Feedback for Selection

When an element is selected (single click), a blue border appears around
it and 5px black handles appear at each corner, providing clear visual
indication of the selected state and available interactions.

## Modal-based Editing

All element creation and property editing uses modal dialogs (shadcn Dialog),
providing a consistent and focused editing experience. Double-clicking an
element opens its edit modal with pre-filled values.

## Slide Panel with Mini Previews

The slide control panel shows mini-previews of each slide including
background and element content, allowing users to quickly identify
and navigate to specific slides. Slides can be reordered via drag and drop.
