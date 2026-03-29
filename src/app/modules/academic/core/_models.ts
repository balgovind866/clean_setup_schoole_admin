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
