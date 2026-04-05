// ─── Period Slot Models ─────────────────────────────────────────────────────

export interface PeriodSlot {
  id: number
  name: string
  start_time: string
  end_time: string
  is_break: boolean
  sort_order: number
  academic_session_id: number
  createdAt?: string
  updatedAt?: string
}

export interface PeriodSlotPayload {
  name: string
  start_time: string
  end_time: string
  is_break?: boolean
  sort_order: number
  academic_session_id: number
}

export interface PeriodSlotsListResponse {
  success: boolean
  count: number
  data: PeriodSlot[]
}

export interface PeriodSlotResponse {
  success: boolean
  data: PeriodSlot
}

// ─── Timetable Entry Models ──────────────────────────────────────────────────

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface TimetableEntry {
  id: number
  period_slot_id: number
  period: string
  start_time: string
  end_time: string
  is_break: boolean
  subject_id: number | null
  subject: string | null
  subject_code: string | null
  teacher_id: number | null
  teacher: string | null
  room_no: string | null
  class_section_id: number
}

export interface TimetableGrid {
  MONDAY: TimetableEntry[]
  TUESDAY: TimetableEntry[]
  WEDNESDAY: TimetableEntry[]
  THURSDAY: TimetableEntry[]
  FRIDAY: TimetableEntry[]
  SATURDAY: TimetableEntry[]
  SUNDAY: TimetableEntry[]
}

export interface TimetableGridResponse {
  success: boolean
  data: TimetableGrid
}

// ─── Bulk Save Payload ───────────────────────────────────────────────────────

export interface BulkSaveEntry {
  day_of_week: DayOfWeek
  period_slot_id: number
  subject_id: number | null
  teacher_id: number | null
  room_no: string | null
}

export interface BulkSavePayload {
  class_section_id: number
  academic_session_id: number
  effective_from: string
  entries: BulkSaveEntry[]
}

export interface BulkSaveResponse {
  success: boolean
  message: string
  data: { version_id: number }
}

// ─── Version Models ──────────────────────────────────────────────────────────

export interface TimetableVersion {
  id: number
  class_section_id: number
  academic_session_id: number
  effective_from: string
  is_active: boolean
  published_at: string | null
  published_by: number | null
  createdAt: string
  updatedAt: string
}

export interface TimetableVersionsResponse {
  success: boolean
  count: number
  data: TimetableVersion[]
}

export interface PublishResponse {
  success: boolean
  message: string
  data?: { version_id: number; published_at: string }
}
