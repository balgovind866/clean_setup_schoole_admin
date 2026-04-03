import { FC, useState, useEffect, useCallback, useMemo } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import clsx from 'clsx'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { collectPayment, getYearlyMatrix, getInvoiceById, updateInvoice } from './core/_requests'
import { FeeInvoiceModel } from './core/_models'
import { getAcademicSessions, getClasses, getClassSections } from '../academic/core/_requests'
import { getEnrollments, getStudentById } from '../students/core/_requests'
import { YearlyMatrixResponse, YearlyMatrixItem } from './core/_models'
import { StudentEnrollmentModel } from '../students/core/_models'

// ─── Render helper: Annual / One-time rows ─────────────────────────────────────
function AnnualRows({
  items,
  selectedAnnualCats,
  toggleAnnualCat,
  tableCols,
}: {
  items: YearlyMatrixItem[]
  selectedAnnualCats: number[]
  toggleAnnualCat: (id: number) => void
  tableCols: string[]
}) {
  return (
    <>
      {items.map(item => {
        const isSelected = selectedAnnualCats.includes(item.category_id)
        // Check if already fully paid in any applicable month
        const isFullyPaid = Object.values(item.months).some(cell => cell.status === 'PAID' && cell.applicable)
        const colCount = tableCols.length + 1 // item col + month cols

        return (
          <tr key={item.category_id} className='border-bottom border-gray-100'>
            <td className='ps-4 py-3' style={{ minWidth: 160 }}>
              <div className='fw-bold text-gray-800 d-flex align-items-center gap-2 flex-wrap'>
                {item.category_name}
                <span className='badge badge-light-warning px-2 py-1' style={{ fontSize: '0.6rem' }}>
                  {item.frequency === 'ONE_TIME' ? 'One-Time' : 'Annual'}
                </span>
              </div>
            </td>
            {tableCols.length > 0 ? (
              tableCols.map((m, idx) => {
                const cell = item.months[m]
                const applicable = cell?.applicable && cell.amount > 0
                if (!applicable) return <td key={m} className='text-center py-3'><span className='text-gray-300'>—</span></td>
                // Only show checkbox in first applicable column
                const isFirstApplicable = tableCols.slice(0, idx).every(prev => !item.months[prev]?.applicable)
                if (!isFirstApplicable) return <td key={m} className='text-center py-3'><span className='text-gray-300'>—</span></td>
                return (
                  <td key={m} className='text-center py-3'>
                    <label className='d-inline-flex align-items-center gap-2 cursor-pointer p-2 rounded border border-gray-100 shadow-xs'
                      onClick={() => !isFullyPaid && toggleAnnualCat(item.category_id)}>
                      <input type='checkbox' className='form-check-input h-15px w-15px mt-0 cursor-pointer'
                        checked={isSelected || isFullyPaid} disabled={isFullyPaid} readOnly />
                      <span className={clsx('fw-bolder', isFullyPaid ? 'text-success text-decoration-line-through' : isSelected ? 'text-primary' : 'text-gray-700')}>
                        ₹{item.total.toLocaleString('en-IN')}
                      </span>
                      {isFullyPaid && <span className='badge badge-light-success px-2 ms-1' style={{ fontSize: '0.6rem' }}>PAID</span>}
                    </label>
                  </td>
                )
              })
            ) : (
              // No months selected — show annual item spanning a single wide cell
              <td className='py-3 ps-4'>
                <label className='d-inline-flex align-items-center gap-2 cursor-pointer p-2 rounded border border-gray-100 shadow-xs'
                  onClick={() => !isFullyPaid && toggleAnnualCat(item.category_id)}>
                  <input type='checkbox' className='form-check-input h-15px w-15px mt-0 cursor-pointer'
                    checked={isSelected || isFullyPaid} disabled={isFullyPaid} readOnly />
                  <span className={clsx('fw-bolder', isFullyPaid ? 'text-success text-decoration-line-through' : isSelected ? 'text-primary' : 'text-gray-700')}>
                    ₹{item.total.toLocaleString('en-IN')}
                  </span>
                  {isFullyPaid && <span className='badge badge-light-success px-2 ms-1' style={{ fontSize: '0.6rem' }}>PAID</span>}
                </label>
              </td>
            )}
          </tr>
        )
      })}
    </>
  )
}

