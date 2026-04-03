import { FC, useState, useEffect, useCallback, useMemo } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import clsx from 'clsx'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { collectPayment, getYearlyMatrix } from './core/_requests'
import { getAcademicSessions, getClasses, getClassSections } from '../academic/core/_requests'
import { getEnrollments, getStudentById } from '../students/core/_requests'
import { YearlyMatrixResponse, YearlyMatrixItem } from './core/_models'
import { StudentEnrollmentModel } from '../students/core/_models'

// ─── Main Component ───────────────────────────────────────────────────────────
const FeeCollectionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [sessions, setSessions]       = useState<any[]>([])
  const [classes, setClasses]         = useState<any[]>([])
  const [sections, setSections]       = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollmentModel[]>([])

  const [selSession, setSelSession] = useState('')
  const [selClass, setSelClass]     = useState('')
  const [selSection, setSelSection] = useState('')
  const [selStudent, setSelStudent] = useState('')

  const [loadingMeta, setLoadingMeta]     = useState(false)
  const [loadingEnroll, setLoadingEnroll] = useState(false)
  const [loadingMatrix, setLoadingMatrix] = useState(false)
  const [matrixError, setMatrixError]     = useState<string | null>(null)

  // ── Student data ──────────────────────────────────────────────────────────────
  const [studentDetail, setStudentDetail] = useState<any | null>(null)
  const [enrolDetail, setEnrolDetail]     = useState<StudentEnrollmentModel | null>(null)
  
  // ── Matrix Api Data ───────────────────────────────────────────────────────────
  const [yearlyMatrix, setYearlyMatrix] = useState<YearlyMatrixResponse | null>(null)
  const [oldBalance, setOldBalance] = useState(0) // Assuming backend might pass this if needed, else 0

  // ── Selection State ────────────────────────────────────────────────────────────
  // Selected Full Months
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  
  // checkedCells: `${categoryId}__${month}` => boolean (For Monthly items)
  const [checkedCells, setCheckedCells] = useState<Record<string, boolean>>({})

  // selectedAnnualCats: category_id => boolean (For Annual / One-time items)
  const [selectedAnnualCats, setSelectedAnnualCats] = useState<number[]>([])

  // ── Payment form ───────────────────────────────────────────────────────────────
  const [additionalFee, setAdditionalFee]   = useState(0)
  const [concessionPct, setConcessionPct]   = useState(0)
  const [paymentMode, setPaymentMode]       = useState('Cash')
  const [bankName, setBankName]             = useState('')
  const [chequeNo, setChequeNo]             = useState('')
  const [chequeDate, setChequeDate]         = useState('')
  const [remark, setRemark]                 = useState('')
  const [sendSMS, setSendSMS]               = useState(true)
  const [sendWhatsApp, setSendWhatsApp]     = useState(true)

  // ── Submit state ───────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [lastReceipt, setLastReceipt] = useState<any | null>(null)

  // ─── Load meta ────────────────────────────────────────────────────────────────
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
        // If there is any old balance info in matrixRes, set it here.
        setOldBalance(0)
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
    setSubmitError(null); setBankName(''); setChequeNo(''); setChequeDate(''); setRemark('')
  }

  // ─── Categorize Matrix Items ──────────────────────────────────────────────────
  const monthlyItems = useMemo((): YearlyMatrixItem[] => {
    return yearlyMatrix?.items.filter(i => i.frequency === 'MONTHLY') || []
  }, [yearlyMatrix])

  const annualItems = useMemo((): YearlyMatrixItem[] => {
    return yearlyMatrix?.items.filter(i => i.frequency === 'ONE_TIME' || i.frequency === 'ANNUALLY') || []
  }, [yearlyMatrix])

  const MATRIX_MONTHS = yearlyMatrix?.months || []

  // ─── Month Box Helpers (Only for Monthly Items context) ──────────────────────────
  const getMonthAggregateStatus = (m: string) => {
    if (!yearlyMatrix) return 'none'
    // A month is 'paid' if ALL applicable monthly items in that month are PAID.
    // A month is 'pending' if AT LEAST ONE applicable monthly item is UNGENERATED, UNPAID, PARTIAL.
    // A month is 'not_applicable' if NO monthly items are applicable for this month.
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

  const getMonthAggregateBalance = (m: string) => {
    // How much does this month cost based on the grid?
    let total = 0
    if (!yearlyMatrix) return 0
    for (const item of monthlyItems) {
      const cell = item.months[m]
      if (cell && cell.applicable && cell.status !== 'PAID') {
        // Here we assume cell.amount is the pending amount. 
        // If the API provides net vs paid, we'd subtract. For now just sum applicable.
        total += cell.amount
      }
    }
    return total
  }

  // ─── Interactions ──────────────────────────────────────────────────────────────
  const toggleMonth = (m: string) => {
    const status = getMonthAggregateStatus(m)
    if (status === 'none' || status === 'paid') return

    setSelectedMonths(prev => {
      if (prev.includes(m)) {
        // Deselect month: clear all checked monthly cells for this month
        setCheckedCells(c => {
          const next = { ...c }
          monthlyItems.forEach(item => { delete next[`${item.category_id}__${m}`] })
          return next
        })
        return prev.filter(x => x !== m)
      } else {
        // Select month: check all applicable AND unpaid monthly cells for this month
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
    const pendingMonths = MATRIX_MONTHS.filter(m => getMonthAggregateStatus(m) === 'pending')
    if (selectedMonths.length === pendingMonths.length) {
      setSelectedMonths([])
      setCheckedCells({})
    } else {
      setSelectedMonths(pendingMonths)
      const next: Record<string, boolean> = {}
      pendingMonths.forEach(m => {
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
    if (!cell || !cell.applicable || cell.status === 'PAID') return // cannot interact

    const key = `${categoryId}__${m}`
    setCheckedCells(prev => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key] // uncheck
        // If no cells remain checked for this month, automatically deselect the month pill
        const monthStillHasChecked = monthlyItems.some(i => next[`${i.category_id}__${m}`])
        if (!monthStillHasChecked) setSelectedMonths(p => p.filter(x => x !== m))
      } else {
        next[key] = true // check
        // Ensure month pill is selected
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

  // ─── Calculations ─────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let monthlySubtotal = 0
    monthlyItems.forEach(item => {
      MATRIX_MONTHS.forEach(m => {
        const key = `${item.category_id}__${m}`
        if (checkedCells[key]) {
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

  const getMonthTotalComputed = (m: string): number => {
    let sum = 0
    monthlyItems.forEach(item => {
        if (checkedCells[`${item.category_id}__${m}`]) {
            sum += item.months[m]?.amount || 0
        }
    })
    return sum
  }

  // ─── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!enrolDetail || !selSession) return
    if (totals.totalReceivable <= 0) { setSubmitError('No fee selected.'); return }
    setSubmitting(true); setSubmitError(null)

    // Build notes summarizing what is being paid
    const monthStrs = selectedMonths.map(m => m).join(', ')
    const mNote = monthStrs ? `Months: ${monthStrs}` : ''
    const aCols = annualItems.filter(i => selectedAnnualCats.includes(i.category_id)).map(i => i.category_name).join(', ')
    const aNote = aCols ? `Annual/OneTime: ${aCols}` : ''

    try {
      const { data } = await collectPayment(schoolId, {
        student_id: enrolDetail.student_id,
        academic_session_id: Number(selSession),
        amount: totals.totalReceivable,
        payment_method: paymentMode.toUpperCase(),
        payment_date: paymentDate || new Date().toISOString().slice(0, 10),
        notes: [mNote, aNote, chequeNo ? `Cheque: ${chequeNo}` : '', bankName ? `Bank: ${bankName}` : '', remark].filter(Boolean).join(' | '),
      })
      if (data.success) {
        setLastReceipt(data.data)
        setShowModal(true)
        setSelectedMonths([]); setCheckedCells({}); setSelectedAnnualCats([])
        setAdditionalFee(0); setConcessionPct(0); setRemark('')
        setBankName(''); setChequeNo(''); setChequeDate('')
        
        // Reload Matrix
        const matrixRes = await getYearlyMatrix(schoolId, enrolDetail.student_id, Number(selSession))
        if(matrixRes.data.success) {
           setYearlyMatrix(matrixRes.data.data)
        }
      }
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Payment failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  // ─── Display Contexts ──────────────────────────────────────────────────────────
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
  
  const pendingCount = MATRIX_MONTHS.filter(m => getMonthAggregateStatus(m) === 'pending').length
  const allPendingSelected = pendingCount > 0 && selectedMonths.length === pendingCount
  const tableCols = MATRIX_MONTHS.filter(m => selectedMonths.includes(m)) // Display only selected months in table

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ─── SEARCH BAR ─────────────────────────────────────────────────────────── */}
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

        {/* ─── EMPTY STATE ─────────────────────────────────────────────────────────── */}
        {!selStudent && !loadingMatrix && (
          <div className='card card-flush border-0 shadow-xs'>
            <div className='card-body py-20 text-center'>
              <i className='bi bi-person-check text-gray-300' style={{ fontSize: '5rem' }}></i>
              <h5 className='fw-bold text-gray-600 mt-4 mb-1'>Select a Student</h5>
              <p className='text-muted fs-7'>Search and pick a student to view their Yearly Matrix fees.</p>
            </div>
          </div>
        )}

        {/* ─── LOADING ──────────────────────────────────────────────────────────────── */}
        {loadingMatrix && (
          <div className='card card-flush border-0 shadow-xs'>
            <div className='card-body py-16 text-center'>
              <div className='spinner-border text-primary mb-3'></div>
              <div className='text-muted fw-semibold'>Loading fee matrix...</div>
            </div>
          </div>
        )}

        {matrixError && <div className='alert alert-danger fw-semibold mb-4'>{matrixError}</div>}

        {/* ─── MAIN UI CARD ────────────────────────────────────────────────────────── */}
        {selStudent && yearlyMatrix && !loadingMatrix && (
          <div className='card card-flush border-0 shadow-sm overflow-hidden'>

            {/* Header Gradient */}
            <div className='card-header min-h-70px' style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
              <div className='card-title'>
                <div className='d-flex align-items-center gap-3'>
                  <i className='bi bi-receipt text-white fs-2'></i>
                  <h2 className='text-white fw-bolder mb-0 fs-4'>Fee Receipt — {stName || 'Student'}</h2>
                </div>
              </div>
              <div className='card-toolbar'>
                <span className='badge fw-bold px-4 py-2 fs-8' style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20 }}>
                  Session: {sessionYear}
                </span>
              </div>
            </div>

            <div className='card-body px-8 py-7'>

              {/* ── 1. Student Master Info Grid ── */}
              <div className='rounded-2 border border-gray-200 mb-7' style={{ background: '#f8f9fb' }}>
                <div className='row g-0 border-bottom border-gray-200'>
                  {[
                    { label: 'Date', value: <span className='badge badge-primary px-3 py-2 fw-bold fs-8'>{today}</span> },
                    { label: 'Class (Sec.)', value: `${className}${sectionName ? ` (${sectionName})` : ''}` },
                    { label: 'Reg.', value: enrolDetail?.student_id },
                    { label: 'SID', value: enrolDetail?.student_id },
                    { label: 'Roll No.', value: enrolDetail?.roll_number || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className='col py-4 px-5 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>{label}</div>
                      <div className='fw-bolder text-gray-800 fs-7'>{value}</div>
                    </div>
                  ))}
                </div>
                <div className='row g-0 border-bottom border-gray-200'>
                  {[
                    { label: 'Name', value: stName },
                    { label: 'Father', value: fatherName },
                    { label: 'Mother', value: motherName },
                  ].map(({ label, value }) => (
                    <div key={label} className='col-4 py-4 px-5 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>{label}</div>
                      <div className='fw-bolder text-gray-800 fs-7'>{value}</div>
                    </div>
                  ))}
                </div>
                <div className='row g-0 border-bottom border-gray-200'>
                  {[
                    { label: 'Route', value: '—' },
                    { label: 'Mobile', value: mobile },
                    {
                      label: 'Old Balance',
                      value: <span className={clsx('fw-bolder fs-6', oldBalance > 0 ? 'text-danger' : 'text-success')}>
                        ₹{oldBalance.toLocaleString('en-IN')}
                      </span>
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className='col-4 py-4 px-5 border-end border-gray-200'>
                      <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>{label}</div>
                      <div className='fw-bold text-gray-800 fs-7'>{value}</div>
                    </div>
                  ))}
                </div>
                <div className='py-4 px-5'>
                  <div className='text-muted fw-bold fs-9 text-uppercase mb-2'>Address</div>
                  <div className='fw-semibold text-gray-700 fs-7'>{address}</div>
                </div>
              </div>

              {/* ── 2. Month Pill Selection ── */}
              <div className='mb-6'>
                <div className='d-flex align-items-center justify-content-between mb-4'>
                  <div className='d-flex align-items-center gap-2'>
                    <span className='fs-4'>📅</span>
                    <span className='fw-bolder text-gray-800 fs-6'>Select Months</span>
                  </div>
                  {pendingCount > 0 && (
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
                        title={isPaid ? 'Paid' : !isApplicable ? 'Not Applicable' : `₹${getMonthAggregateBalance(m)} pending`}
                      >
                        {isPaid ? '✓ ' : ''}{m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 3. Table Fee Details (Monthly + Annual inline) ── */}
              <div className='mb-7'>
                <div className='d-flex align-items-center gap-2 mb-4'>
                  <span className='fs-4'>📋</span>
                  <span className='fw-bolder text-gray-800 fs-6'>Fee Details</span>
                </div>
                <div className='table-responsive border rounded-2' style={{borderColor: '#e5e7eb'}}>
                  <table className='table table-row-bordered table-row-gray-200 align-middle fs-8 mb-0 w-100'>
                    <thead>
                      <tr className='text-uppercase text-muted fw-bold' style={{ background: '#f5f7fa', borderBottom: '2px solid #e5e7eb' }}>
                        <th className='ps-4 py-4 text-nowrap'>Item</th>
                        {tableCols.map(m => (
                          <th key={m} className='text-center py-4 px-2' style={{ minWidth: 80 }}>{m.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      
                      {/* === Annual / One Time Items === */}
                      {annualItems.length > 0 && (
                        <>
                           <tr><td colSpan={tableCols.length + 1} className='bg-light-warning py-3 ps-4'>
                              <div className='fw-bold text-gray-800 fs-8 d-flex align-items-center gap-2'>
                                <i className="bi bi-star-fill text-warning fs-9"></i>
                                ANNUAL / ONE TIME FEES
                              </div>
                           </td></tr>
                           { वार्षिकRowRender(annualItems, MATRIX_MONTHS, selectedAnnualCats, toggleAnnualCat) }
                        </>
                      )}

                      {/* === Monthly Items === */}
                      {monthlyItems.length > 0 && tableCols.length > 0 && (
                        <>
                           <tr><td colSpan={tableCols.length + 1} className='bg-light-primary py-3 ps-4'>
                              <div className='fw-bold text-gray-800 fs-8 d-flex align-items-center gap-2'>
                                <i className="bi bi-calendar3 text-primary fs-9"></i>
                                MONTHLY FEES
                              </div>
                           </td></tr>
                           { मासिकRowRender(monthlyItems, tableCols, checkedCells, toggleMonthlyCell) }
                        </>
                      )}

                      {monthlyItems.length === 0 && annualItems.length === 0 && (
                         <tr><td colSpan={tableCols.length + 1} className='text-center text-muted py-6'>No fee structure mapped for this session.</td></tr>
                      )}
                      
                    </tbody>
                    
                    {/* === Footer Total === */}
                    <tfoot>
                      <tr style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
                        <td className='ps-4 py-4 text-white fw-bolder fs-7 d-flex justify-content-between align-items-center border-0'>
                          Monthly Total
                        </td>
                        {tableCols.map(m => {
                          const colTotal = getMonthTotalComputed(m)
                          return (
                            <td key={m} className='text-center py-4 border-0'>
                              <span className='badge fw-bolder fs-8 px-3 py-2' style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                ₹{colTotal.toLocaleString('en-IN')}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── 4. Forms & Summary Cards ── */}
              { (selectedMonths.length > 0 || selectedAnnualCats.length > 0) && (
                <div className='row g-6 mb-7'>
                  {/* Left: Payment Summary (Inputs) */}
                  <div className='col-md-6'>
                    <div className='card border h-100 shadow-sm' style={{borderColor: '#bfdbfe'}}>
                      <div className='card-header min-h-50px border-0 pt-4'>
                        <h3 className='card-title fw-bolder text-gray-800 fs-6 d-flex align-items-center gap-2'>
                          <i className='bi bi-calculator text-primary'></i> Payment Summary
                        </h3>
                      </div>
                      <div className='card-body pt-0 pb-4 px-6'>
                        <div className='d-flex flex-column gap-4'>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Total Fee Matrix Amount</span>
                            <input readOnly className='form-control form-control-sm w-150px text-end fw-bold bg-light' value={totals.subtotal} />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Additional / Fine (₹)</span>
                            <input type='number' min='0' className='form-control form-control-sm w-150px text-end fw-bold border'
                              value={additionalFee || ''} onChange={e => setAdditionalFee(Number(e.target.value))} placeholder='0' />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Concession (%)</span>
                            <input type='number' min='0' max='100' className='form-control form-control-sm w-150px text-end fw-bold border'
                              value={concessionPct || ''} onChange={e => setConcessionPct(Math.min(100, Number(e.target.value)))} placeholder='0' />
                          </div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-600 fw-bold fs-7'>Concession Amt</span>
                            <input readOnly className='form-control form-control-sm w-150px text-end fw-bold bg-light text-success' value={`-${totals.concessionAmt.toFixed(2)}`} />
                          </div>
                          <div className='separator my-1'></div>
                          <div className='d-flex justify-content-between align-items-center'>
                            <span className='text-gray-900 fw-bolder fs-6'>Net Fee</span>
                            <span className='text-primary fw-bolder fs-4 bg-light-primary rounded px-3 py-1'>₹{totals.netFee.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount Receivable Stats */}
                  <div className='col-md-6'>
                    <div className='card border h-100 shadow-sm' style={{borderColor: '#bbf7d0'}}>
                      <div className='card-header min-h-50px border-0 pt-4'>
                        <h3 className='card-title fw-bolder text-gray-800 fs-6 d-flex align-items-center gap-2'>
                          <i className='bi bi-cash-stack text-success'></i> Amount Receivable
                        </h3>
                      </div>
                      <div className='card-body pt-0 pb-4 px-6 d-flex flex-column gap-3'>
                        <div className='d-flex flex-stack rounded px-4 py-3 border border-success border-opacity-25' style={{ background: '#f0fff4' }}>
                          <span className='text-gray-700 fw-semibold fs-7'>Net Fee</span>
                          <span className='text-success fw-bolder fs-6'>₹{totals.netFee.toFixed(2)}</span>
                        </div>
                        <div className='d-flex flex-stack rounded px-4 py-3 border border-warning border-opacity-25' style={{ background: '#fffaf0' }}>
                          <span className='text-gray-700 fw-semibold fs-7'>Old Balance</span>
                          <span className='text-warning fw-bolder fs-6'>₹{oldBalance.toFixed(2)}</span>
                        </div>
                        
                        <div className='d-flex flex-stack rounded px-5 py-4 mt-2' style={{ background: '#16a34a' }}>
                          <span className='text-white fw-bolder fs-6'>Amount Received</span>
                          <span className='text-white fw-bolder fs-2'>₹{totals.totalReceivable.toFixed(2)}</span>
                        </div>
                        
                        <div className='d-flex flex-stack rounded px-5 py-4' style={{ background: '#dc2626' }}>
                          <span className='text-white fw-bolder fs-6'>New Balance</span>
                          <span className='text-white fw-bolder fs-4'>₹0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. Payment Details Checkout ── */}
              { (selectedMonths.length > 0 || selectedAnnualCats.length > 0) && (
                 <div className='card border border-gray-200 mb-6 shadow-sm'>
                  <div className='card-body p-6'>
                    <div className='d-flex align-items-center gap-2 mb-5'>
                      <i className='bi bi-credit-card-2-front text-dark fs-4'></i>
                      <h5 className='fw-bolder text-gray-900 mb-0'>Payment Details</h5>
                    </div>
                    <div className='row g-5'>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Payment Mode</label>
                        <select className='form-select form-select-solid fw-bold text-gray-800' value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                          <option>Cash</option>
                          <option>Cheque</option>
                          <option>Online</option>
                          <option>UPI</option>
                          <option>DD</option>
                        </select>
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Bank Name</label>
                        <input type='text' className='form-control form-control-solid' value={bankName} onChange={e => setBankName(e.target.value)} placeholder='Bank name' disabled={paymentMode==='Cash'} />
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Cheque / DD No.</label>
                        <input type='text' className='form-control form-control-solid' value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder='Cheque number' disabled={paymentMode==='Cash'} />
                      </div>
                      <div className='col-md-3'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Cheque Date</label>
                        <input type='date' className='form-control form-control-solid' value={chequeDate} onChange={e => setChequeDate(e.target.value)} disabled={paymentMode==='Cash'} />
                      </div>
                      <div className='col-12'>
                        <label className='fw-bold fs-8 text-uppercase text-muted mb-2 d-block'>Remark</label>
                        <textarea className='form-control form-control-solid' rows={2} value={remark} onChange={e => setRemark(e.target.value)} placeholder='Enter any remarks...' />
                      </div>
                    </div>
                  </div>
                 </div>
              )}

              {submitError && <div className='alert alert-danger fw-semibold mb-4'>{submitError}</div>}

              {/* ── 6. Bottom Submit actions ── */}
              { (selectedMonths.length > 0 || selectedAnnualCats.length > 0) && (
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 pt-3'>
                  <div className='d-flex gap-6'>
                    <div className='form-check form-check-custom form-check-solid'>
                      <input className='form-check-input h-20px w-20px' type='checkbox' id='sendSMS' checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} />
                      <label className='form-check-label fw-bold text-gray-700 fs-7' htmlFor='sendSMS'>
                        Send SMS <i className='bi bi-chat-left-text text-info ms-1'></i>
                      </label>
                    </div>
                    <div className='form-check form-check-custom form-check-solid'>
                      <input className='form-check-input h-20px w-20px' type='checkbox' id='sendWA' checked={sendWhatsApp} onChange={e => setSendWhatsApp(e.target.checked)} />
                      <label className='form-check-label fw-bold text-gray-700 fs-7' htmlFor='sendWA'>
                        Send WhatsApp <i className='bi bi-whatsapp text-success ms-1'></i>
                      </label>
                    </div>
                  </div>
                  <div className='d-flex gap-3'>
                    <button className='btn btn-light fw-bolder px-8 py-3 bg-gray-100 text-gray-700 hover-bg-gray-200' onClick={resetAll}>
                      <i className='bi bi-arrow-repeat me-2'></i>Reset
                    </button>
                    <button
                      className='btn btn-primary fw-bolder px-10 py-3 shadow-sm'
                      style={{ background: '#3b82f6', border: 'none' }}
                      onClick={handleSubmit}
                      disabled={submitting || totals.totalReceivable <= 0}
                    >
                      {submitting
                        ? <><span className='spinner-border spinner-border-sm me-2'></span>Processing...</>
                        : <><i className='bi bi-shield-check me-2 fs-5'></i>Submit Payment</>
                      }
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Content>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className='p-0 text-center overflow-hidden rounded'>
           <div className='p-8 border-bottom text-white' style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
             <i className='bi bi-patch-check-fill text-white opacity-75' style={{ fontSize: '4.5rem' }}></i>
             <h2 className='text-white fw-bolder mt-3 mb-1'>Payment Successful</h2>
             <span className='fs-8 fw-semibold opacity-75'>Receipt ID: TXN-{lastReceipt?.id || '—'}</span>
           </div>
           ...
        </Modal.Body>
      </Modal>
    </>
  )
}

// ─── Inline Render Helpers ──────────────────────────────────────────────────────

function वार्षिकRowRender(
  annualItems: YearlyMatrixItem[],
  allMonths: string[], 
  selectedAnnualCats: number[], 
  toggleAnnualCat: (id: number) => void
) {
  return annualItems.map(item => {
    // Determine the FIRST applicable month to display the price, others show '--'
    let priceRendered = false
    const isSelected = selectedAnnualCats.includes(item.category_id)
    
    // Check if it's already paid anywhere
    let isFullyPaid = false
    allMonths.forEach(m => {
      const cell = item.months[m]
      if (cell && cell.status === 'PAID') isFullyPaid = true
    })

    return (
       <tr key={item.category_id}>
         <td className='ps-4 py-3 text-nowrap'>
            <div className='fw-bold text-gray-800 d-flex align-items-center gap-3'>
               {item.category_name}
               <span className='badge badge-light-warning px-2 py-1' style={{fontSize: '0.6rem'}}>{item.frequency}</span>
            </div>
         </td>
         {/* It only applies to the tableCols (but wait, tableCols might be empty if no months are selected, so annuals might glitch? The requirement is to show annuals spanning across the selected months. Or if tableCols goes away, the table goes away.)
            Wait, in the React Tree above I put it inside tableCols. We should render it spanning all columns.
            If `tableCols` has length 0, the table doesn't render. 
         */}
         <td colSpan={allMonths.length} className='text-start border-0'>
            <label className='d-inline-flex align-items-center gap-2 ms-4 cursor-pointer p-2 rounded hover-bg-light shadow-sm border border-gray-100'>
              <input type='checkbox' className='form-check-input h-15px w-15px mt-0 cursor-pointer border-gray-300'
                checked={isSelected || isFullyPaid} 
                disabled={isFullyPaid}
                readOnly
                onChange={() => !isFullyPaid && toggleAnnualCat(item.category_id)} />
              
              <span className={clsx('fw-bolder fs-7', isFullyPaid ? 'text-success' : isSelected ? 'text-primary' : 'text-gray-700')}>
                ₹{item.total.toLocaleString('en-IN')}
              </span>
              
              {isFullyPaid && <span className='badge badge-light-success px-2 py-1 fs-9 ms-2'>PAID</span>}
            </label>
         </td>
       </tr>
    )
  })
}

function मासिकRowRender(
  monthlyItems: YearlyMatrixItem[],
  tableCols: string[],
  checkedCells: Record<string, boolean>,
  toggleMonthlyCell: (id: number, m: string) => void
) {
  return monthlyItems.map(item => {
    return (
      <tr key={item.category_id} className='hover-bg-light'>
        <td className='ps-4 py-3 text-nowrap'>
          <div className='fw-bold text-gray-800'>{item.category_name}</div>
        </td>
        {tableCols.map(m => {
           const cell = item.months[m]
           const isApplicable = cell && cell.applicable
           const isPaid = cell && cell.status === 'PAID'
           const amt = cell ? cell.amount : 0
           const isChecked = !!checkedCells[`${item.category_id}__${m}`]

           return (
              <td key={m} className='text-center py-3 border-start-dashed border-gray-200'>
                {isApplicable ? (
                  <label className='d-inline-flex align-items-center gap-1 cursor-pointer p-1 rounded' onClick={(e) => { e.preventDefault(); toggleMonthlyCell(item.category_id, m) }}>
                     <input type='checkbox' className={clsx('form-check-input h-15px w-15px mt-0', isPaid ? 'border-success bg-success' : 'border-gray-400')}
                       checked={isChecked || isPaid} readOnly disabled={isPaid} />
                     <span className={clsx('fw-bold ms-1', isPaid ? 'text-success text-decoration-line-through opacity-75' : isChecked ? 'text-primary' : 'text-gray-600')}>
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
    )
  })
}

const MonthlyCollectionWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/monthly', isActive: false }, { title: 'Fee Collection', path: '/fees/monthly', isActive: true }]}>
      Receipt Breakdown
    </PageTitle>
    <FeeCollectionPage />
  </>
)

export { MonthlyCollectionWrapper }
