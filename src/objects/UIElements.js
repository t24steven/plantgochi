import Phaser from 'phaser';
import { COLORS } from '../constants.js';
import { EventBus, EVENTS } from '../services/EventBus.js';
export default class UIElements {

  constructor(scene, statsManager) {
    this._scene  = scene;
    this._stats  = statsManager;
    this._bars   = {};
    this._coinText = null;

    this.baseWidth  = 1280;
    this.baseHeight = 720;
    this.width  = scene.scale.width;
    this.height = scene.scale.height;

    this._createCoinsBar();
    this._createStatBars();
    this._createLeftButtons();
    this._createRightButtons();
    this._createNotification();
    this._listen();
  }

  getX(v) { return v * (this.width  / this.baseWidth);  }
  getY(v) { return v * (this.height / this.baseHeight); }

  // ── Monedas ───────────────────────────────────────────
  _createCoinsBar() {
    const s     = this._scene;
    const pillW = this.getX(220);
    const pillH = this.getY(65);
    const x     = this.getX(48) + pillW / 2;
    const y     = this.getY(52);

    s.add.image(x, y, 'ui_coin').setDisplaySize(pillW, pillH).setDepth(5);

    this._coinText = s.add.text(x + this.getX(10), y, `${this._stats.coins}`, {
      fontSize: '26px', color: '#7a5200',
      fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(7);
  }

  // ── Barras de stats ───────────────────────────────────
  _createStatBars() {
    const s      = this._scene;
    const barW   = this.getX(260);
    const barH   = this.getY(78);
    const x      = this.getX(48) + barW / 2;
    const startY = this.getY(170);
    const gap    = this.getY(16);

    const defs = [
      { key: 'icon_water', stat: 'water',       fill: 0x29b6f6 },
      { key: 'icon_sun',   stat: 'sun',          fill: 0xfdd835 },
      { key: 'icon_seeds', stat: 'fertilizer',   fill: 0x66bb6a },
    ];

    defs.forEach(({ key, stat, fill }, i) => {
      const y = startY + i * (barH + gap);

      // Fondo barra
      s.add.image(x, y, 'ui_status_bar').setDisplaySize(barW, barH).setDepth(5);

      // Icono
      const iconSize = barH * 0.75;
      s.add.image(x - barW / 2 + iconSize * 0.6, y, key)
        .setDisplaySize(iconSize, iconSize).setDepth(7);

      // Rail
      const railLeft = x - barW / 2 + iconSize * 1.1;
      const railW    = barW / 2 + this.getX(20);
      const railH    = barH * 0.32;
      const railX    = railLeft + railW / 2;

      s.add.rectangle(railX, y, railW, railH, 0x00000033).setDepth(6);

      const gfx = s.add.graphics().setDepth(7);

      const value = this._stats[stat] ?? 100;
      this._drawBar(gfx, railLeft, y - railH / 2, railW, railH, fill, value);

      const pct = s.add.text(railX, y + barH * 0.28, `${Math.round(value)}%`, {
        fontSize: '12px', color: '#5a3e1b',
        fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(8);

      this._bars[stat] = { gfx, pct, railLeft, railH, railW, fill, y };
    });
  }

  // ── Botones izquierda (abajo) ─────────────────────────
  _createLeftButtons() {
    const size  = this.getX(105);
    const x     = this.getX(60) + size / 2;
    const y1    = this.height - this.getY(230);
    const y2    = this.height - this.getY(105);

    this._makeBtn(x, y1, 'icon_cabinet',  size, () => EventBus.emit(EVENTS.OPEN_WARDROBE));
    this._makeBtn(x, y2, 'icon_bag',      size, () => EventBus.emit(EVENTS.OPEN_STORE));
  }

  // ── Botones derecha ───────────────────────────────────
  _createRightButtons() {
  const size   = this.getX(110);
  const x      = this.width - this.getX(110);
  const yWater = this.height - this.getY(170);
  const yDoor  = this.height - this.getY(60);

  this._makeBtn(x, this.getY(90), 'icon_notebook', size * 0.9,
    () => EventBus.emit(EVENTS.OPEN_NOTEBOOK));

  this._makeBtn(x, yWater, 'icon_watering', size,
    () => this._onWater());

  this._makeBtn(x, yDoor, 'icon_door', size,
    () => EventBus.emit(EVENTS.GO_YARD));
}


  // ── Helper botón ──────────────────────────────────────
  _makeBtn(x, y, key, size, callback) {
    const btn = this._scene.add.image(x, y, key)
      .setDisplaySize(size, size)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      callback();
      this._scene.tweens.add({ targets: btn, scaleX: 0.88, scaleY: 0.88, duration: 70, yoyo: true });
    });
    btn.on('pointerover', () => btn.setTint(0xdddddd));
    btn.on('pointerout',  () => btn.clearTint());
    return btn;
  }

  // ── Helper dibujar barra ──────────────────────────────
  _drawBar(gfx, railLeft, railTop, railW, railH, fill, value) {
    const color  = value < 30 ? 0xe53935 : value < 60 ? 0xffa726 : fill;
    const fillW  = Math.max((Phaser.Math.Clamp(value, 0, 100) / 100) * railW, 3);

    gfx.clear();
    gfx.fillStyle(color, 0.85);
    gfx.fillRoundedRect(railLeft, railTop, fillW, railH, 5);
    gfx.fillStyle(0xffffff, 0.2);
    gfx.fillRoundedRect(railLeft, railTop, fillW, railH * 0.4, 4);
  }

  // ── Notificación flotante ─────────────────────────────
  _createNotification() {
    this._notification = this._scene.add.text(
      this.width / 2, this.getY(240), '', {
        fontSize: '18px', color: '#ffffff',
        backgroundColor: '#1b5e20dd',
        padding: { x: 18, y: 9 },
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5).setAlpha(0).setVisible(false).setDepth(30);
  }

  showNotification(msg) {
    const n = this._notification;
    n.setText(msg).setVisible(true).setAlpha(0);
    this._scene.tweens.add({
      targets: n, alpha: 1, duration: 180,
      onComplete: () => {
        this._scene.time.delayedCall(2200, () => {
          this._scene.tweens.add({
            targets: n, alpha: 0, duration: 220,
            onComplete: () => n.setVisible(false)
          });
        });
      }
    });
  }

  // ── Regar ─────────────────────────────────────────────
  _onWater() {
    this._stats.add('water', 20);
    EventBus.emit(EVENTS.PLANT_WATERED);
    this.showNotification('💧 Plant watered!');
  }

  // ── Escuchar cambios ──────────────────────────────────
  _listen() {
    this._onStatChanged = ({ stat, value, source }) => {
      if (this._destroyed) return;
      if (source !== this._stats) return; // ignorar eventos de otros StatsManagers
      const bar = this._bars[stat];
      if (!bar || !bar.pct) return;
      this._drawBar(bar.gfx, bar.railLeft, bar.y - bar.railH / 2, bar.railW, bar.railH, bar.fill, value);
      bar.pct.setText(`${Math.round(value)}%`);
    };

    this._onCoinsUpdated = ({ amount, source }) => {
      if (this._destroyed || !this._coinText) return;
      if (source !== this._stats) return; // ignorar eventos de otros StatsManagers
      this._coinText.setText(`${amount}`);
      this._scene.tweens.add({
        targets: this._coinText, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true
      });
    };

    EventBus.on(EVENTS.STAT_CHANGED,  this._onStatChanged,  this);
    EventBus.on(EVENTS.COINS_UPDATED, this._onCoinsUpdated, this);
  }

  destroy() {
    this._destroyed = true;
    EventBus.off(EVENTS.STAT_CHANGED,  this._onStatChanged,  this);
    EventBus.off(EVENTS.COINS_UPDATED, this._onCoinsUpdated, this);
    this._bars      = {};
    this._coinText  = null;
  }
}
