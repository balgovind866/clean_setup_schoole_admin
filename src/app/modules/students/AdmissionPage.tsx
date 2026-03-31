import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  admitStudent, getStudents, getStudentById,
  updateStudentProfile, updateStudentParent, updateStudentAddress,
  uploadDocument, enrollStudent, getStudentDocuments, toggleStudentStatus,
} from './core/_requests'
import { getClasses, getClassSections, getAcademicSessions } from '../academic/core/_requests'
import {
  StudentModel, StudentDocumentModel, DocumentType,
  AdmitStudentPayload, StudentProfilePayload, StudentParentPayload, StudentAddressPayload
} from './core/_models'
import { ClassModel, ClassSectionMappingModel, SessionModel } from '../academic/core/_models'

// ─── Constants ───────────────────────────────────────────────────────────────
const DOCUMENT_TYPES: DocumentType[] = [
  'AadharCard', 'BirthCertificate', 'TransferCertificate',
  'PassportPhoto', 'MarkSheet', 'MedicalCertificate', 'CasteCertificate', 'Other',
]
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']
const GENDERS = ['male', 'female', 'other']

type Tab = 'enrollment' | 'profile' | 'parent' | 'address' | 'documents'

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdmissionPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // ─── Students List State ───
  const [students, setStudents] = useState<StudentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [listError, setListError] = useState<string | null>(null)

  // ─── Admit Modal State ───
  const [showAdmitModal, setShowAdmitModal] = useState(false)
  const [admitSaving, setAdmitSaving] = useState(false)
  const [admitError, setAdmitError] = useState<string | null>(null)
  const [admitForm, setAdmitForm] = useState<AdmitStudentPayload>({
    first_name: '', last_name: '', mobile_number: '', email: '', password: '',
  })

  // ─── Manage Modal State ───
  const [showManageModal, setShowManageModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('enrollment')
  const [selectedStudent, setSelectedStudent] = useState<StudentModel | null>(null)
  const [manageSaving, setManageSaving] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)
  const [manageSuccess, setManageSuccess] = useState<string | null>(null)

  // Sub-forms for Manage Modal
  const [profileForm, setProfileForm] = useState<StudentProfilePayload>({ dob: '', gender: 'male', blood_group: 'B+', nationality: 'Indian', category: 'General' })
  const [parentForm, setParentForm] = useState<StudentParentPayload>({ father_name: '', father_phone: '', father_occupation: '', mother_name: '', mother_phone: '', mother_occupation: '' })
  const [addrForm, setAddrForm] = useState<StudentAddressPayload>({ current_address: '', current_city: '', current_state: '', current_pincode: '', is_same_as_current: true, permanent_address: '', permanent_city: '', permanent_state: '', permanent_pincode: '' })

  // Documents
  const [docs, setDocs] = useState<StudentDocumentModel[]>([])
  const [docForm, setDocForm] = useState({ document_type: 'AadharCard' as DocumentType, file_path: '' })

  // Enrollment
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
  const [enrollForm, setEnrollForm] = useState({ academic_session_id: '', class_id: '', class_section_id: '', roll_number: '', enrollment_date: '' })

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!schoolId) return
    setLoading(true); setListError(null)
    try {
      const { data } = await getStudents(schoolId, { limit: 100 })
      if (data.success) setStudents(data.data.students || [])
    } catch (err: any) {
      setListError(err.response?.data?.message || 'Failed to load students')
    } finally { setLoading(false) }
  }, [schoolId])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes] = await Promise.all([getAcademicSessions(schoolId, 1, 100), getClasses(schoolId, 1, 100)])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
    } catch { }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  const handleClassChange = async (classId: string) => {
    setEnrollForm(e => ({ ...e, class_id: classId, class_section_id: '' }))
    setClassSections([])
    if (!classId) return
    try {
      const { data } = await getClassSections(schoolId, classId)
      if (data.success) setClassSections(data.data.sections || [])
    } catch { }
  }

  // ─── Handlers: Admit ────────────────────────────────────────────────────────
  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdmitSaving(true); setAdmitError(null)
    try {
      await admitStudent(schoolId, admitForm)
      setShowAdmitModal(false)
      setAdmitForm({ first_name: '', last_name: '', mobile_number: '', email: '', password: '' })
      fetchStudents()
    } catch (err: any) {
      setAdmitError(err.response?.data?.message || 'Failed to admit student (check if email/mobile exists)')
    } finally { setAdmitSaving(false) }
  }

  // ─── Handlers: Manage Modal ─────────────────────────────────────────────────
  const openManageModal = async (student: StudentModel) => {
    setSelectedStudent(student)
    setActiveTab('enrollment')
    setManageError(null); setManageSuccess(null)
    setShowManageModal(true)

    // Pre-fill forms (if backend didn't send full nested data in the list, we fetch individual)
    try {
      const { data: fullData } = await getStudentById(schoolId, student.id)
      const s = fullData.data.student

      if (s.profile) setProfileForm({ dob: s.profile.dob || '', gender: s.profile.gender, blood_group: s.profile.blood_group, nationality: s.profile.nationality, category: s.profile.category })
      if (s.parent) setParentForm({ father_name: s.parent.father_name, father_phone: s.parent.father_phone, father_occupation: s.parent.father_occupation, mother_name: s.parent.mother_name, mother_phone: s.parent.mother_phone, mother_occupation: s.parent.mother_occupation })
      if (s.address) setAddrForm({ current_address: s.address.current_address, current_city: s.address.current_city, current_state: s.address.current_state, current_pincode: s.address.current_pincode, is_same_as_current: s.address.is_same_as_current, permanent_address: s.address.permanent_address || '', permanent_city: s.address.permanent_city || '', permanent_state: s.address.permanent_state || '', permanent_pincode: s.address.permanent_pincode || '' })

      const enroll = s.enrollments?.[0]
      if (enroll) {
        setEnrollForm({ academic_session_id: String(enroll.academic_session_id), class_id: String(enroll.class_section?.class?.id || ''), class_section_id: String(enroll.class_section_id), roll_number: enroll.roll_number, enrollment_date: enroll.enrollment_date.split('T')[0] })
        if (enroll.class_section?.class?.id) handleClassChange(String(enroll.class_section.class.id))
      }

      const { data: docData } = await getStudentDocuments(schoolId, student.id)
      if (docData.success) setDocs(docData.data.documents || [])
    } catch { }
  }

  const successToast = (msg: string) => {
    setManageSuccess(msg)
    setTimeout(() => setManageSuccess(null), 3000)
    fetchStudents() // Refresh list on background
  }

  // Sub-form submits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setManageSaving(true); setManageError(null)
    try {
      await updateStudentProfile(schoolId, selectedStudent.id, profileForm)
      successToast('Profile updated successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error saving profile') }
    finally { setManageSaving(false) }
  }

  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setManageSaving(true); setManageError(null)
    try {
      await updateStudentParent(schoolId, selectedStudent.id, parentForm)
      successToast('Parent details saved successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error saving parent info') }
    finally { setManageSaving(false) }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setManageSaving(true); setManageError(null)
    try {
      const payload = addrForm.is_same_as_current
        ? { current_address: addrForm.current_address, current_city: addrForm.current_city, current_state: addrForm.current_state, current_pincode: addrForm.current_pincode, is_same_as_current: true }
        : { ...addrForm }
      await updateStudentAddress(schoolId, selectedStudent.id, payload)
      successToast('Address saved successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error saving address') }
    finally { setManageSaving(false) }
  }

  const handleAddDocument = async () => {
    if (!selectedStudent || !docForm.file_path.trim()) return
    setManageSaving(true); setManageError(null)
    try {
      await uploadDocument(schoolId, selectedStudent.id, docForm)
      const { data } = await getStudentDocuments(schoolId, selectedStudent.id)
      if (data.success) setDocs(data.data.documents || [])
      setDocForm({ document_type: 'AadharCard', file_path: '' })
      successToast('Document added!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error adding document') }
    finally { setManageSaving(false) }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setManageSaving(true); setManageError(null)
    try {
      await enrollStudent(schoolId, selectedStudent.id, {
        academic_session_id: Number(enrollForm.academic_session_id),
        class_section_id: Number(enrollForm.class_section_id),
        roll_number: enrollForm.roll_number,
        enrollment_date: enrollForm.enrollment_date,
      })
      successToast('Student enrolled successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error enrolling student') }
    finally { setManageSaving(false) }
  }

  const handleToggleStatus = async (student: StudentModel) => {
    try {
      await toggleStudentStatus(schoolId, student.id)
      successToast(`Student ${student.first_name} marked as ${student.is_active ? 'Inactive' : 'Active'}`)
      // Not calling fetchStudents directly here if successToast already does it
    } catch (err: any) {
      setListError(err.response?.data?.message || 'Failed to toggle status')
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email} ${s.mobile_number}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: students.length,
    active: students.filter(s => s.is_active).length,
    enrolled: students.filter(s => s.enrollments && s.enrollments.length > 0).length,
  }

  const CheckIcon = ({ exists }: { exists: boolean }) => (
    exists ? <i className="ki-duotone ki-check-circle fs-2 text-success" title="Completed"><span className="path1"></span><span className="path2"></span></i>
      : <i className="ki-duotone ki-cross-circle fs-2 text-gray-400" title="Missing"><span className="path1"></span><span className="path2"></span></i>
  )

  return (
    <>

      <Content>
        {/* ── Stats Cards ── */}
        <div className='d-flex gap-3 flex-wrap mb-7'>
          {[
            { label: 'Total Students', value: stats.total, color: 'primary', bg: 'bg-light-primary', },
            { label: 'Active', value: stats.active, color: 'success', bg: 'bg-light-success', },
            { label: 'Enrolled', value: stats.enrolled, color: 'info', bg: 'bg-light-info', },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`d-flex align-items-center gap-3 ${bg} rounded-3 px-4 py-3`} style={{ minWidth: 140 }}>
              <div className={`symbol symbol-35px rounded-circle bg-${color} bg-opacity-15 d-flex align-items-center justify-content-center`}>
                <i className={` fs-3 text-${color}`}><span className='path1' /><span className='path2' /></i>
              </div>
              <div>
                <div className={`fs-4 fw-bold text-${color} lh-1`}>{loading ? '—' : value}</div>
                <div className='text-gray-500 fw-semibold fs-8 mt-1'>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {listError && <div className='alert alert-danger mb-5'>{listError}</div>}

        {/* ── Student List ── */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
            <div className='card-title d-flex flex-column'>
              <h3 className='fw-bold mb-1'>All Students</h3>
              <span className='text-muted fs-7'>Detailed completion status shown below</span>
            </div>
            <div className='card-toolbar gap-3'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search students...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className='btn btn-primary' onClick={() => setShowAdmitModal(true)}>
                <i className='ki-duotone ki-plus fs-2'></i> Admit New Student
              </button>
            </div>
          </div>

          <div className='card-body pt-0'>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th className='w-10px'>#</th>
                    <th className='min-w-150px'>Student</th>
                    <th>Basic</th>
                    <th className='text-center'>Profile</th>
                    <th className='text-center'>Parent</th>
                    <th className='text-center'>Address</th>
                    <th className='text-center'>Docs</th>
                    <th className='text-center'>Enrolled</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr><td colSpan={9} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2'></span>Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} className='text-center py-12'>
                      <div className='text-muted'>No students found. Click "Admit New Student" to begin.</div>
                    </td></tr>
                  ) : filtered.map((s, idx) => {
                    // Resilient checks for objects or arrays to handle multiple variations from backend API
                    const hasProfile = s.profile && (Array.isArray(s.profile) ? s.profile.length > 0 : Object.keys(s.profile).length > 0);
                    const hasParent = s.parent && (Array.isArray(s.parent) ? s.parent.length > 0 : Object.keys(s.parent).length > 0);

                    const addrObj = s.address || (s as any).addresses;
                    const hasAddress = Array.isArray(addrObj) ? addrObj.length > 0 : !!addrObj && Object.keys(addrObj).length > 0;

                    const docsObj = s.documents || (s as any).document;
                    const docsArray = Array.isArray(docsObj) ? docsObj : (docsObj ? [docsObj] : []);
                    const docsCount = docsArray.length;
                    const verifiedCount = docsArray.filter((d: any) => d.verification_status === 'Verified').length;
                    const pendingCount = docsArray.filter((d: any) => d.verification_status === 'Pending').length;
                    const rejectedCount = docsArray.filter((d: any) => d.verification_status === 'Rejected').length;

                    const enrollObj = s.enrollments || (s as any).enrollment;
                    const hasEnrollment = Array.isArray(enrollObj) ? enrollObj.length > 0 : !!enrollObj && Object.keys(enrollObj).length > 0;

                    return (
                      <tr key={s.id}>
                        <td><span className='text-gray-500'>{idx + 1}</span></td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-40px me-3'>
                              <div className='symbol-label fs-3 fw-bold text-primary bg-light-primary'>
                                {s.first_name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className='text-gray-800 fw-bold'>{s.first_name} {s.last_name}</div>
                              <div className='text-muted fs-7'>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='text-gray-800 fw-bold fs-7 mb-2'>{s.mobile_number}</div>
                          <div
                            className='d-flex align-items-center gap-2 cursor-pointer'
                            onClick={() => handleToggleStatus(s)}
                          >
                            {/* Circular toggle button like in image */}
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: `3px solid ${s.is_active ? '#7F77DD' : '#ccc'}`,
                                backgroundColor: s.is_active ? 'transparent' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'border-color 0.2s',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  backgroundColor: s.is_active ? '#7F77DD' : '#ccc',
                                  transition: 'background-color 0.2s',
                                }}
                              />
                            </div>
                            <label
                              className={`fs-8 fw-bold cursor-pointer mb-0 ${s.is_active ? 'text-success' : 'text-danger'
                                }`}
                            >
                              {s.is_active ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </td>                      <td className='text-center'><CheckIcon exists={!!hasProfile} /></td>
                        <td className='text-center'><CheckIcon exists={!!hasParent} /></td>
                        <td className='text-center'><CheckIcon exists={!!hasAddress} /></td>
                        <td className='text-center text-muted'>
                          {docsCount > 0 ? (
                            <div className='d-flex flex-column align-items-center gap-1'>
                              <span className='badge badge-light-primary'>{docsCount} Doc{docsCount > 1 ? 's' : ''}</span>
                              {verifiedCount > 0 && <span className='badge badge-light-success fs-9 px-1 py-1'>{verifiedCount} Verified</span>}
                              {pendingCount > 0 && <span className='badge badge-light-warning fs-9 px-1 py-1'>{pendingCount} Pending</span>}
                              {rejectedCount > 0 && <span className='badge badge-light-danger fs-9 px-1 py-1'>{rejectedCount} Rejected</span>}
                            </div>
                          ) : <span className='text-gray-400'>0 Docs</span>}
                        </td>
                        <td className='text-center'>
                          {hasEnrollment ? (
                            <span className='badge badge-light-success'>Yes</span>
                          ) : <span className='badge badge-light-warning'>Pending</span>}
                        </td>
                        <td className='text-end'>
                          <button className='btn btn-sm btn-light-primary fw-bold' onClick={() => openManageModal(s)}>
                            <i className='ki-duotone ki-setting-2 fs-4 me-1'><span className='path1'></span><span className='path2'></span></i> Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className='mt-3 text-muted fs-8 d-flex align-items-center'>
              <i className='ki-duotone ki-information-4 fs-3 me-2 text-primary'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i>
              Note: If columns display 'Missing' even after filling details, your backend API `GET /students` may need to include relations (`profile`, `parent`, `address`, `documents`, `enrollments`).
            </div>
          </div>
        </div>
      </Content>

      {/* ── Quick Admit Modal ── */}
      <Modal show={showAdmitModal} onHide={() => !admitSaving && setShowAdmitModal(false)} centered backdrop='static'>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title><i className='ki-duotone ki-user-edit fs-2x text-primary me-2'><span className='path1'></span><span className='path2'></span></i> Admit New Student</Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-lg-10 pt-4 pb-8'>
          <p className='text-muted fs-7 mb-6'>Enter basic info to create the account. You can configure their profile & enroll them later.</p>
          {admitError && <Alert variant='danger'>{admitError}</Alert>}
          <form onSubmit={handleAdmit}>
            <div className='row g-4'>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>First Name</label>
                <input className='form-control form-control-solid' placeholder='Rahul' value={admitForm.first_name} onChange={e => setAdmitForm(s => ({ ...s, first_name: e.target.value }))} required />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Last Name</label>
                <input className='form-control form-control-solid' placeholder='Sharma' value={admitForm.last_name} onChange={e => setAdmitForm(s => ({ ...s, last_name: e.target.value }))} required />
              </div>
              <div className='col-md-12 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Email</label>
                <input type='email' className='form-control form-control-solid' placeholder='student@school.com' value={admitForm.email} onChange={e => setAdmitForm(s => ({ ...s, email: e.target.value }))} required />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Mobile</label>
                <input className='form-control form-control-solid' placeholder='10 digits' value={admitForm.mobile_number} onChange={e => setAdmitForm(s => ({ ...s, mobile_number: e.target.value }))} required maxLength={10} />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Password</label>
                <input type='password' className='form-control form-control-solid' placeholder='Min 6 chars' value={admitForm.password} onChange={e => setAdmitForm(s => ({ ...s, password: e.target.value }))} required minLength={6} />
              </div>
            </div>
            <div className='d-flex justify-content-end pt-8'>
              <Button variant='light' onClick={() => setShowAdmitModal(false)} className='me-3' disabled={admitSaving}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={admitSaving}>
                {admitSaving ? <span className='spinner-border spinner-border-sm'></span> : 'Admit Student'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* ── Manage / Profile Settings Tabbed Modal ── */}
      <Modal show={showManageModal} onHide={() => !manageSaving && setShowManageModal(false)} size='xl' centered backdrop='static'>
        <Modal.Header closeButton className='bg-light py-4'>
          <Modal.Title className='d-flex align-items-center w-100'>
            <div className='symbol symbol-40px me-4'>
              <div className='symbol-label fs-3 bg-primary text-white'>{selectedStudent?.first_name?.charAt(0)}</div>
            </div>
            <div>
              <div className='fw-bolder fs-4'>{selectedStudent?.first_name} {selectedStudent?.last_name}</div>
              <div className='text-muted fs-7 fw-normal'>{selectedStudent?.email} · {selectedStudent?.mobile_number}</div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <div className='d-flex flex-row flex-column-fluid'>
          {/* Sidebar Menu inside modal */}
          <div className='w-250px w-lg-300px bg-light-dark px-6 py-8 border-end border-gray-200'>
            <div className='menu menu-column menu-rounded menu-title-gray-800 menu-state-title-primary menu-state-icon-primary menu-state-bullet-primary menu-arrow-gray-500'>
              {[
                { id: 'enrollment' as Tab, label: 'Enrollment', icon: 'ki-book-open' },
                { id: 'profile' as Tab, label: 'Personal Profile', icon: 'ki-user-edit' },
                { id: 'parent' as Tab, label: 'Parent / Family', icon: 'ki-people' },
                { id: 'address' as Tab, label: 'Address Details', icon: 'ki-map' },
                { id: 'documents' as Tab, label: 'Documents', icon: 'ki-folder' },
              ].map(t => (
                <div key={t.id} className='menu-item mb-2'>
                  <span className={`menu-link px-4 py-3 ${activeTab === t.id ? 'active bg-white shadow-sm' : ''}`}
                    onClick={() => setActiveTab(t.id)} style={{ cursor: 'pointer', borderRadius: '8px' }}>
                    <span className='menu-icon'>
                      <i className={`ki-duotone ${t.icon} fs-2 ${activeTab === t.id ? 'text-primary' : 'text-gray-500'}`}><span className='path1'></span><span className='path2'></span></i>
                    </span>
                    <span className={`menu-title fw-bold fs-6 ${activeTab === t.id ? 'text-primary' : 'text-gray-700'}`}>{t.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Content Area */}
          <div className='flex-grow-1 p-8 p-lg-12' style={{ minHeight: '500px', maxHeight: '70vh', overflowY: 'auto' }}>
            {manageError && <Alert variant='danger' dismissible onClose={() => setManageError(null)}>{manageError}</Alert>}
            {manageSuccess && <Alert variant='success' dismissible onClose={() => setManageSuccess(null)}>{manageSuccess}</Alert>}

            {/* TAB: Enrollment */}
            {activeTab === 'enrollment' && (
              <form onSubmit={handleEnroll}>
                <h4 className='fw-bold mb-5'>Enroll Student in Class</h4>
                <div className='row g-5 mb-8'>
                  <div className='col-md-6 fv-row'>
                    <label className='required fw-semibold fs-6 mb-2'>Session</label>
                    <select className='form-select form-select-solid' value={enrollForm.academic_session_id} onChange={e => setEnrollForm(s => ({ ...s, academic_session_id: e.target.value }))} required>
                      <option value=''>-- Select Session --</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '(Current)' : ''}</option>)}
                    </select>
                  </div>
                  <div className='col-md-6 fv-row'>
                    <label className='required fw-semibold fs-6 mb-2'>Class</label>
                    <select className='form-select form-select-solid' value={enrollForm.class_id} onChange={e => handleClassChange(e.target.value)} required>
                      <option value=''>-- Select Class --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className='col-md-6 fv-row'>
                    <label className='required fw-semibold fs-6 mb-2'>Section</label>
                    <select className='form-select form-select-solid' value={enrollForm.class_section_id} onChange={e => setEnrollForm(s => ({ ...s, class_section_id: e.target.value }))} required disabled={!enrollForm.class_id}>
                      <option value=''>-- Select Section --</option>
                      {classSections.map(cs => <option key={cs.id} value={cs.id}>Section {cs.section?.name}</option>)}
                    </select>
                  </div>
                  <div className='col-md-6 fv-row'>
                    <label className='required fw-semibold fs-6 mb-2'>Roll Number</label>
                    <input className='form-control form-control-solid' placeholder='10A-001' value={enrollForm.roll_number} onChange={e => setEnrollForm(s => ({ ...s, roll_number: e.target.value }))} required />
                  </div>
                  <div className='col-md-6 fv-row'>
                    <label className='required fw-semibold fs-6 mb-2'>Enrollment Date</label>
                    <input type='date' className='form-control form-control-solid' value={enrollForm.enrollment_date} onChange={e => setEnrollForm(s => ({ ...s, enrollment_date: e.target.value }))} required />
                  </div>
                </div>
                <div className='text-end'><Button variant='success' type='submit' disabled={manageSaving}>{manageSaving ? 'Enrolling...' : 'Save Enrollment'}</Button></div>
              </form>
            )}

            {/* TAB: Profile */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <h4 className='fw-bold mb-5'>Personal Profile</h4>
                <div className='row g-5 mb-8'>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-2'>DOB</label><input type='date' className='form-control form-control-solid' value={profileForm.dob} onChange={e => setProfileForm(s => ({ ...s, dob: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-2'>Gender</label><select className='form-select form-select-solid' value={profileForm.gender} onChange={e => setProfileForm(s => ({ ...s, gender: e.target.value }))}>{GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}</select></div>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Blood Group</label><select className='form-select form-select-solid' value={profileForm.blood_group} onChange={e => setProfileForm(s => ({ ...s, blood_group: e.target.value }))}>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}</select></div>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Nationality</label><input className='form-control form-control-solid' value={profileForm.nationality} onChange={e => setProfileForm(s => ({ ...s, nationality: e.target.value }))} required /></div>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Category</label><select className='form-select form-select-solid' value={profileForm.category} onChange={e => setProfileForm(s => ({ ...s, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
                <div className='text-end'><Button variant='primary' type='submit' disabled={manageSaving}>{manageSaving ? 'Saving...' : 'Save Profile'}</Button></div>
              </form>
            )}

            {/* TAB: Parent */}
            {activeTab === 'parent' && (
              <form onSubmit={handleSaveParent}>
                <h4 className='fw-bold mb-5'>Parent Details</h4>
                <div className='row g-5 mb-8'>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Father Name</label><input className='form-control form-control-solid' value={parentForm.father_name} onChange={e => setParentForm(s => ({ ...s, father_name: e.target.value }))} required /></div>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Father Phone</label><input className='form-control form-control-solid' value={parentForm.father_phone} onChange={e => setParentForm(s => ({ ...s, father_phone: e.target.value }))} required /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Father Occupation</label><input className='form-control form-control-solid' value={parentForm.father_occupation} onChange={e => setParentForm(s => ({ ...s, father_occupation: e.target.value }))} /></div>
                  <div className='col-12'><hr className='text-muted my-2' /></div>
                  <div className='col-md-4'><label className='required fw-semibold fs-6 mb-2'>Mother Name</label><input className='form-control form-control-solid' value={parentForm.mother_name} onChange={e => setParentForm(s => ({ ...s, mother_name: e.target.value }))} required /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Mother Phone</label><input className='form-control form-control-solid' value={parentForm.mother_phone} onChange={e => setParentForm(s => ({ ...s, mother_phone: e.target.value }))} /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Mother Occupation</label><input className='form-control form-control-solid' value={parentForm.mother_occupation} onChange={e => setParentForm(s => ({ ...s, mother_occupation: e.target.value }))} /></div>
                </div>
                <div className='text-end'><Button variant='primary' type='submit' disabled={manageSaving}>{manageSaving ? 'Saving...' : 'Save Parent Details'}</Button></div>
              </form>
            )}

            {/* TAB: Address */}
            {activeTab === 'address' && (
              <form onSubmit={handleSaveAddress}>
                <h4 className='fw-bold mb-5'>Address Details</h4>
                <div className='row g-4 mb-8'>
                  <div className='col-md-8'><label className='fw-semibold fs-6 mb-2'>Current Street/Area</label><input className='form-control form-control-solid' value={addrForm.current_address} onChange={e => setAddrForm(s => ({ ...s, current_address: e.target.value }))} required /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Pincode</label><input className='form-control form-control-solid' value={addrForm.current_pincode} onChange={e => setAddrForm(s => ({ ...s, current_pincode: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-2'>City</label><input className='form-control form-control-solid' value={addrForm.current_city} onChange={e => setAddrForm(s => ({ ...s, current_city: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-2'>State</label><input className='form-control form-control-solid' value={addrForm.current_state} onChange={e => setAddrForm(s => ({ ...s, current_state: e.target.value }))} required /></div>
                  <div className='col-12'>
                    <div className='form-check form-switch form-check-custom mt-2'>
                      <input className='form-check-input' type='checkbox' checked={addrForm.is_same_as_current} onChange={e => setAddrForm(s => ({ ...s, is_same_as_current: e.target.checked }))} />
                      <label className='form-check-label ms-3'>Permanent address same as current address</label>
                    </div>
                  </div>
                  {!addrForm.is_same_as_current && (
                    <div className='row g-4 mt-1 p-0 m-0 w-100 border rounded bg-light'>
                      <div className='col-md-8'><label className='fw-semibold fs-6 mb-2'>Permanent Street/Area</label><input className='form-control form-control-solid' value={addrForm.permanent_address} onChange={e => setAddrForm(s => ({ ...s, permanent_address: e.target.value }))} required /></div>
                      <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Pincode</label><input className='form-control form-control-solid' value={addrForm.permanent_pincode} onChange={e => setAddrForm(s => ({ ...s, permanent_pincode: e.target.value }))} required /></div>
                      <div className='col-md-6'><label className='fw-semibold fs-6 mb-2'>City</label><input className='form-control form-control-solid' value={addrForm.permanent_city} onChange={e => setAddrForm(s => ({ ...s, permanent_city: e.target.value }))} required /></div>
                      <div className='col-md-6 mb-4'><label className='fw-semibold fs-6 mb-2'>State</label><input className='form-control form-control-solid' value={addrForm.permanent_state} onChange={e => setAddrForm(s => ({ ...s, permanent_state: e.target.value }))} required /></div>
                    </div>
                  )}
                </div>
                <div className='text-end'><Button variant='primary' type='submit' disabled={manageSaving}>{manageSaving ? 'Saving...' : 'Save Address'}</Button></div>
              </form>
            )}

            {/* TAB: Documents */}
            {activeTab === 'documents' && (
              <div>
                <h4 className='fw-bold mb-5'>Student Documents</h4>
                <div className='row g-3 mb-6 align-items-end'>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-2'>Document Type</label><select className='form-select form-select-solid' value={docForm.document_type} onChange={e => setDocForm(d => ({ ...d, document_type: e.target.value as DocumentType }))}>{DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}</select></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-2'>File Path</label><input className='form-control form-control-solid' value={docForm.file_path} onChange={e => setDocForm(d => ({ ...d, file_path: e.target.value }))} /></div>
                  <div className='col-md-2'><Button variant='light-primary' className='w-100' onClick={handleAddDocument} disabled={manageSaving || !docForm.file_path.trim()}><i className='ki-duotone ki-plus fs-3'></i> Add</Button></div>
                </div>
                <div className='table-responsive'>
                  <table className='table table-row-dashed fs-7 gy-3'>
                    <thead><tr className='text-gray-400 fw-bold border-bottom'><th className='ps-0'>Type</th><th>File</th><th>Status</th></tr></thead>
                    <tbody>
                      {docs.length === 0 && <tr><td colSpan={3} className='text-center text-muted py-5'>No documents uploaded.</td></tr>}
                      {docs.map(d => (
                        <tr key={d.id}>
                          <td className='ps-0 fw-bold'>{d.document_type.replace(/([A-Z])/g, ' $1').trim()}</td>
                          <td><a href={d.file_path} target='_blank' rel='noreferrer' className='text-primary fw-semibold'><i className='ki-duotone ki-file fs-5 me-1'><span className='path1'></span><span className='path2'></span></i>View File</a></td>
                          <td><span className={`badge badge-light-${d.verification_status === 'Verified' ? 'success' : d.verification_status === 'Rejected' ? 'danger' : 'warning'}`}>{d.verification_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

    </>
  )
}

const AdmissionWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[]}>All Students</PageTitle>
    <AdmissionPage />
  </>
)

export { AdmissionWrapper }
