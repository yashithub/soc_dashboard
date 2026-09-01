export const HOUR_MS = 3600_000

/**
 * Snaps a timestamp down to the top of its hour **in the viewer's timezone**.
 *
 * `Math.floor(ms / HOUR_MS)` would snap to UTC hours, which lands mid-hour for
 * any timezone with a half-hour offset (IST, ACST, NST) and mislabels every
 * point on the activity chart. Both the dataset generator and the chart
 * bucketing use this so the two always agree.
 */
export function floorToHour(ms) {
  const date = new Date(ms)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}
