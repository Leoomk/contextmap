/**
 * Catálogo Canônico de Vacinas Anti-Erro e Super-Blocos Estruturais do MAPACONTEXTO (v5.0)
 * Baseado no estudo profundo de Engenharia de Contexto (Packmind, GitHub Spec-Kit e BMAD).
 */

export const CATEGORIAS_VACINAS = {
  'ui-ux': {
    id: 'ui-ux',
    nome: '🎨 Visual e Telas (UI/UX)',
    descricao: 'Previne falhas de layout móvel, fusos horários, fechamento acidental de janelas e perda de rascunhos.'
  },
  'banco': {
    id: 'banco',
    nome: '🗄️ Banco de Dados e Velocidade',
    descricao: 'Elimina buscas em loop (N+1), acelera consultas RLS e protege o navegador contra travamento de memória.'
  },
  'seguranca': {
    id: 'seguranca',
    nome: '🔒 Segurança e Login',
    descricao: 'Tranca loops de login, blinda rotas de Admin no banco e impede vazamento de chaves-mestras.'
  },
  'estabilidade': {
    id: 'estabilidade',
    nome: '⚙️ Estabilidade e Pagamentos',
    descricao: 'Bloqueia cliques duplos em pagamentos, trata erros no servidor e evita quebras de tela no Next.js/SSR.'
  }
};

