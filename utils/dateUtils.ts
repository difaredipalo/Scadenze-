/**
 * Formatta qualsiasi stringa o istanza Date nel formato italiano obbligatorio gg/mm/aaaa (DD/MM/YYYY)
 * Es: "2025-05-14" -> "14/05/2025"
 * Es: "2025-05-14T08:30:00.000Z" -> "14/05/2025"
 * Es: "14/05/2025" -> "14/05/2025"
 */
export function formatDateItalian(value?: string | Date | null, fallback = ''): string {
  if (!value) return fallback;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return fallback;
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '-' || trimmed === 'N.D.' || trimmed === 'null' || trimmed === 'undefined') {
    return fallback;
  }

  // Se è già nel formato gg/mm/aaaa o g/m/aaaa
  const itMatch = trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (itMatch) {
    const day = itMatch[1].padStart(2, '0');
    const month = itMatch[2].padStart(2, '0');
    const year = itMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Se è in formato ISO aaaa-mm-gg
  const isoMatch = trimmed.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Fallback con Date constructor
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}
