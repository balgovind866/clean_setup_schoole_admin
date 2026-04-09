import axios from 'axios'
import { GetAppSettingsResponse, UpdateAppSettingsPayload, UpdateAppSettingsResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export function getAppSettings(schoolId: string | number) {
    return axios.get<GetAppSettingsResponse>(`${API_URL}/school/${schoolId}/app-settings`)
}

export function updateAppSettings(schoolId: string | number, payload: UpdateAppSettingsPayload) {
    return axios.put<UpdateAppSettingsResponse>(`${API_URL}/school/${schoolId}/app-settings`, payload)
}
