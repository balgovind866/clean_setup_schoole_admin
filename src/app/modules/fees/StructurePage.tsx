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
import {
  FeeCategoryModel, FeeGroupModel, FeeAllocationModel,
} from './core/_models'

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUALLY: 'Annually', ONE_TIME: 'One Time',
}

// ─── Fee Structure Page ───────────────────────────────────────────────────────
const StructurePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<'categories' | 'groups' | 'allocations'>('categories')

  // ── Categories State ────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<FeeCategoryModel[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editCat, setEditCat] = useState<FeeCategoryModel | null>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '', default_amount: '', is_active: true })
  const [catSaving, setCatSaving] = useState(false)
  const [catSaveError, setCatSaveError] = useState<string | null>(null)
  const [catSuccess, setCatSuccess] = useState<string | null>(null)

  // ── Groups State ────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<FeeGroupModel[]>([])
  const [grpLoading, setGrpLoading] = useState(false)
  const [grpError, setGrpError] = useState<string | null>(null)
  const [showGrpModal, setShowGrpModal] = useState(false)
  const [editGrp, setEditGrp] = useState<FeeGroupModel | null>(null)
  const [grpForm, setGrpForm] = useState({ name: '', description: '' })
  const [grpItems, setGrpItems] = useState<Array<{ category_id: string; amount: string; frequency: string }>>([
    { category_id: '', amount: '', frequency: 'MONTHLY' }
  ])
  const [grpSaving, setGrpSaving] = useState(false)
  const [grpSaveError, setGrpSaveError] = useState<string | null>(null)
  const [grpSuccess, setGrpSuccess] = useState<string | null>(null)
  const [grpLoadingDetail, setGrpLoadingDetail] = useState(false)

  // ── Allocations State ───────────────────────────────────────────────────────
  const [allocations, setAllocations] = useState<FeeAllocationModel[]>([])
  const [allocLoading, setAllocLoading] = useState(false)
  const [allocError, setAllocError] = useState<string | null>(null)
  const [showAllocModal, setShowAllocModal] = useState(false)
  const [allocForm, setAllocForm] = useState({ fee_group_id: '', class_id: '', academic_session_id: '' })
  const [allocSaving, setAllocSaving] = useState(false)
  const [allocSaveError, setAllocSaveError] = useState<string | null>(null)
  const [allocSuccess, setAllocSuccess] = useState<string | null>(null)

  // ── Meta (classes + sessions) ───────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  // ── Robust array extractor — handles both direct array and nested-key shapes ──
  // e.g. data.data = [] OR data.data = { categories: [], ... }
  const extractArray = (raw: any, ...hints: string[]): any[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'object') {
      // Try hint keys first
      for (const key of hints) {
        if (Array.isArray(raw[key])) return raw[key]
      }
      // Try any key that contains an array
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) return raw[key]
      }
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

  // ── Load Categories ─────────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    if (!schoolId) return
    setCatLoading(true); setCatError(null)
    try {
      const { data } = await getFeeCategories(schoolId)
      if (data.success) {
        setCategories(extractArray(data.data, 'categories', 'fee_categories', 'data'))
      } else {
        setCatError(data.message || 'Failed to load categories')
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.statusText || e.message || 'Failed to load categories'
      setCatError(`Error: ${msg} (${e.response?.status || 'network'})`)
    } finally { setCatLoading(false) }
  }, [schoolId])

  // ── Load Groups ─────────────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    if (!schoolId) return
    setGrpLoading(true); setGrpError(null)
    try {
      const { data } = await getFeeGroups(schoolId)
      if (data.success) {
        setGroups(extractArray(data.data, 'groups', 'fee_groups', 'data'))
      } else {
        setGrpError(data.message || 'Failed to load fee groups')
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.statusText || e.message || 'Failed to load groups'
      setGrpError(`Error: ${msg} (${e.response?.status || 'network'})`)
    } finally { setGrpLoading(false) }
  }, [schoolId])

  // ── Load Allocations ────────────────────────────────────────────────────────
  const loadAllocations = useCallback(async () => {
    if (!schoolId) return
    setAllocLoading(true); setAllocError(null)
    try {
      const { data } = await getFeeAllocations(schoolId)
      if (data.success) {
        setAllocations(extractArray(data.data, 'allocations', 'fee_allocations', 'data'))
      } else {
        setAllocError(data.message || 'Failed to load allocations')
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.statusText || e.message || 'Failed to load allocations'
      // 404 = endpoint not yet implemented on backend
      if (e.response?.status === 404) {
        setAllocError(`API endpoint not found (404). Backend GET /fees/allocations may not be implemented yet.`)
      } else {
        setAllocError(`Error ${e.response?.status || ''}: ${msg}`)
      }
    } finally { setAllocLoading(false) }
  }, [schoolId])

  useEffect(() => {
    loadCategories()
    loadGroups()
    loadAllocations()
  }, [loadCategories, loadGroups, loadAllocations])

  // ── Category CRUD ───────────────────────────────────────────────────────────
  const openCatModal = (cat?: FeeCategoryModel) => {
    setEditCat(cat || null)
    setCatForm(cat ? { name: cat.name, description: cat.description || '', default_amount: cat.default_amount, is_active: cat.is_active } : { name: '', description: '', default_amount: '', is_active: true })
    setCatSaveError(null); setShowCatModal(true)
  }

  const saveCat = async () => {
    if (!catForm.name || !catForm.default_amount) { setCatSaveError('Name and amount are required'); return }
    setCatSaving(true); setCatSaveError(null)
    try {
      const payload = { name: catForm.name, description: catForm.description, default_amount: Number(catForm.default_amount), is_active: catForm.is_active }
      if (editCat) { await updateFeeCategory(schoolId, editCat.id, payload) }
      else { await createFeeCategory(schoolId, payload) }
      setShowCatModal(false)
      setCatSuccess(editCat ? 'Category updated!' : 'Category created!')
      setTimeout(() => setCatSuccess(null), 3000)
      loadCategories()
    } catch (e: any) {
      setCatSaveError(e.response?.data?.message || 'Save failed')
    } finally { setCatSaving(false) }
  }

  const deleteCat = async (id: number) => {
    if (!window.confirm('Delete this fee category?')) return
    try { await deleteFeeCategory(schoolId, id); loadCategories() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Group CRUD ──────────────────────────────────────────────────────────────
  const openGrpModal = async (grp?: FeeGroupModel) => {
    setGrpSaveError(null)
    if (!grp) {
      // CREATE mode — clear form
      setEditGrp(null)
      setGrpForm({ name: '', description: '' })
      setGrpItems([{ category_id: '', amount: '', frequency: 'MONTHLY' }])
      setShowGrpModal(true)
      return
    }
    // EDIT mode — fetch full details to get fee_group_types with category amounts
    setEditGrp(grp)
    setGrpForm({ name: grp.name, description: grp.description || '' })
    setGrpItems([{ category_id: '', amount: '', frequency: 'MONTHLY' }]) // default while loading
    setShowGrpModal(true)
    setGrpLoadingDetail(true)
    try {
      const { data } = await getFeeGroupById(schoolId, grp.id)
      const fullGrp = data.success ? (data.data as any) : null
      const types = fullGrp?.fee_group_types || grp.fee_group_types || []
      if (types.length > 0) {
        setGrpItems(
          types.map((t: any) => ({
            category_id: String(t.fee_category_id ?? t.category_id ?? ''),
            amount: String(t.amount ?? ''),
            frequency: t.frequency ?? 'MONTHLY',
          }))
        )
      }
    } catch {
      // If single-group endpoint doesn't exist, keep using whatever fee_group_types we have
      const types = grp.fee_group_types || []
      if (types.length > 0) {
        setGrpItems(types.map(t => ({ category_id: String(t.fee_category_id), amount: t.amount, frequency: t.frequency })))
      }
    } finally {
      setGrpLoadingDetail(false)
    }
  }

  const addGrpItem = () => setGrpItems(prev => [...prev, { category_id: '', amount: '', frequency: 'MONTHLY' }])
  const removeGrpItem = (i: number) => setGrpItems(prev => prev.filter((_, idx) => idx !== i))
  const updateGrpItem = (i: number, field: string, value: string) =>
    setGrpItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const saveGrp = async () => {
    if (!grpForm.name) { setGrpSaveError('Group name is required'); return }
    const validItems = grpItems.filter(i => i.category_id && i.amount)
    if (validItems.length === 0) { setGrpSaveError('Add at least one fee category with amount'); return }
    setGrpSaving(true); setGrpSaveError(null)
    try {
      const payload = {
        name: grpForm.name,
        description: grpForm.description,
        categories: validItems.map(i => ({
          category_id: Number(i.category_id),
          amount: Number(i.amount),
          frequency: i.frequency as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME',
        }))
      }
      if (editGrp) {
        await updateFeeGroup(schoolId, editGrp.id, payload)
      } else {
        await createFeeGroup(schoolId, payload)
      }
      setShowGrpModal(false)
      setGrpSuccess(editGrp ? 'Group updated!' : 'Group created!')
      setTimeout(() => setGrpSuccess(null), 3000)
      loadGroups()
    } catch (e: any) {
      setGrpSaveError(e.response?.data?.message || 'Save failed')
    } finally { setGrpSaving(false) }
  }

  const deleteGrp = async (id: number) => {
    if (!window.confirm('Delete this fee group?')) return
    try { await deleteFeeGroup(schoolId, id); loadGroups() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  // ── Allocation CRUD ─────────────────────────────────────────────────────────
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
    } catch (e: any) {
      setAllocSaveError(e.response?.data?.message || 'Allocation failed')
    } finally { setAllocSaving(false) }
  }

  const deleteAlloc = async (id: number) => {
    if (!window.confirm('Remove this allocation?')) return
    try { await deleteFeeAllocation(schoolId, id); loadAllocations() }
    catch (e: any) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Page Header ── */}
        <div className='d-flex align-items-center justify-content-between mb-7'>
          <div>
            <h2 className='fw-bold text-gray-900 mb-1'>Fee Structure</h2>
            <span className='text-muted fs-6'>Define categories, build groups, and allocate to classes</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-5 fw-semibold mb-6'>
          {([['categories', 'ki-tag', 'Fee Categories'], ['groups', 'ki-layers', 'Fee Groups'], ['allocations', 'ki-routing', 'Class Allocations']] as const).map(([tab, icon, label]) => (
            <li key={tab} className='nav-item'>
              <a className={`nav-link text-active-primary pb-4 ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)} href='#' style={{ cursor: 'pointer' }}>
                <i className={`ki-duotone ${icon} fs-4 me-2`}><span className='path1' /><span className='path2' /></i>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ══════════════ TAB: CATEGORIES ══════════════ */}
        {activeTab === 'categories' && (
          <div className='card card-flush'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <h3 className='fw-bold m-0'>
                  <i className='ki-duotone ki-tag fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
                  Fee Categories
                </h3>
              </div>
              <div className='card-toolbar'>
                {catSuccess && <span className='badge badge-light-success me-3 fs-7'>{catSuccess}</span>}
                <button className='btn btn-primary btn-sm' onClick={() => openCatModal()}>
                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  Add Category
                </button>
              </div>
            </div>
            <div className='card-body pt-0'>
              {catError && <div className='alert alert-danger mb-4'>{catError}</div>}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Default Amount</th>
                      <th>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {catLoading ? (
                      <tr><td colSpan={6} className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                      </td></tr>
                    ) : categories.length === 0 ? (
                      <tr><td colSpan={6} className='text-center py-12'>
                        <div className='d-flex flex-column align-items-center'>
                          <i className='ki-duotone ki-tag fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                          <span className='text-gray-500'>No categories yet. Create your first fee category.</span>
                        </div>
                      </td></tr>
                    ) : categories.map((cat, i) => (
                      <tr key={cat.id}>
                        <td><span className='text-muted'>{i + 1}</span></td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <div className='symbol symbol-35px me-3 bg-light-primary rounded'>
                              <div className='symbol-label d-flex align-items-center justify-content-center'>
                                <i className='ki-duotone ki-tag fs-3 text-primary'><span className='path1' /><span className='path2' /></i>
                              </div>
                            </div>
                            <span className='fw-bold text-gray-800'>{cat.name}</span>
                          </div>
                        </td>
                        <td className='text-muted'>{cat.description || '—'}</td>
                        <td>
                          <span className='fw-bold text-success'>
                            ₹{Number(cat.default_amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-light-${cat.is_active ? 'success' : 'danger'}`}>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='text-end'>
                          <button className='btn btn-sm btn-icon btn-light btn-active-light-primary me-2'
                            title='Edit' onClick={() => openCatModal(cat)}>
                            <i className='ki-duotone ki-pencil fs-4'><span className='path1' /><span className='path2' /></i>
                          </button>
                          <button className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                            title='Delete' onClick={() => deleteCat(cat.id)}>
                            <i className='ki-duotone ki-trash fs-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
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

        {/* ══════════════ TAB: GROUPS ══════════════ */}
        {activeTab === 'groups' && (
          <div className='card card-flush'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <h3 className='fw-bold m-0'>
                  <i className='ki-duotone ki-layers fs-2 text-info me-2'><span className='path1' /><span className='path2' /></i>
                  Fee Groups
                </h3>
              </div>
              <div className='card-toolbar'>
                {grpSuccess && <span className='badge badge-light-success me-3 fs-7'>{grpSuccess}</span>}
                <button className='btn btn-info btn-sm' onClick={() => openGrpModal()}>
                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  New Group
                </button>
              </div>
            </div>
            <div className='card-body pt-0'>
              {grpError && <div className='alert alert-danger mb-4'>{grpError}</div>}
              {grpLoading ? (
                <div className='text-center py-12'>
                  <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                </div>
              ) : groups.length === 0 ? (
                <div className='text-center py-14'>
                  <i className='ki-duotone ki-layers fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                  <p className='text-gray-500 mt-3'>No fee groups yet. Create a group to bundle categories together.</p>
                </div>
              ) : (
                <div className='row g-5'>
                  {groups.map(grp => (
                    <div key={grp.id} className='col-md-6 col-xl-4'>
                      <div className='card card-bordered h-100'>
                        <div className='card-header border-0 pt-5'>
                          <div className='card-title d-flex align-items-center'>
                            <div className='symbol symbol-40px me-3 bg-light-info rounded'>
                              <div className='symbol-label d-flex align-items-center justify-content-center'>
                                <i className='ki-duotone ki-layers fs-2 text-info'><span className='path1' /><span className='path2' /></i>
                              </div>
                            </div>
                            <div>
                              <h5 className='fw-bold mb-0'>{grp.name}</h5>
                              <span className={`badge badge-light-${grp.is_active ? 'success' : 'warning'} fs-8 mt-1`}>
                                {grp.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className='card-toolbar'>
                            <button className='btn btn-sm btn-icon btn-light btn-active-light-primary me-1'
                              onClick={() => openGrpModal(grp)} title='Edit'>
                              <i className='ki-duotone ki-pencil fs-4'><span className='path1' /><span className='path2' /></i>
                            </button>
                            <button className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                              onClick={() => deleteGrp(grp.id)} title='Delete'>
                              <i className='ki-duotone ki-trash fs-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                            </button>
                          </div>
                        </div>
                        <div className='card-body pt-3'>
                          {grp.description && <p className='text-muted fs-7 mb-4'>{grp.description}</p>}
                          {grp.fee_group_types && grp.fee_group_types.length > 0 ? (
                            <div className='d-flex flex-column gap-2'>
                              {grp.fee_group_types.map(item => (
                                <div key={item.id} className='d-flex align-items-center justify-content-between bg-light-primary rounded px-3 py-2'>
                                  <div>
                                    <span className='fw-semibold text-gray-800 fs-7'>{item.fee_category?.name || `Category #${item.fee_category_id}`}</span>
                                    <span className='badge badge-light-primary ms-2 fs-8'>{FREQ_LABELS[item.frequency] || item.frequency}</span>
                                  </div>
                                  <span className='fw-bold text-primary fs-7'>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              <div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-gray-200'>
                                <span className='text-muted fs-7 fw-semibold'>Total</span>
                                <span className='fw-bolder text-success fs-6'>
                                  ₹{grp.fee_group_types.reduce((s, i) => s + Number(i.amount), 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className='text-muted fs-7 text-center py-3'>No categories assigned</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ALLOCATIONS ══════════════ */}
        {activeTab === 'allocations' && (
          <div className='card card-flush'>
            <div className='card-header align-items-center py-5'>
              <div className='card-title'>
                <h3 className='fw-bold m-0'>
                  <i className='ki-duotone ki-routing fs-2 text-warning me-2'><span className='path1' /><span className='path2' /></i>
                  Class Fee Allocations
                </h3>
              </div>
              <div className='card-toolbar'>
                {allocSuccess && <span className='badge badge-light-success me-3 fs-7'>{allocSuccess}</span>}
                <button className='btn btn-warning btn-sm' onClick={openAllocModal}>
                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                  Allocate to Class
                </button>
              </div>
            </div>
            <div className='card-body pt-0'>
              {allocError && (
                <div className='alert alert-danger d-flex align-items-start justify-content-between gap-3 mb-4'>
                  <div>
                    <div className='fw-bold mb-1'>Failed to load allocations</div>
                    <div className='fs-8 text-muted font-monospace'>{allocError}</div>
                    <div className='fs-8 text-muted mt-1'>Check browser console (F12) for the full error. Make sure the backend server is running.</div>
                  </div>
                  <button className='btn btn-sm btn-light-danger' onClick={loadAllocations}>Retry</button>
                </div>
              )}
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                  <thead>
                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                      <th>#</th>
                      <th>Fee Group</th>
                      <th>Class</th>
                      <th>Session</th>
                      <th>Section / Student</th>
                      <th>Status</th>
                      <th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {allocLoading ? (
                      <tr><td colSpan={7} className='text-center py-10'>
                        <span className='spinner-border spinner-border-sm text-primary me-2' />Loading...
                      </td></tr>
                    ) : allocations.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-12'>
                        <div className='d-flex flex-column align-items-center'>
                          <i className='ki-duotone ki-routing fs-3x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                          <span className='text-gray-500'>No allocations yet. Assign a fee group to a class.</span>
                        </div>
                      </td></tr>
                    ) : allocations.map((alloc, i) => (
                      <tr key={alloc.id}>
                        <td><span className='text-muted'>{i + 1}</span></td>
                        <td>
                          <span className='fw-bold text-gray-800'>
                            {alloc.fee_group?.name || `Group #${alloc.fee_group_id}`}
                          </span>
                        </td>
                        <td>
                          <span className='badge badge-light-info fw-bold'>
                            {alloc.class?.name || classes.find(c => c.id === alloc.class_id)?.name || `Class #${alloc.class_id}`}
                          </span>
                        </td>
                        <td className='text-muted'>
                          {sessions.find(s => s.id === alloc.academic_session_id)?.session_year || `Session #${alloc.academic_session_id}`}
                        </td>
                        <td className='text-muted'>
                          {alloc.section?.name ? `Section ${alloc.section.name}` : alloc.section_id ? `Section #${alloc.section_id}` : alloc.student_id ? `Student #${alloc.student_id}` : <span className='badge badge-light-primary'>All Students</span>}
                        </td>
                        <td>
                          <span className={`badge badge-light-${alloc.is_active ? 'success' : 'danger'}`}>
                            {alloc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='text-end'>
                          <button className='btn btn-sm btn-icon btn-light btn-active-light-danger'
                            onClick={() => deleteAlloc(alloc.id)} title='Remove'>
                            <i className='ki-duotone ki-trash fs-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
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
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-tag fs-2 text-primary me-2'><span className='path1' /><span className='path2' /></i>
            {editCat ? 'Edit Category' : 'New Fee Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {catSaveError && <Alert variant='danger' dismissible onClose={() => setCatSaveError(null)}>{catSaveError}</Alert>}
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Category Name</label>
            <input className='form-control form-control-solid' placeholder='e.g. Tuition Fee'
              value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className='mb-5'>
            <label className='fw-semibold fs-6 mb-2'>Description</label>
            <input className='form-control form-control-solid' placeholder='Optional description'
              value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Default Amount (₹)</label>
            <input type='number' min='0' className='form-control form-control-solid' placeholder='e.g. 2500'
              value={catForm.default_amount} onChange={e => setCatForm(p => ({ ...p, default_amount: e.target.value }))} />
          </div>
          <div className='d-flex align-items-center gap-3'>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' checked={catForm.is_active}
                onChange={e => setCatForm(p => ({ ...p, is_active: e.target.checked }))} />
              <label className='form-check-label fw-semibold'>Active</label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowCatModal(false)} disabled={catSaving}>Cancel</Button>
          <Button variant='primary' onClick={saveCat} disabled={catSaving}>
            {catSaving ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</> : 'Save Category'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Group Modal ── */}
      <Modal show={showGrpModal} onHide={() => !grpSaving && setShowGrpModal(false)} centered size='lg'>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-layers fs-2 text-info me-2'><span className='path1' /><span className='path2' /></i>
            {editGrp ? 'Edit Group' : 'New Fee Group'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {grpSaveError && <Alert variant='danger' dismissible onClose={() => setGrpSaveError(null)}>{grpSaveError}</Alert>}
          <div className='row g-5 mb-5'>
            <div className='col-md-6'>
              <label className='required fw-semibold fs-6 mb-2'>Group Name</label>
              <input className='form-control form-control-solid' placeholder='e.g. Class 10 Fees'
                value={grpForm.name} onChange={e => setGrpForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className='col-md-6'>
              <label className='fw-semibold fs-6 mb-2'>Description</label>
              <input className='form-control form-control-solid' placeholder='Optional'
                value={grpForm.description} onChange={e => setGrpForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>

          <div className='separator mb-5' />
          <div className='d-flex align-items-center justify-content-between mb-4'>
            <div>
              <h6 className='fw-bold text-gray-700 mb-0'>Fee Categories</h6>
              {editGrp && <span className='text-muted fs-8'>Modify amounts and frequencies — all categories will be updated</span>}
            </div>
            <button className='btn btn-light-info btn-sm' type='button' onClick={addGrpItem}>
              <i className='ki-duotone ki-plus fs-5'><span className='path1' /><span className='path2' /><span className='path3' /></i>
              Add Category
            </button>
          </div>
          {grpItems.map((item, i) => (
            <div key={i} className='row g-3 mb-3 align-items-end'>
              <div className='col-md-5'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Category</label>
                <select className='form-select form-select-solid form-select-sm' value={item.category_id}
                  onChange={e => updateGrpItem(i, 'category_id', e.target.value)}>
                  <option value=''>Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Amount (₹)</label>
                <input type='number' min='0' className='form-control form-control-solid form-control-sm'
                  placeholder='Amount' value={item.amount}
                  onChange={e => updateGrpItem(i, 'amount', e.target.value)} />
              </div>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Frequency</label>
                <select className='form-select form-select-solid form-select-sm' value={item.frequency}
                  onChange={e => updateGrpItem(i, 'frequency', e.target.value)}>
                  {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className='col-md-1 d-flex justify-content-center'>
                {grpItems.length > 1 && (
                  <button className='btn btn-sm btn-icon btn-light btn-active-light-danger' type='button'
                    onClick={() => removeGrpItem(i)}>
                    <i className='ki-duotone ki-minus fs-4'><span className='path1' /></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowGrpModal(false)} disabled={grpSaving}>Cancel</Button>
          <Button variant='info' onClick={saveGrp} disabled={grpSaving}>
            {grpSaving ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</> : 'Save Group'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Allocation Modal ── */}
      <Modal show={showAllocModal} onHide={() => !allocSaving && setShowAllocModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title>
            <i className='ki-duotone ki-routing fs-2 text-warning me-2'><span className='path1' /><span className='path2' /></i>
            Allocate Fee Group to Class
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='py-6 px-10'>
          {allocSaveError && <Alert variant='danger' dismissible onClose={() => setAllocSaveError(null)}>{allocSaveError}</Alert>}
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Fee Group</label>
            <select className='form-select form-select-solid' value={allocForm.fee_group_id}
              onChange={e => setAllocForm(p => ({ ...p, fee_group_id: e.target.value }))}>
              <option value=''>Select fee group...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Class</label>
            <select className='form-select form-select-solid' value={allocForm.class_id}
              onChange={e => setAllocForm(p => ({ ...p, class_id: e.target.value }))}>
              <option value=''>Select class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className='mb-5'>
            <label className='required fw-semibold fs-6 mb-2'>Academic Session</label>
            <select className='form-select form-select-solid' value={allocForm.academic_session_id}
              onChange={e => setAllocForm(p => ({ ...p, academic_session_id: e.target.value }))}>
              <option value=''>Select session...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>)}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <Button variant='light' onClick={() => setShowAllocModal(false)} disabled={allocSaving}>Cancel</Button>
          <Button variant='warning' onClick={saveAlloc} disabled={allocSaving}>
            {allocSaving ? <><span className='spinner-border spinner-border-sm me-2' />Allocating...</> : 'Allocate'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const StructureWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Fees', path: '/fees/structure', isActive: false }, { title: 'Structure', path: '/fees/structure', isActive: true }]}>
      Fee Structure
    </PageTitle>
    <StructurePage />
  </>
)

export { StructureWrapper }
