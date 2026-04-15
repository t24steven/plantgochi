export const SCENES = {
  BOOT:           'BootScene',
  MENU:           'MenuScene',
  SELECT:         'SelectScene',
  GAME:           'GameScene',
  YARD:           'YardScene',
  GAME_OVER:      'GameOverScene',
  MINIGAMES_MENU: 'MinigamesMenuScene',
  FERTILIZER:     'FertilizerScene',
  BUG_DEFENSE:    'BugDefenseScene',
};

export const STATS = {
  MAX:             100,
  MIN:             0,
  DECAY_INTERVAL:  10000,  // cada 15s (antes 30s)
  DECAY_AMOUNT:    6,      // -6 por tick (antes -5)
  DEATH_THRESHOLD: 0,
};

export const GROWTH = {
  STAGE_1_THRESHOLD: 100000,
  STAGE_2_THRESHOLD: 300000,
  HEALTHY_THRESHOLD: 30,  // más permisivo — cactus empieza con fertilizer:40
};

export const WEATHER = {
  TYPES:   ['sunny', 'cloudy', 'rainy', 'snowy'],
  WEIGHTS: [35, 30, 25, 10],
  MIN_DURATION: 30000,   // 30s (antes 1 min)
  MAX_DURATION: 60000,   // 1 min (antes 2 min)
  MULTIPLIERS: {
    sunny:  { water: 1.5, sun: 0.5,  fertilizer: 1.0 },
    cloudy: { water: 1.0, sun: 1.5,  fertilizer: 1.0 },
    rainy:  { water: 0.0, sun: 2.0,  fertilizer: 0.8 },
    snowy:  { water: 0.5, sun: 2.0,  fertilizer: 1.5 },
  }
};

export const COLORS = {
  danger: 0xe74c3c,
};
