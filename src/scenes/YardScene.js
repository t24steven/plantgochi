import Phaser from 'phaser';
import { SCENES, WEATHER } from '../constants.js';
import { PLANTS } from '../data/plants.js';
import { GameState } from '../services/GameState.js';
import { EventBus, EVENTS } from '../services/EventBus.js';
import Plant from '../objects/Plant.js';
import StatsManager from '../objects/StatsManager.js';

export default class YardScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.YARD });
  }

  init(data) {
    let save = null;
    try {
      const raw = localStorage.getItem('ptg_save');
      save = raw ? JSON.parse(raw) : null;
    } catch(e) { save = null; }
    if (!save) return;
    const plantData = PLANTS.find(p => p.id === save.plantId) ?? PLANTS[0];
    this._plantData     = plantData;
    this._saveData      = JSON.parse(JSON.stringify(save));
    this._weather       = save.weather ?? 'sunny';
    this._weatherEndsAt = save.weatherEndsAt ?? (Date.now() + 300000);
    this._pendingReward = data?.reward ?? null;
    GameState.load(save); // sincronizar GameState al entrar al yard
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
      this._saveData.stage           ?? 0,
      this._saveData.growthTime      ?? 0,
      this._saveData.stageGrowthTime ?? 0
    );
    this.statsManager.coins = this._saveData.coins ?? 0;
    this.statsManager.setWeather(this._weather);
    this.statsManager.startDecay(this);
    this._fertStock = this._saveData.fertilizerStock ?? 0;

    // ── Recompensa de minijuego (si viene de uno) ──────
    // Se aplica DESPUÉS de crear la UI para que _coinText exista
    this._pendingRewardData = this._pendingReward;
    this._pendingReward = null;

    this.plant = new Plant(this, cx, cy, this._plantData, this._saveData.stage ?? 0, this.statsManager);
    if (this._saveData.equippedHat) this.plant.setHat(this._saveData.equippedHat);
    if (this._saveData.equippedPot) this.plant.setPot(this._saveData.equippedPot);
    if (this._saveData.equippedCan) this.plant.setCan(this._saveData.equippedCan);

    // ── UI ─────────────────────────────────────────────
    this._createTopBar();
    this._createStatsUI();
    this._createBottomButtons();
    this._createMinigamesNotebook();

    // ── Aplicar recompensa ahora que la UI existe ──────
    if (this._pendingRewardData) {
      const r = this._pendingRewardData;
      if (r.coins > 0)          this.statsManager.addCoins(r.coins);
      if (r.fertilizerBags > 0) {
        this._fertStock += r.fertilizerBags;
        if (this._fertStockText) this._fertStockText.setText(`${this._fertStock}`);
      }
      if (r.water > 0) this.statsManager.add('water', r.water);
      if (r.sun > 0)   this.statsManager.add('sun', r.sun);
      this._saveData.coins           = this.statsManager.coins;
      this._saveData.stats           = { ...this.statsManager.stats };
      this._saveData.fertilizerStock = this._fertStock;
      this._pendingRewardData = null;
    }

    // ── Clima ──────────────────────────────────────────
    this._particles = null;
    this._weatherLabel = null;
    this._applyWeather(this._weather, false);
    this._startWeatherCycle();

    // ── Sol pasivo eliminado — ahora el sol sube clickeando soles que caen ──

    // ── Soles que caen en el patio ─────────────────────
    this._spawnSuns();

    // ── Stage up listener ──────────────────────────────
    this._onStageUp = ({ stage }) => {
      if (this.plant && !this.plant._destroyed) {
        this.plant.setStage(stage);
      }
      if (this._saveData) this._saveData.stage = stage;
    };
    EventBus.on(EVENTS.STAGE_UP, this._onStageUp, this);

    // ── Muerte de planta en exterior ───────────────────
    this._onPlantDied = () => {
      this.statsManager?.stopDecay();
      this._sunTimer?.remove();
      this.time.delayedCall(1500, () => {
        this.scene.start(SCENES.GAME_OVER);
      });
    };
    EventBus.on(EVENTS.PLANT_DIED, this._onPlantDied, this);

    // ── Actualizar barras cuando cambian los stats ──────
    this._onStatChanged = ({ stat, source }) => {
      if (source !== this.statsManager) return;
      this._updateBar(stat);
    };
    EventBus.on(EVENTS.STAT_CHANGED, this._onStatChanged, this);

    // ── Actualizar texto de monedas ─────────────────────
    this._onCoinsUpdated = ({ amount, source }) => {
      if (source !== this.statsManager) return;
      if (this._coinText && !this._coinText.destroyed) this._coinText.setText(`${amount}`);
    };
    EventBus.on(EVENTS.COINS_UPDATED, this._onCoinsUpdated, this);
  }

  // ── Soles que caen ────────────────────────────────────
  _spawnSuns() {
    const scheduleNext = () => {
      this._sunSpawnTimer = this.time.delayedCall(
        Phaser.Math.Between(1500, 3000), // más frecuentes (antes 2000-4000)
        () => {
          if (!this.statsManager || this.statsManager.isDead()) return;
          const noSun = ['snowy', 'cloudy'].includes(this._weather);
          if (!noSun) this._dropSun();
          scheduleNext();
        }
      );
    };
    scheduleNext();
  }

  _dropSun() {
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(this.gx(100), width - this.gx(100));

    // Sol más grande y visible
    const sun = this.add.image(x, -60, 'fx_sun_ray')
      .setDisplaySize(this.gx(90), this.gx(90)) // más grande (antes 70)
      .setDepth(6)
      .setInteractive({ useHandCursor: true })
      .setAlpha(1);

    // Rotación continua
    this.tweens.add({
      targets: sun, angle: 360,
      duration: 1800, repeat: -1, ease: 'Linear'
    });

    // Caída más lenta para que sea más fácil clickear
    this.tweens.add({
      targets: sun,
      y: height * 0.80,
      duration: 5000, // más lento (antes 3500)
      ease: 'Linear',
      onComplete: () => {
        if (sun.active) {
          this.tweens.add({
            targets: sun, alpha: 0, duration: 400,
            onComplete: () => { try { sun.destroy(); } catch(e) {} }
          });
        }
      }
    });

    // Click → suma sol + efecto
    sun.on('pointerdown', () => {
      if (!sun.active) return;
      sun.disableInteractive();

      const gain = 20; // más ganancia (antes 15)
      this.statsManager.add('sun', gain);
      this._showHint(sun.x, sun.y - 40, `☀️ +${gain} Sun`);
      this.sound?.play('sfx_click', { volume: 0.5 });

      this.tweens.add({
        targets: sun,
        scaleX: 2.0, scaleY: 2.0,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => { try { sun.destroy(); } catch(e) {} }
      });
    });

    sun.on('pointerover', () => sun.setTint(0xffff44));
    sun.on('pointerout',  () => sun.clearTint());
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

    // ── Limpiar efectos anteriores ─────────────────────
    if (this._particles) { this._particles.destroy(); this._particles = null; }
    if (this._weatherOverlay) { this._weatherOverlay.destroy(); this._weatherOverlay = null; }

    const { width, height } = this.cameras.main;

    // ── Overlay de color según clima ───────────────────
    const overlayColors = {
      sunny:  null,           // sin overlay
      cloudy: 0x8899aa,       // gris azulado
      rainy:  0x334466,       // azul oscuro
      snowy:  0xaaccee,       // azul claro
    };
    const overlayAlphas = { sunny: 0, cloudy: 0.18, rainy: 0.28, snowy: 0.22 };

    if (overlayColors[type]) {
      this._weatherOverlay = this.add.rectangle(
        width / 2, height / 2, width, height,
        overlayColors[type], overlayAlphas[type]
      ).setDepth(7);
      if (animate) {
        this._weatherOverlay.setAlpha(0);
        this.tweens.add({ targets: this._weatherOverlay, alpha: overlayAlphas[type], duration: 1000 });
      }
    }

    // ── Tint en la planta según clima ──────────────────
    const plantTints = { sunny: null, cloudy: 0xccddee, rainy: 0x99bbdd, snowy: 0xddeeff };
    if (this.plant) {
      const tint = plantTints[type];
      // Container no tiene setTint — aplicar a cada hijo
      this.plant.list?.forEach(child => {
        if (child && child.setTint) {
          if (tint) child.setTint(tint);
          else      child.clearTint();
        }
      });
    }

    // ── Icono/label de clima en HUD ────────────────────
    const icons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', snowy: '❄️' };
    if (this._weatherLabel) this._weatherLabel.destroy();
    this._weatherLabel = this.add.text(
      width - this.gx(20), this.gy(20),
      icons[type] ?? '☀️', { fontSize: '36px' }
    ).setOrigin(1, 0).setDepth(10);

    if (animate) {
      this._weatherLabel.setAlpha(0);
      this.tweens.add({ targets: this._weatherLabel, alpha: 1, duration: 600 });
    }

    // ── Partículas ─────────────────────────────────────
    if (type === 'rainy') {
      this._particles = this.add.particles(0, -20, 'fx_water_drop', {
        x:         { min: 0, max: width },
        speedY:    { min: 350, max: 550 },
        speedX:    { min: -30, max: 30 },
        scale:     { start: 0.45, end: 0.15 },
        alpha:     { start: 0.85, end: 0 },
        lifespan:  1400,
        frequency: 30,   // más frecuente
        quantity:  4,    // más cantidad
      }).setDepth(8);
    } else if (type === 'snowy') {
      this._particles = this.add.particles(0, -20, 'fx_soil', {
        x:         { min: 0, max: width },
        speedY:    { min: 60, max: 130 },
        speedX:    { min: -50, max: 50 },
        scale:     { start: 0.35, end: 0.08 },
        alpha:     { start: 0.9, end: 0 },
        tint:      0xddeeff,
        lifespan:  4000,
        frequency: 60,
        quantity:  3,
      }).setDepth(8);
    } else if (type === 'cloudy') {
      // Nubes: partículas lentas y grandes
      this._particles = this.add.particles(0, 0, 'fx_soil', {
        x:         { min: -100, max: width + 100 },
        y:         { min: 0, max: height * 0.4 },
        speedX:    { min: 20, max: 50 },
        speedY:    { min: -5, max: 5 },
        scale:     { start: 1.2, end: 0.6 },
        alpha:     { start: 0.15, end: 0 },
        tint:      0x8899aa,
        lifespan:  6000,
        frequency: 400,
        quantity:  1,
      }).setDepth(7);
    }
  }

  // ── Barra superior: monedas + fertilizante ────────────
  _createTopBar() {
    const pillW = this.gx(200);
    const pillH = this.gy(62);
    const y     = this.gy(52);

    // Monedas — coin.png ya incluye el ícono en el asset
    const cx1 = this.gx(48) + pillW / 2;
    this.add.image(cx1, y, 'ui_coin').setDisplaySize(pillW, pillH).setDepth(5);
    this._coinText = this.add.text(cx1 + this.gx(28), y, `${this.statsManager.coins}`, {
      fontSize: '22px', color: '#7a5200',
      fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(7);

    // Fertilizante stock
    const cx2 = cx1 + pillW + this.gx(20);
    this.add.image(cx2, y, 'ui_fertilizer_score').setDisplaySize(pillW, pillH).setDepth(5);
    this._fertStockText = this.add.text(cx2 + this.gx(28), y, `${this._fertStock}`, {
      fontSize: '22px', color: '#4a7a1e',
      fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(7);
  }

  // ── Barras de stats izquierda ─────────────────────────
  _createStatsUI() {
  const barW   = this.gx(260);
  const barH   = this.gy(78);
  const x      = this.gx(48) + barW / 2;
  const startY = this.gy(140);
  const gap    = this.gy(16);

  // Usar los stats actuales del statsManager, no del saveData
  const defs = [
    { key: 'icon_water', stat: 'water',      fill: 0x29b6f6, value: this.statsManager.water },
    { key: 'icon_sun',   stat: 'sun',        fill: 0xfdd835, value: this.statsManager.sun },
    { key: 'icon_seeds', stat: 'fertilizer', fill: 0x66bb6a, value: this.statsManager.fertilizer },
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

    this._infoPanel = this.add.container(0, 0).setDepth(20);

    const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.6);

    // Mostrar info de fertilizante primero, con botón para cambiar a bugs
    let currentInfo = 0;
    const infoKeys = ['mg_info_fertilizer', 'mg_info_bugs'];

    const infoImg = this.add.image(cx, cy - 20, infoKeys[0])
      .setDisplaySize(900, 524);

    // Botón cerrar
    const btnClose = this.add.image(cx + 440, cy - 280, 'btn_back')
      .setDisplaySize(80, 40).setInteractive({ useHandCursor: true });
    btnClose.on('pointerdown', () => {
      this._infoPanel.destroy();
      this._infoPanel = null;
    });

    // Botón siguiente (alternar entre los dos minijuegos)
    const btnNext = this.add.image(cx + 440, cy + 240, 'btn_next')
      .setDisplaySize(100, 50).setInteractive({ useHandCursor: true });
    btnNext.on('pointerdown', () => {
      currentInfo = (currentInfo + 1) % infoKeys.length;
      infoImg.setTexture(infoKeys[currentInfo]);
    });

    // Botón ir a minijuegos
    const btnPlay = this.add.image(cx, cy + 290, 'btn_select')
      .setDisplaySize(200, 60).setInteractive({ useHandCursor: true });
    const btnPlayTxt = this.add.text(cx, cy + 290, 'Play!', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    btnPlay.on('pointerover',  () => btnPlay.setTint(0xffddaa));
    btnPlay.on('pointerout',   () => btnPlay.clearTint());
    btnPlay.on('pointerdown', () => {
      this._infoPanel.destroy();
      this._infoPanel = null;
      this._saveCurrentState();
      this.scene.start(SCENES.MINIGAMES_MENU);
    });

    this._infoPanel.add([overlay, infoImg, btnClose, btnNext, btnPlay, btnPlayTxt]);

    this._infoPanel.setAlpha(0);
    this.tweens.add({ targets: this._infoPanel, alpha: 1, duration: 200 });
  }

  // ── Botones abajo ─────────────────────────────────────
  _createBottomButtons() {
    const { width, height } = this.cameras.main;
    const size = this.gx(105);
    const y    = height - this.gy(65);

    // Izquierda: gamepad → minijuegos
    this._makeBtn(this.gx(100), y, 'mg_icon_gamepad', size, () => {
      this._saveCurrentState();
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
      this.sound?.play('sfx_click', { volume: 0.4 });
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
    this._saveCurrentState();
    this.scene.start(SCENES.GAME);
  }

  _saveCurrentState() {
    if (!this.statsManager || !this._saveData) return;

    // Sincronizar GameState con el estado actual
    GameState.coins           = this.statsManager.coins;
    GameState.stats           = { ...this.statsManager.stats };
    GameState.stage           = this.statsManager.stage;
    GameState.growthTime      = this.statsManager.growthTime;
    GameState.stageGrowthTime = this.statsManager._stageGrowthTime;
    GameState.fertilizerStock = this._fertStock;
    GameState.weather         = this._weather;
    GameState.weatherEndsAt   = this._weatherEndsAt;

    const save = {
      plantId:         this._saveData.plantId,
      coins:           GameState.coins,
      stats:           { ...GameState.stats },
      stage:           GameState.stage,
      growthTime:      GameState.growthTime,
      stageGrowthTime: GameState.stageGrowthTime,
      fertilizerStock: GameState.fertilizerStock,
      weather:         GameState.weather,
      weatherEndsAt:   GameState.weatherEndsAt,
      ownedItems:      GameState.ownedItems  ?? [],
      equippedHat:     GameState.equippedHat ?? null,
      equippedPot:     GameState.equippedPot ?? null,
      equippedCan:     GameState.equippedCan ?? null,
    };
    localStorage.setItem('ptg_save', JSON.stringify(save));
    this._saveData = save;
  }

  shutdown() {
    this.statsManager?.stopDecay();  // parar decay PRIMERO
    this._saveCurrentState();
    this._weatherTimer?.remove();
    this._sunTimer?.remove();
    this._sunSpawnTimer?.remove();
    this._particles?.destroy();
    this._weatherOverlay?.destroy();
    this._weatherLabel?.destroy();
    this._infoPanel?.destroy();
    this.plant?.destroy();
    EventBus.off(EVENTS.STAGE_UP,      this._onStageUp,      this);
    EventBus.off(EVENTS.PLANT_DIED,    this._onPlantDied,    this);
    EventBus.off(EVENTS.STAT_CHANGED,  this._onStatChanged,  this);
    EventBus.off(EVENTS.COINS_UPDATED, this._onCoinsUpdated, this);
  }

}
