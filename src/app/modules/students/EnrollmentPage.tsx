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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<'standard' | 'excel'>('standard')

  // Handle search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  // Data state
  const [enrollments, setEnrollments] = useState<StudentEnrollmentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
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
      const params: any = { page, limit, search: debouncedSearch }
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
  }, [schoolId, page, limit, debouncedSearch, filterSession, filterSection, filterStatus])

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

  // Client-side search is moved to server-side
  const filtered = enrollments

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
              <div className='d-flex align-items-center position-relative my-1 me-4'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search by name or roll no...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {!loading && (
                <div className='d-flex align-items-center gap-3 d-none d-md-flex'>
                  <span className='d-flex align-items-center gap-1 text-gray-600 fs-7 fw-semibold'>
                    <span className='bullet bullet-dot bg-primary h-6px w-6px'></span>
                    Total: <span className='text-primary fw-bold ms-1'>{stats.total}</span>
                  </span>
                  <span className='d-flex align-items-center gap-1 text-gray-600 fs-7 fw-semibold'>
                    <span className='bullet bullet-dot bg-success h-6px w-6px'></span>
                    Active: <span className='text-success fw-bold ms-1'>{stats.active}</span>
                  </span>
                  <span className='d-flex align-items-center gap-1 text-gray-600 fs-7 fw-semibold'>
                    <span className='bullet bullet-dot bg-danger h-6px w-6px'></span>
                    Dropped: <span className='text-danger fw-bold ms-1'>{stats.dropped}</span>
                  </span>
                </div>
              )}
            </div>
            <div className='card-toolbar'>
              <div className='btn-group' role='group'>
                  <button className={`btn btn-sm btn-icon ${viewMode === 'standard' ? 'btn-primary' : 'btn-light-primary'}`} onClick={() => setViewMode('standard')} title="Standard View">
                      <i className='ki-duotone ki-element-11 fs-3'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span></i>
                  </button>
                  <button className={`btn btn-sm btn-icon ${viewMode === 'excel' ? 'btn-primary' : 'btn-light-primary'}`} onClick={() => setViewMode('excel')} title="Excel View">
                      <i className='ki-duotone ki-row-horizontal fs-3'><span className='path1'></span><span className='path2'></span></i>
                  </button>
              </div>
            </div>
          </div>
          <div className='card-body pt-0'>
            <div className='table-responsive'>
              {viewMode === 'standard' ? (
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
              ) : (
                <table className='table table-bordered table-striped align-middle fs-8 gy-3 text-nowrap'>
                  <thead className='bg-light'>
                    <tr className='text-start text-muted fw-bolder fs-8 text-uppercase gs-0'>
                      <th>Roll No</th>
                      <th>Session</th>
                      <th>Class / Sec</th>
                      <th>Enrolled On</th>
                      <th>Student Name</th>
                      <th>Gender</th>
                      <th>DOB</th>
                      <th>Blood Grp</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Father Name</th>
                      <th>Father Phone</th>
                      <th>Mother Name</th>
                      <th>State / City</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-600 fw-semibold'>
                    {loading ? (
                        <tr><td colSpan={15} className='text-center py-10'><span className='spinner-border spinner-border-sm text-primary me-2'></span></td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={15} className='text-center py-5'>No data</td></tr>
                    ) : filtered.map(e => {
                        const s = e.student || {} as any;
                        const profile = s.profile || {} as any;
                        const parent = s.parent || {} as any;
                        const addressObj = s.address || (s as any).addresses;
                        const address = (Array.isArray(addressObj) ? addressObj[0] : addressObj) || {} as any;

                        return (
                          <tr key={e.id}>
                             <td className='text-dark fw-bold'>{e.roll_number}</td>
                             <td>{e.academic_session?.session_year || '—'}</td>
                             <td>
                                 {e.class_section?.class?.name 
                                    ? <span className='badge badge-light-info'>{e.class_section.class.name} / {e.class_section.section?.name || '-'}</span> 
                                    : '—'}
                             </td>
                             <td>{e.enrollment_date ? new Date(e.enrollment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                             <td className='text-dark fw-bold'>{s.first_name} {s.last_name}</td>
                             <td className="text-capitalize">{profile.gender || '—'}</td>
                             <td>{profile.dob ? profile.dob.split('T')[0] : '—'}</td>
                             <td>{profile.blood_group || '—'}</td>
                             <td>{s.mobile_number || '—'}</td>
                             <td>{s.email}</td>
                             <td>{parent.father_name || '—'}</td>
                             <td>{parent.father_phone || '—'}</td>
                             <td>{parent.mother_name || '—'}</td>
                             <td>{address.current_state ? `${address.current_state} / ${address.current_city || '?'}` : '—'}</td>
                             <td><StatusBadge status={e.status} /></td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className='row mt-5 p-5'>
                <div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'>
                    <div className='dataTables_length'>
                        <label>
                            <select
                                className='form-select form-select-sm form-select-solid'
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value))
                                    setPage(1)
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
                    <div className='dataTables_paginate paging_simple_numbers'>
                        <ul className='pagination'>
                            <li className={`paginate_button page-item previous ${page <= 1 ? 'disabled' : ''}`}>
                                <button className='page-link' onClick={() => setPage(page - 1)} disabled={page <= 1}>
                                    <i className='previous'></i>
                                </button>
                            </li>
                            {[...Array(totalPages || 0)].map((_, i) => (
                                <li key={i} className={`paginate_button page-item ${page === i + 1 ? 'active' : ''}`}>
                                    <button className='page-link' onClick={() => setPage(i + 1)}>{i + 1}</button>
                                </li>
                            ))}
                            <li className={`paginate_button page-item next ${page >= totalPages ? 'disabled' : ''}`}>
                                <button className='page-link' onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                    <i className='next'></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
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
