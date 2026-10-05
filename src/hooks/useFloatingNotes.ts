import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_OPEN = 'nextime_floating_note_open';
const STORAGE_KEY_NOTE_ID = 'nextime_floating_note_id';

export function useFloatingNotes(availableNoteIds: string[] = []) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_OPEN) === 'true';
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_NOTE_ID) || null;
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Sync with available note IDs
  useEffect(() => {
    if (availableNoteIds.length > 0) {
      if (!activeNoteId || !availableNoteIds.includes(activeNoteId)) {
        setActiveNoteId(availableNoteIds[0]);
      }
    } else {
      setActiveNoteId(null);
    }
  }, [availableNoteIds, activeNoteId]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OPEN, String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem(STORAGE_KEY_NOTE_ID, activeNoteId);
    }
  }, [activeNoteId]);

  // Listen to custom event for opening a specific note
  useEffect(() => {
    const handleOpenNoteEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ noteId: string }>;
      if (customEvent.detail?.noteId) {
        setActiveNoteId(customEvent.detail.noteId);
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('open-floating-note', handleOpenNoteEvent);
    return () => window.removeEventListener('open-floating-note', handleOpenNoteEvent);
  }, []);

  const openNote = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeNote = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return {
    isOpen,
    isMinimized,
    activeNoteId,
    setActiveNoteId,
    openNote,
    closeNote,
    toggleOpen,
    toggleMinimize,
  };
}
