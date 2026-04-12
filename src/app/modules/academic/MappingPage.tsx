import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import {
  getAcademicSessions,
  getClasses,
  getClassSections,
  getClassSubjects,
  getTeacherAllocations,
  allocateTeacher,
  updateTeacherAllocation,
  deleteTeacherAllocation,
  assignClassTeacherBySession,
  getClassTeachersForSession,
} from './core/_requests'
import { getTeachers } from '../teachers/core/_requests'
import {
  ClassModel,
  ClassSectionMappingModel,
  ClassSubjectMappingModel,
  SessionModel,
  TeacherAllocationModel,
} from './core/_models'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Teacher {
  id: number
  name: string
}

interface RowState {
  subjectId: number
  subjectName: string
  subjectCode: string
  allocationId: number | null
  currentTeacherId: number | null
  selectedTeacherId: string
  saving: boolean
  saved: boolean
  error: string | null
}

interface ClassTeacherState {
  allocationId: number | null
  currentTeacherId: number | null
  selectedTeacherId: string
  saving: boolean
  saved: boolean
  error: string | null
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MappingPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = currentUser?.schoolId || ''

  // ── Dropdown Data ──────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionModel[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  // ── Filter Selections ──────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string>('')
  const [classId, setClassId] = useState<string>('')
  const [classSectionId, setClassSectionId] = useState<string>('')

  // ── Class Teacher State ────────────────────────────────────────────────────
  const [classTeacher, setClassTeacher] = useState<ClassTeacherState>({
    allocationId: null,
    currentTeacherId: null,
    selectedTeacherId: '',
    saving: false,
    saved: false,
    error: null,
  })

