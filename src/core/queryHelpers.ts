// ============================================================
// Query Helpers — Utilities for inspecting query tokens/AST
// ============================================================

import type { KeyConfig, Operator, ASTNode, ConditionNode } from './types';
import type { EditorToken, ConditionToken } from '../hooks/useQueryBuilder';
import { parseQuery } from './parser';

// ---- Result types ----

export interface KeyMatch {
  /** The token ID */
  tokenId: string;
  /** The key name (e.g. "status", "date") */
  key: string;
  /** The operator used */
  operator: Operator;
  /** The raw value string */
  value: string;
  /** The resolved KeyConfig, if available */
  keyConfig?: KeyConfig;
}

// ---- Public API ----

/**
 * Check whether a given key exists anywhere in the current query tokens.
 *
 * @param tokens  The token array from `useQueryBuilder`
 * @param key     The key to look for (case-insensitive)
 * @returns `true` if at least one condition token uses this key
 *
 * @example
 * ```ts
 * const has = hasKey(tokens, 'date');
 * // true if the user has typed something like  date >= 2025-01-01
 * ```
 */
export function hasKey(tokens: EditorToken[], key: string): boolean {
  const lower = key.toLowerCase();
  return tokens.some(
    (t) => t.type === 'condition' && t.key.toLowerCase() === lower,
  );
}

/**
 * Find the **first** condition token that matches a given key.
 * Returns `undefined` if the key is not present.
 *
 * @example
 * ```ts
 * const match = findKey(tokens, 'status');
 * if (match) {
 *   console.log(match.operator, match.value); // "=", "active"
 * }
 * ```
 */
export function findKey(
  tokens: EditorToken[],
  key: string,
): KeyMatch | undefined {
  const lower = key.toLowerCase();
  const token = tokens.find(
    (t): t is ConditionToken =>
      t.type === 'condition' && t.key.toLowerCase() === lower,
  );
  if (!token) return undefined;
  return toKeyMatch(token);
}

/**
 * Find **all** condition tokens that match a given key.
 * Useful when the same key appears multiple times (e.g. `date >= X AND date <= Y`).
 *
 * @example
 * ```ts
 * const matches = findAllKeys(tokens, 'date');
 * // [{ key: 'date', operator: '>=', value: 'now-1h', … },
 * //  { key: 'date', operator: '<=', value: 'now',     … }]
 * ```
 */
export function findAllKeys(
  tokens: EditorToken[],
  key: string,
): KeyMatch[] {
  const lower = key.toLowerCase();
  return tokens
    .filter(
      (t): t is ConditionToken =>
        t.type === 'condition' && t.key.toLowerCase() === lower,
    )
    .map(toKeyMatch);
}

/**
 * Return a de-duplicated list of all keys currently present in the query.
 *
 * @example
 * ```ts
 * const keys = getActiveKeys(tokens);
 * // ['status', 'date']
 * ```
 */
export function getActiveKeys(tokens: EditorToken[]): string[] {
  const seen = new Set<string>();
  for (const t of tokens) {
    if (t.type === 'condition') {
      seen.add(t.key.toLowerCase());
    }
  }
  return [...seen];
}

/**
 * Return a map of key → KeyMatch[] for every key in the query.
 * Handy for bulk inspection without repeated lookups.
 *
 * @example
 * ```ts
 * const map = getKeyMap(tokens);
 * const dateEntries = map.get('date');  // KeyMatch[] | undefined
 * ```
 */
export function getKeyMap(
  tokens: EditorToken[],
): Map<string, KeyMatch[]> {
  const map = new Map<string, KeyMatch[]>();
  for (const t of tokens) {
    if (t.type === 'condition') {
      const lower = t.key.toLowerCase();
      const list = map.get(lower) ?? [];
      list.push(toKeyMatch(t));
      map.set(lower, list);
    }
  }
  return map;
}

// ---- Internal (token-based) ----

function toKeyMatch(token: ConditionToken): KeyMatch {
  return {
    tokenId: token.id,
    key: token.key,
    operator: token.operator,
    value: token.value,
    keyConfig: token.keyConfig,
  };
}

// ============================================================
// RAW QUERY helpers — input is a raw query string
// ============================================================
//
// These functions parse the raw query string using the same
// Lexer + Parser pipeline, then walk the AST to extract info.
// Pass your `keyConfigs` so the parser can resolve KeyConfig
// references (optional — pass `[]` if you don't need them).
// ============================================================



