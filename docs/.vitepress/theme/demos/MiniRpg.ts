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
    id: 'forza', name: 'Forza Bruta', description: '+5 ATK/liv',
    maxLevel: 5, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
];

const ENEMIES = ['Slime', 'Goblin', 'Orco', 'Troll', 'Golem', 'Drago'];

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

      // --- Eroe ---
      makePanel(this, 16, 16, 340, 150, palette);
      makeText(this, 36, 32, 'Eroe', palette, { size: 13, bold: true });
      this.heroText = makeText(this, 36, 56, '', palette, { size: 14 });
      this.heroText.setLineSpacing(4);
      makeText(this, 36, 124, 'Esperienza', palette, { size: 11, soft: true });
      this.xpBar = makeBar(this, 36, 140, 300, 14, palette);

      // --- Nemico ---
      makePanel(this, 364, 16, 340, 150, palette);
      this.enemyName = makeText(this, 384, 32, '', palette, { size: 13, bold: true });
      makeText(this, 384, 96, 'HP', palette, { size: 11, soft: true });
      this.enemyHpBar = makeBar(this, 384, 112, 300, 18, palette, palette.danger);
      this.enemyHpText = makeText(this, 384, 60, '', palette, { size: 22, bold: true });
      this.enemyHpText.setColor(palette.css.brand);

      // --- Azioni ---
      makeButton(this, 16, 186, 340, 48, '⚔  ATTACCA', palette, () => this.attack());
      this.potenziaBtn = makeButton(this, 364, 186, 340, 48, 'Potenzia Forza  (1 punto · +5 ATK)', palette, () =>
        this.upgrade()
      );

      // --- Persistenza ---
      makeButton(this, 16, 246, 108, 32, '💾 Save', palette, () => this.save());
      makeButton(this, 132, 246, 108, 32, '📂 Load', palette, () => this.load());
      makeButton(this, 248, 246, 108, 32, '🧹 Reset', palette, () => this.reset());

      // --- Log di combattimento ---
      makePanel(this, 364, 246, 340, 138, palette);
      makeText(this, 384, 256, 'Diario', palette, { size: 12, bold: true });
      this.logText = makeText(this, 384, 278, '', palette, { size: 11 });
      this.logText.setWordWrapWidth(308);
      this.logText.setLineSpacing(3);

      makeText(this, 16, 300, 'Sconfiggi i nemici → guadagna XP → sali di livello →', palette, { size: 11, soft: true });
      makeText(this, 16, 316, 'spendi i punti per potenziare l’attacco. Il loop completo.', palette, { size: 11, soft: true });

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
          this.pushLog(`★ LEVEL UP! Ora livello ${currentLevel} (+${levelsGained * 2} punti skill)`);
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
      this.pushLog(`Colpisci ${this.currentEnemy()} per ${dmg} danni.`);

      if (this.enemyHp <= 0) {
        const reward = this.enemyMaxHp;
        this.pushLog(`${this.currentEnemy()} sconfitto! +${reward} XP.`);
        this.engine.exp.gainExperience(reward);
        this.nextEnemy();
      }
      this.redraw();
    }

    private upgrade() {
      const res = this.engine.skills.upgradeSkill('forza', this.engine.exp.currentLevel);
      if (res.success) {
        const lvl = this.engine.skills.getSkill('forza')!.currentLevel;
        this.pushLog(`Forza Bruta → liv ${lvl}. ATK ora ${this.engine.stats.getStatValue('attack')}.`);
      } else if (res.reason === 'NO_POINTS') {
        this.pushLog('Punti skill insufficienti — sconfiggi nemici per salire di livello.');
      } else if (res.reason === 'MAX_LEVEL') {
        this.pushLog('Forza Bruta è già al massimo.');
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
      this.pushLog('💾 Partita salvata.');
    }

    private load() {
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
        this.pushLog('Nessun salvataggio da caricare.');
        return;
      }
      this.engine.load(state);
      this.pushLog('📂 Partita caricata.');
      this.redraw();
    }

    private reset() {
      this.buildEngine();
      this.log = [];
      this.pushLog('Nuova partita.');
      this.xpBar.setProgress(0);
      this.redraw();
    }

    private redraw() {
      const lvl = this.engine.exp.currentLevel;
      const atk = this.engine.stats.getStatValue('attack');
      const pts = this.engine.skills.skillPoints;
      const forza = this.engine.skills.getSkill('forza')?.currentLevel ?? 0;

      this.heroText.setText(
        [`Livello ${lvl}    ATK ${atk}`, `Punti skill: ${pts}`, `Forza Bruta: liv ${forza}/5`].join('\n')
      );

      this.enemyName.setText(`Nemico: ${this.currentEnemy()}`);
      this.enemyHpText.setText(`${this.enemyHp} / ${this.enemyMaxHp}`);
      this.enemyHpBar.setProgress(this.enemyHp / this.enemyMaxHp);

      const canUpgrade = pts >= 1 && forza < 5;
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
