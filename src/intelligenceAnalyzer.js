/**
 * Fase 6 & Etapa 2: O Cérebro Detetive (Intelligence Analyzer)
 * Realiza os cruzamentos inteligentes de dados:
 * 1. Árvore de Efeito Dominó Completa (Direto e Indireto em profundidade)
 * 2. Detector de Cálculos e Telas "Gêmeas" (Avisos de duplicidade para a IA)
 * 3. Roteiro de Auto-Verificação Pós-Mudança (Checklists personalizados)
 * 4. Calculadora de Economia de Tokens
 * 5. Agregador de KPIs de Saúde e Custos para o Dashboard
 */

/**
 * Calcula a árvore completa de Efeito Dominó (Ascendentes e Descendentes diretos e indiretos).
 * @param {string} arquivoAlvo - Caminho do arquivo a ser modificado.
 * @param {Array} arestas - Todas as arestas mapeadas no projeto.
 * @param {number} profundidadeMax - Limite de saltos para evitar loops infinitos.
 * @returns {Object} Mapa de impacto detalhado.
 */
export function calcularEfeitoDomino(arquivoAlvo, arestas, profundidadeMax = 5) {
  const diretosAsc = new Set();
  const diretosDesc = new Set();
  const indiretosAsc = new Set();
  const indiretosDesc = new Set();

  // 1. Impacto Direto (1º grau)
  arestas.forEach(e => {
    if (e.destino === arquivoAlvo) diretosAsc.add(e.origem);
    if (e.origem === arquivoAlvo) diretosDesc.add(e.destino);
  });

  // 2. Impacto Indireto (2º grau em diante) - Ascendentes (Quem quebra se eu mudar este arquivo?)
  let nivelAtualAsc = new Set(diretosAsc);
  let profundidade = 1;
  const visitadosAsc = new Set([arquivoAlvo, ...diretosAsc]);

  while (nivelAtualAsc.size > 0 && profundidade < profundidadeMax) {
    const proximoNivel = new Set();
    for (const arq of nivelAtualAsc) {
      arestas.forEach(e => {
        if (e.destino === arq && !visitadosAsc.has(e.origem)) {
          visitadosAsc.add(e.origem);
          indiretosAsc.add(e.origem);
          proximoNivel.add(e.origem);
        }
      });
    }
    nivelAtualAsc = proximoNivel;
    profundidade++;
  }

  // 3. Impacto Indireto - Descendentes (De quem meu arquivo depende em cadeia?)
  let nivelAtualDesc = new Set(diretosDesc);
  profundidade = 1;
  const visitadosDesc = new Set([arquivoAlvo, ...diretosDesc]);

  while (nivelAtualDesc.size > 0 && profundidade < profundidadeMax) {
    const proximoNivel = new Set();
    for (const arq of nivelAtualDesc) {
      arestas.forEach(e => {
        if (e.origem === arq && !visitadosDesc.has(e.destino)) {
          visitadosDesc.add(e.destino);
          indiretosDesc.add(e.destino);
          proximoNivel.add(e.destino);
        }
      });
    }
    nivelAtualDesc = proximoNivel;
    profundidade++;
  }

  const todosAfetados = Array.from(new Set([
    arquivoAlvo,
    ...diretosAsc, ...indiretosAsc,
    ...diretosDesc, ...indiretosDesc
  ]));

  return {
    alvo: arquivoAlvo,
    impactoDireto: {
      ascendentesQueQuebram: Array.from(diretosAsc),
      descendentesNecessarios: Array.from(diretosDesc)
    },
    impactoIndireto: {
      ascendentesSecundarios: Array.from(indiretosAsc),
      descendentesSecundarios: Array.from(indiretosDesc)
    },
    totalArquivosEnvolvidos: todosAfetados.length,
    listaCompletaAfetados: todosAfetados
  };
}

/**
 * Detecta lógicas, cálculos e telas gêmeas no projeto.
 * Compara arquivos que consultam as mesmas tabelas do banco, têm nomes semelhantes
 * ou formulários parecidos para evitar que a IA atualize um e esqueça o outro.
 * 
 * @param {Array} listaArquivos - Fichas dos arquivos geradas pelo normalizer.
 * @returns {Array} Lista de pares ou grupos de arquivos gêmeos com instrução explícita para a IA.
 */
