import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  options: UseKeyboardShortcutOptions,
  callback: (event: KeyboardEvent) => void,
  dependencies: ReadonlyArray<unknown> = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        key,
        ctrlKey = false,
        metaKey = false,
        shiftKey = false,
        altKey = false,
        preventDefault = true,
      } = options;

      // Check if the key combination matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = event.ctrlKey === ctrlKey;
      const metaMatches = event.metaKey === metaKey;
      const shiftMatches = event.shiftKey === shiftKey;
      const altMatches = event.altKey === altKey;

      // For cross-platform compatibility, check both Ctrl and Meta for Cmd+K
      const cmdOrCtrlMatches = (ctrlKey || metaKey) && (event.ctrlKey || event.metaKey);

      if (keyMatches && (cmdOrCtrlMatches || (ctrlMatches && metaMatches)) && shiftMatches && altMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options, callback, ...dependencies]);
}

// Specific hook for search shortcut (Cmd/Ctrl + K)
export function useSearchShortcut(callback: () => void, dependencies: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K on Mac or Ctrl+K on Windows/Linux
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        // Don't trigger if user is typing in an input field
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );

        if (!isInputFocused) {
          event.preventDefault();
          callback();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, ...dependencies]);
}
