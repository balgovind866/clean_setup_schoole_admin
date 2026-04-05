import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import {
  getPeriodSlots,
  getTimetableGrid,
  bulkSaveTimetable,
  getTimetableVersions,
  publishTimetableVersion,
  unpublishTimetableVersion,
} from './core/_requests'
import {
  PeriodSlot,
  TimetableGrid,
  TimetableVersion,
  BulkSaveEntry,
  DayOfWeek,
} from './core/_models'
import { getAcademicSessions, getClasses, getClassSections, getSubjects } from '../academic/core/_requests'
import { getTeachers } from '../teachers/core/_requests'
import { SessionModel, ClassModel, ClassSectionMappingModel, SubjectModel } from '../academic/core/_models'
import { toast } from 'react-toastify'

const ALL_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

/* ---------------------------------------------------------------------------
   Helper: convert grid data → local editable state
   editsMap[day][period_slot_id] = { subject_id, teacher_id, room_no }
--------------------------------------------------------------------------- */
type CellData = { subject_id: number | null; teacher_id: number | null; room_no: string }
type EditsMap = Record<DayOfWeek, Record<number, CellData>>

function gridToEdits(grid: TimetableGrid, slots: PeriodSlot[]): EditsMap {
  const map = {} as EditsMap
  ALL_DAYS.forEach(day => {
    map[day] = {}
    slots.forEach(slot => {
      const entry = (grid[day] || []).find(e => e.period_slot_id === slot.id)
      map[day][slot.id] = {
        subject_id: entry?.subject_id ?? null,
        teacher_id: entry?.teacher_id ?? null,
        room_no: entry?.room_no ?? '',
      }
    })
  })
  return map
}

function emptyEdits(slots: PeriodSlot[]): EditsMap {
  const map = {} as EditsMap
  ALL_DAYS.forEach(day => {
    map[day] = {}
    slots.forEach(slot => {
      map[day][slot.id] = { subject_id: null, teacher_id: null, room_no: '' }
    })
  })
  return map
}

