<script setup lang="ts">
// Public facade used in markdown: <Demo name="..." />.
// ClientOnly ensures nothing of the canvas is rendered during SSR.
import DemoCanvas from './DemoCanvas.vue';

defineProps<{
  name: string;
  title?: string;
  height?: number;
}>();
</script>

<template>
  <ClientOnly>
    <DemoCanvas :name="name" :title="title" :height="height" />
  </ClientOnly>
</template>
