const EXPLICIT_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/;

function daysInMonth(year, month) {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseWritingFeedRefreshedAt(feed) {
  const value = feed?.refreshedAt;
  const match = typeof value === "string" ? value.match(EXPLICIT_TIMESTAMP_PATTERN) : null;

  if (match) {
    const [, year, month, day, hour, minute, second, zone, offsetHour, offsetMinute] = match;
    const componentsAreValid = (
      Number(month) >= 1
      && Number(month) <= 12
      && Number(day) >= 1
      && Number(day) <= daysInMonth(Number(year), Number(month))
      && Number(hour) <= 23
      && Number(minute) <= 59
      && Number(second) <= 59
      && (
        zone === "Z"
        || (Number(offsetHour) <= 23 && Number(offsetMinute) <= 59)
      )
    );
    const timestamp = componentsAreValid ? Date.parse(value) : Number.NaN;
    if (Number.isFinite(timestamp)) return new Date(timestamp);
  }

  throw new Error(
    "writing-feed.json refreshedAt must be a valid ISO 8601 timestamp with an explicit timezone.",
  );
}
