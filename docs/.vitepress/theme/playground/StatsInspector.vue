<script setup lang="ts">
import type { Playground } from './usePlayground';
import { computed, ref } from 'vue';

const props = defineProps<{ pg: Playground }>();
const view = computed(() => props.pg.view.value);

const stats = computed(() => view.value.stats ?? []);

// ---- Add modifier form ----
let modCounter = 0;
const formStatId = ref('');
const formType = ref<'FLAT' | 'PERCENT'>('FLAT');
const formValue = ref(5);
const formSource = ref('buff');

const currentStatId = computed(() =>
  formStatId.value || (stats.value.length ? stats.value[0].id : ''),
);

function addModifier() {
  const statId = currentStatId.value;
  const source = formSource.value.trim();
  if (!statId || !source) return;
  props.pg.dispatch({
    t: 'addModifier',
    statId,
    mod: {
      id: `mod_${modCounter++}`,
      source,
      type: formType.value,
      value: Number(formValue.value),
    },
  });
}

// ---- Remove by source ----
const sources = computed(() => {
  const set = new Set<string>();
  for (const s of stats.value) {
    for (const m of s.modifiers ?? []) set.add(m.source);
  }
  return Array.from(set);
});

const removeSource = ref('');
const currentRemoveSource = computed(() =>
  removeSource.value || (sources.value.length ? sources.value[0] : ''),
);

function doRemoveSource() {
  const source = currentRemoveSource.value;
  if (!source) return;
  props.pg.dispatch({ t: 'removeSource', source });
}

function pct(v: number) {
  return `${v * 100}%`;
}
</script>

<template>
  <section class="pg-panel">
    <h3 class="pg-panel__title">Stats inspector</h3>

    <table class="pg-table">
      <thead>
        <tr>
          <th>Stat</th>
          <th>Base</th>
          <th>Σ FLAT</th>
          <th>Σ %</th>
          <th>Final</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="s in stats" :key="s.id">
          <tr>
            <td class="pg-mono">{{ s.id }}</td>
            <td class="pg-mono">{{ s.base }}</td>
            <td class="pg-mono">{{ s.flatSum }}</td>
            <td class="pg-mono">{{ pct(s.pctSum) }}</td>
            <td class="pg-mono"><strong>{{ s.value }}</strong></td>
          </tr>
          <tr v-if="s.modifiers && s.modifiers.length" class="si-detail">
            <td colspan="5">
              <ul class="si-mods">
                <li v-for="m in s.modifiers" :key="m.id" class="pg-row si-mod">
                  <span class="pg-mono">{{ m.id }}</span>
                  <span class="pg-muted">{{ m.source }}</span>
                  <span
                    class="pg-tag"
                    :class="m.type === 'FLAT' ? 'pg-tag--flat' : 'pg-tag--percent'"
                    >{{ m.type }}</span
                  >
                  <span class="pg-mono">{{ m.value }}</span>
                </li>
              </ul>
              <div class="pg-mono pg-muted si-breakdown">
                ({{ s.base }} + {{ s.flatSum }}) × (1 + {{ s.pctSum }}) = {{ s.value }}
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="!stats.length">
          <td colspan="5" class="pg-muted">No stats. Build the engine first.</td>
        </tr>
      </tbody>
    </table>

    <!-- Add modifier -->
    <div class="pg-row si-form">
      <select class="pg-input" v-model="formStatId">
        <option v-for="s in stats" :key="s.id" :value="s.id">{{ s.id }}</option>
      </select>
      <select class="pg-input" v-model="formType">
        <option value="FLAT">FLAT</option>
        <option value="PERCENT">PERCENT</option>
      </select>
      <input class="pg-input" type="number" step="0.05" v-model="formValue" />
      <input class="pg-input" type="text" placeholder="source" v-model="formSource" />
      <button class="pg-btn pg-btn--primary" :disabled="!stats.length" @click="addModifier">
        Add
      </button>
    </div>

    <!-- Remove by source -->
    <div class="pg-row si-form">
      <select class="pg-input" v-model="removeSource" :disabled="!sources.length">
        <option v-for="src in sources" :key="src" :value="src">{{ src }}</option>
      </select>
      <button class="pg-btn" :disabled="!sources.length" @click="doRemoveSource">
        Remove source
      </button>
    </div>
  </section>
</template>

<style scoped>
.si-detail td {
  padding-top: 0;
}
.si-mods {
  list-style: none;
  margin: 0 0 4px;
  padding: 0;
}
.si-mod {
  gap: 8px;
  font-size: 0.78rem;
  padding: 2px 0;
}
.si-breakdown {
  font-size: 0.74rem;
}
.si-form {
  margin-top: 10px;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
