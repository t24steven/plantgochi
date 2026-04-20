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
    btn.on('pointerdown', () => this._transition(() => this._showPrivacy()));
  }

  // ── STEP 1: Privacy Policy ────────────────────────────
  _showPrivacy() {
    const { width, height } = this.cameras.main;
    this.add.image(width / 2, height / 2, 'bg_lobby').setDisplaySize(width, height);
    this.add.image(width / 2, height / 2 - 20, 'icon_privacy').setScale(0.8).setOrigin(0.5);

    this._addAudioBtn();
    // Reproducir voz de privacy policy
    this.time.delayedCall(300, () => this.sound.play('sfx_pp_voice', { volume: 0.8 }));

    const btn = this.add.image(width / 2, height * 0.82, 'btn_next')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
      // Solo parar voces, no el BGM
      const ppVoice = this.sound.get('sfx_pp_voice');
      if (ppVoice?.isPlaying) ppVoice.stop();
      this._transition(() => this._showHowToPlay());
    });
  }

  // ── STEP 2: How to Play ───────────────────────────────
  _showHowToPlay() {
    const { width, height } = this.cameras.main;
    this.add.image(width / 2, height / 2, 'bg_lobby').setDisplaySize(width, height);
    this.add.image(width / 2, height / 2 - 20, 'icon_htp').setScale(0.8).setOrigin(0.5);

    this._addAudioBtn();
    // Reproducir voz de how to play
    this.time.delayedCall(300, () => this.sound.play('sfx_htp_voice', { volume: 0.8 }));

    const btn = this.add.image(width / 2, height * 0.82, 'btn_next')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
      // Solo parar voces, no el BGM
      const htpVoice = this.sound.get('sfx_htp_voice');
      if (htpVoice?.isPlaying) htpVoice.stop();
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

  // ── Botón de audio (pause/resume) ────────────────────
  _addAudioBtn() {
    const { width, height } = this.cameras.main;
    const btn = this.add.image(width - 45, height - 45, 'btn_voice')
      .setDisplaySize(70, 70).setInteractive({ useHandCursor: true });

    const isMuted = () => {
      const bgm = this.sound.get('bgm');
      return !bgm || !bgm.isPlaying;
    };

    btn.setAlpha(isMuted() ? 0.4 : 1);

    btn.on('pointerdown', () => {
      // Parar voces activas
      ['sfx_pp_voice', 'sfx_htp_voice'].forEach(k => {
        const s = this.sound.get(k);
        if (s && s.isPlaying) s.stop();
      });

      const bgm = this.sound.get('bgm');
      if (!bgm) return;

      if (bgm.isPlaying) {
        bgm.pause();
        btn.setAlpha(0.4);
      } else {
        // Phaser: resume() si fue pausado, play() si nunca arrancó o fue detenido
        try { bgm.resume(); } catch(e) { bgm.play(); }
        btn.setAlpha(1);
      }
    });
  }
}
