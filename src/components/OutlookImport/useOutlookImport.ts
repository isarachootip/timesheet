import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TaskPriority } from '../../types';
import type {
  OutlookCalendarEvent,
  OutlookConnectionStatus,
  OutlookImportItemPayload,
  OutlookImportResponse,
} from '../../types/outlook';

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  };
}

interface UseOutlookImportOptions {
  currentUserId: string;
  defaultProjectId: string;
  returnPath: string;
  isOpen: boolean;
}

export function useOutlookImport({
  currentUserId,
  defaultProjectId,
  returnPath,
  isOpen,
}: UseOutlookImportOptions) {
  const queryClient = useQueryClient();
  const defaultDates = getDefaultDateRange();

  const [status, setStatus] = useState<OutlookConnectionStatus>({
    connected: false,
    msEmail: null,
    configured: false,
  });
  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);
  const [events, setEvents] = useState<OutlookCalendarEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoursOverrides, setHoursOverrides] = useState<Record<string, number>>({});
  const [projectId, setProjectId] = useState<string>(defaultProjectId);
  const [assigneeId, setAssigneeId] = useState<string>(currentUserId);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [issueType, setIssueType] = useState<'Bug' | 'Story' | 'Task' | 'Sub-task'>('Task');
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (defaultProjectId && defaultProjectId !== 'all') {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/outlook/status', {
        headers: { 'X-User-Id': currentUserId },
      });
      if (res.ok) {
        const data = (await res.json()) as OutlookConnectionStatus;
        setStatus(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to check Outlook status:', err);
    }
    return null;
  }, [currentUserId]);

  const fetchEvents = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoadingEvents(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/outlook/events?${params.toString()}`, {
        headers: { 'X-User-Id': currentUserId },
      });
      const data = (await res.json()) as { events?: OutlookCalendarEvent[]; error?: string };
      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถดึงข้อมูลปฏิทินจาก Outlook ได้');
        setEvents([]);
        return;
      }
      const list = data.events || [];
      setEvents(list);
      const initialHours: Record<string, number> = {};
      list.forEach(evt => {
        initialHours[evt.outlookEventId] = evt.estimatedHours;
      });
      setHoursOverrides(initialHours);
      setSelectedIds(list.filter(e => !e.existingTaskId).map(e => e.outlookEventId));
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoadingEvents(false);
    }
  }, [currentUserId, startDate, endDate]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchStatus().then(st => {
      if (st?.connected) {
        void fetchEvents();
      }
    });
  }, [isOpen, fetchStatus, fetchEvents]);

  const handleConnect = () => {
    const origin = window.location.origin;
    const params = new URLSearchParams({ origin, userId: currentUserId, returnPath });
    window.location.href = `/api/auth/microsoft?${params.toString()}`;
  };

  const handleDisconnect = async () => {
    await fetch('/api/outlook/disconnect', {
      method: 'POST',
      headers: { 'X-User-Id': currentUserId },
    });
    setStatus(prev => ({ ...prev, connected: false, msEmail: null }));
    setEvents([]);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const setEventHours = (id: string, hours: number) => {
    setHoursOverrides(prev => ({ ...prev, [id]: hours }));
  };

  const submitImport = async (): Promise<boolean> => {
    if (!projectId || projectId === 'all') {
      setErrorMessage('กรุณาเลือกโปรเจกต์ปลายทาง (Target Project)');
      return false;
    }
    const chosenEvents = events.filter(e => selectedIds.includes(e.outlookEventId));
    if (chosenEvents.length === 0) {
      setErrorMessage('กรุณาติ๊กเลือกรายการนัดหมายอย่างน้อย 1 รายการ');
      return false;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const items: OutlookImportItemPayload[] = chosenEvents.map(evt => ({
        outlookEventId: evt.outlookEventId,
        projectId,
        assigneeId: assigneeId || currentUserId,
        title: evt.title,
        description: evt.description,
        status: 'To Do',
        priority,
        estimatedHours: hoursOverrides[evt.outlookEventId] ?? evt.estimatedHours,
        startDate: evt.startDate,
        endDate: evt.endDate,
        issueType,
      }));

      const res = await fetch('/api/outlook/import-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId },
        body: JSON.stringify({ items }),
      });
      const result = (await res.json()) as OutlookImportResponse;
      if (!res.ok) {
        setErrorMessage(result.error || 'Import failed');
        return false;
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSuccessMessage(`สำเร็จ! สร้าง Task ใหม่ ${result.createdCount} รายการ และ Sync อัปเดต ${result.syncedCount} รายการ`);
      await fetchEvents();
      return true;
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดขณะบันทึก Task');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    status, startDate, setStartDate, endDate, setEndDate,
    events, selectedIds, setSelectedIds, hoursOverrides, setEventHours,
    projectId, setProjectId, assigneeId, setAssigneeId,
    priority, setPriority, issueType, setIssueType,
    loadingEvents, submitting, errorMessage, successMessage,
    fetchEvents, handleConnect, handleDisconnect, toggleSelect, submitImport,
  };
}
