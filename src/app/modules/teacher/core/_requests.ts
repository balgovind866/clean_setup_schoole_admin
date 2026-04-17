import axios from 'axios'
import { AssignmentModel, AssignmentSubmissionModel } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

// ─── Assignments ─────────────────────────────────────────────────────────────

export function getMyAssignments(
  schoolId: string | number,
  params: { academic_session_id?: number; class_id?: number; section_id?: number; subject_id?: number; page?: number; limit?: number }
) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/assignments`, { params })
}

export function getAssignmentDetails(schoolId: string | number, assignmentId: string | number) {
  return axios.get<{ success: boolean; data: { assignment: AssignmentModel & { submissions: AssignmentSubmissionModel[] } } }>(`${API_URL}/school/${schoolId}/teacher-app/assignments/${assignmentId}`)
}

export function createAssignment(schoolId: string | number, data: FormData) {
  return axios.post(`${API_URL}/school/${schoolId}/teacher-app/assignments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateAssignment(schoolId: string | number, assignmentId: string | number, data: FormData) {
  return axios.put(`${API_URL}/school/${schoolId}/teacher-app/assignments/${assignmentId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteAssignment(schoolId: string | number, assignmentId: string | number) {
  return axios.delete(`${API_URL}/school/${schoolId}/teacher-app/assignments/${assignmentId}`)
}

export function evaluateSubmission(
  schoolId: string | number,
  submissionId: string | number,
  payload: { marks_obtained: string | number; teacher_feedback: string; status: 'EVALUATED' }
) {
  return axios.patch(`${API_URL}/school/${schoolId}/teacher-app/assignment-submissions/${submissionId}/evaluate`, payload)
}

// ─── Attendance ───────────────────────────────────────────────────────────────

/** GET teacher's assigned sections for active session */
export function getMySections(schoolId: string | number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sections`)
}

/** GET students + their attendance for a section on a specific date */
export function getSectionAttendance(
  schoolId: string | number,
  classSectionId: number,
  date: string
) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sections/${classSectionId}/attendance`, {
    params: { date }
  })
}

/** POST mark DAILY attendance for a section via teacher-app route */
export function markDailyAttendance(
  schoolId: string | number,
  classSectionId: number,
  payload: {
    date: string
    session_id?: number
    students: { student_id: number; status: string; remark?: string }[]
  }
) {
  return axios.post(
    `${API_URL}/school/${schoolId}/teacher-app/sections/${classSectionId}/attendance`,
    payload
  )
}

/** POST mark PERIOD attendance via main school route */
export function markPeriodAttendance(
  schoolId: string | number,
  payload: {
    class_section_id: number
    academic_session_id: number
    timetable_entry_id: number
    date: string
    students: { student_id: number; status: string; remark?: string }[]
  }
) {
  return axios.post(`${API_URL}/school/${schoolId}/attendance/students/mark-period`, payload)
}

/** GET section timetable (for period-wise period picker) */
export function getSectionTimetable(schoolId: string | number, classSectionId: number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sections/${classSectionId}/timetable`)
}

/** GET current active session info (includes attendance_mode) */
export function getTeacherSessions(schoolId: string | number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sessions`)
}
