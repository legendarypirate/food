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

/** HH:mm in Ulaanbaatar (24h). */
export function formatUbTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatUbDateLabel(date = new Date()) {
  return `Өнөөдөр ${formatUbTime(date)}`;
}

export function addCalendarDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Relative Mongolian label for a YYYY-MM-DD date (+ optional HH:mm). */
export function formatUbRelativeDate(dateStr, timeStr) {
  if (!dateStr) return null;

  const todayStr = formatUbDate(new Date());
  const tomorrowStr = addCalendarDays(todayStr, 1);

  let datePart;
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

/** Order placed-at label from ISO timestamp (UB timezone). */
export function formatOrderPlacedLabel(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const dateStr = formatUbDate(date);
  const timeStr = formatUbTime(date);
  const todayStr = formatUbDate(new Date());
  const yesterdayStr = addCalendarDays(todayStr, -1);

  if (dateStr === todayStr) return `Өнөөдөр ${timeStr}`;
  if (dateStr === yesterdayStr) return `Өчигдөр ${timeStr}`;

  const [, month, day] = dateStr.split('-');
  return `${month}/${day} ${timeStr}`;
}
