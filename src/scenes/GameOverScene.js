import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { SaveService } from '../services/SaveService.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // ── Fade in ────────────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Fondo ──────────────────────────────────────────
    this.add.image(cx, cy, 'bg_death').setDisplaySize(width, height);
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.55);

    // ── Título con entrada animada ─────────────────────
    const title = this.add.text(cx, cy - 200, '🌵 Your plant has died...', {
      fontSize: '42px', color: '#ffffff',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(cx, cy - 130, 'Take better care next time!', {
      fontSize: '22px', color: '#cccccc', fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: cy - 160, duration: 500, ease: 'Power2', delay: 300 });
    this.tweens.add({ targets: sub,   alpha: 1, y: cy - 90,  duration: 500, ease: 'Power2', delay: 500 });

    // ── Botón: Try Again ───────────────────────────────
    const btnTry = this.add.text(cx, cy + 60, '🔄  Try Again', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#4CAF50', padding: { x: 30, y: 14 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: btnTry, alpha: 1, duration: 400, delay: 700 });

    btnTry.on('pointerover',  () => btnTry.setStyle({ color: '#FFD700' }));
    btnTry.on('pointerout',   () => btnTry.setStyle({ color: '#ffffff' }));
    btnTry.on('pointerdown',  () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SaveService.clear();
        this.scene.start(SCENES.SELECT);
      });
    });

    // ── Botón: Main Menu ───────────────────────────────
    const btnMenu = this.add.text(cx, cy + 150, '🏠  Main Menu', {
      fontSize: '22px', color: '#cccccc', fontFamily: 'Arial',
      backgroundColor: '#555555', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: btnMenu, alpha: 1, duration: 400, delay: 900 });

    btnMenu.on('pointerover',  () => btnMenu.setStyle({ color: '#ffffff' }));
    btnMenu.on('pointerout',   () => btnMenu.setStyle({ color: '#cccccc' }));
    btnMenu.on('pointerdown',  () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SaveService.clear();
        this.scene.start(SCENES.MENU);
      });
    });
  }
}
