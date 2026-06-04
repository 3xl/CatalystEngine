import { CatalystEngine, ModifierType } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeBar, makeText, makePanel } from './ui';

export const width = 684;
export const height = 348;

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;
    private lastHp = 100;
    private counter = 0;

    // Widget 1 (HUD)
    private hpBar!: ReturnType<typeof makeBar>;
    private hpText!: Phaser.GameObjects.Text;

    // Widget 2 (Log)
    private logText!: Phaser.GameObjects.Text;
    private log: string[] = [];
    private logActive = true;
    private logHandlers: Array<{ event: any; cb: (d: any) => void }> = [];
    private silenceBtn!: ReturnType<typeof makeButton>;

    create() {
      this.engine = new CatalystEngine(
        { hp: 100 },
        { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
      );

      // Actions that cause events
      makeButton(this, 16, 18, 210, 34, 'Take  −15 HP', palette, () =>
        this.engine.addModifier('hp', {
          id: `c${this.counter++}`, source: 'hit', type: ModifierType.FLAT, value: -15,
        })
      );
      makeButton(this, 236, 18, 200, 34, 'Heal  +10 HP', palette, () =>
        this.engine.addModifier('hp', {
          id: `h${this.counter++}`, source: 'heal', type: ModifierType.FLAT, value: 10,
        })
      );
      makeButton(this, 446, 18, 222, 34, '+120 XP', palette, () =>
        this.engine.exp.gainExperience(120)
      );

      // --- Widget 1: HUD ---
      makePanel(this, 16, 68, 320, height - 84, palette);
      makeText(this, 36, 86, 'Widget 1 — HUD', palette, { size: 13, bold: true });
      makeText(this, 36, 108, 'listens to STAT_CHANGED and LEVEL_UP', palette, { size: 11, soft: true });
      this.hpText = makeText(this, 36, 150, '', palette, { size: 16, bold: true });
      this.hpBar = makeBar(this, 36, 178, 280, 20, palette, palette.success);

      // --- Widget 2: Log ---
      makePanel(this, 348, 68, 320, height - 84, palette);
      makeText(this, 368, 86, 'Widget 2 — Event log', palette, { size: 13, bold: true });
      makeText(this, 368, 108, 'listens to all events', palette, { size: 11, soft: true });
      this.logText = makeText(this, 368, 132, '—', palette, { size: 11 });
      this.logText.setWordWrapWidth(284);
      this.silenceBtn = makeButton(this, 368, 280, 280, 32, 'Mute Widget 2  (off)', palette, () =>
        this.toggleLog()
      );

      // --- INDEPENDENT subscriptions: no widget knows about the other ---
      // Widget 1
      this.engine.events.on('STAT_CHANGED', ({ statId, newValue }) => {
        if (statId !== 'hp') return;
        const delta = newValue - this.lastHp;
        this.lastHp = newValue;
        this.updateHud(newValue);
        this.floatText(delta >= 0 ? `+${delta}` : `${delta}`, delta >= 0 ? palette.success : palette.danger);
      });
      this.engine.events.on('LEVEL_UP', ({ currentLevel, levelsGained }) => {
        if (levelsGained > 0) this.floatText(`LEVEL ${currentLevel}!`, palette.brand);
      });

      // Widget 2
      this.subscribeLog();

      this.updateHud(100);
    }

    private subscribeLog() {
      const add = (event: any, fmt: (d: any) => string) => {
        const cb = (d: any) => this.pushLog(fmt(d));
        this.engine.events.on(event, cb);
        this.logHandlers.push({ event, cb });
      };
      add('STAT_CHANGED', (d) => `STAT_CHANGED  ${d.statId}=${d.newValue}`);
      add('XP_GAINED', (d) => `XP_GAINED  ${Math.round(d.percentage * 100)}%`);
      add('LEVEL_UP', (d) => `LEVEL_UP  → lvl ${d.currentLevel}`);
    }

    private toggleLog() {
      if (this.logActive) {
        // off(): detaches ONLY Widget 2's listeners. Widget 1 keeps reacting.
        for (const { event, cb } of this.logHandlers) this.engine.events.off(event, cb);
        this.logHandlers = [];
        this.logActive = false;
        this.silenceBtn.setLabel('Unmute Widget 2  (on)');
        this.pushLogForced('— widget muted (off) —');
      } else {
        this.subscribeLog();
        this.logActive = true;
        this.silenceBtn.setLabel('Mute Widget 2  (off)');
        this.pushLogForced('— widget unmuted (on) —');
      }
    }

    private updateHud(hp: number) {
      this.hpText.setText(`HP: ${hp} / 100`);
      this.hpBar.setProgress(hp / 100);
      this.hpBar.setColor(hp < 40 ? palette.danger : palette.success);
    }

    private floatText(text: string, color: number) {
      const t = makeText(this, 176, 150, text, palette, { size: 18, bold: true, origin: [0.5, 0.5] });
      t.setColor('#' + color.toString(16).padStart(6, '0'));
      this.tweens.add({
        targets: t,
        y: 110,
        alpha: { from: 1, to: 0 },
        duration: 850,
        ease: 'Cubic.out',
        onComplete: () => t.destroy(),
      });
    }

    private pushLog(line: string) {
      if (!this.logActive) return;
      this.pushLogForced(line);
    }

    private pushLogForced(line: string) {
      this.log.unshift(line);
      this.log = this.log.slice(0, 8);
      this.logText.setText(this.log.join('\n'));
    }
  })();
};