export function detectarLogicasGemeas(listaArquivos) {
  const arquivosCodigo = listaArquivos.filter(f => f.isCodigo && f.diagnostico);
  const paresGemeos = [];
  const jaComparados = new Set();

  for (let i = 0; i < arquivosCodigo.length; i++) {
    const arqA = arquivosCodigo[i];
    const tabelasA = arqA.diagnostico.banco?.tabelasConsultadas || [];

    for (let j = i + 1; j < arquivosCodigo.length; j++) {
      const arqB = arquivosCodigo[j];
      const chavePar = `${arqA.arquivo} <-> ${arqB.arquivo}`;
      if (jaComparados.has(chavePar)) continue;
      jaComparados.add(chavePar);

      const tabelasB = arqB.diagnostico.banco?.tabelasConsultadas || [];

      // 1. Interseção de tabelas de banco de dados
      const tabelasEmComum = tabelasA.filter(t => tabelasB.includes(t));

      // 2. Similaridade de nome de arquivo (ex: NovoPedido.tsx e EditarPedido.tsx)
      const nomeBaseA = arqA.nome.replace(/\.[^.]+$/, '').toLowerCase();
      const nomeBaseB = arqB.nome.replace(/\.[^.]+$/, '').toLowerCase();
      
      const palavrasA = nomeBaseA.split(/(?=[A-Z])|[-_]/).filter(p => p.length > 2);
      const palavrasB = nomeBaseB.split(/(?=[A-Z])|[-_]/).filter(p => p.length > 2);
      const palavrasEmComum = palavrasA.filter(p => palavrasB.includes(p));

      let motivoSimilaridade = null;
      let grau = 0;

      if (tabelasEmComum.length >= 2) {
        grau = 90;
        motivoSimilaridade = `Consultam as mesmas ${tabelasEmComum.length} tabelas do banco (${tabelasEmComum.join(', ')})`;
      } else if (tabelasEmComum.length === 1 && palavrasEmComum.length >= 1) {
        grau = 85;
        motivoSimilaridade = `Trabalham com o mesmo domínio (${palavrasEmComum.join(', ')}) e acessam a tabela '${tabelasEmComum[0]}'`;
      } else if (palavrasEmComum.length >= 2) {
        grau = 70;
        motivoSimilaridade = `Nomes e estruturas de telas muito parecidas (${palavrasEmComum.join(', ')})`;
      } else if (
        arqA.diagnostico.formulario?.temFormulario &&
        arqB.diagnostico.formulario?.temFormulario &&
        tabelasEmComum.length >= 1
      ) {
        grau = 80;
        motivoSimilaridade = `Formulários que alimentam a mesma tabela '${tabelasEmComum[0]}'`;
      }

      if (motivoSimilaridade) {
        paresGemeos.push({
          arquivoA: arqA.arquivo,
          arquivoB: arqB.arquivo,
          grauSimilaridade: `${grau}%`,
          motivo: motivoSimilaridade,
          tabelasCompartilhadas: tabelasEmComum,
          instrucaoObrigatoriaParaIA: `⚠️ ATENÇÃO IA: Se você alterar regras de negócio, cálculos ou dados em '${arqA.arquivo}', avise o usuário no chat que o arquivo '${arqB.arquivo}' possui lógica similar (${motivoSimilaridade}) e pergunte se deve sincronizar a alteração nele também.`
        });
      }
    }
  }

  return paresGemeos;
}

/**
 * Gera o Roteiro de Auto-Verificação (Checklist) pós-mudança para a IA executar sozinha.
 * @param {string} arquivoAlvo - Arquivo que a IA pretende mudar.
 * @param {Array} listaArquivos - Fichas dos arquivos.
 * @param {Object} domino - Árvore de impacto calculada.
 * @param {Array} gemeos - Lista de arquivos gêmeos.
 * @returns {Array} Passos do checklist.
 */
