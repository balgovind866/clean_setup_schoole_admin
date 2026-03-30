import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  getClasses, createClass, updateClass, deleteClass,
  getSections, createSection, updateSection, deleteSection,
  getClassSections, assignSectionToClass, removeSectionFromClass,
} from './core/_requests'
import { ClassModel, SectionModel, ClassSectionMappingModel } from './core/_models'

// ─── Reusable Empty State ────────────────────────────────────────────────────
const EmptyState: FC<{ message: string; icon: string }> = ({ message, icon }) => (
  <tr>
    <td colSpan={10} className='text-center py-12'>
      <div className='d-flex flex-column align-items-center'>
        <i className={`${icon} fs-3x text-gray-300 mb-3`}></i>
        <span className='text-gray-500 fs-6'>{message}</span>
      </div>
    </td>
  </tr>
)

const LoadingRow: FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    <td colSpan={cols} className='text-center py-10'>
      <span className='spinner-border spinner-border-sm text-primary me-2' role='status'></span>
      Loading...
    </td>
  </tr>
)

// ─── CLASSES TAB ─────────────────────────────────────────────────────────────
const ClassesTab: FC<{ schoolId: string }> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', numeric_value: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await getClasses(schoolId)
      if (data.success) setClasses(data.data.classes || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  const openModal = (cls?: ClassModel) => {
    setError(null)
    if (cls) {
      setIsEdit(true)
      setEditId(cls.id)
      setForm({ name: cls.name, numeric_value: String(cls.numeric_value) })
    } else {
      setIsEdit(false)
      setEditId(null)
      setForm({ name: '', numeric_value: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { name: form.name, numeric_value: Number(form.numeric_value) }
      if (isEdit && editId) {
        await updateClass(schoolId, editId, payload)
      } else {
        await createClass(schoolId, payload)
      }
      setShowModal(false)
      fetchClasses()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return
    setLoading(true)
    try {
      await deleteClass(schoolId, id)
      fetchClasses()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete class')
      setLoading(false)
    }
  }

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {error && !showModal && <div className='alert alert-danger d-flex align-items-center mb-5'><i className='ki-duotone ki-information fs-4 me-2'></i>{error}</div>}

      <div className='card card-flush'>
        {/* Header */}
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                <span className='path1'></span><span className='path2'></span>
              </i>
              <input
                type='text'
                className='form-control form-control-solid w-250px ps-14'
                placeholder='Search classes...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className='card-toolbar'>
            <button className='btn btn-primary' onClick={() => openModal()}>
              <i className='ki-duotone ki-plus fs-2'></i> Add Class
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='card-body pt-0'>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5'>
              <thead>
                <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                  <th className='w-10px pe-2'>#</th>
                  <th>Class Name</th>
                  <th>Numeric Value</th>
                  <th>Created At</th>
                  <th className='text-end min-w-100px'>Actions</th>
                </tr>
              </thead>
              <tbody className='fw-semibold text-gray-600'>
                {loading ? <LoadingRow cols={5} /> : filtered.length === 0 ? (
                  <EmptyState message='No classes found. Click "Add Class" to create one.' icon='ki-duotone ki-abstract-26' />
                ) : filtered.map((cls, idx) => (
                  <tr key={cls.id}>
                    <td><span className='text-gray-500'>{idx + 1}</span></td>
                    <td>
                      <div className='d-flex align-items-center'>
                        <div className='symbol symbol-40px me-3'>
                          <div className='symbol-label fs-2 fw-bold text-primary bg-light-primary'>
                            {cls.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <span className='text-gray-800 fw-bold'>{cls.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className='badge badge-light-primary fw-bold fs-7 px-4 py-3'>
                        Grade {cls.numeric_value}
                      </span>
                    </td>
                    <td className='text-muted'>
                      {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className='text-end'>
                      <button
                        className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                        title='Edit'
                        onClick={() => openModal(cls)}
                      >
                        <i className='ki-duotone ki-pencil fs-2'><span className='path1'></span><span className='path2'></span></i>
                      </button>
                      <button
                        className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                        title='Delete'
                        onClick={() => handleDelete(cls.id)}
                      >
                        <i className='ki-duotone ki-trash fs-2'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} size='lg' centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Edit Class' : 'Add New Class'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-8 px-lg-15'>
          {error && <Alert variant='danger' className='mb-5'>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className='row g-6 mb-6'>
              <div className='col-md-8 fv-row'>
                <label className='required fw-semibold fs-6 mb-2'>Class Name</label>
                <input
                  type='text'
                  className='form-control form-control-solid'
                  placeholder='e.g. Grade 10'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className='form-text text-muted'>Enter a descriptive name for the class</div>
              </div>
              <div className='col-md-4 fv-row'>
                <label className='required fw-semibold fs-6 mb-2'>Numeric Value</label>
                <input
                  type='number'
                  min={1}
                  max={20}
                  className='form-control form-control-solid'
                  placeholder='e.g. 10'
                  value={form.numeric_value}
                  onChange={e => setForm({ ...form, numeric_value: e.target.value })}
                  required
                />
                <div className='form-text text-muted'>Used for ordering classes</div>
              </div>
            </div>
            <div className='text-end pt-3'>
              <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={saving}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={saving}>
                {saving ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</> : isEdit ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )
}

// ─── SECTIONS TAB ────────────────────────────────────────────────────────────
const SectionsTab: FC<{ schoolId: string }> = ({ schoolId }) => {
  const [sections, setSections] = useState<SectionModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchSections = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await getSections(schoolId)
      if (data.success) setSections(data.data.sections || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => { fetchSections() }, [fetchSections])

  const openModal = (sec?: SectionModel) => {
    setError(null)
    if (sec) { setIsEdit(true); setEditId(sec.id); setName(sec.name) }
    else { setIsEdit(false); setEditId(null); setName('') }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit && editId) await updateSection(schoolId, editId, { name })
      else await createSection(schoolId, { name })
      setShowModal(false)
      fetchSections()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return
    setLoading(true)
    try {
      await deleteSection(schoolId, id)
      fetchSections()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete section')
      setLoading(false)
    }
  }

  const filtered = sections.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const SECTION_COLORS = ['primary', 'success', 'info', 'warning', 'danger', 'dark']

  return (
    <>
      {error && !showModal && <div className='alert alert-danger d-flex align-items-center mb-5'><i className='ki-duotone ki-information fs-4 me-2'></i>{error}</div>}

      <div className='card card-flush'>
        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
          <div className='card-title'>
            <div className='d-flex align-items-center position-relative my-1'>
              <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'><span className='path1'></span><span className='path2'></span></i>
              <input type='text' className='form-control form-control-solid w-250px ps-14' placeholder='Search sections...' value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className='card-toolbar'>
            <button className='btn btn-primary' onClick={() => openModal()}>
              <i className='ki-duotone ki-plus fs-2'></i> Add Section
            </button>
          </div>
        </div>

        <div className='card-body pt-0'>
          <div className='table-responsive'>
            <table className='table align-middle table-row-dashed fs-6 gy-5'>
              <thead>
                <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                  <th>#</th>
                  <th>Section Name</th>
                  <th>Label</th>
                  <th>Created At</th>
                  <th className='text-end'>Actions</th>
                </tr>
              </thead>
              <tbody className='fw-semibold text-gray-600'>
                {loading ? <LoadingRow cols={5} /> : filtered.length === 0 ? (
                  <EmptyState message='No sections found. Click "Add Section" to create one.' icon='ki-duotone ki-tablet-book' />
                ) : filtered.map((sec, idx) => (
                  <tr key={sec.id}>
                    <td><span className='text-gray-500'>{idx + 1}</span></td>
                    <td>
                      <div className='d-flex align-items-center'>
                        <div className='symbol symbol-40px me-3'>
                          <div className={`symbol-label fs-2 fw-bold text-${SECTION_COLORS[idx % SECTION_COLORS.length]} bg-light-${SECTION_COLORS[idx % SECTION_COLORS.length]}`}>
                            {sec.name.toUpperCase()}
                          </div>
                        </div>
                        <span className='text-gray-800 fw-bold fs-5'>Section {sec.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-light-${SECTION_COLORS[idx % SECTION_COLORS.length]} fw-bold px-4 py-3`}>
                        {sec.name}
                      </span>
                    </td>
                    <td className='text-muted'>
                      {sec.createdAt ? new Date(sec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className='text-end'>
                      <button className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1' title='Edit' onClick={() => openModal(sec)}>
                        <i className='ki-duotone ki-pencil fs-2'><span className='path1'></span><span className='path2'></span></i>
                      </button>
                      <button className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm' title='Delete' onClick={() => handleDelete(sec.id)}>
                        <i className='ki-duotone ki-trash fs-2'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Edit Section' : 'Add New Section'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-8 px-lg-15'>
          {error && <Alert variant='danger'>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className='mb-6'>
              <label className='required fw-semibold fs-6 mb-2'>Section Name</label>
              <input type='text' className='form-control form-control-solid' placeholder='e.g. A' value={name} onChange={e => setName(e.target.value)} required maxLength={10} />
              <div className='form-text text-muted'>Typically a single letter like A, B, C or A+</div>
            </div>
            <div className='text-end pt-3'>
              <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={saving}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={saving}>
                {saving ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</> : isEdit ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )
}

// ─── CLASS-SECTION MAPPING TAB ───────────────────────────────────────────────
const MappingTab: FC<{ schoolId: string }> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [sections, setSections] = useState<SectionModel[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassModel | null>(null)
  const [mappings, setMappings] = useState<ClassSectionMappingModel[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ section_id: '', capacity: '40' })
  const [saving, setSaving] = useState(false)

  // Excluded section IDs (already assigned to the selected class)
  const assignedSectionIds = mappings.map(m => m.section_id)
  const availableSections = sections.filter(s => !assignedSectionIds.includes(s.id))

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return
    setLoadingClasses(true)
    try {
      const { data } = await getClasses(schoolId)
      if (data.success) setClasses(data.data.classes || [])
    } catch { } finally {
      setLoadingClasses(false)
    }
  }, [schoolId])

  const fetchSections = useCallback(async () => {
    if (!schoolId) return
    try {
      const { data } = await getSections(schoolId)
      if (data.success) setSections(data.data.sections || [])
    } catch { }
  }, [schoolId])

  const fetchMappings = useCallback(async (cls: ClassModel) => {
    setLoadingMappings(true)
    setError(null)
    setMappings([])
    try {
      const { data } = await getClassSections(schoolId, cls.id)
      if (data.success) setMappings(data.data.sections || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sections for this class')
    } finally {
      setLoadingMappings(false)
    }
  }, [schoolId])

  useEffect(() => { fetchClasses(); fetchSections() }, [fetchClasses, fetchSections])

  const handleSelectClass = (cls: ClassModel) => {
    setSelectedClass(cls)
    fetchMappings(cls)
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return
    setSaving(true)
    setError(null)
    try {
      await assignSectionToClass(schoolId, selectedClass.id, {
        section_id: Number(assignForm.section_id),
        capacity: Number(assignForm.capacity),
      })
      setShowAssignModal(false)
      setAssignForm({ section_id: '', capacity: '40' })
      fetchMappings(selectedClass)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign section')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (sectionMappingId: number) => {
    if (!selectedClass) return
    if (!window.confirm('Remove this section from the class?')) return
    setLoadingMappings(true)
    try {
      await removeSectionFromClass(schoolId, selectedClass.id, sectionMappingId)
      fetchMappings(selectedClass)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove section')
      setLoadingMappings(false)
    }
  }

  return (
    <>
      {error && <div className='alert alert-danger d-flex align-items-center mb-5'><i className='ki-duotone ki-information fs-4 me-2'></i>{error}</div>}

      <div className='row g-5'>
        {/* Left: Class List */}
        <div className='col-md-4'>
          <div className='card card-flush h-100'>
            <div className='card-header py-5'>
              <h4 className='card-title fw-bold m-0'>
                <i className='ki-duotone ki-abstract-26 fs-3 me-2 text-primary'><span className='path1'></span><span className='path2'></span></i>
                Select a Class
              </h4>
            </div>
            <div className='card-body pt-2 px-3'>
              {loadingClasses ? (
                <div className='text-center py-8'><span className='spinner-border spinner-border-sm text-primary'></span></div>
              ) : classes.length === 0 ? (
                <div className='text-center text-muted py-8 fs-6'>No classes available. Please create classes first.</div>
              ) : classes.map(cls => (
                <div
                  key={cls.id}
                  className={`d-flex align-items-center p-4 rounded-2 mb-2 cursor-pointer transition-all ${selectedClass?.id === cls.id ? 'bg-primary text-white' : 'bg-light-primary text-gray-700 hover-bg-primary'}`}
                  onClick={() => handleSelectClass(cls)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div className={`symbol symbol-35px me-3 ${selectedClass?.id === cls.id ? '' : ''}`}>
                    <div className={`symbol-label fw-bold fs-6 ${selectedClass?.id === cls.id ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                      {cls.numeric_value}
                    </div>
                  </div>
                  <div>
                    <div className='fw-bold fs-6'>{cls.name}</div>
                    <div className={`fs-8 ${selectedClass?.id === cls.id ? 'text-white opacity-75' : 'text-muted'}`}>Grade {cls.numeric_value}</div>
                  </div>
                  {selectedClass?.id === cls.id && (
                    <i className='ki-duotone ki-arrow-right fs-5 ms-auto text-white'><span className='path1'></span><span className='path2'></span></i>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Mappings */}
        <div className='col-md-8'>
          <div className='card card-flush h-100'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <h4 className='fw-bold m-0'>
                  {selectedClass ? (
                    <><i className='ki-duotone ki-grid-2 fs-3 me-2 text-primary'><span className='path1'></span><span className='path2'></span></i>Sections in {selectedClass.name}</>
                  ) : 'Sections Assignment'}
                </h4>
              </div>
              {selectedClass && (
                <div className='card-toolbar'>
                  <button
                    className='btn btn-primary btn-sm'
                    onClick={() => { setError(null); setAssignForm({ section_id: '', capacity: '40' }); setShowAssignModal(true) }}
                    disabled={availableSections.length === 0}
                    title={availableSections.length === 0 ? 'All sections are already assigned' : ''}
                  >
                    <i className='ki-duotone ki-plus fs-3'></i> Assign Section
                  </button>
                </div>
              )}
            </div>
            <div className='card-body pt-0'>
              {!selectedClass ? (
                <div className='text-center py-15'>
                  <i className='ki-duotone ki-left fs-3x text-gray-200 mb-4'><span className='path1'></span><span className='path2'></span></i>
                  <p className='text-muted fs-6'>← Select a class from the left panel to manage its sections</p>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table align-middle table-row-dashed fs-6 gy-4'>
                    <thead>
                      <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                        <th>#</th>
                        <th>Section</th>
                        <th>Capacity</th>
                        <th>Assigned On</th>
                        <th className='text-end'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='fw-semibold text-gray-600'>
                      {loadingMappings ? <LoadingRow cols={5} /> : mappings.length === 0 ? (
                        <EmptyState message='No sections assigned yet. Click "Assign Section" to add one.' icon='ki-duotone ki-grid-2' />
                      ) : mappings.map((m, idx) => (
                        <tr key={m.id}>
                          <td className='text-muted'>{idx + 1}</td>
                          <td>
                            <div className='d-flex align-items-center'>
                              <span className='badge badge-circle badge-primary fw-bold fs-6 me-3' style={{ width: 35, height: 35, fontSize: '1rem' }}>
                                {m.section?.name || '-'}
                              </span>
                              <span className='text-gray-800 fw-bold'>Section {m.section?.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className='d-flex align-items-center'>
                              <i className='ki-duotone ki-people fs-4 me-1 text-muted'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i>
                              <span className='fw-bold text-gray-700'>{m.capacity}</span>
                              <span className='ms-1 text-muted fs-7'>students</span>
                            </div>
                          </td>
                          <td className='text-muted fs-7'>
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className='text-end'>
                            <button
                              className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                              title='Remove from class'
                              onClick={() => handleRemove(m.section_id)}
                            >
                              <i className='ki-duotone ki-minus-square fs-2'><span className='path1'></span><span className='path2'></span></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Section Modal */}
      <Modal show={showAssignModal} onHide={() => !saving && setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Section to {selectedClass?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-8 px-lg-15'>
          {error && <Alert variant='danger'>{error}</Alert>}
          <form onSubmit={handleAssign}>
            <div className='mb-6'>
              <label className='required fw-semibold fs-6 mb-2'>Select Section</label>
              <select
                className='form-select form-select-solid'
                value={assignForm.section_id}
                onChange={e => setAssignForm({ ...assignForm, section_id: e.target.value })}
                required
              >
                <option value=''>-- Select a section --</option>
                {availableSections.map(s => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
              {availableSections.length === 0 && (
                <div className='form-text text-warning mt-2'>All available sections are already assigned to this class.</div>
              )}
            </div>
            <div className='mb-6'>
              <label className='required fw-semibold fs-6 mb-2'>Student Capacity</label>
              <input
                type='number'
                min={1}
                max={200}
                className='form-control form-control-solid'
                placeholder='e.g. 45'
                value={assignForm.capacity}
                onChange={e => setAssignForm({ ...assignForm, capacity: e.target.value })}
                required
              />
              <div className='form-text text-muted'>Maximum number of students allowed in this class-section</div>
            </div>
            <div className='text-end pt-3'>
              <Button variant='light' onClick={() => setShowAssignModal(false)} className='me-3' disabled={saving}>Cancel</Button>
              <Button variant='primary' type='submit' disabled={saving || availableSections.length === 0}>
                {saving ? <><span className='spinner-border spinner-border-sm me-2'></span>Assigning...</> : 'Assign Section'}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
type Tab = 'classes' | 'sections' | 'mapping'

const ClassesAndSectionsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')
  const [activeTab, setActiveTab] = useState<Tab>('classes')

  const tabs = [
    { key: 'classes' as Tab, label: 'Classes', icon: 'ki-duotone ki-abstract-26', count: '', color: 'primary' },
    { key: 'sections' as Tab, label: 'Sections', icon: 'ki-duotone ki-tablet-book', count: '', color: 'info' },
    { key: 'mapping' as Tab, label: 'Class–Section Mapping', icon: 'ki-duotone ki-grid-2', count: '', color: 'success' },
  ]

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* Tab Navigation */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-bold mb-6'>
          {tabs.map(tab => (
            <li className='nav-item' key={tab.key}>
              <a
                className={`nav-link text-active-primary pb-4 ${activeTab === tab.key ? 'active' : ''}`}
                href='#'
                onClick={e => { e.preventDefault(); setActiveTab(tab.key) }}
              >
                <i className={`${tab.icon} fs-4 me-2`}><span className='path1'></span><span className='path2'></span></i>
                {tab.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Tab Panels */}
        {activeTab === 'classes' && <ClassesTab schoolId={schoolId} />}
        {activeTab === 'sections' && <SectionsTab schoolId={schoolId} />}
        {activeTab === 'mapping' && <MappingTab schoolId={schoolId} />}
      </Content>
    </>
  )
}

const ClassesWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Academic', path: '/academic/classes', isActive: false }, { title: 'Classes & Sections', path: '/academic/classes', isActive: true }]}>
      Classes & Sections
    </PageTitle>
    <ClassesAndSectionsPage />
  </>
)

export { ClassesWrapper }
