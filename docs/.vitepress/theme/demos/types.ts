import type PhaserNamespace from 'phaser';
import type { DemoPalette } from './theme';

export type PhaserModule = typeof PhaserNamespace;

export interface DemoContext {
  Phaser: PhaserModule;
  palette: DemoPalette;
}

/** Ogni demo esporta una `create` che restituisce una scena Phaser pronta. */
export type DemoFactory = (ctx: DemoContext) => PhaserNamespace.Scene;

export interface DemoModule {
  create: DemoFactory;
  /** Dimensioni logiche della scena (il canvas scala in larghezza). */
  width?: number;
  height?: number;
}
