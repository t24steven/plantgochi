/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           PLANTGOCHI — CHEAT CONSOLE                ║
 * ║  Pega este archivo en la consola del navegador o    ║
 * ║  impórtalo en main.js durante desarrollo.           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Uso rápido — escribe en la consola del navegador:
 *   ptg.water(100)        → poner agua a 100
 *   ptg.addCoins(500)     → dar 500 monedas
 *   ptg.grow()            → subir etapa de la planta
 *   ptg.weather('rainy')  → cambiar clima
 *   ptg.help()            → ver todos los comandos
 */

import { GameState }    from '../services/GameState.js';
import { EventBus, EVENTS } from '../services/EventBus.js';

// ── Obtener la escena activa de juego (Game o Yard) ───────
function _getScene() {
  const g = window.game;
  if (!g) { console.warn('[ptg] window.game no encontrado'); return null; }
  for (const key of ['GameScene', 'YardScene']) {
    const s = g.scene.getScene(key);
    if (s && g.scene.isActive(key)) return s;
  }
  console.warn('[ptg] No hay escena de juego activa (GameScene o YardScene)');
  return null;
}

function _getStats() {
  const s = _getScene();
  return s?.statsManager ?? null;
}

// ══════════════════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════════════════

/** Establece el agua a un valor (0-100) */
function water(value = 100) {
  const sm = _getStats();
  if (!sm) return;
  sm._stopped = false; // forzar aunque esté parado
  sm.set('water', value);
  console.log(`[ptg] 💧 water → ${sm.water}`);
}

/** Establece el sol a un valor (0-100) */
function sun(value = 100) {
  const sm = _getStats();
  if (!sm) return;
  sm._stopped = false;
  sm.set('sun', value);
  console.log(`[ptg] ☀️  sun → ${sm.sun}`);
}

/** Establece el fertilizante a un valor (0-100) */
function fertilizer(value = 100) {
  const sm = _getStats();
  if (!sm) return;
  sm._stopped = false;
  sm.set('fertilizer', value);
  console.log(`[ptg] 🌱 fertilizer → ${sm.fertilizer}`);
}

/** Pone todos los stats a 100 */
function fillAll() {
  water(100); sun(100); fertilizer(100);
  console.log('[ptg] ✅ Todos los stats al 100%');
}

/** Pone todos los stats a un valor bajo para probar muerte */
function drainAll(value = 5) {
  water(value); sun(value); fertilizer(value);
  console.log(`[ptg] ⚠️  Todos los stats → ${value}%`);
}

/** Suma cantidad a un stat específico */
function addStat(stat, amount = 20) {
  const sm = _getStats();
  if (!sm) return;
  sm._stopped = false;
  sm.add(stat, amount);
  console.log(`[ptg] +${amount} ${stat} → ${sm.stats[stat]}`);
}

/** Muestra el estado actual de todos los stats */
function status() {
  const sm = _getStats();
  if (!sm) return;
  console.table({
    water:       sm.water,
    sun:         sm.sun,
    fertilizer:  sm.fertilizer,
    coins:       sm.coins,
    stage:       sm.stage,
    growthTime:  sm._stageGrowthTime,
  });
}

// ══════════════════════════════════════════════════════════
//  MONEDAS
// ══════════════════════════════════════════════════════════

/** Añade monedas */
function addCoins(amount = 100) {
  const sm = _getStats();
  if (!sm) return;
  sm.addCoins(amount);
  console.log(`[ptg] 🪙 coins → ${sm.coins}`);
}

/** Establece las monedas a un valor exacto */
function setCoins(amount = 0) {
  const sm = _getStats();
  if (!sm) return;
  sm.coins = amount;
  EventBus.emit(EVENTS.COINS_UPDATED, { amount, source: sm });
  console.log(`[ptg] 🪙 coins = ${amount}`);
}

// ══════════════════════════════════════════════════════════
//  PLANTA
// ══════════════════════════════════════════════════════════

/** Sube la etapa de la planta (0=semilla, 1=brote, 2=adulta) */
function grow(targetStage) {
  const sm = _getStats();
  if (!sm) return;
  const next = targetStage ?? Math.min(sm.stage + 1, 2);
  sm.stage = next;
  sm._stageGrowthTime = 0;
  EventBus.emit(EVENTS.STAGE_UP, { stage: next });
  console.log(`[ptg] 🌿 stage → ${next}`);
}

/** Fuerza la muerte de la planta */
function killPlant() {
  drainAll(0);
  console.log('[ptg] 💀 Planta muerta');
}

/** Activa la expresión feliz de la planta */
function happyFace() {
  const s = _getScene();
  s?.plant?.setState('happy');
  console.log('[ptg] 😊 Expresión: happy');
}

/** Activa la expresión triste de la planta */
function sadFace() {
  const s = _getScene();
  s?.plant?.setState('sad');
  console.log('[ptg] 😢 Expresión: sad');
}

/** Dispara el efecto de corazón flotante */
function heartEffect() {
  const s = _getScene();
  s?.plant?.playHappyEffect();
  console.log('[ptg] 💖 Efecto corazón');
}

/** Dispara el efecto de gota de agua */
function waterEffect() {
  const s = _getScene();
  s?.plant?.playWaterEffect();
  console.log('[ptg] 💧 Efecto agua');
}

