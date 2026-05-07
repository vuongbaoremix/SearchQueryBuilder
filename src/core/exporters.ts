// ============================================================
// Exporters — AST → Lucene, URL Params, MongoDB, Raw String
// ============================================================

import type { ASTNode, ConditionNode, GroupNode, QueryAST } from './types';
import { resolveRelativeDate } from './dateExpressions';

// ============================================================
// Raw Query String
// ============================================================

export function exportRawQuery(ast: QueryAST): string {
  if (!ast.root || ast.root.children.length === 0) return '';
  return nodeToRaw(ast.root, false);
}

function nodeToRaw(node: ASTNode, wrapParens: boolean): string {
  if (node.type === 'condition') {
    const val = node.value.includes(' ') ? `"${node.value}"` : node.value;
    return `${node.key}${node.operator}${val}`;
  }

  const parts: string[] = [];
  for (let i = 0; i < node.children.length; i++) {
    parts.push(nodeToRaw(node.children[i], node.children[i].type === 'group' && (node.children[i] as GroupNode).children.length > 1));
    if (i < node.logicalOperators.length) {
      parts.push(node.logicalOperators[i]);
    }
  }

  const inner = parts.join(' ');
  return wrapParens && node.children.length > 1 ? `(${inner})` : inner;
}

// ============================================================
// Lucene Query Syntax
// ============================================================

export function exportLucene(ast: QueryAST): string {
  if (!ast.root || ast.root.children.length === 0) return '*:*';
  return nodeToLucene(ast.root, false);
}

function nodeToLucene(node: ASTNode, wrapParens: boolean): string {
  if (node.type === 'condition') {
    return conditionToLucene(node);
  }

  const parts: string[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    parts.push(nodeToLucene(child, child.type === 'group' && (child as GroupNode).children.length > 1));
    if (i < node.logicalOperators.length) {
      parts.push(node.logicalOperators[i]);
    }
  }

  const inner = parts.join(' ');
  return wrapParens && node.children.length > 1 ? `(${inner})` : inner;
}

function conditionToLucene(cond: ConditionNode): string {
  const field = cond.keyConfig?.esField || cond.key;
  const val = cond.value.includes(' ') ? `"${cond.value}"` : cond.value;

  switch (cond.operator) {
    case '=':
      return `${field}:${val}`;
    case ':':
      return `${field}:${val}`;
    case '!=':
      return `-${field}:${val}`;
    case '>':
      return `${field}:{${cond.value} TO *}`;
    case '>=':
      return `${field}:[${cond.value} TO *]`;
    case '<':
      return `${field}:{* TO ${cond.value}}`;
    case '<=':
      return `${field}:[* TO ${cond.value}]`;
    case 'IN': {
      const vals = cond.value.split(',').map((v) => v.trim()).filter(Boolean);
      return `${field}:(${vals.join(' OR ')})`;
    }
    default:
      return `${field}:${val}`;
  }
}

// ============================================================
// URL Search Params (flat — best-effort for AND conditions)
// ============================================================

export function exportURLParams(ast: QueryAST): string {
  if (!ast.root || ast.root.children.length === 0) return '';

  const params = new URLSearchParams();
  collectParams(ast.root, params);
  return params.toString();
}

function collectParams(node: ASTNode, params: URLSearchParams): void {
  if (node.type === 'condition') {
    const key = node.key;
    let prefix: string;
    switch (node.operator) {
      case '!=': prefix = `!${key}`; break;
      case '>': prefix = `${key}_gt`; break;
      case '>=': prefix = `${key}_gte`; break;
      case '<': prefix = `${key}_lt`; break;
      case '<=': prefix = `${key}_lte`; break;
      case ':': prefix = `${key}_match`; break;
      case 'IN': prefix = `${key}_in`; break;
      default: prefix = key; break;
    }
    params.append(prefix, node.value);
    return;
  }

  for (const child of node.children) {
    collectParams(child, params);
  }
}

// ============================================================
// MongoDB-style Query Object
// ============================================================

export function exportMongo(ast: QueryAST): object {
  if (!ast.root || ast.root.children.length === 0) return {};
  return nodeToMongo(ast.root);
}

function nodeToMongo(node: ASTNode): object {
  if (node.type === 'condition') {
    return conditionToMongo(node);
  }

  if (node.children.length === 1) {
    return nodeToMongo(node.children[0]);
  }

  const allAnd = node.logicalOperators.every((op) => op === 'AND');
  const allOr = node.logicalOperators.every((op) => op === 'OR');

  if (allAnd) {
    return { $and: node.children.map(nodeToMongo) };
  }
  if (allOr) {
    return { $or: node.children.map(nodeToMongo) };
  }

  // Mixed: group by splitting on OR
  const orSegments: ASTNode[][] = [];
  let current: ASTNode[] = [node.children[0]];
  for (let i = 0; i < node.logicalOperators.length; i++) {
    if (node.logicalOperators[i] === 'OR') {
      orSegments.push(current);
      current = [node.children[i + 1]];
    } else {
      current.push(node.children[i + 1]);
    }
  }
  orSegments.push(current);

  return {
    $or: orSegments.map((segment) => {
      if (segment.length === 1) return nodeToMongo(segment[0]);
      return { $and: segment.map(nodeToMongo) };
    }),
  };
}


function conditionToMongo(cond: ConditionNode): object {
  const field = cond.keyConfig?.esField || cond.key;
  let value: string | number | Date = cond.value;

  // If it's a date field, try to resolve it
  if (cond.keyConfig?.valueType === 'date') {
    value = resolveRelativeDate(cond.value);
  } else {
    // Try to convert to number
    const num = Number(value);
    if (!isNaN(num) && typeof value === 'string' && value.trim() !== '') {
      value = num;
    }
  }

  switch (cond.operator) {
    case '=':
      return { [field]: value };
    case ':':
      return { [field]: { $regex: String(value), $options: 'i' } };
    case '!=':
      return { [field]: { $ne: value } };
    case '>':
      return { [field]: { $gt: value } };
    case '>=':
      return { [field]: { $gte: value } };
    case '<':
      return { [field]: { $lt: value } };
    case '<=':
      return { [field]: { $lte: value } };
    case 'IN': {
      const values = cond.value.split(',').map((v) => {
        const trimmed = v.trim();
        const num = Number(trimmed);
        return (!isNaN(num) && trimmed !== '') ? num : trimmed;
      });
      return { [field]: { $in: values } };
    }
    default:
      return { [field]: value };
  }
}
