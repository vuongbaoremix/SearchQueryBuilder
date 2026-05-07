// ============================================================
// Relative Date Expressions (Elasticsearch Date Math)
// ============================================================

export interface DatePreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Value for single-bound presets (e.g., >= now-1h) */
  value: string;
  /** If true, this creates a range (2 tokens): gte=rangeStart, lte=rangeEnd */
  isRange?: boolean;
  rangeStart?: string;
  rangeEnd?: string;
  /** Category for grouping in UI */
  category: 'recent' | 'calendar' | 'relative';
}

export const DATE_PRESETS: DatePreset[] = [
  // ---- Recent ----
  {
    id: 'last_1h',
    label: 'Last 1 hour',
    icon: '⏱️',
    description: 'Past 60 minutes',
    value: 'now-1h',
    category: 'recent',
  },
  {
    id: 'last_24h',
    label: 'Last 24 hours',
    icon: '⏳',
    description: 'Past 24 hours',
    value: 'now-24h',
    category: 'recent',
  },
  
  // ---- Calendar periods ----
  {
    id: 'today',
    label: 'Today',
    icon: '📅',
    description: 'From midnight today',
    value: 'now/d',
    isRange: true,
    rangeStart: 'now/d',
    rangeEnd: 'now/d+1d',
    category: 'calendar',
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    icon: '🔙',
    description: 'Previous day',
    value: 'now-1d/d',
    isRange: true,
    rangeStart: 'now-1d/d',
    rangeEnd: 'now/d',
    category: 'calendar',
  },
  {
    id: 'this_week',
    label: 'This week',
    icon: '📅',
    description: 'From start of this week',
    value: 'now/w',
    isRange: true,
    rangeStart: 'now/w',
    rangeEnd: 'now',
    category: 'calendar',
  },
  {
    id: 'this_month',
    label: 'This month',
    icon: '📆',
    description: 'From start of this month',
    value: 'now/M',
    isRange: true,
    rangeStart: 'now/M',
    rangeEnd: 'now',
    category: 'calendar',
  },
  {
    id: 'this_year',
    label: 'This year',
    icon: '🗓️',
    description: 'From start of this year',
    value: 'now/y',
    isRange: true,
    rangeStart: 'now/y',
    rangeEnd: 'now',
    category: 'calendar',
  },

  // ---- Relative days ----
  {
    id: 'last_7d',
    label: 'Last 7 days',
    icon: '📉',
    description: 'Past 7 days',
    value: 'now-7d',
    category: 'relative',
  },
  {
    id: 'last_30d',
    label: 'Last 30 days',
    icon: '📉',
    description: 'Past 30 days',
    value: 'now-30d',
    category: 'relative',
  },
  {
    id: 'last_90d',
    label: 'Last 90 days',
    icon: '📉',
    description: 'Past 90 days',
    value: 'now-90d',
    category: 'relative',
  },
];

/**
 * Check if a value is an Elasticsearch relative date expression (e.g., now-1h, now/d)
 */
export function isRelativeDateExpression(value: string): boolean {
  if (!value) return false;
  return value.startsWith('now');
}

/**
 * Convert relative date expression to a friendly display string (e.g., now-1h -> 1 hour ago)
 */
export function formatRelativeDateDisplay(value: string): string {
  if (!isRelativeDateExpression(value)) return value;

  // Check if it exactly matches a preset value (or range start/end)
  const preset = DATE_PRESETS.find(p => p.value === value || p.rangeStart === value || p.rangeEnd === value);
  if (preset) {
    if (value === preset.rangeStart) return `Start of ${preset.label.toLowerCase()}`;
    if (value === preset.rangeEnd) return `End of ${preset.label.toLowerCase()}`;
    if (value === 'now') return 'Now';
    return preset.label;
  }

  // Fallback heuristic parsing for generic ES date math
  const match = value.match(/^now([+-])(\d+)([yMwdhms])(\/[yMwdhms])?$/);
  if (match) {
    const [, sign, num, unit, round] = match;
    const unitMap: Record<string, string> = {
      y: 'year', M: 'month', w: 'week', d: 'day', h: 'hour', m: 'minute', s: 'second'
    };
    const unitStr = unitMap[unit] || unit;
    const isPlural = parseInt(num, 10) > 1;
    const unitDisplay = isPlural ? `${unitStr}s` : unitStr;
    
    let base = sign === '-' ? `${num} ${unitDisplay} ago` : `in ${num} ${unitDisplay}`;
    
    if (round) {
      base += ` (rounded to ${unitMap[round.replace('/', '')]})`;
    }
    return base;
  }
  
  if (value.startsWith('now/')) {
     const roundUnit = value.split('/')[1];
     const unitMap: Record<string, string> = {
        y: 'year', M: 'month', w: 'week', d: 'day', h: 'hour', m: 'minute', s: 'second'
      };
     return `Start of ${unitMap[roundUnit] || roundUnit}`;
  }

  return value; // Return as-is if unparseable
}

/**
 * Resolves a relative date expression to an absolute Date object for external systems (like Mongo).
 * Basic implementation for common cases.
 */
export function resolveRelativeDate(value: string): Date {
  if (!isRelativeDateExpression(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  const date = new Date();
  
  if (value === 'now') return date;

  const match = value.match(/^now([+-])(\d+)([yMwdhms])/);
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const amount = parseInt(match[2], 10) * sign;
    const unit = match[3];

    switch (unit) {
      case 'y': date.setFullYear(date.getFullYear() + amount); break;
      case 'M': date.setMonth(date.getMonth() + amount); break;
      case 'w': date.setDate(date.getDate() + amount * 7); break;
      case 'd': date.setDate(date.getDate() + amount); break;
      case 'h': date.setHours(date.getHours() + amount); break;
      case 'm': date.setMinutes(date.getMinutes() + amount); break;
      case 's': date.setSeconds(date.getSeconds() + amount); break;
    }
  }

  // Handle rounding
  if (value.includes('/')) {
    const roundUnit = value.split('/')[1];
    switch (roundUnit) {
      case 'y':
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'M':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'w':
        // JS getDay(): 0 is Sunday, ES starts week on Monday usually, but assuming Sun-Sat here
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        break;
      case 'd':
        date.setHours(0, 0, 0, 0);
        break;
    }
  }

  return date;
}
