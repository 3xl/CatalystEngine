<script setup lang="ts">
import type { Playground } from './usePlayground';
import { computed, ref } from 'vue';

const props = defineProps<{ pg: Playground }>();
const view = computed(() => props.pg.view.value);

const custom = ref(100);

function gain(amount: number) {
  props.pg.dispatch({ t: 'gainXP', amount });
}

// Chart geometry
const VB_W = 320;
const VB_H = 150;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 18;
const plotW = VB_W - PAD_L - PAD_R;
const plotH = VB_H - PAD_T - PAD_B;

const curve = computed(() => view.value.exp.curve);
const maxReq = computed(() => Math.max(1, ...curve.value.map((c) => c.req)));

const bars = computed(() => {
  const pts = curve.value;
  const n = pts.length;
  if (n === 0) return [];
  const slot = plotW / n;
  const bw = Math.max(1, slot * 0.7);
  return pts.map((p, i) => {
    const h = (p.req / maxReq.value) * plotH;
    const x = PAD_L + slot * i + (slot - bw) / 2;
    const y = PAD_T + (plotH - h);
    return {
      level: p.level,
      req: p.req,
      x,
      y,
      w: bw,
      h,
      cx: x + bw / 2,
      current: p.level === view.value.exp.level,
    };
  });
});

// A handful of evenly-spaced x tick labels
const xTicks = computed(() => {
  const b = bars.value;
  if (b.length === 0) return [];
  const step = Math.max(1, Math.ceil(b.length / 6));
  return b.filter((_, i) => i % step === 0 || i === b.length - 1);
});
</script>

<template>
  <section class="pg-panel">
    <h3 class="pg-panel__title">Experience &amp; curve</h3>

    <div class="pg-row" style="justify-content: space-between; align-items: baseline">
      <span class="pg-tag">Level {{ view.exp.level }}</span>
      <span class="pg-mono pg-muted">{{ view.exp.xp }} / {{ view.exp.nextReq }} XP</span>
    </div>

    <div class="xp-track" :title="Math.round(view.exp.percentage * 100) + '%'">
      <div class="xp-fill" :style="{ width: view.exp.percentage * 100 + '%' }" />
    </div>

    <div class="pg-row" style="margin-top: 10px">
      <button class="pg-btn pg-btn--primary" @click="gain(50)">+50 XP</button>
      <button class="pg-btn" @click="gain(250)">+250 XP</button>
      <button class="pg-btn" @click="gain(1000)">+1000 XP</button>
    </div>

    <div class="pg-row" style="margin-top: 8px">
      <input class="pg-input" type="number" v-model="custom" style="max-width: 120px" />
      <button class="pg-btn" @click="gain(Number(custom))">Gain</button>
    </div>

    <p class="pg-muted" style="font-size: 0.74rem; margin: 12px 0 4px">
      XP required per level (current level highlighted)
    </p>

    <svg
      class="xp-chart"
      :viewBox="`0 0 ${VB_W} ${VB_H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Experience curve"
    >
      <!-- axes -->
      <line
        :x1="PAD_L"
        :y1="PAD_T"
        :x2="PAD_L"
        :y2="PAD_T + plotH"
        stroke="var(--vp-c-divider)"
        stroke-width="1"
      />
      <line
        :x1="PAD_L"
        :y1="PAD_T + plotH"
        :x2="VB_W - PAD_R"
        :y2="PAD_T + plotH"
        stroke="var(--vp-c-divider)"
        stroke-width="1"
      />

      <!-- y max label -->
      <text :x="PAD_L - 3" :y="PAD_T + 4" text-anchor="end" font-size="8" fill="var(--vp-c-text-3)">
        {{ maxReq }}
      </text>
      <text
        :x="PAD_L - 3"
        :y="PAD_T + plotH"
        text-anchor="end"
        font-size="8"
        fill="var(--vp-c-text-3)"
      >
        0
      </text>

      <!-- bars -->
      <rect
        v-for="b in bars"
        :key="b.level"
        :x="b.x"
        :y="b.y"
        :width="b.w"
        :height="b.h"
        rx="1"
        :fill="b.current ? 'var(--vp-c-brand-1)' : 'var(--vp-c-text-3)'"
        :opacity="b.current ? 1 : 0.55"
      >
        <title>Level {{ b.level }}: {{ b.req }} XP</title>
      </rect>

      <!-- x tick labels -->
      <text
        v-for="t in xTicks"
        :key="'t' + t.level"
        :x="t.cx"
        :y="PAD_T + plotH + 10"
        text-anchor="middle"
        font-size="8"
        :fill="t.current ? 'var(--vp-c-brand-1)' : 'var(--vp-c-text-3)'"
      >
        {{ t.level }}
      </text>

      <text
        :x="PAD_L + plotW / 2"
        :y="VB_H - 2"
        text-anchor="middle"
        font-size="8"
        fill="var(--vp-c-text-3)"
      >
        level
      </text>
    </svg>
  </section>
</template>

<style scoped>
.xp-track {
  margin-top: 8px;
  width: 100%;
  height: 14px;
  border-radius: 7px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  border-radius: 7px;
  background: var(--vp-c-brand-1);
  transition: width 0.2s ease;
}
.xp-chart {
  display: block;
  width: 100%;
  height: auto;
}
</style>
