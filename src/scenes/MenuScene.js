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
    this.add.image(640, 360, 'bg_lobby').setDisplaySize(1280, 720);
    this.add.image(640, 340, 'icon_privacy').setScale(0.8).setOrigin(0.5);

    const btn = this.add.image(640, 590, 'btn_next')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => this._transition(() => this._showHowToPlay()));
  }

  // ── STEP 2: How to Play ───────────────────────────────
  _showHowToPlay() {
    this.add.image(640, 360, 'bg_lobby').setDisplaySize(1280, 720);
    this.add.image(640, 340, 'icon_htp').setScale(0.8).setOrigin(0.5);

    const btn = this.add.image(640, 590, 'btn_start')
      .setScale(0.8).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(0.85));
    btn.on('pointerout',  () => btn.setScale(0.8));
    btn.on('pointerdown', () => {
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
}
