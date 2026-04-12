import axios from 'axios'
import { AssignmentModel, AssignmentSubmissionModel } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export function getMyAssignments(
  schoolId: string | number,
  params: { academic_session_id?: number; class_id?: number; section_id?: number; subject_id?: number; page?: number; limit?: number }
) {
  return axios.get(`${API_URL}/school/${schoolId}/teacher-app/assignments`, { params })
}

export function getAssignmentDetails(schoolId: string | number, assignmentId: string | number) {
  return axios.get<{ success: boolean; data: { assignment: AssignmentModel; submissions: AssignmentSubmissionModel[] } }>(`${API_URL}/school/${schoolId}/teacher-app/assignments/${assignmentId}`)
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
