import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import {
  getMySections,
  getSectionAttendance,
  markDailyAttendance,
  markPeriodAttendance,
  getSectionTimetable,
  getTeacherSessions,
} from './core/_requests'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  class_section_id: number
  class_name: string
  section_name: string
  label: string
  is_class_teacher: boolean
}

interface StudentRow {
  student_id: number
  roll_number: string
  full_name: string
  photo_url: string | null
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'NOT_MARKED'
  remark: string
}

interface TimetableEntry {
  id: number
  day_of_week: string
  subject?: { id: number; name: string; code: string }
  period_slot?: { start_time: string; end_time: string }
}

interface SessionInfo {
  id: number
  session_year: string
  attendance_mode: 'DAILY' | 'PERIOD'
  is_current: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as const
type AttendanceStatus = typeof STATUS_OPTIONS[number]

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; btnClass: string; badgeClass: string; icon: string }> = {
  PRESENT:  { label: 'Present',  btnClass: 'btn-success',   badgeClass: 'badge-light-success', icon: '✓' },
  ABSENT:   { label: 'Absent',   btnClass: 'btn-danger',    badgeClass: 'badge-light-danger',  icon: '✗' },
  LATE:     { label: 'Late',     btnClass: 'btn-warning',   badgeClass: 'badge-light-warning', icon: '⏰' },
  HALF_DAY: { label: 'Half Day', btnClass: 'btn-info',      badgeClass: 'badge-light-info',    icon: '½' },
}

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const todayStr = () => new Date().toISOString().split('T')[0]
const todayDay = DAY_NAMES[new Date().getDay()]

// ─── Wrapper Export ───────────────────────────────────────────────────────────

