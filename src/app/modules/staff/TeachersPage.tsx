import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  createTeacher, getTeachers, getTeacherById,
  updateTeacherProfile, updateTeacherBank,
  addTeacherExperience, addTeacherDocument,
  toggleTeacherStatus,
} from '../teachers/core/_requests'
import {
  TeacherModel, TeacherExperience,
  CreateTeacherPayload, UpdateTeacherProfilePayload,
  UpdateTeacherBankPayload, AddTeacherExperiencePayload,
  AddTeacherDocumentPayload,
} from '../teachers/core/_models'

// ─── Constants ────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']
const GENDERS = ['male', 'female', 'other']
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed']
const EMPLOYMENT_TYPES = ['permanent', 'contractual', 'part-time', 'guest']

type Tab = 'profile' | 'bank' | 'experience' | 'documents'

// ─── Completion Progress Bar ──────────────────────────────────────────────────
const CompletionBar: FC<{ pct: number; status?: { profile: boolean; experience: boolean; documents: boolean; bank_details: boolean } }> = ({ pct, status }) => {
  const color = pct === 100 ? 'success' : pct >= 50 ? 'warning' : 'danger'
  return (
    <div>
      <div className='d-flex justify-content-between mb-1'>
        <span className={`fs-8 fw-bold text-${color}`}>{pct ?? 0}% Complete</span>
      </div>
      <div className='h-4px w-100 bg-light-secondary rounded'>
        <div className={`bg-${color} rounded h-4px`} style={{ width: `${pct ?? 0}%`, transition: 'width 0.4s ease' }}></div>
      </div>
      {status && (
        <div className='d-flex gap-2 mt-1 flex-wrap'>
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'experience', label: 'Exp' },
            { key: 'bank_details', label: 'Bank' },
            { key: 'documents', label: 'Docs' },
          ].map(({ key, label }) => (
            <span key={key} className={`badge fs-9 badge-light-${(status as any)[key] ? 'success' : 'danger'}`}>
              {(status as any)[key] ? '✓' : '✗'} {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Check Icon ───────────────────────────────────────────────────────────────
const CheckIcon: FC<{ exists: boolean; title?: string }> = ({ exists, title }) => (
  <span title={title}>
    {exists
      ? <i className="ki-duotone ki-check-circle fs-2 text-success"><span className="path1"></span><span className="path2"></span></i>
      : <i className="ki-duotone ki-cross-circle fs-2 text-gray-300"><span className="path1"></span><span className="path2"></span></i>
    }
  </span>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const TeachersPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // ─── List State ──────────────────────────────────────────────────────────
  const [teachers, setTeachers] = useState<TeacherModel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [listError, setListError] = useState<string | null>(null)
  const [listSuccess, setListSuccess] = useState<string | null>(null)

  // ─── Create Modal State ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateTeacherPayload>({
    name: '', email: '', password: '', mobile_number: '',
    profession_id: undefined, employment_type: 'permanent',
    joining_date: new Date().toISOString().split('T')[0],
  })

  // ─── Manage Modal State ──────────────────────────────────────────────────
  const [showManageModal, setShowManageModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherModel | null>(null)
  const [manageSaving, setManageSaving] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)
  const [manageSuccess, setManageSuccess] = useState<string | null>(null)

  // Sub-forms
  const [profileForm, setProfileForm] = useState<UpdateTeacherProfilePayload>({
    dob: '', gender: 'male', blood_group: 'O+', marital_status: 'single',
    religion: '', category: 'General', father_name: '', mother_name: '',
    spouse_name: '', highest_qualification: '', present_address: '',
    permanent_address: '', emergency_contact_name: '', emergency_contact_phone: '',
  })

  const [bankForm, setBankForm] = useState<UpdateTeacherBankPayload>({
    bank_name: '', account_number: '', ifsc_code: '',
    branch_name: '', account_holder_name: '',
  })

  const [expForm, setExpForm] = useState<AddTeacherExperiencePayload>({
    school_name: '', designation: '', from_date: '', to_date: '',
    is_current: false, reason_for_leaving: '',
  })

  const [experiences, setExperiences] = useState<TeacherExperience[]>([])

  const [docForm, setDocForm] = useState<AddTeacherDocumentPayload>({ document_type: '', file_path: '' })
  const [documents, setDocuments] = useState<any[]>([])

  // ─── Load Teachers ────────────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    if (!schoolId) return
    setLoading(true); setListError(null)
    try {
      const { data } = await getTeachers(schoolId, { limit: 100 })
      if (data.success) setTeachers(data.data.teachers || [])
    } catch (err: any) {
      setListError(err.response?.data?.message || 'Failed to load teachers')
    } finally { setLoading(false) }
  }, [schoolId])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const showListSuccess = (msg: string) => {
    setListSuccess(msg)
    setTimeout(() => setListSuccess(null), 3000)
    fetchTeachers()
  }

  // ─── Create Teacher ───────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateSaving(true); setCreateError(null)
    try {
      await createTeacher(schoolId, createForm)
      setShowCreateModal(false)
      setCreateForm({ name: '', email: '', password: '', mobile_number: '', profession_id: undefined, employment_type: 'permanent', joining_date: new Date().toISOString().split('T')[0] })
      showListSuccess('Teacher added successfully!')
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create teacher. Check if email is already used.')
    } finally { setCreateSaving(false) }
  }

  // ─── Manage Modal ─────────────────────────────────────────────────────────
  const openManageModal = async (teacher: TeacherModel) => {
    setSelectedTeacher(teacher)
    setActiveTab('profile')
    setManageError(null); setManageSuccess(null)
    setExperiences([]); setDocuments([])
    setShowManageModal(true)

    try {
      const { data } = await getTeacherById(schoolId, teacher.id)
      const t = data.data.teacher
      setSelectedTeacher(t)

      if (t.profile) {
        setProfileForm({
          dob: t.profile.dob || '', gender: t.profile.gender || 'male',
          blood_group: t.profile.blood_group || 'O+',
          marital_status: t.profile.marital_status || 'single',
          religion: t.profile.religion || '', category: t.profile.category || 'General',
          father_name: t.profile.father_name || '', mother_name: t.profile.mother_name || '',
          spouse_name: t.profile.spouse_name || '',
          highest_qualification: t.profile.highest_qualification || '',
          present_address: t.profile.present_address || '',
          permanent_address: t.profile.permanent_address || '',
          emergency_contact_name: t.profile.emergency_contact_name || '',
          emergency_contact_phone: t.profile.emergency_contact_phone || '',
        })
      }
      if (t.bank_details) {
        setBankForm({
          bank_name: t.bank_details.bank_name || '',
          account_number: t.bank_details.account_number || '',
          ifsc_code: t.bank_details.ifsc_code || '',
          branch_name: t.bank_details.branch_name || '',
          account_holder_name: t.bank_details.account_holder_name || '',
        })
      }
      if (t.experiences) setExperiences(t.experiences)
      if (t.documents) setDocuments(t.documents)
    } catch { }
  }

  const manageToast = (msg: string) => {
    setManageSuccess(msg)
    setTimeout(() => setManageSuccess(null), 3000)
    fetchTeachers()
    // Re-fetch full detail to refresh completion_status
    if (selectedTeacher) {
      getTeacherById(schoolId, selectedTeacher.id)
        .then(r => setSelectedTeacher(r.data.data.teacher))
        .catch(() => { })
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return
    setManageSaving(true); setManageError(null)
    try {
      await updateTeacherProfile(schoolId, selectedTeacher.id, profileForm)
      manageToast('Profile updated successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error saving profile') }
    finally { setManageSaving(false) }
  }

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return
    setManageSaving(true); setManageError(null)
    try {
      await updateTeacherBank(schoolId, selectedTeacher.id, bankForm)
      manageToast('Bank details saved successfully!')
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error saving bank details') }
    finally { setManageSaving(false) }
  }

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return
    setManageSaving(true); setManageError(null)
    try {
      await addTeacherExperience(schoolId, selectedTeacher.id, expForm)
      // Refresh experiences
      const { data } = await getTeacherById(schoolId, selectedTeacher.id)
      setExperiences(data.data.teacher.experiences || [])
      setSelectedTeacher(data.data.teacher)
      setExpForm({ school_name: '', designation: '', from_date: '', to_date: '', is_current: false, reason_for_leaving: '' })
      setManageSuccess('Experience added!')
      setTimeout(() => setManageSuccess(null), 2000)
      fetchTeachers()
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error adding experience') }
    finally { setManageSaving(false) }
  }

  const handleAddDocument = async () => {
    if (!selectedTeacher || !docForm.document_type.trim() || !docForm.file_path.trim()) return
    setManageSaving(true); setManageError(null)
    try {
      await addTeacherDocument(schoolId, selectedTeacher.id, docForm)
      const { data } = await getTeacherById(schoolId, selectedTeacher.id)
      setDocuments(data.data.teacher.documents || [])
      setSelectedTeacher(data.data.teacher)
      setDocForm({ document_type: '', file_path: '' })
      setManageSuccess('Document added!')
      setTimeout(() => setManageSuccess(null), 2000)
      fetchTeachers()
    } catch (err: any) { setManageError(err.response?.data?.message || 'Error adding document') }
    finally { setManageSaving(false) }
  }

  const handleToggleStatus = async (teacher: TeacherModel) => {
    try {
      await toggleTeacherStatus(schoolId, teacher.id)
      showListSuccess(`${teacher.name} marked as ${teacher.is_active ? 'Inactive' : 'Active'}`)
    } catch (err: any) {
      setListError(err.response?.data?.message || 'Failed to toggle status')
    }
  }

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = teachers.filter(t =>
    `${t.name} ${t.email} ${t.phone || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.is_active).length,
    complete: teachers.filter(t => (t.completion_percentage || 0) === 100).length,
  }

  // Completion status from currently selected teacher for Manage modal sidebar
  const cs = selectedTeacher?.completion_status

  return (
    <>

      <Content>
        {/* ── Stats ── */}
        <div className='row g-5 mb-7'>
          {[
            { label: 'Total Teachers', value: stats.total, color: 'primary', icon: 'ki-duotone ki-teacher' },
            { label: 'Active', value: stats.active, color: 'success', icon: 'ki-duotone ki-verify' },
            { label: '100% Complete', value: stats.complete, color: 'info', icon: 'ki-duotone ki-check-circle' },
          ].map(({ label, value, color, icon }) => (
            <div className='col-sm-6 col-xl-4' key={label}>
              <div className={`card card-flush bg-light-${color} border-0`}>
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

        {listError && <div className='alert alert-danger mb-5'>{listError}</div>}
        {listSuccess && <div className='alert alert-success mb-5'>{listSuccess}</div>}

        {/* ── Teachers Table ── */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-3'>
            <div className='card-title d-flex flex-column'>
              <h3 className='fw-bold mb-0'>All Teachers</h3>
              <span className='text-muted fs-7'>Completion status shown per teacher</span>
            </div>
            <div className='card-toolbar gap-3'>
              <div className='d-flex align-items-center position-relative'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search teachers...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className='btn btn-primary' onClick={() => setShowCreateModal(true)}>
                <i className='ki-duotone ki-plus fs-2'></i> Add Teacher
              </button>
            </div>
          </div>

          <div className='card-body pt-0'>
            <div className='table-responsive'>
              <table className='table align-middle table-row-dashed fs-6 gy-5'>
                <thead>
                  <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                    <th>#</th>
                    <th className='min-w-150px'>Teacher</th>
                    <th>Employment</th>
                    <th className='text-center'>Profile</th>
                    <th className='text-center'>Bank</th>
                    <th className='text-center'>Exp</th>
                    <th className='text-center'>Docs</th>
                    <th className='min-w-130px'>Completion</th>
                    <th>Status</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr><td colSpan={10} className='text-center py-10'>
                      <span className='spinner-border spinner-border-sm text-primary me-2'></span>Loading...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} className='text-center py-12'>
                      <div className='text-muted'>No teachers found. Click "Add Teacher" to begin.</div>
                    </td></tr>
                  ) : filtered.map((t, idx) => {
                    const cs = t.completion_status
                    const pct = t.completion_percentage ?? 0

                    const docsArr = Array.isArray(t.documents) ? t.documents : []
                    const docsCount = docsArr.length

                    return (
                      <tr key={t.id}>
                        <td className='text-gray-500'>{idx + 1}</td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-40px me-3'>
                              <div className={`symbol-label fs-3 fw-bold text-white ${pct === 100 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-primary'}`}>
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className='text-gray-800 fw-bold'>{t.name}</div>
                              <div className='text-muted fs-7'>{t.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className='text-gray-700 fw-semibold'>{t.profession?.name || '—'}</div>
                          <span className='badge badge-light-info fs-8'>{t.employment_type || '—'}</span>
                        </td>
                        <td className='text-center'><CheckIcon exists={!!cs?.profile} title='Profile' /></td>
                        <td className='text-center'><CheckIcon exists={!!cs?.bank_details} title='Bank Details' /></td>
                        <td className='text-center'><CheckIcon exists={!!cs?.experience} title='Experience' /></td>
                        <td className='text-center'>
                          {docsCount > 0
                            ? <span className='badge badge-light-primary'>{docsCount}</span>
                            : <CheckIcon exists={false} title='Documents' />}
                        </td>
                        <td>
                          <CompletionBar pct={pct} />
                        </td>
                        <td>
                          <div className='form-check form-switch form-check-custom form-check-solid form-check-sm'>
                            <input className='form-check-input cursor-pointer' type='checkbox'
                              checked={t.is_active} onChange={() => handleToggleStatus(t)} />
                            <label className={`form-check-label fs-8 fw-bold ms-2 ${t.is_active ? 'text-success' : 'text-danger'}`}>
                              {t.is_active ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </td>
                        <td className='text-end'>
                          <button className='btn btn-sm btn-light-primary fw-bold' onClick={() => openManageModal(t)}>
                            <i className='ki-duotone ki-setting-2 fs-4'><span className='path1'></span><span className='path2'></span></i> Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Content>

      {/* ── Quick Create Modal ── */}
      <Modal show={showCreateModal} onHide={() => !createSaving && setShowCreateModal(false)} centered backdrop='static'>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title>
            <i className='ki-duotone ki-user-edit fs-2x text-primary me-2'><span className='path1'></span><span className='path2'></span></i>
            Add New Teacher
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-lg-10 pt-4 pb-8'>
          <p className='text-muted fs-7 mb-6'>Enter basic info to register. Profile, bank & experience can be updated later.</p>
          {createError && <Alert variant='danger' dismissible onClose={() => setCreateError(null)}>{createError}</Alert>}
          <form onSubmit={handleCreate}>
            <div className='row g-4'>
              <div className='col-12 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Full Name</label>
                <input className='form-control form-control-solid' placeholder='e.g. Ramesh Kumar'
                  value={createForm.name} onChange={e => setCreateForm(s => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Email</label>
                <input type='email' className='form-control form-control-solid' placeholder='teacher@school.com'
                  value={createForm.email} onChange={e => setCreateForm(s => ({ ...s, email: e.target.value }))} required />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Password</label>
                <input type='password' className='form-control form-control-solid' placeholder='Min 6 chars'
                  value={createForm.password} onChange={e => setCreateForm(s => ({ ...s, password: e.target.value }))} required minLength={6} />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='fw-semibold fs-6 mb-1'>Mobile</label>
                <input className='form-control form-control-solid' placeholder='10-digit number'
                  value={createForm.mobile_number} onChange={e => setCreateForm(s => ({ ...s, mobile_number: e.target.value }))} maxLength={10} />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='fw-semibold fs-6 mb-1'>Employment Type</label>
                <select className='form-select form-select-solid' value={createForm.employment_type}
                  onChange={e => setCreateForm(s => ({ ...s, employment_type: e.target.value }))}>
                  {EMPLOYMENT_TYPES.map(et => <option key={et} value={et}>{et.charAt(0).toUpperCase() + et.slice(1)}</option>)}
                </select>
              </div>
              <div className='col-md-6 fv-row'>
                <label className='fw-semibold fs-6 mb-1'>Joining Date</label>
                <input type='date' className='form-control form-control-solid'
                  value={createForm.joining_date} onChange={e => setCreateForm(s => ({ ...s, joining_date: e.target.value }))} />
              </div>
            </div>
            <div className='d-flex justify-content-end pt-8'>
              <Button variant='light' onClick={() => setShowCreateModal(false)} className='me-3' disabled={createSaving}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={createSaving}>
                {createSaving ? <span className='spinner-border spinner-border-sm'></span> : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* ── Manage Modal (Tabbed) ── */}
      <Modal show={showManageModal} onHide={() => !manageSaving && setShowManageModal(false)} size='xl' centered backdrop='static'>
        <Modal.Header closeButton className='bg-light py-4'>
          <div className='d-flex align-items-center w-100 gap-4'>
            <div className='symbol symbol-45px'>
              <div className={`symbol-label fs-2 fw-bold text-white ${(selectedTeacher?.completion_percentage ?? 0) === 100 ? 'bg-success' : 'bg-primary'}`}>
                {selectedTeacher?.name?.charAt(0) ?? '?'}
              </div>
            </div>
            <div className='flex-grow-1'>
              <div className='fw-bolder fs-4'>{selectedTeacher?.name}</div>
              <div className='text-muted fs-7'>{selectedTeacher?.email} · {selectedTeacher?.profession?.name || 'No Profession'}</div>
            </div>
            <div className='d-none d-md-block' style={{ minWidth: 200 }}>
              <CompletionBar
                pct={selectedTeacher?.completion_percentage ?? 0}
                status={selectedTeacher?.completion_status}
              />
            </div>
          </div>
        </Modal.Header>

        <div className='d-flex' style={{ minHeight: 520 }}>
          {/* Sidebar Tabs */}
          <div className='w-230px bg-light px-4 py-7 border-end border-gray-200 flex-shrink-0'>
            {[
              { id: 'profile' as Tab, label: 'Personal Profile', icon: 'ki-user-edit', done: cs?.profile },
              { id: 'bank' as Tab, label: 'Bank Details', icon: 'ki-bank', done: cs?.bank_details },
              { id: 'experience' as Tab, label: 'Experience', icon: 'ki-briefcase', done: cs?.experience },
              { id: 'documents' as Tab, label: 'Documents', icon: 'ki-folder', done: cs?.documents },
            ].map(tab => (
              <div key={tab.id} className='mb-2'>
                <div
                  onClick={() => setActiveTab(tab.id)}
                  className={`d-flex align-items-center p-3 rounded-2 cursor-pointer ${activeTab === tab.id ? 'bg-white shadow-sm' : 'bg-hover-light-primary'}`}
                  style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <i className={`ki-duotone ${tab.icon} fs-2 me-3 ${activeTab === tab.id ? 'text-primary' : 'text-gray-500'}`}>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  <span className={`fw-semibold fs-6 flex-grow-1 ${activeTab === tab.id ? 'text-primary' : 'text-gray-700'}`}>{tab.label}</span>
                  {tab.done === true && <i className='ki-duotone ki-check-circle fs-4 text-success'><span className='path1'></span><span className='path2'></span></i>}
                  {tab.done === false && <i className='ki-duotone ki-cross-circle fs-4 text-danger'><span className='path1'></span><span className='path2'></span></i>}
                </div>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className='flex-grow-1 p-8' style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {manageError && <Alert variant='danger' dismissible onClose={() => setManageError(null)}>{manageError}</Alert>}
            {manageSuccess && <Alert variant='success' dismissible onClose={() => setManageSuccess(null)}>{manageSuccess}</Alert>}

            {/* ─ Profile Tab ─ */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <h4 className='fw-bold mb-6'>Personal Profile</h4>
                <div className='row g-4 mb-8'>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Date of Birth</label><input type='date' className='form-control form-control-solid' value={profileForm.dob} onChange={e => setProfileForm(s => ({ ...s, dob: e.target.value }))} /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Gender</label><select className='form-select form-select-solid' value={profileForm.gender} onChange={e => setProfileForm(s => ({ ...s, gender: e.target.value }))}>{GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}</select></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Blood Group</label><select className='form-select form-select-solid' value={profileForm.blood_group} onChange={e => setProfileForm(s => ({ ...s, blood_group: e.target.value }))}>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}</select></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Marital Status</label><select className='form-select form-select-solid' value={profileForm.marital_status} onChange={e => setProfileForm(s => ({ ...s, marital_status: e.target.value }))}>{MARITAL_STATUSES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}</select></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Religion</label><input className='form-control form-control-solid' value={profileForm.religion} onChange={e => setProfileForm(s => ({ ...s, religion: e.target.value }))} /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Category</label><select className='form-select form-select-solid' value={profileForm.category} onChange={e => setProfileForm(s => ({ ...s, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Father Name</label><input className='form-control form-control-solid' value={profileForm.father_name} onChange={e => setProfileForm(s => ({ ...s, father_name: e.target.value }))} /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Mother Name</label><input className='form-control form-control-solid' value={profileForm.mother_name} onChange={e => setProfileForm(s => ({ ...s, mother_name: e.target.value }))} /></div>
                  <div className='col-md-4'><label className='fw-semibold fs-6 mb-1'>Spouse Name</label><input className='form-control form-control-solid' value={profileForm.spouse_name} onChange={e => setProfileForm(s => ({ ...s, spouse_name: e.target.value }))} /></div>
                  <div className='col-12'><label className='fw-semibold fs-6 mb-1'>Highest Qualification</label><input className='form-control form-control-solid' placeholder='e.g. M.Sc Mathematics' value={profileForm.highest_qualification} onChange={e => setProfileForm(s => ({ ...s, highest_qualification: e.target.value }))} /></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-1'>Present Address</label><textarea className='form-control form-control-solid' rows={2} value={profileForm.present_address} onChange={e => setProfileForm(s => ({ ...s, present_address: e.target.value }))}></textarea></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-1'>Permanent Address</label><textarea className='form-control form-control-solid' rows={2} value={profileForm.permanent_address} onChange={e => setProfileForm(s => ({ ...s, permanent_address: e.target.value }))}></textarea></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-1'>Emergency Contact Name</label><input className='form-control form-control-solid' value={profileForm.emergency_contact_name} onChange={e => setProfileForm(s => ({ ...s, emergency_contact_name: e.target.value }))} /></div>
                  <div className='col-md-6'><label className='fw-semibold fs-6 mb-1'>Emergency Contact Phone</label><input className='form-control form-control-solid' value={profileForm.emergency_contact_phone} onChange={e => setProfileForm(s => ({ ...s, emergency_contact_phone: e.target.value }))} /></div>
                </div>
                <div className='text-end'><Button variant='primary' type='submit' disabled={manageSaving}>{manageSaving ? 'Saving...' : 'Save Profile'}</Button></div>
              </form>
            )}

            {/* ─ Bank Tab ─ */}
            {activeTab === 'bank' && (
              <form onSubmit={handleSaveBank}>
                <h4 className='fw-bold mb-6'>Bank Details</h4>
                <div className='row g-4 mb-8'>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>Bank Name</label><input className='form-control form-control-solid' placeholder='e.g. State Bank of India' value={bankForm.bank_name} onChange={e => setBankForm(s => ({ ...s, bank_name: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>Account Holder Name</label><input className='form-control form-control-solid' value={bankForm.account_holder_name} onChange={e => setBankForm(s => ({ ...s, account_holder_name: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>Account Number</label><input className='form-control form-control-solid' placeholder='Account number' value={bankForm.account_number} onChange={e => setBankForm(s => ({ ...s, account_number: e.target.value }))} required /></div>
                  <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>IFSC Code</label><input className='form-control form-control-solid' placeholder='e.g. SBIN0001234' value={bankForm.ifsc_code} onChange={e => setBankForm(s => ({ ...s, ifsc_code: e.target.value.toUpperCase() }))} required /></div>
                  <div className='col-12'><label className='fw-semibold fs-6 mb-1'>Branch Name</label><input className='form-control form-control-solid' placeholder='e.g. Main Branch, Delhi' value={bankForm.branch_name} onChange={e => setBankForm(s => ({ ...s, branch_name: e.target.value }))} /></div>
                </div>
                <div className='text-end'><Button variant='primary' type='submit' disabled={manageSaving}>{manageSaving ? 'Saving...' : 'Save Bank Details'}</Button></div>
              </form>
            )}

            {/* ─ Experience Tab ─ */}
            {activeTab === 'experience' && (
              <div>
                <h4 className='fw-bold mb-6'>Work Experience</h4>
                {/* Existing experience list */}
                {experiences.length > 0 && (
                  <div className='mb-6'>
                    {experiences.map((exp, i) => (
                      <div key={exp.id || i} className='card card-bordered mb-3 bg-light-primary'>
                        <div className='card-body py-4 px-5'>
                          <div className='d-flex justify-content-between align-items-start'>
                            <div>
                              <div className='fw-bolder text-gray-800'>{exp.school_name}</div>
                              <div className='text-primary fw-semibold fs-7'>{exp.designation}</div>
                              <div className='text-muted fs-8 mt-1'>
                                {exp.from_date?.split('T')[0]} → {exp.is_current ? 'Present' : (exp.to_date?.split('T')[0] || '—')}
                              </div>
                              {exp.reason_for_leaving && <div className='text-muted fs-8'>Reason: {exp.reason_for_leaving}</div>}
                            </div>
                            {exp.is_current && <span className='badge badge-light-success'>Current</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add new experience form */}
                <div className='separator separator-dashed my-5'></div>
                <h6 className='fw-bold text-gray-700 mb-4'>Add New Experience</h6>
                <form onSubmit={handleAddExperience}>
                  <div className='row g-4 mb-6'>
                    <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>School / Institution</label><input className='form-control form-control-solid' placeholder='School name' value={expForm.school_name} onChange={e => setExpForm(s => ({ ...s, school_name: e.target.value }))} required /></div>
                    <div className='col-md-6'><label className='required fw-semibold fs-6 mb-1'>Designation</label><input className='form-control form-control-solid' placeholder='e.g. Senior Math Teacher' value={expForm.designation} onChange={e => setExpForm(s => ({ ...s, designation: e.target.value }))} required /></div>
                    <div className='col-md-4'><label className='required fw-semibold fs-6 mb-1'>From Date</label><input type='date' className='form-control form-control-solid' value={expForm.from_date} onChange={e => setExpForm(s => ({ ...s, from_date: e.target.value }))} required /></div>
                    <div className='col-md-4'>
                      <label className='fw-semibold fs-6 mb-1'>To Date</label>
                      <input type='date' className='form-control form-control-solid' value={expForm.to_date} onChange={e => setExpForm(s => ({ ...s, to_date: e.target.value }))} disabled={expForm.is_current} />
                    </div>
                    <div className='col-md-4 d-flex align-items-end pb-2'>
                      <div className='form-check form-switch form-check-custom form-check-solid ms-2'>
                        <input className='form-check-input' type='checkbox' checked={expForm.is_current} onChange={e => setExpForm(s => ({ ...s, is_current: e.target.checked, to_date: e.target.checked ? '' : s.to_date }))} />
                        <label className='form-check-label fw-semibold ms-2'>Currently Working Here</label>
                      </div>
                    </div>
                    <div className='col-12'><label className='fw-semibold fs-6 mb-1'>Reason for Leaving</label><input className='form-control form-control-solid' placeholder='Optional' value={expForm.reason_for_leaving} onChange={e => setExpForm(s => ({ ...s, reason_for_leaving: e.target.value }))} /></div>
                  </div>
                  <div className='text-end'><Button variant='success' type='submit' disabled={manageSaving}>{manageSaving ? 'Adding...' : 'Add Experience'}</Button></div>
                </form>
              </div>
            )}

            {/* ─ Documents Tab ─ */}
            {activeTab === 'documents' && (
              <div>
                <h4 className='fw-bold mb-6'>Documents</h4>
                <div className='row g-3 mb-6 align-items-end'>
                  <div className='col-md-4'>
                    <label className='required fw-semibold fs-6 mb-1'>Document Type</label>
                    <input className='form-control form-control-solid' placeholder='e.g. Aadhar Card, Degree' value={docForm.document_type} onChange={e => setDocForm(d => ({ ...d, document_type: e.target.value }))} />
                  </div>
                  <div className='col-md-6'>
                    <label className='required fw-semibold fs-6 mb-1'>File Path</label>
                    <input className='form-control form-control-solid' placeholder='/uploads/teachers/file.pdf' value={docForm.file_path} onChange={e => setDocForm(d => ({ ...d, file_path: e.target.value }))} />
                  </div>
                  <div className='col-md-2'>
                    <Button variant='light-success' className='w-100' onClick={handleAddDocument} disabled={manageSaving || !docForm.document_type.trim() || !docForm.file_path.trim()}>
                      <i className='ki-duotone ki-plus fs-3'></i> Add
                    </Button>
                  </div>
                </div>
                <div className='table-responsive'>
                  <table className='table table-row-dashed fs-7 gy-3 align-middle'>
                    <thead>
                      <tr className='text-gray-400 fw-bold fs-7 text-uppercase'>
                        <th>#</th><th>Type</th><th>File</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 && (
                        <tr><td colSpan={4} className='text-center text-muted py-6'>No documents uploaded yet.</td></tr>
                      )}
                      {documents.map((doc, i) => (
                        <tr key={doc.id || i}>
                          <td className='text-muted'>{i + 1}</td>
                          <td><span className='badge badge-light-primary fw-bold'>{doc.document_type}</span></td>
                          <td>
                            <a href={doc.file_path} target='_blank' rel='noreferrer' className='text-primary fw-semibold fs-7'>
                              <i className='ki-duotone ki-file fs-5 me-1'><span className='path1'></span><span className='path2'></span></i>
                              View File
                            </a>
                          </td>
                          <td>
                            <span className={`badge badge-light-${doc.verification_status === 'Verified' ? 'success' : doc.verification_status === 'Rejected' ? 'danger' : 'warning'}`}>
                              {doc.verification_status}
                            </span>
                          </td>
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

const TeachersWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Staff', path: '/staff/teachers', isActive: false }, { title: 'Teachers', path: '/staff/teachers', isActive: true }]}>
      All Teachers
    </PageTitle>
    <TeachersPage />
  </>
)

export { TeachersWrapper }
