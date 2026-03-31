export interface SessionModel {
  id: number;
  session_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionCreationData {
  session_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface SessionsListResponse {
  success: boolean;
  message: string;
  data: {
    sessions: SessionModel[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: {
    session: SessionModel;
  };
}

// ─── Class Models ──────────────────────────────────────────────────────────
export interface ClassModel {
  id: number;
  name: string;
  numeric_value: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassCreationData {
  name: string;
  numeric_value: number;
}

export interface ClassesListResponse {
  success: boolean;
  message: string;
  data: {
    classes: ClassModel[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ClassResponse {
  success: boolean;
  message: string;
  data: {
    class: ClassModel;
  };
}

// ─── Section Models ─────────────────────────────────────────────────────────
export interface SectionModel {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionCreationData {
  name: string;
}

export interface SectionsListResponse {
  success: boolean;
  message: string;
  data: {
    sections: SectionModel[];
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SectionResponse {
  success: boolean;
  message: string;
  data: {
    section: SectionModel;
  };
}

// ─── Class-Section Mapping Models ───────────────────────────────────────────
export interface ClassSectionMappingModel {
  id: number;
  class_id: number;
  section_id: number;
  capacity: number;
  createdAt?: string;
  updatedAt?: string;
  section?: SectionModel;
}

export interface ClassSectionMappingCreationData {
  section_id: number;
  capacity: number;
}

export interface ClassSectionMappingsListResponse {
  success: boolean;
  message: string;
  data: {
    sections: ClassSectionMappingModel[];
  };
}

export interface ClassSectionMappingResponse {
  success: boolean;
  message: string;
  data: {
    mapping: ClassSectionMappingModel;
  };
}

// ─── Subject Models ──────────────────────────────────────────────────────────

export interface SubjectModel {
  id: number;
  name: string;
  code: string;
  type: 'theory' | 'practical' | 'both';
  category: 'compulsory' | 'elective';
  description?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectCreationData {
  name: string;
  code: string;
  type: 'theory' | 'practical' | 'both';
  category: 'compulsory' | 'elective';
  description?: string;
}

export interface SubjectResponse {
  success: boolean;
  message: string;
  data: { subject: SubjectModel };
}

export interface SubjectsListResponse {
  success: boolean;
  message: string;
  data: { subjects: SubjectModel[] };
}

// ─── Class-Subject Mapping Models ────────────────────────────────────────────

export interface ClassSubjectMappingModel {
  id: number;
  class_id: number;
  subject_id: number;
  is_compulsory: boolean;
  createdAt?: string;
  updatedAt?: string;
  subject?: SubjectModel;
}

export interface ClassSubjectMappingCreationData {
  subject_id: number;
  is_compulsory: boolean;
}

export interface ClassSubjectMappingsListResponse {
  success: boolean;
  message: string;
  data: { subjects: ClassSubjectMappingModel[] };
}

export interface ClassSubjectMappingResponse {
  success: boolean;
  message: string;
  data: { mapping: ClassSubjectMappingModel };
}

// ─── Class Teacher Assignment ─────────────────────────────────────────────────

export interface AssignClassTeacherPayload {
  section_id: number;
  teacher_id: number;
}

export interface ClassTeacherMappingResponse {
  success: boolean;
  message: string;
  data: { mapping: any };
}

