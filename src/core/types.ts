// ============================================================
// Advanced Search Query Builder — Type Definitions
// ============================================================

import React from 'react';

/** Elasticsearch 8.x query types */
export type ESQueryType =
  | 'match'
  | 'match_phrase'
  | 'term'
  | 'wildcard'
  | 'prefix'
  | 'range'
  | 'exists'
  | 'regexp';

/** Comparison operators */
export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | ':' | 'IN';

/** Logical operators */
export type LogicalOperator = 'AND' | 'OR';

/** Autocomplete suggestion */
export interface Suggestion {
  value: string;
  label: string;
  description?: string;
}

/** Configuration for a single searchable key */
export interface KeyConfig {
  /** The key name the user types, e.g. "status", "name" */
  key: string;

  /** Display label on the UI */
  label: string;

  /** Short description for tooltip / autocomplete hint */
  description?: string;

  /** The actual Elasticsearch field name */
  esField: string;

  /** Which ES query type to generate */
  queryType: ESQueryType;

  /** Operators allowed for this key (defaults to all) */
  allowedOperators?: Operator[];

  /** Extra query options */
  queryOptions?: {
    analyzer?: string;
    fuzziness?: 'AUTO' | number;
    boost?: number;
    caseInsensitive?: boolean;
    slop?: number;
  };

  /** Value data type — for validation and formatting */
  valueType: 'string' | 'number' | 'date' | 'boolean';

  /** Async function to fetch value suggestions from server */
  suggestionsProvider?: (
    inputValue: string,
    abortSignal: AbortSignal
  ) => Promise<Suggestion[]>;

  /** Static list of value suggestions (used instead of suggestionsProvider) */
  staticSuggestions?: Suggestion[];

  /** Icon emoji for autocomplete display */
  icon?: string;

  /** Keys that, when present in the query, cause THIS key to be hidden from autocomplete.
   *  Example: `disabledWhenKeysPresent: ['content']` → this key won't appear if 'content' is already in the query. */
  disabledWhenKeysPresent?: string[];
}

// ============================================================
// AST — Abstract Syntax Tree for nested group support
// ============================================================

export type ASTNode = ConditionNode | GroupNode;

export interface ConditionNode {
  type: 'condition';
  id: string;
  key: string;
  operator: Operator;
  value: string;
  keyConfig?: KeyConfig;
}

export interface GroupNode {
  type: 'group';
  id: string;
  children: ASTNode[];
  /** Logical operators between children. Length = children.length - 1 */
  logicalOperators: LogicalOperator[];
}

export interface QueryAST {
  root: GroupNode;
}

// ============================================================
// Parse errors
// ============================================================

export interface ParseError {
  message: string;
  position?: number;
  token?: string;
}

// ============================================================
// Query result — all output formats bundled together
// ============================================================

export interface QueryResult {
  dsl: object;
  raw: string;
  lucene: string;
  urlParams: string;
  mongo: object;
  ast: QueryAST | null;
  errors: ParseError[];

  /** The raw text the user typed in the input (before any provider transformation).
   *  For advanced mode this equals `raw`. For basic mode this is the plain input text. */
  inputText?: string;

  /** The active search mode key when this result was produced */
  searchModeKey?: string;
}

// ============================================================
// Lexer token types
// ============================================================

export type LexTokenType =
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'VALUE'
  | 'LOGICAL_OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF'
  | 'UNKNOWN';

export interface LexToken {
  type: LexTokenType;
  value: string;
  position: number;
}

// ============================================================
// Autocomplete phase
// ============================================================

export type AutocompletePhase = 'key' | 'operator' | 'value' | 'logical' | 'idle';

// ============================================================
// Search Mode — allows switching between advanced and basic search
// ============================================================

/** Configuration for a search mode */
export interface SearchMode {
  /** Unique identifier */
  key: string;

  /** Display label (e.g. "Advanced", "Basic", "AI Search") */
  label: string;

  /** Icon: emoji string or React component (e.g. SVG icon) */
  icon?: React.ReactNode;

