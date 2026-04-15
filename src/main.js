import Phaser from 'phaser';
import BootScene           from './scenes/BootScene.js';
import MenuScene           from './scenes/MenuScene.js';
import SelectScene         from './scenes/SelectScene.js';
import GameScene           from './scenes/GameScene.js';
import YardScene           from './scenes/YardScene.js';
import GameOverScene       from './scenes/GameOverScene.js';
import MinigamesMenuScene  from './scenes/MinigamesMenuScene.js';
import FertilizerScene     from './scenes/minigames/FertilizerScene.js';
import BugDefenseScene     from './scenes/minigames/BugDefenseScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode:      Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:     1280,
    height:    720,
  },
  physics: {
    default: 'arcade',
    arcade:  { gravity: { y: 0 }, debug: false }
  },
  scene: [
    BootScene,
    MenuScene,
    SelectScene,
    GameScene,
    YardScene,
    GameOverScene,
    MinigamesMenuScene,
    FertilizerScene,
    BugDefenseScene
  ]
};

const game = new Phaser.Game(config);

// Exponer globalmente solo en desarrollo para facilitar debugging
window.game = game;

export default game;
