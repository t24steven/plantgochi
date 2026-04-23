import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { SaveService } from '../services/SaveService.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  create() {
    this._showTitle();
  }

  // ── Helper: fade out → rebuild → fade in ──────────────
  _transition(buildFn) {
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.children.removeAll(true);
      buildFn();
      this.cameras.main.fadeIn(220, 0, 0, 0);
    });
  }

  // ── STEP 0: Title ─────────────────────────────────────
  _showTitle() {
    this.children.removeAll(true);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add.image(640, 360, 'bg_start').setDisplaySize(1280, 720);

    const btn = this.add.image(640, 600, 'btn_start')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
      this._ensureBgm();
      this._transition(() => this._showPrivacy());
    });
  }

  // ── Inicia el BGM si no está corriendo ya ─────────────
  _ensureBgm() {
    const existing = this.sound.get('bgm');
    if (existing) {
      if (!existing.isPlaying) existing.play();
      return;
    }
    const bgm = this.sound.add('bgm', { loop: true, volume: 0.15 });
    bgm.play().catch?.(() => {});
  }

  // ── STEP 1: Privacy Policy ────────────────────────────
  _showPrivacy() {
    const { width, height } = this.cameras.main;
    this.add.image(width / 2, height / 2, 'bg_lobby').setDisplaySize(width, height);
    this.add.image(width / 2, height / 2 - 20, 'icon_privacy').setScale(0.8).setOrigin(0.5);

    // Reproducir voz y guardar instancia para poder pausarla
    let voiceSound = null;
    this.time.delayedCall(300, () => {
      voiceSound = this.sound.add('sfx_pp_voice', { volume: 0.8 });
      voiceSound.play();
    });

    this._addVoiceBtn(() => voiceSound);

    const btn = this.add.image(width / 2, height * 0.82, 'btn_next')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
      if (voiceSound?.isPlaying) voiceSound.stop();
      this._transition(() => this._showHowToPlay());
    });
  }

  // ── STEP 2: How to Play ───────────────────────────────
  _showHowToPlay() {
    const { width, height } = this.cameras.main;
    this.add.image(width / 2, height / 2, 'bg_lobby').setDisplaySize(width, height);
    this.add.image(width / 2, height / 2 - 20, 'icon_htp').setScale(0.8).setOrigin(0.5);

    // Reproducir voz y guardar instancia para poder pausarla
    let voiceSound = null;
    this.time.delayedCall(300, () => {
      voiceSound = this.sound.add('sfx_htp_voice', { volume: 0.8 });
      voiceSound.play();
    });

    this._addVoiceBtn(() => voiceSound);

    const btn = this.add.image(width / 2, height * 0.82, 'btn_next')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
      if (voiceSound?.isPlaying) voiceSound.stop();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (SaveService.hasSave()) {
          this.scene.start(SCENES.GAME);
        } else {
          this.scene.start(SCENES.SELECT);
        }
      });
    });
  }

  // ── Botón de audio: pausa/reanuda la voz de instrucciones
  // getVoice: función que retorna la instancia actual del sonido de voz
  _addVoiceBtn(getVoice) {
    const { width, height } = this.cameras.main;
    let _paused = false;

    const btn = this.add.image(width - 45, height - 45, 'btn_voice')
      .setDisplaySize(70, 70)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    const refresh = () => btn.setAlpha(_paused ? 0.4 : 1);

    btn.on('pointerdown', () => {
      const voice = getVoice();
      if (!voice) return;

      if (!_paused) {
        voice.pause();
        _paused = true;
      } else {
        try { voice.resume(); } catch(e) {}
        _paused = false;
      }
      refresh();
    });

    btn.on('pointerover', () => btn.setTint(0xdddddd));
    btn.on('pointerout',  () => btn.clearTint());
  }

  shutdown() {
    // Parar cualquier voz activa al salir de la escena
    ['sfx_pp_voice', 'sfx_htp_voice'].forEach(k => {
      const s = this.sound.get(k);
      if (s?.isPlaying) s.stop();
    });
  }
}
