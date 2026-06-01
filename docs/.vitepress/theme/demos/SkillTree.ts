import { CatalystEngine, ModifierType } from 'catalyst-engine';
import type { ISkillNode } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeText, makePanel } from './ui';

export const width = 700;
export const height = 380;

interface NodeView {
  id: string;
  short: string;
  pos: [number, number];
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

const TREE: ISkillNode[] = [
  {
    id: 'forza', name: 'Forza Bruta', description: '+5 ATK/liv',
    maxLevel: 3, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
  {
    id: 'affondo', name: 'Affondo', description: '+8 ATK',
    maxLevel: 1, currentLevel: 0, requiredPlayerLevel: 2,
    prerequisiteSkillIds: ['forza'], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'af', source: 'attack', type: ModifierType.FLAT, value: 8 }],
  },
  {
    id: 'furia', name: 'Furia', description: '+15% ATK/liv',
    maxLevel: 2, currentLevel: 0, requiredPlayerLevel: 3,
    prerequisiteSkillIds: ['forza'], pointCostPerLevel: 2, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fu', source: 'attack', type: ModifierType.PERCENT, value: 0.15 }],
  },
  {
    id: 'maestria', name: 'Maestria', description: '+25% ATK',
    maxLevel: 1, currentLevel: 0, requiredPlayerLevel: 5,
    prerequisiteSkillIds: ['affondo', 'furia'], pointCostPerLevel: 3, type: 'PASSIVE',
    passiveModifiers: [{ id: 'ma', source: 'attack', type: ModifierType.PERCENT, value: 0.25 }],
  },
];

const LAYOUT: Record<string, { short: string; pos: [number, number] }> = {
  forza: { short: 'Forza', pos: [180, 70] },
  affondo: { short: 'Affondo', pos: [100, 190] },
  furia: { short: 'Furia', pos: [260, 190] },
  maestria: { short: 'Maestria', pos: [180, 300] },
};

