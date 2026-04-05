import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getPeriodSlots, createPeriodSlot, updatePeriodSlot, deletePeriodSlot } from './core/_requests'
import { getAcademicSessions } from '../academic/core/_requests'
import { PeriodSlot } from './core/_models'
import { SessionModel } from '../academic/core/_models'
import { toast } from 'react-toastify'

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const emptyForm = {
  name: '',
  start_time: '',
  end_time: '',
  is_break: false,
  sort_order: 1,
  academic_session_id: 0,
}

const Periods: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [sessionId, setSessionId] = useState<number>(0)
  const [slots, setSlots] = useState<PeriodSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editSlot, setEditSlot] = useState<PeriodSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  // Load sessions
  useEffect(() => {
    if (!schoolId) return
    getAcademicSessions(schoolId, 1, 100)
      .then(res => {
        if (res.data.success) {
          const list = res.data.data.sessions || []
          setSessions(list)
          const cur = list.find(s => s.is_current) || list[0]
          if (cur) setSessionId(cur.id)
        }
      })
      .catch(() => {})
  }, [schoolId])

  // Load slots when session changes
  useEffect(() => {
    if (!schoolId || !sessionId) return
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, sessionId])

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const res = await getPeriodSlots(schoolId, sessionId)
      if (res.data.success) setSlots(res.data.data || [])
    } catch {
      toast.error('Failed to fetch period slots')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditSlot(null)
    setForm({ ...emptyForm, sort_order: (slots.length || 0) + 1, academic_session_id: sessionId })
    setShowModal(true)
  }

  const openEdit = (slot: PeriodSlot) => {
    setEditSlot(slot)
    setForm({
      name: slot.name,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_break: slot.is_break,
      sort_order: slot.sort_order,
      academic_session_id: slot.academic_session_id,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Name is required'); return }
    if (!form.start_time) { toast.warning('Start time is required'); return }
    if (!form.end_time) { toast.warning('End time is required'); return }
    setSaving(true)
    try {
      if (editSlot) {
        await updatePeriodSlot(schoolId, editSlot.id, { ...form })
        toast.success('Period slot updated!')
      } else {
        await createPeriodSlot(schoolId, { ...form, academic_session_id: sessionId })
        toast.success('Period slot created!')
      }
      setShowModal(false)
      fetchSlots()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slot: PeriodSlot) => {
    if (!window.confirm(`Delete "${slot.name}"?`)) return
    setDeleting(slot.id)
    try {
      await deletePeriodSlot(schoolId, slot.id)
      toast.success('Deleted!')
      fetchSlots()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const fmtTime = (t: string) => {
    if (!t) return '-'
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* Header Card */}
        <div className='card mb-5'>
          <div className='card-header align-items-center border-0'>
            <h3 className='card-title fw-bold'>
              <i className='ki-duotone ki-time fs-2 text-primary me-2'>
                <span className='path1'></span><span className='path2'></span>
              </i>
              Period Slots Management
            </h3>
            <div className='card-toolbar gap-3'>
              {/* Session Select */}
              <select
                className='form-select form-select-solid form-select-sm w-200px'
                value={sessionId}
                onChange={e => setSessionId(Number(e.target.value))}
              >
                <option value={0}>Select Session</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.session_year} {s.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <button className='btn btn-primary btn-sm' onClick={openCreate} disabled={!sessionId}>
                <i className='ki-duotone ki-plus fs-2'></i>
                Add Period / Break
              </button>
            </div>
          </div>
        </div>

        {/* Slots Table */}
        <div className='card'>
          <div className='card-body p-0'>
            {loading ? (
              <div className='text-center py-15'>
                <span className='spinner-border text-primary'></span>
              </div>
            ) : slots.length === 0 ? (
              <div className='text-center py-15'>
                <i className='ki-duotone ki-time fs-5x text-gray-300 mb-4 d-block'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <p className='text-muted fs-5'>No period slots found. Add your first period or break.</p>
                <button className='btn btn-primary btn-sm mt-2' onClick={openCreate}>
                  Add First Period
                </button>
              </div>
            ) : (
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-4 gs-0 gx-9'>
                  <thead>
                    <tr className='text-start text-gray-500 fw-bold fs-7 text-uppercase gs-9 border-bottom'>
                      <th className='ps-9 w-50px'>#</th>
                      <th>Name</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Order</th>
                      <th className='text-end pe-9'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {slots.map((slot, idx) => {
                      const [sh, sm] = slot.start_time.split(':').map(Number)
                      const [eh, em] = slot.end_time.split(':').map(Number)
                      const dur = (eh * 60 + em) - (sh * 60 + sm)
                      return (
                        <tr key={slot.id}>
                          <td className='ps-9 text-gray-500'>{idx + 1}</td>
                          <td>
                            <span className='fw-bold text-gray-800'>{slot.name}</span>
                          </td>
                          <td>
                            <span className='badge badge-light-success fw-bold'>
                              {fmtTime(slot.start_time)}
                            </span>
                          </td>
                          <td>
                            <span className='badge badge-light-danger fw-bold'>
                              {fmtTime(slot.end_time)}
                            </span>
                          </td>
                          <td>
                            <span className='text-muted'>{dur} min</span>
                          </td>
                          <td>
                            {slot.is_break ? (
                              <span className='badge badge-light-warning fw-bold'>Break</span>
                            ) : (
                              <span className='badge badge-light-primary fw-bold'>Period</span>
                            )}
                          </td>
                          <td>
                            <span className='badge badge-light fw-bold'>{slot.sort_order}</span>
                          </td>
                          <td className='text-end pe-9'>
                            <button
                              className='btn btn-icon btn-sm btn-light-primary me-2'
                              title='Edit'
                              onClick={() => openEdit(slot)}
                            >
                              <i className='ki-duotone ki-pencil fs-5'>
                                <span className='path1'></span><span className='path2'></span>
                              </i>
                            </button>
                            <button
                              className='btn btn-icon btn-sm btn-light-danger'
                              title='Delete'
                              onClick={() => handleDelete(slot)}
                              disabled={deleting === slot.id}
                            >
                              {deleting === slot.id ? (
                                <span className='spinner-border spinner-border-sm'></span>
                              ) : (
                                <i className='ki-duotone ki-trash fs-5'>
                                  <span className='path1'></span><span className='path2'></span>
                                  <span className='path3'></span><span className='path4'></span>
                                  <span className='path5'></span>
                                </i>
                              )}
                            </button>
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
      </Content>

      {/* Modal */}
      {showModal && (
        <div className='modal fade show d-block' tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title fw-bold'>
                  {editSlot ? 'Edit Period Slot' : 'Add Period / Break'}
                </h5>
                <button type='button' className='btn-close' onClick={() => setShowModal(false)}></button>
              </div>
              <div className='modal-body'>
                <div className='row g-5'>
                  {/* Name */}
                  <div className='col-12'>
                    <label className='form-label required fw-semibold'>Name</label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='e.g. Period 1, Lunch Break'
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  {/* Times */}
                  <div className='col-6'>
                    <label className='form-label required fw-semibold'>Start Time</label>
                    <input
                      type='time'
                      className='form-control form-control-solid'
                      value={form.start_time}
                      onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    />
                  </div>
                  <div className='col-6'>
                    <label className='form-label required fw-semibold'>End Time</label>
                    <input
                      type='time'
                      className='form-control form-control-solid'
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    />
                  </div>
                  {/* Sort Order */}
                  <div className='col-6'>
                    <label className='form-label fw-semibold'>Sort Order</label>
                    <input
                      type='number'
                      className='form-control form-control-solid'
                      min={1}
                      value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    />
                  </div>
                  {/* Is Break */}
                  <div className='col-6 d-flex align-items-end'>
                    <div className='form-check form-switch form-check-custom form-check-solid pb-2'>
                      <input
                        className='form-check-input'
                        type='checkbox'
                        id='isBreak'
                        checked={form.is_break}
                        onChange={e => setForm(f => ({ ...f, is_break: e.target.checked }))}
                      />
                      <label className='form-check-label fw-semibold text-gray-800 fs-6' htmlFor='isBreak'>
                        Is Break?
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button className='btn btn-light' onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className='btn btn-primary' onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</>
                  ) : (
                    <><i className='ki-duotone ki-check fs-2'></i> Save</>
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

const PeriodsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[]}>Period Slots</PageTitle>
    <Periods />
  </>
)

export { PeriodsWrapper }
