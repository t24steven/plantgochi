import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// Catálogo de eventos — úsalos siempre desde aquí,
// nunca escribas el string del evento directo en las escenas
export const EVENTS = {
  // Minijuegos
  MINIGAME_COMPLETE:  'minigame:complete',   // { reward: { coins, fertilizer } }
  MINIGAME_EXIT:      'minigame:exit',

  // Stats
  STAT_CHANGED:       'stat:changed',        // { stat, value }
  PLANT_DIED:         'plant:died',
  PLANT_WATERED:      'plant:watered',
  STAGE_UP:           'plant:stageUp',       // { stage: 1 | 2 }

  // UI
  COINS_UPDATED:      'ui:coins',            // { amount }
  OPEN_STORE:         'ui:openStore',
  OPEN_WARDROBE:      'ui:openWardrobe',
  OPEN_NOTEBOOK:      'ui:openNotebook',

  // Escenas
  GO_YARD:            'scene:yard',
  GO_GAME:            'scene:game',
};
