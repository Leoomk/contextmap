/**
 * ContextMap — Bilingual Engine (🇺🇸 EN default / 🇧🇷 PT-BR toggle)
 * Translates all static & dynamically rendered UI elements instantaneously
 * without reloading the page or risking any functional regressions.
 */
(function initContextMapI18n() {
  const STORAGE_KEY = 'contextmap_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
  const origTextMap = new WeakMap();

  const PHRASE_MAP = [
    // Titles & Navigation
    ['MAPACONTEXTO 3.0 - Dashboard Executivo & Monitor de Saúde', 'ContextMap — AI Context Map & Health Monitor'],
    ['MAPACONTEXTO 5.0', 'ContextMap'],
    ['MAPACONTEXTO', 'ContextMap'],
    ['Mapa Contexto', 'ContextMap'],
    ['Nenhum Projeto', 'No Project'],
    ['🕰️ Histórico & Projetos', '🕰️ History & Projects'],
    ['📊 Monitor de Saúde & Custos', '📊 Health & Cost Monitor'],
    ['🛡️ Construtor & Vacinas', '🛡️ Vaccines & Blueprints'],
    ['🌌 Grafo 3D', '🌌 3D Graph'],
    ['📁 Novo Projeto', '📁 New Project'],

    // History & Vault Tab
    ['Analisar Nova Pasta de Projeto', 'Analyze New Project Folder'],
    ['Selecione qualquer pasta no seu computador para o ContextMap ler o código e alimentar sua IA.', 'Select any folder on your computer so ContextMap can map the codebase and feed your AI.'],
    ['Selecione qualquer pasta no seu computador para o Mapa Contexto ler o código e alimentar sua IA.', 'Select any folder on your computer so ContextMap can map the codebase and feed your AI.'],
    ['📁 Procurar', '📁 Browse'],
    ['⚡ Analisar', '⚡ Analyze'],
    ['Varrendo arquivos, custos de banco e efeito dominó... ⏳', 'Scanning files, database costs, and domino effects... ⏳'],
    ['🗂️ Galeria de Projetos Salvos no Cofre', '🗂️ Saved Projects Vault'],
    ['Cada aplicativo possui sua própria caixinha com a linha do tempo de todas as leituras', 'Each app has its own card with a full timeline of every scan'],
    ['Carregando projetos salvos no cofre...', 'Loading saved projects...'],
    ['Nenhum projeto salvo no cofre ainda. Digite o caminho de uma pasta acima e clique em "⚡ Analisar" para inaugurar o seu cofre!', 'No projects saved in the vault yet. Pick a folder above and click "⚡ Analyze" to run your first scan!'],
    ['🚀 Abrir no Monitor', '🚀 Open in Monitor'],
    ['🔄 Reanalisar Agora', '🔄 Re-scan Now'],
    ['🕒 Ver Versões', '🕒 View Versions'],
    ['Ocultar Versões', 'Hide Versions'],
    ['Comparar Antes x Depois', 'Compare Before vs. After'],
    ['versões', 'versions'],
    ['versão', 'version'],
    ['arquivos', 'files'],
    ['funções', 'functions'],

    // Health & Cost Monitor Banner
    ['Raio-X de Saúde e Custos do seu Aplicativo', 'App Health, Architecture & Cost X-Ray'],
    ['Imagine o seu app como um ', 'Think of your app like a '],
    ['prédio já construído', 'finished building'],
    ['. Aqui nós examinamos onde estão os pilares de sustentação da casa (que não podem quebrar), onde a torneira está aberta gastando banco de dados à toa, e onde o usuário pode perder tudo o que digitou se a internet oscilar.', '. Here we inspect the load-bearing pillars (files that must not break), database queries burning unnecessary resources, and forms where users risk losing unsaved input.'],
    ['Copiar Check-up Geral para a IA', 'Copy Full Check-up for AI'],
    ['🏢 Filtrar por Bairro / Área:', '🏢 Filter by Module / Area:'],
    ['-- Todas as Áreas do App (Visão Geral) --', '-- All App Modules (Global View) --'],
    ['-- Todos os Módulos (Visão Global) --', '-- All Modules (Global View) --'],
    ['Ocultar arquivos de teste e rascunho', 'Hide test & draft files'],
    ['📦 Copiar Dossiê Desta Área para a IA', '📦 Copy Module Dossier for AI'],

    // Targeted Change Box (Token Saver)
    ['Analisar Nova Mudança Específica (Zero Desperdício de Tokens)', 'Analyze Specific Change (Zero Token Waste)'],
    ['Modo Cirúrgico', 'Surgical Mode'],
    ['O segredo da economia:', 'How it saves tokens:'],
    ['Quando você pede uma alteração pontual, a IA não precisa reler a vistoria da casa inteira! Digite o que deseja mudar abaixo: o ContextMap ', 'When you ask for a focused change, your AI does not need to re-audit the whole codebase! Describe your change below: ContextMap '],
    ['Quando você pede uma alteração pontual, a IA não precisa reler a vistoria da casa inteira! Digite o que deseja mudar abaixo: o Mapa Contexto ', 'When you ask for a focused change, your AI does not need to re-audit the whole codebase! Describe your change below: ContextMap '],
    ['oculta tudo o que você já fez ou decidiu deixar quieto', 'hides everything you already fixed or chose to leave as is'],
    [' e gera uma ordem cirúrgica focada 100% no raio de impacto da novidade.', ' and builds a surgical brief focused 100% on the new feature and its domino effect.'],
    ['O que você quer mudar ou criar agora no seu aplicativo?', 'What do you want to change or build right now?'],
    ['Arquivo principal da alteração:', 'Primary target file:'],
    ['-- Carregando arquivos... --', '-- Loading files... --'],
    ['-- Selecione o arquivo ou deixe automático --', '-- Pick a file or leave automatic --'],
    ['Copiar Ordem Cirúrgica para a IA', 'Copy Surgical Brief for AI'],

    // KPI Cards
    ['💰 Memória Poupada da IA', '💰 AI Tokens Saved'],
    ['Calculando economia...', 'Calculating savings...'],
    ['tokens economizados', 'tokens saved'],
    ['🖥️ Telas & Arquivos', '🖥️ Screens & Files'],
    ['funções mapeadas', 'functions mapped'],
    ['🗄️ Tabelas de Dados', '🗄️ Database Tables'],
    ['Onde seus dados ficam guardados', 'Detected data tables'],
    ['Nenhuma detectada', 'None detected'],
    ['💸 Alertas de Conta Alta', '💸 High DB Cost Alerts'],
    ['Viagens repetidas ao banco', 'Heavy queries & loops'],
    ['📝 Risco de Perder Digitação', '📝 Unsaved Form Risk'],
    ['Sem salvamento temporário', 'Forms without local draft'],
    ['🔐 Travas de Segurança', '🔐 Security Guards'],
    ['Checagens de Administrador', 'Admin / Role checks'],
    ['👑 Pilares Mestre (Centrais)', '👑 God Nodes (Hubs)'],
    ['Sustentam o app todo', 'High PageRank hubs'],
    ['🔄 Aviso Sem Ctrl+F5', '🔄 Auto-Update (No Ctrl+F5)'],
    ['Detector de nova versão', 'New version detector'],
    ['Não exige Ctrl+F5', 'Cache-safe updates'],
    ['Exige Ctrl+F5 hoje', 'Users stuck on old cache'],
    ['✅ Ativo', '✅ Active'],
    ['🚨 Falta', '🚨 Missing'],
    ['🪟 Modais Anti-Arrasto', '🪟 Drag-Safe Modals'],
    ['Proteção ao selecionar texto', 'Safe text selection'],
    ['Não fecha ao arrastar', 'Protected on drag'],
    ['Fecham ao arrastar texto!', 'Close on text drag!'],
    ['✅ Blindado', '✅ Protected'],

    // Auto-Update & Modal Banners
    ['Carregando verificação de atualização automática (Sem Ctrl+F5)...', 'Checking auto-update protection (No Ctrl+F5)...'],
    ['Carregando verificação de janelas modais (anti-fechamento ao arrastar texto)...', 'Scanning modals for drag-close bugs...'],
    ['✅ Aviso Automático de Atualização (Sem Ctrl+F5): PROTEGIDO!', '✅ Auto-Update Notification (No Ctrl+F5): PROTECTED!'],
    ['🔄 Falta o Aviso Automático de "Sistema Atualizado" (Sem precisar de Ctrl+F5)', '🔄 Missing Auto-Update Banner (Users Need Ctrl+F5 After Deploy)'],
    ['🚨 FALTA NESTE PROJETO', '🚨 MISSING IN THIS PROJECT'],
    ['Copiar Pedido de Instalação para a IA', 'Copy Install Brief for AI'],
    ['✅ Janelas Modais Anti-Arrasto: PROTEGIDO!', '✅ Drag-Safe Modals: PROTECTED!'],
    ['🪟 Janelas Modais Fechando Sozinhas ao Selecionar e Arrastar Texto', '🪟 Vulnerable Modals Closing on Text Selection Drag'],
    ['Onde o sensor achou o problema:', 'Detected vulnerable files & lines:'],
    ['Copiar Pedido de Correção para a IA', 'Copy Fix Brief for AI'],
    ['Quando você sobe uma melhoria para o ar, o navegador do celular ou computador costuma guardar os arquivos velhos na memória (cache). Sem esse detector, o usuário continua vendo o aplicativo antigo ou toma erro de tela branca até apertar Ctrl+F5. Com essa proteção, o próprio app percebe que saiu versão nova e mostra um aviso elegante: "🚀 O sistema foi atualizado! [ Atualizar Agora ]".', 'When you deploy an update, browsers often serve stale cached files. Without a version detector, users stay stuck on old versions or hit blank screens until they press Ctrl+F5. With this guard, the app detects new deploys and shows a clean "🚀 Update available! [ Reload Now ]" bar.'],
    ['Sabe quando você está editando um campo dentro de uma janelinha (modal), seleciona um texto com o mouse para apagar ou copiar e, sem querer, solta o botão do mouse do lado de fora da janela — e ela fecha na sua cara apagando o que você estava fazendo? Isso acontece porque a IA colocou o fechamento no evento onClick (que dispara ao SOLTAR o mouse), em vez de verificar onde o clique COMEÇOU (onMouseDown).', 'When highlighting text inside a modal input and releasing the mouse outside the box, modals using onClick on the backdrop close unexpectedly and wipe unsaved input. Switching the backdrop handler to onMouseDown (checking e.target === e.currentTarget) fixes this permanently.'],
    ['Nenhuma janela modal com fechamento vulnerável ao arrastar texto foi detectada.', 'No modals vulnerable to drag-close bugs were detected in this project.'],

    // Persistent Checklist Section
    ['Caderno de Vistoria do Projeto (Checklist Persistente)', 'Project Inspection Checklist (Persistent)'],
    ['Memória definitiva:', 'Persistent memory:'],
    ['Itens marcados como ', 'Items marked as '],
    ['✅ Feito', '✅ Done'],
    [' ou ', ' or '],
    ['🚫 Deixar como está', '🚫 Leave as is'],
    [' são memorizados no histórico do seu app. Nas próximas análises de mudanças pontuais, a IA pula esses itens e ', ' are saved in your project history. On future targeted changes, your AI skips them and '],
    ['não gasta seus tokens', 'never burns tokens'],
    [' reavaliando o que já foi decidido!', ' re-auditing past decisions!'],
    ['Carregando checklist...', 'Loading checklist...'],
    ['Copiar Checklist para a IA', 'Copy Checklist for AI'],
    ['Todos (', 'All ('],
    ['⏳ Pendentes (', '⏳ Pending ('],
    ['✅ Feitos (', '✅ Done ('],
    ['🚫 Deixar como está (', '🚫 Leave as is ('],
    ['Sua decisão:', 'Your decision:'],
    ['⏳ Pendente', '⏳ Pending'],
    ['🚫 Não mexer', '🚫 Skip / Leave'],
    ['✅ FEITO', '✅ DONE'],
    ['⏳ PENDENTE', '⏳ PENDING'],
    ['🚫 DEIXAR COMO ESTÁ', '🚫 LEAVE AS IS'],
    ['Aviso de Atualização Automática (Sem Ctrl+F5)', 'Auto-Update Banner (No Ctrl+F5)'],
    ['Fuso Horário Oficial de Brasília', 'Local Timezone Safe Dates (No UTC Day Shift)'],
    ['Trava Anti-Duplo Clique (Catraca de Segurança)', 'Anti Double-Click Lock on Submit Buttons'],
    ['Sanitização de Valores em Real (R$ com Vírgula)', 'Currency Input Sanitization'],
    ['Viagens Repetidas ao Banco (Loops N+1)', 'N+1 Database Queries Inside Loops'],
    ['Busca de Tabela Inteira sem Limite (Select * solto)', 'Unbounded Full-Table Queries (select * without limit)'],
    ['Rascunho Automático em Formulários Longos', 'Auto-Save Drafts on Long Forms'],
    ['Respiro de Rodapé no Celular (Safe Area Inset)', 'Mobile Safe-Area Bottom Padding'],
    ['Janela Modal Blindada contra Arrasto de Mouse', 'Drag-Safe Modal Backdrop (onMouseDown)'],
    ['Aviso Amigável de Queda de Internet', 'Friendly Offline / Network Drop Indicator'],

    // Main Grid Sections
    ['👑 Pilares Mestre da Estrutura (Arquivos Mais Importantes)', '👑 Core Pillars / God Nodes (Highest PageRank)'],
    ['Sustentam o sistema inteiro. Se mexer com erro, pode causar efeito dominó', 'Core files holding the app together — high domino-effect risk if edited carelessly'],
    ['💸 Alertas de Conta Alta no Banco de Dados (Gasto Excessivo)', '💸 Database Cost & Performance Alerts'],
    ['Telas que fazem viagens repetidas ao banco ou trazem tabelas inteiras de uma vez', 'Files running queries inside loops or fetching entire tables without limits'],
    ['📝 Risco de Perder o que Digitou (Sem Rascunho Automático)', '📝 Forms at Risk of Losing User Input (No Draft Cache)'],
    ['Se o usuário atualizar a página ou a internet cair, terá que preencher tudo de novo', 'Long forms without localStorage draft recovery'],
    ['🏋️ Telas Pesadas (Exigem muito do Celular ou Computador)', '🏋️ Heavy Files & Memory Weight'],
    ['Arquivos gigantes ou telas que lidam com arquivos pesados na memória', 'Oversized files or heavy client-side memory operations'],
    ['🔄 Telas Quase Idênticas (Trabalho Duplicado)', '🔄 Twin Logic & Duplicate Screens'],
    ['Lógicas muito parecidas que a IA pode unificar para facilitar a manutenção', 'Files sharing similar tables/logic that must stay in sync'],
    ['📁 Arquivos Mais Longos do Projeto (Top 5)', '📁 Largest Code Files (Top 5)'],
    ['Arquivos com centenas de linhas que podem ser divididos para facilitar', 'Largest files by line count that may benefit from modularization'],
    ['📄 Copiar Resumo Leve', '📄 Copy Code Skeleton'],
    ['🔥 Atenção Alta', '🔥 High Priority'],
    ['⚠️ Moderado', '⚠️ Moderate'],
    ['✅ Projeto bem modularizado! Nenhum arquivo concentra dependências excessivas.', '✅ Well-modularized project! No single file concentrates excessive dependencies.'],
    ['✅ Nenhuma consulta cara ou loop crítico de banco encontrado!', '✅ No expensive DB loops or unbounded queries found!'],
    ['✅ Todos os formulários possuem salvamento de rascunho em cache!', '✅ No high-risk forms missing draft cache!'],
    ['✅ Nenhuma tela com sobrecarga de memória identificada.', '✅ No heavy memory bottlenecks detected.'],
    ['Nenhuma duplicidade expressiva encontrada entre telas.', 'No significant duplicate logic detected between screens.'],

    // Vaccines & Blueprints Tab
    ['Farmácia de Vacinas Anti-Erro & Peças Prontas', 'AI Anti-Bug Vaccines & Canonical Blueprints'],
    ['Copiar Dossiê Consultivo para a IA', 'Copy Consultative Brief for AI'],
    ['✨ Marcar Recomendadas', '✨ Select Recommended'],
    ['Marcar Todas (', 'Select All ('],
    ['Limpar Tudo', 'Clear All'],
    ['📋 Status do seu Dossiê:', '📋 Brief Status:'],
    ['Proteções incluídas:', 'Vaccines included:'],
    ['Peças prontas incluídas:', 'Blueprints included:'],
    ['🧱 Peças Prontas de Construção (Estruturas Canônicas)', '🧱 Canonical Architecture Blueprints'],
    ['Módulos prontos e testados para o seu app não nascer com defeito estrutural.', 'Battle-tested structural templates so AI-built features start rock solid.'],
    ['🧪 As Vacinas Anti-Erro do Vibe Coding', '🧪 Vibe Coding Anti-Bug Vaccines'],
    ['Regras curtas e diretas com exemplos contrastantes (❌ Como a IA costuma errar vs ✅ Jeito Certo).', 'Short, high-signal rules with contrasting examples (❌ Common AI Mistake vs ✅ Bulletproof Pattern).'],
    ['🎨 Visual & Telas (', '🎨 UI & UX ('],
    ['🗄️ Banco de Dados (', '🗄️ Database ('],
    ['🔒 Segurança & Acesso (', '🔒 Security & Auth ('],
    ['⚙️ Estabilidade & Erros (', '⚙️ Stability & Resilience ('],
    ['➕ Incluir no Dossiê', '➕ Add to Brief'],
    ['✅ Incluído no Dossiê', '✅ Added to Brief'],
    ['✨ Recomendada para seu App', '✨ Recommended for Your App'],
    ['👁️ Ver Código Pronto', '👁️ View Blueprint Code'],
    ['👁️ Ver Regra: ❌ Erro vs ✅ Jeito Certo', '👁️ View Rule: ❌ Wrong vs ✅ Right'],

    // 3D Graph Legend
    ['Legenda do Mapa', 'Map Legend'],
    ['▼ ESCONDER', '▼ HIDE'],
    ['◀ MOSTRAR', '◀ SHOW'],
    ['Domínio de Negócio (A Cidade)', 'Business Domain (Cluster)'],
    ['Duplo clique para abrir/fechar.', 'Click to expand / collapse.'],
    ['Arquivos Reais (Telas/Módulos)', 'Source Files (Screens/Modules)'],
    ['Lógicas Inofensivas', 'Pure Logic / Helpers'],
    ['Zona de Perigo (Banco de Dados)', 'Database Mutation Zone'],
    ['Seta Laranja:', 'Orange Arrow:'],
    ['Dependência de Código', 'Code Dependency'],
    ['Seta Rosa:', 'Pink Arrow:'],
    ['Conexão Wi-Fi (Rotas/APIs)', 'API / Route Connection'],
    ['Filtros Visuais', 'Visual Filters'],
    ['Mostrar Arquivos Menores (Azul)', 'Show Source Files (Blue)'],
    ['Mostrar Lógica Inofensiva (Verde)', 'Show Pure Logic (Green)'],
    ['Mostrar Risco de Banco (Vermelho)', 'Show DB Mutations (Red)'],
    ['🌌 Expandir Todas as Cidades', '🌌 Expand All Clusters'],
    ['🏙️ Recolher para Visão Global', '🏙️ Collapse to Global View'],
    ['Focar em Domínio de Negócio:', 'Focus on Business Domain:'],
    ['-- Visão Global (Todos) --', '-- Global View (All) --'],

    // Toasts
    ['✅ Comando cirúrgico copiado! Agora é só colar no chat da sua IA (Ctrl + V).', '✅ Surgical brief copied! Paste it into your AI chat (Ctrl + V).'],
    ['🎯 Ordem cirúrgica copiada! Itens já feitos ou ignorados foram omitidos para poupar tokens da sua IA.', '🎯 Surgical brief copied! Already-decided checklist items were omitted to save tokens.'],
    ['📋 Dossiê Consultivo copiado com sucesso! Agora é só colar no chat da sua IA (Ctrl + V).', '📋 Consultative brief copied! Paste it into your AI chat (Ctrl + V).']
  ];

  const PLACEHOLDER_MAP = {
    'Ex: C:\\MeusProjetos\\App': 'e.g. C:\\MyProjects\\MyApp or /Users/you/my-app',
    'Ex: Criar um botão para exportar extrato em Excel ou Ajustar o campo de valor do pagamento': 'e.g. Add a date filter to the dashboard or Create an Export to CSV button'
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
      ? 'ContextMap — Local AST Context Map & MCP Server'
      : 'ContextMap — Mapa de Contexto Local & Servidor MCP';

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
    // Refresh localized backend catalogs (Vaccines, Blueprints, Checklist, Dates) live!
    try {
      if (typeof window.carregarConstrutorVacinas === 'function') window.carregarConstrutorVacinas();
      if (typeof window.carregarChecklistProjeto === 'function') window.carregarChecklistProjeto();
      if (typeof window.carregarHistoricoECofre === 'function') window.carregarHistoricoECofre();
      if (typeof window.carregarMonitorSaude === 'function' && document.getElementById('tab-saude')?.classList.contains('active')) {
        window.carregarMonitorSaude();
      }
    } catch (e) {}
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
      <button id="cm-btn-en" type="button" onclick="setContextMapLang('en')" style="border:none; border-radius:6px; padding:5px 9px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;">🇺🇸 EN</button>
      <button id="cm-btn-pt" type="button" onclick="setContextMapLang('pt')" style="border:none; border-radius:6px; padding:5px 9px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;">🇧🇷 PT</button>
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