export function gerarChecklistParaArquivo(arquivoAlvo, listaArquivos, domino, gemeos = []) {
  const ficha = listaArquivos.find(f => f.arquivo === arquivoAlvo);
  const checklist = [];

  // Passo 1: Dependências diretas
  if (domino.impactoDireto.ascendentesQueQuebram.length > 0) {
    checklist.push({
      item: "Compatibilidade de Tipos e Parâmetros",
      descricao: `Verificar se os dados retornados continuam batendo com as telas dependentes: [${domino.impactoDireto.ascendentesQueQuebram.join(', ')}].`
    });
  }

  // Passo 2: Travas de Segurança
  if (ficha?.diagnostico?.seguranca?.temTravas) {
    const travas = ficha.diagnostico.seguranca.travas.map(t => `Linha ${t.linha}: "${t.codigo}"`).join(' | ');
    checklist.push({
      item: "Preservação de Travas de Segurança (Admin/Role)",
      descricao: `CUIDADO: Não remover nem burlar as verificações de permissão existentes: ${travas}.`
    });
  }

  // Passo 3: Lógicas Gêmeas
  const gemeosDoArquivo = gemeos.filter(g => g.arquivoA === arquivoAlvo || g.arquivoB === arquivoAlvo);
  if (gemeosDoArquivo.length > 0) {
    const outros = gemeosDoArquivo.map(g => g.arquivoA === arquivoAlvo ? g.arquivoB : g.arquivoA);
    checklist.push({
      item: "Sincronização de Lógicas Gêmeas",
      descricao: `Avisar o usuário no chat sobre possíveis impactos em arquivos irmãos: [${[...new Set(outros)].join(', ')}].`
    });
  }

  // Passo 4: Proteção de Cache / Formulário
  if (ficha?.diagnostico?.formulario?.alertaPerdaDados) {
    checklist.push({
      item: "Proteção contra Perda de Dados Digitados",
      descricao: `Este formulário não possui rascunho automático em localStorage. Recomende ao usuário implementar cache temporário para evitar perda de dados.`
    });
  }

  // Passo 5: Portas de Saída
  if (ficha?.diagnostico?.portasSaida?.pdf || ficha?.diagnostico?.portasSaida?.whatsapp || ficha?.diagnostico?.portasSaida?.pagamento) {
    checklist.push({
      item: "Validação de Portas de Saída Externas",
      descricao: `Validar se a geração de relatórios/documentos ou integrações de pagamento continuam com os mesmos parâmetros esperados.`
    });
  }

  // Passo final padrão
  checklist.push({
    item: "Validação de Compilação",
    descricao: "Verificar se não foram gerados erros de sintaxe ou imports quebrados após salvar o arquivo."
  });

  return checklist;
}

/**
 * Calcula a estimativa de Economia de Tokens gerada pelo Mapa Contexto para a IA.
 * @param {Array} listaArquivos - Fichas dos arquivos.
 * @param {Object} domino - Impacto de um arquivo ou média geral.
 * @returns {Object} Estimativa de tokens economizados.
 */
export function calcularEconomiaTokens(listaArquivos, domino = null) {
  const arquivosCodigo = listaArquivos.filter(f => f.isCodigo);
  const totalLinhasGeral = arquivosCodigo.reduce((acc, f) => acc + (f.totalLinhas || 0), 0);
  const totalArquivos = arquivosCodigo.length;

  let arquivosAfetados = totalArquivos;
  let linhasAfetadas = totalLinhasGeral;

  if (domino && domino.totalArquivosEnvolvidos > 0) {
    arquivosAfetados = domino.totalArquivosEnvolvidos;
    const fEnvolvidas = arquivosCodigo.filter(f => domino.listaCompletaAfetados.includes(f.arquivo));
    linhasAfetadas = fEnvolvidas.reduce((acc, f) => acc + (f.totalLinhas || 0), 0);
  } else {
    // Estimativa média do projeto (um pedido comum afeta ~3 a 5 arquivos)
    arquivosAfetados = Math.min(totalArquivos, Math.max(2, Math.round(totalArquivos * 0.08)));
    linhasAfetadas = Math.round(totalLinhasGeral * 0.08);
  }

  const linhasEconomizadas = Math.max(0, totalLinhasGeral - linhasAfetadas);
  const arquivosEconomizados = Math.max(0, totalArquivos - arquivosAfetados);
  
  // Regra padrão do mercado: ~8 tokens por linha de código em média
  const tokensEconomizadosEstimados = linhasEconomizadas * 8;
  const porcentagemEconomia = totalLinhasGeral > 0 
    ? Number(((linhasEconomizadas / totalLinhasGeral) * 100).toFixed(1))
    : 0;

  return {
    totalArquivosProjeto: totalArquivos,
    totalLinhasProjeto: totalLinhasGeral,
    arquivosIsoladosPeloMapa: arquivosAfetados,
    arquivosQueAIAEconomizouDeLer: arquivosEconomizados,
    linhasEconomizadas,
    tokensEconomizadosEstimados,
    porcentagemEconomia: `${porcentagemEconomia}%`,
    explicacaoComercial: `O Mapa Contexto isolou cirurgicamente apenas ${arquivosAfetados} arquivos necessários, evitando que a IA leia ${arquivosEconomizados} arquivos no escuro (~${tokensEconomizadosEstimados.toLocaleString('pt-BR')} tokens economizados neste pedido!).`
  };
}

