import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import {
  getSchools,
  getProfessions,
  createProfession,
  updateProfession,
  deleteProfession,
  toggleProfessionStatus,
} from '../auth/core/_requests'
import { SchoolModel, ProfessionModel } from '../auth/core/_models'
import { useAuth } from '../auth'
import { toast } from 'react-toastify'

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'teaching', label: 'Teaching', color: 'primary', icon: 'book-open' },
  { value: 'administrative', label: 'Administrative', color: 'info', icon: 'setting-2' },
  { value: 'support', label: 'Support', color: 'warning', icon: 'people' },
  { value: 'technical', label: 'Technical', color: 'success', icon: 'code' },
  { value: 'other', label: 'Other', color: 'secondary', icon: 'category' },
]

const getCategoryConfig = (cat: string) =>
  CATEGORIES.find(c => c.value === cat) || CATEGORIES[4]

const emptyForm = { name: '', description: '', category: 'teaching', is_active: true }

/* =========================================================================
   Main Component
========================================================================= */
const ProfessionsPage: FC = () => {
  const { currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const [schools, setSchools] = useState<SchoolModel[]>([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [professions, setProfessions] = useState<ProfessionModel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* ── Load schools (superadmin) ─────────────────────────────────────────── */
  useEffect(() => {
    if (isSuperAdmin) {
      getSchools(1, 100, '', true)
        .then(res => {
          if (res.data.success) {
            const list = res.data.data.schools
            setSchools(list)
            if (list.length > 0) setSelectedSchool(list[0].id.toString())
          }
        })
        .catch(() => toast.error('Failed to load schools'))
    } else if (currentUser?.schoolId) {
      setSelectedSchool(currentUser.schoolId.toString())
    }
  }, [currentUser, isSuperAdmin])

  /* ── Load professions ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (selectedSchool) fetchProfessions()
    else setProfessions([])
  }, [selectedSchool])

  const fetchProfessions = async () => {
    setLoading(true)
    try {
      const res = await getProfessions(selectedSchool)
      if (res.data.success) setProfessions(res.data.data.professions || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load professions')
    } finally {
      setLoading(false)
    }
  }

  /* ── Modal handlers ────────────────────────────────────────────────────── */
  const openCreate = () => {
    setIsEdit(false)
    setEditId(null)
    setFormData({ ...emptyForm })
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (prof: ProfessionModel) => {
    setIsEdit(true)
    setEditId(prof.id)
    setFormData({
      name: prof.name,
      description: prof.description || '',
      category: prof.category,
      is_active: prof.is_active,
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { setFormError('Profession name is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (isEdit && editId) {
        await updateProfession(selectedSchool, editId, formData)
        toast.success('Profession updated successfully!')
      } else {
        await createProfession(selectedSchool, formData)
        toast.success('Profession created successfully!')
      }
      setShowModal(false)
      fetchProfessions()
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (prof: ProfessionModel) => {
    setTogglingId(prof.id)
    try {
      await toggleProfessionStatus(selectedSchool, prof.id)
      toast.success(`${prof.name} ${prof.is_active ? 'deactivated' : 'activated'}!`)
      fetchProfessions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (prof: ProfessionModel) => {
    if (!window.confirm(`Delete "${prof.name}"? This cannot be undone.`)) return
    setDeletingId(prof.id)
    try {
      await deleteProfession(selectedSchool, prof.id)
      toast.success('Profession deleted!')
      fetchProfessions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Filtered list ─────────────────────────────────────────────────────── */
  const filtered = professions.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || p.category === filterCategory
    return matchSearch && matchCat
  })

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const stats = {
    total: professions.length,
    active: professions.filter(p => p.is_active).length,
    inactive: professions.filter(p => !p.is_active).length,
    teaching: professions.filter(p => p.category === 'teaching').length,
  }

  /* =========================================================================
     RENDER
  ========================================================================= */
  return (
    <>
      <PageTitle breadcrumbs={[{ title: 'Administration', path: '/administration', isSeparator: false, isActive: false }]}>
        Professions
      </PageTitle>
      <ToolbarWrapper />
      <Content>

        {/* ── School Selector (SuperAdmin) ─────────────────────────────── */}
        {isSuperAdmin && (
          <div className='card mb-6'>
            <div className='card-body py-4'>
              <div className='row align-items-center'>
                <div className='col-auto'>
                  <div className='d-flex align-items-center gap-3'>
                    <div className='symbol symbol-40px symbol-circle bg-light-primary'>
                      <span className='symbol-label'>
                        <i className='ki-duotone ki-home-2 fs-3 text-primary'>
                          <span className='path1'></span><span className='path2'></span>
                        </i>
                      </span>
                    </div>
                    <div>
                      <div className='fw-bold text-gray-800 fs-6'>Select School</div>
                      <div className='text-muted fs-7'>Manage professions for this school</div>
                    </div>
                  </div>
                </div>
                <div className='col-md-4 ms-auto'>
                  <select
                    className='form-select form-select-solid'
                    value={selectedSchool}
                    onChange={e => setSelectedSchool(e.target.value)}
                  >
                    <option value=''>— Select a School —</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedSchool ? (
          /* ── Empty State ─────────────────────────────────────────────── */
          <div className='card'>
            <div className='card-body text-center py-20'>
              <i className='ki-duotone ki-office-bag fs-5x text-gray-200 mb-5 d-block'>
                <span className='path1'></span><span className='path2'></span>
                <span className='path3'></span><span className='path4'></span>
              </i>
              <h4 className='text-gray-600 fw-bold'>No School Selected</h4>
              <p className='text-muted'>Please select a school above to manage its professions.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Stats Row ──────────────────────────────────────────────── */}
            <div className='row g-5 mb-6'>
              {[
                { label: 'Total Professions', value: stats.total, color: 'primary', icon: 'office-bag' },
                { label: 'Active', value: stats.active, color: 'success', icon: 'check-circle' },
                { label: 'Inactive', value: stats.inactive, color: 'danger', icon: 'cross-circle' },
                { label: 'Teaching Roles', value: stats.teaching, color: 'info', icon: 'book-open' },
              ].map(stat => (
                <div key={stat.label} className='col-6 col-md-3'>
                  <div className='card h-100'>
                    <div className='card-body d-flex align-items-center gap-4 py-5'>
                      <div className={`symbol symbol-50px symbol-circle bg-light-${stat.color}`}>
                        <span className='symbol-label'>
                          <i className={`ki-duotone ki-${stat.icon} fs-2 text-${stat.color}`}>
                            <span className='path1'></span><span className='path2'></span>
                          </i>
                        </span>
                      </div>
                      <div>
                        <div className={`fs-2 fw-bolder text-${stat.color}`}>{stat.value}</div>
                        <div className='text-muted fw-semibold fs-7'>{stat.label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Table Card ─────────────────────────────────────────── */}
            <div className='card card-flush'>
              {/* Card Header */}
              <div className='card-header align-items-center border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                  <span className='card-label fw-bold fs-3'>Professions List</span>
                  <span className='text-muted mt-1 fw-semibold fs-7'>
                    {filtered.length} of {professions.length} professions
                  </span>
                </h3>
                <div className='card-toolbar gap-3'>
                  {/* Search */}
                  <div className='d-flex align-items-center position-relative'>
                    <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4 text-gray-400'>
                      <span className='path1'></span><span className='path2'></span>
                    </i>
                    <input
                      type='text'
                      className='form-control form-control-solid w-200px ps-13'
                      placeholder='Search professions...'
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  {/* Category filter */}
                  <select
                    className='form-select form-select-solid w-150px'
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value=''>All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {/* Add button */}
                  <button className='btn btn-primary' onClick={openCreate}>
                    <i className='ki-duotone ki-plus fs-2'></i>
                    Add Profession
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className='card-body pt-3'>
                {loading ? (
                  <div className='text-center py-15'>
                    <span className='spinner-border text-primary'></span>
                    <div className='text-muted mt-3'>Loading professions...</div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className='text-center py-15'>
                    <i className='ki-duotone ki-office-bag fs-5x text-gray-200 mb-4 d-block'>
                      <span className='path1'></span><span className='path2'></span>
                      <span className='path3'></span><span className='path4'></span>
                    </i>
                    <p className='text-muted fs-5'>
                      {search || filterCategory ? 'No professions match your filters.' : 'No professions added yet.'}
                    </p>
                    {!search && !filterCategory && (
                      <button className='btn btn-primary btn-sm mt-2' onClick={openCreate}>
                        Add First Profession
                      </button>
                    )}
                  </div>
                ) : (
                  <div className='table-responsive'>
                    <table className='table align-middle table-row-dashed fs-6 gy-4'>
                      <thead>
                        <tr className='text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0 border-bottom'>
                          <th className='min-w-200px ps-0'>Profession</th>
                          <th className='min-w-130px'>Category</th>
                          <th className='min-w-200px'>Description</th>
                          <th className='min-w-100px text-center'>Status</th>
                          <th className='min-w-120px text-end pe-0'>Actions</th>
                        </tr>
                      </thead>
                      <tbody className='fw-semibold text-gray-600'>
                        {filtered.map(prof => {
                          const catCfg = getCategoryConfig(prof.category)
                          return (
                            <tr key={prof.id}>
                              {/* Name */}
                              <td className='ps-0'>
                                <div className='d-flex align-items-center gap-3'>
                                  <div className={`symbol symbol-40px symbol-circle bg-light-${catCfg.color}`}>
                                    <span className='symbol-label fw-bold fs-5 text-capitalize' style={{ fontSize: '16px' }}>
                                      {prof.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className='text-gray-800 fw-bold d-block fs-6'>{prof.name}</span>
                                    <span className='text-muted fs-7'>ID: #{prof.id}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td>
                                <span className={`badge badge-light-${catCfg.color} fw-semibold text-capitalize px-3 py-2`}>
                                  <i className={`ki-duotone ki-${catCfg.icon} fs-7 me-1`}>
                                    <span className='path1'></span><span className='path2'></span>
                                  </i>
                                  {catCfg.label}
                                </span>
                              </td>

                              {/* Description */}
                              <td>
                                <span className='text-muted fs-7' title={prof.description || ''}>
                                  {prof.description
                                    ? prof.description.length > 60
                                      ? prof.description.substring(0, 60) + '...'
                                      : prof.description
                                    : <span className='text-gray-300'>—</span>}
                                </span>
                              </td>

                              {/* Status */}
                              <td className='text-center'>
                                <span
                                  className={`badge badge-light-${prof.is_active ? 'success' : 'danger'} fw-bold cursor-pointer`}
                                  onClick={() => handleToggle(prof)}
                                  title='Click to toggle status'
                                >
                                  {togglingId === prof.id ? (
                                    <span className='spinner-border spinner-border-sm'></span>
                                  ) : (
                                    <>
                                      <span className={`bullet bullet-dot bg-${prof.is_active ? 'success' : 'danger'} me-1`}></span>
                                      {prof.is_active ? 'Active' : 'Inactive'}
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className='text-end pe-0'>
                                <div className='d-flex justify-content-end gap-1'>
                                  {/* Edit */}
                                  <button
                                    className='btn btn-icon btn-sm btn-light-primary'
                                    title='Edit Profession'
                                    onClick={() => openEdit(prof)}
                                  >
                                    <i className='ki-duotone ki-pencil fs-5'>
                                      <span className='path1'></span><span className='path2'></span>
                                    </i>
                                  </button>

                                  {/* Toggle */}
                                  <button
                                    className={`btn btn-icon btn-sm btn-light-${prof.is_active ? 'warning' : 'success'}`}
                                    title={prof.is_active ? 'Deactivate' : 'Activate'}
                                    onClick={() => handleToggle(prof)}
                                    disabled={togglingId === prof.id}
                                  >
                                    {togglingId === prof.id ? (
                                      <span className='spinner-border spinner-border-sm'></span>
                                    ) : (
                                      <i className={`ki-duotone ${prof.is_active ? 'ki-minus-circle' : 'ki-check-circle'} fs-5`}>
                                        <span className='path1'></span><span className='path2'></span>
                                      </i>
                                    )}
                                  </button>

                                  {/* Delete */}
                                  <button
                                    className='btn btn-icon btn-sm btn-light-danger'
                                    title='Delete Profession'
                                    onClick={() => handleDelete(prof)}
                                    disabled={deletingId === prof.id}
                                  >
                                    {deletingId === prof.id ? (
                                      <span className='spinner-border spinner-border-sm'></span>
                                    ) : (
                                      <i className='ki-duotone ki-trash fs-5'>
                                        <span className='path1'></span><span className='path2'></span>
                                        <span className='path3'></span><span className='path4'></span>
                                        <span className='path5'></span>
                                      </i>
                                    )}
                                  </button>
                                </div>
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
          </>
        )}
      </Content>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className='modal fade show d-block' tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <div className='modal-content'>

              {/* Modal Header */}
              <div className='modal-header bg-light'>
                <div className='d-flex align-items-center gap-3'>
                  <div className={`symbol symbol-40px symbol-circle bg-light-${isEdit ? 'warning' : 'primary'}`}>
                    <span className='symbol-label'>
                      <i className={`ki-duotone ${isEdit ? 'ki-pencil' : 'ki-plus-circle'} fs-3 text-${isEdit ? 'warning' : 'primary'}`}>
                        <span className='path1'></span><span className='path2'></span>
                      </i>
                    </span>
                  </div>
                  <div>
                    <h5 className='modal-title fw-bold mb-0'>
                      {isEdit ? 'Edit Profession' : 'Add New Profession'}
                    </h5>
                    <span className='text-muted fs-7'>
                      {isEdit ? 'Update profession details' : 'Fill in the details below'}
                    </span>
                  </div>
                </div>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className='modal-body p-8'>
                {formError && (
                  <div className='alert alert-danger d-flex align-items-center p-4 mb-6'>
                    <i className='ki-duotone ki-information-5 fs-2hx text-danger me-3'>
                      <span className='path1'></span><span className='path2'></span><span className='path3'></span>
                    </i>
                    <div className='fw-semibold'>{formError}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className='row g-6 mb-6'>
                    {/* Name */}
                    <div className='col-md-6'>
                      <label className='form-label required fw-semibold'>Profession Name</label>
                      <input
                        type='text'
                        className='form-control form-control-solid'
                        placeholder='e.g., Math Teacher, Lab Assistant'
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    {/* Category */}
                    <div className='col-md-6'>
                      <label className='form-label required fw-semibold'>Category</label>
                      <select
                        className='form-select form-select-solid'
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className='mb-6'>
                    <label className='form-label fw-semibold'>Description</label>
                    <textarea
                      className='form-control form-control-solid'
                      rows={3}
                      placeholder='Brief description of the profession and its responsibilities...'
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Active Status */}
                  <div className='d-flex align-items-center p-4 rounded bg-light'>
                    <div className='flex-grow-1'>
                      <div className='fw-semibold text-gray-800'>Active Status</div>
                      <div className='text-muted fs-7'>Inactive professions won't be available for assignment</div>
                    </div>
                    <div className='form-check form-switch form-check-custom form-check-solid ms-4'>
                      <input
                        className='form-check-input w-45px h-30px'
                        type='checkbox'
                        id='profIsActive'
                        checked={formData.is_active}
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <label className='form-check-label fw-semibold ms-2' htmlFor='profIsActive'>
                        <span className={`badge badge-light-${formData.is_active ? 'success' : 'danger'}`}>
                          {formData.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className='modal-footer bg-light border-0'>
                <button
                  type='button'
                  className='btn btn-light'
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className={`btn btn-${isEdit ? 'warning' : 'primary'}`}
                  onClick={handleSubmit as any}
                  disabled={saving}
                >
                  {saving ? (
                    <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</>
                  ) : (
                    <>
                      <i className={`ki-duotone ${isEdit ? 'ki-check' : 'ki-plus'} fs-2`}></i>
                      {isEdit ? 'Update Profession' : 'Create Profession'}
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProfessionsPage
