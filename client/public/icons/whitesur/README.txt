WhiteSur Icon Pack placeholder
---------------------------------

Drop SVG icons in this folder to enable the WhiteSur icon pack for the dock.

File names required (all lowercase):
- home.svg
- tutorials.svg
- quizzes.svg
- tools.svg
- problems.svg
- visualizer.svg
- dashboard.svg
- quick-add.svg
- theme.svg

How to use:
1) Copy your WhiteSur-style icons into this folder with the exact names above.
2) In the browser, open the site and run this in DevTools console:
   localStorage.setItem('iconPack', 'whitesur'); location.reload();
   (Or remove/reset with localStorage.removeItem('iconPack').)

Notes:
- Icons are loaded from /icons/whitesur/<name>.svg at runtime.
- If a file is missing or fails to load, the app automatically falls back to the built-in default icon.
