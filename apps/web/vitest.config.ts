import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    // No web-specific tests yet — the business-logic tests moved to
    // @llb/core alongside the code they cover. Don't fail CI on an
    // empty suite; remove once apps/web grows its own tests.
    passWithNoTests: true,
  },
});
