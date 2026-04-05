import axios from 'axios'
import {
  GradeScale, GradeScalePayload,
  ExamGroup, ExamGroupPayload,
  ExamSubject, ExamSubjectPayload,
  ExamSchedule, ExamSchedulePayload,
  ExamResult, MarkEntryPayload,
  MarksheetData,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const BASE = (schoolId: string | number) => `${API_URL}/school/${schoolId}/exams`

// ─── Grade Scales ─────────────────────────────────────────────────────────────
export const getGradeScales = (schoolId: string | number) =>
  axios.get<{ success: boolean; data: GradeScale[] }>(`${BASE(schoolId)}/grade-scales`)

export const createGradeScale = (schoolId: string | number, payload: GradeScalePayload) =>
  axios.post<{ success: boolean; data: GradeScale }>(`${BASE(schoolId)}/grade-scales`, payload)

export const updateGradeScale = (schoolId: string | number, id: number, payload: Partial<GradeScalePayload>) =>
  axios.put<{ success: boolean; data: GradeScale }>(`${BASE(schoolId)}/grade-scales/${id}`, payload)

export const deleteGradeScale = (schoolId: string | number, id: number) =>
  axios.delete(`${BASE(schoolId)}/grade-scales/${id}`)

// ─── Exam Groups ──────────────────────────────────────────────────────────────
export const getExamGroups = (schoolId: string | number) =>
  axios.get<{ success: boolean; data: ExamGroup[] }>(`${BASE(schoolId)}/groups`)

export const createExamGroup = (schoolId: string | number, payload: ExamGroupPayload) =>
  axios.post<{ success: boolean; data: ExamGroup }>(`${BASE(schoolId)}/groups`, payload)

export const updateExamGroup = (schoolId: string | number, id: number, payload: Partial<ExamGroupPayload>) =>
  axios.put<{ success: boolean; data: ExamGroup }>(`${BASE(schoolId)}/groups/${id}`, payload)

export const deleteExamGroup = (schoolId: string | number, id: number) =>
  axios.delete(`${BASE(schoolId)}/groups/${id}`)

export const assignClassesToGroup = (schoolId: string | number, groupId: number, classes: { class_id: number; section_id: number }[]) =>
  axios.post<{ success: boolean; data: ExamGroup }>(`${BASE(schoolId)}/groups/${groupId}/classes`, { classes })

export const removeClassesFromGroup = (schoolId: string | number, groupId: number, mappingId: number) =>
  axios.delete(`${BASE(schoolId)}/groups/${groupId}/classes/${mappingId}`)

// ─── Exam Subjects ────────────────────────────────────────────────────────────
export const getGroupExams = (schoolId: string | number, groupId: number) =>
  axios.get<{ success: boolean; data: ExamSubject[] }>(`${BASE(schoolId)}/groups/${groupId}/exams`)

export const addExamsToGroup = (schoolId: string | number, groupId: number, exams: ExamSubjectPayload[]) =>
  axios.post<{ success: boolean; data: ExamSubject[] }>(`${BASE(schoolId)}/groups/${groupId}/exams`, { exams })

export const updateExamSubject = (schoolId: string | number, groupId: number, examId: number, payload: Partial<ExamSubjectPayload>) =>
  axios.put<{ success: boolean; data: ExamSubject }>(`${BASE(schoolId)}/groups/${groupId}/exams/${examId}`, payload)

export const deleteExamSubject = (schoolId: string | number, groupId: number, examId: number) =>
  axios.delete(`${BASE(schoolId)}/groups/${groupId}/exams/${examId}`)

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const getGroupSchedule = (schoolId: string | number, groupId: number) =>
  axios.get<{ success: boolean; data: ExamSchedule[] }>(`${BASE(schoolId)}/groups/${groupId}/schedule`)

export const createSchedule = (schoolId: string | number, groupId: number, schedules: ExamSchedulePayload[]) =>
  axios.post<{ success: boolean; data: ExamSchedule[] }>(`${BASE(schoolId)}/groups/${groupId}/schedule`, { schedules })

export const updateSchedule = (schoolId: string | number, groupId: number, scheduleId: number, payload: Partial<ExamSchedulePayload>) =>
  axios.put<{ success: boolean; data: ExamSchedule }>(`${BASE(schoolId)}/groups/${groupId}/schedule/${scheduleId}`, payload)

export const deleteSchedule = (schoolId: string | number, groupId: number, scheduleId: number) =>
  axios.delete(`${BASE(schoolId)}/groups/${groupId}/schedule/${scheduleId}`)

export const downloadSchedulePdf = (schoolId: string | number, groupId: number, sectionId: number) =>
  axios.get(`${BASE(schoolId)}/groups/${groupId}/schedule/pdf?sectionId=${sectionId}`, { responseType: 'blob' })

// ─── Marks Entry ──────────────────────────────────────────────────────────────
export const bulkMarksEntry = (schoolId: string | number, examId: number, marks: MarkEntryPayload[]) =>
  axios.post<{ success: boolean; message: string; count: number }>(`${BASE(schoolId)}/results/bulk-entry`, { exam_id: examId, marks })

export const getExamResults = (schoolId: string | number, examId: number) =>
  axios.get<{ success: boolean; data: ExamResult[] }>(`${BASE(schoolId)}/results?exam_id=${examId}`)

// ─── Marksheet ────────────────────────────────────────────────────────────────
export const getMarksheet = (schoolId: string | number, groupId: number, classId: number) =>
  axios.get<{ success: boolean; data: MarksheetData }>(`${BASE(schoolId)}/groups/${groupId}/marksheet?class_id=${classId}`)

export const downloadStudentReportCardPdf = (schoolId: string | number, groupId: number, studentId: number) =>
  axios.get(`${BASE(schoolId)}/groups/${groupId}/students/${studentId}/report-card/pdf`, { responseType: 'blob' })
