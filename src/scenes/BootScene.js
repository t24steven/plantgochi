import Phaser from 'phaser';
import { SCENES } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {

    // Placeholder temporal — borra esto cuando tengas los assets reales
    this.load.on('loaderror', (file) => {
      console.warn(`Asset no encontrado: ${file.key} → ${file.url}`);
    });
    // ── Pantalla de carga ────────────────────────────────
    const { width, height } = this.cameras.main;

    const bar_bg = this.add.rectangle(width / 2, height / 2 + 50, 400, 20, 0x444444);
    const bar    = this.add.rectangle(width / 2 - 200, height / 2 + 50, 0, 20, 0x4CAF50).setOrigin(0, 0.5);

    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 400 * value;
    });

    // ── Fondos ───────────────────────────────────────────
    this.load.image('bg_start',    '/assets/bg/start.png');
    this.load.image('bg_select',   '/assets/bg/select.png');
    this.load.image('bg_interior', '/assets/bg/interior.png');
    this.load.image('bg_exterior', '/assets/bg/exterior.png');
    this.load.image('bg_yard',     '/assets/bg/yard.png');
    this.load.image('bg_death',    '/assets/bg/death.png');
    this.load.image('bg_lobby',    '/assets/bg/lobby.png');

    // ── Plantas — solo sprites que existen ───────────────
    const plants = ['cactus', 'snakeplant', 'sunflower'];
    plants.forEach(plant => {
      this.load.image(`${plant}_default`, `/assets/plants/${plant}/default.png`);
    });

    // ── Etapas de crecimiento ─────────────────────────────
    this.load.image('cactus_semilla',    '/assets/plants/cactus/semilla.png');
    this.load.image('cactus_brote',      '/assets/plants/cactus/brote1.png');
    this.load.image('snakeplant_semilla','/assets/plants/snakeplant/semilla.png');
    this.load.image('snakeplant_brote',  '/assets/plants/snakeplant/brote2.png');
    this.load.image('sunflower_semilla', '/assets/plants/sunflower/semilla.png');
    this.load.image('sunflower_brote',   '/assets/plants/sunflower/brote3.png');

    // ── UI ───────────────────────────────────────────────
    this.load.image('ui_status_bar',   '/assets/ui/status_bar.png');
    this.load.image('ui_fert_bar',     '/assets/ui/fert_bar.png');
    this.load.image('ui_coin',         '/assets/ui/coin.png');
    this.load.image('icon_bag',        '/assets/ui/icon_bag.png');
    this.load.image('icon_bug',        '/assets/ui/icon_bug.png');
    this.load.image('icon_cabinet',    '/assets/ui/icon_cabinet.png');
    this.load.image('icon_door',       '/assets/ui/icon_door.png');
    this.load.image('icon_fertilizer', '/assets/ui/icon_fertilizer.png');
    this.load.image('icon_fer',        '/assets/ui/icon_fer.png');
    this.load.image('icon_gamepad',    '/assets/ui/icon_gamepad.png');
    this.load.image('icon_notebook',   '/assets/ui/icon_notebook.png');
    this.load.image('icon_seeds',      '/assets/ui/icon_seeds.png');
    this.load.image('icon_sun',        '/assets/ui/icon_sun.png');
    this.load.image('icon_water',      '/assets/ui/icon_water.png');
    this.load.image('icon_watering',   '/assets/ui/icon_watering.png');
    this.load.image('icon_leaf',       '/assets/ui/icon_leaf.png');
    this.load.image('shop_bg',         '/assets/ui/shop_bg.png');
    this.load.image('wardrobe_bg',     '/assets/ui/wardrobe_bg.png');
    this.load.image('games_bg',        '/assets/ui/games_bg.png');

    // ── UI nuevos ─────────────────────────────────────────
    this.load.image('ui_enough_water', '/assets/ui/enough_water.png');
    this.load.image('ui_likes_that',   '/assets/ui/likes_that.png');
    this.load.image('ui_muerte',       '/assets/ui/muerte.png');
    this.load.image('ui_shop_icon',    '/assets/ui/shop.png');
    this.load.image('btn_try_again',   '/assets/ui/try_again.png');
    this.load.image('btn_main_menu',   '/assets/ui/main_menu.png');

    // ── Botones ──────────────────────────────────────────
    this.load.image('btn_start',  '/assets/buttons/start_btn.png');
    this.load.image('btn_select', '/assets/buttons/select_btn.png');
    this.load.image('btn_next',   '/assets/buttons/next_btn.png');
    this.load.image('btn_back',   '/assets/buttons/back_btn.png');
    this.load.image('arrow_left', '/assets/buttons/left_arrow.png');
    this.load.image('arrow_right','/assets/buttons/right_arrow.png');

    // ── Hats ─────────────────────────────────────────────
    this.load.image('hat1', '/assets/hats/hat1.png');
    this.load.image('hat2', '/assets/hats/hat2.png');
    this.load.image('hat3', '/assets/hats/hat3.png');

    // ── Pots ─────────────────────────────────────────────
    this.load.image('pot_base', '/assets/pots/pot_base.png');
    this.load.image('pot1',     '/assets/pots/pot1.png');
    this.load.image('pot2',     '/assets/pots/pot2.png');
    this.load.image('pot3',     '/assets/pots/pot3.png');

    // ── Regaderas ────────────────────────────────────────
    this.load.image('can1', '/assets/cans/can1.png');
    this.load.image('can2', '/assets/cans/can2.png');
    this.load.image('can3', '/assets/cans/can3.png');

    // ── Efectos ──────────────────────────────────────────
    this.load.image('fx_heart',      '/assets/effects/heart.png');
    this.load.image('fx_water_drop', '/assets/effects/water_drop.png');
    this.load.image('fx_sun_ray',    '/assets/effects/sun_ray.png');
    this.load.image('fx_soil',       '/assets/effects/soil_particle.png');

    // ── Cara de la planta ─────────────────────────────────
    this.load.image('face_eye_left',    '/assets/effects/left_eye.png');
    this.load.image('face_eye_right',   '/assets/effects/right_eye.png');
    this.load.image('face_mouth',       '/assets/effects/mouth.png');
    this.load.image('face_mouth_sad',   '/assets/effects/sad_mouth.png');
    this.load.image('face_blush_left',  '/assets/effects/left_blush.png');
    this.load.image('face_blush_right', '/assets/effects/rigth_blush.png');

    // ── Minijuegos ───────────────────────────────────────
    this.load.image('mg_fertilizer_bag', '/assets/minigames/fertilizer/bag.png');
    this.load.image('mg_bug',            '/assets/minigames/bugs/bug.png');
    this.load.image('mg_bg_fertilizer',  '/assets/minigames/fertilizer/bg.png');
    this.load.image('mg_bg_bugs',        '/assets/minigames/bugs/bg.png');

    // ── Aliases minijuegos ────────────────────────────────
    this.load.image('ui_coin_small',       '/assets/ui/coin.png');
    this.load.image('ui_heart',            '/assets/effects/heart.png');
    this.load.image('ui_fertilizer_score', '/assets/ui/fert_bar.png');
    this.load.image('plant_pot_yoplait',   '/assets/pots/pot3.png');
    this.load.image('btn_pause',           '/assets/buttons/next_btn.png');
    this.load.image('btn_exit',            '/assets/buttons/back_btn.png');

    // ── Audio ────────────────────────────────────────────
    this.load.audio('bgm', '/assets/sound/audio.mp3');

    // ── Títulos ──────────────────────────────────────────
    this.load.image('title', '/assets/titles/plantagochi.png');

    // ── Privacy / HTP ─────────────────────────────────────
    this.load.image('icon_privacy', '/assets/privacyH/privacy.png');
    this.load.image('icon_htp',     '/assets/privacyH/how_to_play.png');

    // ── Info cards ────────────────────────────────────────
    this.load.image('info_cactus', '/assets/info/info_cactus.png');
    this.load.image('info_snake',  '/assets/info/info_snake.png');
    this.load.image('info_sun',    '/assets/info/info_sun.png');

    // ── Shop / Wardrobe ───────────────────────────────────
    this.load.image('buy_btn',        '/assets/ui/buy.png');
    this.load.image('equip_btn',      '/assets/ui/equip.png');
    this.load.image('unequip_btn',    '/assets/ui/equip.png');  // mismo asset, estado visual diferente
    this.load.image('shop_title',     '/assets/ui/shop_title.png');
    this.load.image('wardrobe_title', '/assets/ui/wardrobe_title.png');
    this.load.image('tab_hats',       '/assets/ui/tab_hats.png');
    this.load.image('tab_watering',   '/assets/ui/tab_watering.png');
    this.load.image('tab_pots',       '/assets/ui/tab_pots.png');
  }

  create() {
    this.scene.start(SCENES.MENU);
  }
}
