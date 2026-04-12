import axios from 'axios'
import { AssignmentModel, AssignmentSubmissionModel } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export function getAssignments(
  schoolId: string | number,
  params: { academic_session_id?: number; class_id?: number; section_id?: number; subject_id?: number; status?: string; page?: number; limit?: number }
) {
  return axios.get(`${API_URL}/school/${schoolId}/assignments`, { params })
}

export function getAssignmentDetails(schoolId: string | number, assignmentId: string | number) {
  return axios.get<{ success: boolean; data: { assignment: AssignmentModel & { submissions: AssignmentSubmissionModel[] } } }>(`${API_URL}/school/${schoolId}/assignments/${assignmentId}`)
}

export function createAssignment(schoolId: string | number, data: FormData) {
  return axios.post(`${API_URL}/school/${schoolId}/assignments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateAssignment(schoolId: string | number, assignmentId: string | number, data: FormData) {
  return axios.put(`${API_URL}/school/${schoolId}/assignments/${assignmentId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteAssignment(schoolId: string | number, assignmentId: string | number) {
  return axios.delete(`${API_URL}/school/${schoolId}/assignments/${assignmentId}`)
}
