import Phaser from 'phaser';
import { SCENES } from '../../constants.js';
import { EventBus, EVENTS } from '../../services/EventBus.js';

export default class FertilizerScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.FERTILIZER });
    this._score      = 0;
    this._coins      = 0;
    this._missed     = 0;
    this._speed      = 200;
    this._spawnDelay = 1200;
    this._playing    = false;
    this._paused     = false;
  }

  create() {
    const { width, height } = this.cameras.main;
    this._width  = width;
    this._height = height;

    this.add.image(width / 2, height / 2, 'mg_bg_fertilizer').setDisplaySize(width, height);

    // UI
    this.add.image(80, 45, 'ui_fertilizer_score').setDisplaySize(160, 45).setDepth(20);
    this._scoreText = this.add.text(80, 35, '0', {
      fontSize: '26px', color: '#4ec64e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);

    this.add.image(260, 45, 'ui_coin_small').setDisplaySize(45, 45).setDepth(20);
    this._coinText = this.add.text(320, 35, '0', {
      fontSize: '28px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(21);

    // Missed counter
    this._missedText = this.add.text(width / 2, 35, '❤️❤️❤️', {
      fontSize: '22px', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(21);

    // Botones
    this._btnPause = this.add.image(width - 80, 45, 'btn_pause')
      .setDisplaySize(50, 50).setDepth(20).setInteractive();
    this._btnExit  = this.add.image(width - 25, 45, 'btn_exit')
      .setDisplaySize(50, 50).setDepth(20).setInteractive();

    this._btnPause.on('pointerdown', () => this._togglePause());
    this._btnExit.on('pointerdown',  () => this._exitGame());

    // Planta
    this._plant = this.add.container(width / 2, height - 140).setDepth(5);
    this._plant.add([
      this.add.image(0,  30, 'plant_pot_yoplait').setDisplaySize(100, 90),
      this.add.image(0, -40, 'cactus_default').setDisplaySize(90, 110),
    ]);

    this._bags    = this.physics.add.group();
    this._cursors = this.input.keyboard.createCursorKeys();

    this.input.on('pointermove', (ptr) => {
      if (this._playing) {
        this._plant.x = Phaser.Math.Clamp(ptr.x, 80, width - 80);
      }
    });

    this._showInstructions();
  }

  // ── Instrucciones ──────────────────────────────────────

  _showInstructions() {
    const cx = this._width / 2, cy = this._height / 2;

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.7).setDepth(25);
    const panel   = this.add.graphics().setDepth(25);
    panel.fillStyle(0xf0e8d2, 0.95);
    panel.fillRoundedRect(cx - 280, cy - 160, 560, 320, 20);

    const title = this.add.text(cx, cy - 130, 'Catch the\nFertilizer!', {
      fontSize: '32px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(26);

    const rules = [
      'Move cactus left/right to catch all bags!',
      'Each bag = coins + fertilizer!',
      'Miss 3 bags = game over!',
    ];
    const ruleTexts = rules.map((rule, i) =>
      this.add.text(cx, cy - 50 + i * 45, rule, {
        fontSize: '20px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(26)
    );

    const btnPlay = this.add.text(cx, cy + 90, '▶ PLAY', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#4ec64e', padding: { x: 50, y: 16 }
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
    this._missed     = 0;
    this._speed      = 200;
    this._spawnDelay = 1200;
    this._playing    = true;
    this._paused     = false;
    this._scoreText.setText('0');
    this._coinText.setText('0');
    this._updateMissedUI();
    this._startSpawnTimer();
  }

  _startSpawnTimer() {
    this._spawnTimer?.remove();
    this._spawnTimer = this.time.addEvent({
      delay: this._spawnDelay,
      loop: true,
      callback: this._spawnBag,
      callbackScope: this,
    });
  }

  // ✅ Escalado: cada 5 bolsas atrapadas sube dificultad
  _checkDifficulty() {
    if (this._score > 0 && this._score % 5 === 0) {
      this._speed      = Math.min(this._speed + 25, 480);
      this._spawnDelay = Math.max(500, this._spawnDelay - 100);
      this._startSpawnTimer();
    }
  }

  _updateMissedUI() {
    const hearts = ['❤️', '❤️', '❤️'];
    for (let i = 0; i < this._missed; i++) hearts[i] = '🖤';
    this._missedText.setText(hearts.join(''));
  }

  _spawnBag() {
    const x = Phaser.Math.Between(80, this._width - 80);
    this._bags.create(x, -50, 'mg_fertilizer_bag')
      .setDisplaySize(55, 55)
      .setVelocityY(this._speed)
      .setDepth(3);
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
    panel.fillStyle(0xf0e8d2, 0.98);
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
    this._bags.clear(true, true);
    this.scene.start(SCENES.YARD, {
      reward: this._coins > 0 ? { coins: this._coins, fertilizerBags: this._score } : null
    });
  }

  shutdown() {
    this._spawnTimer?.remove();
    this._bags?.clear(true, true);
    this._pauseContainer?.destroy();
  }

  // ── Update ─────────────────────────────────────────────

  update() {
    if (!this._playing) return;

    if (this._cursors.left.isDown) {
      this._plant.x = Math.max(80, this._plant.x - 10);
    } else if (this._cursors.right.isDown) {
      this._plant.x = Math.min(this._width - 80, this._plant.x + 10);
    }

    this._bags.getChildren().forEach(bag => {
      if (!bag.active) return;

      const dist = Phaser.Math.Distance.Between(
        bag.x, bag.y,
        this._plant.x, this._plant.y - 20
      );

      if (dist < 65) {
        bag.destroy();
        this._score++;
        this._coins += 10;
        this._scoreText.setText(this._score.toString());
        this._coinText.setText(this._coins.toString());
        this._checkDifficulty(); // ✅ escala dificultad
      } else if (bag.y > this._height + 30) {
        bag.destroy();
        this._missed++;
        this._updateMissedUI();
        if (this._missed >= 3) this._endGame();
      }
    });
  }

  _endGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bags.clear(true, true);

    const cx = this._width / 2, cy = this._height / 2;

    const panel = this.add.graphics().setDepth(28);
    panel.fillStyle(0xf0e8d2, 0.98);
    panel.fillRoundedRect(cx - 250, cy - 145, 500, 290, 16);
    panel.lineStyle(3, 0x5a3e1b, 1);
    panel.strokeRoundedRect(cx - 250, cy - 145, 500, 290, 16);

    this.add.text(cx, cy - 108, 'Game Over!', {
      fontSize: '32px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy - 45, `🌿 Fertilizer: ${this._score}`, {
      fontSize: '24px', color: '#4ec64e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 15, `🪙 Coins: ${this._coins}`, {
      fontSize: '24px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 65, `⚡ Velocidad final: ${Math.round(this._speed)}`, {
      fontSize: '18px', color: '#5a3e1b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(29);

    this.add.text(cx, cy + 110, '🏠 Back', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#ff6b35', padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(29)
      .on('pointerdown', () => {
        this.scene.start(SCENES.YARD, {
          reward: { coins: this._coins, fertilizerBags: this._score }
        });
      });
  }
}