import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Project page su GitHub Pages → servito sotto /CatalystEngine/.
  // La CI imposta DOCS_BASE; in locale resta '/' per comodità.
  base: process.env.DOCS_BASE || '/',
  lang: 'it-IT',
  title: 'CatalystEngine',
  description:
    'Motore di progressione data-driven, polimorfo e plug-and-play per TypeScript e PhaserJS',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guida', link: '/guide/introduzione' },
      { text: 'API', link: '/api/catalyst-engine' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/3xl/CatalystEngine/releases' },
          { text: 'Repository', link: 'https://github.com/3xl/CatalystEngine' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Per iniziare',
          items: [
            { text: 'Introduzione', link: '/guide/introduzione' },
            { text: 'Installazione', link: '/guide/installazione' },
            { text: 'Quick start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Concetti',
          items: [
            { text: 'Architettura', link: '/guide/architettura' },
            { text: 'Statistiche e modificatori', link: '/guide/statistiche' },
            { text: 'Esperienza e livelli', link: '/guide/esperienza' },
            { text: 'Albero delle skill', link: '/guide/skill' },
            { text: 'Event Bus', link: '/guide/eventi' },
            { text: 'Persistenza', link: '/guide/persistenza' },
          ],
        },
        {
          text: 'Esempi',
          items: [
            { text: 'Mini RPG (demo completa)', link: '/guide/esempio-completo' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Riferimento API',
          items: [
            { text: 'CatalystEngine', link: '/api/catalyst-engine' },
            { text: 'StatManager', link: '/api/stat-manager' },
            { text: 'ExperienceManager', link: '/api/experience-manager' },
            { text: 'SkillManager', link: '/api/skill-manager' },
            { text: 'EngineEventBus', link: '/api/event-bus' },
            { text: 'Interfacce e tipi', link: '/api/interfacce' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/3xl/CatalystEngine' },
    ],

    search: { provider: 'local' },

    footer: {
      message: 'Rilasciato con licenza MIT.',
      copyright: 'CatalystEngine',
    },

    docFooter: {
      prev: 'Pagina precedente',
      next: 'Pagina successiva',
    },

    outline: { label: 'In questa pagina' },
  },

  vite: {
    resolve: {
      alias: {
        // Le demo importano da 'catalyst-engine' come un utente reale.
        // Poiché il pacchetto È questo progetto, lo risolviamo al dist locale
        // (rigenerato dagli hook predocs:* prima di dev/build).
        'catalyst-engine': fileURLToPath(
          new URL('../../dist/index.mjs', import.meta.url)
        ),
      },
    },
    // Phaser non va pre-bundlato a build-time: viene importato dinamicamente
    // solo lato client dentro DemoCanvas.vue.
    ssr: { noExternal: ['phaser'] },
  },
});
