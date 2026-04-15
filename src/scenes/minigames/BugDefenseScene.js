import Phaser from 'phaser';
import { SCENES } from '../../constants.js';
import { EventBus, EVENTS } from '../../services/EventBus.js';

export default class BugDefenseScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BUG_DEFENSE });
    this._score   = 0;
    this._coins   = 0;
    this._lives   = 3;
    this._playing = false;
    this._paused  = false;

    // Dificultad escalable
    this._spawnDelay = 1600;
    this._bugSpeed   = { min: 100, max: 180 };
    this._wave       = 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    this._width  = width;
    this._height = height;

    this.add.image(width / 2, height / 2, 'mg_bg_bugs').setDisplaySize(width, height);

    // UI: Coins
    this.add.image(75, 42, 'ui_coin_small').setDisplaySize(42, 42).setDepth(20);
    this._coinText = this.add.text(135, 32, '0', {
      fontSize: '28px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(21);

    // Corazones
    this._hearts = this.add.container(280, 42).setDepth(20);
    for (let i = 0; i < 3; i++) {
      this._hearts.add(
        this.add.image(i * 45, 0, 'ui_heart').setDisplaySize(38, 38)
      );
    }

    // Botones con listeners
    this._btnPause = this.add.image(width - 75, 42, 'btn_pause')
      .setDisplaySize(45, 45).setDepth(20).setInteractive();
    this._btnExit  = this.add.image(width - 25, 42, 'btn_exit')
      .setDisplaySize(45, 45).setDepth(20).setInteractive();

    this._btnPause.on('pointerdown', () => this._togglePause());
    this._btnExit.on('pointerdown',  () => this._exitGame());

    // Planta
    this._plant = this.add.container(width / 2, height - 130).setDepth(5);
    this._plant.add([
      this.add.image(0,  25, 'plant_pot_yoplait').setDisplaySize(95, 85),
      this.add.image(0, -45, 'cactus_default').setDisplaySize(85, 105),
    ]);

    this._bugs = this.physics.add.group();
    this._showInstructions();
  }

  // ── Instrucciones ──────────────────────────────────────

  _showInstructions() {
    const cx = this._width / 2, cy = this._height / 2;

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.75).setDepth(25);
    const panel   = this.add.graphics().setDepth(25);
    panel.fillStyle(0xf2e8d0, 0.98);
    panel.fillRoundedRect(cx - 260, cy - 150, 520, 300, 18);
    panel.lineStyle(3, 0x8b5a2b, 1);
    panel.strokeRoundedRect(cx - 260, cy - 150, 520, 300, 18);

    const title = this.add.text(cx, cy - 120, 'Kill the\nBugs!', {
      fontSize: '32px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(26);

    const rules = [
      'Tap bugs before they reach your plant!',
      '3 hearts = 3 lives!',
      'Each kill = coins!',
    ];
    const ruleTexts = rules.map((rule, i) =>
      this.add.text(cx, cy - 40 + i * 42, rule, {
        fontSize: '20px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(26)
    );

    const btnPlay = this.add.text(cx, cy + 95, '▶ PLAY', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#ff6b35', padding: { x: 45, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(26);

    btnPlay.on('pointerdown', () => {
      [overlay, panel, btnPlay, title, ...ruleTexts].forEach(o => o.destroy());
      this._startGame();
    });
  }

  // ── Juego ──────────────────────────────────────────────

  _startGame() {
    this._score      = 0;
    this._coins      = 0;
    this._lives      = 3;
    this._wave       = 0;
    this._spawnDelay = 1600;
    this._bugSpeed   = { min: 100, max: 180 };
    this._playing    = true;
    this._paused     = false;
    this._updateHearts();
    this._coinText.setText('0');
    this._startSpawnTimer();
  }

  _startSpawnTimer() {
    this._spawnTimer?.remove();
    this._spawnTimer = this.time.addEvent({
      delay: this._spawnDelay,
      loop: true,
      callback: this._spawnBug,
      callbackScope: this,
    });
  }

  // ✅ Escalado de dificultad cada 10 bugs
  _checkDifficulty() {
    const newWave = Math.floor(this._score / 10);
    if (newWave > this._wave) {
      this._wave       = newWave;
      this._spawnDelay = Math.max(600, this._spawnDelay - 150);
      this._bugSpeed   = {
        min: Math.min(this._bugSpeed.min + 15, 280),
        max: Math.min(this._bugSpeed.max + 20, 360),
      };
      this._startSpawnTimer(); // reinicia el timer con nuevo delay
    }
  }

  _spawnBug() {
    const cx = this._width / 2;
    const cy = this._height - 130;

    // ✅ Solo 3 lados: arriba, derecha, izquierda
    // Side 2 (abajo) eliminado — los bugs de abajo nunca alcanzaban la planta
    const side = Phaser.Math.Between(0, 2);
    let x, y;
    if (side === 0)      { x = Phaser.Math.Between(20, this._width - 20); y = -30; }
    else if (side === 1) { x = this._width + 40; y = Phaser.Math.Between(50, this._height - 50); }
    else                 { x = -40; y = Phaser.Math.Between(50, this._height - 50); }

    const bug   = this._bugs.create(x, y, 'mg_bug')
      .setDisplaySize(45, 45)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);

    const angle = Phaser.Math.Angle.Between(x, y, cx, cy);
    const speed = Phaser.Math.Between(this._bugSpeed.min, this._bugSpeed.max);
    bug.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    bug.on('pointerdown', () => this._killBug(bug));
  }

  _killBug(bug) {
    if (!bug.active) return;
    bug.disableInteractive();

    this.tweens.add({
      targets: bug,
      scale: 0,
      alpha: 0,
      duration: 120,
      onComplete: () => { if (bug.active) bug.destroy(); }
    });

    this._score++;
    this._coins += 12;
    this._coinText.setText(this._coins.toString());
    this._checkDifficulty(); // ✅ escala dificultad
  }

  _updateHearts() {
    this._hearts.list.forEach((heart, i) => {
      heart.setAlpha(i < this._lives ? 1 : 0.3);
    });
  }

  // ── Pausa ──────────────────────────────────────────────

  _togglePause() {
    if (this._paused) {
      this._resumeGame();
    } else if (this._playing) {
      this._pauseGame();
    }
  }

  _pauseGame() {
    this._playing = false;
    this._paused  = true;
    if (this._spawnTimer) this._spawnTimer.paused = true;
    this.physics.pause();
    this._showPauseMenu();
  }

  _resumeGame() {
    this._playing = true;
    this._paused  = false;
    if (this._spawnTimer) this._spawnTimer.paused = false;
    this.physics.resume();
    this._pauseContainer?.destroy();
    this._pauseContainer = null;
  }

  _showPauseMenu() {
    const cx = this._width / 2, cy = this._height / 2;
    this._pauseContainer = this.add.container(0, 0).setDepth(30);

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.6);
    const panel   = this.add.graphics();
    panel.fillStyle(0xf2e8d0, 0.98);
    panel.fillRoundedRect(cx - 180, cy - 120, 360, 240, 18);
    panel.lineStyle(3, 0x8b5a2b, 1);
    panel.strokeRoundedRect(cx - 180, cy - 120, 360, 240, 18);

    const title     = this.add.text(cx, cy - 78, '⏸ Paused', {
      fontSize: '30px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnResume = this.add.text(cx, cy - 10, '▶ Resume', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#4ec64e', padding: { x: 35, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnExit   = this.add.text(cx, cy + 65, '🏠 Exit', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#ff6b35', padding: { x: 35, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnResume.on('pointerdown', () => this._resumeGame());
    btnExit.on('pointerdown',   () => this._exitGame());

    this._pauseContainer.add([overlay, panel, title, btnResume, btnExit]);
  }

  // ✅ Exit emite recompensa antes de salir
  _exitGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bugs.clear(true, true);
    this.scene.start(SCENES.YARD, {
      reward: this._coins > 0 ? { coins: this._coins } : null
    });
  }

  shutdown() {
    this._spawnTimer?.remove();
    this._bugs?.clear(true, true);
    this._pauseContainer?.destroy();
  }

  // ── Update ─────────────────────────────────────────────

  update() {
    if (!this._playing) return;

    const plantX = this._width / 2;
    const plantY = this._height - 130;

    this._bugs.getChildren().forEach(bug => {
      if (!bug.active) return;
      const dist = Phaser.Math.Distance.Between(bug.x, bug.y, plantX, plantY);
      if (dist < 75) {
        bug.destroy();
        this._lives--;
        this._updateHearts();
        if (this._lives <= 0) this._endGame();
      }
    });
  }

  _endGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bugs.clear(true, true);

    const cx = this._width / 2, cy = this._height / 2;

    const panel = this.add.graphics().setDepth(28);
    panel.fillStyle(0xf2e8d0, 0.98);
    panel.fillRoundedRect(cx - 240, cy - 130, 480, 270, 16);
    panel.lineStyle(3, 0x8b5a2b, 1);
    panel.strokeRoundedRect(cx - 240, cy - 130, 480, 270, 16);

    this.add.text(cx, cy - 95, 'Game Over!', {
      fontSize: '30px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy - 35, `🐛 Bugs eliminados: ${this._score}`, {
      fontSize: '22px', color: '#ff6b35', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 20, `🪙 Coins: ${this._coins}`, {
      fontSize: '22px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 70, `⚡ Wave alcanzada: ${this._wave + 1}`, {
      fontSize: '18px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 118, '🏠 Back', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#ff6b35', padding: { x: 35, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(29)
      .on('pointerdown', () => {
        this.scene.start(SCENES.YARD, {
          reward: { coins: this._coins }
        });
      });
  }
}