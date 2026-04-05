import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import { generateInvoices, collectPayment, getPayments } from './core/_requests'
import { getAcademicSessions, getClasses } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { FeePaymentModel, GenerateInvoicesResult } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const PAYMENT_METHODS = ['Cash', 'Cheque', 'Online', 'UPI', 'DD']

const CollectionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  // ── Meta
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes, stRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
        getStudents(schoolId, { limit: 200 }),
      ])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      if (stRes.data.success) setStudents(stRes.data.data.students || [])
    } catch { }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  // ── Generate Invoices
  const [genForm, setGenForm] = useState({ class_id: '', academic_session_id: '' })
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genResult, setGenResult] = useState<GenerateInvoicesResult | null>(null)

  const handleGenerate = async () => {
    if (!genForm.class_id || !genForm.academic_session_id) {
      setGenError('Please select both Class and Academic Session'); return
    }
    setGenerating(true); setGenError(null); setGenResult(null)
    try {
      const { data } = await generateInvoices(schoolId, {
        class_id: Number(genForm.class_id),
        academic_session_id: Number(genForm.academic_session_id),
      })
      if (data.success) {
        setGenResult(data.data as any)
        setGenForm({ class_id: '', academic_session_id: '' })
      } else {
        setGenError(data.message || 'Failed to generate invoices')
      }
    } catch (e: any) {
      setGenError(e.response?.data?.message || 'Failed to generate invoices')
    } finally { setGenerating(false) }
  }

  // ── Payment History
  const [payments, setPayments] = useState<FeePaymentModel[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [histSearch, setHistSearch] = useState('')

  const loadPayments = useCallback(async () => {
    if (!schoolId) return
    setPaymentsLoading(true); setPaymentsError(null)
    try {
      const { data } = await getPayments(schoolId, { limit: 100 })
      if (data.success) setPayments(extractArray(data.data, 'payments', 'fee_payments', 'data'))
      else setPaymentsError(data.message || 'Failed to load payments')
    } catch (e: any) {
      setPaymentsError(extractError(e, 'Failed to load payments'))
    } finally { setPaymentsLoading(false) }
  }, [schoolId])

  useEffect(() => { loadPayments() }, [loadPayments])

  const filteredPayments = payments.filter(p => {
    if (!histSearch) return true
    const name = `${p.student?.first_name || ''} ${p.student?.last_name || ''}`.toLowerCase()
    return name.includes(histSearch.toLowerCase())
  })

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount_paid), 0)
  const cashCount = payments.filter(p => p.payment_mode === 'CASH').length
  const onlineCount = payments.filter(p => p.payment_mode === 'ONLINE' || p.payment_mode === 'UPI').length

  const fmtINR = (v: number) => `₹${v.toLocaleString('en-IN')}`

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Compact Stat Row ── */}
        <div className='d-flex flex-wrap gap-4 mb-6'>
          {[
            { label: 'Total Collected', value: paymentsLoading ? '—' : fmtINR(totalCollected), icon: 'ki-dollar' },
            { label: 'Transactions', value: paymentsLoading ? '—' : payments.length, icon: 'ki-receipt-square' },
            { label: 'Cash', value: paymentsLoading ? '—' : cashCount, icon: 'ki-wallet' },
            { label: 'Online / UPI', value: paymentsLoading ? '—' : onlineCount, icon: 'ki-credit-cart' },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className='d-flex align-items-center gap-3 bg-white border border-gray-200 rounded px-4 py-3'
              style={{ minWidth: 160 }}
            >
              <div className='w-32px h-32px bg-light-primary rounded d-flex align-items-center justify-content-center flex-shrink-0'>
                <i className={`ki-duotone ${icon} fs-4 text-primary`}>
                  <span className='path1' /><span className='path2' />
                </i>
              </div>
              <div>
                <div className='fw-bolder text-gray-800 fs-6 lh-1'>{value}</div>
                <div className='text-muted fs-8 mt-1'>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className='card card-flush mb-0 border-bottom-0' style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <div className='card-header px-6 pt-5 pb-0 border-bottom-0'>
            <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mb-0'>
              {([
                ['generate', 'ki-bill', 'Generate Invoices'],
                ['history', 'ki-receipt-square', 'Collection History'],
              ] as const).map(([tab, icon, label]) => (
                <li key={tab} className='nav-item'>
                  <a
                    href='#'
                    className={`nav-link pb-4 ${activeTab === tab ? 'active text-primary' : 'text-muted'}`}
                    onClick={e => { e.preventDefault(); setActiveTab(tab) }}
                  >
                    <i className={`ki-duotone ${icon} fs-5 me-2`}>
                      <span className='path1' /><span className='path2' />
                    </i>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══════ TAB: GENERATE INVOICES ══════ */}
        {activeTab === 'generate' && (
          <div className='card card-flush' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className='card-body py-8'>
              <div className='row g-8'>

                {/* Left: Form */}
                <div className='col-lg-6'>
                  <h5 className='fw-bold text-gray-800 mb-1'>Generate Yearly Invoices</h5>
                  <p className='text-muted fs-7 mb-6'>
                    Auto-generate all 12 months of invoices for a class
                  </p>

                  {genError && (
                    <Alert variant='danger' dismissible onClose={() => setGenError(null)} className='py-3 fs-7'>
                      {genError}
                    </Alert>
                  )}

                  <div className='mb-5'>
                    <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Class</label>
                    <select
                      className='form-select form-select-solid'
                      value={genForm.class_id}
                      onChange={e => setGenForm(p => ({ ...p, class_id: e.target.value }))}
                    >
                      <option value=''>Select class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className='mb-7'>
                    <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Academic Session</label>
                    <select
                      className='form-select form-select-solid'
                      value={genForm.academic_session_id}
                      onChange={e => setGenForm(p => ({ ...p, academic_session_id: e.target.value }))}
                    >
                      <option value=''>Select session...</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.session_year}{s.is_current ? ' (Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notice */}
                  <div className='notice d-flex bg-light-primary rounded border border-primary border-opacity-25 p-4 mb-7'>
                    <i className='ki-duotone ki-information-4 fs-2x text-primary me-3 flex-shrink-0'>
                      <span className='path1' /><span className='path2' /><span className='path3' />
                    </i>
                    <div className='fs-7 text-gray-700'>
                      <div className='fw-bold text-gray-800 mb-1'>Yearly Invoice Generation</div>
                      Generates <strong>12 invoices per student</strong> (Apr – Mar) for all active students.
                      Existing invoices are <strong>skipped automatically</strong> — no duplicates.
                    </div>
                  </div>

                  <button
                    className='btn btn-primary w-100'
                    onClick={handleGenerate}
                    disabled={generating || !genForm.class_id || !genForm.academic_session_id}
                  >
                    {generating
                      ? <><span className='spinner-border spinner-border-sm me-2' />Generating...</>
                      : <>
                        <i className='ki-duotone ki-bill fs-4 me-2'><span className='path1' /><span className='path2' /></i>
                        Generate Full Year Invoices
                      </>
                    }
                  </button>
                </div>

                {/* Right: Result or Guide */}
                <div className='col-lg-6'>
                  {genResult ? (
                    <div className='d-flex flex-column h-100'>
                      {/* Success Header */}
                      <div className='d-flex align-items-center gap-3 mb-6'>
                        <div className='w-40px h-40px bg-light-success rounded-circle d-flex align-items-center justify-content-center'>
                          <i className='ki-duotone ki-check-circle fs-2 text-success'>
                            <span className='path1' /><span className='path2' />
                          </i>
                        </div>
                        <div>
                          <div className='fw-bold text-gray-800 fs-6'>Invoices Generated!</div>
                          <div className='text-muted fs-8'>Yearly invoicing completed successfully</div>
                        </div>
                      </div>

                      {/* Result Stats */}
                      <div className='row g-4 mb-6'>
                        {[
                          { label: 'Newly Generated', value: genResult.generated, color: 'success' },
                          { label: 'Already Existed', value: genResult.updated, color: 'warning' },
                          { label: 'Total Students', value: genResult.total_students, color: 'primary' },
                          { label: 'Months / Student', value: genResult.total_months_per_student, color: 'primary' },
                        ].map(({ label, value, color }) => (
                          <div className='col-6' key={label}>
                            <div className='border border-gray-200 rounded px-4 py-3 bg-white text-center'>
                              <div className={`fw-bolder text-${color} fs-2`}>{value}</div>
                              <div className='text-muted fw-semibold fs-8 mt-1'>{label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        className='btn btn-light-primary btn-sm align-self-start'
                        onClick={() => setGenResult(null)}
                      >
                        <i className='ki-duotone ki-arrow-left fs-5 me-1'><span className='path1' /><span className='path2' /></i>
                        Generate Another
                      </button>
                    </div>
                  ) : (
                    /* How it works guide */
                    <div className='bg-light rounded p-6 h-100'>
                      <div className='fw-bold text-gray-700 fs-7 text-uppercase mb-5'>How it works</div>
                      <div className='d-flex flex-column gap-4'>
                        {[
                          { icon: 'ki-magnifier', text: 'Finds all active students enrolled in the selected class' },
                          { icon: 'ki-calendar', text: 'Generates invoices for all 12 months (Apr – Mar) in one click' },
                          { icon: 'ki-shield-tick', text: 'Skips months where invoices already exist — no duplicates' },
                          { icon: 'ki-basket', text: 'Each invoice includes all fee items from the assigned fee group' },
                          { icon: 'ki-graph-up', text: 'After generating, collect fees month-wise from Fee Collection page' },
                        ].map(({ icon, text }) => (
                          <div key={text} className='d-flex align-items-start gap-3'>
                            <div className='w-28px h-28px bg-light-primary rounded d-flex align-items-center justify-content-center flex-shrink-0 mt-1'>
                              <i className={`ki-duotone ${icon} fs-6 text-primary`}>
                                <span className='path1' /><span className='path2' />
                              </i>
                            </div>
                            <span className='text-gray-600 fs-7 fw-semibold'>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: PAYMENT HISTORY ══════ */}
        {activeTab === 'history' && (
          <div className='card card-flush' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>

            {/* ── Toolbar: Search + Filters ── */}
            <div className='card-header align-items-center py-5 border-bottom gap-3 flex-wrap'>
              {/* Search */}
              <div className='d-flex align-items-center position-relative'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4 text-gray-400'>
                  <span className='path1' /><span className='path2' />
                </i>
                <input
                  type='text'
                  className='form-control form-control-solid w-280px ps-13'
                  placeholder='Search by student name...'
                  value={histSearch}
                  onChange={e => setHistSearch(e.target.value)}
                />
              </div>

              {/* Right side filters */}
              <div className='d-flex align-items-center gap-3 ms-auto'>
                <span className='text-muted fs-7 fw-semibold'>
                  {filteredPayments.length} of {payments.length} records
                </span>
              </div>
            </div>

            {/* ── Error ── */}
            {paymentsError && (
              <div className='mx-7 mt-5'>
                <div className='alert alert-danger py-3 px-4 fs-7'>{paymentsError}</div>
              </div>
            )}

            {/* ── Table ── */}
            <div className='card-body p-0'>
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-0'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-8 text-uppercase border-bottom border-gray-200'>
                      <th className='ps-7 w-50px py-5'>#</th>
                      <th className='py-5 min-w-200px'>Student</th>
                      <th className='py-5 min-w-100px'>Month</th>
                      <th className='py-5 min-w-120px'>Payment Date</th>
                      <th className='py-5 min-w-120px'>Amount Paid</th>
                      <th className='py-5 min-w-100px'>Method</th>
                      <th className='py-5 min-w-100px'>Invoice #</th>
                      <th className='py-5'>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan={8} className='text-center py-14'>
                          <span className='spinner-border spinner-border-sm text-primary me-2' />
                          <span className='text-muted fs-6'>Loading payments...</span>
                        </td>
                      </tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='py-16'>
                          <div className='d-flex flex-column align-items-center text-center'>
                            <div className='w-65px h-65px bg-light-primary rounded-circle d-flex align-items-center justify-content-center mb-4'>
                              <i className='ki-duotone ki-receipt-square fs-2x text-primary'>
                                <span className='path1' /><span className='path2' />
                              </i>
                            </div>
                            <span className='text-gray-600 fw-semibold fs-5'>No payment records found</span>
                            <span className='text-muted fs-7 mt-2'>Payments will appear here once collected</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayments.map((p, i) => {
                      // derive display month from payment_date or invoice period
                      const monthLabel = p.payment_date
                        ? new Date(p.payment_date).toLocaleDateString('en-IN', { month: 'short' })
                        : '—'

                      return (
                        <tr
                          key={p.id}
                          className='border-bottom border-gray-100'
                          style={{ minHeight: 72 }}
                        >
                          {/* # */}
                          <td className='ps-7 py-5'>
                            <span className='text-gray-400 fw-semibold fs-6'>{i + 1}</span>
                          </td>

                          {/* Student */}
                          <td className='py-5'>
                            <div className='d-flex align-items-center gap-3'>
                              <div
                                className='d-flex align-items-center justify-content-center rounded flex-shrink-0 fw-bold text-primary fs-5'
                                style={{
                                  width: 42, height: 42,
                                  background: '#e8eeff',
                                  borderRadius: 10,
                                  letterSpacing: 0,
                                }}
                              >
                                {p.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className='fw-semibold text-gray-800 fs-6'>
                                {p.student
                                  ? `${p.student.first_name} ${p.student.last_name}`
                                  : `Student #${p.student_id}`}
                              </span>
                            </div>
                          </td>

                          {/* Month badge */}
                          <td className='py-5'>
                            <span
                              className='badge fs-7 fw-bold px-3 py-2'
                              style={{ background: '#e8eeff', color: '#3b5bdb', borderRadius: 8 }}
                            >
                              {monthLabel}
                            </span>
                          </td>

                          {/* Payment Date */}
                          <td className='py-5'>
                            <span className='text-gray-500 fs-6'>
                              {p.payment_date
                                ? new Date(p.payment_date).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })
                                : '—'}
                            </span>
                          </td>

                          {/* Amount Paid */}
                          <td className='py-5'>
                            <span className='fw-bold text-gray-800 fs-5'>
                              {fmtINR(Number(p.amount_paid))}
                            </span>
                          </td>

                          {/* Method */}
                          <td className='py-5'>
                            <span className='badge badge-light-primary fw-semibold fs-8 px-3 py-2'>
                              {p.payment_mode}
                            </span>
                          </td>

                          {/* Invoice # */}
                          <td className='py-5'>
                            <span className='text-gray-500 fs-6 fw-semibold'>
                              #{p.fee_invoice_id}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className='py-5'>
                            <span className='text-gray-400 fs-7'>{p.remarks || '—'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </Content>
    </>
  )
}

const CollectionWrapper: FC = () => (
  <>
    <PageTitle
      breadcrumbs={[
        { title: 'Fees', path: '/fees/collection', isActive: false },
        { title: 'Invoice Generate', path: '/fees/collection', isActive: true },
      ]}
    >
      Student Yearly Invoice Generate
    </PageTitle>
    <CollectionPage />
  </>
)

export { CollectionWrapper }