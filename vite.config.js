import { defineConfig } from 'vite';

export default defineConfig({
  base: '/estudio-itz/',
  build: {
    rolldownOptions: {
      input: ['index.html', 'arquitectura/index.html'],
    },
  },
});
