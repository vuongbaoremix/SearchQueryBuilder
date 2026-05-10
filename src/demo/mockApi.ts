// ============================================================
// Mock API — Simulated server for value suggestions
// ============================================================

import type { Suggestion } from '../core/types';

// Simulated datasets
const MOCK_DATA: Record<string, Suggestion[]> = {
  author: [
    { value: 'john_doe', label: 'John Doe', description: 'Engineering Team' },
    { value: 'jane_smith', label: 'Jane Smith', description: 'Product Team' },
    { value: 'bob_wilson', label: 'Bob Wilson', description: 'Design Team' },
    { value: 'alice_jones', label: 'Alice Jones', description: 'Marketing Team' },
    { value: 'charlie_brown', label: 'Charlie Brown', description: 'DevOps Team' },
    { value: 'diana_prince', label: 'Diana Prince', description: 'Security Team' },
    { value: 'evan_rogers', label: 'Evan Rogers', description: 'Data Team' },
    { value: 'fiona_green', label: 'Fiona Green', description: 'QA Team' },
  ],
  category: [
    { value: 'technology', label: 'Technology', description: '1,234 articles' },
    { value: 'science', label: 'Science', description: '892 articles' },
    { value: 'business', label: 'Business', description: '756 articles' },
    { value: 'health', label: 'Health', description: '543 articles' },
    { value: 'sports', label: 'Sports', description: '421 articles' },
    { value: 'entertainment', label: 'Entertainment', description: '389 articles' },
    { value: 'politics', label: 'Politics', description: '312 articles' },
    { value: 'education', label: 'Education', description: '278 articles' },
  ],
  tag: [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'golang', label: 'Go' },
    { value: 'docker', label: 'Docker' },
    { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'aws', label: 'AWS' },
  ],
};

/**
 * Create an async suggestions provider for a given field.
 * Simulates server latency (200–500ms).
 */
export function createMockSuggestionsProvider(field: string) {
  return async (input: string, signal: AbortSignal): Promise<Suggestion[]> => {
    // Simulate network latency
    const delay = 200 + Math.random() * 300;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

    const dataset = MOCK_DATA[field] || [];
    if (!input.trim()) return dataset;

    const lower = input.toLowerCase();
    return dataset.filter(
      (s) =>
        s.value.toLowerCase().includes(lower) ||
        s.label.toLowerCase().includes(lower)
    );
  };
}

// ============================================================
// Mock Search History Provider
// ============================================================

import type { SearchHistoryProvider, SearchHistoryItem } from '../core/types';

export class MockHistoryProvider implements SearchHistoryProvider {
  private items: SearchHistoryItem[] = [];

  constructor() {
    // Seed some initial data
    const now = new Date();
    this.items = [
      {
        id: '1',
        bookmark: true,
        name: 'High Severity Errors',
        createdTime: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        inputText: 'level: "ERROR" AND status: "NEW"',
        mode: 'advanced',
        raw: 'level: "ERROR" AND status: "NEW"',
        searchVersion: '1.0',
      },
      {
        id: '2',
        bookmark: false,
        name: '',
        createdTime: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        inputText: 'category: "technology"',
        mode: 'advanced',
        raw: 'category: "technology"',
        searchVersion: '1.0',
      },
      {
        id: '3',
        bookmark: true,
        name: 'My Daily Search',
        createdTime: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        inputText: 'author: "john_doe"',
        mode: 'advanced',
        raw: 'author: "john_doe"',
        searchVersion: '1.0',
      },
      {
        id: '4',
        bookmark: false,
        name: '',
        createdTime: new Date(now.getTime() - 1000 * 60 * 5).toISOString(), // 5 mins ago
        inputText: 'system crash',
        mode: 'basic',
        raw: 'message.content:"system crash"',
        searchVersion: '1.0',
      },
    ];
  }

  private async delay(ms = 300) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getSearchHistory(offset = 0, pageSize = 20): Promise<SearchHistoryItem[]> {
    await this.delay();
    // Return only non-bookmarked items for recent history? Or all items sorted by time.
    // Usually recent history shows all recent searches.
    const sorted = [...this.items].sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    return sorted.slice(offset, offset + pageSize);
  }

  async addSearchHistory(entry: { raw: string; mode: string; inputText: string }): Promise<void> {
    await this.delay(100);
    // Don't add if it's the exact same as the most recent one
    const sorted = [...this.items].sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    if (sorted.length > 0 && sorted[0].raw === entry.raw) {
      return;
    }

    const newItem: SearchHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      bookmark: false,
      name: '',
      createdTime: new Date().toISOString(),
      inputText: entry.inputText,
      mode: entry.mode,
      raw: entry.raw,
      searchVersion: '1.0',
    };
    this.items.push(newItem);
  }

  async getSearchHistoryBookmarks(): Promise<SearchHistoryItem[]> {
    await this.delay();
    return this.items
      .filter((item) => item.bookmark)
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
  }

  async toggleBookmark(id: string, name?: string): Promise<void> {
    await this.delay(100);
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.bookmark = !item.bookmark;
      if (item.bookmark && name) {
        item.name = name;
      } else if (!item.bookmark) {
        item.name = '';
      }
    }
  }

  async clearHistory(): Promise<void> {
    await this.delay();
    // Remove all non-bookmarked items
    this.items = this.items.filter((item) => item.bookmark);
  }

  async deleteHistory(id: string): Promise<void> {
    await this.delay(100);
    this.items = this.items.filter((item) => item.id !== id);
  }
}

