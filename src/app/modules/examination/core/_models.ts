// ─── Grade Scale ──────────────────────────────────────────────────────────────
export interface GradeScale {
  id: number
  exam_type: 'SCHOOL' | 'BOARD'
  grade_name: string
  min_percentage: string
  max_percentage: string
  grade_point: string
  description: string | null
  is_active: boolean
  school_id: number | null
  createdAt: string
  updatedAt: string
}

export interface GradeScalePayload {
  exam_type: 'SCHOOL' | 'BOARD'
  grade_name: string
  min_percentage: number
  max_percentage: number
  grade_point: number
  description?: string
}

// ─── Exam Group ───────────────────────────────────────────────────────────────
export interface ExamGroupClass {
  id: number
  exam_group_id: number
  class_id: number
  section_id: number
  class?: { id: number; name: string }
  section?: { id: number; name: string }
}

export interface ExamGroup {
  id: number
  name: string
  type: 'SCHOOL' | 'BOARD'
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED'
  academic_session_id: number
  weightage_percentage: string
  parent_exam_group_id: number | null
  description: string | null
  createdAt: string
  updatedAt: string
  classes?: ExamGroupClass[]
  academic_session?: { id: number; session_year: string }
}

export interface ExamGroupPayload {
  name: string
  type: 'SCHOOL' | 'BOARD'
  academic_session_id: number
  description?: string
}

// ─── Exam (Subject Config) ────────────────────────────────────────────────────
export interface ExamSubject {
  id: number
  exam_group_id: number
  subject_id: number
  exam_type: 'THEORY' | 'PRACTICAL' | 'BOTH'
  max_marks: string
  min_marks: string
  credit_hours: number | null
  parent_exam_id: number | null
  is_active: boolean
  createdAt: string
  updatedAt: string
  subject?: { id: number; name: string }
}

export interface ExamSubjectPayload {
  subject_id: number
  max_marks: number
  min_marks: number
  credit_hours?: number
  exam_type?: 'THEORY' | 'PRACTICAL' | 'BOTH'
}

// ─── Exam Schedule ────────────────────────────────────────────────────────────
export interface ExamSchedule {
  id: number
  exam_id: number
  section_id: number
  date: string
  start_time: string
  end_time: string
  room_no: string | null
  invigilator_id: number | null
  createdAt: string
  updatedAt: string
}

export interface ExamSchedulePayload {
  exam_id: number
  section_id: number
  date: string
  start_time: string
  end_time: string
  room_no?: string
}

// ─── Exam Result ──────────────────────────────────────────────────────────────
export interface ExamResult {
  id: number
  exam_id: number
  student_id: number
  marks_obtained: string
  grade_name: string | null
  grade_point: string | null
  is_pass: boolean
  is_absent: boolean
  remarks: string | null
  entered_by: number
  verified_by: number | null
  createdAt: string
  updatedAt: string
}

export interface MarkEntryPayload {
  student_id: number
  marks_obtained: number
  is_absent?: boolean
  remarks?: string
}

// ─── Marksheet ────────────────────────────────────────────────────────────────
export interface MarksheetStudent {
  id: number
  first_name: string
  last_name: string
  enrollments: Array<{ roll_number: string }>
}

export interface MarksheetData {
  exams: ExamSubject[]
  students: MarksheetStudent[]
  results: ExamResult[]
}
