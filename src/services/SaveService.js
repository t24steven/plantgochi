export class SaveService {

  static KEY_PLANT    = 'ptg_plant';
  static KEY_SAVE     = 'ptg_save';

  // ── Planta seleccionada ──────────────────────────────
  static savePlant(plantData) {
    localStorage.setItem(this.KEY_PLANT, JSON.stringify(plantData));
  }

  static loadPlant() {
    const data = localStorage.getItem(this.KEY_PLANT);
    return data ? JSON.parse(data) : null;
  }

  // ── Estado del juego (stats, monedas, items) ─────────
  static saveGame(gameState) {
    localStorage.setItem(this.KEY_SAVE, JSON.stringify(gameState));
  }

  static loadGame() {
    const data = localStorage.getItem(this.KEY_SAVE);
    return data ? JSON.parse(data) : null;
  }

  // ── Save completo con estado inicial de una planta ───
  static newGame(plant) {
    const initialState = {
      plantId:        plant.id,
      coins:          0,
      stats:          { ...plant.stats },
      equippedHat:    null,
      equippedPot:    null,
      equippedCan:    null,
      ownedItems:     [],
      weather:        'sunny',
      weatherEndsAt:  Date.now() + 300000,
      stage:          0,
      growthTime:     0,
      fertilizerStock: 0,  // bolsas de abono acumuladas del minijuego
    };
    this.saveGame(initialState);
    return initialState;
  }

  static clear() {
    localStorage.removeItem(this.KEY_PLANT);
    localStorage.removeItem(this.KEY_SAVE);
  }

  static hasSave() {
    return localStorage.getItem(this.KEY_SAVE) !== null;
  }
}
