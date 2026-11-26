import fs from 'fs';
import path from 'path';
import Parser from 'web-tree-sitter';

/**
 * Fase 2: O Raio-X Gramatical (Parsing Universal)
 * Inicializa o Tree-sitter usando a versão WebAssembly (WASM) para evitar
 * dependências nativas, e varre a árvore procurando declarações de funções.
 */

// Singleton do Parser para reaproveitarmos na execução
let parserInstance = null;

export async function iniciarMotorGramatical() {
  if (parserInstance) return parserInstance;

  console.error('⚙️  Inicializando o motor web-tree-sitter (WASM)...');
  await Parser.init(); // Inicializa o core do Tree-sitter
  
  parserInstance = new Parser();

  // Carrega a gramática do JavaScript que baixamos via CDN
  const caminhoWasm = path.join(process.cwd(), 'wasm', 'tree-sitter-javascript.wasm');
  const LinguagemJS = await Parser.Language.load(caminhoWasm);
  
  parserInstance.setLanguage(LinguagemJS);
  
  console.error('✅ Motor Gramatical pronto para uso!');
  return parserInstance;
}

/**
 * Retorna a AST bruta de um arquivo para que outros módulos (como o edgeBuilder) possam varrê-la.
 */
export async function extrairAST(caminhoAbsoluto) {
  const parser = await iniciarMotorGramatical();
  const codigo = fs.readFileSync(caminhoAbsoluto, 'utf8');
  return parser.parse(codigo);
}

/**
 * Lê o código e retorna os nós das funções encontradas na Árvore de Sintaxe Abstrata (AST)
 */
export async function extrairFuncoesDoArquivo(caminhoAbsoluto) {
  const ast = await extrairAST(caminhoAbsoluto);
  
  const nosEncontrados = [];

  // Caminha pela árvore (AST) recursivamente
  function varrerNo(no) {
    // Procura por declarações de funções tradicionais, arrow functions ou métodos
    if (
      no.type === 'function_declaration' || 
      no.type === 'arrow_function' || 
      no.type === 'method_definition'
    ) {
      nosEncontrados.push(no);
    }

    // Continua descendo na árvore
    for (let i = 0; i < no.childCount; i++) {
      varrerNo(no.child(i));
    }
  }

  varrerNo(ast.rootNode);
  
  return nosEncontrados;
}
