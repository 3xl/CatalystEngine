import type PhaserNamespace from 'phaser';
import type { DemoPalette } from './theme';

type Scene = PhaserNamespace.Scene;

const FONT = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

export interface Button {
  container: PhaserNamespace.GameObjects.Container;
  setEnabled(enabled: boolean): void;
  setLabel(text: string): void;
}

/** Pulsante rettangolare con hover e stato disabilitato. */
export function makeButton(
  scene: Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  palette: DemoPalette,
  onClick: () => void
): Button {
  const bg = scene.add.rectangle(0, 0, width, height, palette.brand, 1).setOrigin(0, 0);
  bg.setStrokeStyle(1, palette.brand, 1);

  const text = scene.add
    .text(width / 2, height / 2, label, {
      fontFamily: FONT,
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 12 },
    })
    .setOrigin(0.5, 0.5);

  const container = scene.add.container(x, y, [bg, text]);
  let enabled = true;

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => {
    if (enabled) bg.setFillStyle(palette.brand, 0.82);
  });
  bg.on('pointerout', () => {
    if (enabled) bg.setFillStyle(palette.brand, 1);
  });
  bg.on('pointerdown', () => {
    if (enabled) onClick();
  });

  return {
    container,
    setEnabled(value: boolean) {
      enabled = value;
      bg.setFillStyle(value ? palette.brand : palette.surface, 1);
      bg.setStrokeStyle(1, value ? palette.brand : palette.textSoft, value ? 1 : 0.4);
      text.setColor(value ? '#ffffff' : palette.css.textSoft);
      if (value) bg.setInteractive({ useHandCursor: true });
      else bg.disableInteractive();
    },
    setLabel(value: string) {
      text.setText(value);
    },
  };
}

export interface Bar {
  setProgress(ratio: number): void;
  setColor(color: number): void;
}

/** Barra di progressione (0..1) con riempimento animato. */
export function makeBar(
  scene: Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: DemoPalette,
  color = palette.brand
): Bar {
  scene.add.rectangle(x, y, width, height, palette.surface, 1).setOrigin(0, 0).setStrokeStyle(1, palette.textSoft, 0.35);
  const fill = scene.add.rectangle(x, y, 0, height, color, 1).setOrigin(0, 0);

  let fillColor = color;
  return {
    setProgress(ratio: number) {
      const r = Math.max(0, Math.min(1, ratio));
      scene.tweens.add({
        targets: fill,
        width: width * r,
        duration: 220,
        ease: 'Cubic.out',
      });
    },
    setColor(c: number) {
      fillColor = c;
      fill.setFillStyle(fillColor, 1);
    },
  };
}

/** Pannello di sfondo arrotondato. */
export function makePanel(
  scene: Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: DemoPalette
): void {
  const g = scene.add.graphics();
  g.fillStyle(palette.surface, 1);
  g.fillRoundedRect(x, y, width, height, 8);
  g.lineStyle(1, palette.textSoft, 0.2);
  g.strokeRoundedRect(x, y, width, height, 8);
}

/** Etichetta di testo. */
export function makeText(
  scene: Scene,
  x: number,
  y: number,
  value: string,
  palette: DemoPalette,
  opts: { size?: number; bold?: boolean; soft?: boolean; origin?: [number, number] } = {}
): PhaserNamespace.GameObjects.Text {
  const t = scene.add.text(x, y, value, {
    fontFamily: FONT,
    fontSize: `${opts.size ?? 14}px`,
    fontStyle: opts.bold ? 'bold' : 'normal',
    color: opts.soft ? palette.css.textSoft : palette.css.text,
  });
  const [ox, oy] = opts.origin ?? [0, 0];
  t.setOrigin(ox, oy);
  return t;
}
