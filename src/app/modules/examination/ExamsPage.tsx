import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
  getGradeScales, createGradeScale, updateGradeScale, deleteGradeScale,
  getExamGroups, getGroupExams, createExamGroup, updateExamGroup, deleteExamGroup,
  assignClassesToGroup, addExamsToGroup, deleteExamSubject,
  getGroupSchedule, createSchedule, deleteSchedule, downloadSchedulePdf,
  removeClassesFromGroup,
} from './core/_requests'
import { GradeScale, ExamGroup, ExamSubject, ExamSchedule } from './core/_models'
import { getAcademicSessions, getClasses, getClassSections, getSubjects } from '../academic/core/_requests'
import { getTeachers } from '../teachers/core/_requests'

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'warning', PUBLISHED: 'success', COMPLETED: 'primary',
}

const ExamsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [activeTab, setActiveTab] = useState<'groups' | 'grades'>('groups')

  // ── Meta ──────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [allSubjects, setAllSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  const loadMeta = useCallback(async () => {
    if (!schoolId) return
    try {
      const [sRes, cRes, subRes, tRes] = await Promise.all([
        getAcademicSessions(schoolId, 1, 100),
        getClasses(schoolId, 1, 100),
        getSubjects(schoolId),
        getTeachers(schoolId, { page: 1, limit: 1000 })
      ])
      if (sRes.data.success) setSessions(sRes.data.data.sessions || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      if ((subRes.data as any).success) setAllSubjects((subRes.data as any).data?.subjects || (subRes.data as any).data || [])
      if (tRes.data.success) setTeachers(tRes.data.data?.teachers || tRes.data.data || [])
    } catch { }
  }, [schoolId])

  // ── Grade Scales ──────────────────────────────────────────────────────────
  const [grades, setGrades] = useState<GradeScale[]>([])
  const [gradeModal, setGradeModal] = useState(false)
  const [editGrade, setEditGrade] = useState<GradeScale | null>(null)
  const [gradeForm, setGradeForm] = useState<{ exam_type: 'SCHOOL' | 'BOARD', grade_name: string, min_percentage: string, max_percentage: string, grade_point: string, description: string }>({
    exam_type: 'SCHOOL', grade_name: '', min_percentage: '', max_percentage: '', grade_point: '', description: ''
  })
  const [gradeSaving, setGradeSaving] = useState(false)

  const loadGrades = useCallback(async () => {
    if (!schoolId) return
    try {
      const { data } = await getGradeScales(schoolId)
      if (data.success) setGrades(data.data || [])
    } catch { }
  }, [schoolId])

  const openGradeModal = (g?: GradeScale) => {
    if (g) {
      setEditGrade(g)
      setGradeForm({
        exam_type: g.exam_type, grade_name: g.grade_name,
        min_percentage: g.min_percentage, max_percentage: g.max_percentage,
        grade_point: g.grade_point, description: g.description || '',
      })
    } else {
      setEditGrade(null)
      setGradeForm({ exam_type: 'SCHOOL', grade_name: '', min_percentage: '', max_percentage: '', grade_point: '', description: '' })
    }
    setGradeModal(true)
  }

  const saveGrade = async () => {
    setGradeSaving(true)
    try {
      const payload = {
        exam_type: gradeForm.exam_type,
        grade_name: gradeForm.grade_name,
        min_percentage: Number(gradeForm.min_percentage),
        max_percentage: Number(gradeForm.max_percentage),
        grade_point: Number(gradeForm.grade_point),
        description: gradeForm.description || undefined,
      }
      if (editGrade) await updateGradeScale(schoolId, editGrade.id, payload)
      else await createGradeScale(schoolId, payload)
      setGradeModal(false)
      loadGrades()
    } catch { } finally { setGradeSaving(false) }
  }

  const removeGrade = async (id: number) => {
    if (!confirm('Delete this grade scale?')) return
    await deleteGradeScale(schoolId, id)
    loadGrades()
  }

  // ── Exam Groups ───────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<ExamGroup[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [editGroup, setEditGroup] = useState<ExamGroup | null>(null)
  const [groupForm, setGroupForm] = useState<{ name: string, type: 'SCHOOL' | 'BOARD', academic_session_id: string, description: string }>({ name: '', type: 'SCHOOL', academic_session_id: '', description: '' })
  const [groupSaving, setGroupSaving] = useState(false)

  // ── Detail Wizard (for a selected group) ─────────────────────────────────
  const [selectedGroup, setSelectedGroup] = useState<ExamGroup | null>(null)
  const [wizardTab, setWizardTab] = useState<'classes' | 'subjects' | 'schedule'>('classes')
  const [groupSections, setGroupSections] = useState<any[]>([])

  // Classes assignment
  const [classRows, setClassRows] = useState<{ class_id: string; section_id: string; sections: any[] }[]>([{ class_id: '', section_id: '', sections: [] }])
  const [classAssigning, setClassAssigning] = useState(false)

  // Subjects
  const [groupExams, setGroupExams] = useState<ExamSubject[]>([])
  const [subjectRows, setSubjectRows] = useState<{ subject_id: string; max_marks: string; min_marks: string; credit_hours: string }[]>([{ subject_id: '', max_marks: '100', min_marks: '33', credit_hours: '' }])
  const [subjectSaving, setSubjectSaving] = useState(false)

  // Schedule
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [schedClassId, setSchedClassId] = useState<string>('')
  const [schedSectionId, setSchedSectionId] = useState<string>('')
  const [scheduleGrid, setScheduleGrid] = useState<Record<number, { date: string; start_time: string; end_time: string; room_no: string; invigilator_id: string }>>({})
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const handleDownloadSchedulePdf = async () => {
    if (!selectedGroup || !schedSectionId) return
    setDownloadingPdf(true)
    try {
      const res = await downloadSchedulePdf(schoolId, selectedGroup.id, Number(schedSectionId))
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `ExamSchedule_Group${selectedGroup.id}_Section${schedSectionId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download PDF. Please try again.')
    } finally { setDownloadingPdf(false) }
  }

  const loadGroups = useCallback(async () => {
    if (!schoolId) return
    setGroupLoading(true)
    try {
      const { data } = await getExamGroups(schoolId)
      if (data.success) setGroups(data.data || [])
    } catch { } finally { setGroupLoading(false) }
  }, [schoolId])

  const openGroupModal = (g?: ExamGroup) => {
    if (g) {
      setEditGroup(g)
      setGroupForm({ name: g.name, type: g.type, academic_session_id: String(g.academic_session_id), description: g.description || '' })
    } else {
      setEditGroup(null)
      setGroupForm({ name: '', type: 'SCHOOL', academic_session_id: '', description: '' })
    }
    setGroupModal(true)
  }

  const saveGroup = async () => {
    if (!groupForm.name || !groupForm.academic_session_id) return
    setGroupSaving(true)
    try {
      const payload = { name: groupForm.name, type: groupForm.type, academic_session_id: Number(groupForm.academic_session_id), description: groupForm.description || undefined }
      if (editGroup) await updateExamGroup(schoolId, editGroup.id, payload)
      else await createExamGroup(schoolId, payload)
      setGroupModal(false)
      loadGroups()
    } catch { } finally { setGroupSaving(false) }
  }

  const removeGroup = async (id: number) => {
    if (!confirm('Delete this exam group?')) return
    await deleteExamGroup(schoolId, id)
    loadGroups()
    if (selectedGroup?.id === id) setSelectedGroup(null)
  }

  const openGroupDetail = async (group: ExamGroup) => {
    setSelectedGroup(group)
    setWizardTab('classes')
    setClassRows([{ class_id: '', section_id: '', sections: [] }])
    setSubjectRows([{ subject_id: '', max_marks: '100', min_marks: '33', credit_hours: '' }])
    setSchedClassId('')
    setSchedSectionId('')
    setScheduleGrid({})
    setGroupExams([])
    setSchedules([])
    // Load group exams (subjects)
    try {
      const r = await getGroupExams(schoolId, group.id)
      if (r.data.success) setGroupExams(r.data.data || [])
    } catch { }
    // Load schedule
    try {
      const { data } = await getGroupSchedule(schoolId, group.id)
      if (data.success) setSchedules(data.data || [])
    } catch { }
  }

  // Class row helpers — use functional setState to avoid stale-closure bugs during async await
  const updateClassRow = async (idx: number, field: string, value: string) => {
    // Step 1: update field synchronously (no await needed)
    setClassRows(prev => prev.map((r, i) =>
      i === idx
        ? { ...r, [field]: value, ...(field === 'class_id' ? { section_id: '', sections: [] } : {}) }
        : r
    ))

    // Step 2: fetch sections async only when class changes
    if (field === 'class_id' && value) {
      try {
        const res = await getClassSections(schoolId, value)
        const raw = (res.data as any)

        // Robust array extraction logic
        const sectionList: any[] = (() => {
          if (!raw.data) return Array.isArray(raw) ? raw : []
          if (Array.isArray(raw.data)) return raw.data
          if (Array.isArray(raw.data.sections)) return raw.data.sections
          if (Array.isArray(raw.data.mappings)) return raw.data.mappings
          // Fallback: search for any array property
          const firstArr = Object.values(raw.data).find(v => Array.isArray(v))
          return Array.isArray(firstArr) ? firstArr : []
        })()

        // Merge into CURRENT state (not stale snapshot), guard against race if user changed class again
        setClassRows(prev => prev.map((r, i) =>
          i === idx && r.class_id === value ? { ...r, sections: sectionList } : r
        ))
      } catch {
        // Leave sections as empty [] on error (already set in Step 1)
      }
    }
  }

  const assignClasses = async () => {
    const valid = classRows.filter(r => r.class_id && r.section_id)
    if (!valid.length || !selectedGroup) return
    setClassAssigning(true)
    try {
      await assignClassesToGroup(schoolId, selectedGroup.id, valid.map(r => ({ class_id: Number(r.class_id), section_id: Number(r.section_id) })))
      const { data } = await getExamGroups(schoolId)
      if (data.success) {
        setGroups(data.data || [])
        const updated = data.data.find((g: any) => g.id === selectedGroup.id)
        if (updated) setSelectedGroup(updated)
      }
      setClassRows([{ class_id: '', section_id: '', sections: [] }])
      setWizardTab('subjects')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign classes. Please try again.')
    } finally { setClassAssigning(false) }
  }

  const removeGroupClass = async (mappingId: number) => {
    if (!selectedGroup || !window.confirm('Remove this class from group?')) return
    try {
      await removeClassesFromGroup(schoolId, selectedGroup.id, mappingId)
      const { data } = await getExamGroups(schoolId)
      if (data.success) {
        setGroups(data.data || [])
        const updated = data.data.find((g: any) => g.id === selectedGroup.id)
        if (updated) setSelectedGroup(updated)
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove class.')
    }
  }

  const addExamSubjects = async () => {
    const valid = subjectRows.filter(r => r.subject_id && r.max_marks && r.min_marks)
    if (!valid.length || !selectedGroup) return
    setSubjectSaving(true)
    try {
      await addExamsToGroup(schoolId, selectedGroup.id, valid.map(r => ({
        subject_id: Number(r.subject_id), max_marks: Number(r.max_marks),
        min_marks: Number(r.min_marks), credit_hours: r.credit_hours ? Number(r.credit_hours) : undefined,
      })))
      const r = await getGroupExams(schoolId, selectedGroup.id)
      if (r.data.success) setGroupExams(r.data.data || [])
      setSubjectRows([{ subject_id: '', max_marks: '100', min_marks: '33', credit_hours: '' }])
      setWizardTab('schedule')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add subjects.')
    } finally { setSubjectSaving(false) }
  }

  const removeExamSubject = async (examId: number) => {
    if (!selectedGroup || !window.confirm('Delete this subject from group?')) return
    try {
      await deleteExamSubject(schoolId, selectedGroup.id, examId)
      const { data } = await getGroupExams(schoolId, selectedGroup.id)
      if (data.success) setGroupExams(data.data || [])
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete subject.')
    }
  }

  const addSchedules = async () => {
    const valid = Object.entries(scheduleGrid).filter(([_, row]) => row.date && row.start_time && row.end_time)
    if (!valid.length || !selectedGroup || !schedSectionId) return
    setScheduleSaving(true)
    try {
      await createSchedule(schoolId, selectedGroup.id, valid.map(([examIdStr, row]) => ({
        exam_id: Number(examIdStr), section_id: Number(schedSectionId),
        date: row.date,
        start_time: row.start_time.length === 5 ? `${row.start_time}:00` : row.start_time,
        end_time: row.end_time.length === 5 ? `${row.end_time}:00` : row.end_time,
        room_no: row.room_no || undefined,
        invigilator_id: row.invigilator_id ? Number(row.invigilator_id) : undefined
      })))
      const { data } = await getGroupSchedule(schoolId, selectedGroup.id)
      if (data.success) {
        setSchedules(data.data || [])
        alert('Schedule saved successfully!')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save schedules. Please check your data.')
    } finally { setScheduleSaving(false) }
  }

  useEffect(() => { loadMeta(); loadGroups(); loadGrades() }, [loadMeta, loadGroups, loadGrades])

  // ── All sections from selected group's classes ─────────────────────────────
  const groupClassSections = selectedGroup?.classes || []

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Tabs ── */}
        <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-5 fw-semibold mb-6'>
          {([['groups', 'ki-note', 'Exam Groups'], ['grades', 'ki-medal-star', 'Grade Scales']] as const).map(([tab, icon, label]) => (
            <li key={tab} className='nav-item'>
              <a className={`nav-link text-active-primary pb-4 ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab as any)} href='#' style={{ cursor: 'pointer' }}>
                <i className={`ki-duotone ${icon} fs-4 me-2`}><span className='path1' /><span className='path2' /></i>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* ══════════════ TAB: EXAM GROUPS ══════════════ */}
        {activeTab === 'groups' && (
          <div className='row g-6'>
            {/* Left — Groups list */}
            <div className={selectedGroup ? 'col-lg-4' : 'col-12'}>
              <div className='card card-flush shadow-sm'>
                <div className='card-header border-0 pt-6'>
                  <h3 className='card-title fw-bold'>Exam Groups</h3>
                  <div className='card-toolbar'>
                    <button className='btn btn-sm btn-primary' onClick={() => openGroupModal()}>
                      <i className='ki-duotone ki-plus fs-4 me-1'><span className='path1' /><span className='path2' /></i>New Group
                    </button>
                  </div>
                </div>
                <div className='card-body pt-0'>
                  {groupLoading ? (
                    <div className='text-center py-10'><span className='spinner-border spinner-border-sm text-primary' /></div>
                  ) : groups.length === 0 ? (
                    <div className='text-center py-12'>
                      <i className='ki-duotone ki-note fs-4x text-gray-300 mb-3'><span className='path1' /><span className='path2' /></i>
                      <p className='text-muted fw-semibold'>No exam groups yet. Create one to get started.</p>
                    </div>
                  ) : (
                    <div className='d-flex flex-column gap-2'>
                      {groups.map(g => (
                        <div key={g.id}
                          className={`rounded border p-3 transition-all ${selectedGroup?.id === g.id ? 'border-primary' : 'border-gray-200'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openGroupDetail(g)}>
                          <div className='d-flex justify-content-between align-items-center'>
                            <div className="flex-grow-1">
                              <div className='fw-bold text-gray-800 fs-7'>{g.name}</div>
                              <div className='text-muted fs-9 mt-1'>
                                {g.academic_session?.session_year} &middot; {g.type}
                                {g.classes?.length ? ` &middot; ${g.classes.length} Classes` : ''}
                              </div>
                            </div>
                            <div className='d-flex align-items-center gap-1'>
                              <span className='badge badge-light fw-bold fs-9 text-uppercase px-2 py-1'>{g.status}</span>
                              <button className='btn btn-icon btn-sm btn-light' title='Edit'
                                onClick={e => { e.stopPropagation(); openGroupModal(g) }}>
                                <i className='ki-duotone ki-pencil fs-6 text-primary'><span className='path1' /><span className='path2' /></i>
                              </button>
                              <button className='btn btn-icon btn-sm btn-light' title='Delete'
                                onClick={e => { e.stopPropagation(); removeGroup(g.id) }}>
                                <i className='ki-duotone ki-trash fs-6 text-danger'><span className='path1' /><span className='path2' /></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — Group Detail Wizard */}
            {selectedGroup && (
              <div className='col-lg-8'>
                <div className='card card-flush shadow-sm'>
                  <div className='card-header border-0 pt-6'>
                    <div>
                      <h3 className='card-title fw-bold'>{selectedGroup.name}</h3>
                      <p className='text-muted fs-7 mb-0'>Configure classes, subjects and schedule</p>
                    </div>
                    <button className='btn btn-sm btn-icon btn-light' onClick={() => setSelectedGroup(null)}>
                      <i className='ki-duotone ki-cross fs-3'><span className='path1' /><span className='path2' /></i>
                    </button>
                  </div>
                  <div className='card-body pt-2'>

                    {/* Wizard tabs */}
                    <ul className='nav nav-pills nav-pills-custom mb-6 gap-3'>
                      {([['classes', '1', 'Classes'], ['subjects', '2', 'Subjects'], ['schedule', '3', 'Schedule']] as const).map(([tab, num, label]) => (
                        <li key={tab} className='nav-item'>
                          <a className={`nav-link d-flex align-items-center gap-2 px-4 py-2 fw-semibold ${wizardTab === tab ? 'active bg-primary text-white' : 'bg-light text-gray-700'}`}
                            href='#' onClick={e => { e.preventDefault(); setWizardTab(tab as any) }} style={{ borderRadius: 8 }}>
                            <span className={`badge rounded-circle px-2 py-1 ${wizardTab === tab ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{num}</span>
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>

                    {/* Classes Tab */}
                    {wizardTab === 'classes' && (
                      <div>
                        {/* Already assigned */}
                        {selectedGroup.classes?.length ? (
                          <div className='mb-8'>
                            <div className='fw-bold text-gray-800 fs-6 mb-3 text-uppercase border-bottom pb-2'>
                              Assigned Classes
                            </div>
                            <div className='table-responsive'>
                              <table className='table table-row-dashed align-middle gs-0 gy-3 mb-0'>
                                <thead>
                                  <tr className='text-muted fs-8 fw-bold text-uppercase border-bottom-0'>
                                    <th className='ps-0'>Class & Section</th>
                                    <th className='text-end pe-0'>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedGroup.classes.map(c => (
                                    <tr key={c.id}>
                                      <td className='ps-0'>
                                        <span className='fw-bold text-gray-800 fs-7'>
                                          {c.class?.name} – {c.section?.name}
                                        </span>
                                      </td>
                                      <td className='text-end pe-0'>
                                        <button className='btn btn-icon btn-sm btn-light-danger btn-active-danger'
                                          onClick={() => removeGroupClass(c.id)} title="Remove Class">
                                          <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="separator separator-dashed my-8"></div>
                          </div>
                        ) : null}

                        <div className='fw-bold text-gray-800 fs-6 mb-3 text-uppercase'>Assign New Classes</div>
                        {classRows.map((row, idx) => (
                          <div key={idx} className='row g-3 mb-3 align-items-end'>
                            <div className='col-5'>
                              <label className='form-label fs-8 fw-semibold mb-1'>Class</label>
                              <select className='form-select form-select-sm form-select-solid' value={row.class_id}
                                onChange={e => updateClassRow(idx, 'class_id', e.target.value)}>
                                <option value=''>Select Class</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <div className='col-5'>
                              <label className='form-label fs-8 fw-semibold mb-1'>Section</label>
                              <select className='form-select form-select-sm form-select-solid' value={row.section_id}
                                disabled={!row.class_id}
                                onChange={e => updateClassRow(idx, 'section_id', e.target.value)}>
                                <option value=''>Select Section</option>
                                {row.sections.map((s: any) => (
                                  <option key={s.id || s.section_id} value={s.section_id}>
                                    {s.section?.name || `Section #${s.section_id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className='col-2'>
                              {idx === classRows.length - 1 ? (
                                <button className='btn btn-sm btn-icon btn-light-primary w-100'
                                  onClick={() => setClassRows([...classRows, { class_id: '', section_id: '', sections: [] }])}>
                                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /></i>
                                </button>
                              ) : (
                                <button className='btn btn-sm btn-icon btn-light-danger w-100'
                                  onClick={() => setClassRows(classRows.filter((_, i) => i !== idx))}>
                                  <i className='ki-duotone ki-minus fs-4'><span className='path1' /></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className='mt-6 text-end'>
                          <button className='btn btn-primary d-flex align-items-center ms-auto' onClick={assignClasses} disabled={classAssigning}>
                            {classAssigning ? <span className='spinner-border spinner-border-sm me-2' /> : null}
                            Save & Next Subjects →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subjects Tab */}
                    {wizardTab === 'subjects' && (
                      <div>
                        {/* Added subjects */}
                        {groupExams.length ? (
                          <div className='mb-8'>
                            <div className='fw-bold text-gray-800 fs-6 mb-3 text-uppercase border-bottom pb-2'>Added Subjects</div>
                            <div className='table-responsive'>
                              <table className='table table-row-dashed align-middle gs-0 gy-3 mb-0'>
                                <thead>
                                  <tr className='text-muted fs-8 fw-bold text-uppercase border-bottom-0'>
                                    <th className='ps-0'>Subject</th>
                                    <th>Marks (Max/Min)</th>
                                    <th className='text-end pe-0'>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {groupExams.map(ex => (
                                    <tr key={ex.id}>
                                      <td className='ps-0'>
                                        <div className="d-flex flex-column">
                                          <span className='fw-bold text-gray-800 fs-7'>{ex.subject?.name}</span>
                                          <span className="text-muted fs-8">Type: {ex.exam_type}</span>
                                        </div>
                                      </td>
                                      <td>
                                        <span className="fw-bold">{ex.max_marks} / {ex.min_marks}</span>
                                      </td>
                                      <td className='text-end pe-0'>
                                        <button className='btn btn-icon btn-sm btn-light-danger' onClick={() => removeExamSubject(ex.id)}>
                                          <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /><span className='path5' /></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="separator separator-dashed my-8"></div>
                          </div>
                        ) : null}

                        <div className='fw-bold text-gray-800 fs-6 mb-3 text-uppercase'>Add More Subjects</div>
                        {subjectRows.map((row, idx) => (
                          <div key={idx} className='row g-3 mb-3 align-items-end'>
                            <div className='col-4'>
                              <label className='form-label fs-8 fw-semibold mb-1'>Subject</label>
                              <select className='form-select form-select-sm form-select-solid' value={row.subject_id}
                                onChange={e => { const r = [...subjectRows]; r[idx].subject_id = e.target.value; setSubjectRows(r) }}>
                                <option value=''>Select Subject</option>
                                {allSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                              </select>
                            </div>
                            <div className='col-3'>
                              <label className='form-label fs-8 fw-semibold mb-1'>Max Marks</label>
                              <input className='form-control form-control-sm form-control-solid' type='number' value={row.max_marks}
                                onChange={e => { const r = [...subjectRows]; r[idx].max_marks = e.target.value; setSubjectRows(r) }} />
                            </div>
                            <div className='col-3'>
                              <label className='form-label fs-8 fw-semibold mb-1'>Min Marks</label>
                              <input className='form-control form-control-sm form-control-solid' type='number' value={row.min_marks}
                                onChange={e => { const r = [...subjectRows]; r[idx].min_marks = e.target.value; setSubjectRows(r) }} />
                            </div>
                            <div className='col-2'>
                              {idx === subjectRows.length - 1 ? (
                                <button className='btn btn-sm btn-icon btn-light-primary w-100'
                                  onClick={() => setSubjectRows([...subjectRows, { subject_id: '', max_marks: '100', min_marks: '33', credit_hours: '' }])}>
                                  <i className='ki-duotone ki-plus fs-4'><span className='path1' /><span className='path2' /></i>
                                </button>
                              ) : (
                                <button className='btn btn-sm btn-icon btn-light-danger w-100'
                                  onClick={() => setSubjectRows(subjectRows.filter((_, i) => i !== idx))}>
                                  <i className='ki-duotone ki-minus fs-4'><span className='path1' /></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className='d-flex gap-3 mt-8 justify-content-between text-end'>
                          <button className='btn btn-light' onClick={() => setWizardTab('classes')}>← Back to Classes</button>
                          <button className='btn btn-primary d-flex align-items-center' onClick={addExamSubjects} disabled={subjectSaving}>
                            {subjectSaving ? <span className='spinner-border spinner-border-sm me-2' /> : null}
                            Save & Next Schedule →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Schedule Tab */}
                    {wizardTab === 'schedule' && (
                      <div>
                        {groupExams.length === 0 ? (
                          <div className="alert alert-warning d-flex align-items-center p-5">
                            <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4"><span className="path1" /><span className="path2" /><span className="path3" /></i>
                            <div className="d-flex flex-column">
                              <h4 className="mb-1 text-warning">No Subjects Configured</h4>
                              <span>Please configure exam subjects (previous step) before setting the schedule.</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Top Bar Filters */}
                            <div className="row g-3 mb-8 align-items-end bg-light p-5 rounded">
                              <div className="col-md-4">
                                <label className="form-label fw-bold">Select Class</label>
                                <select className="form-select form-select-solid" value={schedClassId} onChange={e => { setSchedClassId(e.target.value); setSchedSectionId(''); setScheduleGrid({}); }}>
                                  <option value="">-- Choose Class --</option>
                                  {Array.from(new Set(groupClassSections.map(c => c.class_id))).map(cid => {
                                    const cls = groupClassSections.find(c => c.class_id === cid)?.class
                                    return cls ? <option key={cls.id} value={cls.id}>{cls.name}</option> : null
                                  })}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">Select Section</label>
                                <select className="form-select form-select-solid" value={schedSectionId} disabled={!schedClassId} onChange={e => { setSchedSectionId(e.target.value); setScheduleGrid({}); }}>
                                  <option value="">-- Choose Section --</option>
                                  {groupClassSections.filter(c => String(c.class_id) === schedClassId).map(c => (
                                    <option key={c.section_id} value={c.section_id}>{c.section?.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <button className="btn btn-primary w-100" onClick={addSchedules} disabled={scheduleSaving || !schedSectionId}>
                                  {scheduleSaving ? <span className='spinner-border spinner-border-sm me-2' /> : <i className='ki-duotone ki-check fs-2'><span className="path1" /><span className="path2" /></i>}
                                  Save Schedule
                                </button>
                              </div>
                              <div className="col-md-2">
                                <button className="btn btn-light-danger w-100" onClick={handleDownloadSchedulePdf} disabled={downloadingPdf || !schedSectionId} title="Download Exam Timetable PDF">
                                  {downloadingPdf ? <span className='spinner-border spinner-border-sm me-2' /> : <i className='ki-duotone ki-file-down fs-2'><span className="path1" /><span className="path2" /></i>}
                                  Download PDF
                                </button>
                              </div>
                            </div>

                            {/* The Grid Layout */}
                            {!schedSectionId ? (
                              <div className="text-center py-10">
                                <span className="text-muted fw-semibold">Please select a class and section to view the schedule template.</span>
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-row-dashed border table-row-gray-300 align-middle gs-0 gy-4">
                                  <thead>
                                    <tr className="fw-bold text-muted bg-light text-uppercase">
                                      <th className="ps-4 min-w-150px rounded-start">Subject</th>
                                      <th className="min-w-150px">Date</th>
                                      <th className="min-w-120px">Start Time</th>
                                      <th className="min-w-120px">End Time</th>
                                      <th className="min-w-100px">Room No</th>
                                      <th className="min-w-150px rounded-end">Invigilator</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupExams.map(exam => {
                                      const existing = schedules.find(s => s.exam_id === exam.id && String(s.section_id) === schedSectionId)
                                      
                                      // Only hydrate initial state from existing if not already modified in scheduleGrid
                                      const rowData = scheduleGrid[exam.id] || {
                                        date: existing?.date ? new Date(existing.date).toISOString().split('T')[0] : '',
                                        start_time: existing?.start_time || '',
                                        end_time: existing?.end_time || '',
                                        room_no: existing?.room_no || '',
                                        invigilator_id: String(existing?.invigilator_id || '')
                                      }

                                      const updateGrid = (field: keyof typeof rowData, val: string) => {
                                        setScheduleGrid(prev => ({ ...prev, [exam.id]: { ...rowData, [field]: val } }))
                                      }

                                      return (
                                        <tr key={exam.id}>
                                          <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                              <div className="d-flex flex-column">
                                                <span className="text-gray-800 fw-bold">{exam.subject?.name}</span>
                                                <span className="text-muted fw-semibold fs-7 text-uppercase">{(exam.subject as any)?.code || 'SUB'}</span>
                                              </div>
                                              {existing && <i className="ki-duotone ki-check-circle fs-2 text-success ms-2" title="Saved"><span className="path1" /><span className="path2" /></i>}
                                            </div>
                                          </td>
                                          <td>
                                            <input type="date" className="form-control form-control-sm form-control-solid" value={rowData.date} onChange={e => updateGrid('date', e.target.value)} />
                                          </td>
                                          <td>
                                            <input type="time" className="form-control form-control-sm form-control-solid" value={rowData.start_time} onChange={e => updateGrid('start_time', e.target.value)} />
                                          </td>
                                          <td>
                                            <input type="time" className="form-control form-control-sm form-control-solid" value={rowData.end_time} onChange={e => updateGrid('end_time', e.target.value)} />
                                          </td>
                                          <td>
                                            <input type="text" className="form-control form-control-sm form-control-solid" placeholder="e.g. 101" value={rowData.room_no} onChange={e => updateGrid('room_no', e.target.value)} />
                                          </td>
                                          <td>
                                            <select className="form-select form-select-sm form-select-solid" value={rowData.invigilator_id} onChange={e => updateGrid('invigilator_id', e.target.value)}>
                                              <option value="">Unassigned</option>
                                              {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim()}</option>
                                              ))}
                                            </select>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: GRADE SCALES ══════════════ */}
        {activeTab === 'grades' && (
          <div className='card card-flush shadow-sm'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold'>Grade Scales</h3>
              <div className='card-toolbar'>
                <button className='btn btn-sm btn-primary' onClick={() => openGradeModal()}>
                  <i className='ki-duotone ki-plus fs-4 me-1'><span className='path1' /><span className='path2' /></i>Add Grade
                </button>
              </div>
            </div>
            <div className='card-body pt-0'>
              <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-4'>
                  <thead>
                    <tr className='text-gray-400 fw-bold text-uppercase fs-7 gs-0'>
                      <th>Grade</th><th>Type</th><th>Min %</th><th>Max %</th><th>Grade Point</th><th>Description</th><th className='text-end'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='fw-semibold text-gray-600'>
                    {grades.length === 0 ? (
                      <tr><td colSpan={7} className='text-center py-10'>
                        <span className='text-muted'>No grade scales defined yet.</span>
                      </td></tr>
                    ) : grades.map(g => (
                      <tr key={g.id}>
                        <td><span className='badge badge-light-success fw-bolder fs-6 px-4'>{g.grade_name}</span></td>
                        <td><span className='badge badge-light-info'>{g.exam_type}</span></td>
                        <td className='fw-bold'>{g.min_percentage}%</td>
                        <td className='fw-bold'>{g.max_percentage}%</td>
                        <td><span className='badge badge-light-primary fw-bold'>{g.grade_point} GP</span></td>
                        <td className='text-muted fs-7'>{g.description || '—'}</td>
                        <td className='text-end'>
                          <button className='btn btn-icon btn-sm btn-light-warning me-2' onClick={() => openGradeModal(g)}>
                            <i className='ki-duotone ki-pencil fs-5'><span className='path1' /><span className='path2' /></i>
                          </button>
                          <button className='btn btn-icon btn-sm btn-light-danger' onClick={() => removeGrade(g.id)}>
                            <i className='ki-duotone ki-trash fs-5'><span className='path1' /><span className='path2' /></i>
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

      {/* ── Group Modal ── */}
      <Modal show={groupModal} onHide={() => setGroupModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title className='fw-bold'>{editGroup ? 'Edit' : 'Create'} Exam Group</Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-6'>
          <div className='mb-4'>
            <label className='fw-semibold fs-6 mb-2'>Group Name *</label>
            <input className='form-control form-control-solid' value={groupForm.name}
              onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} placeholder='e.g. Half Yearly Exam 2024' />
          </div>
          <div className='row g-4 mb-4'>
            <div className='col-6'>
              <label className='fw-semibold fs-6 mb-2'>Type</label>
              <select className='form-select form-select-solid' value={groupForm.type}
                onChange={e => setGroupForm(p => ({ ...p, type: e.target.value as any }))}>
                <option value='SCHOOL'>SCHOOL</option>
                <option value='BOARD'>BOARD</option>
              </select>
            </div>
            <div className='col-6'>
              <label className='fw-semibold fs-6 mb-2'>Academic Session *</label>
              <select className='form-select form-select-solid' value={groupForm.academic_session_id}
                onChange={e => setGroupForm(p => ({ ...p, academic_session_id: e.target.value }))}>
                <option value=''>Select Session</option>
                {sessions.map((s: any) => <option key={s.id} value={s.id}>{s.session_year}</option>)}
              </select>
            </div>
          </div>
          <div className='mb-4'>
            <label className='fw-semibold fs-6 mb-2'>Description</label>
            <textarea className='form-control form-control-solid' rows={2} value={groupForm.description}
              onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <button className='btn btn-light' onClick={() => setGroupModal(false)}>Cancel</button>
          <button className='btn btn-primary' onClick={saveGroup} disabled={groupSaving}>
            {groupSaving ? <span className='spinner-border spinner-border-sm me-2' /> : null}
            {editGroup ? 'Update' : 'Create'} Group
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── Grade Scale Modal ── */}
      <Modal show={gradeModal} onHide={() => setGradeModal(false)} centered>
        <Modal.Header closeButton className='border-0'>
          <Modal.Title className='fw-bold'>{editGrade ? 'Edit' : 'Add'} Grade Scale</Modal.Title>
        </Modal.Header>
        <Modal.Body className='px-6'>
          <div className='row g-4 mb-4'>
            <div className='col-6'>
              <label className='fw-semibold fs-6 mb-2'>Grade Name *</label>
              <input className='form-control form-control-solid' value={gradeForm.grade_name}
                onChange={e => setGradeForm(p => ({ ...p, grade_name: e.target.value }))} placeholder='e.g. A+' />
            </div>
            <div className='col-6'>
              <label className='fw-semibold fs-6 mb-2'>Exam Type</label>
              <select className='form-select form-select-solid' value={gradeForm.exam_type}
                onChange={e => setGradeForm(p => ({ ...p, exam_type: e.target.value as any }))}>
                <option value='SCHOOL'>SCHOOL</option>
                <option value='BOARD'>BOARD</option>
              </select>
            </div>
          </div>
          <div className='row g-4 mb-4'>
            <div className='col-4'>
              <label className='fw-semibold fs-6 mb-2'>Min %</label>
              <input className='form-control form-control-solid' type='number' value={gradeForm.min_percentage}
                onChange={e => setGradeForm(p => ({ ...p, min_percentage: e.target.value }))} />
            </div>
            <div className='col-4'>
              <label className='fw-semibold fs-6 mb-2'>Max %</label>
              <input className='form-control form-control-solid' type='number' value={gradeForm.max_percentage}
                onChange={e => setGradeForm(p => ({ ...p, max_percentage: e.target.value }))} />
            </div>
            <div className='col-4'>
              <label className='fw-semibold fs-6 mb-2'>Grade Point</label>
              <input className='form-control form-control-solid' type='number' value={gradeForm.grade_point}
                onChange={e => setGradeForm(p => ({ ...p, grade_point: e.target.value }))} />
            </div>
          </div>
          <div className='mb-4'>
            <label className='fw-semibold fs-6 mb-2'>Description</label>
            <input className='form-control form-control-solid' value={gradeForm.description}
              onChange={e => setGradeForm(p => ({ ...p, description: e.target.value }))} placeholder='e.g. Outstanding performance' />
          </div>
        </Modal.Body>
        <Modal.Footer className='border-0'>
          <button className='btn btn-light' onClick={() => setGradeModal(false)}>Cancel</button>
          <button className='btn btn-primary' onClick={saveGrade} disabled={gradeSaving}>
            {gradeSaving ? <span className='spinner-border spinner-border-sm me-2' /> : null}
            {editGrade ? 'Update' : 'Add'} Grade
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const ExamsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Examination', path: '/examination/exams', isActive: false }, { title: 'Exam Groups', path: '/examination/exams', isActive: true }]}>
      Exam Management
    </PageTitle>
    <ExamsPage />
  </>
)

export { ExamsWrapper }
