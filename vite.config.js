import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/Sarasa-catering/',
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/test/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
  },
});
