# Plantgochi — Requirements

## Overview

Plantgochi is a real-time virtual plant care game built with Phaser 3 for desktop browsers. The player selects a plant, keeps its stats alive through care actions, earns coins in minigames, and customizes the plant with cosmetics.

---

## User Stories

### US-01: Plant Selection

**As a** player,
**I want** to choose one of three plant species at the start of the game,
**So that** I can experience a unique care challenge suited to my preference.

#### Acceptance Criteria

1. GIVEN the game has no active save WHEN the player opens the game THEN the Plant Selection screen is displayed.
2. GIVEN the Selection screen is open WHEN the player views a plant option THEN they see the plant's name, a brief species description, and its three resistance values (Water, Fertilizer, Sun).
3. GIVEN the Selection screen is open WHEN the player clicks on a plant THEN a confirmation prompt appears before starting the game.
4. GIVEN the player confirms their choice WHEN the game starts THEN the plant is initialized with full stats (100/100/100) at Seed stage and the Interior scene loads.
5. GIVEN an existing save exists WHEN the game boots THEN the Selection screen is skipped and the saved game state is restored.

---

### US-02: Real-Time Stat Decay

**As a** player,
**I want** my plant's stats to decrease gradually over time,
**So that** I must actively care for it to keep it alive.

#### Acceptance Criteria

1. GIVEN the game is running WHEN time passes THEN Water, Fertilizer, and Sun stats each decrease at their respective species-specific decay rate.
2. GIVEN the plant is indoors WHEN any weather is active THEN Sun stat does not receive weather bonuses.
3. GIVEN the plant is outdoors and weather is Rainy WHEN time passes THEN Water stat decays slower (weather provides passive water).
4. GIVEN the plant is outdoors and weather is Sunny WHEN time passes THEN Sun stat decays slower (passive sun exposure).
5. GIVEN the plant is outdoors and weather is Snowy WHEN time passes THEN all stats decay 25% faster.
6. GIVEN the plant is outdoors and weather is Cloudy WHEN time passes THEN stats decay at normal rates.
7. GIVEN the game tab is inactive or the browser is closed WHEN the player returns THEN the elapsed offline time is calculated and stats are reduced accordingly (offline decay).

---

### US-03: Plant Death

**As a** player,
**I want** to know when my plant has died,
**So that** I understand the consequence of neglect and can start a new game.

#### Acceptance Criteria

1. GIVEN any stat reaches 0 WHEN the decay tick runs THEN the plant is marked as dead and the death screen is triggered immediately.
2. GIVEN the plant is dead WHEN the death screen is shown THEN the player sees a message indicating which stat caused the death.
3. GIVEN the death screen is shown WHEN the player clicks "New Game" THEN the save is cleared and the Plant Selection screen loads.
4. GIVEN any stat is between 1 and 25 WHEN the HUD is rendered THEN that stat bar is displayed in red as a visual warning.

---

### US-04: Care Actions

**As a** player,
**I want** to water, fertilize, and control sun exposure for my plant,
**So that** I can keep its stats from reaching zero.

#### Acceptance Criteria

1. GIVEN the player is in the Interior or Exterior scene WHEN they click the Water button THEN the Water stat increases by a fixed amount (not exceeding 100) and a watering animation plays.
2. GIVEN the player is in the Interior or Exterior scene WHEN they click the Fertilize button THEN the Fertilizer stat increases by a fixed amount and a fertilizing animation plays.
3. GIVEN the player is in the Interior scene WHEN they click "Go Outside" THEN the scene transitions to the Exterior scene and the plant's location is updated to `exterior`.
4. GIVEN the player is in the Exterior scene WHEN they click "Go Inside" THEN the scene transitions to the Interior scene and the plant's location is updated to `interior`.
5. GIVEN the plant is in the Exterior scene WHEN weather is Sunny THEN a visual sun glow effect is shown on the plant.
6. GIVEN the player performs any care action WHEN the action completes THEN the game state is saved automatically.

---

### US-05: Plant Growth Stages

**As a** player,
**I want** my plant to visually grow through stages as I care for it,
**So that** I feel rewarded for keeping it healthy.

#### Acceptance Criteria

1. GIVEN a new plant is started WHEN it is first created THEN its stage is `0` (Seed) and the Seed sprite is displayed.
2. GIVEN the plant has been alive for a defined time threshold with average stats above 50 WHEN the stage check runs THEN the plant advances to stage `1` (Sprout) and the Sprout sprite is displayed.
3. GIVEN the plant is in stage 1 and has been alive for a second time threshold with average stats above 60 WHEN the stage check runs THEN the plant advances to stage `2` (Flower) and the Flower sprite is displayed.
4. GIVEN the plant advances a stage WHEN the transition occurs THEN a celebratory animation and sound effect play.
5. GIVEN the plant's stats drop below the threshold after advancing WHEN stage check runs THEN the stage does NOT regress (growth is permanent once reached).

