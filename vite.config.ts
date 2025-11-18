import devtools from 'solid-devtools/vite';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        display: 'standalone',
        icons: [{
          src: "assets/icon-black.svg",
          sizes: "all"
        }]
      },
      devOptions: {
        enabled: true
      },
    }) as unknown as Plugin, devtools(), solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