// ─── Render helper: Monthly rows ───────────────────────────────────────────────
function MonthlyRows({
  items,
  tableCols,
  checkedCells,
  toggleMonthlyCell,
}: {
  items: YearlyMatrixItem[]
  tableCols: string[]
  checkedCells: Record<string, boolean>
  toggleMonthlyCell: (id: number, m: string) => void
}) {
  return (
    <>
      {items.map(item => (
        <tr key={item.category_id} className='border-bottom border-gray-100'>
          <td className='ps-4 py-3' style={{ minWidth: 160 }}>
            <div className='fw-bold text-gray-700'>{item.category_name}</div>
          </td>
          {tableCols.map(m => {
            const cell = item.months[m]
            const isApplicable = cell?.applicable
            const isPaid = cell?.status === 'PAID'
            const amt = cell?.amount || 0
            const isChecked = !!checkedCells[`${item.category_id}__${m}`]

            return (
              <td key={m} className='text-center py-3'>
                {isApplicable ? (
                  <label
                    className='d-inline-flex align-items-center gap-1 cursor-pointer p-1 rounded'
                    onClick={() => !isPaid && toggleMonthlyCell(item.category_id, m)}
                  >
                    <input
                      type='checkbox'
                      className={clsx('form-check-input h-15px w-15px mt-0', isPaid ? 'border-success' : 'border-gray-400')}
                      checked={isChecked || isPaid}
                      readOnly
                      disabled={isPaid}
                    />
                    <span className={clsx('fw-bold ms-1 fs-8',
                      isPaid ? 'text-success text-decoration-line-through opacity-75' :
                        isChecked ? 'text-primary' : 'text-gray-600'
                    )}>
                      {amt > 0 ? `₹${amt}` : '—'}
                    </span>
                  </label>
                ) : (
                  <span className='text-gray-300 fw-semibold fs-8'>—</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const FeeCollectionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // Filters
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollmentModel[]>([])

  const [selSession, setSelSession] = useState('')
  const [selClass, setSelClass] = useState('')
  const [selSection, setSelSection] = useState('')
  const [selStudent, setSelStudent] = useState('')

  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingEnroll, setLoadingEnroll] = useState(false)
  const [loadingMatrix, setLoadingMatrix] = useState(false)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  // Student data
  const [studentDetail, setStudentDetail] = useState<any | null>(null)
  const [enrolDetail, setEnrolDetail] = useState<StudentEnrollmentModel | null>(null)

  // Yearly matrix from API
  const [yearlyMatrix, setYearlyMatrix] = useState<YearlyMatrixResponse | null>(null)
  const [oldBalance, setOldBalance] = useState(0)

  // Selection
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [checkedCells, setCheckedCells] = useState<Record<string, boolean>>({})
  const [selectedAnnualCats, setSelectedAnnualCats] = useState<number[]>([])

  // Payment form
  const [additionalFee, setAdditionalFee] = useState(0)
  const [concessionPct, setConcessionPct] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [bankName, setBankName] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [remark, setRemark] = useState('')
  const [sendSMS, setSendSMS] = useState(true)
  const [sendWhatsApp, setSendWhatsApp] = useState(true)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<any | null>(null)

  // ── Invoice Edit Modal (Fine / Concession per invoice) ──────────────────────
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceModalMonth, setInvoiceModalMonth] = useState('')
  const [invoiceDetail, setInvoiceDetail] = useState<FeeInvoiceModel | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [editFine, setEditFine] = useState<number>(0)
  const [editConcession, setEditConcession] = useState<number>(0)
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [invoiceSaveMsg, setInvoiceSaveMsg] = useState<string | null>(null)

  // Load sessions + classes on mount
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
      const cur = sess.find((s: any) => s.is_current)
      if (cur) setSelSession(String(cur.id))
    } catch { }
    finally { setLoadingMeta(false) }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  const handleClassChange = async (classId: string) => {
    setSelClass(classId); setSelSection(''); setSelStudent('')
    setSections([]); setEnrollments([])
    resetAll()
    if (!classId) return
    try {
      const { data } = await getClassSections(schoolId, classId)
      if (data.success) setSections(data.data.sections || [])
    } catch { }
  }

  const handleSectionChange = async (sectionId: string) => {
    setSelSection(sectionId); setSelStudent('')
    setEnrollments([])
    resetAll()
    if (!sectionId || !selSession) return
    setLoadingEnroll(true)
    try {
      const { data } = await getEnrollments(schoolId, {
        class_section_id: Number(sectionId),
        session_id: Number(selSession),
        status: 'Active', limit: 200,
      })
      if (data.success) setEnrollments(data.data.enrollments || [])
    } catch { }
    finally { setLoadingEnroll(false) }
  }

  const handleStudentChange = async (enrollId: string) => {
    setSelStudent(enrollId)
    resetAll()
    if (!enrollId) return
    const enrol = enrollments.find(e => String(e.id) === enrollId)
    if (!enrol) return
    setEnrolDetail(enrol)
    setLoadingMatrix(true)
    try {
      const [profileRes, matrixRes] = await Promise.all([
        getStudentById(schoolId, enrol.student_id),
        getYearlyMatrix(schoolId, enrol.student_id, Number(selSession)),
      ])
      if (profileRes.data.success) setStudentDetail(profileRes.data.data.student)
      if (matrixRes.data.success) {
        setYearlyMatrix(matrixRes.data.data)
        setOldBalance(0) // update if backend provides it
      }
    } catch (e: any) {
      setMatrixError(e.response?.data?.message || 'Failed to load fee matrix')
    } finally { setLoadingMatrix(false) }
  }

  const resetAll = () => {
    setStudentDetail(null); setEnrolDetail(null); setYearlyMatrix(null)
    setMatrixError(null); setSelectedMonths([]); setCheckedCells({})
    setSelectedAnnualCats([])
    setAdditionalFee(0); setConcessionPct(0)
    setSubmitError(null); setBankName(''); setChequeNo(''); setChequeDate('')
    setReferenceNo(''); setRemark('')
  }

  // ── Open Invoice Edit Modal: GET /invoices/:id ──────────────────────────────
  const openInvoiceEdit = async (month: string) => {
    // Find the invoice_id for this month from yearlyMatrix
    // We look across all items for the first non-null invoice_id for this month
    let invoiceId: number | null = null
    for (const item of yearlyMatrix?.items || []) {
      const cell = item.months[month]
      if (cell?.invoice_id) { invoiceId = cell.invoice_id; break }
    }
    if (!invoiceId) {
      // Invoice not yet generated — cannot edit fine/concession yet
      setInvoiceModalMonth(month)
      setInvoiceDetail(null)
      setEditFine(0); setEditConcession(0)
      setInvoiceSaveMsg('Invoice not yet generated for this month. Generate invoices first.')
      setInvoiceModalOpen(true)
      return
    }
    setInvoiceModalMonth(month)
    setInvoiceLoading(true)
    setInvoiceModalOpen(true)
    setInvoiceSaveMsg(null)
    try {
      const { data } = await getInvoiceById(schoolId, invoiceId)
      if (data.success) {
        setInvoiceDetail(data.data)
        setEditFine(Number(data.data.fine_amount) || 0)
        setEditConcession(Number(data.data.concession_amount) || 0)
      }
    } catch (e: any) {
      setInvoiceSaveMsg(e.response?.data?.message || 'Failed to load invoice.')
    } finally { setInvoiceLoading(false) }
  }

  // ── Save Invoice Fine/Concession: PUT /invoices/:id ─────────────────────────
  const saveInvoiceEdit = async () => {
    if (!invoiceDetail) return
    setSavingInvoice(true); setInvoiceSaveMsg(null)
    try {
      const { data } = await updateInvoice(schoolId, invoiceDetail.id, {
        fine_amount: editFine,
        concession_amount: editConcession,
      })
      if (data.success) {
        setInvoiceSaveMsg('✓ Saved! Fine & Concession updated successfully.')
        setInvoiceDetail(data.data)
        // Refresh the matrix so totals reflect updated net_amount
        if (enrolDetail) {
          const matrixRes = await getYearlyMatrix(schoolId, enrolDetail.student_id, Number(selSession))
          if (matrixRes.data.success) setYearlyMatrix(matrixRes.data.data)
        }
      } else {
        setInvoiceSaveMsg(data.message || 'Update failed.')
      }
    } catch (e: any) {
      setInvoiceSaveMsg(e.response?.data?.message || 'Update failed.')
    } finally { setSavingInvoice(false) }
  }

  // Categorize matrix items
  // MONTHLY + QUARTERLY both use per-month applicable flags → go into the monthly grid
  // ANNUALLY + ONE_TIME → go into the annual/one-time section
  const monthlyItems = useMemo((): YearlyMatrixItem[] =>
    yearlyMatrix?.items.filter(i => i.frequency === 'MONTHLY' || i.frequency === 'QUARTERLY') || []
    , [yearlyMatrix])

  const annualItems = useMemo((): YearlyMatrixItem[] =>
    yearlyMatrix?.items.filter(i => i.frequency === 'ONE_TIME' || i.frequency === 'ANNUALLY') || []
    , [yearlyMatrix])

  const MATRIX_MONTHS = yearlyMatrix?.months || []

  // Month aggregate status (based only on monthly items)
  const getMonthAggregateStatus = (m: string) => {
    if (!yearlyMatrix) return 'none'
    let totalApplicable = 0
    let paidCount = 0
    for (const item of monthlyItems) {
      const cell = item.months[m]
      if (cell && cell.applicable) {
        totalApplicable++
        if (cell.status === 'PAID') paidCount++
      }
    }
    if (totalApplicable === 0) return 'none'
    if (paidCount === totalApplicable) return 'paid'
    return 'pending'
  }

  const getMonthPendingAmount = (m: string) => {
    let total = 0
    if (!yearlyMatrix) return 0
    for (const item of monthlyItems) {
      const cell = item.months[m]
      if (cell && cell.applicable && cell.status !== 'PAID') total += cell.amount
    }
    return total
  }

  // Toggle individual month pill
  const toggleMonth = (m: string) => {
    const status = getMonthAggregateStatus(m)
    if (status === 'none' || status === 'paid') return

    setSelectedMonths(prev => {
      if (prev.includes(m)) {
        setCheckedCells(c => {
          const next = { ...c }
          monthlyItems.forEach(item => { delete next[`${item.category_id}__${m}`] })
          return next
        })
        return prev.filter(x => x !== m)
      } else {
        setCheckedCells(c => {
          const next = { ...c }
          monthlyItems.forEach(item => {
            const cell = item.months[m]
            if (cell && cell.applicable && cell.status !== 'PAID') {
              next[`${item.category_id}__${m}`] = true
            }
          })
          return next
        })
        return [...prev, m]
      }
    })
  }

  const toggleAllPendingMonths = () => {
    const pending = MATRIX_MONTHS.filter(m => getMonthAggregateStatus(m) === 'pending')
    if (selectedMonths.length === pending.length) {
      setSelectedMonths([])
      setCheckedCells({})
    } else {
      setSelectedMonths(pending)
      const next: Record<string, boolean> = {}
      pending.forEach(m => {
        monthlyItems.forEach(item => {
          const cell = item.months[m]
          if (cell && cell.applicable && cell.status !== 'PAID') {
            next[`${item.category_id}__${m}`] = true
          }
        })
      })
      setCheckedCells(next)
    }
  }

  const toggleMonthlyCell = (categoryId: number, m: string) => {
    const item = monthlyItems.find(i => i.category_id === categoryId)
    const cell = item?.months[m]
    if (!cell || !cell.applicable || cell.status === 'PAID') return

    const key = `${categoryId}__${m}`
    setCheckedCells(prev => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
        const monthStillHasChecked = monthlyItems.some(i => next[`${i.category_id}__${m}`])
        if (!monthStillHasChecked) setSelectedMonths(p => p.filter(x => x !== m))
      } else {
        next[key] = true
        if (!selectedMonths.includes(m)) setSelectedMonths(p => [...p, m])
      }
      return next
    })
  }

  const toggleAnnualCat = (categoryId: number) => {
    setSelectedAnnualCats(prev =>
      prev.includes(categoryId) ? prev.filter(x => x !== categoryId) : [...prev, categoryId]
    )
  }

  // Totals calculation
  const totals = useMemo(() => {
    let monthlySubtotal = 0
    monthlyItems.forEach(item => {
      MATRIX_MONTHS.forEach(m => {
        if (checkedCells[`${item.category_id}__${m}`]) {
          monthlySubtotal += item.months[m]?.amount || 0
        }
      })
    })

    let annualSubtotal = 0
    annualItems.forEach(item => {
      if (selectedAnnualCats.includes(item.category_id)) {
        annualSubtotal += item.total
      }
    })

    const subtotal = monthlySubtotal + annualSubtotal
    const totalFee = subtotal + additionalFee
    const concessionAmt = (totalFee * concessionPct) / 100
    const netFee = Math.max(0, totalFee - concessionAmt)
    const totalReceivable = netFee + oldBalance

    return { monthlySubtotal, annualSubtotal, subtotal, totalFee, concessionAmt, netFee, totalReceivable }
  }, [checkedCells, monthlyItems, selectedAnnualCats, annualItems, MATRIX_MONTHS, additionalFee, concessionPct, oldBalance])

  const getMonthColTotal = (m: string): number => {
    let sum = 0
    monthlyItems.forEach(item => {
      if (checkedCells[`${item.category_id}__${m}`]) {
        sum += item.months[m]?.amount || 0
      }
    })
    return sum
  }

  const anySelected = selectedMonths.length > 0 || selectedAnnualCats.length > 0

  const handleSubmit = async () => {
    if (!enrolDetail || !selSession) return
    if (totals.totalReceivable <= 0) { setSubmitError('No fee selected.'); return }
    setSubmitting(true); setSubmitError(null)

    // ── Build invoice_payments from checked cells + selected annual items ────────────
    // Each invoice may have multiple fee items (e.g. Tuition + Transport in May).
    // We group by invoice_id and sum amount_applied.
    const invoiceMap = new Map<number, number>()

    // 1. Monthly / Quarterly checked cells
    monthlyItems.forEach(item => {
      MATRIX_MONTHS.forEach(m => {
        if (checkedCells[`${item.category_id}__${m}`]) {
          const cell = item.months[m]
          if (cell?.invoice_id) {
            const prev = invoiceMap.get(cell.invoice_id) || 0
            invoiceMap.set(cell.invoice_id, prev + (cell.amount || 0))
          }
        }
      })
    })

    // 2. Annual / One-time selected items
    annualItems.forEach(item => {
      if (selectedAnnualCats.includes(item.category_id)) {
        // Find the applicable month cell to get the invoice_id
        for (const m of MATRIX_MONTHS) {
          const cell = item.months[m]
          if (cell?.applicable && cell.invoice_id) {
            const prev = invoiceMap.get(cell.invoice_id) || 0
            invoiceMap.set(cell.invoice_id, prev + (cell.amount || 0))
            break
          }
        }
      }
    })

    const invoice_payments = Array.from(invoiceMap.entries()).map(
      ([invoice_id, amount_applied]) => ({ invoice_id, amount_applied })
    )

    if (invoice_payments.length === 0) {
      setSubmitError('No valid invoices found for selected items. Generate invoices first.')
      setSubmitting(false)
      return
    }

    // ── Build notes string ────────────────────────────────────────────────
    const monthStrs  = selectedMonths.join(', ')
    const annualStrs = annualItems.filter(i => selectedAnnualCats.includes(i.category_id)).map(i => i.category_name).join(', ')

    try {
      const { data } = await collectPayment(schoolId, {
        student_id: enrolDetail.student_id,
        academic_session_id: Number(selSession),
        amount: totals.totalReceivable,
        payment_method: paymentMode.toUpperCase(),
        payment_date: chequeDate || new Date().toISOString().slice(0, 10),
        reference_number: referenceNo || undefined,
        notes: [
          monthStrs  ? `Months: ${monthStrs}`   : '',
          annualStrs ? `Annual: ${annualStrs}`  : '',
          chequeNo   ? `Cheque: ${chequeNo}`    : '',
          bankName   ? `Bank: ${bankName}`      : '',
          remark,
        ].filter(Boolean).join(' | '),
        invoice_payments,
      })
      if (data.success) {
        setLastReceipt(data.data)
        setShowModal(true)
        setSelectedMonths([]); setCheckedCells({}); setSelectedAnnualCats([])
        setAdditionalFee(0); setConcessionPct(0); setRemark('')
        setBankName(''); setChequeNo(''); setChequeDate(''); setReferenceNo('')
        // Reload matrix after payment
        const matrixRes = await getYearlyMatrix(schoolId, enrolDetail.student_id, Number(selSession))
        if (matrixRes.data.success) setYearlyMatrix(matrixRes.data.data)
      } else {
        setSubmitError(data.message || 'Payment failed.')
      }
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Payment failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  // Display derived values
  const sessionYear = sessions.find(s => String(s.id) === selSession)?.session_year || ''
  const selectedEnrol = enrollments.find(e => String(e.id) === selStudent)
  const stName = `${selectedEnrol?.student?.first_name || ''} ${selectedEnrol?.student?.last_name || ''}`.trim().toUpperCase()
  const className = selectedEnrol?.class_section?.class?.name || ''
  const sectionName = selectedEnrol?.class_section?.section?.name || ''
  const fatherName = studentDetail?.parent?.father_name?.toUpperCase() || '—'
  const motherName = studentDetail?.parent?.mother_name?.toUpperCase() || '—'
  const mobile = studentDetail?.mobile_number || studentDetail?.parent?.father_phone || '—'
  const address = studentDetail?.address
    ? [studentDetail.address.current_address, studentDetail.address.current_city].filter(Boolean).join(', ')
    : '—'
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const pendingMonths = MATRIX_MONTHS.filter(m => getMonthAggregateStatus(m) === 'pending')
  const allPendingSelected = pendingMonths.length > 0 && selectedMonths.length === pendingMonths.length
  // Columns shown in table = only selected months (for monthly fee table)
  const tableCols = MATRIX_MONTHS.filter(m => selectedMonths.includes(m))

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Filter Bar ── */}
        <div className='card card-flush shadow-xs mb-6 border-0'>
          <div className='card-body py-4'>
            <div className='row g-3 align-items-end'>
              <div className='col-lg-3 col-md-6'>
                <label className='fw-bold fs-8 text-uppercase text-muted mb-1 d-block'>Session</label>
                <select className='form-select form-select-sm form-select-solid'
                  value={selSession}
                  onChange={e => { setSelSession(e.target.value); setSelClass(''); setSelSection(''); setSelStudent(''); resetAll() }}>
                  <option value=''>Select session...</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year}{s.is_current ? ' ★' : ''}</option>)}
                </select>
              </div>
              <div className='col-lg-2 col-md-3'>
                <label className='fw-bold fs-8 text-uppercase text-muted mb-1 d-block'>Class</label>
                <select className='form-select form-select-sm form-select-solid'
                  value={selClass} onChange={e => handleClassChange(e.target.value)} disabled={!selSession}>
                  <option value=''>Select class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='col-lg-2 col-md-3'>
                <label className='fw-bold fs-8 text-uppercase text-muted mb-1 d-block'>Section</label>
                <select className='form-select form-select-sm form-select-solid'
                  value={selSection} onChange={e => handleSectionChange(e.target.value)} disabled={!selClass}>
                  <option value=''>Select section...</option>
                  {sections.map(cs => <option key={cs.id} value={cs.id}>{cs.section?.name}</option>)}
                </select>
              </div>
              <div className='col'>
                <label className='fw-bold fs-8 text-uppercase text-muted mb-1 d-block'>Student</label>
                <select className='form-select form-select-sm form-select-solid'
                  value={selStudent} onChange={e => handleStudentChange(e.target.value)} disabled={!selSection || loadingEnroll}>
                  <option value=''>{loadingEnroll ? 'Loading students...' : 'Select student...'}</option>
                  {enrollments.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.roll_number ? `[${e.roll_number}] ` : ''}{e.student?.first_name} {e.student?.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!selStudent && !loadingMatrix && (
          <div className='card card-flush border-0 shadow-xs'>
            <div className='card-body py-20 text-center'>
              <i className='bi bi-person-check text-gray-300' style={{ fontSize: '5rem' }}></i>
              <h5 className='fw-bold text-gray-600 mt-4 mb-1'>Select a Student</h5>
              <p className='text-muted fs-7'>Choose session → class → section → student to view their annual fee matrix.</p>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loadingMatrix && (
          <div className='card card-flush border-0 shadow-xs'>
            <div className='card-body py-16 text-center'>
              <div className='spinner-border text-primary mb-3'></div>
              <div className='text-muted fw-semibold'>Loading fee matrix...</div>
            </div>
          </div>
        )}

        {matrixError && (
          <div className='alert alert-danger fw-semibold mb-4'>
            <i className='bi bi-exclamation-triangle me-2'></i>{matrixError}
          </div>
        )}

        {/* ── Main Receipt Card ── */}
        {selStudent && yearlyMatrix && !loadingMatrix && (
          <div className='card card-flush border-0 shadow-sm overflow-hidden'>

            {/* Purple gradient header */}
            <div className='card-header min-h-70px border-0'
              style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
              <div className='card-title'>
                <div className='d-flex align-items-center gap-3'>
                  <i className='bi bi-receipt text-white fs-2'></i>
                  <h2 className='text-white fw-bolder mb-0 fs-4'>Fee Receipt — {stName || 'Student'}</h2>
                </div>
              </div>
              <div className='card-toolbar'>
                <span className='badge fw-bold px-4 py-2 fs-8'
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20 }}>
                  Session: {sessionYear}
                </span>
              </div>
            </div>

            <div className='card-body px-8 py-7'>

              {/* ─ 1. Student info grid ─ */}
              <div className='rounded-2 border border-gray-200 mb-7' style={{ background: '#f8f9fb' }}>
                {/* Row 1 */}
                <div className='row g-0 border-bottom border-gray-200'>
                  {([
                    { label: 'Date', value: <span className='badge badge-primary px-3 py-2 fw-bold fs-8'>{today}</span> },
                    { label: 'Class (Sec.)', value: `${className}${sectionName ? ` (${sectionName})` : ''}` },
                    { label: 'Reg.', value: enrolDetail?.student_id },
                    { label: 'SID', value: enrolDetail?.student_id },
                    { label: 'Roll No.', value: enrolDetail?.roll_number || '—' },
                  ] as const).map(({ label, value }) => (
                    <div key={label} className='col py-4 px-4 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>{label}</div>
                      <div className='fw-bolder text-gray-800 fs-7'>{value}</div>
                    </div>
                  ))}
                </div>
                {/* Row 2 */}
                <div className='row g-0 border-bottom border-gray-200'>
                  {([
                    { label: 'Name', value: stName },
                    { label: 'Father', value: fatherName },
                    { label: 'Mother', value: motherName },
                  ] as const).map(({ label, value }) => (
                    <div key={label} className='col-4 py-4 px-4 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>{label}</div>
                      <div className='fw-bolder text-gray-800 fs-7'>{value}</div>
                    </div>
                  ))}
                </div>
                {/* Row 3 */}
                <div className='row g-0 border-bottom border-gray-200'>
                  <div className='col-4 py-4 px-4 border-end border-gray-200'>
                    <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>Route</div>
                    <div className='fw-bold text-gray-800 fs-7'>—</div>
                  </div>
                  <div className='col-4 py-4 px-4 border-end border-gray-200'>
                    <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>Mobile</div>
                    <div className='fw-bold text-gray-800 fs-7'>{mobile}</div>
                  </div>
                  <div className='col-4 py-4 px-4'>
                    <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>Old Balance</div>
                    <div className={clsx('fw-bolder fs-6', oldBalance > 0 ? 'text-danger' : 'text-success')}>
                      ₹{oldBalance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                {/* Row 4 */}
                <div className='py-4 px-4'>
                  <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>Address</div>
                  <div className='fw-semibold text-gray-700 fs-7'>{address}</div>
                </div>
              </div>

              {/* ─ 2. Month pills ─ */}
              <div className='mb-6'>
                <div className='d-flex align-items-center justify-content-between mb-4'>
                  <div className='d-flex align-items-center gap-2'>
                    <span className='fs-4'>📅</span>
                    <span className='fw-bolder text-gray-800 fs-6'>Select Months</span>
                    {monthlyItems.length === 0 && <span className='badge badge-light-warning ms-2'>No monthly fees</span>}
                  </div>
                  {pendingMonths.length > 0 && (
                    <button
                      className={clsx('btn btn-sm rounded-pill fw-bold px-5', allPendingSelected ? 'btn-primary' : 'btn-light-primary')}
                      onClick={toggleAllPendingMonths}
                    >
                      {allPendingSelected ? '✓ Selected All' : '✓ Select All'}
                    </button>
                  )}
                </div>
                <div className='d-flex flex-wrap gap-2'>
                  {MATRIX_MONTHS.map(m => {
                    const status = getMonthAggregateStatus(m)
                    const isSelected = selectedMonths.includes(m)
                    const isPaid = status === 'paid'
                    const isApplicable = status !== 'none'
                    const pendingAmt = getMonthPendingAmount(m)

                    return (
                      <button
                        key={m}
                        className={clsx(
                          'btn btn-sm rounded-pill fw-bold px-4 py-2 fs-8 border',
                          isPaid ? 'btn-light-success text-success border-success' :
                            isSelected ? 'btn-primary border-primary text-white' :
                              isApplicable ? 'btn-light border-gray-300 text-gray-600' :
                                'btn-light border-gray-200 text-gray-400 opacity-50'
                        )}
                        style={{ minWidth: 60, cursor: (isPaid || !isApplicable) ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                        onClick={() => toggleMonth(m)}
                        disabled={isPaid || !isApplicable}
                        title={isPaid ? 'Paid' : !isApplicable ? 'Not Applicable' : `₹${pendingAmt} pending`}
                      >
                        {isPaid ? '✓ ' : ''}{m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ─ 3. Fee Details Table ─ */}
              <div className='mb-7'>
                <div className='d-flex align-items-center gap-2 mb-4'>
                  <span className='fs-4'>📋</span>
                  <span className='fw-bolder text-gray-800 fs-6'>Fee Details</span>
                </div>
                <div className='table-responsive border rounded-2' style={{ borderColor: '#e5e7eb' }}>
                  <table className='table table-row-bordered table-row-gray-100 align-middle fs-8 mb-0'>
                    <thead>
                      <tr className='text-uppercase text-muted fw-bold' style={{ background: '#f5f7fa' }}>
                        <th className='ps-4 py-4' style={{ minWidth: 160 }}>Item</th>
                        {tableCols.map(m => (
                          <th key={m} className='text-center py-4 px-3' style={{ minWidth: 85 }}>{m.toUpperCase()}</th>
                        ))}
                        {tableCols.length === 0 && (
                          <th className='py-4 ps-4 text-gray-400 fw-normal fs-8 fst-italic'>
                            Select months above to see monthly breakdown →
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Annual / One-Time section */}
                      {annualItems.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={tableCols.length > 0 ? tableCols.length + 1 : 2}
                              className='py-3 ps-4' style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                              <div className='fw-bold text-amber-700 fs-8 d-flex align-items-center gap-2' style={{ color: '#92400e' }}>
                                <i className='bi bi-star-fill text-warning'></i>
                                ANNUAL / ONE-TIME FEES
                              </div>
                            </td>
                          </tr>
                          <AnnualRows
                            items={annualItems}
                            selectedAnnualCats={selectedAnnualCats}
                            toggleAnnualCat={toggleAnnualCat}
                            tableCols={tableCols}
                          />
                        </>
                      )}

                      {/* Monthly section */}
                      {monthlyItems.length > 0 && tableCols.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={tableCols.length + 1}
                              className='py-3 ps-4' style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                              <div className='fw-bold fs-8 d-flex align-items-center gap-2' style={{ color: '#1e40af' }}>
                                <i className='bi bi-calendar3 text-primary'></i>
                                MONTHLY FEES
                              </div>
                            </td>
                          </tr>
                          <MonthlyRows
                            items={monthlyItems}
                            tableCols={tableCols}
                            checkedCells={checkedCells}
                            toggleMonthlyCell={toggleMonthlyCell}
                          />
                        </>
                      )}

                      {yearlyMatrix.items.length === 0 && (
                        <tr>
                          <td colSpan={tableCols.length > 0 ? tableCols.length + 1 : 2}
                            className='text-center text-muted py-8 fst-italic'>
                            No fee structure found for this student and session.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Total + Fine/Concession Edit row — only visible when months selected */}
                    {tableCols.length > 0 && (
                      <tfoot>
                        <tr style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
                          <td className='ps-4 py-3 fw-bolder text-white fs-7 border-0'>Total</td>
                          {tableCols.map(m => (
                            <td key={m} className='text-center py-3 border-0'>
                              <div className='d-flex flex-column align-items-center gap-1'>
                                <span className='badge fw-bolder fs-8 px-3 py-2'
                                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                  ₹{getMonthColTotal(m).toLocaleString('en-IN')}
                                </span>
                                {/* Edit Fine/Concession button — calls GET then PUT /invoices/:id */}
                                <button
                                  className='btn btn-xs px-2 py-1 fw-bold'
                                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4 }}
                                  onClick={() => openInvoiceEdit(m)}
                                  title={`Edit Fine / Concession for ${m}`}
                                >
                                  <i className='bi bi-pencil-square me-1' style={{ fontSize: '0.65rem' }}></i>Fine/Disc
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ─ 4. Payment Summary + Amount Receivable cards ─ */}
              {anySelected && (
                <div className='row g-6 mb-7'>
                  {/* Left */}
                  <div className='col-md-6'>
                    <div className='card border h-100 shadow-sm' style={{ borderColor: '#bfdbfe' }}>
                      <div className='card-header min-h-50px border-0 pt-5'>
                        <h3 className='card-title fw-bolder text-gray-800 fs-6 d-flex align-items-center gap-2'>
                          <i className='bi bi-calculator text-primary'></i> Payment Summary
                        </h3>
                      </div>
                      <div className='card-body pt-0 pb-5 px-6'>
                        <div className='d-flex flex-column gap-4'>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Total Fee</span>
                            <input readOnly className='form-control form-control-sm w-130px text-end fw-bold bg-light border-0'
                              value={totals.subtotal} />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Additional Fee (₹)</span>
                            <input type='number' min='0'
                              className='form-control form-control-sm w-130px text-end fw-bold border'
                              value={additionalFee || ''}
                              onChange={e => setAdditionalFee(Number(e.target.value))}
                              placeholder='0' />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Concession (%)</span>
                            <input type='number' min='0' max='100'
                              className='form-control form-control-sm w-130px text-end fw-bold border'
                              value={concessionPct || ''}
                              onChange={e => setConcessionPct(Math.min(100, Number(e.target.value)))}
                              placeholder='0' />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Concession Amt</span>
                            <input readOnly className='form-control form-control-sm w-130px text-end fw-bold bg-light border-0 text-danger'
                              value={totals.concessionAmt.toFixed(2)} />
                          </div>
                          <div className='separator my-0'></div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-900 fw-bolder fs-6'>Net Fee</span>
                            <span className='text-primary fw-bolder fs-3 bg-light-primary rounded px-3 py-1'>
                              ₹{totals.netFee.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className='col-md-6'>
                    <div className='card border h-100 shadow-sm' style={{ borderColor: '#bbf7d0' }}>
                      <div className='card-header min-h-50px border-0 pt-5'>
                        <h3 className='card-title fw-bolder text-gray-800 fs-6 d-flex align-items-center gap-2'>
                          <i className='bi bi-cash-stack text-success'></i> Amount Receivable
                        </h3>
                      </div>
                      <div className='card-body pt-0 pb-5 px-6 d-flex flex-column gap-3'>
                        <div className='d-flex flex-stack rounded px-4 py-3' style={{ background: '#f0fff4', border: '1px solid #bbf7d0' }}>
                          <span className='text-gray-700 fw-semibold fs-7'>Net Fee</span>
                          <span className='text-success fw-bolder fs-6'>₹{totals.netFee.toFixed(2)}</span>
                        </div>
                        <div className='d-flex flex-stack rounded px-4 py-3' style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <span className='text-gray-700 fw-semibold fs-7'>Old Balance</span>
                          <span className='text-warning fw-bolder fs-6'>₹{oldBalance.toFixed(2)}</span>
                        </div>
                        <div className='d-flex flex-stack rounded px-5 py-4' style={{ background: '#16a34a' }}>
                          <span className='text-white fw-bolder fs-6'>Amount Received</span>
                          <span className='text-white fw-bolder fs-2'>₹{totals.totalReceivable.toFixed(2)}</span>
                        </div>
                        <div className='d-flex flex-stack rounded px-5 py-3' style={{ background: '#dc2626' }}>
                          <span className='text-white fw-bolder fs-6'>New Balance</span>
                          <span className='text-white fw-bolder fs-4'>₹0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ 5. Payment Details form ─ */}
              {anySelected && (
                <div className='card border border-gray-200 mb-6 shadow-sm'>
                  <div className='card-body p-6'>
                    <div className='d-flex align-items-center gap-2 mb-5'>
                      <i className='bi bi-credit-card-2-front text-dark fs-4'></i>
                      <h5 className='fw-bolder text-gray-900 mb-0'>Payment Details</h5>
                    </div>
                    <div className='row g-5'>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Payment Mode</label>
                        <select className='form-select form-select-solid fw-bold text-gray-800'
                          value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                          <option>Cash</option>
                          <option>Cheque</option>
                          <option>Online</option>
                          <option>UPI</option>
                          <option>DD</option>
                        </select>
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Bank Name</label>
                        <input type='text' className='form-control form-control-solid'
                          value={bankName} onChange={e => setBankName(e.target.value)}
                          placeholder='Enter bank name' disabled={paymentMode === 'Cash'} />
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Cheque / DD No.</label>
                        <input type='text' className='form-control form-control-solid'
                          value={chequeNo} onChange={e => setChequeNo(e.target.value)}
                          placeholder='Enter cheque number' disabled={paymentMode === 'Cash'} />
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Cheque Date</label>
                        <input type='date' className='form-control form-control-solid'
                          value={chequeDate} onChange={e => setChequeDate(e.target.value)}
                          disabled={paymentMode === 'Cash'} />
                      </div>
                      <div className='col-md-6'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>
                          <i className='bi bi-hash text-primary me-1'></i>
                          Reference / Transaction No.
                        </label>
                        <input type='text' className='form-control form-control-solid'
                          value={referenceNo} onChange={e => setReferenceNo(e.target.value)}
                          placeholder={
                            paymentMode === 'UPI' ? 'UPI Transaction ID' :
                            paymentMode === 'Online' ? 'Bank Transaction No.' :
                            paymentMode === 'Cheque' || paymentMode === 'DD' ? 'Cheque / DD Reference' :
                            'Reference number (optional)'
                          } />
                      </div>
                      <div className='col-12'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Remark</label>
                        <textarea className='form-control form-control-solid' rows={2}
                          value={remark} onChange={e => setRemark(e.target.value)}
                          placeholder='Enter any remarks...' />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className='alert alert-danger fw-semibold mb-4'>
                  <i className='bi bi-exclamation-circle me-2'></i>{submitError}
                </div>
              )}

              {/* ─ 6. Bottom: SMS/WA + Reset + Submit ─ */}
              {anySelected && (
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 pt-2'>
                  <div className='d-flex gap-6'>
                    <div className='form-check form-check-custom form-check-solid'>
                      <input className='form-check-input h-20px w-20px' type='checkbox'
                        id='sendSMS' checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} />
                      <label className='form-check-label fw-bold text-gray-700 fs-7' htmlFor='sendSMS'>
                        <i className='bi bi-chat-left-text text-info me-1'></i> Send SMS
                      </label>
                    </div>
                    <div className='form-check form-check-custom form-check-solid'>
                      <input className='form-check-input h-20px w-20px' type='checkbox'
                        id='sendWA' checked={sendWhatsApp} onChange={e => setSendWhatsApp(e.target.checked)} />
                      <label className='form-check-label fw-bold text-gray-700 fs-7' htmlFor='sendWA'>
                        <i className='bi bi-whatsapp text-success me-1'></i> Send WhatsApp
                      </label>
                    </div>
                  </div>
                  <div className='d-flex gap-3'>
                    <button className='btn btn-light fw-bolder px-8' onClick={resetAll}>
                      <i className='bi bi-arrow-repeat me-2'></i>Reset
                    </button>
                    <button
                      className='btn btn-primary fw-bolder px-10 shadow-sm'
                      onClick={handleSubmit}
                      disabled={submitting || totals.totalReceivable <= 0}
                    >
                      {submitting
                        ? <><span className='spinner-border spinner-border-sm me-2'></span>Processing...</>
                        : <><i className='bi bi-shield-check me-2 fs-5'></i>✓ Submit</>
                      }
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Content>

      {/* ── Success Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='sm'>
        <Modal.Body className='p-0 overflow-hidden rounded'>
          <div className='p-8 text-center text-white'
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className='bi bi-patch-check-fill' style={{ fontSize: '4.5rem', opacity: 0.9 }}></i>
            <h2 className='text-white fw-bolder mt-3 mb-1'>Payment Successful!</h2>
            <p className='mb-0 fs-8 opacity-75'>Receipt ID: TXN-{lastReceipt?.id || '—'}</p>
          </div>
          <div className='p-6'>
            <div className='rounded p-4 mb-4 d-flex flex-stack' style={{ background: '#f8f9fb' }}>
              <div>
                <div className='text-muted fs-9 fw-bold text-uppercase mb-1'>Student</div>
                <div className='fw-bolder text-gray-900'>{stName}</div>
                <div className='text-muted fs-8'>{className}{sectionName ? ` (${sectionName})` : ''}</div>
              </div>
              <div className='text-end'>
                <div className='text-muted fs-9 fw-bold text-uppercase mb-1'>Amount Paid</div>
                <div className='text-success fw-bolder' style={{ fontSize: '1.8rem' }}>
                  ₹{Number(lastReceipt?.amount_paid || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className='row g-3 fs-8 mb-5'>
              <div className='col-6'>
                <div className='text-muted mb-1'>Mode</div>
                <div className='fw-bold'>{lastReceipt?.payment_mode || paymentMode}</div>
              </div>
              <div className='col-6'>
                <div className='text-muted mb-1'>Date</div>
                <div className='fw-bold'>{today}</div>
              </div>
            </div>
            <div className='d-flex gap-3'>
              <button className='btn btn-light-success fw-bold flex-grow-1 fs-8'>
                <i className='bi bi-printer me-1'></i>Print Receipt
              </button>
              <button className='btn btn-primary fw-bold flex-grow-1 fs-8'
                onClick={() => setShowModal(false)}>Done</button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── Invoice Fine / Concession Edit Modal (GET + PUT /invoices/:id) ── */}
      <Modal show={invoiceModalOpen} onHide={() => { setInvoiceModalOpen(false); setInvoiceSaveMsg(null) }} centered size='lg'>
        <Modal.Body className='p-0 overflow-hidden rounded'>
          {/* Header */}
          <div className='px-6 py-5 d-flex align-items-center justify-content-between border-bottom'
            style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
            <div>
              <h4 className='text-white fw-bolder mb-0 fs-5'>
                <i className='bi bi-pencil-square me-2'></i>Edit Fine / Concession
              </h4>
              <span className='text-white opacity-75 fs-8'>Month: {invoiceModalMonth}</span>
            </div>
            <button className='btn btn-sm btn-icon' style={{ color: '#fff', opacity: 0.8 }}
              onClick={() => { setInvoiceModalOpen(false); setInvoiceSaveMsg(null) }}>
              <i className='bi bi-x-lg fs-5'></i>
            </button>
          </div>

          <div className='p-6'>
            {invoiceLoading && (
              <div className='text-center py-8'>
                <div className='spinner-border text-primary mb-2'></div>
                <div className='text-muted fs-7'>Loading invoice details...</div>
              </div>
            )}

            {!invoiceLoading && invoiceDetail && (
              <>
                {/* Invoice summary */}
                <div className='rounded-2 border border-gray-200 mb-5 overflow-hidden'>
                  <div className='row g-0' style={{ background: '#f8f9fb' }}>
                    <div className='col-4 py-3 px-4 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-1'>Invoice ID</div>
                      <div className='fw-bolder text-gray-800'>#{invoiceDetail.id}</div>
                    </div>
                    <div className='col-4 py-3 px-4 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-1'>Base Amount</div>
                      <div className='fw-bolder text-gray-800'>₹{Number(invoiceDetail.total_amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className='col-4 py-3 px-4'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-1'>Status</div>
                      <span className={clsx('badge fw-bold', {
                        'badge-light-success': invoiceDetail.status === 'PAID',
                        'badge-light-danger': invoiceDetail.status === 'OVERDUE',
                        'badge-light-warning': invoiceDetail.status === 'PARTIAL',
                        'badge-light-primary': invoiceDetail.status === 'UNPAID',
                      })}>{invoiceDetail.status}</span>
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                {invoiceDetail.items && invoiceDetail.items.length > 0 && (
                  <div className='mb-5'>
                    <div className='fw-bold text-gray-700 fs-8 mb-2'>Fee Items</div>
                    <div className='border rounded-2 overflow-hidden'>
                      {invoiceDetail.items.map(item => (
                        <div key={item.id} className='d-flex flex-stack px-4 py-2 border-bottom border-gray-100 fs-8'>
                          <span className='text-gray-700'>{item.fee_category?.name || `Cat #${item.fee_category_id}`}</span>
                          <span className='fw-bold text-gray-800'>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fine / Concession inputs */}
                <div className='row g-4 mb-4'>
                  <div className='col-6'>
                    <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>
                      <i className='bi bi-exclamation-triangle text-danger me-1'></i>Fine / Penalty (₹)
                    </label>
                    <input type='number' min='0' className='form-control form-control-solid text-end fw-bold'
                      value={editFine}
                      onChange={e => setEditFine(Number(e.target.value))}
                      placeholder='0' />
                  </div>
                  <div className='col-6'>
                    <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>
                      <i className='bi bi-tag text-success me-1'></i>Concession / Discount (₹)
                    </label>
                    <input type='number' min='0' className='form-control form-control-solid text-end fw-bold'
                      value={editConcession}
                      onChange={e => setEditConcession(Number(e.target.value))}
                      placeholder='0' />
                  </div>
                </div>

                {/* Calculated net preview */}
                <div className='rounded-2 p-4 mb-4 d-flex flex-stack' style={{ background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                  <span className='fw-bold text-gray-700 fs-7'>Net Amount (Preview)</span>
                  <span className='fw-bolder text-primary fs-4'>
                    ₹{Math.max(0, Number(invoiceDetail.total_amount) + editFine - editConcession).toLocaleString('en-IN')}
                  </span>
                </div>

                {invoiceSaveMsg && (
                  <div className={clsx('alert fw-semibold mb-4 py-3', invoiceSaveMsg.startsWith('✓') ? 'alert-success' : 'alert-danger')}>
                    {invoiceSaveMsg}
                  </div>
                )}

                <div className='d-flex gap-3 justify-content-end'>
                  <button className='btn btn-light fw-bold px-6'
                    onClick={() => { setInvoiceModalOpen(false); setInvoiceSaveMsg(null) }}>
                    Cancel
                  </button>
                  <button
                    className='btn btn-primary fw-bolder px-8'
                    onClick={saveInvoiceEdit}
                    disabled={savingInvoice}
                  >
                    {savingInvoice
                      ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</>
                      : <><i className='bi bi-check2-circle me-2'></i>Save Changes</>
                    }
                  </button>
                </div>
              </>
            )}

            {/* Invoice not generated yet */}
            {!invoiceLoading && !invoiceDetail && invoiceSaveMsg && (
              <div className='text-center py-6'>
                <i className='bi bi-file-earmark-x text-warning' style={{ fontSize: '3rem' }}></i>
                <p className='fw-semibold text-muted mt-3'>{invoiceSaveMsg}</p>
                <button className='btn btn-light fw-bold px-6'
                  onClick={() => setInvoiceModalOpen(false)}>Close</button>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

    </>
  )
}

// ─── Wrapper with page title ───────────────────────────────────────────────────
const MonthlyCollectionWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Fees', path: '/fees/monthly', isActive: false },
      { title: 'Fee Collection', path: '/fees/monthly', isActive: true },
    ]}>
      Fee Collection
    </PageTitle>
    <FeeCollectionPage />
  </>
)

export { MonthlyCollectionWrapper }
