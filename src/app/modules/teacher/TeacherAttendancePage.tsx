import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import {
  getTeacherSessions,
  getMySections,
  getSectionAttendance,
  markDailyAttendance,
  getTodayPeriods,
  getPeriodStudents,
  markPeriodAttendanceByEntry,
} from './core/_requests'
import { toast } from 'react-toastify'

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceMode = 'DAILY' | 'PERIOD'
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'NOT_MARKED'

interface SessionInfo {
  id: number
  session_year: string
  attendance_mode: AttendanceMode
  is_current: boolean
}

interface Section {
  class_section_id: number
  label: string
  class_name: string
  section_name: string
  is_class_teacher: boolean
}

interface Student {
  student_id: number
  roll_number: string
  full_name: string
  photo_url: string | null
  status: AttendanceStatus
  remark: string
}

interface PeriodEntry {
  timetable_entry_id: number
  day_of_week: string
  attendance_marked: boolean
  period_slot: { id?: number; name?: string; start_time: string; end_time: string }
  subject: { id: number; name: string; code: string }
  class_section: { id: number; label: string; class_id?: number; section_id?: number }
}

const todayStr = () => new Date().toISOString().split('T')[0]

// ─── Wrapper ──────────────────────────────────────────────────────────────────

export const TeacherAttendancePageWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[]}>Mark Attendance</PageTitle>
    <TeacherAttendancePage />
  </>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherAttendancePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = currentUser?.schoolId || ''

  // ── Session ──
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // ── DAILY mode state ──
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // ── PERIOD mode state ──
  const [periods, setPeriods] = useState<PeriodEntry[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')

  // ── Shared ──
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [students, setStudents] = useState<Student[]>([])
  const [loadingLeft, setLoadingLeft] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // ════════════════════════════════════════════════════════════
  // STEP 1: On mount → fetch session, detect mode, load left panel
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!schoolId) return
    bootstrapPage()
  }, [schoolId])

  const bootstrapPage = async () => {
    setLoadingSession(true)
    try {
      const sessRes = await getTeacherSessions(schoolId)
      const allSessions: SessionInfo[] = Array.isArray(sessRes.data?.data) ? sessRes.data.data : []
      const active = allSessions.find(s => s.is_current) || allSessions[0] || null
      setSession(active)

      if (active?.attendance_mode === 'PERIOD') {
        await loadPeriods(todayStr(), active)
      } else {
        await loadSections()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load session data.')
    } finally {
      setLoadingSession(false)
    }
  }

  const loadSections = async () => {
    setLoadingLeft(true)
    try {
      const res = await getMySections(schoolId)
      const list: Section[] = res.data?.data?.sections || []
      setSections(list)
    } catch (err: any) {
      toast.error('Sections load nahi ho sake.')
    } finally {
      setLoadingLeft(false)
    }
  }

  const loadPeriods = async (date: string, sess?: SessionInfo | null) => {
    setLoadingLeft(true)
    setStudents([])
    setSelectedPeriodId('')
    try {
      const res = await getTodayPeriods(schoolId, date)
      const list: PeriodEntry[] = res.data?.data?.periods || []
      setPeriods(list)
    } catch (err: any) {
      toast.error('Periods load nahi ho sake.')
    } finally {
      setLoadingLeft(false)
    }
  }

  const fetchAttendance = useCallback(async () => {
    if (!schoolId || !session) return

    setLoadingStudents(true)
    setStudents([])

    try {
      if (session.attendance_mode === 'DAILY') {
        if (!selectedSectionId) {
            toast.warning('Please select a Section')
            setLoadingStudents(false)
            return
        }
        const res = await getSectionAttendance(schoolId, parseInt(selectedSectionId), selectedDate)
        const raw: any[] = res.data?.data?.students || []
        setStudents(mapStudents(raw))
      } else {
        if (!selectedPeriodId) {
            toast.warning('Please select a Period')
            setLoadingStudents(false)
            return
        }
        const res = await getPeriodStudents(schoolId, parseInt(selectedPeriodId), selectedDate)
        const raw: any[] = res.data?.data?.students || []
        setStudents(mapStudents(raw))
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Students load nahi ho sake.')
    } finally {
      setLoadingStudents(false)
    }
  }, [session, selectedSectionId, selectedPeriodId, selectedDate, schoolId])

  const mapStudents = (raw: any[]): Student[] =>
    raw.map(s => ({
      student_id: s.student_id,
      roll_number: s.roll_number || '-',
      full_name: s.full_name,
      photo_url: s.photo_url || null,
      status: (s.status as AttendanceStatus) || 'NOT_MARKED',
      remark: s.remark || '',
    }))

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setStudents([])
    if (session?.attendance_mode === 'PERIOD') {
      loadPeriods(date)
    }
  }

  const updateStatus = (id: number, status: Exclude<AttendanceStatus, 'NOT_MARKED'>) =>
    setStudents(prev => prev.map(s => s.student_id === id ? { ...s, status } : s))

  const updateRemark = (id: number, remark: string) =>
    setStudents(prev => prev.map(s => s.student_id === id ? { ...s, remark } : s))

  const markAll = (status: Exclude<AttendanceStatus, 'NOT_MARKED'>) =>
    setStudents(prev => prev.map(s => ({ ...s, status })))

  const handleSubmit = async () => {
    if (!session) return

    const unmarked = students.filter(s => s.status === 'NOT_MARKED')
    if (unmarked.length > 0) {
      const ok = window.confirm(`${unmarked.length} students unmarked hain. Baaki ${students.length - unmarked.length} ki attendance submit karein?`)
      if (!ok) return
    }

    const payload = students
      .filter(s => s.status !== 'NOT_MARKED')
      .map(s => ({ student_id: s.student_id, status: s.status, remark: s.remark || '' }))

    if (payload.length === 0) {
      toast.warning('Koi attendance mark nahi ki gayi.')
      return
    }

    setSubmitting(true)

    try {
      if (session.attendance_mode === 'PERIOD') {
        const periodId = parseInt(selectedPeriodId)
        if (!periodId) { toast.error('Period select karo.'); setSubmitting(false); return }
        await markPeriodAttendanceByEntry(schoolId, periodId, {
            date: selectedDate,
            students: payload,
        })
        setShowSuccessModal(true)
        loadPeriods(selectedDate)
        fetchAttendance()
      } else {
        const sectionId = parseInt(selectedSectionId)
        if (!sectionId) { toast.error('Section select karo.'); setSubmitting(false); return }
        await markDailyAttendance(schoolId, sectionId, {
            date: selectedDate,
            session_id: session.id,
            students: payload,
        })
        setShowSuccessModal(true)
        fetchAttendance()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Submit error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true
    return s.full_name.toLowerCase().includes(search.toLowerCase())
  })

  const isPeriod = session?.attendance_mode === 'PERIOD'
  const STATUSES: Exclude<AttendanceStatus, 'NOT_MARKED'>[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']
  const isAlreadyMarked = isPeriod && periods.find(p => p.timetable_entry_id === parseInt(selectedPeriodId))?.attendance_marked

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* Session Banner */}
        {!loadingSession && session && (
            <div className='notice d-flex bg-light-primary rounded border-primary border border-dashed mb-5 p-4'>
                <i className={`ki-duotone ${isPeriod ? 'ki-time' : 'ki-calendar'} fs-1 text-primary me-4 mt-1`}>
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <div className="d-flex flex-stack flex-grow-1">
                    <div className="fw-semibold">
                        <h5 className="text-gray-900 fw-bold mb-1">Academic Session: {session.session_year}</h5>
                        <div className="fs-7 text-gray-700">
                            {isPeriod ? 'Period-wise Attendance Mode. Select a period below to mark attendance.' : 'Daily Attendance Mode. Select your section below.'}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Filter Bar */}
        <div className='card card-flush mb-5'>
          <div className='card-body py-4'>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Date</label>
                <input type='date' className='form-control form-control-solid form-control-sm' 
                       value={selectedDate} max={todayStr()} onChange={e => handleDateChange(e.target.value)} />
              </div>

              {!loadingSession && isPeriod && (
                  <div className='col-md-4'>
                    <label className='fw-semibold fs-7 mb-1 text-gray-600'>Select Period</label>
                    <select className='form-select form-select-solid form-select-sm' value={selectedPeriodId}
                      onChange={e => setSelectedPeriodId(e.target.value)}>
                      <option value=''>-- Select Period --</option>
                      {periods.map((p, idx) => (
                        <option key={p.timetable_entry_id} value={p.timetable_entry_id}>
                            P{idx + 1}: {p.subject.name} ({p.class_section.label}) - {p.period_slot.start_time} to {p.period_slot.end_time} {p.attendance_marked ? '✅' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
              )}

              {!loadingSession && !isPeriod && (
                  <div className='col-md-4'>
                    <label className='fw-semibold fs-7 mb-1 text-gray-600'>Select Section</label>
                    <select className='form-select form-select-solid form-select-sm' value={selectedSectionId}
                      onChange={e => setSelectedSectionId(e.target.value)}>
                      <option value=''>-- Select Section --</option>
                      {sections.map(s => (
                        <option key={s.class_section_id} value={s.class_section_id}>
                            {s.label} {s.is_class_teacher ? '(Class Teacher)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
              )}

              <div className='col-md-2'>
                <button className='btn btn-sm w-100 btn-primary' 
                        onClick={fetchAttendance} disabled={loadingStudents || (isPeriod ? !selectedPeriodId : !selectedSectionId)}>
                    {loadingStudents ? <span className='spinner-border spinner-border-sm'></span> : 'Fetch Students'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className='card card-flush'>
          <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
            <div className='card-title d-flex align-items-center gap-4'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search student...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              
              {isAlreadyMarked && (
                  <span className='badge badge-light-success fs-7 fw-bold px-4 py-3'>
                    <i className='ki-duotone ki-check-circle fs-4 text-success me-2'><span className='path1'></span><span className='path2'></span></i>
                    All marked for this period
                  </span>
              )}
            </div>
            
            <div className='card-toolbar'>
                <button className='btn btn-light-success btn-sm me-2' onClick={() => markAll('PRESENT')} disabled={students.length === 0}>
                    Mark All Present
                </button>
                <button className='btn btn-light-danger btn-sm' onClick={() => markAll('ABSENT')} disabled={students.length === 0}>
                    Mark All Absent
                </button>
            </div>
          </div>

          <div className='card-body pt-0'>
              <div className='table-responsive'>
                  <table className='table align-middle table-row-dashed fs-6 gy-5'>
                      <thead>
                          <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                              <th className='w-50px'>#</th>
                              <th className='min-w-200px'>Student</th>
                              <th className='min-w-350px'>Attendance Status</th>
                              <th className='min-w-200px'>Remark</th>
                          </tr>
                      </thead>
                      <tbody className='fw-semibold text-gray-600'>
                          {students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className='text-center py-10 text-muted'>
                                        {loadingStudents ? 'Fetching students...' : 'Select a period/section and fetch students to mark attendance.'}
                                    </td>
                                </tr>
                          ) : filteredStudents.map((student, idx) => (
                              <tr key={student.student_id}>
                                  <td>{idx + 1}</td>
                                  <td>
                                      <div className='d-flex align-items-center'>
                                          <div className='symbol symbol-circle symbol-35px overflow-hidden me-3'>
                                              {student.photo_url ? (
                                                <div className='symbol-label'>
                                                    <img src={student.photo_url} alt={student.full_name} className='w-100' />
                                                </div>
                                              ) : (
                                                  <div className='symbol-label fs-3 bg-light-primary text-primary'>
                                                      {student.full_name.charAt(0)}
                                                  </div>
                                              )}
                                          </div>
                                          <div className='d-flex flex-column'>
                                              <span className='text-gray-800 fw-bold mb-1'>
                                                  {student.full_name}
                                              </span>
                                              <span className='text-muted fs-7'>Roll No: {student.roll_number}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td>
                                      <div className='d-flex flex-wrap gap-2'>
                                            {STATUSES.map(status => {
                                                const isChecked = student.status === status;
                                                let colorClass = 'primary';
                                                if (status === 'PRESENT') colorClass = 'success';
                                                if (status === 'ABSENT') colorClass = 'danger';
                                                if (status === 'LATE') colorClass = 'warning';
                                                if (status === 'HALF_DAY') colorClass = 'info';
                                                
                                                return (
                                                    <label key={status} className={`btn btn-sm btn-outline btn-outline-dashed px-3 py-2 cursor-pointer
                                                        ${isChecked ? `btn-active-light-${colorClass} active border-${colorClass}` : 'btn-active-light-primary border-gray-300'}
                                                    `}>
                                                        <input
                                                            type='radio'
                                                            className='btn-check'
                                                            value={status}
                                                            checked={isChecked}
                                                            onChange={() => updateStatus(student.student_id, status)}
                                                        />
                                                        <span className={`fw-bold ${isChecked ? `text-${colorClass}` : 'text-gray-600'}`}>
                                                            {status}
                                                        </span>
                                                    </label>
                                                );
                                            })}

                                            {student.status === 'NOT_MARKED' && (
                                                <span className='badge badge-light-warning fs-8 align-self-center'>⚠ Mark pending</span>
                                            )}
                                      </div>
                                  </td>
                                  <td>
                                      <input 
                                          type='text' 
                                          className='form-control form-control-sm form-control-solid' 
                                          placeholder='Add remark...'
                                          value={student.remark}
                                          onChange={(e) => updateRemark(student.student_id, e.target.value)}
                                      />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {students.length > 0 && (
                  <div className='d-flex justify-content-end mt-5'>
                      <button className='btn btn-primary' onClick={handleSubmit} disabled={submitting}>
                          {submitting ? <span className='spinner-border spinner-border-sm me-2'></span> : <i className='ki-duotone ki-check fs-2'><span className='path1'></span><span className='path2'></span></i>}
                          {isPeriod ? 'Submit Period Attendance' : 'Submit Daily Attendance'}
                      </button>
                  </div>
              )}
          </div>
        </div>

      </Content>

      {/* Success Modal */}
      <div className={`modal fade ${showSuccessModal ? 'show d-block' : ''}`} tabIndex={-1} style={{ backgroundColor: showSuccessModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content'>
                  <div className='modal-body text-center py-10'>
                      <div className='mb-5'>
                          <i className='ki-duotone ki-check-circle fs-5x text-success'>
                              <span className='path1'></span><span className='path2'></span>
                          </i>
                      </div>
                      <h2 className='fw-bolder text-gray-900 mb-3'>Success!</h2>
                      <p className='text-gray-600 fs-5 mb-8'>Attendance has been successfully saved.</p>
                      <button type='button' className='btn btn-primary px-8' onClick={() => setShowSuccessModal(false)}>
                          Done
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </>
  )
}

export default TeacherAttendancePage
