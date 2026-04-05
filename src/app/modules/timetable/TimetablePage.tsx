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
  getTeacherBySubject,
} from './core/_requests'
import {
  PeriodSlot,
  TimetableGrid,
  TimetableVersion,
  BulkSaveEntry,
  DayOfWeek,
} from './core/_models'
import { getAcademicSessions, getClasses, getClassSections, getSubjects, getTeacherAllocations, getClassSubjects } from '../academic/core/_requests'
import { getTeachers } from '../teachers/core/_requests'
import { SessionModel, ClassModel, ClassSectionMappingModel, SubjectModel, TeacherAllocationModel, ClassSubjectMappingModel } from '../academic/core/_models'
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
   Cell Editor Popup — reused in both Grid and List views
=========================================================================== */
interface CellEditorProps {
  day: DayOfWeek
  slotId: number
  cell: CellData
  classSubjects: ClassSubjectMappingModel[]
  subjects: SubjectModel[]
  teachers: any[]
  onSetCell: (day: DayOfWeek, slotId: number, patch: Partial<CellData>) => void
  onClose: () => void
}

const CellEditorPopup: FC<CellEditorProps> = ({
  day, slotId, cell, classSubjects, subjects, teachers, onSetCell, onClose,
}) => (
  <div
    className='card shadow position-absolute start-0 top-100 z-index-3 p-4'
    style={{ minWidth: '260px', zIndex: 999, border: '1px solid #ddd' }}
  >
    <div className='mb-3'>
      <div className='d-flex align-items-center justify-content-between mb-1'>
        <label className='form-label fw-semibold fs-7 mb-0'>Subject</label>
        {classSubjects.length > 0 && (
          <span className='badge badge-light-primary fs-9 py-1 px-2'>
            {classSubjects.length} mapped
          </span>
        )}
      </div>
      <select
        className='form-select form-select-sm form-select-solid'
        value={cell.subject_id || ''}
        onChange={e => onSetCell(day, slotId, { subject_id: e.target.value ? Number(e.target.value) : null })}
      >
        <option value=''>— Select Subject —</option>
        {(classSubjects.length > 0
          ? classSubjects.map(cs => cs.subject).filter(Boolean)
          : subjects
        ).map(s => s && (
          <option key={s.id} value={s.id}>
            {s.name} {s.code ? `(${s.code})` : ''}
          </option>
        ))}
      </select>
    </div>
    <div className='mb-3'>
      <div className='d-flex align-items-center justify-content-between mb-1'>
        <label className='form-label fw-semibold fs-7 mb-0'>Teacher</label>
        {cell.teacher_id && cell.subject_id && (
          <span className='badge badge-light-success fs-9 py-1 px-2'>
            <i className='ki-duotone ki-check fs-9 me-1'><span className='path1'></span><span className='path2'></span></i>
            Auto-filled
          </span>
        )}
      </div>
      <select
        className='form-select form-select-sm form-select-solid'
        value={cell.teacher_id || ''}
        onChange={e => onSetCell(day, slotId, { teacher_id: e.target.value ? Number(e.target.value) : null })}
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
        onChange={e => onSetCell(day, slotId, { room_no: e.target.value })}
      />
    </div>
    <button className='btn btn-primary btn-sm w-100' onClick={onClose}>
      Done
    </button>
  </div>
)

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
  const [classSubjects, setClassSubjects] = useState<ClassSubjectMappingModel[]>([])
  const [allocations, setAllocations] = useState<TeacherAllocationModel[]>([])

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<number>(0)
  const [classId, setClassId] = useState<number>(0)
  const [sectionId, setSectionId] = useState<number>(0)
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])

  // ── Grid / Version / View state ──────────────────────────────────────────────
  const [edits, setEdits] = useState<EditsMap>({} as EditsMap)
  const [versions, setVersions] = useState<TimetableVersion[]>([])
  const [activeTab, setActiveTab] = useState<'grid' | 'versions'>('grid')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
    }).catch(() => { })
  }, [schoolId])

  /* ---------- Load sections + class subjects when class changes ---------- */
  useEffect(() => {
    setSectionId(0)
    setSections([])
    setClassSubjects([])
    if (!schoolId || !classId) return
    Promise.all([
      getClassSections(schoolId, classId),
      getClassSubjects(schoolId, classId),
    ]).then(([secRes, subRes]) => {
      if (secRes.data.success) setSections(secRes.data.data.sections || [])
      if (subRes.data.success) setClassSubjects(subRes.data.data.subjects || [])
    }).catch(() => { })
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
      .catch(() => { })
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
    } catch { }
  }, [schoolId, sectionId, sessionId])

  /* ---------- Load teacher allocations when section/session changes ---------- */
  useEffect(() => {
    if (!schoolId || !sectionId || !sessionId) { setAllocations([]); return }
    getTeacherAllocations(schoolId, { class_section_id: sectionId, academic_session_id: sessionId })
      .then(res => { if (res.data.success) setAllocations(res.data.data || []) })
      .catch(() => { })
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
          const isFilled = cell.subject_id || cell.teacher_id || (cell.room_no && cell.room_no.trim() !== '')
          if (isFilled) {
            entries.push({
              day_of_week: day,
              period_slot_id: slot.id,
              subject_id: slot.is_break ? null : (cell.subject_id || null),
              teacher_id: slot.is_break ? null : (cell.teacher_id || null),
              room_no: cell.room_no && cell.room_no.trim() !== '' ? cell.room_no : null,
            })
          }
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
        toast.success(`✅ Timetable draft saved successfully! Version #${res.data.data.version_id} created.`)
        fetchVersions()
        setActiveTab('versions')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed — check console for details')
      console.error('Bulk save error:', e)
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
  const setCell = async (day: DayOfWeek, slotId: number, patch: Partial<CellData>) => {
    if ('subject_id' in patch && patch.subject_id) {
      setEdits(prev => {
        const current = prev[day]?.[slotId] || { subject_id: null, teacher_id: null, room_no: '' }
        return { ...prev, [day]: { ...prev[day], [slotId]: { ...current, ...patch } } }
      })
      try {
        const res = await getTeacherBySubject(schoolId, patch.subject_id, sessionId)
        if (res.data.success && res.data.data.length > 0) {
          const matched = res.data.data.find(t =>
            t.classes.some(c => c.class_section_id === sectionId)
          )
          const teacherId = matched?.teacher_id || res.data.data[0]?.teacher_id || null
          if (teacherId) {
            setEdits(prev => {
              const current = prev[day]?.[slotId] || { subject_id: null, teacher_id: null, room_no: '' }
              return { ...prev, [day]: { ...prev[day], [slotId]: { ...current, teacher_id: teacherId } } }
            })
          }
        }
      } catch { }
    } else {
      setEdits(prev => {
        const current = prev[day]?.[slotId] || { subject_id: null, teacher_id: null, room_no: '' }
        const updated = { ...current, ...patch }
        if ('subject_id' in patch && !patch.subject_id) updated.teacher_id = null
        return { ...prev, [day]: { ...prev[day], [slotId]: updated } }
      })
    }
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

  const nonBreakSlots = slots.filter(s => !s.is_break)

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

          {/* ── Card Header with Tabs + View Toggle ─────────────────────── */}
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
            <div className='card-toolbar d-flex align-items-center gap-3'>
              {/* Nav Tabs */}
              <ul className='nav nav-tabs nav-line-tabs nav-stretch fs-6 border-0'>
                <li className='nav-item'>
                  <a
                    className={`nav-link text-active-primary cursor-pointer px-4 ${activeTab === 'grid' ? 'active' : ''}`}
                    onClick={() => setActiveTab('grid')}
                  >
                    <i className='ki-duotone ki-calendar-2 fs-5 me-1'>
                      <span className='path1'></span><span className='path2'></span>
                      <span className='path3'></span><span className='path4'></span><span className='path5'></span>
                    </i>
                    Timetable Grid
                  </a>
                </li>
                <li className='nav-item'>
                  <a
                    className={`nav-link text-active-primary cursor-pointer px-4 ${activeTab === 'versions' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('versions'); if (sectionId) fetchVersions() }}
                  >
                    <i className='ki-duotone ki-archive fs-5 me-1'>
                      <span className='path1'></span><span className='path2'></span>
                    </i>
                    Versions & Publishing
                    {versions.length > 0 && (
                      <span className='badge badge-circle badge-primary ms-2 badge-sm'>
                        {versions.length}
                      </span>
                    )}
                  </a>
                </li>
              </ul>

              {/* Grid / List toggle — only show on grid tab when data is loaded */}
              {activeTab === 'grid' && sectionId && slots.length > 0 && (
                <div className='d-flex align-items-center border-start ps-4'>
                  <span className='text-muted fs-8 me-2 fw-semibold'>View:</span>
                  <div className='btn-group btn-group-sm'>
                    <button
                      className={`btn btn-icon btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
                      title='Grid View'
                      onClick={() => setViewMode('grid')}
                    >
                      <i className='ki-duotone ki-element-11 fs-5'>
                        <span className='path1'></span><span className='path2'></span>
                        <span className='path3'></span><span className='path4'></span>
                      </i>
                    </button>
                    <button
                      className={`btn btn-icon btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-light'}`}
                      title='List View'
                      onClick={() => setViewMode('list')}
                    >
                      <i className='ki-duotone ki-row-horizontal fs-5'>
                        <span className='path1'></span><span className='path2'></span>
                      </i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              GRID TAB
          ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'grid' && (
            <div className='card-body p-0'>

              {/* Empty state — no section selected */}
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

              ) : viewMode === 'grid' ? (
                /* ─────────────────────────────────────────────────────────
                   GRID VIEW
                ───────────────────────────────────────────────────────── */
                <div className='table-responsive'>
                  <table
                    className='table table-bordered table-row-dashed align-middle gs-0 gy-0 mb-0'
                    style={{ minWidth: '900px' }}
                  >
                    <thead>
                      <tr className='fw-bold fs-7 text-uppercase text-gray-600 bg-light'>
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
                                {/* Filled cell */}
                                {sub ? (
                                  <div
                                    className='rounded p-2 cursor-pointer h-100'
                                    style={{ background: '#f1f4fa', border: '1px solid #d1d9e6', minHeight: '72px' }}
                                    onClick={() => setEditCell(isOpen ? null : { day, slotId: slot.id })}
                                  >
                                    <div className='fw-bold text-primary fs-7 mb-1'>{sub}</div>
                                    {tchr && (
                                      <div className='text-gray-700 fs-8'>
                                        <i className='ki-duotone ki-profile-user fs-8 me-1'>
                                          <span className='path1'></span><span className='path2'></span>
                                          <span className='path3'></span><span className='path4'></span>
                                        </i>
                                        {tchr}
                                      </div>
                                    )}
                                    {cell.room_no && (
                                      <div className='text-muted fs-8 mt-1'>
                                        <i className='ki-duotone ki-geolocation fs-8 me-1'>
                                          <span className='path1'></span><span className='path2'></span>
                                        </i>
                                        {cell.room_no}
                                      </div>
                                    )}
                                    <button
                                      className='btn btn-icon btn-xs btn-light-danger position-absolute top-0 end-0 m-1'
                                      style={{ width: '18px', height: '18px', minWidth: 'unset', padding: 0 }}
                                      onClick={e => {
                                        e.stopPropagation()
                                        setCell(day, slot.id, { subject_id: null, teacher_id: null, room_no: '' })
                                      }}
                                    >
                                      <i className='ki-duotone ki-cross fs-9'>
                                        <span className='path1'></span><span className='path2'></span>
                                      </i>
                                    </button>
                                  </div>
                                ) : (
                                  /* Empty cell */
                                  <div
                                    className='rounded d-flex align-items-center justify-content-center cursor-pointer text-muted'
                                    style={{ minHeight: '72px', border: '1px dashed #d1d9e6', background: '#fafafa' }}
                                    onClick={() => setEditCell(isOpen ? null : { day, slotId: slot.id })}
                                  >
                                    <span className='fs-7'>+ Add</span>
                                  </div>
                                )}

                                {/* Popup editor */}
                                {isOpen && (
                                  <CellEditorPopup
                                    day={day}
                                    slotId={slot.id}
                                    cell={cell}
                                    classSubjects={classSubjects}
                                    subjects={subjects}
                                    teachers={teachers}
                                    onSetCell={setCell}
                                    onClose={() => setEditCell(null)}
                                  />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              ) : (
                /* ─────────────────────────────────────────────────────────
                   LIST VIEW — day-wise accordion with period cards
                ───────────────────────────────────────────────────────── */
                <div className='p-6'>
                  {ALL_DAYS.map(day => {
                    const filledCount = slots.filter(slot => {
                      const cell = getCell(day, slot.id)
                      return !slot.is_break && (cell.subject_id || (cell.room_no && cell.room_no.trim()))
                    }).length

                    return (
                      <div key={day} className='mb-7'>
                        {/* Day header row */}
                        <div className='d-flex align-items-center mb-4'>
                          <div
                            className='rounded-pill px-5 py-2 fw-bold text-white fs-7 me-4'
                            style={{
                              background: 'linear-gradient(135deg, #3699FF, #187DE4)',
                              minWidth: '120px',
                              textAlign: 'center',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {day}
                          </div>
                          <div className='flex-grow-1 border-top border-dashed border-gray-300' />
                          <span className='ms-4 badge badge-light-primary fs-8 fw-semibold'>
                            {filledCount} / {nonBreakSlots.length} filled
                          </span>
                        </div>

                        {/* Period cards */}
                        <div className='row g-3 ps-2'>
                          {slots.map(slot => {
                            const cell = getCell(day, slot.id)
                            const sub = subjectName(cell.subject_id)
                            const tchr = teacherName(cell.teacher_id)
                            const isOpen = editCell?.day === day && editCell?.slotId === slot.id
                            const periodNum = nonBreakSlots.indexOf(slot) + 1

                            /* ── Break slot ── */
                            if (slot.is_break) {
                              return (
                                <div key={slot.id} className='col-12'>
                                  <div
                                    className='d-flex align-items-center gap-3 px-4 py-2 rounded'
                                    style={{ background: '#fff8dd', border: '1px dashed #ffc700' }}
                                  >
                                    <span className='badge badge-warning fw-bold fs-8 px-3'>BREAK</span>
                                    <div>
                                      <span className='fw-semibold text-gray-700 fs-7'>{slot.name}</span>
                                      <span className='text-muted fs-8 ms-2'>
                                        {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                                      </span>
                                    </div>
                                    <input
                                      type='text'
                                      className='form-control form-control-sm form-control-solid ms-auto'
                                      style={{ maxWidth: '180px' }}
                                      placeholder='Room / Location'
                                      value={cell.room_no}
                                      onChange={e => setCell(day, slot.id, { room_no: e.target.value })}
                                    />
                                  </div>
                                </div>
                              )
                            }

                            /* ── Regular period card ── */
                            return (
                              <div key={slot.id} className='col-12 col-md-6 col-xl-4 position-relative'>
                                <div
                                  className={`card h-100 cursor-pointer ${sub
                                    ? 'border border-primary border-opacity-25'
                                    : 'border border-dashed border-gray-300'
                                    }`}
                                  style={{
                                    background: sub ? '#f1f4fa' : '#fafafa',
                                    transition: 'box-shadow .15s ease',
                                  }}
                                  onClick={() => setEditCell(isOpen ? null : { day, slotId: slot.id })}
                                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 14px rgba(54,153,255,.18)')}
                                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                  <div className='card-body py-3 px-4'>
                                    {/* Period label + time */}
                                    <div className='d-flex align-items-center justify-content-between mb-2'>
                                      <div className='d-flex align-items-center gap-2'>
                                        <span className='badge badge-primary fw-bold fs-9' style={{ minWidth: '24px' }}>
                                          {periodNum}
                                        </span>
                                        <span className='fw-semibold text-gray-700 fs-7'>{slot.name}</span>
                                      </div>
                                      <span className='text-muted fs-8'>
                                        {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                                      </span>
                                    </div>

                                    {/* Filled */}
                                    {sub ? (
                                      <>
                                        <div className='fw-bold text-primary fs-6 mb-1'>{sub}</div>
                                        {tchr && (
                                          <div className='d-flex align-items-center text-gray-700 fs-8 mb-1'>
                                            <i className='ki-duotone ki-profile-user fs-7 me-1'>
                                              <span className='path1'></span><span className='path2'></span>
                                              <span className='path3'></span><span className='path4'></span>
                                            </i>
                                            {tchr}
                                          </div>
                                        )}
                                        {cell.room_no && (
                                          <div className='d-flex align-items-center text-muted fs-8'>
                                            <i className='ki-duotone ki-geolocation fs-7 me-1'>
                                              <span className='path1'></span><span className='path2'></span>
                                            </i>
                                            {cell.room_no}
                                          </div>
                                        )}
                                        {/* Clear button */}
                                        <button
                                          className='btn btn-icon btn-xs btn-light-danger position-absolute top-0 end-0 m-2'
                                          style={{ width: '20px', height: '20px', minWidth: 'unset', padding: 0 }}
                                          onClick={e => {
                                            e.stopPropagation()
                                            setCell(day, slot.id, { subject_id: null, teacher_id: null, room_no: '' })
                                          }}
                                        >
                                          <i className='ki-duotone ki-cross fs-9'>
                                            <span className='path1'></span><span className='path2'></span>
                                          </i>
                                        </button>
                                      </>
                                    ) : (
                                      /* Empty */
                                      <div className='d-flex align-items-center gap-1 text-muted fs-8 mt-1'>
                                        <i className='ki-duotone ki-plus-circle fs-7'>
                                          <span className='path1'></span><span className='path2'></span>
                                        </i>
                                        Click to assign
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Popup editor */}
                                {isOpen && (
                                  <CellEditorPopup
                                    day={day}
                                    slotId={slot.id}
                                    cell={cell}
                                    classSubjects={classSubjects}
                                    subjects={subjects}
                                    teachers={teachers}
                                    onSetCell={setCell}
                                    onClose={() => setEditCell(null)}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Save Footer (grid tab, section selected, slots exist) ── */}
              {sectionId && slots.length > 0 && (
                <div className='card-footer d-flex justify-content-between align-items-center'>
                  <span className='text-muted fs-7'>
                    <i className='ki-duotone ki-information fs-4 me-1 text-warning'>
                      <span className='path1'></span><span className='path2'></span><span className='path3'></span>
                    </i>
                    Click any cell to assign Subject / Teacher. Save as Draft, then Publish from the <strong>Versions</strong> tab.
                  </span>
                  <div className='d-flex gap-3'>
                    <button className='btn btn-light btn-sm' onClick={fetchGrid} disabled={loadingGrid}>
                      Reset
                    </button>
                    <button className='btn btn-success btn-sm' onClick={handleSave} disabled={saving}>
                      {saving
                        ? <><span className='spinner-border spinner-border-sm me-2'></span>Saving...</>
                        : 'Save Draft'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              VERSIONS TAB
          ═══════════════════════════════════════════════════════════════ */}
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
                  <p className='text-muted fs-6'>
                    Go to the <strong>Grid</strong> tab, fill in the timetable, and <strong>Save Draft</strong>.
                  </p>
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
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td>
                            {v.is_active ? (
                              <span className='badge badge-light-success fw-bold'>
                                <i className='ki-duotone ki-check-circle fs-6 me-1'>
                                  <span className='path1'></span><span className='path2'></span>
                                </i>
                                Published
                              </span>
                            ) : (
                              <span className='badge badge-light-warning fw-bold'>
                                <i className='ki-duotone ki-time fs-6 me-1'>
                                  <span className='path1'></span><span className='path2'></span>
                                </i>
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
                              day: '2-digit', month: 'short', year: 'numeric',
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
                                <>
                                  <i className='ki-duotone ki-cross-circle fs-5 me-1'>
                                    <span className='path1'></span><span className='path2'></span>
                                  </i>
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <i className='ki-duotone ki-send fs-5 me-1'>
                                    <span className='path1'></span><span className='path2'></span>
                                  </i>
                                  Publish
                                </>
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