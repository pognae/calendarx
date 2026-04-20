export type CalendarEvent = {
  id: string
  title: string
  start: string // ISO string
  end: string // ISO string
  allDay: boolean
  color?: string
  notes?: string
}

export type CalendarView = 'month'

