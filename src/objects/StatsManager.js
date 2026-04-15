import { STATS, WEATHER, GROWTH } from '../constants.js';
import { EventBus, EVENTS } from '../services/EventBus.js';

export default class StatsManager {

  constructor(initialStats, initialStage = 0, initialGrowthTime = 0) {
    this.stats      = { ...initialStats };
    this.coins      = 0;
    this.stage      = initialStage;
    this.growthTime = initialGrowthTime;
    this._weather   = 'sunny';
    this._decayTimer = null;
    this._dead      = false;
  }

  // ── Getters ──────────────────────────────────────────
  get water()      { return this.stats.water; }
  get sun()        { return this.stats.sun; }
  get fertilizer() { return this.stats.fertilizer; }
  get happiness()  { return this.stats.happiness; }

  // ── Modificadores ────────────────────────────────────
  set(stat, value) {
    if (this._stopped) return;
    if (!(stat in this.stats)) return;
    this.stats[stat] = Phaser.Math.Clamp(value, STATS.MIN, STATS.MAX);
    EventBus.emit(EVENTS.STAT_CHANGED, { stat, value: this.stats[stat], source: this });
    this._checkDeath();
  }

  add(stat, amount) {
    this.set(stat, this.stats[stat] + amount);
  }

  subtract(stat, amount) {
    this.set(stat, this.stats[stat] - amount);
  }

  addCoins(amount) {
    this.coins = Math.max(0, this.coins + amount);
    EventBus.emit(EVENTS.COINS_UPDATED, { amount: this.coins, source: this });
  }

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.addCoins(-amount);
    return true;
  }

  // ── Clima ─────────────────────────────────────────────
  setWeather(type) {
    this._weather = WEATHER.TYPES.includes(type) ? type : 'sunny';
  }

  // ── Decay automático ─────────────────────────────────
  startDecay(scene) {
    this._stopped = false;
    this._decayTimer = scene.time.addEvent({
      delay:         STATS.DECAY_INTERVAL,
      loop:          true,
      callback:      this._decay,
      callbackScope: this,
    });
  }


  stopDecay() {
    this._stopped = true;
    if (this._decayTimer) {
      this._decayTimer.remove();
      this._decayTimer = null;
    }
  }

  _decay() {
    if (this._dead || this._stopped) return;
    const mult = WEATHER.MULTIPLIERS[this._weather] ?? { water: 1, sun: 1, fertilizer: 1 };
    ['water', 'sun', 'fertilizer'].forEach(stat => {
      this.subtract(stat, STATS.DECAY_AMOUNT * mult[stat]);
    });
    this._tickGrowth();
  }

  // ── Crecimiento ───────────────────────────────────────
  // TODO: cuando tengas los sprites de etapas, conecta setStage() en Plant
  // desde el listener STAGE_UP en GameScene/YardScene
  _tickGrowth() {
    if (this.stage >= 2) return;
    const healthy = ['water', 'sun', 'fertilizer'].every(
      s => this.stats[s] >= GROWTH.HEALTHY_THRESHOLD
    );
    if (!healthy) return;

    this.growthTime += STATS.DECAY_INTERVAL;
    const nextStage =
      this.growthTime >= GROWTH.STAGE_2_THRESHOLD ? 2 :
      this.growthTime >= GROWTH.STAGE_1_THRESHOLD ? 1 : 0;

    if (nextStage > this.stage) {
      this.stage = nextStage;
      EventBus.emit(EVENTS.STAGE_UP, { stage: this.stage });
    }
  }

  // ── Muerte ───────────────────────────────────────────
  _checkDeath() {
    if (this._dead) return;
    const isDead = ['water', 'sun', 'fertilizer'].some(
      stat => this.stats[stat] <= STATS.DEATH_THRESHOLD
    );
    if (isDead) {
      this._dead = true;
      this.stopDecay();
      EventBus.emit(EVENTS.PLANT_DIED);
    }
  }

  isDead() { return this._dead; }

  toJSON() {
    return {
      stats:      { ...this.stats },
      coins:      this.coins,
      stage:      this.stage,
      growthTime: this.growthTime,
    };
  }
}
