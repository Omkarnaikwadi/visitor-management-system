import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function injectEnvIntoServiceWorker(env) {
  return {
    name: 'inject-env-sw',
    buildStart() {
      const swPath = path.resolve('public/firebase-messaging-sw.js');
      let content = fs.readFileSync(swPath, 'utf-8');
      content = content.replace(/%VITE_([^%]+)%/g, (_, key) => env[`VITE_${key}`] || '');
      fs.writeFileSync(swPath, content);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), injectEnvIntoServiceWorker(env)],
    server: {
      port: 3000,
      proxy: {
        '/api': 'http://localhost:5000'
      }
    }
  };
});
