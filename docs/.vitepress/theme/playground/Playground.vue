<script setup lang="ts">
import { usePlayground } from './usePlayground';
import { commandLabel } from './usePlayground';
import ConfigPanel from './ConfigPanel.vue';
import StatsInspector from './StatsInspector.vue';
import XpPanel from './XpPanel.vue';
import SkillTreePanel from './SkillTreePanel.vue';
import EventMonitor from './EventMonitor.vue';
import SnapshotPanel from './SnapshotPanel.vue';

const pg = usePlayground();

function onScrub(e: Event) {
  pg.gotoCursor(Number((e.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="pg">
    <header class="pg-topbar">
      <h2 class="pg-title">⚙️ CatalystEngine Playground</h2>

      <span v-if="pg.buildError.value" class="pg-error">build error: {{ pg.buildError.value }}</span>

      <span class="pg-spacer" />

      <!-- Time-travel: state = config + replay(commands[0..cursor]) -->
      <div class="pg-timeline">
        <span class="pg-muted">Timeline</span>
        <button
          class="pg-btn"
          :disabled="pg.cursor.value <= 0"
          title="Step back"
          @click="pg.gotoCursor(pg.cursor.value - 1)"
        >
          ◀
        </button>
        <input
          type="range"
          min="0"
          :max="pg.commands.value.length"
          :value="pg.cursor.value"
          :disabled="pg.commands.value.length === 0"
          @input="onScrub"
        />
        <button
          class="pg-btn"
          :disabled="pg.cursor.value >= pg.commands.value.length"
          title="Step forward"
          @click="pg.gotoCursor(pg.cursor.value + 1)"
        >
          ▶
        </button>
        <span class="pg-mono">{{ pg.cursor.value }}/{{ pg.commands.value.length }}</span>
        <span v-if="pg.isLive.value" class="pg-badge">LIVE</span>
        <button
          v-else
          class="pg-badge pg-badge--past"
          title="Jump to latest"
          @click="pg.gotoCursor(pg.commands.value.length)"
        >
          PAST · go live
        </button>
        <button class="pg-btn" title="Clear action log" @click="pg.reset()">Reset run</button>
      </div>
    </header>

    <!-- Current step label -->
    <div
      v-if="pg.commands.value.length"
      class="pg-row"
      style="font-size: 0.75rem; padding: 0 4px"
    >
      <span class="pg-muted">last action:</span>
      <span class="pg-mono">{{
        pg.cursor.value > 0 ? commandLabel(pg.commands.value[pg.cursor.value - 1]) : '(initial state)'
      }}</span>
    </div>

    <div class="pg-layout">
      <div class="pg-col-config">
        <ConfigPanel :pg="pg" />
      </div>
      <div class="pg-col-main">
        <StatsInspector :pg="pg" />
        <XpPanel :pg="pg" />
        <SkillTreePanel :pg="pg" />
        <EventMonitor :pg="pg" />
        <SnapshotPanel :pg="pg" />
      </div>
    </div>
  </div>
</template>
