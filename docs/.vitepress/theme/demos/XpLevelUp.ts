import { CatalystEngine } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeBar, makeText, makePanel } from './ui';
import { prefersReducedMotion } from './theme';

export const width = 660;
export const height = 320;

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;

    private levelText!: Phaser.GameObjects.Text;
    private pointsText!: Phaser.GameObjects.Text;
    private xpBar!: ReturnType<typeof makeBar>;
    private xpText!: Phaser.GameObjects.Text;
    private logText!: Phaser.GameObjects.Text;
    private log: string[] = [];

    create() {
      // --- Sinistra: livello + punti skill ---
      makePanel(this, 16, 16, 300, height - 32, palette);
      makeText(this, 36, 36, 'Personaggio', palette, { size: 13, soft: true });
      this.levelText = makeText(this, 36, 60, 'Livello 1', palette, { size: 30, bold: true });
      this.levelText.setColor(palette.css.brand);
      this.pointsText = makeText(this, 36, 110, 'Punti skill: 0', palette, { size: 14, soft: true });
      makeText(this, 36, 140, '(ogni livello concede 2 punti skill)', palette, {
        size: 11,
        soft: true,
      });

      // Barra XP
      makeText(this, 36, 188, 'Esperienza', palette, { size: 12, soft: true });
      this.xpBar = makeBar(this, 36, 208, 260, 22, palette);
      this.xpText = makeText(this, 36, 238, '', palette, { size: 12, soft: true });

      // --- Destra: azioni + log ---
      const bx = 340;
      const bw = 304;
      makeButton(this, bx, 24, bw, 36, '+50 XP', palette, () => this.gain(50));
      makeButton(this, bx, 66, bw, 36, '+250 XP', palette, () => this.gain(250));
      makeButton(this, bx, 108, bw, 36, '+1000 XP  (level-up a catena)', palette, () =>
        this.gain(1000)
      );
      makeButton(this, bx, 150, bw, 36, 'Reset', palette, () => this.reset());

      makeText(this, bx, 198, 'Eventi emessi dall’engine:', palette, { size: 12, soft: true });
      this.logText = makeText(this, bx, 218, '—', palette, { size: 11 });
      this.logText.setWordWrapWidth(bw);

      this.buildEngine();
    }

    private buildEngine() {
      this.engine = new CatalystEngine(
        { hp: 100 },
        { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
      );

      // La UI reagisce SOLO agli eventi: non interroga mai l'engine in polling.
      this.engine.events.on('XP_GAINED', ({ currentXP, nextRequiredXP, percentage }) => {
        this.xpBar.setProgress(percentage);
        this.xpText.setText(`${currentXP} / ${nextRequiredXP} XP`);
        this.pushLog(`XP_GAINED → ${Math.round(percentage * 100)}%`);
      });

      this.engine.events.on('LEVEL_UP', ({ currentLevel, levelsGained }) => {
        this.levelText.setText(`Livello ${currentLevel}`);
        this.pointsText.setText(`Punti skill: ${this.engine.skills.skillPoints}`);
        if (levelsGained > 0) {
          this.celebrate(levelsGained);
          this.pushLog(`LEVEL_UP → +${levelsGained} liv. (ora ${currentLevel})`);
        }
      });

      this.resetUI();
    }

    private gain(amount: number) {
      this.engine.exp.gainExperience(amount);
    }

    private reset() {
      this.buildEngine();
      this.pushLog('— reset —');
    }

    private resetUI() {
      this.levelText.setText('Livello 1');
      this.pointsText.setText('Punti skill: 0');
      const next = this.engine.exp.getXPRequirementForLevel(2);
      this.xpBar.setProgress(0);
      this.xpText.setText(`0 / ${next} XP`);
    }

    private celebrate(levels: number) {
      // Punch sul testo del livello
      this.tweens.add({
        targets: this.levelText,
        scale: { from: 1.35, to: 1 },
        duration: 320,
        ease: 'Back.out',
      });

      // Testo fluttuante
      const label = levels > 1 ? `LEVEL UP ×${levels}!` : 'LEVEL UP!';
      const t = makeText(this, 170, 70, label, palette, {
        size: 18,
        bold: true,
        origin: [0.5, 0.5],
      });
      t.setColor(palette.css.brand);
      this.tweens.add({
        targets: t,
        y: 30,
        alpha: { from: 1, to: 0 },
        duration: 900,
        ease: 'Cubic.out',
        onComplete: () => t.destroy(),
      });

      // Piccolo burst di particelle (cerchi tweenati, niente texture esterne)
      this.burst(170, 70);
    }

    private burst(x: number, y: number) {
      if (prefersReducedMotion()) return;
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const dot = this.add.circle(x, y, 3, palette.brand, 1);
        this.tweens.add({
          targets: dot,
          x: x + Math.cos(angle) * 46,
          y: y + Math.sin(angle) * 46,
          alpha: { from: 1, to: 0 },
          duration: 600,
          ease: 'Cubic.out',
          onComplete: () => dot.destroy(),
        });
      }
    }

    private pushLog(line: string) {
      this.log.unshift(line);
      this.log = this.log.slice(0, 4);
      this.logText.setText(this.log.join('\n'));
    }
  })();
};