export const VACINAS_CATALOGO = [
  // 1. Fuso Horário Brasil
  {
    id: 'vacina-01-fuso-horario-brasil',
    numero: 1,
    categoria: 'ui-ux',
    nome: 'Consertar Datas que Voltam 1 Dia à Noite (Fuso Horário)',
    resumoLeigo: 'Impede a data de voltar para o dia anterior às 21h por causa do fuso horário internacional.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'NUNCA use `new Date("YYYY-MM-DD")` diretamente. Sempre anexe o horário do meio-dia local (`T12:00:00-03:00`) ou utilize bibliotecas com fuso explícito (`date-fns-tz` com "America/Sao_Paulo").',
    exemploErrado: `// ❌ ERRADO: Em UTC, no fuso de Brasília vira 15/10/2026 21:00 (dia anterior!)
const data = new Date("2026-10-16");
console.log(data.toLocaleDateString()); // Pode exibir dia 15!`,
    exemploBlindado: `// ✅ BLINDADO: Anexe sempre meio-dia e offset do Brasil (-03:00)
const dataSegura = new Date("2026-10-16T12:00:00-03:00");

// Ou com date-fns-tz:
// import { formatInTimeZone } from 'date-fns-tz';
// const texto = formatInTimeZone(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy');`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      return arquivos.some(a => a.metricasHeuristicas?.temManipulacaoData || a.arquivo.toLowerCase().includes('calendar') || a.arquivo.toLowerCase().includes('data'));
    }
  },

  // 2. Modal Backdrop Drag
  {
    id: 'vacina-02-modal-fechamento-arrasto',
    numero: 2,
    categoria: 'ui-ux',
    nome: 'Impedir Janela de Fechar Sozinha ao Arrastar o Mouse',
    resumoLeigo: 'Impede a janela de fechar quando o usuário clica e arrasta o mouse para fora ao selecionar um texto.',
    globs: 'src/components/**/*.{ts,tsx,jsx},src/pages/**/*.{ts,tsx,jsx},components/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'NUNCA feche o fundo escuro (overlay/backdrop) de uma modal usando `onClick` (nem mesmo com `e.target === e.currentTarget` ou `stopPropagation`), pois selecionar texto dentro de um input e soltar o mouse fora fecha a janela. SEMPRE use `onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}` (ou `addEventListener("mousedown", ...)` em JS puro). Em Radix/Shadcn, use `onPointerDownOutside={(e) => e.preventDefault()}`.',
    exemploErrado: `// ❌ ERRADO: Fecha se o usuário selecionar texto dentro de um input e soltar o mouse fora
<div className="fixed inset-0 bg-black/50" onClick={onClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    <input defaultValue="Selecione este texto e solte fora..." />
  </div>
</div>`,
    exemploBlindado: `// ✅ BLINDADO: Verifica se o clique COMEÇOU no fundo (onMouseDown)
<div 
  className="fixed inset-0 bg-black/50" 
  onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
>
  <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
    <input defaultValue="Texto selecionável 100% seguro contra fechamento acidental!" />
  </div>
</div>
// Em Radix / Shadcn Dialog:
// <DialogContent onPointerDownOutside={(e) => e.preventDefault()} />`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      if (relatorioSaude && relatorioSaude.statusModalArrasto) {
        return relatorioSaude.statusModalArrasto.temProblema;
      }
      return arquivos.some(a => a.arquivo.toLowerCase().includes('modal') || a.arquivo.toLowerCase().includes('dialog'));
    }
  },

  // 3. Supabase Auth Loop Infinito
  {
    id: 'vacina-03-supabase-auth-loop-infinito',
    numero: 3,
    categoria: 'seguranca',
    nome: 'Evitar Tela Piscando sem Parar no Login (Supabase)',
    resumoLeigo: 'Impede a tela de login de piscar sem parar ou congelar o navegador com atualizações infinitas.',
    globs: 'src/contexts/**/*.{ts,tsx,js,jsx},src/hooks/**/*.{ts,tsx,js,jsx},src/lib/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'SEMPRE desinscreva o listener retornado por `supabase.auth.onAuthStateChange` no return do useEffect e use `useRef` para comparar o `userId` antes de atualizar o estado.',
    exemploErrado: `// ❌ ERRADO: Cria um novo listener em cada render e dispara loop infinito
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user);
  });
}, []);`,
    exemploBlindado: `// ✅ BLINDADO: Com cancelamento na desmontagem e verificação de ID
useEffect(() => {
  const lastUserIdRef = { current: null };
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const currentId = session?.user?.id ?? null;
    if (lastUserIdRef.current !== currentId) {
      lastUserIdRef.current = currentId;
      setUser(session?.user ?? null);
    }
  });
  return () => subscription.unsubscribe();
}, []);`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('auth') || a.metricasHeuristicas?.temSupabase);
    }
  },

  // 4. Proibição de Busca em Loop (N+1 Queries)
  {
    id: 'vacina-04-n-mais-um-queries-loop',
    numero: 4,
    categoria: 'banco',
    nome: 'Proibir a IA de Fazer 50 Consultas no Banco de Uma Vez (Loop)',
    resumoLeigo: 'Impede a IA de fazer 50 viagens ao banco de dados dentro de uma lista quando poderia fazer 1 só.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'NUNCA execute `await supabase.from()` ou consultas SQL dentro de loops `.map()` ou `for()`. Use joins com PostgREST (`.select("*, autor:usuarios(*)")`) ou cláusula `.in("id", ids)`.',
    exemploErrado: `// ❌ ERRADO: Dispara 1 consulta para cada post da lista (gasto absurdo)
const posts = await supabase.from('posts').select('*');
const postsComAutor = await Promise.all(posts.data.map(async (p) => {
  const autor = await supabase.from('users').select('*').eq('id', p.user_id).single();
  return { ...p, autor };
}));`,
    exemploBlindado: `// ✅ BLINDADO: 1 única consulta que já traz os autores juntos (JOIN nativo)
const { data: postsComAutor } = await supabase
  .from('posts')
  .select('*, autor:users(id, nome, email)');

// Ou se as tabelas não tiverem relacionamento direto:
// const userIds = [...new Set(posts.map(p => p.user_id))];
// const { data: users } = await supabase.from('users').select('*').in('id', userIds);`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      const viloes = relatorioSaude?.viloesCustoBanco || [];
      return viloes.some(v => v.alertas?.some(al => al.includes('loop') || al.includes('repetição')));
    }
  },

  // 5. Rascunho Automático de Formulário
  {
    id: 'vacina-05-rascunho-automatico-localstorage',
    numero: 5,
    categoria: 'ui-ux',
    nome: 'Salvar Rascunho para Nunca Perder o que Digitou',
    resumoLeigo: 'Salva o que o usuário digita temporariamente no navegador contra quedas de internet ou recargas.',
    globs: 'src/components/**/*.{ts,tsx,jsx},src/pages/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'Formulários com 3 ou mais campos de entrada DEVEM persistir rascunho em `localStorage` com debounce de 500ms e limpar o rascunho apenas após confirmação de salvamento com sucesso.',
    exemploErrado: `// ❌ ERRADO: Se o usuário recarregar a tela sem querer, perde tudo o que digitou
const [form, setForm] = useState({ titulo: '', descricao: '', observacoes: '' });`,
    exemploBlindado: `// ✅ BLINDADO: Restaura rascunho e salva a cada digitação com atraso suave
const CHAVE_RASCUNHO = 'draft_meu_formulario';
const [form, setForm] = useState(() => {
  const salvo = typeof window !== 'undefined' ? localStorage.getItem(CHAVE_RASCUNHO) : null;
  return salvo ? JSON.parse(salvo) : { titulo: '', descricao: '', observacoes: '' };
});

useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(form));
  }, 500);
  return () => clearTimeout(timer);
}, [form]);

// No salvamento final com sucesso:
// localStorage.removeItem(CHAVE_RASCUNHO);`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      return (relatorioSaude?.formulariosSemCache?.length || 0) > 0;
    }
  },

  // 6. Viewport Mobile DVH
  {
    id: 'vacina-06-viewport-mobile-dvh',
    numero: 6,
    categoria: 'ui-ux',
    nome: 'Evitar Botão Cortado ou Escondido na Barra do Celular',
    resumoLeigo: 'Impede o rodapé ou botões inferiores de ficarem cortados pela barra do Safari/Chrome no celular.',
    globs: 'src/**/*.{css,tsx,jsx,html},app/**/*.{css,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'NUNCA utilize `100vh` em layouts de tela inteira móvel. Use `min-h-dvh` (Dynamic Viewport Height) ou `min-h-[100dvh]` combinado com `pb-[env(safe-area-inset-bottom)]`.',
    exemploErrado: `// ❌ ERRADO: No iPhone, a barra de navegação fica por cima do botão Salvar
<div className="h-screen w-screen flex flex-col justify-between">
  <div>Conteúdo</div>
  <button>Salvar (fica escondido no iPhone!)</button>
</div>`,
    exemploBlindado: `// ✅ BLINDADO: Acompanha o tamanho real da tela e respeita o entalhe inferior
<div className="min-h-dvh w-full flex flex-col justify-between pb-[env(safe-area-inset-bottom)]">
  <main className="flex-1 overflow-y-auto">Conteúdo</main>
  <footer className="p-4 bg-white border-t">Botão Salvar Visível</footer>
</div>`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.endsWith('.css') || a.arquivo.toLowerCase().includes('layout') || a.arquivo.toLowerCase().includes('app'));
    }
  },

  // 7. Proteção de Rota Admin no Banco
  {
    id: 'vacina-07-protecao-rotas-admin-rls',
    numero: 7,
    categoria: 'seguranca',
    nome: 'Trancar Área de Administrador no Banco (Segurança Real)',
    resumoLeigo: 'Garante que ninguém consiga ver ou alterar dados de Administrador apenas mudando a URL no navegador.',
    globs: 'src/**/*.{ts,tsx,js,jsx},supabase/**/*.sql',
    alwaysApply: false,
    regraImperativa: 'NUNCA confie apenas em esconder o botão no frontend. SEMPRE ative `ENABLE ROW LEVEL SECURITY` e use funções `SECURITY DEFINER` para validar privilégio no banco de dados.',
    exemploErrado: `// ❌ ERRADO: Só esconde na tela, mas a tabela no banco continua aberta
if (usuario.cargo !== 'admin') {
  return <p>Acesso negado</p>;
}`,
    exemploBlindado: `// ✅ BLINDADO: Trava obrigatória no próprio banco de dados (PostgreSQL RLS)
ALTER TABLE transacoes_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas administradores gerenciam transacoes"
ON transacoes_admin FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('admin') || a.arquivo.toLowerCase().includes('role'));
    }
  },

  // 8. Confirmação de Exclusão Digitada
  {
    id: 'vacina-08-confirmacao-exclusao-digitada',
    numero: 8,
    categoria: 'ui-ux',
    nome: 'Exigir Digitar o Nome Antes de Apagar Algo Importante',
    resumoLeigo: 'Exige que a pessoa digite o nome exato antes de apagar algo importante, evitando cliques por engano.',
    globs: 'src/components/**/*.{ts,tsx,jsx},src/pages/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'Ações de deleção permanente ou destrutiva NÃO PODEM usar simples `window.confirm()`. Devem exibir modal com botão desabilitado até que o usuário digite o nome do recurso.',
    exemploErrado: `// ❌ ERRADO: Um clique por engano no 'OK' apaga o projeto inteiro
const excluir = () => {
  if (confirm('Deseja apagar?')) api.delete(id);
};`,
    exemploBlindado: `// ✅ BLINDADO: O botão fica cinza até digitar o nome com exatidão
function ModalConfirmarExclusao({ nomeRecurso, onConfirm, onCancel }) {
  const [digitado, setDigitado] = useState('');
  const liberado = digitado.trim() === nomeRecurso.trim();
  return (
    <div className="modal">
      <p>Para apagar, digite <strong>{nomeRecurso}</strong> abaixo:</p>
      <input value={digitado} onChange={e => setDigitado(e.target.value)} />
      <button disabled={!liberado} onClick={onConfirm} className="btn-perigo">
        Excluir Definitivamente
      </button>
    </div>
  );
}`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('delete') || a.arquivo.toLowerCase().includes('excluir') || a.arquivo.toLowerCase().includes('remove'));
    }
  },

  // 9. Lista Infinita Virtualizada
  {
    id: 'vacina-09-lista-infinita-virtualizacao',
    numero: 9,
    categoria: 'banco',
    nome: 'Rolar Listas Grandes sem Travar a Memória do Celular',
    resumoLeigo: 'Desenha na tela apenas os itens visíveis, permitindo rolar milhares de linhas sem travar o celular.',
    globs: 'src/components/**/*.{ts,tsx,jsx},src/pages/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'Listas com potencial superior a 100 itens NÃO DEVEM renderizar todos os nós no DOM. Utilize `@tanstack/react-virtual` ou paginação server-side com limite estrito.',
    exemploErrado: `// ❌ ERRADO: Criar 2.000 cartões no HTML ao mesmo tempo congela o navegador
<div>
  {milharesDeItens.map(item => <Card key={item.id} data={item} />)}
</div>`,
    exemploBlindado: `// ✅ BLINDADO: Desenha apenas as ~10 linhas que cabem na visão da pessoa
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizador = useVirtualizer({
  count: itens.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 60,
});
// Renderiza somente virtualizador.getVirtualItems()`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      return arquivos.some(a => (a.totalLinhas || a.linhasTotais || 0) > 800 || a.tags?.includes('ARQUIVO_GIGANTE') || a.metricasHeuristicas?.temManipulacaoMemoria);
    }
  },

  // 10. Anti-Clique Duplo e Idempotência
  {
    id: 'vacina-10-anti-clique-duplo-idempotencia',
    numero: 10,
    categoria: 'estabilidade',
    nome: 'Travar Botão de Pagamento para não Cobrar 2 Vezes por Impaciência',
    resumoLeigo: 'Trava o botão no primeiro clique para a pessoa não pagar ou salvar duas vezes por impaciência.',
    globs: 'src/**/*.{ts,tsx,jsx},app/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'Botões de submissão financeira ou gravação DEVEM desabilitar imediatamente no 1º clique (`isPending`), exibir spinner e anexar chave de idempotência (UUID v4).',
    exemploErrado: `// ❌ ERRADO: Clicar 2 vezes rápido gera 2 pagamentos na fatura
<button onClick={async () => {
  await api.post('/pagar', { valor: 100 });
}}>Pagar</button>`,
    exemploBlindado: `// ✅ BLINDADO: Botão trava na hora e envia chave única de prevenção
const [processando, setProcessando] = useState(false);

const handlePagar = async () => {
  if (processando) return;
  setProcessando(true);
  try {
    const chaveUnica = crypto.randomUUID();
    await api.post('/pagar', { valor: 100 }, { headers: { 'Idempotency-Key': chaveUnica } });
  } finally {
    setProcessando(false);
  }
};`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('pagamento') || a.arquivo.toLowerCase().includes('payment') || a.arquivo.toLowerCase().includes('checkout') || a.arquivo.toLowerCase().includes('compra'));
    }
  },

  // 11. Next.js SSR Hydration Safe
  {
    id: 'vacina-11-nextjs-ssr-hydration-safe',
    numero: 11,
    categoria: 'estabilidade',
    nome: 'Evitar Erro de Tela Diferente no Carregamento Inicial (SSR)',
    resumoLeigo: 'Evita a tela piscar ou quebrar no Next.js ao tentar ler coisas do navegador antes da hora.',
    globs: 'app/**/*.{ts,tsx,jsx},src/**/*.{ts,tsx,jsx}',
    alwaysApply: false,
    regraImperativa: 'NUNCA acesse `window` ou `localStorage` diretamente no corpo de renderização de componentes React/Next.js. Utilize `useSyncExternalStore` ou renderize após montagem com `isMounted`.',
    exemploErrado: `// ❌ ERRADO: No servidor o localStorage não existe, gerando erro vermelho
function CartaoTema() {
  const tema = localStorage.getItem('tema') || 'claro';
  return <span>Tema: {tema}</span>;
}`,
    exemploBlindado: `// ✅ BLINDADO: Espera o componente montar no navegador antes de ler
function CartaoTema() {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  if (!montado) return <span className="opacity-0">...</span>;
  const tema = localStorage.getItem('tema') || 'claro';
  return <span>Tema: {tema}</span>;
}`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.includes('app/') || a.arquivo.includes('next.config') || a.arquivo.toLowerCase().includes('page.tsx'));
    }
  },

  // 12. Bloqueio Vazamento Service Role Key
  {
    id: 'vacina-12-bloqueio-vazamento-service-role-key',
    numero: 12,
    categoria: 'seguranca',
    nome: 'Trancar a Chave-Mestra do Banco no Servidor (Anti-Vazamento)',
    resumoLeigo: 'Proíbe que a chave com super-poderes do banco de dados vaze no código que vai para o navegador.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: '`SUPABASE_SERVICE_ROLE_KEY` NUNCA deve ser referenciada em arquivos do lado cliente. Adicione `import "server-only"` em arquivos utilitários com privilégio de admin.',
    exemploErrado: `// ❌ ERRADO: Se importado no frontend, qualquer pessoa rouba a chave-mestra
import { createClient } from '@supabase/supabase-js';
export const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY);`,
    exemploBlindado: `// ✅ BLINDADO: O pacote 'server-only' quebra o build se vazar para o cliente
import 'server-only';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Chave-mestra ausente nas variáveis de ambiente!');
}
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('supabase') || a.arquivo.toLowerCase().includes('admin'));
    }
  },

  // 13. Retorno Tipado Anti-Engolir Erros
  {
    id: 'vacina-13-retorno-tipado-anti-engolir-erros',
    numero: 13,
    categoria: 'estabilidade',
    nome: 'Proibir o Sistema de Fingir que Deu Certo Quando Falhou',
    resumoLeigo: 'Obriga o sistema a avisar quando algo falhou em vez de fingir que deu certo e deixar você no escuro.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'Server actions e funções assíncronas DEVEM retornar união discriminada `{ success: true, data } | { success: false, error: string }`. NUNCA use `catch (e) {}` vazio.',
    exemploErrado: `// ❌ ERRADO: Falha no banco, mas retorna sucesso e esconde o problema
async function salvar(dados) {
  try {
    await db.salvar(dados);
  } catch (e) {}
  return { sucesso: true };
}`,
    exemploBlindado: `// ✅ BLINDADO: Comunicação honesta e com mensagem clara de erro
async function salvar(dados) {
  try {
    const salvo = await db.salvar(dados);
    return { success: true, data: salvo };
  } catch (erro) {
    console.error('Erro ao salvar:', erro);
    return { success: false, error: erro?.message || 'Falha ao salvar dados' };
  }
}`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('action') || a.arquivo.toLowerCase().includes('service') || a.arquivo.toLowerCase().includes('api'));
    }
  },

  // 14. Prevenção de Dados Velhos (Stale Closures) em WebSockets
  {
    id: 'vacina-14-stale-closures-listeners-tempo-real',
    numero: 14,
    categoria: 'estabilidade',
    nome: 'Garantir Mensagens e Avisos Atualizados em Tempo Real',
    resumoLeigo: 'Garante que mensagens de chat ou avisos em tempo real leiam a versão mais nova dos seus dados.',
    globs: 'src/hooks/**/*.{ts,tsx,js,jsx},src/contexts/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'Listeners de WebSocket, canais Supabase Realtime ou `setInterval` que dependam do estado devem manter uma referência atualizada via `useRef` para não ler valores obsoletos.',
    exemploErrado: `// ❌ ERRADO: Lê uma versão antiga da lista e apaga as mensagens anteriores
useEffect(() => {
  canal.on('mensagem', (nova) => {
    setLista([...lista, nova]); // 'lista' está congelada no passado!
  });
}, []);`,
    exemploBlindado: `// ✅ BLINDADO: Usa atualização funcional segura ou useRef
useEffect(() => {
  canal.on('mensagem', (nova) => {
    setLista(anterior => [...anterior, nova]); // Pega sempre o estado mais recente!
  });
  return () => canal.unsubscribe();
}, []);`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('socket') || a.arquivo.toLowerCase().includes('realtime') || a.arquivo.toLowerCase().includes('chat'));
    }
  },

  // 15. Aceleração 100x de Políticas RLS com Subquery Escalar
  {
    id: 'vacina-15-otimizacao-rls-auth-uid',
    numero: 15,
    categoria: 'banco',
    nome: 'Fazer as Regras de Segurança do Banco Ficarem 100x Mais Rápidas',
    resumoLeigo: 'Faz a checagem de permissão do banco ficar 100 vezes mais rápida envolvendo a regra em parênteses.',
    globs: 'supabase/**/*.sql,migrations/**/*.sql',
    alwaysApply: false,
    regraImperativa: 'Em políticas RLS do PostgreSQL, NUNCA use `auth.uid() = user_id` diretamente. SEMPRE envolva em subquery escalar `(SELECT auth.uid()) = user_id` e crie índice B-Tree na coluna.',
    exemploErrado: `-- ❌ LENTO: Roda a função auth.uid() linha por linha em 100.000 registros
CREATE POLICY "Ver proprios dados" ON documentos
FOR SELECT USING (auth.uid() = user_id);`,
    exemploBlindado: `-- ✅ 100x MAIS RÁPIDO: Calcula 1 única vez para toda a busca e usa índice
CREATE POLICY "Ver proprios dados" ON documentos
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_documentos_user_id ON documentos(user_id);`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      return (relatorioSaude?.tabelasBanco?.lista?.length || 0) > 0 || arquivos.some(a => a.arquivo.endsWith('.sql'));
    }
  },

  // 16. Detector de Nova Versão & Auto-Reload sem Ctrl+F5
  {
    id: 'vacina-16-detector-versao-sem-ctrl-f5',
    numero: 16,
    categoria: 'estabilidade',
    nome: 'Avisar Atualização do App sem Precisar de Ctrl+F5',
    resumoLeigo: 'Avisa o usuário quando você sobe uma atualização nova no sistema e mostra um botão elegante "Atualizar Agora", evitando que ele continue usando a versão velha presa na memória do navegador.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx},*.js,index.html',
    alwaysApply: false,
    regraImperativa: 'Todo aplicativo web (seja em React/Vite ou HTML/JS Puro) DEVE verificar periodicamente um arquivo leve `version.json` (com cache-busting `?t=Date.now()`) ao focar na aba (`visibilitychange`) e exibir um aviso amigável convidando o usuário a recarregar quando houver nova versão no ar.',
    exemploErrado: `// ❌ ERRADO: Não monitora atualizações. Quando você sobe código novo, o usuário no celular ou PC continua vendo o sistema velho até apertar Ctrl+F5 ou limpar o cache.`,
    exemploBlindado: `// ✅ BLINDADO (SERVE TANTO PARA JAVASCRIPT PURO QUANTO PARA REACT/VITE):
// 1. Tenha um arquivo 'version.json' (ou 'public/version.json') com: { "version": "1.0.1" }
// 2. No código principal do app (app.js ou App.tsx):
(function iniciarSentinelaDeVersao() {
  if (typeof window === 'undefined') return;
  let versaoInicial = null;

  // Se usar Vite, recarrega automaticamente se um pedaço antigo de código sumiu:
  window.addEventListener('vite:preloadError', () => window.location.reload());

  async function checarNovaVersao() {
    try {
      const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const dados = await res.json();
      if (!versaoInicial) {
        versaoInicial = dados.version;
      } else if (dados.version && dados.version !== versaoInicial) {
        mostrarBarraDeAtualizacao();
      }
    } catch (e) {}
  }

  function mostrarBarraDeAtualizacao() {
    if (document.getElementById('banner-atualizacao-app')) return;
    const barra = document.createElement('div');
    barra.id = 'banner-atualizacao-app';
    barra.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#f8fafc;border:2px solid #38bdf8;padding:12px 20px;border-radius:12px;z-index:99999;display:flex;align-items:center;gap:14px;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;';
    barra.innerHTML = '<span>🚀 <strong>Nova atualização disponível!</strong></span><button onclick="window.location.reload()" style="background:#38bdf8;color:#0f172a;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">🔄 Atualizar Agora</button>';
    document.body.appendChild(barra);
  }

  checarNovaVersao();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checarNovaVersao();
  });
  setInterval(checarNovaVersao, 5 * 60 * 1000);
})();`,
    detectarNoProjeto: (arquivos, relatorioSaude) => {
      // Recomenda sempre que o sensor detectar que o projeto ainda NÃO tem a proteção!
      if (relatorioSaude && relatorioSaude.statusAtualizacaoApp) {
        return !relatorioSaude.statusAtualizacaoApp.temProtecao;
      }
      return true;
    }
  },

  // 17. Tratamento de Moeda Brasileira (R$ com Vírgula vs Ponto no Banco)
  {
    id: 'vacina-17-moeda-brasileira-virgula-banco',
    numero: 17,
    categoria: 'ui-ux',
    nome: 'Evitar Erros de Moeda Brasileira (R$ com Vírgula vs Ponto no Banco)',
    resumoLeigo: 'Evita que valores como R$ 1.500,50 virem R$ 1,00 ou quebrem o banco de dados que só entende ponto decimal americano.',
    globs: 'src/components/**/*.{ts,tsx,jsx},src/pages/**/*.{ts,tsx,jsx},src/utils/**/*.{ts,js}',
    alwaysApply: false,
    regraImperativa: 'NUNCA envie valores digitados com vírgula e máscara ("R$ 1.500,50") diretamente para cálculos ou banco. SEMPRE sanitize a entrada convertendo vírgulas em pontos e removendo símbolos, ou armazene em centavos inteiros.',
    exemploErrado: `// ❌ ERRADO: O banco recebe "1.500,50", tenta ler como número americano e salva só R$ 1,00 ou dá erro de banco (NaN)
const valorParaSalvar = Number(inputValor.replace('R$', '')); // Vira NaN ou 1!`,
    exemploBlindado: `// ✅ BLINDADO: Função à prova de balas para padrão brasileiro (BRL)
function limparMoedaBRL(valorTexto) {
  if (typeof valorTexto === 'number') return valorTexto;
  if (!valorTexto) return 0;
  // Remove pontos de milhar, troca vírgula por ponto e remove letras/símbolos
  const limpo = String(valorTexto)
    .replace(/\\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

// Exemplo: "R$ 1.500,50" -> 1500.50 (Pronto e seguro para o banco de dados!)`,
    detectarNoProjeto: (arquivos) => {
      const termos = ['valor', 'preco', 'preco_', 'price', 'custo', 'moeda', 'financeiro', 'pagamento', 'orcamento', 'total', 'pix', 'cartao'];
      return arquivos.some(a => termos.some(t => a.arquivo.toLowerCase().includes(t)));
    }
  },

  // 18. Alerta Amigável de Queda de Internet (Modo Sem Sinal)
  {
    id: 'vacina-18-alerta-queda-internet-offline',
    numero: 18,
    categoria: 'estabilidade',
    nome: 'Aviso Amigável de Queda de Internet (Modo Sem Sinal)',
    resumoLeigo: 'Avisa o usuário assim que o sinal de internet oscilar no celular ou Wi-Fi, impedindo cliques em botões que falhariam silenciosamente.',
    globs: 'src/**/*.{ts,tsx,js,jsx},app/**/*.{ts,tsx,js,jsx}',
    alwaysApply: false,
    regraImperativa: 'Aplicações interativas DEVEM monitorar os eventos "online" e "offline" da janela, alertando o usuário com barra ou aviso flutuante para evitar tentativas frustradas de salvar dados sem conexão.',
    exemploErrado: `// ❌ ERRADO: O cliente perde a internet no 4G, clica em Salvar, o botão gira em loop infinito e parece que o app estragou
const salvar = async () => {
  await api.post('/dados', form);
};`,
    exemploBlindado: `// ✅ BLINDADO: Sentinela de conexão com aviso automático
useEffect(() => {
  const aoCair = () => {
    // Exibe banner amarelo suave no topo
    setAvisoRede('⚠️ Sem conexão com a internet. Verifique seu Wi-Fi ou dados móveis.');
  };
  const aoVoltar = () => {
    setAvisoRede('🟢 Conexão restabelecida com sucesso!');
    setTimeout(() => setAvisoRede(null), 3000);
  };

  window.addEventListener('offline', aoCair);
  window.addEventListener('online', aoVoltar);
  return () => {
    window.removeEventListener('offline', aoCair);
    window.removeEventListener('online', aoVoltar);
  };
}, []);`,
    detectarNoProjeto: (arquivos) => {
      return arquivos.some(a => a.arquivo.toLowerCase().includes('app') || a.arquivo.toLowerCase().includes('layout'));
    }
  }
];

