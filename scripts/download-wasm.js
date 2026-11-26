import fs from 'fs';
import path from 'path';
import https from 'https';

// Usamos a CDN do unpkg e pegamos de um pacote que distribui as WASMs compiladas 
// (tree-sitter-wasms), para evitar falhas ou dores de cabeça no Windows.
const URL_WASM = 'https://unpkg.com/tree-sitter-wasms@0.1.13/out/tree-sitter-javascript.wasm';
const DESTINO_DIR = path.join(process.cwd(), 'wasm');
const DESTINO_ARQUIVO = path.join(DESTINO_DIR, 'tree-sitter-javascript.wasm');

async function downloadWasm() {
  if (!fs.existsSync(DESTINO_DIR)) {
    fs.mkdirSync(DESTINO_DIR, { recursive: true });
  }

  console.log(`Baixando WASM de: ${URL_WASM}...`);
  
  return new Promise((resolve, reject) => {
    https.get(URL_WASM, (resposta) => {
      if (resposta.statusCode === 302 && resposta.headers.location) {
        https.get(resposta.headers.location, handleResponse).on('error', reject);
      } else {
        handleResponse(resposta);
      }
    }).on('error', reject);

    function handleResponse(res) {
      if (res.statusCode !== 200) {
        reject(new Error(`Falha ao baixar. Status: ${res.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(DESTINO_ARQUIVO);
      res.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ WASM salvo com sucesso em: ${DESTINO_ARQUIVO}`);
        resolve();
      });
    }
  });
}

downloadWasm().catch(console.error);
