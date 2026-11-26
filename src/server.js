import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { rastrearArquivosDetalhados } from './scanner.js';
import { extrairAST, extrairFuncoesDoArquivo } from './parser.js';
import { normalizarNo, normalizarArquivo } from './normalizer.js';
import { construirArestas } from './edgeBuilder.js';
import { analisarMetricasArquivo } from './heuristics.js';
import {
  gerarRelatorioSaude,
  calcularEfeitoDomino,
  gerarChecklistParaArquivo,
  calcularEconomiaTokens,
  detectarLogicasGemeas,
  calcularPageRank
} from './intelligenceAnalyzer.js';
import {
  salvarFotografiaProjeto,
  listarProjetosSalvos,
  obterVersoesProjeto,
  obterDetalheVersao,
  compararUltimasModificacoes
} from './historyManager.js';
import {
  gerarEsqueletoCodigo,
  empacotarContextoXML,
  estimarTokens
} from './contextCompressor.js';
import {
  CATEGORIAS_VACINAS,
  VACINAS_CATALOGO,
  SUPER_BLOCOS_CATALOGO,
  recomendarVacinasParaProjeto
} from './vaccineCatalog.js';
import {
  injetarVacinasNoProjeto,
  gerarPromptTextoBlindado
} from './vaccineInjector.js';
import {
  obterOuCriarChecklist,
  atualizarItemChecklist,
  prepararContextoMudancaEspecifica
} from './checklistManager.js';
import {
  obterCatalogoLocalizado,
  obterChecklistLocalizado
} from './i18nCatalogEn.js';

// A nossa RAM Global que segurará o Grafo, os Arquivos e os Relatórios Mapeados
export const globalMemory = {
  nodes: [],
  edges: [],
  files: [],
  relatorioSaude: null,
  projetoAtual: null
};

// Cache Incremental em Memória (Inspirado no Codebase-Memory):
// Guarda a análise pronta indexada por "caminho::hash". Se o arquivo não mudou,
// a releitura leva 0,001s em vez de reprocessar com Tree-sitter!
const cacheAnaliseIncremental = new Map();

// --------------------------------------------------------------------------
// MOTOR DE INGESTÃO INCREMENTAL COM HASH (Super-Rápido a partir da 2ª análise)
// --------------------------------------------------------------------------
export async function analisarProjeto(diretorioRaiz) {
  const inicioTempo = Date.now();
  console.error(`\n🔍 Iniciando varredura incremental no diretório: ${diretorioRaiz}`);
  
  // Limpa a memória ativa
  globalMemory.nodes = [];
  globalMemory.edges = [];
  globalMemory.files = [];
  globalMemory.relatorioSaude = null;
  globalMemory.projetoAtual = diretorioRaiz;

  // 1. Rastreia e mede todos os arquivos válidos com os novos sensores
  const arquivosDetalhados = await rastrearArquivosDetalhados(diretorioRaiz);
  const caminhosValidos = arquivosDetalhados.map(a => a.caminhoAbsoluto);

  let arquivosReaproveitados = 0;
  let arquivosProcessados = 0;

  for (const infoArquivo of arquivosDetalhados) {
    const chaveCache = `${infoArquivo.caminhoRelativo}::${infoArquivo.hash || infoArquivo.mtimeMs}`;

    // SE O ARQUIVO NÃO MUDOU: Reaproveita 100% da análise do cache em milissegundos!
    if (cacheAnaliseIncremental.has(chaveCache)) {
      const cached = cacheAnaliseIncremental.get(chaveCache);
      globalMemory.files.push(cached.file);
      globalMemory.nodes.push(...cached.nodes);
      globalMemory.edges.push(...cached.edges);
      arquivosReaproveitados++;
      continue;
    }

    // SE O ARQUIVO É NOVO OU FOI MODIFICADO: Processa com os sensores e Tree-sitter
    arquivosProcessados++;
    let metricasHeuristicas = null;
    let codigoTexto = '';

    if (infoArquivo.isCodigo || infoArquivo.isConfigGlobal) {
      try {
        codigoTexto = fs.readFileSync(infoArquivo.caminhoAbsoluto, 'utf8');
        metricasHeuristicas = analisarMetricasArquivo(codigoTexto, infoArquivo.caminhoRelativo);
      } catch (errLeitura) {
        // Arquivo vazio ou ilegível
      }
    }

    const arquivoNormalizado = normalizarArquivo(infoArquivo, metricasHeuristicas);
    globalMemory.files.push(arquivoNormalizado);

    const nosDoArquivo = [];
    const arestasDoArquivo = [];

    if (infoArquivo.isCodigo) {
      try {
        const astBruta = await extrairAST(infoArquivo.caminhoAbsoluto);
        const nosBrutos = await extrairFuncoesDoArquivo(infoArquivo.caminhoAbsoluto);
        
        const nosNorm = nosBrutos.map(no => normalizarNo(no, infoArquivo.caminhoRelativo));
        nosDoArquivo.push(...nosNorm);
        globalMemory.nodes.push(...nosNorm);
        
        const arestas = construirArestas(astBruta, infoArquivo.caminhoAbsoluto, diretorioRaiz, caminhosValidos);
        arestasDoArquivo.push(...arestas);
        globalMemory.edges.push(...arestas);
      } catch (errAst) {
        console.error(`Aviso: Falha ao processar AST de ${infoArquivo.caminhoRelativo}:`, errAst.message);
      }
    }

    // Salva no cache incremental para as próximas varreduras
    cacheAnaliseIncremental.set(chaveCache, {
      file: arquivoNormalizado,
      nodes: nosDoArquivo,
      edges: arestasDoArquivo
    });
  }

  // 2. Aciona o Cérebro Detetive com PageRank, God Nodes e KPIs
  globalMemory.relatorioSaude = gerarRelatorioSaude(globalMemory.files, globalMemory.edges);

  // 3. Salva a Fotografia no Cofre de Projetos para permitir comparativo "Antes x Depois"
  salvarFotografiaProjeto(diretorioRaiz, globalMemory, globalMemory.relatorioSaude);

  const tempoTotalMs = Date.now() - inicioTempo;
  console.error(`✅ Ingestão Concluída em ${tempoTotalMs}ms! (${arquivosProcessados} novos/modificados, ${arquivosReaproveitados} reaproveitados do cache).`);
}

