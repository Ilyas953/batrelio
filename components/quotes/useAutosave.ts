"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "saved" | "unsaved" | "saving" | "error";

export const AUTOSAVE_LABELS: Record<AutosaveStatus, string> = {
  saved: "Enregistré automatiquement ✓",
  unsaved: "Modifications en cours…",
  saving: "Enregistrement…",
  error: "Pas encore enregistré",
};

// Saves a draft a moment after the artisan stops typing: no button to forget, nothing lost when
// a tab is touched. snapshot: the draft as text, to know when it changed. save: true once saved.
// Leaving the page while a change is not saved yet asks for confirmation.
export function useAutosave(snapshot: string, save: () => Promise<boolean>, { enabled = true, delayMs = 1200 } = {}): AutosaveStatus {
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (!enabled || snapshot === savedSnapshot) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      const ok = await saveRef.current();
      setIsSaving(false);
      setFailed(!ok);
      if (ok) setSavedSnapshot(snapshot);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [snapshot, savedSnapshot, enabled, delayMs]);

  const status: AutosaveStatus = isSaving ? "saving" : snapshot === savedSnapshot ? "saved" : failed ? "error" : "unsaved";

  useEffect(() => {
    if (!enabled || status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled, status]);

  return status;
}

// The action bar of an editor sits above the bottom tab bar on phones, and at the bottom elsewhere.
export const EDITOR_BAR_CLASSES =
  "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-stone-200 bg-white/95 p-3 backdrop-blur sm:bottom-0 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]";
