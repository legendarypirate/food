export const UB_TIMEZONE = 'Asia/Ulaanbaatar';

/** YYYY-MM-DD in Ulaanbaatar. */
export function formatUbDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addCalendarDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Relative Mongolian label for a YYYY-MM-DD date. */
export function formatUbRelativeDate(dateStr?: string | null, timeStr?: string | null) {
  if (!dateStr) return '';

  const todayStr = formatUbDate(new Date());
  const tomorrowStr = addCalendarDays(todayStr, 1);

  let datePart: string;
  if (dateStr === todayStr) {
    datePart = 'Өнөөдөр';
  } else if (dateStr === tomorrowStr) {
    datePart = 'Маргааш';
  } else {
    const [, month, day] = dateStr.split('-').map(Number);
    datePart = `${month}-р сарын ${day}`;
  }

  return timeStr ? `${datePart} ${timeStr}` : datePart;
}