  /** Placeholder text for this mode's input */
  placeholder?: string;

  /** 'advanced' = token editor (current system), 'basic' = plain text input */
  type: 'advanced' | 'basic';

  /** (basic mode only) Provider transforms plain text → raw query string.
   *  Supports async for API calls. If not set, raw text is used as-is. */
  queryProvider?: (inputText: string) => string | Promise<string>;
}

// ============================================================
// Search History
// ============================================================

/** How the history panel is displayed */
export type HistoryDisplayMode = 'popup' | 'inline';

/** A single search history entry */
export interface SearchHistoryItem {
  id: string;
  bookmark: boolean;
  name: string;
  createdTime: string;
  inputText?: string;
  mode: string;
  raw?: string;
  searchVersion: string;
}

/** Provider interface for search history persistence */
export interface SearchHistoryProvider {
  /** Fetch recent search history (paginated) */
  getSearchHistory(offset?: number, pageSize?: number): Promise<SearchHistoryItem[]>;

  /** Add a new search to history */
  addSearchHistory(entry: {
    raw: string;
    mode: string;
    inputText: string;
  }): Promise<void>;

  /** Fetch all bookmarked searches */
  getSearchHistoryBookmarks(): Promise<SearchHistoryItem[]>;

  /** Toggle bookmark on/off for a history item */
  toggleBookmark(id: string, name?: string): Promise<void>;

  /** Clear all search history (non-bookmarked items) */
  clearHistory(): Promise<void>;

  /** Delete a single history item by ID */
  deleteHistory(id: string): Promise<void>;
}

// ============================================================
// Component Props
// ============================================================

export interface SearchQueryBuilderProps {
  /** Key configurations */
  keyConfigs: KeyConfig[];

  /** Callback when query changes */
  onQueryChange?: (result: QueryResult) => void;

  /** Callback on search submit */
  onSearch?: (result: QueryResult) => void;

  /** Callback when user clicks the clear (×) button */
  onClear?: () => void;

  /** Theme: light, dark, or auto-detect */
  theme?: 'light' | 'dark' | 'auto';

  /** Placeholder text (fallback if mode doesn't specify one) */
  placeholder?: string;

  /** Initial query string (for advanced mode) */
  defaultQuery?: string;

  /** Initial input text (for basic mode). Use to restore search state on reload. */
  defaultInputText?: string;

  /** Show DSL/format preview panel toggle button. Default: true */
  showPreview?: boolean;

  /** Whether suggestions auto-open on input focus. Default: true.
   *  When false, suggestions only appear when user starts typing. */
  autoOpenSuggestions?: boolean;

  /** Maximum number of tokens */
  maxTokens?: number;

  /** Custom className */
  className?: string;

  /** Available search modes. If not provided or < 2, no mode selector shown. */
  searchModes?: SearchMode[];

  /** Default active search mode key. Defaults to first in searchModes. */
  defaultSearchMode?: string;

  /** Callback when user changes search mode */
  onSearchModeChange?: (mode: SearchMode) => void;

  // ---- Controlled props (for external state management) ----

  /** Controlled: raw query string (advanced mode). Changes are synced into the editor.
   *  Set to empty string to clear. Anti-loop: changes from user typing won't re-trigger sync. */
  query?: string;

  /** Controlled: active search mode key. Changes will switch the mode externally. */
  searchMode?: string;

  /** Controlled: input text (basic mode). Changes are synced into the basic input. */
  inputText?: string;

  // ---- History ----

  /** Provider for search history & bookmarks. If not set, history feature is hidden. */
  historyProvider?: SearchHistoryProvider;

  /** How history panel is displayed. Default: 'popup'
   *  - 'popup': Icon toggle, click to show/hide dropdown panel (current behavior)
   *  - 'inline': History panel shown inline below search bar alongside suggestions */
  historyDisplay?: HistoryDisplayMode;

  /** Callback when user selects a history item to restore into the search bar */
  onHistorySelect?: (item: SearchHistoryItem) => void;
}