/**
 * Encontra o menor caminho de conexões (BFS) entre dois arquivos no grafo.
 */
function encontrarMenorCaminho(origem, destino, arestas) {
  if (origem === destino) return [origem];

  const fila = [[origem]];
  const visitados = new Set([origem]);

  while (fila.length > 0) {
    const caminhoAtual = fila.shift();
    const ultimoNo = caminhoAtual[caminhoAtual.length - 1];

    const vizinhos = arestas
      .filter(e => e.origem === ultimoNo)
      .map(e => e.destino);

    for (const vizinho of vizinhos) {
      if (vizinho === destino) {
        return [...caminhoAtual, vizinho];
      }
      if (!visitados.has(vizinho)) {
        visitados.add(vizinho);
        fila.push([...caminhoAtual, vizinho]);
      }
    }
  }

  return null; // Nenhum caminho encontrado
}

/**
 * Ponto de entrada do Servidor (Express + Servidor MCP).
 */
export async function iniciarServidor() {
  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DO EXPRESS (Painel Visual)
  // --------------------------------------------------------------------------
  const express = (await import('express')).default;
  const app = express();
  
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  app.post('/api/analisar', async (req, res) => {
    try {
      const { caminho } = req.body;
      if (!caminho) return res.status(400).json({ erro: 'Caminho não fornecido' });
      
      await analisarProjeto(caminho);
      res.json({
        sucesso: true,
        arquivos: globalMemory.files.length,
        nos: globalMemory.nodes.length,
        arestas: globalMemory.edges.length,
        saude: globalMemory.relatorioSaude?.kpisResumo
      });
    } catch (erro) {
      console.error('Erro na análise:', erro);
      res.status(500).json({ erro: erro.message });
    }
  });

  app.get('/api/pick-folder', (req, res) => {
    if (process.platform === 'win32') {
      const psScript = `
        Add-Type -AssemblyName System.windows.forms;
        $f = New-Object System.Windows.Forms.FolderBrowserDialog;
        $f.Description = 'Select a project folder for ContextMap';
        $f.ShowNewFolderButton = $false;
        if($f.ShowDialog() -eq 'OK'){ Write-Output $f.SelectedPath }
      `;
      return exec(`powershell -STA -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, (erro, stdout) => {
        if (erro) return res.status(500).json({ erro: 'Failed to open folder picker' });
        res.json({ caminho: stdout.trim() });
      });
    }
    if (process.platform === 'darwin') {
      return exec(`osascript -e 'POSIX path of (choose folder with prompt "Select a project folder for ContextMap")'`, (erro, stdout) => {
        if (erro) return res.json({ caminho: '' });
        res.json({ caminho: stdout.trim() });
      });
    }
    // Linux / other OS: ask user to paste folder path directly
    return res.json({ caminho: '', aviso: 'Paste the absolute folder path into the input field above.' });
  });

  app.get('/api/grafo', (req, res) => {
    res.json(globalMemory);
  });

  app.get('/api/saude', (req, res) => {
    res.json(globalMemory.relatorioSaude || {});
  });

  app.get('/api/projetos', (req, res) => {
    res.json(listarProjetosSalvos());
  });

  app.get('/api/projeto/:id/versoes', (req, res) => {
    res.json(obterVersoesProjeto(req.params.id));
  });

  app.get('/api/projeto/:id/versao/:arquivo', (req, res) => {
    const detalhe = obterDetalheVersao(req.params.id, req.params.arquivo);
    if (!detalhe) return res.status(404).json({ erro: "Versão não encontrada" });
    res.json(detalhe);
  });

  app.get('/api/projeto/:id/comparar', (req, res) => {
    res.json(compararUltimasModificacoes(req.params.id));
  });

  app.get('/api/historico', (req, res) => {
    if (!globalMemory.projetoAtual) {
      return res.json({ temHistorico: false, mensagem: "Nenhum projeto ativo analisado no momento." });
    }
    const comparacao = compararUltimasModificacoes(globalMemory.projetoAtual);
    res.json(comparacao);
  });

  app.post('/api/domino', (req, res) => {
    const { arquivo } = req.body;
    if (!arquivo) return res.status(400).json({ erro: "Arquivo não especificado" });

    const domino = calcularEfeitoDomino(arquivo, globalMemory.edges);
    const gemeos = detectarLogicasGemeas(globalMemory.files);
    const checklist = gerarChecklistParaArquivo(arquivo, globalMemory.files, domino, gemeos);
    const economia = calcularEconomiaTokens(globalMemory.files, domino);

    res.json({
      domino,
      checklist,
      economia
    });
  });

  // Rota para extrair o esqueleto de um arquivo (Stubs / 90% menos tokens)
  app.post('/api/esqueleto', (req, res) => {
    const { arquivo } = req.body;
    if (!arquivo || !globalMemory.projetoAtual) return res.status(400).json({ erro: "Parâmetros inválidos" });

    const caminhoAbs = path.resolve(globalMemory.projetoAtual, arquivo);
    if (!fs.existsSync(caminhoAbs)) return res.status(404).json({ erro: "Arquivo não encontrado" });

    const conteudo = fs.readFileSync(caminhoAbs, 'utf8');
    const esqueleto = gerarEsqueletoCodigo(conteudo, arquivo);
    res.json({
      arquivo,
      tokensOriginal: estimarTokens(conteudo),
      tokensEsqueleto: estimarTokens(esqueleto),
      esqueleto
    });
  });

  // --------------------------------------------------------------------------
  // VACCINES & CANONICAL BLUEPRINTS ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/vacinas', (req, res) => {
    const lang = req.query.lang === 'pt' ? 'pt' : 'en';
    const recomendadas = recomendarVacinasParaProjeto(globalMemory.files, globalMemory.relatorioSaude);
    const localizado = obterCatalogoLocalizado(lang, CATEGORIAS_VACINAS, VACINAS_CATALOGO, SUPER_BLOCOS_CATALOGO);
    res.json({
      categorias: localizado.categorias,
      vacinas: localizado.vacinas,
      blocos: localizado.blocos,
      recomendadas,
      projetoAtivo: globalMemory.projetoAtual
    });
  });

  app.post('/api/aplicar-vacinas', (req, res) => {
    try {
      const { caminhoProjeto, idsVacinas = [], idsBlocos = [] } = req.body;
      const alvo = caminhoProjeto || globalMemory.projetoAtual;

      if (!alvo) {
        return res.status(400).json({ erro: "Nenhum diretório de projeto especificado ou carregado." });
      }

      const estatisticas = injetarVacinasNoProjeto(alvo, idsVacinas, idsBlocos);
      res.json({
        sucesso: true,
        projeto: alvo,
        estatisticas
      });
    } catch (err) {
      console.error("Erro ao injetar vacinas:", err);
      res.status(500).json({ erro: err.message });
    }
  });

  app.post('/api/gerar-prompt-vacinas', (req, res) => {
    try {
      const { idsVacinas = [], idsBlocos = [], lang = 'en' } = req.body;
      const prompt = gerarPromptTextoBlindado(idsVacinas, idsBlocos, lang);
      res.json({ sucesso: true, prompt });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // PERSISTENT CHECKLIST & TARGETED CHANGE ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/checklist', (req, res) => {
    if (!globalMemory.projetoAtual) {
      return res.status(400).json({ erro: 'Nenhum projeto analisado ativo no momento.' });
    }
    try {
      const lang = req.query.lang === 'pt' ? 'pt' : 'en';
      const checklist = obterOuCriarChecklist(
        globalMemory.projetoAtual,
        globalMemory.relatorioSaude,
        globalMemory.files
      );
      res.json(obterChecklistLocalizado(lang, checklist));
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
  });

  app.post('/api/checklist/atualizar', (req, res) => {
    const { itemId, status, observacao, lang = 'en' } = req.body;
    if (!globalMemory.projetoAtual) {
      return res.status(400).json({ erro: 'Nenhum projeto analisado ativo.' });
    }
    if (!itemId || !status) {
      return res.status(400).json({ erro: 'itemId e status são obrigatórios.' });
    }
    try {
      const checklist = atualizarItemChecklist(
        globalMemory.projetoAtual,
        itemId,
        status,
        observacao || ''
      );
      res.json({ sucesso: true, checklist: obterChecklistLocalizado(lang, checklist) });
    } catch (err) {
      res.status(400).json({ erro: err.message });
    }
  });

  app.post('/api/analisar-mudanca', (req, res) => {
    const { descricaoMudanca, arquivoAlvo, lang = 'en' } = req.body;
    if (!globalMemory.projetoAtual) {
      return res.status(400).json({ erro: 'Nenhum projeto ativo.' });
    }
    if (!descricaoMudanca) {
      return res.status(400).json({ erro: 'Descreva a mudança desejada.' });
    }

    const alvo = arquivoAlvo || (globalMemory.relatorioSaude?.arquivosDeus?.[0]?.arquivo || 'app.js');
    const domino = calcularEfeitoDomino(alvo, globalMemory.edges);
    const contexto = prepararContextoMudancaEspecifica(globalMemory.projetoAtual, {
      descricaoMudanca,
      arquivoAlvo: alvo,
      domino,
      relatorioSaude: globalMemory.relatorioSaude,
      arquivosMemoria: globalMemory.files
    });

    const checklistLoc = obterChecklistLocalizado(lang, obterOuCriarChecklist(globalMemory.projetoAtual, globalMemory.relatorioSaude, globalMemory.files));
    const itensDecididosLoc = (checklistLoc?.itens || [])
      .filter(i => i.status === 'feito' || i.status === 'ignorado')
      .map(i => `${i.icone} ${i.titulo} (${lang === 'pt' ? (i.status === 'feito' ? 'JÁ FEITO' : 'DEIXAR COMO ESTÁ') : (i.status === 'feito' ? 'ALREADY DONE' : 'LEAVE AS IS')})`);

    const promptParaIA = lang === 'pt'
      ? `IA, você é o Arquiteto de Software Consultor do meu projeto.
Preciso que você analise uma MUDANÇA ESPECÍFICA no meu sistema sem gastar tempo nem tokens reavaliando itens antigos.

🎯 MUDANÇA SOLICITADA:
"${descricaoMudanca}"
Arquivo de partida da alteração: '${alvo}'

📌 STATUS DA VISTORIA INICIAL DO MEU PROJETO (CHECKLIST):
- Total de itens auditados: ${contexto.totaisChecklist.total} (${contexto.totaisChecklist.feitos} já feitos, ${contexto.totaisChecklist.ignorados} decididos deixar como estão, ${contexto.totaisChecklist.pendentes} pendentes)
- Itens já resolvidos ou que decidi NÃO mexer (NÃO REAVALIE NEM MEXA NELES):
${itensDecididosLoc.map(i => `  ✓ ${i}`).join('\n') || '  (Nenhum definido ainda)'}

🔍 RAIO DE IMPACTO DA MUDANÇA (EFEITO DOMINÓ CIRÚRGICO):
- Telas/Arquivos dependentes que podem ser afetados por '${alvo}':
  ${contexto.dominoCirurgico.ascendentesQueQuebram.length > 0 ? contexto.dominoCirurgico.ascendentesQueQuebram.join(', ') : 'Nenhum (mudança segura e isolada)'}
- Arquivos de apoio necessários:
  ${contexto.dominoCirurgico.descendentesNecessarios.length > 0 ? contexto.dominoCirurgico.descendentesNecessarios.join(', ') : 'Nenhum'}

SUA MISSÃO COMO CONSULTOR:
1. FOQUE EXCLUSIVAMENTE nesta nova mudança solicitada. Não perca tempo sugerindo alterações em itens que já foram resolvidos ou descartados no checklist acima.
2. Me explique em português simples: como essa funcionalidade será adicionada sem quebrar as outras telas do sistema?
3. Se houver algum risco de quebrar os arquivos dependentes citados acima, me mostre o passo a passo seguro.
4. NÃO ALTERE NENHUMA LINHA DE CÓDIGO AGORA. Aguarde minha decisão após ler seu parecer.`
      : `AI, you are the Consulting Software Architect for my project.
I need a SURGICAL PLAN for a SPECIFIC CHANGE without wasting tokens re-auditing past decisions.

🎯 REQUESTED CHANGE:
"${descricaoMudanca}"
Primary entry file: '${alvo}'

📌 PROJECT INSPECTION CHECKLIST STATUS:
- Audited items: ${contexto.totaisChecklist.total} (${contexto.totaisChecklist.feitos} done, ${contexto.totaisChecklist.ignorados} left as is, ${contexto.totaisChecklist.pendentes} pending)
- Already resolved or intentionally skipped items (DO NOT RE-AUDIT OR SUGGEST CHANGES TO THESE):
${itensDecididosLoc.map(i => `  ✓ ${i}`).join('\n') || '  (None decided yet)'}

🔍 SURGICAL BLAST RADIUS (DOMINO EFFECT):
- Dependent files/screens that may break if '${alvo}' changes:
  ${contexto.dominoCirurgico.ascendentesQueQuebram.length > 0 ? contexto.dominoCirurgico.ascendentesQueQuebram.join(', ') : 'None (isolated, safe change)'}
- Supporting dependencies:
  ${contexto.dominoCirurgico.descendentesNecessarios.length > 0 ? contexto.dominoCirurgico.descendentesNecessarios.join(', ') : 'None'}

YOUR MISSION AS CONSULTING ARCHITECT:
1. FOCUS EXCLUSIVELY on the requested change above. Do not waste tokens suggesting refactors for items already marked DONE or LEAVE AS IS.
2. Explain clearly how you will implement this change without breaking any dependent files.
3. Outline the safest step-by-step plan.
4. DO NOT EDIT ANY CODE YET. Wait for my approval after I read your plan.`;

    res.json({
      sucesso: true,
      contexto,
      promptParaIA
    });
  });
  
  app.listen(3000, () => {
    console.error('🌐 ContextMap Dashboard running at http://localhost:3000');
  });

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DO SERVIDOR MCP (Ouvidos da IA - ContextMap)
  // --------------------------------------------------------------------------
  const server = new McpServer({
    name: "ContextMap",
    version: "1.0.0",
  });

  // Função de segurança: Garante que o projeto esteja lido e salvo no histórico em qualquer chamada de ferramenta
  async function assegurarProjetoCarregado(caminhoProjetoOpcional = null, targetPathOpcional = null) {
    let alvo = caminhoProjetoOpcional;
    
    // Se o usuário/IA passou um arquivo com caminho absoluto em vez da pasta
    if (!alvo && targetPathOpcional && path.isAbsolute(targetPathOpcional)) {
      let dir = path.dirname(targetPathOpcional);
      while (dir && dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'package.json')) || fs.existsSync(path.join(dir, '.git'))) {
          alvo = dir;
          break;
        }
        dir = path.dirname(dir);
      }
    }

    // Se ainda não temos alvo, verifica se já temos projeto ativo na memória
    if (!alvo) {
      alvo = globalMemory.projetoAtual;
    }

    // Se ainda não temos alvo e a pasta atual do processo possui package.json e não é o MAPACONTEXTO
    if (!alvo && fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        if (pkg.name !== 'contextmap' && pkg.name !== 'mapacontexto') {
          alvo = process.cwd();
        }
      } catch (e) {}
    }

    if (alvo) {
      const normAlvo = path.normalize(path.resolve(alvo));
      if (!globalMemory.projetoAtual || globalMemory.files.length === 0 || path.normalize(globalMemory.projetoAtual).toLowerCase() !== normAlvo.toLowerCase() || caminhoProjetoOpcional) {
        await analisarProjeto(normAlvo);
      }
    }
  }

  // 1. Resumo Executivo & Topologia Geral
  server.tool(
    "mc_obter_resumo",
    "Entrega a planta baixa do projeto com KPIs de saúde, tabelas de banco, Arquivos-Deus (Hubs Centrais) e salva automaticamente a fotografia no histórico.",
    { caminho_projeto: z.string().optional().describe("Caminho absoluto da pasta do projeto (ex: 'C:/MeusProjetos/App'). Obrigatório na 1ª análise para salvar no histórico.") },
    async ({ caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);

      const saude = globalMemory.relatorioSaude || {};
      const resumo = {
        projeto_ativo: globalMemory.projetoAtual,
        kpis_gerais: saude.kpisResumo || {
          total_arquivos: globalMemory.files.length,
          total_nos: globalMemory.nodes.length,
          total_arestas: globalMemory.edges.length
        },
        status_atualizacao_sem_ctrl_f5: saude.statusAtualizacaoApp || null,
        status_modal_fecha_ao_arrastar: saude.statusModalArrasto || null,
        arquivos_deus_hubs_centrais: (saude.arquivosDeus || []).slice(0, 5),
        tabelas_banco: saude.tabelasBanco?.lista || [],
        viloes_custo_banco: (saude.viloesCustoBanco || []).slice(0, 5),
        formularios_sem_cache_rascunho: (saude.formulariosSemCache || []).map(f => f.arquivo),
        pares_gemeos_alerta_duplicidade: (saude.logicasGemeas || []).slice(0, 5).map(g => g.instrucaoObrigatoriaParaIA),
        portas_saida_globais: saude.portasSaida || {},
        economia_tokens_estimada: saude.economiaTokens || {}
      };

      return { content: [{ type: "text", text: JSON.stringify(resumo, null, 2) }] };
    }
  );

  // 2. Análise de Impacto Cirúrgica com Formatação XML Blindada (Redução de Tokens e Sem Alucinações)
  server.tool(
    "mc_analisar_impacto",
    "Analisa o raio de explosão (efeito dominó direto e indireto), travas de segurança e checklist em XML blindado de alta densidade semântica.",
    { 
      target_id: z.string().describe("O ID universal do nó ou caminho do arquivo a ser modificado"),
      caminho_projeto: z.string().optional().describe("Caminho da pasta do projeto caso ainda não tenha sido carregado")
    },
    async ({ target_id, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto, target_id);

      const targetFile = target_id.split('::')[0];
      
      const domino = calcularEfeitoDomino(targetFile, globalMemory.edges);
      const gemeos = detectarLogicasGemeas(globalMemory.files);
      const checklist = gerarChecklistParaArquivo(targetFile, globalMemory.files, domino, gemeos);
      const economia = calcularEconomiaTokens(globalMemory.files, domino);

      const fichaArquivo = globalMemory.files.find(f => f.arquivo === targetFile);
      const gemeosDoArquivo = gemeos.filter(g => g.arquivoA === targetFile || g.arquivoB === targetFile);

      // Gera esqueletos dos arquivos diretamente afetados para a IA entender a interface sem abrir o arquivo inteiro!
      const esqueletos = [];
      const arquivosParaEsqueleto = [targetFile, ...(domino.impactoDireto?.ascendentesQueQuebram || []).slice(0, 3)];

      for (const arq of arquivosParaEsqueleto) {
        if (globalMemory.projetoAtual) {
          const caminhoAbs = path.resolve(globalMemory.projetoAtual, arq);
          if (fs.existsSync(caminhoAbs)) {
            try {
              const raw = fs.readFileSync(caminhoAbs, 'utf8');
              esqueletos.push({ arquivo: arq, codigoEsqueleto: gerarEsqueletoCodigo(raw, arq) });
            } catch (e) {}
          }
        }
      }

      // Empacota tudo em XML estruturado (o padrão ouro comprovado pelo estudo)
      const xmlOutput = empacotarContextoXML({
        projetoAtual: globalMemory.projetoAtual,
        totalArquivos: globalMemory.files.length,
        alvo: targetFile,
        targetId: target_id,
        domino,
        travasSeguranca: fichaArquivo?.diagnostico?.seguranca?.travas || [],
        logicasGemeas: gemeosDoArquivo,
        esqueletos,
        checklist,
        economiaTokens: economia
      });

      return { content: [{ type: "text", text: xmlOutput }] };
    }
  );

  // 3. Oráculo de Busca Rápida (context_search)
  server.tool(
    "mc_buscar_contexto",
    "Pesquisa instantânea de termos, funções, tabelas ou regras de negócio no projeto sem precisar ler arquivos no escuro.",
    { 
      termo: z.string().describe("Search term (e.g. 'payment', 'users', 'auth', 'deleteOrder')"),
      caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado")
    },
    async ({ termo, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      const termoLower = termo.toLowerCase();

      // Busca em nós de funções
      const nosEncontrados = globalMemory.nodes
        .filter(n => n.nome.toLowerCase().includes(termoLower) || n.arquivo.toLowerCase().includes(termoLower))
        .slice(0, 10)
        .map(n => ({ id: n.id, arquivo: n.arquivo, nome: n.nome, linha: n.linha_inicio, tags: n.tags }));

      // Busca em tabelas de banco
      const tabelasEncontradas = (globalMemory.relatorioSaude?.tabelasBanco?.lista || [])
        .filter(t => t.toLowerCase().includes(termoLower));

      // Busca em arquivos com travas de segurança
      const arquivosComTrava = globalMemory.files
        .filter(f => f.diagnostico?.seguranca?.temTravas && f.arquivo.toLowerCase().includes(termoLower))
        .map(f => f.arquivo);

      const resultado = {
        termo_buscado: termo,
        total_resultados: nosEncontrados.length,
        funcoes_encontradas: nosEncontrados,
        tabelas_relacionadas: tabelasEncontradas,
        arquivos_com_travas_relevantes: arquivosComTrava
      };

      return { content: [{ type: "text", text: JSON.stringify(resultado, null, 2) }] };
    }
  );

  // 4. Modo Esqueleto (get_code_skeleton / 94% menos tokens)
  server.tool(
    "mc_obter_esqueleto",
    "Devolve apenas as assinaturas de funções e tipos de um arquivo (stubs elididos com ⋮), economizando até 94% dos tokens.",
    { 
      arquivo: z.string().describe("Caminho relativo do arquivo (ex: 'src/services/api.ts')"),
      caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado")
    },
    async ({ arquivo, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto, arquivo);
      if (!globalMemory.projetoAtual) return { content: [{ type: "text", text: "Nenhum projeto ativo." }] };

      const caminhoAbs = path.resolve(globalMemory.projetoAtual, arquivo);
      if (!fs.existsSync(caminhoAbs)) return { content: [{ type: "text", text: `Arquivo não encontrado: ${arquivo}` }] };

      const codigo = fs.readFileSync(caminhoAbs, 'utf8');
      const esqueleto = gerarEsqueletoCodigo(codigo, arquivo);
      const tokensOriginal = estimarTokens(codigo);
      const tokensEsqueleto = estimarTokens(esqueleto);

      const resposta = `<!-- Esqueleto de ${arquivo} | Tokens: ${tokensEsqueleto} (Economia de ${Math.round((1 - tokensEsqueleto/tokensOriginal)*100)}% de tokens) -->\n${esqueleto}`;
      return { content: [{ type: "text", text: resposta }] };
    }
  );

  // 5. Rastreador de Caminho entre Componentes (trace_path)
  server.tool(
    "mc_rastrear_caminho",
    "Descobre o caminho exato de conexões (pontes de dependência) entre dois arquivos/módulos para entender como a Tela A afeta o Serviço B.",
    {
      origem: z.string().describe("Caminho do arquivo de partida (ex: 'src/pages/Hub.tsx')"),
      destino: z.string().describe("Caminho do arquivo de chegada (ex: 'src/services/Database.ts')"),
      caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado")
    },
    async ({ origem, destino, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      const caminho = encontrarMenorCaminho(origem, destino, globalMemory.edges);
      if (!caminho) {
        return { content: [{ type: "text", text: `Nenhum caminho direto de dependência encontrado entre '${origem}' e '${destino}'.` }] };
      }

      const resultado = {
        origem,
        destino,
        passos_totais: caminho.length - 1,
        ponte_de_conexao: caminho.join(' ➔ ')
      };

      return { content: [{ type: "text", text: JSON.stringify(resultado, null, 2) }] };
    }
  );

  // 6. Auditoria de Modificações (Antes x Depois)
  server.tool(
    "mc_auditar_modificacoes",
    "Compara o estado do projeto antes e depois da edição da IA, avisando se alguma trava de segurança foi perdida ou se novos custos de banco surgiram.",
    { caminho_projeto: z.string().optional().describe("Caminho do projeto a auditar") },
    async ({ caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      if (!globalMemory.projetoAtual) {
        return { content: [{ type: "text", text: "Nenhum projeto ativo para auditar." }] };
      }
      // Re-analisa o projeto atual usando o cache incremental super rápido (1s) para registrar a nova fotografia no histórico!
      await analisarProjeto(globalMemory.projetoAtual);
      const comparacao = compararUltimasModificacoes(globalMemory.projetoAtual);
      return { content: [{ type: "text", text: JSON.stringify(comparacao, null, 2) }] };
    }
  );

  // 7. Aplicador Automático de Vacinas Anti-Erro (.cursor/rules & AGENTS.md)
  server.tool(
    "mc_injetar_vacinas",
    "Aplica vacinas anti-erro (.cursor/rules/*.mdc) e constituição tricameral (AGENTS.md) diretamente na pasta do projeto atual.",
    {
      caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado"),
      vacinas: z.array(z.string()).optional().describe("Lista de IDs de vacinas a aplicar. Se omitido, aplica as recomendadas pelo Raio-X do projeto."),
      blocos: z.array(z.string()).optional().describe("Lista opcional de super-blocos a injetar ('auth-rbac', 'admin-kpis', 'safe-modal-toast')")
    },
    async ({ caminho_projeto, vacinas, blocos }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      if (!globalMemory.projetoAtual) {
        return { content: [{ type: "text", text: "Erro: Nenhum projeto ativo foi definido para receber as vacinas." }] };
      }

      let vacinasParaAplicar = vacinas;
      if (!vacinasParaAplicar || vacinasParaAplicar.length === 0) {
        vacinasParaAplicar = recomendarVacinasParaProjeto(globalMemory.files, globalMemory.relatorioSaude);
        if (vacinasParaAplicar.length === 0) {
          // Se não houver alertas graves específicos, aplica as top 5 essenciais
          vacinasParaAplicar = [
            'vacina-01-fuso-horario-brasil',
            'vacina-02-modal-fechamento-arrasto',
            'vacina-04-n-mais-um-queries-loop',
            'vacina-05-rascunho-automatico-localstorage',
            'vacina-10-anti-clique-duplo-idempotencia'
          ];
        }
      }

      try {
        const stats = injetarVacinasNoProjeto(globalMemory.projetoAtual, vacinasParaAplicar, blocos || []);
        const resposta = {
          sucesso: true,
          projeto_blindado: globalMemory.projetoAtual,
          vacinas_aplicadas: vacinasParaAplicar,
          arquivos_regras_criados: stats.arquivosMdcCriados,
          manuais_constitucionais: stats.arquivosConstituicaoCriados,
          blocos_injetados: stats.arquivosBlocosCriados,
          mensagem: "Projeto protegido com sucesso contra alucinações e vícios comuns de código da IA!"
        };
        return { content: [{ type: "text", text: JSON.stringify(resposta, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Falha ao injetar vacinas: ${err.message}` }] };
      }
    }
  );

  // 8. Oráculo de Moldes Canônicos (Super-Blocos Estruturais)
  server.tool(
    "mc_obter_modelo",
    "Entrega o código-fonte canônico completo e especificações de um Super-Bloco Estrutural ('auth-rbac', 'admin-kpis', 'safe-modal-toast', 'auto-update-banner').",
    {
      id_bloco: z.string().describe("ID do bloco: 'auth-rbac' (Login com Admin separado), 'admin-kpis' (Dashboard Executivo), 'safe-modal-toast' (Janela Modal Blindada) ou 'auto-update-banner' (Aviso de Nova Versão sem Ctrl+F5)")
    },
    async ({ id_bloco }) => {
      const bloco = SUPER_BLOCOS_CATALOGO.find(b => b.id === id_bloco);
      if (!bloco) {
        return { content: [{ type: "text", text: `Bloco '${id_bloco}' não encontrado. Opções disponíveis: ${SUPER_BLOCOS_CATALOGO.map(b => b.id).join(', ')}` }] };
      }

      const resposta = {
        bloco: bloco.nome,
        resumo: bloco.resumoLeigo,
        descricao_tecnica: bloco.descricao,
        arquivos_canonicos: bloco.arquivos.map(a => ({
          caminho_sugerido: a.caminho,
          finalidade: a.descricao,
          codigo: a.conteudo
        }))
      };

      return { content: [{ type: "text", text: JSON.stringify(resposta, null, 2) }] };
    }
  );

  // 9. Oráculo do Checklist Persistente (Folha de Vistoria do Projeto)
  server.tool(
    "mc_obter_checklist",
    "Consulta o Caderno de Vistoria / Checklist do projeto com itens auditados, separando o que já foi FEITO, o que foi IGNORADO (deixar como está) e o que está PENDENTE.",
    { caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado") },
    async ({ caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      if (!globalMemory.projetoAtual) return { content: [{ type: "text", text: "Nenhum projeto ativo." }] };

      const checklist = obterOuCriarChecklist(
        globalMemory.projetoAtual,
        globalMemory.relatorioSaude,
        globalMemory.files
      );
      return { content: [{ type: "text", text: JSON.stringify(checklist, null, 2) }] };
    }
  );

  // 10. Atualizador de Decisões do Usuário no Checklist
  server.tool(
    "mc_atualizar_checklist",
    "Registra a decisão do usuário sobre um item de melhoria ('feito', 'ignorado', 'pendente') no histórico do projeto para não reavaliar nem gastar tokens nas próximas sessões.",
    {
      item_id: z.string().describe("ID do item (ex: 'auto_update_ctrl_f5', 'fuso_horario_brasil', 'trava_duplo_clique', 'modal_fechamento_arrasto', 'consultas_banco_loop')"),
      status: z.enum(["feito", "pendente", "ignorado"]).describe("Novo status: 'feito' (já aplicado), 'ignorado' (usuário decidiu não mexer / deixar como está), ou 'pendente'"),
      observacao: z.string().optional().describe("Motivo ou observação da decisão do usuário (ex: 'Decidido não mexer por enquanto pois o app funciona bem assim')"),
      caminho_projeto: z.string().optional().describe("Caminho do projeto")
    },
    async ({ item_id, status, observacao, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto);
      if (!globalMemory.projetoAtual) return { content: [{ type: "text", text: "Nenhum projeto ativo." }] };

      try {
        const atualizado = atualizarItemChecklist(globalMemory.projetoAtual, item_id, status, observacao || '');
        const resposta = {
          sucesso: true,
          item_atualizado: item_id,
          novo_status: status,
          totais_checklist: atualizado.totais,
          mensagem: `Decisão gravada no histórico! O item '${item_id}' agora está marcado como '${status}' e não gastará tokens em análises futuras.`
        };
        return { content: [{ type: "text", text: JSON.stringify(resposta, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Erro ao atualizar checklist: ${err.message}` }] };
      }
    }
  );

  // 11. Análise de Mudança Específica (Zero Desperdício de Tokens)
  server.tool(
    "mc_analisar_mudanca_especifica",
    "Analisa cirurgicamente uma nova funcionalidade ou alteração pontual: NÃO reavalia itens do checklist já resolvidos ou ignorados, focando 100% no raio de impacto da mudança solicitada.",
    {
      descricao_mudanca: z.string().describe("O que o usuário quer alterar ou construir (ex: 'Adicionar filtro por data no extrato', 'Criar botão de exportar comprovante')"),
      arquivo_alvo: z.string().describe("Caminho do arquivo principal onde a mudança se iniciará (ex: 'app.js', 'src/pages/Extrato.tsx')"),
      caminho_projeto: z.string().optional().describe("Caminho do projeto caso ainda não esteja carregado")
    },
    async ({ descricao_mudanca, arquivo_alvo, caminho_projeto }) => {
      await assegurarProjetoCarregado(caminho_projeto, arquivo_alvo);
      if (!globalMemory.projetoAtual) return { content: [{ type: "text", text: "Nenhum projeto ativo." }] };

      const domino = calcularEfeitoDomino(arquivo_alvo, globalMemory.edges);
      const contexto = prepararContextoMudancaEspecifica(globalMemory.projetoAtual, {
        descricaoMudanca: descricao_mudanca,
        arquivoAlvo: arquivo_alvo,
        domino,
        relatorioSaude: globalMemory.relatorioSaude,
        arquivosMemoria: globalMemory.files
      });

      const resposta = {
        mudanca_solicitada: descricao_mudanca,
        arquivo_principal: arquivo_alvo,
        aviso_economia_tokens: "Itens já resolvidos ou descartados pelo usuário foram ocultados para você focar apenas na nova alteração.",
        checklist_ja_definido_resumo: contexto.itensJaDefinidosResumo,
        raio_impacto_cirurgico: {
          telas_dependentes_que_podem_quebrar: contexto.dominoCirurgico.ascendentesQueQuebram,
          arquivos_apoio: contexto.dominoCirurgico.descendentesNecessarios,
          total_arquivos_envolvidos: contexto.dominoCirurgico.totalArquivosEnvolvidos
        },
        diretriz_obrigatoria_para_ia: "NÃO sugira alterações em itens já marcados como JÁ FEITO ou DEIXAR COMO ESTÁ. Proponha apenas a implementação segura da mudança solicitada sem quebrar os arquivos dependentes."
      };

      return { content: [{ type: "text", text: JSON.stringify(resposta, null, 2) }] };
    }
  );

  console.error('🔌 Conectando transporte Stdio para o MCP...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🟢 MAPACONTEXTO MCP Core 5.0 online e aguardando comandos da IA!');
}

