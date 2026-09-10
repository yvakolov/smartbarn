import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Smart Barn Docs',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Русский',
          lang: 'ru',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      sidebar: [
        {
          label: 'Руководство пользователя',
          items: [
            { label: 'Начало работы', slug: 'user-guide/getting-started' },
            { label: 'Редактор перекрытия', slug: 'user-guide/floor-field-editor' },
          ],
        },
        {
          label: 'Архитектура',
          items: [
            { label: 'Принципы', slug: 'architecture/index' },
            { label: 'ADR', slug: 'architecture/adr' },
          ],
        },
      ],
    }),
  ],
});
