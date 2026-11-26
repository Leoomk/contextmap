# 🧭 ContextMap

> **Mapa de Contexto Local (AST) & Servidor MCP para IAs de Programação**  
> Pare de queimar tokens no escuro e impeça sua IA de quebrar 3 telas quando você pede para mexer em 1.

🇺🇸 [Read in English (README.md)](./README.md)

---

## 💡 O que é o ContextMap?

Quem cria aplicativos com IA (*Cursor, Claude, Windsurf, Antigravity, Gemini, etc.*) sempre esbarra nos mesmos 3 problemas:
1. **Gasto exagerado de tokens:** Em toda mudança pequena, a IA sai lendo dezenas de arquivos inúteis ou reavaliando coisas que você já tinha decidido deixar como estão.
2. **Efeito Dominó:** Você pede para ajustar uma tela e ela quebra outras 3 sem querer.
3. **Erros repetitivos de IA:** Janelas modais fechando sozinhas ao selecionar texto e soltar o mouse fora (`onClick` em vez de `onMouseDown`), usuários presos em versão antiga sem `Ctrl+F5`, consultas em loop no banco, erro de fuso horário e formulários sem rascunho.

O **ContextMap** roda **100% localmente no seu computador** (seu código nunca sai da sua máquina), lê a árvore real do código (**AST com Tree-sitter** + cache incremental por hash) e entrega para a sua IA via **MCP** apenas o mapa cirúrgico do que importa.

### 🏆 O Fluxo "Planejar com IA Top ➔ Executar com IA Barata"
1. **Regra de Ouro:** O ContextMap **nunca mexe no seu código** — ele só monta o diagnóstico e o plano seguro com base nas conexões reais do projeto.
2. Você usa uma **IA mais inteligente** + ContextMap para montar o plano cirúrgico (economizando muitos tokens).
3. Depois, passa o plano fechado para uma **IA mais barata/rápida** executar!

---

## ✨ Principais Recursos

- **🌳 Mapa Real via AST (Nunca fica desatualizado):** Usa `web-tree-sitter` com cache incremental por hash — quando um arquivo muda, só ele é relido em milissegundos.
- **👑 Pilares Mestre (PageRank) & Efeito Dominó:** Descobre quais arquivos sustentam o app e quem pode quebrar em 1º, 2º e 3º graus.
- **🦴 Modo Esqueleto (Até ~90% menos tokens):** Entrega apenas as assinaturas de funções e estruturas para a IA entender um arquivo sem ler 1.500 linhas inteiras.
- **📋 Caderno de Vistoria Persistente:** Marque melhorias como `✅ Feito`, `⏳ Pendente` ou `🚫 Deixar como está`. Nas próximas mudanças específicas, a IA pula tudo que já foi decidido!
- **🔍 Sensores Automáticos de Dores Reais:**
  - **🪟 Modais Anti-Arrasto:** Acha arquivo e linha exata onde o fundo da modal usa `onClick` e fecha ao selecionar texto.
  - **🔄 Aviso de Nova Versão (Sem `Ctrl+F5`):** Detecta se o app avisa o usuário sobre atualizações e já monta a receita certa (React/Vite ou HTML/JS puro).
  - **💸 Custos de Banco & Memória:** Alerta sobre loops N+1, `select('*')` sem limite e arquivos gigantes.
  - **📝 Rascunho de Formulários & Travas de Segurança:** Compara *Antes x Depois* para garantir que nenhuma regra de permissão foi removida.
- **🌌 Painel Visual Bilíngue (`🇺🇸 EN / 🇧🇷 PT`) + Grafo 3D:** Roda localmente em `http://localhost:3000`.

---

## 🚀 Como Usar (3 Passos)

### Pré-requisito
- [Node.js](https://nodejs.org/) (versão 18 ou superior)

### 1. Baixar e Instalar
```bash
git clone https://github.com/Leoomk/contextmap.git
cd contextmap
npm install
```

### 2. Iniciar o Painel e o Servidor MCP
```bash
npm start
```
*(No Windows, você também pode dar dois cliques em `START_CONTEXTMAP.bat`.)*

Abra **`http://localhost:3000`** no navegador, escolha a pasta do seu projeto e clique em **⚡ Analyze** (ou clique na bandeirinha **🇧🇷 PT** no topo para usar em Português!).

---

## 🔌 Conectando na sua IA via MCP

Adicione nas configurações MCP do seu editor de IA (Cursor, Antigravity, Claude Desktop, Windsurf), trocando o caminho pela pasta onde você salvou o projeto:

```json
{
  "mcpServers": {
    "contextmap": {
      "command": "node",
      "args": ["C:/CAMINHO/PARA/contextmap/index.js"]
    }
  }
}
```

---

## 🔒 Privacidade 100% Local

O ContextMap roda inteiramente no seu computador. Nenhum código-fonte ou nome de arquivo é enviado para servidores externos.

## 📄 Licença

Licença MIT — criado por **Leonardo Gonçalves ([@Leoomk](https://github.com/Leoomk))**.
