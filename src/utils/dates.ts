export function todayISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimestamp(value: string): number | null {
  const text = String(value ?? '').trim();
  let year: number, month: number, day: number;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[Tt\s])/);
  if (match) {
    year = Number(match[1]); month = Number(match[2]); day = Number(match[3]);
  } else {
    match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:$|\s)/);
    if (!match) return null;
    day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
  }
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null;
  return parsed.getTime();
}

export function sameCalendarDate(a: string, b: string): boolean {
  const timestampA = dateTimestamp(a);
  const timestampB = dateTimestamp(b);
  return timestampA !== null && timestampA === timestampB;
}

export function sortDatesChronologically(values: string[]): string[] {
  return values
    .map((value, index) => ({ value, index, timestamp: dateTimestamp(value) }))
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) return a.index - b.index;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return a.timestamp - b.timestamp || a.index - b.index;
    })
    .map(item => item.value);
}

export function latestDateChronologically(values: string[]): string | undefined {
  const ordered = sortDatesChronologically(values);
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (dateTimestamp(ordered[i]) !== null) return ordered[i];
  }
  return ordered[ordered.length - 1];
}
