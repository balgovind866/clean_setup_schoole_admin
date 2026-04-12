import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClasses, getClassSubjects, assignSubjectToClass, removeSubjectFromClass,
  getClassSections, assignClassTeacher,
} from './core/_requests'
import {
  SubjectModel, SubjectCreationData, ClassSubjectMappingModel
} from './core/_models'
import { getTeachers } from '../teachers/core/_requests'
import { TeacherModel } from '../teachers/core/_models'

type PageTab = 'subjects' | 'mapping' | 'classteacher'

const SUBJECT_TYPES = ['theory', 'practical', 'both'] as const
const SUBJECT_CATEGORIES = ['compulsory', 'elective'] as const

// ─── Badge helpers ─────────────────────────────────────────────────────────
const TypeBadge: FC<{ type: string }> = ({ type }) => (
  <span className='badge badge-light-primary fw-semibold'>{type}</span>
)
const CatBadge: FC<{ cat: string }> = ({ cat }) => (
  <span className='badge badge-light fw-semibold text-gray-700'>{cat}</span>
)

const SubjectsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<PageTab>('subjects')

  // ─── Subjects state ─────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectModel[]>([])
  const [loadingSubj, setLoadingSubj] = useState(false)
  const [subjSearch, setSubjSearch] = useState('')
  const [subjError, setSubjError] = useState<string | null>(null)
  const [subjSuccess, setSubjSuccess] = useState<string | null>(null)
  const [showSubjModal, setShowSubjModal] = useState(false)
  const [editingSubj, setEditingSubj] = useState<SubjectModel | null>(null)
  const [savingSubj, setSavingSubj] = useState(false)
  const [subjForm, setSubjForm] = useState<SubjectCreationData>({
    name: '', code: '', type: 'theory', category: 'compulsory', description: ''
  })

  // ─── Class-Subject Mapping state ────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [classSubjects, setClassSubjects] = useState<ClassSubjectMappingModel[]>([])
  const [loadingMapping, setLoadingMapping] = useState(false)
  const [mappingError, setMappingError] = useState<string | null>(null)
  const [mappingSuccess, setMappingSuccess] = useState<string | null>(null)
  const [assignSubjId, setAssignSubjId] = useState<number>(0)
  const [isCompulsory, setIsCompulsory] = useState(true)
  const [assigningSubj, setAssigningSubj] = useState(false)

  // ─── Class Teacher Assignment state ─────────────────────────────────────
  const [ctClasses, setCtClasses] = useState<any[]>([])
  const [ctClassId, setCtClassId] = useState<number | null>(null)
  const [ctSections, setCtSections] = useState<any[]>([])
  const [ctSectionId, setCtSectionId] = useState<number | null>(null)
  const [teachers, setTeachers] = useState<TeacherModel[]>([])
  const [ctTeacherId, setCtTeacherId] = useState<number | null>(null)
  const [assigningCT, setAssigningCT] = useState(false)
  const [ctError, setCtError] = useState<string | null>(null)
  const [ctSuccess, setCtSuccess] = useState<string | null>(null)

  // ─── Fetch helpers ────────────────────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    if (!schoolId) return
    setLoadingSubj(true); setSubjError(null)
    try {
      const { data } = await getSubjects(schoolId)
      if (data.success) setSubjects(data.data.subjects || [])
    } catch (e: any) { setSubjError(e.response?.data?.message || 'Failed to load subjects') }
    finally { setLoadingSubj(false) }
  }, [schoolId])

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return
    try {
      const { data } = await getClasses(schoolId)
      const list = data.data?.classes || (data.data as any)?.data || []
      setClasses(list)
      setCtClasses(list)
    } catch { }
  }, [schoolId])

  const fetchTeachers = useCallback(async () => {
    if (!schoolId) return
    try {
      const { data } = await getTeachers(schoolId, { limit: 200 })
      setTeachers(data.data.teachers || [])
    } catch { }
  }, [schoolId])

  useEffect(() => {
    fetchSubjects()
    fetchClasses()
    fetchTeachers()
  }, [fetchSubjects, fetchClasses, fetchTeachers])

  // fetch sections when class changes for class-teacher tab
  useEffect(() => {
    if (!ctClassId || !schoolId) { setCtSections([]); return }
    getClassSections(schoolId, ctClassId)
      .then(r => {
        const list = (r.data.data as any)?.sections || (r.data.data as any)?.mappings || []
        setCtSections(list)
      })
      .catch(() => setCtSections([]))
  }, [ctClassId, schoolId])

  // fetch class subjects when class changes in mapping tab
  const fetchClassSubjects = useCallback(async (classId: number) => {
    if (!schoolId) return
    setLoadingMapping(true)
    try {
      const { data } = await getClassSubjects(schoolId, classId)
      setClassSubjects(data.data.subjects || [])
    } catch { setClassSubjects([]) }
    finally { setLoadingMapping(false) }
  }, [schoolId])

  const handleSelectClass = (classId: number) => {
    setSelectedClassId(classId)
    fetchClassSubjects(classId)
  }

  // ─── Subject CRUD ────────────────────────────────────────────────────────
  const openCreateSubj = () => {
    setEditingSubj(null)
    setSubjForm({ name: '', code: '', type: 'theory', category: 'compulsory', description: '' })
    setShowSubjModal(true)
  }

  const openEditSubj = (s: SubjectModel) => {
    setEditingSubj(s)
    setSubjForm({ name: s.name, code: s.code, type: s.type, category: s.category, description: s.description || '' })
    setShowSubjModal(true)
  }

  const handleSaveSubj = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSubj(true); setSubjError(null)
    try {
      if (editingSubj) {
        await updateSubject(schoolId, editingSubj.id, subjForm)
      } else {
        await createSubject(schoolId, subjForm)
      }
      setShowSubjModal(false)
      setSubjSuccess(editingSubj ? 'Subject updated!' : 'Subject created!')
      setTimeout(() => setSubjSuccess(null), 3000)
      fetchSubjects()
    } catch (e: any) { setSubjError(e.response?.data?.message || 'Failed to save subject') }
    finally { setSavingSubj(false) }
  }

  const handleDeleteSubj = async (id: number) => {
    if (!window.confirm('Delete this subject?')) return
    try {
      await deleteSubject(schoolId, id)
      setSubjSuccess('Subject deleted!')
      setTimeout(() => setSubjSuccess(null), 2000)
      fetchSubjects()
      if (selectedClassId) fetchClassSubjects(selectedClassId)
    } catch (e: any) { setSubjError(e.response?.data?.message || 'Failed to delete') }
  }

  // ─── Class-Subject Assign ─────────────────────────────────────────────────
  const handleAssignSubject = async () => {
    if (!selectedClassId || !assignSubjId) return
    setAssigningSubj(true); setMappingError(null)
    try {
      await assignSubjectToClass(schoolId, selectedClassId, { subject_id: assignSubjId, is_compulsory: isCompulsory })
      fetchClassSubjects(selectedClassId)
      setAssignSubjId(0)
      setMappingSuccess('Subject assigned to class!')
      setTimeout(() => setMappingSuccess(null), 3000)
    } catch (e: any) { setMappingError(e.response?.data?.message || 'Failed to assign subject') }
    finally { setAssigningSubj(false) }
  }

  const handleRemoveClassSubject = async (mappingId: number, subjectId: number) => {
    if (!selectedClassId) return
    try {
      await removeSubjectFromClass(schoolId, selectedClassId, subjectId)
      fetchClassSubjects(selectedClassId)
      setMappingSuccess('Subject removed!')
      setTimeout(() => setMappingSuccess(null), 2000)
    } catch (e: any) { setMappingError(e.response?.data?.message || 'Failed to remove') }
  }

  // ─── Class Teacher Assign ─────────────────────────────────────────────────
  const handleAssignClassTeacher = async () => {
    if (!ctClassId || !ctSectionId || !ctTeacherId) {
      setCtError('Please select class, section and teacher.'); return
    }
    setAssigningCT(true); setCtError(null)
    try {
      await assignClassTeacher(schoolId, ctClassId, { section_id: ctSectionId, teacher_id: ctTeacherId })
      setCtSuccess('Class teacher assigned successfully!')
      setTimeout(() => setCtSuccess(null), 3000)
      // ── Re-fetch sections so table reflects updated class_teacher_id immediately ──
      setCtSectionId(null); setCtTeacherId(null)
      getClassSections(schoolId, ctClassId)
        .then(r => {
          const list = (r.data.data as any)?.sections || (r.data.data as any)?.mappings || []
          setCtSections(list)
        })
        .catch(() => { })
    } catch (e: any) { setCtError(e.response?.data?.message || 'Failed to assign') }
    finally { setAssigningCT(false) }
  }

  // ─── Filtered subjects for list ──────────────────────────────────────────
  const filteredSubjects = subjects.filter(s =>
    `${s.name} ${s.code}`.toLowerCase().includes(subjSearch.toLowerCase())
  )

  // Subjects not yet in this class
  const alreadyAssignedIds = new Set(classSubjects.map(m => m.subject_id))
  const availableSubjects = subjects.filter(s => !alreadyAssignedIds.has(s.id) && s.is_active)

  const tabItems: { id: PageTab; label: string; icon: string }[] = [
    { id: 'subjects', label: 'Subject Master', icon: 'ki-book' },
    { id: 'mapping', label: 'Class–Subject Mapping', icon: 'ki-abstract-26' },

  ]

  return (
    <Content>
      {/* ── Tab Header ── */}
      <div className='card mb-6'>
        <div className='card-body pt-5 pb-0'>
          <ul className='nav nav-line-tabs nav-line-tabs-2x fw-semibold fs-6 border-0 gap-3'>
            {tabItems.map(tab => (
              <li className='nav-item' key={tab.id}>
                <a
                  className={`nav-link pb-4 ${activeTab === tab.id ? 'active text-primary' : 'text-gray-600'}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`ki-duotone ${tab.icon} fs-4 me-2`}>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ══════════════════ SUBJECT MASTER TAB ══════════════════ */}
      {activeTab === 'subjects' && (
        <>
          {subjError && <div className='alert alert-danger mb-5'>{subjError}</div>}
          {subjSuccess && <div className='alert alert-success mb-5'>{subjSuccess}</div>}

          <div className='card card-flush'>
            <div className='card-header align-items-center py-5 gap-3'>
              <div className='card-title flex-column'>
                <h3 className='fw-bold mb-0'>Subject Master</h3>
                <span className='text-muted fs-7'>{subjects.length} subjects registered</span>
              </div>
              <div className='card-toolbar gap-3'>
                <div className='d-flex align-items-center position-relative'>
                  <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  <input
                    className='form-control form-control-solid w-220px ps-14'
                    placeholder='Search subjects...'
                    value={subjSearch}
                    onChange={e => setSubjSearch(e.target.value)}
                  />
                </div>
                <button className='btn btn-primary' onClick={openCreateSubj}>
                  <i className='ki-duotone ki-plus fs-2'></i> New Subject
                </button>
              </div>
            </div>

            <div className='card-body pt-0'>
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-4'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th className='min-w-150px'>Subject Name</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {loadingSubj ? (
                      <tr><td colSpan={8} className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary'></span> Loading...
                      </td></tr>
                    ) : filteredSubjects.length === 0 ? (
                      <tr><td colSpan={8} className='text-center py-10 text-muted'>
                        No subjects found. Click "New Subject" to add one.
                      </td></tr>
                    ) : filteredSubjects.map((s, i) => (
                      <tr key={s.id}>
                        <td className='text-gray-400'>{i + 1}</td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-35px me-3'>
                              <div className='symbol-label bg-light-primary text-primary fw-bold fs-5'>
                                {s.name.charAt(0)}
                              </div>
                            </div>
                            <span className='fw-bold text-gray-800'>{s.name}</span>
                          </div>
                        </td>
                        <td><code className='text-primary fw-bold'>{s.code}</code></td>
                        <td><TypeBadge type={s.type} /></td>
                        <td><CatBadge cat={s.category} /></td>
                        <td className='text-muted fs-7 mw-200px text-truncate'>{s.description || '—'}</td>
                        <td>
                          <span className={`badge badge-light fw-semibold ${s.is_active ? 'text-success' : 'text-muted'}`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='text-end'>
                          <button className='btn btn-icon btn-sm btn-light-primary me-2' onClick={() => openEditSubj(s)} title='Edit'>
                            <i className='ki-duotone ki-pencil fs-4'><span className='path1'></span><span className='path2'></span></i>
                          </button>
                          <button className='btn btn-icon btn-sm btn-light-danger' onClick={() => handleDeleteSubj(s.id)} title='Delete'>
                            <i className='ki-duotone ki-trash fs-4'><span className='path1'></span><span className='path2'></span></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════ CLASS-SUBJECT MAPPING TAB ══════════════════ */}
      {activeTab === 'mapping' && (
        <>
          {mappingError && <div className='alert alert-danger mb-5'>{mappingError}</div>}
          {mappingSuccess && <div className='alert alert-success mb-5'>{mappingSuccess}</div>}

          <div className='row g-6'>
            {/* Left: Class selector */}
            <div className='col-md-4'>
              <div className='card card-flush h-100'>
                <div className='card-header'>
                  <h4 className='fw-bold'>Select Class</h4>
                </div>
                <div className='card-body px-3 py-4'>
                  {classes.length === 0
                    ? <div className='text-muted text-center py-6'>No classes found</div>
                    : classes.map((cls: any) => (
                      <div
                        key={cls.id}
                        onClick={() => handleSelectClass(cls.id)}
                        className={`d-flex align-items-center p-4 rounded-2 mb-2 cursor-pointer border ${selectedClassId === cls.id ? 'border-primary bg-light-primary' : 'border-gray-200 bg-hover-light'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`symbol symbol-35px me-3`}>
                          <div className={`symbol-label fw-bold ${selectedClassId === cls.id ? 'bg-primary text-white' : 'bg-light-primary text-primary'}`}>
                            {(cls.name || cls.class_name || 'C').charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className='fw-bold text-gray-800'>{cls.name || cls.class_name}</div>
                          {cls.numeric_name && <div className='text-muted fs-8'>Grade {cls.numeric_name}</div>}
                        </div>
                        {selectedClassId === cls.id && (
                          <i className='ki-duotone ki-check-circle fs-3 text-primary ms-auto'>
                            <span className='path1'></span><span className='path2'></span>
                          </i>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right: Assigned subjects + Add form */}
            <div className='col-md-8'>
              <div className='card card-flush'>
                <div className='card-header'>
                  <h4 className='fw-bold'>
                    {selectedClassId
                      ? `Subjects for ${classes.find(c => c.id === selectedClassId)?.name || 'Class'}`
                      : 'Select a class to manage subjects'}
                  </h4>
                </div>
                <div className='card-body'>
                  {!selectedClassId ? (
                    <div className='text-center text-muted py-10'>
                      <i className='ki-duotone ki-abstract-26 fs-3x text-gray-300 mb-3'><span className='path1'></span><span className='path2'></span></i>
                      <div>Click on a class to view and manage its subjects</div>
                    </div>
                  ) : (
                    <>
                      {/* Assign form */}
                      <div className='bg-light rounded-2 p-5 mb-6'>
                        <h6 className='fw-bold text-gray-700 mb-4'>Assign Subject to Class</h6>
                        <div className='row g-3 align-items-end'>
                          <div className='col-md-5'>
                            <label className='fw-semibold fs-6 mb-1'>Select Subject</label>
                            <select
                              className='form-select form-select-solid'
                              value={assignSubjId}
                              onChange={e => setAssignSubjId(Number(e.target.value))}
                            >
                              <option value={0}>— Choose Subject —</option>
                              {availableSubjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                              ))}
                            </select>
                          </div>
                          <div className='col-md-4'>
                            <label className='fw-semibold fs-6 mb-1'>Type</label>
                            <div className='form-check form-switch form-check-custom form-check-solid mt-2'>
                              <input
                                className='form-check-input'
                                type='checkbox'
                                checked={isCompulsory}
                                onChange={e => setIsCompulsory(e.target.checked)}
                              />
                              <label className='form-check-label fw-semibold ms-2'>
                                {isCompulsory ? 'Compulsory' : 'Elective'}
                              </label>
                            </div>
                          </div>
                          <div className='col-md-3'>
                            <button
                              className='btn btn-primary w-100'
                              onClick={handleAssignSubject}
                              disabled={!assignSubjId || assigningSubj}
                            >
                              {assigningSubj
                                ? <span className='spinner-border spinner-border-sm'></span>
                                : <><i className='ki-duotone ki-plus fs-3'></i> Assign</>}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Assigned subjects table */}
                      {loadingMapping ? (
                        <div className='text-center py-6'><span className='spinner-border spinner-border-sm text-primary'></span></div>
                      ) : classSubjects.length === 0 ? (
                        <div className='text-center text-muted py-8'>No subjects assigned to this class yet.</div>
                      ) : (
                        <div className='table-responsive'>
                          <table className='table table-row-dashed fs-6 gy-3 align-middle'>
                            <thead>
                              <tr className='text-gray-400 fw-bold fs-7 text-uppercase'>
                                <th>#</th><th>Subject</th><th>Code</th><th>Type</th><th>Assigned As</th><th className='text-end'>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classSubjects.map((m, i) => (
                                <tr key={m.id}>
                                  <td className='text-gray-400'>{i + 1}</td>
                                  <td className='fw-bold text-gray-800'>{m.subject?.name || '—'}</td>
                                  <td><code className='text-primary'>{m.subject?.code}</code></td>
                                  <td>{m.subject ? <TypeBadge type={m.subject.type} /> : '—'}</td>
                                  <td>
                                    <span className={`badge badge-light-${m.is_compulsory ? 'success' : 'warning'}`}>
                                      {m.is_compulsory ? 'Compulsory' : 'Elective'}
                                    </span>
                                  </td>
                                  <td className='text-end'>
                                    <button
                                      className='btn btn-sm btn-icon btn-light-danger'
                                      onClick={() => handleRemoveClassSubject(m.id, m.subject_id)}
                                      title='Remove'
                                    >
                                      <i className='ki-duotone ki-cross fs-3'><span className='path1'></span><span className='path2'></span></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════ CLASS TEACHER ASSIGNMENT TAB ══════════════════ */}
      {activeTab === 'classteacher' && (
        <>
          {ctError && <div className='alert alert-danger mb-5'>{ctError}</div>}
          {ctSuccess && <div className='alert alert-success mb-5'>{ctSuccess}</div>}

          <div className='row g-6'>
            {/* Left: Class selector */}
            <div className='col-md-4'>
              <div className='card card-flush h-100'>
                <div className='card-header'>
                  <h4 className='fw-bold'>Select Class</h4>
                </div>
                <div className='card-body px-3 py-4'>
                  {ctClasses.length === 0
                    ? <div className='text-muted text-center py-6'>No classes found</div>
                    : ctClasses.map((cls: any) => (
                      <div
                        key={cls.id}
                        onClick={() => { setCtClassId(cls.id); setCtSectionId(null); setCtTeacherId(null) }}
                        className={`d-flex align-items-center p-4 rounded-2 mb-2 cursor-pointer border ${ctClassId === cls.id ? 'border-primary bg-light-primary' : 'border-gray-200 bg-hover-light'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        <div className={`symbol symbol-35px me-3`}>
                          <div className={`symbol-label fw-bold ${ctClassId === cls.id ? 'bg-primary text-white' : 'bg-light-primary text-primary'}`}>
                            {(cls.name || cls.class_name || 'C').charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className='fw-bold text-gray-800 fs-5'>{cls.name || cls.class_name}</div>
                        </div>
                        {ctClassId === cls.id && (
                          <i className='ki-duotone ki-check-circle fs-3 text-primary ms-auto'>
                            <span className='path1'></span><span className='path2'></span>
                          </i>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right: Sections and Teachers Table */}
            <div className='col-md-8'>
              <div className='card card-flush h-100'>
                <div className='card-header align-items-center py-4 gap-2'>
                  <h4 className='fw-bold mb-0'>
                    {ctClassId
                      ? `Sections for ${ctClasses.find(c => c.id === ctClassId)?.name || 'Class'}`
                      : 'Select a class to assign teachers'}
                  </h4>
                  {ctClassId && (
                    <span className='badge badge-light-primary'>{ctSections.length} Sections</span>
                  )}
                </div>
                <div className='card-body pt-0'>
                  {!ctClassId ? (
                    <div className='text-center text-muted py-12'>
                      <i className='ki-duotone ki-teacher fs-4x text-gray-300 mb-4'><span className='path1'></span><span className='path2'></span></i>
                      <div className='fs-5'>Click on a class from the left menu to view and manage its class teachers.</div>
                    </div>
                  ) : (
                    <div className='table-responsive mt-3'>
                      <table className='table table-row-dashed fs-6 gy-4 align-middle'>
                        <thead>
                          <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0 border-bottom-2'>
                            <th className='w-125px'>Section</th>
                            <th className='min-w-200px'>Current Class Teacher</th>
                            <th className='text-end min-w-150px'>Actions</th>
                          </tr>
                        </thead>
                        <tbody className='fw-semibold text-gray-600'>
                          {ctSections.length === 0 ? (
                            <tr>
                              <td colSpan={3} className='text-center py-8 text-muted'>
                                No sections found for this class.
                              </td>
                            </tr>
                          ) : ctSections.map((sec: any) => {
                            const secId = sec.section_id || sec.id
                            const secName = sec.section?.name || sec.name || `Sec ${secId}`
                            const assignedTeacherId = sec.class_teacher_id
                            const assignedTeacher = teachers.find(t => t.id === assignedTeacherId)

                            const isEditing = ctSectionId === secId

                            return (
                              <tr key={secId} className={isEditing ? 'bg-light-primary rounded' : ''}>
                                <td>
                                  <span className='badge badge-lg badge-light fw-bold fs-6'>Section {secName}</span>
                                </td>
                                <td>
                                  {isEditing ? (
                                    <select
                                      className='form-select form-select-sm form-select-solid border-primary'
                                      value={ctTeacherId || ''}
                                      onChange={e => setCtTeacherId(Number(e.target.value))}
                                    >
                                      <option value=''>— Remove / Clear —</option>
                                      {teachers.filter(t => t.is_active).map(t => (
                                        <option key={t.id} value={t.id}>
                                          {t.name} {t.profession?.name ? `(${t.profession.name})` : ''}
                                        </option>
                                      ))}
                                    </select>
                                  ) : assignedTeacher ? (
                                    <div className='d-flex align-items-center'>
                                      <div className='symbol symbol-30px symbol-circle me-3'>
                                        <span className='symbol-label bg-light-success text-success fw-bold'>
                                          {assignedTeacher.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div className='d-flex flex-column'>
                                        <span className='fw-bold text-gray-800'>{assignedTeacher.name}</span>
                                        <span className='text-muted fs-8'>{assignedTeacher.email}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className='text-muted fst-italic'>
                                      <i className='ki-duotone ki-information fs-6 me-1'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i>
                                      Not assigned
                                    </span>
                                  )}
                                </td>
                                <td className='text-end'>
                                  {isEditing ? (
                                    <div className='d-flex justify-content-end gap-2'>
                                      <button
                                        className='btn btn-sm btn-icon btn-light'
                                        title='Cancel'
                                        onClick={() => { setCtSectionId(null); setCtTeacherId(null) }}
                                        disabled={assigningCT}
                                      >
                                        <i className='ki-duotone ki-cross fs-2'><span className='path1'></span><span className='path2'></span></i>
                                      </button>
                                      <button
                                        className='btn btn-sm btn-icon btn-primary'
                                        title='Save Assignment'
                                        onClick={handleAssignClassTeacher}
                                        disabled={assigningCT}
                                      >
                                        {assigningCT ? (
                                          <span className='spinner-border spinner-border-sm align-middle'></span>
                                        ) : (
                                          <i className='ki-duotone ki-check fs-2 text-white'><span className='path1'></span><span className='path2'></span></i>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      className={`btn btn-sm ${assignedTeacher ? 'btn-light-primary' : 'btn-primary'}`}
                                      onClick={() => {
                                        setCtSectionId(secId)
                                        setCtTeacherId(assignedTeacherId || null)
                                      }}
                                    >
                                      {assignedTeacher ? 'Change' : 'Assign'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Subject Create/Edit Modal ── */}
      <Modal show={showSubjModal} onHide={() => !savingSubj && setShowSubjModal(false)} centered backdrop='static'>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title>
            <i className='ki-duotone ki-book fs-2x text-primary me-2'><span className='path1'></span><span className='path2'></span></i>
            {editingSubj ? 'Edit Subject' : 'Create New Subject'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-8 pb-8 pt-4'>
          {subjError && <Alert variant='danger' dismissible onClose={() => setSubjError(null)}>{subjError}</Alert>}
          <form onSubmit={handleSaveSubj}>
            <div className='row g-4'>
              <div className='col-md-7 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Subject Name</label>
                <input
                  className='form-control form-control-solid'
                  placeholder='e.g. Mathematics'
                  value={subjForm.name}
                  onChange={e => setSubjForm(s => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div className='col-md-5 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Subject Code</label>
                <input
                  className='form-control form-control-solid'
                  placeholder='e.g. MATH101'
                  value={subjForm.code}
                  onChange={e => setSubjForm(s => ({ ...s, code: e.target.value.toUpperCase() }))}
                  required
                />
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Type</label>
                <select
                  className='form-select form-select-solid'
                  value={subjForm.type}
                  onChange={e => setSubjForm(s => ({ ...s, type: e.target.value as any }))}
                >
                  {SUBJECT_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-6 fv-row'>
                <label className='required fw-semibold fs-6 mb-1'>Category</label>
                <select
                  className='form-select form-select-solid'
                  value={subjForm.category}
                  onChange={e => setSubjForm(s => ({ ...s, category: e.target.value as any }))}
                >
                  {SUBJECT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className='col-12 fv-row'>
                <label className='fw-semibold fs-6 mb-1'>Description</label>
                <textarea
                  className='form-control form-control-solid'
                  rows={3}
                  placeholder='Brief description of the subject...'
                  value={subjForm.description}
                  onChange={e => setSubjForm(s => ({ ...s, description: e.target.value }))}
                ></textarea>
              </div>
            </div>
            <div className='d-flex justify-content-end pt-8'>
              <Button variant='light' onClick={() => setShowSubjModal(false)} className='me-3' disabled={savingSubj}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={savingSubj}>
                {savingSubj ? <span className='spinner-border spinner-border-sm'></span> : (editingSubj ? 'Update Subject' : 'Create Subject')}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </Content>
  )
}

const SubjectsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[
      { title: 'Academic', path: '/academic/subjects', isActive: false },
      { title: 'Subjects & Teacher Setup', path: '/academic/subjects', isActive: true }
    ]}>
      Subjects & Teacher Setup
    </PageTitle>
    <SubjectsPage />
  </>
)

export { SubjectsWrapper }
