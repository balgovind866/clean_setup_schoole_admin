export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type TargetType = 'ALL' | 'STAFF' | 'STUDENTS' | 'PARENTS' | 'CLASS' | 'SECTION'
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type Category = 'GENERAL' | 'EXAM' | 'HOLIDAY' | 'EVENT' | 'FEE' | 'MEETING' | 'CIRCULAR'

export interface NoticeModel {
  id: number
  title: string
  content: string
  category: Category
  priority: Priority
  target_type: TargetType
  target_class_id: number | null
  target_section_id: number | null
  attachment_url: string | null
  status: NoticeStatus
  publish_at: string | null
  expires_at: string | null
  created_by: number
  created_by_role: string
  view_count: number
  is_pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface NoticeStats {
  total: number
  published: number
  draft: number
  archived: number
  expired: number
  active: number
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface NoticePayload {
  title: string
  content: string
  category: Category
  priority: Priority
  target_audience: TargetType
  status: NoticeStatus
  publish_date?: string
  expiry_date?: string
  attachment_url?: string
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface NoticesListResponse {
  success: boolean
  notices: NoticeModel[]
}

export interface NoticeStatsResponse {
  success: boolean
  data: NoticeStats
}

export interface NoticeResponse {
  success: boolean
  data: NoticeModel
}
