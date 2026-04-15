---
inclusion: always
---

# Plantgochi — Project Structure

## Folder Layout

```
plantgochi/
├── index.html                  # Entry point
├── src/
│   ├── main.js                 # Phaser game config and scene registration
│   ├── config/
│   │   └── constants.js        # Plant configs, decay rates, weather multipliers
│   ├── data/
│   │   └── plants.js           # Static data for each plant species
│   ├── models/
│   │   ├── Plant.js            # Plant class: stats, decay, growth, death
│   │   └── GameState.js        # Singleton: coins, location, weather, save/load
│   ├── scenes/
│   │   ├── MenuScene.js        # Main menu and game info
│   │   ├── SelectScene.js      # Plant selection screen
│   │   ├── InteriorScene.js    # House interior gameplay
│   │   ├── ExteriorScene.js    # House exterior gameplay
│   │   ├── ShopScene.js        # Cosmetics shop
│   │   └── WardrobeScene.js    # Cosmetics wardrobe
│   ├── minigames/
│   │   └── Minigame_[Name].js  # One file per minigame
│   ├── ui/
│   │   ├── StatBar.js          # Reusable stat bar component
│   │   ├── PlantSprite.js      # Handles plant sprite + cosmetic layers
│   │   └── WeatherOverlay.js   # Weather visual effects
│   └── utils/
│       ├── SaveManager.js      # LocalStorage read/write helpers
│       └── Timer.js            # Real-time decay ticker
└── assets/
    ├── sprites/                # Plant sprites by species, stage, state
    ├── cosmetics/              # Cosmetic item sprites
    ├── ui/                     # HUD elements, buttons, icons
    ├── backgrounds/            # Interior and exterior backgrounds
    ├── weather/                # Weather effect sprites/particles
    └── audio/                  # SFX and background music
```

## Naming Conventions

- **Scenes**: PascalCase + `Scene` suffix — `InteriorScene.js`
- **Models/Classes**: PascalCase — `Plant.js`, `GameState.js`
- **Constants**: SCREAMING_SNAKE_CASE — `WATER_DECAY_RATE`
- **Assets**: lowercase-hyphenated — `sunflower-stage2-healthy.png`
- **Minigames**: `Minigame_` prefix + PascalCase name — `Minigame_WaterRush.js`

## Import Pattern

```js
// Absolute-style from src root (configure with Vite alias or relative paths)
import { PLANT_CONFIGS } from '../config/constants.js';
import Plant from '../models/Plant.js';
```

## Scene Navigation Pattern

Use `this.scene.start('SceneName', { data })` to pass data between scenes. All persistent game data lives in `GameState` singleton, not in scene-local variables.

## Save/Load Pattern

`SaveManager.save(gameState)` — called automatically every 30 seconds and on every user action that changes game state.
`SaveManager.load()` — called once on game boot in `MenuScene`.
