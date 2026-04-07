// ─── Teacher Models ───────────────────────────────────────────────────────────

export interface TeacherProfession {
  id: number
  name: string
  category: string
}

export interface TeacherProfile {
  id?: number
  teacher_id?: number
  dob?: string
  gender?: string
  blood_group?: string
  marital_status?: string
  religion?: string
  category?: string
  father_name?: string
  mother_name?: string
  spouse_name?: string
  highest_qualification?: string
  present_address?: string
  permanent_address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface TeacherBankDetails {
  id?: number
  teacher_id?: number
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch_name?: string
  account_holder_name?: string
}

export interface TeacherExperience {
  id?: number
  teacher_id?: number
  school_name: string
  designation: string
  from_date: string
  to_date?: string
  is_current: boolean
  reason_for_leaving?: string
  createdAt?: string
  updatedAt?: string
}

export interface TeacherDocument {
  id?: number
  teacher_id?: number
  document_type: string
  file_path: string
  verification_status: 'Pending' | 'Verified' | 'Rejected'
  createdAt?: string
  updatedAt?: string
}

export interface TeacherCompletionStatus {
  profile: boolean
  experience: boolean
  documents: boolean
  bank_details: boolean
}

export interface TeacherModel {
  id: number
  name: string
  email: string
  phone?: string | null
  profession_id?: number
  joining_date?: string
  employment_type?: string
  is_active: boolean
  role?: string
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  profession?: TeacherProfession
  profile?: TeacherProfile | null
  bank_details?: TeacherBankDetails | null
  experiences?: TeacherExperience[]
  documents?: TeacherDocument[]
  completion_status?: TeacherCompletionStatus
  completion_percentage?: number
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateTeacherPayload {
  name: string
  email: string
  password: string
  mobile_number?: string
  profession_id?: number
  employment_type?: string
  joining_date?: string
}

export interface UpdateTeacherProfilePayload {
  dob?: string
  gender?: string
  blood_group?: string
  marital_status?: string
  religion?: string
  category?: string
  father_name?: string
  mother_name?: string
  spouse_name?: string
  highest_qualification?: string
  present_address?: string
  permanent_address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface UpdateTeacherBankPayload {
  bank_name: string
  account_number: string
  ifsc_code: string
  branch_name?: string
  account_holder_name: string
}

export interface AddTeacherExperiencePayload {
  school_name: string
  designation: string
  from_date: string
  to_date?: string
  is_current: boolean
  reason_for_leaving?: string
}

export interface AddTeacherDocumentPayload {
  document_type: string
  file_path: string
}

export interface UpdateTeacherPermissionsPayload {
  permissions: string[]
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface TeacherResponse {
  success: boolean
  message: string
  data: { teacher: TeacherModel }
}

export interface TeachersListResponse {
  success: boolean
  message: string
  data: { teachers: TeacherModel[] }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface TeacherExperienceResponse {
  success: boolean
  message: string
  data: { experience: TeacherExperience }
}

export interface TeacherDocumentResponse {
  success: boolean
  message: string
  data: { document: TeacherDocument }
}

export interface TeacherPermissionsResponse {
  success: boolean
  message: string
  data: { teacher: TeacherModel }
}
