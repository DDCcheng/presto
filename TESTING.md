# Testing

## Happy Path

Tests the core admin workflow:

1. Register successfully
2. Create a new presentation
3. Update the thumbnail and name
4. Add slides to the presentation
5. Switch between slides
6. Delete the presentation
7. Logout
8. Login again

## Alternate Path - Element Editing

Tests the slide element editing workflow:

1. Register successfully
2. Create a new presentation and navigate to it
3. Add a text element to a slide
4. Add an image element to a slide
5. Double-click to edit the text element
6. Right-click to delete the text element
7. Change the slide background color
8. Navigate back and logout

This path was chosen because it covers the element-level CRUD
operations (create, read, update, delete) and background customization,
which are the core editing features of the application. These features
are distinct from the happy path which focuses on presentation-level
operations like creating, renaming, and deleting presentations.
