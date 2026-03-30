import axios from 'axios'
import {
  AdmitStudentPayload,
  StudentResponse,
  StudentsListResponse,
  StudentProfilePayload,
  StudentParentPayload,
  StudentAddressPayload,
  StudentDocumentPayload,
  StudentDocumentResponse,
  StudentDocumentsResponse,
  StudentEnrollmentPayload,
  StudentEnrollmentResponse,
  EnrollmentsListResponse,
  DocumentStatus,
  EnrollmentStatus,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

// ─── URL Builders ─────────────────────────────────────────────────────────────
const STUDENTS_URL = (schoolId: string | number) =>
  `${API_URL}/school/${schoolId}/students`

const STUDENT_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}`

const STUDENT_PROFILE_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}/profile`

const STUDENT_PARENT_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}/parent`

const STUDENT_ADDRESS_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}/address`

const STUDENT_DOCUMENTS_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}/documents`

const STUDENT_DOCUMENT_URL = (
  schoolId: string | number,
  studentId: string | number,
  documentId: string | number
) => `${API_URL}/school/${schoolId}/students/${studentId}/documents/${documentId}`

const STUDENT_ENROLL_URL = (schoolId: string | number, studentId: string | number) =>
  `${API_URL}/school/${schoolId}/students/${studentId}/enroll`

const ENROLLMENTS_URL = (schoolId: string | number) =>
  `${API_URL}/school/${schoolId}/enrollments`

const ENROLLMENT_STATUS_URL = (schoolId: string | number, enrollmentId: string | number) =>
  `${API_URL}/school/${schoolId}/enrollments/${enrollmentId}/status`

// ─── Student CRUD ─────────────────────────────────────────────────────────────

/** Step 1: Admit a new student (creates core login record) */
export function admitStudent(schoolId: string | number, payload: AdmitStudentPayload) {
  return axios.post<StudentResponse>(STUDENTS_URL(schoolId), payload)
}

/** Get paginated list of all students */
export function getStudents(
  schoolId: string | number,
  params: { page?: number; limit?: number; search?: string } = {}
) {
  return axios.get<StudentsListResponse>(STUDENTS_URL(schoolId), {
    params: { page: 1, limit: 50, ...params },
  })
}

/** Get single student full profile (with all relations) */
export function getStudentById(schoolId: string | number, studentId: string | number) {
  return axios.get<StudentResponse>(STUDENT_URL(schoolId, studentId))
}

// ─── Profile / Parent / Address ──────────────────────────────────────────────

/** Step 2: Update personal profile */
export function updateStudentProfile(
  schoolId: string | number,
  studentId: string | number,
  payload: StudentProfilePayload
) {
  return axios.put<StudentResponse>(STUDENT_PROFILE_URL(schoolId, studentId), payload)
}

/** Step 3: Update parent details */
export function updateStudentParent(
  schoolId: string | number,
  studentId: string | number,
  payload: StudentParentPayload
) {
  return axios.put<StudentResponse>(STUDENT_PARENT_URL(schoolId, studentId), payload)
}

/** Step 4: Update address details */
export function updateStudentAddress(
  schoolId: string | number,
  studentId: string | number,
  payload: StudentAddressPayload
) {
  return axios.put<StudentResponse>(STUDENT_ADDRESS_URL(schoolId, studentId), payload)
}

// ─── Documents ────────────────────────────────────────────────────────────────

/** Step 5: Upload / add a document */
export function uploadDocument(
  schoolId: string | number,
  studentId: string | number,
  payload: StudentDocumentPayload
) {
  return axios.post<StudentDocumentResponse>(STUDENT_DOCUMENTS_URL(schoolId, studentId), payload)
}

/** Get all documents for a student */
export function getStudentDocuments(
  schoolId: string | number,
  studentId: string | number
) {
  return axios.get<StudentDocumentsResponse>(STUDENT_DOCUMENTS_URL(schoolId, studentId))
}

/** Admin: verify or reject a document */
export function updateDocumentStatus(
  schoolId: string | number,
  studentId: string | number,
  documentId: string | number,
  status: DocumentStatus
) {
  return axios.patch<StudentDocumentResponse>(
    STUDENT_DOCUMENT_URL(schoolId, studentId, documentId),
    { status }
  )
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

/** Step 6: Enroll student into a class-section */
export function enrollStudent(
  schoolId: string | number,
  studentId: string | number,
  payload: StudentEnrollmentPayload
) {
  return axios.post<StudentEnrollmentResponse>(STUDENT_ENROLL_URL(schoolId, studentId), payload)
}

/** Get enrollment roster (filtered by session, class-section, status) */
export function getEnrollments(
  schoolId: string | number,
  params: {
    session_id?: number
    class_section_id?: number
    status?: EnrollmentStatus
    page?: number
    limit?: number
  } = {}
) {
  return axios.get<EnrollmentsListResponse>(ENROLLMENTS_URL(schoolId), {
    params: { page: 1, limit: 50, ...params },
  })
}

/** Admin: update enrollment status (Promote / Drop / Transfer) */
export function updateEnrollmentStatus(
  schoolId: string | number,
  enrollmentId: string | number,
  status: EnrollmentStatus
) {
  return axios.patch<StudentEnrollmentResponse>(
    ENROLLMENT_STATUS_URL(schoolId, enrollmentId),
    { status }
  )
}
