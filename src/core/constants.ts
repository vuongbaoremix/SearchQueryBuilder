import type { Operator, LogicalOperator } from './types';

export const OPERATORS: Operator[] = ['=', '!=', '>=', '<=', '>', '<', ':', 'IN'];

export const LOGICAL_OPERATORS: LogicalOperator[] = ['AND', 'OR'];

export const DEBOUNCE_MS = 300;

export const OPERATOR_LABELS: Record<Operator, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater or equal',
  '<=': 'less or equal',
  ':': 'match (analyzed)',
  'IN': 'in (multi-value)',
};

export const DEFAULT_ALLOWED_OPERATORS: Operator[] = ['=', '!='];

export const RANGE_OPERATORS: Operator[] = ['>', '<', '>=', '<='];