  // ── Table Data ─────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<RowState[]>([])
  const [loadingTable, setLoadingTable] = useState(false)
  const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  // ── Bootstrap: load sessions, classes, teachers ────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      getAcademicSessions(schoolId),
      getClasses(schoolId),
      getTeachers(schoolId),
    ]).then(([sRes, cRes, tRes]) => {
      setSessions(sRes.data?.data?.sessions || [])
      setClasses(cRes.data?.data?.classes || [])
      const tData: Teacher[] = (tRes.data?.data?.teachers || []).map((t: any) => ({
        id: t.id,
        name: t.name || `Teacher #${t.id}`,
      }))
      setTeachers(tData)
    }).catch(console.error)
  }, [schoolId])

  // ── On class select: load sections ────────────────────────────────────────
  useEffect(() => {
    if (!schoolId || !classId) { setClassSections([]); setClassSectionId(''); return }
    getClassSections(schoolId, classId)
      .then(r => setClassSections(r.data?.data?.sections || []))
      .catch(console.error)
  }, [schoolId, classId])

  // ── Load class teacher for the selected section + session ──────────────────
  const loadClassTeacher = useCallback(async () => {
    if (!schoolId || !classSectionId || !sessionId) {
      setClassTeacher({ allocationId: null, currentTeacherId: null, selectedTeacherId: '', saving: false, saved: false, error: null })
      return
    }
    try {
      const res = await getClassTeachersForSession(schoolId, sessionId)
      const records: any[] = res.data?.data || []
      const match = records.find((r: any) => String(r.class_section_id) === classSectionId)
      if (match) {
        setClassTeacher(prev => ({
          ...prev,
          allocationId: match.allocation_id,
          currentTeacherId: match.teacher?.id ?? null,
          selectedTeacherId: match.teacher?.id ? String(match.teacher.id) : '',
          saved: false,
          error: null,
        }))
      } else {
        setClassTeacher({ allocationId: null, currentTeacherId: null, selectedTeacherId: '', saving: false, saved: false, error: null })
      }
    } catch {
      // silently ignore
    }
  }, [schoolId, classSectionId, sessionId])

  useEffect(() => { loadClassTeacher() }, [loadClassTeacher])

  // ── On filters complete: load subjects + allocations ──────────────────
  const loadTable = useCallback(async () => {
    if (!schoolId || !classId || !classSectionId || !sessionId) { setRows([]); return }
    setLoadingTable(true)
    setGlobalMsg(null)
    try {
      const [subRes, allocRes] = await Promise.all([
        getClassSubjects(schoolId, classId),
        getTeacherAllocations(schoolId, {
          class_section_id: Number(classSectionId),
          academic_session_id: Number(sessionId),
        }),
      ])

      const subjects: ClassSubjectMappingModel[] = subRes.data?.data?.subjects || []
      // Backend now returns only is_class_teacher=false records, guard client-side too
      const allocations: TeacherAllocationModel[] = (allocRes.data?.data || []).filter(
        (a: TeacherAllocationModel) => !a.is_class_teacher
      )

      const newRows: RowState[] = subjects.map(sm => {
        const subj = sm.subject!
        const alloc = allocations.find(a => a.subject_id === subj.id)
        return {
          subjectId: subj.id,
          subjectName: subj.name,
          subjectCode: subj.code,
          allocationId: alloc?.id ?? null,
          currentTeacherId: alloc?.teacher_id ?? null,
          selectedTeacherId: alloc ? String(alloc.teacher_id) : '',
          saving: false,
          saved: false,
          error: null,
        }
      })
      setRows(newRows)
    } catch (e) {
      setGlobalMsg({ type: 'danger', text: 'Failed to load data. Please try again.' })
    } finally {
      setLoadingTable(false)
    }
  }, [schoolId, classId, classSectionId, sessionId])

  useEffect(() => { loadTable() }, [loadTable])

  // ── Assign / Update Class Teacher ──────────────────────────────────────────
  const handleSaveClassTeacher = async () => {
    if (!classTeacher.selectedTeacherId) return
    const newTeacherId = Number(classTeacher.selectedTeacherId)
    setClassTeacher(prev => ({ ...prev, saving: true, error: null }))
    try {
      await assignClassTeacherBySession(schoolId, {
        teacher_id: newTeacherId,
        class_section_id: Number(classSectionId),
        academic_session_id: Number(sessionId),
      })
      setClassTeacher(prev => ({
        ...prev,
        saving: false,
        saved: true,
        currentTeacherId: newTeacherId,
        error: null,
      }))
      setTimeout(() => setClassTeacher(prev => ({ ...prev, saved: false })), 2500)
    } catch (e: any) {
      setClassTeacher(prev => ({
        ...prev,
        saving: false,
        error: e.response?.data?.message || 'Failed to assign class teacher.',
      }))
    }
  }

  // ── Per-Row Teacher Change ─────────────────────────────────────────────────
  const handleTeacherChange = (subjectId: number, teacherId: string) => {
    setRows(prev => prev.map(r => r.subjectId === subjectId ? { ...r, selectedTeacherId: teacherId, saved: false, error: null } : r))
  }

  // ── Save / Update Allocation ───────────────────────────────────────────────
  const handleSave = async (row: RowState) => {
    if (!row.selectedTeacherId) return
    const newTeacherId = Number(row.selectedTeacherId)
    setRows(prev => prev.map(r => r.subjectId === row.subjectId ? { ...r, saving: true, error: null } : r))
    try {
      if (row.allocationId) {
        await updateTeacherAllocation(schoolId, row.allocationId, newTeacherId)
      } else {
        await allocateTeacher(schoolId, {
          teacher_id: newTeacherId,
          class_section_id: Number(classSectionId),
          subject_id: row.subjectId,
          academic_session_id: Number(sessionId),
        })
      }
      setRows(prev => prev.map(r => r.subjectId === row.subjectId
        ? { ...r, saving: false, saved: true, currentTeacherId: newTeacherId, error: null }
        : r
      ))
      setTimeout(() => setRows(prev => prev.map(r => r.subjectId === row.subjectId ? { ...r, saved: false } : r)), 2500)
    } catch (e: any) {
      setRows(prev => prev.map(r => r.subjectId === row.subjectId
        ? { ...r, saving: false, error: e.response?.data?.message || 'Failed to save.' }
        : r
      ))
    }
  }

  // ── Remove Allocation ──────────────────────────────────────────────────────
  const handleRemove = async (row: RowState) => {
    if (!row.allocationId) return
    setRows(prev => prev.map(r => r.subjectId === row.subjectId ? { ...r, saving: true } : r))
    try {
      await deleteTeacherAllocation(schoolId, row.allocationId)
      setRows(prev => prev.map(r => r.subjectId === row.subjectId
        ? { ...r, saving: false, allocationId: null, currentTeacherId: null, selectedTeacherId: '', saved: false }
        : r
      ))
    } catch (e: any) {
      setRows(prev => prev.map(r => r.subjectId === row.subjectId
        ? { ...r, saving: false, error: e.response?.data?.message || 'Failed to remove.' }
        : r
      ))
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const selectedSession = sessions.find(s => String(s.id) === sessionId)
  const selectedClass = classes.find(c => String(c.id) === classId)
  const selectedSection = classSections.find(s => String(s.id) === classSectionId)
  const isFiltersReady = sessionId && classId && classSectionId

  const allocatedCount = rows.filter(r => r.currentTeacherId).length
  const currentClassTeacher = teachers.find(t => t.id === classTeacher.currentTeacherId)
  const ctHasChange = classTeacher.selectedTeacherId &&
    Number(classTeacher.selectedTeacherId) !== classTeacher.currentTeacherId

  return (
    <>
      <Content>
        {/* ── Page Header ── */}
        <div className='d-flex align-items-center justify-content-between mb-6'>
          <div>
            <h1 className='fw-bold text-gray-900 fs-2 mb-1'>Teacher Allocation</h1>
            <span className='text-muted fs-6'>Assign class teachers and subject teachers per section &amp; session</span>
          </div>
          {isFiltersReady && rows.length > 0 && (
            <div className='d-flex align-items-center gap-3'>
              <span className='text-muted fs-7'>{allocatedCount} of {rows.length} subjects assigned</span>
              <div className='progress w-120px' style={{ height: 6, minWidth: 120 }}>
                <div
                  className='progress-bar bg-primary'
                  style={{ width: `${rows.length ? (allocatedCount / rows.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Filter Card ── */}
        <div className='card card-flush shadow-sm mb-6'>
          <div className='card-header border-0 pt-6 pb-0'>
            <h3 className='card-title fw-semibold text-gray-700 fs-6 text-uppercase letter-spacing-1'>
              <i className='bi bi-funnel text-primary me-2'></i>
              Select Class &amp; Session
            </h3>
          </div>
          <div className='card-body pt-4 pb-6'>
            <div className='row g-4'>
              {/* Session */}
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-gray-700 fs-7 mb-2'>Academic Session</label>
                <select
                  className='form-select form-select-solid'
                  value={sessionId}
                  onChange={e => { setSessionId(e.target.value); setRows([]) }}
                >
                  <option value=''>Select Session</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.session_year} {s.is_current ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-gray-700 fs-7 mb-2'>Class</label>
                <select
                  className='form-select form-select-solid'
                  value={classId}
                  disabled={!sessionId}
                  onChange={e => { setClassId(e.target.value); setClassSectionId(''); setRows([]) }}
                >
                  <option value=''>Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-gray-700 fs-7 mb-2'>Section</label>
                <select
                  className='form-select form-select-solid'
                  value={classSectionId}
                  disabled={!classId}
                  onChange={e => setClassSectionId(e.target.value)}
                >
                  <option value=''>Select Section</option>
                  {classSections.map(s => (
                    <option key={s.id} value={s.id}>Section {s.section?.name || s.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter badge */}
            {isFiltersReady && (
              <div className='mt-4 pt-4 border-top border-dashed d-flex align-items-center gap-2 flex-wrap'>
                <span className='text-muted fs-7 fw-semibold me-1'>Viewing:</span>
                {selectedSession && (
                  <span className='badge badge-light-primary fw-semibold px-3 py-2'>
                    <i className='bi bi-calendar3 me-1 fs-9'></i>{selectedSession.session_year}
                  </span>
                )}
                {selectedClass && (
                  <span className='badge badge-light-primary fw-semibold px-3 py-2'>
                    <i className='bi bi-building me-1 fs-9'></i>{selectedClass.name}
                  </span>
                )}
                {selectedSection && (
                  <span className='badge badge-light-primary fw-semibold px-3 py-2'>
                    <i className='bi bi-grid me-1 fs-9'></i>Section {selectedSection.section?.name || classSectionId}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Class Teacher Mapping Table ── */}
        {isFiltersReady && (
          <div className='card card-flush shadow-sm mb-6'>
            <div className='card-header border-0 pt-6 pb-0'>
              <div className='d-flex align-items-center gap-3'>
                <h3 className='card-title fw-semibold text-gray-700 fs-6 text-uppercase mb-0'>
                  <i className='bi bi-person-badge text-primary me-2'></i>
                  Class Teacher Mapping
                </h3>
              </div>
            </div>
            <div className='card-body pt-0'>
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4 mt-2'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8 border-0'>
                      <th>Session</th>
                      <th>Class-Section</th>
                      <th>Assigned Class Teacher</th>
                      <th style={{ width: 240 }}>Assign / Change Teacher</th>
                      <th className='text-end pe-0' style={{ width: 180 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className='badge badge-light-primary fw-semibold'>{selectedSession?.session_year}</span>
                      </td>
                      <td>
                        <span className='fw-bold text-gray-800 fs-6'>
                          {selectedClass?.name} - {selectedSection?.section?.name}
                        </span>
                      </td>
                      <td>
                        {classTeacher.currentTeacherId ? (
                          <div className='d-flex align-items-center gap-2'>
                            <div className='symbol symbol-30px symbol-circle'>
                              <span className='symbol-label bg-light-primary text-primary fw-bold fs-8'>
                                {currentClassTeacher?.name?.[0]?.toUpperCase() || 'T'}
                              </span>
                            </div>
                            <span className='fw-semibold text-gray-700 fs-7'>
                              {currentClassTeacher?.name || `Teacher #${classTeacher.currentTeacherId}`}
                            </span>
                          </div>
                        ) : (
                          <span className='text-muted fs-7 fst-italic'>Not assigned</span>
                        )}
                      </td>
                      <td>
                        <select
                          className='form-select form-select-sm form-select-solid'
                          value={classTeacher.selectedTeacherId}
                          disabled={classTeacher.saving}
                          onChange={e => setClassTeacher(prev => ({ ...prev, selectedTeacherId: e.target.value, saved: false, error: null }))}
                        >
                          <option value=''>— Select Teacher —</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className='text-end pe-0'>
                        <div className='d-flex justify-content-end align-items-center gap-2 flex-wrap'>
                          {classTeacher.error && (
                            <span className='text-danger fs-8 fw-semibold' title={classTeacher.error}>
                              <i className='bi bi-exclamation-circle me-1'></i>Error
                            </span>
                          )}
                          {classTeacher.saved && (
                            <span className='text-success fs-7 fw-semibold'>
                              <i className='bi bi-check-circle me-1'></i>Saved
                            </span>
                          )}
                          <button
                            className='btn btn-sm btn-primary px-4'
                            disabled={!classTeacher.selectedTeacherId || !ctHasChange || classTeacher.saving}
                            onClick={handleSaveClassTeacher}
                            title='Assign Class Teacher'
                          >
                            {classTeacher.saving
                              ? <span className='spinner-border spinner-border-sm' />
                              : <><i className='bi bi-person-check me-1'></i>{classTeacher.currentTeacherId ? 'Update' : 'Assign'}</>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Global Message ── */}
        {globalMsg && (
          <div className={`alert alert-${globalMsg.type} d-flex align-items-center mb-6`}>
            <i className={`bi ${globalMsg.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-3 fs-4`}></i>
            <span>{globalMsg.text}</span>
          </div>
        )}

        {/* ── Subject-Teacher Table Card ── */}
        {isFiltersReady && (
          <div className='card card-flush shadow-sm'>
            <div className='card-header border-0 pt-6 pb-0'>
              <div className='d-flex align-items-center gap-3'>
                <h3 className='card-title fw-semibold text-gray-700 fs-6 text-uppercase mb-0'>
                  <i className='bi bi-person-lines-fill text-primary me-2'></i>
                  Subject-Teacher Mapping
                </h3>
                {loadingTable && (
                  <span className='spinner-border spinner-border-sm text-primary' />
                )}
              </div>
            </div>
            <div className='card-body pt-0'>
              {loadingTable ? (
                <div className='text-center py-12'>
                  <div className='spinner-border text-primary mb-3' />
                  <div className='text-muted fs-6'>Loading subjects and allocations...</div>
                </div>
              ) : rows.length === 0 ? (
                <div className='text-center py-12'>
                  <i className='bi bi-journal-x text-muted fs-1 d-block mb-3'></i>
                  <div className='text-muted fw-semibold'>No subjects mapped to this class yet.</div>
                  <div className='text-muted fs-7 mt-1'>Go to Subjects → Class Subjects to map subjects first.</div>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4 mt-2'>
                    <thead>
                      <tr className='fw-bold text-muted text-uppercase fs-8 border-0'>
                        <th className='ps-0' style={{ width: 40 }}>#</th>
                        <th>Subject</th>
                        <th style={{ width: 120 }}>Code</th>
                        <th>Assigned Teacher</th>
                        <th style={{ width: 240 }}>Assign / Change Teacher</th>
                        <th className='text-end pe-0' style={{ width: 180 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const isAssigned = !!row.currentTeacherId
                        const currentTeacher = teachers.find(t => t.id === row.currentTeacherId)
                        const hasChange = row.selectedTeacherId && Number(row.selectedTeacherId) !== row.currentTeacherId

                        return (
                          <tr key={row.subjectId}>
                            {/* # */}
                            <td className='ps-0'>
                              <span className='text-muted fw-semibold fs-7'>{idx + 1}</span>
                            </td>

                            {/* Subject Name */}
                            <td>
                              <span className='fw-bold text-gray-800 fs-6'>{row.subjectName}</span>
                            </td>

                            {/* Code */}
                            <td>
                              <span className='badge badge-light fw-semibold text-gray-600'>{row.subjectCode}</span>
                            </td>

                            {/* Current Teacher */}
                            <td>
                              {isAssigned ? (
                                <div className='d-flex align-items-center gap-2'>
                                  <div className='symbol symbol-30px symbol-circle'>
                                    <span className='symbol-label bg-light-primary text-primary fw-bold fs-8'>
                                      {currentTeacher?.name?.[0]?.toUpperCase() || 'T'}
                                    </span>
                                  </div>
                                  <span className='fw-semibold text-gray-700 fs-7'>
                                    {currentTeacher?.name || `Teacher #${row.currentTeacherId}`}
                                  </span>
                                </div>
                              ) : (
                                <span className='text-muted fs-7 fst-italic'>Not assigned</span>
                              )}
                            </td>

                            {/* Teacher Dropdown */}
                            <td>
                              <select
                                className='form-select form-select-sm form-select-solid'
                                value={row.selectedTeacherId}
                                onChange={e => handleTeacherChange(row.subjectId, e.target.value)}
                                disabled={row.saving}
                              >
                                <option value=''>— Select Teacher —</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Actions */}
                            <td className='text-end pe-0'>
                              <div className='d-flex justify-content-end align-items-center gap-2 flex-wrap'>
                                {row.error && (
                                  <span className='text-danger fs-8 fw-semibold' title={row.error}>
                                    <i className='bi bi-exclamation-circle me-1'></i>Error
                                  </span>
                                )}
                                {row.saved && (
                                  <span className='text-success fs-7 fw-semibold'>
                                    <i className='bi bi-check-circle me-1'></i>Saved
                                  </span>
                                )}

                                {/* Assign (POST) — only when not yet assigned */}
                                {!isAssigned && (
                                  <button
                                    className='btn btn-sm btn-primary px-4'
                                    disabled={!row.selectedTeacherId || row.saving}
                                    onClick={() => handleSave(row)}
                                    title='Assign this teacher to the subject'
                                  >
                                    {row.saving
                                      ? <span className='spinner-border spinner-border-sm' />
                                      : <><i className='bi bi-person-plus me-1'></i>Assign</>
                                    }
                                  </button>
                                )}

                                {/* Update (PUT) — only when already assigned and teacher changed */}
                                {isAssigned && (
                                  <button
                                    className='btn btn-sm btn-primary px-4'
                                    disabled={!row.selectedTeacherId || !hasChange || row.saving}
                                    onClick={() => handleSave(row)}
                                    title='Update teacher allocation (PUT)'
                                  >
                                    {row.saving
                                      ? <span className='spinner-border spinner-border-sm' />
                                      : <><i className='bi bi-arrow-repeat me-1'></i>Update</>
                                    }
                                  </button>
                                )}

                                {/* Remove (DELETE) — only when assigned */}
                                {isAssigned && (
                                  <button
                                    className='btn btn-sm btn-light-danger px-3'
                                    disabled={row.saving}
                                    title='Remove allocation (DELETE)'
                                    onClick={() => handleRemove(row)}
                                  >
                                    {row.saving
                                      ? <span className='spinner-border spinner-border-sm' />
                                      : <i className='bi bi-x-lg fs-8'></i>
                                    }
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer summary */}
            {!loadingTable && rows.length > 0 && (
              <div className='card-footer border-0 py-4 bg-light rounded-bottom'>
                <div className='d-flex align-items-center gap-4 px-2'>
                  <span className='fw-semibold text-gray-600 fs-7'>
                    <i className='bi bi-check-circle text-success me-2'></i>
                    <strong>{allocatedCount}</strong> Assigned
                  </span>
                  <span className='fw-semibold text-gray-600 fs-7'>
                    <i className='bi bi-circle text-muted me-2'></i>
                    <strong>{rows.length - allocatedCount}</strong> Unassigned
                  </span>
                  <span className='fw-semibold text-gray-600 fs-7 ms-auto'>
                    Total Subjects: <strong>{rows.length}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ Empty state when no filter selected ── */}
        {!isFiltersReady && (
          <div className='card card-flush shadow-sm'>
            <div className='card-body text-center py-14'>
              <i className='bi bi-person-badge text-primary fs-1 d-block mb-4'></i>
              <h4 className='text-gray-800 fw-semibold mb-2'>Select Filters to Begin</h4>
              <p className='text-muted fs-6 mb-0'>
                Choose an Academic Session, Class, and Section above to view and manage teacher assignments.
              </p>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

const MappingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[{ title: 'Academic', path: '/academic', isActive: false, isSeparator: false }]}>
        Teacher Allocation
      </PageTitle>
      <MappingPage />
    </>
  )
}

export { MappingWrapper }
