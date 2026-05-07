# AGENT.md — Advanced Search Query Builder

> Context file for AI agents working on this codebase.

## Project Overview

A **React component library** that provides a visual, token-based query builder for constructing **Elasticsearch 8.x DSL** queries. Users build queries through a guided step-by-step flow (`Key → Operator → Value → Logical`) with continuous autocomplete suggestions. The component also exports queries in Lucene, URL params, and MongoDB formats.

**This is NOT a full application** — it's a reusable component with a demo page for development/testing.

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Runtime     | **Bun** (use `bun` commands, not `npm`) |
| Framework   | React 19 + TypeScript 6                |
| Build       | Vite 8                                  |
| Styling     | CSS Modules (scoped, no Tailwind)      |
| Target      | Elasticsearch 8.x DSL                  |
| Testing     | (not yet implemented)                  |

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (Vite)
bun run build        # TypeScript check + production build
bun run lint         # ESLint
bun run preview      # Preview production build
```

## Architecture

```
src/
├── core/            # Pure logic — NO React dependencies
│   ├── types.ts     # All shared type definitions
│   ├── constants.ts # Operators, labels, debounce config
│   ├── parser.ts    # Lexer + recursive descent parser → AST
│   ├── dslBuilder.ts# AST → Elasticsearch 8.x DSL object
│   ├── exporters.ts # AST → Lucene, URL params, MongoDB, raw string
│   ├── dateExpressions.ts  # Relative date presets, formatting, resolving
│   └── queryHelpers.ts     # Utilities to inspect query tokens (hasKey, findKey, …)
├── hooks/           # React hooks — state management layer
│   ├── useQueryBuilder.ts  # Token-based editor state machine (PRIMARY)
│   ├── useAutocomplete.ts  # Phase-driven autocomplete with async/debounce
│   └── useDSL.ts           # Auto-rebuild all output formats from AST
├── components/SearchQueryBuilder/
│   ├── SearchQueryBuilder.tsx       # Root component (orchestrator)
│   ├── SearchInput.tsx              # Token editor UI (inline editing)
│   ├── AutocompletePopover.tsx      # Dropdown suggestion popover
│   ├── DSLPreview.tsx               # Tabbed preview of all output formats
│   ├── SearchQueryBuilder.module.css # All styles (CSS Modules)
│   ├── QueryTag.tsx                 # (legacy, may be unused)
│   └── GroupIndicator.tsx           # (legacy, may be unused)
├── demo/            # Demo page for development
│   ├── App.tsx      # Demo app with sample configs
│   ├── App.module.css
│   ├── sampleConfig.ts  # KeyConfig[] examples for all field types
│   └── mockApi.ts       # Simulated async suggestion providers
├── index.ts         # Public API exports
├── index.css        # Global base styles (minimal)
└── main.tsx         # Vite entry point (renders demo)
```

### Layer Rules

1. **`core/`** is pure TypeScript — no React imports, no side effects. Can be used in Node.js.
2. **`hooks/`** depends on `core/` only. Contains all React state logic.
3. **`components/`** depends on `hooks/` and `core/`. Contains all UI rendering.
4. **`demo/`** depends on everything. NOT part of the library distribution.

## Key Concepts

### Token-Based Editor

The editor does NOT use raw text input. Instead, it maintains an array of `EditorToken` objects:

```typescript
type EditorToken = ConditionToken | LogicalToken | ParenToken;

