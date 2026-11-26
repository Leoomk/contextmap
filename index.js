import { iniciarServidor } from './src/server.js';

iniciarServidor().catch(erro => {
  console.error("❌ Falha crítica ao iniciar o servidor MCP:", erro);
});
