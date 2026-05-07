// ============================================================
// Sample Key Configurations
// ============================================================

import type { KeyConfig } from '../core/types';
import { createMockSuggestionsProvider } from './mockApi';

export const sampleKeyConfigs: KeyConfig[] = [
  {
    key: 'status',
    label: 'Status',
    description: 'Document status (active, inactive, draft, archived)',
    esField: 'status.keyword',
    queryType: 'term',
    valueType: 'string',
    icon: '📋',
    queryOptions: {
      caseInsensitive: true,
    },
    staticSuggestions: [
      { value: 'active', label: 'Active', description: 'Currently published' },
      { value: 'inactive', label: 'Inactive', description: 'Temporarily disabled' },
      { value: 'draft', label: 'Draft', description: 'Work in progress' },
      { value: 'archived', label: 'Archived', description: 'No longer maintained' },
    ],
    allowedOperators: ['=', '!=', 'IN'],
  },
  {
    key: 'title',
    label: 'Title',
    description: 'Full-text search on document title',
    esField: 'title',
    queryType: 'match',
    valueType: 'string',
    icon: '📝',
    queryOptions: {
      fuzziness: 'AUTO',
    },
    allowedOperators: ['=', '!=', ':'],
  },
  {
    key: 'content',
    label: 'Content',
    description: 'Exact phrase match on body content',
    esField: 'content',
    queryType: 'match_phrase',
    valueType: 'string',
    icon: '📄',
    queryOptions: {
      slop: 2,
    },
    allowedOperators: ['=', '!=', ':'],
  },
  {
    key: 'author',
    label: 'Author',
    description: 'Author username (fetched from server)',
    esField: 'author.keyword',
    queryType: 'term',
    valueType: 'string',
    icon: '👤',
    suggestionsProvider: createMockSuggestionsProvider('author'),
  },
  {
    key: 'category',
    label: 'Category',
    description: 'Article category (fetched from server)',
    esField: 'category.keyword',
    queryType: 'term',
    valueType: 'string',
    icon: '🏷️',
    suggestionsProvider: createMockSuggestionsProvider('category'),
    disabledWhenKeysPresent: ['tag'], // Can't use both category and tag
  },
  {
    key: 'tag',
    label: 'Tag',
    description: 'Wildcard search on tags',
    esField: 'tags',
    queryType: 'wildcard',
    valueType: 'string',
    icon: '🔖',
    queryOptions: {
      caseInsensitive: true,
    },
    suggestionsProvider: createMockSuggestionsProvider('tag'),
    disabledWhenKeysPresent: ['category'], // Can't use both tag and category
  },
  {
    key: 'date',
    label: 'Date',
    description: 'Created date (supports range operators >, >=, <, <=)',
    esField: 'created_at',
    queryType: 'range',
    valueType: 'date',
    icon: '📅',
    allowedOperators: ['=', '!=', '>', '>=', '<', '<='],
  },
  {
    key: 'price',
    label: 'Price',
    description: 'Item price (supports range operators)',
    esField: 'price',
    queryType: 'range',
    valueType: 'number',
    icon: '💰',
    allowedOperators: ['=', '!=', '>', '>=', '<', '<='],
  },
  {
    key: 'views',
    label: 'Views',
    description: 'View count (supports range operators)',
    esField: 'view_count',
    queryType: 'range',
    valueType: 'number',
    icon: '👁️',
    allowedOperators: ['=', '!=', '>', '>=', '<', '<='],
  },
];
