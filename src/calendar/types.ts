export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  color?: string
  notes?: string
}

export const DEFAULT_COLORS = [
  '#e01e3a', // Red
  '#f59e0b', // Amber
  '#10b981', // Green
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#ec4899', // Pink
] as const
