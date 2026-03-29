import axios from 'axios'
import { SessionCreationData, SessionResponse, SessionsListResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export const GET_SESSIONS_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/academic-sessions`
export const SESSION_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/academic-sessions/${id}`
export const SET_CURRENT_SESSION_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/academic-sessions/${id}/set-current`

export function getAcademicSessions(schoolId: string | number, page: number = 1, limit: number = 10, search: string = '') {
  return axios.get<SessionsListResponse>(GET_SESSIONS_URL(schoolId), {
    params: { page, limit, search }
  })
}

export function getAcademicSessionById(schoolId: string | number, id: string | number) {
  return axios.get<SessionResponse>(SESSION_URL(schoolId, id))
}

export function createAcademicSession(schoolId: string | number, payload: SessionCreationData) {
  return axios.post<SessionResponse>(GET_SESSIONS_URL(schoolId), payload)
}

export function updateAcademicSession(schoolId: string | number, id: string | number, payload: Partial<SessionCreationData>) {
  return axios.put<SessionResponse>(SESSION_URL(schoolId, id), payload)
}

export function deleteAcademicSession(schoolId: string | number, id: string | number) {
  return axios.delete(SESSION_URL(schoolId, id))
}

export function setCurrentAcademicSession(schoolId: string | number, id: string | number) {
  return axios.patch<SessionResponse>(SET_CURRENT_SESSION_URL(schoolId, id))
}
