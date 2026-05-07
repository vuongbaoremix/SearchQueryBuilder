// ============================================================
// useQueryBuilder — Token-based state management
// ============================================================

import { useState, useCallback, useRef, useMemo } from 'react';
import type { KeyConfig, Operator, LogicalOperator, QueryAST, ParseError } from '../core/types';
import { parseQuery, tokenize } from '../core/parser';

// ---- Token model ----

export interface ConditionToken {
  id: string;
  type: 'condition';
  key: string;
  operator: Operator;
  value: string;
  keyConfig?: KeyConfig;
}

export interface LogicalToken {
  id: string;
  type: 'logical';
  logicalOp: LogicalOperator;
}

export interface ParenToken {
  id: string;
  type: 'paren_open' | 'paren_close';
}

export type EditorToken = ConditionToken | LogicalToken | ParenToken;

// ---- Input phase ----

export type InputPhase = 'key' | 'operator' | 'value' | 'logical';

// ---- Editor state ----

export interface EditorState {
  tokens: EditorToken[];
  /** What the user is currently typing in the inline input */
  inputText: string;
  /** Current step in the input flow */
  inputPhase: InputPhase;
  /** Pending key while building a condition */
  pendingKey: string | null;
  pendingKeyConfig: KeyConfig | null;
  /** Pending operator while building a condition */
  pendingOperator: Operator | null;
  /** If editing an existing condition token, its id */
  editingTokenId: string | null;
  /** Which part of the token is being edited */
  editingField: 'key' | 'operator' | 'value' | null;
}

let _tokenId = 0;
function nextId(): string {
  return `tok_${++_tokenId}_${Date.now()}`;
}

// ---- Serialize tokens → raw query string ----

export function tokensToRawQuery(tokens: EditorToken[]): string {
  const parts: string[] = [];
  for (const tok of tokens) {
    if (tok.type === 'condition') {
      const val = tok.value.includes(' ') ? `"${tok.value}"` : tok.value;
      if (tok.operator === 'IN') {
        parts.push(`${tok.key} IN ${val}`);
      } else {
        parts.push(`${tok.key}${tok.operator}${val}`);
      }
    } else if (tok.type === 'logical') {
      parts.push(tok.logicalOp);
    } else if (tok.type === 'paren_open') {
      parts.push('(');
    } else if (tok.type === 'paren_close') {
      parts.push(')');
    }
  }
  return parts.join(' ');
}

// ---- Hook ----

