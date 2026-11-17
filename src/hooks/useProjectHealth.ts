import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectHealthDetail,
  fetchProjectHealthHistory,
  fetchProjectsHealthSummary,
  triggerProjectHealthAiAnalysis,
} from '../services/projectHealthApi';
import type {
  ProjectHealthDetail,
  ProjectHealthHistoryPoint,
  ProjectHealthSummaryItem,
} from '../types/projectHealth';

export function useProjectsHealthSummary(userId: string | undefined) {
  return useQuery<ProjectHealthSummaryItem[]>({
    queryKey: ['projectsHealthSummary', userId],
    queryFn: () => fetchProjectsHealthSummary(userId || ''),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

export function useProjectHealthDetail(
  userId: string | undefined,
  projectId: string | undefined
) {
  return useQuery<ProjectHealthDetail>({
    queryKey: ['projectHealthDetail', projectId, userId],
    queryFn: () => fetchProjectHealthDetail(userId || '', projectId || ''),
    enabled: Boolean(userId && projectId),
    staleTime: 30 * 1000,
  });
}

export function useProjectHealthHistory(
  userId: string | undefined,
  projectId: string | undefined,
  limit = 30
) {
  return useQuery<ProjectHealthHistoryPoint[]>({
    queryKey: ['projectHealthHistory', projectId, limit, userId],
    queryFn: () => fetchProjectHealthHistory(userId || '', projectId || '', limit),
    enabled: Boolean(userId && projectId),
    staleTime: 60 * 1000,
  });
}

export function useAnalyzeProjectHealthMutation(
  userId: string | undefined,
  projectId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation<ProjectHealthDetail, Error, void>({
    mutationFn: () => triggerProjectHealthAiAnalysis(userId || '', projectId || ''),
    onSuccess: (updated) => {
      queryClient.setQueryData(['projectHealthDetail', projectId, userId], updated);
      queryClient.invalidateQueries({ queryKey: ['projectHealthHistory', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectsHealthSummary'] });
    },
  });
}