---

### US-06: Plant Visual State

**As a** player,
**I want** my plant to visually express its current health,
**So that** I can quickly understand its condition at a glance.

#### Acceptance Criteria

1. GIVEN all stats are above 60 WHEN the plant is rendered THEN the `healthy` sprite variant is shown.
2. GIVEN any stat is between 26 and 60 WHEN the plant is rendered THEN the `medium` sprite variant is shown.
3. GIVEN any stat is between 1 and 25 WHEN the plant is rendered THEN the `critical` sprite variant is shown (wilted/sad appearance).
4. GIVEN the plant's state changes WHEN the sprite update runs THEN the transition between variants is smooth (fade or swap).

---

### US-07: Weather System

**As a** player,
**I want** the weather to change dynamically,
**So that** the game environment feels alive and adds strategic variety.

#### Acceptance Criteria

1. GIVEN the game is running WHEN a weather cycle timer triggers THEN the weather changes to one of: Sunny, Rainy, Snowy, or Cloudy (randomly weighted).
2. GIVEN the weather changes WHEN the transition occurs THEN the background visuals and any weather overlay effects update to reflect the new weather.
3. GIVEN the current weather WHEN the HUD is displayed THEN a weather icon is visible showing the current weather type.
4. GIVEN the weather is Snowy WHEN the player is in the Exterior scene THEN a snow particle effect is rendered on screen.
5. GIVEN the weather is Rainy WHEN the player is in the Exterior scene THEN a rain particle effect is rendered on screen.

---

### US-08: Minigames & Coin Economy

**As a** player,
**I want** to earn coins by playing minigames,
**So that** I can buy cosmetics for my plant.

#### Acceptance Criteria

1. GIVEN the player is in the Interior or Exterior scene WHEN they click the "Minigames" button THEN a minigame selection panel is shown with available minigames.
2. GIVEN the player selects a minigame WHEN the minigame scene loads THEN the current game state is saved before launching.
3. GIVEN a minigame ends WHEN the result screen is shown THEN the earned coins (based on performance) are displayed and added to the player's total.
4. GIVEN the player returns from a minigame WHEN the main scene reloads THEN the updated coin balance is shown in the HUD.
5. GIVEN the player has never played a minigame WHEN coins are 0 THEN the Shop button shows a tooltip: "Play minigames to earn coins!"

---

### US-09: Cosmetics Shop

**As a** player,
**I want** to browse and buy cosmetic accessories for my plant,
**So that** I can personalize its appearance.

#### Acceptance Criteria

1. GIVEN the player opens the Shop WHEN it loads THEN all available cosmetic items are listed with their name, preview image, and coin price.
2. GIVEN the player views an item WHEN they have enough coins THEN a "Buy" button is active.
3. GIVEN the player views an item WHEN they do not have enough coins THEN the "Buy" button is disabled and grayed out.
4. GIVEN the player clicks "Buy" on an affordable item WHEN confirmed THEN the coins are deducted, the item is added to owned cosmetics, and the item is marked as "Owned" in the shop.
5. GIVEN the player already owns an item WHEN they view it in the shop THEN it is marked as "Owned" and cannot be purchased again.

---

### US-10: Cosmetics Wardrobe

**As a** player,
**I want** to equip and unequip cosmetics on my plant,
**So that** I can style it however I like.

#### Acceptance Criteria

1. GIVEN the player opens the Wardrobe WHEN it loads THEN all owned cosmetic items are shown.
2. GIVEN the player clicks an unequipped cosmetic WHEN confirmed THEN it is equipped to the plant and rendered as an overlay on the plant sprite.
3. GIVEN the player clicks an equipped cosmetic WHEN confirmed THEN it is unequipped and removed from the plant's visual.
4. GIVEN the player equips a cosmetic WHEN the plant is rendered in any scene THEN the cosmetic is visible on the plant sprite.
5. GIVEN the player changes location or weather WHEN scenes transition THEN equipped cosmetics remain visible on the plant.

---

### US-11: Auto-Save

**As a** player,
**I want** my game to save automatically,
**So that** I never lose my progress.

#### Acceptance Criteria

1. GIVEN the game is running WHEN 30 seconds have passed THEN the full game state is saved to LocalStorage automatically.
2. GIVEN any care action, purchase, or cosmetic change occurs WHEN the action completes THEN the game state is saved immediately.
3. GIVEN the player opens the game WHEN a valid save is found in LocalStorage THEN the game is restored to the exact state it was saved in.
4. GIVEN a save is loaded WHEN stat decay resumes THEN offline time since last save is calculated and applied to stats before play resumes.
5. GIVEN the save data is corrupt or unreadable WHEN the game boots THEN the player is shown an error message and offered to start a new game.
