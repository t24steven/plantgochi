
import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import { PLANTS } from '../data/plants.js';
import { SaveService } from '../services/SaveService.js';
import { GameState } from '../services/GameState.js';
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
    if (data?.gameState) {
      const save = data.gameState;
      this._plantData = data.plant ?? PLANTS.find(p => p.id === save.plantId) ?? PLANTS[0];
      this._saveData  = JSON.parse(JSON.stringify(save));
      GameState.load(save); // sincronizar GameState
      return;
    }

    try {
      const raw = localStorage.getItem('ptg_save');
      if (!raw) throw new Error('no save');
      const save = JSON.parse(raw);
      this._plantData = PLANTS.find(p => p.id === save.plantId) ?? PLANTS[0];
      this._saveData  = save;
      GameState.load(save); // sincronizar GameState
    } catch(e) {
      this._plantData = PLANTS[0];
      this._saveData  = SaveService.newGame(PLANTS[0]);
    }
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
      this._saveData.stage           ?? 0,
      this._saveData.growthTime      ?? 0,
      this._saveData.stageGrowthTime ?? 0
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
    this._fertStock = this._saveData.fertilizerStock ?? 0;
    this.ui = new UIElements(this, this.statsManager, this._fertStock);

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
      const bgm = this.sound.add('bgm', { loop: true, volume: 0.15 });
      bgm.play().catch?.(() => {
        this.input.once('pointerdown', () => bgm.play());
      });
    } else if (!existing.isPlaying) {
      existing.play();
    }
  }


  // ── Eventos ───────────────────────────────────────────
  _registerEvents() {
    this._onOpenStore    = () => this._panels.store?.show();
    this._onOpenWardrobe = () => this._panels.wardrobe?.show();
    this._onOpenNotebook = () => this._panels.notebook?.show();
    this._onGoYard       = () => { this._save(); this.scene.start(SCENES.YARD); };
    this._onPlantDied    = () => {
      if (!this.scene.isActive(SCENES.GAME)) return;
      this._save();
      this.time.delayedCall(1500, () => this.scene.start(SCENES.GAME_OVER));
    };
    this._onStageUp = ({ stage }) => {
      if (this.plant && !this.plant._destroyed) {
        this.plant.setStage(stage);
      }
      if (this._saveData) this._saveData.stage = stage;
      GameState.stage = stage;
    };

    EventBus.on(EVENTS.OPEN_STORE,    this._onOpenStore,    this);
    EventBus.on(EVENTS.OPEN_WARDROBE, this._onOpenWardrobe, this);
    EventBus.on(EVENTS.OPEN_NOTEBOOK, this._onOpenNotebook, this);
    EventBus.on(EVENTS.GO_YARD,       this._onGoYard,       this);
    EventBus.on(EVENTS.PLANT_DIED,    this._onPlantDied,    this);
    EventBus.on(EVENTS.STAGE_UP,      this._onStageUp,      this);
  }

  // ── Guardar ── fuente de verdad: statsManager + GameState ─
  _save() {
    if (!this.statsManager || !this._saveData) return;

    // Sincronizar GameState con el estado actual del statsManager
    GameState.coins           = this.statsManager.coins;
    GameState.stats           = { ...this.statsManager.stats };
    GameState.stage           = this.statsManager.stage;
    GameState.growthTime      = this.statsManager.growthTime;
    GameState.stageGrowthTime = this.statsManager._stageGrowthTime;
    GameState.fertilizerStock = this._fertStock;

    const save = {
      plantId:         this._plantData.id,
      coins:           GameState.coins,
      stats:           { ...GameState.stats },
      stage:           GameState.stage,
      growthTime:      GameState.growthTime,
      stageGrowthTime: GameState.stageGrowthTime,
      fertilizerStock: GameState.fertilizerStock,
      weather:         this._saveData.weather       ?? 'sunny',
      weatherEndsAt:   this._saveData.weatherEndsAt ?? (Date.now() + 300000),
      ownedItems:      GameState.ownedItems  ?? [],
      equippedHat:     GameState.equippedHat ?? null,
      equippedPot:     GameState.equippedPot ?? null,
      equippedCan:     GameState.equippedCan ?? null,
    };
    localStorage.setItem('ptg_save', JSON.stringify(save));
    this._saveData = save;
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
    this.statsManager?.stopDecay();  // parar decay PRIMERO para evitar ticks durante shutdown
    this._save();
    this.ui?.destroy();
    this.plant?.destroy();
    Object.values(this._panels).forEach(p => p?.hide?.());
    EventBus.off(EVENTS.OPEN_STORE,    this._onOpenStore,    this);
    EventBus.off(EVENTS.OPEN_WARDROBE, this._onOpenWardrobe, this);
    EventBus.off(EVENTS.OPEN_NOTEBOOK, this._onOpenNotebook, this);
    EventBus.off(EVENTS.GO_YARD,       this._onGoYard,       this);
    EventBus.off(EVENTS.PLANT_DIED,    this._onPlantDied,    this);
    EventBus.off(EVENTS.STAGE_UP,      this._onStageUp,      this);
  }
}
