// ============================================================
// Demo App — Showcase the SearchQueryBuilder component
// ============================================================

import React, { useState, useCallback } from 'react';
import { SearchQueryBuilder } from '../components/SearchQueryBuilder/SearchQueryBuilder';
import { sampleKeyConfigs } from './sampleConfig';
import { realKeyConfigs } from './sampleConfig2';
import type { QueryResult, SearchMode } from '../core/types';
import styles from './App.module.css';

// ---- Search Mode configs ----
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const AdvancedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const SEARCH_MODES: SearchMode[] = [
  {
    key: 'advanced',
    label: 'Advanced',
    icon: <AdvancedIcon />,
    type: 'advanced',
    placeholder: 'Start typing a field name…',
  },
  {
    key: 'basic',
    label: 'Quick Search',
    icon: <SearchIcon />,
    type: 'basic',
    placeholder: 'Type to search everything…',
    queryProvider: async (text) => {
      // Simulated async provider (e.g. API call)
      await new Promise((r) => setTimeout(r, 500));
      return `message.content:"${text}"`;
    },
  },
];

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleQueryChange = useCallback((result: QueryResult) => {
    setLastResult(result);
  }, []);

  const handleSearch = useCallback((result: QueryResult) => {
    console.log('🔍 Search submitted:', result);
  }, []);

  return (
    <div className={theme === 'dark' ? styles.appDark : styles.appLight}>
      {/* Theme Toggle */}
      <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Advanced Search Query Builder</h1>
          <p className={styles.subtitle}>
            Build Elasticsearch queries visually • Supports nested groups, multiple operators, and auto-complete
          </p>
        </header>

        {/* Search Component */}
        <section className={styles.searchSection}>
          <SearchQueryBuilder
            keyConfigs={realKeyConfigs}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            theme={theme}
            showPreview={true}
            autoOpenSuggestions={true}
            searchModes={SEARCH_MODES}
            defaultSearchMode="advanced"
            onSearchModeChange={(mode) => console.log('Mode changed:', mode.key)}
          />
        </section>

        {/* Usage tips */}
        <section className={styles.examplesSection}>
          <h3 className={styles.examplesTitle}>How to use</h3>
          <div className={styles.examplesList}>
            <div className={styles.exampleBtn}>
              <strong>1.</strong> Type a field name → select from suggestions
            </div>
            <div className={styles.exampleBtn}>
              <strong>2.</strong> Select an operator (=, !=, &gt;, &gt;=, &lt;, &lt;=) from suggestions
            </div>
            <div className={styles.exampleBtn}>
              <strong>3.</strong> Type or select a value → condition becomes a tag
            </div>
            <div className={styles.exampleBtn}>
              <strong>4.</strong> Select AND/OR → continue adding conditions
            </div>
            <div className={styles.exampleBtn}>
              <strong>💡</strong> Click on <em>key</em> or <em>value</em> in a tag to edit it inline
            </div>
            <div className={styles.exampleBtn}>
              <strong>⌫</strong> Backspace on empty input removes the last token step-by-step
            </div>
          </div>
        </section>

        {/* Available Fields */}
        <section className={styles.helpSection}>
          <h3 className={styles.helpTitle}>Available Fields</h3>
          <div className={styles.helpGrid}>
            {sampleKeyConfigs.map((config) => (
              <div key={config.key} className={styles.helpItem}>
                <div className={styles.helpItemKey}>
                  <span>{config.icon}</span>
                  <span>{config.key}</span>
                  <span className={styles.helpItemType}>{config.queryType}</span>
                </div>
                <div className={styles.helpItemDesc}>{config.description}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
