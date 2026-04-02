import { FC, useState, useEffect, useCallback, useRef } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { getPayments } from './core/_requests'
import { getAcademicSessions } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { FeePaymentModel } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const MODE_COLOR: Record<string, string> = {
  CASH: 'success', ONLINE: 'primary', CHEQUE: 'warning', UPI: 'info', DD: 'secondary',
}

const ReceiptsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [sessions, setSessions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [payments, setPayments] = useState<FeePaymentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterStudent, setFilterStudent] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [search, setSearch] = useState('')

  const [selectedPayment, setSelectedPayment] = useState<FeePaymentModel | null>(null)
  const [showModal, setShowModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, stRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getStudents(schoolId, { limit: 200 }),
      ])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (stRes.data.success) setStudents(stRes.data.data.students || [])
    } catch { }
  }, [schoolId])

  const loadPayments = useCallback(async () => {
    if (!schoolId) return
    setLoading(true); setError(null)
    try {
      const params: any = { limit: 200 }
      if (filterStudent) params.student_id = Number(filterStudent)
      const { data } = await getPayments(schoolId, params)
      if (data.success) setPayments(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load receipts')
    } finally { setLoading(false) }
  }, [schoolId, filterStudent])

  useEffect(() => { loadMeta() }, [loadMeta])
  useEffect(() => { loadPayments() }, [loadPayments])

  const filtered = payments.filter(p => {
    if (filterMode && p.payment_mode !== filterMode) return false
    if (search) {
      const name = `${p.student?.first_name || ''} ${p.student?.last_name || ''}`.toLowerCase()
      if (!name.includes(search.toLowerCase())) return false
    }
    return true
  })

  const handlePrint = () => {
    if (!selectedPayment) return
    const content = document.getElementById('receipt-print-area')?.innerHTML
    if (!content) return
    const win = window.open('', '_blank', 'width=600,height=700')
    if (!win) return
    win.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #3E97FF; padding-bottom: 12px; margin-bottom: 16px; }
        .header h2 { color: #3E97FF; margin: 0; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 13px; }
        .value { font-weight: bold; }
        .amount { font-size: 20px; color: #50CD89; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #aaa; font-size: 12px; }
      </style></head><body>${content}</body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Receipts', value: payments.length, color: 'primary', icon: 'ki-duotone ki-receipt-square' },
            { label: 'Total Collected', value: `₹${payments.reduce((s, p) => s + Number(p.amount_paid), 0).toLocaleString('en-IN')}`, color: 'success', icon: 'ki-duotone ki-dollar' },
            { label: 'Cash Receipts', value: payments.filter(p => p.payment_mode === 'CASH').length, color: 'warning', icon: 'ki-duotone ki-wallet' },
            { label: 'Digital Payments', value: payments.filter(p => ['ONLINE', 'UPI'].includes(p.payment_mode)).length, color: 'info', icon: 'ki-duotone ki-credit-cart' },
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
                    <div className={`fs-2 fw-bolder text-${color}`}>{loading ? '—' : value}</div>
                    <div className='text-gray-600 fw-semibold fs-7'>{label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Receipts Table ── */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-4 flex-wrap'>
            <div className='card-title'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'><span className='path1' /><span className='path2' /></i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search by student name...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className='card-toolbar gap-3 flex-wrap'>
              <select className='form-select form-select-solid form-select-sm w-150px' value={filterStudent}
                onChange={e => setFilterStudent(e.target.value)}>
                <option value=''>All Students</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              <select className='form-select form-select-solid form-select-sm w-150px' value={filterMode}
                onChange={e => setFilterMode(e.target.value)}>
                <option value=''>All Modes</option>
                {['CASH', 'ONLINE', 'CHEQUE', 'UPI', 'DD'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {(filterStudent || filterMode || search) && (
                <button className='btn btn-sm btn-light' onClick={() => { setFilterStudent(''); setFilterMode(''); setSearch('') }}>
                  Reset
                </button>
              )}
              <span className='text-muted fs-7 fw-semibold'>{filtered.length} receipts</span>
            </div>
          </div>
          <div className='card-body pt-0'>
            {error && <div className='alert alert-danger mb-4'>{error}</div>}
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>Receipt #</th>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Remarks</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr><td colSpan={8} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className='text-center py-12'>
                      <div className='d-flex flex-column align-items-center'>
                        <i className='ki-duotone ki-receipt-square fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                        <span className='text-gray-500'>No receipts found</span>
                      </div>
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span className='badge badge-light-primary fw-bold'>TXN-{p.id}</span>
                      </td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-35px me-3'>
                            <div className='symbol-label fs-4 fw-bold text-primary bg-light-primary'>
                              {p.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <span className='fw-bold text-gray-800'>
                            {p.student ? `${p.student.first_name} ${p.student.last_name}` : `Student #${p.student_id}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className='fw-bolder text-success fs-5'>₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <span className={`badge badge-light-${MODE_COLOR[p.payment_mode] || 'secondary'} fw-bold`}>
                          {p.payment_mode}
                        </span>
                      </td>
                      <td className='text-muted'>
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td><span className='badge badge-light-dark'>#{p.fee_invoice_id}</span></td>
                      <td className='text-muted fs-7'>{p.remarks || '—'}</td>
                      <td className='text-end'>
                        <button className='btn btn-sm btn-light btn-active-light-primary'
                          onClick={() => { setSelectedPayment(p); setShowModal(true) }}>
                          <i className='ki-duotone ki-printer fs-4 me-1'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                          Receipt
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

      {/* ── Receipt Print Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='sm'>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>Fee Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body ref={printRef} className='p-0'>
          {selectedPayment && (
            <div id='receipt-print-area' className='px-8 py-6'>
              <div className='text-center border-bottom border-primary pb-4 mb-5'>
                <div className='fw-bolder fs-2 text-primary mb-1'>Fee Receipt</div>
                <div className='text-muted fs-8'>{currentUser?.school_name || 'School Name'}</div>
              </div>
              <div className='d-flex justify-content-between mb-3'>
                <span className='text-muted fs-7'>Receipt No.</span>
                <span className='fw-bold'>TXN-{selectedPayment.id}</span>
              </div>
              <div className='d-flex justify-content-between mb-3'>
                <span className='text-muted fs-7'>Student</span>
                <span className='fw-bold'>
                  {selectedPayment.student ? `${selectedPayment.student.first_name} ${selectedPayment.student.last_name}` : `Student #${selectedPayment.student_id}`}
                </span>
              </div>
              <div className='d-flex justify-content-between mb-3'>
                <span className='text-muted fs-7'>Invoice #</span>
                <span className='fw-bold'>#{selectedPayment.fee_invoice_id}</span>
              </div>
              <div className='d-flex justify-content-between mb-3'>
                <span className='text-muted fs-7'>Payment Mode</span>
                <span className={`badge badge-light-${MODE_COLOR[selectedPayment.payment_mode] || 'secondary'}`}>{selectedPayment.payment_mode}</span>
              </div>
              <div className='d-flex justify-content-between mb-3'>
                <span className='text-muted fs-7'>Payment Date</span>
                <span className='fw-bold'>
                  {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              {selectedPayment.remarks && (
                <div className='d-flex justify-content-between mb-3'>
                  <span className='text-muted fs-7'>Remarks</span>
                  <span className='fw-semibold text-gray-700'>{selectedPayment.remarks}</span>
                </div>
              )}
              <div className='bg-light-success rounded p-4 mt-4 text-center'>
                <div className='text-muted fs-8 mb-1'>Amount Paid</div>
                <div className='fw-bolder fs-1 text-success'>₹{Number(selectedPayment.amount_paid).toLocaleString('en-IN')}</div>
              </div>
              <div className='text-center text-muted fs-9 mt-5'>
                This is a computer-generated receipt and does not require a signature.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <button className='btn btn-light flex-grow-1' onClick={() => setShowModal(false)}>Close</button>
          <button className='btn btn-primary flex-grow-1' onClick={handlePrint}>
            <i className='ki-duotone ki-printer fs-4 me-1'><span className='path1' /><span className='path2' /><span className='path3' /></i>
            Print
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const ReceiptsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/receipts', isActive: false }, { title: 'Receipts', path: '/fees/receipts', isActive: true }]}>
      Fee Receipts
    </PageTitle>
    <ReceiptsPage />
  </>
)

export { ReceiptsWrapper }
