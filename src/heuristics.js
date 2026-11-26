/**
 * Fase 5 & Etapa 1: O Rastreador de Lógicas Invisíveis (Super-Sensores de Heurísticas)
 * Inspeciona o interior das funções e dos arquivos completos procurando por:
 * 1. Custos de Banco (Queries caras, loops e escutas realtime)
 * 2. Risco de Perda de Dados (Formulários sem rascunho em cache)
 * 3. Peso de Memória na Tela (Arquivos gigantes, listas sem paginação)
 * 4. Portas de Saída e Identidade Global (PDFs, WhatsApp, APIs externas)
 * 5. Travas Críticas de Segurança e Permissões (Admin, Roles)
 */

/**
 * Analisa uma função (nó AST) individualmente procurando tags de comportamento e risco.
 * @param {Object} noFuncao - O nó AST da função extraído pelo Tree-sitter.
 * @returns {string[]} Lista de tags encontradas.
 */
export function detectarHeuristicas(noFuncao) {
  const tagsEncontradas = new Set();
  
  const gatilhosMutacaoDB = ['query', 'execute', 'insert', 'update', 'delete', 'save', 'upsert', 'mutate', 'remove', 'destroy'];
  const gatilhosLeituraDB = ['select', 'find', 'findall', 'findmany', 'findunique', 'findfirst', 'get', 'fetch'];
  const gatilhosRealtime = ['onsnapshot', 'subscribe', 'channel', 'listen'];
  const gatilhosDocs = ['jspdf', 'pdfmake', 'html2canvas', 'print'];
  const gatilhosComunicacao = ['whatsapp', 'wa.me', 'mailto', 'sendemail', 'nodemailer', 'resend', 'twilio'];
  const gatilhosSeguranca = ['isadmin', 'role', 'permissao', 'permission', 'canaccess', 'authorize', 'userrole'];

  // Verifica se o nó está dentro de um laço de repetição tradicional
  function checarSeEstaEmLoop(no) {
    let pai = no.parent;
    while (pai) {
      if ([
        'for_statement', 'for_in_statement', 'while_statement', 'do_statement'
      ].includes(pai.type)) {
        return true;
      }
      pai = pai.parent;
    }
    return false;
  }

  function varrerEntranhas(no) {
    if (no.type === 'call_expression') {
      const metodoChamado = no.childForFieldName('function');
      
      if (metodoChamado) {
        let nomeAcao = null;

        if (metodoChamado.type === 'member_expression') {
          const propriedade = metodoChamado.childForFieldName('property');
          if (propriedade) nomeAcao = propriedade.text;
        } else if (metodoChamado.type === 'identifier') {
          nomeAcao = metodoChamado.text;
        }

        if (nomeAcao) {
          const nomeLower = nomeAcao.toLowerCase();

          // 1. Mutação no Banco (Zona Radioativa)
          if (gatilhosMutacaoDB.includes(nomeLower)) {
            tagsEncontradas.add('DATABASE_MUTATION');
            if (checarSeEstaEmLoop(no)) {
              tagsEncontradas.add('DB_QUERY_IN_LOOP');
            }
          }

          // 2. Leitura no Banco
          if (gatilhosLeituraDB.includes(nomeLower)) {
            if (checarSeEstaEmLoop(no)) {
              tagsEncontradas.add('DB_QUERY_IN_LOOP');
            }
          }

          // 3. Escuta em Tempo Real
          if (gatilhosRealtime.some(g => nomeLower.includes(g))) {
            tagsEncontradas.add('DB_REALTIME_LISTENER');
          }

          // 4. Documentos / Impressão
          if (gatilhosDocs.some(g => nomeLower.includes(g))) {
            tagsEncontradas.add('EXPORT_DOCUMENT');
          }

          // 5. Comunicação Externa
          if (gatilhosComunicacao.some(g => nomeLower.includes(g))) {
            tagsEncontradas.add('EXTERNAL_COMMUNICATION');
          }
        }
      }
    }

    // Checagem de Trava de Segurança em identificadores / condições
    if (no.type === 'identifier') {
      const idLower = no.text.toLowerCase();
      if (gatilhosSeguranca.some(g => idLower === g || idLower.includes(g))) {
        tagsEncontradas.add('SECURITY_PERMISSION_CHECK');
      }
    }

    for (let i = 0; i < no.childCount; i++) {
      varrerEntranhas(no.child(i));
    }
  }

  varrerEntranhas(noFuncao);

  return Array.from(tagsEncontradas);
}

