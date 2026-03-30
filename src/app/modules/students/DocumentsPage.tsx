import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import { getStudents, getStudentDocuments, updateDocumentStatus } from './core/_requests'
import { StudentModel, StudentDocumentModel, DocumentStatus } from './core/_models'

// ─── Status Config ────────────────────────────────────────────────────────────
const DOC_STATUS_CONFIG: Record<DocumentStatus, { color: string; icon: string }> = {
  Pending: { color: 'warning', icon: 'ki-duotone ki-time' },
  Verified: { color: 'success', icon: 'ki-duotone ki-shield-tick' },
  Rejected: { color: 'danger', icon: 'ki-duotone ki-shield-cross' },
}

const DocStatusBadge: FC<{ status: DocumentStatus }> = ({ status }) => {
  const cfg = DOC_STATUS_CONFIG[status] || { color: 'secondary', icon: 'ki-duotone ki-info' }
  return (
    <span className={`badge badge-light-${cfg.color} d-inline-flex align-items-center gap-1 fw-bold`}>
      <i className={`${cfg.icon} fs-7`}><span className='path1'></span><span className='path2'></span></i>
      {status}
    </span>
  )
}

// ─── Documents Page ───────────────────────────────────────────────────────────
const DocumentsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [students, setStudents] = useState<StudentModel[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentModel | null>(null)
  const [documents, setDocuments] = useState<StudentDocumentModel[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('')

  // Verify modal
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<StudentDocumentModel | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<DocumentStatus>('Verified')
  const [verifySaving, setVerifySaving] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // ─── Load Students ────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!schoolId) return
    setLoadingStudents(true)
    setError(null)
    try {
      const { data } = await getStudents(schoolId, { limit: 200 })
      if (data.success) setStudents(data.data.students || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }, [schoolId])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // ─── Load Documents ───────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async (student: StudentModel) => {
    setLoadingDocs(true)
    setError(null)
    setDocuments([])
    try {
      const { data } = await getStudentDocuments(schoolId, student.id)
      if (data.success) setDocuments(data.data.documents || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents')
    } finally {
      setLoadingDocs(false)
    }
  }, [schoolId])

  const selectStudent = (student: StudentModel) => {
    setSelectedStudent(student)
    fetchDocuments(student)
  }

  // ─── Verify / Reject ──────────────────────────────────────────────────────
  const openVerifyModal = (doc: StudentDocumentModel, defaultStatus: DocumentStatus) => {
    setSelectedDoc(doc)
    setVerifyStatus(defaultStatus)
    setVerifyError(null)
    setShowVerifyModal(true)
  }

  const handleVerify = async () => {
    if (!selectedDoc || !selectedStudent) return
    setVerifySaving(true)
    setVerifyError(null)
    try {
      await updateDocumentStatus(schoolId, selectedStudent.id, selectedDoc.id, verifyStatus)
      setShowVerifyModal(false)
      fetchDocuments(selectedStudent)
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Failed to update document status')
    } finally {
      setVerifySaving(false)
    }
  }

  // Filter students for left panel
  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )

  // Filter documents for right panel
  const filteredDocs = filterStatus
    ? documents.filter(d => d.verification_status === filterStatus)
    : documents

  // Stats
  const docStats = {
    total: documents.length,
    pending: documents.filter(d => d.verification_status === 'Pending').length,
    verified: documents.filter(d => d.verification_status === 'Verified').length,
    rejected: documents.filter(d => d.verification_status === 'Rejected').length,
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {error && <div className='alert alert-danger mb-5'>{error}</div>}

        <div className='row g-5'>
          {/* ── Left: Student List ── */}
          <div className='col-md-4'>
            <div className='card card-flush h-100'>
              <div className='card-header py-5'>
                <div className='card-title w-100'>
                  <div className='d-flex align-items-center position-relative w-100'>
                    <i className='ki-duotone ki-magnifier fs-4 position-absolute ms-3'>
                      <span className='path1'></span><span className='path2'></span>
                    </i>
                    <input type='text' className='form-control form-control-solid ps-10 form-control-sm'
                      placeholder='Search students...' value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className='card-body pt-0 px-3' style={{ maxHeight: 600, overflowY: 'auto' }}>
                {loadingStudents ? (
                  <div className='text-center py-8'>
                    <span className='spinner-border spinner-border-sm text-primary'></span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className='text-center text-muted py-8 fs-7'>No students found</div>
                ) : filteredStudents.map(s => {
                  const isSelected = selectedStudent?.id === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className={`d-flex align-items-center p-3 rounded-2 mb-2 ${isSelected ? 'bg-primary text-white' : 'bg-hover-light-primary'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div className='symbol symbol-35px me-3 flex-shrink-0'>
                        <div className={`symbol-label fw-bold fs-5 ${isSelected ? 'bg-white text-primary' : 'bg-light-primary text-primary'}`}>
                          {s.first_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className='min-w-0 flex-grow-1'>
                        <div className={`fw-bold fs-7 text-truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div className={`fs-8 text-truncate ${isSelected ? 'text-white opacity-75' : 'text-muted'}`}>
                          {s.email}
                        </div>
                      </div>
                      {isSelected && <i className='ki-duotone ki-arrow-right fs-5 text-white ms-2'><span className='path1'></span><span className='path2'></span></i>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Documents Panel ── */}
          <div className='col-md-8'>
            {!selectedStudent ? (
              <div className='card card-flush h-100'>
                <div className='card-body d-flex align-items-center justify-content-center'>
                  <div className='text-center'>
                    <i className='ki-duotone ki-folder fs-4x text-gray-200 mb-4'>
                      <span className='path1'></span><span className='path2'></span>
                    </i>
                    <p className='text-muted fs-6'>← Select a student to view their documents</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Student Info Header */}
                <div className='card card-flush mb-5'>
                  <div className='card-body py-4'>
                    <div className='d-flex align-items-center justify-content-between'>
                      <div className='d-flex align-items-center'>
                        <div className='symbol symbol-50px me-4'>
                          <div className='symbol-label fw-bold fs-3 bg-light-primary text-primary'>
                            {selectedStudent.first_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className='fw-bolder text-gray-800 mb-1'>
                            {selectedStudent.first_name} {selectedStudent.last_name}
                          </h4>
                          <div className='text-muted fs-7'>{selectedStudent.email} · {selectedStudent.mobile_number}</div>
                        </div>
                      </div>
                      {/* Doc stats */}
                      <div className='d-flex gap-4'>
                        {[
                          { label: 'Total', count: docStats.total, color: 'dark' },
                          { label: 'Pending', count: docStats.pending, color: 'warning' },
                          { label: 'Verified', count: docStats.verified, color: 'success' },
                          { label: 'Rejected', count: docStats.rejected, color: 'danger' },
                        ].map(({ label, count, color }) => (
                          <div key={label} className={`text-center px-3 py-2 rounded-2 bg-light-${color}`}>
                            <div className={`fs-3 fw-bolder text-${color}`}>{count}</div>
                            <div className={`fs-8 text-${color} fw-semibold`}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Table */}
                <div className='card card-flush'>
                  <div className='card-header align-items-center py-4'>
                    <div className='card-title'>
                      <h4 className='fw-bold m-0'>
                        <i className='ki-duotone ki-folder fs-3 text-primary me-2'><span className='path1'></span><span className='path2'></span></i>
                        Documents
                      </h4>
                    </div>
                    <div className='card-toolbar'>
                      <select className='form-select form-select-solid form-select-sm w-150px' value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as DocumentStatus | '')}>
                        <option value=''>All Status</option>
                        {(Object.keys(DOC_STATUS_CONFIG) as DocumentStatus[]).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className='card-body pt-0'>
                    {loadingDocs ? (
                      <div className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary me-2'></span>Loading documents...
                      </div>
                    ) : filteredDocs.length === 0 ? (
                      <div className='text-center py-10'>
                        <i className='ki-duotone ki-folder-up fs-3x text-gray-200 mb-3'>
                          <span className='path1'></span><span className='path2'></span>
                        </i>
                        <p className='text-muted'>No documents found for this student.</p>
                      </div>
                    ) : (
                      <div className='table-responsive'>
                        <table className='table align-middle table-row-dashed fs-7 gy-4'>
                          <thead>
                            <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                              <th>#</th><th>Document Type</th><th>File</th><th>Status</th><th>Uploaded</th><th className='text-end'>Actions</th>
                            </tr>
                          </thead>
                          <tbody className='fw-semibold text-gray-600'>
                            {filteredDocs.map((doc, idx) => (
                              <tr key={doc.id}>
                                <td className='text-muted'>{idx + 1}</td>
                                <td>
                                  <span className='badge badge-light-primary fw-bold'>
                                    {doc.document_type.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </td>
                                <td>
                                  <a href={doc.file_path} target='_blank' rel='noreferrer'
                                    className='text-primary fw-semibold fs-7 d-inline-flex align-items-center gap-1'>
                                    <i className='ki-duotone ki-file fs-5'><span className='path1'></span><span className='path2'></span></i>
                                    <span className='text-truncate' style={{ maxWidth: 160 }}>{doc.file_path.split('/').pop()}</span>
                                    <i className='ki-duotone ki-exit-right-corner fs-7'><span className='path1'></span><span className='path2'></span></i>
                                  </a>
                                </td>
                                <td><DocStatusBadge status={doc.verification_status} /></td>
                                <td className='text-muted fs-8'>
                                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                <td className='text-end'>
                                  <div className='d-flex gap-2 justify-content-end'>
                                    {doc.verification_status !== 'Verified' && (
                                      <button className='btn btn-sm btn-light-success fw-bold'
                                        onClick={() => openVerifyModal(doc, 'Verified')}>
                                        <i className='ki-duotone ki-shield-tick fs-5'><span className='path1'></span><span className='path2'></span></i> Verify
                                      </button>
                                    )}
                                    {doc.verification_status !== 'Rejected' && (
                                      <button className='btn btn-sm btn-light-danger fw-bold'
                                        onClick={() => openVerifyModal(doc, 'Rejected')}>
                                        <i className='ki-duotone ki-shield-cross fs-5'><span className='path1'></span><span className='path2'></span></i> Reject
                                      </button>
                                    )}
                                    {doc.verification_status !== 'Pending' && (
                                      <button className='btn btn-sm btn-light-warning fw-bold'
                                        onClick={() => openVerifyModal(doc, 'Pending')}>
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Content>

      {/* ── Verify Modal ── */}
      <Modal show={showVerifyModal} onHide={() => !verifySaving && setShowVerifyModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className={`ki-duotone ki-shield-tick fs-2 text-${DOC_STATUS_CONFIG[verifyStatus]?.color || 'primary'} me-2`}>
              <span className='path1'></span><span className='path2'></span>
            </i>
            Update Document Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-8 px-lg-12'>
          {verifyError && <Alert variant='danger' dismissible onClose={() => setVerifyError(null)}>{verifyError}</Alert>}

          {selectedDoc && (
            <div className='notice d-flex bg-light-primary rounded p-4 mb-6'>
              <i className='ki-duotone ki-folder fs-2x text-primary me-3'><span className='path1'></span><span className='path2'></span></i>
              <div>
                <div className='fw-bold text-gray-800'>{selectedDoc.document_type.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className='text-muted fs-7'>{selectedDoc.file_path}</div>
                <div className='mt-1'>Current: <DocStatusBadge status={selectedDoc.verification_status} /></div>
              </div>
            </div>
          )}

          <label className='required fw-semibold fs-6 mb-3'>Update to</label>
          <div className='d-flex flex-column gap-3'>
            {(Object.keys(DOC_STATUS_CONFIG) as DocumentStatus[]).map(s => (
              <label key={s}
                className={`d-flex align-items-center p-4 rounded-2 border-2 border-dashed ${verifyStatus === s ? `border-${DOC_STATUS_CONFIG[s].color} bg-light-${DOC_STATUS_CONFIG[s].color}` : 'border-gray-200'}`}
                style={{ cursor: 'pointer' }}>
                <input type='radio' name='doc_status' className='form-check-input me-3' value={s}
                  checked={verifyStatus === s} onChange={() => setVerifyStatus(s)} />
                <DocStatusBadge status={s} />
                <span className='ms-3 text-gray-700 fw-semibold'>{s}</span>
              </label>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowVerifyModal(false)} disabled={verifySaving}>Cancel</Button>
          <Button
            variant={DOC_STATUS_CONFIG[verifyStatus]?.color === 'warning' ? 'warning' : DOC_STATUS_CONFIG[verifyStatus]?.color === 'success' ? 'success' : 'danger'}
            onClick={handleVerify}
            disabled={verifySaving || verifyStatus === selectedDoc?.verification_status}
          >
            {verifySaving
              ? <><span className='spinner-border spinner-border-sm me-2'></span>Updating...</>
              : `Mark as ${verifyStatus}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const DocumentsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Students', path: '/students/admission', isActive: false },
      { title: 'Document Verification', path: '/students/documents', isActive: true }
    ]}>
      Document Verification
    </PageTitle>
    <DocumentsPage />
  </>
)

export { DocumentsWrapper }
