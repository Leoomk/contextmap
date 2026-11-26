import fs from 'fs';
import path from 'path';
import { gerarIdProjeto } from './historyManager.js';

/**
 * Fase 8: O Caderno de Vistoria e Checklist Persistente do Projeto
 * 
 * Analogia: É como a Folha de Vistoria de um Apartamento.
 * Na primeira visita, o inspetor lista os pontos que precisam de atenção.
 * O morador decide o que quer fazer agora ("Feito"), o que deixa para depois ("Pendente")
 * e o que não quer mexer de jeito nenhum ("Ignorado / Deixar como está").
 * 
 * Nas próximas obras (mudanças específicas), o mestre de obras NÃO relê a casa inteira
 * nem gasta tempo e dinheiro com o que já foi aprovado ou descartado.
 * Ele foca exclusivamente na parede ou tomada que o morador pediu para mexer!
 */

const DIRETORIO_HISTORICO = path.join(process.cwd(), 'data', 'history');

// Itens Padrão de Vistoria Inicial de todo Aplicativo
export const ITENS_VISTORIA_PADRAO = [
  {
    id: 'auto_update_ctrl_f5',
    titulo: 'Aviso de Atualização Automática (Sem Ctrl+F5)',
    categoria: 'estabilidade',
    icone: '🔄',
    explicacaoLeiga: 'Avisa o usuário no celular ou PC quando você sobe uma novidade, com botão "Atualizar Agora", sem exigir que ele aperte Ctrl+F5 ou tome tela branca.',
    comoDetectar: (arquivos, relatorioSaude) => {
      if (relatorioSaude?.statusAtualizacaoApp) {
        return relatorioSaude.statusAtualizacaoApp.temProtecao ? 'feito' : 'pendente';
      }
      return 'pendente';
    }
  },
  {
    id: 'fuso_horario_brasil',
    titulo: 'Fuso Horário Oficial de Brasília',
    categoria: 'banco',
    icone: '🇧🇷',
    explicacaoLeiga: 'Garante que compras ou registros feitos à noite (depois das 21h) não ganhem a data do dia seguinte por causa do relógio de Londres (UTC).',
    comoDetectar: (arquivos) => {
      const temIsostringDireto = arquivos.some(a => {
        const diag = a.diagnostico;
        return a.isCodigo && diag && /toISOString\(\)\.split\('T'\)\[0\]/.test(JSON.stringify(diag));
      });
      return temIsostringDireto ? 'pendente' : 'pendente';
    }
  },
  {
    id: 'trava_duplo_clique',
    titulo: 'Trava Anti-Duplo Clique (Catraca de Segurança)',
    categoria: 'estabilidade',
    icone: '🛑',
    explicacaoLeiga: 'Trava botões de confirmação de pagamento ou cadastro no primeiro toque para evitar que cliques rápidos dupliquem registros no banco.',
    comoDetectar: () => 'pendente'
  },
  {
    id: 'moeda_brasileira_brl',
    titulo: 'Sanitização de Valores em Real (R$ com Vírgula)',
    categoria: 'ui-ux',
    icone: '💵',
    explicacaoLeiga: 'Evita que valores digitados como "R$ 1.500,50" quebrem o banco ou virem R$ 1,00 por incompatibilidade com ponto decimal.',
    comoDetectar: (arquivos) => {
      const temTermoFinanceiro = arquivos.some(a => /valor|preco|financeiro|pagamento|custo/i.test(a.arquivo));
      return temTermoFinanceiro ? 'pendente' : 'ignorado';
    }
  },
  {
    id: 'consultas_banco_loop',
    titulo: 'Viagens Repetidas ao Banco (Loops N+1)',
    categoria: 'banco',
    icone: '🔥',
    explicacaoLeiga: 'Consultas feitas dentro de repetições (for/map) que aumentam a conta da hospedagem e deixam o app lento.',
    comoDetectar: (arquivos, relatorioSaude) => {
      const temLoop = (relatorioSaude?.viloesCustoBanco || []).some(v => v.pontosGravidade >= 50);
      return temLoop ? 'pendente' : 'feito';
    }
  },
  {
    id: 'select_sem_limite',
    titulo: 'Busca de Tabela Inteira sem Limite (Select * solto)',
    categoria: 'banco',
    icone: '⚠️',
    explicacaoLeiga: 'Telas que puxam todos os dados de uma vez sem limitar quantidade, gastando banda e memória do cliente.',
    comoDetectar: (arquivos, relatorioSaude) => {
      const temSelectAll = (relatorioSaude?.viloesCustoBanco || []).some(v => v.problemas.some(p => p.includes('sem limite')));
      return temSelectAll ? 'pendente' : 'feito';
    }
  },
  {
    id: 'rascunho_formularios',
    titulo: 'Rascunho Automático em Formulários Longos',
    categoria: 'ui-ux',
    icone: '📝',
    explicacaoLeiga: 'Salva o que o usuário digita temporariamente para que, se a internet oscilar ou a página recarregar, ele não perca o texto.',
    comoDetectar: (arquivos, relatorioSaude) => {
      const temFormsSemCache = (relatorioSaude?.formulariosSemCache?.length || 0) > 0;
      return temFormsSemCache ? 'pendente' : 'feito';
    }
  },
  {
    id: 'respiro_celular_safe_area',
    titulo: 'Respiro de Rodapé no Celular (Safe Area Inset)',
    categoria: 'ui-ux',
    icone: '📱',
    explicacaoLeiga: 'Evita que a barra de gestos inferior do iPhone ou Android fique por cima dos botões de salvar do aplicativo.',
    comoDetectar: () => 'pendente'
  },
  {
    id: 'modal_fechamento_arrasto',
    titulo: 'Janela Modal Blindada contra Arrasto de Mouse',
    categoria: 'ui-ux',
    icone: '🛡️',
    explicacaoLeiga: 'Garante que a janela aberta não se feche sozinha quando o usuário seleciona texto e solta o botão do mouse fora da janela.',
    comoDetectar: (arquivos, relatorioSaude) => {
      if (relatorioSaude?.statusModalArrasto) {
        if (relatorioSaude.statusModalArrasto.temProblema) return 'pendente';
        return 'feito';
      }
      return 'pendente';
    }
  },
  {
    id: 'aviso_queda_internet',
    titulo: 'Aviso Amigável de Queda de Internet',
    categoria: 'estabilidade',
    icone: '📡',
    explicacaoLeiga: 'Avisa o usuário imediatamente quando a internet oscila, evitando tentativas frustradas de salvar dados sem conexão.',
    comoDetectar: () => 'pendente'
  }
];

