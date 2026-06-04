import type { DemoModule } from './types';

// Demo registry: name → dynamic import of the scene module.
// The dynamic import ensures each demo (and Phaser) is loaded only
// when the user starts that specific demo.
export const demoRegistry: Record<string, () => Promise<DemoModule>> = {
  'stats-playground': () => import('./StatsPlayground'),
  'xp-levelup': () => import('./XpLevelUp'),
  'skill-tree': () => import('./SkillTree'),
  'event-bus': () => import('./EventBus'),
  'save-load': () => import('./SaveLoad'),
  'mini-rpg': () => import('./MiniRpg'),
};

export type DemoName = keyof typeof demoRegistry;
