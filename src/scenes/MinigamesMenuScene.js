import Phaser from 'phaser';
import { SCENES } from '../constants.js';

export default class MinigamesMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MINIGAMES_MENU });
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;

    this.baseWidth = 1280;
    this.baseHeight = 720;

    // Fondo
    this.add.image(cx, height/2, 'bg_exterior').setDisplaySize(width, height);

    // Panel COMPLETO con título integrado
    this.panel = this.add.image(cx, this.gy(280), 'games_bg')
      .setDisplaySize(this.gx(900), this.gy(420))
      .setDepth(10);

    // Cards EXACTAS
    this._makeGameCard(cx - this.gx(210), this.gy(310), 'mg_fertilizer_bag', 'Catch the\nFertilizer', SCENES.FERTILIZER);
    this._makeGameCard(cx + this.gx(210), this.gy(310), 'mg_bug', 'Kill the\nBugs', SCENES.BUG_DEFENSE);

    // Back
    this.btnBack = this.add.image(cx, height - this.gy(100), 'btn_back')
      .setDisplaySize(this.gx(130), this.gy(65))
      .setDepth(15)
      .setInteractive({ useHandCursor: true });

    this.btnBack.on('pointerdown', () => {
      this.tweens.add({ targets: this.btnBack, scale: 0.92, duration: 80, yoyo: true });
      this.scene.start(SCENES.YARD);
    });
  }

  _makeGameCard(x, y, iconKey, labelText, sceneKey) {
    const card = this.add.container(x, y).setDepth(12);
    card.setInteractive(
      new Phaser.Geom.Rectangle(-this.gx(80), -this.gy(110), this.gx(160), this.gy(220)),
      Phaser.Geom.Rectangle.Contains
    );

    // Icono
    const icon = this.add.image(0, 0, iconKey)
      .setDisplaySize(this.gx(110), this.gy(110));

    // Label
    const label = this.add.text(0, this.gy(75), labelText, {
      fontSize: `${this.gx(19)}px`,
      color: '#5a3e1b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: -4
    }).setOrigin(0.5);

    card.add([icon, label]);

    // SOLO CLICK (sin hover)
    card.on('pointerdown', () => {
      this.tweens.add({ targets: [icon, label], scale: 0.94, duration: 50, yoyo: true });
      this.time.delayedCall(80, () => this.scene.start(sceneKey));
    });
  }

  gx(v) { return v * (this.cameras.main.width / this.baseWidth); }
  gy(v) { return v * (this.cameras.main.height / this.baseHeight); }
}
