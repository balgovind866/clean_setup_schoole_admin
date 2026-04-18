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
  return axios.get<{ success: boolean; data: { assignment: AssignmentModel & { submissions: AssignmentSubmissionModel[] } } }>(
    `${API_URL}/school/${schoolId}/teacher-app/assignments/${assignmentId}`
  )
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

// ─── Session ──────────────────────────────────────────────────────────────────

/** GET all sessions — response: { success, data: [...sessions with attendance_mode] } */
export function getTeacherSessions(schoolId: string | number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sessions`)
}

// ─── Sections (used in DAILY mode) ───────────────────────────────────────────

/** GET teacher's assigned sections → { success, data: { sessions_id, sections: [...] } } */
export function getMySections(schoolId: string | number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sections`)
}

/** GET students + daily attendance for a section on a date
 *  → { success, data: { date, session_id, class_section_id, summary, students } }
 */
export function getSectionAttendance(schoolId: string | number, classSectionId: number, date: string) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/attendance/sections/${classSectionId}`, {
    params: { date }
  })
}

/** POST mark DAILY attendance for a section
 *  Body: { date, session_id?, students: [{student_id, status, remark?}] }
 */
export function markDailyAttendance(
  schoolId: string | number,
  classSectionId: number,
  payload: { date: string; session_id?: number; students: { student_id: number; status: string; remark?: string }[] }
) {
  return axios.post(
    `${API_URL}/school/${schoolId}/teacher-app/attendance/sections/${classSectionId}`,
    payload
  )
}

// ─── Period-wise Attendance ───────────────────────────────────────────────────

/** GET today's all periods for the teacher with attendance_marked status
 *  → { success, data: { date, day_of_week, session_id, attendance_mode, total_periods, periods: [...] } }
 */
export function getTodayPeriods(schoolId: string | number, date: string) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/attendance/today-periods`, {
    params: { date }
  })
}

/** GET students + their period attendance for a specific timetable_entry_id + date
 *  → { success, data: { date, timetable_entry_id, session_id, attendance_mode, period, subject, class_section, summary, students } }
 */
export function getPeriodStudents(schoolId: string | number, timetableEntryId: number, date: string) {
  return axios.get(
    `${API_URL}/school/${schoolId}/teacher-app/attendance/periods/${timetableEntryId}/students`,
    { params: { date } }
  )
}

/** POST mark PERIOD attendance for a specific timetable_entry_id
 *  Body: { date, students: [{student_id, status, remark?}] }
 */
export function markPeriodAttendanceByEntry(
  schoolId: string | number,
  timetableEntryId: number,
  payload: { date: string; students: { student_id: number; status: string; remark?: string }[] }
) {
  return axios.post(
    `${API_URL}/school/${schoolId}/teacher-app/attendance/periods/${timetableEntryId}/mark`,
    payload
  )
}

/** GET section timetable (all days) */
export function getSectionTimetable(schoolId: string | number, classSectionId: number) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/sections/${classSectionId}/timetable`)
}

/** @deprecated use getTodayPeriods/markPeriodAttendanceByEntry instead */
export function markPeriodAttendance(
  schoolId: string | number,
  payload: {
    class_section_id: number; academic_session_id: number;
    timetable_entry_id: number; date: string;
    students: { student_id: number; status: string; remark?: string }[]
  }
) {
  return axios.post(`${API_URL}/school/${schoolId}/attendance/students/mark-period`, payload)
}
