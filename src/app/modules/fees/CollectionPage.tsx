import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import { generateInvoices, collectPayment, getPayments } from './core/_requests'
import { getAcademicSessions, getClasses } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { FeePaymentModel, GenerateInvoicesResult } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const PAYMENT_METHODS = ['Cash', 'Cheque', 'Online', 'UPI', 'DD']

const STATUS_COLOR: Record<string, string> = {
  CASH: 'success', ONLINE: 'primary', CHEQUE: 'warning', UPI: 'info', DD: 'secondary',
}

const CollectionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<'generate' | 'collect' | 'history'>('collect')

  // ── Meta ───────────────────────────────────────────────────────────────────
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

  // ── Generate Invoices (Yearly mode) ─────────────────────────────────────────
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

  // ── Collect Payment ────────────────────────────────────────────────────────
  const [collectForm, setCollectForm] = useState({
    student_id: '', academic_session_id: '', amount: '',
    payment_method: 'Cash', payment_date: new Date().toISOString().slice(0, 10), notes: '',
  })
  const [collecting, setCollecting] = useState(false)
  const [collectError, setCollectError] = useState<string | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<FeePaymentModel | null>(null)

  const handleCollect = async () => {
    if (!collectForm.student_id || !collectForm.academic_session_id || !collectForm.amount || !collectForm.payment_date) {
      setCollectError('Student, session, amount & date are required'); return
    }
    setCollecting(true); setCollectError(null)
    try {
      const { data } = await collectPayment(schoolId, {
        student_id: Number(collectForm.student_id),
        academic_session_id: Number(collectForm.academic_session_id),
        amount: Number(collectForm.amount),
        payment_method: collectForm.payment_method,
        payment_date: collectForm.payment_date,
        notes: collectForm.notes,
      })
      if (data.success) {
        setLastReceipt(data.data)
        setShowReceiptModal(true)
        setCollectForm({ student_id: '', academic_session_id: '', amount: '', payment_method: 'Cash', payment_date: new Date().toISOString().slice(0, 10), notes: '' })
        loadPayments()
      }
    } catch (e: any) {
      setCollectError(e.response?.data?.message || 'Failed to collect payment')
    } finally { setCollecting(false) }
  }

  // ── Payment History ────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<FeePaymentModel[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [histSearch, setHistSearch] = useState('')

  const loadPayments = useCallback(async () => {
    if (!schoolId) return
    setPaymentsLoading(true); setPaymentsError(null)
    try {
      const { data } = await getPayments(schoolId, { limit: 100 })
      if (data.success) {
        setPayments(extractArray(data.data, 'payments', 'fee_payments', 'data'))
      } else {
        setPaymentsError(data.message || 'Failed to load payments')
      }
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

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: 'success', icon: 'ki-duotone ki-dollar' },
            { label: 'Total Transactions', value: payments.length, color: 'primary', icon: 'ki-duotone ki-receipt-square' },
            { label: 'Cash Payments', value: payments.filter(p => p.payment_mode === 'CASH').length, color: 'warning', icon: 'ki-duotone ki-wallet' },
            { label: 'Online Payments', value: payments.filter(p => p.payment_mode === 'ONLINE' || p.payment_mode === 'UPI').length, color: 'info', icon: 'ki-duotone ki-credit-cart' },
          ].map(({ label, value, color, icon }) => (
            <div className='col-sm-6 col-xl-3' key={label}>
              <div className={`card card-flush bg-light-${color} border-0 h-100`}>
                <div className='card-body d-flex align-items-center py-5'>
                  <div className={`symbol symbol-50px me-4 bg-${color} bg-opacity-15 rounded-circle`}>
                    <div className='symbol-label d-flex align-items-center justify-content-center'>
                      <i className={`${icon} fs-2x text-${color}`}><span className='path1' /><span className='path2' /></i>
                    </div>
                  </div>
                  <div>
                    <div className={`fs-2 fw-bolder text-${color}`}>{paymentsLoading ? '—' : value}</div>
                    <div className='text-gray-600 fw-semibold fs-7'>{label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-5 fw-semibold mb-6'>
          {([
            ['collect', 'ki-wallet', 'Collect Payment'],
            ['generate', 'ki-bill', 'Generate Invoices'],
            ['history', 'ki-receipt-square', 'Payment History'],
          ] as const).map(([tab, icon, label]) => (
            <li key={tab} className='nav-item'>
              <a className={`nav-link text-active-primary pb-4 ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)} href='#' style={{ cursor: 'pointer' }}>
                <i className={`ki-duotone ${icon} fs-4 me-2`}><span className='path1' /><span className='path2' /></i>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ══════════════ TAB: COLLECT PAYMENT ══════════════ */}
        {activeTab === 'collect' && (
          <div className='row'>
            <div className='col-lg-7 col-xl-6'>
              <div className='card card-flush'>
                <div className='card-header border-0 pt-6'>
                  <div className='card-title d-flex align-items-center'>
                    <div className='symbol symbol-40px bg-light-success rounded me-3'>
                      <div className='symbol-label d-flex align-items-center justify-content-center'>
                        <i className='ki-duotone ki-wallet fs-2 text-success'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                      </div>
                    </div>
                    <div>
                      <h4 className='fw-bold mb-0'>Collect Offline Payment</h4>
                      <span className='text-muted fs-7'>Register cash / cheque payment from student</span>
                    </div>
                  </div>
                </div>
                <div className='card-body pt-4'>
                  {collectError && <Alert variant='danger' dismissible onClose={() => setCollectError(null)}>{collectError}</Alert>}

                  <div className='mb-5'>
                    <label className='required fw-semibold fs-6 mb-2'>Student</label>
                    <div className='d-flex gap-3'>
                      <select className='form-select form-select-solid' value={collectForm.student_id}
                        onChange={e => setCollectForm(p => ({ ...p, student_id: e.target.value }))}>
                        <option value=''>Search / Select student...</option>
                        {students.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className='mb-5'>
                    <label className='required fw-semibold fs-6 mb-2'>Academic Session</label>
                    <select className='form-select form-select-solid' value={collectForm.academic_session_id}
                      onChange={e => setCollectForm(p => ({ ...p, academic_session_id: e.target.value }))}>
                      <option value=''>Select session...</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
                    </select>
                  </div>

                  <div className='row g-4 mb-5'>
                    <div className='col-md-6'>
                      <label className='required fw-semibold fs-6 mb-2'>Amount (₹)</label>
                      <input type='number' min='0' className='form-control form-control-solid'
                        placeholder='e.g. 3000' value={collectForm.amount}
                        onChange={e => setCollectForm(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className='col-md-6'>
                      <label className='required fw-semibold fs-6 mb-2'>Payment Date</label>
                      <input type='date' className='form-control form-control-solid'
                        value={collectForm.payment_date}
                        onChange={e => setCollectForm(p => ({ ...p, payment_date: e.target.value }))} />
                    </div>
                  </div>

                  <div className='mb-5'>
                    <label className='required fw-semibold fs-6 mb-2'>Payment Method</label>
                    <div className='d-flex flex-wrap gap-3'>
                      {PAYMENT_METHODS.map(method => (
                        <label key={method}
                          className={`btn btn-sm fw-semibold ${collectForm.payment_method === method ? 'btn-primary' : 'btn-light-primary'}`}
                          style={{ cursor: 'pointer' }}>
                          <input type='radio' name='payment_method' value={method}
                            checked={collectForm.payment_method === method}
                            onChange={() => setCollectForm(p => ({ ...p, payment_method: method }))}
                            className='d-none' />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className='mb-7'>
                    <label className='fw-semibold fs-6 mb-2'>Notes / Remarks</label>
                    <input className='form-control form-control-solid' placeholder='e.g. Paid by Father'
                      value={collectForm.notes} onChange={e => setCollectForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>

                  <button className='btn btn-success w-100' onClick={handleCollect} disabled={collecting}>
                    {collecting
                      ? <><span className='spinner-border spinner-border-sm me-2' />Processing...</>
                      : <><i className='ki-duotone ki-check-circle fs-2 me-2'><span className='path1' /><span className='path2' /></i>Collect Payment</>
                    }
                  </button>
                </div>
              </div>
            </div>

            <div className='col-lg-5 col-xl-6'>
              <div className='card card-flush bg-light-success border-0 h-100'>
                <div className='card-body d-flex flex-column align-items-center justify-content-center text-center py-14'>
                  <i className='ki-duotone ki-shield-tick fs-5x text-success mb-5'>
                    <span className='path1' /><span className='path2' /><span className='path3' />
                  </i>
                  <h4 className='fw-bold text-gray-800 mb-3'>Smart Payment Engine</h4>
                  <p className='text-muted mx-8 mb-0'>
                    When you collect a payment, the system automatically scans all pending invoices for the student and applies the amount — starting from the oldest unpaid invoice.
                  </p>
                  <div className='d-flex flex-column gap-3 mt-8 text-start w-100 px-8'>
                    {['Finds all UNPAID invoices automatically', 'Applies amount to oldest dues first', 'Marks invoices as PAID or PARTIAL', 'Generates receipt instantly'].map(f => (
                      <div key={f} className='d-flex align-items-center gap-3'>
                        <i className='ki-duotone ki-check-circle fs-4 text-success'><span className='path1' /><span className='path2' /></i>
                        <span className='fw-semibold text-gray-700 fs-6'>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: GENERATE INVOICES (Yearly) ══════════════ */}
        {activeTab === 'generate' && (
          <div className='row g-6'>
            {/* Left: Form Card */}
            <div className='col-lg-6'>
              <div className='card card-flush h-100'>
                <div className='card-header border-0 pt-6'>
                  <div className='card-title d-flex align-items-center'>
                    <div className='symbol symbol-45px bg-light-primary rounded me-3'>
                      <div className='symbol-label d-flex align-items-center justify-content-center'>
                        <i className='ki-duotone ki-bill fs-2 text-primary'><span className='path1' /><span className='path2' /></i>
                      </div>
                    </div>
                    <div>
                      <h4 className='fw-bold mb-0'>Generate Yearly Invoices</h4>
                      <span className='text-muted fs-7'>Auto-generate all 12 months of invoices for a class</span>
                    </div>
                  </div>
                </div>
                <div className='card-body pt-2'>
                  {genError && <Alert variant='danger' dismissible onClose={() => setGenError(null)}>{genError}</Alert>}

                  <div className='mb-6'>
                    <label className='required fw-semibold fs-6 mb-2'>Class</label>
                    <select className='form-select form-select-solid' value={genForm.class_id}
                      onChange={e => setGenForm(p => ({ ...p, class_id: e.target.value }))}>
                      <option value=''>Select class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className='mb-8'>
                    <label className='required fw-semibold fs-6 mb-2'>Academic Session</label>
                    <select className='form-select form-select-solid' value={genForm.academic_session_id}
                      onChange={e => setGenForm(p => ({ ...p, academic_session_id: e.target.value }))}>
                      <option value=''>Select session...</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
                    </select>
                  </div>

                  {/* Info notice */}
                  <div className='notice d-flex bg-light-info rounded-2 border border-info border-opacity-25 p-5 mb-6'>
                    <i className='ki-duotone ki-information-4 fs-2x text-info me-4 flex-shrink-0'>
                      <span className='path1' /><span className='path2' /><span className='path3' />
                    </i>
                    <div className='fs-7 text-gray-700'>
                      <div className='fw-bold text-gray-800 mb-1'>Yearly Invoice Generation</div>
                      This will generate <strong>12 invoices per student</strong> (Apr – Mar) for all active students in the selected class & session.
                      If invoices already exist for a month, they will be <strong>skipped or updated</strong> automatically — no duplicates.
                    </div>
                  </div>

                  <button
                    className='btn btn-primary w-100 py-3 fw-bold fs-6'
                    onClick={handleGenerate}
                    disabled={generating || !genForm.class_id || !genForm.academic_session_id}
                  >
                    {generating
                      ? <><span className='spinner-border spinner-border-sm me-2' />Generating All 12 Months...</>
                      : <><i className='ki-duotone ki-bill fs-3 me-2'><span className='path1' /><span className='path2' /></i>Generate Full Year Invoices</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Result / Info panel */}
            <div className='col-lg-6'>
              {genResult ? (
                /* Success Result Card */
                <div className='card card-flush border-0 h-100' style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
                  <div className='card-body d-flex flex-column align-items-center justify-content-center text-center py-10 px-8'>
                    <div className='symbol symbol-80px mb-6 rounded-circle bg-success bg-opacity-15'>
                      <div className='symbol-label d-flex align-items-center justify-content-center'>
                        <i className='bi bi-check-circle-fill text-success' style={{ fontSize: '2.5rem' }}></i>
                      </div>
                    </div>
                    <h3 className='fw-bolder text-gray-900 mb-2'>Invoices Generated!</h3>
                    <p className='text-muted fs-7 mb-8'>Yearly invoicing process completed successfully</p>

                    {/* Result stats grid */}
                    <div className='row g-4 w-100 mb-4'>
                      {[
                        { label: 'Newly Generated', value: genResult.generated, color: 'success', icon: 'bi-file-earmark-plus' },
                        { label: 'Already Existed', value: genResult.updated, color: 'warning', icon: 'bi-arrow-repeat' },
                        { label: 'Total Students', value: genResult.total_students, color: 'primary', icon: 'bi-people' },
                        { label: 'Months / Student', value: genResult.total_months_per_student, color: 'info', icon: 'bi-calendar3' },
                      ].map(({ label, value, color, icon }) => (
                        <div className='col-6' key={label}>
                          <div className='rounded-2 p-4 text-center' style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <i className={`bi ${icon} text-${color} mb-2`} style={{ fontSize: '1.4rem', display: 'block' }}></i>
                            <div className={`fw-bolder text-${color} fs-2`}>{value}</div>
                            <div className='text-muted fw-semibold fs-8'>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className='btn btn-light-success fw-bold px-8'
                      onClick={() => setGenResult(null)}>
                      <i className='bi bi-arrow-left me-2'></i>Generate Another
                    </button>
                  </div>
                </div>
              ) : (
                /* Info / guidance card */
                <div className='card card-flush border-0 h-100 bg-light-primary'>
                  <div className='card-body d-flex flex-column align-items-start justify-content-center px-8 py-10'>
                    <i className='ki-duotone ki-calendar fs-5x text-primary mb-6'>
                      <span className='path1' /><span className='path2' />
                    </i>
                    <h4 className='fw-bolder text-gray-800 mb-3'>How Yearly Generation Works</h4>
                    <div className='d-flex flex-column gap-4 text-start w-100'>
                      {[
                        { icon: 'bi-search', color: 'primary', text: 'Finds all Active students enrolled in the selected class' },
                        { icon: 'bi-calendar-range', color: 'primary', text: 'Generates invoices for all 12 months (Apr – Mar) in one click' },
                        { icon: 'bi-shield-check', color: 'success', text: 'Skips months where invoices already exist — no duplicates' },
                        { icon: 'bi-boxes', color: 'info', text: 'Each invoice includes all fee items assigned to the student\'s fee group' },
                        { icon: 'bi-graph-up-arrow', color: 'warning', text: 'After generating, use the Fee Collection page to collect month-wise' },
                      ].map(({ icon, color, text }) => (
                        <div key={text} className='d-flex align-items-start gap-3'>
                          <i className={`bi ${icon} text-${color} flex-shrink-0 mt-1`} style={{ fontSize: '1rem' }}></i>
                          <span className='fw-semibold text-gray-700 fs-7'>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: PAYMENT HISTORY ══════════════ */}
        {activeTab === 'history' && (
          <div className='card card-flush'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <div className='d-flex align-items-center position-relative my-1'>
                  <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'><span className='path1' /><span className='path2' /></i>
                  <input type='text' className='form-control form-control-solid w-250px ps-14'
                    placeholder='Search by student name...' value={histSearch} onChange={e => setHistSearch(e.target.value)} />
                </div>
              </div>
              <div className='card-toolbar'>
                <span className='text-muted fs-7 fw-semibold'>{payments.length} payments</span>
              </div>
            </div>
            <div className='card-body pt-0'>
              {paymentsError && <div className='alert alert-danger mb-4'>{paymentsError}</div>}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th>Student</th>
                      <th>Amount Paid</th>
                      <th>Method</th>
                      <th>Payment Date</th>
                      <th>Invoice #</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {paymentsLoading ? (
                      <tr><td colSpan={7} className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                      </td></tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-12'>
                        <div className='d-flex flex-column align-items-center'>
                          <i className='ki-duotone ki-receipt-square fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                          <span className='text-gray-500'>No payment records found</span>
                        </div>
                      </td></tr>
                    ) : filteredPayments.map((p, i) => (
                      <tr key={p.id}>
                        <td><span className='text-muted'>{i + 1}</span></td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-35px me-3'>
                              <div className='symbol-label fs-4 fw-bold text-success bg-light-success'>
                                {p.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </div>
                            <div className='fw-bold text-gray-800'>
                              {p.student ? `${p.student.first_name} ${p.student.last_name}` : `Student #${p.student_id}`}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className='fw-bold text-success fs-5'>₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${STATUS_COLOR[p.payment_mode] || 'secondary'} fw-bold`}>
                            {p.payment_mode}
                          </span>
                        </td>
                        <td className='text-muted'>
                          {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span className='badge badge-light-dark'>#{p.fee_invoice_id}</span>
                        </td>
                        <td className='text-muted fs-7'>{p.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Content>

      {/* ── Receipt Success Modal ── */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered>
        <Modal.Body className='py-10 px-10 text-center'>
          <div className='symbol symbol-75px mx-auto mb-5 bg-light-success rounded-circle'>
            <div className='symbol-label d-flex align-items-center justify-content-center'>
              <i className='ki-duotone ki-check-circle fs-3x text-success'><span className='path1' /><span className='path2' /></i>
            </div>
          </div>
          <h3 className='fw-bold text-gray-900 mb-3'>Payment Collected!</h3>
          {lastReceipt && (
            <div className='bg-light-success rounded p-5 text-start mt-4'>
              <div className='d-flex justify-content-between mb-2'>
                <span className='text-muted fs-7'>Receipt #</span>
                <span className='fw-bold'>TXN-{lastReceipt.id}</span>
              </div>
              <div className='d-flex justify-content-between mb-2'>
                <span className='text-muted fs-7'>Amount Paid</span>
                <span className='fw-bold text-success fs-5'>₹{Number(lastReceipt.amount_paid).toLocaleString('en-IN')}</span>
              </div>
              <div className='d-flex justify-content-between mb-2'>
                <span className='text-muted fs-7'>Method</span>
                <span className='fw-bold'>{lastReceipt.payment_mode}</span>
              </div>
              <div className='d-flex justify-content-between'>
                <span className='text-muted fs-7'>Date</span>
                <span className='fw-bold'>{lastReceipt.payment_date ? new Date(lastReceipt.payment_date).toLocaleDateString('en-IN') : '—'}</span>
              </div>
            </div>
          )}
          <button className='btn btn-success mt-6 w-100' onClick={() => setShowReceiptModal(false)}>
            Done
          </button>
        </Modal.Body>
      </Modal>
    </>
  )
}

const CollectionWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/collection', isActive: false }, { title: 'Collection', path: '/fees/collection', isActive: true }]}>
      Fee Collection
    </PageTitle>
    <CollectionPage />
  </>
)

export { CollectionWrapper }
