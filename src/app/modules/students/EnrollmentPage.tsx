import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import { getEnrollments, updateEnrollmentStatus } from './core/_requests'
import { getAcademicSessions, getClasses, getClassSections } from '../academic/core/_requests'
import {
  StudentEnrollmentModel, EnrollmentStatus,
} from './core/_models'
import { SessionModel, ClassModel, ClassSectionMappingModel } from '../academic/core/_models'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EnrollmentStatus, { color: string; label: string }> = {
  Active: { color: 'success', label: 'Active' },
  Promoted: { color: 'primary', label: 'Promoted' },
  Dropped: { color: 'danger', label: 'Dropped' },
  Transferred: { color: 'warning', label: 'Transferred' },
}

const StatusBadge: FC<{ status: EnrollmentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: 'secondary', label: status }
  return <span className={`badge badge-light-${cfg.color} fw-bold`}>{cfg.label}</span>
}

// ─── Enrollment Page ──────────────────────────────────────────────────────────
const EnrollmentPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // Filter state
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
  const [filterSession, setFilterSession] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  // Data state
  const [enrollments, setEnrollments] = useState<StudentEnrollmentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollmentModel | null>(null)
  const [newStatus, setNewStatus] = useState<EnrollmentStatus>('Active')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // ─── Load Filters Data ──────────────────────────────────────────────────────
  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
      ])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
    } catch { }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  // Load sections when class changes
  const handleClassFilter = async (classId: string) => {
    setFilterClass(classId)
    setFilterSection('')
    setClassSections([])
    if (!classId) return
    try {
      const { data } = await getClassSections(schoolId, classId)
      if (data.success) setClassSections(data.data.sections || [])
    } catch { }
  }

  // ─── Load Enrollments ───────────────────────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    try {
      const params: any = { page, limit: 20 }
      if (filterSession) params.session_id = Number(filterSession)
      if (filterSection) params.class_section_id = Number(filterSection)
      if (filterStatus) params.status = filterStatus
      const { data } = await getEnrollments(schoolId, params)
      if (data.success) {
        setEnrollments(data.data.enrollments || [])
        setTotal(data.pagination?.total || (data.data.enrollments || []).length)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }, [schoolId, page, filterSession, filterSection, filterStatus])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  // ─── Status Update ──────────────────────────────────────────────────────────
  const openStatusModal = (enrollment: StudentEnrollmentModel) => {
    setSelectedEnrollment(enrollment)
    setNewStatus(enrollment.status)
    setStatusError(null)
    setShowStatusModal(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedEnrollment) return
    setStatusSaving(true)
    setStatusError(null)
    try {
      await updateEnrollmentStatus(schoolId, selectedEnrollment.id, newStatus)
      setShowStatusModal(false)
      fetchEnrollments()
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setStatusSaving(false)
    }
  }

  // Client-side search filter
  const filtered = enrollments.filter(e => {
    if (!search) return true
    const name = `${e.student?.first_name || ''} ${e.student?.last_name || ''} ${e.roll_number}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const stats = {
    total,
    active: enrollments.filter(e => e.status === 'Active').length,
    promoted: enrollments.filter(e => e.status === 'Promoted').length,
    dropped: enrollments.filter(e => e.status === 'Dropped').length,
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Enrollments', value: stats.total, color: 'primary', icon: 'ki-duotone ki-book-open' },
            { label: 'Active', value: stats.active, color: 'success', icon: 'ki-duotone ki-verify' },
            { label: 'Promoted', value: stats.promoted, color: 'info', icon: 'ki-duotone ki-award' },
            { label: 'Dropped', value: stats.dropped, color: 'danger', icon: 'ki-duotone ki-cross-circle' },
          ].map(({ label, value, color, icon }) => (
            <div className='col-sm-6 col-xl-3' key={label}>
              <div className={`card card-flush bg-light-${color} border-0 h-100`}>
                <div className='card-body d-flex align-items-center py-5'>
                  <div className={`symbol symbol-50px me-4 bg-${color} bg-opacity-15 rounded-circle`}>
                    <div className='symbol-label d-flex align-items-center justify-content-center'>
                      <i className={`${icon} fs-2x text-${color}`}><span className='path1'></span><span className='path2'></span></i>
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

        {error && <div className='alert alert-danger mb-5'>{error}</div>}

        {/* ── Filter Bar ── */}
        <div className='card card-flush mb-5'>
          <div className='card-body py-4'>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Academic Session</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSession}
                  onChange={e => { setFilterSession(e.target.value); setPage(1) }}>
                  <option value=''>All Sessions</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Class</label>
                <select className='form-select form-select-solid form-select-sm' value={filterClass}
                  onChange={e => handleClassFilter(e.target.value)}>
                  <option value=''>All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='col-md-2'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Section</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSection}
                  onChange={e => { setFilterSection(e.target.value); setPage(1) }} disabled={!filterClass}>
                  <option value=''>All Sections</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>Section {cs.section?.name}</option>)}
                </select>
              </div>
              <div className='col-md-2'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Status</label>
                <select className='form-select form-select-solid form-select-sm' value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                  <option value=''>All Status</option>
                  {(Object.keys(STATUS_CONFIG) as EnrollmentStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-2'>
                <button className='btn btn-light-primary btn-sm w-100' onClick={() => {
                  setFilterSession(''); setFilterClass(''); setFilterSection(''); setFilterStatus(''); setPage(1)
                }}>
                  <i className='ki-duotone ki-arrows-loop fs-4'><span className='path1'></span><span className='path2'></span></i> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Enrollment Table ── */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
            <div className='card-title'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search by name or roll no...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className='card-toolbar'>
              <span className='text-muted fs-7 fw-semibold'>
                {total} enrollment{total !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
          <div className='card-body pt-0'>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>#</th>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Session</th>
                    <th>Class / Section</th>
                    <th>Enrolled On</th>
                    <th>Status</th>
                    <th className='text-end min-w-100px'>Actions</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr><td colSpan={8} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2'></span>Loading enrollments...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className='text-center py-12'>
                      <div className='d-flex flex-column align-items-center'>
                        <i className='ki-duotone ki-book-open fs-3x text-gray-300 mb-3'>
                          <span className='path1'></span><span className='path2'></span>
                        </i>
                        <span className='text-gray-500 fs-6'>No enrollments found. Apply different filters or admit new students.</span>
                      </div>
                    </td></tr>
                  ) : filtered.map((e, idx) => (
                    <tr key={e.id}>
                      <td><span className='text-gray-500'>{(page - 1) * 20 + idx + 1}</span></td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-35px me-3'>
                            <div className='symbol-label fs-4 fw-bold text-primary bg-light-primary'>
                              {e.student?.first_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <div>
                            <div className='text-gray-800 fw-bold'>
                              {e.student ? `${e.student.first_name} ${e.student.last_name}` : `Student #${e.student_id}`}
                            </div>
                            <div className='text-muted fs-7'>{e.student?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className='badge badge-light-dark fw-bold'>{e.roll_number}</span>
                      </td>
                      <td className='text-gray-600'>
                        {e.academic_session?.session_year || `Session #${e.academic_session_id}`}
                      </td>
                      <td>
                        {e.class_section ? (
                          <div>
                            <div className='text-gray-800 fw-bold'>{e.class_section.class?.name || `Class #${e.class_section_id}`}</div>
                            <div className='text-muted fs-7'>Section {e.class_section.section?.name || ''}</div>
                          </div>
                        ) : (
                          <span className='text-muted'>—</span>
                        )}
                      </td>
                      <td className='text-muted fs-7'>
                        {e.enrollment_date ? new Date(e.enrollment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td><StatusBadge status={e.status} /></td>
                      <td className='text-end'>
                        <div className='dropdown'>
                          <button className='btn btn-sm btn-light btn-active-light-primary dropdown-toggle'
                            data-bs-toggle='dropdown' aria-expanded='false'>
                            Actions
                          </button>
                          <ul className='dropdown-menu dropdown-menu-end'>
                            {(Object.keys(STATUS_CONFIG) as EnrollmentStatus[])
                              .filter(s => s !== e.status)
                              .map(s => (
                                <li key={s}>
                                  <button className='dropdown-item' onClick={() => openStatusModal({ ...e, status: e.status })}>
                                    <span className={`badge badge-light-${STATUS_CONFIG[s].color} me-2`}>{s}</span>
                                    Mark as {STATUS_CONFIG[s].label}
                                  </button>
                                </li>
                              ))
                            }
                            <li><hr className='dropdown-divider' /></li>
                            <li>
                              <button className='dropdown-item' onClick={() => openStatusModal(e)}>
                                <i className='ki-duotone ki-pencil fs-5 me-2'><span className='path1'></span><span className='path2'></span></i>
                                Update Status
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='d-flex justify-content-end mt-5'>
                <div className='d-flex gap-2'>
                  <button className='btn btn-sm btn-light' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <i className='ki-duotone ki-arrow-left fs-4'><span className='path1'></span><span className='path2'></span></i> Prev
                  </button>
                  <span className='btn btn-sm btn-light disabled'>Page {page} of {totalPages}</span>
                  <button className='btn btn-sm btn-light' disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <i className='ki-duotone ki-arrow-right fs-4'><span className='path1'></span><span className='path2'></span></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* ── Status Update Modal ── */}
      <Modal show={showStatusModal} onHide={() => !statusSaving && setShowStatusModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-pencil fs-2 text-primary me-2'><span className='path1'></span><span className='path2'></span></i>
            Update Enrollment Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-8 px-lg-12'>
          {statusError && <Alert variant='danger' dismissible onClose={() => setStatusError(null)}>{statusError}</Alert>}

          {selectedEnrollment && (
            <div className='notice d-flex bg-light-primary rounded p-4 mb-6'>
              <i className='ki-duotone ki-user fs-2x text-primary me-3'><span className='path1'></span><span className='path2'></span></i>
              <div>
                <div className='fw-bold text-gray-800'>
                  {selectedEnrollment.student
                    ? `${selectedEnrollment.student.first_name} ${selectedEnrollment.student.last_name}`
                    : `Student #${selectedEnrollment.student_id}`}
                </div>
                <div className='text-muted fs-7'>Roll No: {selectedEnrollment.roll_number}</div>
                <div className='mt-1'>Current Status: <StatusBadge status={selectedEnrollment.status} /></div>
              </div>
            </div>
          )}

          <div className='mb-3'>
            <label className='required fw-semibold fs-6 mb-3'>New Status</label>
            <div className='d-flex flex-column gap-3'>
              {(Object.keys(STATUS_CONFIG) as EnrollmentStatus[]).map(s => (
                <label key={s} className={`d-flex align-items-center cursor-pointer p-4 rounded-2 border-2 border-dashed ${newStatus === s ? `border-${STATUS_CONFIG[s].color} bg-light-${STATUS_CONFIG[s].color}` : 'border-gray-200'}`}
                  style={{ cursor: 'pointer' }}>
                  <input type='radio' name='enrollment_status' className='form-check-input me-3' value={s}
                    checked={newStatus === s} onChange={() => setNewStatus(s)} />
                  <div>
                    <StatusBadge status={s} />
                    <span className='ms-3 text-gray-700 fw-semibold fs-6'>{STATUS_CONFIG[s].label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowStatusModal(false)} disabled={statusSaving}>Cancel</Button>
          <Button variant='primary' onClick={handleStatusUpdate} disabled={statusSaving || newStatus === selectedEnrollment?.status}>
            {statusSaving ? <><span className='spinner-border spinner-border-sm me-2'></span>Updating...</> : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const EnrollmentWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Students', path: '/students/admission', isActive: false },
      { title: 'Enrollment Roster', path: '/students/enrollment', isActive: true }
    ]}>
      Enrollment Roster
    </PageTitle>
    <EnrollmentPage />
  </>
)

export { EnrollmentWrapper }