/**
 * Consolida o Relatório Geral de Saúde, Memória e Custos do Projeto.
 * @param {Array} listaArquivos - Fichas dos arquivos.
 * @param {Array} arestas - Arestas de dependência.
 * @returns {Object} Dossiê completo para o Dashboard executivo e para a IA.
 */
export function gerarRelatorioSaude(listaArquivos, arestas) {
  const arquivosCodigo = listaArquivos.filter(f => f.isCodigo);
  
  // 1. Todas as Tabelas de Banco
  const todasTabelas = new Set();
  const consultasPorTabela = {};

  arquivosCodigo.forEach(f => {
    const tabs = f.diagnostico?.banco?.tabelasConsultadas || [];
    tabs.forEach(t => {
      todasTabelas.add(t);
      consultasPorTabela[t] = (consultasPorTabela[t] || 0) + 1;
    });
  });

  // 2. Ranking de Custos de Banco (Vilões)
  const viloesCustoBanco = [];
  arquivosCodigo.forEach(f => {
    const b = f.diagnostico?.banco;
    if (!b) return;

    const isTesteOuRascunho = /(?:debug_|test_|\.test\.|\.spec\.|__tests__|\.backup|temp_|mock|check_schema)/i.test(f.arquivo);

    let pontosGravidade = 0;
    const problemas = [];

    if (b.buscaEmLoop) {
      pontosGravidade += 50;
      problemas.push("🔥 Viagens repetidas ao banco (busca de dados dentro de uma lista)");
    }
    if (b.selectAllSemFiltro) {
      pontosGravidade += 30;
      problemas.push("⚠️ Busca de tabela inteira de uma vez só (sem limite de linhas)");
    }
    if (b.escutasRealtime > 0) {
      pontosGravidade += 20;
      problemas.push(`📡 Conexão em tempo real aberta direto (${b.escutasRealtime} conexões ativas)`);
    }
    // Só alerta por quantidade de consultas se forem 8+ queries ou se houver loop/selectAll
    if (b.totalConsultas >= 8 || (b.totalConsultas >= 4 && (b.buscaEmLoop || b.selectAllSemFiltro))) {
      pontosGravidade += 15;
      problemas.push(`📊 Tela muito movimentada (faz ${b.totalConsultas} consultas ao banco)`);
    }

    if (pontosGravidade > 0) {
      viloesCustoBanco.push({
        arquivo: f.arquivo,
        pontosGravidade,
        gravidade: pontosGravidade >= 50 ? 'CRÍTICA' : (pontosGravidade >= 30 ? 'ALTA' : 'MÉDIA'),
        problemas,
        tabelas: b.tabelasConsultadas,
        totalConsultas: b.totalConsultas,
        isRascunhoTeste: isTesteOuRascunho
      });
    }
  });

  viloesCustoBanco.sort((a, b) => b.pontosGravidade - a.pontosGravidade);

  // 3. Monitor de Memória e Peso na Tela
  const viloesMemoria = [];
  arquivosCodigo.forEach(f => {
    const m = f.diagnostico?.memoria;
    if (!m) return;

    const isTesteOuRascunho = /(?:debug_|test_|\.test\.|\.spec\.|__tests__|\.backup|temp_|mock)/i.test(f.arquivo);

    const alertas = [];
    if (m.arquivoGigante) alertas.push(`📄 Arquivo muito longo (${f.totalLinhas} linhas - difícil de manter)`);
    if (m.listaSemPaginacao) alertas.push("📜 Lista longa sem paginação (risco de lentidão ou travamento no celular)");
    if (m.manipulacaoPesadaMemoria) alertas.push("💾 Manipulação pesada na memória (arquivos, fotos ou PDFs grandes)");

    if (alertas.length > 0) {
      viloesMemoria.push({
        arquivo: f.arquivo,
        totalLinhas: f.totalLinhas,
        tamanhoKB: f.tamanhoKB,
        alertas,
        isRascunhoTeste: isTesteOuRascunho
      });
    }
  });

  viloesMemoria.sort((a, b) => (b.totalLinhas || 0) - (a.totalLinhas || 0));

  // 4. Formulários em Risco (Sem Cache de Rascunho)
  const formulariosSemCache = arquivosCodigo
    .filter(f => f.diagnostico?.formulario?.alertaPerdaDados)
    .map(f => {
      const isTesteOuRascunho = /(?:debug_|test_|\.test\.|\.spec\.|__tests__|\.backup|temp_|mock)/i.test(f.arquivo);
      return {
        arquivo: f.arquivo,
        totalInputs: f.diagnostico.formulario.totalInputs,
        totalEstados: f.diagnostico.formulario.totalEstados,
        aviso: "Campos de digitação sem rascunho automático (se o usuário fechar a aba ou a internet cair, perde o que digitou).",
        isRascunhoTeste: isTesteOuRascunho
      };
    });

  // 5. Portas de Saída e Identidade Global
  const portasSaida = {
    relatoriosPdf: arquivosCodigo.filter(f => f.diagnostico?.portasSaida?.pdf).map(f => f.arquivo),
    whatsapp: arquivosCodigo.filter(f => f.diagnostico?.portasSaida?.whatsapp).map(f => f.arquivo),
    email: arquivosCodigo.filter(f => f.diagnostico?.portasSaida?.email).map(f => f.arquivo),
    pagamentos: arquivosCodigo.filter(f => f.diagnostico?.portasSaida?.pagamento).map(f => f.arquivo),
    nuvemExterna: arquivosCodigo.filter(f => f.diagnostico?.portasSaida?.nuvemExterna).map(f => f.arquivo),
    identidadeGlobal: listaArquivos.filter(f => f.isConfigGlobal).map(f => f.arquivo)
  };

  // 6. Travas de Segurança Mapeadas
  const arquivosComSeguranca = arquivosCodigo
    .filter(f => f.diagnostico?.seguranca?.temTravas)
    .map(f => ({
      arquivo: f.arquivo,
      travas: f.diagnostico.seguranca.travas
    }));

  // 7. Distribuição de Pastas e Maiores Arquivos
  const pastasDistribuicao = {};
  listaArquivos.forEach(f => {
    const pasta = f.pasta || 'raiz';
    if (!pastasDistribuicao[pasta]) {
      pastasDistribuicao[pasta] = { totalArquivos: 0, totalBytes: 0, totalLinhas: 0 };
    }
    pastasDistribuicao[pasta].totalArquivos++;
    pastasDistribuicao[pasta].totalBytes += (f.tamanhoBytes || 0);
    pastasDistribuicao[pasta].totalLinhas += (f.totalLinhas || 0);
  });

  const maioresArquivos = [...arquivosCodigo]
    .sort((a, b) => (b.totalLinhas || 0) - (a.totalLinhas || 0))
    .slice(0, 10)
    .map(f => ({
      arquivo: f.arquivo,
      linhas: f.totalLinhas,
      tamanhoKB: f.tamanhoKB
    }));

  // 8. Cruzamentos Avançados e Algoritmo PageRank (Inspirado no Aider Repo Map)
  const logicasGemeas = detectarLogicasGemeas(listaArquivos);
  const economiaTokens = calcularEconomiaTokens(listaArquivos);
  const scoresPageRank = calcularPageRank(listaArquivos, arestas);
  const arquivosDeus = identificarGodNodes(listaArquivos, arestas, scoresPageRank);

  // 9. Diagnóstico do Sistema de Atualização Automática (Sem Ctrl+F5)
  const arquivosComDetector = listaArquivos.filter(f =>
    f.nome?.toLowerCase() === 'version.json' ||
    f.diagnostico?.atualizacao?.temDetectorVersao
  );
  const temProtecaoAtualizacao = arquivosComDetector.length > 0;
  const isReactOuVite = listaArquivos.some(f =>
    ['.tsx', '.jsx'].includes(f.extensao) ||
    f.nome?.startsWith('vite.config') ||
    f.nome?.startsWith('next.config')
  );
  const tecnologiaDetectada = isReactOuVite
    ? 'React / TypeScript (Vite ou Next.js)'
    : 'HTML, CSS e JavaScript Puro (Vanilla JS)';

  const arquivoEntradaSugerido = isReactOuVite
    ? (listaArquivos.find(f => /App\.(tsx|jsx|js)$/i.test(f.arquivo))?.arquivo || 'src/App.tsx')
    : (listaArquivos.find(f => /^(app|main|index|script)\.js$/i.test(f.nome))?.arquivo || 'app.js');

  const statusAtualizacaoApp = {
    temProtecao: temProtecaoAtualizacao,
    tecnologiaDetectada,
    arquivoEntradaSugerido,
    arquivosOndeFoiEncontrado: arquivosComDetector.map(f => ({
      arquivo: f.arquivo,
      evidencias: f.diagnostico?.atualizacao?.evidencias || ['Arquivo de versão detectado']
    })),
    statusResumo: temProtecaoAtualizacao
      ? '✅ PROTEGIDO: O aplicativo já possui detector de nova versão (não exige Ctrl+F5).'
      : '🚨 AUSENTE NO PROJETO: O aplicativo NÃO possui aviso automático de atualização (usuários ficam presos na versão antiga sem Ctrl+F5).',
    explicacaoLeiga: 'Quando você sobe uma melhoria para o ar, o navegador do celular ou computador costuma guardar os arquivos velhos na memória (cache). Sem esse detector, o usuário continua vendo o aplicativo antigo ou toma erro de tela branca até apertar Ctrl+F5. Com essa proteção, o próprio app percebe que saiu versão nova e mostra um aviso elegante: "🚀 O sistema foi atualizado! [ Atualizar Agora ]".',
    instrucaoCompletaParaIA: temProtecaoAtualizacao
      ? `O projeto já possui detecção de atualização nos arquivos: ${arquivosComDetector.map(f => f.arquivo).join(', ')}. Mantenha esse mecanismo intacto ao fazer alterações.`
      : isReactOuVite
        ? `🛠️ ROTEIRO PARA A IA IMPLEMENTAR O AVISO DE ATUALIZAÇÃO (PROJETO REACT / VITE):
1. Crie o arquivo 'public/version.json' contendo:
   { "version": "1.0.0", "updatedAt": "${new Date().toISOString()}" }
2. Crie o componente 'src/components/UpdateNotificationBanner.tsx' (ou adicione no '${arquivoEntradaSugerido}') que:
   a) Escute o erro de arquivo antigo do Vite:
      window.addEventListener('vite:preloadError', () => window.location.reload());
   b) Guarde a versão inicial carregada e consulte 'fetch("/version.json?t=" + Date.now(), { cache: "no-store" })' quando o usuário voltar para a aba (evento 'visibilitychange') e a cada 5 minutos.
   c) Se a versão do servidor for diferente da versão inicial, exiba uma barra flutuante elegante no topo da tela dizendo:
      "🚀 Uma nova versão do aplicativo está disponível! [ 🔄 Atualizar Agora ]"
   d) Ao clicar no botão, limpe caches se houver e execute 'window.location.reload()'.`
        : `🛠️ ROTEIRO PARA A IA IMPLEMENTAR O AVISO DE ATUALIZAÇÃO (PROJETO HTML / JAVASCRIPT PURO):
1. Crie um arquivo 'version.json' na mesma pasta do 'index.html' contendo:
   { "version": "1.0.0", "updatedAt": "${new Date().toISOString()}" }
2. No arquivo principal ('${arquivoEntradaSugerido}'), adicione a função 'iniciarDetectorDeAtualizacao()':
   a) Ao abrir o app, busque 'fetch("./version.json?t=" + Date.now(), { cache: "no-store" })' e salve a versão atual em uma variável 'versaoInicialApp'.
   b) Sempre que o usuário voltar para a aba do aplicativo ('document.addEventListener("visibilitychange", ...)') ou a cada 5 minutos, busque novamente o 'version.json?t=' + Date.now().
   c) Se a versão do arquivo mudou em relação à 'versaoInicialApp', crie um banner flutuante bonito e fixo no topo da tela:
      "🚀 O sistema recebeu melhorias! Clique para carregar a nova versão. [ 🔄 Atualizar Agora ]"
   d) No clique do botão, chame 'window.location.reload()' para recarregar tudo limpo sem precisar de Ctrl+F5.`
  };

  // 10. Diagnóstico de Janelas Modais Vulneráveis a Fechamento ao Arrastar Texto
  const arquivosModaisVulneraveis = listaArquivos
    .filter(f => f.diagnostico?.modalArrasto?.vulneravel)
    .map(f => ({
      arquivo: f.arquivo,
      linhasVulneraveis: f.diagnostico.modalArrasto.linhasVulneraveis
    }));

  const arquivosModaisBlindadas = listaArquivos
    .filter(f => f.diagnostico?.modalArrasto?.blindado)
    .map(f => f.arquivo);

  const temModaisNoProjeto = listaArquivos.some(f => f.diagnostico?.modalArrasto?.temModal);
  const temProblemaModalArrasto = arquivosModaisVulneraveis.length > 0;

  const listaArquivosVulneraveisTexto = arquivosModaisVulneraveis
    .map(a => `- '${a.arquivo}' (Linhas: ${a.linhasVulneraveis.map(l => l.linha).join(', ')})`)
    .join('\n');

  const statusModalArrasto = {
    temProblema: temProblemaModalArrasto,
    temModaisNoProjeto,
    totalArquivosVulneraveis: arquivosModaisVulneraveis.length,
    arquivosVulneraveis: arquivosModaisVulneraveis,
    arquivosBlindados: arquivosModaisBlindadas,
    statusResumo: temProblemaModalArrasto
      ? `🚨 VULNERÁVEL (${arquivosModaisVulneraveis.length} arquivo(s)): Janelas modais fecham sozinhas quando você seleciona um texto e solta o botão do mouse do lado de fora!`
      : (arquivosModaisBlindadas.length > 0
          ? `✅ PROTEGIDO: As janelas modais do app estão blindadas contra fechamento acidental ao arrastar o mouse.`
          : `✅ Nenhuma janela modal com fechamento vulnerável ao arrastar texto foi detectada.`),
    explicacaoLeiga: 'Sabe quando você está editando um campo dentro de uma janelinha (modal), seleciona um texto com o mouse para apagar ou copiar e, sem querer, solta o botão do mouse do lado de fora da janela — e ela fecha na sua cara apagando o que você estava fazendo? Isso acontece porque a IA colocou o fechamento no evento onClick (que dispara ao SOLTAR o mouse), em vez de verificar onde o clique COMEÇOU (onMouseDown).',
    instrucaoCompletaParaIA: temProblemaModalArrasto
      ? `🛠️ CORREÇÃO OBRIGATÓRIA — BLINDAGEM DE MODAIS CONTRA FECHAMENTO AO ARRASTAR TEXTO:
O Mapa Contexto detectou janelas modais vulneráveis nos seguintes arquivos:
${listaArquivosVulneraveisTexto}

COMO CORRIGIR DE FORMA DEFINITIVA (SEM QUEBRAR NADA):
1. NUNCA feche o fundo escuro (overlay/backdrop) de uma modal usando 'onClick' (ou 'onclick' / 'addEventListener("click")'). Mesmo com 'e.stopPropagation()' no cartão interno ou 'if (e.target === e.currentTarget)' dentro de 'onClick', o navegador ainda dispara o clique no fundo quando o usuário começa a arrastar dentro de um input e solta o mouse fora!
2. Em React/JSX/TSX, troque o fechamento no overlay para 'onMouseDown' checando se o clique COMEÇOU no fundo:
   ❌ ERRADO: <div className="fixed inset-0 ..." onClick={() => fechar()}>
   ✅ CERTO:  <div className="fixed inset-0 ..." onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
   (E no cartão interno da modal, use onMouseDown={(e) => e.stopPropagation()} ou apenas confie no 'e.target === e.currentTarget' do pai!)
3. Em HTML/JavaScript Puro, troque 'onclick' / 'addEventListener("click", ...)' do overlay para 'onmousedown' / 'addEventListener("mousedown", (e) => { if (e.target === e.currentTarget) fechar(); })'.
4. REGRA PERMANENTE: Sempre que criar qualquer nova janela modal neste projeto, aplique essa blindagem desde o primeiro segundo!`
      : `As janelas modais atuais não apresentaram vulnerabilidade de onClick no backdrop. Ao criar novas modais, SEMPRE use onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }} no fundo escuro.`
  };

  return {
    kpisResumo: {
      totalArquivos: listaArquivos.length,
      totalArquivosCodigo: arquivosCodigo.length,
      totalTabelasBanco: todasTabelas.size,
      totalAlertasCustoBanco: viloesCustoBanco.length,
      totalFormulariosSemCache: formulariosSemCache.length,
      totalParesGemeosDetectados: logicasGemeas.length,
      totalTravasSeguranca: arquivosComSeguranca.reduce((acc, a) => acc + a.travas.length, 0),
      totalArquivosDeus: arquivosDeus.length,
      temDetectorAtualizacao: temProtecaoAtualizacao,
      totalModaisVulneraveis: arquivosModaisVulneraveis.length
    },
    statusAtualizacaoApp,
    statusModalArrasto,
    tabelasBanco: {
      lista: Array.from(todasTabelas),
      contagemPorTabela: consultasPorTabela
    },
    viloesCustoBanco,
    viloesMemoria,
    formulariosSemCache,
    portasSaida,
    seguranca: arquivosComSeguranca,
    logicasGemeas,
    economiaTokens,
    distribuicaoPastas: pastasDistribuicao,
    maioresArquivos,
    pageRank: scoresPageRank,
    arquivosDeus
  };
}

