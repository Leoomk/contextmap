import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';
import isBinaryPath from 'is-binary-path';

/**
 * Fase 1 & Etapa 1: O Rastreador e Medidor de Arquivos (Ingestão & Metadados)
 * Varre o projeto alvo, respeita exclusões e coleta metadados vitais de cada arquivo
 * (tamanho em KB, linhas de código, data de modificação e tipo).
 */

/**
 * Extrai os metadados essenciais de um arquivo no disco.
 * @param {string} caminhoAbsoluto - Caminho absoluto do arquivo.
 * @param {string} diretorioRaiz - Raiz do projeto.
 * @returns {Object} Ficha com tamanho, linhas e classificação.
 */
import crypto from 'crypto';

/**
 * Calcula a impressão digital rápida (hash) do conteúdo de um arquivo.
 * @param {string} conteudo - Texto do arquivo.
 * @returns {string} Hash curto de 16 caracteres.
 */
export function calcularHashConteudo(conteudo) {
  return crypto.createHash('sha256').update(conteudo).digest('hex').slice(0, 16);
}

export function obterMetadadosArquivo(caminhoAbsoluto, diretorioRaiz) {
  try {
    const stats = fs.statSync(caminhoAbsoluto);
    const caminhoRelativo = path.relative(diretorioRaiz, caminhoAbsoluto).replace(/\\/g, '/');
    const nomeArquivo = path.basename(caminhoAbsoluto);
    const extensao = path.extname(caminhoAbsoluto).toLowerCase();
    
    // Contagem rápida de linhas e cálculo de hash para arquivos de texto
    let totalLinhas = 0;
    let hash = '';
    try {
      const conteudo = fs.readFileSync(caminhoAbsoluto, 'utf8');
      totalLinhas = conteudo.split(/\r\n|\r|\n/).length;
      hash = calcularHashConteudo(conteudo);
    } catch (e) {
      totalLinhas = 0;
    }

    const isCodigo = ['.js', '.ts', '.jsx', '.tsx'].includes(extensao);
    const isConfigGlobal = [
      'index.html', 'manifest.json', 'package.json', 'tsconfig.json',
      'vite.config.js', 'vite.config.ts', 'next.config.js', 'next.config.mjs',
      'version.json', 'sw.js', 'service-worker.js'
    ].includes(nomeArquivo) || extensao === '.env' || nomeArquivo.startsWith('.env');

    return {
      caminhoAbsoluto,
      caminhoRelativo,
      nomeArquivo,
      pasta: path.dirname(caminhoRelativo).replace(/\\/g, '/'),
      extensao,
      tamanhoBytes: stats.size,
      tamanhoKB: Number((stats.size / 1024).toFixed(1)),
      totalLinhas,
      mtimeMs: stats.mtimeMs,
      mtimeISO: stats.mtime.toISOString(),
      hash,
      isCodigo,
      isConfigGlobal
    };
  } catch (erro) {
    return null;
  }
}

/**
 * Varre um diretório desconhecido e retorna apenas os caminhos absolutos válidos.
 * (Mantido para 100% de retrocompatibilidade com as ferramentas existentes).
 * 
 * @param {string} diretorioRaiz - Caminho absoluto da pasta do projeto alvo.
 * @returns {Promise<string[]>} Lista de caminhos absolutos dos arquivos válidos.
 */
export async function rastrearArquivos(diretorioRaiz) {
  const motorIgnorar = ignore();

  // Pastas universais que nunca queremos ler (economiza memória e tempo)
  motorIgnorar.add([
    'node_modules/**', 
    '.git/**', 
    'dist/**', 
    'build/**',
    'coverage/**',
    '*.min.js',
    '.next/**',
    '.cache/**'
  ]);

  const caminhoGitignore = path.join(diretorioRaiz, '.gitignore');
  if (fs.existsSync(caminhoGitignore)) {
    const regrasDoProjeto = fs.readFileSync(caminhoGitignore, 'utf8');
    motorIgnorar.add(regrasDoProjeto);
  }

  const diretorioFormatado = diretorioRaiz.split(path.sep).join(path.posix.sep);
  
  const arquivosBrutos = await fg(['**/*'], {
    cwd: diretorioFormatado,
    onlyFiles: true,
    dot: true,
    absolute: true,
  });

  const arquivosValidos = arquivosBrutos.filter((caminhoAbsoluto) => {
    const caminhoRelativo = path.relative(diretorioRaiz, caminhoAbsoluto);

    if (motorIgnorar.ignores(caminhoRelativo)) {
      return false;
    }

    if (isBinaryPath(caminhoAbsoluto)) {
      return false;
    }

    return true;
  });

  return arquivosValidos;
}

/**
 * Varredura aprimorada da Etapa 1: retorna tanto os caminhos quanto a ficha
 * detalhada de cada arquivo do projeto (peso, linhas, datas).
 * 
 * @param {string} diretorioRaiz - Caminho absoluto do projeto.
 * @returns {Promise<Object[]>} Lista de metadados detalhados de cada arquivo válido.
 */
export async function rastrearArquivosDetalhados(diretorioRaiz) {
  const caminhosValidos = await rastrearArquivos(diretorioRaiz);
  const arquivosDetalhados = [];

  for (const caminho of caminhosValidos) {
    const meta = obterMetadadosArquivo(caminho, diretorioRaiz);
    if (meta) {
      arquivosDetalhados.push(meta);
    }
  }

  return arquivosDetalhados;
}
