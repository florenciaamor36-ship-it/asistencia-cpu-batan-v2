import { canonicalCalendarDate } from './dates';

/** Update exactly one calendar day, coalescing legacy date aliases into one canonical key. */
export function setAttendanceForDate<T>(attendance: Record<string, T> | undefined, date: string, value: T | undefined): Record<string, T> {
  const next = { ...(attendance || {}) };
  const canonical = canonicalCalendarDate(date);
  if (!canonical) {
    if (value === undefined) delete next[date]; else next[date] = value;
    return next;
  }
  for (const key of Object.keys(next)) if (canonicalCalendarDate(key) === canonical) delete next[key];
  if (value !== undefined) next[canonical] = value;
  return next;
}

export function nextMatrixAttendance(current: boolean | string | undefined): boolean | string | undefined {
  if (current === true || current === 'presente') return false;
  if (current === false || current === 'ausente') return 'justificado';
  if (current === 'justificado') return undefined;
  return true;
}
