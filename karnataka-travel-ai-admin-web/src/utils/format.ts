export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
export const formatDay = (day: string): string => new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const titleCase = (s: string): string => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const num = (n: number): string => n.toLocaleString('en-IN');