export const SUPER_BLOCOS_CATALOGO = [
  {
    id: 'auth-rbac',
    numero: 1,
    nome: '🔐 Peça Pronta #1: Login Completo com Área de Admin Separada',
    resumoLeigo: 'Cria o cadastro e login completo do app já separando quem é Usuário comum de quem é Administrador, com segurança travada no banco.',
    descricao: 'Estrutura recomendada: Tabela de perfis no banco, segurança automática e tela de login.',
    arquivos: [
      {
        caminho: 'supabase/migrations/001_auth_rbac.sql',
        descricao: 'Tabela de perfis, enum de papéis e segurança automática no banco',
        conteudo: `-- 1. Enum com os papéis do sistema
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 2. Tabela de perfis vinculada ao auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ativação de RLS estrito
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprio perfil" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

-- 4. Função auxiliar segura para verificar se é admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 5. Gatilho automático para criar o perfil ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`
      },
      {
        caminho: 'src/middleware.ts',
        descricao: 'Segurança de rota que barra não-administradores de entrarem na pasta /admin',
        conteudo: `import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redireciona para login se tentar acessar área restrita deslogado
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se acessar /admin, checa se tem perfil de admin no banco
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
`
      }
    ]
  },

  {
    id: 'admin-kpis',
    numero: 2,
    nome: '📊 Painel do Chefe (Dashboard Executivo com KPIs e Auditoria)',
    resumoLeigo: 'Cria uma área administrativa pronta com cartões de indicadores (Usuários, Faturamento, Alertas) e tabela que registra tudo o que acontece no sistema.',
    descricao: 'Dashboard moderno com 4 cartões de indicadores essenciais e uma tabela de "Caixa Preta" para auditoria de ações importantes.',
    arquivos: [
      {
        caminho: 'supabase/migrations/002_audit_logs.sql',
        descricao: 'Tabela de auditoria à prova de adulteração (apenas inserts permitidos)',
        conteudo: `-- Tabela de Caixa Preta do Sistema (Auditoria)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Somente Administradores podem ler os logs
CREATE POLICY "Apenas admin lê logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (check_is_admin());

-- Qualquer ação autenticada pode registrar um log
CREATE POLICY "Inserção de log autenticado" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
`
      },
      {
        caminho: 'src/components/admin/AdminDashboardView.tsx',
        descricao: 'Componente visual pronto com cartões de KPI e tabela de auditoria',
        conteudo: `import React from 'react';

export interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtexto: string;
  icone: string;
}

export function KpiCard({ titulo, valor, subtexto, icone }: KpiCardProps) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', flex: 1, minWidth: '220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>{titulo}</span>
        <span style={{ fontSize: '20px' }}>{icone}</span>
      </div>
      <div style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 700 }}>{valor}</div>
      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{subtexto}</div>
    </div>
  );
}

export function AdminDashboardView({ kpis = [], logs = [] }: { kpis?: any[]; logs?: any[] }) {
  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
        📊 Painel Executivo de Controle
      </h1>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <KpiCard titulo="Total de Usuários" valor={kpis[0]?.valor || "1.240"} subtexto="+12% este mês" icone="👥" />
        <KpiCard titulo="Receita Mensal Estimada" valor={kpis[1]?.valor || "R$ 48.500"} subtexto="Meta atingida em 94%" icone="💰" />
        <KpiCard titulo="Consultas ao Banco (Hoje)" valor={kpis[2]?.valor || "14.820"} subtexto="Uso estável e otimizado" icone="⚡" />
        <KpiCard titulo="Taxa de Erros / Falhas" valor={kpis[3]?.valor || "0,02%"} subtexto="Dentro da margem segura" icone="🛡️" />
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '16px' }}>
          📋 Caixa Preta de Auditoria (Últimas Ações)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '10px' }}>Data / Hora</th>
              <th style={{ padding: '10px' }}>Usuário</th>
              <th style={{ padding: '10px' }}>Ação Executada</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhuma atividade suspeita recente.</td></tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px' }}>{log.data}</td>
                  <td style={{ padding: '10px' }}>{log.usuario}</td>
                  <td style={{ padding: '10px' }}>{log.acao}</td>
                  <td style={{ padding: '10px' }}>{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`
      }
    ]
  },

  {
    id: 'safe-modal-toast',
    numero: 3,
    nome: '🛡️ Kit de Janela Modal Blindada + Avisos Flutuantes (Toasts)',
    resumoLeigo: 'Componente padrão de modal que nunca fecha por acidente e sistema de notificações elegantes de sucesso/erro.',
    descricao: 'Componente de Modal com proteção de arrasto de mouse e sistema integrado de feedback visual para o usuário.',
    arquivos: [
      {
        caminho: 'src/components/ui/SafeModal.tsx',
        descricao: 'Janela modal blindada que não fecha quando o usuário arrasta o mouse ao selecionar texto',
        conteudo: `import React, { useEffect } from 'react';

export interface SafeModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}

export function SafeModal({ aberto, aoFechar, titulo, children }: SafeModalProps) {
  useEffect(() => {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
    };
    if (aberto) window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      // Segredo da vacina: verifica se o clique começou no fundo
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        // Impede cliques internos de borbulharem para o fundo
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{titulo}</h3>
          <button
            onClick={aoFechar}
            style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
`
      }
    ]
  },

  {
    id: 'auto-update-banner',
    numero: 4,
    nome: '🔄 Peça Pronta #4: Aviso Automático de Nova Versão (Sem Ctrl+F5)',
    resumoLeigo: 'Faz o aplicativo perceber sozinho quando você subiu uma melhoria nova e exibe uma barra elegante convidando o usuário a clicar em "Atualizar Agora", acabando com o problema de versão antiga presa no celular ou computador.',
    descricao: 'Kit completo com arquivo version.json e componente pronto tanto para React/Vite quanto para HTML/JavaScript Puro.',
    arquivos: [
      {
        caminho: 'public/version.json',
        descricao: 'Carimbo de versão do aplicativo (basta mudar o número quando publicar novidade)',
        conteudo: `{
  "version": "1.0.0",
  "updatedAt": "2026-11-04T00:00:00Z",
  "notes": "Versão inicial com detector automático de atualização"
}
`
      },
      {
        caminho: 'src/components/ui/UpdateNotificationBanner.tsx',
        descricao: 'Componente para projetos React / Vite / Next.js que detecta versão nova e evita tela branca',
        conteudo: `import React, { useEffect, useState } from 'react';

export function UpdateNotificationBanner() {
  const [novaVersao, setNovaVersao] = useState<string | null>(null);

  useEffect(() => {
    let versaoInicial: string | null = null;

    // 1. Proteção contra erro de arquivo antigo no Vite (recarrega transparente)
    const handlePreloadError = () => {
      window.location.reload();
    };
    window.addEventListener('vite:preloadError', handlePreloadError);

    // 2. Consulta o arquivo version.json sem usar o cache do navegador
    const verificarAtualizacao = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!versaoInicial) {
          versaoInicial = data.version;
        } else if (data.version && data.version !== versaoInicial) {
          setNovaVersao(data.version);
        }
      } catch (err) {
        // Ignora silenciosamente se estiver offline
      }
    };

    verificarAtualizacao();

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'visible') verificarAtualizacao();
    };

    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    const intervalo = setInterval(verificarAtualizacao, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      clearInterval(intervalo);
    };
  }, []);

  if (!novaVersao) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        border: '2px solid #38bdf8',
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        zIndex: 99999,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        fontFamily: 'sans-serif'
      }}
    >
      <span>🚀 <strong>O sistema foi atualizado!</strong> Uma nova versão está pronta.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#38bdf8',
          color: '#0f172a',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 14px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        🔄 Atualizar Agora
      </button>
    </div>
  );
}
`
      },
      {
        caminho: 'updateNotifier.js',
        descricao: 'Versão em JavaScript Puro (Vanilla JS) para aplicativos HTML/CSS/JS direto',
        conteudo: `// Sentinela de Atualização Automática (Sem Ctrl+F5) para HTML/JS Puro
(function iniciarDetectorDeAtualizacao() {
  let versaoInicial = null;

  async function checarNovaVersao() {
    try {
      const resp = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) return;
      const dados = await resp.json();
      if (!versaoInicial) {
        versaoInicial = dados.version;
      } else if (dados.version && dados.version !== versaoInicial) {
        exibirBannerDeAtualizacao();
      }
    } catch (e) {}
  }

  function exibirBannerDeAtualizacao() {
    if (document.getElementById('banner-sistema-atualizado')) return;
    const div = document.createElement('div');
    div.id = 'banner-sistema-atualizado';
    div.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#f8fafc;border:2px solid #38bdf8;border-radius:12px;padding:12px 20px;display:flex;align-items:center;gap:14px;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;';
    div.innerHTML = '<span>🚀 <strong>Sistema atualizado!</strong> Clique para carregar as novidades.</span>' +
      '<button onclick="window.location.reload()" style="background:#38bdf8;color:#0f172a;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;">🔄 Recarregar Agora</button>';
    document.body.appendChild(div);
  }

  checarNovaVersao();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checarNovaVersao();
  });
  setInterval(checarNovaVersao, 5 * 60 * 1000);
})();
`
      }
    ]
  }
];

/**
 * Cruza o Raio-X do projeto analisado com o catálogo para indicar
 * quais vacinas são altamente recomendadas neste momento.
 */
export function recomendarVacinasParaProjeto(arquivos = [], relatorioSaude = null) {
  const recomendadas = [];

  for (const vacina of VACINAS_CATALOGO) {
    try {
      if (typeof vacina.detectarNoProjeto === 'function' && vacina.detectarNoProjeto(arquivos, relatorioSaude)) {
        recomendadas.push(vacina.id);
      }
    } catch (e) {
      // Falha silenciosa em heurística não quebra a tela
    }
  }

  return recomendadas;
}
