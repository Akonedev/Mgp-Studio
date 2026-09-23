import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        port: 58105,
        proxy: {
            '/api': {
                target: 'http://localhost:58101',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
