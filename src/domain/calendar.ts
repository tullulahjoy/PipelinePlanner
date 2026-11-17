/** Date-only calendar policy. All boundaries use UTC, independent of local time and DST. */
export const DAY = 86_400_000
export const WEEK = 7 * DAY
export const parseDate = (value: string) => Date.parse(`${value}T00:00:00Z`)
export const isoDate = (value: number) => new Date(value).toISOString().slice(0, 10)
export const formatDate = (value: number) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(value)
export const monday = (value: number) => value - ((new Date(value).getUTCDay() + 6) % 7) * DAY
const christmasStart = (year: number) => monday(Date.UTC(year, 11, 25))

/** Christmas breaks intersecting a date range; returned ends are exclusive. */
export function christmasBreaks(start: number, end: number) {
  const breaks: { s: number; e: number }[] = []
  for (let year = new Date(start).getUTCFullYear() - 1; year <= new Date(end).getUTCFullYear(); year++) {
    const s = Math.max(start, christmasStart(year)), e = Math.min(end, christmasStart(year) + 2 * WEEK)
    if (s < e) breaks.push({ s, e })
  }
  return breaks
}

export function isPaused(time: number) {
  const year = new Date(time).getUTCFullYear()
  return [year - 1, year].some(y => {
    const start = christmasStart(y)
    return time >= start && time < start + 2 * WEEK
  })
}
export function activeDays(start: number, end: number) {
  let result = 0
  for (let t = start; t < end; t += DAY) if (!isPaused(t)) result++
  return result
}
export function activeSpans(start: number, end: number) {
  const result: { s: number; e: number }[] = []
  for (let t = start; t < end; t += DAY) {
    if (isPaused(t)) continue
    const previous = result.at(-1)
    if (previous?.e === t) previous.e = Math.min(t + DAY, end)
    else result.push({ s: t, e: Math.min(t + DAY, end) })
  }
  return result
}
export function moveActive(time: number, days: number) {
  if (!Number.isInteger(days) || Math.abs(days) > 36_500) throw new Error('Keep this trial within 100 years.')
  let cursor = time
  let remaining = Math.abs(days)
  const direction = Math.sign(days)
  while (remaining) {
    if (direction < 0) cursor -= DAY
    if (!isPaused(cursor)) remaining--
    if (direction > 0) cursor += DAY
  }
  return cursor
}
export const distance = (a: number, b: number) => (b < a ? -1 : 1) * activeDays(Math.min(a, b), Math.max(a, b))
export function addMonths(time: number, count: number) {
  const d = new Date(time), date = d.getUTCDate()
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + count)
  d.setUTCDate(Math.min(date, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()))
  return d.getTime()
}
