// ============================================================
// BasicSearchInput — Plain text search input for basic modes
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SearchMode, QueryResult, HistoryDisplayMode } from '../../core/types';
import { ModeSelector } from './ModeSelector';
import styles from './SearchQueryBuilder.module.css';

interface BasicSearchInputProps {
  activeMode: SearchMode;
  searchModes: SearchMode[];
  onModeChange: (mode: SearchMode) => void;
  onSearch: (result: QueryResult) => void;
  onQueryChange?: (result: QueryResult) => void;
  onClear?: () => void;
  placeholder?: string;
  defaultInputText?: string;
  /** Controlled input text. Changes from parent will sync into the input. */
  controlledInputText?: string;
  showPreviewToggle?: boolean;
  isPreviewOpen?: boolean;
  onTogglePreview?: () => void;
  hasHistoryProvider?: boolean;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  historyPanel?: React.ReactNode;
  historyDisplay?: HistoryDisplayMode;
}

function emptyResult(raw: string, inputText?: string): QueryResult {
  return {
    dsl: {},
    raw,
    lucene: '',
    urlParams: '',
    mongo: {},
    ast: null,
    errors: [],
    inputText: inputText ?? raw,
  };
}

export const BasicSearchInput: React.FC<BasicSearchInputProps> = ({
  activeMode,
  searchModes,
  onModeChange,
  onSearch,
  onQueryChange,
  onClear,
  placeholder,
  defaultInputText,
  controlledInputText,
  showPreviewToggle = true,
  isPreviewOpen = false,
  onTogglePreview,
  hasHistoryProvider = false,
  isHistoryOpen = false,
  onToggleHistory,
  historyPanel,
  historyDisplay = 'popup',
}) => {
  const [inputText, setInputText] = useState(defaultInputText || '');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Anti-loop ref: track what we last set internally
  const internalTextRef = useRef(inputText);

  // Sync controlled prop → internal state (only on external changes)
  useEffect(() => {
    if (controlledInputText === undefined) return;
    if (controlledInputText !== internalTextRef.current) {
      internalTextRef.current = controlledInputText;
      setInputText(controlledInputText);
    }
  }, [controlledInputText]);

  const resolvedPlaceholder = activeMode.placeholder || placeholder || 'Type to search…';

  const buildResult = useCallback(
    async (text: string): Promise<QueryResult> => {
      if (!text.trim()) return emptyResult('', '');
      if (activeMode.queryProvider) {
        const raw = await activeMode.queryProvider(text);
        return emptyResult(raw, text);
      }
      return emptyResult(text, text);
    },
    [activeMode]
  );

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const result = await buildResult(inputText);
      onSearch(result);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, buildResult, onSearch]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      internalTextRef.current = val;
      setInputText(val);
      // Notify parent on change (sync only, no provider call for live updates)
      onQueryChange?.(emptyResult(val, val));
    },
    [onQueryChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    internalTextRef.current = '';
    setInputText('');
    onQueryChange?.(emptyResult('', ''));
    onClear?.();
    inputRef.current?.focus();
  }, [onQueryChange, onClear]);

  return (
    <div className={styles.inputWrapper}>
      <div className={`${styles.inputContainer} ${styles.basicContainer}`}>
        {/* Mode selector */}
        <ModeSelector
          modes={searchModes}
          activeMode={activeMode}
          onModeChange={onModeChange}
        />

        {/* Plain text input */}
        <input
          ref={inputRef}
          type="text"
          className={styles.basicInput}
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          autoComplete="off"
          spellCheck={false}
          disabled={isLoading}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.basicLoading}>
            <div className={styles.basicLoadingSpinner} />
          </div>
        )}

        {/* Preview toggle */}
        {showPreviewToggle && (
          <button
            className={`${styles.previewToggleBtn} ${isPreviewOpen ? styles.previewToggleBtnActive : ''}`}
            onClick={onTogglePreview}
            title={isPreviewOpen ? 'Hide preview' : 'Show preview'}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        )}

        {/* History toggle */}
        {hasHistoryProvider && historyDisplay !== 'inline' && (
          <button
            className={`${styles.historyToggleBtn} ${isHistoryOpen ? styles.historyToggleBtnActive : ''}`}
            onClick={onToggleHistory}
            title={isHistoryOpen ? 'Close history' : 'Search history'}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        )}

        {/* Clear */}
        {inputText && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            title="Clear"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Submit button */}
        <button
          className={styles.basicSubmitBtn}
          onClick={handleSubmit}
          title="Search"
          type="button"
          disabled={isLoading || !inputText.trim()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* History panel (passed from parent) — popup mode only */}
      {historyDisplay !== 'inline' && historyPanel}
    </div>
  );
};
