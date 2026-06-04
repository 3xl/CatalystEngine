<script setup lang="ts">
import type { Playground } from './usePlayground';
import { computed, ref } from 'vue';

const props = defineProps<{ pg: Playground }>();
const view = computed(() => props.pg.view.value);

const snapshotJson = computed(() =>
  view.value.saveState === null
    ? null
    : JSON.stringify(view.value.saveState, null, 2),
);

const importText = ref('');
const importError = ref<string | null>(null);
const testCode = ref<string | null>(null);

function copy(text: string) {
  navigator.clipboard.writeText(text);
}

function download(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadSnapshot() {
  importError.value = null;
  try {
    const snapshot = JSON.parse(importText.value);
    props.pg.dispatch({ t: 'load', snapshot });
  } catch (e) {
    importError.value = e instanceof Error ? e.message : String(e);
  }
}

function generateTest() {
  testCode.value = props.pg.exportVitest();
}
</script>

<template>
  <section class="pg-panel">
    <h3 class="pg-panel__title">Snapshot &amp; test</h3>

    <p class="pg-muted" style="font-size: 0.74rem; margin: 0 0 6px">Current save state</p>
    <pre class="pg-mono snap-pre">{{ snapshotJson ?? '—' }}</pre>
    <div class="pg-row" style="margin-top: 8px">
      <button
        class="pg-btn"
        :disabled="snapshotJson === null"
        @click="snapshotJson && copy(snapshotJson)"
      >
        Copy
      </button>
      <button
        class="pg-btn"
        :disabled="snapshotJson === null"
        @click="snapshotJson && download(snapshotJson, 'catalyst-save.json', 'application/json')"
      >
        Download
      </button>
    </div>

    <p class="pg-muted" style="font-size: 0.74rem; margin: 16px 0 6px">Import a snapshot</p>
    <textarea
      class="pg-textarea"
      v-model="importText"
      rows="4"
      placeholder='{ "stats": ..., "exp": ... }'
    />
    <div class="pg-row" style="margin-top: 8px">
      <button class="pg-btn pg-btn--primary" @click="loadSnapshot">Load snapshot</button>
    </div>
    <p
      v-if="importError"
      class="pg-mono"
      style="color: var(--vp-c-danger-1); font-size: 0.74rem; margin: 6px 0 0"
    >
      {{ importError }}
    </p>

    <p class="pg-muted" style="font-size: 0.74rem; margin: 16px 0 6px">Characterization test</p>
    <div class="pg-row">
      <button class="pg-btn pg-btn--primary" @click="generateTest">Generate Vitest test</button>
    </div>

    <template v-if="testCode !== null">
      <pre class="pg-mono test-pre" style="margin-top: 8px">{{ testCode }}</pre>
      <div class="pg-row" style="margin-top: 8px">
        <button class="pg-btn" @click="copy(testCode)">Copy</button>
        <button class="pg-btn" @click="download(testCode, 'scenario.test.ts', 'text/typescript')">
          Download
        </button>
      </div>
      <p class="pg-muted" style="font-size: 0.74rem; margin: 8px 0 0">
        A characterization test pinning the current behavior — paste into test/.
      </p>
    </template>
  </section>
</template>

<style scoped>
.snap-pre {
  max-height: 200px;
  overflow: auto;
  margin: 0;
}
.test-pre {
  max-height: 240px;
  overflow: auto;
  margin: 0;
}
</style>
