<div align="center">
  <img src="public/Prod.png" alt="Prod Logo" width="128" />
  <h1>Prod</h1>
  <p>A minimalist, zero-friction desktop timer designed to enforce cognitive pacing.</p>
</div>

---

I built **Prod** for a very specific reason: the girl I like was working so intensely without taking any breaks that she was burning herself out and getting constant headaches. It pains me just seeing her suffer.

I wanted to make something beautiful, unobtrusive, and simple to gently remind her to step away, rest her eyes, take a breath, and that the world can wait. This app is designed to enforce the 90/15 Ultradian rhythm (or any custom block) so you can work deeply without sacrificing your well-being.

## ✨ Features

- **Zero Bloat:** No task lists, no gamification. Just pure, minimalist time-boxing.
- **Always on Top:** Pin it as a tiny, floating widget to any corner of your screen.
- **Window Memory:** Remembers exactly what size and coordinate position you last left it.
- **Dynamic Visuals:** Four responsive background animations (Outline, Line, Water, Heartbeat Pulse).
- **Audio Profiles:** Custom-synthesized Web Audio API chimes, digital alerts, and singing bowls.
- **Saved Presets:** Build, name, and permanently save your own custom work/rest rhythms.

## 🚀 Tech Stack

- **Frontend:** React, Tailwind CSS, TypeScript
- **Backend/Desktop:** Tauri + Rust

## 💻 Installation

### Standard Users (Recommended)
You can simply download the latest standalone executable (`.exe` or `.msi`) for your operating system directly from the [Releases](https://github.com/yourusername/prod/releases) page. No developer setup required!

### Developers
To run this app locally or compile it from source:

1. Clone the repository
2. Install the web dependencies: 
   ```bash
   npm install
   ```
3. Run the development environment: 
   ```bash
   npm run tauri dev
   ```
4. Build the final Windows/Mac executable: 
   ```bash
   npm run tauri build
   ```
