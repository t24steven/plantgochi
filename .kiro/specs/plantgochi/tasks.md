# Plantgochi — Implementation Tasks

> Tasks are ordered by dependency. Complete each group before moving to the next.
> Mark tasks as complete by changing `[ ]` to `[x]`.

---

## Phase 1 — Core Foundation

- [ ] 1. Set up project constants and plant configuration data
  - [ ] 1.1 Create `src/config/constants.js` with `PLANT_CONFIGS` (sunflower, cactus, snakeplant) including decay resistances and stage thresholds
  - [ ] 1.2 Add `BASE_DECAY_RATE`, `DECAY_TICK_MS`, `WEATHER_MULTIPLIERS`, and `LOCATION_MODIFIERS` to constants
  - [ ] 1.3 Verify all three plant configs have unique resistance values that create meaningful gameplay differences

- [ ] 2. Implement Plant model
  - [ ] 2.1 Create `src/models/Plant.js` class with `speciesId`, `stage`, `stats`, `equippedCosmetics`, `createdAt`, `lastTickAt`, and `alive` properties
  - [ ] 2.2 Implement `applyDecay(deltaSeconds, weather, location, config)` applying weather multipliers, location modifiers, and species resistances
  - [ ] 2.3 Implement `isDead()` returning true if any stat ≤ 0
  - [ ] 2.4 Implement `getHealthState()` returning `'healthy'`, `'medium'`, or `'critical'`
  - [ ] 2.5 Implement `checkGrowth()` advancing stage when time and avg-stats thresholds are met; stage never regresses
  - [ ] 2.6 Write browser-console unit tests for decay math on all three plant types

- [ ] 3. Implement GameState singleton
  - [ ] 3.1 Create `src/models/GameState.js` with `plant`, `coins`, `location`, `weather`, `ownedCosmetics`, and `weatherTimer` properties
  - [ ] 3.2 Implement `serialize()` returning a plain JSON-safe object
  - [ ] 3.3 Implement static `deserialize(data)` reconstructing a full GameState (including a Plant instance) from saved JSON
  - [ ] 3.4 Register GameState instance in Phaser registry on game boot so all scenes can access it via `this.registry.get('gameState')`

- [ ] 4. Implement SaveManager
  - [ ] 4.1 Create `src/utils/SaveManager.js` with `save(gameState)` writing to `localStorage['plantgochi_save']`
  - [ ] 4.2 Implement `load()` returning a deserialized GameState or `null` if no save or corrupt data
  - [ ] 4.3 Implement `clear()` removing the save key
  - [ ] 4.4 Wrap all LocalStorage calls in try/catch; log errors and return gracefully
  - [ ] 4.5 Add save version field (`version: 1`) for future migration support

---

## Phase 2 — Scene Infrastructure

- [ ] 5. Register all scenes in Phaser config
  - [ ] 5.1 Create `src/main.js` with Phaser game config: `pixelArt: true`, WebGL renderer, fixed resolution (e.g., 800×600), all scenes registered
  - [ ] 5.2 Add `index.html` entry point loading the game bundle
  - [ ] 5.3 Confirm game boots without errors in browser

- [ ] 6. Implement MenuScene
  - [ ] 6.1 Check for a valid save on scene `create()`; if found, show "Continue" and "New Game" buttons; if not, auto-navigate to SelectScene
  - [ ] 6.2 "Continue" loads GameState from SaveManager and starts `InteriorScene` or `ExteriorScene` based on saved location
  - [ ] 6.3 "New Game" calls `SaveManager.clear()` and navigates to SelectScene
  - [ ] 6.4 Display game title and brief controls/info panel

- [ ] 7. Implement SelectScene
  - [ ] 7.1 Render three plant option cards (Sunflower, Cactus, Snake Plant) each showing name, description, and resistance stats
  - [ ] 7.2 On plant click, show confirmation dialog: "Start with [Plant Name]?"
  - [ ] 7.3 On confirm, create a new `Plant` and `GameState`, call `SaveManager.save()`, and navigate to `InteriorScene`
  - [ ] 7.4 Add visual hover and selection states for each plant card

---

## Phase 3 — Core Gameplay Loop

