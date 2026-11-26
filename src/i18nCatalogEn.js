/**
 * ContextMap — English Localization Overlay for Vaccines, Blueprints & Checklist
 * When the user selects 🇺🇸 EN (default), every vaccine, blueprint, code example,
 * currency ($ / cents), and timezone rule is localized to universal English.
 * When the user clicks 🇧🇷 PT, the original Brazilian Portuguese catalog (R$ / Brasília) is served.
 */

export const CATEGORIES_EN = {
  'ui-ux': {
    id: 'ui-ux',
    nome: '🎨 UI & UX',
    descricao: 'Prevents mobile viewport clipping, UTC day-shift bugs, accidental modal closes on drag, and unsaved form loss.'
  },
  'banco': {
    id: 'banco',
    nome: '🗄️ Database & Performance',
    descricao: 'Eliminates N+1 query loops, speeds up PostgreSQL RLS policies 100x, and prevents DOM memory freezes.'
  },
  'seguranca': {
    id: 'seguranca',
    nome: '🔒 Security & Auth',
    descricao: 'Stops auth redirect loops, enforces admin permissions in the database, and blocks service-role key leaks.'
  },
  'estabilidade': {
    id: 'estabilidade',
    nome: '⚙️ Stability & Resilience',
    descricao: 'Prevents double-click charges, catches stale-cache updates without Ctrl+F5, and eliminates swallowed errors.'
  }
};

