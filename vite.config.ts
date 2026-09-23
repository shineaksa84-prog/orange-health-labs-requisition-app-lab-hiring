import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function saveEnvPlugin(): Plugin {
  return {
    name: 'save-env-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-firebase-env', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const envContent = [
                `VITE_FIREBASE_API_KEY=${data.apiKey || ''}`,
                `VITE_FIREBASE_AUTH_DOMAIN=${data.authDomain || ''}`,
                `VITE_FIREBASE_PROJECT_ID=${data.projectId || ''}`,
                `VITE_FIREBASE_STORAGE_BUCKET=${data.storageBucket || ''}`,
                `VITE_FIREBASE_MESSAGING_SENDER_ID=${data.messagingSenderId || ''}`,
                `VITE_FIREBASE_APP_ID=${data.appId || ''}`,
              ].join('\n') + '\n';

              fs.writeFileSync(path.resolve(__dirname, '.env'), envContent, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.writeHead(405);
          res.end();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), saveEnvPlugin()],
  server: {
    port: 3000,
    open: false
  }
});
