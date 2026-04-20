import Phaser from 'phaser';
import { SCENES, MINIGAME_FERTILIZER } from '../../constants.js';
import { PLANTS } from '../../data/plants.js';

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
    this._plantData  = null;
    this._saveData   = null;
  }

  init() {
    // Leer disco directamente sin pasar por SaveService para no alterar GameState
    try {
      const raw = localStorage.getItem('ptg_save');
      const save = raw ? JSON.parse(raw) : null;
      this._saveData  = save;
      this._plantData = save ? (PLANTS.find(p => p.id === save.plantId) ?? PLANTS[0]) : PLANTS[0];
    } catch(e) {
      this._saveData  = null;
      this._plantData = PLANTS[0];
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    this._width  = width;
    this._height = height;

    // helpers de escala
    const gx = v => v * width  / 1280;
    const gy = v => v * height / 720;

    this.add.image(width / 2, height / 2, 'mg_bg_fertilizer').setDisplaySize(width, height);

    // ── Score (fertilizante atrapado) ──────────────────
    // fert_bar: 909x227 → aspecto 4.0, mostrar como 180x45
    this.add.image(gx(100), gy(42), 'ui_fertilizer_score').setDisplaySize(gx(180), gy(45)).setDepth(20);
    this._scoreText = this.add.text(gx(100), gy(38), '0', {
      fontSize: `${gx(24)}px`, color: '#4ec64e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);

    // ── Monedas ────────────────────────────────────────
    // coin: 710x208 → aspecto 3.41, mostrar como 130x38
    this.add.image(gx(260), gy(42), 'ui_coin_small').setDisplaySize(gx(130), gy(38)).setDepth(20);
    this._coinText = this.add.text(gx(260), gy(38), '0', {
      fontSize: `${gx(24)}px`, color: '#7a5200', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);

    // ── Vidas ──────────────────────────────────────────
    // lifes: 905x353 → aspecto 2.56, mostrar como 180x70
    this._livesBar = this.add.image(width / 2, gy(42), 'mg_lifes')
      .setDisplaySize(gx(180), gy(70)).setDepth(20);
    this._heartImages = [];
    const heartSpacing = gx(48);
    for (let i = 0; i < 3; i++) {
      this._heartImages.push(
        this.add.image(width / 2 - heartSpacing + i * heartSpacing, gy(42), 'mg_lifes_heart')
          .setDisplaySize(gx(38), gy(38)).setDepth(21)
      );
    }

    // ── Botones pausa / salida ─────────────────────────
    // pause: 309x293 → cuadrado, mostrar como 48x48
    this._btnPause = this.add.image(width - gx(110), gy(42), 'mg_pause_btn')
      .setDisplaySize(gx(48), gy(48)).setDepth(20).setInteractive({ useHandCursor: true });
    // exit_btn: 360x150 → aspecto 2.4, mostrar como 110x46
    this._btnExit  = this.add.image(width - gx(45), gy(42), 'mg_exit_btn')
      .setDisplaySize(gx(110), gy(46)).setDepth(20).setInteractive({ useHandCursor: true });

    this._btnPause.on('pointerdown', () => this._togglePause());
    this._btnExit.on('pointerdown',  () => this._exitGame());

    // ── Planta del jugador con cara y accesorios ──────────
    this._buildPlant(width / 2, height - 140);

    this._bags    = this.physics.add.group();
    this._cursors = this.input.keyboard.createCursorKeys();

    this.input.on('pointermove', (ptr) => {
      if (this._playing) {
        this._plant.x = Phaser.Math.Clamp(ptr.x, 80, width - 80);
      }
    });

    this._showInstructions();
  }

  // ── Construir planta con cara y accesorios ─────────────
  _buildPlant(x, y) {
    const plantId   = this._plantData?.id ?? 'cactus';
    const stage     = this._saveData?.stage ?? 2;
    const stageKey  = stage === 0 ? `${plantId}_semilla` : stage === 1 ? `${plantId}_brote` : `${plantId}_default`;
    const stageSize = stage === 0 ? 90 : stage === 1 ? 130 : 160;
    const faceOffY  = stageSize === 90 ? -20 : stageSize === 130 ? -35 : -50;

    this._plant = this.add.container(x, y).setDepth(5);

    // Maceta
    const potKey = this._saveData?.equippedPot ?? 'pot_base';
    this._plant.add(this.add.image(0, 30, potKey).setDisplaySize(100, 90));

    // Sprite planta
    this._plant.add(this.add.image(0, -40, stageKey).setDisplaySize(stageSize, stageSize));

    // Cara
    const scale = stageSize / 160;
    this._faceEyeL  = this.add.image(-28 * scale, faceOffY - 10, 'face_eye_left') .setDisplaySize(28 * scale, 28 * scale);
    this._faceEyeR  = this.add.image( 28 * scale, faceOffY - 10, 'face_eye_right').setDisplaySize(28 * scale, 28 * scale);
    this._faceMouth = this.add.image(0, faceOffY + 20, 'face_mouth')              .setDisplaySize(32 * scale, 22 * scale);
    this._faceBlushL = this.add.image(-40 * scale, faceOffY + 5, 'face_blush_left') .setDisplaySize(28 * scale, 17 * scale).setAlpha(0);
    this._faceBlushR = this.add.image( 40 * scale, faceOffY + 5, 'face_blush_right').setDisplaySize(28 * scale, 17 * scale).setAlpha(0);
    this._plant.add(this._faceEyeL);
    this._plant.add(this._faceEyeR);
    this._plant.add(this._faceMouth);
    this._plant.add(this._faceBlushL);
    this._plant.add(this._faceBlushR);

    // Sombrero
    if (this._saveData?.equippedHat) {
      this._plant.add(this.add.image(0, faceOffY - 60, this._saveData.equippedHat).setDisplaySize(80 * scale, 60 * scale));
    }
    // Regadera
    if (this._saveData?.equippedCan) {
      this._plant.add(this.add.image(stageSize * 0.55, 30, this._saveData.equippedCan).setDisplaySize(50, 50));
    }

    // Idle bounce
    this._idleTween = this.tweens.add({
      targets: this._plant, y: y - 6,
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // ── Expresión de la planta ─────────────────────────────
  _setPlantExpression(state) {
    if (!this._faceMouth) return;
    if (state === 'happy') {
      this._faceMouth.setTexture('face_mouth');
      this.tweens.add({ targets: [this._faceBlushL, this._faceBlushR], alpha: 0.9, duration: 200 });
      this.time.delayedCall(1500, () => this._setPlantExpression('default'));
    } else if (state === 'sad') {
      this._faceMouth.setTexture('face_mouth_sad');
      this.tweens.add({ targets: [this._faceBlushL, this._faceBlushR], alpha: 0, duration: 200 });
      this.time.delayedCall(1500, () => this._setPlantExpression('default'));
    } else {
      this._faceMouth.setTexture('face_mouth');
      this.tweens.add({ targets: [this._faceBlushL, this._faceBlushR], alpha: 0, duration: 200 });
    }
  }

  // ── Instrucciones ──────────────────────────────────────
  _showInstructions() {
    const cx = this._width / 2, cy = this._height / 2;

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.5).setDepth(25);

    // catch.png: 1126x656 → aspecto 1.72, mostrar a ~900x524
    const notebook = this.add.image(cx, cy - 30, 'mg_info_fertilizer')
      .setDisplaySize(900, 524).setDepth(26);

    // Reproducir voz de instrucciones
    this.time.delayedCall(300, () => this.sound.play('sfx_htp_voice', { volume: 0.8 }));

    // Botón Play sobre la imagen
    const btnPlay = this.add.image(cx, cy + 230, 'btn_select')
      .setDisplaySize(220, 65).setInteractive({ useHandCursor: true }).setDepth(27);
    const btnPlayTxt = this.add.text(cx, cy + 230, 'Play', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(28);

    btnPlay.on('pointerover',  () => btnPlay.setTint(0xffddaa));
    btnPlay.on('pointerout',   () => btnPlay.clearTint());
    btnPlay.on('pointerdown', () => {
      // Solo parar la voz de instrucciones, no el BGM
      const voice = this.sound.get('sfx_htp_voice');
      if (voice?.isPlaying) voice.stop();
      overlay.destroy(); notebook.destroy();
      btnPlay.destroy(); btnPlayTxt.destroy();
      this._startGame();
    });
  }

  // ── Juego ──────────────────────────────────────────────

  _startGame() {
    this._score      = 0;
    this._coins      = 0;
    this._missed     = 0;
    this._speed      = MINIGAME_FERTILIZER.INITIAL_SPEED;
    this._spawnDelay = MINIGAME_FERTILIZER.INITIAL_DELAY;
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

  _checkDifficulty() {
    if (this._score > 0 && this._score % 5 === 0) {
      this._speed      = Math.min(this._speed + MINIGAME_FERTILIZER.SPEED_INCREMENT, MINIGAME_FERTILIZER.MAX_SPEED);
      this._spawnDelay = Math.max(MINIGAME_FERTILIZER.MIN_DELAY, this._spawnDelay - MINIGAME_FERTILIZER.DELAY_DECREMENT);
      this._startSpawnTimer();
    }
  }

  _updateMissedUI() {
    this._heartImages?.forEach((h, i) => h.setAlpha(i < (3 - this._missed) ? 1 : 0.25));
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
    this._pauseContainer = this.add.container(cx, cy).setDepth(30);

    const overlay   = this.add.rectangle(0, 0, this._width, this._height, 0x000000, 0.6);
    const panel     = this.add.image(0, -20, 'mg_pause_panel').setDisplaySize(585, 385);

    // Botones lado a lado (como en el diseño)
    const btnResume = this.add.image(-130, 80, 'mg_continue_btn')
      .setDisplaySize(220, 75).setInteractive({ useHandCursor: true });
    const btnExit   = this.add.image( 130, 80, 'mg_exit_btn')
      .setDisplaySize(220, 75).setInteractive({ useHandCursor: true });

    btnResume.on('pointerover', () => btnResume.setTint(0xdddddd));
    btnResume.on('pointerout',  () => btnResume.clearTint());
    btnResume.on('pointerdown', () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this._resumeGame();
    });

    btnExit.on('pointerover', () => btnExit.setTint(0xdddddd));
    btnExit.on('pointerout',  () => btnExit.clearTint());
    btnExit.on('pointerdown', () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this._exitGame();
    });

    this._pauseContainer.add([overlay, panel, btnResume, btnExit]);
  }

  // Exit: salir sin terminar la partida
  _exitGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bags.clear(true, true);
    this.scene.start(SCENES.YARD, {
      reward: { coins: this._coins, fertilizerBags: this._score }
    });
  }

  shutdown() {
    this._spawnTimer?.remove();
    this._idleTween?.stop();
    if (this._bags && this._bags.active) this._bags.clear(true, true);
    this._pauseContainer?.destroy();
    this._pauseContainer = null;
  }

  // ── Update ─────────────────────────────────────────────

  update() {
    if (!this._playing) return;

    if (this._cursors.left.isDown) {
      this._plant.x = Math.max(80, this._plant.x - 10);
    } else if (this._cursors.right.isDown) {
      this._plant.x = Math.min(this._width - 80, this._plant.x + 10);
    }

    // Iterar sobre una copia para evitar crash si _endGame destruye el grupo
    const bags = this._bags.getChildren().slice();
    for (const bag of bags) {
      if (!bag.active) continue;

      const dist = Phaser.Math.Distance.Between(
        bag.x, bag.y,
        this._plant.x, this._plant.y - 20
      );

      if (dist < 65) {
        bag.destroy();
        this._score++;
        this._coins += MINIGAME_FERTILIZER.COINS_PER_BAG;
        this._scoreText?.setText(this._score.toString());
        this._coinText?.setText(this._coins.toString());
        this.sound.play('sfx_coins', { volume: 0.4 });
        this._setPlantExpression('happy');
        this._checkDifficulty();
      } else if (bag.y > this._height + 30) {
        bag.destroy();
        this._missed++;
        this._updateMissedUI();
        this._setPlantExpression('sad');
        if (this._missed >= 3) {
          this._endGame();
          return; // salir del update inmediatamente
        }
      }
    }
  }

  _endGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bags.clear(true, true);

    this.sound.play('sfx_lose', { volume: 0.7 });

    const cx = this._width / 2, cy = this._height / 2;

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.5).setDepth(28);

    // Panel estilo diseño
    const panelW = 600, panelH = 320;
    const panel = this.add.graphics().setDepth(29);
    panel.fillStyle(0xfdf6e3, 0.97);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 18);
    panel.lineStyle(4, 0xc8a96e, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 18);

    // "You Lose" como imagen
    this.add.image(cx, cy - 80, 'mg_you_lose')
      .setDisplaySize(380, 120).setDepth(30);

    // Botones lado a lado
    const btnSpacing = 140;

    const retryBtn = this.add.image(cx - btnSpacing, cy + 80, 'mg_retry_btn')
      .setDisplaySize(220, 65).setDepth(30).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover',  () => retryBtn.setTint(0xdddddd));
    retryBtn.on('pointerout',   () => retryBtn.clearTint());
    retryBtn.on('pointerdown',  () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this.scene.start(SCENES.YARD, { reward: { coins: this._coins, fertilizerBags: this._score } });
    });

    const exitBtn = this.add.image(cx + btnSpacing, cy + 80, 'mg_exit_btn')
      .setDisplaySize(220, 65).setDepth(30).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerover',  () => exitBtn.setTint(0xdddddd));
    exitBtn.on('pointerout',   () => exitBtn.clearTint());
    exitBtn.on('pointerdown',  () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this.scene.start(SCENES.YARD, { reward: { coins: this._coins, fertilizerBags: this._score } });
    });
  }
}