export const VACCINES_EN = {
  'vacina-01-fuso-horario-brasil': {
    nome: 'Fix Dates Shifting Back 1 Day at Night (UTC Timezone Bug)',
    resumoLeigo: 'Prevents date-only strings ("YYYY-MM-DD") from shifting to the previous day in western timezones due to UTC midnight parsing.',
    regraImperativa: 'NEVER parse date-only strings with `new Date("YYYY-MM-DD")` directly (JavaScript treats them as UTC midnight). Append local noon (`T12:00:00`) or use `Intl.DateTimeFormat` with the user\'s explicit timezone.',
    exemploErrado: `// ❌ WRONG: Parsed as UTC midnight — shows previous day in Americas (UTC-3 / UTC-5 / UTC-8)!
const date = new Date("2026-10-16");
console.log(date.toLocaleDateString()); // Can display Oct 15!`,
    exemploBlindado: `// ✅ SAFE: Anchor date-only strings to local noon or parse components explicitly
function parseLocalDate(isoDateStr) {
  const [year, month, day] = isoDateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

// Or format with the user's explicit IANA timezone:
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const formatted = new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());`
  },
  'vacina-02-modal-fechamento-arrasto': {
    nome: 'Prevent Modals from Closing When Dragging Text Selection Outside',
    resumoLeigo: 'Stops modal dialogs from snapping shut when a user highlights text inside an input and releases the mouse button outside the modal box.',
    regraImperativa: 'NEVER close a modal backdrop using `onClick` (not even with `e.target === e.currentTarget` or `stopPropagation`), because releasing a text-selection drag outside fires click on the backdrop. ALWAYS use `onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}` (or `addEventListener("mousedown", ...)` in Vanilla JS). In Radix/Shadcn, use `onPointerDownOutside={(e) => e.preventDefault()}`.',
    exemploErrado: `// ❌ WRONG: Closes the modal when highlighting text inside an input and releasing outside
<div className="fixed inset-0 bg-black/50" onClick={onClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    <input defaultValue="Highlight this text and release outside..." />
  </div>
</div>`,
    exemploBlindado: `// ✅ SAFE: Checks where the click STARTED (onMouseDown), not where it ended
<div
  className="fixed inset-0 bg-black/50"
  onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
>
  <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
    <input defaultValue="Text selection is 100% safe against accidental closing!" />
  </div>
</div>
// In Radix / Shadcn Dialog:
// <DialogContent onPointerDownOutside={(e) => e.preventDefault()} />`
  },
  'vacina-03-supabase-auth-loop-infinito': {
    nome: 'Stop Infinite Login / Auth Flicker Loops (Supabase)',
    resumoLeigo: 'Prevents login screens from flickering endlessly or freezing the browser due to uncleaned auth listeners.',
    regraImperativa: 'ALWAYS unsubscribe the listener returned by `supabase.auth.onAuthStateChange` inside useEffect cleanup, and compare `userId` with a ref before updating state.',
    exemploErrado: `// ❌ WRONG: Registers duplicate listeners on re-render and triggers state loops
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user);
  });
}, []);`,
    exemploBlindado: `// ✅ SAFE: Proper cleanup + userId deduplication
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
}, []);`
  },
  'vacina-04-n-mais-um-queries-loop': {
    nome: 'Ban N+1 Database Queries Inside Loops',
    resumoLeigo: 'Stops AI from firing 50 sequential database requests inside a list loop when a single JOIN or `.in()` query does it in milliseconds.',
    regraImperativa: 'NEVER call `await supabase.from()` or SQL queries inside `.map()`, `.forEach()`, or `for` loops. Use relational selects (`.select("*, author:users(*)")`) or batch `.in("id", ids)`.',
    exemploErrado: `// ❌ WRONG: Fires 1 DB query per item in the list (huge latency & cost)
const posts = await supabase.from('posts').select('*');
const enriched = await Promise.all(posts.data.map(async (p) => {
  const author = await supabase.from('users').select('*').eq('id', p.user_id).single();
  return { ...p, author };
}));`,
    exemploBlindado: `// ✅ SAFE: 1 single query with relational join
const { data: enriched } = await supabase
  .from('posts')
  .select('*, author:users(id, name, email)');

// Or batch fetch when no FK exists:
// const userIds = [...new Set(posts.map(p => p.user_id))];
// const { data: users } = await supabase.from('users').select('*').in('id', userIds);`
  },
  'vacina-05-rascunho-automatico-localstorage': {
    nome: 'Auto-Save Form Drafts in Local Cache',
    resumoLeigo: 'Saves user input locally while typing so an accidental refresh or network drop never wipes out a long form.',
    regraImperativa: 'Forms with 3+ inputs MUST persist a debounced draft (500ms) in `localStorage` and clear it only after confirmed submission success.',
    exemploErrado: `// ❌ WRONG: One accidental reload wipes out everything the user typed
const [form, setForm] = useState({ title: '', description: '', notes: '' });`,
    exemploBlindado: `// ✅ SAFE: Restores saved draft and auto-saves with a gentle 500ms debounce
const DRAFT_KEY = 'draft_main_form';
const [form, setForm] = useState(() => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
  return saved ? JSON.parse(saved) : { title: '', description: '', notes: '' };
});

useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, 500);
  return () => clearTimeout(timer);
}, [form]);

// Clear only after confirmed save:
// localStorage.removeItem(DRAFT_KEY);`
  },
  'vacina-06-viewport-mobile-dvh': {
    nome: 'Fix Mobile Bottom Bar Clipping (Dynamic Viewport `dvh`)',
    resumoLeigo: 'Prevents bottom buttons and footers from getting hidden behind Safari/Chrome mobile gesture bars.',
    regraImperativa: 'NEVER use `100vh` (`h-screen`) for full-screen mobile layouts. Use `min-h-dvh` (`100dvh`) combined with `pb-[env(safe-area-inset-bottom)]`.',
    exemploErrado: `// ❌ WRONG: Mobile Safari address/gesture bar covers the Save button
<div className="h-screen w-screen flex flex-col justify-between">
  <div>Content</div>
  <button>Save (clipped on iOS!)</button>
</div>`,
    exemploBlindado: `// ✅ SAFE: Adapts to dynamic mobile viewport & respects bottom safe area
<div className="min-h-dvh w-full flex flex-col justify-between pb-[env(safe-area-inset-bottom)]">
  <main className="flex-1 overflow-y-auto">Content</main>
  <footer className="p-4 bg-white border-t">Always-visible Save Button</footer>
</div>`
  },
  'vacina-07-protecao-rotas-admin-rls': {
    nome: 'Enforce Admin Permissions in the Database (Real RLS Security)',
    resumoLeigo: 'Ensures regular users cannot read or alter admin data just by calling the API directly or changing the URL.',
    regraImperativa: 'NEVER rely only on hiding UI buttons on the frontend. ALWAYS enable `ROW LEVEL SECURITY` and verify admin roles server-side or via `SECURITY DEFINER` database functions.',
    exemploErrado: `// ❌ WRONG: Only hides the UI — the underlying DB table is still wide open
if (user.role !== 'admin') {
  return <p>Access denied</p>;
}`,
    exemploBlindado: `// ✅ SAFE: Enforced directly inside PostgreSQL RLS
ALTER TABLE admin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only"
ON admin_transactions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
  )
);`
  },
  'vacina-08-confirmacao-exclusao-digitada': {
    nome: 'Require Typed Confirmation Before Destructive Deletions',
    resumoLeigo: 'Prevents accidental deletion of critical records with a single stray click on `window.confirm()`.',
    regraImperativa: 'Permanent destructive deletions MUST NOT rely on plain `window.confirm()`. Show a modal whose delete button remains disabled until the user types the exact resource name.',
    exemploErrado: `// ❌ WRONG: One hasty click on OK permanently wipes the entire project
const handleDelete = () => {
  if (confirm('Delete this?')) api.delete(id);
};`,
    exemploBlindado: `// ✅ SAFE: Button stays locked until exact resource name is typed
function ConfirmDeleteModal({ resourceName, onConfirm }) {
  const [typed, setTyped] = useState('');
  const unlocked = typed.trim() === resourceName.trim();
  return (
    <div className="modal">
      <p>Type <strong>{resourceName}</strong> to confirm deletion:</p>
      <input value={typed} onChange={e => setTyped(e.target.value)} />
      <button disabled={!unlocked} onClick={onConfirm}>Delete Permanently</button>
    </div>
  );
}`
  },
  'vacina-09-lista-infinita-virtualizacao': {
    nome: 'Virtualize or Paginate Large Lists (No Browser Freezes)',
    resumoLeigo: 'Renders only visible rows on screen so thousands of records scroll smoothly on phones and laptops.',
    regraImperativa: 'Lists that can exceed 100 rows MUST NOT render every DOM node at once. Use `@tanstack/react-virtual` or strict server-side pagination (`.range()` / `.limit()`).',
    exemploErrado: `// ❌ WRONG: Mounting 2,000 cards at once freezes mobile browsers
<div>
  {thousandsOfItems.map(item => <Card key={item.id} data={item} />)}
</div>`,
    exemploBlindado: `// ✅ SAFE: Only renders the ~10 rows currently inside the viewport
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 60,
});`
  },
  'vacina-10-anti-clique-duplo-idempotencia': {
    nome: 'Lock Submit & Payment Buttons Against Double-Clicks',
    resumoLeigo: 'Disables action buttons on the very first click so impatient taps never duplicate charges or database entries.',
    regraImperativa: 'Payment and mutation buttons MUST lock immediately on first click (`isPending`), show loading feedback, and attach an `Idempotency-Key` (UUID v4) for financial requests.',
    exemploErrado: `// ❌ WRONG: Double-clicking fast creates 2 duplicate payments
<button onClick={async () => {
  await api.post('/pay', { amount: 100 });
}}>Pay Now</button>`,
    exemploBlindado: `// ✅ SAFE: Instant button lock + idempotency key
const [isPending, setIsPending] = useState(false);

const handlePay = async () => {
  if (isPending) return;
  setIsPending(true);
  try {
    await api.post('/pay', { amount: 100 }, {
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    });
  } finally {
    setIsPending(false);
  }
};`
  },
  'vacina-11-nextjs-ssr-hydration-safe': {
    nome: 'Prevent Next.js / SSR Hydration Mismatch Errors',
    resumoLeigo: 'Stops React/Next.js apps from crashing or flashing on initial load when reading browser-only globals like `localStorage`.',
    regraImperativa: 'NEVER read `window` or `localStorage` directly during initial render in SSR components. Gate browser-only reads behind an `isMounted` effect or `useSyncExternalStore`.',
    exemploErrado: `// ❌ WRONG: localStorage does not exist during SSR — causes hydration error
function ThemeBadge() {
  const theme = localStorage.getItem('theme') || 'light';
  return <span>Theme: {theme}</span>;
}`,
    exemploBlindado: `// ✅ SAFE: Wait until mounted in the browser
function ThemeBadge() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="opacity-0">...</span>;
  const theme = localStorage.getItem('theme') || 'light';
  return <span>Theme: {theme}</span>;
}`
  },
  'vacina-12-bloqueio-vazamento-service-role-key': {
    nome: 'Keep Database Service-Role Keys Strictly Server-Side',
    resumoLeigo: 'Prevents admin master keys from ever leaking into frontend bundles shipped to browsers.',
    regraImperativa: '`SUPABASE_SERVICE_ROLE_KEY` (or any admin secret) MUST NEVER be imported in client code. Guard server utilities with `import "server-only"`.',
    exemploErrado: `// ❌ WRONG: Importing this in a client component exposes full admin DB access
import { createClient } from '@supabase/supabase-js';
export const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY);`,
    exemploBlindado: `// ✅ SAFE: Breaks the build immediately if accidentally imported in client code
import 'server-only';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing server-side service role key');
}
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);`
  },
  'vacina-13-retorno-tipado-anti-engolir-erros': {
    nome: 'Ban Silent Swallowed Errors (`catch (e) {}`)',
    resumoLeigo: 'Forces async functions to report real failures clearly instead of pretending everything succeeded.',
    regraImperativa: 'Async actions MUST return a discriminated union `{ success: true, data } | { success: false, error: string }`. NEVER swallow exceptions with empty `catch (e) {}`.',
    exemploErrado: `// ❌ WRONG: Database fails silently, UI still says "Saved!"
async function saveRecord(data) {
  try {
    await db.save(data);
  } catch (e) {}
  return { success: true };
}`,
    exemploBlindado: `// ✅ SAFE: Explicit, honest error reporting
async function saveRecord(data) {
  try {
    const saved = await db.save(data);
    return { success: true, data: saved };
  } catch (err) {
    console.error('Save failed:', err);
    return { success: false, error: err?.message || 'Failed to save data' };
  }
}`
  },
  'vacina-14-stale-closures-listeners-tempo-real': {
    nome: 'Avoid Stale Closures in WebSocket & Realtime Listeners',
    resumoLeigo: 'Ensures live chat messages and realtime updates always append to the latest state instead of overwriting newer items.',
    regraImperativa: 'WebSocket, Supabase Realtime, and `setInterval` handlers MUST use functional state updates (`prev => [...prev, item]`) or a synced `useRef` to avoid stale closures.',
    exemploErrado: `// ❌ WRONG: Reads a frozen snapshot of "items" and wipes previous messages
useEffect(() => {
  channel.on('message', (msg) => {
    setItems([...items, msg]); // Stale closure!
  });
}, []);`,
    exemploBlindado: `// ✅ SAFE: Always reads the latest state via functional updater + clean unsubscribe
useEffect(() => {
  channel.on('message', (msg) => {
    setItems(prev => [...prev, msg]);
  });
  return () => channel.unsubscribe();
}, []);`
  },
  'vacina-15-otimizacao-rls-auth-uid': {
    nome: 'Speed Up PostgreSQL RLS Policies 100x with Scalar Subqueries',
    resumoLeigo: 'Wraps `auth.uid()` in `(SELECT auth.uid())` so Postgres evaluates it once per query instead of once per row.',
    regraImperativa: 'In PostgreSQL RLS policies, NEVER use bare `auth.uid() = user_id`. ALWAYS wrap it in `(SELECT auth.uid()) = user_id` and add a B-Tree index on `user_id`.',
    exemploErrado: `-- ❌ SLOW: Re-evaluates auth.uid() row-by-row across 100,000 rows
CREATE POLICY "Users see own docs" ON documents
FOR SELECT USING (auth.uid() = user_id);`,
    exemploBlindado: `-- ✅ 100x FASTER: Evaluated once per query with B-Tree index
CREATE POLICY "Users see own docs" ON documents
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);`
  },
  'vacina-16-detector-versao-sem-ctrl-f5': {
    nome: 'Auto-Detect New App Deployments (No More Ctrl+F5)',
    resumoLeigo: 'Detects when you publish a new version and shows a clean "Update Available — Reload" banner while preventing blank-screen chunk errors.',
    regraImperativa: 'Web apps (React/Vite or Vanilla JS) MUST poll a lightweight `version.json` (with `?t=Date.now()` cache-busting) on `visibilitychange`, handle `vite:preloadError`, and prompt users to reload cleanly.',
    exemploErrado: `// ❌ WRONG: After deploying a new build, users stay stuck on stale cached files or hit blank screens until they press Ctrl+F5.`,
    exemploBlindado: `// ✅ SAFE (WORKS IN BOTH REACT/VITE AND VANILLA JS):
(function startVersionWatcher() {
  if (typeof window === 'undefined') return;
  let initialVersion = null;

  window.addEventListener('vite:preloadError', () => window.location.reload());

  async function checkNewVersion() {
    try {
      const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!initialVersion) {
        initialVersion = data.version;
      } else if (data.version && data.version !== initialVersion) {
        showUpdateBanner();
      }
    } catch (e) {}
  }

  function showUpdateBanner() {
    if (document.getElementById('app-update-banner')) return;
    const bar = document.createElement('div');
    bar.id = 'app-update-banner';
    bar.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#f8fafc;border:2px solid #38bdf8;padding:12px 20px;border-radius:12px;z-index:99999;display:flex;align-items:center;gap:14px;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;';
    bar.innerHTML = '<span>🚀 <strong>New update available!</strong></span><button onclick="window.location.reload()" style="background:#38bdf8;color:#0f172a;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">🔄 Reload Now</button>';
    document.body.appendChild(bar);
  }

  checkNewVersion();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkNewVersion();
  });
  setInterval(checkNewVersion, 5 * 60 * 1000);
})();`
  },
  'vacina-17-moeda-brasileira-virgula-banco': {
    nome: 'Safe Currency Input Parsing & Integer Cents (No NaN / Float Bugs)',
    resumoLeigo: 'Prevents formatted currency inputs like "$1,500.50" from turning into NaN or suffering floating-point rounding errors (0.1 + 0.2 !== 0.3).',
    regraImperativa: 'NEVER pass masked currency strings ("$1,500.50" or "€1.500,50") straight into `Number()` or float math. ALWAYS sanitize symbols/separators and store monetary values as integer cents (or fixed numeric decimals).',
    exemploErrado: `// ❌ WRONG: Passing formatted string with symbols/commas breaks Number() -> NaN
const amount = Number("$1,500.50".replace('$', '')); // Returns NaN!
const total = 0.1 + 0.2; // 0.30000000000000004!`,
    exemploBlindado: `// ✅ SAFE: Universal currency sanitizer -> exact integer cents
function parseCurrencyToCents(rawInput) {
  if (typeof rawInput === 'number') return Math.round(rawInput * 100);
  if (!rawInput) return 0;
  // Strip currency symbols & spaces, normalize thousand/decimal separators
  const cleaned = String(rawInput).replace(/[^0-9.,-]/g, '').trim();
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}
// Example: "$1,500.50" -> 150050 cents (exact & safe for databases!)`
  },
  'vacina-18-alerta-queda-internet-offline': {
    nome: 'Friendly Offline / Network Drop Indicator',
    resumoLeigo: 'Immediately warns users when Wi-Fi or mobile data drops, preventing silent failed saves and infinite spinners.',
    regraImperativa: 'Interactive web apps MUST listen to `window` `online` and `offline` events and show a clear non-blocking status banner when connectivity drops.',
    exemploErrado: `// ❌ WRONG: User loses 4G signal, taps Save, button spins forever with zero explanation
const save = async () => {
  await api.post('/records', form);
};`,
    exemploBlindado: `// ✅ SAFE: Live connectivity watcher with clean user feedback
useEffect(() => {
  const onOffline = () => setNetNotice('⚠️ You are offline. Check your connection before saving.');
  const onOnline = () => {
    setNetNotice('🟢 Back online!');
    setTimeout(() => setNetNotice(null), 3000);
  };
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);
  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
  };
}, []);`
  }
};

