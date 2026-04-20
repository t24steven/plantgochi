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

    // Panel con fondo nuevo — menu_games: 1079x712 → aspecto 1.52
    this.panel = this.add.image(cx, this.gy(340), 'mg_menu_bg')
      .setDisplaySize(this.gx(860), this.gy(565))
      .setDepth(10);

    // Cards centradas dentro del panel
    this._makeGameCard(cx - this.gx(200), this.gy(320), 'mg_card_fertilizer', 'Catch the fertilizer', SCENES.FERTILIZER);
    this._makeGameCard(cx + this.gx(200), this.gy(320), 'mg_card_bugs',       'Kill the bugs',        SCENES.BUG_DEFENSE);

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
      new Phaser.Geom.Rectangle(-this.gx(100), -this.gy(130), this.gx(200), this.gy(260)),
      Phaser.Geom.Rectangle.Contains
    );

    const icon = this.add.image(0, -this.gy(20), iconKey)
      .setDisplaySize(this.gx(160), this.gy(160));

    const label = this.add.text(0, this.gy(90), labelText, {
      fontSize: `${this.gx(20)}px`,
      color: '#4a8c1c',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    card.add([icon, label]);

    card.on('pointerover',  () => icon.setTint(0xeeeeee));
    card.on('pointerout',   () => icon.clearTint());
    card.on('pointerdown', () => {
      this.tweens.add({ targets: icon, scale: 0.94, duration: 50, yoyo: true });
      this.time.delayedCall(80, () => this.scene.start(sceneKey));
    });
  }

  gx(v) { return v * (this.cameras.main.width / this.baseWidth); }
  gy(v) { return v * (this.cameras.main.height / this.baseHeight); }
}
