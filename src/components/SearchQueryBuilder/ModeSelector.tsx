// ============================================================
// ModeSelector — Dropdown to switch between search modes
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SearchMode } from '../../core/types';
import styles from './SearchQueryBuilder.module.css';

interface ModeSelectorProps {
  modes: SearchMode[];
  activeMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  modes,
  activeMode,
  onModeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = useCallback(
    (mode: SearchMode) => {
      if (mode.key !== activeMode.key) {
        onModeChange(mode);
      }
      setIsOpen(false);
    },
    [activeMode.key, onModeChange]
  );

  if (modes.length < 2) return null;

  return (
    <div className={styles.modeSelector} ref={ref}>
      <button
        className={styles.modeSelectorBtn}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
        title="Switch search mode"
      >
        {activeMode.icon && <span className={styles.modeSelectorIcon}>{activeMode.icon}</span>}
        <span className={styles.modeSelectorLabel}>{activeMode.label}</span>
        <svg
          className={`${styles.modeSelectorChevron} ${isOpen ? styles.modeSelectorChevronOpen : ''}`}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.modeSelectorDropdown}>
          {modes.map((mode) => (
            <button
              key={mode.key}
              className={`${styles.modeSelectorItem} ${mode.key === activeMode.key ? styles.modeSelectorItemActive : ''}`}
              onClick={() => handleSelect(mode)}
              type="button"
            >
              {mode.icon && <span className={styles.modeSelectorItemIcon}>{mode.icon}</span>}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
