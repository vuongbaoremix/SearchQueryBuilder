// ============================================================
// useAutocomplete — Phase-driven autocomplete with debounce
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { KeyConfig, Suggestion, Operator } from '../core/types';
import type { InputPhase } from './useQueryBuilder';
import { OPERATORS, LOGICAL_OPERATORS, DEBOUNCE_MS } from '../core/constants';
import { OPERATOR_LABELS } from '../core/constants';

export interface UseAutocompleteReturn {
  suggestions: Suggestion[];
  isLoading: boolean;
  selectedIndex: number;
  isOpen: boolean;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number) => void;
  getSelected: () => Suggestion | null;
  update: (params: AutocompleteParams) => void;
  close: () => void;
  forceOpen: () => void;
}

export interface AutocompleteParams {
  phase: InputPhase;
  inputText: string;
  /** Current key (for value/operator suggestions) */
  currentKey?: string | null;
  currentKeyConfig?: KeyConfig | null;
  keyConfigs: KeyConfig[];
  /** Number of unclosed open parentheses (for close-paren suggestion) */
  openParenCount?: number;
  /** Keys already present in the current query (for disabledWhenKeysPresent filtering) */
  activeKeys?: string[];
}

export function useAutocomplete(): UseAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const update = useCallback((params: AutocompleteParams) => {
    const { phase, inputText, currentKey, currentKeyConfig, keyConfigs } = params;

    // Cancel pending
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsLoading(false);

    // ---- KEY phase ----
    if (phase === 'key') {
      const partial = inputText.toLowerCase();
      const activeSet = new Set((params.activeKeys ?? []).map(k => k.toLowerCase()));

      const filtered = keyConfigs
        .filter((k) => {
          // Filter by text match
          const textMatch =
            k.key.toLowerCase().includes(partial) ||
            k.label.toLowerCase().includes(partial);
          if (!textMatch) return false;

          // Filter by disabledWhenKeysPresent
          if (k.disabledWhenKeysPresent?.length) {
            const isDisabled = k.disabledWhenKeysPresent.some(
              (dk) => activeSet.has(dk.toLowerCase()),
            );
            if (isDisabled) return false;
          }

          return true;
        })
        .map((k) => ({
          value: k.key,
          label: `${k.icon || ''} ${k.label}`.trim(),
          description: k.description,
        }));

      // Add '(' group suggestion at the start when no text or '(' matches
      if (!partial || '('.includes(partial) || 'group'.includes(partial)) {
        filtered.unshift({
          value: '(',
          label: '( Start group',
          description: 'Group conditions with parentheses',
        });
      }

      setSuggestions(filtered);
      setSelectedIndex(partial ? 0 : 1); // default select first field, not '('
      setIsOpen(filtered.length > 0);
      return;
    }

    // ---- OPERATOR phase ----
    if (phase === 'operator') {
      const keyConfig = currentKeyConfig ||
        keyConfigs.find((k) => k.key.toLowerCase() === currentKey?.toLowerCase());
      const allowed = keyConfig?.allowedOperators || ['=', '!='];
      // For range types, show all operators
      const ops: Operator[] = (keyConfig?.queryType === 'range')
        ? OPERATORS
        : allowed;

      const items = ops.map((op) => ({
        value: op,
        label: op,
        description: OPERATOR_LABELS[op] || op,
      }));
      setSuggestions(items);
      setSelectedIndex(0);
      setIsOpen(true);
      return;
    }

    // ---- VALUE phase ----
    if (phase === 'value') {
      const keyConfig = currentKeyConfig ||
        keyConfigs.find((k) => k.key.toLowerCase() === currentKey?.toLowerCase());

      if (!keyConfig) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Static suggestions
      if (keyConfig.staticSuggestions) {
        const partial = inputText.toLowerCase();
        const filtered = keyConfig.staticSuggestions.filter(
          (s) =>
            s.value.toLowerCase().includes(partial) ||
            s.label.toLowerCase().includes(partial)
        );
        setSuggestions(filtered);
        setSelectedIndex(0);
        setIsOpen(filtered.length > 0);
        return;
      }

      // Boolean default suggestions
      if (keyConfig.valueType === 'boolean') {
        const partial = inputText.toLowerCase();
        const boolSuggestions = [
          { value: 'true', label: 'True', description: 'Boolean true' },
          { value: 'false', label: 'False', description: 'Boolean false' }
        ];
        const filtered = boolSuggestions.filter(
          (s) =>
            s.value.toLowerCase().includes(partial) ||
            s.label.toLowerCase().includes(partial)
        );
        setSuggestions(filtered);
        setSelectedIndex(0);
        setIsOpen(filtered.length > 0);
        return;
      }

      // Async suggestions
      if (keyConfig.suggestionsProvider) {
        setIsLoading(true);
        setIsOpen(true);
        const controller = new AbortController();
        abortRef.current = controller;

        debounceRef.current = setTimeout(async () => {
          try {
            const results = await keyConfig.suggestionsProvider!(
              inputText,
              controller.signal
            );
            if (!controller.signal.aborted) {
              setSuggestions(results);
              setSelectedIndex(0);
              setIsOpen(results.length > 0);
              setIsLoading(false);
            }
          } catch {
            if (!controller.signal.aborted) {
              setSuggestions([]);
              setIsOpen(false);
              setIsLoading(false);
            }
          }
        }, DEBOUNCE_MS);
        return;
      }

      // No suggestions available
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // ---- LOGICAL phase ----
    if (phase === 'logical') {
      const items: Suggestion[] = LOGICAL_OPERATORS.map((op) => ({
        value: op,
        label: op,
        description: op === 'AND' ? 'All conditions must match' : 'Any condition can match',
      }));

      // Add ')' close group suggestion when there are unclosed parens
      const openCount = params.openParenCount ?? 0;
      if (openCount > 0) {
        items.push({
          value: ')',
          label: ') Close group',
          description: `Close group (${openCount} open)`,
        });
      }

      setSuggestions(items);
      setSelectedIndex(0);
      setIsOpen(true);
      return;
    }

    setSuggestions([]);
    setIsOpen(false);
  }, []);

  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        const len = suggestions.length;
        if (len === 0) return 0;
        return (prev + delta + len) % len;
      });
    },
    [suggestions.length]
  );

  const getSelected = useCallback((): Suggestion | null => {
    if (suggestions.length === 0) return null;
    return suggestions[selectedIndex] ?? null;
  }, [suggestions, selectedIndex]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const forceOpen = useCallback(() => {
    if (suggestions.length > 0) setIsOpen(true);
  }, [suggestions.length]);

  return {
    suggestions,
    isLoading,
    selectedIndex,
    isOpen,
    setSelectedIndex,
    moveSelection,
    getSelected,
    update,
    close,
    forceOpen,
  };
}
