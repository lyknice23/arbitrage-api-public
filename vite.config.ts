import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT || 5173),
    allowedHosts: ["5173-ibt2go4235yqy2b3c0wl2.e2b.app"]
  },
  preview: {
    port: Number(process.env.PORT || 4173),
    host: true
  }
});
