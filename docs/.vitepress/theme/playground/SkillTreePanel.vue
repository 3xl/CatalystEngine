<script setup lang="ts">
import type { Playground } from './usePlayground';
import { computed } from 'vue';

const props = defineProps<{ pg: Playground }>();
const view = computed(() => props.pg.view.value);

const skills = computed(() => view.value.skills ?? []);
const dag = computed(() => view.value.dag ?? []);

// Node geometry — rectangles sized to contain the skill name.
const NODE_H = 34;
const GAP_X = 18;
const ROW_HEIGHT = 94;
const PAD_TOP = 26;
const SIDE_PAD = 18;

type State = 'maxed' | 'available' | 'locked';
interface LayoutNode {
  id: string;
  name: string;
  currentLevel: number;
  maxLevel: number;
  requiredPlayerLevel: number;
  cost: number;
  prerequisiteSkillIds: string[];
  state: State;
  reason: string | null;
  x: number;
  y: number;
  w: number;
}

function widthOf(name: string): number {
  // Estimate text width at ~10px font, clamp to a readable range.
  return Math.min(180, Math.max(74, Math.round(name.length * 6.6 + 22)));
}

const layout = computed(() => {
  const list = skills.value;
  if (!list.length) {
    return { nodes: [] as LayoutNode[], edges: [] as { x1: number; y1: number; x2: number; y2: number }[], width: 340, height: ROW_HEIGHT };
  }

  // Group by depth (layer).
  const byDepth = new Map<number, typeof list>();
  let maxDepth = 0;
  for (const s of list) {
    const d = s.depth ?? 0;
    maxDepth = Math.max(maxDepth, d);
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(s);
  }

  // First pass: per-row total width → overall SVG width.
  const rows = [...byDepth.entries()].sort((a, b) => a[0] - b[0]);
  let maxRow = 0;
  const rowWidths = new Map<number, number[]>();
  for (const [depth, arr] of rows) {
    const ws = arr.map((s) => widthOf(s.name));
    rowWidths.set(depth, ws);
    const total = ws.reduce((a, w) => a + w, 0) + GAP_X * (arr.length - 1);
    maxRow = Math.max(maxRow, total);
  }
  const WIDTH = Math.max(340, Math.round(maxRow + SIDE_PAD * 2));

  // Second pass: position each row, centered.
  const nodes: LayoutNode[] = [];
  const pos = new Map<string, { x: number; y: number }>();
  for (const [depth, arr] of rows) {
    const ws = rowWidths.get(depth)!;
    const total = ws.reduce((a, w) => a + w, 0) + GAP_X * (arr.length - 1);
    let cursor = (WIDTH - total) / 2;
    arr.forEach((s, i) => {
      const w = ws[i];
      const cx = cursor + w / 2;
      const cy = depth * ROW_HEIGHT + PAD_TOP + NODE_H / 2;
      cursor += w + GAP_X;
      pos.set(s.id, { x: cx, y: cy });
      nodes.push({
        id: s.id,
        name: s.name,
        currentLevel: s.currentLevel,
        maxLevel: s.maxLevel,
        requiredPlayerLevel: s.requiredPlayerLevel,
        cost: s.cost,
        prerequisiteSkillIds: s.prerequisiteSkillIds ?? [],
        state: s.state,
        reason: s.reason,
        x: cx,
        y: cy,
        w,
      });
    });
  }

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const node of nodes) {
    for (const pid of node.prerequisiteSkillIds) {
      const from = pos.get(pid);
      if (!from) continue;
      edges.push({ x1: from.x, y1: from.y + NODE_H / 2, x2: node.x, y2: node.y - NODE_H / 2 });
    }
  }

  const height = (maxDepth + 1) * ROW_HEIGHT + 6;
  return { nodes, edges, width: WIDTH, height };
});

function nodeFill(state: State) {
  if (state === 'maxed') return 'var(--vp-c-green-1)';
  if (state === 'available') return 'var(--vp-c-brand-1)';
  return 'var(--vp-c-bg-soft)';
}
function nodeStroke(state: State) {
  if (state === 'maxed') return 'var(--vp-c-green-2, var(--vp-c-green-1))';
  if (state === 'available') return 'var(--vp-c-brand-2, var(--vp-c-brand-1))';
  return 'var(--vp-c-text-3)';
}
// Contrast: light text on the dark/colored fills, dark text on the light "locked" fill.
function textFill(state: State) {
  return state === 'locked' ? 'var(--vp-c-text-1)' : '#ffffff';
}
function subFill(state: State) {
  return state === 'locked' ? 'var(--vp-c-text-2)' : 'rgba(255,255,255,0.82)';
}

