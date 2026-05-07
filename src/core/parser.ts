// ============================================================
// Query Parser — Lexer + Recursive Descent Parser
// ============================================================

import type {
  LexToken,
  LexTokenType,
  KeyConfig,
  QueryAST,
  GroupNode,
  ConditionNode,
  ASTNode,
  ParseError,
  Operator,
  LogicalOperator,
} from './types';
import { OPERATORS, LOGICAL_OPERATORS } from './constants';

// ---- Unique ID generator ----
let _idCounter = 0;
export function generateId(): string {
  return `node_${Date.now()}_${++_idCounter}`;
}

// ============================================================
// LEXER — tokenize raw input string
// ============================================================

export function tokenize(input: string): LexToken[] {
  const tokens: LexToken[] = [];
  let pos = 0;

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    // Parentheses
    if (input[pos] === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: pos });
      pos++;
      continue;
    }
    if (input[pos] === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: pos });
      pos++;
      continue;
    }

    // Operators (multi-char first: !=, >=, <=, then single: =, >, <, :)
    const opMatch = input.slice(pos).match(/^(!=|>=|<=|=|>|<|:)/);
    if (opMatch) {
      tokens.push({ type: 'OPERATOR', value: opMatch[1], position: pos });
      pos += opMatch[1].length;
      continue;
    }

    // Quoted string value (after operator)
    if (input[pos] === '"') {
      const start = pos;
      pos++; // skip opening quote
      let value = '';
      while (pos < input.length && input[pos] !== '"') {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          value += input[pos + 1];
          pos += 2;
        } else {
          value += input[pos];
          pos++;
        }
      }
      if (pos < input.length) pos++; // skip closing quote
      tokens.push({ type: 'VALUE', value, position: start });
      continue;
    }

    // Word — could be IDENTIFIER, LOGICAL_OP, IN operator, or unquoted VALUE
    const wordMatch = input.slice(pos).match(/^[^\s()=!><:"]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      const upperWord = word.toUpperCase();

      if (LOGICAL_OPERATORS.includes(upperWord as LogicalOperator)) {
        tokens.push({ type: 'LOGICAL_OP', value: upperWord, position: pos });
      } else if (upperWord === 'IN') {
        // Context-sensitive: 'IN' after an IDENTIFIER is an operator
        const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
        if (lastToken && lastToken.type === 'IDENTIFIER') {
          tokens.push({ type: 'OPERATOR', value: 'IN', position: pos });
        } else if (lastToken && lastToken.type === 'OPERATOR') {
          tokens.push({ type: 'VALUE', value: word, position: pos });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: word, position: pos });
        }
      } else {
        // Determine if this is a VALUE or IDENTIFIER based on context
        const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
        if (lastToken && lastToken.type === 'OPERATOR') {
          tokens.push({ type: 'VALUE', value: word, position: pos });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: word, position: pos });
        }
      }
      pos += word.length;
      continue;
    }

    // Unknown character
    tokens.push({ type: 'UNKNOWN', value: input[pos], position: pos });
    pos++;
  }

  tokens.push({ type: 'EOF', value: '', position: pos });
  return tokens;
}

// ============================================================
// RECURSIVE DESCENT PARSER
// ============================================================
// Grammar:
//   Expression → Term ((OR) Term)*
//   Term       → Factor ((AND) Factor)*
//   Factor     → LPAREN Expression RPAREN | Condition
//   Condition  → IDENTIFIER OPERATOR VALUE
// ============================================================

class Parser {
  private tokens: LexToken[];
  private pos: number;
  private keyConfigs: KeyConfig[];
  private keyMap: Map<string, KeyConfig>;
  errors: ParseError[] = [];

  constructor(tokens: LexToken[], keyConfigs: KeyConfig[]) {
    this.tokens = tokens;
    this.pos = 0;
    this.keyConfigs = keyConfigs;
    this.keyMap = new Map(keyConfigs.map((k) => [k.key.toLowerCase(), k]));
  }

