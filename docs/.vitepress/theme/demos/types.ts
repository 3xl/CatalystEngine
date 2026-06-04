import type PhaserNamespace from 'phaser';
import type { DemoPalette } from './theme';

export type PhaserModule = typeof PhaserNamespace;

export interface DemoContext {
  Phaser: PhaserModule;
  palette: DemoPalette;
}

/** Each demo exports a `create` that returns a ready Phaser scene. */
export type DemoFactory = (ctx: DemoContext) => PhaserNamespace.Scene;

export interface DemoModule {
  create: DemoFactory;
  /** Logical scene dimensions (the canvas scales in width). */
  width?: number;
  height?: number;
}
