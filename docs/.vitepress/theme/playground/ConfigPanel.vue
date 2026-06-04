<script setup lang="ts">
import { ref } from 'vue';
import type { Playground } from './usePlayground';
import { DEFAULT_STATS, DEFAULT_XP, DEFAULT_TREE } from './validate';
import ConfigForm from './ConfigForm.vue';

const props = defineProps<{ pg: Playground }>();

const mode = ref<'form' | 'json'>('form');
const formKey = ref(0);
const formRef = ref<{ syncToText: () => void; loadFromText: () => void } | null>(null);

function setMode(m: 'form' | 'json') {
  if (m === mode.value) return;
  // Leaving the guided builder → push its model into the JSON so the expert view is current.
  if (mode.value === 'form') formRef.value?.syncToText();
  mode.value = m;
}

function build() {
  if (mode.value === 'form') formRef.value?.syncToText();
  props.pg.applyConfig();
}

function resetDefaults() {
  props.pg.statsText.value = DEFAULT_STATS;
  props.pg.xpText.value = DEFAULT_XP;
  props.pg.treeText.value = DEFAULT_TREE;
  props.pg.applyConfig();
  if (mode.value === 'form') formKey.value++; // remount the builder so it reloads the defaults
}
</script>

<template>
  <section class="pg-panel">
    <div class="cfg-top">
      <h3 class="pg-panel__title" style="margin: 0">Config — data-driven</h3>
      <div class="cfg-modes" role="tablist">
        <button :class="{ on: mode === 'form' }" @click="setMode('form')">Guided</button>
        <button :class="{ on: mode === 'json' }" @click="setMode('json')">JSON</button>
      </div>
    </div>
    <p class="pg-panel__sub">
      {{
        mode === 'form'
          ? 'Build your config with guided controls.'
          : 'Edit the raw JSON directly.'
      }}
    </p>

    <!-- Guided builder -->
    <ConfigForm v-if="mode === 'form'" :key="formKey" ref="formRef" :pg="pg" />

    <!-- Expert JSON editors -->
    <template v-else>
      <label class="pg-muted cfg-lbl">Stats (id → base value)</label>
      <textarea class="pg-textarea" rows="5" v-model="pg.statsText.value" spellcheck="false" />
      <label class="pg-muted cfg-lbl">XP curve (IExperienceConfig)</label>
      <textarea class="pg-textarea" rows="6" v-model="pg.xpText.value" spellcheck="false" />
      <label class="pg-muted cfg-lbl">Skill tree (ISkillNode[])</label>
      <textarea class="pg-textarea" rows="14" v-model="pg.treeText.value" spellcheck="false" />
    </template>

    <div class="pg-row" style="margin-top: 12px">
      <button class="pg-btn pg-btn--primary" @click="build">Build engine</button>
      <button class="pg-btn" @click="resetDefaults">Reset to default</button>
    </div>

    <p v-if="pg.buildError.value" class="pg-error" style="margin-top: 8px">{{ pg.buildError.value }}</p>
    <p v-else class="pg-muted cfg-note">Building re-instantiates the engine and clears the action log.</p>
  </section>
</template>

<style scoped>
.cfg-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.cfg-modes {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  overflow: hidden;
}
.cfg-modes button {
  font: inherit;
  font-size: 0.74rem;
  padding: 3px 10px;
  border: none;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cfg-modes button.on {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.cfg-lbl {
  font-size: 0.74rem;
  display: block;
  margin-top: 8px;
}
.cfg-note {
  font-size: 0.74rem;
  margin-top: 8px;
}
</style>
