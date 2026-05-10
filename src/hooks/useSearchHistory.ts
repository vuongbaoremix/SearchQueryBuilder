// ============================================================
// useSearchHistory — State management for search history panel
// ============================================================

import { useState, useCallback, useRef } from 'react';
import type { SearchHistoryProvider, SearchHistoryItem, SearchHelpItem } from '../core/types';

export type HistoryTab = 'recent' | 'bookmarks' | 'help';

export interface UseSearchHistoryReturn {
  // State
  isOpen: boolean;
  activeTab: HistoryTab;
  recentItems: SearchHistoryItem[];
  bookmarkItems: SearchHistoryItem[];
  filterText: string;
  filteredItems: SearchHistoryItem[];
  isLoading: boolean;
  hasMore: boolean;
  editingBookmarkId: string | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setActiveTab: (tab: HistoryTab) => void;
  setFilterText: (text: string) => void;
  addToHistory: (entry: { raw: string; mode: string; inputText: string }) => Promise<void>;
  toggleBookmark: (id: string, name?: string) => Promise<void>;
  startRenameBookmark: (id: string) => void;
  confirmRenameBookmark: (id: string, name: string) => Promise<void>;
  cancelRenameBookmark: () => void;
  loadMore: () => void;
  clearHistory: () => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  refresh: () => void;
}

const PAGE_SIZE = 20;

export function useSearchHistory(
  provider: SearchHistoryProvider | undefined,
  helpItems?: SearchHelpItem[]
): UseSearchHistoryReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState<HistoryTab>('recent');
  const [recentItems, setRecentItems] = useState<SearchHistoryItem[]>([]);
  const [bookmarkItems, setBookmarkItems] = useState<SearchHistoryItem[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);

  const offsetRef = useRef(0);

  // ---- Fetch helpers ----

  const fetchRecent = useCallback(
    async (offset = 0, append = false) => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const items = await provider.getSearchHistory(offset, PAGE_SIZE);
        if (append) {
          setRecentItems((prev) => [...prev, ...items]);
        } else {
          setRecentItems(items);
        }
        setHasMore(items.length >= PAGE_SIZE);
        offsetRef.current = offset + items.length;
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  const fetchBookmarks = useCallback(async () => {
    if (!provider) return;
    setIsLoading(true);
    try {
      const items = await provider.getSearchHistoryBookmarks();
      setBookmarkItems(items);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // ---- Actions ----

  const open = useCallback(() => {
    setIsOpen(true);
    setFilterText('');
    offsetRef.current = 0;
    fetchRecent(0);
    fetchBookmarks();
  }, [fetchRecent, fetchBookmarks]);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingBookmarkId(null);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const setActiveTab = useCallback(
    (tab: HistoryTab) => {
      setActiveTabState(tab);
      setFilterText('');
      setEditingBookmarkId(null);
    },
    []
  );

  const addToHistory = useCallback(
    async (entry: { raw: string; mode: string; inputText: string }) => {
      if (!provider) return;
      await provider.addSearchHistory(entry);
      // Refresh recent list if panel is open
      if (isOpen) {
        offsetRef.current = 0;
        fetchRecent(0);
      }
    },
    [provider, isOpen, fetchRecent]
  );

  const toggleBookmark = useCallback(
    async (id: string, name?: string) => {
      if (!provider) return;
      await provider.toggleBookmark(id, name);
      // Refresh both lists
      offsetRef.current = 0;
      fetchRecent(0);
      fetchBookmarks();
    },
    [provider, fetchRecent, fetchBookmarks]
  );

  const startRenameBookmark = useCallback((id: string) => {
    setEditingBookmarkId(id);
  }, []);

  const confirmRenameBookmark = useCallback(
    async (id: string, name: string) => {
      if (!provider) return;
      await provider.toggleBookmark(id, name);
      setEditingBookmarkId(null);
      fetchBookmarks();
    },
    [provider, fetchBookmarks]
  );

  const cancelRenameBookmark = useCallback(() => {
    setEditingBookmarkId(null);
  }, []);

  const loadMore = useCallback(() => {
    fetchRecent(offsetRef.current, true);
  }, [fetchRecent]);

  const clearHistory = useCallback(async () => {
    if (!provider) return;
    await provider.clearHistory();
    setRecentItems([]);
    offsetRef.current = 0;
    setHasMore(false);
  }, [provider]);

  const deleteHistory = useCallback(async (id: string) => {
    if (!provider) return;
    await provider.deleteHistory(id);
    // Remove from local state immediately
    setRecentItems((prev) => prev.filter((item) => item.id !== id));
    setBookmarkItems((prev) => prev.filter((item) => item.id !== id));
  }, [provider]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    fetchRecent(0);
    fetchBookmarks();
  }, [fetchRecent, fetchBookmarks]);

  // ---- Computed: filtered items ----

  const sourceItems = activeTab === 'recent' ? recentItems : bookmarkItems;
  
  // Note: For 'help' tab, we don't return filteredItems from here, we will render helpItems directly
  const filteredItems = filterText.trim() && activeTab !== 'help'
    ? sourceItems.filter((item) => {
        const q = filterText.toLowerCase();
        return (
          (item.raw?.toLowerCase().includes(q)) ||
          (item.inputText?.toLowerCase().includes(q)) ||
          (item.name?.toLowerCase().includes(q))
        );
      })
    : sourceItems;

  return {
    isOpen,
    activeTab,
    recentItems,
    bookmarkItems,
    filterText,
    filteredItems,
    isLoading,
    hasMore,
    editingBookmarkId,
    open,
    close,
    toggle,
    setActiveTab,
    setFilterText,
    addToHistory,
    toggleBookmark,
    startRenameBookmark,
    confirmRenameBookmark,
    cancelRenameBookmark,
    loadMore,
    clearHistory,
    deleteHistory,
    refresh,
  };
}
