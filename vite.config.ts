import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      {
        name: 'sync-self-dir',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const distIndex = path.join(distDir, 'index.html');
          const selfDir = path.resolve(__dirname, 'SELF');
          const selfDataDir = path.join(selfDir, 'data');
          if (!fs.existsSync(distIndex)) {
            return;
          }
          fs.mkdirSync(selfDir, {recursive: true});
          if (fs.existsSync(selfDataDir)) {
            fs.rmSync(selfDataDir, {recursive: true, force: true});
          }

          const readJsonIfExists = (filePath: string) => {
            if (!fs.existsSync(filePath)) return undefined;
            try {
              return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch {
              return undefined;
            }
          };

          const dataDir = path.resolve(__dirname, 'public/data');
          const embeddedPayload = {
            weather: readJsonIfExists(path.join(dataDir, 'weather.json')),
            stocks: readJsonIfExists(path.join(dataDir, 'stocks.json')),
            stockHistory: readJsonIfExists(path.join(dataDir, 'stock-history.json')),
          };
          const safeJson = JSON.stringify(embeddedPayload).replace(/</g, '\\u003c');
          const injection = `<head>\n    <!--AETHER_EMBEDDED_START--><script>window.__AETHER_EMBEDDED_DATA__=${safeJson};</script><!--AETHER_EMBEDDED_END-->`;
          const html = fs.readFileSync(distIndex, 'utf8').replace('<head>', () => injection);
          fs.writeFileSync(path.join(selfDir, 'index.html'), html, 'utf8');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
