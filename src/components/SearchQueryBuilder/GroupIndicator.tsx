// ============================================================
// GroupIndicator — Bracket markers for nested groups
// ============================================================

import React from 'react';
import styles from './SearchQueryBuilder.module.css';

interface GroupIndicatorProps {
  type: 'open' | 'close';
  depth?: number;
}

const DEPTH_COLORS = [
  'var(--sqb-group-color-1)',
  'var(--sqb-group-color-2)',
  'var(--sqb-group-color-3)',
];

export const GroupIndicator: React.FC<GroupIndicatorProps> = ({ type, depth = 0 }) => {
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  return (
    <span
      className={styles.groupBracket}
      style={{ color, borderColor: color }}
    >
      {type === 'open' ? '(' : ')'}
    </span>
  );
};
