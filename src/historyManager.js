import fs from 'fs';
import path from 'path';

/**
 * Fase 7 & Etapa 3: O Guardião do Histórico e Cofre de Projetos
 * Salva as "radiografias leves" de cada projeto analisado em uma pasta interna do Mapa Contexto,
 * permitindo alternar entre projetos e comparar o "Antes x Depois" das alterações da IA.
 */

const DIRETORIO_HISTORICO = path.join(process.cwd(), 'data', 'history');
const ARQUIVO_INDICE = path.join(DIRETORIO_HISTORICO, 'projects_index.json');

/**
 * Garante que as pastas de armazenamento existam.
 */
function garantirEstruturaCofre() {
  if (!fs.existsSync(DIRETORIO_HISTORICO)) {
    fs.mkdirSync(DIRETORIO_HISTORICO, { recursive: true });
  }
  if (!fs.existsSync(ARQUIVO_INDICE)) {
    fs.writeFileSync(ARQUIVO_INDICE, JSON.stringify({ projetos: [] }, null, 2), 'utf8');
  }
}

/**
 * Gera um identificador limpo e único para a pasta do projeto (normalizando caminhos para evitar duplicações).
 */
export function gerarIdProjeto(diretorioRaiz) {
  const norm = path.normalize(path.resolve(diretorioRaiz)).toLowerCase();
  const nomePasta = path.basename(norm).replace(/[^a-z0-9_-]/g, '_');
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = ((hash << 5) - hash) + norm.charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(16).slice(0, 6);
  return `${nomePasta}_${hashStr}`;
}

/**
 * Salva a fotografia resumida de uma análise no cofre.
 * @param {string} diretorioRaiz - Caminho do projeto analisado.
 * @param {Object} dadosMemoria - globalMemory contendo nodes, edges, files.
 * @param {Object} relatorioSaude - Relatório consolidado gerado pelo intelligenceAnalyzer.
 * @returns {Object} Informações da fotografia salva.
 */
export function salvarFotografiaProjeto(diretorioRaiz, dadosMemoria, relatorioSaude = null) {
  garantirEstruturaCofre();

  const idProjeto = gerarIdProjeto(diretorioRaiz);
  const pastaProjeto = path.join(DIRETORIO_HISTORICO, idProjeto);
  
  if (!fs.existsSync(pastaProjeto)) {
    fs.mkdirSync(pastaProjeto, { recursive: true });
  }

  const timestamp = Date.now();
  const nomeArquivoVersao = `${timestamp}.json`;
  const caminhoVersao = path.join(pastaProjeto, nomeArquivoVersao);

  // Ficha leve da versão (salvamos dados essenciais para ocupar menos de 200 KB)
  const fotografia = {
    idProjeto,
    nomeProjeto: path.basename(diretorioRaiz),
    diretorioRaiz,
    timestamp,
    dataISO: new Date(timestamp).toISOString(),
    totalArquivos: dadosMemoria.files?.length || 0,
    totalNos: dadosMemoria.nodes?.length || 0,
    totalArestas: dadosMemoria.edges?.length || 0,
    kpis: relatorioSaude?.kpisResumo || null,
    // Resumo dos arquivos com hash de linhas/tamanho para comparador rápido
    arquivos: (dadosMemoria.files || []).map(f => ({
      arquivo: f.arquivo,
      linhas: f.totalLinhas,
      tamanhoKB: f.tamanhoKB,
      mtimeMs: f.mtimeMs,
      tags: f.tags,
      travasSeguranca: f.diagnostico?.seguranca?.travas || [],
      alertasCusto: f.diagnostico?.banco ? {
        buscaEmLoop: f.diagnostico.banco.buscaEmLoop,
        selectAllSemFiltro: f.diagnostico.banco.selectAllSemFiltro
      } : null
    }))
  };

  fs.writeFileSync(caminhoVersao, JSON.stringify(fotografia, null, 2), 'utf8');

  // Limpa versões antigas mantendo no máximo as últimas 15 versões
  try {
    const versoes = fs.readdirSync(pastaProjeto)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => parseInt(b) - parseInt(a));

    if (versoes.length > 15) {
      for (let i = 15; i < versoes.length; i++) {
        fs.unlinkSync(path.join(pastaProjeto, versoes[i]));
      }
    }
  } catch (e) {}

  // Atualiza o índice geral de projetos
  atualizarIndiceProjetos(idProjeto, diretorioRaiz, fotografia);

  return {
    idProjeto,
    versaoId: timestamp,
    dataISO: fotografia.dataISO
  };
}

/**
 * Atualiza o arquivo de índice com o último status do projeto.
 */
