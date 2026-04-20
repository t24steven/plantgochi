/**
 * GameState — Singleton global que persiste entre escenas.
 * Centraliza todas las variables del juego que necesitan
 * sobrevivir cambios de escena sin depender del disco.
 *
 * ── VARIABLES CONFIGURABLES ──────────────────────────────
 * Modifica los valores de DEFAULT para ajustar el balance del juego.
 */

export const GameState = {

  // ── Estado en memoria (se sincroniza con SaveService) ──
  coins:          0,
  fertilizerStock: 0,
  stats:          { water: 100, sun: 100, fertilizer: 100, happiness: 100 },
  stage:          0,
  growthTime:     0,
  plantId:        null,
  ownedItems:     [],
  equippedHat:    null,
  equippedPot:    null,
  equippedCan:    null,
  weather:        'sunny',
  weatherEndsAt:  0,

  // ── Cargar desde SaveService ───────────────────────────
  load(save) {
    if (!save) return;
    this.coins           = save.coins           ?? 0;
    this.fertilizerStock = save.fertilizerStock ?? 0;
    this.stats           = { ...(save.stats ?? { water: 100, sun: 100, fertilizer: 100, happiness: 100 }) };
    this.stage           = save.stage           ?? 0;
    this.growthTime      = save.growthTime      ?? 0;
    this.plantId         = save.plantId         ?? null;
    this.ownedItems      = save.ownedItems       ?? [];
    this.equippedHat     = save.equippedHat      ?? null;
    this.equippedPot     = save.equippedPot      ?? null;
    this.equippedCan     = save.equippedCan      ?? null;
    this.weather         = save.weather          ?? 'sunny';
    this.weatherEndsAt   = save.weatherEndsAt    ?? (Date.now() + 300000);
  },

  // ── Exportar para guardar en disco ────────────────────
  toSave() {
    return {
      coins:           this.coins,
      fertilizerStock: this.fertilizerStock,
      stats:           { ...this.stats },
      stage:           this.stage,
      growthTime:      this.growthTime,
      plantId:         this.plantId,
      ownedItems:      [...this.ownedItems],
      equippedHat:     this.equippedHat,
      equippedPot:     this.equippedPot,
      equippedCan:     this.equippedCan,
      weather:         this.weather,
      weatherEndsAt:   this.weatherEndsAt,
    };
  },

  // ── Reset completo ────────────────────────────────────
  reset() {
    this.coins           = 0;
    this.fertilizerStock = 0;
    this.stats           = { water: 100, sun: 100, fertilizer: 100, happiness: 100 };
    this.stage           = 0;
    this.growthTime      = 0;
    this.plantId         = null;
    this.ownedItems      = [];
    this.equippedHat     = null;
    this.equippedPot     = null;
    this.equippedCan     = null;
    this.weather         = 'sunny';
    this.weatherEndsAt   = Date.now() + 300000;
  },
};
