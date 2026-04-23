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

// ══════════════════════════════════════════════════════════
//  VARIABLES DEL JUEGO — modifica aquí para ajustar balance
// ══════════════════════════════════════════════════════════

export const STATS = {
  MAX:             100,
  MIN:             0,
  // Cada cuántos ms bajan los stats (10000 = cada 10 segundos)
  DECAY_INTERVAL:  10000,
  // Cuánto bajan por tick (6 = -6% cada tick)
  DECAY_AMOUNT:    6,
  DEATH_THRESHOLD: 0,
};

export const GROWTH = {
  // Tiempo acumulado con promedio de stats ≥ 70% para subir de etapa (ms)
  // Con DECAY_INTERVAL=10000: necesita 3 ticks = 30 segundos acumulados
  // El tiempo NO se resetea si bajan los stats
  STAGE_TIME_REQUIRED: 30000,
  // Promedio mínimo de stats para acumular tiempo de crecimiento (%)
  GROWTH_AVG_THRESHOLD: 70,
};

export const WEATHER = {
  TYPES:   ['sunny', 'cloudy', 'rainy', 'snowy'],
  // Probabilidad relativa de cada clima (mayor = más frecuente)
  WEIGHTS: [35, 30, 25, 10],
  // Duración mínima de cada clima (ms)
  MIN_DURATION: 30000,
  // Duración máxima de cada clima (ms)
  MAX_DURATION: 60000,
  // Multiplicadores de decay por clima y stat
  // 0.0 = no baja, 1.0 = normal, 2.0 = baja el doble
  MULTIPLIERS: {
    sunny:  { water: 1.5, sun: 0.5,  fertilizer: 1.0 },
    cloudy: { water: 1.0, sun: 1.5,  fertilizer: 1.0 },
    rainy:  { water: 0.0, sun: 2.0,  fertilizer: 0.8 },
    snowy:  { water: 0.5, sun: 2.0,  fertilizer: 1.5 },
  }
};

// ── Minijuego: Catch the Fertilizer ──────────────────────
export const MINIGAME_FERTILIZER = {
  // Monedas ganadas por cada bolsa atrapada
  COINS_PER_BAG:    1,
  // Velocidad inicial de caída de bolsas (px/s)
  INITIAL_SPEED:    200,
  // Velocidad máxima
  MAX_SPEED:        480,
  // Incremento de velocidad cada 5 bolsas
  SPEED_INCREMENT:  25,
  // Delay inicial entre bolsas (ms)
  INITIAL_DELAY:    1200,
  // Delay mínimo entre bolsas (ms)
  MIN_DELAY:        500,
  // Reducción de delay cada 5 bolsas
  DELAY_DECREMENT:  100,
};

// ── Minijuego: Kill the Bugs ──────────────────────────────
export const MINIGAME_BUGS = {
  // Monedas ganadas por cada bug eliminado
  COINS_PER_BUG:       5,
  // Velocidad inicial de los bugs (px/s)
  INITIAL_SPEED_MIN:   100,
  INITIAL_SPEED_MAX:   180,
  // Velocidad máxima
  MAX_SPEED_MIN:       280,
  MAX_SPEED_MAX:       360,
  // Delay inicial entre spawns (ms)
  INITIAL_DELAY:       1600,
  // Delay mínimo entre spawns (ms)
  MIN_DELAY:           600,
  // Cada cuántos bugs sube la dificultad
  WAVE_SIZE:           10,
};

export const COLORS = {
  danger: 0xe74c3c,
};
