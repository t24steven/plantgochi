# Plantgochi — Technical Design

## Architecture Overview

Plantgochi is a single-page Phaser 3 application. All game logic lives client-side. Persistence is handled by LocalStorage. The architecture follows a **scene-based MVC pattern**:

- **Model**: `Plant.js`, `GameState.js` — pure data and business logic, no Phaser dependencies.
- **View**: Phaser Scenes — render and handle user input.
- **Controller**: `GameState` mediates between scenes and models. Scenes call GameState methods; they never mutate Plant data directly.

```
┌──────────────────────────────────────────────────────┐
│                    Phaser Game                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  MenuScene │  │SelectScene │  │InteriorScene   │  │
│  └────────────┘  └────────────┘  └────────────────┘  │
│  ┌─────────────┐ ┌────────────┐  ┌────────────────┐  │
│  │ExteriorScene│ │ ShopScene  │  │WardrobeScene   │  │
│  └─────────────┘ └────────────┘  └────────────────┘  │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Minigame_*.js scenes (1 per game)        │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                              │
│              ┌─────────▼──────────┐                   │
│              │    GameState.js    │ ← Phaser Registry │
│              │  (singleton/reg.)  │                   │
│              └──────┬─────┬──────┘                   │
│                     │     │                           │
│            ┌────────▼─┐ ┌─▼───────────┐             │
│            │ Plant.js  │ │SaveManager  │             │
│            │ (model)   │ │(LocalStorage│             │
│            └──────────┘ └─────────────┘             │
└──────────────────────────────────────────────────────┘
```

---

## Data Models

### Plant

```js
// src/models/Plant.js
class Plant {
  constructor(speciesId) {
    this.speciesId = speciesId;          // 'sunflower' | 'cactus' | 'snakeplant'
    this.stage = 0;                      // 0=Seed, 1=Sprout, 2=Flower
    this.stats = { water: 100, fertilizer: 100, sun: 100 };
    this.equippedCosmetics = [];         // string[] of cosmetic IDs
    this.createdAt = Date.now();
    this.lastTickAt = Date.now();
    this.alive = true;
  }

  // Returns current health tier for sprite selection
  getHealthState() {
    const min = Math.min(this.stats.water, this.stats.fertilizer, this.stats.sun);
    if (min > 60) return 'healthy';
    if (min > 25) return 'medium';
    return 'critical';
  }

  // Apply time-based decay (called every game tick or on load)
  applyDecay(deltaSeconds, weather, location, config) { ... }

  isDead() {
    return Object.values(this.stats).some(v => v <= 0);
  }

  checkGrowth() { ... } // Advances stage if thresholds met
}
```

### Plant Species Config

```js
// src/config/constants.js
export const PLANT_CONFIGS = {
  sunflower: {
    name: 'Girasol',
    description: 'Ama el sol. Necesita luz constante para prosperar.',
    resistances: {
      water:      0.8,   // medium — decays at 80% of base rate
      fertilizer: 1.2,   // low resistance — decays 20% faster
      sun:        1.5,   // very low — decays 50% faster without sun
    },
    stageThresholds: { sprout: { days: 3, avgStats: 50 }, flower: { days: 7, avgStats: 60 } }
  },
  cactus: {
    name: 'Cactus',
    description: 'Sobrevive sin agua por mucho tiempo. No tolera el frío.',
    resistances: {
      water:      0.3,   // very high resistance — barely needs water
      fertilizer: 0.9,
      sun:        0.7,
    },
    stageThresholds: { sprout: { days: 5, avgStats: 40 }, flower: { days: 12, avgStats: 55 } }
  },
  snakeplant: {
    name: 'Snake Plant',
    description: 'Resistente y adaptable. Necesita poco abono.',
    resistances: {
      water:      0.8,
      fertilizer: 0.3,   // very high resistance — barely needs fertilizer
      sun:        0.8,
    },
    stageThresholds: { sprout: { days: 4, avgStats: 45 }, flower: { days: 9, avgStats: 55 } }
  }
};

export const BASE_DECAY_RATE = 1.0;        // stat points per minute at normal conditions
export const DECAY_TICK_MS   = 5000;       // run decay every 5 seconds

export const WEATHER_MULTIPLIERS = {
  sunny:  { water: 1.0, fertilizer: 1.0, sun: 0.3  },  // sun barely decays
  rainy:  { water: 0.2, fertilizer: 1.0, sun: 1.3  },  // water barely decays, sun decays faster
  snowy:  { water: 1.25, fertilizer: 1.25, sun: 1.25 }, // everything faster
  cloudy: { water: 1.0, fertilizer: 1.0, sun: 1.1  },  // slight sun penalty
};

export const LOCATION_MODIFIERS = {
  interior: { sun: 2.0 },    // sun decays 2x faster indoors (blocked light)
  exterior: {}
};
```

### GameState

```js
// src/models/GameState.js
class GameState {
  constructor() {
    this.plant = null;              // Plant instance
    this.coins = 0;
    this.location = 'interior';     // 'interior' | 'exterior'
    this.weather = 'sunny';
    this.ownedCosmetics = [];       // string[] of cosmetic IDs
    this.weatherTimer = 0;          // seconds until next weather change
  }

  serialize() { ... }               // Returns plain object for JSON.stringify
  static deserialize(data) { ... }  // Reconstructs GameState from JSON
}
```

