// ============================================================
// useDSL — Auto-rebuild all output formats when AST changes
// ============================================================

import { useMemo } from 'react';
import type { QueryAST, QueryResult } from '../core/types';
import { buildDSL } from '../core/dslBuilder';
import { exportRawQuery, exportLucene, exportURLParams, exportMongo } from '../core/exporters';
import type { ParseError } from '../core/types';

export function useDSL(ast: QueryAST | null, rawInput: string, errors: ParseError[]): QueryResult {
  return useMemo(() => {
    if (!ast || ast.root.children.length === 0) {
      return {
        dsl: { query: { match_all: {} } },
        raw: rawInput,
        lucene: '*:*',
        urlParams: '',
        mongo: {},
        ast: null,
        errors,
      };
    }

    return {
      dsl: buildDSL(ast),
      raw: exportRawQuery(ast),
      lucene: exportLucene(ast),
      urlParams: exportURLParams(ast),
      mongo: exportMongo(ast),
      ast,
      errors,
    };
  }, [ast, rawInput, errors]);
}
