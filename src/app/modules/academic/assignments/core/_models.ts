export interface AssignmentModel {
  id: number
  title: string
  description?: string
  due_date: string
  max_marks?: number
  attachment_url?: string
  allowed_file_types?: string[]
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  academic_session_id?: number
  class_id?: number
  section_id?: number
  subject_id?: number
  teacher_id?: number
  updatedAt?: string
  createdAt?: string
  teacher?: {
    id: number
    first_name?: string
    last_name?: string
    name?: string
  }
}

export interface AssignmentSubmissionModel {
  id: number
  assignment_id: number
  student_id: number
  submission_text?: string
  attachment_url?: string
  status: 'PENDING' | 'SUBMITTED' | 'LATE_SUBMISSION' | 'EVALUATED'
  marks_obtained?: number
  teacher_feedback?: string
  submitted_at?: string
  updatedAt?: string
  createdAt?: string
  // relations
  student?: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}
