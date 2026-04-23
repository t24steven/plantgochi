import Phaser from 'phaser';
import { EventBus, EVENTS } from '../services/EventBus.js';

export default class Plant extends Phaser.GameObjects.Container {

  constructor(scene, x, y, plantData, stage = 0, statsManager = null) {
    super(scene, x, y);
    scene.add.existing(this);

    this._data          = plantData;
    this._state         = 'default';
    this._stage         = stage;
    this._statsManager  = statsManager;
    this._hat           = null;
    this._pot           = null;
    this._can           = null;

    // ── Maceta base ───────────────────────────────────
    // Maceta centrada en la parte baja del container
    this._pot = scene.add.image(0, Plant.POT_Y, 'pot_base')
      .setDisplaySize(Plant.POT_W, Plant.POT_H);
    this.add(this._pot);

    // ── Sprite según etapa inicial ────────────────────
    const { tex, w, h, spriteY } = Plant.stageLayout(plantData.id, stage);
    this._sprite = scene.add.image(0, spriteY, tex).setDisplaySize(w, h);
    this.add(this._sprite);

    // ── Cara: ojos, boca, mejillas ────────────────────
    const face = Plant.faceLayout(stage);
    this._eyeL   = scene.add.image(face.eyeLX,   face.eyeY,   'face_eye_left')   .setDisplaySize(face.eyeW,   face.eyeW);
    this._eyeR   = scene.add.image(face.eyeRX,   face.eyeY,   'face_eye_right')  .setDisplaySize(face.eyeW,   face.eyeW);
    this._mouth  = scene.add.image(0,             face.mouthY, 'face_mouth')      .setDisplaySize(face.mouthW, face.mouthH);
    this._blushL = scene.add.image(face.blushLX,  face.blushY, 'face_blush_left') .setDisplaySize(face.blushW, face.blushH).setAlpha(0);
    this._blushR = scene.add.image(face.blushRX,  face.blushY, 'face_blush_right').setDisplaySize(face.blushW, face.blushH).setAlpha(0);
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
    const face = Plant.faceLayout(this._stage);
    this._hat = this.scene.add.image(0, face.hatY, hatKey).setDisplaySize(Plant.HAT_W, Plant.HAT_H);
    this.add(this._hat);
  }

  // ── Pot ───────────────────────────────────────────────
  setPot(potKey) {
    if (this._pot) this._pot.destroy();
    const key = potKey ?? 'pot_base';
    this._pot = this.scene.add.image(0, Plant.POT_Y, key).setDisplaySize(Plant.POT_W, Plant.POT_H);
    this.addAt(this._pot, 0);
  }

  // ── Can — solo cambia el botón de regar, no aparece en la planta ─
  setCan(canKey) {
    this._canKey = canKey ?? null;
  }

  // ── Etapa de crecimiento ──────────────────────────────
  setStage(stage) {
    if (!this.scene || !this._sprite || !this._sprite.scene) return;

    this._stage = stage;
    const { tex, w, h, spriteY } = Plant.stageLayout(this._data.id, stage);
    this._sprite.setTexture(tex).setDisplaySize(w, h).setPosition(0, spriteY);

    // Reposicionar cara
    const face = Plant.faceLayout(stage);
    if (this._eyeL)   this._eyeL  .setPosition(face.eyeLX,  face.eyeY) .setDisplaySize(face.eyeW,   face.eyeW);
    if (this._eyeR)   this._eyeR  .setPosition(face.eyeRX,  face.eyeY) .setDisplaySize(face.eyeW,   face.eyeW);
    if (this._mouth)  this._mouth .setPosition(0,            face.mouthY).setDisplaySize(face.mouthW, face.mouthH);
    if (this._blushL) this._blushL.setPosition(face.blushLX, face.blushY).setDisplaySize(face.blushW, face.blushH);
    if (this._blushR) this._blushR.setPosition(face.blushRX, face.blushY).setDisplaySize(face.blushW, face.blushH);
    if (this._hat)    this._hat   .setPosition(0,            face.hatY);

    // Animación de celebración
    this.scene.tweens.add({
      targets: this._sprite, scaleX: 1.2, scaleY: 1.2,
      duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut'
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

// ── Layout estático — basado en dimensiones reales de los assets ──────────────
//
// Container origin = centro de la planta completa (planta + maceta)
// La maceta siempre en POT_Y, la planta encima tocando el borde de la maceta.
//
// Maceta (pot_base 765×700, pot1 399×374, pot2 393×315, pot3 413×305)
// Mostramos todas a 150×120 para consistencia visual.
Plant.POT_W = 150;
Plant.POT_H = 120;
Plant.POT_Y = 70;   // centro de la maceta respecto al container

// Sombrero
Plant.HAT_W = 110;
Plant.HAT_H = 80;

/**
 * Devuelve { tex, w, h, spriteY } para cada etapa.
 * spriteY = posición Y del sprite respecto al container,
 * calculada para que la base del sprite quede justo encima de la maceta.
 *
 * Semilla (496×724): ratio 0.685 → mostramos 80×117, muy pequeña
 * Brote   (~200-400px): mostramos 130×130
 * Default (~340-384px): mostramos 200×200
 *
 * La maceta tiene su centro en POT_Y=70, su borde superior está en:
 *   POT_Y - POT_H/2 = 70 - 60 = 10
 * El sprite debe tener su base (centro + h/2) en ese punto:
 *   spriteY + h/2 = 10  →  spriteY = 10 - h/2
 */
Plant.stageLayout = function(plantId, stage) {
  const potTop = Plant.POT_Y - Plant.POT_H / 2; // = 10

  if (stage === 0) {
    // Semilla: pequeña, casi dentro de la maceta
    const w = 80, h = 117;
    return { tex: `${plantId}_semilla`, w, h, spriteY: potTop - h / 2 + 20 };
  }
  if (stage === 1) {
    // Brote: mediano
    const w = 140, h = 140;
    return { tex: `${plantId}_brote`, w, h, spriteY: potTop - h / 2 };
  }
  // stage 2: adulta
  const w = 210, h = 210;
  return { tex: `${plantId}_default`, w, h, spriteY: potTop - h / 2 };
};

/**
 * Devuelve las posiciones de los elementos de la cara para cada etapa.
 * Todas las coordenadas son relativas al container.
 */
Plant.faceLayout = function(stage) {
  // Centro visual de la planta (donde está la cara)
  // = spriteY del stage correspondiente, ajustado al tercio superior del sprite
  const layouts = {
    0: { centerY: -55, scale: 0.55 },  // semilla — cara pequeña
    1: { centerY: -80, scale: 0.75 },  // brote
    2: { centerY: -95, scale: 1.0  },  // adulta
  };
  const { centerY, scale } = layouts[stage] ?? layouts[2];

  const eyeW   = Math.round(34 * scale);
  const eyeOff = Math.round(32 * scale);
  const mouthW = Math.round(38 * scale);
  const mouthH = Math.round(26 * scale);
  const blushW = Math.round(30 * scale);
  const blushH = Math.round(18 * scale);
  const blushOff = Math.round(48 * scale);

  return {
    eyeLX:  -eyeOff,
    eyeRX:   eyeOff,
    eyeY:    centerY - Math.round(12 * scale),
    eyeW,
    mouthY:  centerY + Math.round(14 * scale),
    mouthW,
    mouthH,
    blushLX: -blushOff,
    blushRX:  blushOff,
    blushY:   centerY + Math.round(2 * scale),
    blushW,
    blushH,
    hatY:    centerY - Math.round(60 * scale),
  };
};
