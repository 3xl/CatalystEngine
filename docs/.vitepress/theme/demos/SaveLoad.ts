import { CatalystEngine, ModifierType } from 'catalyst-engine';
import type { ISkillNode, IEngineSaveState } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeText, makePanel } from './ui';

export const width = 700;
export const height = 360;

const STORAGE_KEY = 'catalyst-demo-save';

const TREE: ISkillNode[] = [
  {
    id: 'brute_force', name: 'Brute Force', description: '+5 ATK/lvl',
    maxLevel: 3, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
];

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;
    private saved: IEngineSaveState | null = null;

    private stateText!: Phaser.GameObjects.Text;
    private jsonText!: Phaser.GameObjects.Text;
    private loadBtn!: ReturnType<typeof makeButton>;

    create() {
      this.buildEngine();

      // --- Left: live state + actions to build it ---
      makePanel(this, 16, 16, 300, height - 32, palette);
      makeText(this, 36, 34, 'Current state (live)', palette, { size: 13, bold: true });
      this.stateText = makeText(this, 36, 60, '', palette, { size: 13 });
      this.stateText.setLineSpacing(6);

      makeButton(this, 36, 196, 260, 34, '+250 XP  (level up)', palette, () => {
        this.engine.exp.gainExperience(250);
        this.redraw();
      });
      makeButton(this, 36, 238, 260, 34, 'Upgrade Brute Force  (+5 ATK)', palette, () => {
        this.engine.skills.upgradeSkill('brute_force', this.engine.exp.currentLevel);
        this.redraw();
      });
      makeText(this, 36, 286, 'Build a state, then save it →', palette, {
        size: 11, soft: true,
      });

      // --- Right: JSON snapshot + persistence ---
      makePanel(this, 332, 16, 352, height - 32, palette);
      makeText(this, 352, 34, 'Saved snapshot (minimal JSON)', palette, { size: 13, bold: true });
      this.jsonText = makeText(this, 352, 58, '(no save yet)', palette, { size: 10, soft: true });
      this.jsonText.setLineSpacing(2);

      makeButton(this, 352, 250, 100, 34, '💾 Save', palette, () => this.save());
      makeButton(this, 458, 250, 110, 34, '🧹 Reset', palette, () => this.reset());
      this.loadBtn = makeButton(this, 574, 250, 92, 34, '📂 Load', palette, () => this.loadGame());

      makeText(this, 352, 296, 'Save = base+XP+skills only. Transient', palette, { size: 10, soft: true });
      makeText(this, 352, 310, 'modifiers (e.g. equipment) are NOT saved.', palette, { size: 10, soft: true });

      this.redraw();
    }

    private buildEngine() {
      this.engine = new CatalystEngine(
        { attack: 10, hp: 100 },
        { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
      );
      // The tree must be loaded BEFORE any load(): importState re-injects
      // the passives by iterating over the present nodes.
      this.engine.skills.loadSkillTree(TREE);
    }

    private save() {
      this.saved = this.engine.save();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
      } catch {
        /* localStorage unavailable: keep the state in memory */
      }
      // Show a compact version (without the long timestamp) for readability
      const view = { ...this.saved, timestamp: '…' };
      this.jsonText.setText(JSON.stringify(view, null, 2));
      this.redraw();
    }

    private reset() {
      this.buildEngine();
      this.redraw();
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
      if (!state) return;
      // load() restores and re-injects the passives of the unlocked skills.
      this.engine.load(state);
      this.redraw();
    }

    private redraw() {
      const lvl = this.engine.exp.currentLevel;
      const xp = this.engine.exp.currentXP;
      const atk = this.engine.stats.getStatValue('attack');
      const pts = this.engine.skills.skillPoints;
      const brute_force = this.engine.skills.getSkill('brute_force')?.currentLevel ?? 0;

      this.stateText.setText(
        [
          `Level:        ${lvl}`,
          `XP:           ${xp}`,
          `ATK:          ${atk}`,
          `Skill points: ${pts}`,
          `Brute Force:  lvl ${brute_force}`,
        ].join('\n')
      );

      this.loadBtn.setEnabled(this.saved !== null || this.hasStorage());
    }

    private hasStorage(): boolean {
      try {
        return localStorage.getItem(STORAGE_KEY) !== null;
      } catch {
        return false;
      }
    }
  })();
};
