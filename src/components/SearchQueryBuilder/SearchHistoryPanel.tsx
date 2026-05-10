// ============================================================
// SearchHistoryPanel — History & bookmarks dropdown panel
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SearchHistoryItem, HistoryDisplayMode, SearchHelpItem } from '../../core/types';
import type { HistoryTab } from '../../hooks/useSearchHistory';
import styles from './SearchQueryBuilder.module.css';

interface SearchHistoryPanelProps {
  isOpen: boolean;
  activeTab: HistoryTab;
  filteredItems: SearchHistoryItem[];
  filterText: string;
  isLoading: boolean;
  hasMore: boolean;
  editingBookmarkId: string | null;
  recentCount: number;
  bookmarkCount: number;
  helpItems?: SearchHelpItem[];
  displayMode?: HistoryDisplayMode;

  onClose: () => void;
  onTabChange: (tab: HistoryTab) => void;
  onFilterChange: (text: string) => void;
  onSelect: (item: SearchHistoryItem) => void;
  onToggleBookmark: (id: string, name?: string) => void;
  onStartRename: (id: string) => void;
  onConfirmRename: (id: string, name: string) => void;
  onCancelRename: () => void;
  onLoadMore: () => void;
  onClearHistory: () => void;
  onDeleteHistory: (id: string) => void;
}

// ---- Relative time formatting ----

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

