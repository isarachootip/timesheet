import { useCallback, useEffect, useState } from 'react';
import { toast } from '../ui/ToastProvider';
import type { Baseline, CompareData } from './planUtils';

export const useProjectBaselines = (selectedProjectId: string, onActivatedRefresh?: () => void) => {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [activeBaselineId, setActiveBaselineId] = useState('');
  const [compareBaselineId, setCompareBaselineId] = useState('');
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [activatingBaseline, setActivatingBaseline] = useState(false);

  const isSingleProject = !!selectedProjectId && selectedProjectId !== 'all';

  const fetchBaselines = useCallback(async () => {
    if (!isSingleProject) {
      setBaselines([]);
      setActiveBaselineId('');
      setCompareBaselineId('');
      setCompareData(null);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/baselines`);
      if (!res.ok) return;
      const data: Baseline[] = await res.json();
      setBaselines(data);
      const active = data.find((b) => b.isActive) || data[0];
      if (active) {
        setActiveBaselineId(active.id);
        setCompareBaselineId('live');
      } else {
        setActiveBaselineId('');
        setCompareBaselineId('');
        setCompareData(null);
      }
    } catch (err) {
      console.error('Failed to fetch baselines:', err);
    }
  }, [isSingleProject, selectedProjectId]);

  useEffect(() => {
    fetchBaselines();
  }, [fetchBaselines]);

  useEffect(() => {
    if (!isSingleProject || !activeBaselineId || !compareBaselineId) {
      setCompareData(null);
      return;
    }
    let active = true;
    setLoadingCompare(true);
    fetch(`/api/projects/${selectedProjectId}/baselines/compare?baseId=${activeBaselineId}&compareId=${compareBaselineId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CompareData | null) => {
        if (active && data) setCompareData(data);
      })
      .catch((err) => console.error('Failed to compare baselines:', err))
      .finally(() => {
        if (active) setLoadingCompare(false);
      });
    return () => {
      active = false;
    };
  }, [isSingleProject, selectedProjectId, activeBaselineId, compareBaselineId]);

  const activateBaseline = async (baselineId: string) => {
    if (!isSingleProject || !baselineId || activatingBaseline) return;
    setActivatingBaseline(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/baselines/${baselineId}/activate`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to activate baseline.');
        return;
      }
      toast.success('Activated baseline version.');
      await fetchBaselines();
      onActivatedRefresh?.();
    } catch {
      toast.error('Failed to activate baseline due to network error.');
    } finally {
      setActivatingBaseline(false);
    }
  };

  const saveBaseline = async (name: string, description: string, createdBy?: string): Promise<boolean> => {
    if (!isSingleProject) return false;
    setSavingBaseline(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/baselines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), createdBy }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save baseline version.');
        return false;
      }
      toast.success(`Saved baseline version "${name.trim()}".`);
      await fetchBaselines();
      return true;
    } catch {
      toast.error('Failed to save baseline due to network error.');
      return false;
    } finally {
      setSavingBaseline(false);
    }
  };

  return {
    baselines,
    activeBaselineId,
    compareBaselineId,
    setCompareBaselineId,
    compareData,
    loadingCompare,
    savingBaseline,
    activatingBaseline,
    activateBaseline,
    saveBaseline,
  };
};