export interface UseQueryBuilderReturn {
  state: EditorState;
  tokens: EditorToken[];
  rawQuery: string;
  ast: QueryAST | null;
  errors: ParseError[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Number of unclosed open parentheses */
  openParenCount: number;

  // Actions
  setInputText: (text: string) => void;
  selectKey: (key: string, keyConfig?: KeyConfig) => void;
  selectOperator: (op: Operator) => void;
  selectValue: (value: string) => void;
  selectRangeValue: (gteValue: string, lteValue: string) => void;
  selectLogical: (op: LogicalOperator) => void;
  insertParen: (type: 'open' | 'close') => void;
  confirmInput: () => void;
  removeToken: (tokenId: string) => void;
  editToken: (tokenId: string, field: 'key' | 'operator' | 'value') => void;
  insertParenAtToken: (tokenId: string, position: 'before' | 'after') => void;
  cancelEdit: () => void;
  clearAll: () => void;
  handleBackspace: () => boolean; // returns true if handled
  /** Load a raw query string into the editor (parses into tokens) */
  loadQuery: (rawQuery: string) => void;
}

export function useQueryBuilder(keyConfigs: KeyConfig[]): UseQueryBuilderReturn {
  const [state, setState] = useState<EditorState>({
    tokens: [],
    inputText: '',
    inputPhase: 'key',
    pendingKey: null,
    pendingKeyConfig: null,
    pendingOperator: null,
    editingTokenId: null,
    editingField: null,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const keyMap = useCallback(
    () => new Map(keyConfigs.map((k) => [k.key.toLowerCase(), k])),
    [keyConfigs]
  );

  // Derive raw query and AST from tokens (memoized to prevent infinite loops)
  const rawQuery = useMemo(() => tokensToRawQuery(state.tokens), [state.tokens]);
  const parsedResult = useMemo(() => {
    if (!rawQuery.trim()) return { ast: null, errors: [] as ParseError[] };
    return parseQuery(rawQuery, keyConfigs);
  }, [rawQuery, keyConfigs]);
  const ast = parsedResult.ast;
  const errors = parsedResult.errors;

  // ---- Actions ----

  const setInputText = useCallback((text: string) => {
    setState((s) => ({ ...s, inputText: text }));
  }, []);

  const selectKey = useCallback(
    (key: string, keyConfig?: KeyConfig) => {
      const config = keyConfig || keyMap().get(key.toLowerCase());

      setState((s) => {
        // If editing an existing token's key
        if (s.editingTokenId && s.editingField === 'key') {
          const newTokens = s.tokens.map((t) => {
            if (t.id === s.editingTokenId && t.type === 'condition') {
              return { ...t, key, keyConfig: config };
            }
            return t;
          });
          return {
            ...s,
            tokens: newTokens,
            editingTokenId: null,
            editingField: null,
            inputText: '',
            inputPhase: needsLogical(newTokens) ? 'logical' : 'key',
          };
        }

        // Normal flow: key selected, move to operator phase
        return {
          ...s,
          inputText: '',
          inputPhase: 'operator' as InputPhase,
          pendingKey: key,
          pendingKeyConfig: config || null,
        };
      });

      // Focus input for next step
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [keyMap]
  );

  const selectOperator = useCallback((op: Operator) => {
    setState((s) => {
      // If editing an existing token's operator
      if (s.editingTokenId && s.editingField === 'operator') {
        const newTokens = s.tokens.map((t) => {
          if (t.id === s.editingTokenId && t.type === 'condition') {
            return { ...t, operator: op };
          }
          return t;
        });
        return {
          ...s,
          tokens: newTokens,
          editingTokenId: null,
          editingField: null,
          inputText: '',
          inputPhase: needsLogical(newTokens) ? 'logical' : 'key',
        };
      }

      return {
        ...s,
        inputText: '',
        inputPhase: 'value' as InputPhase,
        pendingOperator: op,
      };
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const selectValue = useCallback((value: string) => {
    setState((s) => {
      // If editing an existing token's value
      if (s.editingTokenId && s.editingField === 'value') {
        const newTokens = s.tokens.map((t) => {
          if (t.id === s.editingTokenId && t.type === 'condition') {
            return { ...t, value };
          }
          return t;
        });
        return {
          ...s,
          tokens: newTokens,
          editingTokenId: null,
          editingField: null,
          inputText: '',
          inputPhase: 'logical' as InputPhase,
        };
      }

      // Normal flow: complete the condition token
      if (!s.pendingKey || !s.pendingOperator) return s;

      const newToken: ConditionToken = {
        id: nextId(),
        type: 'condition',
        key: s.pendingKey,
        operator: s.pendingOperator,
        value,
        keyConfig: s.pendingKeyConfig || undefined,
      };

      return {
        ...s,
        tokens: [...s.tokens, newToken],
        inputText: '',
        inputPhase: 'logical' as InputPhase,
        pendingKey: null,
        pendingKeyConfig: null,
        pendingOperator: null,
      };
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const selectRangeValue = useCallback((gteValue: string, lteValue: string) => {
    setState((s) => {
      // Normal flow: complete the condition token into TWO tokens (gte AND lte)
      if (!s.pendingKey) return s;

      const baseId = nextId();
      const token1: ConditionToken = {
        id: baseId + '_1',
        type: 'condition',
        key: s.pendingKey,
        operator: '>=',
        value: gteValue,
        keyConfig: s.pendingKeyConfig || undefined,
      };
      
      const andToken: LogicalToken = {
        id: baseId + '_and',
        type: 'logical',
        logicalOp: 'AND',
      };

      const token2: ConditionToken = {
        id: baseId + '_2',
        type: 'condition',
        key: s.pendingKey,
        operator: '<=',
        value: lteValue,
        keyConfig: s.pendingKeyConfig || undefined,
      };

      return {
        ...s,
        tokens: [...s.tokens, token1, andToken, token2],
        inputText: '',
        inputPhase: 'logical' as InputPhase,
        pendingKey: null,
        pendingKeyConfig: null,
        pendingOperator: null,
      };
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const selectLogical = useCallback((op: LogicalOperator) => {
    setState((s) => {
      const newToken: LogicalToken = {
        id: nextId(),
        type: 'logical',
        logicalOp: op,
      };
      return {
        ...s,
        tokens: [...s.tokens, newToken],
        inputText: '',
        inputPhase: 'key' as InputPhase,
      };
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const confirmInput = useCallback(() => {
    setState((s) => {
      const text = s.inputText.trim();
      if (!text) return s;

      // If in key phase, try to match a key
      if (s.inputPhase === 'key') {
        const config = keyMap().get(text.toLowerCase());
        if (config) {
          return {
            ...s,
            inputText: '',
            inputPhase: 'operator' as InputPhase,
            pendingKey: config.key,
            pendingKeyConfig: config,
          };
        }
        // Allow unknown keys
        return {
          ...s,
          inputText: '',
          inputPhase: 'operator' as InputPhase,
          pendingKey: text,
          pendingKeyConfig: null,
        };
      }

      // If in value phase, complete the condition
      if (s.inputPhase === 'value' && s.pendingKey && s.pendingOperator) {
        // Handle editing existing token
        if (s.editingTokenId && s.editingField === 'value') {
          const newTokens = s.tokens.map((t) => {
            if (t.id === s.editingTokenId && t.type === 'condition') {
              return { ...t, value: text };
            }
            return t;
          });
          return {
            ...s,
            tokens: newTokens,
            editingTokenId: null,
            editingField: null,
            inputText: '',
            inputPhase: 'logical' as InputPhase,
          };
        }

        const newToken: ConditionToken = {
          id: nextId(),
          type: 'condition',
          key: s.pendingKey,
          operator: s.pendingOperator,
          value: text,
          keyConfig: s.pendingKeyConfig || undefined,
        };
        return {
          ...s,
          tokens: [...s.tokens, newToken],
          inputText: '',
          inputPhase: 'logical' as InputPhase,
          pendingKey: null,
          pendingKeyConfig: null,
          pendingOperator: null,
        };
      }

      // If in logical phase, check for AND/OR
      if (s.inputPhase === 'logical') {
        const upper = text.toUpperCase();
        if (upper === 'AND' || upper === 'OR') {
          const newToken: LogicalToken = {
            id: nextId(),
            type: 'logical',
            logicalOp: upper as LogicalOperator,
          };
          return {
            ...s,
            tokens: [...s.tokens, newToken],
            inputText: '',
            inputPhase: 'key' as InputPhase,
          };
        }
      }

      return s;
    });
  }, [keyMap]);

  const removeToken = useCallback((tokenId: string) => {
    setState((s) => {
      const idx = s.tokens.findIndex((t) => t.id === tokenId);
      if (idx === -1) return s;

      const newTokens = [...s.tokens];
      newTokens.splice(idx, 1);

      // Also remove adjacent logical operator if it would create invalid state
      // e.g., removing first condition leaves a leading logical op
      if (newTokens.length > 0 && newTokens[0]?.type === 'logical') {
        newTokens.splice(0, 1);
      }
      // Trailing logical op
      if (newTokens.length > 0 && newTokens[newTokens.length - 1]?.type === 'logical') {
        newTokens.splice(newTokens.length - 1, 1);
      }
      // Two consecutive logical ops
      for (let i = newTokens.length - 1; i > 0; i--) {
        if (newTokens[i]?.type === 'logical' && newTokens[i - 1]?.type === 'logical') {
          newTokens.splice(i, 1);
        }
      }

      return {
        ...s,
        tokens: newTokens,
        inputPhase: needsLogical(newTokens) ? 'logical' : 'key',
        editingTokenId: null,
        editingField: null,
      };
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const editToken = useCallback((tokenId: string, field: 'key' | 'operator' | 'value') => {
    setState((s) => {
      const token = s.tokens.find((t) => t.id === tokenId);
      if (!token || token.type !== 'condition') return s;

      let inputText = '';
      if (field === 'key') inputText = token.key;
      else if (field === 'operator') inputText = token.operator;
      else if (field === 'value') inputText = token.value;

      return {
        ...s,
        editingTokenId: tokenId,
        editingField: field,
        inputText: inputText,
        inputPhase: field,
        pendingKey: field !== 'key' ? token.key : null,
        pendingKeyConfig: field !== 'key' ? (token.keyConfig || null) : null,
        pendingOperator: field === 'value' ? token.operator : null,
      };
    });
    // Don't focus main input — the inline edit input inside the tag handles focus
  }, []);

  const cancelEdit = useCallback(() => {
    setState((s) => ({
      ...s,
      editingTokenId: null,
      editingField: null,
      inputText: '',
      inputPhase: needsLogical(s.tokens) ? 'logical' : 'key',
      pendingKey: null,
      pendingKeyConfig: null,
      pendingOperator: null,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      tokens: [],
      inputText: '',
      inputPhase: 'key',
      pendingKey: null,
      pendingKeyConfig: null,
      pendingOperator: null,
      editingTokenId: null,
      editingField: null,
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleBackspace = useCallback((): boolean => {
    // Only handle if input is empty
    if (state.inputText) return false;

    // If we have a pending operator, go back to key phase
    if (state.pendingOperator) {
      setState((s) => ({
        ...s,
        inputPhase: 'operator',
        pendingOperator: null,
        inputText: '',
      }));
      return true;
    }

    // If we have a pending key, go back to key phase
    if (state.pendingKey) {
      setState((s) => ({
        ...s,
        inputPhase: 'key',
        pendingKey: null,
        pendingKeyConfig: null,
        inputText: '',
      }));
      return true;
    }

    // Remove the last token
    if (state.tokens.length > 0) {
      const lastToken = state.tokens[state.tokens.length - 1];
      const newTokens = state.tokens.slice(0, -1);
      
      if (lastToken.type === 'logical') {
        setState((s) => ({
          ...s,
          tokens: newTokens,
          inputPhase: 'logical',
        }));
      } else if (lastToken.type === 'condition') {
        // Go into editing mode for this token's value
        setState((s) => ({
          ...s,
          tokens: newTokens,
          inputText: lastToken.value,
          inputPhase: 'value',
          pendingKey: lastToken.key,
          pendingKeyConfig: lastToken.keyConfig || null,
          pendingOperator: lastToken.operator,
        }));
      }
      return true;
    }

    return false;
  }, [state]);

  // ---- Paren support ----

  const openParenCount = useMemo(() => countOpenParens(state.tokens), [state.tokens]);

  const insertParen = useCallback((type: 'open' | 'close') => {
    setState((s) => {
      if (type === 'open') {
        // Can insert open paren when expecting a key (start or after logical)
        if (s.inputPhase !== 'key') return s;
        const newToken: ParenToken = { id: nextId(), type: 'paren_open' };
        return {
          ...s,
          tokens: [...s.tokens, newToken],
          inputText: '',
          inputPhase: 'key' as InputPhase,
        };
      } else {
        // Can insert close paren when we have unclosed parens and just finished a condition
        const open = countOpenParens(s.tokens);
        if (open <= 0) return s;
        if (!needsLogical(s.tokens)) return s;
        const newToken: ParenToken = { id: nextId(), type: 'paren_close' };
        const newTokens = [...s.tokens, newToken];
        return {
          ...s,
          tokens: newTokens,
          inputText: '',
          inputPhase: needsLogical(newTokens) ? 'logical' : 'key',
        };
      }
    });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const insertParenAtToken = useCallback((tokenId: string, position: 'before' | 'after') => {
    setState((s) => {
      const idx = s.tokens.findIndex((t) => t.id === tokenId);
      if (idx === -1) return s;

      const newTokens = [...s.tokens];
      if (position === 'before') {
        newTokens.splice(idx, 0, { id: nextId(), type: 'paren_open' });
      } else {
        newTokens.splice(idx + 1, 0, { id: nextId(), type: 'paren_close' });
      }

      return {
        ...s,
        tokens: newTokens,
        inputPhase: needsLogical(newTokens) ? 'logical' : 'key',
      };
    });
  }, []);

  // ---- Load query from raw string ----
  const loadQuery = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setState({
          tokens: [],
          inputText: '',
          inputPhase: 'key',
          pendingKey: null,
          pendingKeyConfig: null,
          pendingOperator: null,
          editingTokenId: null,
          editingField: null,
        });
        return;
      }

      const lexTokens = tokenize(query);
      const editorTokens: EditorToken[] = [];
      const km = keyMap();

      let i = 0;
      while (i < lexTokens.length) {
        const lt = lexTokens[i];

        if (lt.type === 'LPAREN') {
          editorTokens.push({ id: nextId(), type: 'paren_open' });
          i++;
        } else if (lt.type === 'RPAREN') {
          editorTokens.push({ id: nextId(), type: 'paren_close' });
          i++;
        } else if (lt.type === 'LOGICAL_OP') {
          editorTokens.push({ id: nextId(), type: 'logical', logicalOp: lt.value as LogicalOperator });
          i++;
        } else if (lt.type === 'IDENTIFIER') {
          // Expect: IDENTIFIER OPERATOR VALUE
          const keyName = lt.value;
          const opToken = lexTokens[i + 1];
          const valToken = lexTokens[i + 2];
          if (opToken?.type === 'OPERATOR' && valToken && (valToken.type === 'VALUE' || valToken.type === 'IDENTIFIER')) {
            const config = km.get(keyName.toLowerCase());
            editorTokens.push({
              id: nextId(),
              type: 'condition',
              key: keyName,
              operator: opToken.value as Operator,
              value: valToken.value,
              keyConfig: config,
            });
            i += 3;
          } else {
            i++; // skip malformed
          }
        } else {
          i++; // skip unknown
        }
      }

      setState({
        tokens: editorTokens,
        inputText: '',
        inputPhase: needsLogical(editorTokens) ? 'logical' : 'key',
        pendingKey: null,
        pendingKeyConfig: null,
        pendingOperator: null,
        editingTokenId: null,
        editingField: null,
      });
    },
    [keyMap]
  );

  return {
    state,
    tokens: state.tokens,
    rawQuery,
    ast,
    errors,
    inputRef,
    openParenCount,
    setInputText,
    selectKey,
    selectOperator,
    selectValue,
    selectRangeValue,
    selectLogical,
    insertParen,
    insertParenAtToken,
    confirmInput,
    removeToken,
    editToken,
    cancelEdit,
    clearAll,
    handleBackspace,
    loadQuery,
  };
}

// ---- Helpers ----

function needsLogical(tokens: EditorToken[]): boolean {
  if (tokens.length === 0) return false;
  const last = tokens[tokens.length - 1];
  return last.type === 'condition' || last.type === 'paren_close';
}

function countOpenParens(tokens: EditorToken[]): number {
  let count = 0;
  for (const t of tokens) {
    if (t.type === 'paren_open') count++;
    if (t.type === 'paren_close') count--;
  }
  return count;
}
