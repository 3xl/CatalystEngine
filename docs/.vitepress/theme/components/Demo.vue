<script setup lang="ts">
// Facciata pubblica usata nel markdown: <Demo name="..." />.
// ClientOnly garantisce che nulla del canvas venga renderizzato in SSR.
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
