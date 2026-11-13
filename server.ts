import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import courtlistenerSearchHandler from './api/courtlistener/search.ts';
import generateQueryHandler from './api/gemini/generate-query.ts';
import summariseCasesHandler from './api/gemini/summarise-cases.ts';
import writeBriefHandler from './api/gemini/write-brief.ts';
import healthHandler from './api/health.ts';
import mattersHandler from './api/matters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', healthHandler);
  app.get('/api/courtlistener/search', courtlistenerSearchHandler);
  app.post('/api/gemini/generate-query', generateQueryHandler);
  app.post('/api/gemini/summarise-cases', summariseCasesHandler);
  app.post('/api/gemini/write-brief', writeBriefHandler);
  app.get('/api/matters', mattersHandler);
  app.post('/api/matters', mattersHandler);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Case Finder server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