- [ ] 8. Implement real-time decay loop in gameplay scenes
  - [ ] 8.1 Create a shared `startDecayLoop(scene, gameState)` helper in `src/utils/Timer.js`
  - [ ] 8.2 Loop runs every `DECAY_TICK_MS`, calls `plant.applyDecay()`, updates stat bar UI, checks `isDead()`, checks `checkGrowth()`
  - [ ] 8.3 On load, calculate offline elapsed seconds (`Date.now() - plant.lastTickAt`) and apply offline decay before starting the live loop
  - [ ] 8.4 Auto-save triggers every 30 seconds within the loop

- [ ] 9. Implement HUD (stat bars, coins, weather icon)
  - [ ] 9.1 Create `src/ui/StatBar.js` as a reusable Phaser GameObjects container with label, progress bar, and numeric value
  - [ ] 9.2 Bar color changes: green (>60), yellow (26–60), red (≤25) with smooth tween animation on value change
  - [ ] 9.3 Display coin counter in HUD top-right
  - [ ] 9.4 Display weather icon in HUD top-left; icon updates on weather change

- [ ] 10. Implement care action buttons
  - [ ] 10.1 Create Water button: on click, increase `plant.stats.water` by 25 (capped at 100), play watering animation, auto-save
  - [ ] 10.2 Create Fertilize button: on click, increase `plant.stats.fertilizer` by 25 (capped at 100), play fertilize animation, auto-save
  - [ ] 10.3 Buttons have a short cooldown (3 seconds) to prevent spam; show cooldown indicator

- [ ] 11. Implement location switching (Interior ↔ Exterior)
  - [ ] 11.1 "Go Outside" button in InteriorScene: sets `gameState.location = 'exterior'`, saves, starts ExteriorScene
  - [ ] 11.2 "Go Inside" button in ExteriorScene: sets `gameState.location = 'interior'`, saves, starts InteriorScene
  - [ ] 11.3 Background art changes per scene (indoor vs outdoor pixel art)

- [ ] 12. Implement plant sprite rendering with health states
  - [ ] 12.1 Create `src/ui/PlantSprite.js` that selects the correct texture key based on `speciesId`, `stage`, and `getHealthState()`
  - [ ] 12.2 Update sprite when health state changes (smooth fade/swap transition)
  - [ ] 12.3 Sprite key format: `plant_{speciesId}_stage{0|1|2}_{healthy|medium|critical}`

- [ ] 13. Implement plant death flow
  - [ ] 13.1 On `isDead()` returning true, stop decay loop immediately
  - [ ] 13.2 Show death overlay/screen with message indicating which stat reached 0 first
  - [ ] 13.3 Play death animation on plant sprite
  - [ ] 13.4 Show "New Game" button that calls `SaveManager.clear()` and navigates to SelectScene

- [ ] 14. Implement plant growth stage transitions
  - [ ] 14.1 When `checkGrowth()` advances stage, swap plant sprite to new stage sprite
  - [ ] 14.2 Play stage-up celebration animation (particle burst or sprite animation)
  - [ ] 14.3 Show a brief toast notification: "¡Tu planta creció!" (stage name)

---

## Phase 4 — Weather System

- [ ] 15. Implement weather cycle
  - [ ] 15.1 On scene create, start a weather timer (random 3–8 minutes) using Phaser `time.addEvent`
  - [ ] 15.2 On timer trigger, pick next weather with weighted random: Sunny 35%, Cloudy 30%, Rainy 25%, Snowy 10%
  - [ ] 15.3 Update `gameState.weather`, HUD icon, and trigger background/overlay change
  - [ ] 15.4 Persist `weatherTimer` remaining seconds in GameState so weather cycle resumes correctly after save/load

- [ ] 16. Implement weather visual effects (ExteriorScene only)
  - [ ] 16.1 Rain: Phaser ParticleEmitter with raindrop sprites falling from top
  - [ ] 16.2 Snow: ParticleEmitter with slow-falling snowflake sprites
  - [ ] 16.3 Sunny: bright background tint or sun rays overlay
  - [ ] 16.4 Cloudy: slight gray overlay on background
  - [ ] 16.5 Transitions between weather states use a fade-in/fade-out of overlays

---

## Phase 5 — Minigames & Economy