// ConditionToken: { type: 'condition', key, operator, value, keyConfig? }
// LogicalToken:   { type: 'logical', logicalOp: 'AND' | 'OR' }
// ParenToken:     { type: 'paren_open' | 'paren_close' }
```

Tokens are serialized to a raw query string → parsed into an AST → transpiled to all output formats.

### Input Phase State Machine

The editor follows a strict phase flow:

```
key → operator → value → logical → key → ...
```

Each phase drives:
- What the autocomplete popover shows
- What placeholder text appears
- What happens when user types/selects

### Inline Tag Editing

Clicking on the `key` or `value` part of an existing tag replaces that text with a mini `<input>` **inside the tag itself**. The autocomplete popover remains at the wrapper level. When the edit is confirmed (Enter or suggestion select), the token is updated in-place.

⚠️ **Critical**: The main inline input is hidden (`{!isEditing && <input>}`) when editing a tag. Only ONE input is active at a time.

### Group Support (Parentheses)

- `(` appears as a suggestion in the `key` phase
- `)` appears as a suggestion in the `logical` phase when `openParenCount > 0`
- Both paren and logical tokens show a `×` remove button on hover
- `openParenCount` is computed from the token array (not stored separately)

## Critical Patterns

### Avoiding Infinite Render Loops

This is the **#1 pitfall** in this codebase. The data flow is:

```
tokens → rawQuery → parseQuery() → AST → useDSL() → queryResult → onQueryChange
```

Every derivation MUST be memoized:

```typescript
// ✅ CORRECT — memoized
const rawQuery = useMemo(() => tokensToRawQuery(state.tokens), [state.tokens]);
const parsedResult = useMemo(() => parseQuery(rawQuery, keyConfigs), [rawQuery, keyConfigs]);

// ❌ WRONG — creates new object every render → infinite loop
const rawQuery = tokensToRawQuery(state.tokens);
const { ast, errors } = parseQuery(rawQuery, keyConfigs);
```

The `onQueryChange` callback uses a `useRef` to compare by `rawQuery` string, NOT by `queryResult` object reference:

```typescript
const prevRawQueryRef = useRef(rawQuery);
useEffect(() => {
  if (prevRawQueryRef.current !== rawQuery) {
    prevRawQueryRef.current = rawQuery;
    onQueryChange?.(queryResult);
  }
}, [rawQuery, queryResult, onQueryChange]);
```

### State Updates in useQueryBuilder

All state mutations use `setState((prev) => ...)` functional updates. Never read `state` directly inside a `useCallback` that also calls `setState` — use the `s` parameter from the updater function instead.

```typescript
// ✅ CORRECT
const selectKey = useCallback((key: string) => {
  setState((s) => ({ ...s, pendingKey: key, inputPhase: 'operator' }));
}, []);

