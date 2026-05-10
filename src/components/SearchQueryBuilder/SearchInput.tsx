// ============================================================
// SearchInput — Token-based editor with TRUE inline editing
// ============================================================

import React, { useCallback, useEffect, useRef } from 'react';
import type { KeyConfig, Suggestion, SearchMode, HistoryDisplayMode } from '../../core/types';
import type { EditorToken, InputPhase } from '../../hooks/useQueryBuilder';
import type { UseQueryBuilderReturn } from '../../hooks/useQueryBuilder';
import { useAutocomplete } from '../../hooks/useAutocomplete';
import { AutocompletePopover } from './AutocompletePopover';
import { ModeSelector } from './ModeSelector';
import { DatePicker } from './DatePicker';
import { formatRelativeDateDisplay } from '../../core/dateExpressions';
import { getActiveKeys } from '../../core/queryHelpers';
import styles from './SearchQueryBuilder.module.css';

interface SearchInputProps {
  builder: UseQueryBuilderReturn;
  keyConfigs: KeyConfig[];
  placeholder?: string;
  onSubmit: () => void;
  onClear?: () => void;
  autoOpenSuggestions?: boolean;
  showPreviewToggle?: boolean;
  isPreviewOpen?: boolean;
  onTogglePreview?: () => void;
  searchModes?: SearchMode[];
  activeMode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
  hasHistoryProvider?: boolean;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  onOpenHistory?: () => void;
  onCloseHistory?: () => void;
  historyPanel?: React.ReactNode;
  historyDisplay?: HistoryDisplayMode;
}

const PHASE_PLACEHOLDERS: Record<InputPhase, string> = {
  key: 'Type a field name…',
  operator: 'Select operator…',
  value: 'Type a value…',
  logical: 'AND / OR…',
};

