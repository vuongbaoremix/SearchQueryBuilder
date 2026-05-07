// ============================================================
// DSL Builder — AST → Elasticsearch 8.x Query DSL
// ============================================================

import type { QueryAST, ASTNode, ConditionNode, GroupNode, Operator } from './types';

/**
 * Build an Elasticsearch 8.x bool query from the AST.
 */
export function buildDSL(ast: QueryAST): object {
  if (!ast.root || ast.root.children.length === 0) {
    return { query: { match_all: {} } };
  }

  const query = buildNode(ast.root);
  return { query };
}

function buildNode(node: ASTNode): object {
  if (node.type === 'condition') {
    return buildCondition(node);
  }
  return buildGroup(node);
}

function buildGroup(group: GroupNode): object {
  if (group.children.length === 0) {
    return { match_all: {} };
  }

  if (group.children.length === 1) {
    return buildNode(group.children[0]);
  }

  // Determine if all logical operators are the same
  const allAnd = group.logicalOperators.every((op) => op === 'AND');
  const allOr = group.logicalOperators.every((op) => op === 'OR');

  if (allAnd) {
    return {
      bool: {
        must: group.children.map((child) => buildNode(child)),
      },
    };
  }

  if (allOr) {
    return {
      bool: {
        should: group.children.map((child) => buildNode(child)),
        minimum_should_match: 1,
      },
    };
  }

  // Mixed AND/OR — group consecutive ANDs, then OR the groups
  // Strategy: split by OR, each segment is an AND group
  const orSegments: ASTNode[][] = [];
  let currentSegment: ASTNode[] = [group.children[0]];

  for (let i = 0; i < group.logicalOperators.length; i++) {
    if (group.logicalOperators[i] === 'OR') {
      orSegments.push(currentSegment);
      currentSegment = [group.children[i + 1]];
    } else {
      currentSegment.push(group.children[i + 1]);
    }
  }
  orSegments.push(currentSegment);

  const shouldClauses = orSegments.map((segment) => {
    if (segment.length === 1) {
      return buildNode(segment[0]);
    }
    return {
      bool: {
        must: segment.map((child) => buildNode(child)),
      },
    };
  });

  return {
    bool: {
      should: shouldClauses,
      minimum_should_match: 1,
    },
  };
}

function buildCondition(cond: ConditionNode): object {
  const config = cond.keyConfig;
  const field = config?.esField || cond.key;
  const queryType = config?.queryType || 'match';
  const options = config?.queryOptions || {};
  const operator = cond.operator;

  // Handle != — wrap in must_not
  if (operator === '!=') {
    const innerClause = buildPositiveClause(field, queryType, cond.value, '=', options);
    return {
      bool: {
        must_not: [innerClause],
      },
    };
  }

  // Handle ':' — always force match query (analyzed/diacritic-folded)
  if (operator === ':') {
    return { match: { [field]: { query: cond.value } } };
  }

  // Handle 'IN' — terms query with comma-separated values
  if (operator === 'IN') {
    const values = cond.value.split(',').map((v) => v.trim()).filter(Boolean);
    return { terms: { [field]: values } };
  }

  // Handle range operators
  if (['>', '>=', '<', '<='].includes(operator)) {
    return buildRangeClause(field, operator, cond.value);
  }

  return buildPositiveClause(field, queryType, cond.value, operator, options);
}

function buildPositiveClause(
  field: string,
  queryType: string,
  value: string,
  _operator: Operator,
  options: Record<string, unknown>
): object {
  // Special case: exists
  if (queryType === 'exists' || value === '*') {
    return { exists: { field } };
  }

  switch (queryType) {
    case 'match': {
      const matchBody: Record<string, unknown> = { query: value };
      if (options.analyzer) matchBody.analyzer = options.analyzer;
      if (options.fuzziness) matchBody.fuzziness = options.fuzziness;
      if (options.boost) matchBody.boost = options.boost;
      return { match: { [field]: matchBody } };
    }

    case 'match_phrase': {
      const phraseBody: Record<string, unknown> = { query: value };
      if (options.analyzer) phraseBody.analyzer = options.analyzer;
      if (options.slop) phraseBody.slop = options.slop;
      if (options.boost) phraseBody.boost = options.boost;
      return { match_phrase: { [field]: phraseBody } };
    }

    case 'term': {
      const termBody: Record<string, unknown> = { value };
      if (options.caseInsensitive) termBody.case_insensitive = options.caseInsensitive;
      if (options.boost) termBody.boost = options.boost;
      return { term: { [field]: termBody } };
    }

    case 'wildcard': {
      const wildcardBody: Record<string, unknown> = { value };
      if (options.caseInsensitive) wildcardBody.case_insensitive = options.caseInsensitive;
      if (options.boost) wildcardBody.boost = options.boost;
      return { wildcard: { [field]: wildcardBody } };
    }

    case 'prefix': {
      const prefixBody: Record<string, unknown> = { value };
      if (options.boost) prefixBody.boost = options.boost;
      return { prefix: { [field]: prefixBody } };
    }

    case 'regexp': {
      const regexpBody: Record<string, unknown> = { value };
      if (options.boost) regexpBody.boost = options.boost;
      return { regexp: { [field]: regexpBody } };
    }

    case 'range': {
      return { range: { [field]: { gte: value, lte: value } } };
    }

    default:
      return { match: { [field]: { query: value } } };
  }
}

function buildRangeClause(field: string, operator: Operator, value: string): object {
  const rangeMap: Record<string, string> = {
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
  };

  const rangeKey = rangeMap[operator];
  return {
    range: {
      [field]: {
        [rangeKey]: value,
      },
    },
  };
}
