// ============================================================
// AutocompletePopover — Suggestion dropdown (updated for InputPhase)
// ============================================================

import React, { useEffect, useRef } from 'react';
import type { Suggestion } from '../../core/types';
import type { InputPhase } from '../../hooks/useQueryBuilder';
import styles from './SearchQueryBuilder.module.css';

interface AutocompletePopoverProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  isLoading: boolean;
  phase: InputPhase;
  isOpen: boolean;
  onSelect: (suggestion: Suggestion) => void;
  onHover: (index: number) => void;
}

const PHASE_LABELS: Record<InputPhase, string> = {
  key: 'Fields',
  operator: 'Operators',
  value: 'Values',
  logical: 'Logic',
};

export const AutocompletePopover: React.FC<AutocompletePopoverProps> = ({
  suggestions,
  selectedIndex,
  isLoading,
  phase,
  isOpen,
  onSelect,
  onHover,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`.${styles.popoverItem}`);
    const selected = items[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen || (suggestions.length === 0 && !isLoading)) return null;

  return (
    <div className={styles.popover} ref={listRef}>
      <div className={styles.popoverHeader}>
        <span className={styles.popoverPhase}>{PHASE_LABELS[phase]}</span>
        {isLoading && <span className={styles.popoverSpinner} />}
      </div>

      {suggestions.map((suggestion, index) => {
        const isSearchAction = suggestion.value === '__SEARCH__';
        const isNextNonSearch = index > 0 && suggestions[index - 1]?.value === '__SEARCH__';
        
        return (
          <React.Fragment key={`${suggestion.value}-${index}`}>
            {isNextNonSearch && <div className={styles.popoverSeparator} />}
            <div
              className={`${styles.popoverItem} ${index === selectedIndex ? styles.popoverItemActive : ''} ${isSearchAction ? styles.popoverSearchItem : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                onSelect(suggestion);
              }}
              onMouseEnter={() => onHover(index)}
            >
              <div className={styles.popoverItemMain}>
                <span className={styles.popoverItemLabel}>{suggestion.label}</span>
                {isSearchAction ? (
                  <kbd className={styles.popoverKbd}>↵</kbd>
                ) : (
                  suggestion.value !== suggestion.label && (
                    <span className={styles.popoverItemValue}>{suggestion.value}</span>
                  )
                )}
              </div>
              {suggestion.description && (
                <div className={styles.popoverItemDesc}>{suggestion.description}</div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {isLoading && suggestions.length === 0 && (
        <div className={styles.popoverLoading}>Loading suggestions…</div>
      )}
    </div>
  );
};
