import Phaser from 'phaser';
import { EventBus, EVENTS } from '../services/EventBus.js';

export default class Plant extends Phaser.GameObjects.Container {

  constructor(scene, x, y, plantData, stage = 0, statsManager = null) {
    super(scene, x, y);
    scene.add.existing(this);

    this._data          = plantData;
    this._state         = 'default';
    this._stage         = stage;
    this._statsManager  = statsManager; // para filtrar eventos
    this._hat           = null;
    this._pot           = null;
    this._can           = null;

    // ── Sprite según etapa inicial ────────────────────
    const stageTextures = {
      0: `${plantData.id}_semilla`,
      1: `${plantData.id}_brote`,
      2: `${plantData.id}_default`,
    };
    const stageSizes = {
      0: 120,  // semilla — pequeña
      1: 180,  // brote — mediana
      2: 240,  // default — tamaño completo
    };
    const initialTex  = stageTextures[stage] ?? `${plantData.id}_default`;
    const initialSize = stageSizes[stage]    ?? 240;

    // ── Maceta base ───────────────────────────────────
    this._pot = scene.add.image(0, 80, 'pot_base').setDisplaySize(160, 130);
    this.add(this._pot);

    // ── Sprite base ───────────────────────────────────
    this._sprite = scene.add.image(0, -50, initialTex).setDisplaySize(initialSize, initialSize);
    this.add(this._sprite);

    // ── Cara: ojos, boca, mejillas ────────────────────
    this._eyeL  = scene.add.image(-38, -60, 'face_eye_left')  .setDisplaySize(38, 38);
    this._eyeR  = scene.add.image( 38, -60, 'face_eye_right') .setDisplaySize(38, 38);
    this._mouth = scene.add.image(  0, -20, 'face_mouth')     .setDisplaySize(40, 28);
    this._blushL = scene.add.image(-55, -35, 'face_blush_left') .setDisplaySize(36, 22).setAlpha(0);
    this._blushR = scene.add.image( 55, -35, 'face_blush_right').setDisplaySize(36, 22).setAlpha(0);
    this.add(this._eyeL);
    this.add(this._eyeR);
    this.add(this._mouth);
    this.add(this._blushL);
    this.add(this._blushR);

    // ── Escuchar cambios de stats ─────────────────────
    EventBus.on(EVENTS.STAT_CHANGED,  this._onStatChanged, this);
    EventBus.on(EVENTS.PLANT_DIED,    this._onDeath,       this);
    EventBus.on(EVENTS.PLANT_WATERED, this._onWatered,     this);

    // ── Animación idle ────────────────────────────────
    this._startIdle();
  }

  // ── Estado visual ─────────────────────────────────────
  setState(state) {
    if (this._state === 'dead') return;
    this._state = state;
    // Solo actualiza texture si el estado tiene sprite propio
    // (happy/sad/dead no tienen sprites — solo cambia la cara)
    this._updateFace(state);
  }

  // ── Cara según estado ─────────────────────────────────
  _updateFace(state) {
    if (!this._mouth) return;

    // Boca: triste en sad, normal en el resto
    this._mouth.setTexture(state === 'sad' ? 'face_mouth_sad' : 'face_mouth');

    // Mejillas: solo en happy
    const blushAlpha = state === 'happy' ? 0.9 : 0;
    this.scene.tweens.add({
      targets: [this._blushL, this._blushR],
      alpha: blushAlpha, duration: 300, ease: 'Power1'
    });

    // Cara oculta al morir
    const faceAlpha = state === 'dead' ? 0 : 1;
    [this._eyeL, this._eyeR, this._mouth].forEach(o => o.setAlpha(faceAlpha));
  }

  // ── Hat ───────────────────────────────────────────────
  setHat(hatKey) {
    if (this._hat) this._hat.destroy();
    if (!hatKey) { this._hat = null; return; }
    this._hat = this.scene.add.image(0, -140, hatKey).setDisplaySize(120, 90);
    this.add(this._hat);
  }

  // ── Pot ───────────────────────────────────────────────
  setPot(potKey) {
    if (this._pot) this._pot.destroy();
    const key = potKey ?? 'pot_base';
    this._pot = this.scene.add.image(0, 80, key).setDisplaySize(160, 130);
    this.addAt(this._pot, 0);
  }

  // ── Can — solo cambia el botón de regar, no aparece en la planta ─
  setCan(canKey) {
    this._canKey = canKey ?? null; // guardado para que UIElements lo use en el botón
  }

