import fs from 'fs';
import path from 'path';

/**
 * Cache das configurações de apelidos (tsconfig/jsconfig) por diretório raiz.
 */
const cacheAliases = new Map();

/**
 * Lê dinamicamente tsconfig.json ou jsconfig.json para descobrir Path Aliases do projeto.
 * Inspirado nas arquiteturas do Greptile e Bito AI.
 */
function carregarAliasesDoProjeto(diretorioRaiz) {
  if (cacheAliases.has(diretorioRaiz)) {
    return cacheAliases.get(diretorioRaiz);
  }

  const aliases = [];
  const possiveisConfigs = [
    path.join(diretorioRaiz, 'tsconfig.json'),
    path.join(diretorioRaiz, 'jsconfig.json'),
    path.join(diretorioRaiz, 'tsconfig.app.json')
  ];

  for (const configPath of possiveisConfigs) {
    if (fs.existsSync(configPath)) {
      try {
        // Remove comentários JSON simples (// e /* */) antes de fazer parse
        const raw = fs.readFileSync(configPath, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        
        const config = JSON.parse(raw);
        const compilerOptions = config.compilerOptions || {};
        const baseUrl = compilerOptions.baseUrl ? path.resolve(diretorioRaiz, compilerOptions.baseUrl) : diretorioRaiz;
        const paths = compilerOptions.paths || {};

        for (const [prefixo, destinos] of Object.entries(paths)) {
          const prefixoLimpo = prefixo.replace(/\*$/, '');
          const destinosLimpos = (Array.isArray(destinos) ? destinos : [destinos]).map(d => 
            path.resolve(baseUrl, d.replace(/\*$/, ''))
          );
          aliases.push({ prefixo: prefixoLimpo, destinos: destinosLimpos });
        }

        if (aliases.length > 0) break;
      } catch (e) {
        // Continua para o próximo arquivo se falhar o parse
      }
    }
  }

  cacheAliases.set(diretorioRaiz, aliases);
  return aliases;
}

/**
 * Converte caminhos relativos ou aliases em absolutos e checa se pertencem ao nosso código real.
 */
function resolverCaminhoDependencia(origemAbsoluta, importPath, arquivosValidosAbsolutos, diretorioRaiz) {
  let caminhosCandidatos = [];

  // 1. Caminho Relativo tradicional (./ ou ../)
  if (importPath.startsWith('.')) {
    caminhosCandidatos.push(path.resolve(path.dirname(origemAbsoluta), importPath));
  } else {
    // 2. Apelidos Dinâmicos do tsconfig.json
    const aliases = carregarAliasesDoProjeto(diretorioRaiz);
    let resolvidoPorTsconfig = false;

    for (const alias of aliases) {
      if (importPath.startsWith(alias.prefixo)) {
        const subPath = importPath.slice(alias.prefixo.length);
        for (const dest of alias.destinos) {
          caminhosCandidatos.push(path.resolve(dest, subPath));
        }
        resolvidoPorTsconfig = true;
        break;
      }
    }

    // 3. Padrões convencionais de mercado (@/ ou ~/) caso tsconfig não defina explicitamente
    if (!resolvidoPorTsconfig) {
      if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
        const cleanPath = importPath.replace(/^[@~]\//, '');
        caminhosCandidatos.push(path.resolve(diretorioRaiz, 'src', cleanPath));
        caminhosCandidatos.push(path.resolve(diretorioRaiz, cleanPath));
      } else {
        caminhosCandidatos.push(path.resolve(diretorioRaiz, 'src', importPath));
        caminhosCandidatos.push(path.resolve(diretorioRaiz, importPath));
      }
    }
  }

  // Gera todas as variações de extensões (.ts, .tsx, .js, index, etc.)
  const possiveisCaminhos = [];
  caminhosCandidatos.forEach(cand => {
    possiveisCaminhos.push(
      cand,
      cand + '.js',
      cand + '.ts',
      cand + '.jsx',
      cand + '.tsx',
      cand + '/index.js',
      cand + '/index.ts',
      cand + '/index.tsx'
    );
  });

  const formatadosValidos = arquivosValidosAbsolutos.map(arq => path.normalize(arq));

  for (const possivel of possiveisCaminhos) {
    if (formatadosValidos.includes(path.normalize(possivel))) {
      return possivel;
    }
  }

  return null;
}

/**
 * Varre a AST em busca de dependências e constrói a Tabela de Relacionamentos (Edges)
 * com Graus de Confiança quantificados.
 */
export function construirArestas(ast, origemAbsoluta, diretorioRaiz, arquivosValidosAbsolutos) {
  const arestas = [];
  const caminhoRelativoOrigem = path.relative(diretorioRaiz, origemAbsoluta).replace(/\\/g, '/');

  // Variáveis para Heurísticas de Wi-Fi
  let usaEstadoGlobal = false;
  let chamadasApiInvisiveis = [];

  function varrerNo(no) {
    let importPath = null;
    let tipoRelacao = null;

    // 1. Físico: "import { X } from 'Y'" ou "export { X } from 'Y'"
    if (no.type === 'import_statement' || no.type === 'export_statement') {
      const nodeString = no.children.find(c => c.type === 'string');
      if (nodeString) {
        importPath = nodeString.text.replace(/['"`]/g, '');
        tipoRelacao = no.type === 'export_statement' ? 'export' : 'import';
      }
    } 
    // 2. Físico: "require('Y')" ou "import('Y')" (Dinâmico)
    else if (no.type === 'call_expression') {
      const chamador = no.childForFieldName('function');
      if (chamador && ((chamador.type === 'identifier' && chamador.text === 'require') || chamador.type === 'import')) {
        const argumentos = no.childForFieldName('arguments');
        if (argumentos) {
          const nodeString = argumentos.children.find(c => c.type === 'string');
          if (nodeString) {
            importPath = nodeString.text.replace(/['"`]/g, '');
            tipoRelacao = chamador.type === 'import' ? 'dynamic_import' : 'require';
          }
        }
      }
      
      // WI-FI: Detectando chamadas API internas (fetch/axios)
      if (chamador && chamador.type === 'identifier' && (chamador.text === 'fetch' || chamador.text === 'axios' || chamador.text === 'api')) {
         const argumentos = no.childForFieldName('arguments');
         if (argumentos) {
           const nodeString = argumentos.children.find(c => c.type === 'string' || c.type === 'template_string');
           if (nodeString) {
              const url = nodeString.text.replace(/['"`]/g, '');
              if (url.startsWith('/api/') || url.includes('api/')) {
                 chamadasApiInvisiveis.push(url);
              }
           }
         }
      }

      // WI-FI: Detectando Gerenciamento de Estado (Pub/Sub, Redux, Zustand)
      if (chamador && chamador.type === 'identifier' && (chamador.text === 'useDispatch' || chamador.text === 'useStore' || chamador.text.includes('dispatch'))) {
         usaEstadoGlobal = true;
      }
    }

    if (importPath && tipoRelacao) {
       const caminhoDestinoAbsoluto = resolverCaminhoDependencia(origemAbsoluta, importPath, arquivosValidosAbsolutos, diretorioRaiz);
       if (caminhoDestinoAbsoluto) {
         const caminhoRelativoDestino = path.relative(diretorioRaiz, caminhoDestinoAbsoluto).replace(/\\/g, '/');
         const jaExiste = arestas.find(a => a.destino === caminhoRelativoDestino && a.tipo_relacao === tipoRelacao);
         if (!jaExiste) {
           arestas.push({ 
             origem: caminhoRelativoOrigem, 
             destino: caminhoRelativoDestino, 
             tipo_relacao: tipoRelacao,
             confianca: '100% (Cabo Direto)'
           });
         }
       }
    }

    for (let i = 0; i < no.childCount; i++) {
      varrerNo(no.child(i));
    }
  }

  varrerNo(ast.rootNode);

  // FASE 4.5: INJETANDO CONEXÕES WI-FI COM GRAU DE CONFIANÇA
  const normValidos = arquivosValidosAbsolutos.map(a => path.relative(diretorioRaiz, a).replace(/\\/g, '/'));

  // A) Roteamento Baseado em Pastas (Ex: page.tsx -> layout.tsx)
  const nomeArquivo = path.basename(caminhoRelativoOrigem);
  const pastaOrigem = path.dirname(caminhoRelativoOrigem);
  if (nomeArquivo.match(/^(page|route|index)\.(tsx|ts|jsx|js)$/)) {
     const layouts = normValidos.filter(a => a.startsWith(pastaOrigem) && a.match(/layout\.(tsx|ts|jsx|js)$/));
     layouts.forEach(layout => {
        arestas.push({ 
          origem: caminhoRelativoOrigem, 
          destino: layout, 
          tipo_relacao: 'implicit_route',
          confianca: '85% (Wi-Fi Rota)'
        });
     });
  }

  // B) Comunicação Cliente-Servidor (Fetch para Rota)
  chamadasApiInvisiveis.forEach(url => {
     const partesDaUrl = url.split('?')[0].replace(/^\/|\/$/g, '');
     const rotaBackend = normValidos.find(a => a.includes(partesDaUrl) && (a.endsWith('route.ts') || a.includes('pages/api')));
     if (rotaBackend) {
        arestas.push({ 
          origem: caminhoRelativoOrigem, 
          destino: rotaBackend, 
          tipo_relacao: 'implicit_fetch',
          confianca: '85% (Wi-Fi API)'
        });
     }
  });

  // C) Gerenciamento de Estado Global
  if (usaEstadoGlobal) {
     const storesGlobais = normValidos.filter(a => a.includes('store') || a.includes('state') || a.includes('context'));
     if (storesGlobais.length > 0) {
        arestas.push({ 
          origem: caminhoRelativoOrigem, 
          destino: storesGlobais[0], 
          tipo_relacao: 'implicit_state',
          confianca: '65% (Wi-Fi Estado)'
        });
     }
  }

  return arestas;
}
