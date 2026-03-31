import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getAcademicSessions, getClasses, getClassSections } from '../academic/core/_requests'
import { SessionModel, ClassModel, ClassSectionMappingModel } from '../academic/core/_models'
import { getStudentAttendance, markStudentAttendance } from '../attendance/core/_requests'
import { StudentAttendanceRecord } from '../attendance/core/_models'
import { toast } from 'react-toastify'

const AttendancePage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  // Filter state
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
  
  const [filterSession, setFilterSession] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  // Data state
  const [attendances, setAttendances] = useState<StudentAttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Status tracking (local modifications before save)
  const [attendanceEdits, setAttendanceEdits] = useState<Record<number, { status: string; remark: string }>>({})

  // Load Filters Data
  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
      ])
      if (sRes.data.success) {
          setSessions(sRes.data.data.sessions || [])
          const current = sRes.data.data.sessions?.find(s => s.is_current)
          if(current) setFilterSession(current.id.toString())
      }
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
    } catch { }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  const handleClassFilter = async (classId: string) => {
    setFilterClass(classId)
    setFilterSection('')
    setClassSections([])
    if (!classId) return
    try {
      const { data } = await getClassSections(schoolId, classId)
      if (data.success) setClassSections(data.data.sections || [])
    } catch { }
  }

  // Fetch Attendance
  const fetchAttendance = async () => {
    if (!schoolId || !filterSection || !filterDate) {
        toast.warning('Please select Class, Section and Date')
        return
    }
    setLoading(true)
    try {
        const { data } = await getStudentAttendance(schoolId, filterSection, filterDate)
        if (data.success) {
            setAttendances(data.data.attendances || [])
            // Reset edits
            const edits: Record<number, { status: string; remark: string }> = {}
            data.data.attendances.forEach(a => {
                edits[a.student_id] = {
                    status: a.status || 'PRESENT', // default to present if blank
                    remark: a.remark || ''
                }
            })
            setAttendanceEdits(edits)
        }
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch attendance')
    } finally {
        setLoading(false)
    }
  }

  const saveAttendance = async () => {
      if(!schoolId || !filterSection || !filterDate || !filterSession) {
          toast.warning('Please select Session, Class, Section and Date before saving.')
          return
      }
      setSaving(true)
      try {
          const payload = {
              class_section_id: Number(filterSection),
              academic_session_id: Number(filterSession),
              date: filterDate,
              students: Object.keys(attendanceEdits).map(studentId => {
                  const record = attendanceEdits[Number(studentId)];
                  return {
                      student_id: Number(studentId),
                      status: record.status,
                      ...(record.remark?.trim() ? { remark: record.remark.trim() } : {})
                  };
              })
          }
          // Add a log for debugging
          console.log("Sending mark attendance payload:", payload);
          
          const { data } = await markStudentAttendance(schoolId, payload)
          if(data.success) {
              setShowSuccessModal(true)
              fetchAttendance()
          }
      } catch(error: any) {
          console.error("Attendance Mark API Error:", error.response?.data || error);
          const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to save attendance';
          toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
      } finally {
          setSaving(false)
      }
  }

  const markAll = (status: string) => {
      const newEdits = { ...attendanceEdits }
      Object.keys(newEdits).forEach(id => {
          newEdits[Number(id)].status = status
      })
      setAttendanceEdits(newEdits)
  }

  const handleStatusChange = (studentId: number, status: string) => {
      setAttendanceEdits(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], status }
      }))
  }

  const handleRemarkChange = (studentId: number, remark: string) => {
      setAttendanceEdits(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], remark }
      }))
  }

  const filteredAttendances = attendances.filter(a => {
      if (!search) return true
      const name = `${a.first_name} ${a.last_name}`.toLowerCase()
      return name.includes(search.toLowerCase())
  })

  // Status options
  const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE']

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* Filter Bar */}
        <div className='card card-flush mb-5'>
          <div className='card-body py-4'>
            <div className='row g-4 align-items-end'>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Academic Session</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSession}
                  onChange={e => setFilterSession(e.target.value)}>
                  <option value=''>Select Session</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.session_year} {s.is_current ? '★' : ''}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-2'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Class</label>
                <select className='form-select form-select-solid form-select-sm' value={filterClass}
                  onChange={e => handleClassFilter(e.target.value)}>
                  <option value=''>Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className='col-md-2'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Section</label>
                <select className='form-select form-select-solid form-select-sm' value={filterSection}
                  onChange={e => setFilterSection(e.target.value)} disabled={!filterClass}>
                  <option value=''>Select Section</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.section?.name}</option>)}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Date</label>
                <input type='date' className='form-control form-control-solid form-control-sm' 
                       value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              <div className='col-md-2'>
                <button className='btn btn-primary btn-sm w-100' onClick={fetchAttendance} disabled={loading || !filterSection || !filterDate}>
                    {loading ? <span className='spinner-border spinner-border-sm'></span> : 'Fetch'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className='card card-flush'>
          <div className='card-header d-flex flex-wrap align-items-center py-5 gap-2 gap-md-5'>
            <div className='card-title d-flex align-items-center gap-4'>
              <div className='d-flex align-items-center position-relative my-1'>
                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'>
                  <span className='path1'></span><span className='path2'></span>
                </i>
                <input type='text' className='form-control form-control-solid w-250px ps-14'
                  placeholder='Search by name...' value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {/* Visual Indicator showing if attendance is already recorded */}
              {attendances.some(a => a.attendance_id) && (
                  <span className='badge badge-success fs-7 fw-bold px-4 py-3'>
                    <i className='ki-duotone ki-check-circle fs-4 text-white me-2'><span className='path1'></span><span className='path2'></span></i>
                    Attendance Submitted
                  </span>
              )}
            </div>
            <div className='card-toolbar'>
              <button className='btn btn-light-success btn-sm me-2' onClick={() => markAll('PRESENT')} disabled={attendances.length === 0}>
                  Mark All Present
              </button>
              <button className='btn btn-light-danger btn-sm' onClick={() => markAll('ABSENT')} disabled={attendances.length === 0}>
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
                    <th className='min-w-150px'>Student</th>
                    <th className='min-w-300px'>Attendance Status</th>
                    <th className='min-w-200px'>Remark</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {attendances.length === 0 ? (
                      <tr>
                          <td colSpan={4} className='text-center py-10 text-muted'>
                              {loading ? 'Fetching attendance records...' : 'No records found. Select class, section and date to fetch.'}
                          </td>
                      </tr>
                  ) : filteredAttendances.map((student, idx) => (
                      <tr key={student.student_id}>
                          <td>{idx + 1}</td>
                          <td>
                              <div className='d-flex align-items-center'>
                                  <div className='symbol symbol-circle symbol-35px overflow-hidden me-3'>
                                      <div className='symbol-label fs-3 bg-light-primary text-primary'>
                                          {student.first_name.charAt(0)}
                                      </div>
                                  </div>
                                  <div className='d-flex flex-column'>
                                      <span className='text-gray-800 fw-bold mb-1'>
                                          {student.first_name} {student.last_name}
                                      </span>
                                      <span className='text-muted fs-7'>ID: {student.student_id}</span>
                                  </div>
                              </div>
                          </td>
                          <td>
                              <div className='d-flex flex-wrap gap-2'>
                                  {STATUSES.map(status => {
                                      const isChecked = attendanceEdits[student.student_id]?.status === status;
                                      let colorClass = 'primary';
                                      if (status === 'PRESENT') colorClass = 'success';
                                      if (status === 'ABSENT') colorClass = 'danger';
                                      if (status === 'LATE') colorClass = 'warning';
                                      if (status === 'HALF_DAY') colorClass = 'info';
                                      if (status === 'LEAVE') colorClass = 'secondary';
                                      
                                      return (
                                          <label key={status} className={`btn btn-sm btn-outline btn-outline-dashed px-3 py-2 cursor-pointer
                                              ${isChecked ? `btn-active-light-${colorClass} active border-${colorClass}` : 'btn-active-light-primary border-gray-300'}
                                          `}>
                                              <input
                                                  type='radio'
                                                  className='btn-check'
                                                  name={`status_${student.student_id}`}
                                                  value={status}
                                                  checked={isChecked}
                                                  onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                                              />
                                              <span className={`fw-bold ${isChecked ? `text-${colorClass}` : 'text-gray-600'}`}>
                                                  {status}
                                              </span>
                                          </label>
                                      );
                                  })}
                              </div>
                          </td>
                          <td>
                              <input 
                                  type='text' 
                                  className='form-control form-control-sm form-control-solid' 
                                  placeholder='Add remark...'
                                  value={attendanceEdits[student.student_id]?.remark || ''}
                                  onChange={(e) => handleRemarkChange(student.student_id, e.target.value)}
                              />
                          </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {attendances.length > 0 && (
                <div className='d-flex justify-content-end mt-5'>
                    <button className='btn btn-primary' onClick={saveAttendance} disabled={saving}>
                        {saving ? <span className='spinner-border spinner-border-sm me-2'></span> : <i className='ki-duotone ki-check fs-2'><span className='path1'></span><span className='path2'></span></i>}
                        {attendances.some(a => a.attendance_id) ? 'Update Attendance' : 'Save Attendance'}
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
                      <p className='text-gray-600 fs-5 mb-8'>Your attendance has been successfully saved.</p>
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

const AttendanceWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Student Attendance</PageTitle>
      <AttendancePage />
    </>
  )
}

export { AttendanceWrapper }