/* ===========================================================================
   Main Component
=========================================================================== */
const TimetablePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // ── Meta state ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [sections, setSections] = useState<ClassSectionMappingModel[]>([])
  const [subjects, setSubjects] = useState<SubjectModel[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [slots, setSlots] = useState<PeriodSlot[]>([])

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<number>(0)
  const [classId, setClassId] = useState<number>(0)
  const [sectionId, setSectionId] = useState<number>(0)
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])

  // ── Grid / Version state ─────────────────────────────────────────────────────
  const [edits, setEdits] = useState<EditsMap>({} as EditsMap)
  const [versions, setVersions] = useState<TimetableVersion[]>([])
  const [activeTab, setActiveTab] = useState<'grid' | 'versions'>('grid')

  // ── Loading flags ────────────────────────────────────────────────────────────
  const [loadingGrid, setLoadingGrid] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<number | null>(null)

  // ── Selected cell for popup editor ──────────────────────────────────────────
  const [editCell, setEditCell] = useState<{ day: DayOfWeek; slotId: number } | null>(null)

  /* ---------- Load sessions, classes, subjects, teachers on mount ---------- */
  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      getAcademicSessions(schoolId, 1, 100),
      getClasses(schoolId, 1, 100),
      getSubjects(schoolId),
      getTeachers(schoolId, { limit: 500 }),
    ]).then(([sessRes, classRes, subRes, teachRes]) => {
      if (sessRes.data.success) {
        const list = sessRes.data.data.sessions || []
        setSessions(list)
        const cur = list.find(s => s.is_current) || list[0]
        if (cur) setSessionId(cur.id)
      }
      if (classRes.data.success) setClasses(classRes.data.data.classes || [])
      if (subRes.data.success) setSubjects(subRes.data.data.subjects || [])
      if (teachRes.data.success) setTeachers(teachRes.data.data?.teachers || teachRes.data.data || [])
    }).catch(() => {})
  }, [schoolId])

  /* ---------- Load sections when class changes ---------- */
  useEffect(() => {
    setSectionId(0)
    setSections([])
    if (!schoolId || !classId) return
    getClassSections(schoolId, classId)
      .then(res => { if (res.data.success) setSections(res.data.data.sections || []) })
      .catch(() => {})
  }, [schoolId, classId])

  /* ---------- Load period slots when session changes ---------- */
  useEffect(() => {
    if (!schoolId || !sessionId) return
    getPeriodSlots(schoolId, sessionId)
      .then(res => {
        if (res.data.success) {
          const s = res.data.data || []
          setSlots(s)
          setEdits(emptyEdits(s))
        }
      })
      .catch(() => {})
  }, [schoolId, sessionId])

  /* ---------- Fetch timetable grid ---------- */
  const fetchGrid = useCallback(async () => {
    if (!schoolId || !sectionId || !sessionId) {
      toast.warning('Please select Class, Section and Session')
      return
    }
    setLoadingGrid(true)
    try {
      const [gridRes, slotsRes] = await Promise.all([
        getTimetableGrid(schoolId, sectionId, sessionId),
        getPeriodSlots(schoolId, sessionId),
      ])
      const latestSlots = slotsRes.data.data || []
      setSlots(latestSlots)
      if (gridRes.data.success) {
        setEdits(gridToEdits(gridRes.data.data, latestSlots))
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load timetable')
    } finally {
      setLoadingGrid(false)
    }
  }, [schoolId, sectionId, sessionId])

  /* ---------- Fetch versions ---------- */
  const fetchVersions = useCallback(async () => {
    if (!schoolId || !sectionId || !sessionId) return
    try {
      const res = await getTimetableVersions(schoolId, sectionId, sessionId)
      if (res.data.success) setVersions(res.data.data || [])
    } catch {}
  }, [schoolId, sectionId, sessionId])

  /* ---------- Auto-load when filters are complete ---------- */
  useEffect(() => {
    if (sectionId && sessionId) {
      fetchGrid()
      fetchVersions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, sessionId])

  /* ---------- Bulk save ---------- */
  const handleSave = async () => {
    if (!sectionId || !sessionId) { toast.warning('Please select Class & Section'); return }
    if (slots.length === 0) { toast.warning('No period slots available'); return }

    const entries: BulkSaveEntry[] = []
    ALL_DAYS.forEach(day => {
      slots.forEach(slot => {
        const cell = edits[day]?.[slot.id]
        if (cell) {
          entries.push({
            day_of_week: day,
            period_slot_id: slot.id,
            subject_id: slot.is_break ? null : (cell.subject_id || null),
            teacher_id: slot.is_break ? null : (cell.teacher_id || null),
            room_no: cell.room_no || null,
          })
        }
      })
    })

    setSaving(true)
    try {
      const res = await bulkSaveTimetable(schoolId, {
        class_section_id: sectionId,
        academic_session_id: sessionId,
        effective_from: effectiveFrom,
        entries,
      })
      if (res.data.success) {
        toast.success(`Timetable draft saved! (Version #${res.data.data.version_id})`)
        fetchVersions()
        setActiveTab('versions')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ---------- Publish / Unpublish ---------- */
  const handlePublish = async (v: TimetableVersion) => {
    setPublishing(v.id)
    try {
      if (v.is_active) {
        await unpublishTimetableVersion(schoolId, v.id)
        toast.success('Timetable unpublished')
      } else {
        await publishTimetableVersion(schoolId, v.id)
        toast.success('Timetable published!')
      }
      fetchVersions()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Operation failed')
    } finally {
      setPublishing(null)
    }
  }

  /* ---------- Cell edit helpers ---------- */
  const setCell = (day: DayOfWeek, slotId: number, patch: Partial<CellData>) => {
    setEdits(prev => ({
      ...prev,
      [day]: { ...prev[day], [slotId]: { ...prev[day]?.[slotId], ...patch } },
    }))
  }

  const getCell = (day: DayOfWeek, slotId: number): CellData =>
    edits[day]?.[slotId] || { subject_id: null, teacher_id: null, room_no: '' }

  /* ---------- Helpers ---------- */
  const fmtTime = (t: string) => {
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  }

  const subjectName = (id: number | null) =>
    id ? (subjects.find(s => s.id === id)?.name || `Sub #${id}`) : null
  const teacherName = (id: number | null) => {
    if (!id) return null
    const t = teachers.find((t: any) => t.id === id)
    return t ? (t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `Teacher #${id}`) : `Teacher #${id}`
  }

  const activeSectionLabel = () => {
    const cls = classes.find(c => c.id === classId)
    const sec = sections.find(s => s.id === sectionId)
    if (cls && sec) return `${cls.name} - ${sec.section?.name || ''}`
    return ''
  }

  /* =========================================================================
     RENDER
  ========================================================================= */
  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Filters Bar ─────────────────────────────────────────────────── */}
        <div className='card mb-5'>
          <div className='card-body py-5'>
            <div className='row g-4 align-items-end'>
              {/* Session */}
              <div className='col-md-3'>
                <label className='form-label fw-semibold fs-7 text-gray-600'>Academic Session</label>
                <select
                  className='form-select form-select-solid form-select-sm'
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
              </div>
              {/* Class */}
              <div className='col-md-2'>
                <label className='form-label fw-semibold fs-7 text-gray-600'>Class</label>
                <select
                  className='form-select form-select-solid form-select-sm'
                  value={classId}
                  onChange={e => { setClassId(Number(e.target.value)); setSectionId(0) }}
                >
                  <option value={0}>Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {/* Section */}
              <div className='col-md-2'>
                <label className='form-label fw-semibold fs-7 text-gray-600'>Section</label>
                <select
                  className='form-select form-select-solid form-select-sm'
                  value={sectionId}
                  onChange={e => setSectionId(Number(e.target.value))}
                  disabled={!classId}
                >
                  <option value={0}>Select Section</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.section?.name}</option>
                  ))}
                </select>
              </div>
              {/* Effective From */}
              <div className='col-md-2'>
                <label className='form-label fw-semibold fs-7 text-gray-600'>Effective From</label>
                <input
                  type='date'
                  className='form-control form-control-solid form-control-sm'
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                />
              </div>
              {/* Actions */}
              <div className='col-md-3 d-flex gap-2'>
                <button
                  className='btn btn-primary btn-sm flex-fill'
                  onClick={fetchGrid}
                  disabled={loadingGrid || !sectionId}
                >
                  {loadingGrid
                    ? <span className='spinner-border spinner-border-sm'></span>
                    : <><i className='ki-duotone ki-eye fs-4'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i> Load Grid</>}
                </button>
                <button
                  className='btn btn-success btn-sm flex-fill'
                  onClick={handleSave}
                  disabled={saving || !sectionId || slots.length === 0}
                >
                  {saving
                    ? <span className='spinner-border spinner-border-sm'></span>
                    : <><i className='ki-duotone ki-save fs-4'><span className='path1'></span><span className='path2'></span></i> Save Draft</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Card ───────────────────────────────────────────────────── */}
        <div className='card'>
          {/* Card Header with Tabs */}
          <div className='card-header card-header-stretch border-bottom'>
            <div className='card-title'>
              <h3 className='fw-bold'>
                {sectionId ? (
                  <span>Timetable — <span className='text-primary'>{activeSectionLabel()}</span></span>
                ) : (
                  'Timetable Grid'
                )}
              </h3>
            </div>
            <div className='card-toolbar'>
              <ul className='nav nav-tabs nav-line-tabs nav-stretch fs-6 border-0'>
                <li className='nav-item'>
                  <a
                    className={`nav-link text-active-primary cursor-pointer px-4 ${activeTab === 'grid' ? 'active' : ''}`}
                    onClick={() => setActiveTab('grid')}
                  >
                    <i className='ki-duotone ki-calendar-2 fs-5 me-1'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i>
                    Timetable Grid
                  </a>
                </li>
                <li className='nav-item'>
                  <a
                    className={`nav-link text-active-primary cursor-pointer px-4 ${activeTab === 'versions' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('versions'); if (sectionId) fetchVersions() }}
                  >
                    <i className='ki-duotone ki-archive fs-5 me-1'><span className='path1'></span><span className='path2'></span></i>
                    Versions & Publishing
                    {versions.length > 0 && (
                      <span className='badge badge-circle badge-primary ms-2 badge-sm'>
                        {versions.length}
                      </span>
                    )}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── GRID TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'grid' && (
            <div className='card-body p-0'>
              {!sectionId ? (
                <div className='text-center py-20'>
                  <i className='ki-duotone ki-calendar-2 fs-5x text-gray-200 mb-5 d-block'>
                    <span className='path1'></span><span className='path2'></span>
                    <span className='path3'></span><span className='path4'></span><span className='path5'></span>
                  </i>
                  <p className='text-muted fs-5'>Select a Class & Section to view or edit the timetable.</p>
                </div>
              ) : slots.length === 0 ? (
                <div className='text-center py-20'>
                  <i className='ki-duotone ki-time fs-5x text-gray-200 mb-5 d-block'>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  <p className='text-muted fs-5'>No period slots found for this session.</p>
                  <p className='text-muted fs-6'>Go to <strong>Periods</strong> section to create slots first.</p>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-bordered table-row-dashed align-middle gs-0 gy-0 mb-0' style={{ minWidth: '900px' }}>
                    <thead>
                      <tr className='fw-bold fs-7 text-uppercase text-gray-600 bg-light'>
                        {/* Period column header */}
                        <th
                          className='text-center border-end fw-bold text-gray-700 ps-4'
                          style={{ minWidth: '130px', position: 'sticky', left: 0, background: '#f5f8fa', zIndex: 2 }}
                        >
                          <i className='ki-duotone ki-time fs-5 text-primary me-1'>
                            <span className='path1'></span><span className='path2'></span>
                          </i>
                          Period / Time
                        </th>
                        {ALL_DAYS.map(day => (
                          <th key={day} className='text-center border-start' style={{ minWidth: '140px' }}>
                            <div className='text-gray-800 fw-bold'>{day}</div>
                            <div className='text-muted fs-8'>{DAY_SHORT[day]}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map(slot => (
                        <tr key={slot.id} className={slot.is_break ? 'bg-light' : ''}>
                          {/* Period slot info */}
                          <td
                            className='border-end ps-4 py-3'
                            style={{ position: 'sticky', left: 0, background: slot.is_break ? '#f5f8fa' : '#fff', zIndex: 1 }}
                          >
                            <div className='d-flex align-items-center gap-2'>
                              {slot.is_break ? (
                                <span className='badge badge-light-warning w-18px h-18px p-0 d-flex align-items-center justify-content-center'>B</span>
                              ) : (
                                <span className='badge badge-light-primary w-18px h-18px p-0 d-flex align-items-center justify-content-center fs-9'>P</span>
                              )}
                              <div>
                                <div className='fw-bold text-gray-800 fs-7'>{slot.name}</div>
                                <div className='text-muted fs-8'>
                                  {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Each day cell */}
                          {ALL_DAYS.map(day => {
                            const cell = getCell(day, slot.id)
                            const sub = subjectName(cell.subject_id)
                            const tchr = teacherName(cell.teacher_id)
                            const isOpen = editCell?.day === day && editCell?.slotId === slot.id

                            if (slot.is_break) {
                              return (
                                <td key={day} className='text-center border-start py-3'>
                                  <input
                                    type='text'
                                    className='form-control form-control-sm form-control-solid text-center border-0 bg-transparent'
                                    placeholder='Room / Location'
                                    value={cell.room_no}
                                    onChange={e => setCell(day, slot.id, { room_no: e.target.value })}
                                    style={{ fontSize: '12px' }}
                                  />
                                </td>
                              )
                            }

                            return (
                              <td
                                key={day}
                                className='border-start py-2 px-2 position-relative'
                                style={{ verticalAlign: 'top', minHeight: '80px' }}
                              >
                                {/* Filled cell display */}
                                {sub ? (
                                  <div
                                    className='rounded p-2 cursor-pointer h-100'
                                    style={{ background: '#f1f4fa', border: '1px solid #d1d9e6', minHeight: '72px' }}
                                    onClick={() => setEditCell(isOpen ? null : { day, slotId: slot.id })}
                                  >
                                    <div className='fw-bold text-primary fs-7 mb-1'>{sub}</div>
                                    {tchr && <div className='text-gray-700 fs-8'><i className='ki-duotone ki-profile-user fs-8 me-1'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span></i>{tchr}</div>}
                                    {cell.room_no && <div className='text-muted fs-8 mt-1'><i className='ki-duotone ki-geolocation fs-8 me-1'><span className='path1'></span><span className='path2'></span></i>{cell.room_no}</div>}
                                    <button
                                      className='btn btn-icon btn-xs btn-light-danger position-absolute top-0 end-0 m-1'
                                      style={{ width: '18px', height: '18px', minWidth: 'unset', padding: 0 }}
                                      onClick={e => { e.stopPropagation(); setCell(day, slot.id, { subject_id: null, teacher_id: null, room_no: '' }) }}
                                    >
                                      <i className='ki-duotone ki-cross fs-9'><span className='path1'></span><span className='path2'></span></i>
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className='rounded d-flex align-items-center justify-content-center cursor-pointer text-muted'
                                    style={{ minHeight: '72px', border: '1px dashed #d1d9e6', background: '#fafafa' }}
                                    onClick={() => setEditCell(isOpen ? null : { day, slotId: slot.id })}
                                  >
                                    <span className='fs-7'>+ Add</span>
                                  </div>
                                )}

                                {/* Cell editor popup */}
                                {isOpen && (
                                  <div
                                    className='card shadow position-absolute start-0 top-100 z-index-3 p-4'
                                    style={{ minWidth: '260px', zIndex: 999, border: '1px solid #ddd' }}
                                  >
                                    <div className='mb-3'>
                                      <label className='form-label fw-semibold fs-7 mb-1'>Subject</label>
                                      <select
                                        className='form-select form-select-sm form-select-solid'
                                        value={cell.subject_id || ''}
                                        onChange={e => setCell(day, slot.id, { subject_id: e.target.value ? Number(e.target.value) : null })}
                                      >
                                        <option value=''>No Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                      </select>
                                    </div>
                                    <div className='mb-3'>
                                      <label className='form-label fw-semibold fs-7 mb-1'>Teacher</label>
                                      <select
                                        className='form-select form-select-sm form-select-solid'
                                        value={cell.teacher_id || ''}
                                        onChange={e => setCell(day, slot.id, { teacher_id: e.target.value ? Number(e.target.value) : null })}
                                      >
                                        <option value=''>No Teacher</option>
                                        {teachers.map((t: any) => (
                                          <option key={t.id} value={t.id}>
                                            {t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `Teacher #${t.id}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className='mb-3'>
                                      <label className='form-label fw-semibold fs-7 mb-1'>Room No.</label>
                                      <input
                                        type='text'
                                        className='form-control form-control-sm form-control-solid'
                                        placeholder='e.g. A-101'
                                        value={cell.room_no}
                                        onChange={e => setCell(day, slot.id, { room_no: e.target.value })}
                                      />
                                    </div>
                                    <button
                                      className='btn btn-primary btn-sm w-100'
                                      onClick={() => setEditCell(null)}
                                    >
                                      Done
                                    </button>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Footer */}
              {sectionId && slots.length > 0 && (
                <div className='card-footer d-flex justify-content-between align-items-center'>
                  <span className='text-muted fs-7'>
                    <i className='ki-duotone ki-information fs-4 me-1 text-warning'><span className='path1'></span><span className='path2'></span><span className='path3'></span></i>
                    Click any cell to assign Subject / Teacher. Save as Draft, then Publish from the <strong>Versions</strong> tab.
                  </span>
                  <div className='d-flex gap-3'>
                    <button className='btn btn-light btn-sm' onClick={fetchGrid} disabled={loadingGrid}>
                      Reset
                    </button>
                    <button className='btn btn-success btn-sm' onClick={handleSave} disabled={saving}>
                      {saving ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</> : 'Save Draft'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── VERSIONS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'versions' && (
            <div className='card-body'>
              {!sectionId ? (
                <div className='text-center py-15 text-muted'>
                  Select a Class & Section to view versions.
                </div>
              ) : versions.length === 0 ? (
                <div className='text-center py-15'>
                  <i className='ki-duotone ki-archive fs-5x text-gray-200 mb-5 d-block'>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  <p className='text-muted fs-5'>No timetable versions yet.</p>
                  <p className='text-muted fs-6'>Go to the <strong>Grid</strong> tab, fill in the timetable, and <strong>Save Draft</strong>.</p>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table align-middle table-row-dashed fs-6 gy-4'>
                    <thead>
                      <tr className='text-start text-gray-500 fw-bold fs-7 text-uppercase'>
                        <th>Version ID</th>
                        <th>Effective From</th>
                        <th>Status</th>
                        <th>Published At</th>
                        <th>Created</th>
                        <th className='text-end'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='fw-semibold text-gray-600'>
                      {versions.map(v => (
                        <tr key={v.id}>
                          <td>
                            <span className='badge badge-light-primary fw-bold'>#{v.id}</span>
                          </td>
                          <td>
                            {new Date(v.effective_from).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td>
                            {v.is_active ? (
                              <span className='badge badge-light-success fw-bold'>
                                <i className='ki-duotone ki-check-circle fs-6 me-1'><span className='path1'></span><span className='path2'></span></i>
                                Published
                              </span>
                            ) : (
                              <span className='badge badge-light-warning fw-bold'>
                                <i className='ki-duotone ki-time fs-6 me-1'><span className='path1'></span><span className='path2'></span></i>
                                Draft
                              </span>
                            )}
                          </td>
                          <td>
                            {v.published_at
                              ? new Date(v.published_at).toLocaleString('en-GB')
                              : <span className='text-muted'>—</span>}
                          </td>
                          <td>
                            {new Date(v.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className='text-end'>
                            <button
                              className={`btn btn-sm ${v.is_active ? 'btn-light-warning' : 'btn-light-success'}`}
                              onClick={() => handlePublish(v)}
                              disabled={publishing === v.id}
                            >
                              {publishing === v.id ? (
                                <span className='spinner-border spinner-border-sm me-1'></span>
                              ) : v.is_active ? (
                                <><i className='ki-duotone ki-cross-circle fs-5 me-1'><span className='path1'></span><span className='path2'></span></i>Unpublish</>
                              ) : (
                                <><i className='ki-duotone ki-send fs-5 me-1'><span className='path1'></span><span className='path2'></span></i>Publish</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </Content>
    </>
  )
}

const TimetableWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[]}>Timetable</PageTitle>
    <TimetablePage />
  </>
)

export { TimetableWrapper }
