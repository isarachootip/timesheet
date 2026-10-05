import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PersonalNote } from '../types';

export function usePersonalNotes(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['personal-notes', userId];

  const query = useQuery<PersonalNote[]>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch('/api/notes', {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to fetch personal notes');
      return res.json();
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (note: Partial<PersonalNote> & { title: string; noteDate: string }) => {
      if (!userId) throw new Error('User not logged in');
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ ...note, userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save note');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!userId) throw new Error('User not logged in');
      const res = await fetch(`/api/notes/${noteId}/toggle`, {
        method: 'PATCH',
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to toggle note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!userId) throw new Error('User not logged in');
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to delete note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notes: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveNote: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    toggleNote: toggleMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
  };
}
