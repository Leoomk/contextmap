# ðŸ§­ ContextMap 5.0

> **Mapa de Contexto Local (AST) & Servidor MCP para IAs de ProgramaÃ§Ã£o**  
> Pare de queimar tokens no escuro e impeÃ§a sua IA de quebrar 3 telas quando vocÃª pede para mexer em 1.

ðŸ‡ºðŸ‡¸ [Read in English (README.md)](./README.md)

---

## ðŸ’¡ O que Ã© o ContextMap?

Quem cria aplicativos com IA (*Cursor, Claude, Windsurf, Antigravity, etc.*) sempre esbarra nos mesmos 3 problemas:
1. **Gasto exagerado de tokens:** Em toda mudanÃ§a pequena, a IA sai lendo dezenas de arquivos inÃºteis ou reavaliando coisas que vocÃª jÃ¡ tinha decidido deixar como estÃ£o.
2. **Efeito DominÃ³:** VocÃª pede para ajustar uma tela e ela quebra outras 3 sem querer.
3. **Erros repetitivos de IA:** Janelas modais fechando sozinhas ao selecionar texto e soltar o mouse fora (`onClick` em vez de `onMouseDown`), usuÃ¡rios presos em versÃ£o antiga sem `Ctrl+F5`, consultas em loop no banco, erro de fuso horÃ¡rio e formulÃ¡rios sem rascunho.

O **ContextMap** roda **100% localmente no seu computador** (seu cÃ³digo nunca sai da sua mÃ¡quina), lÃª a Ã¡rvore real do cÃ³digo (**AST com Tree-sitter** + cache incremental por hash) e entrega para a sua IA via **MCP** apenas o mapa cirÃºrgico do que importa.

### ðŸ† O Fluxo "Planejar com IA Top âž” Executar com IA Barata"
1. **Regra de Ouro:** O ContextMap **nunca mexe no seu cÃ³digo** â€” ele sÃ³ monta o diagnÃ³stico e o plano seguro com base nas conexÃµes reais do projeto.
2. VocÃª usa uma **IA mais inteligente** + ContextMap para montar o plano cirÃºrgico (economizando muitos tokens).
3. Depois, passa o plano fechado para uma **IA mais barata/rÃ¡pida** executar!

---

## âœ¨ Principais Recursos

- **ðŸŒ³ Mapa Real via AST (Nunca fica desatualizado):** Usa `web-tree-sitter` com cache incremental por hash â€” quando um arquivo muda, sÃ³ ele Ã© relido em milissegundos.
- **ðŸ‘‘ Pilares Mestre (PageRank) & Efeito DominÃ³:** Descobre quais arquivos sustentam o app e quem pode quebrar em 1Âº, 2Âº e 3Âº graus.
- **ðŸ¦´ Modo Esqueleto (AtÃ© ~90% menos tokens):** Entrega apenas as assinaturas de funÃ§Ãµes e estruturas para a IA entender um arquivo sem ler 1.500 linhas inteiras.
- **ðŸ“‹ Caderno de Vistoria Persistente:** Marque melhorias como `âœ… Feito`, `â³ Pendente` ou `ðŸš« Deixar como estÃ¡`. Nas prÃ³ximas mudanÃ§as especÃ­ficas, a IA pula tudo que jÃ¡ foi decidido!
- **ðŸ” Sensores AutomÃ¡ticos de Dores Reais:**
  - **ðŸªŸ Modais Anti-Arrasto:** Acha arquivo e linha exata onde o fundo da modal usa `onClick` e fecha ao selecionar texto.
  - **ðŸ”„ Aviso de Nova VersÃ£o (Sem `Ctrl+F5`):** Detecta se o app avisa o usuÃ¡rio sobre atualizaÃ§Ãµes e jÃ¡ monta a receita certa (React/Vite ou HTML/JS puro).
  - **ðŸ’¸ Custos de Banco & MemÃ³ria:** Alerta sobre loops N+1, `select('*')` sem limite e arquivos gigantes.
  - **ðŸ“ Rascunho de FormulÃ¡rios & Travas de SeguranÃ§a:** Compara *Antes x Depois* para garantir que nenhuma regra de permissÃ£o foi removida.
- **ðŸŒŒ Painel Visual em Linguagem Simples + Grafo 3D:** Roda localmente em `http://localhost:3000`.

---

## ðŸš€ Como Usar (3 Passos)

### PrÃ©-requisito
- [Node.js](https://nodejs.org/) (versÃ£o 18 ou superior)

### 1. Baixar e Instalar
```bash
git clone https://github.com/leoomk/ContextMap.git
cd ContextMap
npm install
```

### 2. Iniciar o Painel e o Servidor MCP
```bash
npm start
```
*(No Windows, vocÃª tambÃ©m pode dar dois cliques em `START_CONTEXTMAP.bat`.)*

Abra **`http://localhost:3000`** no navegador, escolha a pasta do seu projeto e clique em **âš¡ Analisar**.

---

## ðŸ”Œ Conectando na sua IA via MCP

Adicione nas configuraÃ§Ãµes MCP do seu editor de IA (Cursor, Antigravity, Claude Desktop, Windsurf), trocando o caminho pela pasta onde vocÃª salvou o projeto:

```json
{
  "mcpServers": {
    "ContextMap": {
      "command": "node",
      "args": ["C:/CAMINHO/PARA/ContextMap/index.js"]
    }
  }
}
```

---

## ðŸ”’ Privacidade 100% Local

O ContextMap roda inteiramente no seu computador. Nenhum cÃ³digo-fonte ou nome de arquivo Ã© enviado para servidores externos.

## ðŸ“„ LicenÃ§a

LicenÃ§a MIT â€” criado por **Leonardo GonÃ§alves ([@leoomk](https://github.com/leoomk))**.

