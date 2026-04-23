/**
 * AudioButton — botón de pausa/reanuda del BGM.
 *
 * @param {Phaser.Scene} scene            - La escena donde se agrega el botón
 * @param {boolean}      [initPaused]     - Estado inicial (para persistir entre rebuilds)
 * @param {Function}     [onToggle]       - Callback(paused: boolean) al cambiar estado
 */
export function addAudioButton(scene, initPaused = false, onToggle = null) {
  const { width, height } = scene.cameras.main;

  const btn = scene.add.image(width - 45, height - 45, 'btn_voice')
    .setDisplaySize(70, 70)
    .setDepth(50)
    .setInteractive({ useHandCursor: true });

  let _paused = initPaused;

  const refresh = () => btn.setAlpha(_paused ? 0.4 : 1);
  refresh();

  btn.on('pointerdown', () => {
    const bgm = scene.sound.get('bgm');
    if (!bgm) return;

    if (!_paused) {
      bgm.pause();
      _paused = true;
    } else {
      try { bgm.resume(); } catch(e) { try { bgm.play(); } catch(e2) {} }
      _paused = false;
    }
    refresh();
    if (onToggle) onToggle(_paused);
  });

  btn.on('pointerover', () => btn.setTint(0xdddddd));
  btn.on('pointerout',  () => btn.clearTint());

  return btn;
}