export const TeacherAttendancePageWrapper: FC = () => <TeacherAttendancePage />

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherAttendancePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = currentUser?.schoolId || ''

  // ─ Core state ─
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [students, setStudents] = useState<StudentRow[]>([])

  // ─ Period-wise state ─
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)

  // ─ UI state ─
  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Load session + my sections on mount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    initPage()
  }, [schoolId])

  const initPage = async () => {
    setLoadingInit(true)
    setErrorMsg(null)
    try {
      // ── Fetch session (backend returns: { success, data: [...sessions] }) ──
      const sessRes = await getTeacherSessions(schoolId)
      const rawSessions: any[] = Array.isArray(sessRes.data?.data)
        ? sessRes.data.data
        : []

      // Pick current session, fallback to first
      const activeSession: SessionInfo = rawSessions.find((s: any) => s.is_current)
        || rawSessions[0]
        || null

      setSession(activeSession)

      // ── Fetch my assigned sections ──
      const secRes = await getMySections(schoolId)
      // Backend: { success, data: { session_id, session_name, sections: [...] } }
      const sectionList: Section[] = secRes.data?.data?.sections || []
      setSections(sectionList)

      if (sectionList.length > 0) {
        setSelectedSection(sectionList[0])
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Failed to load page data. Check your login.')
    } finally {
      setLoadingInit(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: On section/date change → fetch students + attendance status
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSection) return
    fetchStudents()
  }, [selectedSection, selectedDate])

  const fetchStudents = useCallback(async () => {
    if (!selectedSection || !schoolId) return
    setLoadingStudents(true)
    setErrorMsg(null)
    try {
      // Backend: { success, data: { students: [{ student_id, roll_number, full_name, photo_url, status }] } }
      const res = await getSectionAttendance(schoolId, selectedSection.class_section_id, selectedDate)
      const raw: any[] = res.data?.data?.students || []
      setStudents(
        raw.map(s => ({
          student_id: s.student_id,
          roll_number: s.roll_number || '-',
          full_name: s.full_name,
          photo_url: s.photo_url || null,
          status: (s.status as string) === 'NOT_MARKED' ? 'NOT_MARKED' : (s.status as AttendanceStatus),
          remark: '',
        }))
      )
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Student list load nahi ho saka.')
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedSection, selectedDate, schoolId])

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: On section change in PERIOD mode → fetch today's timetable
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSection || session?.attendance_mode !== 'PERIOD') return
    fetchTimetable()
  }, [selectedSection, session])

  const fetchTimetable = useCallback(async () => {
    if (!selectedSection || !schoolId) return
    try {
      // Backend: { success, data: { MONDAY: [...], TUESDAY: [...], ... } }
      const res = await getSectionTimetable(schoolId, selectedSection.class_section_id)
      const byDay: Record<string, TimetableEntry[]> = res.data?.data || {}
      const entries: TimetableEntry[] = byDay[todayDay] || []
      setTimetableEntries(entries)
      setSelectedPeriodId(entries[0]?.id || null)
    } catch {
      setTimetableEntries([])
      setSelectedPeriodId(null)
    }
  }, [selectedSection, schoolId])

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const updateStatus = (studentId: number, status: AttendanceStatus) =>
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s))

  const updateRemark = (studentId: number, remark: string) =>
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, remark } : s))

  const markAllStatus = (status: AttendanceStatus) =>
    setStudents(prev => prev.map(s => ({ ...s, status })))

  const handleSectionSelect = (sec: Section) => {
    setStudents([])
    setTimetableEntries([])
    setSelectedSection(sec)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Submit Attendance
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedSection || !session) return

    // Check for unmarked
    const unmarked = students.filter(s => s.status === 'NOT_MARKED')
    if (unmarked.length > 0) {
      const proceed = window.confirm(`${unmarked.length} students ki attendance mark nahi ki gayi. Kya baaki ${students.length - unmarked.length} students ki attend submit karein?`)
      if (!proceed) return
    }

    const payload = students
      .filter(s => s.status !== 'NOT_MARKED')
      .map(s => ({ student_id: s.student_id, status: s.status, remark: s.remark || '' }))

    if (payload.length === 0) {
      setErrorMsg('Kam se kam ek student ki attendance mark karo.')
      return
    }

    // PERIOD mode validation
    if (session.attendance_mode === 'PERIOD' && !selectedPeriodId) {
      setErrorMsg('Period-wise mode mein pehle ek period select karo.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (session.attendance_mode === 'PERIOD') {
        await markPeriodAttendance(schoolId, {
          class_section_id: selectedSection.class_section_id,
          academic_session_id: session.id,
          timetable_entry_id: selectedPeriodId!,
          date: selectedDate,
          students: payload,
        })
        const periodName = timetableEntries.find(e => e.id === selectedPeriodId)?.subject?.name || `Period ${selectedPeriodId}`
        setSuccessMsg(`✅ "${periodName}" period ki attendance ${payload.length} students ke liye submit ho gayi!`)
      } else {
        await markDailyAttendance(schoolId, selectedSection.class_section_id, {
          date: selectedDate,
          session_id: session.id,
          students: payload,
        })
        setSuccessMsg(`✅ Daily attendance ${payload.length} students ke liye successfully submit ho gayi!`)
      }
      fetchStudents() // Refresh to show updated statuses
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || 'Attendance submit karne mein error aaya.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed stats
  // ─────────────────────────────────────────────────────────────────────────────
  const total    = students.length
  const present  = students.filter(s => s.status === 'PRESENT').length
  const absent   = students.filter(s => s.status === 'ABSENT').length
  const late     = students.filter(s => s.status === 'LATE').length
  const halfDay  = students.filter(s => s.status === 'HALF_DAY').length
  const notMarked = students.filter(s => s.status === 'NOT_MARKED').length
  const pct = total > 0 ? Math.round(((present + halfDay) / total) * 100) : 0
  const isPeriodMode = session?.attendance_mode === 'PERIOD'
  const selectedPeriod = timetableEntries.find(e => e.id === selectedPeriodId)

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageTitle breadcrumbs={[]}>Mark Attendance</PageTitle>
      <ToolbarWrapper />
      <Content>

        {/* ── Session Info Banner ── */}
        {loadingInit ? (
          <div className='text-center py-10'>
            <div className='spinner-border text-primary' role='status' />
            <p className='mt-3 text-muted'>Loading session data...</p>
          </div>
        ) : session ? (
          <div className={`alert d-flex align-items-center mb-6 border-0 ${isPeriodMode ? 'alert-warning' : 'alert-primary'}`}
            style={{ borderRadius: '12px' }}>
            <div className='me-4' style={{ fontSize: '2rem' }}>
              {isPeriodMode ? '⏱' : '📅'}
            </div>
            <div className='flex-grow-1'>
              <div className='fw-bold fs-5'>
                Academic Session: <span className='text-gray-900'>{session.session_year}</span>
                <span className={`ms-3 badge ${isPeriodMode ? 'badge-warning' : 'badge-primary'} fs-8`}>
                  {isPeriodMode ? 'Period-wise Mode' : 'Daily Mode'}
                </span>
                {session.is_current && <span className='ms-2 badge badge-light-success fs-8'>Current</span>}
              </div>
              <div className='text-muted fs-7 mt-1'>
                {isPeriodMode
                  ? '⚠️ Is session mein attendance har period ke liye alag-alag mark hoti hai. Niche period select karo.'
                  : '✅ Is session mein student ko din mein sirf ek baar present/absent mark karna hai.'}
              </div>
            </div>
          </div>
        ) : (
          <div className='alert alert-danger mb-6'>
            ❌ Koi active academic session nahi mili. Admin se session create karne ko bolein.
          </div>
        )}

        {/* ── Alerts ── */}
        {successMsg && (
          <div className='alert alert-success d-flex align-items-center mb-5'>
            <span className='me-3 fs-3'>✅</span>
            <div className='flex-grow-1'>{successMsg}</div>
            <button className='btn-close' onClick={() => setSuccessMsg(null)} />
          </div>
        )}
        {errorMsg && (
          <div className='alert alert-danger d-flex align-items-center mb-5'>
            <span className='me-3 fs-3'>❌</span>
            <div className='flex-grow-1'>{errorMsg}</div>
            <button className='btn-close' onClick={() => setErrorMsg(null)} />
          </div>
        )}

        <div className='row g-6'>
          {/* ════════════════════════════════════════
              LEFT PANEL — Section / Date / Period
          ════════════════════════════════════════ */}
          <div className='col-xl-3 col-lg-4'>

            {/* My Sections */}
            <div className='card card-flush shadow-sm mb-5'>
              <div className='card-header min-h-50px'>
                <h6 className='card-title fw-bold text-gray-700'>
                  <i className='ki-duotone ki-people fs-4 me-2'>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  My Sections
                </h6>
              </div>
              <div className='card-body pt-2 pb-4'>
                {loadingInit ? (
                  <div className='text-muted fs-7 text-center py-4'>Loading...</div>
                ) : sections.length === 0 ? (
                  <div className='text-center py-5'>
                    <div className='fs-2 mb-2'>🏫</div>
                    <div className='text-muted fs-7'>Aapko koi section assign nahi kiya gaya hai.</div>
                  </div>
                ) : (
                  <div className='d-flex flex-column gap-2'>
                    {sections.map(sec => (
                      <button
                        key={sec.class_section_id}
                        onClick={() => handleSectionSelect(sec)}
                        className={`btn btn-sm text-start py-3 px-4 fw-semibold ${
                          selectedSection?.class_section_id === sec.class_section_id
                            ? 'btn-primary'
                            : 'btn-light btn-active-light-primary'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        <div className='d-flex align-items-center gap-2'>
                          <span className='fs-4'>🏫</span>
                          <div>
                            <div>{sec.label}</div>
                            {sec.is_class_teacher && (
                              <span className='badge badge-light-success fs-9'>Class Teacher</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Selector */}
            <div className='card card-flush shadow-sm mb-5'>
              <div className='card-header min-h-50px'>
                <h6 className='card-title fw-bold text-gray-700'>
                  <i className='ki-duotone ki-calendar fs-4 me-2'>
                    <span className='path1'></span><span className='path2'></span>
                  </i>
                  Select Date
                </h6>
              </div>
              <div className='card-body pt-2 pb-4'>
                <input
                  type='date'
                  className='form-control form-control-solid'
                  value={selectedDate}
                  max={todayStr()}
                  onChange={e => setSelectedDate(e.target.value)}
                />
                <div className='text-muted fs-8 mt-2'>
                  {selectedDate === todayStr() ? '📅 Aaj (Today)' : `📆 ${selectedDate}`}
                </div>
              </div>
            </div>

            {/* Period Selector — Only in PERIOD mode */}
            {isPeriodMode && (
              <div className='card card-flush shadow-sm border border-warning'>
                <div className='card-header min-h-50px bg-light-warning rounded-top'>
                  <h6 className='card-title fw-bold text-warning'>
                    ⏱ Select Period ({todayDay})
                  </h6>
                </div>
                <div className='card-body pt-2 pb-4'>
                  {timetableEntries.length === 0 ? (
                    <div className='text-center py-4'>
                      <div className='fs-3 mb-2'>📭</div>
                      <div className='text-muted fs-7'>Aaj ke liye koi period nahi mila.</div>
                      <div className='text-muted fs-8 mt-1'>Timetable configured karo.</div>
                    </div>
                  ) : (
                    <div className='d-flex flex-column gap-2'>
                      {timetableEntries.map((entry, idx) => (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedPeriodId(entry.id)}
                          className={`btn btn-sm text-start py-3 px-3 ${
                            selectedPeriodId === entry.id ? 'btn-warning' : 'btn-light'
                          }`}
                          style={{ borderRadius: '8px' }}
                        >
                          <div className='fw-bold fs-7'>
                            P{idx + 1}: {entry.subject?.name || 'Period'}
                          </div>
                          {entry.period_slot && (
                            <div className='text-muted fs-8'>
                              {entry.period_slot.start_time} – {entry.period_slot.end_time}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              RIGHT PANEL — Student Attendance Table
          ════════════════════════════════════════ */}
          <div className='col-xl-9 col-lg-8'>
            <div className='card card-flush shadow-sm'>
              {/* Header */}
              <div className='card-header align-items-center py-4 border-bottom'>
                <div className='card-title flex-column'>
                  <h4 className='fw-bolder mb-1 text-gray-800'>
                    {selectedSection ? selectedSection.label : 'Section select karo'}
                  </h4>
                  <div className='text-muted fs-7 d-flex align-items-center gap-3 flex-wrap'>
                    <span>📅 {selectedDate}</span>
                    <span>•</span>
                    <span>{total} Students</span>
                    {isPeriodMode && selectedPeriod && (
                      <>
                        <span>•</span>
                        <span className='badge badge-light-warning'>
                          ⏱ {selectedPeriod.subject?.name || 'Period'} ({selectedPeriod.period_slot?.start_time} – {selectedPeriod.period_slot?.end_time})
                        </span>
                      </>
                    )}
                    {isPeriodMode && !selectedPeriod && (
                      <span className='badge badge-light-danger fs-8'>⚠️ Period select karo</span>
                    )}
                  </div>
                </div>
                {/* Quick mark all */}
                {total > 0 && (
                  <div className='card-toolbar d-flex gap-2 flex-wrap'>
                    <span className='text-muted fs-8 me-1 align-self-center'>Mark all:</span>
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        className={`btn btn-xs btn-sm ${STATUS_CONFIG[s].btnClass} btn-light py-1 px-2 fs-8`}
                        onClick={() => markAllStatus(s)}
                        title={`Mark all ${STATUS_CONFIG[s].label}`}
                        style={{ minWidth: '70px', opacity: 0.85 }}
                      >
                        {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              {total > 0 && (
                <div className='px-8 py-4 border-bottom bg-light-subtle'>
                  <div className='d-flex gap-5 flex-wrap align-items-center'>
                    <div className='d-flex align-items-center gap-2'>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#50cd89' }}></div>
                      <span className='fs-7 text-gray-600'>Present <strong>{present}</strong></span>
                    </div>
                    <div className='d-flex align-items-center gap-2'>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f1416c' }}></div>
                      <span className='fs-7 text-gray-600'>Absent <strong>{absent}</strong></span>
                    </div>
                    <div className='d-flex align-items-center gap-2'>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffc700' }}></div>
                      <span className='fs-7 text-gray-600'>Late <strong>{late}</strong></span>
                    </div>
                    <div className='d-flex align-items-center gap-2'>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#009ef7' }}></div>
                      <span className='fs-7 text-gray-600'>Half Day <strong>{halfDay}</strong></span>
                    </div>
                    {notMarked > 0 && (
                      <div className='d-flex align-items-center gap-2'>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#b5b5c3' }}></div>
                        <span className='fs-7 text-warning fw-bold'>Unmarked <strong>{notMarked}</strong></span>
                      </div>
                    )}
                    <div className='ms-auto'>
                      <span className={`badge fs-7 ${pct >= 75 ? 'badge-light-success' : 'badge-light-danger'}`}>
                        {pct}% Attendance
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className='progress h-8px mt-3 rounded bg-light'>
                    <div className='progress-bar bg-success' style={{ width: `${total > 0 ? (present / total) * 100 : 0}%` }} />
                    <div className='progress-bar bg-info' style={{ width: `${total > 0 ? (halfDay / total) * 100 : 0}%` }} />
                    <div className='progress-bar bg-warning' style={{ width: `${total > 0 ? (late / total) * 100 : 0}%` }} />
                    <div className='progress-bar bg-danger' style={{ width: `${total > 0 ? (absent / total) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              {/* Student Table */}
              <div className='card-body pt-0' style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {!selectedSection ? (
                  <div className='text-center py-16 text-muted'>
                    <div className='fs-1 mb-3'>👈</div>
                    <p className='fs-6'>Left panel se ek section select karo</p>
                  </div>
                ) : loadingStudents ? (
                  <div className='text-center py-16'>
                    <div className='spinner-border text-primary mb-3' role='status' />
                    <p className='text-muted'>Students load ho rahe hain...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className='text-center py-16 text-muted'>
                    <div className='fs-1 mb-3'>👤</div>
                    <p>Is section mein koi enrolled student nahi hai.</p>
                  </div>
                ) : (
                  <table className='table align-middle table-row-dashed table-hover gy-4 gs-6 fs-6 mb-0'>
                    <thead>
                      <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase border-bottom'>
                        <th style={{ width: 40 }}>#</th>
                        <th>Student</th>
                        <th style={{ minWidth: 280 }}>
                          Attendance Status
                          {isPeriodMode && <span className='text-warning ms-2 fs-8'>(Period: {selectedPeriod?.subject?.name || '—'})</span>}
                        </th>
                        <th style={{ minWidth: 160 }}>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr key={student.student_id} className={student.status === 'NOT_MARKED' ? 'bg-light-warning bg-opacity-25' : ''}>
                          <td className='text-gray-500 fw-semibold'>{idx + 1}</td>
                          <td>
                            <div className='d-flex align-items-center gap-3'>
                              <div className='symbol symbol-40px symbol-circle'>
                                {student.photo_url ? (
                                  <img src={student.photo_url} alt='' />
                                ) : (
                                  <div className='symbol-label fw-bold bg-light-primary text-primary fs-6'>
                                    {student.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className='fw-bold text-gray-800 lh-1'>{student.full_name}</div>
                                <div className='text-muted fs-8 mt-1'>Roll No: {student.roll_number}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className='d-flex gap-2 flex-wrap'>
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => updateStatus(student.student_id, opt)}
                                  className={`btn btn-sm px-3 py-2 fw-semibold fs-8 ${
                                    student.status === opt
                                      ? STATUS_CONFIG[opt].btnClass
                                      : 'btn-light btn-active-light-primary'
                                  }`}
                                  style={{ borderRadius: '6px', minWidth: '68px' }}
                                >
                                  {STATUS_CONFIG[opt].icon} {STATUS_CONFIG[opt].label}
                                </button>
                              ))}
                            </div>
                            {student.status === 'NOT_MARKED' && (
                              <span className='badge badge-light-warning fs-9 mt-1'>⚠ Mark karo</span>
                            )}
                          </td>
                          <td>
                            <input
                              type='text'
                              className='form-control form-control-sm form-control-solid'
                              placeholder='Remark (optional)'
                              value={student.remark}
                              onChange={e => updateRemark(student.student_id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              {students.length > 0 && (
                <div className='card-footer d-flex align-items-center justify-content-between py-4'>
                  <div className='fs-7'>
                    {notMarked > 0 ? (
                      <span className='text-warning fw-semibold'>⚠️ {notMarked} students ki attendance pending hai</span>
                    ) : (
                      <span className='text-success fw-semibold'>✅ Sab students ki attendance mark ho gayi</span>
                    )}
                    {isPeriodMode && !selectedPeriodId && (
                      <span className='text-danger ms-3 fw-bold'>— Period select karna zaroori hai!</span>
                    )}
                  </div>
                  <button
                    id='btn-submit-attendance'
                    className={`btn btn-sm px-7 ${isPeriodMode ? 'btn-warning' : 'btn-primary'}`}
                    onClick={handleSubmit}
                    disabled={submitting || (isPeriodMode && !selectedPeriodId)}
                  >
                    {submitting ? (
                      <>
                        <span className='spinner-border spinner-border-sm me-2' />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className='ki-duotone ki-check fs-3 me-1'></i>
                        {isPeriodMode ? '⏱ Submit Period Attendance' : '📅 Submit Daily Attendance'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default TeacherAttendancePage
