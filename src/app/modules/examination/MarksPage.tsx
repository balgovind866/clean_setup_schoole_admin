import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getExamGroups, getGroupExams, getMarksheet, bulkMarksEntry } from './core/_requests'
import { ExamGroup, ExamSubject, MarksheetStudent, ExamResult } from './core/_models'
import { getClasses } from '../academic/core/_requests'

const MarksPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [groups, setGroups] = useState<ExamGroup[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [groupExams, setGroupExams] = useState<ExamSubject[]>([])
  const [students, setStudents] = useState<MarksheetStudent[]>([])
  const [existingResults, setExistingResults] = useState<ExamResult[]>([])

  const [filterGroup, setFilterGroup] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterExam, setFilterExam] = useState('')

  const [marks, setMarks] = useState<Record<number, { marks: string; absent: boolean; remarks: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [gRes, cRes] = await Promise.all([getExamGroups(schoolId), getClasses(schoolId, 1, 100)])
      if (gRes.data.success) setGroups(gRes.data.data || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
    } catch { }
  }, [schoolId])

  useEffect(() => { loadMeta() }, [loadMeta])

  // When group changes, load exams for that group
  useEffect(() => {
    if (!filterGroup) { setGroupExams([]); setFilterExam(''); return }
    getGroupExams(schoolId, Number(filterGroup)).then(r => {
      if (r.data.success) setGroupExams(r.data.data || [])
    }).catch(() => { })
  }, [filterGroup, schoolId])

  // When group + class selected, load marksheet for context
  const loadMarksheet = useCallback(async () => {
    if (!filterGroup || !filterClass) { setStudents([]); setExistingResults([]); return }
    setLoading(true)
    try {
      const { data } = await getMarksheet(schoolId, Number(filterGroup), Number(filterClass))
      if (data.success) {
        setStudents(data.data.students || [])
        setExistingResults(data.data.results || [])
        // Pre-fill marks from existing results for the selected exam
        const initMarks: Record<number, { marks: string; absent: boolean; remarks: string }> = {}
        ;(data.data.students || []).forEach(s => {
          const existing = (data.data.results || []).find(r => r.student_id === s.id && String(r.exam_id) === filterExam)
          initMarks[s.id] = {
            marks: existing ? existing.marks_obtained : '',
            absent: existing ? existing.is_absent : false,
            remarks: existing ? (existing.remarks || '') : '',
          }
        })
        setMarks(initMarks)
      }
    } catch { } finally { setLoading(false) }
  }, [schoolId, filterGroup, filterClass, filterExam])

  useEffect(() => { loadMarksheet() }, [loadMarksheet])

  const handleMarkChange = (studentId: number, field: 'marks' | 'absent' | 'remarks', value: any) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  const handleSave = async () => {
    if (!filterExam || !students.length) return
    setSaving(true); setSaveMsg(null)
    try {
      // Create payload matching exact Postman format
      const payload = students
        .filter(s => {
          const m = marks[s.id]
          return m && (m.marks !== '' || m.absent)
        })
        .map(s => {
          const m = marks[s.id]
          const isAbsent = Boolean(m.absent)
          const markVal = isAbsent ? 0 : Number(m.marks || 0)
          
          const entry: any = {
            student_id: Number(s.id),
            marks_obtained: markVal,
            is_absent: isAbsent,
          }
          if (m.remarks && m.remarks.trim() !== '') {
            entry.remarks = m.remarks.trim()
          }
          return entry
        })

      console.log('Sending payload:', { exam_id: Number(filterExam), marks: payload })

      if (payload.length === 0) {
        setSaveMsg({ type: 'danger', text: 'No marks entered to save.' })
        setSaving(false)
        return
      }

      const { data } = await bulkMarksEntry(schoolId, Number(filterExam), payload)
      setSaveMsg({ type: 'success', text: `✓ ${data.count || 0} student marks saved successfully!` })
      loadMarksheet()
    } catch (e: any) {
      const errData = e.response?.data;
      console.error('Save marks error response:', errData);
      const errMsg = errData?.message || errData?.error || e.message || 'Failed to save marks';
      setSaveMsg({ type: 'danger', text: `Error: ${errMsg}. Check console.` })
    } finally { setSaving(false) }
  }

  const selectedExam = groupExams.find(e => String(e.id) === filterExam)
  const isReady = filterGroup && filterClass && filterExam && students.length > 0

  return (
    <>
      <ToolbarWrapper />
      <Content>
        {/* ── Filters ── */}
        <div className='card card-flush shadow-sm mb-6'>
          <div className='card-header border-0 pt-6 align-items-center flex-wrap gap-4'>
            <h3 className='card-title fw-bold'>Bulk Marks Entry</h3>
            <div className='d-flex gap-3 flex-wrap'>
              <select className='form-select form-select-solid form-select-sm w-180px' value={filterGroup}
                onChange={e => { setFilterGroup(e.target.value); setFilterExam(''); setFilterClass('') }}>
                <option value=''>Select Exam Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>

              <select className='form-select form-select-solid form-select-sm w-150px' value={filterClass}
                disabled={!filterGroup}
                onChange={e => setFilterClass(e.target.value)}>
                <option value=''>Select Class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select className='form-select form-select-solid form-select-sm w-180px' value={filterExam}
                disabled={!filterGroup || !groupExams.length}
                onChange={e => setFilterExam(e.target.value)}>
                <option value=''>Select Subject</option>
                {groupExams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.subject?.name || `Exam #${e.id}`} (Max: {e.max_marks})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Marks Table ── */}
        {!isReady ? (
          <div className='card card-flush shadow-sm'>
            <div className='card-body text-center py-16'>
              <i className='ki-duotone ki-pencil fs-5x text-gray-300 mb-4'><span className='path1' /><span className='path2' /></i>
              <p className='text-muted fw-semibold fs-5'>Select an Exam Group, Class and Subject to begin marks entry</p>
            </div>
          </div>
        ) : (
          <div className='card card-flush shadow-sm'>
            <div className='card-header border-0 pt-6 align-items-center'>
              <div>
                <h4 className='fw-bold mb-1'>{selectedExam?.subject?.name} — Marks Entry</h4>
                <span className='text-muted fs-7'>
                  Max Marks: {selectedExam?.max_marks} &nbsp;|&nbsp; Min Marks: {selectedExam?.min_marks} &nbsp;|&nbsp; {students.length} Students
                </span>
              </div>
              <button className='btn btn-primary btn-sm' onClick={handleSave} disabled={saving}>
                {saving ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</> : <><i className='ki-duotone ki-check fs-4 me-1'><span className='path1' /><span className='path2' /></i>Save All Marks</>}
              </button>
            </div>
            <div className='card-body pt-4'>
              {saveMsg && (
                <div className={`alert alert-${saveMsg.type} mb-4 fw-semibold`}>{saveMsg.text}</div>
              )}
              {loading ? (
                <div className='text-center py-10'><span className='spinner-border text-primary' /></div>
              ) : (
                <div className='table-responsive'>
                  <table className='table align-middle table-row-dashed fs-6 gy-4'>
                    <thead>
                      <tr className='text-gray-400 fw-bold fs-7 text-uppercase'>
                        <th>#</th>
                        <th>Student</th>
                        <th>Roll No.</th>
                        <th>Marks Obtained <span className='text-danger'>*</span></th>
                        <th>Absent</th>
                        <th>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody className='fw-semibold text-gray-600'>
                      {students.map((s, idx) => {
                        const existing = existingResults.find(r => r.student_id === s.id && String(r.exam_id) === filterExam)
                        const m = marks[s.id] || { marks: '', absent: false, remarks: '' }
                        const pct = selectedExam && m.marks ? (Number(m.marks) / Number(selectedExam.max_marks) * 100) : 0
                        const isPass = selectedExam ? Number(m.marks) >= Number(selectedExam.min_marks) : null

                        return (
                          <tr key={s.id} className={m.absent ? 'opacity-50' : ''}>
                            <td><span className='text-muted'>{idx + 1}</span></td>
                            <td>
                              <div className='d-flex align-items-center gap-3'>
                                <div className='symbol symbol-35px'>
                                  <div className='symbol-label fw-bolder text-primary bg-light-primary'>
                                    {s.first_name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <div className='fw-bold text-gray-800'>{s.first_name} {s.last_name}</div>
                                  {existing && <div className='badge badge-light-info fs-9 mt-1'>Saved: {existing.marks_obtained}</div>}
                                </div>
                              </div>
                            </td>
                            <td className='text-muted'>{s.enrollments?.[0]?.roll_number || '—'}</td>
                            <td style={{ width: 140 }}>
                              <input
                                className={`form-control form-control-sm form-control-solid text-center fw-bold ${!m.absent && m.marks && isPass !== null ? (isPass ? 'border-success' : 'border-danger') : ''}`}
                                type='number'
                                min='0'
                                max={selectedExam?.max_marks}
                                value={m.absent ? '' : m.marks}
                                disabled={m.absent}
                                placeholder='—'
                                onChange={e => handleMarkChange(s.id, 'marks', e.target.value)}
                              />
                            </td>
                            <td>
                              <div className='form-check form-check-custom form-check-solid form-check-sm'>
                                <input className='form-check-input' type='checkbox' checked={m.absent}
                                  onChange={e => handleMarkChange(s.id, 'absent', e.target.checked)} />
                                <label className='form-check-label text-muted fs-8'>Absent</label>
                              </div>
                            </td>
                            <td>
                              {m.absent
                                ? <span className='badge badge-light-dark'>AB</span>
                                : existing?.grade_name
                                  ? <span className='badge badge-light-success fw-bold'>{existing.grade_name}</span>
                                  : m.marks
                                    ? <span className={`badge badge-light-${isPass ? 'success' : 'danger'} fw-bold`}>{pct.toFixed(0)}%</span>
                                    : <span className='text-muted'>—</span>
                              }
                            </td>
                            <td style={{ width: 160 }}>
                              <input className='form-control form-control-sm form-control-solid' value={m.remarks}
                                placeholder='Optional...'
                                onChange={e => handleMarkChange(s.id, 'remarks', e.target.value)} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className='card-footer border-0 d-flex justify-content-end'>
              <button className='btn btn-primary' onClick={handleSave} disabled={saving}>
                {saving ? <><span className='spinner-border spinner-border-sm me-2' />Saving...</> : 'Save All Marks'}
              </button>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

const MarksWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Examination', path: '/examination/marks', isActive: false }, { title: 'Marks Entry', path: '/examination/marks', isActive: true }]}>
      Marks Entry
    </PageTitle>
    <MarksPage />
  </>
)

export { MarksWrapper }
