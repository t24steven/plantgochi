import { HATS, POTS, CANS } from '../../data/items.js';
import { GameState } from '../../services/GameState.js';

export default class StorePanel {

  constructor(scene, statsManager) {
    this._scene   = scene;
    this._stats   = statsManager;
    this._container = null;
    this._tab     = 'hats'; // hats | pots | cans
  }

  show() {
    if (this._container) return;
    this._build();
  }

  _build() {
    const s  = this._scene;
    const cx = 640;
    const cy = 360;

    this._container = s.add.container(cx, cy);

    // ── Fondo vitrina ──────────────────────────────────
    const bg = s.add.image(0, 10, 'shop_bg').setDisplaySize(1100, 580);

    // ── Título ─────────────────────────────────────────
    const title = s.add.image(0, -230, 'shop_title').setDisplaySize(320, 80);

    // ── Tabs ───────────────────────────────────────────
    const tabDefs = [
      { key: 'hats', img: 'tab_hats'     },
      { key: 'cans', img: 'tab_watering' },
      { key: 'pots', img: 'tab_pots'     },
    ];
    const tabBtns = tabDefs.map(({ key, img }, i) => {
      const active = key === this._tab;
      const btn = s.add.image(-300 + i * 310, -72, img)
        .setDisplaySize(220, 60)
        .setAlpha(active ? 1 : 0.55)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover',  () => btn.setAlpha(0.85));
      btn.on('pointerout',   () => btn.setAlpha(active ? 1 : 0.55));
      btn.on('pointerdown',  () => {
        if (this._tab === key) return;
        this._tab = key;
        this._rebuild();
      });
      return btn;
    });

    // ── Items ──────────────────────────────────────────
    const itemList = this._tab === 'hats' ? HATS
                   : this._tab === 'pots' ? POTS : CANS;

    // Leer de GameState (fuente de verdad en memoria)
    const save = { ownedItems: GameState.ownedItems ?? [] };
    const itemObjs = itemList.flatMap((item, i) => {
      const x     = -300 + i * 310;
      const owned = save.ownedItems?.includes(item.id);

      const img = s.add.image(x, 65, item.id).setDisplaySize(110, 110);

      const nameText = s.add.text(x, 0, item.name, {
        fontSize: '16px', color: '#7a4a00', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);

      // Botón Buy o Owned usando asset
      let actionBtn;
      if (owned) {
        actionBtn = s.add.text(x, 50, '✅ Owned', {
          fontSize: '15px', color: '#4CAF50', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
        return [img, nameText, actionBtn];
      } else {
        const priceText = s.add.text(x, 150, ` ${item.price}`, {
          fontSize: '35px', color: '#7a4a00', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
        actionBtn = s.add.image(x, 200, 'buy_btn').setDisplaySize(160, 48)
          .setInteractive({ useHandCursor: true });
        actionBtn.on('pointerover',  () => actionBtn.setTint(0xffddaa));
        actionBtn.on('pointerout',   () => actionBtn.clearTint());
        actionBtn.on('pointerdown',  () => this._buy(item));
        return [img, nameText, priceText, actionBtn];
      }
    });

    // ── Botón Back ─────────────────────────────────────
    const btnBack = s.add.image(0, 280, 'btn_back').setDisplaySize(200, 65)
      .setInteractive({ useHandCursor: true });
    btnBack.on('pointerover',  () => btnBack.setTint(0xffddaa));
    btnBack.on('pointerout',   () => btnBack.clearTint());
    btnBack.on('pointerdown',  () => this.hide());

    this._container.add([bg, title, ...tabBtns, ...itemObjs, btnBack]);
    this._container.setDepth(10);
    this._container.setScale(0.8).setAlpha(0);
    s.tweens.add({
      targets: this._container, scale: 1, alpha: 1,
      duration: 200, ease: 'Back.easeOut'
    });
  }

  _buy(item) {
    if (!this._stats.spendCoins(item.price)) return;
    // Actualizar GameState en memoria
    GameState.ownedItems = [...(GameState.ownedItems ?? []), item.id];
    GameState.coins = this._stats.coins;
    // Persistir al disco
    try {
      const raw  = localStorage.getItem('ptg_save');
      const save = raw ? JSON.parse(raw) : {};
      save.ownedItems = GameState.ownedItems;
      save.coins = GameState.coins;
      localStorage.setItem('ptg_save', JSON.stringify(save));
    } catch(e) {}
    this._scene.sound?.play('sfx_buy', { volume: 0.6 });
    this._rebuild();
  }

  _rebuild() {
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
    this._build();
  }

  hide() {
    if (!this._container) return;
    this._scene.tweens.add({
      targets: this._container, scale: 0.8, alpha: 0,
      duration: 150, ease: 'Power2',
      onComplete: () => {
        this._container.destroy();
        this._container = null;
      }
    });
  }
}
