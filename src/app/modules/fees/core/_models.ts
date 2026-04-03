// ─── Fee Category ─────────────────────────────────────────────────────────────
export interface FeeCategoryModel {
  id: number
  name: string
  description: string | null
  default_amount: string
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface FeeCategoryPayload {
  name: string
  description?: string
  default_amount: number
  is_active?: boolean
}

// ─── Fee Group ────────────────────────────────────────────────────────────────
export interface FeeGroupTypeModel {
  id: number
  fee_group_id: number
  fee_category_id: number
  amount: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME'
  is_active: boolean
  createdAt: string
  updatedAt: string
  fee_category?: FeeCategoryModel
}

export interface FeeGroupModel {
  id: number
  name: string
  description: string | null
  is_active: boolean
  createdAt: string
  updatedAt: string
  fee_group_types?: FeeGroupTypeModel[]
}

export interface FeeGroupPayload {
  name: string
  description?: string
  categories: Array<{
    category_id: number
    amount: number
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME'
  }>
}

// ─── Fee Allocation ───────────────────────────────────────────────────────────
export interface FeeAllocationModel {
  id: number
  fee_group_id: number
  class_id: number
  section_id: number | null
  student_id: number | null
  academic_session_id: number
  is_active: boolean
  createdAt: string
  updatedAt: string
  // Embedded objects returned by the backend
  fee_group?: { id: number; name: string }
  class?: { id: number; name: string }
  section?: { id: number; name: string } | null
}

export interface FeeAllocationPayload {
  fee_group_id: number
  class_id: number
  section_id?: number | null
  student_id?: number | null
  academic_session_id: number
}

// ─── Fee Invoice ──────────────────────────────────────────────────────────────
export interface FeeInvoiceItemModel {
  id: number
  fee_invoice_id: number
  fee_category_id: number
  amount: string
  createdAt: string
  updatedAt: string
  fee_category?: FeeCategoryModel
}

export interface FeeInvoiceModel {
  id: number
  student_id: number
  academic_session_id: number
  invoice_month: string
  due_date: string
  total_amount: string
  old_balance: string
  fine_amount: string
  concession_amount: string
  net_amount: string
  paid_amount: string
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  createdAt: string
  updatedAt: string
  items?: FeeInvoiceItemModel[]
  student?: { id: number; first_name: string; last_name: string; email?: string }
}

export interface GenerateInvoicesPayload {
  class_id: number
  academic_session_id: number
  month: string // 'YYYY-MM'
  due_date: string
}

export interface YearlyMatrixMonthData {
  amount: number
  applicable: boolean
  status: 'UNGENERATED' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  invoice_id: number | null
}

export interface YearlyMatrixItem {
  category_id: number
  category_name: string
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME'
  total: number
  months: Record<string, YearlyMatrixMonthData>
}

export interface YearlyMatrixResponse {
  months: string[]
  items: YearlyMatrixItem[]
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export interface FeePaymentModel {
  id: number
  student_id: number
  fee_invoice_id: number
  amount_paid: string
  payment_mode: 'CASH' | 'ONLINE' | 'CHEQUE' | 'DD' | 'UPI'
  payment_date: string
  transaction_id: string | null
  collected_by: number
  remarks: string | null
  createdAt: string
  updatedAt: string
  student?: { id: number; first_name: string; last_name: string }
}

export interface CollectPaymentPayload {
  student_id: number
  academic_session_id: number
  amount: number
  payment_method: string
  payment_date: string
  notes?: string
}

// ─── Discount ─────────────────────────────────────────────────────────────────
export interface FeeDiscountModel {
  id: number
  name: string
  discount_type: 'PERCENTAGE' | 'FLAT'
  discount_value: string
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface FeeDiscountPayload {
  name: string
  discount_type: 'PERCENTAGE' | 'FLAT'
  discount_value: number
}

export interface AssignDiscountPayload {
  student_id: number
  fee_discount_id: number
  academic_session_id: number
}

export interface StudentDiscountModel {
  id: number
  student_id: number
  fee_discount_id: number
  academic_session_id: number
  is_active: boolean
  createdAt: string
  updatedAt: string
  discount?: FeeDiscountModel
  student?: { id: number; first_name: string; last_name: string }
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: { total: number; page: number; limit: number; totalPages: number }
}
