import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { getStudentDues, getInvoices } from './core/_requests'
import { getAcademicSessions, getClasses } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { FeeInvoiceModel } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const STATUS_COLOR: Record<string, string> = {
  UNPAID: 'danger', PARTIAL: 'warning', PAID: 'success', OVERDUE: 'dark',
}

const TrackingPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

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

  // ── Check Student Dues ─────────────────────────────────────────────────────
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [dues, setDues] = useState<FeeInvoiceModel[]>([])
  const [duesLoading, setDuesLoading] = useState(false)
  const [duesError, setDuesError] = useState<string | null>(null)
  const [duesSearched, setDuesSearched] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoiceModel | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  const searchDues = async () => {
    if (!filterStudent || !filterSession) { setDuesError('Select a student and session'); return }
    setDuesLoading(true); setDuesError(null); setDuesSearched(true)
    try {
      const { data } = await getStudentDues(schoolId, Number(filterStudent), Number(filterSession))
      if (data.success) setDues(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setDuesError(e.response?.data?.message || 'Failed to fetch dues')
    } finally { setDuesLoading(false) }
  }

  // ── All Invoices View ──────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<FeeInvoiceModel[]>([])
  const [invLoading, setInvLoading] = useState(false)
  const [invError, setInvError] = useState<string | null>(null)
  const [invFilterClass, setInvFilterClass] = useState('')
  const [invFilterStatus, setInvFilterStatus] = useState('')
  const [invFilterSession, setInvFilterSession] = useState('')
  const [invSearch, setInvSearch] = useState('')

  const loadInvoices = useCallback(async () => {
    if (!schoolId) return
    setInvLoading(true); setInvError(null)
    try {
      const params: any = { limit: 100 }
      if (invFilterStatus) params.status = invFilterStatus
      if (invFilterClass) params.class_id = Number(invFilterClass)
      if (invFilterSession) params.academic_session_id = Number(invFilterSession)
      const { data } = await getInvoices(schoolId, params)
      if (data.success) setInvoices(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setInvError(e.response?.data?.message || 'Failed to load invoices')
    } finally { setInvLoading(false) }
  }, [schoolId, invFilterStatus, invFilterClass, invFilterSession])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const filteredInvoices = invoices.filter(inv => {
    if (!invSearch) return true
    const name = `${inv.student?.first_name || ''} ${inv.student?.last_name || ''}`.toLowerCase()
    return name.includes(invSearch.toLowerCase())
  })

  const totalPending = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.net_amount) - Number(i.paid_amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'PAID').length
  const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Invoices', value: invoices.length, color: 'primary', icon: 'ki-duotone ki-bill' },
            { label: 'Unpaid', value: unpaidCount, color: 'danger', icon: 'ki-duotone ki-cross-circle' },
            { label: 'Paid Invoices', value: totalPaid, color: 'success', icon: 'ki-duotone ki-check-circle' },
            { label: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, color: 'warning', icon: 'ki-duotone ki-dollar' },
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
                    <div className={`fs-2 fw-bolder text-${color}`}>{invLoading ? '—' : value}</div>
                    <div className='text-gray-600 fw-semibold fs-7'>{label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Student Dues Lookup ── */}
        <div className='card card-flush mb-6'>
          <div className='card-header border-0 pt-6'>
            <h3 className='card-title fw-bold'>
              <i className='ki-duotone ki-user-search fs-2 text-danger me-2'><span className='path1' /><span className='path2' /><span className='path3' /></i>
              Check Student Pending Dues
            </h3>
          </div>
          <div className='card-body pt-3'>
            <div className='row g-4 align-items-end mb-4'>
              <div className='col-md-4'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Student</label>
                <select className='form-select form-select-solid form-select-sm' value={filterStudent}
                  onChange={e => { setFilterStudent(e.target.value); setDuesSearched(false) }}>
                  <option value=''>Select student...</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-4'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Academic Session</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSession}
                  onChange={e => { setFilterSession(e.target.value); setDuesSearched(false) }}>
                  <option value=''>Select session...</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
                </select>
              </div>
              <div className='col-md-4 d-flex gap-3'>
                <button className='btn btn-danger btn-sm flex-grow-1' onClick={searchDues} disabled={duesLoading}>
                  {duesLoading ? <span className='spinner-border spinner-border-sm me-2' /> : <i className='ki-duotone ki-magnifier fs-4 me-1'><span className='path1' /><span className='path2' /></i>}
                  View Dues
                </button>
                {duesSearched && (
                  <button className='btn btn-light btn-sm' onClick={() => { setFilterStudent(''); setFilterSession(''); setDues([]); setDuesSearched(false) }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {duesError && <div className='alert alert-danger'>{duesError}</div>}

            {duesSearched && !duesLoading && (
              dues.length === 0 ? (
                <div className='text-center py-8'>
                  <i className='ki-duotone ki-check-circle fs-3x text-success mb-3'><span className='path1' /><span className='path2' /></i>
                  <p className='text-success fw-bold fs-5 mb-0'>No pending dues! Student is fully paid up. 🎉</p>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table align-middle table-row-dashed fs-6 gy-4'>
                    <thead>
                      <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                        <th>Month</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Net Due</th>
                        <th>Fine</th>
                        <th>Status</th>
                        <th className='text-end'>Details</th>
                      </tr>
                    </thead>
                    <tbody className='fw-semibold text-gray-600'>
                      {dues.map(inv => (
                        <tr key={inv.id}>
                          <td><span className='fw-bold text-gray-800'>{inv.invoice_month}</span></td>
                          <td className='text-muted'>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                          <td className='fw-bold'>₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                          <td className='text-success fw-bold'>₹{Number(inv.paid_amount).toLocaleString('en-IN')}</td>
                          <td className='text-danger fw-bolder'>₹{(Number(inv.net_amount) - Number(inv.paid_amount)).toLocaleString('en-IN')}</td>
                          <td className='text-warning'>{Number(inv.fine_amount) > 0 ? `₹${Number(inv.fine_amount).toLocaleString('en-IN')}` : '—'}</td>
                          <td>
                            <span className={`badge badge-light-${STATUS_COLOR[inv.status] || 'secondary'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className='text-end'>
                            <button className='btn btn-sm btn-icon btn-light btn-active-light-primary'
                              onClick={() => { setSelectedInvoice(inv); setShowInvoiceModal(true) }} title='View items'>
                              <i className='ki-duotone ki-eye fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── All Invoices Table ── */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-4'>
            <div className='card-title'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'><span className='path1' /><span className='path2' /></i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search by student name...' value={invSearch} onChange={e => setInvSearch(e.target.value)} />
              </div>
            </div>
            <div className='card-toolbar gap-3 flex-wrap'>
              <select className='form-select form-select-solid form-select-sm w-auto'
                value={invFilterStatus} onChange={e => setInvFilterStatus(e.target.value)}>
                <option value=''>All Status</option>
                {['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className='form-select form-select-solid form-select-sm w-auto'
                value={invFilterClass} onChange={e => setInvFilterClass(e.target.value)}>
                <option value=''>All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className='form-select form-select-solid form-select-sm w-auto'
                value={invFilterSession} onChange={e => setInvFilterSession(e.target.value)}>
                <option value=''>All Sessions</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year}</option>)}
              </select>
            </div>
          </div>
          <div className='card-body pt-0'>
            {invError && <div className='alert alert-danger mb-4'>{invError}</div>}
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>#</th>
                    <th>Student</th>
                    <th>Month</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th className='text-end'>Details</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {invLoading ? (
                    <tr><td colSpan={9} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                    </td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan={9} className='text-center py-12'>
                      <div className='d-flex flex-column align-items-center'>
                        <i className='ki-duotone ki-bill fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                        <span className='text-gray-500'>No invoices found. Generate invoices first.</span>
                      </div>
                    </td></tr>
                  ) : filteredInvoices.map((inv, i) => (
                    <tr key={inv.id}>
                      <td><span className='text-muted'>{i + 1}</span></td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-35px me-3'>
                            <div className='symbol-label fs-4 fw-bold text-primary bg-light-primary'>
                              {inv.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <span className='fw-bold text-gray-800'>
                            {inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : `Student #${inv.student_id}`}
                          </span>
                        </div>
                      </td>
                      <td><span className='badge badge-light-primary fw-bold'>{inv.invoice_month}</span></td>
                      <td className='text-muted'>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className='fw-bold'>₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                      <td className='text-success fw-bold'>₹{Number(inv.paid_amount).toLocaleString('en-IN')}</td>
                      <td className='text-danger fw-bold'>
                        ₹{(Number(inv.net_amount) - Number(inv.paid_amount)).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge badge-light-${STATUS_COLOR[inv.status] || 'secondary'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className='text-end'>
                        <button className='btn btn-sm btn-icon btn-light btn-active-light-primary'
                          onClick={() => { setSelectedInvoice(inv); setShowInvoiceModal(true) }} title='View breakdown'>
                          <i className='ki-duotone ki-eye fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Content>

      {/* ── Invoice Detail Modal ── */}
      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} centered size='lg'>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-bill fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
            Invoice Breakdown — {selectedInvoice?.invoice_month}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {selectedInvoice && (
            <>
              <div className='row g-4 mb-5'>
                {[
                  { label: 'Total Amount', value: `₹${Number(selectedInvoice.total_amount).toLocaleString('en-IN')}`, color: 'primary' },
                  { label: 'Concession', value: `₹${Number(selectedInvoice.concession_amount).toLocaleString('en-IN')}`, color: 'info' },
                  { label: 'Fine', value: `₹${Number(selectedInvoice.fine_amount).toLocaleString('en-IN')}`, color: 'warning' },
                  { label: 'Paid', value: `₹${Number(selectedInvoice.paid_amount).toLocaleString('en-IN')}`, color: 'success' },
                ].map(({ label, value, color }) => (
                  <div key={label} className='col-sm-6 col-md-3'>
                    <div className={`bg-light-${color} rounded p-3 text-center`}>
                      <div className={`fw-bold text-${color} fs-5`}>{value}</div>
                      <div className='text-muted fs-8 mt-1'>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className='d-flex align-items-center justify-content-between bg-light-danger rounded p-4 mb-5'>
                <span className='fw-bold text-gray-700'>Net Balance Due</span>
                <span className='fw-bolder text-danger fs-4'>
                  ₹{(Number(selectedInvoice.net_amount) - Number(selectedInvoice.paid_amount)).toLocaleString('en-IN')}
                </span>
              </div>
              <h6 className='fw-bold text-gray-700 mb-4'>Fee Breakdown by Category</h6>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                selectedInvoice.items.map(item => (
                  <div key={item.id} className='d-flex align-items-center justify-content-between bg-light rounded px-4 py-3 mb-2'>
                    <div>
                      <span className='fw-semibold text-gray-800'>{item.fee_category?.name || `Category #${item.fee_category_id}`}</span>
                      {item.fee_category?.description && (
                        <div className='text-muted fs-8'>{item.fee_category.description}</div>
                      )}
                    </div>
                    <span className='fw-bold text-primary fs-5'>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))
              ) : (
                <div className='text-muted text-center py-4'>No breakdown items available</div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <button className='btn btn-light' onClick={() => setShowInvoiceModal(false)}>Close</button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const TrackingWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/tracking', isActive: false }, { title: 'Payment Tracking', path: '/fees/tracking', isActive: true }]}>
      Payment Tracking
    </PageTitle>
    <TrackingPage />
  </>
)

export { TrackingWrapper }