/**
 * Algoritmo PageRank do Google aplicado à topologia de código (Inspirado no Aider Repo Map).
 * Calcula a centralidade e influência matemática de cada arquivo no projeto.
 * 
 * @param {Array} listaArquivos - Fichas dos arquivos.
 * @param {Array} arestas - Dependências do grafo.
 * @param {number} iteracoes - Número de iterações de potências (padrão 20).
 * @param {number} d - Fator de amortecimento (damping factor, padrão 0.85).
 * @returns {Object} Mapa de { [arquivo]: score_0_a_100 }.
 */
export function calcularPageRank(listaArquivos, arestas, iteracoes = 20, d = 0.85) {
  const arquivos = listaArquivos.filter(f => f.isCodigo).map(f => f.arquivo);
  const N = arquivos.length;
  if (N === 0) return {};

  let pr = {};
  const inDegree = {};
  const outDegree = {};

  arquivos.forEach(a => {
    pr[a] = 1.0 / N;
    inDegree[a] = [];
    outDegree[a] = 0;
  });

  arestas.forEach(e => {
    if (outDegree[e.origem] !== undefined && inDegree[e.destino] !== undefined) {
      inDegree[e.destino].push(e.origem);
      outDegree[e.origem]++;
    }
  });

  for (let it = 0; it < iteracoes; it++) {
    const novoPr = {};
    let danglingSum = 0;

    // Nós sem saída (dangling nodes) distribuem seu peso igualmente
    arquivos.forEach(a => {
      if (outDegree[a] === 0) danglingSum += pr[a];
    });

    arquivos.forEach(u => {
      let somaInfluencia = 0;
      inDegree[u].forEach(v => {
        somaInfluencia += pr[v] / outDegree[v];
      });

      novoPr[u] = ((1.0 - d) / N) + d * (somaInfluencia + (danglingSum / N));
    });

    pr = novoPr;
  }

  // Normaliza os scores para uma escala humana intuitiva de 0 a 100
  const maxScore = Math.max(...Object.values(pr), 0.00001);
  const scoresNormalizados = {};
  for (const [arq, score] of Object.entries(pr)) {
    scoresNormalizados[arq] = Number(((score / maxScore) * 100).toFixed(1));
  }

  return scoresNormalizados;
}

