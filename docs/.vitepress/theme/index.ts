import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import Demo from './components/Demo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Registra <Demo /> globalmente, utilizzabile in qualsiasi pagina markdown.
    app.component('Demo', Demo);
  },
} satisfies Theme;
