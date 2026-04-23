import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { SaveService } from '../services/SaveService.js';
import { addAudioButton } from '../utils/AudioButton.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME_OVER });
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Botón de audio ─────────────────────────────────
    addAudioButton(this);

    // ── Fondo ──────────────────────────────────────────
    this.add.image(cx, cy, 'bg_death').setDisplaySize(width, height);
    // Overlay oscuro para que el texto resalte
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.45);

    // ── Panel central ──────────────────────────────────
    const panelW = 720, panelH = 380;
    const panel = this.add.graphics().setAlpha(0);
    panel.fillStyle(0xfdf6e3, 0.95);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 22);
    panel.lineStyle(4, 0xc8a96e, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 22);
    this.tweens.add({ targets: panel, alpha: 1, duration: 400, delay: 150 });

    // ── Título ─────────────────────────────────────────
    const title = this.add.text(cx, cy - 120, 'Your plant has died', {
      fontSize: '42px', color: '#5a9e2f',
      fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#2d5a18', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 300 });

    const sub = this.add.text(cx, cy - 45, 'Take better care next time', {
      fontSize: '24px', color: '#7a5200', fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 420 });

    // ── Botones lado a lado ────────────────────────────
    const btnSpacing = 160;
    const btnY = cy + 100;

    const btnTry = this.add.image(cx - btnSpacing, btnY, 'btn_try_again')
      .setDisplaySize(260, 72).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btnTry, alpha: 1, duration: 400, delay: 600 });
    btnTry.on('pointerover',  () => btnTry.setTint(0xdddddd));
    btnTry.on('pointerout',   () => btnTry.clearTint());
    btnTry.on('pointerdown',  () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SaveService.clear();
        this.scene.start(SCENES.SELECT);
      });
    });

    const btnMenu = this.add.image(cx + btnSpacing, btnY, 'btn_main_menu')
      .setDisplaySize(260, 72).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btnMenu, alpha: 1, duration: 400, delay: 700 });
    btnMenu.on('pointerover',  () => btnMenu.setTint(0xdddddd));
    btnMenu.on('pointerout',   () => btnMenu.clearTint());
    btnMenu.on('pointerdown',  () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SaveService.clear();
        this.scene.start(SCENES.MENU);
      });
    });
  }
}
