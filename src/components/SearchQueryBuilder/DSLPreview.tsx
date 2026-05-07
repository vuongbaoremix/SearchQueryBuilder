// ============================================================
// DSLPreview — Tabbed viewer for all output formats
// ============================================================

import React, { useState } from 'react';
import type { QueryResult } from '../../core/types';
import styles from './SearchQueryBuilder.module.css';

interface DSLPreviewProps {
  result: QueryResult;
}

type TabKey = 'dsl' | 'lucene' | 'urlParams' | 'mongo' | 'raw';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dsl', label: 'ES DSL' },
  { key: 'lucene', label: 'Lucene' },
  { key: 'urlParams', label: 'URL Params' },
  { key: 'mongo', label: 'MongoDB' },
  { key: 'raw', label: 'Raw Query' },
];

export const DSLPreview: React.FC<DSLPreviewProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dsl');
  const [copied, setCopied] = useState(false);

  const getContent = (): string => {
    switch (activeTab) {
      case 'dsl':
        return JSON.stringify(result.dsl, null, 2);
      case 'lucene':
        return result.lucene;
      case 'urlParams':
        return result.urlParams ? `?${result.urlParams}` : '(empty)';
      case 'mongo':
        return JSON.stringify(result.mongo, null, 2);
      case 'raw':
        return result.raw || '(empty)';
      default:
        return '';
    }
  };

  const content = getContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={styles.preview}>
      <div className={styles.previewTabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.previewTab} ${activeTab === tab.key ? styles.previewTabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <button
          className={styles.previewCopyBtn}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied' : '⧉ Copy'}
        </button>
      </div>

      <div className={styles.previewContent}>
        <pre className={styles.previewCode}>{content}</pre>
      </div>

      {result.errors.length > 0 && (
        <div className={styles.previewErrors}>
          {result.errors.map((err, i) => (
            <div key={i} className={styles.previewError}>
              ⚠ {err.message}
              {err.token && <span className={styles.previewErrorToken}> "{err.token}"</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
