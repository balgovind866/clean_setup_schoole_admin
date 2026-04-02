import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getPayments, getInvoices, getFeeCategories } from './core/_requests'
import { getAcademicSessions, getClasses } from '../academic/core/_requests'
import { FeePaymentModel, FeeInvoiceModel, FeeCategoryModel } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const ReportsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [categories, setCategories] = useState<FeeCategoryModel[]>([])
  const [payments, setPayments] = useState<FeePaymentModel[]>([])
  const [invoices, setInvoices] = useState<FeeInvoiceModel[]>([])
  const [loading, setLoading] = useState(false)

  const [filterSession, setFilterSession] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'collection' | 'dues'>('overview')

  const loadAll = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    try {
      const [sRes, cRes, catRes, payRes, invRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
        getFeeCategories(schoolId),
        getPayments(schoolId, { limit: 500 }),
        getInvoices(schoolId, { limit: 500 }),
      ])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      if (catRes.data.success) setCategories(Array.isArray(catRes.data.data) ? catRes.data.data : [])
      if (payRes.data.success) setPayments(Array.isArray(payRes.data.data) ? payRes.data.data : [])
      if (invRes.data.success) setInvoices(Array.isArray(invRes.data.data) ? invRes.data.data : [])
    } catch { }
    finally { setLoading(false) }
  }, [schoolId])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Computed Stats ─────────────────────────────────────────────────────────
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount_paid), 0)
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.net_amount), 0)
  const totalPending = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (Number(i.net_amount) - Number(i.paid_amount)), 0)
  const paidCount = invoices.filter(i => i.status === 'PAID').length
  const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length
  const partialCount = invoices.filter(i => i.status === 'PARTIAL').length
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0'

  const paymentModes = ['CASH', 'ONLINE', 'CHEQUE', 'UPI', 'DD'].map(mode => ({
    mode,
    count: payments.filter(p => p.payment_mode === mode).length,
    amount: payments.filter(p => p.payment_mode === mode).reduce((s, p) => s + Number(p.amount_paid), 0),
  })).filter(m => m.count > 0)

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Header ── */}
        <div className='d-flex align-items-center justify-content-between mb-7'>
          <div>
            <h2 className='fw-bold text-gray-900 mb-1'>Fee Reports & Analytics</h2>
            <span className='text-muted fs-6'>Financial overview and collection insights</span>
          </div>
          <button className='btn btn-light-primary btn-sm' onClick={loadAll} disabled={loading}>
            {loading ? <span className='spinner-border spinner-border-sm me-2' /> : (
              <i className='ki-duotone ki-arrows-loop fs-4 me-1'><span className='path1' /><span className='path2' /></i>
            )}
            Refresh
          </button>
        </div>

        {/* ── Primary Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, color: 'primary', icon: 'ki-duotone ki-bill', sub: `${invoices.length} invoices` },
            { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: 'success', icon: 'ki-duotone ki-dollar', sub: `${payments.length} payments` },
            { label: 'Total Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, color: 'danger', icon: 'ki-duotone ki-cross-circle', sub: `${unpaidCount} unpaid` },
            { label: 'Collection Rate', value: `${collectionRate}%`, color: 'info', icon: 'ki-duotone ki-chart-line-up', sub: 'of total invoiced' },
          ].map(({ label, value, color, icon, sub }) => (
            <div className='col-sm-6 col-xl-3' key={label}>
              <div className={`card card-flush bg-light-${color} border-0 h-100`}>
                <div className='card-body py-6'>
                  <div className='d-flex align-items-center mb-3'>
                    <div className={`symbol symbol-40px me-3 bg-${color} bg-opacity-15 rounded-circle`}>
                      <div className='symbol-label d-flex align-items-center justify-content-center'>
                        <i className={`${icon} fs-2 text-${color}`}><span className='path1' /><span className='path2' /></i>
                      </div>
                    </div>
                    <span className='text-gray-600 fw-semibold fs-7'>{label}</span>
                  </div>
                  <div className={`fs-1 fw-bolder text-${color} mb-1`}>{loading ? '—' : value}</div>
                  <div className='text-muted fs-8'>{sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-5 fw-semibold mb-6'>
          {([
            ['overview', 'ki-chart-pie-simple', 'Overview'],
            ['collection', 'ki-wallet', 'Collection Analysis'],
            ['dues', 'ki-cross-circle', 'Outstanding Dues'],
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

        {/* ══════════════ TAB: OVERVIEW ══════════════ */}
        {activeTab === 'overview' && (
          <div className='row g-6'>
            {/* Invoice Status Distribution */}
            <div className='col-md-6'>
              <div className='card card-flush h-100'>
                <div className='card-header border-0 pt-5'>
                  <h4 className='card-title fw-bold'>Invoice Status Distribution</h4>
                </div>
                <div className='card-body pt-0'>
                  {[
                    { label: 'Paid', count: paidCount, color: 'success', pct: invoices.length ? ((paidCount / invoices.length) * 100).toFixed(0) : '0' },
                    { label: 'Unpaid', count: unpaidCount, color: 'danger', pct: invoices.length ? ((unpaidCount / invoices.length) * 100).toFixed(0) : '0' },
                    { label: 'Partial', count: partialCount, color: 'warning', pct: invoices.length ? ((partialCount / invoices.length) * 100).toFixed(0) : '0' },
                    { label: 'Overdue', count: invoices.filter(i => i.status === 'OVERDUE').length, color: 'dark', pct: invoices.length ? ((invoices.filter(i => i.status === 'OVERDUE').length / invoices.length) * 100).toFixed(0) : '0' },
                  ].map(({ label, count, color, pct }) => (
                    <div key={label} className='mb-5'>
                      <div className='d-flex justify-content-between mb-1'>
                        <span className='fw-semibold text-gray-700'>{label}</span>
                        <span className='fw-bold text-gray-800'>{count} ({pct}%)</span>
                      </div>
                      <div className='progress h-8px rounded'>
                        <div className={`progress-bar bg-${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className='d-flex align-items-center justify-content-between bg-light rounded p-3 mt-3'>
                    <span className='text-muted fw-semibold'>Total Invoices</span>
                    <span className='fw-bolder text-gray-800 fs-5'>{invoices.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Progress */}
            <div className='col-md-6'>
              <div className='card card-flush h-100'>
                <div className='card-header border-0 pt-5'>
                  <h4 className='card-title fw-bold'>Collection Rate</h4>
                </div>
                <div className='card-body pt-0 d-flex flex-column align-items-center justify-content-center'>
                  <div className='position-relative d-flex align-items-center justify-content-center mb-6'
                    style={{ width: 160, height: 160 }}>
                    <svg width='160' height='160' viewBox='0 0 160 160'>
                      <circle cx='80' cy='80' r='65' fill='none' stroke='#f1f1f4' strokeWidth='16' />
                      <circle cx='80' cy='80' r='65' fill='none' stroke='#50CD89' strokeWidth='16'
                        strokeDasharray={`${2 * Math.PI * 65}`}
                        strokeDashoffset={`${2 * Math.PI * 65 * (1 - Number(collectionRate) / 100)}`}
                        strokeLinecap='round' transform='rotate(-90 80 80)' />
                    </svg>
                    <div className='position-absolute text-center'>
                      <div className='fs-1 fw-bolder text-success'>{collectionRate}%</div>
                      <div className='text-muted fs-8'>Collected</div>
                    </div>
                  </div>
                  <div className='row g-4 w-100'>
                    <div className='col-6'>
                      <div className='bg-light-success rounded p-3 text-center'>
                        <div className='fw-bolder text-success fs-4'>₹{totalCollected.toLocaleString('en-IN')}</div>
                        <div className='text-muted fs-8'>Collected</div>
                      </div>
                    </div>
                    <div className='col-6'>
                      <div className='bg-light-danger rounded p-3 text-center'>
                        <div className='fw-bolder text-danger fs-4'>₹{totalPending.toLocaleString('en-IN')}</div>
                        <div className='text-muted fs-8'>Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: COLLECTION ANALYSIS ══════════════ */}
        {activeTab === 'collection' && (
          <div className='row g-6'>
            {/* Payment by Mode */}
            <div className='col-md-6'>
              <div className='card card-flush'>
                <div className='card-header border-0 pt-5'>
                  <h4 className='card-title fw-bold'>Payment by Mode</h4>
                </div>
                <div className='card-body pt-0'>
                  {paymentModes.length === 0 ? (
                    <div className='text-center text-muted py-8'>No payment data available</div>
                  ) : paymentModes.map(({ mode, count, amount }) => (
                    <div key={mode} className='d-flex align-items-center justify-content-between py-3 border-bottom border-gray-200'>
                      <div className='d-flex align-items-center gap-3'>
                        <span className={`badge badge-light-${['CASH', 'ONLINE', 'CHEQUE', 'UPI', 'DD'].indexOf(mode) === 0 ? 'success' : 'primary'} fw-bold px-4`}>
                          {mode}
                        </span>
                        <span className='text-muted fs-7'>{count} payments</span>
                      </div>
                      <span className='fw-bold text-gray-800'>₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className='col-md-6'>
              <div className='card card-flush'>
                <div className='card-header border-0 pt-5'>
                  <h4 className='card-title fw-bold'>Recent Collections</h4>
                </div>
                <div className='card-body pt-0'>
                  {payments.slice(0, 10).map(p => (
                    <div key={p.id} className='d-flex align-items-center justify-content-between py-3 border-bottom border-gray-200'>
                      <div className='d-flex align-items-center gap-3'>
                        <div className='symbol symbol-35px'>
                          <div className='symbol-label fs-5 fw-bold text-success bg-light-success'>
                            {p.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div>
                          <div className='fw-bold text-gray-800 fs-7'>
                            {p.student ? `${p.student.first_name} ${p.student.last_name}` : `Student #${p.student_id}`}
                          </div>
                          <div className='text-muted fs-8'>
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}
                          </div>
                        </div>
                      </div>
                      <span className='fw-bolder text-success'>₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {payments.length === 0 && <div className='text-center text-muted py-8'>No payment records</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: DUES ══════════════ */}
        {activeTab === 'dues' && (
          <div className='card card-flush'>
            <div className='card-header border-0 pt-5'>
              <h4 className='card-title fw-bold'>Outstanding Dues Summary</h4>
            </div>
            <div className='card-body pt-0'>
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th>Student</th>
                      <th>Month</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {invoices.filter(i => i.status !== 'PAID').length === 0 ? (
                      <tr><td colSpan={8} className='text-center py-12'>
                        <i className='ki-duotone ki-check-circle fs-3x text-success mb-3'><span className='path1' /><span className='path2' /></i>
                        <div className='text-success fw-bold mt-2'>All invoices are paid! 🎉</div>
                      </td></tr>
                    ) : invoices.filter(i => i.status !== 'PAID').map((inv, i) => {
                      const daysOverdue = inv.due_date
                        ? Math.max(0, Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)))
                        : 0
                      return (
                        <tr key={inv.id}>
                          <td><span className='text-muted'>{i + 1}</span></td>
                          <td className='fw-bold text-gray-800'>
                            {inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : `Student #${inv.student_id}`}
                          </td>
                          <td><span className='badge badge-light-primary'>{inv.invoice_month}</span></td>
                          <td className='fw-bold'>₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                          <td className='text-success'>₹{Number(inv.paid_amount).toLocaleString('en-IN')}</td>
                          <td className='text-danger fw-bolder'>₹{(Number(inv.net_amount) - Number(inv.paid_amount)).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge badge-light-${inv.status === 'PARTIAL' ? 'warning' : 'danger'}`}>{inv.status}</span>
                          </td>
                          <td>
                            {daysOverdue > 0
                              ? <span className='text-danger fw-bold'>{daysOverdue}d overdue</span>
                              : <span className='text-success fw-semibold'>Not yet due</span>
                            }
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

const FeeReportsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/reports', isActive: false }, { title: 'Reports', path: '/fees/reports', isActive: true }]}>
      Fee Reports
    </PageTitle>
    <ReportsPage />
  </>
)

export { FeeReportsWrapper }