### Save Structure (LocalStorage)

```json
{
  "version": 1,
  "savedAt": 1714500000000,
  "plant": {
    "speciesId": "sunflower",
    "stage": 1,
    "stats": { "water": 72, "fertilizer": 55, "sun": 88 },
    "equippedCosmetics": ["hat_sunhat"],
    "createdAt": 1714400000000,
    "lastTickAt": 1714499990000,
    "alive": true
  },
  "coins": 240,
  "location": "exterior",
  "weather": "cloudy",
  "ownedCosmetics": ["hat_sunhat", "glasses_round"],
  "weatherTimer": 180
}
```

---

## Scene Flow Diagram

```
Boot
 └─► MenuScene
      ├─ [No save] ──► SelectScene ──► InteriorScene
      └─ [Save found] ──────────────► InteriorScene
                                           │
                         ┌─────────────────┼─────────────────┐
                         ▼                 ▼                 ▼
                   ExteriorScene       ShopScene       WardrobeScene
                         │
                         └──► Minigame_[Name] ──► InteriorScene
```

---

## Real-Time Decay System

Decay runs on a Phaser `time.addEvent` loop every `DECAY_TICK_MS` milliseconds.

```js
// In InteriorScene / ExteriorScene create():
this.decayTimer = this.time.addEvent({
  delay: DECAY_TICK_MS,
  callback: () => {
    const delta = DECAY_TICK_MS / 1000; // seconds
    gameState.plant.applyDecay(delta, gameState.weather, gameState.location, PLANT_CONFIGS[gameState.plant.speciesId]);
    this.ui.updateStatBars(gameState.plant.stats);
    if (gameState.plant.isDead()) this.triggerDeath();
  },
  loop: true
});
```

**Offline decay**: On load, calculate `(Date.now() - lastTickAt) / 1000` seconds elapsed and call `applyDecay` once with the full offline delta before resuming the live timer.

---

## Weather System

- Weather changes on a random interval between 3–8 minutes.
- Weights: Sunny 35%, Cloudy 30%, Rainy 25%, Snowy 10%.
- Weather change triggers: background swap, weather overlay effect, HUD icon update.
- Particle systems: Phaser `ParticleEmitter` for rain and snow effects (only rendered in `ExteriorScene`).

---

## Minigame Integration

Each minigame is an independent Phaser Scene:

1. Parent scene calls `this.scene.start('Minigame_Name', { returnScene: 'InteriorScene' })`.
2. SaveManager saves state before launch.
3. Minigame ends by emitting result: `this.scene.start(data.returnScene, { coinsEarned: N })`.
4. Parent scene receives `coinsEarned` in `init(data)` and adds coins to `GameState`.

---

## Cosmetics Rendering

The plant is rendered using **layered sprites**:

```
Layer 0: Background decoration (pot, soil)
Layer 1: Plant body sprite (species + stage + healthState)
Layer 2+: Cosmetic overlays (one layer per equipped cosmetic, sorted by z-index)
```

All layers are children of a Phaser `Container` so they move together. When cosmetics change, only layers 2+ are cleared and redrawn.

Sprite key naming:
```
plant_{speciesId}_stage{0|1|2}_{healthy|medium|critical}
cosmetic_{cosmeticId}
```

---

## UI Components

### StatBar

Reusable component that renders a labeled progress bar.
- Props: `label`, `value` (0–100), `color`
- Changes color: green (>60), yellow (26–60), red (≤25)
- Animates value changes with a tween

### HUD Layout (Interior/Exterior)

```
┌──────────────────────────────────────────────┐
│ 🌤️ [weather icon]           💰 [coins] 🌿    │
├──────────────────────────────────────────────┤
│                                              │
│              [plant sprite]                  │
│                                              │
├──────────────────────────────────────────────┤
│  💧 [====== Water ======]  80               │
│  🌱 [======= Fert. ======]  65               │
│  ☀️  [======== Sun ========]  92              │
├──────────────────────────────────────────────┤
│  [💧 Water]  [🌱 Fertilize]  [🏠/🌳 Move]   │
│  [🎮 Minigames]  [🛍 Shop]  [👗 Wardrobe]    │
└──────────────────────────────────────────────┘
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| LocalStorage unavailable | Warn user, run without saving |
| Corrupt save data | Show error modal, offer "New Game" |
| Missing asset | Phaser fallback texture shown, console warning |
| Minigame crash | Catch error, return to main scene, no coins awarded |
| All stats hit 0 simultaneously | Treat as death, pick stat alphabetically for death message |

---

## Testing Strategy

Since this is a school project, testing is manual:

- **Stat decay**: Set `DECAY_TICK_MS = 500` and `BASE_DECAY_RATE = 10` in dev mode to fast-test.
- **Death screen**: Force a stat to 0 via browser console.
- **Save/load**: Manually clear LocalStorage and reload to verify new-game flow.
- **Offline decay**: Set `lastTickAt` to 10 minutes ago in LocalStorage and reload.
- **Weather effects**: Add a dev panel shortcut key to cycle weather instantly.