  private peek(): LexToken {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: -1 };
  }

  private advance(): LexToken {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: LexTokenType): LexToken | null {
    const token = this.peek();
    if (token.type === type) {
      return this.advance();
    }
    return null;
  }

  // Expression → Term ((OR) Term)*
  parseExpression(): GroupNode {
    const children: ASTNode[] = [];
    const logicalOps: LogicalOperator[] = [];

    children.push(this.parseTerm());

    while (this.peek().type === 'LOGICAL_OP' && this.peek().value === 'OR') {
      this.advance(); // consume OR
      logicalOps.push('OR');
      children.push(this.parseTerm());
    }

    if (children.length === 1 && children[0].type === 'group' && logicalOps.length === 0) {
      return children[0] as GroupNode;
    }

    return {
      type: 'group',
      id: generateId(),
      children,
      logicalOperators: logicalOps,
    };
  }

  // Term → Factor ((AND) Factor)*
  private parseTerm(): ASTNode {
    const children: ASTNode[] = [];
    const logicalOps: LogicalOperator[] = [];

    children.push(this.parseFactor());

    while (this.peek().type === 'LOGICAL_OP' && this.peek().value === 'AND') {
      this.advance(); // consume AND
      logicalOps.push('AND');
      children.push(this.parseFactor());
    }

    if (children.length === 1) {
      return children[0];
    }

    return {
      type: 'group',
      id: generateId(),
      children,
      logicalOperators: logicalOps,
    };
  }

  // Factor → LPAREN Expression RPAREN | Condition
  private parseFactor(): ASTNode {
    if (this.peek().type === 'LPAREN') {
      this.advance(); // consume (
      const expr = this.parseExpression();
      if (!this.expect('RPAREN')) {
        this.errors.push({
          message: 'Expected closing parenthesis ")"',
          position: this.peek().position,
        });
      }
      return expr;
    }

    return this.parseCondition();
  }

  // Condition → IDENTIFIER OPERATOR VALUE
  private parseCondition(): ConditionNode {
    const identToken = this.peek();
    if (identToken.type !== 'IDENTIFIER') {
      this.errors.push({
        message: `Expected field name, got "${identToken.value}"`,
        position: identToken.position,
        token: identToken.value,
      });
      this.advance(); // skip
      return this.createErrorCondition(identToken.value);
    }
    this.advance();

    const opToken = this.peek();
    if (opToken.type !== 'OPERATOR') {
      this.errors.push({
        message: `Expected operator after "${identToken.value}", got "${opToken.value}"`,
        position: opToken.position,
        token: opToken.value,
      });
      return this.createErrorCondition(identToken.value);
    }
    this.advance();

    const valToken = this.peek();
    if (valToken.type !== 'VALUE' && valToken.type !== 'IDENTIFIER') {
      this.errors.push({
        message: `Expected value after "${identToken.value}${opToken.value}", got "${valToken.value}"`,
        position: valToken.position,
        token: valToken.value,
      });
      return this.createErrorCondition(identToken.value, opToken.value as Operator);
    }
    this.advance();

    // Look up key config
    const keyConfig = this.keyMap.get(identToken.value.toLowerCase());
    if (!keyConfig) {
      this.errors.push({
        message: `Unknown field: "${identToken.value}"`,
        position: identToken.position,
        token: identToken.value,
      });
    }

    // Validate operator
    const op = opToken.value as Operator;
    if (!OPERATORS.includes(op)) {
      this.errors.push({
        message: `Invalid operator: "${opToken.value}"`,
        position: opToken.position,
        token: opToken.value,
      });
    }

    return {
      type: 'condition',
      id: generateId(),
      key: identToken.value,
      operator: op,
      value: valToken.value,
      keyConfig: keyConfig,
    };
  }

  private createErrorCondition(key: string, operator: Operator = '='): ConditionNode {
    return {
      type: 'condition',
      id: generateId(),
      key,
      operator,
      value: '',
      keyConfig: undefined,
    };
  }
}

// ============================================================
// PUBLIC API
// ============================================================

export function parseQuery(
  input: string,
  keyConfigs: KeyConfig[]
): { ast: QueryAST; errors: ParseError[] } {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ast: { root: { type: 'group', id: generateId(), children: [], logicalOperators: [] } },
      errors: [],
    };
  }

  const lexTokens = tokenize(trimmed);
  const parser = new Parser(lexTokens, keyConfigs);
  const root = parser.parseExpression();

  // Check if we consumed everything
  const remaining = parser['peek']();
  if (remaining.type !== 'EOF') {
    parser.errors.push({
      message: `Unexpected token: "${remaining.value}"`,
      position: remaining.position,
      token: remaining.value,
    });
  }

  return {
    ast: { root },
    errors: parser.errors,
  };
}

/**
 * Serialize an AST back to a raw query string.
 */
export function astToString(node: ASTNode): string {
  if (node.type === 'condition') {
    const val = node.value.includes(' ') ? `"${node.value}"` : node.value;
    return `${node.key}${node.operator}${val}`;
  }

  const parts: string[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const childStr = astToString(node.children[i]);
    parts.push(childStr);
    if (i < node.logicalOperators.length) {
      parts.push(node.logicalOperators[i]);
    }
  }

  const inner = parts.join(' ');

  // Wrap in parens if this is a nested group (not the root)
  if (node.children.length > 1) {
    return `(${inner})`;
  }
  return inner;
}
