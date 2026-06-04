import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import Demo from './components/Demo.vue';
import Playground from './playground/Playground.vue';
import './playground/playground.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register <Demo /> and <Playground /> globally, usable in any markdown page.
    app.component('Demo', Demo);
    app.component('Playground', Playground);
  },
} satisfies Theme;
