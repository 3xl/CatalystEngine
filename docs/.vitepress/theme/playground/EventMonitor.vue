<script setup lang="ts">
import type { Playground } from './usePlayground';
import { computed, reactive } from 'vue';

const props = defineProps<{ pg: Playground }>();
const view = computed(() => props.pg.view.value);

type EventType = 'STAT_CHANGED' | 'LEVEL_UP' | 'XP_GAINED';

const TYPES: EventType[] = ['STAT_CHANGED', 'LEVEL_UP', 'XP_GAINED'];

const TYPE_COLORS: Record<EventType, string> = {
  STAT_CHANGED: '#3b82f6',
  LEVEL_UP: '#22c55e',
  XP_GAINED: '#f59e0b',
};

const filters = reactive<Record<EventType, boolean>>({
  STAT_CHANGED: true,
  LEVEL_UP: true,
  XP_GAINED: true,
});

const events = computed(() => view.value.events ?? []);

const counts = computed(() => {
  const c: Record<EventType, number> = {
    STAT_CHANGED: 0,
    LEVEL_UP: 0,
    XP_GAINED: 0,
  };
  for (const ev of events.value) c[ev.type as EventType]++;
  return c;
});

const filtered = computed(() =>
  events.value.filter((ev) => filters[ev.type as EventType]),
);

function toggle(type: EventType) {
  filters[type] = !filters[type];
}

function payloadJson(payload: object) {
  return JSON.stringify(payload);
}
</script>

<template>
  <section class="pg-panel">
    <h3 class="pg-panel__title">Event monitor</h3>
    <p class="pg-panel__sub">Events emitted up to the current timeline step.</p>

    <div class="pg-row em-filters">
      <button
        v-for="type in TYPES"
        :key="type"
        type="button"
        class="pg-tag em-chip"
        :class="{ 'em-chip--off': !filters[type] }"
        :style="{ '--em-color': TYPE_COLORS[type] }"
        @click="toggle(type)"
      >
        {{ type }}
        <span class="pg-mono em-count">{{ counts[type] }}</span>
      </button>
    </div>

    <div class="em-list">
      <div
        v-for="ev in filtered"
        :key="ev.seq"
        class="pg-row em-event"
      >
        <span class="pg-muted pg-mono em-seq">#{{ ev.seq }}</span>
        <span
          class="pg-tag em-type"
          :style="{ '--em-color': TYPE_COLORS[ev.type] }"
          >{{ ev.type }}</span
        >
        <span class="pg-mono em-payload">{{ payloadJson(ev.payload) }}</span>
      </div>
      <div v-if="!filtered.length" class="pg-muted em-empty">
        No events yet — drive the engine to see them here.
      </div>
    </div>
  </section>
</template>

<style scoped>
.em-filters {
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.em-chip {
  cursor: pointer;
  border: 1px solid var(--em-color);
  color: var(--em-color);
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.em-chip--off {
  opacity: 0.4;
  filter: grayscale(1);
}
.em-count {
  font-size: 0.72rem;
}
.em-list {
  max-height: 260px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.em-event {
  gap: 8px;
  align-items: baseline;
  font-size: 0.78rem;
  padding: 2px 0;
}
.em-seq {
  flex: 0 0 auto;
}
.em-type {
  flex: 0 0 auto;
  color: var(--em-color);
  border: 1px solid var(--em-color);
  background: transparent;
}
.em-payload {
  flex: 1 1 auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.74rem;
}
.em-empty {
  padding: 6px 0;
}
</style>
