import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import { getPayments } from './core/_requests'
import { FeePaymentModel } from './core/_models'
import { getClasses, getClassSections } from '../academic/core/_requests'

// ─── Constants ────────────────────────────────────────────────────────────────
const MODE_COLOR: Record<string, string> = {
  CASH: 'success', ONLINE: 'primary', CHEQUE: 'warning', UPI: 'info', DD: 'secondary',
}
const MODE_ICON: Record<string, string> = {
  CASH: 'bi-cash-stack', ONLINE: 'bi-globe', CHEQUE: 'bi-file-earmark-text',
  UPI: 'bi-phone', DD: 'bi-bank',
}

const fmt = (n: string | number) => Number(n).toLocaleString('en-IN')
const fmtDate = (d?: string | null) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

// ─── Receipt Print Template ───────────────────────────────────────────────────
const buildPrintHtml = (p: FeePaymentModel, schoolName: string) => {
  const studentName = p.student ? `${p.student.first_name} ${p.student.last_name}` : `Student #${p.student_id}`
  const classInfo = p.student_class_info || p.student?.enrollments?.[0]?.class_section
    ? `${p.student?.enrollments?.[0]?.class_section?.class?.name || ''} (${p.student?.enrollments?.[0]?.class_section?.section?.name || ''})`
    : ''
  const rollNo = p.student?.enrollments?.[0]?.roll_number || '—'
  const mobile = p.student?.mobile_number || '—'
  const balance = p.student_current_balance ? `₹${fmt(p.student_current_balance)}` : '—'
  const invoiceMonth = p.invoice?.invoice_month
    ? new Date(p.invoice.invoice_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—'
  const invoiceStatus = p.invoice?.status || '—'

  const itemRows = (p.fee_breakdown && p.fee_breakdown.length > 0)
    ? p.fee_breakdown.map(item => `
      <tr>
        <td>${item.category_name}</td>
        <td style="text-align:right">₹${fmt(item.full_amount)}</td>
        <td style="text-align:right;color:#17c653;font-weight:bold">₹${fmt(item.paid_in_this_transaction)}</td>
      </tr>`).join('')
    : p.invoice?.items?.map(item => `
      <tr>
        <td>${item.fee_category?.name || 'Fee'}</td>
        <td style="text-align:right">₹${fmt(item.amount)}</td>
        <td style="text-align:right;color:#17c653;font-weight:bold">—</td>
      </tr>`).join('') || ''

  return `
  <html><head><title>Fee Receipt — TXN-${p.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:13px}
    .page{max-width:620px;margin:0 auto;padding:0}
    .header{background:linear-gradient(135deg,#3b4cca 0%,#7b2ff7 100%);color:#fff;text-align:center;padding:24px 20px 20px}
    .header h1{font-size:22px;font-weight:800;letter-spacing:1px;margin-bottom:4px}
    .header .sub{opacity:.8;font-size:12px}
    .header .badge{display:inline-block;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);padding:4px 14px;border-radius:20px;font-size:11px;margin-top:8px;letter-spacing:.5px}
    .section{padding:16px 24px;border-bottom:1px solid #f0f0f0}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#6c6c6c;letter-spacing:.8px;margin-bottom:10px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}
    .field label{display:block;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;margin-bottom:2px}
    .field span{font-size:13px;font-weight:600;color:#1a1a2e}
    .amount-box{background:linear-gradient(135deg,#e8f8f0,#c6f1da);margin:0 24px;padding:18px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid #a3e9c0}
    .amount-box .label{font-size:11px;font-weight:600;color:#0a4d2b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
    .amount-box .value{font-size:28px;font-weight:800;color:#17a96e}
    .table-wrap{padding:16px 24px}
    table{width:100%;border-collapse:collapse}
    table thead tr{background:#f5f5fa}
    table thead th{padding:8px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;letter-spacing:.5px;border-bottom:2px solid #e5e5e5}
    table tbody td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
    table tfoot td{padding:10px;font-weight:700;border-top:2px solid #3b4cca;color:#3b4cca}
    .balance-row{background:#fff8e7;border:1px solid #ffd666;padding:12px 24px;margin:0 24px 16px;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
    .balance-row .label{font-size:11px;color:#7a6000;font-weight:600;text-transform:uppercase}
    .balance-row .value{font-size:16px;color:#e65100;font-weight:800}
    .footer{text-align:center;padding:16px 24px;font-size:10px;color:#aaa;border-top:1px dashed #e0e0e0;line-height:1.6}
    @media print{
      @page{size:A5;margin:0}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style></head><body>
  <div class="page">
    <div class="header">
      <h1>${schoolName}</h1>
      <div class="sub">Fee Payment Receipt</div>
      <div class="badge">TXN-${p.id} &nbsp;|&nbsp; ${fmtDate(p.payment_date)}</div>
    </div>

    <div class="section">
      <div class="section-title">Student Details</div>
      <div class="grid">
        <div class="field"><label>Student Name</label><span>${studentName}</span></div>
        <div class="field"><label>Class / Section</label><span>${classInfo || '—'}</span></div>
        <div class="field"><label>Roll Number</label><span>${rollNo}</span></div>
        <div class="field"><label>Mobile</label><span>${mobile}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="grid">
        <div class="field"><label>Receipt No.</label><span>TXN-${p.id}</span></div>
        <div class="field"><label>Invoice #</label><span>#${p.fee_invoice_id}</span></div>
        <div class="field"><label>Invoice Month</label><span>${invoiceMonth}</span></div>
        <div class="field"><label>Invoice Status</label><span>${invoiceStatus}</span></div>
        <div class="field"><label>Payment Mode</label><span>${p.payment_mode}</span></div>
        <div class="field"><label>Payment Date</label><span>${fmtDate(p.payment_date)}</span></div>
        ${p.transaction_id ? `<div class="field"><label>Ref / Cheque No.</label><span>${p.transaction_id}</span></div>` : ''}
        ${p.remarks ? `<div class="field"><label>Remarks</label><span>${p.remarks}</span></div>` : ''}
      </div>
    </div>

    <br/>
    <div class="amount-box">
      <div>
        <div class="label">Amount Paid</div>
        <div class="value">₹${fmt(p.amount_paid)}</div>
      </div>
      <div style="text-align:right">
        <div class="label">Invoice Total</div>
        <div style="font-size:15px;font-weight:700;color:#0a4d2b">₹${fmt(p.invoice?.net_amount || p.invoice?.total_amount || 0)}</div>
      </div>
    </div>
    <br/>

    ${itemRows ? `
    <div class="table-wrap">
      <div class="section-title">Fee Breakdown</div>
      <table>
        <thead><tr>
          <th>Description</th>
          <th style="text-align:right">Full Amount</th>
          <th style="text-align:right">Paid Here</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr>
          <td>Total</td>
          <td style="text-align:right">₹${fmt(p.invoice?.total_amount || 0)}</td>
          <td style="text-align:right;color:#17a96e">₹${fmt(p.amount_paid)}</td>
        </tr></tfoot>
      </table>
    </div>` : ''}

    ${p.student_current_balance ? `
    <div class="balance-row">
      <div class="label">Balance Remaining After This Payment</div>
      <div class="value">₹${fmt(p.student_current_balance)}</div>
    </div>` : ''}

    <div class="footer">
      This is a computer-generated receipt and does not require a signature.<br/>
      Generated on ${new Date().toLocaleString('en-IN')}
    </div>
  </div>
  </body></html>`
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ReceiptsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')
  const schoolName = (currentUser as any)?.school_name || 'School'

  const [payments, setPayments] = useState<FeePaymentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Academic Metadata
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])

  // Filters
  const [filterMode, setFilterMode] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [search, setSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Receipt Modal
  const [selectedPayment, setSelectedPayment] = useState<FeePaymentModel | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Load Classes Metadata
  const loadMetadata = useCallback(async () => {
    if (!schoolId) return
    try {
      const res = await getClasses(schoolId)
      if (res.data.success) setClasses(res.data.data.classes || [])
    } catch (e) {
      console.error('Failed to load classes', e)
    }
  }, [schoolId])

  // Load Sections when Class changes
  useEffect(() => {
    const loadSections = async () => {
      if (!schoolId || !filterClass) {
        setSections([])
        setFilterSection('')
        return
      }
      try {
        const res = await getClassSections(schoolId, filterClass)
        if (res.data.success) {
          const raw = res.data as any
          const list = Array.isArray(raw.data?.sections) ? raw.data.sections : (Array.isArray(raw.data) ? raw.data : [])
          setSections(list)
        }
      } catch (e) {
        console.error('Failed to load sections', e)
      }
    }
    loadSections()
  }, [schoolId, filterClass])

  const loadPayments = useCallback(async () => {
    if (!schoolId) return
    setLoading(true); setError(null)
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      }
      if (filterMode) params.payment_mode = filterMode
      if (filterStatus) params.status = filterStatus
      if (filterClass) params.class_id = filterClass
      if (filterSection) params.section_id = filterSection
      if (search) params.search = search

      const { data } = await getPayments(schoolId, params)
      if (data.success) {
        setPayments(Array.isArray(data.data) ? data.data : [])
        if (data.pagination) {
          setTotalItems(data.pagination.total)
          setTotalPages(data.pagination.totalPages)
        }
      } else {
        setError(data.message || 'Failed to load receipts')
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load receipts')
    } finally { setLoading(false) }
  }, [schoolId, currentPage, pageSize, filterMode, filterStatus, filterClass, filterSection, search])

  useEffect(() => { loadMetadata() }, [loadMetadata])
  useEffect(() => { loadPayments() }, [loadPayments])

  const resetFilters = () => {
    setFilterMode('')
    setFilterStatus('')
    setFilterClass('')
    setFilterSection('')
    setSearch('')
    setCurrentPage(1)
  }

  const filtered = payments // Since filtering is now server-side

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount_paid), 0)
  const totalBalance = payments.reduce((s, p) => s + Number(p.student_current_balance || 0), 0)

  const handlePrint = () => {
    if (!selectedPayment) return
    const html = buildPrintHtml(selectedPayment, schoolName)
    const win = window.open('', '_blank', 'width=680,height=900')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print() }, 400)
  }

  const openReceipt = (p: FeePaymentModel) => { setSelectedPayment(p); setShowModal(true) }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Stats Strip ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Receipts', value: payments.length, color: 'primary', icon: 'bi-receipt' },
            { label: 'Total Collected', value: `₹${fmt(totalCollected)}`, color: 'success', icon: 'bi-cash-coin' },
            { label: 'Cash Receipts', value: payments.filter(p => p.payment_mode === 'CASH').length, color: 'warning', icon: 'bi-cash-stack' },
            { label: 'Cheque / Online', value: payments.filter(p => ['CHEQUE', 'ONLINE', 'UPI'].includes(p.payment_mode)).length, color: 'info', icon: 'bi-credit-card' },
          ].map(({ label, value, color, icon }) => (
            <div className='col-sm-6 col-xl-3' key={label}>
              <div className={`card card-flush bg-light-${color} border-0 h-100`}
                style={{ borderLeft: `4px solid var(--kt-${color})` }}>
                <div className='card-body d-flex align-items-center py-5 gap-4'>
                  <div className={`symbol symbol-50px bg-${color} bg-opacity-15 rounded-circle`}>
                    <div className='symbol-label d-flex align-items-center justify-content-center'>
                      <i className={`bi ${icon} fs-2 text-${color}`}></i>
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

        {/* ── Receipts Table Card ── */}
        <div className='card card-flush shadow-sm'>
          {/* Header */}
          <div className='card-header border-0 pt-6 pb-0 align-items-center gap-3 flex-wrap'>
            <div className='card-title flex-grow-1'>
              <div className='d-flex align-items-center position-relative'>
                <i className='bi bi-search fs-4 position-absolute ms-4 text-muted'></i>
                <input type='text' className='form-control form-control-solid w-280px ps-14'
                  placeholder='Search student name or TXN ID...'
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className='card-toolbar gap-3 flex-wrap'>
              <select className='form-select form-select-solid form-select-sm w-150px' value={filterClass}
                onChange={e => { setFilterClass(e.target.value); setFilterSection(''); setCurrentPage(1) }}>
                <option value=''>All Classes</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className='form-select form-select-solid form-select-sm w-150px' value={filterSection}
                disabled={!filterClass}
                onChange={e => { setFilterSection(e.target.value); setCurrentPage(1) }}>
                <option value=''>All Sections</option>
                {sections.map((s: any) => (
                  <option key={s.section_id} value={s.section_id}>
                    {s.section?.name || 'Section'}
                  </option>
                ))}
              </select>
              <select className='form-select form-select-solid form-select-sm w-140px' value={filterMode}
                onChange={e => { setFilterMode(e.target.value); setCurrentPage(1) }}>
                <option value=''>All Modes</option>
                {['CASH', 'ONLINE', 'CHEQUE', 'UPI', 'DD'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select className='form-select form-select-solid form-select-sm w-140px' value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
                <option value=''>All Statuses</option>
                {['PAID', 'PARTIAL', 'UNPAID', 'OVERDUE'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(filterMode || filterStatus || filterClass || filterSection || search) && (
                <button className='btn btn-sm btn-light-danger fw-semibold'
                  onClick={resetFilters}>
                  <i className='bi bi-x me-1'></i>Reset
                </button>
              )}
              <span className='badge badge-light-primary fw-semibold fs-8 py-2 px-3'>
                {totalItems} total receipts
              </span>
            </div>
          </div>

          <div className='card-body pt-4'>
            {error && <div className='alert alert-danger mb-4 fw-semibold'><i className='bi bi-exclamation-triangle me-2'></i>{error}</div>}

            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-4'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>Receipt</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>For Month</th>
                    <th>Invoice #</th>
                    <th>Mode</th>
                    <th>Amount Paid</th>
                    <th>Invoice Status</th>
                    <th>Balance</th>
                    <th className='text-end'>Action</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr><td colSpan={10} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2' />Loading receipts...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} className='text-center py-14'>
                      <div className='d-flex flex-column align-items-center gap-3'>
                        <i className='bi bi-receipt fs-4x text-gray-300'></i>
                        <span className='text-gray-500 fw-semibold'>No receipts found</span>
                      </div>
                    </td></tr>
                  ) : filtered.map(p => {
                    const studentName = p.student
                      ? `${p.student.first_name} ${p.student.last_name}`
                      : `Student #${p.student_id}`
                    const classInfo = p.student_class_info || '—'
                    const invoiceMonth = p.invoice?.invoice_month
                      ? new Date(p.invoice.invoice_month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                      : '—'
                    const invStatus = p.invoice?.status || '—'
                    const statusBadge: Record<string, string> = {
                      PAID: 'badge-light-success', PARTIAL: 'badge-light-warning',
                      UNPAID: 'badge-light-dark', OVERDUE: 'badge-light-danger',
                    }

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className='d-flex flex-column'>
                            <span className='badge badge-light-primary fw-bold fs-8'>TXN-{p.id}</span>
                            <span className='text-muted fs-9 mt-1'>{fmtDate(p.payment_date)}</span>
                          </div>
                        </td>
                        <td>
                          <div className='d-flex align-items-center gap-3'>
                            <div className='symbol symbol-35px'>
                              <div className='symbol-label fw-bolder fs-5 text-primary bg-light-primary'>
                                {p.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </div>
                            <div>
                              <div className='fw-bold text-gray-800 fs-7'>{studentName}</div>
                              <div className='text-muted fs-9'>{p.student?.mobile_number || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className='fw-semibold text-gray-700 fs-7'>{classInfo}</span>
                        </td>
                        <td>
                          <span className='fw-semibold text-gray-700 fs-7'>{invoiceMonth}</span>
                        </td>
                        <td>
                          <span className='badge badge-light-dark fw-bold'>#{p.fee_invoice_id}</span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${MODE_COLOR[p.payment_mode] || 'secondary'} fw-bold`}>
                            <i className={`bi ${MODE_ICON[p.payment_mode] || 'bi-cash'} me-1 fs-9`}></i>
                            {p.payment_mode}
                          </span>
                        </td>
                        <td>
                          <span className='fw-bolder text-success fs-6'>₹{fmt(p.amount_paid)}</span>
                          {p.invoice && Number(p.invoice.total_amount) !== Number(p.amount_paid) && (
                            <div className='text-muted fs-9'>of ₹{fmt(p.invoice.total_amount)}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge fw-bold ${statusBadge[invStatus] || 'badge-light-secondary'}`}>{invStatus}</span>
                        </td>
                        <td>
                          {p.student_current_balance
                            ? <span className={`fw-bolder fs-7 ${Number(p.student_current_balance) > 0 ? 'text-danger' : 'text-success'}`}>
                              ₹{fmt(p.student_current_balance)}
                            </span>
                            : <span className='text-muted'>—</span>}
                        </td>
                        <td className='text-end'>
                          <button
                            id={`receipt-btn-${p.id}`}
                            className='btn btn-sm btn-light btn-active-light-primary fw-semibold gap-2'
                            onClick={() => openReceipt(p)}>
                            <i className='bi bi-file-earmark-text fs-5'></i>
                            Receipt
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className='fw-bolder text-gray-800 bg-light'>
                      <td colSpan={6} className='ps-4 text-uppercase fs-8'>Totals</td>
                      <td>
                        <span className='fw-bolder text-success fs-6'>
                          ₹{fmt(filtered.reduce((s, p) => s + Number(p.amount_paid), 0))}
                        </span>
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className='d-flex flex-stack flex-wrap pt-10'>
                <div className='fs-6 fw-bold text-gray-700'>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </div>

                <ul className='pagination'>
                  <li className={`page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className='page-link px-0' onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <i className='ki-duotone ki-double-left fs-2'><span className='path1'/><span className='path2'/></i>
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className='page-link' onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (totalPages > 7 && page !== 1 && page !== totalPages && (page < currentPage - 2 || page > currentPage + 2)) {
                      if (page === currentPage - 3 || page === currentPage + 3) return <li key={page} className='page-item disabled'><span className='page-link'>...</span></li>
                      return null
                    }
                    return (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className='page-link' onClick={() => setCurrentPage(page)}>{page}</button>
                      </li>
                    )
                  })}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className='page-link' onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                  </li>
                  <li className={`page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className='page-link px-0' onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                      <i className='ki-duotone ki-double-right fs-2'><span className='path1'/><span className='path2'/></i>
                    </button>
                  </li>
                </ul>

                <div className='d-flex align-items-center'>
                  <span className='fs-7 fw-bold text-gray-700 me-3'>Page Size:</span>
                  <select className='form-select form-select-sm form-select-solid w-70px' value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
                    {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

      </Content>

      {/* ── Receipt Preview Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='lg'>
        <Modal.Body className='p-0 overflow-hidden rounded-3'>
          {selectedPayment && (() => {
            const p = selectedPayment
            const studentName = p.student ? `${p.student.first_name} ${p.student.last_name}` : `#${p.student_id}`
            const classInfo = p.student_class_info || '—'
            const rollNo = p.student?.enrollments?.[0]?.roll_number || '—'
            const mobile = p.student?.mobile_number || '—'
            const invoiceMonth = p.invoice?.invoice_month
              ? new Date(p.invoice.invoice_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
              : '—'
            const invStatus = p.invoice?.status || ''
            const statusBadge: Record<string, string> = {
              PAID: 'badge-light-success', PARTIAL: 'badge-light-warning',
              UNPAID: 'badge-light-dark', OVERDUE: 'badge-light-danger',
            }
            const items = p.fee_breakdown?.length
              ? p.fee_breakdown
              : p.invoice?.items?.map(item => ({
                category_id: item.fee_category_id,
                category_name: item.fee_category?.name || 'Fee',
                full_amount: item.amount,
                paid_in_this_transaction: '—',
              })) || []

            return (
              <>
                {/* Receipt Header */}
                <div className='text-white text-center py-7 px-8 position-relative'
                  style={{ background: 'linear-gradient(135deg, #3b4cca 0%, #7b2ff7 100%)' }}>
                  <button className='btn btn-icon position-absolute top-0 end-0 mt-3 me-3'
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onClick={() => setShowModal(false)}>
                    <i className='bi bi-x-lg fs-4'></i>
                  </button>
                  <div className='mb-2'>
                    <span className='badge fw-semibold fs-8 px-4 py-2'
                      style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20 }}>
                      Fee Receipt
                    </span>
                  </div>
                  <h2 className='text-white fw-bolder mb-1 fs-1'>{schoolName}</h2>
                  <p className='mb-0 opacity-75 fs-8'>TXN-{p.id} &nbsp;·&nbsp; {fmtDate(p.payment_date)}</p>
                </div>

                {/* Amount Hero */}
                <div className='text-center py-6 px-8'
                  style={{ background: 'linear-gradient(180deg,#f0fdf8 0%,#fff 100%)' }}>
                  <div className='text-muted fw-bold fs-8 text-uppercase mb-1'>Amount Paid</div>
                  <div className='fw-bolder' style={{ fontSize: '2.4rem', color: '#17a96e', lineHeight: 1 }}>
                    ₹{fmt(p.amount_paid)}
                  </div>
                  {p.invoice && (
                    <div className='text-muted fs-8 mt-1'>
                      Invoice Total: ₹{fmt(p.invoice.total_amount)}
                      &nbsp;|&nbsp;
                      <span className={`badge fw-bold ${statusBadge[invStatus] || ''} ms-1`}>{invStatus}</span>
                    </div>
                  )}
                </div>

                <div className='px-8 pb-8'>
                  {/* Student + Payment Info */}
                  <div className='row g-4 mb-6'>
                    <div className='col-md-6'>
                      <div className='rounded-2 border border-gray-200 h-100' style={{ background: '#f8f9fb' }}>
                        <div className='px-5 py-3 border-bottom border-gray-200'>
                          <span className='fw-bold fs-8 text-uppercase text-muted'>
                            <i className='bi bi-person-fill me-2 text-primary'></i>Student Details
                          </span>
                        </div>
                        <div className='px-5 py-4 d-flex flex-column gap-3'>
                          {[
                            { label: 'Name', value: studentName },
                            { label: 'Class', value: classInfo },
                            { label: 'Roll No.', value: rollNo },
                            { label: 'Mobile', value: mobile },
                          ].map(({ label, value }) => (
                            <div key={label} className='d-flex justify-content-between'>
                              <span className='text-muted fs-8'>{label}</span>
                              <span className='fw-semibold text-gray-800 fs-7'>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className='col-md-6'>
                      <div className='rounded-2 border border-gray-200 h-100' style={{ background: '#f8f9fb' }}>
                        <div className='px-5 py-3 border-bottom border-gray-200'>
                          <span className='fw-bold fs-8 text-uppercase text-muted'>
                            <i className='bi bi-receipt me-2 text-success'></i>Payment Details
                          </span>
                        </div>
                        <div className='px-5 py-4 d-flex flex-column gap-3'>
                          {[
                            { label: 'Receipt No.', value: `TXN-${p.id}` },
                            { label: 'Invoice #', value: `#${p.fee_invoice_id}` },
                            { label: 'For Month', value: invoiceMonth },
                            { label: 'Payment Mode', value: p.payment_mode },
                            ...(p.transaction_id ? [{ label: 'Ref No.', value: p.transaction_id }] : []),
                            ...(p.remarks ? [{ label: 'Remarks', value: p.remarks }] : []),
                          ].map(({ label, value }) => (
                            <div key={label} className='d-flex justify-content-between'>
                              <span className='text-muted fs-8'>{label}</span>
                              <span className='fw-semibold text-gray-800 fs-7'>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee Breakdown Table */}
                  {items.length > 0 && (
                    <div className='mb-6'>
                      <div className='fw-bold fs-8 text-uppercase text-muted mb-3'>
                        <i className='bi bi-table me-2'></i>Fee Breakdown
                      </div>
                      <div className='border border-gray-200 rounded-2 overflow-hidden'>
                        <table className='table table-row-bordered mb-0 align-middle fs-7'>
                          <thead style={{ background: '#f0f0f8' }}>
                            <tr className='text-uppercase text-gray-500 fw-bold fs-9'>
                              <th className='px-5 py-3'>Fee Category</th>
                              <th className='text-end px-5 py-3'>Full Amount</th>
                              <th className='text-end px-5 py-3'>Paid Here</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, i) => (
                              <tr key={i}>
                                <td className='px-5 py-3 fw-semibold'>{item.category_name}</td>
                                <td className='text-end px-5 py-3 text-gray-700'>₹{fmt(item.full_amount)}</td>
                                <td className='text-end px-5 py-3'>
                                  <span className='fw-bolder text-success'>
                                    {item.paid_in_this_transaction === '—' ? '—' : `₹${fmt(item.paid_in_this_transaction)}`}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot style={{ background: '#f8f9fb', borderTop: '2px solid #e5e5ef' }}>
                            <tr className='fw-bolder'>
                              <td className='px-5 py-3'>Total</td>
                              <td className='text-end px-5 py-3 text-gray-800'>
                                ₹{fmt(p.invoice?.total_amount || items.reduce((s, i) => s + Number(i.full_amount || 0), 0))}
                              </td>
                              <td className='text-end px-5 py-3 text-success fs-6'>₹{fmt(p.amount_paid)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Balance Remaining */}
                  {p.student_current_balance && (
                    <div className='rounded-2 px-5 py-4 mb-6 d-flex align-items-center justify-content-between'
                      style={{ background: '#fff8e7', border: '1px solid #ffd666' }}>
                      <div>
                        <div className='fw-bold fs-8 text-uppercase text-warning-dark'>
                          <i className='bi bi-exclamation-circle-fill text-warning me-2'></i>
                          Balance Remaining
                        </div>
                        <div className='text-muted fs-9 mt-1'>Outstanding fee after this payment</div>
                      </div>
                      <span className={`fw-bolder fs-4 ${Number(p.student_current_balance) > 0 ? 'text-danger' : 'text-success'}`}>
                        ₹{fmt(p.student_current_balance)}
                      </span>
                    </div>
                  )}

                  {/* Footer note */}
                  <div className='text-center text-muted fs-9 pt-4 border-top border-dashed border-gray-300'>
                    <i className='bi bi-shield-check text-success me-1'></i>
                    This is a computer-generated receipt and does not require a signature.
                  </div>

                  {/* Buttons */}
                  <div className='d-flex gap-3 mt-6'>
                    <button className='btn btn-light-primary fw-bold flex-grow-1 py-3'
                      onClick={() => setShowModal(false)}>
                      Close
                    </button>
                    <button className='btn btn-primary fw-bolder flex-grow-1 py-3 shadow-sm'
                      onClick={handlePrint}>
                      <i className='bi bi-printer me-2'></i>Print Receipt
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
        </Modal.Body>
      </Modal>
    </>
  )
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const ReceiptsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Fees', path: '/fees/receipts', isActive: false },
      { title: 'Receipts', path: '/fees/receipts', isActive: true },
    ]}>
      Fee Receipts
    </PageTitle>
    <ReceiptsPage />
  </>
)

export { ReceiptsWrapper }
