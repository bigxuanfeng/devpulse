"use client";

import { useEffect, useRef } from "react";

interface Options {
  key: string;
  callback: (e: KeyboardEvent) => void;
  modifier?: "ctrl" | "meta" | "shift" | "alt";
  enabled?: boolean;
}

export function useKeyboardShortcut({ key, callback, modifier, enabled = true }: Options) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modifiers: Record<string, boolean> = {
        ctrl: e.ctrlKey || e.metaKey, // 支持 Ctrl 和 Meta (Cmd)
        meta: e.metaKey || e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
      };

      const keyMatches = e.key.toLowerCase() === key.toLowerCase();
      const modifierMatches = !modifier || modifiers[modifier];

      if (keyMatches && modifierMatches) {
        e.preventDefault();
        callbackRef.current(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, modifier, enabled]);
}
