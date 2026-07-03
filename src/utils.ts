export const formatToDDMMYYYY = (dateStr?: string | Date | number | null): string => {
  if (!dateStr) return '';
  try {
    // Handle YYYY-MM-DD string directly to avoid timezone shift if possible
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = typeof dateStr === 'string' || typeof dateStr === 'number' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return typeof dateStr === 'string' ? dateStr : '';
  }
};