export const SUPER_BLOCKS_EN = {
  'auth-rbac': {
    nome: '🔐 Blueprint #1: Auth + Admin RBAC (Database-Enforced)',
    resumoLeigo: 'Sets up user/admin authentication with roles locked inside PostgreSQL RLS and Next.js route middleware.',
    descricao: 'Canonical setup: profiles table, user_role enum, RLS policies, and admin route middleware.'
  },
  'admin-kpis': {
    nome: '📊 Blueprint #2: Executive Admin Dashboard + Audit Trail',
    resumoLeigo: 'Ready-to-use admin dashboard with 4 KPI cards and a tamper-proof audit_logs table.',
    descricao: 'Clean dashboard layout paired with an insert-only audit log table protected by RLS.',
    arquivosPatch: {
      'src/components/admin/AdminDashboardView.tsx': {
        descricao: 'Ready-to-use React executive KPI cards + audit log table',
        conteudo: `import React from 'react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}

export function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', flex: 1, minWidth: '220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
}

export function AdminDashboardView({ kpis = [], logs = [] }: { kpis?: any[]; logs?: any[] }) {
  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
        📊 Executive Admin Dashboard
      </h1>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <KpiCard title="Total Users" value={kpis[0]?.value || "1,240"} subtitle="+12% this month" icon="👥" />
        <KpiCard title="Estimated MRR" value={kpis[1]?.value || "$48,500"} subtitle="94% of monthly goal" icon="💰" />
        <KpiCard title="DB Queries (Today)" value={kpis[2]?.value || "14,820"} subtitle="Healthy & optimized" icon="⚡" />
        <KpiCard title="Error Rate" value={kpis[3]?.value || "0.02%"} subtitle="Within safe margin" icon="🛡️" />
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '16px' }}>
          📋 Audit Trail (Recent Actions)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '10px' }}>Timestamp</th>
              <th style={{ padding: '10px' }}>User</th>
              <th style={{ padding: '10px' }}>Action</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No recent audit events.</td></tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px' }}>{log.date}</td>
                  <td style={{ padding: '10px' }}>{log.user}</td>
                  <td style={{ padding: '10px' }}>{log.action}</td>
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
    }
  },
  'safe-modal-toast': {
    nome: '🛡️ Blueprint #3: Drag-Safe Modal + Toast Feedback',
    resumoLeigo: 'Bulletproof modal component that never closes when dragging text selections outside the box.',
    descricao: 'Standard modal using onMouseDown backdrop check + Escape key handling.'
  },
  'auto-update-banner': {
    nome: '🔄 Blueprint #4: Auto-Update Version Banner (No Ctrl+F5)',
    resumoLeigo: 'Automatically detects new deployments and displays a clean "Reload Now" banner — works for both React/Vite and Vanilla JS.',
    descricao: 'Includes version.json, React UpdateNotificationBanner.tsx, and Vanilla JS updateNotifier.js.'
  }
};

export const CHECKLIST_EN = {
  auto_update_ctrl_f5: {
    titulo: 'Auto-Update Notification Banner (No Ctrl+F5)',
    explicacaoLeiga: 'Notifies users with a clean "Reload Now" bar when a new version is deployed, preventing stale cache & blank screens.'
  },
  fuso_horario_brasil: {
    titulo: 'Timezone-Safe Local Dates (No UTC Day-Shift)',
    explicacaoLeiga: 'Prevents date-only records from jumping to the previous day at night due to UTC midnight parsing.'
  },
  trava_duplo_clique: {
    titulo: 'Anti Double-Click Lock on Submit Buttons',
    explicacaoLeiga: 'Locks save/payment buttons immediately on the first tap to prevent duplicate submissions.'
  },
  moeda_brasileira_brl: {
    titulo: 'Safe Currency Parsing & Integer Cents',
    explicacaoLeiga: 'Sanitizes currency symbols/separators ("$1,500.50") and avoids floating-point rounding bugs in databases.'
  },
  consultas_banco_loop: {
    titulo: 'Eliminate N+1 Database Queries Inside Loops',
    explicacaoLeiga: 'Replaces repeated database calls inside loops (.map / for) with batched queries or joins.'
  },
  select_sem_limite: {
    titulo: 'Limit Unbounded Full-Table Queries (select *)',
    explicacaoLeiga: 'Adds pagination or .limit() to queries that otherwise pull entire tables into memory.'
  },
  rascunho_formularios: {
    titulo: 'Auto-Save Drafts on Long Forms',
    explicacaoLeiga: 'Caches unsaved form input locally so an accidental reload or network drop never loses typed data.'
  },
  respiro_celular_safe_area: {
    titulo: 'Mobile Safe-Area Bottom Padding (dvh)',
    explicacaoLeiga: 'Prevents iOS/Android bottom navigation gesture bars from covering action buttons.'
  },
  modal_fechamento_arrasto: {
    titulo: 'Drag-Safe Modal Backdrop (onMouseDown)',
    explicacaoLeiga: 'Prevents modal dialogs from closing when highlighting text inside an input and releasing the mouse outside.'
  },
  aviso_queda_internet: {
    titulo: 'Friendly Offline / Network Drop Indicator',
    explicacaoLeiga: 'Alerts users immediately when internet drops so they do not lose work clicking Save offline.'
  }
};

export function obterCatalogoLocalizado(lang, categorias, vacinas, blocos) {
  if (lang === 'pt') {
    return { categorias, vacinas, blocos };
  }

  const vacinasEn = vacinas.map(v => {
    const patch = VACCINES_EN[v.id];
    return patch ? { ...v, ...patch } : v;
  });

  const blocosEn = blocos.map(b => {
    const patch = SUPER_BLOCKS_EN[b.id];
    if (!patch) return b;
    const arquivos = (b.arquivos || []).map(a => {
      const arqPatch = patch.arquivosPatch?.[a.caminho];
      return arqPatch ? { ...a, ...arqPatch } : a;
    });
    return {
      ...b,
      nome: patch.nome || b.nome,
      resumoLeigo: patch.resumoLeigo || b.resumoLeigo,
      descricao: patch.descricao || b.descricao,
      arquivos
    };
  });

  return {
    categorias: CATEGORIES_EN,
    vacinas: vacinasEn,
    blocos: blocosEn
  };
}

export function obterChecklistLocalizado(lang, checklist) {
  if (!checklist || lang === 'pt') return checklist;

  return {
    ...checklist,
    itens: (checklist.itens || []).map(item => {
      const patch = CHECKLIST_EN[item.id];
      let obs = item.observacao || '';
      if (obs.includes('Detectado como já protegido')) obs = 'Automatically detected as protected in the codebase.';
      if (obs.includes('Detectado automaticamente pelo sensor')) obs = 'Automatically verified by the code sensor.';
      if (obs.includes('Nenhuma modal vulnerável')) obs = 'No vulnerable drag-close modals detected by the sensor.';
      if (obs.startsWith('Detectado fechamento vulnerável ao arrastar em:')) {
        obs = obs.replace('Detectado fechamento vulnerável ao arrastar em:', 'Vulnerable onClick modal backdrop detected in:');
      }
      return patch
        ? { ...item, titulo: patch.titulo, explicacaoLeiga: patch.explicacaoLeiga, observacao: obs }
        : { ...item, observacao: obs };
    })
  };
}