/** Condition info extracted from a raw query string */
export interface RawKeyMatch {
  /** AST node ID */
  nodeId: string;
  /** The key name (e.g. "status", "date") */
  key: string;
  /** The operator used */
  operator: Operator;
  /** The raw value string */
  value: string;
  /** The resolved KeyConfig, if available */
  keyConfig?: KeyConfig;
}

/**
 * Check whether a given key exists in a raw query string.
 *
 * @param rawQuery    The raw query string, e.g. `"status=active AND date>=now-1h"`
 * @param key         The key to search for (case-insensitive)
 * @param keyConfigs  Optional KeyConfig[] for field resolution
 *
 * @example
 * ```ts
 * hasKeyRaw('status=active AND date>=now-1h', 'date');           // true
 * hasKeyRaw('status=active', 'date');                            // false
 * ```
 */
export function hasKeyRaw(
  rawQuery: string,
  key: string,
  keyConfigs: KeyConfig[] = [],
): boolean {
  const conditions = extractConditions(rawQuery, keyConfigs);
  const lower = key.toLowerCase();
  return conditions.some((c) => c.key.toLowerCase() === lower);
}

/**
 * Find the **first** condition matching a key in a raw query string.
 *
 * @example
 * ```ts
 * const match = findKeyRaw('status=active AND date>=now-1h', 'status');
 * // → { nodeId, key: 'status', operator: '=', value: 'active', keyConfig }
 * ```
 */
export function findKeyRaw(
  rawQuery: string,
  key: string,
  keyConfigs: KeyConfig[] = [],
): RawKeyMatch | undefined {
  const conditions = extractConditions(rawQuery, keyConfigs);
  const lower = key.toLowerCase();
  return conditions.find((c) => c.key.toLowerCase() === lower);
}

/**
 * Find **all** conditions matching a key in a raw query string.
 *
 * @example
 * ```ts
 * const matches = findAllKeysRaw(
 *   'date>=now/y AND date<=now',
 *   'date',
 *   keyConfigs,
 * );
 * // → [{ key: 'date', operator: '>=', value: 'now/y' },
 * //    { key: 'date', operator: '<=', value: 'now'    }]
 * ```
 */
export function findAllKeysRaw(
  rawQuery: string,
  key: string,
  keyConfigs: KeyConfig[] = [],
): RawKeyMatch[] {
  const conditions = extractConditions(rawQuery, keyConfigs);
  const lower = key.toLowerCase();
  return conditions.filter((c) => c.key.toLowerCase() === lower);
}

/**
 * Return a de-duplicated list of all keys present in a raw query string.
 *
 * @example
 * ```ts
 * getActiveKeysRaw('status=active AND date>=now-1h');
 * // → ['status', 'date']
 * ```
 */
export function getActiveKeysRaw(
  rawQuery: string,
  keyConfigs: KeyConfig[] = [],
): string[] {
  const conditions = extractConditions(rawQuery, keyConfigs);
  const seen = new Set<string>();
  for (const c of conditions) {
    seen.add(c.key.toLowerCase());
  }
  return [...seen];
}

/**
 * Return a map of key → RawKeyMatch[] for every key in a raw query string.
 *
 * @example
 * ```ts
 * const map = getKeyMapRaw('status=active AND date>=now/y AND date<=now', keyConfigs);
 * map.get('date');   // RawKeyMatch[]
 * map.get('status'); // RawKeyMatch[]
 * ```
 */
export function getKeyMapRaw(
  rawQuery: string,
  keyConfigs: KeyConfig[] = [],
): Map<string, RawKeyMatch[]> {
  const conditions = extractConditions(rawQuery, keyConfigs);
  const map = new Map<string, RawKeyMatch[]>();
  for (const c of conditions) {
    const lower = c.key.toLowerCase();
    const list = map.get(lower) ?? [];
    list.push(c);
    map.set(lower, list);
  }
  return map;
}

// ---- Internal (raw query) ----

function extractConditions(
  rawQuery: string,
  keyConfigs: KeyConfig[],
): RawKeyMatch[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const { ast } = parseQuery(trimmed, keyConfigs);
  if (!ast) return [];

  const results: RawKeyMatch[] = [];
  walkAST(ast.root, results);
  return results;
}

function walkAST(node: ASTNode, out: RawKeyMatch[]): void {
  if (node.type === 'condition') {
    out.push(conditionToRawMatch(node));
  } else if (node.type === 'group') {
    for (const child of node.children) {
      walkAST(child, out);
    }
  }
}

function conditionToRawMatch(node: ConditionNode): RawKeyMatch {
  return {
    nodeId: node.id,
    key: node.key,
    operator: node.operator,
    value: node.value,
    keyConfig: node.keyConfig,
  };
}

