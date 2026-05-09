// ============================================================
// SearchQueryBuilder — Main component (updated for token-based editor)
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchQueryBuilderProps, SearchMode, QueryResult, SearchHistoryItem } from '../../core/types';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import { useDSL } from '../../hooks/useDSL';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { SearchInput } from './SearchInput';
import { BasicSearchInput } from './BasicSearchInput';
import { SearchHistoryPanel } from './SearchHistoryPanel';
import { DSLPreview } from './DSLPreview';
import styles from './SearchQueryBuilder.module.css';

function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return theme;
}

export const SearchQueryBuilder: React.FC<SearchQueryBuilderProps> = ({
  keyConfigs,
  onQueryChange,
  onSearch,
  onClear,
  theme = 'auto',
  placeholder,
  showPreview = true,
  autoOpenSuggestions = true,
  className,
  searchModes,
  defaultSearchMode,
  defaultInputText,
  onSearchModeChange,
  // Controlled props
  query: controlledQuery,
  searchMode: controlledSearchMode,
  inputText: controlledInputText,
  // History
  historyProvider,
  historyDisplay = 'popup',
  onHistorySelect,
}) => {
  const systemTheme = useSystemTheme();
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;

  const builder = useQueryBuilder(keyConfigs);
  const { rawQuery, ast, errors } = builder;

  const queryResult = useDSL(ast, rawQuery, errors);

  // Preview panel toggle — hidden by default
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const togglePreview = useCallback(() => setIsPreviewOpen((v) => !v), []);

  // ---- Search mode state ----
  const resolveInitialMode = (): SearchMode | undefined => {
    if (!searchModes || searchModes.length === 0) return undefined;
    const key = controlledSearchMode || defaultSearchMode;
    if (key) {
      return searchModes.find((m) => m.key === key) || searchModes[0];
    }
    return searchModes[0];
  };
  const [activeMode, setActiveMode] = useState<SearchMode | undefined>(resolveInitialMode);

  // Basic mode result for preview
  const [basicResult, setBasicResult] = useState<QueryResult | null>(null);

  // ---- History ----
  const history = useSearchHistory(historyProvider, historyDisplay);

  // Mutual exclusion: close history when autocomplete opens (handled by input focus)
  const handleToggleHistory = useCallback(() => {
    history.toggle();
  }, [history]);

  // ---- Anti-loop refs ----
  // Track last internally-generated values to distinguish external vs internal changes
  const internalRawQueryRef = useRef(rawQuery);
  const internalBasicTextRef = useRef(defaultInputText || '');
  const internalModeRef = useRef(activeMode?.key);

  // ---- Controlled: query (advanced mode only) ----
  useEffect(() => {
    if (controlledQuery === undefined) return;
    // Skip when in basic mode — BasicSearchInput manages its own state
    if (activeMode?.type === 'basic') return;
    // Only sync if this is an external change (not caused by internal typing)
    if (controlledQuery !== internalRawQueryRef.current) {
      internalRawQueryRef.current = controlledQuery;
      builder.loadQuery(controlledQuery);
    }
  }, [controlledQuery, builder, activeMode]);

  // ---- Controlled: searchMode ----
  useEffect(() => {
    if (controlledSearchMode === undefined || !searchModes) return;
    if (controlledSearchMode !== internalModeRef.current) {
      const newMode = searchModes.find((m) => m.key === controlledSearchMode);
      if (newMode) {
        internalModeRef.current = newMode.key;
        setActiveMode(newMode);
      }
    }
  }, [controlledSearchMode, searchModes]);

  // ---- Controlled: inputText (basic mode) ----
  // Passed directly to BasicSearchInput as controlled prop

  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      const prevMode = activeMode;
      internalModeRef.current = newMode.key;
      setActiveMode(newMode);
      onSearchModeChange?.(newMode);

      // Transition: advanced → basic → clear
      if (prevMode?.type === 'advanced' && newMode.type === 'basic') {
        builder.clearAll();
        internalRawQueryRef.current = '';
      }
      // Transition: basic → advanced → clear
      if (prevMode?.type === 'basic' && newMode.type === 'advanced') {
        builder.clearAll();
        internalRawQueryRef.current = '';
        setBasicResult(null);
        internalBasicTextRef.current = '';
      }
    },
    [activeMode, onSearchModeChange, builder]
  );

  // Enrich result with mode metadata
  const enrichResult = useCallback(
    (result: QueryResult, overrideInputText?: string): QueryResult => ({
      ...result,
      inputText: overrideInputText ?? result.raw,
      searchModeKey: activeMode?.key,
    }),
    [activeMode]
  );

  // Notify parent when query changes (use ref to prevent infinite loop)
  // Only fires in advanced mode — basic mode uses handleBasicQueryChange instead.
  const prevRawQueryRef = useRef(rawQuery);
  useEffect(() => {
    if (activeMode?.type === 'basic') return;
    if (prevRawQueryRef.current !== rawQuery) {
      prevRawQueryRef.current = rawQuery;
      // Update internal ref so controlled prop sync won't re-trigger
      internalRawQueryRef.current = rawQuery;
      onQueryChange?.(enrichResult(queryResult));
    }
  }, [rawQuery, queryResult, onQueryChange, enrichResult, activeMode]);

  const handleSubmit = useCallback(() => {
    const result = enrichResult(queryResult);
    onSearch?.(result);
    // Auto-save to history
    if (historyProvider && result.raw) {
      history.addToHistory({
        raw: result.raw,
        mode: activeMode?.key || 'advanced',
        inputText: result.inputText || result.raw,
      });
    }
  }, [onSearch, queryResult, enrichResult, historyProvider, history, activeMode]);

  const handleBasicSearch = useCallback(
    (result: QueryResult) => {
      // result.inputText is set by BasicSearchInput; enrich with mode key
      internalBasicTextRef.current = result.inputText || '';
      const enriched = enrichResult(result, result.inputText);
      onSearch?.(enriched);
      // Auto-save to history
      if (historyProvider && (result.raw || result.inputText)) {
        history.addToHistory({
          raw: result.raw || '',
          mode: activeMode?.key || 'basic',
          inputText: result.inputText || '',
        });
      }
    },
    [onSearch, enrichResult, historyProvider, history, activeMode]
  );

  const handleBasicQueryChange = useCallback(
    (result: QueryResult) => {
      const enriched = enrichResult(result, result.inputText);
      internalBasicTextRef.current = result.inputText || '';
      setBasicResult(enriched);
      onQueryChange?.(enriched);
    },
    [onQueryChange, enrichResult]
  );

  // ---- History item selection ----
  const handleHistoryItemSelect = useCallback(
    (item: SearchHistoryItem) => {
      history.close();
      onHistorySelect?.(item);
    },
    [history, onHistorySelect]
  );

  const hasQuery = builder.tokens.length > 0;

  // Determine if we're in basic mode
  const isBasicMode = activeMode?.type === 'basic';

  // Determine preview result
  const previewResult = isBasicMode ? basicResult : queryResult;

  // Build the history panel node so it's rendered inside the input's inputWrapper
  const historyPanelNode = historyProvider ? (
    <SearchHistoryPanel
      isOpen={history.isOpen}
      activeTab={history.activeTab}
      filteredItems={history.filteredItems}
      filterText={history.filterText}
      isLoading={history.isLoading}
      hasMore={history.hasMore}
      editingBookmarkId={history.editingBookmarkId}
      recentCount={history.recentItems.length}
      bookmarkCount={history.bookmarkItems.length}
      displayMode={historyDisplay}
      onClose={history.close}
      onTabChange={history.setActiveTab}
      onFilterChange={history.setFilterText}
      onSelect={handleHistoryItemSelect}
      onToggleBookmark={history.toggleBookmark}
      onStartRename={history.startRenameBookmark}
      onConfirmRename={history.confirmRenameBookmark}
      onCancelRename={history.cancelRenameBookmark}
      onLoadMore={history.loadMore}
      onClearHistory={history.clearHistory}
      onDeleteHistory={history.deleteHistory}
    />
  ) : null;

  return (
    <div
      className={`${styles.root} ${className || ''}`}
      data-theme={resolvedTheme}
    >
      {isBasicMode ? (
        <BasicSearchInput
          activeMode={activeMode!}
          searchModes={searchModes || []}
          onModeChange={handleModeChange}
          onSearch={handleBasicSearch}
          onQueryChange={handleBasicQueryChange}
          onClear={onClear}
          placeholder={placeholder}
          defaultInputText={defaultInputText}
          controlledInputText={controlledInputText}
          showPreviewToggle={showPreview}
          isPreviewOpen={isPreviewOpen}
          onTogglePreview={togglePreview}
          hasHistoryProvider={!!historyProvider}
          isHistoryOpen={history.isOpen}
          onToggleHistory={handleToggleHistory}
          historyPanel={historyPanelNode}
          historyDisplay={historyDisplay}
        />
      ) : (
        <SearchInput
          builder={builder}
          keyConfigs={keyConfigs}
          placeholder={activeMode?.placeholder || placeholder}
          onSubmit={handleSubmit}
          onClear={onClear}
          autoOpenSuggestions={autoOpenSuggestions}
          showPreviewToggle={showPreview}
          isPreviewOpen={isPreviewOpen}
          onTogglePreview={togglePreview}
          searchModes={searchModes}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          hasHistoryProvider={!!historyProvider}
          isHistoryOpen={history.isOpen}
          onToggleHistory={handleToggleHistory}
          historyPanel={historyPanelNode}
          historyDisplay={historyDisplay}
        />
      )}

      {showPreview && isPreviewOpen && previewResult && (previewResult.raw || hasQuery) && (
        <DSLPreview result={previewResult} />
      )}

      {/* Inline history panel — rendered outside input, always visible */}
      {historyDisplay === 'inline' && historyPanelNode}
    </div>
  );
};

export default SearchQueryBuilder;
