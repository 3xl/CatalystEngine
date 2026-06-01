import type { DemoModule } from './types';

// Registry delle demo: nome → import dinamico del modulo scena.
// L'import dinamico fa sì che ogni demo (e Phaser) venga caricata solo
// quando l'utente avvia quella specifica demo.
export const demoRegistry: Record<string, () => Promise<DemoModule>> = {
  'stats-playground': () => import('./StatsPlayground'),
  'xp-levelup': () => import('./XpLevelUp'),
  'skill-tree': () => import('./SkillTree'),
  'event-bus': () => import('./EventBus'),
  'save-load': () => import('./SaveLoad'),
  'mini-rpg': () => import('./MiniRpg'),
};

export type DemoName = keyof typeof demoRegistry;
