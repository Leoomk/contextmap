import { detectarHeuristicas } from './heuristics.js';

/**
 * Fase 3 & Etapa 1: O Tradutor Universal (Normalização de Nós e Arquivos)
 * Transforma nós brutos e métricas de varredura em fichas padronizadas
 * que a nossa IA e o Dashboard entendem instantaneamente.
 */

/**
 * Converte um Node bruto do Tree-sitter para o padrão MAPACONTEXTO
 * @param {Object} no - O nó bruto retornado pelo Tree-sitter
 * @param {string} caminhoRelativo - Caminho do arquivo relativo à raiz do projeto
 * @returns {Object} JSON padronizado do mapa com as Heurísticas Integradas
 */
export function normalizarNo(no, caminhoRelativo) {
  let nomeBruto = null;

  // Tenta extrair o nome da função pelos campos da AST
  const noNome = no.childForFieldName('name');
  if (noNome) {
    nomeBruto = noNome.text;
  } else if (no.type === 'arrow_function' && no.parent && no.parent.type === 'variable_declarator') {
    const declaradorNome = no.parent.childForFieldName('name');
    if (declaradorNome) nomeBruto = declaradorNome.text;
  }

  // Linhas do Tree-sitter são baseadas em 0
  const linhaInicio = no.startPosition.row + 1;
  const linhaFim = no.endPosition.row + 1;

  // Se não tem nome, vira uma função anônima com base na linha e coluna
  const nomeNormalizado = nomeBruto || `anon_linha_${linhaInicio}_col_${no.startPosition.column}`;

  // Criação do ID universal (Arquivo::NomeDaFuncao)
  const idUniversal = `${caminhoRelativo}::${nomeNormalizado}`;

  // Executamos as HEURÍSTICAS para encontrar o Raio de Explosão invisível e riscos
  const tagsDeRisco = detectarHeuristicas(no);

  return {
    id: idUniversal,
    tipo: 'funcao',
    nome: nomeNormalizado,
    arquivo: caminhoRelativo,
    linha_inicio: linhaInicio,
    linha_fim: linhaFim,
    tags: tagsDeRisco
  };
}

/**
 * Consolida as métricas do scanner e dos novos sensores em um Prontuário Médico do Arquivo.
 * @param {Object} metadadosScanner - Metadados físicos coletados pelo scanner (tamanho, linhas, data).
 * @param {Object} metricasHeuristicas - Diagnóstico dos sensores (banco, rascunhos, memória, segurança).
 * @returns {Object} Ficha do arquivo padronizada para a IA e o Monitor de Saúde.
 */
export function normalizarArquivo(metadadosScanner, metricasHeuristicas) {
  const tagsArquivo = [];

  if (metricasHeuristicas) {
    if (metricasHeuristicas.formulario?.alertaPerdaDados) tagsArquivo.push('FORM_SEM_CACHE');
    if (metricasHeuristicas.banco?.buscaEmLoop) tagsArquivo.push('DB_LOOP_CARO');
    if (metricasHeuristicas.banco?.selectAllSemFiltro) tagsArquivo.push('DB_SELECT_SEM_LIMITE');
    if (metricasHeuristicas.banco?.escutasRealtime > 0) tagsArquivo.push('DB_REALTIME');
    if (metricasHeuristicas.memoria?.arquivoGigante) tagsArquivo.push('ARQUIVO_GIGANTE');
    if (metricasHeuristicas.memoria?.listaSemPaginacao) tagsArquivo.push('LISTA_SEM_PAGINACAO');
    if (metricasHeuristicas.memoria?.manipulacaoPesadaMemoria) tagsArquivo.push('MEMORIA_PESADA');
    if (metricasHeuristicas.seguranca?.temTravas) tagsArquivo.push('TRAVA_SEGURANCA');
    if (metricasHeuristicas.portasSaida?.pdf) tagsArquivo.push('PORTA_PDF');
    if (metricasHeuristicas.portasSaida?.whatsapp) tagsArquivo.push('PORTA_WHATSAPP');
    if (metricasHeuristicas.portasSaida?.email) tagsArquivo.push('PORTA_EMAIL');
    if (metricasHeuristicas.portasSaida?.pagamento) tagsArquivo.push('PORTA_PAGAMENTO');
    if (metricasHeuristicas.atualizacao?.temDetectorVersao) tagsArquivo.push('DETECTOR_ATUALIZACAO');
    if (metricasHeuristicas.modalArrasto?.vulneravel) tagsArquivo.push('MODAL_FECHA_AO_ARRASTAR');
    if (metricasHeuristicas.modalArrasto?.blindado) tagsArquivo.push('MODAL_BLINDADA');
  }

  return {
    id: metadadosScanner.caminhoRelativo,
    arquivo: metadadosScanner.caminhoRelativo,
    nome: metadadosScanner.nomeArquivo,
    pasta: metadadosScanner.pasta,
    extensao: metadadosScanner.extensao,
    tamanhoBytes: metadadosScanner.tamanhoBytes,
    tamanhoKB: metadadosScanner.tamanhoKB,
    totalLinhas: metadadosScanner.totalLinhas,
    mtimeMs: metadadosScanner.mtimeMs,
    mtimeISO: metadadosScanner.mtimeISO,
    isCodigo: metadadosScanner.isCodigo,
    isConfigGlobal: metadadosScanner.isConfigGlobal,
    tags: tagsArquivo,
    diagnostico: metricasHeuristicas || null
  };
}
