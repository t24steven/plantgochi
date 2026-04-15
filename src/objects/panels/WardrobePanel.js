import Phaser from 'phaser';
import { HATS, POTS, CANS } from '../../data/items.js';
import { SaveService } from '../../services/SaveService.js';

export default class WardrobePanel {

  constructor(scene, statsManager, plant) {
    this._scene   = scene;
    this._stats   = statsManager;
    this._plant   = plant;
    this._container = null;
    this._tab     = 'hats'; // hats | cans | pots
  }

  show() {
    if (this._container) return;
    this._build();
  }

  _build() {
    const s = this._scene;

    this._container = s.add.container(640, 360);

    // ── Fondo ──────────────────────────────────────────
    const bg    = s.add.image(0, 10, 'wardrobe_bg').setDisplaySize(1100, 580);
    const title = s.add.image(0, -230, 'wardrobe_title').setDisplaySize(380, 80);

    // ── Tabs ───────────────────────────────────────────
    const tabDefs = [
      { key: 'hats', img: 'tab_hats'     },
      { key: 'cans', img: 'tab_watering' },
      { key: 'pots', img: 'tab_pots'     },
    ];
    const tabBtns = tabDefs.map(({ key, img }, i) => {
      const active = key === this._tab;
      const btn = s.add.image(-300 + i * 300, -130, img)
        .setDisplaySize(220, 60)
        .setAlpha(active ? 1 : 0.55)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setAlpha(0.85));
      btn.on('pointerout',  () => btn.setAlpha(active ? 1 : 0.55));
      btn.on('pointerdown', () => {
        if (this._tab === key) return;
        this._tab = key;
        this._rebuild();
      });
      return btn;
    });

    // ── Items del tab activo ───────────────────────────
    const itemObjs = this._buildItems(s);

    // ── Botón Back ─────────────────────────────────────
    const btnBack = s.add.image(0, 230, 'btn_back').setDisplaySize(200, 65)
      .setInteractive({ useHandCursor: true });
    btnBack.on('pointerover', () => btnBack.setTint(0xffddaa));
    btnBack.on('pointerout',  () => btnBack.clearTint());
    btnBack.on('pointerdown', () => this.hide());

    this._container.add([bg, title, ...tabBtns, ...itemObjs, btnBack]);
    this._container.setDepth(10);
    this._container.setScale(0.8).setAlpha(0);
    s.tweens.add({
      targets: this._container, scale: 1, alpha: 1,
      duration: 200, ease: 'Back.easeOut'
    });
  }

  _buildItems(s) {
    const save = SaveService.loadGame();

    const tabMap = {
      hats: { list: HATS, equippedKey: 'equippedHat', setFn: (id) => this._plant.setHat(id) },
      cans: { list: CANS, equippedKey: 'equippedCan', setFn: (id) => this._plant.setCan(id) },
      pots: { list: POTS, equippedKey: 'equippedPot', setFn: (id) => this._plant.setPot(id) },
    };

    const { list, equippedKey, setFn } = tabMap[this._tab];
    const owned = list.filter(item => save.ownedItems?.includes(item.id));

    if (owned.length === 0) {
      return [s.add.text(0, 30, 'Nothing owned yet — buy some in the Shop!', {
        fontSize: '18px', color: '#9a7a50', fontFamily: 'Arial'
      }).setOrigin(0.5)];
    }

    return owned.flatMap((item, i) => {
      const x        = -300 + i * 300;
      const equipped = save[equippedKey] === item.id;

      const img = s.add.image(x, -20, item.id).setDisplaySize(110, 110);

      const nameText = s.add.text(x, 55, item.name, {
        fontSize: '16px', color: '#7a4a00', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);

      const equipBtn = s.add.image(x, 105, equipped ? 'unequip_btn' : 'equip_btn')
        .setDisplaySize(160, 50)
        .setInteractive({ useHandCursor: true });

      equipBtn.on('pointerover', () => equipBtn.setTint(0xffddaa));
      equipBtn.on('pointerout',  () => equipBtn.clearTint());
      equipBtn.on('pointerdown', () => {
        save[equippedKey] = equipped ? null : item.id;
        SaveService.saveGame(save);
        setFn(save[equippedKey]);
        this._rebuild();
      });

      return [img, nameText, equipBtn];
    });
  }

  // Reconstruye solo el contenido sin animación de cierre
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
