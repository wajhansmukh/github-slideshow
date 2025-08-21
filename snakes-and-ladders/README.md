Snakes & Ladders (Web)

A simple, responsive Snakes & Ladders game built with vanilla HTML/CSS/JS.

Features
- 10x10 serpentine board (1–100)
- Two players, turn-based
- Animated movement with snakes and ladders
- Dice roll, turn indicator, reset
- Keyboard support: Enter/Space to roll, modal close

Run locally
- Open `index.html` in a browser, or serve via HTTP:
- Example: `python3 -m http.server 8080 --directory snakes-and-ladders`
- Then open http://localhost:8080

Customize
- Edit snakes/ladders in `script.js` (`snakes` and `ladders` maps)
- Adjust colors in `styles.css` variables

Rules
- Start on square 1; first to reach 100 wins
- Must land exactly on 100
- Landing on ladder base climbs to its top
- Landing on snake head slides to its tail

Notes
- SVG overlay recalculates on resize to keep alignment
- Tokens offset slightly when stacked