export const SearchInput: React.FC<SearchInputProps> = ({
  builder,
  keyConfigs,
  placeholder,
  onSubmit,
  onClear,
  autoOpenSuggestions = true,
  showPreviewToggle = true,
  isPreviewOpen = false,
  onTogglePreview,
  searchModes,
  activeMode,
  onModeChange,
  hasHistoryProvider = false,
  isHistoryOpen = false,
  onToggleHistory,
  onOpenHistory,
  onCloseHistory,
  historyPanel,
  historyDisplay = 'popup',
}) => {
  const {
    state,
    tokens,
    inputRef,
    openParenCount,
    setInputText,
    selectKey,
    selectOperator,
    selectValue,
    selectLogical,
    insertParen,
    insertParenAtToken,
    confirmInput,
    removeToken,
    editToken,
    cancelEdit,
    clearAll,
    handleBackspace,
  } = builder;

  const autocomplete = useAutocomplete();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusTick, setFocusTick] = React.useState(0);

  const isEditing = !!state.editingTokenId;

  // ---- Sync autocomplete (only when input is focused) ----
  useEffect(() => {
    if (!isFocusedRef.current) return;
    autocomplete.update({
      phase: state.inputPhase,
      inputText: state.inputText,
      currentKey: state.pendingKey,
      currentKeyConfig: state.pendingKeyConfig,
      keyConfigs,
      openParenCount,
      activeKeys: getActiveKeys(tokens),
      hasValidQuery: tokens.length > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inputPhase, state.inputText, state.pendingKey, keyConfigs, openParenCount, tokens, focusTick]);

  // Focus the edit input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Small delay to ensure the input is rendered
      requestAnimationFrame(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      });
    }
  }, [isEditing, state.editingTokenId, state.editingField]);
  // ---- Handle suggestion selection ----
  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      // Handle search action from logical phase
      if (suggestion.value === '__SEARCH__') {
        autocomplete.close();
        onSubmit();
        return;
      }

      if (suggestion.value === '(') {
        insertParen('open');
        autocomplete.close();
        return;
      }
      if (suggestion.value === ')') {
        insertParen('close');
        autocomplete.close();
        return;
      }

      // ── Priority: editing an existing tag field ──
      // Use editingField (not inputPhase) to determine what we're editing,
      // since editingField is always correct whereas inputPhase in the
      // closure may be stale.
      if (state.editingTokenId && state.editingField) {
        switch (state.editingField) {
          case 'key': {
            const config = keyConfigs.find((k) => k.key === suggestion.value);
            selectKey(suggestion.value, config);
            break;
          }
          case 'operator':
            selectOperator(suggestion.value as any);
            break;
          case 'value':
            selectValue(suggestion.value);
            break;
        }
        autocomplete.close();
        return;
      }

      // ── Normal flow (not editing) ──
      switch (state.inputPhase) {
        case 'key': {
          const config = keyConfigs.find((k) => k.key === suggestion.value);
          selectKey(suggestion.value, config);
          break;
        }
        case 'operator':
          selectOperator(suggestion.value as any);
          break;
        case 'value':
          selectValue(suggestion.value);
          break;
        case 'logical':
          selectLogical(suggestion.value as any);
          break;
      }
      autocomplete.close();
    },
    [state.inputPhase, state.editingTokenId, state.editingField, keyConfigs, selectKey, selectOperator, selectValue, selectLogical, insertParen, autocomplete, onSubmit]
  );

  // ---- Shared keyboard handler (used by both main input and edit input) ----
  const handleSharedKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Autocomplete navigation
      if (autocomplete.isOpen) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            autocomplete.moveSelection(1);
            return;
          case 'ArrowUp':
            e.preventDefault();
            autocomplete.moveSelection(-1);
            return;
          case 'Tab':
          case 'Enter': {
            const selected = autocomplete.getSelected();
            if (selected) {
              e.preventDefault();
              handleSuggestionSelect(selected);
              return;
            }
            break;
          }
          case 'Escape':
            e.preventDefault();
            autocomplete.close();
            if (state.editingTokenId) {
              cancelEdit();
              inputRef.current?.focus();
            }
            return;
        }
      }

      // Enter to confirm (when autocomplete is closed)
      if (e.key === 'Enter' && !autocomplete.isOpen) {
        e.preventDefault();
        if (state.inputText.trim()) {
          confirmInput();
          // After confirming an edit, refocus main input
          if (state.editingTokenId) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        } else if (state.editingTokenId) {
          cancelEdit();
          inputRef.current?.focus();
        } else if (tokens.length > 0) {
          onSubmit();
        }
        return;
      }

      // Escape to cancel edit
      if (e.key === 'Escape') {
        if (state.editingTokenId) {
          e.preventDefault();
          cancelEdit();
          inputRef.current?.focus();
        }
        return;
      }

      // Backspace — smart navigation (only for main input, not when editing)
      if (e.key === 'Backspace' && !state.inputText && !state.editingTokenId) {
        const handled = handleBackspace();
        if (handled) {
          e.preventDefault();
        }
        return;
      }

      // Space after typing in logical phase: check for AND/OR
      if (e.key === ' ' && state.inputPhase === 'logical') {
        const upper = state.inputText.trim().toUpperCase();
        if (upper === 'AND' || upper === 'OR') {
          e.preventDefault();
          selectLogical(upper as any);
        }
      }
    },
    [autocomplete, state, tokens, handleSuggestionSelect, confirmInput, handleBackspace, cancelEdit, selectLogical, onSubmit, inputRef]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
    },
    [setInputText]
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    // Cancel any pending blur-close so it doesn't kill the autocomplete
    // that we're about to (re-)open. This is critical for the
    // main-input-blur → edit-input-focus transition.
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (autoOpenSuggestions) {
      // Bump focusTick to trigger the autocomplete sync useEffect.
      // This must fire for BOTH normal input and inline edit inputs.
      setFocusTick((t) => t + 1);
    }
    if (historyDisplay === 'inline' && onOpenHistory) {
      onOpenHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenSuggestions, historyDisplay, onOpenHistory]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    isFocusedRef.current = false;
    // Delay close so clicks on popover items or tag parts can fire first.
    // The timeout is tracked so handleFocus can cancel it if focus moves
    // to another input within the same component (e.g. edit input).
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      autocomplete.close();
      if (historyDisplay === 'inline' && onCloseHistory) {
        onCloseHistory();
      }
    }, 200);
  }, [autocomplete, historyDisplay, onCloseHistory]);

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === wrapperRef.current || e.target === e.currentTarget) {
        if (isEditing) {
          cancelEdit();
        }
        inputRef.current?.focus();
      }
    },
    [inputRef, isEditing, cancelEdit]
  );

  // ---- Enter edit mode: close stale autocomplete first ----
  const handleEditToken = useCallback(
    (tokenId: string, field: 'key' | 'operator' | 'value') => {
      autocomplete.close();
      editToken(tokenId, field);
    },
    [autocomplete, editToken]
  );

  // ---- Render a single tag ----
  const renderConditionTag = (token: Extract<EditorToken, { type: 'condition' }>) => {
    const isEditingThis = state.editingTokenId === token.id;
    const editingKey = isEditingThis && state.editingField === 'key';
    const editingOperator = isEditingThis && state.editingField === 'operator';
    const editingValue = isEditingThis && state.editingField === 'value';

    // Determine input type for editing value
    const isDateType = token.keyConfig?.valueType === 'date';
    const inputTypeForValue = token.keyConfig?.valueType === 'number' ? 'number' : 'text';

    return (
      <span
        key={token.id}
        className={`${styles.tagWrapper} ${isEditingThis ? styles.tagEditing : ''}`}
      >
        {!isEditingThis && (
          <button
            className={`${styles.addParenBtn} ${styles.addParenLeft}`}
            onClick={(e) => { e.stopPropagation(); insertParenAtToken(token.id, 'before'); }}
            title="Wrap in group (add '(')"
            type="button"
          >
            (
          </button>
        )}
        
        <span
          className={`${styles.tag} ${!token.keyConfig ? styles.tagError : ''}`}
          title={!token.keyConfig ? `Unknown field: ${token.key}` : `${token.key} ${token.operator} ${token.value}`}
        >
          {/* KEY part: either static or editing */}
          {editingKey ? (
          <input
            ref={editInputRef}
            type="text"
            className={styles.tagEditInput}
            value={state.inputText}
            onChange={handleChange}
            onKeyDown={handleSharedKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
            spellCheck={false}
            style={{ width: `${Math.max(state.inputText.length, 3) * 8 + 12}px` }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={styles.tagKey}
            onClick={(e) => { e.stopPropagation(); handleEditToken(token.id, 'key'); }}
            title="Click to edit field"
          >
            {token.key}
          </span>
        )}

        {/* OPERATOR part: either static or editing */}
        {editingOperator ? (
          <input
            ref={editInputRef}
            type="text"
            className={styles.tagEditInput}
            value={state.inputText}
            onChange={handleChange}
            onKeyDown={handleSharedKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
            spellCheck={false}
            style={{ width: `${Math.max(state.inputText.length, 2) * 8 + 12}px` }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={styles.tagOperator}
            onClick={(e) => { e.stopPropagation(); handleEditToken(token.id, 'operator'); }}
            title="Click to edit operator"
          >
            {token.operator}
          </span>
        )}

        {/* VALUE part: either static or editing */}
        {editingValue ? (
          isDateType ? (
            <div className={styles.dateTagEdit} onClick={(e) => e.stopPropagation()}>
              <DatePicker
                value={state.inputText}
                onChange={(val) => setInputText(val)}
                operator={token.operator}
                onConfirm={(val) => {
                  selectValue(val);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                onCancel={() => {
                  cancelEdit();
                  inputRef.current?.focus();
                }}
                autoFocus
              />
            </div>
          ) : (
            <input
              ref={editInputRef}
              type={inputTypeForValue}
              className={styles.tagEditInput}
              value={state.inputText}
              onChange={handleChange}
              onKeyDown={handleSharedKeyDown}
              onFocus={handleFocus}
              autoComplete="off"
              spellCheck={false}
              style={{ width: `${Math.max(state.inputText.length, 3) * 8 + 12}px` }}
              onClick={(e) => e.stopPropagation()}
            />
          )
        ) : (
          <span
            className={styles.tagValue}
            onClick={(e) => { e.stopPropagation(); handleEditToken(token.id, 'value'); }}
            title="Click to edit value"
          >
            {token.value ? (isDateType ? formatRelativeDateDisplay(token.value) : token.value) : '…'}
          </span>
          )}

          <button
            className={styles.tagRemove}
            onClick={(e) => { e.stopPropagation(); removeToken(token.id); }}
            title="Remove"
            type="button"
          >
            ×
          </button>
        </span>
        
        {!isEditingThis && (
          <button
            className={`${styles.addParenBtn} ${styles.addParenRight}`}
            onClick={(e) => { e.stopPropagation(); insertParenAtToken(token.id, 'after'); }}
            title="Close group (add ')')"
            type="button"
          >
            )
          </button>
        )}
      </span>
    );
  };

  // ---- Render tokens ----
  const renderToken = (token: EditorToken) => {
    if (token.type === 'condition') {
      return renderConditionTag(token);
    }

    if (token.type === 'logical') {
      return (
        <span key={token.id} className={styles.logicalOp}>
          {token.logicalOp}
          <button
            className={styles.tokenRemoveSmall}
            onClick={(e) => { e.stopPropagation(); removeToken(token.id); }}
            title="Remove"
            type="button"
          >
            ×
          </button>
        </span>
      );
    }

    if (token.type === 'paren_open') {
      return (
        <span key={token.id} className={styles.groupBracket}>
          (
          <button
            className={styles.tokenRemoveSmall}
            onClick={(e) => { e.stopPropagation(); removeToken(token.id); }}
            title="Remove ("
            type="button"
          >
            ×
          </button>
        </span>
      );
    }

    if (token.type === 'paren_close') {
      return (
        <span key={token.id} className={styles.groupBracket}>
          )
          <button
            className={styles.tokenRemoveSmall}
            onClick={(e) => { e.stopPropagation(); removeToken(token.id); }}
            title="Remove )"
            type="button"
          >
            ×
          </button>
        </span>
      );
    }

    return null;
  };

  // ---- Pending indicator ----
  const renderPendingIndicator = () => {
    if (!state.pendingKey || isEditing) return null;
    return (
      <span className={styles.pendingTag}>
        <span className={styles.tagKey}>{state.pendingKey}</span>
        {state.pendingOperator && (
          <span className={styles.tagOperator}>{state.pendingOperator}</span>
        )}
        <span className={styles.pendingCursor}>|</span>
      </span>
    );
  };

  // Determine placeholder
  const hasTokens = tokens.length > 0;
  const currentPlaceholder = hasTokens || state.pendingKey
    ? PHASE_PLACEHOLDERS[state.inputPhase]
    : placeholder || 'Start typing a field name…';

  return (
    <div className={styles.inputWrapper} ref={wrapperRef} onBlur={handleBlur}>
      <div className={styles.inputContainer} onClick={handleWrapperClick}>
        {/* Mode selector */}
        {searchModes && searchModes.length >= 2 && activeMode && onModeChange && (
          <ModeSelector
            modes={searchModes}
            activeMode={activeMode}
            onModeChange={onModeChange}
          />
        )}

        <div className={styles.searchIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        <div className={styles.tokensArea}>
          {tokens.map(renderToken)}
          {renderPendingIndicator()}

          {/* Main inline input — visible only when NOT editing a tag */}
          {!isEditing && (
            state.inputPhase === 'value' && state.pendingKeyConfig?.valueType === 'date' ? (
              <DatePicker
                value={state.inputText}
                onChange={(val) => setInputText(val)}
                operator={state.pendingOperator ?? undefined}
                onConfirm={(val) => {
                  selectValue(val);
                }}
                onConfirmRange={(gte, lte) => {
                  builder.selectRangeValue(gte, lte);
                }}
                onCancel={() => {
                  // Go back to operator phase
                  inputRef.current?.focus();
                }}
                autoFocus
              />
            ) : (
              <input
                ref={inputRef}
                type={state.inputPhase === 'value' && state.pendingKeyConfig?.valueType === 'number' ? 'number' : 'text'}
                className={styles.inlineInput}
                value={state.inputText}
                onChange={handleChange}
                onKeyDown={handleSharedKeyDown}
                onFocus={handleFocus}
                placeholder={currentPlaceholder}
                autoComplete="off"
                spellCheck={false}
                style={{
                  minWidth: state.inputPhase === 'operator' ? '50px' : '120px',
                }}
              />
            )
          )}
        </div>

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

        {(hasTokens || state.inputText) && (
          <button
            className={styles.clearBtn}
            onClick={() => { clearAll(); onClear?.(); }}
            title="Clear all"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Submit search */}
        <button
          className={styles.basicSubmitBtn}
          onClick={onSubmit}
          title="Search"
          type="button"
          disabled={!hasTokens}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* Dropdown container for stacking popovers */}
      {(autocomplete.isOpen || (historyDisplay === 'inline' && isHistoryOpen)) && (
        <div className={styles.dropdownContainer}>
          {/* Autocomplete popover */}
          <AutocompletePopover
            suggestions={autocomplete.suggestions}
            selectedIndex={autocomplete.selectedIndex}
            isLoading={autocomplete.isLoading}
            phase={state.inputPhase}
            isOpen={autocomplete.isOpen}
            onSelect={handleSuggestionSelect}
            onHover={autocomplete.setSelectedIndex}
          />

          {/* History panel (inline mode) */}
          {historyDisplay === 'inline' && historyPanel}
        </div>
      )}

      {/* History panel (passed from parent) — popup mode only */}
      {historyDisplay !== 'inline' && historyPanel}
    </div>
  );
};
