import { FC, useState, useEffect, useCallback, useRef } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { collectPayment, getStudentDues } from './core/_requests'
import { getAcademicSessions, getClasses, getClassSections } from '../academic/core/_requests'
import { getEnrollments, getStudentById } from '../students/core/_requests'
import { FeeInvoiceModel } from './core/_models'
import { extractArray, extractError } from './core/_utils'
import { StudentEnrollmentModel } from '../students/core/_models'

// ─── Constants ────────────────────────────────────────────────────────────────
const ACADEMIC_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] as const
type MonthName = typeof ACADEMIC_MONTHS[number]

const MONTH_NUM: Record<MonthName, string> = {
  Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09',
  Oct: '10', Nov: '11', Dec: '12', Jan: '01', Feb: '02', Mar: '03',
}

const PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI', 'DD']

/** Given academic session_year like "2025-26" and a month name, returns "YYYY-MM" */
function resolveMonthKey(monthName: MonthName, sessionYear: string): string {
  const parts = sessionYear.split('-')
  const startYear = parts[0] || String(new Date().getFullYear())
  const isNextYear = ['Jan', 'Feb', 'Mar'].includes(monthName)
  const year = isNextYear ? String(Number(startYear) + 1) : startYear
  return `${year}-${MONTH_NUM[monthName]}`
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const MonthlyCollectionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── Selection state ─────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [classSections, setClassSections] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollmentModel[]>([])

  const [selSession, setSelSession] = useState('')
  const [selClass, setSelClass] = useState('')
  const [selSection, setSelSection] = useState('')        // class_section_id
  const [selStudent, setSelStudent] = useState('')        // enrollment id → student_id

  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingEnroll, setLoadingEnroll] = useState(false)

  // ── Student details ─────────────────────────────────────────────────────────
  const [studentDetail, setStudentDetail] = useState<any | null>(null)
  const [enrolDetail, setEnrolDetail] = useState<StudentEnrollmentModel | null>(null)

  // ── Dues / invoices ─────────────────────────────────────────────────────────
  const [dues, setDues] = useState<FeeInvoiceModel[]>([])
  const [loadingDues, setLoadingDues] = useState(false)
  const [duesError, setDuesError] = useState<string | null>(null)

  // ── Month selection ─────────────────────────────────────────────────────────
  const [selectedMonths, setSelectedMonths] = useState<MonthName[]>([])

  // ── Payment form ────────────────────────────────────────────────────────────
  const [additionalFee, setAdditionalFee] = useState(0)
  const [concessionPct, setConcessionPct] = useState(0)
  const [amountReceived, setAmountReceived] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [bankName, setBankName] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [remark, setRemark] = useState('')

  // ── Submit state ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<any | null>(null)

  // ── Load meta ───────────────────────────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    setLoadingMeta(true)
    try {
      const [sRes, cRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
      ])
      const sess = sRes.data.success ? (sRes.data.data.sessions || []) : []
      setSessions(sess)
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      // Auto-select current session
      const cur = sess.find((s: any) => s.is_current)
      if (cur) setSelSession(String(cur.id))
    } catch { }
    finally { setLoadingMeta(false) }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  // ── Load class sections ─────────────────────────────────────────────────────
  const handleClassChange = async (classId: string) => {
    setSelClass(classId)
    setSelSection('')
    setSelStudent('')
    setClassSections([])
    setEnrollments([])
    setStudentDetail(null)
    setEnrolDetail(null)
    setDues([])
    setSelectedMonths([])
    if (!classId) return
    try {
      const { data } = await getClassSections(schoolId, classId)
      if (data.success) setClassSections(data.data.sections || [])
    } catch { }
  }

  // ── Load students in section ────────────────────────────────────────────────
  const handleSectionChange = async (sectionId: string) => {
    setSelSection(sectionId)
    setSelStudent('')
    setEnrollments([])
    setStudentDetail(null)
    setEnrolDetail(null)
    setDues([])
    setSelectedMonths([])
    if (!sectionId || !selSession) return
    setLoadingEnroll(true)
    try {
      const { data } = await getEnrollments(schoolId, {
        class_section_id: Number(sectionId),
        session_id: Number(selSession),
        status: 'Active',
        limit: 200,
      })
      if (data.success) setEnrollments(data.data.enrollments || [])
    } catch { }
    finally { setLoadingEnroll(false) }
  }

  // ── Load selected student details + dues ────────────────────────────────────
  const handleStudentChange = async (enrollId: string) => {
    setSelStudent(enrollId)
    setStudentDetail(null)
    setEnrolDetail(null)
    setDues([])
    setSelectedMonths([])
    setAdditionalFee(0)
    setConcessionPct(0)
    setAmountReceived(0)
    setSubmitError(null)
    if (!enrollId) return

    const enrol = enrollments.find(e => String(e.id) === enrollId)
    if (!enrol) return
    setEnrolDetail(enrol)

    // Load full student profile for parent details
    try {
      const { data } = await getStudentById(schoolId, enrol.student_id)
      if (data.success) setStudentDetail(data.data.student)
    } catch { }

    // Load student dues
    if (!selSession) return
    setLoadingDues(true)
    setDuesError(null)
    try {
      const { data } = await getStudentDues(schoolId, enrol.student_id, Number(selSession))
      if (data.success) setDues(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setDuesError(e.response?.data?.message || 'Failed to load dues')
    } finally { setLoadingDues(false) }
  }

  // ── Invoice map: monthKey → FeeInvoiceModel ─────────────────────────────────
  const sessionYear = sessions.find(s => String(s.id) === selSession)?.session_year || ''

  const invoiceByMonth = dues.reduce((acc, inv) => {
    // Find which month name matches this invoice_month
    for (const m of ACADEMIC_MONTHS) {
      if (resolveMonthKey(m, sessionYear) === inv.invoice_month) {
        acc[m] = inv; break
      }
    }
    return acc
  }, {} as Record<MonthName, FeeInvoiceModel>)

  // Only selectable months = those that have an invoice and are not fully paid
  const isSelectable = (m: MonthName) => {
    const inv = invoiceByMonth[m]
    return !!inv && inv.status !== 'PAID'
  }

  // ── Toggle month ────────────────────────────────────────────────────────────
  const toggleMonth = (m: MonthName) => {
    if (!isSelectable(m)) return
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  const toggleSelectAll = () => {
    const selectable = ACADEMIC_MONTHS.filter(isSelectable)
    if (selectedMonths.length === selectable.length) setSelectedMonths([])
    else setSelectedMonths(selectable)
  }

  // ── Fee breakdown matrix ────────────────────────────────────────────────────
  // All unique categories across selected month invoices
  const selectedInvoices = selectedMonths
    .map(m => invoiceByMonth[m])
    .filter(Boolean)

  const allCategoryIds = [...new Set(
    selectedInvoices.flatMap(inv => inv.items?.map(i => i.fee_category_id) ?? [])
  )]

  const getCategoryName = (catId: number) => {
    for (const inv of selectedInvoices) {
      const item = inv.items?.find(i => i.fee_category_id === catId)
      if (item?.fee_category?.name) return item.fee_category.name
    }
    return `Category #${catId}`
  }

  const getCatAmountForMonth = (catId: number, month: MonthName): number => {
    const inv = invoiceByMonth[month]
    if (!inv) return 0
    const item = inv.items?.find(i => i.fee_category_id === catId)
    return item ? Number(item.amount) : 0
  }

  const getMonthTotal = (month: MonthName): number => {
    const inv = invoiceByMonth[month]
    return inv ? Number(inv.net_amount) - Number(inv.paid_amount) : 0
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const baseFee = selectedInvoices.reduce((s, inv) => s + Number(inv.net_amount) - Number(inv.paid_amount), 0)
  const concessionAmt = Math.round(baseFee * concessionPct / 100)
  const netFee = baseFee + additionalFee - concessionAmt
  const newBalance = netFee - amountReceived

  // ── Submit payment ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selStudent || !selSession || selectedMonths.length === 0) {
      setSubmitError('Please select student and at least one month')
      return
    }
    if (amountReceived <= 0) {
      setSubmitError('Amount received must be greater than 0')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const enrol = enrollments.find(e => String(e.id) === selStudent)
      const { data } = await collectPayment(schoolId, {
        student_id: enrol!.student_id,
        academic_session_id: Number(selSession),
        amount: amountReceived,
        payment_method: paymentMode,
        payment_date: paymentDate,
        notes: remark || `Paid for: ${selectedMonths.join(', ')}${chequeNo ? ` | Cheque: ${chequeNo}` : ''}`,
      })
      if (data.success) {
        setLastReceipt(data.data)
        setShowSuccess(true)
        // Reset
        setSelectedMonths([])
        setAdditionalFee(0)
        setConcessionPct(0)
        setAmountReceived(0)
        setPaymentMode('Cash')
        setBankName('')
        setChequeNo('')
        setChequeDate('')
        setRemark('')
        // Reload dues
        if (enrol) {
          const dRes = await getStudentDues(schoolId, enrol.student_id, Number(selSession))
          if (dRes.data.success) setDues(Array.isArray(dRes.data.data) ? dRes.data.data : [])
        }
      }
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived display ─────────────────────────────────────────────────────────
  const selectedEnrol = enrollments.find(e => String(e.id) === selStudent)
  const className = selectedEnrol?.class_section?.class?.name || (selClass ? classes.find(c => String(c.id) === selClass)?.name : '')
  const sectionName = selectedEnrol?.class_section?.section?.name || ''
  const rollNo = selectedEnrol?.roll_number || ''
  const fatherName = studentDetail?.parent?.father_name || '—'
  const motherName = studentDetail?.parent?.mother_name || '—'
  const fatherPhone = studentDetail?.parent?.father_phone || studentDetail?.mobile_number || '—'
  const address = studentDetail?.address ? `${studentDetail.address.current_address || ''}, ${studentDetail.address.current_city || ''}`.trim().replace(/^,|,$/, '') : '—'

  const selectableCount = ACADEMIC_MONTHS.filter(isSelectable).length
  const allSelected = selectableCount > 0 && selectedMonths.length === selectableCount

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── TOP SELECTOR BAR ── */}
        <div className='card card-flush mb-5' style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
          <div className='card-body py-5'>
            <div className='row g-4 align-items-center'>
              <div className='col-auto'>
                <div className='d-flex align-items-center gap-2'>
                  <div className='symbol symbol-45px rounded-circle' style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className='symbol-label d-flex align-items-center justify-content-center'>
                      <i className='ki-duotone ki-wallet fs-2 text-white'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                    </div>
                  </div>
                  <div>
                    <div className='text-white fw-bolder fs-4'>Monthly Fee Collection</div>
                    <div className='text-white opacity-75 fs-8'>Select class → section → student to collect fees</div>
                  </div>
                </div>
              </div>
              <div className='col'>
                <div className='row g-3 justify-content-end align-items-end'>
                  {/* Session */}
                  <div className='col-lg-3 col-md-4'>
                    <label className='text-white opacity-75 fw-semibold fs-8 mb-1'>Academic Session</label>
                    <select className='form-select form-select-sm border-0' style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                      value={selSession} onChange={e => { setSelSession(e.target.value); setSelClass(''); setSelSection(''); setSelStudent(''); setDues([]); setSelectedMonths([]) }}>
                      <option value=''>Select session...</option>
                      {sessions.map(s => <option key={s.id} value={s.id} style={{ color: '#333' }}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
                    </select>
                  </div>
                  {/* Class */}
                  <div className='col-lg-2 col-md-3'>
                    <label className='text-white opacity-75 fw-semibold fs-8 mb-1'>Class</label>
                    <select className='form-select form-select-sm border-0' style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                      value={selClass} onChange={e => handleClassChange(e.target.value)} disabled={!selSession}>
                      <option value=''>Select class...</option>
                      {classes.map(c => <option key={c.id} value={c.id} style={{ color: '#333' }}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Section */}
                  <div className='col-lg-2 col-md-3'>
                    <label className='text-white opacity-75 fw-semibold fs-8 mb-1'>Section</label>
                    <select className='form-select form-select-sm border-0' style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                      value={selSection} onChange={e => handleSectionChange(e.target.value)} disabled={!selClass}>
                      <option value=''>Select section...</option>
                      {classSections.map(cs => <option key={cs.id} value={cs.id} style={{ color: '#333' }}>Section {cs.section?.name}</option>)}
                    </select>
                  </div>
                  {/* Student */}
                  <div className='col-lg-3 col-md-4'>
                    <label className='text-white opacity-75 fw-semibold fs-8 mb-1'>Student</label>
                    <select className='form-select form-select-sm border-0' style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                      value={selStudent} onChange={e => handleStudentChange(e.target.value)} disabled={!selSection || loadingEnroll}>
                      <option value=''>{loadingEnroll ? 'Loading students...' : 'Select student...'}</option>
                      {enrollments.map(e => (
                        <option key={e.id} value={e.id} style={{ color: '#333' }}>
                          {e.roll_number ? `[${e.roll_number}] ` : ''}{e.student?.first_name} {e.student?.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STUDENT INFORMATION CARD ── */}
        {selStudent && selectedEnrol && (
          <div className='card card-flush mb-5 border border-primary border-dashed'>
            <div className='card-body py-4'>
              <div className='row g-4'>
                {/* Date */}
                <div className='col-auto'>
                  <div className='d-flex flex-column align-items-center justify-content-center rounded px-4 py-3'
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', minWidth: 100 }}>
                    <span className='text-white fw-bolder fs-5'>{today}</span>
                  </div>
                </div>
                {/* Info Grid */}
                <div className='col'>
                  <div className='row g-2'>
                    <div className='col-md-2 col-sm-4'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Class (Sec.)</div>
                        <div className='fw-bold text-primary fs-7'>{className} {sectionName ? `(${sectionName})` : ''}</div>
                      </div>
                    </div>
                    <div className='col-md-2 col-sm-4'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Roll No.</div>
                        <div className='fw-bold text-danger fs-7'>{rollNo || '—'}</div>
                      </div>
                    </div>
                    <div className='col-md-2 col-sm-4'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Student ID</div>
                        <div className='fw-bold text-danger fs-7'>{selectedEnrol.student_id}</div>
                      </div>
                    </div>
                    <div className='col-md-4 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Name</div>
                        <div className='fw-bold text-gray-800 fs-6'>
                          {selectedEnrol.student?.first_name} {selectedEnrol.student?.last_name}
                        </div>
                      </div>
                    </div>
                    <div className='col-md-2 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Session</div>
                        <div className='fw-bold text-gray-800 fs-7'>{sessionYear}</div>
                      </div>
                    </div>

                    <div className='col-md-3 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Father</div>
                        <div className='fw-semibold text-gray-700 fs-7'>{fatherName}</div>
                      </div>
                    </div>
                    <div className='col-md-3 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Mother</div>
                        <div className='fw-semibold text-gray-700 fs-7'>{motherName}</div>
                      </div>
                    </div>
                    <div className='col-md-3 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Mobile</div>
                        <div className='fw-semibold text-gray-700 fs-7'>{fatherPhone}</div>
                      </div>
                    </div>
                    <div className='col-md-3 col-sm-6'>
                      <div className='bg-light rounded px-3 py-2'>
                        <div className='text-muted fs-9 fw-semibold mb-1'>Old Balance</div>
                        <div className='fw-bold fs-6' style={{ color: dues.some(d => d.status !== 'PAID') ? '#dc2626' : '#16a34a' }}>
                          ₹{dues.filter(d => d.status !== 'PAID').reduce((s, d) => s + Number(d.net_amount) - Number(d.paid_amount), 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    {address !== '—' && (
                      <div className='col-12'>
                        <div className='bg-light rounded px-3 py-2'>
                          <div className='text-muted fs-9 fw-semibold mb-1'>Address</div>
                          <div className='fw-semibold text-gray-700 fs-7'>{address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING DUES ── */}
        {loadingDues && (
          <div className='card card-flush mb-5'>
            <div className='card-body text-center py-8'>
              <span className='spinner-border spinner-border-lg text-primary me-3' />
              <span className='text-muted fs-5'>Loading fee details for this student...</span>
            </div>
          </div>
        )}
        {duesError && <div className='alert alert-danger mb-5'>{duesError}</div>}

        {/* ── MONTH SELECTOR ── */}
        {selStudent && !loadingDues && (
          <div className='card card-flush mb-5'>
            <div className='card-body py-5'>
              <div className='d-flex align-items-center gap-3 mb-4'>
                <h5 className='fw-bold mb-0 text-gray-800'>
                  <i className='ki-duotone ki-calendar fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
                  Select Months
                </h5>
                <span className='badge badge-light-primary'>{selectedMonths.length} selected</span>
                {dues.length === 0 && (
                  <span className='badge badge-light-success ms-auto'>No pending dues — all paid! 🎉</span>
                )}
              </div>

              {/* Month Checkboxes */}
              <div className='d-flex flex-wrap gap-2 mb-3'>
                {ACADEMIC_MONTHS.map(m => {
                  const inv = invoiceByMonth[m]
                  const selectable = isSelectable(m)
                  const isPaid = inv?.status === 'PAID'
                  const isSelected = selectedMonths.includes(m)
                  const isPartial = inv?.status === 'PARTIAL'
                  const hasInvoice = !!inv

                  return (
                    <label
                      key={m}
                      onClick={() => toggleMonth(m)}
                      className='position-relative'
                      style={{ cursor: selectable ? 'pointer' : 'default' }}
                    >
                      <input type='checkbox' className='d-none' checked={isSelected} readOnly />
                      <div className={`d-flex flex-column align-items-center justify-content-center rounded-2 px-3 py-2 fw-bold fs-7 transition
                        ${isSelected ? 'text-white' : isPaid ? 'text-success' : selectable ? 'text-gray-700' : 'text-gray-400'}
                      `}
                        style={{
                          minWidth: 58,
                          border: '2px solid',
                          borderColor: isSelected ? '#2563eb' : isPaid ? '#16a34a' : isPartial ? '#f59e0b' : hasInvoice ? '#94a3b8' : '#e2e8f0',
                          background: isSelected ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : isPaid ? '#f0fdf4' : isPartial ? '#fffbeb' : hasInvoice ? '#f8fafc' : '#f1f5f9',
                          transition: 'all 0.15s',
                        }}>
                        {m}
                        {isPaid && <i className='ki-duotone ki-check-circle fs-8 text-success mt-1'><span className='path1' /><span className='path2' /></i>}
                        {isPartial && <span className='badge badge-warning fs-9 mt-1 px-1 py-0'>P</span>}
                        {hasInvoice && !isPaid && !isPartial && (
                          <span className='fs-9 mt-1' style={{ color: '#2563eb' }}>₹{getMonthTotal(m).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Select All */}
              {selectableCount > 0 && (
                <div className='d-flex align-items-center gap-3 mt-2'>
                  <label className='d-flex align-items-center gap-2 cursor-pointer'>
                    <input type='checkbox' className='form-check-input mt-0' checked={allSelected}
                      onChange={toggleSelectAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <span className='fw-semibold fs-7 text-gray-700'>Select All Pending ({selectableCount} months)</span>
                  </label>
                  <span className='text-muted fs-8 ms-auto'>
                    <span className='badge badge-light-success me-1'><i className='ki-duotone ki-check-circle fs-7 text-success me-1'><span className='path1' /><span className='path2' /></i>Paid</span>
                    <span className='badge badge-light-warning me-1'>P = Partially Paid</span>
                    <span className='badge badge-light-primary'>Amount shows balance due</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FEE BREAKDOWN MATRIX ── */}
        {selectedMonths.length > 0 && (
          <div className='card card-flush mb-5'>
            <div className='card-header border-0 pt-5 pb-0'>
              <h5 className='card-title fw-bold text-gray-800'>
                <i className='ki-duotone ki-bill fs-2 text-info me-2'><span className='path1' /><span className='path2' /></i>
                Fee Breakdown
              </h5>
            </div>
            <div className='card-body pt-3'>
              <div className='table-responsive'>
                <table className='table align-middle table-bordered fs-7 mb-0'>
                  <thead>
                    <tr style={{ background: '#1e3a5f', color: '#fff' }}>
                      <th className='fw-bold px-4 py-3' style={{ minWidth: 180 }}>ITEM</th>
                      {selectedMonths.map(m => (
                        <th key={m} className='text-center fw-bold px-3 py-3' style={{ minWidth: 110 }}>
                          {m}{sessionYear ? ` '${resolveMonthKey(m, sessionYear).slice(2, 4)}` : ''}
                        </th>
                      ))}
                      <th className='text-end fw-bold px-4 py-3' style={{ minWidth: 110, color: '#fbbf24' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategoryIds.length === 0 ? (
                      <tr>
                        <td colSpan={selectedMonths.length + 2} className='text-center py-6 text-muted'>
                          No fee breakdown items available
                        </td>
                      </tr>
                    ) : (
                      allCategoryIds.map(catId => {
                        const rowTotal = selectedMonths.reduce((s, m) => s + getCatAmountForMonth(catId, m), 0)
                        return (
                          <tr key={catId} className='border-bottom border-gray-200'>
                            <td className='px-4 py-3 fw-semibold text-gray-800'>{getCategoryName(catId)}</td>
                            {selectedMonths.map(m => {
                              const amt = getCatAmountForMonth(catId, m)
                              return (
                                <td key={m} className='text-center py-3 text-gray-700'>
                                  {amt > 0 ? `₹${amt.toLocaleString('en-IN')}` : '—'}
                                </td>
                              )
                            })}
                            <td className='text-end px-4 py-3 fw-bold text-primary'>
                              ₹{rowTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )
                      })
                    )}

                    {/* Month Totals Row */}
                    <tr style={{ background: '#f0f7ff' }}>
                      <td className='px-4 py-3 fw-bolder text-gray-800'>Month Total</td>
                      {selectedMonths.map(m => (
                        <td key={m} className='text-center py-3 fw-bold text-primary'>
                          ₹{getMonthTotal(m).toLocaleString('en-IN')}
                        </td>
                      ))}
                      <td className='text-end px-4 py-3 fw-bolder fs-5' style={{ color: '#2563eb' }}>
                        ₹{baseFee.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENT FORM ── */}
        {selStudent && !loadingDues && (
          <div className='card card-flush'>
            <div className='card-body py-0'>

              {/* ─ Summary Bar ── */}
              <div className='row g-0 border-bottom border-gray-200'>
                {[
                  { label: 'Total Fee', value: baseFee, editable: false, color: '#1e3a5f' },
                  { label: 'Additional Fee', value: additionalFee, editable: true, color: '#0891b2', onChg: (v: number) => setAdditionalFee(v) },
                  { label: 'Concession (%)', value: concessionPct, editable: true, color: '#7c3aed', onChg: (v: number) => setConcessionPct(Math.min(100, Math.max(0, v))) },
                  { label: 'Concession Amt', value: concessionAmt, editable: false, color: '#059669' },
                  { label: 'Net Fee', value: netFee, editable: false, color: '#1e3a5f' },
                ].map(({ label, value, editable, color, onChg }) => (
                  <div key={label} className='col d-flex flex-column align-items-center justify-content-center py-4 border-end border-gray-200'>
                    <div className='fw-semibold text-muted fs-8 mb-2 text-center'>{label}</div>
                    {editable ? (
                      <input
                        type='number' min='0'
                        value={value}
                        onChange={e => onChg?.(Number(e.target.value))}
                        className='form-control form-control-sm text-center fw-bold border-0 bg-light rounded'
                        style={{ maxWidth: 100, color, fontSize: 15 }}
                      />
                    ) : (
                      <div className='fw-bolder fs-5 text-center' style={{ color }}>
                        {label === 'Concession (%)' ? `${value}%` : `₹${value.toLocaleString('en-IN')}`}
                      </div>
                    )}
                  </div>
                ))}

                {/* Amount Received */}
                <div className='col d-flex flex-column align-items-center justify-content-center py-4 border-end border-gray-200'
                  style={{ background: '#dcfce7' }}>
                  <div className='fw-semibold text-muted fs-8 mb-2'>Amount Received</div>
                  <input
                    type='number' min='0' value={amountReceived || ''}
                    onChange={e => setAmountReceived(Number(e.target.value))}
                    className='form-control form-control-sm text-center fw-bolder border-0 rounded'
                    placeholder='0'
                    style={{ maxWidth: 110, background: '#16a34a', color: '#fff', fontSize: 17 }}
                  />
                </div>

                {/* New Balance */}
                <div className='col d-flex flex-column align-items-center justify-content-center py-4'
                  style={{ background: newBalance > 0 ? '#fee2e2' : newBalance < 0 ? '#dcfce7' : '#f0f9ff' }}>
                  <div className='fw-semibold text-muted fs-8 mb-2'>New Balance</div>
                  <div className='fw-bolder fs-4'
                    style={{ color: newBalance > 0 ? '#dc2626' : newBalance < 0 ? '#16a34a' : '#1e3a5f' }}>
                    ₹{newBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* ─ Payment Details Row ── */}
              <div className='py-5 px-3'>
                <div className='row g-3 align-items-end'>
                  {/* Payment Mode */}
                  <div className='col-auto'>
                    <label className='fw-semibold text-danger fw-bold fs-7 mb-2' style={{ display: 'block' }}>
                      Payment Mode
                    </label>
                    <select className='form-select form-select-sm border-2 border-danger fw-bold'
                      style={{ minWidth: 110, color: '#dc2626' }}
                      value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                      {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Bank Name */}
                  <div className='col-md-2'>
                    <label className='fw-semibold fs-8 text-gray-600 mb-2' style={{ display: 'block' }}>Bank Name</label>
                    <input className='form-control form-control-sm form-control-solid'
                      placeholder='Bank name' value={bankName} onChange={e => setBankName(e.target.value)} />
                  </div>

                  {/* Cheque / DD No */}
                  <div className='col-md-2'>
                    <label className='fw-semibold fs-8 text-gray-600 mb-2' style={{ display: 'block' }}>Cheque / DD No.</label>
                    <input className='form-control form-control-sm form-control-solid'
                      placeholder='Cheque no.' value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
                  </div>

                  {/* Cheque Date */}
                  <div className='col-md-2'>
                    <label className='fw-semibold fs-8 text-gray-600 mb-2' style={{ display: 'block' }}>Cheque Date</label>
                    <input type='date' className='form-control form-control-sm form-control-solid'
                      value={chequeDate} onChange={e => setChequeDate(e.target.value)} />
                  </div>

                  {/* Payment Date */}
                  <div className='col-md-2'>
                    <label className='fw-semibold fs-8 text-gray-600 mb-2' style={{ display: 'block' }}>Payment Date</label>
                    <input type='date' className='form-control form-control-sm form-control-solid'
                      value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                  </div>

                  {/* Remark */}
                  <div className='col-md-2'>
                    <label className='fw-semibold fs-8 text-gray-600 mb-2' style={{ display: 'block' }}>Remark</label>
                    <input className='form-control form-control-sm form-control-solid'
                      placeholder='Remark...' value={remark} onChange={e => setRemark(e.target.value)} />
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <div className='alert alert-danger d-flex align-items-center gap-2 py-3 mt-4'>
                    <i className='ki-duotone ki-information-4 fs-3 text-danger'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                    {submitError}
                  </div>
                )}

                {/* Submit Button */}
                <div className='mt-5'>
                  <button
                    className='btn btn-lg w-100 fw-bolder text-white fs-5'
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '14px',
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
                      opacity: submitting || selectedMonths.length === 0 || amountReceived <= 0 ? 0.6 : 1,
                    }}
                    onClick={handleSubmit}
                    disabled={submitting || selectedMonths.length === 0 || amountReceived <= 0}
                  >
                    {submitting ? (
                      <><span className='spinner-border spinner-border-sm me-2' />Processing Payment...</>
                    ) : (
                      <><i className='ki-duotone ki-check-circle fs-2 me-2 text-white'><span className='path1' /><span className='path2' /></i>
                        COLLECT PAYMENT — ₹{amountReceived.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>

                {/* UPI strip */}
                <div className='d-flex align-items-center justify-content-center mt-4 rounded py-3 px-5 gap-4'
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                  <i className='ki-duotone ki-barcode fs-2x text-white'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /><span className='path6' /><span className='path7' /></i>
                  <span className='text-white fw-semibold fs-6'>Pay via UPI — <span className='text-warning'>school@upi</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!selStudent && !loadingMeta && (
          <div className='card card-flush'>
            <div className='card-body d-flex flex-column align-items-center justify-content-center py-20 text-center'>
              <div className='mb-6' style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className='ki-duotone ki-wallet fs-4x text-primary'><span className='path1' /><span className='path2' /><span className='path3' /></i>
              </div>
              <h4 className='fw-bold text-gray-700 mb-2'>Start Fee Collection</h4>
              <p className='text-muted fs-6 mb-0 mx-auto' style={{ maxWidth: 380 }}>
                Select an <strong>Academic Session</strong>, then <strong>Class</strong>, then <strong>Section</strong>, and finally the <strong>Student</strong> above to view their pending fees and collect payment.
              </p>
              <div className='d-flex gap-3 mt-8 flex-wrap justify-content-center'>
                {[
                  { icon: 'ki-duotone ki-book', label: 'Select Session & Class', color: 'primary' },
                  { icon: 'ki-duotone ki-calendar', label: 'Pick Months to Pay', color: 'info' },
                  { icon: 'ki-duotone ki-dollar', label: 'Enter Amount & Collect', color: 'success' },
                ].map(({ icon, label, color }) => (
                  <div key={label} className={`d-flex align-items-center gap-2 bg-light-${color} rounded px-4 py-2`}>
                    <i className={`${icon} fs-3 text-${color}`}><span className='path1' /><span className='path2' /></i>
                    <span className={`fw-semibold text-${color} fs-7`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </Content>

      {/* ── SUCCESS RECEIPT MODAL ── */}
      <Modal show={showSuccess} onHide={() => setShowSuccess(false)} centered>
        <Modal.Body className='py-10 px-10 text-center'>
          <div className='symbol symbol-90px mx-auto mb-5 rounded-circle'
            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <div className='symbol-label d-flex align-items-center justify-content-center'>
              <i className='ki-duotone ki-check-circle fs-4x text-success'><span className='path1' /><span className='path2' /></i>
            </div>
          </div>
          <h3 className='fw-bold text-gray-900 mb-2'>Payment Successful!</h3>
          <p className='text-muted mb-5'>Fee collected successfully for {selectedEnrol?.student?.first_name} {selectedEnrol?.student?.last_name}</p>

          {lastReceipt && (
            <div className='bg-light rounded-2 p-5 text-start mb-5'>
              <div className='d-flex justify-content-between py-2 border-bottom border-gray-200'>
                <span className='text-muted fs-7'>Receipt No.</span>
                <span className='fw-bold'>TXN-{lastReceipt.id}</span>
              </div>
              <div className='d-flex justify-content-between py-2 border-bottom border-gray-200'>
                <span className='text-muted fs-7'>Amount Collected</span>
                <span className='fw-bolder text-success fs-5'>₹{Number(lastReceipt.amount_paid).toLocaleString('en-IN')}</span>
              </div>
              <div className='d-flex justify-content-between py-2 border-bottom border-gray-200'>
                <span className='text-muted fs-7'>Payment Mode</span>
                <span className='fw-bold'>{lastReceipt.payment_mode}</span>
              </div>
              <div className='d-flex justify-content-between py-2'>
                <span className='text-muted fs-7'>Date</span>
                <span className='fw-bold'>{lastReceipt.payment_date ? new Date(lastReceipt.payment_date).toLocaleDateString('en-IN') : '—'}</span>
              </div>
            </div>
          )}

          <button className='btn btn-success w-100 fw-bold' onClick={() => setShowSuccess(false)}>
            Collect Next Payment
          </button>
        </Modal.Body>
      </Modal>
    </>
  )
}

const MonthlyCollectionWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Fees', path: '/fees/collection', isActive: false },
      { title: 'Monthly Collection', path: '/fees/monthly', isActive: true }
    ]}>
      Monthly Fee Collection
    </PageTitle>
    <MonthlyCollectionPage />
  </>
)

export { MonthlyCollectionWrapper }
