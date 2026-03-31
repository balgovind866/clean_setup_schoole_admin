import axios from 'axios'
import {
  CreateTeacherPayload,
  UpdateTeacherProfilePayload,
  UpdateTeacherBankPayload,
  AddTeacherExperiencePayload,
  AddTeacherDocumentPayload,
  TeacherResponse,
  TeachersListResponse,
  TeacherExperienceResponse,
  TeacherDocumentResponse,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

const TEACHERS_URL = (schoolId: string | number) =>
  `${API_URL}/school/${schoolId}/teachers`

const TEACHER_URL = (schoolId: string | number, teacherId: string | number) =>
  `${API_URL}/school/${schoolId}/teachers/${teacherId}`

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function createTeacher(schoolId: string | number, payload: CreateTeacherPayload) {
  return axios.post<TeacherResponse>(TEACHERS_URL(schoolId), payload)
}

export function getTeachers(
  schoolId: string | number,
  params: { page?: number; limit?: number; search?: string } = {}
) {
  return axios.get<TeachersListResponse>(TEACHERS_URL(schoolId), {
    params: { page: 1, limit: 50, ...params },
  })
}

export function getTeacherById(schoolId: string | number, teacherId: string | number) {
  return axios.get<TeacherResponse>(TEACHER_URL(schoolId, teacherId))
}

export function toggleTeacherStatus(schoolId: string | number, teacherId: string | number) {
  return axios.patch<any>(`${TEACHER_URL(schoolId, teacherId)}/toggle-status`, {})
}

// ─── Profile / Bank ───────────────────────────────────────────────────────────

export function updateTeacherProfile(
  schoolId: string | number,
  teacherId: string | number,
  payload: UpdateTeacherProfilePayload
) {
  return axios.put<TeacherResponse>(`${TEACHER_URL(schoolId, teacherId)}/profile`, payload)
}

export function updateTeacherBank(
  schoolId: string | number,
  teacherId: string | number,
  payload: UpdateTeacherBankPayload
) {
  return axios.put<TeacherResponse>(`${TEACHER_URL(schoolId, teacherId)}/bank`, payload)
}

// ─── Experience ───────────────────────────────────────────────────────────────

export function addTeacherExperience(
  schoolId: string | number,
  teacherId: string | number,
  payload: AddTeacherExperiencePayload
) {
  return axios.post<TeacherExperienceResponse>(
    `${TEACHER_URL(schoolId, teacherId)}/experience`,
    payload
  )
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function addTeacherDocument(
  schoolId: string | number,
  teacherId: string | number,
  payload: AddTeacherDocumentPayload
) {
  return axios.post<TeacherDocumentResponse>(
    `${TEACHER_URL(schoolId, teacherId)}/documents`,
    payload
  )
}
