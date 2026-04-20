import { GameState } from './GameState.js';

export class SaveService {

  static KEY_PLANT    = 'ptg_plant';
  static KEY_SAVE     = 'ptg_save';

  static savePlant(plantData) {
    localStorage.setItem(this.KEY_PLANT, JSON.stringify(plantData));
  }

  static loadPlant() {
    const data = localStorage.getItem(this.KEY_PLANT);
    return data ? JSON.parse(data) : null;
  }

  // Guarda al disco SIN tocar GameState (GameState se gestiona por separado)
  static saveGame(gameState) {
    localStorage.setItem(this.KEY_SAVE, JSON.stringify(gameState));
  }

  // Carga del disco y sincroniza GameState
  static loadGame() {
    try {
      const data = localStorage.getItem(this.KEY_SAVE);
      if (!data) return null;
      const parsed = JSON.parse(data);
      GameState.load(parsed);
      return parsed;
    } catch(e) { return null; }
  }

  static newGame(plant) {
    GameState.reset();
    GameState.plantId = plant.id;
    GameState.stats   = { ...plant.stats };
    const initialState = {
      plantId:         plant.id,
      coins:           0,
      stats:           { ...plant.stats },
      equippedHat:     null,
      equippedPot:     null,
      equippedCan:     null,
      ownedItems:      [],
      weather:         'sunny',
      weatherEndsAt:   Date.now() + 300000,
      stage:           0,
      growthTime:      0,
      stageGrowthTime: 0,
      fertilizerStock: 0,
    };
    localStorage.setItem(this.KEY_SAVE, JSON.stringify(initialState));
    return initialState;
  }

  static clear() {
    GameState.reset();
    localStorage.removeItem(this.KEY_PLANT);
    localStorage.removeItem(this.KEY_SAVE);
  }

  static hasSave() {
    return localStorage.getItem(this.KEY_SAVE) !== null;
  }
}