function atualizarIndiceProjetos(idProjeto, diretorioRaiz, ultimaFoto) {
  try {
    const raw = fs.readFileSync(ARQUIVO_INDICE, 'utf8');
    const indice = JSON.parse(raw);

    const indexExistente = indice.projetos.findIndex(p => p.id === idProjeto);
    const dadosProjeto = {
      id: idProjeto,
      nome: path.basename(diretorioRaiz),
      caminho: diretorioRaiz,
      ultimaAnalise: ultimaFoto.dataISO,
      totalArquivos: ultimaFoto.totalArquivos,
      totalNos: ultimaFoto.totalNos,
      totalAlertasCusto: ultimaFoto.kpis?.totalAlertasCustoBanco || 0,
      totalFormulariosSemCache: ultimaFoto.kpis?.totalFormulariosSemCache || 0
    };

    if (indexExistente >= 0) {
      indice.projetos[indexExistente] = dadosProjeto;
    } else {
      indice.projetos.push(dadosProjeto);
    }

    fs.writeFileSync(ARQUIVO_INDICE, JSON.stringify(indice, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Retorna o histórico de todas as versões salvas de um projeto específico.
 */
export function obterVersoesProjeto(idProjeto) {
  garantirEstruturaCofre();
  const pastaProjeto = path.join(DIRETORIO_HISTORICO, idProjeto);
  if (!fs.existsSync(pastaProjeto)) {
    // Procura pastas legadas com o mesmo prefixo de nome do projeto
    const prefixo = idProjeto.replace(/_[a-f0-9]+$/, '');
    try {
      const pastasExistentes = fs.readdirSync(DIRETORIO_HISTORICO, { withFileTypes: true })
        .filter(d => d.isDirectory() && (d.name === prefixo || d.name.startsWith(prefixo + '_')));

      if (pastasExistentes.length > 0) {
        fs.mkdirSync(pastaProjeto, { recursive: true });
        for (const pastaLegada of pastasExistentes) {
          const caminhoLegado = path.join(DIRETORIO_HISTORICO, pastaLegada.name);
          if (caminhoLegado !== pastaProjeto) {
            const arquivosLegados = fs.readdirSync(caminhoLegado);
            for (const arq of arquivosLegados) {
              fs.copyFileSync(path.join(caminhoLegado, arq), path.join(pastaProjeto, arq));
            }
            try { fs.rmSync(caminhoLegado, { recursive: true, force: true }); } catch (e) {}
          }
        }
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  const arquivos = fs.readdirSync(pastaProjeto)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => parseInt(b) - parseInt(a));

  const versoes = [];
  arquivos.forEach((arq, index) => {
    try {
      const conteudo = JSON.parse(fs.readFileSync(path.join(pastaProjeto, arq), 'utf8'));
      versoes.push({
        arquivoVersao: arq,
        versaoNumero: arquivos.length - index,
        timestamp: conteudo.timestamp,
        dataISO: conteudo.dataISO,
        totalArquivos: conteudo.totalArquivos,
        totalNos: conteudo.totalNos,
        totalArestas: conteudo.totalArestas,
        totalAlertasCusto: conteudo.kpis?.totalAlertasCustoBanco || 0,
        totalFormulariosSemCache: conteudo.kpis?.totalFormulariosSemCache || 0,
        totalArquivosDeus: conteudo.kpis?.totalArquivosDeus || 0,
        kpis: conteudo.kpis
      });
    } catch (e) {}
  });

  return versoes;
}

/**
 * Retorna os dados completos gravados em uma versão histórica específica.
 */
export function obterDetalheVersao(idProjeto, arquivoVersao) {
  garantirEstruturaCofre();
  const caminho = path.join(DIRETORIO_HISTORICO, idProjeto, arquivoVersao);
  if (!fs.existsSync(caminho)) return null;
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (e) {
    return null;
  }
}


/**
 * Retorna a lista de todos os projetos arquivados no cofre, organizados em caixinhas únicas com suas versões.
 */
export function listarProjetosSalvos() {
  garantirEstruturaCofre();
  try {
    const raw = fs.readFileSync(ARQUIVO_INDICE, 'utf8');
    const indice = JSON.parse(raw);
    const lista = indice.projetos || [];

    // Deduplica e unifica por caminho normalizado
    const mapa = new Map();
    lista.forEach(p => {
      const normCaminho = path.normalize(path.resolve(p.caminho)).toLowerCase();
      const id = gerarIdProjeto(p.caminho);
      const versoes = obterVersoesProjeto(id);

      if (!mapa.has(normCaminho) || versoes.length >= (mapa.get(normCaminho).totalVersoes || 0)) {
        mapa.set(normCaminho, {
          id,
          nome: p.nome,
          caminho: path.normalize(path.resolve(p.caminho)),
          ultimaAnalise: versoes[0]?.dataISO || p.ultimaAnalise,
          totalArquivos: versoes[0]?.totalArquivos || p.totalArquivos,
          totalNos: versoes[0]?.totalNos || p.totalNos,
          totalAlertasCusto: versoes[0]?.totalAlertasCusto ?? p.totalAlertasCusto ?? 0,
          totalFormulariosSemCache: versoes[0]?.totalFormulariosSemCache ?? p.totalFormulariosSemCache ?? 0,
          totalVersoes: versoes.length,
          versoes
        });
      }
    });

    const projetosUnificados = Array.from(mapa.values());
    fs.writeFileSync(ARQUIVO_INDICE, JSON.stringify({ projetos: projetosUnificados }, null, 2), 'utf8');
    return projetosUnificados;
  } catch (e) {
    return [];
  }
}

/**
 * Compara as duas últimas fotografias salvas de um projeto para descobrir o que mudou.
 * @param {string} diretorioRaiz - Caminho do projeto.
 * @returns {Object} Relatório "Antes x Depois" das alterações da IA.
 */
export function compararUltimasModificacoes(diretorioOuId) {
  garantirEstruturaCofre();
  let pastaProjeto = path.join(DIRETORIO_HISTORICO, diretorioOuId);
  if (!fs.existsSync(pastaProjeto)) {
    const idProjeto = gerarIdProjeto(diretorioOuId);
    pastaProjeto = path.join(DIRETORIO_HISTORICO, idProjeto);
  }

  if (!fs.existsSync(pastaProjeto)) {
    return { temHistorico: false, mensagem: "Primeira leitura deste projeto. Histórico iniciado agora!" };
  }

  const versoesArquivos = fs.readdirSync(pastaProjeto)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => parseInt(b) - parseInt(a)); // mais recentes primeiro

  if (versoesArquivos.length < 2) {
    return { temHistorico: false, mensagem: "Apenas uma versão registrada até agora. Faça alterações no código e reanalise para ver as diferenças!" };
  }

  try {
    const atual = JSON.parse(fs.readFileSync(path.join(pastaProjeto, versoesArquivos[0]), 'utf8'));
    const anterior = JSON.parse(fs.readFileSync(path.join(pastaProjeto, versoesArquivos[1]), 'utf8'));

    const mapaAnterior = new Map(anterior.arquivos.map(a => [a.arquivo, a]));
    const mapaAtual = new Map(atual.arquivos.map(a => [a.arquivo, a]));

    const arquivosCriados = [];
    const arquivosModificados = [];
    const arquivosRemovidos = [];
    const travasSegurancaPerdidas = [];
    const novosAlertasCusto = [];
    const alertasCustoResolvidos = [];

    // Checa arquivos novos e alterados
    for (const [caminho, arqAtual] of mapaAtual.entries()) {
      const arqAnt = mapaAnterior.get(caminho);
      if (!arqAnt) {
        arquivosCriados.push(caminho);
      } else {
        const alterouLinhas = arqAtual.linhas !== arqAnt.linhas;
        const alterouTamanho = arqAtual.tamanhoKB !== arqAnt.tamanhoKB;
        const alterouMtime = arqAtual.mtimeMs !== arqAnt.mtimeMs;

        if (alterouLinhas || alterouTamanho || alterouMtime) {
          arquivosModificados.push({
            arquivo: caminho,
            linhasAntes: arqAnt.linhas,
            linhasDepois: arqAtual.linhas,
            diferencaLinhas: arqAtual.linhas - arqAnt.linhas
          });

          // Alerta crítico: Trava de segurança que existia antes sumiu?
          if (arqAnt.travasSeguranca?.length > 0 && (!arqAtual.travasSeguranca || arqAtual.travasSeguranca.length < arqAnt.travasSeguranca.length)) {
            travasSegurancaPerdidas.push({
              arquivo: caminho,
              travasAntes: arqAnt.travasSeguranca
            });
          }

          // Custo de banco: novo loop ou query sem limite?
          if (!arqAnt.alertasCusto?.buscaEmLoop && arqAtual.alertasCusto?.buscaEmLoop) {
            novosAlertasCusto.push({ arquivo: caminho, tipo: "Novo loop com busca de banco introduzido!" });
          }
          if (arqAnt.alertasCusto?.buscaEmLoop && !arqAtual.alertasCusto?.buscaEmLoop) {
            alertasCustoResolvidos.push({ arquivo: caminho, tipo: "Busca em loop resolvida com sucesso!" });
          }
        }
      }
    }

    // Checa arquivos removidos
    for (const caminho of mapaAnterior.keys()) {
      if (!mapaAtual.has(caminho)) {
        arquivosRemovidos.push(caminho);
      }
    }

    return {
      temHistorico: true,
      dataAntes: anterior.dataISO,
      dataDepois: atual.dataISO,
      resumoGeral: {
        totalArquivosCriados: arquivosCriados.length,
        totalArquivosModificados: arquivosModificados.length,
        totalArquivosRemovidos: arquivosRemovidos.length,
        temPerdaSeguranca: travasSegurancaPerdidas.length > 0
      },
      detalhes: {
        arquivosCriados,
        arquivosModificados,
        arquivosRemovidos,
        travasSegurancaPerdidas,
        novosAlertasCusto,
        alertasCustoResolvidos
      }
    };
  } catch (erro) {
    return { temHistorico: false, erro: erro.message };
  }
}
