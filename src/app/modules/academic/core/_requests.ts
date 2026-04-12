import axios from 'axios'
import {
  SessionCreationData, SessionResponse, SessionsListResponse,
  ClassCreationData, ClassResponse, ClassesListResponse,
  SectionCreationData, SectionResponse, SectionsListResponse,
  ClassSectionMappingCreationData, ClassSectionMappingResponse, ClassSectionMappingsListResponse,
  SubjectCreationData, SubjectResponse, SubjectsListResponse,
  ClassSubjectMappingCreationData, ClassSubjectMappingResponse,
  ClassSubjectMappingsListResponse, AssignClassTeacherPayload,
  ClassTeacherMappingResponse,
  TeacherAllocationPayload,
  TeacherAllocationsListResponse,
  TeacherAllocationResponse,
  ClassTeacherSessionPayload,
  ClassTeacherSessionResponse,
} from './_models'


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

// ─── Classes API ─────────────────────────────────────────────────────────
const CLASSES_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/classes`
const CLASS_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/classes/${id}`

export function getClasses(schoolId: string | number, page: number = 1, limit: number = 100) {
  return axios.get<ClassesListResponse>(CLASSES_URL(schoolId), { params: { page, limit } })
}

export function getClassById(schoolId: string | number, id: string | number) {
  return axios.get<ClassResponse>(CLASS_URL(schoolId, id))
}

export function createClass(schoolId: string | number, payload: ClassCreationData) {
  return axios.post<ClassResponse>(CLASSES_URL(schoolId), payload)
}

export function updateClass(schoolId: string | number, id: string | number, payload: Partial<ClassCreationData>) {
  return axios.put<ClassResponse>(CLASS_URL(schoolId, id), payload)
}

export function deleteClass(schoolId: string | number, id: string | number) {
  return axios.delete(CLASS_URL(schoolId, id))
}

// ─── Sections API ────────────────────────────────────────────────────────
const SECTIONS_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/sections`
const SECTION_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/sections/${id}`

export function getSections(schoolId: string | number, page: number = 1, limit: number = 100) {
  return axios.get<SectionsListResponse>(SECTIONS_URL(schoolId), { params: { page, limit } })
}

export function getSectionById(schoolId: string | number, id: string | number) {
  return axios.get<SectionResponse>(SECTION_URL(schoolId, id))
}

export function createSection(schoolId: string | number, payload: SectionCreationData) {
  return axios.post<SectionResponse>(SECTIONS_URL(schoolId), payload)
}

export function updateSection(schoolId: string | number, id: string | number, payload: Partial<SectionCreationData>) {
  return axios.put<SectionResponse>(SECTION_URL(schoolId, id), payload)
}

export function deleteSection(schoolId: string | number, id: string | number) {
  return axios.delete(SECTION_URL(schoolId, id))
}

// ─── Class-Section Mapping API ──────────────────────────────────────────────
const CLASS_SECTIONS_URL = (schoolId: string | number, classId: string | number) =>
  `${API_URL}/school/${schoolId}/classes/${classId}/sections`
const CLASS_SECTION_URL = (schoolId: string | number, classId: string | number, sectionId: string | number) =>
  `${API_URL}/school/${schoolId}/classes/${classId}/sections/${sectionId}`

export function getClassSections(schoolId: string | number, classId: string | number) {
  return axios.get<ClassSectionMappingsListResponse>(CLASS_SECTIONS_URL(schoolId, classId))
}

export function assignSectionToClass(
  schoolId: string | number,
  classId: string | number,
  payload: ClassSectionMappingCreationData
) {
  return axios.post<ClassSectionMappingResponse>(CLASS_SECTIONS_URL(schoolId, classId), payload)
}

export function removeSectionFromClass(
  schoolId: string | number,
  classId: string | number,
  sectionId: string | number
) {
  return axios.delete(CLASS_SECTION_URL(schoolId, classId, sectionId))
}


