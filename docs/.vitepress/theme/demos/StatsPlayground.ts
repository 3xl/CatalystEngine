import { CatalystEngine, ModifierType } from 'catalyst-engine';
import type { DemoContext, DemoFactory } from './types';
import { makeButton, makeText, makePanel } from './ui';

export const width = 660;
export const height = 340;

interface Mirror {
  id: string;
  source: string;
  type: ModifierType;
  value: number;
  label: string;
}

export const create: DemoFactory = ({ Phaser, palette }: DemoContext) => {
  return new (class extends Phaser.Scene {
    private engine!: CatalystEngine;
    private mirror: Mirror[] = [];
    private counter = 0;

    private valueText!: Phaser.GameObjects.Text;
    private formulaText!: Phaser.GameObjects.Text;
    private modsText!: Phaser.GameObjects.Text;
    private eventFlash!: Phaser.GameObjects.Text;

    create() {
      this.engine = new CatalystEngine(
        { attack: 10 },
        { type: 'LINEAR', baseXP: 100, multiplier: 1 }
      );

      // La UI ascolta: ogni addModifier dal facade emette STAT_CHANGED.
      this.engine.events.on('STAT_CHANGED', () => this.flashEvent());

      // --- Colonna sinistra: il valore ---
      makePanel(this, 16, 16, 320, height - 32, palette);
      makeText(this, 36, 36, 'Statistica', palette, { size: 13, soft: true });
      makeText(this, 36, 52, 'ATTACK', palette, { size: 22, bold: true });

      this.valueText = makeText(this, 176, 150, '10', palette, {
        size: 64,
        bold: true,
        origin: [0.5, 0.5],
      });
      this.valueText.setColor(palette.css.brand);

      this.formulaText = makeText(this, 36, 232, '', palette, { size: 13, soft: true });
      makeText(this, 36, 262, 'Modificatori attivi:', palette, { size: 12, soft: true });
      this.modsText = makeText(this, 36, 280, '— nessuno —', palette, { size: 12 });

      this.eventFlash = makeText(this, 300, 36, 'STAT_CHANGED ✦', palette, {
        size: 12,
        bold: true,
        origin: [1, 0],
      });
      this.eventFlash.setColor(palette.css.brand).setAlpha(0);

      // --- Colonna destra: le azioni ---
      const bx = 360;
      const bw = 284;
      let by = 24;
      const step = 46;

      makeButton(this, bx, by, bw, 38, 'Equipaggia spada  (+15 FLAT)', palette, () =>
        this.addMod('spada_di_fuoco', ModifierType.FLAT, 15, 'spada +15')
      );
      by += step;
      makeButton(this, bx, by, bw, 38, 'Buff rabbia  (+20%)', palette, () =>
        this.addMod('rabbia', ModifierType.PERCENT, 0.2, 'rabbia +20%')
      );
      by += step;
      makeButton(this, bx, by, bw, 38, 'Aura del comandante  (+10%)', palette, () =>
        this.addMod('aura', ModifierType.PERCENT, 0.1, 'aura +10%')
      );
      by += step;
      makeButton(
        this,
        bx,
        by,
        bw,
        38,
        'Togli spada  (rimozione per source)',
        palette,
        () => this.removeSource('spada_di_fuoco')
      );
      by += step;
      makeButton(this, bx, by, bw, 38, 'Reset', palette, () => this.reset());

      this.refresh();
    }

    private addMod(source: string, type: ModifierType, value: number, label: string) {
      const id = `${source}_${this.counter++}`;
      // Via facade: applica il modificatore ED emette STAT_CHANGED.
      this.engine.addModifier('attack', { id, source, type, value });
      this.mirror.push({ id, source, type, value, label });
      this.refresh();
    }

    private removeSource(source: string) {
      // removeAllModifiersFromSource rimuove TUTTI i modificatori di quella
      // origine in un colpo solo (qui non passa dal facade, niente evento).
      this.engine.stats.removeAllModifiersFromSource(source);
      this.mirror = this.mirror.filter((m) => m.source !== source);
      this.refresh();
    }

    private reset() {
      for (const m of this.mirror) {
        this.engine.stats.removeAllModifiersFromSource(m.source);
      }
      this.mirror = [];
      this.refresh();
    }

    private refresh() {
      const base = this.engine.stats.getStat('attack')!.baseValue;
      const flat = this.mirror
        .filter((m) => m.type === ModifierType.FLAT)
        .reduce((s, m) => s + m.value, 0);
      const pct = this.mirror
        .filter((m) => m.type === ModifierType.PERCENT)
        .reduce((s, m) => s + m.value, 0);
      const value = this.engine.stats.getStatValue('attack'); // lazy eval qui

      this.valueText.setText(String(value));

      const pctLabel = pct ? ` × (1 + ${pct.toFixed(2)})` : '';
      this.formulaText.setText(`(${base} + ${flat})${pctLabel} = ${value}`);

      this.modsText.setText(
        this.mirror.length ? this.mirror.map((m) => `• ${m.label}`).join('\n') : '— nessuno —'
      );

      // Punta in alto verso destra: lascia spazio se la lista cresce
      this.modsText.setWordWrapWidth(300);
    }

    private flashEvent() {
      this.tweens.killTweensOf(this.eventFlash);
      this.eventFlash.setAlpha(1);
      this.tweens.add({
        targets: this.eventFlash,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.in',
      });
    }
  })();
};
