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
