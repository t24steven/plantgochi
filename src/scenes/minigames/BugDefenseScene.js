import Phaser from 'phaser';
import { SCENES, MINIGAME_BUGS } from '../../constants.js';
import { PLANTS } from '../../data/plants.js';

export default class BugDefenseScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BUG_DEFENSE });
    this._score   = 0;
    this._coins   = 0;
    this._lives   = 3;
    this._playing = false;
    this._paused  = false;
    this._plantData = null;
    this._saveData  = null;

    // Dificultad escalable
    this._spawnDelay = 1600;
    this._bugSpeed   = { min: 100, max: 180 };
    this._wave       = 0;
  }

  init() {
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

    const gx = v => v * width  / 1280;
    const gy = v => v * height / 720;

    this.add.image(width / 2, height / 2, 'mg_bg_bugs').setDisplaySize(width, height);

    // ── Monedas ────────────────────────────────────────
    this.add.image(gx(75), gy(42), 'ui_coin_small').setDisplaySize(gx(130), gy(38)).setDepth(20);
    this._coinText = this.add.text(gx(75), gy(38), '0', {
      fontSize: `${gx(24)}px`, color: '#7a5200', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);

    // ── Vidas ──────────────────────────────────────────
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
    this._btnPause = this.add.image(width - gx(110), gy(42), 'mg_pause_btn')
      .setDisplaySize(gx(48), gy(48)).setDepth(20).setInteractive({ useHandCursor: true });
    this._btnExit  = this.add.image(width - gx(45), gy(42), 'mg_exit_btn')
      .setDisplaySize(gx(110), gy(46)).setDepth(20).setInteractive({ useHandCursor: true });

    this._btnPause.on('pointerdown', () => this._togglePause());
    this._btnExit.on('pointerdown',  () => this._exitGame());

    // ── Planta del jugador con cara y accesorios ──────────
    this._buildPlant(width / 2, height - 130);

    this._bugs = this.physics.add.group();
    this._showInstructions();
  }

  // ── Construir planta con cara y accesorios ─────────────
  _buildPlant(x, y) {
    const plantId  = this._plantData?.id ?? 'cactus';
    const stage    = this._saveData?.stage ?? 2;

    const POT_W = 150, POT_H = 120, POT_Y = 70;
    const potTop = POT_Y - POT_H / 2;

    let spriteW, spriteH, spriteY, tex;
    if (stage === 0) {
      spriteW = 80; spriteH = 117; tex = `${plantId}_semilla`;
      spriteY = potTop - spriteH / 2 + 20;
    } else if (stage === 1) {
      spriteW = 140; spriteH = 140; tex = `${plantId}_brote`;
      spriteY = potTop - spriteH / 2;
    } else {
      spriteW = 210; spriteH = 210; tex = `${plantId}_default`;
      spriteY = potTop - spriteH / 2;
    }

    const scale    = stage === 0 ? 0.55 : stage === 1 ? 0.75 : 1.0;
    const centerY  = stage === 0 ? -55  : stage === 1 ? -80  : -95;
    const eyeOff   = Math.round(32 * scale);
    const eyeW     = Math.round(34 * scale);
    const mouthW   = Math.round(38 * scale);
    const mouthH   = Math.round(26 * scale);
    const blushW   = Math.round(30 * scale);
    const blushH   = Math.round(18 * scale);
    const blushOff = Math.round(48 * scale);
    const hatY     = centerY - Math.round(60 * scale);

    this._plant = this.add.container(x, y).setDepth(5);

    const potKey = this._saveData?.equippedPot ?? 'pot_base';
    this._plant.add(this.add.image(0, POT_Y, potKey).setDisplaySize(POT_W, POT_H));
    this._plant.add(this.add.image(0, spriteY, tex).setDisplaySize(spriteW, spriteH));

    this._faceEyeL   = this.add.image(-eyeOff, centerY - Math.round(12 * scale), 'face_eye_left') .setDisplaySize(eyeW, eyeW);
    this._faceEyeR   = this.add.image( eyeOff, centerY - Math.round(12 * scale), 'face_eye_right').setDisplaySize(eyeW, eyeW);
    this._faceMouth  = this.add.image(0, centerY + Math.round(14 * scale), 'face_mouth')          .setDisplaySize(mouthW, mouthH);
    this._faceBlushL = this.add.image(-blushOff, centerY + Math.round(2 * scale), 'face_blush_left') .setDisplaySize(blushW, blushH).setAlpha(0);
    this._faceBlushR = this.add.image( blushOff, centerY + Math.round(2 * scale), 'face_blush_right').setDisplaySize(blushW, blushH).setAlpha(0);
    this._plant.add(this._faceEyeL);
    this._plant.add(this._faceEyeR);
    this._plant.add(this._faceMouth);
    this._plant.add(this._faceBlushL);
    this._plant.add(this._faceBlushR);

    if (this._saveData?.equippedHat) {
      this._plant.add(this.add.image(0, hatY, this._saveData.equippedHat).setDisplaySize(110, 80));
    }

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

    const notebook = this.add.image(cx, cy - 30, 'mg_info_bugs')
      .setDisplaySize(900, 503).setDepth(26);

    // Reproducir voz de instrucciones
    const voiceKey = 'sfx_bugs_voice';
    let _voiceSound = null;
    this.time.delayedCall(300, () => {
      _voiceSound = this.sound.add(voiceKey, { volume: 0.8 });
      _voiceSound.play();
    });

    // Botón de voz — solo pausa/reanuda la voz de instrucciones
    let _voicePaused = false;
    const voiceBtn = this.add.image(this._width - 45, this._height - 45, 'btn_voice')
      .setDisplaySize(65, 65).setDepth(29).setInteractive({ useHandCursor: true });
    voiceBtn.on('pointerdown', () => {
      if (!_voiceSound) return;
      if (!_voicePaused) {
        _voiceSound.pause();
        _voicePaused = true;
        voiceBtn.setAlpha(0.4);
      } else {
        try { _voiceSound.resume(); } catch(e) {}
        _voicePaused = false;
        voiceBtn.setAlpha(1);
      }
    });
    voiceBtn.on('pointerover', () => voiceBtn.setTint(0xdddddd));
    voiceBtn.on('pointerout',  () => voiceBtn.clearTint());

    const btnPlay = this.add.image(cx, cy + 220, 'btn_select')
      .setDisplaySize(220, 65).setInteractive({ useHandCursor: true }).setDepth(27);
    const btnPlayTxt = this.add.text(cx, cy + 220, '', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(28);

    btnPlay.on('pointerover',  () => btnPlay.setTint(0xffddaa));
    btnPlay.on('pointerout',   () => btnPlay.clearTint());
    btnPlay.on('pointerdown', () => {
      if (_voiceSound?.isPlaying) _voiceSound.stop();
      overlay.destroy(); notebook.destroy();
      btnPlay.destroy(); btnPlayTxt.destroy();
      voiceBtn.destroy();
      this._startGame();
    });
  }

  // ── Juego ──────────────────────────────────────────────

  _startGame() {
    this._score      = 0;
    this._coins      = 0;
    this._lives      = 3;
    this._wave       = 0;
    this._spawnDelay = MINIGAME_BUGS.INITIAL_DELAY;
    this._bugSpeed   = { min: MINIGAME_BUGS.INITIAL_SPEED_MIN, max: MINIGAME_BUGS.INITIAL_SPEED_MAX };
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

  _checkDifficulty() {
    const newWave = Math.floor(this._score / MINIGAME_BUGS.WAVE_SIZE);
    if (newWave > this._wave) {
      this._wave       = newWave;
      this._spawnDelay = Math.max(MINIGAME_BUGS.MIN_DELAY, this._spawnDelay - 150);
      this._bugSpeed   = {
        min: Math.min(this._bugSpeed.min + 15, MINIGAME_BUGS.MAX_SPEED_MIN),
        max: Math.min(this._bugSpeed.max + 20, MINIGAME_BUGS.MAX_SPEED_MAX),
      };
      this._startSpawnTimer();
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
    if (!bug || !bug.active) return;
    bug.disableInteractive();

    this.tweens.add({
      targets: bug,
      scale: 0,
      alpha: 0,
      duration: 120,
      onComplete: () => {
        try { if (bug && bug.active) bug.destroy(); } catch(e) {}
      }
    });

    this._score++;
    this._coins += MINIGAME_BUGS.COINS_PER_BUG;
    this._coinText?.setText(this._coins.toString());
    this.sound.play('sfx_coins', { volume: 0.4 });
    this._setPlantExpression('happy');
    this._checkDifficulty();
  }

  _updateHearts() {
    this._heartImages?.forEach((h, i) => h.setAlpha(i < this._lives ? 1 : 0.25));
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

    // Botones lado a lado
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
    this._bugs.clear(true, true);
    this.scene.start(SCENES.YARD, {
      reward: { coins: this._coins }
    });
  }

  shutdown() {
    this._spawnTimer?.remove();
    this._idleTween?.stop();
    if (this._bugs && this._bugs.active) this._bugs.clear(true, true);
    this._pauseContainer?.destroy();
    this._pauseContainer = null;
  }

  // ── Update ─────────────────────────────────────────────

  update() {
    if (!this._playing) return;

    const plantX = this._plant?.x ?? this._width / 2;
    const plantY = this._plant?.y ?? this._height - 130;

    // Iterar sobre copia para evitar crash si _endGame destruye el grupo
    const bugs = this._bugs.getChildren().slice();
    for (const bug of bugs) {
      if (!bug.active) continue;
      const dist = Phaser.Math.Distance.Between(bug.x, bug.y, plantX, plantY);
      if (dist < 75) {
        try { bug.destroy(); } catch(e) {}
        this._lives--;
        this._updateHearts();
        this._setPlantExpression('sad');
        if (this._lives <= 0) {
          this._endGame();
          return;
        }
      }
    }
  }

  _endGame() {
    this._playing = false;
    this._paused  = false;
    this._spawnTimer?.remove();
    this._bugs.clear(true, true);

    this.sound.play('sfx_lose', { volume: 0.7 });

    const cx = this._width / 2, cy = this._height / 2;

    const overlay = this.add.rectangle(cx, cy, this._width, this._height, 0x000000, 0.5).setDepth(28);

    const panelW = 600, panelH = 320;
    const panel = this.add.graphics().setDepth(29);
    panel.fillStyle(0xfdf6e3, 0.97);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 18);
    panel.lineStyle(4, 0xc8a96e, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2 - 20, panelW, panelH, 18);

    this.add.image(cx, cy - 80, 'mg_you_lose')
      .setDisplaySize(380, 120).setDepth(30);

    const btnSpacing = 140;

    const retryBtn = this.add.image(cx - btnSpacing, cy + 80, 'mg_retry_btn')
      .setDisplaySize(220, 65).setDepth(30).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover',  () => retryBtn.setTint(0xdddddd));
    retryBtn.on('pointerout',   () => retryBtn.clearTint());
    retryBtn.on('pointerdown',  () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this.scene.restart();
    });

    const exitBtn = this.add.image(cx + btnSpacing, cy + 80, 'mg_exit_btn')
      .setDisplaySize(220, 65).setDepth(30).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerover',  () => exitBtn.setTint(0xdddddd));
    exitBtn.on('pointerout',   () => exitBtn.clearTint());
    exitBtn.on('pointerdown',  () => {
      this.sound.play('sfx_click', { volume: 0.4 });
      this.scene.start(SCENES.YARD, { reward: { coins: this._coins } });
    });
  }
}