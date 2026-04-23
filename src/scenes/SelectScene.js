import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { PLANTS } from '../data/plants.js';
import { SaveService } from '../services/SaveService.js';

export default class SelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.SELECT });
    this._index      = 0;
    this._voiceSound = null; // instancia activa de la voz de planta
    this._voicePaused = false; // persiste entre _build()
  }

  create() {
    this._index = 0;
    this._build();
  }

  _build() {
    // Parar voz anterior antes de destruir los hijos
    if (this._voiceSound?.isPlaying) this._voiceSound.stop();
    this._voiceSound = null;

    this.children.removeAll(true);

    const plant          = PLANTS[this._index];
    const { width, height } = this.cameras.main;
    const cx             = width / 2;
    const cy             = height / 2;

    // ── Fondo ──────────────────────────────────────────
    this.add.image(cx, cy, 'bg_select').setDisplaySize(width, height);

    // ── Contenedor con fade para el contenido dinámico ─
    const content = this.add.container(0, 0).setAlpha(0);

    // ── Nombre de la planta ────────────────────────────
    const nameText = this.add.text(cx, height * 0.25, plant.name, {
      fontSize: '48px', color: '#ffffff',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#00000066', strokeThickness: 4
    }).setOrigin(0.5);

    // ── Planta centrada con cara ───────────────────────
    const plantContainer = this.add.container(cx, cy - 20);

    const plantImg = this.add.image(0, 0, `${plant.id}_default`)
      .setDisplaySize(280, 280);

    const eyeL   = this.add.image(-42, -40, 'face_eye_left')  .setDisplaySize(36, 36);
    const eyeR   = this.add.image( 42, -40, 'face_eye_right') .setDisplaySize(36, 36);
    const mouth  = this.add.image(  0,   0, 'face_mouth')     .setDisplaySize(38, 26);
    const blushL = this.add.image(-58, -18, 'face_blush_left') .setDisplaySize(34, 20).setAlpha(0.8);
    const blushR = this.add.image( 58, -18, 'face_blush_right').setDisplaySize(34, 20).setAlpha(0.8);

    plantContainer.add([plantImg, eyeL, eyeR, mouth, blushL, blushR]);

    this.tweens.add({
      targets: plantContainer, y: cy - 20 - 8,
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // ── Stats ──────────────────────────────────────────
    const statDefs = [
      { label: '💧 Water',      value: plant.stats.water,      color: '#29b6f6' },
      { label: '☀️ Sun',        value: plant.stats.sun,        color: '#fdd835' },
      { label: '🌱 Fertilizer', value: plant.stats.fertilizer, color: '#66bb6a' },
    ];

    const barW   = 220;
    const barH   = 14;
    const startX = cx - barW / 2;
    const startY = height * 0.72;
    const gap    = 36;

    const statObjs = statDefs.flatMap(({ label, value, color }, i) => {
      const y = startY + i * gap;
      const labelTxt = this.add.text(startX, y - 8, label, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
      });
      const rail = this.add.rectangle(startX + barW / 2, y + 10, barW, barH, 0xffffff, 0.25).setOrigin(0.5);
      const fillW = Math.max((value / 100) * barW, 4);
      const fill  = this.add.rectangle(startX + fillW / 2, y + 10, fillW, barH,
        Phaser.Display.Color.HexStringToColor(color).color, 0.9
      ).setOrigin(0.5);
      const valTxt = this.add.text(startX + barW + 10, y + 10, `${value}%`, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
      return [labelTxt, rail, fill, valTxt];
    });

    // ── Dots indicadores ───────────────────────────────
    const dots = PLANTS.map((_, i) => {
      const color = i === this._index ? 0xf5a623 : 0xdddddd;
      return this.add.circle(cx - ((PLANTS.length - 1) * 14) + i * 28, height * 0.90, 8, color);
    });

    content.add([nameText, plantContainer, ...statObjs, ...dots]);

    // ── Flechas ────────────────────────────────────────
    const arrowL = this.add.image(width * 0.18, cy, 'arrow_left')
      .setDisplaySize(160, 100).setInteractive({ useHandCursor: true });
    const arrowR = this.add.image(width * 0.82, cy, 'arrow_right')
      .setDisplaySize(160, 100).setInteractive({ useHandCursor: true });

    arrowL.on('pointerover',  () => arrowL.setTint(0xffddaa));
    arrowL.on('pointerout',   () => arrowL.clearTint());
    arrowL.on('pointerdown',  () => { this._index = (this._index - 1 + PLANTS.length) % PLANTS.length; this._build(); });

    arrowR.on('pointerover',  () => arrowR.setTint(0xffddaa));
    arrowR.on('pointerout',   () => arrowR.clearTint());
    arrowR.on('pointerdown',  () => { this._index = (this._index + 1) % PLANTS.length; this._build(); });

    // ── Botón Select ───────────────────────────────────
    const btn = this.add.image(cx, height * 0.94, 'btn_select')
      .setDisplaySize(280, 85).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setTint(0xffddaa));
    btn.on('pointerout',   () => btn.clearTint());
    btn.on('pointerdown',  () => {
      this.tweens.add({
        targets: btn, scaleX: 0.92, scaleY: 0.92,
        duration: 80, yoyo: true,
        onComplete: () => this._selectPlant()
      });
    });

    // ── Pulso flechas ──────────────────────────────────
    this.tweens.add({
      targets: [arrowL, arrowR],
      alpha: { from: 0.6, to: 1 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // ── Fade in ────────────────────────────────────────
    this.tweens.add({ targets: content, alpha: 1, duration: 220, ease: 'Power1' });

    // ── Voz de la planta ───────────────────────────────
    const voiceMap = { cactus: 'sfx_cactus_voice', snakeplant: 'sfx_snake_voice', sunflower: 'sfx_sun_voice' };
    const voiceKey = voiceMap[plant.id];
    if (voiceKey && !this._voicePaused) {
      this.time.delayedCall(250, () => {
        this._voiceSound = this.sound.add(voiceKey, { volume: 0.8 });
        this._voiceSound.play();
      });
    }

    // ── Botón de audio: pausa/reanuda la voz ──────────
    this._addVoiceBtn();
  }

  // Botón que pausa/reanuda la voz activa
  _addVoiceBtn() {
    const { width, height } = this.cameras.main;

    const btn = this.add.image(width - 45, height - 45, 'btn_voice')
      .setDisplaySize(70, 70)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    const refresh = () => btn.setAlpha(this._voicePaused ? 0.4 : 1);
    refresh();

    btn.on('pointerdown', () => {
      if (!this._voicePaused) {
        // Pausar voz activa
        if (this._voiceSound?.isPlaying) this._voiceSound.pause();
        this._voicePaused = true;
      } else {
        // Reanudar — si la instancia sigue viva, resume; si no, replay
        if (this._voiceSound && !this._voiceSound.isPlaying) {
          try { this._voiceSound.resume(); } catch(e) {}
        }
        this._voicePaused = false;
      }
      refresh();
    });

    btn.on('pointerover', () => btn.setTint(0xdddddd));
    btn.on('pointerout',  () => btn.clearTint());
  }

  _selectPlant() {
    if (this._voiceSound?.isPlaying) this._voiceSound.stop();
    const plant     = PLANTS[this._index];
    const gameState = SaveService.newGame(plant);
    SaveService.savePlant(plant);
    this.scene.start(SCENES.GAME, { plant, gameState });
  }

  shutdown() {
    if (this._voiceSound?.isPlaying) this._voiceSound.stop();
    this._voiceSound = null;
  }
}
