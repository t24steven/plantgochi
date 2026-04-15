---
inclusion: always
---

# Plantgochi — Technology Stack

## Core Framework

- **Phaser 3** (latest stable) — main game engine for all scenes, rendering, input, and physics.
- **JavaScript (ES6+)** — primary language. No TypeScript unless already present in the codebase.

## Rendering

- **WebGL** with Canvas fallback (Phaser default).
- Art style: **pixel-cartoon 2D**, frontal view only.
- All assets are sprite sheets or individual PNG/WebP images scaled with `pixelArt: true` in Phaser config.

## Data Persistence

- **LocalStorage** — all game state is saved automatically (no backend required).
- Save key: `plantgochi_save`.
- Data is serialized as JSON. Never use `sessionStorage`.

## Project Server

- **Local development**: Node.js static server (e.g., `http-server`, Vite, or Parcel).
- **Future deployment**: Static hosting (Netlify, GitHub Pages, or similar). No server-side code needed.

## Asset Pipeline

- Pixel art assets created externally and imported as PNG/WebP.
- Sprite sheets use Phaser `atlas` loader with JSON metadata.
- Audio: Web Audio API via Phaser's built-in sound manager.

## Code Conventions

- Each game screen is a separate **Phaser Scene** class in its own file.
- Scene keys match screen names: `MenuScene`, `SelectScene`, `InteriorScene`, `ExteriorScene`, `ShopScene`, `WardrobeScene`.
- Game data is managed through a shared **GameState** singleton or Phaser registry (`this.registry`).
- Plant logic (stat decay, growth, death) lives in a dedicated `Plant.js` class, NOT inside scenes.
- Minigames are individual scenes prefixed `Minigame_`: e.g., `Minigame_WaterRush`.
- Constants (decay rates, plant configs, weather effects) are centralized in `src/config/constants.js`.

## Dependency Management

- No npm dependencies beyond the dev server and Phaser itself.
- Phaser loaded via CDN or local bundle — keep consistent across environments.