const SUBJECTS_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/subjects`
const SUBJECT_URL = (schoolId: string | number, id: string | number) =>
  `${API_URL}/school/${schoolId}/subjects/${id}`

export function getSubjects(schoolId: string | number) {
  return axios.get<SubjectsListResponse>(SUBJECTS_URL(schoolId))
}

export function createSubject(schoolId: string | number, payload: SubjectCreationData) {
  return axios.post<SubjectResponse>(SUBJECTS_URL(schoolId), payload)
}

export function updateSubject(
  schoolId: string | number,
  id: string | number,
  payload: Partial<SubjectCreationData>
) {
  return axios.put<SubjectResponse>(SUBJECT_URL(schoolId, id), payload)
}

export function deleteSubject(schoolId: string | number, id: string | number) {
  return axios.delete(SUBJECT_URL(schoolId, id))
}

// ─── Class-Subject Mapping API ────────────────────────────────────────────────

const CLASS_SUBJECTS_URL = (schoolId: string | number, classId: string | number) =>
  `${API_URL}/school/${schoolId}/classes/${classId}/subjects`

const CLASS_SUBJECT_ITEM_URL = (
  schoolId: string | number,
  classId: string | number,
  subjectId: string | number
) => `${API_URL}/school/${schoolId}/classes/${classId}/subjects/${subjectId}`

export function getClassSubjects(schoolId: string | number, classId: string | number) {
  return axios.get<ClassSubjectMappingsListResponse>(CLASS_SUBJECTS_URL(schoolId, classId))
}

export function assignSubjectToClass(
  schoolId: string | number,
  classId: string | number,
  payload: ClassSubjectMappingCreationData
) {
  return axios.post<ClassSubjectMappingResponse>(CLASS_SUBJECTS_URL(schoolId, classId), payload)
}

export function removeSubjectFromClass(
  schoolId: string | number,
  classId: string | number,
  subjectId: string | number
) {
  return axios.delete(CLASS_SUBJECT_ITEM_URL(schoolId, classId, subjectId))
}

// ─── Class Teacher Assignment API ─────────────────────────────────────────────

export function assignClassTeacher(
  schoolId: string | number,
  classId: string | number,
  payload: AssignClassTeacherPayload
) {
  return axios.patch<ClassTeacherMappingResponse>(
    `${API_URL}/school/${schoolId}/classes/${classId}/class-teacher`,
    payload
  )
}

// ─── Teacher Allocation API ─────────────────────────────────────────────────

const TEACHER_ALLOCATIONS_URL = (schoolId: string | number) =>
  `${API_URL}/school/${schoolId}/teacher-allocations`

export function getTeacherAllocations(
  schoolId: string | number,
  params: { class_section_id?: number; academic_session_id?: number; subject_id?: number } = {}
) {
  return axios.get<TeacherAllocationsListResponse>(TEACHER_ALLOCATIONS_URL(schoolId), { params })
}

export function allocateTeacher(
  schoolId: string | number,
  payload: TeacherAllocationPayload
) {
  return axios.post<TeacherAllocationResponse>(TEACHER_ALLOCATIONS_URL(schoolId), payload)
}

export function updateTeacherAllocation(
  schoolId: string | number,
  allocationId: number,
  teacherId: number
) {
  return axios.put<TeacherAllocationResponse>(
    `${TEACHER_ALLOCATIONS_URL(schoolId)}/${allocationId}`,
    { teacher_id: teacherId }
  )
}

export function deleteTeacherAllocation(
  schoolId: string | number,
  allocationId: number
) {
  return axios.delete(`${TEACHER_ALLOCATIONS_URL(schoolId)}/${allocationId}`)
}

// ─── Session-aware Class Teacher API ──────────────────────────────────────────────

/** POST /school/:id/teacher-allocations/class-teacher */
export function assignClassTeacherBySession(
  schoolId: string | number,
  payload: ClassTeacherSessionPayload
) {
  return axios.post<ClassTeacherSessionResponse>(
    `${TEACHER_ALLOCATIONS_URL(schoolId)}/class-teacher`,
    payload
  )
}

/** GET /school/:id/teacher-allocations/class-teachers?session_id=X */
export function getClassTeachersForSession(
  schoolId: string | number,
  sessionId: string | number
) {
  return axios.get<{ success: boolean; count: number; data: any[] }>(
    `${TEACHER_ALLOCATIONS_URL(schoolId)}/class-teachers`,
    { params: { session_id: sessionId } }
  )
}
