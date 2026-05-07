// ============================================================
// QueryTag — Displays a single condition as a chip
// ============================================================

import React from 'react';
import styles from './SearchQueryBuilder.module.css';

interface QueryTagProps {
  keyName: string;
  operator: string;
  value: string;
  hasError?: boolean;
  errorMessage?: string;
}

export const QueryTag: React.FC<QueryTagProps> = ({
  keyName,
  operator,
  value,
  hasError = false,
  errorMessage,
}) => {
  return (
    <span
      className={`${styles.tag} ${hasError ? styles.tagError : ''}`}
      title={errorMessage || `${keyName} ${operator} ${value}`}
    >
      <span className={styles.tagKey}>{keyName}</span>
      <span className={styles.tagOperator}>{operator}</span>
      <span className={styles.tagValue}>{value || '…'}</span>
    </span>
  );
};
