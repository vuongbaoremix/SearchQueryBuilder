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
