import fs from 'fs';
import path from 'path';
import { VACINAS_CATALOGO, SUPER_BLOCOS_CATALOGO } from './vaccineCatalog.js';

/**
 * Injetor Inteligente de Vacinas e Blocos Estruturais do MAPACONTEXTO (v5.0).
 * Escreve regras pontuais por 'bairros/globs' (.cursor/rules/*.mdc) e constituição tricameral (AGENTS.md).
 */

export function injetarVacinasNoProjeto(caminhoProjeto, idsVacinas = [], idsBlocos = []) {
  if (!caminhoProjeto || !fs.existsSync(caminhoProjeto)) {
    throw new Error(`Diretório do projeto não encontrado: ${caminhoProjeto}`);
  }

  const estatisticas = {
    pastaCursorCriada: false,
    arquivosMdcCriados: [],
    arquivosConstituicaoCriados: [],
    arquivosBlocosCriados: [],
    totalRegrasAtivas: idsVacinas.length
  };

  const pastaRules = path.join(caminhoProjeto, '.cursor', 'rules');
  if (!fs.existsSync(pastaRules)) {
    fs.mkdirSync(pastaRules, { recursive: true });
    estatisticas.pastaCursorCriada = true;
  }

  const vacinasAtivas = VACINAS_CATALOGO.filter(v => idsVacinas.includes(v.id));

  // 1. Grava os arquivos modulares .cursor/rules/*.mdc com filtro inteligente (globs)
  for (const vacina of vacinasAtivas) {
    const nomeArquivo = `mc-${vacina.id.replace('vacina-', '')}.mdc`;
    const caminhoMdc = path.join(pastaRules, nomeArquivo);

    const conteudoMdc = `---
description: "${vacina.nome}"
globs: "${vacina.globs}"
alwaysApply: ${vacina.alwaysApply}
---

# 🛡️ Regra de Blindagem MAPACONTEXTO: ${vacina.nome}

> **Objetivo:** ${vacina.resumoLeigo}

## ⚡ Regra Obrigatória
${vacina.regraImperativa}

## ❌ Exemplo Proibido (Como a IA costuma errar)
\`\`\`typescript
${vacina.exemploErrado}
\`\`\`

## ✅ Padrão Ouro Blindado (Obrigatório seguir este modelo)
\`\`\`typescript
${vacina.exemploBlindado}
\`\`\`
`;

    fs.writeFileSync(caminhoMdc, conteudoMdc, 'utf8');
    estatisticas.arquivosMdcCriados.push(`.cursor/rules/${nomeArquivo}`);
  }

  // 2. Grava ou atualiza a Constituição Tricameral em AGENTS.md e CLAUDE.md
  const conteudoConstituicao = gerarTextoConstituicaoTricameral(vacinasAtivas);
  
  const caminhosConstituicao = [
    path.join(caminhoProjeto, 'AGENTS.md'),
    path.join(caminhoProjeto, 'CLAUDE.md')
  ];

  for (const arquivoDestino of caminhosConstituicao) {
    fs.writeFileSync(arquivoDestino, conteudoConstituicao, 'utf8');
    estatisticas.arquivosConstituicaoCriados.push(path.basename(arquivoDestino));
  }

  // 3. Injeta arquivos de Super-Blocos Estruturais (Lego) se solicitados
  const blocosAtivos = SUPER_BLOCOS_CATALOGO.filter(b => idsBlocos.includes(b.id));
  for (const bloco of blocosAtivos) {
    for (const itemArquivo of bloco.arquivos) {
      const caminhoCompleto = path.join(caminhoProjeto, itemArquivo.caminho);
      const pastaPai = path.dirname(caminhoCompleto);
      if (!fs.existsSync(pastaPai)) {
        fs.mkdirSync(pastaPai, { recursive: true });
      }

      // Se o arquivo já existe, salva com extensão protegida .mc-modelo para não sobrescrever trabalho existente
      let caminhoFinal = caminhoCompleto;
      if (fs.existsSync(caminhoCompleto)) {
        const ext = path.extname(caminhoCompleto);
        const base = caminhoCompleto.slice(0, -ext.length);
        caminhoFinal = `${base}.modelo-mapacontexto${ext}`;
      }

      fs.writeFileSync(caminhoFinal, itemArquivo.conteudo, 'utf8');
      estatisticas.arquivosBlocosCriados.push(path.relative(caminhoProjeto, caminhoFinal).replace(/\\/g, '/'));
    }
  }

  return estatisticas;
}

/**
 * Gera a Constituição Tricameral no formato canônico (SEMPRE FAÇA, PERGUNTE ANTES, NUNCA FAÇA)
 */
