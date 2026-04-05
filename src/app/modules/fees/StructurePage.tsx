import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  getFeeCategories, createFeeCategory, updateFeeCategory, deleteFeeCategory,
  getFeeGroups, getFeeGroupById, createFeeGroup, updateFeeGroup, deleteFeeGroup,
  getFeeAllocations, createFeeAllocation, deleteFeeAllocation,
} from './core/_requests'
import { getAcademicSessions, getClasses } from '../academic/core/_requests'
import { FeeCategoryModel, FeeGroupModel, FeeAllocationModel } from './core/_models'

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUALLY: 'Annually', ONE_TIME: 'One Time',
}

const TABS = [
  { key: 'categories', label: 'Fee Categories', icon: 'ki-tag' },
  { key: 'groups', label: 'Fee Groups', icon: 'ki-layers' },
  { key: 'allocations', label: 'Class Allocations', icon: 'ki-routing' },
] as const

type Tab = typeof TABS[number]['key']

const StructurePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<Tab>('categories')

  // ── Categories
  const [categories, setCategories] = useState<FeeCategoryModel[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editCat, setEditCat] = useState<FeeCategoryModel | null>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '', default_amount: '', is_active: true })
  const [catSaving, setCatSaving] = useState(false)
  const [catSaveError, setCatSaveError] = useState<string | null>(null)
  const [catSuccess, setCatSuccess] = useState<string | null>(null)

  // ── Groups
  const [groups, setGroups] = useState<FeeGroupModel[]>([])
  const [grpLoading, setGrpLoading] = useState(false)
  const [grpError, setGrpError] = useState<string | null>(null)
  const [showGrpModal, setShowGrpModal] = useState(false)
  const [editGrp, setEditGrp] = useState<FeeGroupModel | null>(null)
  const [grpForm, setGrpForm] = useState({ name: '', description: '' })
  const [grpItems, setGrpItems] = useState<Array<{ category_id: string; amount: string; frequency: string }>>([{ category_id: '', amount: '', frequency: 'MONTHLY' }])
  const [grpSaving, setGrpSaving] = useState(false)
  const [grpSaveError, setGrpSaveError] = useState<string | null>(null)
  const [grpSuccess, setGrpSuccess] = useState<string | null>(null)
  const [grpLoadingDetail, setGrpLoadingDetail] = useState(false)

  // ── Allocations
  const [allocations, setAllocations] = useState<FeeAllocationModel[]>([])
  const [allocLoading, setAllocLoading] = useState(false)
  const [allocError, setAllocError] = useState<string | null>(null)
  const [showAllocModal, setShowAllocModal] = useState(false)
  const [allocForm, setAllocForm] = useState({ fee_group_id: '', class_id: '', academic_session_id: '' })
  const [allocSaving, setAllocSaving] = useState(false)
  const [allocSaveError, setAllocSaveError] = useState<string | null>(null)
  const [allocSuccess, setAllocSuccess] = useState<string | null>(null)

  // ── Meta
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const extractArray = (raw: any, ...hints: string[]): any[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'object') {
      for (const key of hints) { if (Array.isArray(raw[key])) return raw[key] }
      for (const key of Object.keys(raw)) { if (Array.isArray(raw[key])) return raw[key] }
    }
    return []
  }

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

  const loadCategories = useCallback(async () => {
    if (!schoolId) return
    setCatLoading(true); setCatError(null)
    try {
      const { data } = await getFeeCategories(schoolId)
      if (data.success) setCategories(extractArray(data.data, 'categories', 'fee_categories', 'data'))
      else setCatError(data.message || 'Failed to load categories')
    } catch (e: any) {
      setCatError(`Error: ${e.response?.data?.message || e.message} (${e.response?.status || 'network'})`)
    } finally { setCatLoading(false) }
  }, [schoolId])

  const loadGroups = useCallback(async () => {
    if (!schoolId) return
    setGrpLoading(true); setGrpError(null)
    try {
      const { data } = await getFeeGroups(schoolId)
      if (data.success) setGroups(extractArray(data.data, 'groups', 'fee_groups', 'data'))
      else setGrpError(data.message || 'Failed to load fee groups')
    } catch (e: any) {
      setGrpError(`Error: ${e.response?.data?.message || e.message} (${e.response?.status || 'network'})`)
    } finally { setGrpLoading(false) }
  }, [schoolId])

  const loadAllocations = useCallback(async () => {
    if (!schoolId) return
    setAllocLoading(true); setAllocError(null)
    try {
      const { data } = await getFeeAllocations(schoolId)
      if (data.success) setAllocations(extractArray(data.data, 'allocations', 'fee_allocations', 'data'))
      else setAllocError(data.message || 'Failed to load allocations')
    } catch (e: any) {
      if (e.response?.status === 404)
        setAllocError('API endpoint not found (404). Backend GET /fees/allocations may not be implemented yet.')
      else
        setAllocError(`Error ${e.response?.status || ''}: ${e.response?.data?.message || e.message}`)
    } finally { setAllocLoading(false) }
  }, [schoolId])

  useEffect(() => {
    loadCategories(); loadGroups(); loadAllocations()
  }, [loadCategories, loadGroups, loadAllocations])

  // ── Category CRUD
  const openCatModal = (cat?: FeeCategoryModel) => {
    setEditCat(cat || null)
    setCatForm(cat
      ? { name: cat.name, description: cat.description || '', default_amount: cat.default_amount, is_active: cat.is_active }
      : { name: '', description: '', default_amount: '', is_active: true })
    setCatSaveError(null); setShowCatModal(true)
  }
  const saveCat = async () => {
    if (!catForm.name || !catForm.default_amount) { setCatSaveError('Name and amount are required'); return }
    setCatSaving(true); setCatSaveError(null)
    try {
      const payload = { name: catForm.name, description: catForm.description, default_amount: Number(catForm.default_amount), is_active: catForm.is_active }
      if (editCat) await updateFeeCategory(schoolId, editCat.id, payload)
      else await createFeeCategory(schoolId, payload)
      setShowCatModal(false)
      setCatSuccess(editCat ? 'Category updated!' : 'Category created!')
      setTimeout(() => setCatSuccess(null), 3000)
      loadCategories()
    } catch (e: any) { setCatSaveError(e.response?.data?.message || 'Save failed') }
    finally { setCatSaving(false) }
  }
  const deleteCat = async (id: number) => {
    if (!window.confirm('Delete this fee category?')) return
    try { await deleteFeeCategory(schoolId, id); loadCategories() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Group CRUD
  const openGrpModal = async (grp?: FeeGroupModel) => {
    setGrpSaveError(null)
    if (!grp) {
      setEditGrp(null)
      setGrpForm({ name: '', description: '' })
      setGrpItems([{ category_id: '', amount: '', frequency: 'MONTHLY' }])
      setShowGrpModal(true); return
    }
    setEditGrp(grp)
    setGrpForm({ name: grp.name, description: grp.description || '' })
    setGrpItems([{ category_id: '', amount: '', frequency: 'MONTHLY' }])
    setShowGrpModal(true); setGrpLoadingDetail(true)
    try {
      const { data } = await getFeeGroupById(schoolId, grp.id)
      const fullGrp = data.success ? (data.data as any) : null
      const types = fullGrp?.fee_group_types || grp.fee_group_types || []
      if (types.length > 0)
        setGrpItems(types.map((t: any) => ({
          category_id: String(t.fee_category_id ?? t.category_id ?? ''),
          amount: String(t.amount ?? ''),
          frequency: t.frequency ?? 'MONTHLY',
        })))
    } catch {
      const types = grp.fee_group_types || []
      if (types.length > 0)
        setGrpItems(types.map(t => ({ category_id: String(t.fee_category_id), amount: t.amount, frequency: t.frequency })))
    } finally { setGrpLoadingDetail(false) }
  }

  const addGrpItem = () => setGrpItems(p => [...p, { category_id: '', amount: '', frequency: 'MONTHLY' }])
  const removeGrpItem = (i: number) => setGrpItems(p => p.filter((_, idx) => idx !== i))
  const updateGrpItem = (i: number, field: string, value: string) =>
    setGrpItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const saveGrp = async () => {
    if (!grpForm.name) { setGrpSaveError('Group name is required'); return }
    const validItems = grpItems.filter(i => i.category_id && i.amount)
    if (!validItems.length) { setGrpSaveError('Add at least one fee category with amount'); return }
    setGrpSaving(true); setGrpSaveError(null)
    try {
      const payload = {
        name: grpForm.name, description: grpForm.description,
        categories: validItems.map(i => ({ category_id: Number(i.category_id), amount: Number(i.amount), frequency: i.frequency as any }))
      }
      if (editGrp) await updateFeeGroup(schoolId, editGrp.id, payload)
      else await createFeeGroup(schoolId, payload)
      setShowGrpModal(false)
      setGrpSuccess(editGrp ? 'Group updated!' : 'Group created!')
      setTimeout(() => setGrpSuccess(null), 3000)
      loadGroups()
    } catch (e: any) { setGrpSaveError(e.response?.data?.message || 'Save failed') }
    finally { setGrpSaving(false) }
  }
  const deleteGrp = async (id: number) => {
    if (!window.confirm('Delete this fee group?')) return
    try { await deleteFeeGroup(schoolId, id); loadGroups() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Allocation CRUD
  const openAllocModal = () => {
    setAllocForm({ fee_group_id: '', class_id: '', academic_session_id: '' })
    setAllocSaveError(null); setShowAllocModal(true)
  }
  const saveAlloc = async () => {
    if (!allocForm.fee_group_id || !allocForm.class_id || !allocForm.academic_session_id) {
      setAllocSaveError('All fields are required'); return
    }
    setAllocSaving(true); setAllocSaveError(null)
    try {
      await createFeeAllocation(schoolId, {
        fee_group_id: Number(allocForm.fee_group_id),
        class_id: Number(allocForm.class_id),
        academic_session_id: Number(allocForm.academic_session_id),
      })
      setShowAllocModal(false)
      setAllocSuccess('Fee structure allocated successfully!')
      setTimeout(() => setAllocSuccess(null), 3000)
      loadAllocations()
    } catch (e: any) { setAllocSaveError(e.response?.data?.message || 'Allocation failed') }
    finally { setAllocSaving(false) }
  }
  const deleteAlloc = async (id: number) => {
    if (!window.confirm('Remove this allocation?')) return
    try { await deleteFeeAllocation(schoolId, id); loadAllocations() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Helpers
  const fmtINR = (v: any) => `₹${Number(v).toLocaleString('en-IN')}`

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Page Header ── */}
        <div className='d-flex align-items-center justify-content-between mb-6'>
          <div>
            <h2 className='fw-bolder text-gray-800 mb-1 fs-2'>Fee Structure</h2>
            <span className='text-muted fs-6'>Define categories, build groups, and allocate to classes</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className='card card-flush mb-0 border-bottom-0' style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <div className='card-header px-6 pt-5 pb-0 border-bottom-0'>
            <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold mb-0'>
              {TABS.map(({ key, label, icon }) => (
                <li key={key} className='nav-item'>
                  <a
                    href='#'
                    className={`nav-link pb-4 ${activeTab === key ? 'active text-primary' : 'text-muted'}`}
                    onClick={e => { e.preventDefault(); setActiveTab(key) }}
                  >
                    <i className={`ki-duotone ${icon} fs-5 me-2`}>
                      <span className='path1' /><span className='path2' />
                    </i>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══════ TAB: CATEGORIES ══════ */}
        {activeTab === 'categories' && (
          <div className='card card-flush' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className='card-header align-items-center py-5 border-bottom'>
              <div className='card-title'>
                <h3 className='fw-bold text-gray-800 m-0 fs-5'>Fee Categories</h3>
                {categories.length > 0 && (
                  <span className='badge badge-light-primary ms-3 fs-8 fw-semibold'>
                    {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                  </span>
                )}
              </div>
              <div className='card-toolbar gap-3'>
                {catSuccess && (
                  <span className='badge badge-light-success fs-8 fw-semibold'>
                    <i className='ki-duotone ki-check fs-7 me-1'><span className='path1' /><span className='path2' /></i>
                    {catSuccess}
                  </span>
                )}
                <button className='btn btn-primary btn-sm' onClick={() => openCatModal()}>
                  <i className='ki-duotone ki-plus fs-5'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  Add Category
                </button>
              </div>
            </div>

            <div className='card-body p-0'>
              {catError && (
                <div className='mx-6 mt-5'>
                  <div className='alert alert-danger d-flex align-items-center py-3 px-4'>
                    <i className='ki-duotone ki-shield-cross fs-3 text-danger me-3'><span className='path1' /><span className='path2' /></i>
                    <span className='fs-7'>{catError}</span>
                  </div>
                </div>
              )}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed table-row-gray-200 fs-7 gy-4 px-6'>
                  <thead>
                    <tr className='text-start text-gray-500 fw-bold fs-8 text-uppercase border-bottom border-gray-200'>
                      <th className='ps-6 w-40px'>#</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Default Amount</th>
                      <th>Status</th>
                      <th className='text-end pe-6'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-600'>
                    {catLoading ? (
                      <tr>
                        <td colSpan={6} className='text-center py-12'>
                          <span className='spinner-border spinner-border-sm text-primary me-2' />
                          <span className='text-muted fs-7'>Loading categories...</span>
                        </td>
                      </tr>
                    ) : categories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='py-14'>
                          <div className='d-flex flex-column align-items-center text-center'>
                            <div className='w-60px h-60px bg-light-primary rounded-circle d-flex align-items-center justify-content-center mb-4'>
                              <i className='ki-duotone ki-tag fs-1 text-primary'><span className='path1' /><span className='path2' /></i>
                            </div>
                            <span className='text-gray-600 fw-semibold fs-6'>No categories yet</span>
                            <span className='text-muted fs-7 mt-1'>Create your first fee category to get started</span>
                          </div>
                        </td>
                      </tr>
                    ) : categories.map((cat, i) => (
                      <tr key={cat.id}>
                        <td className='ps-6 text-muted fw-semibold'>{i + 1}</td>
                        <td>
                          <span className='fw-bold text-gray-800'>{cat.name}</span>
                        </td>
                        <td className='text-muted'>{cat.description || <span className='text-gray-400'>—</span>}</td>
                        <td>
                          <span className='fw-bold text-gray-800'>{fmtINR(cat.default_amount)}</span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${cat.is_active ? 'success' : 'danger'} fw-semibold fs-8`}>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='text-end pe-6'>
                          <button
                            className='btn btn-sm btn-icon btn-light btn-active-light-primary me-1'
                            title='Edit' onClick={() => openCatModal(cat)}
                          >
                            <i className='ki-duotone ki-pencil fs-5'><span className='path1' /><span className='path2' /></i>
                          </button>
                          <button
                            className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                            title='Delete' onClick={() => deleteCat(cat.id)}
                          >
                            <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: GROUPS ══════ */}
        {activeTab === 'groups' && (
          <div className='card card-flush' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className='card-header align-items-center py-5 border-bottom'>
              <div className='card-title'>
                <h3 className='fw-bold text-gray-800 m-0 fs-5'>Fee Groups</h3>
                {groups.length > 0 && (
                  <span className='badge badge-light-primary ms-3 fs-8 fw-semibold'>
                    {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                  </span>
                )}
              </div>
              <div className='card-toolbar gap-3'>
                {grpSuccess && (
                  <span className='badge badge-light-success fs-8 fw-semibold'>
                    <i className='ki-duotone ki-check fs-7 me-1'><span className='path1' /><span className='path2' /></i>
                    {grpSuccess}
                  </span>
                )}
                <button className='btn btn-primary btn-sm' onClick={() => openGrpModal()}>
                  <i className='ki-duotone ki-plus fs-5'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  New Group
                </button>
              </div>
            </div>

            <div className='card-body pt-6'>
              {grpError && (
                <div className='alert alert-danger d-flex align-items-center py-3 px-4 mb-5'>
                  <i className='ki-duotone ki-shield-cross fs-3 text-danger me-3'><span className='path1' /><span className='path2' /></i>
                  <span className='fs-7'>{grpError}</span>
                </div>
              )}
              {grpLoading ? (
                <div className='text-center py-12'>
                  <span className='spinner-border spinner-border-sm text-primary me-2' />
                  <span className='text-muted fs-7'>Loading groups...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className='d-flex flex-column align-items-center text-center py-14'>
                  <div className='w-60px h-60px bg-light-primary rounded-circle d-flex align-items-center justify-content-center mb-4'>
                    <i className='ki-duotone ki-layers fs-1 text-primary'><span className='path1' /><span className='path2' /></i>
                  </div>
                  <span className='text-gray-600 fw-semibold fs-6'>No fee groups yet</span>
                  <span className='text-muted fs-7 mt-1'>Create a group to bundle fee categories together</span>
                </div>
              ) : (
                <div className='row g-5'>
                  {groups.map(grp => {
                    const total = (grp.fee_group_types || []).reduce((s, i) => s + Number(i.amount), 0)
                    return (
                      <div key={grp.id} className='col-md-6 col-xl-4'>
                        <div className='card border border-gray-200 h-100'>
                          {/* Card Header */}
                          <div className='card-header border-bottom border-gray-200 py-4 min-h-auto px-5'>
                            <div className='d-flex align-items-center flex-grow-1'>
                              <div className='d-flex flex-column'>
                                <span className='fw-bold text-gray-800 fs-6'>{grp.name}</span>
                                {grp.description && (
                                  <span className='text-muted fs-8 mt-1'>{grp.description}</span>
                                )}
                              </div>
                            </div>
                            <div className='d-flex align-items-center gap-2 ms-3'>
                              <span className={`badge badge-light-${grp.is_active ? 'success' : 'warning'} fs-9`}>
                                {grp.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                className='btn btn-sm btn-icon btn-light btn-active-light-primary'
                                onClick={() => openGrpModal(grp)} title='Edit'
                              >
                                <i className='ki-duotone ki-pencil fs-5'><span className='path1' /><span className='path2' /></i>
                              </button>
                              <button
                                className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                                onClick={() => deleteGrp(grp.id)} title='Delete'
                              >
                                <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className='card-body px-5 py-4'>
                            {grp.fee_group_types && grp.fee_group_types.length > 0 ? (
                              <div className='d-flex flex-column gap-2'>
                                {grp.fee_group_types.map(item => (
                                  <div key={item.id} className='d-flex align-items-center justify-content-between py-2 border-bottom border-gray-100'>
                                    <div className='d-flex align-items-center gap-2'>
                                      <span className='text-gray-700 fs-7 fw-semibold'>
                                        {item.fee_category?.name || `Category #${item.fee_category_id}`}
                                      </span>
                                      <span className='badge badge-light-primary fs-9'>
                                        {FREQ_LABELS[item.frequency] || item.frequency}
                                      </span>
                                    </div>
                                    <span className='fw-bold text-gray-800 fs-7'>{fmtINR(item.amount)}</span>
                                  </div>
                                ))}
                                <div className='d-flex align-items-center justify-content-between pt-2 mt-1'>
                                  <span className='text-muted fs-8 fw-semibold text-uppercase'>Total</span>
                                  <span className='fw-bolder text-primary fs-6'>{fmtINR(total)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className='text-center py-4'>
                                <span className='text-muted fs-7'>No categories assigned</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ TAB: ALLOCATIONS ══════ */}
        {activeTab === 'allocations' && (
          <div className='card card-flush' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div className='card-header align-items-center py-5 border-bottom'>
              <div className='card-title'>
                <h3 className='fw-bold text-gray-800 m-0 fs-5'>Class Fee Allocations</h3>
                {allocations.length > 0 && (
                  <span className='badge badge-light-primary ms-3 fs-8 fw-semibold'>
                    {allocations.length} {allocations.length === 1 ? 'allocation' : 'allocations'}
                  </span>
                )}
              </div>
              <div className='card-toolbar gap-3'>
                {allocSuccess && (
                  <span className='badge badge-light-success fs-8 fw-semibold'>
                    <i className='ki-duotone ki-check fs-7 me-1'><span className='path1' /><span className='path2' /></i>
                    {allocSuccess}
                  </span>
                )}
                <button className='btn btn-primary btn-sm' onClick={openAllocModal}>
                  <i className='ki-duotone ki-plus fs-5'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  Allocate to Class
                </button>
              </div>
            </div>

            <div className='card-body p-0'>
              {allocError && (
                <div className='mx-6 mt-5'>
                  <div className='alert alert-danger d-flex align-items-start justify-content-between gap-3 py-4 px-5'>
                    <div>
                      <div className='fw-bold text-danger mb-1 fs-7'>Failed to load allocations</div>
                      <div className='text-muted fs-8 font-monospace'>{allocError}</div>
                      <div className='text-muted fs-8 mt-1'>Check browser console (F12) for full error details.</div>
                    </div>
                    <button className='btn btn-sm btn-light-danger flex-shrink-0' onClick={loadAllocations}>
                      Retry
                    </button>
                  </div>
                </div>
              )}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed table-row-gray-200 fs-7 gy-4'>
                  <thead>
                    <tr className='text-start text-gray-500 fw-bold fs-8 text-uppercase border-bottom border-gray-200'>
                      <th className='ps-6 w-40px'>#</th>
                      <th>Fee Group</th>
                      <th>Class</th>
                      <th>Session</th>
                      <th>Scope</th>
                      <th>Status</th>
                      <th className='text-end pe-6'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-600'>
                    {allocLoading ? (
                      <tr>
                        <td colSpan={7} className='text-center py-12'>
                          <span className='spinner-border spinner-border-sm text-primary me-2' />
                          <span className='text-muted fs-7'>Loading allocations...</span>
                        </td>
                      </tr>
                    ) : allocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='py-14'>
                          <div className='d-flex flex-column align-items-center text-center'>
                            <div className='w-60px h-60px bg-light-primary rounded-circle d-flex align-items-center justify-content-center mb-4'>
                              <i className='ki-duotone ki-routing fs-1 text-primary'><span className='path1' /><span className='path2' /></i>
                            </div>
                            <span className='text-gray-600 fw-semibold fs-6'>No allocations yet</span>
                            <span className='text-muted fs-7 mt-1'>Assign a fee group to a class to get started</span>
                          </div>
                        </td>
                      </tr>
                    ) : allocations.map((alloc, i) => (
                      <tr key={alloc.id}>
                        <td className='ps-6 text-muted fw-semibold'>{i + 1}</td>
                        <td>
                          <span className='fw-bold text-gray-800'>
                            {alloc.fee_group?.name || `Group #${alloc.fee_group_id}`}
                          </span>
                        </td>
                        <td>
                          <span className='fw-semibold text-gray-700'>
                            {alloc.class?.name || classes.find(c => c.id === alloc.class_id)?.name || `Class #${alloc.class_id}`}
                          </span>
                        </td>
                        <td className='text-muted'>
                          {sessions.find(s => s.id === alloc.academic_session_id)?.session_year || `Session #${alloc.academic_session_id}`}
                        </td>
                        <td>
                          {alloc.section?.name
                            ? <span className='text-gray-600 fs-7'>Section {alloc.section.name}</span>
                            : alloc.section_id
                              ? <span className='text-gray-600 fs-7'>Section #{alloc.section_id}</span>
                              : alloc.student_id
                                ? <span className='text-gray-600 fs-7'>Student #{alloc.student_id}</span>
                                : <span className='badge badge-light-primary fs-9'>All Students</span>}
                        </td>
                        <td>
                          <span className={`badge badge-light-${alloc.is_active ? 'success' : 'danger'} fw-semibold fs-8`}>
                            {alloc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='text-end pe-6'>
                          <button
                            className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                            onClick={() => deleteAlloc(alloc.id)} title='Remove'
                          >
                            <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                          </button>
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

      {/* ── Category Modal ── */}
      <Modal show={showCatModal} onHide={() => !catSaving && setShowCatModal(false)} centered>
        <Modal.Header closeButton className='border-bottom border-gray-200 py-4 px-6'>
          <Modal.Title className='fw-bold text-gray-800 fs-5'>
            {editCat ? 'Edit Fee Category' : 'New Fee Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-6'>
          {catSaveError && (
            <Alert variant='danger' dismissible onClose={() => setCatSaveError(null)} className='py-3 fs-7'>
              {catSaveError}
            </Alert>
          )}
          <div className='mb-5'>
            <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Category Name</label>
            <input
              className='form-control form-control-solid'
              placeholder='e.g. Tuition Fee'
              value={catForm.name}
              onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className='mb-5'>
            <label className='fw-semibold fs-7 text-gray-700 mb-2 d-block'>Description</label>
            <input
              className='form-control form-control-solid'
              placeholder='Optional description'
              value={catForm.description}
              onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className='mb-6'>
            <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Default Amount (₹)</label>
            <input
              type='number' min='0'
              className='form-control form-control-solid'
              placeholder='e.g. 2500'
              value={catForm.default_amount}
              onChange={e => setCatForm(p => ({ ...p, default_amount: e.target.value }))}
            />
          </div>
          <div className='form-check form-switch form-check-custom form-check-solid'>
            <input
              className='form-check-input' type='checkbox'
              checked={catForm.is_active}
              onChange={e => setCatForm(p => ({ ...p, is_active: e.target.checked }))}
            />
            <label className='form-check-label fw-semibold text-gray-700 fs-7'>Active</label>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-top border-gray-200 py-4 px-6'>
          <Button variant='light' onClick={() => setShowCatModal(false)} disabled={catSaving} className='btn-sm'>
            Cancel
          </Button>
          <Button variant='primary' onClick={saveCat} disabled={catSaving} className='btn-sm'>
            {catSaving
              ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</>
              : 'Save Category'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Group Modal ── */}
      <Modal show={showGrpModal} onHide={() => !grpSaving && setShowGrpModal(false)} centered size='lg'>
        <Modal.Header closeButton className='border-bottom border-gray-200 py-4 px-6'>
          <Modal.Title className='fw-bold text-gray-800 fs-5'>
            {editGrp ? 'Edit Fee Group' : 'New Fee Group'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-6'>
          {grpSaveError && (
            <Alert variant='danger' dismissible onClose={() => setGrpSaveError(null)} className='py-3 fs-7'>
              {grpSaveError}
            </Alert>
          )}
          <div className='row g-5 mb-6'>
            <div className='col-md-6'>
              <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Group Name</label>
              <input
                className='form-control form-control-solid'
                placeholder='e.g. Class 10 Fees'
                value={grpForm.name}
                onChange={e => setGrpForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className='col-md-6'>
              <label className='fw-semibold fs-7 text-gray-700 mb-2 d-block'>Description</label>
              <input
                className='form-control form-control-solid'
                placeholder='Optional'
                value={grpForm.description}
                onChange={e => setGrpForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <div className='separator my-5' />

          <div className='d-flex align-items-center justify-content-between mb-4'>
            <div>
              <span className='fw-bold text-gray-700 fs-7'>Fee Categories</span>
              {editGrp && (
                <span className='text-muted fs-8 ms-2'>— all categories will be replaced on save</span>
              )}
            </div>
            <button className='btn btn-light-primary btn-sm' type='button' onClick={addGrpItem}>
              <i className='ki-duotone ki-plus fs-5'><span className='path1' /><span className='path2' /><span className='path3' /></i>
              Add Row
            </button>
          </div>

          {grpLoadingDetail ? (
            <div className='text-center py-6'>
              <span className='spinner-border spinner-border-sm text-primary me-2' />
              <span className='text-muted fs-7'>Loading category details...</span>
            </div>
          ) : (
            <div className='d-flex flex-column gap-3'>
              {grpItems.map((item, i) => (
                <div key={i} className='row g-3 align-items-end'>
                  <div className='col-md-5'>
                    {i === 0 && <label className='fw-semibold fs-8 text-gray-500 mb-1 d-block text-uppercase'>Category</label>}
                    <select
                      className='form-select form-select-solid form-select-sm'
                      value={item.category_id}
                      onChange={e => updateGrpItem(i, 'category_id', e.target.value)}
                    >
                      <option value=''>Select category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className='col-md-3'>
                    {i === 0 && <label className='fw-semibold fs-8 text-gray-500 mb-1 d-block text-uppercase'>Amount (₹)</label>}
                    <input
                      type='number' min='0'
                      className='form-control form-control-solid form-control-sm'
                      placeholder='0'
                      value={item.amount}
                      onChange={e => updateGrpItem(i, 'amount', e.target.value)}
                    />
                  </div>
                  <div className='col-md-3'>
                    {i === 0 && <label className='fw-semibold fs-8 text-gray-500 mb-1 d-block text-uppercase'>Frequency</label>}
                    <select
                      className='form-select form-select-solid form-select-sm'
                      value={item.frequency}
                      onChange={e => updateGrpItem(i, 'frequency', e.target.value)}
                    >
                      {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className='col-md-1 d-flex justify-content-center'>
                    {grpItems.length > 1 && (
                      <button
                        className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                        type='button' onClick={() => removeGrpItem(i)}
                      >
                        <i className='ki-duotone ki-minus fs-4'><span className='path1' /></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className='border-top border-gray-200 py-4 px-6'>
          <Button variant='light' onClick={() => setShowGrpModal(false)} disabled={grpSaving} className='btn-sm'>
            Cancel
          </Button>
          <Button variant='primary' onClick={saveGrp} disabled={grpSaving} className='btn-sm'>
            {grpSaving
              ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</>
              : 'Save Group'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Allocation Modal ── */}
      <Modal show={showAllocModal} onHide={() => !allocSaving && setShowAllocModal(false)} centered>
        <Modal.Header closeButton className='border-bottom border-gray-200 py-4 px-6'>
          <Modal.Title className='fw-bold text-gray-800 fs-5'>
            Allocate Fee Group to Class
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-6'>
          {allocSaveError && (
            <Alert variant='danger' dismissible onClose={() => setAllocSaveError(null)} className='py-3 fs-7'>
              {allocSaveError}
            </Alert>
          )}
          <div className='mb-5'>
            <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Fee Group</label>
            <select
              className='form-select form-select-solid'
              value={allocForm.fee_group_id}
              onChange={e => setAllocForm(p => ({ ...p, fee_group_id: e.target.value }))}
            >
              <option value=''>Select fee group...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Class</label>
            <select
              className='form-select form-select-solid'
              value={allocForm.class_id}
              onChange={e => setAllocForm(p => ({ ...p, class_id: e.target.value }))}
            >
              <option value=''>Select class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className='mb-2'>
            <label className='required fw-semibold fs-7 text-gray-700 mb-2 d-block'>Academic Session</label>
            <select
              className='form-select form-select-solid'
              value={allocForm.academic_session_id}
              onChange={e => setAllocForm(p => ({ ...p, academic_session_id: e.target.value }))}
            >
              <option value=''>Select session...</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_year}{s.is_current ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-top border-gray-200 py-4 px-6'>
          <Button variant='light' onClick={() => setShowAllocModal(false)} disabled={allocSaving} className='btn-sm'>
            Cancel
          </Button>
          <Button variant='primary' onClick={saveAlloc} disabled={allocSaving} className='btn-sm'>
            {allocSaving
              ? <><span className='spinner-border spinner-border-sm me-2' />Allocating...</>
              : 'Allocate'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const StructureWrapper: FC = () => (
  <>
    <PageTitle
      breadcrumbs={[
        { title: 'Fees', path: '/fees/structure', isActive: false },
        { title: 'Structure', path: '/fees/structure', isActive: true },
      ]}
    >
      Fee Structure
    </PageTitle>
    <StructurePage />
  </>
)

export { StructureWrapper }