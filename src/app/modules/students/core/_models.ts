// ─── Student Core Model ──────────────────────────────────────────────────────
export interface StudentModel {
  id: number
  first_name: string
  last_name: string
  mobile_number: string
  email: string
  is_profile_complete: boolean
  is_active: boolean
  createdAt?: string
  updatedAt?: string
  profile?: StudentProfileModel
  parent?: StudentParentModel
  address?: StudentAddressModel
  documents?: StudentDocumentModel[]
  enrollments?: StudentEnrollmentModel[]
}

// ─── Student Profile ─────────────────────────────────────────────────────────
export interface StudentProfileModel {
  id: number
  student_id: number
  dob: string
  gender: 'male' | 'female' | 'other'
  blood_group: string
  nationality: string
  category: string
  createdAt?: string
  updatedAt?: string
}

export interface StudentProfilePayload {
  dob: string
  gender: string
  blood_group: string
  nationality: string
  category: string
}

// ─── Student Parent ──────────────────────────────────────────────────────────
export interface StudentParentModel {
  id: number
  student_id: number
  father_name: string
  father_phone: string
  father_occupation: string
  mother_name: string
  mother_phone: string
  mother_occupation: string
  guardian_address?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface StudentParentPayload {
  father_name: string
  father_phone: string
  father_occupation: string
  mother_name: string
  mother_phone: string
  mother_occupation: string
  guardian_address?: string
}

// ─── Student Address ─────────────────────────────────────────────────────────
export interface StudentAddressModel {
  id: number
  student_id: number
  current_address: string
  current_city: string
  current_state: string
  current_pincode: string
  permanent_address: string
  permanent_city: string
  permanent_state: string
  permanent_pincode: string
  is_same_as_current: boolean
  createdAt?: string
  updatedAt?: string
}

export interface StudentAddressPayload {
  current_address: string
  current_city: string
  current_state: string
  current_pincode: string
  permanent_address?: string
  permanent_city?: string
  permanent_state?: string
  permanent_pincode?: string
  is_same_as_current: boolean
}

// ─── Student Document ────────────────────────────────────────────────────────
export type DocumentType =
  | 'AadharCard'
  | 'BirthCertificate'
  | 'TransferCertificate'
  | 'PassportPhoto'
  | 'MarkSheet'
  | 'MedicalCertificate'
  | 'CasteCertificate'
  | 'Other'

export type DocumentStatus = 'Pending' | 'Verified' | 'Rejected'

export interface StudentDocumentModel {
  id: number
  student_id: number
  document_type: DocumentType
  file_path: string
  verification_status: DocumentStatus
  createdAt?: string
  updatedAt?: string
}

export interface StudentDocumentPayload {
  document_type: DocumentType
  file_path: string
}

// ─── Student Enrollment ──────────────────────────────────────────────────────
export type EnrollmentStatus = 'Active' | 'Promoted' | 'Dropped' | 'Transferred'

export interface StudentEnrollmentModel {
  id: number
  student_id: number
  academic_session_id: number
  class_section_id: number
  roll_number: string
  enrollment_date: string
  status: EnrollmentStatus
  createdAt?: string
  updatedAt?: string
  student?: StudentModel
  class_section?: {
    id: number
    class?: { id: number; name: string; numeric_value: number }
    section?: { id: number; name: string }
    capacity: number
  }
  academic_session?: { id: number; session_year: string }
}

export interface StudentEnrollmentPayload {
  academic_session_id: number
  class_section_id: number
  roll_number: string
  enrollment_date: string
}

// ─── Admit Student ───────────────────────────────────────────────────────────
export interface AdmitStudentPayload {
  first_name: string
  last_name: string
  mobile_number: string
  email: string
  password: string
}

// ─── API Response Shapes ─────────────────────────────────────────────────────
export interface StudentResponse {
  success: boolean
  message: string
  data: { student: StudentModel }
}

export interface StudentsListResponse {
  success: boolean
  message: string
  data: { students: StudentModel[] }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface StudentDocumentsResponse {
  success: boolean
  message: string
  data: { documents: StudentDocumentModel[] }
}

export interface StudentDocumentResponse {
  success: boolean
  message: string
  data: { document: StudentDocumentModel }
}

export interface StudentEnrollmentResponse {
  success: boolean
  message: string
  data: { enrollment: StudentEnrollmentModel }
}

export interface EnrollmentsListResponse {
  success: boolean
  message: string
  data: { enrollments: StudentEnrollmentModel[] }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}
