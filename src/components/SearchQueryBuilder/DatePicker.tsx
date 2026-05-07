// ============================================================
// DatePicker — Custom calendar popover for date value input
// ============================================================

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DATE_PRESETS, formatRelativeDateDisplay } from '../../core/dateExpressions';
import type { Operator } from '../../core/types';
import styles from './SearchQueryBuilder.module.css';

interface DatePickerProps {
  value: string; // yyyy-mm-dd or empty
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  onConfirmRange?: (gte: string, lte: string) => void;
  onCancel: () => void;
  operator?: Operator;
  autoFocus?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDateStr(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  // If it's a relative expression, use the nice display formatter
  if (dateStr && dateStr.startsWith('now')) {
    return formatRelativeDateDisplay(dateStr);
  }

  const date = parseDateStr(dateStr);
  if (!date) return dateStr || ''; // fallback to raw string if it's not a normal date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];

  // Padding before first day
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onConfirm,
  onConfirmRange,
  onCancel,
  operator,
  autoFocus = true,
}) => {
  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(() => parseDateStr(value), [value]);

  const [activeTab, setActiveTab] = useState<'quick' | 'calendar'>('quick');

  const [viewYear, setViewYear] = useState(
    selectedDate?.getFullYear() ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate?.getMonth() ?? today.getMonth()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(value ? formatDisplayDate(value) : '');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [autoFocus]);

  // Update input text when value changes externally
  useEffect(() => {
    if (value) {
      setInputText(formatDisplayDate(value));
    }
  }, [value]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const navigateMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      let newMonth = prev + delta;
      if (newMonth < 0) {
        setViewYear((y) => y - 1);
        newMonth = 11;
      } else if (newMonth > 11) {
        setViewYear((y) => y + 1);
        newMonth = 0;
      }
      return newMonth;
    });
  }, []);

  const navigateYear = useCallback((delta: number) => {
    setViewYear((y) => y + delta);
  }, []);

  const handleDayClick = useCallback(
    (date: Date) => {
      const formatted = formatDate(date);
      onChange(formatted);
      setInputText(formatDisplayDate(formatted));
      setIsOpen(false);
      // Confirm immediately on date selection
      setTimeout(() => onConfirm(formatted), 50);
    },
    [onChange, onConfirm]
  );

  const handleTodayClick = useCallback(() => {
    const formatted = formatDate(today);
    onChange(formatted);
    setInputText(formatDisplayDate(formatted));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setTimeout(() => onConfirm(formatted), 50);
  }, [today, onChange, onConfirm]);

  const handlePresetClick = useCallback((preset: typeof DATE_PRESETS[0]) => {
    // If it's a range preset and we have the onConfirmRange handler, and operator is = or >=
    if (preset.isRange && onConfirmRange && preset.rangeStart && preset.rangeEnd && (!operator || operator === '=' || operator === '>=')) {
      setIsOpen(false);
      setTimeout(() => onConfirmRange(preset.rangeStart!, preset.rangeEnd!), 50);
      return;
    }

    // Single bound preset
    const val = preset.value;
    onChange(val);
    setInputText(formatDisplayDate(val));
    setIsOpen(false);
    setTimeout(() => onConfirm(val), 50);
  }, [onChange, onConfirm, onConfirmRange, operator]);

  const toggleCalendar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);

      // Try to parse various date formats
      const parsed = tryParseInput(text);
      if (parsed) {
        const formatted = formatDate(parsed);
        onChange(formatted);
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    },
    [onChange]
  );

  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (value) {
          onConfirm(value);
          setIsOpen(false);
        } else {
          // Try parsing from input text
          const parsed = tryParseInput(inputText);
          if (parsed) {
            const formatted = formatDate(parsed);
            onConfirm(formatted);
            setIsOpen(false);
          } else if (inputText.startsWith('now')) {
            // Pass through Elasticsearch date math expressions
            onConfirm(inputText);
            setIsOpen(false);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
        } else {
          onCancel();
        }
      }
    },
    [value, inputText, isOpen, onConfirm, onCancel]
  );

  // Close calendar when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Group presets
  const recentPresets = DATE_PRESETS.filter((p) => p.category === 'recent');
  const calendarPresets = DATE_PRESETS.filter((p) => p.category === 'calendar');
  const relativePresets = DATE_PRESETS.filter((p) => p.category === 'relative');

  return (
    <div className={styles.datePicker} ref={containerRef}>
      <div className={styles.dateInputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.dateInput}
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder="Pick a date…"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.dateCalendarBtn}
          onClick={toggleCalendar}
          title="Open calendar"
          tabIndex={-1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={styles.calendarPopover}>
          {/* Tabs */}
          <div className={styles.dateTabs}>
            <button
              type="button"
              className={`${styles.dateTab} ${activeTab === 'quick' ? styles.dateTabActive : ''}`}
              onClick={() => setActiveTab('quick')}
              tabIndex={-1}
            >
              ⚡ Quick Select
            </button>
            <button
              type="button"
              className={`${styles.dateTab} ${activeTab === 'calendar' ? styles.dateTabActive : ''}`}
              onClick={() => setActiveTab('calendar')}
              tabIndex={-1}
            >
              📅 Calendar
            </button>
          </div>

          <div className={styles.dateTabContent}>
            {activeTab === 'quick' && (
              <div className={styles.presetsContainer}>
                {recentPresets.length > 0 && (
                  <div className={styles.presetCategory}>
                    <span className={styles.presetCategoryTitle}>Recent</span>
                    <div className={styles.presetGrid}>
                      {recentPresets.map((p) => (
                        <button key={p.id} type="button" className={styles.presetBtn} onClick={() => handlePresetClick(p)}>
                          <span className={styles.presetIcon}>{p.icon}</span>
                          <div>
                            <span className={styles.presetLabel}>{p.label}</span>
                            <span className={styles.presetDesc}>{p.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {calendarPresets.length > 0 && (
                  <div className={styles.presetCategory}>
                    <span className={styles.presetCategoryTitle}>Calendar Periods</span>
                    <div className={styles.presetGrid}>
                      {calendarPresets.map((p) => (
                        <button key={p.id} type="button" className={styles.presetBtn} onClick={() => handlePresetClick(p)}>
                          <span className={styles.presetIcon}>{p.icon}</span>
                          <div>
                            <span className={styles.presetLabel}>{p.label}</span>
                            <span className={styles.presetDesc}>{p.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {relativePresets.length > 0 && (
                  <div className={styles.presetCategory}>
                    <span className={styles.presetCategoryTitle}>Relative</span>
                    <div className={styles.presetGrid}>
                      {relativePresets.map((p) => (
                        <button key={p.id} type="button" className={styles.presetBtn} onClick={() => handlePresetClick(p)}>
                          <span className={styles.presetIcon}>{p.icon}</span>
                          <div>
                            <span className={styles.presetLabel}>{p.label}</span>
                            <span className={styles.presetDesc}>{p.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calendar' && (
              <>
                {/* Calendar header */}
                <div className={styles.calendarHeader}>
                  <button
                    type="button"
                    className={styles.calendarNavBtn}
                    onClick={() => navigateYear(-1)}
                    title="Previous year"
                    tabIndex={-1}
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className={styles.calendarNavBtn}
                    onClick={() => navigateMonth(-1)}
                    title="Previous month"
                    tabIndex={-1}
                  >
                    ‹
                  </button>
                  <span className={styles.calendarTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    className={styles.calendarNavBtn}
                    onClick={() => navigateMonth(1)}
                    title="Next month"
                    tabIndex={-1}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className={styles.calendarNavBtn}
                    onClick={() => navigateYear(1)}
                    title="Next year"
                    tabIndex={-1}
                  >
                    »
                  </button>
                </div>

                {/* Day names */}
                <div className={styles.calendarDayNames}>
                  {DAY_NAMES.map((name) => (
                    <span key={name} className={styles.calendarDayName}>
                      {name}
                    </span>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className={styles.calendarGrid}>
                  {calendarDays.map((day, i) => {
                    if (!day) {
                      return <span key={`empty-${i}`} className={styles.calendarDayEmpty} />;
                    }

                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                    return (
                      <button
                        key={day.getTime()}
                        type="button"
                        className={[
                          styles.calendarDay,
                          isToday ? styles.calendarDayToday : '',
                          isSelected ? styles.calendarDaySelected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => handleDayClick(day)}
                        tabIndex={-1}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className={styles.calendarFooter}>
                  <button
                    type="button"
                    className={styles.calendarTodayBtn}
                    onClick={handleTodayClick}
                    tabIndex={-1}
                  >
                    Today
                  </button>
                  {value && (
                    <span className={styles.calendarSelected}>
                      {formatDisplayDate(value)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Helper: try to parse flexible date input ----

function tryParseInput(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // yyyy-mm-dd
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
  }

  // mm/dd/yyyy
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return new Date(+usMatch[3], +usMatch[1] - 1, +usMatch[2]);
  }

  // dd.mm.yyyy
  const euMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (euMatch) {
    return new Date(+euMatch[3], +euMatch[2] - 1, +euMatch[1]);
  }

  // Try native Date.parse as fallback (e.g., "Jan 5, 2025", "May 6 2026")
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    // Sanity check: year between 1900 and 2100
    if (d.getFullYear() >= 1900 && d.getFullYear() <= 2100) {
      return d;
    }
  }

  return null;
}