/**
 * Varre o arquivo de código completo extraindo métricas de saúde, custos, segurança e portas de saída.
 * @param {string} codigoTexto - Conteúdo textual do arquivo.
 * @param {string} caminhoRelativo - Caminho do arquivo relativo à raiz.
 * @returns {Object} Dossiê analítico do arquivo para a IA e o Dashboard.
 */
export function analisarMetricasArquivo(codigoTexto, caminhoRelativo) {
  const linhas = codigoTexto.split(/\r\n|\r|\n/);
  const totalLinhas = linhas.length;
  const codigoLimpo = codigoTexto;
  const codigoLower = codigoTexto.toLowerCase();

  // 1. Tabelas de Banco de Dados Consultadas
  const tabelasDetectadas = new Set();
  
  // Regex para .from('tabela'), .table('tabela'), .collection('tabela')
  const regexTabelas = /\.(?:from|table|collection)\(\s*['"`]([a-zA-Z0-9_\-]+)['"`]\s*\)/gi;
  let matchTabela;
  while ((matchTabela = regexTabelas.exec(codigoTexto)) !== null) {
    if (matchTabela[1]) tabelasDetectadas.add(matchTabela[1]);
  }

  // Regex para db.tabela ou prisma.tabela (ex: prisma.usuarios.findMany)
  const regexOrm = /(?:supabase|prisma|db)\.([a-zA-Z0-9_]{3,30})\.(?:find|create|update|delete|select|insert)/gi;
  let matchOrm;
  while ((matchOrm = regexOrm.exec(codigoTexto)) !== null) {
    if (matchOrm[1] && !['from', 'auth', 'storage', 'rpc'].includes(matchOrm[1])) {
      tabelasDetectadas.add(matchOrm[1]);
    }
  }

  // 2. Custos e Sobrecarga de Banco de Dados
  // A) select('*') sem limites ou filtros
  const temSelectAll = /\.select\(\s*['"`]\*['"`]\s*\)/i.test(codigoTexto) || /\.select\(\s*\)/i.test(codigoTexto);
  const temFiltroOuLimite = /\.limit\(|\.eq\(|\.in\(|\.gte\(|\.lte\(|\.where\(|\.take\(/i.test(codigoTexto);
  const selectAllSemFiltro = temSelectAll && !temFiltroOuLimite;

  // B) Busca dentro de repetição (Loops: for, while, .map, .forEach com await / db)
  const temLoopComAsyncDb = (
    /(?:for\s*\([^)]*\)|while\s*\([^)]*\)|(?:\.map|\.forEach)\s*\(\s*async)[\s\S]{1,300}?(?:await\s+(?:supabase|db|prisma|fetch)|\.(?:from|table|query|insert|update))/i.test(codigoTexto)
  );

  // C) Escutas em Tempo Real
  const escutasRealtime = (codigoTexto.match(/\.onSnapshot\(|\.subscribe\(|\.channel\(/gi) || []).length;

  // D) Contagem total de consultas detectadas no arquivo
  const totalConsultasBanco = (codigoTexto.match(/\.(?:from|table|query|execute|select)\(/gi) || []).length;

  // 3. Risco de Perda de Dados (Formulários sem Cache / Rascunho)
  const contagemInputs = (codigoTexto.match(/<input|<textarea|<select|useForm\(|register\(|handleSubmit\(/gi) || []).length;
  const contagemUseState = (codigoTexto.match(/useState\s*\(/gi) || []).length;
  const temArmazenamentoCache = /localStorage|sessionStorage|indexedDB/i.test(codigoTexto);
  
  // Só considera formulário expressivo se tiver 5+ inputs ou (3+ inputs com 4+ estados)
  // Evita alarmes falsos em formulários curtos de 2 ou 3 campinhos (PlayerForm, login, etc)
  const temFormularioExpressivo = contagemInputs >= 5 || (contagemInputs >= 3 && contagemUseState >= 4);
  const formularioSemCache = temFormularioExpressivo && !temArmazenamentoCache;

  // 4. Memória e Peso na Tela
  const arquivoGigante = totalLinhas >= 400;
  
  // Renderização de lista sem paginação aparente
  const temMapJsx = /\.map\s*\([^)]*=>\s*(?:<|\()/i.test(codigoTexto);
  const temPaginacao = /pagina|page|paginate|pagination|limit|slice\(/i.test(codigoTexto);
  const listaSemPaginacao = temMapJsx && !temPaginacao && !caminhoRelativo.includes('test');

  // Manipulação pesada na memória
  const manipulacaoPesadaMemoria = /readAsDataURL|FileReader|base64|toDataURL|createObjectURL|html2canvas|jspdf|pdfmake|xlsx|exceljs/i.test(codigoTexto);

  // 5. Portas de Saída e Configurações Globais
  const temPdfRelatorio = /jspdf|pdfmake|html2canvas|window\.print/i.test(codigoTexto);
  const temMensageriaWhatsApp = /wa\.me|whatsapp|api\.whatsapp/i.test(codigoTexto);
  const temEmail = /mailto:|nodemailer|resend|sendemail|smtp/i.test(codigoTexto);
  const temIntegracaoPagamento = /stripe|mercadopago|asaas|pagarme|paypal/i.test(codigoTexto);
  const temNuvemExterna = /drive\.google\.com|s3\.amazonaws\.com|storage\.googleapis/i.test(codigoTexto);

  // 6. Travas Críticas de Segurança e Permissões
  const travasSeguranca = [];
  linhas.forEach((linhaTexto, idx) => {
    if (/(?:isAdmin|user\.role|permissao|canAccess|useRole|hasRole|guarded|authorize|role\s*===)\b/i.test(linhaTexto)) {
      if (!linhaTexto.trim().startsWith('//') && !linhaTexto.trim().startsWith('*')) {
    travasSeguranca.push({
          linha: idx + 1,
          codigo: linhaTexto.trim().slice(0, 100)
        });
      }
    }
  });

  // 7. Detector de Sistema de Atualização Automática (Sem Ctrl+F5)
  const evidenciasAtualizacao = [];
  const nomeArqLower = caminhoRelativo.toLowerCase();

  if (nomeArqLower.endsWith('version.json')) {
    evidenciasAtualizacao.push('Arquivo version.json presente');
  }
  if (/version\.json/i.test(codigoTexto)) {
    evidenciasAtualizacao.push('Leitura de version.json');
  }
  if (/(?:__APP_VERSION__|APP_VERSION|VERSAO_ATUAL|VERSAO_APP|verificarAtualizacao|checarAtualizacao|checkForUpdates|checkVersion|novaVersaoDisponivel|exibirBannerAtualizacao|exibirToastAtualizacao)/i.test(codigoTexto)) {
    evidenciasAtualizacao.push('Verificador de versão do aplicativo');
  }
  const temTratamentoChunkError = /(?:vite:preloadError|ChunkLoadError|Failed to fetch dynamically imported module)/i.test(codigoTexto);
  if (temTratamentoChunkError) {
    evidenciasAtualizacao.push('Proteção contra erro de arquivo antigo (vite:preloadError / ChunkLoadError)');
  }
  const temServiceWorkerUpdate = /(?:onupdatefound|updatefound|controllerchange|skipWaiting|virtual:pwa-register|useRegisterSW|serviceWorker\.register)/i.test(codigoTexto);
  if (temServiceWorkerUpdate) {
    evidenciasAtualizacao.push('Service Worker / PWA com detecção de nova versão');
  }

  const temDetectorVersao = evidenciasAtualizacao.length > 0;

  // 8. Detector de Janelas Modais Vulneráveis a Fechamento ao Arrastar Texto (onClick no fundo)
  const temModal = /(?:fixed\s+[^"']*inset-0|inset-0\s+[^"']*fixed|modal-overlay|modal-backdrop|modalBackdrop|role=["']dialog["']|className=["'][^"']*modal[^"']*["']|class=["'][^"']*modal[^"']*["'])/i.test(codigoTexto);
  const linhasVulneraveisModal = [];
  const regexOverlay = /(?:fixed\s+[^"']*inset-0|inset-0\s+[^"']*fixed|modal-overlay|modal-backdrop|modalBackdrop|bg-black\/|bg-slate-900\/|bg-gray-900\/|backdrop-blur|rgba\(\s*(?:0,\s*0,\s*0|15,\s*23,\s*42))/i;
  const regexAcaoFechar = /(?:close|fechar|setShow|setOpen|setIsOpen|setModal|setAberto|setActive|setSelected|setEditing|setCreating|onDismiss|onCancel|hide|\(\s*false\s*\)|\(\s*null\s*\)|currentTarget)/i;

  if (temModal) {
    let ultimaLinhaReportada = -10;
    for (let idx = 0; idx < linhas.length; idx++) {
      const linhaTrim = linhas[idx].trim();
      if (!linhaTrim || linhaTrim.startsWith('//') || linhaTrim.startsWith('*') || linhaTrim.startsWith('/*')) continue;

      // Caso A: Elemento de fundo escuro (overlay/backdrop) usando onClick ou onclick para fechar
      if (regexOverlay.test(linhaTrim) && !/<button\b/i.test(linhaTrim)) {
        // Junta até o fechamento da tag de abertura '>' (máximo 7 linhas)
        let tagCompleta = '';
        for (let k = idx; k < Math.min(linhas.length, idx + 7); k++) {
          tagCompleta += ' ' + linhas[k];
          if (linhas[k].includes('>')) break;
        }
        const matchOnClick = tagCompleta.match(/onClick\s*=\s*\{([^}]+)\}|onclick\s*=\s*["']([^"']+)["']/i);
        if (matchOnClick) {
          const handler = (matchOnClick[1] || matchOnClick[2] || '').trim();
          const apenasStopProp = /stopPropagation\(\)\s*;?\s*$/i.test(handler) && !regexAcaoFechar.test(handler);
          if (!apenasStopProp && (regexAcaoFechar.test(handler) || /=>/.test(handler) || /\(/.test(handler))) {
            if (idx - ultimaLinhaReportada > 3) {
              linhasVulneraveisModal.push({
                linha: idx + 1,
                codigo: linhaTrim.slice(0, 110),
                motivo: 'Fundo da modal usa onClick/onclick: ao selecionar texto e soltar o mouse fora, a janela fecha sozinha.'
              });
              ultimaLinhaReportada = idx;
            }
          }
        }
      }

      // Caso B: onClick checando e.target === e.currentTarget (também fecha ao arrastar texto!)
      if (/onClick\s*=|onclick\s*=/i.test(linhaTrim) && /(?:target\s*===?\s*(?:e|event)\.currentTarget|currentTarget\s*===?\s*(?:e|event)\.target)/i.test(linhaTrim)) {
        if (idx - ultimaLinhaReportada > 3) {
          linhasVulneraveisModal.push({
            linha: idx + 1,
            codigo: linhaTrim.slice(0, 110),
            motivo: 'Checagem e.target === e.currentTarget dentro de onClick ainda fecha a janela ao arrastar texto para fora.'
          });
          ultimaLinhaReportada = idx;
        }
      }

      // Caso C: JavaScript Puro addEventListener('click', ...) no fundo da modal
      if (/addEventListener\s*\(\s*['"`]click['"`]/i.test(linhaTrim)) {
        const blocoJs = linhas.slice(Math.max(0, idx - 1), Math.min(linhas.length, idx + 5)).join(' ');
        if (/(?:modal|overlay|backdrop)/i.test(blocoJs) && /(?:target\s*===?|fechar|close|classList\.remove|display\s*=\s*['"]none['"])/i.test(blocoJs)) {
          if (idx - ultimaLinhaReportada > 3) {
            linhasVulneraveisModal.push({
              linha: idx + 1,
              codigo: linhaTrim.slice(0, 110),
              motivo: 'addEventListener("click") no fundo da modal fecha a janela ao soltar arrasto de texto fora.'
            });
            ultimaLinhaReportada = idx;
          }
        }
      }
    }
  }

  const modalBlindada = temModal && (
    /(?:onMouseDown|onmousedown)[\s\S]{0,160}(?:currentTarget|fechar|close|setShow|setOpen|setIsOpen|setModal|false|null)/i.test(codigoTexto) ||
    /addEventListener\s*\(\s*['"`]mousedown['"`]/i.test(codigoTexto)
  );

  return {
    arquivo: caminhoRelativo,
    totalLinhas,
    banco: {
      tabelasConsultadas: Array.from(tabelasDetectadas),
      totalConsultas: totalConsultasBanco,
      selectAllSemFiltro,
      buscaEmLoop: temLoopComAsyncDb,
      escutasRealtime
    },
    formulario: {
      temFormulario: temFormularioExpressivo,
      totalInputs: contagemInputs,
      totalEstados: contagemUseState,
      temCacheRascunho: temArmazenamentoCache,
      alertaPerdaDados: formularioSemCache
    },
    memoria: {
      arquivoGigante,
      listaSemPaginacao,
      manipulacaoPesadaMemoria
    },
    portasSaida: {
      pdf: temPdfRelatorio,
      whatsapp: temMensageriaWhatsApp,
      email: temEmail,
      pagamento: temIntegracaoPagamento,
      nuvemExterna: temNuvemExterna
    },
    seguranca: {
      temTravas: travasSeguranca.length > 0,
      travas: travasSeguranca
    },
    atualizacao: {
      temDetectorVersao,
      temTratamentoChunkError,
      temServiceWorkerUpdate,
      evidencias: evidenciasAtualizacao
    },
    modalArrasto: {
      temModal,
      vulneravel: linhasVulneraveisModal.length > 0,
      blindado: modalBlindada && linhasVulneraveisModal.length === 0,
      linhasVulneraveis: linhasVulneraveisModal
    }
  };
}
