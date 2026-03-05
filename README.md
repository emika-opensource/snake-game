# 🐍 Snake

A sleek, neon-styled Snake game built with vanilla JavaScript and HTML5 Canvas. No dependencies — just open `index.html` and play.

![Snake Game Screenshot](screenshot.png)

## 🎮 How to Play

| Control | Action |
|---------|--------|
| **Arrow keys** or **WASD** | Move the snake |
| **Space** | Pause / Resume |
| **Any key** or **Tap** | Start the game |
| **Swipe** (touch) | Change direction on mobile |

Eat the red food to grow and score points. Don't hit the walls or yourself!

## ✨ Features

- **Canvas-based rendering** — smooth 60 fps game loop
- **Keyboard + touch controls** — works on desktop and mobile
- **Score & high score** — persisted in `localStorage`
- **Particle effects** — burst of particles when eating food
- **Neon design** — dark theme with glowing green snake and pulsing red food
- **Start / Pause / Game Over screens** — clean overlay UI
- **Progressive speed increase** — gets faster as your score grows
- **Responsive** — auto-sizes to fit any screen

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/emika-opensource/snake-game.git
cd snake-game

# Open in your browser
open index.html
# or
python3 -m http.server 8000
```

No build step. No dependencies. Just HTML, CSS, and JS.

## 📁 Project Structure

```
snake-game/
├── index.html        # Main game page
├── style.css         # All styles (neon dark theme)
├── game.js           # Complete game logic
├── README.md         # This file
└── package.json      # Package metadata
```

## 📄 License

MIT — do whatever you want with it.