/**
 * Retorna o caminho do arquivo de checklist de um projeto.
 */
function obterCaminhoChecklist(diretorioOuId) {
  let id = diretorioOuId;
  if (diretorioOuId.includes('\\') || diretorioOuId.includes('/')) {
    id = gerarIdProjeto(diretorioOuId);
  }
  const pastaProjeto = path.join(DIRETORIO_HISTORICO, id);
  if (!fs.existsSync(pastaProjeto)) {
    fs.mkdirSync(pastaProjeto, { recursive: true });
  }
  return path.join(pastaProjeto, 'checklist.json');
}

/**
 * Carrega ou inicializa o checklist de vistoria do projeto.
 */
export function obterOuCriarChecklist(diretorioOuId, relatorioSaude = null, arquivos = []) {
  const caminhoChecklist = obterCaminhoChecklist(diretorioOuId);

  let checklistSalvo = null;
  if (fs.existsSync(caminhoChecklist)) {
    try {
      checklistSalvo = JSON.parse(fs.readFileSync(caminhoChecklist, 'utf8'));
    } catch (e) {
      checklistSalvo = null;
    }
  }

  const mapaExistente = new Map();
  if (checklistSalvo && Array.isArray(checklistSalvo.itens)) {
    checklistSalvo.itens.forEach(item => {
      mapaExistente.set(item.id, item);
    });
  }

  // Mescla com os itens padrão mantendo as decisões já tomadas pelo usuário
  const itensMesclados = ITENS_VISTORIA_PADRAO.map(itemPadrao => {
    const salvo = mapaExistente.get(itemPadrao.id);
    if (salvo) {
      // Se o usuário já marcou feito ou ignorado, preserva 100% a decisão dele!
      // Mas se o sensor agora detectou que o auto_update foi feito no código, auto-atualiza para 'feito'
      if (itemPadrao.id === 'auto_update_ctrl_f5' && relatorioSaude?.statusAtualizacaoApp?.temProtecao) {
        salvo.status = 'feito';
        salvo.observacao = salvo.observacao || 'Detectado automaticamente pelo sensor de código.';
      }
      // Sensor de Modais Anti-Arrasto: atualiza automaticamente se todas as modais foram blindadas ou se novas modais vulneráveis surgiram
      if (itemPadrao.id === 'modal_fechamento_arrasto' && relatorioSaude?.statusModalArrasto && salvo.status !== 'ignorado') {
        if (relatorioSaude.statusModalArrasto.temProblema) {
          salvo.status = 'pendente';
          const arqs = relatorioSaude.statusModalArrasto.arquivosVulneraveis.map(a => a.arquivo).slice(0, 4).join(', ');
          salvo.observacao = `Detectado fechamento vulnerável ao arrastar em: ${arqs}`;
        } else {
          salvo.status = 'feito';
          salvo.observacao = 'Nenhuma modal vulnerável ao arrastar detectada pelo sensor.';
        }
      }
      return {
        ...itemPadrao,
        ...salvo
      };
    }

    // Item novo sendo visto pela primeira vez: roda a detecção inicial
    let statusInicial = 'pendente';
    try {
      if (typeof itemPadrao.comoDetectar === 'function') {
        statusInicial = itemPadrao.comoDetectar(arquivos, relatorioSaude);
      }
    } catch (e) {}

    return {
      id: itemPadrao.id,
      titulo: itemPadrao.titulo,
      categoria: itemPadrao.categoria,
      icone: itemPadrao.icone,
      explicacaoLeiga: itemPadrao.explicacaoLeiga,
      status: statusInicial, // 'pendente' | 'feito' | 'ignorado'
      observacao: statusInicial === 'feito' ? 'Detectado como já protegido no código.' : '',
      atualizadoEm: new Date().toISOString()
    };
  });

  const checklistCompleto = {
    idProjeto: path.basename(caminhoChecklist),
    atualizadoEm: new Date().toISOString(),
    totais: {
      total: itensMesclados.length,
      feitos: itensMesclados.filter(i => i.status === 'feito').length,
      ignorados: itensMesclados.filter(i => i.status === 'ignorado').length,
      pendentes: itensMesclados.filter(i => i.status === 'pendente').length
    },
    itens: itensMesclados
  };

  // Salva no disco
  fs.writeFileSync(caminhoChecklist, JSON.stringify(checklistCompleto, null, 2), 'utf8');

  return checklistCompleto;
}