  // ── Etapa de crecimiento ──────────────────────────────
  // TODO: cuando tengas los sprites, reemplaza el console.log por:
  //   this._sprite.setTexture(`${this._data.id}_stage${stage}`)
  //   + animación de celebración (partículas, escala bounce)
  setStage(stage) {
    // Guard: si la planta fue destruida, no hacer nada
    if (!this.scene || !this._sprite || !this._sprite.scene) return;

    this._stage = stage;
    const stageTextures = {
      0: `${this._data.id}_semilla`,
      1: `${this._data.id}_brote`,
      2: `${this._data.id}_default`,
    };
    const stageSizes = { 0: 120, 1: 180, 2: 240 };
    const tex  = stageTextures[stage] ?? `${this._data.id}_default`;
    const size = stageSizes[stage]    ?? 240;

    this._sprite.setTexture(tex).setDisplaySize(size, size);

    // Ajustar posición de cara y hat según nuevo tamaño
    const faceY = size === 120 ? -30 : size === 180 ? -45 : -60;
    if (this._eyeL)  { this._eyeL.setPosition(-38 * (size/240), faceY); }
    if (this._eyeR)  { this._eyeR.setPosition( 38 * (size/240), faceY); }
    if (this._mouth) { this._mouth.setPosition(0, faceY + 40); }
    if (this._hat)   { this._hat.setPosition(0, faceY - 80); }

    // Animación de celebración — bounce sin interferir con idle
    this.scene.tweens.add({
      targets:  this._sprite,
      scaleX:   1.2, scaleY: 1.2,
      duration: 200, yoyo: true, repeat: 2,
      ease:     'Sine.easeInOut'
    });

    try { this.scene.sound?.play('sfx_coins', { volume: 0.6 }); } catch(e) {}
  }
  playHappyEffect() {
    const heart = this.scene.add.image(this.x + 60, this.y - 160, 'fx_heart')
      .setScale(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets:  heart,
      y:        heart.y - 60,
      alpha:    { from: 1, to: 0 },
      duration: 1000,
      ease:     'Sine.easeOut',
      onComplete: () => heart.destroy()
    });

    this.setState('happy');
    this.scene.time.delayedCall(2000, () => {
      if (this._state !== 'dead') this.setState('default');
    });
  }

  playWaterEffect() {
    const drop = this.scene.add.image(this.x, this.y - 100, 'fx_water_drop')
      .setScale(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets:  drop,
      y:        drop.y + 80,
      alpha:    { from: 1, to: 0 },
      duration: 800,
      ease:     'Sine.easeIn',
      onComplete: () => drop.destroy()
    });
  }

  playSunEffect() {
    // Reservado para uso futuro
  }

  // ── Idle animation ────────────────────────────────────
  _startIdle() {
    const baseY = this.y;
    this._idleTween = this.scene.tweens.add({
      targets:  this,
      y:        baseY - 8,
      duration: 1800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut'
    });
  }

  // ── Listeners de EventBus ─────────────────────────────
  _onStatChanged({ stat, value, source }) {
    if (this._destroyed) return;
    if (this._statsManager && source !== this._statsManager) return;
    if (this._state === 'dead') return;

    // Evaluar el estado global basado en TODOS los stats, no solo el que cambió
    const stats = this._statsManager?.stats ?? {};
    const minVal = Math.min(
      stats.water      ?? value,
      stats.sun        ?? value,
      stats.fertilizer ?? value
    );

    if (minVal <= 20) {
      this.setState('sad');
    } else if (minVal >= 80 && this._state !== 'happy') {
      // Solo poner happy si todos están bien — y solo una vez
      this.setState('happy');
      this.scene.time.delayedCall(2000, () => {
        if (this._state !== 'dead') this.setState('default');
      });
    } else if (this._state === 'sad' && minVal > 20) {
      this.setState('default');
    }
  }

  _onWatered() {
    if (this._destroyed) return;
    this.playWaterEffect();
  }

  _onDeath() {
    if (this._destroyed) return;
    this._state = 'dead';
    this._stopIdle();
    this._updateFace('dead');

    this.scene.tweens.add({
      targets:  this,
      angle:    90,
      alpha:    0.4,
      duration: 1200,
      ease:     'Power2',
    });
  }

  _stopIdle() {
    if (this._idleTween) {
      this._idleTween.stop();
      this._idleTween = null;
    }
    this.scene.tweens.killTweensOf(this);
  }

  // ── Limpieza ──────────────────────────────────────────
  destroy() {
    // Marcar como destruido para que los listeners no actúen
    this._destroyed = true;
    this._sprite    = null;
    EventBus.off(EVENTS.STAT_CHANGED,  this._onStatChanged, this);
    EventBus.off(EVENTS.PLANT_DIED,    this._onDeath,       this);
    EventBus.off(EVENTS.PLANT_WATERED, this._onWatered,     this);
    super.destroy();
  }
}
