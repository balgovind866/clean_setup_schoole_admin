import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  getFeeDiscounts, createFeeDiscount, updateFeeDiscount, deleteFeeDiscount,
  assignDiscountToStudent, getStudentDiscounts,
} from './core/_requests'
import { getAcademicSessions } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { FeeDiscountModel, StudentDiscountModel } from './core/_models'
import { extractArray, extractError } from './core/_utils'

const ConcessionsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<'discounts' | 'assignments'>('discounts')

  // ── Meta ───────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

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

  useEffect(() => { loadMeta() }, [loadMeta])

  // ── Discounts ──────────────────────────────────────────────────────────────
  const [discounts, setDiscounts] = useState<FeeDiscountModel[]>([])
  const [discLoading, setDiscLoading] = useState(false)
  const [discError, setDiscError] = useState<string | null>(null)
  const [showDiscModal, setShowDiscModal] = useState(false)
  const [editDisc, setEditDisc] = useState<FeeDiscountModel | null>(null)
  const [discForm, setDiscForm] = useState({ name: '', discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT', discount_value: '' })
  const [discSaving, setDiscSaving] = useState(false)
  const [discSaveError, setDiscSaveError] = useState<string | null>(null)
  const [discSuccess, setDiscSuccess] = useState<string | null>(null)

  const loadDiscounts = useCallback(async () => {
    if (!schoolId) return
    setDiscLoading(true); setDiscError(null)
    try {
      const { data } = await getFeeDiscounts(schoolId)
      if (data.success) setDiscounts(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setDiscError(e.response?.data?.message || 'Failed to load discounts')
    } finally { setDiscLoading(false) }
  }, [schoolId])

  useEffect(() => { loadDiscounts() }, [loadDiscounts])

  const openDiscModal = (disc?: FeeDiscountModel) => {
    setEditDisc(disc || null)
    setDiscForm(disc ? { name: disc.name, discount_type: disc.discount_type, discount_value: disc.discount_value } : { name: '', discount_type: 'PERCENTAGE', discount_value: '' })
    setDiscSaveError(null); setShowDiscModal(true)
  }

  const saveDisc = async () => {
    if (!discForm.name || !discForm.discount_value) { setDiscSaveError('Name and value are required'); return }
    setDiscSaving(true); setDiscSaveError(null)
    try {
      const payload = { name: discForm.name, discount_type: discForm.discount_type, discount_value: Number(discForm.discount_value) }
      if (editDisc) { await updateFeeDiscount(schoolId, editDisc.id, payload) }
      else { await createFeeDiscount(schoolId, payload) }
      setShowDiscModal(false)
      setDiscSuccess(editDisc ? 'Discount updated!' : 'Discount created!')
      setTimeout(() => setDiscSuccess(null), 3000)
      loadDiscounts()
    } catch (e: any) {
      setDiscSaveError(e.response?.data?.message || 'Save failed')
    } finally { setDiscSaving(false) }
  }

  const deleteDisc = async (id: number) => {
    if (!window.confirm('Delete this discount rule?')) return
    try { await deleteFeeDiscount(schoolId, id); loadDiscounts() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Student Discount Assignments ───────────────────────────────────────────
  const [assignments, setAssignments] = useState<StudentDiscountModel[]>([])
  const [assgnLoading, setAssgnLoading] = useState(false)
  const [assgnError, setAssgnError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ student_id: '', fee_discount_id: '', academic_session_id: '' })
  const [assgnSaving, setAssgnSaving] = useState(false)
  const [assgnSaveError, setAssgnSaveError] = useState<string | null>(null)
  const [assgnSuccess, setAssgnSuccess] = useState<string | null>(null)

  const loadAssignments = useCallback(async () => {
    if (!schoolId) return
    setAssgnLoading(true); setAssgnError(null)
    try {
      const { data } = await getStudentDiscounts(schoolId, { limit: 100 })
      if (data.success) setAssignments(Array.isArray(data.data) ? data.data : [])
    } catch (e: any) {
      setAssgnError(e.response?.data?.message || 'Failed to load assignments')
    } finally { setAssgnLoading(false) }
  }, [schoolId])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const saveAssign = async () => {
    if (!assignForm.student_id || !assignForm.fee_discount_id || !assignForm.academic_session_id) {
      setAssgnSaveError('All fields are required'); return
    }
    setAssgnSaving(true); setAssgnSaveError(null)
    try {
      await assignDiscountToStudent(schoolId, {
        student_id: Number(assignForm.student_id),
        fee_discount_id: Number(assignForm.fee_discount_id),
        academic_session_id: Number(assignForm.academic_session_id),
      })
      setShowAssignModal(false)
      setAssgnSuccess('Discount assigned successfully!')
      setTimeout(() => setAssgnSuccess(null), 3000)
      loadAssignments()
    } catch (e: any) {
      setAssgnSaveError(e.response?.data?.message || 'Assignment failed')
    } finally { setAssgnSaving(false) }
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        <div className='d-flex align-items-center justify-content-between mb-7'>
          <div>
            <h2 className='fw-bold text-gray-900 mb-1'>Concessions & Discounts</h2>
            <span className='text-muted fs-6'>Create discount rules and assign them to students</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-5 fw-semibold mb-6'>
          {([
            ['discounts', 'ki-discount', 'Discount Rules'],
            ['assignments', 'ki-user-tick', 'Student Assignments'],
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

        {/* ══════════════ TAB: DISCOUNTS ══════════════ */}
        {activeTab === 'discounts' && (
          <div className='row g-5'>
            {/* Left: Discount Cards */}
            <div className='col-lg-8'>
              <div className='card card-flush'>
                <div className='card-header align-items-center py-5'>
                  <div className='card-title'>
                    <i className='ki-duotone ki-discount fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
                    <h3 className='fw-bold m-0'>Discount Rules</h3>
                  </div>
                  <div className='card-toolbar'>
                    {discSuccess && <span className='badge badge-light-success me-3 fs-7'>{discSuccess}</span>}
                    <button className='btn btn-primary btn-sm' onClick={() => openDiscModal()}>
                      <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                      New Discount
                    </button>
                  </div>
                </div>
                <div className='card-body pt-0'>
                  {discError && <div className='alert alert-danger mb-4'>{discError}</div>}
                  {discLoading ? (
                    <div className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                    </div>
                  ) : discounts.length === 0 ? (
                    <div className='text-center py-14'>
                      <i className='ki-duotone ki-discount fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                      <p className='text-gray-500 mt-3'>No discount rules yet. Create your first discount.</p>
                    </div>
                  ) : (
                    <div className='row g-4'>
                      {discounts.map(disc => (
                        <div key={disc.id} className='col-md-6'>
                          <div className='card card-bordered h-100 position-relative overflow-hidden'>
                            <div
                              className='position-absolute top-0 end-0 h-100 opacity-10'
                              style={{ width: '4px', background: disc.discount_type === 'PERCENTAGE' ? '#3E97FF' : '#50CD89' }}
                            />
                            <div className='card-body'>
                              <div className='d-flex align-items-start justify-content-between mb-4'>
                                <div className='d-flex align-items-center gap-3'>
                                  <div className={`symbol symbol-45px rounded bg-light-${disc.discount_type === 'PERCENTAGE' ? 'primary' : 'success'}`}>
                                    <div className='symbol-label d-flex align-items-center justify-content-center'>
                                      <i className={`ki-duotone ki-discount fs-2 text-${disc.discount_type === 'PERCENTAGE' ? 'primary' : 'success'}`}>
                                        <span className='path1' /><span className='path2' />
                                      </i>
                                    </div>
                                  </div>
                                  <div>
                                    <h6 className='fw-bold mb-0'>{disc.name}</h6>
                                    <span className={`badge badge-light-${disc.is_active ? 'success' : 'secondary'} fs-8`}>
                                      {disc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                                <div className='d-flex gap-1'>
                                  <button className='btn btn-sm btn-icon btn-light btn-active-light-primary'
                                    onClick={() => openDiscModal(disc)}>
                                    <i className='ki-duotone ki-pencil fs-4'><span className='path1' /><span className='path2' /></i>
                                  </button>
                                  <button className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                                    onClick={() => deleteDisc(disc.id)}>
                                    <i className='ki-duotone ki-trash fs-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                                  </button>
                                </div>
                              </div>
                              <div className='d-flex align-items-center gap-3'>
                                <div className={`bg-light-${disc.discount_type === 'PERCENTAGE' ? 'primary' : 'success'} rounded px-4 py-2`}>
                                  <span className={`fw-bolder fs-1 text-${disc.discount_type === 'PERCENTAGE' ? 'primary' : 'success'}`}>
                                    {disc.discount_type === 'PERCENTAGE' ? `${Number(disc.discount_value)}%` : `₹${Number(disc.discount_value).toLocaleString('en-IN')}`}
                                  </span>
                                </div>
                                <div>
                                  <div className='fw-semibold text-gray-700'>
                                    {disc.discount_type === 'PERCENTAGE' ? 'Percentage Discount' : 'Flat Discount'}
                                  </div>
                                  <div className='text-muted fs-8'>
                                    Created {new Date(disc.createdAt).toLocaleDateString('en-IN')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Assign */}
            <div className='col-lg-4'>
              <div className='card card-flush bg-light-warning border-0'>
                <div className='card-body d-flex flex-column align-items-center text-center py-10'>
                  <i className='ki-duotone ki-user-tick fs-4x text-warning mb-4'>
                    <span className='path1' /><span className='path2' /><span className='path3' />
                  </i>
                  <h5 className='fw-bold text-gray-800 mb-2'>Assign Discount</h5>
                  <p className='text-muted fs-7 mb-5'>Apply a discount rule to a specific student for an academic session.</p>
                  <button className='btn btn-warning btn-sm w-100' onClick={() => setActiveTab('assignments')}>
                    Go to Assignments →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ASSIGNMENTS ══════════════ */}
        {activeTab === 'assignments' && (
          <div className='card card-flush'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <i className='ki-duotone ki-user-tick fs-2 text-warning me-2'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                <h3 className='fw-bold m-0'>Student Discount Assignments</h3>
              </div>
              <div className='card-toolbar'>
                {assgnSuccess && <span className='badge badge-light-success me-3 fs-7'>{assgnSuccess}</span>}
                <button className='btn btn-warning btn-sm' onClick={() => { setAssignForm({ student_id: '', fee_discount_id: '', academic_session_id: '' }); setAssgnSaveError(null); setShowAssignModal(true) }}>
                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  Assign Discount
                </button>
              </div>
            </div>
            <div className='card-body pt-0'>
              {assgnError && <div className='alert alert-danger mb-4'>{assgnError}</div>}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th>Student</th>
                      <th>Discount Rule</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Session</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {assgnLoading ? (
                      <tr><td colSpan={7} className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                      </td></tr>
                    ) : assignments.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-12'>
                        <div className='d-flex flex-column align-items-center'>
                          <i className='ki-duotone ki-user-tick fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                          <span className='text-gray-500'>No discounts assigned to students yet.</span>
                        </div>
                      </td></tr>
                    ) : assignments.map((asgn, i) => (
                      <tr key={asgn.id}>
                        <td><span className='text-muted'>{i + 1}</span></td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-35px me-3'>
                              <div className='symbol-label fs-4 fw-bold text-warning bg-light-warning'>
                                {asgn.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </div>
                            <span className='fw-bold text-gray-800'>
                              {asgn.student ? `${asgn.student.first_name} ${asgn.student.last_name}` : `Student #${asgn.student_id}`}
                            </span>
                          </div>
                        </td>
                        <td className='fw-semibold text-gray-800'>{asgn.discount?.name || `Discount #${asgn.fee_discount_id}`}</td>
                        <td>
                          <span className={`badge badge-light-${asgn.discount?.discount_type === 'PERCENTAGE' ? 'primary' : 'success'}`}>
                            {asgn.discount?.discount_type || '—'}
                          </span>
                        </td>
                        <td className='fw-bold'>
                          {asgn.discount
                            ? asgn.discount.discount_type === 'PERCENTAGE'
                              ? `${Number(asgn.discount.discount_value)}%`
                              : `₹${Number(asgn.discount.discount_value).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className='text-muted'>
                          {sessions.find(s => s.id === asgn.academic_session_id)?.session_year || `Session #${asgn.academic_session_id}`}
                        </td>
                        <td>
                          <span className={`badge badge-light-${asgn.is_active ? 'success' : 'secondary'}`}>
                            {asgn.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Content>

      {/* ── Discount Modal ── */}
      <Modal show={showDiscModal} onHide={() => !discSaving && setShowDiscModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-discount fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
            {editDisc ? 'Edit Discount' : 'New Discount Rule'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {discSaveError && <Alert variant='danger' dismissible onClose={() => setDiscSaveError(null)}>{discSaveError}</Alert>}
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Discount Name</label>
            <input className='form-control form-control-solid' placeholder='e.g. Staff Child Concession'
              value={discForm.name} onChange={e => setDiscForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Discount Type</label>
            <div className='d-flex gap-4'>
              {(['PERCENTAGE', 'FLAT'] as const).map(type => (
                <label key={type}
                  className={`btn fw-semibold flex-grow-1 ${discForm.discount_type === type ? 'btn-primary' : 'btn-light-primary'}`}
                  style={{ cursor: 'pointer' }}>
                  <input type='radio' name='discount_type' value={type}
                    checked={discForm.discount_type === type}
                    onChange={() => setDiscForm(p => ({ ...p, discount_type: type }))}
                    className='d-none' />
                  {type === 'PERCENTAGE' ? '% Percentage' : '₹ Flat Amount'}
                </label>
              ))}
            </div>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>
              {discForm.discount_type === 'PERCENTAGE' ? 'Discount %' : 'Flat Amount (₹)'}
            </label>
            <input type='number' min='0' max={discForm.discount_type === 'PERCENTAGE' ? '100' : undefined}
              className='form-control form-control-solid'
              placeholder={discForm.discount_type === 'PERCENTAGE' ? 'e.g. 50' : 'e.g. 2000'}
              value={discForm.discount_value}
              onChange={e => setDiscForm(p => ({ ...p, discount_value: e.target.value }))} />
            {discForm.discount_type === 'PERCENTAGE' && <div className='text-muted fs-8 mt-1'>Enter value between 0 and 100</div>}
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowDiscModal(false)} disabled={discSaving}>Cancel</Button>
          <Button variant='primary' onClick={saveDisc} disabled={discSaving}>
            {discSaving ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</> : 'Save Discount'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Assign Modal ── */}
      <Modal show={showAssignModal} onHide={() => !assgnSaving && setShowAssignModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-user-tick fs-2 text-warning me-2'><span className='path1' /><span className='path2' /><span className='path3' /></i>
            Assign Discount to Student
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {assgnSaveError && <Alert variant='danger' dismissible onClose={() => setAssgnSaveError(null)}>{assgnSaveError}</Alert>}
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Student</label>
            <select className='form-select form-select-solid' value={assignForm.student_id}
              onChange={e => setAssignForm(p => ({ ...p, student_id: e.target.value }))}>
              <option value=''>Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Discount Rule</label>
            <select className='form-select form-select-solid' value={assignForm.fee_discount_id}
              onChange={e => setAssignForm(p => ({ ...p, fee_discount_id: e.target.value }))}>
              <option value=''>Select discount...</option>
              {discounts.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.discount_type === 'PERCENTAGE' ? `${Number(d.discount_value)}%` : `₹${Number(d.discount_value).toLocaleString('en-IN')}`})
                </option>
              ))}
            </select>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Academic Session</label>
            <select className='form-select form-select-solid' value={assignForm.academic_session_id}
              onChange={e => setAssignForm(p => ({ ...p, academic_session_id: e.target.value }))}>
              <option value=''>Select session...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowAssignModal(false)} disabled={assgnSaving}>Cancel</Button>
          <Button variant='warning' onClick={saveAssign} disabled={assgnSaving}>
            {assgnSaving ? <><span className='spinner-border spinner-border-sm me-2' />Assigning...</> : 'Assign Discount'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const ConcessionsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/concessions', isActive: false }, { title: 'Concessions', path: '/fees/concessions', isActive: true }]}>
      Concessions & Discounts
    </PageTitle>
    <ConcessionsPage />
  </>
)

export { ConcessionsWrapper }