/**
 * Atualiza o status de um item específico do checklist ('feito', 'pendente', 'ignorado').
 */
export function atualizarItemChecklist(diretorioOuId, itemId, novoStatus, observacao = '') {
  const checklist = obterOuCriarChecklist(diretorioOuId);
  const item = checklist.itens.find(i => i.id === itemId);

  if (!item) {
    throw new Error(`Item de checklist '${itemId}' não encontrado.`);
  }

  const statusValidos = ['feito', 'pendente', 'ignorado'];
  if (!statusValidos.includes(novoStatus)) {
    throw new Error(`Status inválido: ${novoStatus}. Use: 'feito', 'pendente' ou 'ignorado'.`);
  }

  item.status = novoStatus;
  if (observacao) item.observacao = observacao;
  item.atualizadoEm = new Date().toISOString();

  checklist.atualizadoEm = new Date().toISOString();
  checklist.totais = {
    total: checklist.itens.length,
    feitos: checklist.itens.filter(i => i.status === 'feito').length,
    ignorados: checklist.itens.filter(i => i.status === 'ignorado').length,
    pendentes: checklist.itens.filter(i => i.status === 'pendente').length
  };

  const caminhoChecklist = obterCaminhoChecklist(diretorioOuId);
  fs.writeFileSync(caminhoChecklist, JSON.stringify(checklist, null, 2), 'utf8');

  return checklist;
}

/**
 * Prepara o Contexto Cirúrgico para uma MUDANÇA ESPECÍFICA pedida pelo usuário.
 * 
 * 1. Não gasta NENHUM token repetindo itens do checklist que já foram marcados como FEITOS ou IGNORADOS!
 * 2. Só avisa de algum item do checklist se ele estiver PENDENTE e tiver relação direta com o arquivo sendo editado.
 * 3. Foca 100% na mudança que o usuário pediu, no efeito dominó dos arquivos afetados e nas regras de negócio.
 */
export function prepararContextoMudancaEspecifica(diretorioOuId, {
  descricaoMudanca,
  arquivoAlvo,
  domino,
  relatorioSaude,
  arquivosMemoria
}) {
  const checklist = obterOuCriarChecklist(diretorioOuId, relatorioSaude, arquivosMemoria);

  // Itens já resolvidos ou descartados pelo usuário (não gastam tokens!)
  const itensResolvidosOuIgnorados = checklist.itens
    .filter(i => i.status === 'feito' || i.status === 'ignorado')
    .map(i => `${i.icone} ${i.titulo} (${i.status === 'feito' ? 'JÁ FEITO' : 'DEIXAR COMO ESTÁ'})`);

  // Itens ainda pendentes que possam ser relevantes
  const itensPendentes = checklist.itens.filter(i => i.status === 'pendente');

  return {
    descricaoMudanca,
    arquivoAlvo,
    totaisChecklist: checklist.totais,
    itensJaDefinidosResumo: itensResolvidosOuIgnorados,
    itensPendentesApenas: itensPendentes.map(i => ({
      id: i.id,
      titulo: i.titulo,
      explicacaoLeiga: i.explicacaoLeiga
    })),
    dominoCirurgico: {
      arquivoAlvo,
      ascendentesQueQuebram: domino?.impactoDireto?.ascendentesQueQuebram || [],
      descendentesNecessarios: domino?.impactoDireto?.descendentesNecessarios || [],
      totalArquivosEnvolvidos: domino?.totalArquivosEnvolvidos || 1
    }
  };
}