// ══════════════════════════════════════════════════════════
//  CLIMA (solo en YardScene)
// ══════════════════════════════════════════════════════════

/**
 * Cambia el clima. Valores: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
 */
function weather(type = 'sunny') {
  const g = window.game;
  const yard = g?.scene.getScene('YardScene');
  if (!yard || !g.scene.isActive('YardScene')) {
    console.warn('[ptg] weather solo funciona en YardScene');
    return;
  }
  yard._applyWeather(type, true);
  console.log(`[ptg] 🌤️  clima → ${type}`);
}

// ══════════════════════════════════════════════════════════
//  NAVEGACIÓN
// ══════════════════════════════════════════════════════════

/** Cambia a una escena por nombre */
function goScene(key) {
  const g = window.game;
  if (!g) return;
  g.scene.start(key);
  console.log(`[ptg] 🎬 → ${key}`);
}

/** Atajos de escena */
const go = {
  menu:       () => goScene('MenuScene'),
  select:     () => goScene('SelectScene'),
  game:       () => goScene('GameScene'),
  yard:       () => goScene('YardScene'),
  gameOver:   () => goScene('GameOverScene'),
  minigames:  () => goScene('MinigamesMenuScene'),
  fertilizer: () => goScene('FertilizerScene'),
  bugs:       () => goScene('BugDefenseScene'),
};

// ══════════════════════════════════════════════════════════
//  SAVE / LOAD
// ══════════════════════════════════════════════════════════

/** Muestra el save actual del localStorage */
function showSave() {
  try {
    const raw = localStorage.getItem('ptg_save');
    console.log('[ptg] 💾 Save actual:');
    console.log(raw ? JSON.parse(raw) : '(vacío)');
  } catch(e) { console.error(e); }
}

/** Borra el save (requiere recargar la página) */
function clearSave() {
  localStorage.removeItem('ptg_save');
  localStorage.removeItem('ptg_plant');
  console.warn('[ptg] 🗑️  Save borrado. Recarga la página para empezar de nuevo.');
}

// ══════════════════════════════════════════════════════════
//  AYUDA
// ══════════════════════════════════════════════════════════

function help() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           PLANTGOCHI — CHEAT CONSOLE                ║
╠══════════════════════════════════════════════════════╣
║  STATS                                              ║
║  ptg.water(n)          → agua a n (0-100)           ║
║  ptg.sun(n)            → sol a n (0-100)            ║
║  ptg.fertilizer(n)     → fertilizante a n (0-100)   ║
║  ptg.addStat(stat, n)  → suma n a un stat           ║
║  ptg.fillAll()         → todos los stats a 100      ║
║  ptg.drainAll(n)       → todos los stats a n        ║
║  ptg.status()          → ver estado actual          ║
╠══════════════════════════════════════════════════════╣
║  MONEDAS                                            ║
║  ptg.addCoins(n)       → añadir n monedas           ║
║  ptg.setCoins(n)       → establecer monedas a n     ║
╠══════════════════════════════════════════════════════╣
║  PLANTA                                             ║
║  ptg.grow()            → subir etapa (+1)           ║
║  ptg.grow(n)           → ir a etapa n (0/1/2)       ║
║  ptg.killPlant()       → matar la planta            ║
║  ptg.happyFace()       → expresión feliz            ║
║  ptg.sadFace()         → expresión triste           ║
║  ptg.heartEffect()     → efecto corazón flotante    ║
║  ptg.waterEffect()     → efecto gota de agua        ║
╠══════════════════════════════════════════════════════╣
║  CLIMA (solo en YardScene)                          ║
║  ptg.weather('sunny')  → soleado                   ║
║  ptg.weather('cloudy') → nublado                   ║
║  ptg.weather('rainy')  → lluvia                    ║
║  ptg.weather('snowy')  → nieve                     ║
╠══════════════════════════════════════════════════════╣
║  NAVEGACIÓN                                         ║
║  ptg.go.game()         → ir a GameScene             ║
║  ptg.go.yard()         → ir a YardScene             ║
║  ptg.go.gameOver()     → ir a GameOverScene         ║
║  ptg.go.minigames()    → ir a MinigamesMenuScene    ║
║  ptg.go.fertilizer()   → ir a FertilizerScene       ║
║  ptg.go.bugs()         → ir a BugDefenseScene       ║
╠══════════════════════════════════════════════════════╣
║  SAVE                                               ║
║  ptg.showSave()        → ver save en localStorage   ║
║  ptg.clearSave()       → borrar save                ║
╚══════════════════════════════════════════════════════╝
  `);
}

// ══════════════════════════════════════════════════════════
//  EXPONER GLOBALMENTE
// ══════════════════════════════════════════════════════════

window.ptg = {
  // Stats
  water, sun, fertilizer, fillAll, drainAll, addStat, status,
  // Monedas
  addCoins, setCoins,
  // Planta
  grow, killPlant, happyFace, sadFace, heartEffect, waterEffect,
  // Clima
  weather,
  // Navegación
  go, goScene,
  // Save
  showSave, clearSave,
  // Ayuda
  help,
};

console.log('%c[ptg] Cheat console cargada. Escribe ptg.help() para ver los comandos.', 'color: #4CAF50; font-weight: bold');
