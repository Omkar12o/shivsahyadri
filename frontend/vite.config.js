import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            includeAssets: ['robots.txt', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
            manifest: {
                id: '/',
                name: 'Shivsaydri Ganesh Mandal',
                short_name: 'Shivsaydri Ganesh',
                description: 'Shivsaydri Ganesh Mandal, Umarkhanchan - Ganeshotsav programs, Aarti, Gallery, Announcements, Community Chat and Member Management.',
                theme_color: '#FF6B00',
                background_color: '#FFF8F0',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
                categories: ['lifestyle', 'education', 'social'],
                lang: 'mr-IN',
                dir: 'ltr',
            },
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}', 'logo.jpeg'],
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
            },
            devOptions: {
                enabled: false,
                type: 'module',
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true,
    },
});