- [ ] 17. Implement minigame launch flow
  - [ ] 17.1 Add "Minigames" button to HUD in gameplay scenes
  - [ ] 17.2 On click, show a panel listing available minigames with name and description
  - [ ] 17.3 On minigame selected, call `SaveManager.save()` then `this.scene.start('Minigame_Name', { returnScene })`
  - [ ] 17.4 On return from minigame, add earned coins to `gameState.coins`, auto-save, and update HUD

- [ ] 18. Implement Minigame #1 (define specific game mechanics based on existing code)
  - [ ] 18.1 Scene initializes with return scene data
  - [ ] 18.2 Game loop with clear win/fail condition
  - [ ] 18.3 On end: show result screen with coins earned; provide "Return" button
  - [ ] 18.4 Coins awarded scale with performance (e.g., score brackets)

- [ ] 19. Implement Minigame #2 (if applicable based on existing code)
  - [ ] 19.1 Follow same integration pattern as Minigame #1

---

## Phase 6 — Cosmetics System

- [ ] 20. Define cosmetics catalog
  - [ ] 20.1 Create `src/data/cosmetics.js` listing all cosmetic items: `{ id, name, price, spriteKey, zIndex }`
  - [ ] 20.2 Ensure at least 6 cosmetic items available for the MVP

- [ ] 21. Implement cosmetics rendering on plant
  - [ ] 21.1 Update `PlantSprite.js` to support a `Container` with plant body as layer 1 and cosmetic overlays as layers 2+
  - [ ] 21.2 `equipCosmetic(id)` adds cosmetic sprite overlay; `unequipCosmetic(id)` removes it
  - [ ] 21.3 Cosmetics persist through scene transitions (loaded from `plant.equippedCosmetics`)

- [ ] 22. Implement ShopScene
  - [ ] 22.1 Load cosmetics catalog and render item cards (sprite preview, name, price)
  - [ ] 22.2 Items the player can afford show an active "Buy" button; others are grayed out
  - [ ] 22.3 Already-owned items show "Owned" badge instead of price
  - [ ] 22.4 On purchase: deduct coins, add item to `gameState.ownedCosmetics`, auto-save, refresh UI
  - [ ] 22.5 Add "Back" button returning to the previous gameplay scene

- [ ] 23. Implement WardrobeScene
  - [ ] 23.1 Display all owned cosmetics with equip/unequip toggle
  - [ ] 23.2 Show live plant preview in the wardrobe reflecting current equipped state
  - [ ] 23.3 On equip/unequip: update `plant.equippedCosmetics`, re-render preview, auto-save
  - [ ] 23.4 Add "Back" button returning to previous scene

---

## Phase 7 — Polish & QA

- [ ] 24. Audio implementation
  - [ ] 24.1 Add background music loop (one track per scene type: interior, exterior, shop, minigame)
  - [ ] 24.2 Add SFX for: watering, fertilizing, button clicks, stage-up, death, coin earned
  - [ ] 24.3 Add mute/unmute toggle button in HUD

- [ ] 25. Animations and visual polish
  - [ ] 25.1 Add idle animation to plant sprite (gentle bounce or sway)
  - [ ] 25.2 Add button press feedback (scale-down tween on click)
  - [ ] 25.3 Ensure all scene transitions use fade-in/fade-out
  - [ ] 25.4 Verify cosmetic z-ordering looks correct with all equipped combinations

- [ ] 26. Accessibility and UX
  - [ ] 26.1 All interactive buttons have visible hover and pressed states
  - [ ] 26.2 Critical stat warning: flash or pulse animation on stat bar when stat ≤ 25
  - [ ] 26.3 Pause decay when a modal/dialog is open so player isn't penalized during UI interactions
  - [ ] 26.4 Add a settings button with volume controls

- [ ] 27. Final QA checklist
  - [ ] 27.1 Test new game flow end-to-end: launch → select plant → care → grow → die → new game
  - [ ] 27.2 Test save/load: close browser mid-game, reopen, verify state is exactly restored
  - [ ] 27.3 Test offline decay: modify `lastTickAt` in DevTools, reload, verify stats decreased
  - [ ] 27.4 Test all three plants have different feel due to resistances
  - [ ] 27.5 Test all four weather types trigger correct visual and stat effects
  - [ ] 27.6 Test cosmetics: buy, equip, unequip, verify persistence across scenes
  - [ ] 27.7 Test on Chrome, Firefox, and Edge at 1280×720 and 1920×1080 resolutions
  - [ ] 27.8 Verify no console errors in production build
