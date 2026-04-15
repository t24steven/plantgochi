import Phaser from 'phaser';
import { SCENES, WEATHER } from '../constants.js';
import { PLANTS } from '../data/plants.js';
import { SaveService } from '../services/SaveService.js';
import { EventBus, EVENTS } from '../services/EventBus.js';
import Plant from '../objects/Plant.js';
import StatsManager from '../objects/StatsManager.js';

export default class YardScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.YARD });
  }

  init(data) {
    const save      = SaveService.loadGame();
    const plantData = PLANTS.find(p => p.id === save.plantId);
    this._plantData     = plantData;
    this._saveData      = save;
    this._weather       = save.weather ?? 'sunny';
    this._weatherEndsAt = save.weatherEndsAt ?? (Date.now() + 300000);
    this._pendingReward = data?.reward ?? null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    this.baseWidth  = 1280;
    this.baseHeight = 720;

    // ── Fondo ──────────────────────────────────────────
    this.add.image(cx, cy, 'bg_yard').setDisplaySize(width, height);

    // ── Stats ──────────────────────────────────────────
    this.statsManager = new StatsManager(
      this._saveData.stats,
      this._saveData.stage      ?? 0,
      this._saveData.growthTime ?? 0
    );
    this.statsManager.coins = this._saveData.coins ?? 0;
    this.statsManager.setWeather(this._weather);
    this.statsManager.startDecay(this);
    this._fertStock = this._saveData.fertilizerStock ?? 0;

    // ── Recompensa de minijuego (si viene de uno) ──────
    if (this._pendingReward) {
      const r = this._pendingReward;
      if (r.coins)          this.statsManager.coins += r.coins;
      if (r.fertilizerBags) this._fertStock += r.fertilizerBags;
      if (r.water)          this.statsManager.stats.water = Math.min(100, (this.statsManager.stats.water ?? 0) + r.water);
      if (r.sun)            this.statsManager.stats.sun   = Math.min(100, (this.statsManager.stats.sun   ?? 0) + r.sun);
      this._saveData.stats = { ...this.statsManager.stats };
      this._saveData.coins = this.statsManager.coins;
      this._pendingReward  = null;
    }
    this.plant = new Plant(this, cx, cy, this._plantData, this._saveData.stage ?? 0, this.statsManager);
    if (this._saveData.equippedHat) this.plant.setHat(this._saveData.equippedHat);
    if (this._saveData.equippedPot) this.plant.setPot(this._saveData.equippedPot);
    if (this._saveData.equippedCan) this.plant.setCan(this._saveData.equippedCan);

    // ── UI ─────────────────────────────────────────────
    this._createTopBar();
    this._createStatsUI();
    this._createBottomButtons();
    this._createMinigamesNotebook();

    // ── Clima ──────────────────────────────────────────
    this._particles = null;
    this._weatherLabel = null;
    this._applyWeather(this._weather, false);
    this._startWeatherCycle();

    // ── Sol pasivo en exterior ─────────────────────────
    // Cada 15s suma sun si el clima lo permite
    this._sunTimer = this.time.addEvent({
      delay: 15000,
      loop:  true,
      callback: () => {
        const noSun = ['snowy', 'cloudy'].includes(this._weather);
        if (!noSun) {
          this.statsManager.add('sun', 4); // menos que el decay para que siga bajando
          this._updateBar('sun');
        }
      }
    });

    // ── Stage up listener ──────────────────────────────
    // Solo en GameScene — YardScene no necesita duplicarlo

    // ── Muerte de planta en exterior ───────────────────
    EventBus.on(EVENTS.PLANT_DIED, () => {
      this.statsManager?.stopDecay();
      this._sunTimer?.remove();
      this.time.delayedCall(1500, () => {
        this.scene.start(SCENES.GAME_OVER);
      });
    }, this);
  }

  // ── Clima ─────────────────────────────────────────────
  _pickWeather() {
    const total = WEATHER.WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WEATHER.TYPES.length; i++) {
      r -= WEATHER.WEIGHTS[i];
      if (r <= 0) return WEATHER.TYPES[i];
    }
    return WEATHER.TYPES[0];
  }

  _startWeatherCycle() {
    const remaining = this._weatherEndsAt - Date.now();

    const scheduleNext = (delay) => {
      this._weatherTimer = this.time.delayedCall(delay, () => {
        const next     = this._pickWeather();
        const duration = Phaser.Math.Between(WEATHER.MIN_DURATION, WEATHER.MAX_DURATION);
        this._weatherEndsAt = Date.now() + duration;
        this._applyWeather(next, true);
        scheduleNext(duration);
      });
    };

    // Si el clima actual ya expiró, cambia ahora; si no, espera el tiempo restante
    scheduleNext(remaining > 0 ? remaining : 0);
  }

  _applyWeather(type, animate) {
    this._weather = type;
    this.statsManager.setWeather(type);

    // ── Limpiar partículas anteriores ──────────────────
    if (this._particles) {
      this._particles.destroy();
      this._particles = null;
    }

    // ── Icono/label de clima en HUD ────────────────────
    const icons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', snowy: '❄️' };
    const { width } = this.cameras.main;

    if (this._weatherLabel) this._weatherLabel.destroy();
    this._weatherLabel = this.add.text(width - this.gx(20), this.gy(20),
      icons[type] ?? '☀️', { fontSize: '32px' }
    ).setOrigin(1, 0).setDepth(10);

    if (animate) {
      this._weatherLabel.setAlpha(0);
      this.tweens.add({ targets: this._weatherLabel, alpha: 1, duration: 600 });
    }

    // ── Partículas ─────────────────────────────────────
    const { height } = this.cameras.main;

    if (type === 'rainy') {
      this._particles = this.add.particles(0, -20, 'fx_water_drop', {
        x:         { min: 0, max: width },
        speedY:    { min: 200, max: 350 },
        speedX:    { min: -20, max: 20 },
        scale:     { start: 0.3, end: 0.1 },
        alpha:     { start: 0.7, end: 0 },
        lifespan:  1800,
        frequency: 60,
        quantity:  2,
      }).setDepth(8);
    } else if (type === 'snowy') {
      this._particles = this.add.particles(0, -20, 'fx_soil', {
        x:         { min: 0, max: width },
        speedY:    { min: 40, max: 90 },
        speedX:    { min: -30, max: 30 },
        scale:     { start: 0.25, end: 0.05 },
        alpha:     { start: 0.8, end: 0 },
        tint:      0xddeeff,
        lifespan:  3500,
        frequency: 120,
        quantity:  1,
      }).setDepth(8);
    }
  }

  // ── Barra superior: monedas + fertilizante ────────────
  _createTopBar() {
    const pillW = this.gx(200);
    const pillH = this.gy(62);
    const y     = this.gy(52);

    // Monedas
    const cx1 = this.gx(48) + pillW / 2;
    this.add.image(cx1, y, 'ui_coin').setDisplaySize(pillW, pillH).setDepth(5);
    this.add.image(cx1 - this.gx(70), y, 'ui_coin').setDisplaySize(36, 36).setDepth(6);
    this._coinText = this.add.text(cx1 + this.gx(5), y, `${this.statsManager.coins}`, {
      fontSize: '24px', color: '#7a5200',
      fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(7);

    // Fertilizante stock (segunda píldora)
    const cx2 = this.gx(48) + pillW / 2 + pillW + this.gx(20);
    this.add.image(cx2, y, 'ui_coin').setDisplaySize(pillW, pillH).setDepth(5);
    this.add.image(cx2 - this.gx(70), y, 'icon_fer').setDisplaySize(36, 36).setDepth(6);
    this._fertStockText = this.add.text(cx2 + this.gx(5), y, `${this._fertStock}`, {
      fontSize: '22px', color: '#4a7a1e',
      fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(7);
  }

  // ── Barras de stats izquierda ─────────────────────────
_createStatsUI() {
  const barW   = this.gx(260);
  const barH   = this.gy(78);
  const x      = this.gx(48) + barW / 2;
  const startY = this.gy(140);  // Ajustado de 170 a 140 para subir barras
  const gap    = this.gy(16);

  const defs = [
    { key: 'icon_water', stat: 'water',      fill: 0x29b6f6, value: this._saveData.stats.water },
    { key: 'icon_sun',   stat: 'sun',        fill: 0xfdd835, value: this._saveData.stats.sun },
    { key: 'icon_seeds', stat: 'fertilizer', fill: 0x66bb6a, value: this._saveData.stats.fertilizer },
  ];

  this._bars = {};

  defs.forEach(({ key, stat, fill, value }, i) => {
    const y = startY + i * (barH + gap);

    this.add.image(x, y, 'ui_status_bar').setDisplaySize(barW, barH).setDepth(5);

    const iconSize = barH * 0.75;
    // Icono movido más a la izquierda para coincidir con screenshot
    this.add.image(x - barW / 2 + iconSize * 0.45, y, key)
      .setDisplaySize(iconSize, iconSize).setDepth(7);

    const railLeft = x - barW / 2 + iconSize * 1.0;  // Ajustado de 1.1 a 1.0
    const railW    = barW / 2 + this.gx(20);
    const railH    = barH * 0.32;

    this.add.rectangle(railLeft + railW / 2, y, railW, railH, 0x00000033).setDepth(6);

    const gfx = this.add.graphics().setDepth(7);
    this._drawBar(gfx, railLeft, y - railH / 2, railW, railH, fill, value);

    const pct = this.add.text(railLeft + railW / 2, y + barH * 0.28,
      `${Math.round(value)}%`, {
        fontSize: '12px', color: '#5a3e1b',
        fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(8);

    this._bars[stat] = { gfx, pct, railLeft, railH, railW, fill, y };
  });
}


  // ── Libreta de minijuegos (top right) ─────────────────
  _createMinigamesNotebook() {
    const { width } = this.cameras.main;
    const x = width - this.gx(80);
    const y = this.gy(130);

    const btn = this.add.image(x, y, 'icon_notebook')
      .setDisplaySize(this.gx(90), this.gx(90))
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setTint(0xdddddd));
    btn.on('pointerout',  () => btn.clearTint());
    btn.on('pointerdown', () => {
      this.tweens.add({ targets: btn, scaleX: 0.88, scaleY: 0.88, duration: 70, yoyo: true });
      this._showMinigamesInfo();
    });
  }

  // ── Panel info minijuegos ─────────────────────────────
  _showMinigamesInfo() {
    if (this._infoPanel) return;

    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    this._infoPanel = this.add.container(cx, cy).setDepth(20);

    const bg = this.add.rectangle(0, 0, 600, 400, 0xfdf6e3, 0.97)
      .setStrokeStyle(3, 0xc8a96e);

    const title = this.add.text(0, -160, '🎮 Mini Games', {
      fontSize: '30px', color: '#5a3e1b',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    const games = [
      { icon: '🌿', name: 'Catch the Fertilizer', reward: '+Coins  +Fertilizer' },
      { icon: '🐛', name: 'Kill the Bugs',         reward: '+Coins' },
    ];

    const gameObjs = games.map((g, i) => {
      const y = -80 + i * 90;
      const line = this.add.text(0, y,
        `${g.icon}  ${g.name}\n     Reward: ${g.reward}`, {
          fontSize: '18px', color: '#5a3e1b',
          fontFamily: 'Arial', lineSpacing: 4, align: 'left'
        }).setOrigin(0.5);
      return line;
    });

    const btnPlay = this.add.text(0, 160, '▶  Go to Games', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial',
      backgroundColor: '#4CAF50', padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnPlay.on('pointerdown', () => {
      this._goBack();
      this.time.delayedCall(100, () => this.scene.start(SCENES.MINIGAMES_MENU));
    });

    const btnClose = this.add.text(270, -185, '✕', {
      fontSize: '26px', color: '#5a3e1b', fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnClose.on('pointerdown', () => {
      this._infoPanel.destroy();
      this._infoPanel = null;
    });

    this._infoPanel.add([bg, title, ...gameObjs, btnPlay, btnClose]);

    this._infoPanel.setScale(0.8).setAlpha(0);
    this.tweens.add({
      targets: this._infoPanel, scale: 1, alpha: 1,
      duration: 200, ease: 'Back.easeOut'
    });
  }

  // ── Botones abajo ─────────────────────────────────────
  _createBottomButtons() {
    const { width, height } = this.cameras.main;
    const size = this.gx(105);
    const y    = height - this.gy(65);

    // Izquierda: gamepad → minijuegos
    this._makeBtn(this.gx(100), y, 'icon_gamepad', size, () => {
      SaveService.saveGame({
        ...this._saveData,
        ...this.statsManager.toJSON(),
      });
      this.scene.start(SCENES.MINIGAMES_MENU);
    });

    // Derecha: fertilizante
    this._makeBtn(width - this.gx(200), y, 'icon_fertilizer', size, () => {
      if (this._fertStock <= 0) {
        this._showHint(width - this.gx(200), y - 60, 'No fertilizer! 🌿');
        return;
      }
      this._fertStock--;
      this.statsManager.add('fertilizer', 20);
      this._updateBar('fertilizer');
      if (this._fertStockText) this._fertStockText.setText(`${this._fertStock}`);
      this.plant.playHappyEffect();
      this._showHint(width - this.gx(200), y - 60, '+Fertilizer 🌱');
    });

    // Derecha: door → volver al interior
    this._makeBtn(width - this.gx(80), y, 'icon_door', size, () => this._goBack());
  }


  // ── Helpers ───────────────────────────────────────────
  _makeBtn(x, y, key, size, callback) {
    const btn = this.add.image(x, y, key)
      .setDisplaySize(size, size)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      callback();
      this.tweens.add({ targets: btn, scaleX: 0.88, scaleY: 0.88, duration: 70, yoyo: true });
    });
    btn.on('pointerover', () => btn.setTint(0xdddddd));
    btn.on('pointerout',  () => btn.clearTint());
    return btn;
  }

  _showHint(x, y, msg) {
    const hint = this.add.text(x, y, msg, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#1b5e20dd',
      padding: { x: 12, y: 6 }, fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: hint, y: y - 30, alpha: 0,
      duration: 1200, ease: 'Power2',
      onComplete: () => hint.destroy()
    });
  }

  _drawBar(gfx, railLeft, railTop, railW, railH, fill, value) {
    const color = value < 30 ? 0xe53935 : value < 60 ? 0xffa726 : fill;
    const fillW = Math.max((Phaser.Math.Clamp(value, 0, 100) / 100) * railW, 3);
    gfx.clear();
    gfx.fillStyle(color, 0.85);
    gfx.fillRoundedRect(railLeft, railTop, fillW, railH, 5);
    gfx.fillStyle(0xffffff, 0.2);
    gfx.fillRoundedRect(railLeft, railTop, fillW, railH * 0.4, 4);
  }

  _updateBar(stat) {
    const bar = this._bars[stat];
    if (!bar) return;
    const value = this.statsManager[stat];
    this._drawBar(bar.gfx, bar.railLeft, bar.y - bar.railH / 2, bar.railW, bar.railH, bar.fill, value);
    bar.pct?.setText(`${Math.round(value)}%`);
  }

  gx(v) { return v * (this.cameras.main.width  / this.baseWidth);  }
  gy(v) { return v * (this.cameras.main.height / this.baseHeight); }

  _goBack() {
    SaveService.saveGame({
      ...this._saveData,
      ...this.statsManager.toJSON(),
      weather:         this._weather,
      weatherEndsAt:   this._weatherEndsAt,
      fertilizerStock: this._fertStock,
    });
    this.scene.start(SCENES.GAME);
  }

  shutdown() {
    this.statsManager?.stopDecay();
    this._weatherTimer?.remove();
    this._sunTimer?.remove();
    this._particles?.destroy();
    this._weatherLabel?.destroy();
    this._infoPanel?.destroy();
    this.plant?.destroy();
    EventBus.off(EVENTS.STAGE_UP,   null, this);
    EventBus.off(EVENTS.PLANT_DIED, null, this);
    SaveService.saveGame({
      ...this._saveData,
      ...this.statsManager.toJSON(),
      weather:         this._weather,
      weatherEndsAt:   this._weatherEndsAt,
      fertilizerStock: this._fertStock,
    });
  }

}