export function gerarTextoConstituicaoTricameral(vacinas = []) {
  const regrasSempreFaca = vacinas.map(v => `- **${v.nome}:** ${v.regraImperativa.split('.')[0]}.`);
  
  return `# 📜 CONSTITUIÇÃO ARQUITETURAL DO PROJETO (MAPACONTEXTO)
Este arquivo define as leis imutáveis de desenvolvimento governadas pelas ferramentas de Context Engineering. Qualquer agente de IA que opere neste projeto DEVE respeitar rigorosamente esta hierarquia de três fronteiras:

---

## 🟢 1. SEMPRE FAÇA (Regras Obrigatórias e Invariantes)
- Mantenha funções pequenas e com uma única responsabilidade.
- Valide todas as entradas de usuário antes de enviar ao banco.
- Ao criar novos componentes ou rotas, siga os padrões canônicos instalados em \`.cursor/rules/\`.
${regrasSempreFaca.length > 0 ? regrasSempreFaca.join('\n') : '- Preserve a integridade de testes e assinaturas de funções existentes.'}

---

## 🟡 2. PERGUNTE ANTES (Ações que Exigem Confirmação do Usuário)
- **Alteração em Arquivos Centrais (God Nodes):** Se um arquivo possuir mais de 5 dependências diretas (ex: \`supabaseClient.ts\`, \`AuthContext.tsx\`), NÃO altere sua interface sem aprovação prévia.
- **Modificações em Estrutura de Banco de Dados:** Criação, renomeação ou exclusão de colunas em tabelas SQL existentes.
- **Adição de Novas Bibliotecas Externas:** Não execute \`npm install\` ou \`pnpm add\` sem justificativa clara de necessidade.

---

## 🔴 3. NUNCA FAÇA (Proibições Absolutas / Zona de Tolerância Zero)
- **NUNCA** execute consultas ao banco de dados dentro de repetições ou loops (\`.map()\`, \`for\`, \`while\`).
- **NUNCA** exponha chaves secretas (\`SUPABASE_SERVICE_ROLE_KEY\`) em código que execute no navegador.
- **NUNCA** capture exceções com blocos vazios \`catch (e) {}\` sem repassar a mensagem de erro estruturada.
- **NUNCA** remova ou desative políticas de segurança (RLS - Row Level Security) em tabelas de produção.
- **NUNCA** instale componentes modais sem proteção contra fechamento acidental por arraste de mouse.
`;
}

/**
 * Gera a receita em texto completo (blindado) para ser copiado e colado em qualquer chat de IA.
 */
export function gerarPromptTextoBlindado(idsVacinas = [], idsBlocos = []) {
  const vacinas = VACINAS_CATALOGO.filter(v => idsVacinas.includes(v.id));
  const blocos = SUPER_BLOCOS_CATALOGO.filter(b => idsBlocos.includes(b.id));

  let prompt = `IA, você é o Arquiteto de Software Consultor do meu projeto.
O Mapa Contexto realizou uma triagem profunda no meu aplicativo e isolou as VACINAS ANTI-ERRO e ESTRUTURAS recomendadas para elevar a maturidade e a segurança do sistema sem quebrar o que já funciona.
Como meu app é grande, reuni aqui as PREVENÇÕES DE ERROS e os MOLDES selecionados para você fazer um DIAGNÓSTICO INTEGRADO e me dar um parecer antes de qualquer modificação de código:

🛡️ 1. VACINAS ANTI-ERRO SELECIONADAS (${vacinas.length}):
`;

  if (vacinas.length === 0) {
    prompt += `- Nenhuma vacina específica marcada no momento.\n`;
  } else {
    vacinas.forEach((v, index) => {
      prompt += `
- Vacina #${index + 1}: ${v.nome}
  • O que ela previne: ${v.resumoLeigo}
  • Regra obrigatória: ${v.regraImperativa}
  • Cuidado com o erro clássico que a IA costuma cometer:
${v.exemploErrado}
  • Como deve ser feito no padrão blindado:
${v.exemploBlindado}
`;
    });
  }

  if (blocos.length > 0) {
    prompt += `
🧱 2. MOLDES ESTRUTURAIS CANÔNICOS SELECIONADOS (${blocos.length}):
`;
    blocos.forEach((b, index) => {
      prompt += `
- Molde #${index + 1}: ${b.nome}
  • Finalidade no sistema: ${b.resumoLeigo}
  • Arquivos que compõem o modelo:
${b.arquivos.map(a => `    • ${a.caminho}: ${a.descricao}`).join('\n')}
`;
    });
  }

  prompt += `
SUA MISSÃO COMO MEU CONSULTOR DE CONFIANÇA:
1. Me explique em português simples e sem termos técnicos difíceis: no contexto do meu aplicativo atual, como essas vacinas e moldes se relacionam no dia a dia de quem usa o sistema?
2. Faça uma TRIAGEM: quais dessas vacinas e moldes são riscos reais que realmente compensa aplicar ou otimizar agora no meu app, e quais nós devemos DEIXAR COMO ESTÃO porque funcionam bem e mexer traria mais risco do que benefício?
3. Se você recomendar mexer em algum ponto ou adotar um molde, qual seria a ordem segura (o passo a passo cirúrgico) sem quebrar o app nem a experiência do cliente?
4. NÃO ALTERE NENHUMA LINHA DE CÓDIGO AGORA. Aguarde minha decisão e aprovação após ler seu parecer.`;

  return prompt;
}