// ❌ WRONG — stale closure
const selectKey = useCallback((key: string) => {
  setState({ ...state, pendingKey: key }); // `state` is stale!
}, [state]);
```

### Autocomplete Lifecycle

- `useAutocomplete` is **stateless regarding phase** — it receives phase info via `update()` calls
- `update()` is called in a `useEffect` synced to `[state.inputPhase, state.inputText, state.pendingKey, keyConfigs, openParenCount]`
- Async value fetching uses `AbortController` + debounce (`DEBOUNCE_MS = 300`)
- The popover closes on blur with a 200ms delay (to allow click events on suggestions)

### UI Behavior Props

- **`showPreview`** (default: `true`): Controls whether the DSL preview toggle button is visible on the search bar. The preview panel itself is **hidden by default** and only appears when the user clicks the `</>` toggle button.
- **`autoOpenSuggestions`** (default: `true`): When `true`, the autocomplete popover opens immediately on input focus. When `false`, suggestions only appear when the user starts typing or when the phase transitions (operator/value/logical).

### Search Mode Selector

The component supports multiple search modes via the `searchModes` prop. When >= 2 modes are provided, a dropdown selector appears at the left of the search bar.

**Types:**
```typescript
interface SearchMode {
  key: string;                    // Unique identifier
  label: string;                  // Display label
  icon?: string;                  // Emoji/icon
  placeholder?: string;           // Mode-specific placeholder
  type: 'advanced' | 'basic';     // 'advanced' = token editor, 'basic' = plain input
  queryProvider?: (inputText: string) => string | Promise<string>; // Async supported
}
```

**Props:**
- `searchModes?: SearchMode[]` — Available modes. No selector shown if < 2 modes.
- `defaultSearchMode?: string` — Key of the initial mode. Defaults to first.
- `onSearchModeChange?: (mode: SearchMode) => void` — Called when user switches mode.

**Mode transitions:**
- Advanced → Basic: Input is cleared (tokens can't map to plain text).
- Basic → Advanced: Input is cleared (fresh start for structured query).
- Basic ↔ Basic: Text preserved.

**Basic mode:**
- Plain `<input>` with submit button (🔍).
- `queryProvider` transforms input text → raw query string (supports `async` for API calls).
- Loading spinner shown during async provider execution.
- `onSearch` is called with `QueryResult { raw: providerOutput, ... }`.

### CSS Architecture

- All styles are in `SearchQueryBuilder.module.css` using CSS Modules
- Theme switching via `data-theme="dark"|"light"` attribute on `.root`
- All design tokens are CSS custom properties (`--sqb-*`)
- Two complete token sets: dark and light
- Animations: `tagAppear`, `popoverAppear`, `previewAppear`, `spin`, `blink`

### Relative Date Expressions

The query builder supports Elasticsearch Date Math expressions (`now-1h`, `now/d`, etc.) for date fields:
- **UI Support**: The `DatePicker` component provides a "Quick Select" tab with common presets (e.g., "Last 1 hour" → `now-1h`, "This year" → `now/y`).
- **Auto-Ranging**: Presets like "Today" or "This week" automatically expand into TWO tokens behind the scenes. For example, "This year" inserts `date >= now/y AND date <= now`.
- **Parsing/Display**: `dateExpressions.ts` maps these raw ES strings back into human-readable labels for the UI tags (e.g., showing "Start of year" instead of "now/y").
- **Exporters**: The DSL exporter passes date math strings directly to Elasticsearch. The MongoDB exporter (`conditionToMongo`) uses `resolveRelativeDate()` to convert these expressions into standard JS `Date` objects.

### Conditional Key Disabling

Keys can be conditionally hidden from autocomplete based on which keys are already in the query, via `disabledWhenKeysPresent`:

```typescript
const keyConfigs: KeyConfig[] = [
  {
    key: 'category',
    // ...
    disabledWhenKeysPresent: ['tag'],  // 'category' hidden when 'tag' is present
  },
  {
    key: 'tag',
    // ...
    disabledWhenKeysPresent: ['category'],  // 'tag' hidden when 'category' is present
  },
];
```

- The filter is applied during the `key` autocomplete phase in `useAutocomplete.ts`
- `SearchInput.tsx` passes `activeKeys` (from `getActiveKeys(tokens)`) to the autocomplete update
- Keys are **fully hidden** (not grayed out) when disabled — keeping the UX clean

### Custom Operators (`:` and `IN`)

The query builder supports two additional operators beyond the standard comparison set:

**`:` (Colon) — Analyzed Match**
- Always generates a `match` query regardless of the field's `queryType`
- Use for diacritic-folded / analyzed text search
- Example: `name:john` → `{ "match": { "name": { "query": "john" } } }`
- MongoDB: `{ name: { $regex: "john", $options: "i" } }`

**`IN` — Multi-value Terms**
- Generates a `terms` (plural) query for matching any of multiple values
- Values separated by comma in the raw string: `status IN active,inactive,draft`
- DSL: `{ "terms": { "status.keyword": ["active", "inactive", "draft"] } }`
- Lucene: `status.keyword:(active OR inactive OR draft)`
- MongoDB: `{ status: { $in: ["active", "inactive", "draft"] } }`
- URL params: `status_in=active,inactive,draft`

**Lexer note**: `IN` is context-sensitive — it's treated as an operator only when it follows an IDENTIFIER token. In other positions, it's treated as a value or identifier.

### Query Helpers (`src/core/queryHelpers.ts`)

Utility functions to inspect the current query token list:

```typescript
import { hasKey, findKey, findAllKeys, getActiveKeys, getKeyMap } from './core/queryHelpers';

// Check if a key exists in the query
const hasDate = hasKey(tokens, 'date');         // boolean

// Find the first condition for a key
const match = findKey(tokens, 'status');
// → { tokenId, key: 'status', operator: '=', value: 'active', keyConfig }

// Find ALL conditions for a key (e.g. date >= X AND date <= Y)
const dateMatches = findAllKeys(tokens, 'date');
// → [{ key: 'date', operator: '>=', value: 'now-1h' },
//    { key: 'date', operator: '<=', value: 'now'    }]

// List all unique keys present in the query
const keys = getActiveKeys(tokens);             // ['status', 'date']

