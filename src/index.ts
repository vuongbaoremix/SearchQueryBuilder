// ============================================================
// Public API — Export everything consumers need
// ============================================================

// Component
export { SearchQueryBuilder } from './components/SearchQueryBuilder/SearchQueryBuilder';
export { default as SearchQueryBuilderDefault } from './components/SearchQueryBuilder/SearchQueryBuilder';

// Core
export { parseQuery, tokenize, astToString } from './core/parser';
export { buildDSL } from './core/dslBuilder';
export { exportRawQuery, exportLucene, exportURLParams, exportMongo } from './core/exporters';

// Types
export type {
  KeyConfig,
  ESQueryType,
  Operator,
  LogicalOperator,
  Suggestion,
  QueryAST,
  ASTNode,
  ConditionNode,
  GroupNode,
  ParseError,
  QueryResult,
  SearchQueryBuilderProps,
  SearchHistoryItem,
  SearchHistoryProvider,
  HistoryDisplayMode,
} from './core/types';

// Hooks
export { useQueryBuilder } from './hooks/useQueryBuilder';
export type { EditorToken, ConditionToken, LogicalToken, ParenToken, InputPhase, UseQueryBuilderReturn } from './hooks/useQueryBuilder';
export { useAutocomplete } from './hooks/useAutocomplete';
export { useDSL } from './hooks/useDSL';
export { useSearchHistory } from './hooks/useSearchHistory';
