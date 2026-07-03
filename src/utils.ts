export const formatToYYMMDD = (dateStr?: string | Date | number | null): string => {
  if (!dateStr) return '';
  try {
    // Handle YYYY-MM-DD string directly to avoid timezone shift if possible
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      return `${parts[0].slice(-2)}${parts[1]}${parts[2]}`;
    }
    const d = typeof dateStr === 'string' || typeof dateStr === 'number' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  } catch (e) {
    return typeof dateStr === 'string' ? dateStr : '';
  }
};
