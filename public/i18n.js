/**
 * ContextMap â€” Bilingual Engine (ðŸ‡ºðŸ‡¸ EN default / ðŸ‡§ðŸ‡· PT-BR toggle)
 * Translates all static & dynamically rendered UI elements instantaneously
 * without reloading the page or risking any functional regressions.
 */
(function initContextMapI18n() {
  const STORAGE_KEY = 'contextmap_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
  const origTextMap = new WeakMap();

  // Ordered from longest/most specific phrases to shorter labels for exact, clean translation
  const PHRASE_MAP = [
    // Titles & Navigation
    ['MAPACONTEXTO 3.0 - Dashboard Executivo & Monitor de SaÃºde', 'ContextMap â€” AI Context Map & Health Monitor'],
    ['MAPACONTEXTO 5.0', 'ContextMap'],
    ['MAPACONTEXTO', 'ContextMap'],
    ['Mapa Contexto', 'ContextMap'],
    ['Nenhum Projeto', 'No Project'],
    ['ðŸ•°ï¸ HistÃ³rico & Projetos', 'ðŸ•°ï¸ History & Projects'],
    ['ðŸ“Š Monitor de SaÃºde & Custos', 'ðŸ“Š Health & Cost Monitor'],
    ['ðŸ›¡ï¸ Construtor & Vacinas', 'ðŸ›¡ï¸ Vaccines & Blueprints'],
    ['ðŸŒŒ Grafo 3D', 'ðŸŒŒ 3D Graph'],
    ['ðŸ“ Novo Projeto', 'ðŸ“ New Project'],

    // History & Vault Tab
    ['Analisar Nova Pasta de Projeto', 'Analyze New Project Folder'],
    ['Selecione qualquer pasta no seu computador para o ContextMap ler o cÃ³digo e alimentar sua IA.', 'Select any folder on your computer so ContextMap can map the codebase and feed your AI.'],
    ['Selecione qualquer pasta no seu computador para o Mapa Contexto ler o cÃ³digo e alimentar sua IA.', 'Select any folder on your computer so ContextMap can map the codebase and feed your AI.'],
    ['ðŸ“ Procurar', 'ðŸ“ Browse'],
    ['âš¡ Analisar', 'âš¡ Analyze'],
    ['Varrendo arquivos, custos de banco e efeito dominÃ³... â³', 'Scanning files, database costs, and domino effects... â³'],
    ['ðŸ—‚ï¸ Galeria de Projetos Salvos no Cofre', 'ðŸ—‚ï¸ Saved Projects Vault'],
    ['Cada aplicativo possui sua prÃ³pria caixinha com a linha do tempo de todas as leituras', 'Each app has its own card with a full timeline of every scan'],
    ['Carregando projetos salvos no cofre...', 'Loading saved projects...'],
    ['Nenhum projeto salvo no cofre ainda. Digite o caminho de uma pasta acima e clique em "âš¡ Analisar" para inaugurar o seu cofre!', 'No projects saved in the vault yet. Pick a folder above and click "âš¡ Analyze" to run your first scan!'],
    ['ðŸš€ Abrir no Monitor', 'ðŸš€ Open in Monitor'],
    ['ðŸ”„ Reanalisar Agora', 'ðŸ”„ Re-scan Now'],
    ['ðŸ•’ Ver VersÃµes', 'ðŸ•’ View Versions'],
    ['Ocultar VersÃµes', 'Hide Versions'],
    ['Comparar Antes x Depois', 'Compare Before vs. After'],
    ['versÃµes', 'versions'],
    ['versÃ£o', 'version'],
    ['arquivos', 'files'],
    ['funÃ§Ãµes', 'functions'],

    // Health & Cost Monitor Banner
    ['Raio-X de SaÃºde e Custos do seu Aplicativo', 'App Health, Architecture & Cost X-Ray'],
    ['Imagine o seu app como um ', 'Think of your app like a '],
    ['prÃ©dio jÃ¡ construÃ­do', 'finished building'],
    ['. Aqui nÃ³s examinamos onde estÃ£o os pilares de sustentaÃ§Ã£o da casa (que nÃ£o podem quebrar), onde a torneira estÃ¡ aberta gastando banco de dados Ã  toa, e onde o usuÃ¡rio pode perder tudo o que digitou se a internet oscilar.', '. Here we inspect the load-bearing pillars (files that must not break), database queries burning unnecessary resources, and forms where users risk losing unsaved input.'],
    ['Copiar Check-up Geral para a IA', 'Copy Full Check-up for AI'],
    ['ðŸ¢ Filtrar por Bairro / Ãrea:', 'ðŸ¢ Filter by Module / Area:'],
    ['-- Todas as Ãreas do App (VisÃ£o Geral) --', '-- All App Modules (Global View) --'],
    ['-- Todos os MÃ³dulos (VisÃ£o Global) --', '-- All Modules (Global View) --'],
    ['Ocultar arquivos de teste e rascunho', 'Hide test & draft files'],
    ['ðŸ“¦ Copiar DossiÃª Desta Ãrea para a IA', 'ðŸ“¦ Copy Module Dossier for AI'],

    // Targeted Change Box (Token Saver)
    ['Analisar Nova MudanÃ§a EspecÃ­fica (Zero DesperdÃ­cio de Tokens)', 'Analyze Specific Change (Zero Token Waste)'],
    ['Modo CirÃºrgico', 'Surgical Mode'],
    ['O segredo da economia:', 'How it saves tokens:'],
    ['Quando vocÃª pede uma alteraÃ§Ã£o pontual, a IA nÃ£o precisa reler a vistoria da casa inteira! Digite o que deseja mudar abaixo: o ContextMap ', 'When you ask for a focused change, your AI does not need to re-audit the whole codebase! Describe your change below: ContextMap '],
    ['Quando vocÃª pede uma alteraÃ§Ã£o pontual, a IA nÃ£o precisa reler a vistoria da casa inteira! Digite o que deseja mudar abaixo: o Mapa Contexto ', 'When you ask for a focused change, your AI does not need to re-audit the whole codebase! Describe your change below: ContextMap '],
    ['oculta tudo o que vocÃª jÃ¡ fez ou decidiu deixar quieto', 'hides everything you already fixed or chose to leave as is'],
    [' e gera uma ordem cirÃºrgica focada 100% no raio de impacto da novidade.', ' and builds a surgical brief focused 100% on the new feature and its domino effect.'],
    ['O que vocÃª quer mudar ou criar agora no seu aplicativo?', 'What do you want to change or build right now?'],
    ['Arquivo principal da alteraÃ§Ã£o:', 'Primary target file:'],
    ['-- Carregando arquivos... --', '-- Loading files... --'],
    ['-- Selecione o arquivo ou deixe automÃ¡tico --', '-- Pick a file or leave automatic --'],
    ['Copiar Ordem CirÃºrgica para a IA', 'Copy Surgical Brief for AI'],

    // KPI Cards
    ['ðŸ’° MemÃ³ria Poupada da IA', 'ðŸ’° AI Tokens Saved'],
    ['Calculando economia...', 'Calculating savings...'],
    ['tokens economizados', 'tokens saved'],
    ['ðŸ–¥ï¸ Telas & Arquivos', 'ðŸ–¥ï¸ Screens & Files'],
    ['funÃ§Ãµes mapeadas', 'functions mapped'],
    ['ðŸ—„ï¸ Tabelas de Dados', 'ðŸ—„ï¸ Database Tables'],
    ['Onde seus dados ficam guardados', 'Detected data tables'],
    ['Nenhuma detectada', 'None detected'],
    ['ðŸ’¸ Alertas de Conta Alta', 'ðŸ’¸ High DB Cost Alerts'],
    ['Viagens repetidas ao banco', 'Heavy queries & loops'],
    ['ðŸ“ Risco de Perder DigitaÃ§Ã£o', 'ðŸ“ Unsaved Form Risk'],
    ['Sem salvamento temporÃ¡rio', 'Forms without local draft'],
    ['ðŸ” Travas de SeguranÃ§a', 'ðŸ” Security Guards'],
    ['Checagens de Administrador', 'Admin / Role checks'],
    ['ðŸ‘‘ Pilares Mestre (Centrais)', 'ðŸ‘‘ God Nodes (Hubs)'],
    ['Sustentam o app todo', 'High PageRank hubs'],
    ['ðŸ”„ Aviso Sem Ctrl+F5', 'ðŸ”„ Auto-Update (No Ctrl+F5)'],
    ['Detector de nova versÃ£o', 'New version detector'],
    ['NÃ£o exige Ctrl+F5', 'Cache-safe updates'],
    ['Exige Ctrl+F5 hoje', 'Users stuck on old cache'],
    ['âœ… Ativo', 'âœ… Active'],
    ['ðŸš¨ Falta', 'ðŸš¨ Missing'],
    ['ðŸªŸ Modais Anti-Arrasto', 'ðŸªŸ Drag-Safe Modals'],
    ['ProteÃ§Ã£o ao selecionar texto', 'Safe text selection'],
    ['NÃ£o fecha ao arrastar', 'Protected on drag'],
    ['Fecham ao arrastar texto!', 'Close on text drag!'],
    ['âœ… Blindado', 'âœ… Protected'],

    // Auto-Update & Modal Banners
    ['Carregando verificaÃ§Ã£o de atualizaÃ§Ã£o automÃ¡tica (Sem Ctrl+F5)...', 'Checking auto-update protection (No Ctrl+F5)...'],
    ['Carregando verificaÃ§Ã£o de janelas modais (anti-fechamento ao arrastar texto)...', 'Scanning modals for drag-close bugs...'],
    ['âœ… Aviso AutomÃ¡tico de AtualizaÃ§Ã£o (Sem Ctrl+F5): PROTEGIDO!', 'âœ… Auto-Update Notification (No Ctrl+F5): PROTECTED!'],
    ['ðŸ”„ Falta o Aviso AutomÃ¡tico de "Sistema Atualizado" (Sem precisar de Ctrl+F5)', 'ðŸ”„ Missing Auto-Update Banner (Users Need Ctrl+F5 After Deploy)'],
    ['ðŸš¨ FALTA NESTE PROJETO', 'ðŸš¨ MISSING IN THIS PROJECT'],
    ['Copiar Pedido de InstalaÃ§Ã£o para a IA', 'Copy Install Brief for AI'],
    ['âœ… Janelas Modais Anti-Arrasto: PROTEGIDO!', 'âœ… Drag-Safe Modals: PROTECTED!'],
    ['ðŸªŸ Janelas Modais Fechando Sozinhas ao Selecionar e Arrastar Texto', 'ðŸªŸ Vulnerable Modals Closing on Text Selection Drag'],
    ['Onde o sensor achou o problema:', 'Detected vulnerable files & lines:'],
    ['Copiar Pedido de CorreÃ§Ã£o para a IA', 'Copy Fix Brief for AI'],
    ['Quando vocÃª sobe uma melhoria para o ar, o navegador do celular ou computador costuma guardar os arquivos velhos na memÃ³ria (cache). Sem esse detector, o usuÃ¡rio continua vendo o aplicativo antigo ou toma erro de tela branca atÃ© apertar Ctrl+F5. Com essa proteÃ§Ã£o, o prÃ³prio app percebe que saiu versÃ£o nova e mostra um aviso elegante: "ðŸš€ O sistema foi atualizado! [ Atualizar Agora ]".', 'When you deploy an update, browsers often serve stale cached files. Without a version detector, users stay stuck on old versions or hit blank screens until they press Ctrl+F5. With this guard, the app detects new deploys and shows a clean "ðŸš€ Update available! [ Reload Now ]" bar.'],
    ['Sabe quando vocÃª estÃ¡ editando um campo dentro de uma janelinha (modal), seleciona um texto com o mouse para apagar ou copiar e, sem querer, solta o botÃ£o do mouse do lado de fora da janela â€” e ela fecha na sua cara apagando o que vocÃª estava fazendo? Isso acontece porque a IA colocou o fechamento no evento onClick (que dispara ao SOLTAR o mouse), em vez de verificar onde o clique COMEÃ‡OU (onMouseDown).', 'When highlighting text inside a modal input and releasing the mouse outside the box, modals using onClick on the backdrop close unexpectedly and wipe unsaved input. Switching the backdrop handler to onMouseDown (checking e.target === e.currentTarget) fixes this permanently.'],
    ['Nenhuma janela modal com fechamento vulnerÃ¡vel ao arrastar texto foi detectada.', 'No modals vulnerable to drag-close bugs were detected in this project.'],

    // Persistent Checklist Section
    ['Caderno de Vistoria do Projeto (Checklist Persistente)', 'Project Inspection Checklist (Persistent)'],
    ['MemÃ³ria definitiva:', 'Persistent memory:'],
    ['Itens marcados como ', 'Items marked as '],
    ['âœ… Feito', 'âœ… Done'],
    [' ou ', ' or '],
    ['ðŸš« Deixar como estÃ¡', 'ðŸš« Leave as is'],
    [' sÃ£o memorizados no histÃ³rico do seu app. Nas prÃ³ximas anÃ¡lises de mudanÃ§as pontuais, a IA pula esses itens e ', ' are saved in your project history. On future targeted changes, your AI skips them and '],
    ['nÃ£o gasta seus tokens', 'never burns tokens'],
    [' reavaliando o que jÃ¡ foi decidido!', ' re-auditing past decisions!'],
    ['Carregando checklist...', 'Loading checklist...'],
    ['Copiar Checklist para a IA', 'Copy Checklist for AI'],
    ['Todos (', 'All ('],
    ['â³ Pendentes (', 'â³ Pending ('],
    ['âœ… Feitos (', 'âœ… Done ('],
    ['ðŸš« Deixar como estÃ¡ (', 'ðŸš« Leave as is ('],
    ['Sua decisÃ£o:', 'Your decision:'],
    ['â³ Pendente', 'â³ Pending'],
    ['ðŸš« NÃ£o mexer', 'ðŸš« Skip / Leave'],
    ['âœ… FEITO', 'âœ… DONE'],
    ['â³ PENDENTE', 'â³ PENDING'],
    ['ðŸš« DEIXAR COMO ESTÃ', 'ðŸš« LEAVE AS IS'],
    ['Aviso de AtualizaÃ§Ã£o AutomÃ¡tica (Sem Ctrl+F5)', 'Auto-Update Banner (No Ctrl+F5)'],
    ['Fuso HorÃ¡rio Oficial de BrasÃ­lia', 'Local Timezone Safe Dates (No UTC Day Shift)'],
    ['Trava Anti-Duplo Clique (Catraca de SeguranÃ§a)', 'Anti Double-Click Lock on Submit Buttons'],
    ['SanitizaÃ§Ã£o de Valores em Real (R$ com VÃ­rgula)', 'Currency Input Sanitization'],
    ['Viagens Repetidas ao Banco (Loops N+1)', 'N+1 Database Queries Inside Loops'],
    ['Busca de Tabela Inteira sem Limite (Select * solto)', 'Unbounded Full-Table Queries (select * without limit)'],
    ['Rascunho AutomÃ¡tico em FormulÃ¡rios Longos', 'Auto-Save Drafts on Long Forms'],
    ['Respiro de RodapÃ© no Celular (Safe Area Inset)', 'Mobile Safe-Area Bottom Padding'],
    ['Janela Modal Blindada contra Arrasto de Mouse', 'Drag-Safe Modal Backdrop (onMouseDown)'],
    ['Aviso AmigÃ¡vel de Queda de Internet', 'Friendly Offline / Network Drop Indicator'],

    // Main Grid Sections
    ['ðŸ‘‘ Pilares Mestre da Estrutura (Arquivos Mais Importantes)', 'ðŸ‘‘ Core Pillars / God Nodes (Highest PageRank)'],
    ['Sustentam o sistema inteiro. Se mexer com erro, pode causar efeito dominÃ³', 'Core files holding the app together â€” high domino-effect risk if edited carelessly'],
    ['ðŸ’¸ Alertas de Conta Alta no Banco de Dados (Gasto Excessivo)', 'ðŸ’¸ Database Cost & Performance Alerts'],
    ['Telas que fazem viagens repetidas ao banco ou trazem tabelas inteiras de uma vez', 'Files running queries inside loops or fetching entire tables without limits'],
    ['ðŸ“ Risco de Perder o que Digitou (Sem Rascunho AutomÃ¡tico)', 'ðŸ“ Forms at Risk of Losing User Input (No Draft Cache)'],
    ['Se o usuÃ¡rio atualizar a pÃ¡gina ou a internet cair, terÃ¡ que preencher tudo de novo', 'Long forms without localStorage draft recovery'],
    ['ðŸ‹ï¸ Telas Pesadas (Exigem muito do Celular ou Computador)', 'ðŸ‹ï¸ Heavy Files & Memory Weight'],
    ['Arquivos gigantes ou telas que lidam com arquivos pesados na memÃ³ria', 'Oversized files or heavy client-side memory operations'],
    ['ðŸ”„ Telas Quase IdÃªnticas (Trabalho Duplicado)', 'ðŸ”„ Twin Logic & Duplicate Screens'],
    ['LÃ³gicas muito parecidas que a IA pode unificar para facilitar a manutenÃ§Ã£o', 'Files sharing similar tables/logic that must stay in sync'],
    ['ðŸ“ Arquivos Mais Longos do Projeto (Top 5)', 'ðŸ“ Largest Code Files (Top 5)'],
    ['Arquivos com centenas de linhas que podem ser divididos para facilitar', 'Largest files by line count that may benefit from modularization'],
    ['ðŸ“„ Copiar Resumo Leve', 'ðŸ“„ Copy Code Skeleton'],
    ['ðŸ”¥ AtenÃ§Ã£o Alta', 'ðŸ”¥ High Priority'],
    ['âš ï¸ Moderado', 'âš ï¸ Moderate'],
    ['âœ… Projeto bem modularizado! Nenhum arquivo concentra dependÃªncias excessivas.', 'âœ… Well-modularized project! No single file concentrates excessive dependencies.'],
    ['âœ… Nenhuma consulta cara ou loop crÃ­tico de banco encontrado!', 'âœ… No expensive DB loops or unbounded queries found!'],
    ['âœ… Todos os formulÃ¡rios possuem salvamento de rascunho em cache!', 'âœ… No high-risk forms missing draft cache!'],
    ['âœ… Nenhuma tela com sobrecarga de memÃ³ria identificada.', 'âœ… No heavy memory bottlenecks detected.'],
    ['Nenhuma duplicidade expressiva encontrada entre telas.', 'No significant duplicate logic detected between screens.'],

    // Vaccines & Blueprints Tab
    ['FarmÃ¡cia de Vacinas Anti-Erro & PeÃ§as Prontas', 'AI Anti-Bug Vaccines & Canonical Blueprints'],
    ['Copiar DossiÃª Consultivo para a IA', 'Copy Consultative Brief for AI'],
    ['âœ¨ Marcar Recomendadas', 'âœ¨ Select Recommended'],
    ['Marcar Todas (', 'Select All ('],
    ['Limpar Tudo', 'Clear All'],
    ['ðŸ“‹ Status do seu DossiÃª:', 'ðŸ“‹ Brief Status:'],
    ['ProteÃ§Ãµes incluÃ­das:', 'Vaccines included:'],
    ['PeÃ§as prontas incluÃ­das:', 'Blueprints included:'],
    ['ðŸ§± PeÃ§as Prontas de ConstruÃ§Ã£o (Estruturas CanÃ´nicas)', 'ðŸ§± Canonical Architecture Blueprints'],
    ['MÃ³dulos prontos e testados para o seu app nÃ£o nascer com defeito estrutural.', 'Battle-tested structural templates so AI-built features start rock solid.'],
    ['ðŸ§ª As Vacinas Anti-Erro do Vibe Coding', 'ðŸ§ª Vibe Coding Anti-Bug Vaccines'],
    ['Regras curtas e diretas com exemplos contrastantes (âŒ Como a IA costuma errar vs âœ… Jeito Certo).', 'Short, high-signal rules with contrasting examples (âŒ Common AI Mistake vs âœ… Bulletproof Pattern).'],
    ['ðŸŽ¨ Visual & Telas (', 'ðŸŽ¨ UI & UX ('],
    ['ðŸ—„ï¸ Banco de Dados (', 'ðŸ—„ï¸ Database ('],
    ['ðŸ”’ SeguranÃ§a & Acesso (', 'ðŸ”’ Security & Auth ('],
    ['âš™ï¸ Estabilidade & Erros (', 'âš™ï¸ Stability & Resilience ('],
    ['âž• Incluir no DossiÃª', 'âž• Add to Brief'],
    ['âœ… IncluÃ­do no DossiÃª', 'âœ… Added to Brief'],
    ['âœ¨ Recomendada para seu App', 'âœ¨ Recommended for Your App'],
    ['ðŸ‘ï¸ Ver CÃ³digo Pronto', 'ðŸ‘ï¸ View Blueprint Code'],
    ['ðŸ‘ï¸ Ver Regra: âŒ Erro vs âœ… Jeito Certo', 'ðŸ‘ï¸ View Rule: âŒ Wrong vs âœ… Right'],

    // 3D Graph Legend
    ['Legenda do Mapa', 'Map Legend'],
    ['â–¼ ESCONDER', 'â–¼ HIDE'],
    ['â—€ MOSTRAR', 'â—€ SHOW'],
    ['DomÃ­nio de NegÃ³cio (A Cidade)', 'Business Domain (Cluster)'],
    ['Duplo clique para abrir/fechar.', 'Click to expand / collapse.'],
    ['Arquivos Reais (Telas/MÃ³dulos)', 'Source Files (Screens/Modules)'],
    ['LÃ³gicas Inofensivas', 'Pure Logic / Helpers'],
    ['Zona de Perigo (Banco de Dados)', 'Database Mutation Zone'],
    ['Seta Laranja:', 'Orange Arrow:'],
    ['DependÃªncia de CÃ³digo', 'Code Dependency'],
    ['Seta Rosa:', 'Pink Arrow:'],
    ['ConexÃ£o Wi-Fi (Rotas/APIs)', 'API / Route Connection'],
    ['Filtros Visuais', 'Visual Filters'],
    ['Mostrar Arquivos Menores (Azul)', 'Show Source Files (Blue)'],
    ['Mostrar LÃ³gica Inofensiva (Verde)', 'Show Pure Logic (Green)'],
    ['Mostrar Risco de Banco (Vermelho)', 'Show DB Mutations (Red)'],
    ['ðŸŒŒ Expandir Todas as Cidades', 'ðŸŒŒ Expand All Clusters'],
    ['ðŸ™ï¸ Recolher para VisÃ£o Global', 'ðŸ™ï¸ Collapse to Global View'],
    ['Focar em DomÃ­nio de NegÃ³cio:', 'Focus on Business Domain:'],
    ['-- VisÃ£o Global (Todos) --', '-- Global View (All) --'],

    // Toasts
    ['âœ… Comando cirÃºrgico copiado! Agora Ã© sÃ³ colar no chat da sua IA (Ctrl + V).', 'âœ… Surgical brief copied! Paste it into your AI chat (Ctrl + V).'],
    ['ðŸŽ¯ Ordem cirÃºrgica copiada! Itens jÃ¡ feitos ou ignorados foram omitidos para poupar tokens da sua IA.', 'ðŸŽ¯ Surgical brief copied! Already-decided checklist items were omitted to save tokens.'],
    ['ðŸ“‹ DossiÃª Consultivo copiado com sucesso! Agora Ã© sÃ³ colar no chat da sua IA (Ctrl + V).', 'ðŸ“‹ Consultative brief copied! Paste it into your AI chat (Ctrl + V).']
  ];

  const PLACEHOLDER_MAP = {
    'Ex: C:\\MeusProjetos\\App': 'e.g. C:\\MyProjects\\MyApp or /Users/you/my-app',
    'Ex: Criar um botÃ£o para exportar extrato em Excel ou Ajustar o campo de valor do pagamento': 'e.g. Add a date filter to the dashboard or Create an Export to CSV button'
  };

  function translateString(str) {
    if (!str || !str.trim()) return str;
    let out = str;
    for (const [pt, en] of PHRASE_MAP) {
      if (out.includes(pt)) {
        out = out.split(pt).join(en);
      }
    }
    return out;
  }

  function applyToNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) return;
      if (parent.closest && parent.closest('#cm-lang-switcher')) return;

      if (!origTextMap.has(node)) {
        origTextMap.set(node, node.nodeValue);
      }
      const orig = origTextMap.get(node);
      const target = currentLang === 'en' ? translateString(orig) : orig;
      if (node.nodeValue !== target) {
        node.nodeValue = target;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.id === 'cm-lang-switcher') return;
      if (node.hasAttribute('placeholder')) {
        if (!node.dataset.origPlaceholder) {
          node.dataset.origPlaceholder = node.getAttribute('placeholder');
        }
        const origPh = node.dataset.origPlaceholder;
        const targetPh = currentLang === 'en' ? (PLACEHOLDER_MAP[origPh] || translateString(origPh)) : origPh;
        if (node.getAttribute('placeholder') !== targetPh) {
          node.setAttribute('placeholder', targetPh);
        }
      }
    }
  }

  function translateSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      applyToNode(root);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      applyToNode(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let curr;
    while ((curr = walker.nextNode())) {
      applyToNode(curr);
    }
  }

  function updateTitleAndButtons() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'pt-BR';
    document.title = currentLang === 'en'
      ? 'ContextMap â€” Local AST Context Map & MCP Server'
      : 'ContextMap â€” Mapa de Contexto Local & Servidor MCP';

    const btnEn = document.getElementById('cm-btn-en');
    const btnPt = document.getElementById('cm-btn-pt');
    if (btnEn && btnPt) {
      btnEn.style.background = currentLang === 'en' ? '#0284c7' : 'transparent';
      btnEn.style.color = currentLang === 'en' ? '#ffffff' : '#94a3b8';
      btnPt.style.background = currentLang === 'pt' ? '#0284c7' : 'transparent';
      btnPt.style.color = currentLang === 'pt' ? '#ffffff' : '#94a3b8';
    }
  }

  window.setContextMapLang = function (lang) {
    currentLang = lang === 'pt' ? 'pt' : 'en';
    localStorage.setItem(STORAGE_KEY, currentLang);
    updateTitleAndButtons();
    translateSubtree(document.body);
  };

  function injectLanguageSwitcher() {
    const navbar = document.getElementById('navbar');
    if (!navbar || document.getElementById('cm-lang-switcher')) return;

    const btnNovo = navbar.querySelector('.btn-trocar');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; align-items:center; gap:10px;';

    const switcher = document.createElement('div');
    switcher.id = 'cm-lang-switcher';
    switcher.title = 'Switch Language / Trocar Idioma';
    switcher.style.cssText = 'display:inline-flex; align-items:center; background:#0f172a; border:1px solid #334155; border-radius:8px; padding:2px; gap:2px;';
    switcher.innerHTML = `
      <button id="cm-btn-en" type="button" onclick="setContextMapLang('en')" style="border:none; border-radius:6px; padding:5px 9px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;">ðŸ‡ºðŸ‡¸ EN</button>
      <button id="cm-btn-pt" type="button" onclick="setContextMapLang('pt')" style="border:none; border-radius:6px; padding:5px 9px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;">ðŸ‡§ðŸ‡· PT</button>
    `;

    if (btnNovo && btnNovo.parentNode === navbar) {
      navbar.insertBefore(wrapper, btnNovo);
      wrapper.appendChild(switcher);
      wrapper.appendChild(btnNovo);
    } else {
      navbar.appendChild(switcher);
    }
  }

  function boot() {
    injectLanguageSwitcher();
    updateTitleAndButtons();
    translateSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      if (currentLang !== 'en') return;
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => translateSubtree(n));
        } else if (m.type === 'characterData') {
          // If JS dynamically changed textContent, update stored original and re-translate
          origTextMap.set(m.target, m.target.nodeValue);
          applyToNode(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