const REASONS: Record<string, string> = {
  LOW_LEVEL: 'Livello giocatore troppo basso',
  MISSING_PREREQUISITES: 'Prerequisiti non sbloccati',
  NO_POINTS: 'Punti skill insufficienti',
  MAX_LEVEL: 'Già al livello massimo',
  NOT_FOUND: 'Skill non trovata',
};

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;
    private playerLevel = 1;
    private nodes: NodeView[] = [];

    private attackText!: Phaser.GameObjects.Text;
    private pointsText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private msgText!: Phaser.GameObjects.Text;

    create() {
      this.buildEngine();

      // Archi del DAG (sotto i nodi)
      const g = this.add.graphics();
      g.lineStyle(2, palette.textSoft, 0.4);
      for (const node of TREE) {
        for (const pre of node.prerequisiteSkillIds) {
          const a = LAYOUT[pre].pos;
          const b = LAYOUT[node.id].pos;
          g.lineBetween(a[0], a[1], b[0], b[1]);
        }
      }

      // Nodi
      for (const node of TREE) {
        const { short, pos } = LAYOUT[node.id];
        const circle = this.add.circle(pos[0], pos[1], 28, palette.surface, 1);
        circle.setStrokeStyle(2, palette.textSoft, 1);
        circle.setInteractive(
          new Phaser.Geom.Circle(pos[0], pos[1], 28),
          Phaser.Geom.Circle.Contains
        );
        circle.on('pointerdown', () => this.tryUpgrade(node.id));
        circle.input!.cursor = 'pointer';

        const label = makeText(this, pos[0], pos[1] + 40, short, palette, {
          size: 12,
          origin: [0.5, 0],
        });
        const inner = makeText(this, pos[0], pos[1], '', palette, {
          size: 12,
          bold: true,
          origin: [0.5, 0.5],
        });
        inner.setColor('#ffffff');

        this.nodes.push({ id: node.id, short, pos, circle, label });
        // memorizza il testo interno tramite data
        circle.setData('inner', inner);
      }

      // Pannello destro
      makePanel(this, 380, 16, 304, height - 32, palette);
      makeText(this, 400, 36, 'Eroe', palette, { size: 13, soft: true });
      this.attackText = makeText(this, 400, 56, '', palette, { size: 22, bold: true });
      this.attackText.setColor(palette.css.brand);
      this.levelText = makeText(this, 400, 92, '', palette, { size: 13, soft: true });
      this.pointsText = makeText(this, 400, 112, '', palette, { size: 13, soft: true });

      makeButton(this, 400, 150, 264, 34, 'Sali di livello  (+2 punti)', palette, () => {
        this.playerLevel += 1;
        this.engine.skills.addSkillPoints(2);
        this.flash(`Ora sei livello ${this.playerLevel} (+2 punti)`);
        this.redraw();
      });
      makeButton(this, 400, 190, 264, 34, '+2 punti skill', palette, () => {
        this.engine.skills.addSkillPoints(2);
        this.flash('+2 punti skill');
        this.redraw();
      });
      makeButton(this, 400, 230, 264, 34, 'Reset', palette, () => {
        this.playerLevel = 1;
        this.buildEngine();
        this.flash('— reset —');
        this.redraw();
      });

      makeText(this, 400, 282, 'Clicca un nodo per potenziarlo:', palette, {
        size: 11,
        soft: true,
      });
      this.msgText = makeText(this, 400, 302, '', palette, { size: 12 });
      this.msgText.setWordWrapWidth(264);

      this.redraw();
    }

    private buildEngine() {
      this.engine = new CatalystEngine(
        { attack: 10 },
        { type: 'LINEAR', baseXP: 100, multiplier: 1 }
      );
      this.engine.skills.loadSkillTree(TREE);
      this.engine.skills.addSkillPoints(2); // punti iniziali
    }

    private tryUpgrade(id: string) {
      const res = this.engine.skills.upgradeSkill(id, this.playerLevel);
      if (res.success) {
        const skill = this.engine.skills.getSkill(id)!;
        this.flash(`✓ ${skill.name} → liv ${skill.currentLevel}`, true);
      } else {
        this.flash(`✗ ${REASONS[res.reason ?? 'NOT_FOUND']}`, false);
      }
      this.redraw();
    }

    private status(id: string): 'maxed' | 'available' | 'locked' {
      const skill = this.engine.skills.getSkill(id)!;
      if (skill.currentLevel >= skill.maxLevel) return 'maxed';
      const prereqOk = skill.prerequisiteSkillIds.every(
        (p) => (this.engine.skills.getSkill(p)?.currentLevel ?? 0) > 0
      );
      const pointsOk = this.engine.skills.skillPoints >= skill.pointCostPerLevel;
      const levelOk = this.playerLevel >= skill.requiredPlayerLevel;
      return prereqOk && pointsOk && levelOk ? 'available' : 'locked';
    }

    private redraw() {
      this.attackText.setText(`ATK: ${this.engine.stats.getStatValue('attack')}`);
      this.levelText.setText(`Livello giocatore: ${this.playerLevel}`);
      this.pointsText.setText(`Punti skill: ${this.engine.skills.skillPoints}`);

      for (const nv of this.nodes) {
        const skill = this.engine.skills.getSkill(nv.id)!;
        const st = this.status(nv.id);
        const color =
          st === 'maxed' ? palette.success : st === 'available' ? palette.brand : palette.surface;
        nv.circle.setFillStyle(color, 1);
        nv.circle.setStrokeStyle(2, st === 'locked' ? palette.textSoft : color, 1);

        const inner = nv.circle.getData('inner') as Phaser.GameObjects.Text;
        inner.setText(`${skill.currentLevel}/${skill.maxLevel}`);
        inner.setColor(st === 'locked' ? palette.css.textSoft : '#ffffff');
        nv.label.setText(`${nv.short}\nliv ${skill.requiredPlayerLevel}+ · ${skill.pointCostPerLevel}p`);
      }
    }

    private flash(text: string, ok?: boolean) {
      this.msgText.setText(text);
      this.msgText.setColor(
        ok === undefined
          ? palette.css.textSoft
          : ok
          ? '#' + palette.success.toString(16).padStart(6, '0')
          : '#' + palette.danger.toString(16).padStart(6, '0')
      );
    }
  })();
};
