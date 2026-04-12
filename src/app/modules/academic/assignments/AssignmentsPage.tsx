import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../../_metronic/layout/components/toolbar'
import { Content } from '../../../../_metronic/layout/components/content'
import { Modal, Button, Form } from 'react-bootstrap'
import { useAuth } from '../../auth'
import {
  getAssignments,
  getAssignmentDetails,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from './core/_requests'
import {
  AssignmentModel,
  AssignmentSubmissionModel
} from './core/_models'
import { getAcademicSessions, getClasses, getClassSections, getSubjects, getTeacherAllocations } from '../../academic/core/_requests'
import { SessionModel, ClassModel, ClassSectionMappingModel, SubjectModel } from '../../academic/core/_models'

const AssignmentsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // Meta States (Filters)
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
  const [subjects, setSubjects] = useState<SubjectModel[]>([])
  const [allocatedTeachers, setAllocatedTeachers] = useState<any[]>([])

  const [filterSession, setFilterSession] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Data States
  const [assignments, setAssignments] = useState<AssignmentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE')
  const [currentAssignment, setCurrentAssignment] = useState<Partial<AssignmentModel>>({ status: 'PUBLISHED' })
  const [file, setFile] = useState<File | null>(null)

  // Details Modal States (Submissions View)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<AssignmentModel | null>(null)
  const [submissions, setSubmissions] = useState<AssignmentSubmissionModel[]>([])

  // Load Meta Data
  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes, subRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
        getSubjects(schoolId, 1, 100)
      ])
      if (sRes.data.success) {
        const _sessions = sRes.data.data.sessions || [];
        setSessions(_sessions)
        const current = _sessions.find(s => s.is_current)
        if (current) setFilterSession(String(current.id))
      }
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      if (subRes.data.success) setSubjects(subRes.data.data.subjects || [])
    } catch { } // ignore
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

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

  const handleSectionOrSubjectChange = async (sectionId?: number, subjectId?: number) => {
      const sid = sectionId !== undefined ? sectionId : currentAssignment.section_id;
      const subid = subjectId !== undefined ? subjectId : currentAssignment.subject_id;
      
      setCurrentAssignment(prev => ({ 
          ...prev, 
          ...(sectionId !== undefined && { section_id: sectionId }), 
          ...(subjectId !== undefined && { subject_id: subjectId }) 
      }))

      if (!sid) {
          setAllocatedTeachers([]);
          return;
      }

      try {
          // Find the active session
          const session_id = filterSession ? Number(filterSession) : undefined;
          const { data } = await getTeacherAllocations(schoolId, { 
              class_section_id: sid, 
              ...(subid && { subject_id: subid }),
              ...(session_id && { academic_session_id: session_id })
          });
          
          if (data.success) {
              const uniqueTeachers: any[] = [];
              const map = new Set();
              for (const alloc of data.data) {
                  if (alloc.teacher && !map.has(alloc.teacher.id)) {
                      map.add(alloc.teacher.id);
                      uniqueTeachers.push(alloc.teacher);
                  }
              }
              setAllocatedTeachers(uniqueTeachers);
          }
      } catch (e) {}
  }

  // Load Assignments
  const fetchAssignmentsList = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    try {
      const params: any = { page, limit }
      if (filterSession) params.academic_session_id = Number(filterSession)
      if (filterClass) params.class_id = Number(filterClass)
      if (filterSection) params.section_id = Number(filterSection)

      const { data } = await getAssignments(schoolId, params)
      if (data.success) {
        setAssignments(data.data.assignments || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch assignments')
    } finally {
      setLoading(false)
    }
  }, [schoolId, page, limit, filterSession, filterClass, filterSection])

  useEffect(() => { fetchAssignmentsList() }, [fetchAssignmentsList])

  // Helpers
  const openCreateModal = () => {
    setModalMode('CREATE')
    setCurrentAssignment({ status: 'PUBLISHED' })
    setAllocatedTeachers([])
    setFile(null)
    setShowModal(true)
  }

  const openEditModal = (a: AssignmentModel) => {
    setModalMode('EDIT')
    setCurrentAssignment(a)
    setFile(null)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Admin might just be updating status/date or creating fresh
      if (modalMode === 'CREATE') {
         formData.append('title', currentAssignment.title || '')
         formData.append('description', currentAssignment.description || '')
         formData.append('due_date', currentAssignment.due_date ? currentAssignment.due_date.substring(0, 16).replace('T', ' ') : '')
         formData.append('max_marks', String(currentAssignment.max_marks || 10))
         
         if (currentAssignment.academic_session_id) formData.append('academic_session_id', String(currentAssignment.academic_session_id))
         if (currentAssignment.class_id) formData.append('class_id', String(currentAssignment.class_id))
         if (currentAssignment.section_id) formData.append('section_id', String(currentAssignment.section_id))
         if (currentAssignment.subject_id) formData.append('subject_id', String(currentAssignment.subject_id))
         if (currentAssignment.teacher_id) formData.append('teacher_id', String(currentAssignment.teacher_id))
         if (currentAssignment.status) formData.append('status', currentAssignment.status)
         
         if (file) formData.append('attachment', file)
         
         const { data } = await createAssignment(schoolId, formData)
         if (!data.success) throw new Error(data.message)
      } else {
         if (currentAssignment.due_date) formData.append('due_date', currentAssignment.due_date.substring(0, 16).replace('T', ' '))
         if (currentAssignment.status) formData.append('status', currentAssignment.status)
         
         const { data } = await updateAssignment(schoolId, currentAssignment.id!, formData)
         if (!data.success) throw new Error(data.message)
      }
      
      setShowModal(false)
      fetchAssignmentsList()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to completely delete this assignment? All associated submissions will be dropped.')) return
    try {
      await deleteAssignment(schoolId, id)
      fetchAssignmentsList()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const openDetails = async (id: number) => {
    setDetailsLoading(true)
    setShowDetailsModal(true)
    setSubmissions([])
    setSelectedAssignmentDetails(null)
    try {
      const { data } = await getAssignmentDetails(schoolId, id)
      if (data.success) {
        setSelectedAssignmentDetails(data.data.assignment)
        setSubmissions(data.data.assignment?.submissions || [])
      }
    } catch (err) {
      alert('Failed to load details')
      setShowDetailsModal(false)
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {error && <div className='alert alert-danger mb-5'>{error}</div>}

        {/* Filters */}
        <div className='card card-flush mb-5'>
          <div className='card-body py-4'>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Session</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSession}
                  onChange={e => { setFilterSession(e.target.value); setPage(1) }}>
                  <option value=''>All Sessions</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year}</option>)}
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
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Section</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSection}
                  onChange={e => { setFilterSection(e.target.value); setPage(1) }} disabled={!filterClass}>
                  <option value=''>All Sections</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>Section {cs.section?.name}</option>)}
                </select>
              </div>
              <div className='col-md-3 text-end'>
                  <button className='btn btn-primary btn-sm' onClick={openCreateModal}>
                    <i className='ki-duotone ki-plus fs-3'></i> Create Assignment
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className='card card-flush'>
            <div className='card-header py-5'>
                <div className='card-title'>
                    <h3 className='fw-bold'>Manage Assignments</h3>
                </div>
            </div>
          <div className='card-body pt-0'>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>Title & Subject</th>
                    <th>Teacher</th>
                    <th>Class / Section</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody className='text-gray-600 fw-semibold'>
                  {loading ? (
                    <tr><td colSpan={6} className='text-center py-10'><span className='spinner-border spinner-border-sm text-primary'></span></td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={6} className='text-center py-10 text-muted'>No assignments found</td></tr>
                  ) : assignments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className='text-dark fw-bold'>{a.title}</div>
                        <div className='text-muted fs-7'>Sub: {subjects.find(s=>s.id === a.subject_id)?.name || a.subject_id}</div>
                      </td>
                      <td>
                        <span className='fw-medium'>{a.teacher?.name || (a.teacher?.first_name ? `${a.teacher?.first_name || ''} ${a.teacher?.last_name || ''}`.trim() : null) || a.teacher_id}</span>
                      </td>
                      <td>
                        {classes.find(c=>c.id === a.class_id)?.name || a.class_id} / 
                        Section {classSections.find(s=>s.id === a.section_id)?.section?.name || a.section_id}
                      </td>
                      <td>{a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</td>
                      <td>
                         <span className={`badge badge-light-${a.status === 'PUBLISHED' ? 'success' : a.status === 'CLOSED' ? 'danger' : 'warning'}`}>
                             {a.status}
                         </span>
                      </td>
                      <td className='text-end'>
                        <button className='btn btn-sm btn-icon btn-light-info me-2' onClick={() => openDetails(a.id)} title="View Details & Subs"><i className='ki-duotone ki-eye fs-3'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i></button>
                        <button className='btn btn-sm btn-icon btn-light-primary me-2' onClick={() => openEditModal(a)} title="Edit Settings"><i className='ki-duotone ki-pencil fs-3'><span className='path1'></span><span className='path2'></span></i></button>
                        <button className='btn btn-sm btn-icon btn-light-danger' onClick={() => handleDelete(a.id)} title="Delete Assignment"><i className='ki-duotone ki-trash fs-3'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className='row mt-5 p-5'>
                <div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'>
                    <div className='dataTables_length'>
                        <label>
                            <select className='form-select form-select-sm form-select-solid' value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </label>
                    </div>
                </div>
                <div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
                    <div className='dataTables_paginate paging_simple_numbers'>
                        <ul className='pagination'>
                            <li className={`paginate_button page-item previous ${page <= 1 ? 'disabled' : ''}`}>
                                <button className='page-link' onClick={() => setPage(page - 1)} disabled={page <= 1}><i className='previous'></i></button>
                            </li>
                            {[...Array(totalPages || 0)].map((_, i) => (
                                <li key={i} className={`paginate_button page-item ${page === i + 1 ? 'active' : ''}`}>
                                    <button className='page-link' onClick={() => setPage(i + 1)}>{i + 1}</button>
                                </li>
                            ))}
                            <li className={`paginate_button page-item next ${page >= totalPages ? 'disabled' : ''}`}>
                                <button className='page-link' onClick={() => setPage(page + 1)} disabled={page >= totalPages}><i className='next'></i></button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </Content>

      {/* Editor Modal */}
      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} size='lg' centered scrollable>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{modalMode === 'CREATE' ? 'Create Assignment (Admin)' : 'Update Assignment Settings'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
             {modalMode === 'EDIT' && (
                 <div className='notice d-flex bg-light-warning rounded border-warning border border-dashed p-6 mb-8'>
                    <i className='ki-duotone ki-information fs-2tx text-warning me-4'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i>
                    <div className='d-flex flex-stack flex-grow-1'>
                        <div className='fw-semibold'>
                            <h4 className='text-gray-900 fw-bold'>Admin Update Role</h4>
                            <div className='fs-6 text-gray-700'>Admins can update assignment extensions or close them. For deeper modifications, notify the assigned Teacher.</div>
                        </div>
                    </div>
                 </div>
             )}
             
            <div className='row g-4'>
              {modalMode === 'CREATE' && (
                  <>
                      <div className='col-md-12'>
                        <label className='required fw-semibold fs-6 mb-2'>Title</label>
                        <input type='text' className='form-control form-control-solid' required value={currentAssignment.title || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, title: e.target.value })} />
                      </div>
                      <div className='col-md-12'>
                        <label className='fw-semibold fs-6 mb-2'>Description</label>
                        <textarea className='form-control form-control-solid' rows={3} value={currentAssignment.description || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, description: e.target.value })}></textarea>
                      </div>
                      <div className='col-md-4'>
                        <label className='fw-semibold fs-6 mb-2 required'>Academic Session</label>
                        <select className='form-select form-select-solid' required value={currentAssignment.academic_session_id || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, academic_session_id: Number(e.target.value) })}>
                          <option value=''>Select Session...</option>
                          {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year}</option>)}
                        </select>
                      </div>
                      <div className='col-md-4'>
                        <label className='fw-semibold fs-6 mb-2 required'>Class</label>
                        <select className='form-select form-select-solid' required value={currentAssignment.class_id || ''} onChange={e => {
                           setCurrentAssignment({ ...currentAssignment, class_id: Number(e.target.value), section_id: undefined })
                           handleClassFilter(e.target.value)
                        }}>
                          <option value=''>Select Class...</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className='col-md-4'>
                        <label className='fw-semibold fs-6 mb-2 required'>Section</label>
                        <select className='form-select form-select-solid' required value={currentAssignment.section_id || ''} onChange={e => handleSectionOrSubjectChange(Number(e.target.value), undefined)}>
                          <option value=''>Select Section...</option>
                          {classSections.map(cs => <option key={cs.id} value={cs.id}>Section {cs.section?.name}</option>)}
                        </select>
                      </div>
                      <div className='col-md-4'>
                        <label className='fw-semibold fs-6 mb-2 required'>Subject</label>
                        <select className='form-select form-select-solid' required value={currentAssignment.subject_id || ''} onChange={e => handleSectionOrSubjectChange(undefined, Number(e.target.value))}>
                          <option value=''>Select Subject...</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='fw-semibold fs-6 mb-2 required'>Assign To Teacher</label>
                        <select className='form-select form-select-solid' required value={currentAssignment.teacher_id || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, teacher_id: Number(e.target.value) })}>
                          <option value=''>Select Teacher...</option>
                          {allocatedTeachers.map(t => <option key={t.id} value={t.id}>{t.first_name || t.name} {t.last_name || ''}</option>)}
                        </select>
                        <div className='fs-8 text-muted mt-1'>Only showing teachers mapped to selected Session/Section/Subject.</div>
                      </div>
                      <div className='col-md-6'>
                        <label className='fw-semibold fs-6 mb-2 required'>Max Marks</label>
                        <input type='number' className='form-control form-control-solid' step='0.1' required value={currentAssignment.max_marks || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, max_marks: Number(e.target.value) })} />
                      </div>
                  </>
              )}

              <div className='col-md-6'>
                <label className='fw-semibold fs-6 mb-2 required'>Due Date</label>
                <input type='datetime-local' className='form-control form-control-solid' required value={currentAssignment.due_date ? currentAssignment.due_date.substring(0, 16) : ''} onChange={e => setCurrentAssignment({ ...currentAssignment, due_date: e.target.value })} />
              </div>
              <div className='col-md-6'>
                <label className='fw-semibold fs-6 mb-2'>Status</label>
                <select className='form-select form-select-solid' value={currentAssignment.status || 'PUBLISHED'} onChange={e => setCurrentAssignment({ ...currentAssignment, status: e.target.value as any })}>
                  <option value='DRAFT'>Draft</option>
                  <option value='PUBLISHED'>Published</option>
                  <option value='CLOSED'>Closed</option>
                </select>
              </div>
              
              {modalMode === 'CREATE' && (
                  <div className='col-md-12'>
                     <label className='fw-semibold fs-6 mb-2'>Attachment (Optional)</label>
                     <input type='file' className='form-control form-control-solid' onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='light' onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button type='submit' variant='primary' disabled={saving}>{saving ? 'Saving...' : modalMode === 'CREATE' ? 'Create Assignment' : 'Update Settings'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Submissions Detail Modal */}
      <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false) }} size='xl' scrollable>
        <Modal.Header closeButton>
            <Modal.Title>
                <h2>{selectedAssignmentDetails?.title}</h2>
                <div className='text-muted fs-6 fw-normal'>Submissions Overview (Admin View)</div>
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-8 bg-light'>
           {detailsLoading ? <div className='text-center p-10'><span className='spinner-border text-primary'></span></div> : (
               <div className='card border-0'>
                   <div className='card-body pt-0'>
                       <table className='table align-middle table-row-dashed fs-6 mt-4'>
                          <thead>
                             <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0 border-bottom border-gray-200'>
                                <th>Student</th>
                                <th>Status</th>
                                <th>Submitted On</th>
                                <th>Submission Details</th>
                                <th>Marks & Feedback</th>
                             </tr>
                          </thead>
                          <tbody>
                              {submissions.length === 0 ? (
                                  <tr><td colSpan={5} className='text-center py-5 text-muted'>No submissions yet.</td></tr>
                              ) : submissions.map(sub => (
                                  <tr key={sub.id}>
                                      <td>
                                          <div className='fw-bold text-gray-800'>{sub.student?.first_name} {sub.student?.last_name}</div>
                                          <span className='fs-8 text-muted'>{sub.student?.email}</span>
                                      </td>
                                      <td>
                                          <span className={`badge badge-light-${sub.status === 'EVALUATED' ? 'success' : sub.status === 'SUBMITTED' ? 'primary' : 'warning'}`}>
                                              {sub.status}
                                          </span>
                                      </td>
                                      <td>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}</td>
                                      <td>
                                          <div className='fs-7 mb-1' style={{maxWidth: '250px', overflow: 'hidden', textOverflow:'ellipsis'}}>{sub.submission_text || '—'}</div>
                                          {sub.attachment_url && <a href={sub.attachment_url} target='_blank' rel='noreferrer' className='badge badge-light-info'>View Attachment</a>}
                                      </td>
                                      <td>
                                          {sub.status === 'EVALUATED' ? (
                                              <div>
                                                  <div className='fw-bold text-success'>{sub.marks_obtained} / {selectedAssignmentDetails?.max_marks}</div>
                                                  <div className='fs-8 text-muted'>{sub.teacher_feedback || 'No feedback'}</div>
                                              </div>
                                          ) : <span className='text-muted fs-8'>Pending Validation</span>}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                       </table>
                   </div>
               </div>
           )}
        </Modal.Body>
      </Modal>
    </>
  )
}

const AcademicAssignmentsPageWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Academic', path: '/academic/assignments', isActive: false }]}>Assignments Manage</PageTitle>
    <AssignmentsPage />
  </>
)

export { AcademicAssignmentsPageWrapper }
