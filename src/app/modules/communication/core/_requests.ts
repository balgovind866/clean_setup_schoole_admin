import axios from 'axios'
import {
  NoticePayload,
  NoticesListResponse,
  NoticeStatsResponse,
  NoticeResponse
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const BASE = (schoolId: string | number) => `${API_URL}/school/${schoolId}/notices`

// ─── Notice Board API ───────────────────────────────────────────────────────

export function getNotices(schoolId: string | number, params?: any) {
  return axios.get<NoticesListResponse>(BASE(schoolId), { params })
}

export function getNoticeStats(schoolId: string | number) {
  return axios.get<NoticeStatsResponse>(`${BASE(schoolId)}/stats`)
}

export function createNotice(schoolId: string | number, payload: NoticePayload) {
  return axios.post<NoticeResponse>(BASE(schoolId), payload)
}

export function updateNotice(schoolId: string | number, id: number, payload: NoticePayload) {
  return axios.put<NoticeResponse>(`${BASE(schoolId)}/${id}`, payload)
}

export function publishNotice(schoolId: string | number, id: number) {
  return axios.put(`${BASE(schoolId)}/${id}/publish`)
}

export function pinNotice(schoolId: string | number, id: number) {
  return axios.put(`${BASE(schoolId)}/${id}/pin`)
}

export function archiveNotice(schoolId: string | number, id: number) {
  return axios.put(`${BASE(schoolId)}/${id}/archive`)
}

export function deleteNotice(schoolId: string | number, id: number) {
  return axios.delete(`${BASE(schoolId)}/${id}`)
}

export function markNoticeRead(schoolId: string | number, id: number) {
  return axios.post(`${BASE(schoolId)}/${id}/read`)
}