/**
 * Identifica os "Arquivos-Deus" (God Nodes / Hubs Centrais da Arquitetura).
 * Arquivos que possuem alto score no PageRank ou concentram dezenas de dependentes.
 * Se esses arquivos quebrarem, o sistema sofre colapso em cadeia.
 */
export function identificarGodNodes(listaArquivos, arestas, scoresPageRank) {
  const dependentesContagem = {};
  arestas.forEach(e => {
    dependentesContagem[e.destino] = (dependentesContagem[e.destino] || 0) + 1;
  });

  const godNodes = [];
  listaArquivos.filter(f => f.isCodigo).forEach(f => {
    const score = scoresPageRank[f.arquivo] || 0;
    const dependentes = dependentesContagem[f.arquivo] || 0;

    // Critério: score >= 60 no PageRank OU mais de 6 arquivos dependendo dele
    if (score >= 60 || dependentes >= 6) {
      godNodes.push({
        arquivo: f.arquivo,
        scorePageRank: score,
        dependentesDiretos: dependentes,
        alerta: `👑 Pilar Mestre do Sistema: ${dependentes} arquivos dependem dele diretamente. Risco de efeito dominó se for alterado sem cuidado.`
      });
    }
  });

  godNodes.sort((a, b) => b.scorePageRank - a.scorePageRank);
  return godNodes;
}
