import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

export function toYmd(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function monthLabel(d: Date) {
  return format(d, 'yyyy년 M월')
}

export function clampToMonthGrid(anchor: Date) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 })
  const days: Date[] = []
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    days.push(cur)
  }
  return days
}

export function isSameDayIso(aIso: string, b: Date) {
  try {
    return isSameDay(parseISO(aIso), b)
  } catch {
    return false
  }
}

export function dayBadges(d: Date, anchorMonth: Date) {
  return {
    isToday: isToday(d),
    isOutOfMonth: !isSameMonth(d, anchorMonth),
  }
}

export function prevMonth(anchor: Date) {
  return subMonths(anchor, 1)
}

export function nextMonth(anchor: Date) {
  return addMonths(anchor, 1)
}

