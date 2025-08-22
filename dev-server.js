// Development server for API endpoints
// Run with: node dev-server.js

import { createServer } from './server/index.ts';

const PORT = process.env.API_PORT || 3000;

const app = createServer();

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /api/ping`);
  console.log(`   GET  /api/demo`);
  console.log(`   POST /api/sentiment/analyze`);
  console.log(`   POST /api/sentiment/batch`);
  console.log(`   POST /api/sentiment/translate`);
  console.log(`   POST /api/sentiment/file`);
  console.log(`   POST /api/sentiment/url`);
  console.log(`   POST /api/sentiment/multi`);
  console.log(`   GET  /api/test/gemini`);
  console.log(`\n🌐 Frontend should be running on http://localhost:5173`);
  console.log(`🔌 API requests will be proxied from Vite to this server`);
});
