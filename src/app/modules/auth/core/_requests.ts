import axios from 'axios'
import { AuthModel, UserModel, LoginResponse, SchoolCreationData, SchoolModel, SchoolResponse, SchoolsListResponse, ProfessionModel, ProfessionCreationData, ProfessionResponse, ProfessionsListResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export const LOGIN_URL = `${API_URL}/login`
export const SUPERADMIN_LOGIN_URL = `${API_URL}/admin/login`
export const GET_USER_BY_TOKEN_URL = `${API_URL}/verify_token`
export const CREATE_SCHOOL_URL = `${API_URL}/admin/schools`
export const GET_SCHOOLS_URL = `${API_URL}/admin/schools`

export const GET_PROFESSIONS_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/professions`
export const PROFESSION_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/professions/${id}`

export function login(email: string, password: string, role: string = 'admin', schoolId?: string) {
  let url = role === 'super_admin' ? SUPERADMIN_LOGIN_URL : `${API_URL}/school/${schoolId}/login`

  return axios.post<LoginResponse>(url, {
    email,
    password,
  })
}

export function createSchool(schoolData: SchoolCreationData) {
  return axios.post<SchoolResponse>(CREATE_SCHOOL_URL, schoolData)
}

export function getSchools(page: number, limit: number, search: string = '', isActive: boolean = true) {
  return axios.get<SchoolsListResponse>(GET_SCHOOLS_URL, {
    params: {
      page,
      limit,
      search,
      is_active: isActive
    }
  })
}

// Server should return AuthModel
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  // Mock registration or throw error since we are removing it
  return new Promise((_, reject) => {
    reject(new Error("Registration is disabled"))
  })
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return new Promise((_, reject) => {
    reject(new Error("Forgot Password is disabled"))
  })
}

export function getUserByToken(token: string) {
  return axios.get<LoginResponse>(GET_USER_BY_TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

// --- Profession Requests ---
export function getProfessions(schoolId: string | number) {
  return axios.get<ProfessionsListResponse>(GET_PROFESSIONS_URL(schoolId))
}

export function createProfession(schoolId: string | number, data: ProfessionCreationData) {
  return axios.post<ProfessionResponse>(GET_PROFESSIONS_URL(schoolId), data)
}

export function updateProfession(schoolId: string | number, id: string | number, data: Partial<ProfessionCreationData>) {
  return axios.put<ProfessionResponse>(PROFESSION_URL(schoolId, id), data)
}

export function toggleProfessionStatus(schoolId: string | number, id: string | number) {
  return axios.patch<ProfessionResponse>(`${PROFESSION_URL(schoolId, id)}/toggle-status`)
}

export function deleteProfession(schoolId: string | number, id: string | number) {
  return axios.delete(PROFESSION_URL(schoolId, id))
}
