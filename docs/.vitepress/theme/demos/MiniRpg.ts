import { CatalystEngine, ModifierType } from 'catalyst-engine';
import type { ISkillNode, IEngineSaveState } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeBar, makeText, makePanel } from './ui';
import { prefersReducedMotion } from './theme';

export const width = 720;
export const height = 400;

const STORAGE_KEY = 'catalyst-minirpg-save';

const TREE: ISkillNode[] = [
  {
    id: 'brute_force', name: 'Brute Force', description: '+5 ATK/lvl',
    maxLevel: 5, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
];

const ENEMIES = ['Slime', 'Goblin', 'Orc', 'Troll', 'Golem', 'Dragon'];

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;
    private saved: IEngineSaveState | null = null;

    private enemyIdx = 0;
    private enemyMaxHp = 30;
    private enemyHp = 30;

    private heroText!: Phaser.GameObjects.Text;
    private xpBar!: ReturnType<typeof makeBar>;
    private enemyName!: Phaser.GameObjects.Text;
    private enemyHpText!: Phaser.GameObjects.Text;
    private enemyHpBar!: ReturnType<typeof makeBar>;
    private potenziaBtn!: ReturnType<typeof makeButton>;
    private logText!: Phaser.GameObjects.Text;
    private log: string[] = [];

    create() {
      this.buildEngine();

      // --- Hero ---
      makePanel(this, 16, 16, 340, 150, palette);
      makeText(this, 36, 32, 'Hero', palette, { size: 13, bold: true });
      this.heroText = makeText(this, 36, 56, '', palette, { size: 14 });
      this.heroText.setLineSpacing(4);
      makeText(this, 36, 124, 'Experience', palette, { size: 11, soft: true });
      this.xpBar = makeBar(this, 36, 140, 300, 14, palette);

      // --- Enemy ---
      makePanel(this, 364, 16, 340, 150, palette);
      this.enemyName = makeText(this, 384, 32, '', palette, { size: 13, bold: true });
      makeText(this, 384, 96, 'HP', palette, { size: 11, soft: true });
      this.enemyHpBar = makeBar(this, 384, 112, 300, 18, palette, palette.danger);
      this.enemyHpText = makeText(this, 384, 60, '', palette, { size: 22, bold: true });
      this.enemyHpText.setColor(palette.css.brand);

      // --- Actions ---
      makeButton(this, 16, 186, 340, 48, '⚔  ATTACK', palette, () => this.attack());
      this.potenziaBtn = makeButton(this, 364, 186, 340, 48, 'Upgrade Brute Force  (1 point · +5 ATK)', palette, () =>
        this.upgrade()
      );

      // --- Persistence ---
      makeButton(this, 16, 246, 108, 32, '💾 Save', palette, () => this.save());
      makeButton(this, 132, 246, 108, 32, '📂 Load', palette, () => this.loadGame());
      makeButton(this, 248, 246, 108, 32, '🧹 Reset', palette, () => this.reset());

      // --- Combat log ---
      makePanel(this, 364, 246, 340, 138, palette);
      makeText(this, 384, 256, 'Log', palette, { size: 12, bold: true });
      this.logText = makeText(this, 384, 278, '', palette, { size: 11 });
      this.logText.setWordWrapWidth(308);
      this.logText.setLineSpacing(3);

      makeText(this, 16, 300, 'Defeat enemies → gain XP → level up →', palette, { size: 11, soft: true });
      makeText(this, 16, 316, 'spend points to boost your attack. The full loop.', palette, { size: 11, soft: true });

      this.redraw();
    }

    private buildEngine() {
      this.engine = new CatalystEngine(
        { attack: 8 },
        { type: 'EXPONENTIAL', baseXP: 60, multiplier: 1.4 }
      );
      this.engine.skills.loadSkillTree(TREE);

      this.engine.events.on('XP_GAINED', ({ percentage }) => this.xpBar.setProgress(percentage));
      this.engine.events.on('LEVEL_UP', ({ currentLevel, levelsGained }) => {
        if (levelsGained > 0) {
          this.pushLog(`★ LEVEL UP! Now level ${currentLevel} (+${levelsGained * 2} skill points)`);
          this.celebrate();
        }
      });

      this.enemyIdx = 0;
      this.enemyMaxHp = 30;
      this.enemyHp = 30;
    }

    private attack() {
      const dmg = this.engine.stats.getStatValue('attack');
      this.enemyHp = Math.max(0, this.enemyHp - dmg);
      this.floatDamage(dmg);
      this.pushLog(`You hit ${this.currentEnemy()} for ${dmg} damage.`);

      if (this.enemyHp <= 0) {
        const reward = this.enemyMaxHp;
        this.pushLog(`${this.currentEnemy()} defeated! +${reward} XP.`);
        this.engine.exp.gainExperience(reward);
        this.nextEnemy();
      }
      this.redraw();
    }

    private upgrade() {
      const res = this.engine.skills.upgradeSkill('brute_force', this.engine.exp.currentLevel);
      if (res.success) {
        const lvl = this.engine.skills.getSkill('brute_force')!.currentLevel;
        this.pushLog(`Brute Force → lvl ${lvl}. ATK now ${this.engine.stats.getStatValue('attack')}.`);
      } else if (res.reason === 'NO_POINTS') {
        this.pushLog('Not enough skill points — defeat enemies to level up.');
      } else if (res.reason === 'MAX_LEVEL') {
        this.pushLog('Brute Force is already maxed.');
      }
      this.redraw();
    }

    private nextEnemy() {
      this.enemyIdx++;
      this.enemyMaxHp = 30 + this.enemyIdx * 18;
      this.enemyHp = this.enemyMaxHp;
    }

    private currentEnemy(): string {
      return ENEMIES[Math.min(this.enemyIdx, ENEMIES.length - 1)];
    }

    private save() {
      this.saved = this.engine.save();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
      } catch {
        /* ignore */
      }
      this.pushLog('💾 Game saved.');
    }

    private loadGame() {
      let state = this.saved;
      if (!state) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) state = JSON.parse(raw) as IEngineSaveState;
        } catch {
          /* ignore */
        }
      }
      if (!state) {
        this.pushLog('No save to load.');
        return;
      }
      this.engine.load(state);
      this.pushLog('📂 Game loaded.');
      this.redraw();
    }

    private reset() {
      this.buildEngine();
      this.log = [];
      this.pushLog('New game.');
      this.xpBar.setProgress(0);
      this.redraw();
    }

    private redraw() {
      const lvl = this.engine.exp.currentLevel;
      const atk = this.engine.stats.getStatValue('attack');
      const pts = this.engine.skills.skillPoints;
      const brute_force = this.engine.skills.getSkill('brute_force')?.currentLevel ?? 0;

      this.heroText.setText(
        [`Level ${lvl}    ATK ${atk}`, `Skill points: ${pts}`, `Brute Force: lvl ${brute_force}/5`].join('\n')
      );

      this.enemyName.setText(`Enemy: ${this.currentEnemy()}`);
      this.enemyHpText.setText(`${this.enemyHp} / ${this.enemyMaxHp}`);
      this.enemyHpBar.setProgress(this.enemyHp / this.enemyMaxHp);

      const canUpgrade = pts >= 1 && brute_force < 5;
      this.potenziaBtn.setEnabled(canUpgrade);
    }

    private floatDamage(dmg: number) {
      const t = makeText(this, 534, 80, `-${dmg}`, palette, { size: 20, bold: true, origin: [0.5, 0.5] });
      t.setColor('#' + palette.danger.toString(16).padStart(6, '0'));
      this.tweens.add({
        targets: t,
        y: 40,
        alpha: { from: 1, to: 0 },
        duration: 700,
        ease: 'Cubic.out',
        onComplete: () => t.destroy(),
      });
    }

    private celebrate() {
      if (prefersReducedMotion()) return;
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14;
        const dot = this.add.circle(180, 90, 3, palette.brand, 1);
        this.tweens.add({
          targets: dot,
          x: 180 + Math.cos(angle) * 50,
          y: 90 + Math.sin(angle) * 50,
          alpha: { from: 1, to: 0 },
          duration: 650,
          ease: 'Cubic.out',
          onComplete: () => dot.destroy(),
        });
      }
    }

    private pushLog(line: string) {
      this.log.unshift(line);
      this.log = this.log.slice(0, 6);
      this.logText.setText(this.log.join('\n'));
    }
  })();
};