function upgrade(id: string) {
  props.pg.dispatch({ t: 'upgradeSkill', skillId: id });
}
function addPoints() {
  props.pg.dispatch({ t: 'addSkillPoints', n: 2 });
}
</script>

<template>
  <section class="pg-panel">
    <h3 class="pg-panel__title">Skill tree (DAG)</h3>

    <div class="pg-row st-header">
      <span class="pg-mono">Skill points: {{ view.skillPoints ?? 0 }}</span>
      <span class="pg-mono">Player level: {{ view.playerLevel ?? 0 }}</span>
      <button class="pg-btn pg-btn--primary" @click="addPoints">+2 points</button>
    </div>

    <div v-if="!layout.nodes.length" class="pg-muted st-empty">No skills. Build the engine first.</div>

    <svg
      v-else
      class="st-svg"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      role="img"
      aria-label="Skill tree graph"
    >
      <!-- Edges first -->
      <line
        v-for="(e, i) in layout.edges"
        :key="`e${i}`"
        :x1="e.x1"
        :y1="e.y1"
        :x2="e.x2"
        :y2="e.y2"
        stroke="var(--vp-c-divider)"
        stroke-width="1.5"
      />

      <!-- Nodes (rectangles sized to the name) -->
      <g v-for="node in layout.nodes" :key="node.id" class="st-node" @click="upgrade(node.id)">
        <title v-if="node.state === 'locked' && node.reason">{{ node.reason }}</title>
        <rect
          :x="node.x - node.w / 2"
          :y="node.y - NODE_H / 2"
          :width="node.w"
          :height="NODE_H"
          rx="6"
          ry="6"
          :fill="nodeFill(node.state)"
          :stroke="nodeStroke(node.state)"
          stroke-width="1.5"
        />
        <text
          :x="node.x"
          :y="node.y - 2"
          class="st-name"
          text-anchor="middle"
          :fill="textFill(node.state)"
        >{{ node.name }}</text>
        <text
          :x="node.x"
          :y="node.y + 11"
          class="st-lvl"
          text-anchor="middle"
          :fill="subFill(node.state)"
        >{{ node.currentLevel }}/{{ node.maxLevel }}</text>
        <text
          :x="node.x"
          :y="node.y + NODE_H / 2 + 12"
          class="st-meta"
          text-anchor="middle"
        >lvl {{ node.requiredPlayerLevel }}+ · {{ node.cost }}p</text>
      </g>
    </svg>

    <!-- Legend -->
    <div class="pg-row st-legend">
      <span class="st-legend__item"><span class="st-swatch" style="background: var(--vp-c-green-1)"></span> maxed</span>
      <span class="st-legend__item"><span class="st-swatch" style="background: var(--vp-c-brand-1)"></span> available</span>
      <span class="st-legend__item"
        ><span class="st-swatch" style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-text-3)"></span> locked</span
      >
    </div>

    <!-- DAG validator -->
    <div class="st-dag">
      <div v-if="!dag.length" class="pg-muted">No issues ✓</div>
      <div v-for="(issue, i) in dag" :key="`d${i}`" class="pg-row st-issue">
        <span class="pg-tag" :class="issue.severity === 'error' ? 'pg-tag--error' : 'pg-tag--warn'">{{
          issue.severity
        }}</span>
        <span>{{ issue.msg }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.st-header {
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.st-empty {
  padding: 12px 0;
}
.st-svg {
  width: 100%;
  height: auto;
  display: block;
}
.st-node {
  cursor: pointer;
}
.st-node:hover rect {
  filter: brightness(1.08);
}
.st-name {
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}
.st-lvl {
  font-size: 9px;
  pointer-events: none;
}
.st-meta {
  font-size: 8.5px;
  fill: var(--vp-c-text-2);
  pointer-events: none;
}
.st-legend {
  gap: 14px;
  flex-wrap: wrap;
  margin: 8px 0;
  font-size: 0.78rem;
}
.st-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.st-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.st-dag {
  margin-top: 6px;
}
.st-issue {
  gap: 8px;
  align-items: center;
  font-size: 0.82rem;
  padding: 2px 0;
}
</style>
