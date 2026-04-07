import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import axios from 'axios'
import { useAuth } from '../auth'

import {
  NoticeStatus, TargetType, Priority, Category,
  NoticeModel, NoticeStats, NoticePayload
} from './core/_models'
import {
  getNotices, getNoticeStats, createNotice, updateNotice,
  publishNotice, pinNotice, archiveNotice, deleteNotice, markNoticeRead
} from './core/_requests'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NoticeForm {
  title: string
  content: string
  category: Category
  priority: Priority
  target_type: TargetType
  status: NoticeStatus
  publish_at: string
  expires_at: string
  attachment_url: string
}

const EMPTY_FORM: NoticeForm = {
  title: '', content: '', category: 'GENERAL', priority: 'NORMAL',
  target_type: 'ALL', status: 'DRAFT', publish_at: '', expires_at: '', attachment_url: ''
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────
const StatusBadge: FC<{ status: NoticeStatus }> = ({ status }) => {
  const map: Record<NoticeStatus, string> = {
    DRAFT: 'badge-light text-gray-600',
    PUBLISHED: 'badge-light-primary text-primary',
    ARCHIVED: 'badge-light text-muted',
  }
  return <span className={`badge fw-semibold ${map[status]}`}>{status}</span>
}

const PriorityDot: FC<{ priority: Priority }> = ({ priority }) => {
  return (
    <span className='fw-semibold text-gray-700 fs-7'>
      {priority}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const NoticeBoardPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = currentUser?.schoolId || ''

  // ── State ──────────────────────────────────────────────────────────────────
  const [notices, setNotices] = useState<NoticeModel[]>([])
  const [stats, setStats] = useState<NoticeStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeModel | null>(null)
  const [detailNotice, setDetailNotice] = useState<NoticeModel | null>(null)
  const [form, setForm] = useState<NoticeForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchNotices = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterCategory) params.category = filterCategory
      const { data } = await getNotices(schoolId, params)
      setNotices(data.notices || (data as any).data || [])
    } catch (e: any) {
      setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to load notices' })
    } finally { setLoading(false) }
  }, [schoolId, filterStatus, filterCategory])

  const fetchStats = useCallback(async () => {
    if (!schoolId) return
    try {
      const { data } = await getNoticeStats(schoolId)
      setStats(data.data || null)
    } catch { }
  }, [schoolId])

  useEffect(() => { fetchNotices(); fetchStats() }, [fetchNotices, fetchStats])

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingNotice(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (n: NoticeModel) => {
    setEditingNotice(n)
    setForm({
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      target_type: n.target_type,
      status: n.status,
      publish_at: n.publish_at ? n.publish_at.slice(0, 16) : '',
      expires_at: n.expires_at ? n.expires_at.slice(0, 16) : '',
      attachment_url: n.attachment_url || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setMsg({ type: 'danger', text: 'Title and content are required.' }); return
    }
    setSaving(true)
    try {
      const payload: NoticePayload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        priority: form.priority,
        target_audience: form.target_type,
        status: form.status,
      }
      if (form.publish_at) payload.publish_date = new Date(form.publish_at).toISOString()
      if (form.expires_at) payload.expiry_date = new Date(form.expires_at).toISOString()
      if (form.attachment_url) payload.attachment_url = form.attachment_url

      if (editingNotice) {
        await updateNotice(schoolId, editingNotice.id, payload)
        setMsg({ type: 'success', text: 'Notice updated successfully!' })
      } else {
        await createNotice(schoolId, payload)
        setMsg({ type: 'success', text: 'Notice created successfully!' })
      }
      setShowModal(false)
      fetchNotices(); fetchStats()
    } catch (e: any) {
      setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to save notice' })
    } finally { setSaving(false) }
    setTimeout(() => setMsg(null), 4000)
  }

  const handlePublish = async (id: number) => {
    setActionLoading(id)
    try {
      await publishNotice(schoolId, id)
      setMsg({ type: 'success', text: 'Notice published!' })
      fetchNotices(); fetchStats()
    } catch (e: any) {
      setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to publish' })
    } finally { setActionLoading(null) }
    setTimeout(() => setMsg(null), 3000)
  }

  const handlePin = async (id: number) => {
    setActionLoading(id)
    try {
      await pinNotice(schoolId, id)
      fetchNotices()
    } catch { } finally { setActionLoading(null) }
  }

  const handleArchive = async (id: number) => {
    setActionLoading(id)
    try {
      await archiveNotice(schoolId, id)
      fetchNotices(); fetchStats()
    } catch { } finally { setActionLoading(null) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this notice permanently?')) return
    setActionLoading(id)
    try {
      await deleteNotice(schoolId, id)
      setMsg({ type: 'success', text: 'Notice deleted.' })
      fetchNotices(); fetchStats()
    } catch (e: any) {
      setMsg({ type: 'danger', text: 'Failed to delete notice.' })
    } finally { setActionLoading(null) }
    setTimeout(() => setMsg(null), 3000)
  }

  const openDetail = async (n: NoticeModel) => {
    setDetailNotice(n)
    setShowDetailModal(true)
    // Mark as read
    try { await markNoticeRead(schoolId, n.id) } catch { }
  }

  // ── Filtered notices ────────────────────────────────────────────────────────
  const filtered = notices.filter(n => {
    const q = search.toLowerCase()
    return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  })

  const pinnedNotices = filtered.filter(n => n.is_pinned)
  const unpinnedNotices = filtered.filter(n => !n.is_pinned)
  const sortedNotices = [...pinnedNotices, ...unpinnedNotices]

  return (
    <>
      <Content>
        {/* ── Global Message ── */}
        {msg && (
          <div className={`alert alert-${msg.type} d-flex align-items-center mb-5`}>
            <i className={`bi ${msg.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-3 fs-5`}></i>
            <span>{msg.text}</span>
          </div>
        )}

        {/* ── Stats Row ── */}
        {stats && (
          <div className='row g-4 mb-6'>
            {[
              { label: 'Total', value: stats.total, icon: 'bi-journal-text' },
              { label: 'Published', value: stats.published, icon: 'bi-broadcast' },
              { label: 'Draft', value: stats.draft, icon: 'bi-file-earmark' },
              { label: 'Archived', value: stats.archived, icon: 'bi-archive' },
            ].map(stat => (
              <div className='col-6 col-md-3' key={stat.label}>
                <div className='card card-flush border-0 shadow-sm h-100'>
                  <div className='card-body d-flex align-items-center gap-4 py-4'>
                    <div className='symbol symbol-40px'>
                      <span className='symbol-label bg-light-primary'>
                        <i className={`bi ${stat.icon} text-primary fs-4`}></i>
                      </span>
                    </div>
                    <div>
                      <div className='fw-bold fs-2 text-gray-800'>{stat.value}</div>
                      <div className='text-muted fw-semibold fs-7'>{stat.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Card ── */}
        <div className='card card-flush shadow-sm'>
          {/* Header */}
          <div className='card-header border-0 pt-6'>
            <div className='card-title flex-column gap-1'>
              <h3 className='fw-bold mb-0'>Notice Board</h3>
              <span className='text-muted fs-7'>{filtered.length} notices</span>
            </div>
            
            <div className='card-toolbar'>
              <div className='d-flex align-items-center gap-2 gap-lg-3 flex-wrap'>
                {/* Search */}
                <div className='d-flex align-items-center position-relative my-1'>
                  <i className='bi bi-search position-absolute ms-3 text-muted'></i>
                  <input
                    className='form-control form-control-sm form-control-solid ps-10 w-150px w-md-200px'
                    placeholder='Search notices...'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {/* Category filter */}
                <select
                  className='form-select form-select-sm form-select-solid w-150px my-1'
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value=''>All Categories</option>
                  {(['GENERAL','EXAM','HOLIDAY','EVENT','FEE','MEETING','CIRCULAR'] as Category[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className='d-flex align-items-center bg-light rounded p-1 mx-2'>
                  <button
                    className={`btn btn-sm btn-icon ${viewMode === 'grid' ? 'btn-white shadow-sm' : 'btn-color-gray-600'}`}
                    onClick={() => setViewMode('grid')}
                    title='Grid View'
                  >
                    <i className='bi bi-grid-fill'></i>
                  </button>
                  <button
                    className={`btn btn-sm btn-icon ${viewMode === 'list' ? 'btn-white shadow-sm' : 'btn-color-gray-600'}`}
                    onClick={() => setViewMode('list')}
                    title='List View'
                  >
                    <i className='bi bi-list-task'></i>
                  </button>
                </div>

                {/* New Notice */}
                <button className='btn btn-sm btn-primary my-1' onClick={openCreate}>
                  <i className='bi bi-plus-lg'></i> New Notice
                </button>
              </div>
            </div>
          </div>

          <div className='card-body pt-0'>
            {/* Status Tabs */}
            <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-6 fw-bold mb-8'>
              <li className='nav-item'>
                <a className={`nav-link text-active-primary cursor-pointer ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>
                  All
                </a>
              </li>
              <li className='nav-item'>
                <a className={`nav-link text-active-primary cursor-pointer ${filterStatus === 'PUBLISHED' ? 'active' : ''}`} onClick={() => setFilterStatus('PUBLISHED')}>
                  Published
                </a>
              </li>
              <li className='nav-item'>
                <a className={`nav-link text-active-primary cursor-pointer ${filterStatus === 'DRAFT' ? 'active' : ''}`} onClick={() => setFilterStatus('DRAFT')}>
                  Drafts
                </a>
              </li>
              <li className='nav-item'>
                <a className={`nav-link text-active-primary cursor-pointer ${filterStatus === 'ARCHIVED' ? 'active' : ''}`} onClick={() => setFilterStatus('ARCHIVED')}>
                  Archived
                </a>
              </li>
            </ul>

            {loading ? (
              <div className='text-center py-14'>
                <div className='spinner-border text-primary mb-3'></div>
                <div className='text-muted'>Loading notices...</div>
              </div>
            ) : sortedNotices.length === 0 ? (
              <div className='text-center py-14'>
                <i className='bi bi-journal-x text-muted fs-1 d-block mb-3'></i>
                <div className='text-muted fw-semibold'>No notices found.</div>
                <button className='btn btn-sm btn-primary mt-4' onClick={openCreate}>
                  Create First Notice
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* ── LIST VIEW ── */
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8 border-0'>
                      <th style={{ width: 40 }}></th>
                      <th className='min-w-250px'>Title</th>
                      <th style={{ width: 110 }}>Category</th>
                      <th style={{ width: 110 }}>Priority</th>
                      <th style={{ width: 110 }}>Target</th>
                      <th style={{ width: 110 }}>Status</th>
                      <th style={{ width: 110 }}>Published</th>
                      <th className='text-end' style={{ width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNotices.map(n => (
                      <tr key={n.id} className={n.is_pinned ? 'bg-light-primary' : ''}>
                        {/* Pin indicator */}
                        <td className='ps-2'>
                          {n.is_pinned && (
                            <i className='bi bi-pin-fill text-primary fs-6' title='Pinned'></i>
                          )}
                        </td>

                        {/* Title */}
                        <td>
                          <div
                            className='fw-bold text-gray-800 cursor-pointer hover-text-primary'
                            style={{ cursor: 'pointer' }}
                            onClick={() => openDetail(n)}
                          >
                            {n.title}
                          </div>
                          <div className='text-muted fs-8 mt-1 text-truncate' style={{ maxWidth: 320 }}>
                            {n.content.slice(0, 100)}{n.content.length > 100 ? '…' : ''}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className='badge badge-light fw-semibold text-gray-600 text-uppercase fs-9'>
                            {n.category}
                          </span>
                        </td>

                        {/* Priority */}
                        <td><PriorityDot priority={n.priority} /></td>

                        {/* Target */}
                        <td>
                          <span className='badge badge-light-primary fw-semibold fs-9'>{n.target_type}</span>
                        </td>

                        {/* Status */}
                        <td><StatusBadge status={n.status} /></td>

                        {/* Published At */}
                        <td className='text-muted fs-8'>
                          {n.publish_at
                            ? new Date(n.publish_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className='text-end'>
                          <div className='d-flex justify-content-end align-items-center gap-1'>
                            {actionLoading === n.id
                              ? <span className='spinner-border spinner-border-sm text-primary'></span>
                              : <>
                                  {/* Publish */}
                                  {n.status === 'DRAFT' && (
                                    <button
                                      className='btn btn-icon btn-sm btn-light-primary'
                                      title='Publish'
                                      onClick={() => handlePublish(n.id)}
                                    >
                                      <i className='bi bi-broadcast fs-6'></i>
                                    </button>
                                  )}
                                  {/* Pin / Unpin */}
                                  <button
                                    className={`btn btn-icon btn-sm ${n.is_pinned ? 'btn-primary' : 'btn-light'}`}
                                    title={n.is_pinned ? 'Unpin' : 'Pin'}
                                    onClick={() => handlePin(n.id)}
                                  >
                                    <i className='bi bi-pin fs-6'></i>
                                  </button>
                                  {/* Edit */}
                                  <button
                                    className='btn btn-icon btn-sm btn-light-primary'
                                    title='Edit'
                                    onClick={() => openEdit(n)}
                                  >
                                    <i className='bi bi-pencil fs-6'></i>
                                  </button>
                                  {/* Archive */}
                                  {n.status === 'PUBLISHED' && (
                                    <button
                                      className='btn btn-icon btn-sm btn-light'
                                      title='Archive'
                                      onClick={() => handleArchive(n.id)}
                                    >
                                      <i className='bi bi-archive fs-6'></i>
                                    </button>
                                  )}
                                  {/* Delete */}
                                  <button
                                    className='btn btn-icon btn-sm btn-light-danger'
                                    title='Delete'
                                    onClick={() => handleDelete(n.id)}
                                  >
                                    <i className='bi bi-trash fs-6'></i>
                                  </button>
                                </>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ── GRID VIEW ── */
              <div className='row g-6'>
                {sortedNotices.map(n => (
                  <div key={n.id} className='col-md-6 col-lg-4'>
                    <div className='card card-flush h-100 border border-gray-300 hover-elevate-up'>
                      <div className='card-header pt-4 pb-2 px-5 min-h-0'>
                        <div className='d-flex align-items-center'>
                          {n.is_pinned && <i className='bi bi-pin-fill text-primary fs-5 me-2'></i>}
                          <StatusBadge status={n.status} />
                        </div>
                        <div className='card-toolbar'>
                          <span className='badge badge-light-primary fw-bold text-uppercase fs-9'>{n.category}</span>
                        </div>
                      </div>
                      <div className='card-body px-5 py-3 cursor-pointer' onClick={() => openDetail(n)}>
                        <h4 className='fw-bold text-gray-800 text-hover-primary mb-3'>{n.title}</h4>
                        <div className='text-gray-600 fs-7 mb-4 text-truncate' style={{ maxHeight: '42px', whiteSpace: 'normal', overflow: 'hidden' }}>
                          {n.content}
                        </div>
                        <div className='d-flex align-items-center justify-content-between mb-2'>
                          <span className='text-muted fs-8'>
                            <i className='bi bi-people me-1'></i> {n.target_type}
                          </span>
                          <PriorityDot priority={n.priority} />
                        </div>
                        <div className='text-muted fs-8'>
                          <i className='bi bi-calendar-event me-1'></i>
                          {n.publish_at ? new Date(n.publish_at).toLocaleDateString() : 'Unpublished'}
                        </div>
                      </div>
                      <div className='card-footer px-5 py-3 border-top d-flex justify-content-end gap-2'>
                        {actionLoading === n.id ? (
                          <span className='spinner-border spinner-border-sm text-primary mx-4'></span>
                        ) : (
                          <>
                            {n.status === 'DRAFT' && (
                              <button className='btn btn-icon btn-sm btn-light-primary' title='Publish' onClick={() => handlePublish(n.id)}>
                                <i className='bi bi-broadcast'></i>
                              </button>
                            )}
                            <button className={`btn btn-icon btn-sm ${n.is_pinned ? 'btn-primary' : 'btn-light'}`} title={n.is_pinned ? 'Unpin' : 'Pin'} onClick={() => handlePin(n.id)}>
                              <i className='bi bi-pin'></i>
                            </button>
                            <button className='btn btn-icon btn-sm btn-light-primary' title='Edit' onClick={() => openEdit(n)}>
                              <i className='bi bi-pencil'></i>
                            </button>
                            {n.status === 'PUBLISHED' && (
                              <button className='btn btn-icon btn-sm btn-light' title='Archive' onClick={() => handleArchive(n.id)}>
                                <i className='bi bi-archive'></i>
                              </button>
                            )}
                            <button className='btn btn-icon btn-sm btn-light-danger' title='Delete' onClick={() => handleDelete(n.id)}>
                              <i className='bi bi-trash'></i>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* ══════════════════ CREATE / EDIT MODAL ══════════════════ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' centered>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title className='fw-bold fs-4'>
            {editingNotice ? 'Edit Notice' : 'Create New Notice'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='pt-4'>
          <form id='notice-form' onSubmit={handleSave}>
            <div className='row g-5'>
              {/* Title */}
              <div className='col-12'>
                <label className='form-label fw-semibold required'>Title</label>
                <input
                  className='form-control form-control-solid'
                  placeholder='Notice title...'
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              {/* Content */}
              <div className='col-12'>
                <label className='form-label fw-semibold required'>Content</label>
                <textarea
                  className='form-control form-control-solid'
                  rows={8}
                  placeholder='Write notice content here...'
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  required
                />
              </div>

              {/* Category + Priority */}
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Category</label>
                <select
                  className='form-select form-select-solid'
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}
                >
                  {(['GENERAL','EXAM','HOLIDAY','EVENT','FEE','MEETING','CIRCULAR'] as Category[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Priority</label>
                <select
                  className='form-select form-select-solid'
                  value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}
                >
                  {(['LOW','NORMAL','HIGH','URGENT'] as Priority[]).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Target Audience + Status */}
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Target Audience</label>
                <select
                  className='form-select form-select-solid'
                  value={form.target_type}
                  onChange={e => setForm(p => ({ ...p, target_type: e.target.value as TargetType }))}
                >
                  {(['ALL','STAFF','STUDENTS','PARENTS','CLASS','SECTION'] as TargetType[]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Status</label>
                <select
                  className='form-select form-select-solid'
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as NoticeStatus }))}
                >
                  <option value='DRAFT'>Draft</option>
                  <option value='PUBLISHED'>Published</option>
                </select>
              </div>

              {/* Publish Date + Expiry Date */}
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Publish Date (optional)</label>
                <input
                  type='datetime-local'
                  className='form-control form-control-solid'
                  value={form.publish_at}
                  onChange={e => setForm(p => ({ ...p, publish_at: e.target.value }))}
                />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold'>Expiry Date (optional)</label>
                <input
                  type='datetime-local'
                  className='form-control form-control-solid'
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                />
              </div>

              {/* Attachment URL */}
              <div className='col-12'>
                <label className='form-label fw-semibold'>Attachment URL (optional)</label>
                <input
                  className='form-control form-control-solid'
                  placeholder='https://...'
                  value={form.attachment_url}
                  onChange={e => setForm(p => ({ ...p, attachment_url: e.target.value }))}
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className='border-0 pt-0'>
          <button className='btn btn-light fw-semibold' onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </button>
          <button className='btn btn-primary fw-semibold' form='notice-form' type='submit' disabled={saving}>
            {saving
              ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</>
              : (editingNotice ? 'Update Notice' : 'Create Notice')
            }
          </button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════ DETAIL VIEW MODAL ══════════════════ */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size='lg' centered>
        {detailNotice && (
          <>
            <Modal.Header closeButton className='border-0 pb-0 align-items-start'>
              <div className='flex-grow-1 pe-4'>
                <div className='d-flex align-items-center gap-2 mb-2 flex-wrap'>
                  <StatusBadge status={detailNotice.status} />
                  <span className='badge badge-light fw-semibold text-gray-600 text-uppercase fs-9'>{detailNotice.category}</span>
                  <PriorityDot priority={detailNotice.priority} />
                  {detailNotice.is_pinned && (
                    <span className='badge badge-light-primary'><i className='bi bi-pin-fill me-1'></i>Pinned</span>
                  )}
                </div>
                <Modal.Title className='fw-bold fs-3 text-gray-900'>{detailNotice.title}</Modal.Title>
                <div className='text-muted fs-7 mt-1'>
                  Created by <strong>{detailNotice.created_by_role}</strong>
                  {detailNotice.publish_at && (
                    <> · Published {new Date(detailNotice.publish_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                  )}
                  {detailNotice.expires_at && (
                    <> · Expires {new Date(detailNotice.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                  )}
                  <> · <i className='bi bi-eye me-1'></i>{detailNotice.view_count} views</>
                </div>
              </div>
            </Modal.Header>
            <Modal.Body>
              <div className='separator mb-6'></div>
              <div className='text-gray-700 fs-6 lh-lg' style={{ whiteSpace: 'pre-wrap' }}>
                {detailNotice.content}
              </div>
              {detailNotice.attachment_url && (
                <div className='mt-6 pt-4 border-top'>
                  <a
                    href={detailNotice.attachment_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn btn-sm btn-light-primary'
                  >
                    <i className='bi bi-paperclip me-2'></i>View Attachment
                  </a>
                </div>
              )}
              {detailNotice.target_type !== 'ALL' && (
                <div className='mt-4 p-4 bg-light rounded-2'>
                  <span className='text-muted fs-7 fw-semibold'>
                    <i className='bi bi-people me-2'></i>Targeted to: <strong>{detailNotice.target_type}</strong>
                  </span>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className='border-0 pt-0'>
              <button className='btn btn-light fw-semibold' onClick={() => setShowDetailModal(false)}>Close</button>
              {detailNotice.status === 'DRAFT' && (
                <button
                  className='btn btn-primary fw-semibold'
                  onClick={() => { handlePublish(detailNotice.id); setShowDetailModal(false) }}
                >
                  <i className='bi bi-broadcast me-2'></i>Publish Now
                </button>
              )}
              <button
                className='btn btn-light-primary fw-semibold'
                onClick={() => { openEdit(detailNotice); setShowDetailModal(false) }}
              >
                <i className='bi bi-pencil me-2'></i>Edit
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  )
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const noticeBreadcrumbs = [
  { title: 'Communication', path: '/communication', isActive: false, isSeparator: false },
]

const NoticeBoardWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={noticeBreadcrumbs}>
      Notice Board
    </PageTitle>
    <NoticeBoardPage />
  </>
)

export { NoticeBoardWrapper }