export const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  isOpen,
  activeTab,
  filteredItems,
  filterText,
  isLoading,
  hasMore,
  editingBookmarkId,
  recentCount,
  bookmarkCount,
  helpItems = [],
  displayMode = 'popup',
  onClose,
  onTabChange,
  onFilterChange,
  onSelect,
  onToggleBookmark,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onLoadMore,
  onClearHistory,
  onDeleteHistory,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const isInline = displayMode === 'inline';

  // Focus filter input when panel opens (popup mode only)
  useEffect(() => {
    if (isOpen && !isInline) {
      requestAnimationFrame(() => filterInputRef.current?.focus());
    }
  }, [isOpen, isInline]);

  // Close on outside click (popup mode only)
  useEffect(() => {
    if (!isOpen || isInline) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isInline, onClose]);

  if (!isOpen) return null;

  const panelClassName = isInline ? styles.historyPanelInline : styles.historyPanel;

  return (
    <div className={panelClassName} ref={panelRef}>
      {/* ---- Tabs ---- */}
      <div className={styles.historyTabs}>
        <button
          className={`${styles.historyTab} ${activeTab === 'recent' ? styles.historyTabActive : ''}`}
          onClick={() => onTabChange('recent')}
          type="button"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Recent</span>
          {recentCount > 0 && <span className={styles.historyTabBadge}>{recentCount}</span>}
        </button>
        <button
          className={`${styles.historyTab} ${activeTab === 'bookmarks' ? styles.historyTabActive : ''}`}
          onClick={() => onTabChange('bookmarks')}
          type="button"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>Bookmarks</span>
          {bookmarkCount > 0 && <span className={styles.historyTabBadge}>{bookmarkCount}</span>}
        </button>

        {/* Help Tab - only show if helpItems exist */}
        {helpItems.length > 0 && (
          <button
            className={`${styles.historyTab} ${activeTab === 'help' ? styles.historyTabActive : ''}`}
            onClick={() => onTabChange('help')}
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Help</span>
            <span className={styles.historyTabBadge}>{helpItems.length}</span>
          </button>
        )}

        {/* Clear all (recent tab only) */}
        {activeTab === 'recent' && recentCount > 0 && (
          <button
            className={styles.historyClearAllBtn}
            onClick={onClearHistory}
            title="Clear all history"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* ---- Filter input (Not shown for Help tab) ---- */}
      {activeTab !== 'help' && (
        <div className={styles.historyFilter}>
          <svg className={styles.historyFilterIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={filterInputRef}
            type="text"
            className={styles.historyFilterInput}
            value={filterText}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter history…"
            autoComplete="off"
            spellCheck={false}
          />
          {filterText && (
            <button
              className={styles.historyFilterClear}
              onClick={() => onFilterChange('')}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* ---- Item list ---- */}
      <div className={styles.historyList}>
        {filteredItems.length === 0 && !isLoading && activeTab !== 'help' && (
          <div className={styles.historyEmpty}>
            {filterText
              ? 'No matches found'
              : activeTab === 'recent'
                ? 'No recent searches'
                : 'No bookmarks yet'}
          </div>
        )}

        {/* Regular history items */}
        {activeTab !== 'help' && filteredItems.map((item) => (
          <HistoryItemRow
            key={item.id}
            item={item}
            isBookmarkTab={activeTab === 'bookmarks'}
            isEditingName={editingBookmarkId === item.id}
            onSelect={onSelect}
            onToggleBookmark={onToggleBookmark}
            onStartRename={onStartRename}
            onConfirmRename={onConfirmRename}
            onCancelRename={onCancelRename}
            onDelete={onDeleteHistory}
          />
        ))}

        {/* Help items */}
        {activeTab === 'help' && helpItems.map((helpItem) => (
          <HelpItemRow 
            key={helpItem.id} 
            item={helpItem} 
            onSelect={() => {
              // Convert SearchHelpItem to SearchHistoryItem shape for consistency
              onSelect({
                id: helpItem.id,
                bookmark: false,
                name: '',
                createdTime: new Date().toISOString(),
                inputText: helpItem.query,
                raw: helpItem.query,
                mode: helpItem.mode || 'advanced',
                searchVersion: '1.0'
              });
            }} 
          />
        ))}

        {/* Loading */}
        {isLoading && (
          <div className={styles.historyLoading}>
            <span className={styles.historyLoadingSpinner} />
            Loading…
          </div>
        )}

        {/* Load more (recent tab) */}
        {activeTab === 'recent' && hasMore && !isLoading && filteredItems.length > 0 && !filterText && (
          <button
            className={styles.historyLoadMore}
            onClick={onLoadMore}
            type="button"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// HistoryItemRow — Single history item
// ============================================================

interface HistoryItemRowProps {
  item: SearchHistoryItem;
  isBookmarkTab: boolean;
  isEditingName: boolean;
  onSelect: (item: SearchHistoryItem) => void;
  onToggleBookmark: (id: string, name?: string) => void;
  onStartRename: (id: string) => void;
  onConfirmRename: (id: string, name: string) => void;
  onCancelRename: () => void;
  onDelete: (id: string) => void;
}

const HistoryItemRow: React.FC<HistoryItemRowProps> = ({
  item,
  isBookmarkTab,
  isEditingName,
  onSelect,
  onToggleBookmark,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDelete,
}) => {
  const [renameDraft, setRenameDraft] = useState(item.name || '');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) {
      setRenameDraft(item.name || '');
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      });
    }
  }, [isEditingName, item.name]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirmRename(item.id, renameDraft.trim() || 'Untitled');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelRename();
      }
    },
    [item.id, renameDraft, onConfirmRename, onCancelRename]
  );

  const displayQuery = item.inputText || item.raw || '';
  const isBasicMode = item.mode !== 'advanced';

  return (
    <div
      className={styles.historyItem}
      onMouseDown={(e) => {
        // Don't select if clicking bookmark/rename buttons
        if ((e.target as HTMLElement).closest('button, input')) return;
        e.preventDefault();
        onSelect(item);
      }}
    >
      {/* Bookmark name (if bookmarked and in bookmarks tab or has name) */}
      {item.bookmark && item.name && (
        <div className={styles.historyItemName}>
          {isEditingName ? (
            <input
              ref={renameInputRef}
              type="text"
              className={styles.historyRenameInput}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={() => onCancelRename()}
              autoComplete="off"
              spellCheck={false}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.historyItemNameText}>★ {item.name}</span>
          )}
        </div>
      )}

      {/* Query text */}
      <div className={styles.historyItemQuery}>
        <span className={styles.historyItemQueryText}>{displayQuery}</span>
      </div>

      {/* Meta row: mode badge + time + actions */}
      <div className={styles.historyItemMeta}>
        <span className={`${styles.historyModeBadge} ${isBasicMode ? styles.historyModeBadgeBasic : ''}`}>
          {item.mode}
        </span>
        <span className={styles.historyTime}>{formatRelativeTime(item.createdTime)}</span>

        <div className={styles.historyItemActions}>
          {/* Bookmark toggle */}
          <button
            className={`${styles.historyBookmarkBtn} ${item.bookmark ? styles.historyBookmarkBtnActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.bookmark) {
                // Bookmark → open rename
                onToggleBookmark(item.id, item.inputText || item.raw || 'Search');
                onStartRename(item.id);
              } else {
                // Unbookmark
                onToggleBookmark(item.id);
              }
            }}
            title={item.bookmark ? 'Remove bookmark' : 'Bookmark this search'}
            type="button"
          >
            {item.bookmark ? '★' : '☆'}
          </button>

          {/* Rename button (bookmarks only) */}
          {item.bookmark && isBookmarkTab && !isEditingName && (
            <button
              className={styles.historyRenameBtn}
              onClick={(e) => {
                e.stopPropagation();
                onStartRename(item.id);
              }}
              title="Rename bookmark"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          )}

          {/* Delete button */}
          <button
            className={styles.historyDeleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            title="Delete"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HelpItemRow — Single help item
// ============================================================

interface HelpItemRowProps {
  item: SearchHelpItem;
  onSelect: () => void;
}

const HelpItemRow: React.FC<HelpItemRowProps> = ({ item, onSelect }) => {
  return (
    <div
      className={styles.historyItem}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      <div className={styles.historyItemName}>
        <span className={styles.historyItemNameText} style={{ fontWeight: 600 }}>{item.description}</span>
      </div>

      <div className={styles.historyItemQuery} style={{ marginTop: '4px' }}>
        <span className={styles.historyItemQueryText} style={{ opacity: 0.8 }}>{item.query}</span>
      </div>

      <div className={styles.historyItemMeta}>
        <span className={`${styles.historyModeBadge} ${item.mode === 'basic' ? styles.historyModeBadgeBasic : ''}`}>
          {item.mode || 'advanced'}
        </span>
      </div>
    </div>
  );
};
