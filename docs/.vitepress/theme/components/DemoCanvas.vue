<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue';
import { demoRegistry } from '../demos';
import { readPalette } from '../demos/theme';
import type PhaserNamespace from 'phaser';

const props = withDefaults(
  defineProps<{
    name: string;
    title?: string;
    height?: number;
  }>(),
  { height: 320 }
);

const container = ref<HTMLDivElement | null>(null);
const game = shallowRef<PhaserNamespace.Game | null>(null);
const state = ref<'idle' | 'loading' | 'running' | 'error'>('idle');
const error = ref('');

async function start() {
  if (state.value === 'loading' || state.value === 'running') return;
  const loader = demoRegistry[props.name];
  if (!loader) {
    state.value = 'error';
    error.value = `Unknown demo: "${props.name}"`;
    return;
  }

  state.value = 'loading';
  try {
    // Dynamic import: Phaser (which uses window/document) is loaded only
    // here, client-side, never during SSR render.
    const [{ default: Phaser }, mod] = await Promise.all([
      import('phaser'),
      loader(),
    ]);

    const palette = readPalette();
    const width = mod.width ?? 640;
    const height = mod.height ?? props.height;
    const scene = mod.create({ Phaser, palette });

    game.value = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container.value!,
      width,
      height,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
      scene,
      banner: false,
      audio: { noAudio: true },
    });

    state.value = 'running';
  } catch (e) {
    state.value = 'error';
    error.value = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error('[demo]', props.name, e);
  }
}

function destroy() {
  if (game.value) {
    game.value.destroy(true);
    game.value = null;
  }
}

function restart() {
  destroy();
  state.value = 'idle';
  start();
}

// Mandatory cleanup: VitePress is a SPA; without destroy the canvas and the
// game-loop would stay active when navigating to other pages.
onBeforeUnmount(destroy);
</script>

<template>
  <figure class="demo">
    <figcaption v-if="title" class="demo__title">{{ title }}</figcaption>

    <div class="demo__frame" :style="{ minHeight: height + 'px' }">
      <div ref="container" class="demo__canvas" />

      <button
        v-if="state === 'idle'"
        class="demo__start"
        type="button"
        @click="start"
      >
        ▶ Start the demo
      </button>

      <div v-else-if="state === 'loading'" class="demo__overlay">Loading…</div>

      <div v-else-if="state === 'error'" class="demo__overlay demo__overlay--error">
        Could not start the demo.<br />
        <small>{{ error }}</small>
      </div>
    </div>

    <div v-if="state === 'running'" class="demo__bar">
      <button class="demo__restart" type="button" @click="restart">↻ Restart</button>
      <span class="demo__hint">Interactive demo — use the buttons in the canvas.</span>
    </div>
  </figure>
</template>

<style scoped>
.demo {
  margin: 1.5rem 0;
}
.demo__title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-2);
}
.demo__frame {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.demo__canvas {
  width: 100%;
  display: flex;
  justify-content: center;
}
.demo__canvas :deep(canvas) {
  max-width: 100%;
  height: auto !important;
  display: block;
}
.demo__start {
  position: absolute;
  inset: 0;
  margin: auto;
  width: max-content;
  height: max-content;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.demo__start:hover {
  background: var(--vp-c-brand-2);
}
.demo__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
.demo__overlay--error {
  color: var(--vp-c-danger-1, #b8272c);
}
.demo__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.demo__restart {
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
}
.demo__restart:hover {
  border-color: var(--vp-c-brand-1);
}
.demo__hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}
</style>
