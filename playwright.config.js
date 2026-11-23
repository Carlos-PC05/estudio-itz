import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173/estudio-itz/', trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173/estudio-itz/', reuseExistingServer: !process.env.CI },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
      env: { OPENROUTER_API_KEY: 'clave-de-prueba' },
      url: 'http://127.0.0.1:4174/estudio-itz/',
    },
  ],
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});
