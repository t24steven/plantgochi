import { COLORS } from '../../constants.js';

export default class NotebookPanel {

  constructor(scene, plantData) {
    this._scene     = scene;
    this._plantData = plantData;
    this._container = null;

    // Mapeo de id de planta a key de info card
    this._infoKeys = {
      cactus:     'info_cactus',
      snakeplant: 'info_snake',
      sunflower:  'info_sun',
    };
  }

  show() {
    if (this._container) return;

    const s  = this._scene;
    const cx = 640;
    const cy = 360;

    this._container = s.add.container(cx, cy);

    // ── Fondo panel ────────────────────────────────────
    const bg = s.add.rectangle(0, 0, 680, 480, 0xfdf6e3, 1)
  .setStrokeStyle(3, 0xc8a96e)
  .setAlpha(0.5); // afecta fill + stroke juntos

    // ── Info card de la planta (imagen completa) ───────
    const infoKey = this._infoKeys[this._plantData.id] ?? `${this._plantData.id}_default`;
    const infoImg = s.add.image(0, 0, infoKey)
      .setDisplaySize(640, 420);

    // ── Botón cerrar ───────────────────────────────────
    const btnClose = s.add.text(310, -220, '✕', {
      fontSize: '28px', color: '#5a3e1b', fontFamily: 'Arial',
      stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnClose.on('pointerover',  () => btnClose.setStyle({ color: COLORS.danger }));
    btnClose.on('pointerout',   () => btnClose.setStyle({ color: '#5a3e1b' }));
    btnClose.on('pointerdown',  () => this.hide());

    this._container.add([bg, infoImg, btnClose]);
    this._container.setDepth(10);

    // ── Animación entrada ──────────────────────────────
    this._container.setScale(0.8).setAlpha(0);
    s.tweens.add({
      targets:  this._container,
      scale:    1,
      alpha:    1,
      duration: 200,
      ease:     'Back.easeOut'
    });
  }

  hide() {
    if (!this._container) return;
    this._scene.tweens.add({
      targets:  this._container,
      scale:    0.8,
      alpha:    0,
      duration: 150,
      ease:     'Power2',
      onComplete: () => {
        this._container.destroy();
        this._container = null;
      }
    });
  }
}
