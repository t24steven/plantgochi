---
inclusion: always
---

# Plantgochi — Product Overview

Plantgochi is a browser-based desktop virtual pet game where the player cares for a plant, keeping it alive and healthy in real time. Inspired by Tamagotchi, the core loop is: monitor plant stats → perform care actions → earn coins through minigames → spend coins on cosmetics → customize the plant.

## Target Users

Students and casual players who enjoy relaxing, low-pressure games with a personal customization component.

## Core Features

- **Plant selection**: Choose one of three plant species at game start (Sunflower, Cactus, Snake Plant), each with unique stat resistances.
- **Real-time stat decay**: Three stats (Water, Fertilizer, Sun) decay at medium speed. If any stat reaches 0, the plant dies.
- **Care actions**: Water, fertilize, and control sun exposure by moving the plant between indoor and outdoor locations.
- **Growth stages**: Each plant progresses through three stages — Seed → Sprout → Flower — based on overall stat health over time.
- **Weather system**: Four weather types (Sunny, Rainy, Snowy, Cloudy) dynamically affect stat decay rates depending on the plant's location.
- **Minigames**: Mini-games are the only way to earn in-game coins.
- **Cosmetics system**: A shop to buy cosmetic accessories for the plant; a wardrobe to equip/unequip them.
- **Auto-save**: All game state is automatically saved to LocalStorage.

## Game Objective

Infinite survival — keep the plant alive as long as possible. The game ends when any stat reaches 0.

## Screens / Scenes

1. **Main Menu / Game Info** — entry point, game rules
2. **Plant Selection** — pick from Sunflower, Cactus, or Snake Plant
3. **House Interior** — plant is indoors; sun exposure is blocked
4. **House Exterior** — plant is outdoors; weather has full effect
5. **Cosmetics Shop** — browse and buy accessories with coins
6. **Cosmetics Wardrobe** — equip or unequip owned accessories

## Business Goals

- Complete and deliver a functional school project
- Demonstrate mastery of Phaser 3, game state management, and UI/UX design
- Minimum viable product: plant selection + minigames + shop + wardrobe
