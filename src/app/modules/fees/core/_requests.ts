import axios from 'axios'
import {
  ApiResponse,
  FeeCategoryPayload,
  FeeCategoryModel,
  FeeGroupPayload,
  FeeGroupModel,
  FeeAllocationPayload,
  FeeAllocationModel,
  GenerateInvoicesPayload,
  FeeInvoiceModel,
  CollectPaymentPayload,
  FeePaymentModel,
  FeeDiscountPayload,
  FeeDiscountModel,
  AssignDiscountPayload,
  StudentDiscountModel,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

// ─── URL helpers ──────────────────────────────────────────────────────────────
const BASE = (schoolId: string | number) =>
  `${API_URL}/school/${schoolId}/fees`

// ─── Fee Categories ───────────────────────────────────────────────────────────
export const getFeeCategories = (schoolId: string | number) =>
  axios.get<ApiResponse<FeeCategoryModel[]>>(`${BASE(schoolId)}/categories`)

export const createFeeCategory = (schoolId: string | number, payload: FeeCategoryPayload) =>
  axios.post<ApiResponse<FeeCategoryModel>>(`${BASE(schoolId)}/categories`, payload)

export const updateFeeCategory = (
  schoolId: string | number,
  categoryId: number,
  payload: Partial<FeeCategoryPayload>
) =>
  axios.put<ApiResponse<FeeCategoryModel>>(
    `${BASE(schoolId)}/categories/${categoryId}`,
    payload
  )

export const deleteFeeCategory = (schoolId: string | number, categoryId: number) =>
  axios.delete<ApiResponse<null>>(`${BASE(schoolId)}/categories/${categoryId}`)

// ─── Fee Groups ───────────────────────────────────────────────────────────────
export const getFeeGroups = (schoolId: string | number) =>
  axios.get<ApiResponse<FeeGroupModel[]>>(`${BASE(schoolId)}/groups`)

export const getFeeGroupById = (schoolId: string | number, groupId: number) =>
  axios.get<ApiResponse<FeeGroupModel>>(`${BASE(schoolId)}/groups/${groupId}`)

export const createFeeGroup = (schoolId: string | number, payload: FeeGroupPayload) =>
  axios.post<ApiResponse<FeeGroupModel>>(`${BASE(schoolId)}/groups`, payload)

export const updateFeeGroup = (
  schoolId: string | number,
  groupId: number,
  payload: FeeGroupPayload
) =>
  axios.put<ApiResponse<FeeGroupModel>>(`${BASE(schoolId)}/groups/${groupId}`, payload)

export const deleteFeeGroup = (schoolId: string | number, groupId: number) =>
  axios.delete<ApiResponse<null>>(`${BASE(schoolId)}/groups/${groupId}`)

// ─── Fee Allocations ──────────────────────────────────────────────────────────
export const getFeeAllocations = (schoolId: string | number) =>
  axios.get<ApiResponse<FeeAllocationModel[]>>(`${BASE(schoolId)}/allocations`)

export const createFeeAllocation = (schoolId: string | number, payload: FeeAllocationPayload) =>
  axios.post<ApiResponse<FeeAllocationModel>>(`${BASE(schoolId)}/allocations`, payload)

export const deleteFeeAllocation = (schoolId: string | number, allocationId: number) =>
  axios.delete<ApiResponse<null>>(`${BASE(schoolId)}/allocations/${allocationId}`)

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const generateInvoices = (schoolId: string | number, payload: GenerateInvoicesPayload) =>
  axios.post<ApiResponse<{ message: string; generated: number }>>(
    `${BASE(schoolId)}/invoices/generate`,
    payload
  )

export const getInvoices = (schoolId: string | number, params?: Record<string, any>) =>
  axios.get<ApiResponse<FeeInvoiceModel[]>>(`${BASE(schoolId)}/invoices`, { params })

export const getStudentDues = (
  schoolId: string | number,
  studentId: number,
  sessionId: number
) =>
  axios.get<ApiResponse<FeeInvoiceModel[]>>(
    `${BASE(schoolId)}/students/${studentId}/sessions/${sessionId}/dues`
  )

export const getYearlyMatrix = (
  schoolId: string | number,
  studentId: number,
  sessionId: number
) =>
  axios.get<ApiResponse<any>>(
    `${BASE(schoolId)}/students/${studentId}/sessions/${sessionId}/yearly-matrix`
  )

// GET /students/:studentId/payment-history?academic_session_id=N
// Returns financial_summary + invoice list + payment transactions
export const getStudentPaymentHistory = (
  schoolId: string | number,
  studentId: number,
  sessionId: number
) =>
  axios.get<ApiResponse<any>>(
    `${BASE(schoolId)}/students/${studentId}/payment-history`,
    { params: { academic_session_id: sessionId } }
  )

// GET /fee/invoices/:id  – fetch single invoice with items + payment history
export const getInvoiceById = (schoolId: string | number, invoiceId: number) =>
  axios.get<ApiResponse<FeeInvoiceModel>>(`${BASE(schoolId)}/invoices/${invoiceId}`)

// PUT /fees/invoices/:id – update fine_amount / concession_amount on a single invoice
export const updateInvoice = (
  schoolId: string | number,
  invoiceId: number,
  payload: { fine_amount?: number; concession_amount?: number }
) =>
  axios.put<ApiResponse<FeeInvoiceModel>>(`${BASE(schoolId)}/invoices/${invoiceId}`, payload)

// ─── Payments ─────────────────────────────────────────────────────────────────
export const collectPayment = (schoolId: string | number, payload: CollectPaymentPayload) =>
  axios.post<ApiResponse<FeePaymentModel>>(`${BASE(schoolId)}/payments/collect`, payload)

export const getPayments = (schoolId: string | number, params?: Record<string, any>) =>
  axios.get<ApiResponse<FeePaymentModel[]>>(`${BASE(schoolId)}/payments`, { params })

// ─── Discounts ────────────────────────────────────────────────────────────────
export const getFeeDiscounts = (schoolId: string | number) =>
  axios.get<ApiResponse<FeeDiscountModel[]>>(`${BASE(schoolId)}/discounts`)

export const createFeeDiscount = (schoolId: string | number, payload: FeeDiscountPayload) =>
  axios.post<ApiResponse<FeeDiscountModel>>(`${BASE(schoolId)}/discounts`, payload)

export const updateFeeDiscount = (
  schoolId: string | number,
  discountId: number,
  payload: Partial<FeeDiscountPayload>
) =>
  axios.put<ApiResponse<FeeDiscountModel>>(
    `${BASE(schoolId)}/discounts/${discountId}`,
    payload
  )

export const deleteFeeDiscount = (schoolId: string | number, discountId: number) =>
  axios.delete<ApiResponse<null>>(`${BASE(schoolId)}/discounts/${discountId}`)

export const assignDiscountToStudent = (schoolId: string | number, payload: AssignDiscountPayload) =>
  axios.post<ApiResponse<StudentDiscountModel>>(`${BASE(schoolId)}/discounts/assign`, payload)

export const getStudentDiscounts = (schoolId: string | number, params?: Record<string, any>) =>
  axios.get<ApiResponse<StudentDiscountModel[]>>(`${BASE(schoolId)}/discounts/students`, { params })
