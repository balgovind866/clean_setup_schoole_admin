import axios from 'axios'
import {
  PeriodSlotPayload,
  PeriodSlotsListResponse,
  PeriodSlotResponse,
  BulkSavePayload,
  BulkSaveResponse,
  TimetableGridResponse,
  TimetableVersionsResponse,
  PublishResponse,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

// ─── Period Slot APIs ─────────────────────────────────────────────────────────

export function getPeriodSlots(schoolId: string | number, academic_session_id: number) {
  return axios.get<PeriodSlotsListResponse>(`${API_URL}/school/${schoolId}/timetable/slots`, {
    params: { academic_session_id },
  })
}

export function createPeriodSlot(schoolId: string | number, payload: PeriodSlotPayload) {
  return axios.post<PeriodSlotResponse>(`${API_URL}/school/${schoolId}/timetable/slots`, payload)
}

export function updatePeriodSlot(
  schoolId: string | number,
  slotId: number,
  payload: Partial<PeriodSlotPayload>
) {
  return axios.put<PeriodSlotResponse>(
    `${API_URL}/school/${schoolId}/timetable/slots/${slotId}`,
    payload
  )
}

export function deletePeriodSlot(schoolId: string | number, slotId: number) {
  return axios.delete(`${API_URL}/school/${schoolId}/timetable/slots/${slotId}`)
}

// ─── Timetable Grid APIs ──────────────────────────────────────────────────────

export function getTimetableGrid(
  schoolId: string | number,
  class_section_id: number,
  academic_session_id: number
) {
  return axios.get<TimetableGridResponse>(`${API_URL}/school/${schoolId}/timetable`, {
    params: { class_section_id, academic_session_id },
  })
}

export function bulkSaveTimetable(schoolId: string | number, payload: BulkSavePayload) {
  return axios.post<BulkSaveResponse>(`${API_URL}/school/${schoolId}/timetable/bulk-save`, payload)
}

// ─── Version / Publishing APIs ────────────────────────────────────────────────

export function getTimetableVersions(
  schoolId: string | number,
  class_section_id: number,
  academic_session_id: number
) {
  return axios.get<TimetableVersionsResponse>(
    `${API_URL}/school/${schoolId}/timetable/versions`,
    { params: { class_section_id, academic_session_id } }
  )
}

export function publishTimetableVersion(schoolId: string | number, versionId: number) {
  return axios.patch<PublishResponse>(
    `${API_URL}/school/${schoolId}/timetable/versions/${versionId}/publish`
  )
}

export function unpublishTimetableVersion(schoolId: string | number, versionId: number) {
  return axios.patch<PublishResponse>(
    `${API_URL}/school/${schoolId}/timetable/versions/${versionId}/unpublish`
  )
}

// ─── Teacher by Subject API ───────────────────────────────────────────────────
// GET /api/school/:schoolId/teacher-allocations/by-subject?subject_id=X&academic_session_id=Y
export function getTeacherBySubject(
  schoolId: string | number,
  subject_id: number,
  academic_session_id: number
) {
  return axios.get<{
    success: boolean
    count: number
    data: Array<{
      teacher_id: number
      teacher_name: string
      email: string
      phone: string | null
      subject_id: number
      subject_name: string
      subject_code: string
      classes: Array<{ allocation_id: number; class_section_id: number; class: string; section: string }>
    }>
  }>(`${API_URL}/school/${schoolId}/teacher-allocations/by-subject`, {
    params: { subject_id, academic_session_id },
  })
}