// Bulk lookup: key → KeyMatch[]
const map = getKeyMap(tokens);
const dates = map.get('date');                  // KeyMatch[] | undefined
```

**Raw query string helpers** (same API, input is a raw string instead of tokens):

```typescript
import { hasKeyRaw, findKeyRaw, findAllKeysRaw, getActiveKeysRaw, getKeyMapRaw } from './core/queryHelpers';

const raw = 'status=active AND date>=now/y AND date<=now';

hasKeyRaw(raw, 'date');                         // true
hasKeyRaw(raw, 'price');                        // false

const match = findKeyRaw(raw, 'status');
// → { nodeId, key: 'status', operator: '=', value: 'active', keyConfig }

const dates = findAllKeysRaw(raw, 'date', keyConfigs);
// → [{ key: 'date', operator: '>=', value: 'now/y', keyConfig },
//    { key: 'date', operator: '<=', value: 'now',   keyConfig }]

getActiveKeysRaw(raw);                          // ['status', 'date']

const map = getKeyMapRaw(raw, keyConfigs);
map.get('date');                                // RawKeyMatch[]
```

## Type Reference

### KeyConfig (Consumer-Facing)

```typescript
interface KeyConfig {
  key: string;              // What user types: "status"
  label: string;            // Display name: "Status"
  description?: string;     // Tooltip text
  esField: string;          // ES field: "status.keyword"
  queryType: ESQueryType;   // 'term' | 'match' | 'range' | ...
  valueType: 'string' | 'number' | 'date' | 'boolean';
  allowedOperators?: Operator[];
  queryOptions?: { analyzer?, fuzziness?, boost?, ... };
  suggestionsProvider?: (input: string, signal: AbortSignal) => Promise<Suggestion[]>;
  staticSuggestions?: Suggestion[];
  icon?: string;            // Emoji icon for display
}
```

### QueryResult (Output)

```typescript
interface QueryResult {
  dsl: object;           // Elasticsearch 8.x DSL
  raw: string;           // Raw query string
  lucene: string;        // Lucene syntax
  urlParams: string;     // URL query parameters
  mongo: object;         // MongoDB filter object
  ast: QueryAST | null;
  errors: ParseError[];
}
```

## Common Tasks

### Adding a New Output Format

1. Add export function in `src/core/exporters.ts`
2. Add to `QueryResult` type in `src/core/types.ts`
3. Call it in `src/hooks/useDSL.ts`
4. Add tab in `src/components/SearchQueryBuilder/DSLPreview.tsx`

### Adding a New Operator

1. Add to `Operator` type in `src/core/types.ts`
2. Add to `OPERATORS` and `OPERATOR_LABELS` in `src/core/constants.ts`
3. Handle in `buildConditionDSL()` in `src/core/dslBuilder.ts`
4. Handle in each exporter in `src/core/exporters.ts`

### Adding a New ES Query Type

1. Add to `ESQueryType` in `src/core/types.ts`
2. Handle in `buildConditionDSL()` in `src/core/dslBuilder.ts`
3. Add sample `KeyConfig` in `src/demo/sampleConfig.ts`

### Adding a New Token Type

1. Define interface in `src/hooks/useQueryBuilder.ts`
2. Add to `EditorToken` union type
3. Handle serialization in `tokensToRawQuery()`
4. Add rendering in `SearchInput.tsx` → `renderToken()`
5. Add CSS in `SearchQueryBuilder.module.css`

## Known Issues / Tech Debt

- `QueryTag.tsx` and `GroupIndicator.tsx` are legacy files from before the token-based rewrite — may be removable
- No unit tests exist yet (parser and exporters are good candidates)
- `removeToken` for paren tokens may leave unmatched parens — consider auto-removing the matching paren
- The `data-theme` attribute approach means nested builder instances can't have different themes
- No keyboard shortcut for `(` / `)` — currently only via autocomplete suggestion

## Do NOT

- **Do NOT** derive state inline in render — always `useMemo`
- **Do NOT** pass new object/array literals as props without memoization
- **Do NOT** use `npm` — this project uses **Bun**
- **Do NOT** add Tailwind or any CSS framework — vanilla CSS Modules only
- **Do NOT** put React imports in `src/core/` — keep it pure TypeScript
- **Do NOT** store derived data (AST, rawQuery) in state — derive it with `useMemo`
