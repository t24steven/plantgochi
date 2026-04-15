
import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { PLANTS } from '../data/plants.js';
import { SaveService } from '../services/SaveService.js';
import { EventBus, EVENTS } from '../services/EventBus.js';
import Plant from '../objects/Plant.js';
import StatsManager from '../objects/StatsManager.js';
import UIElements from '../objects/UIElements.js';
import StorePanel from '../objects/panels/StorePanel.js';
import NotebookPanel from '../objects/panels/NotebookPanel.js';
import WardrobePanel from '../objects/panels/WardrobePanel.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
    this.plant        = null;
    this.statsManager = null;
    this.ui           = null;
    this._panels      = {};
  }

  init(data) {
  const save = data?.gameState ?? SaveService.loadGame();
  
  // Si no hay save ni data, usar planta por defecto
  if (!save) {
    this._plantData = PLANTS[0];
    this._saveData  = SaveService.newGame(PLANTS[0]);
    return;
  }

  const plantData = data?.plant
    ?? PLANTS.find(p => p.id === save.plantId)
    ?? PLANTS[0];

  this._plantData = plantData;
  this._saveData  = save;
}


  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // ── Fondo ──────────────────────────────────────────
    this.add.image(cx, cy, 'bg_interior').setDisplaySize(width, height);

    // ── Stats ──────────────────────────────────────────
    this.statsManager = new StatsManager(
      this._saveData.stats,
      this._saveData.stage      ?? 0,
      this._saveData.growthTime ?? 0
    );
    this.statsManager.coins = this._saveData.coins ?? 0;
    this.statsManager.startDecay(this);

    // ── Planta ─────────────────────────────────────────
    this.plant = new Plant(this, cx, cy, this._plantData, this._saveData.stage ?? 0, this.statsManager);

    // Hat equipado al cargar
    if (this._saveData.equippedHat) this.plant.setHat(this._saveData.equippedHat);
    if (this._saveData.equippedPot) this.plant.setPot(this._saveData.equippedPot);
    if (this._saveData.equippedCan) this.plant.setCan(this._saveData.equippedCan);

    // ── UI ─────────────────────────────────────────────
    this.ui = new UIElements(this, this.statsManager);

    // ── Panels ─────────────────────────────────────────
    this._panels.store    = new StorePanel(this, this.statsManager);
    this._panels.wardrobe = new WardrobePanel(this, this.statsManager, this.plant);
    this._panels.notebook = new NotebookPanel(this, this._plantData);

    // ── Listeners ──────────────────────────────────────
    this._registerEvents();

    // ── Audio ──────────────────────────────────────────
    // El sonido se maneja globalmente — solo arranca una vez
    // y sobrevive cambios de escena gracias al check de 'bgm'
    const existing = this.sound.get('bgm');
    if (!existing) {
      const bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
      // Phaser respeta la política de autoplay: si el usuario ya interactuó
      // (presionó Start en MenuScene) el audio arranca sin problema
      bgm.play().catch?.(() => {
        // Fallback: arrancar en la próxima interacción del usuario
        this.input.once('pointerdown', () => bgm.play());
      });
    } else if (!existing.isPlaying) {
      existing.play();
    }
  }

  // ── Eventos ───────────────────────────────────────────
  _registerEvents() {
    EventBus.on(EVENTS.OPEN_STORE,    () => this._panels.store?.show(),    this);
    EventBus.on(EVENTS.OPEN_WARDROBE, () => this._panels.wardrobe?.show(), this);
    EventBus.on(EVENTS.OPEN_NOTEBOOK, () => this._panels.notebook?.show(), this);

    EventBus.on(EVENTS.GO_YARD, () => {
      this._save();
      this.scene.start(SCENES.YARD);
    }, this);

    EventBus.on(EVENTS.PLANT_DIED, () => {
      if (!this.scene.isActive(SCENES.GAME)) return;
      this._save();
      this.time.delayedCall(1500, () => {
        this.scene.start(SCENES.GAME_OVER);
      });
    }, this);

    EventBus.on(EVENTS.STAGE_UP, ({ stage }) => {
      this.plant?.setStage(stage);
      this._saveData.stage = stage;
    }, this);
  }

  // ── Guardar ───────────────────────────────────────────
  _save() {
    const currentSave = SaveService.loadGame() ?? this._saveData;
    const json = this.statsManager.toJSON();
    SaveService.saveGame({
      ...currentSave,
      ...json,
      plantId:     this._plantData.id,
      equippedHat: currentSave.equippedHat ?? null,
      equippedPot: currentSave.equippedPot ?? null,
      equippedCan: currentSave.equippedCan ?? null,
      ownedItems:  currentSave.ownedItems  ?? [],
    });
    this._saveData = SaveService.loadGame();
  }

  // ── Update ────────────────────────────────────────────
  update() {
    // Guardar cada 30 segundos automáticamente
    if (!this._lastSave) this._lastSave = 0;
    this._lastSave += this.game.loop.delta;
    if (this._lastSave >= 30000) {
      this._save();
      this._lastSave = 0;
    }
  }

  // ── Limpieza ──────────────────────────────────────────
  shutdown() {
    this.statsManager?.stopDecay();
    this.ui?.destroy();           // primero destruir UI para evitar listeners zombie
    this.plant?.destroy();
    Object.values(this._panels).forEach(p => p?.hide?.());
    this._save();
    EventBus.off(EVENTS.OPEN_STORE,    null, this);
    EventBus.off(EVENTS.OPEN_WARDROBE, null, this);
    EventBus.off(EVENTS.OPEN_NOTEBOOK, null, this);
    EventBus.off(EVENTS.GO_YARD,       null, this);
    EventBus.off(EVENTS.PLANT_DIED,    null, this);
    EventBus.off(EVENTS.STAGE_UP,      null, this);
  }
}
