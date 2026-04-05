import { FC, useState, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getExamGroups, getMarksheet, downloadStudentReportCardPdf } from './core/_requests'
import { ExamGroup, ExamSubject, MarksheetStudent, ExamResult } from './core/_models'
import { getClasses } from '../academic/core/_requests'
import { toast } from 'react-toastify'

const fmt = (n: string | number) => Number(n).toFixed(1)

const ResultsPage: FC = () => {
  const { currentUser } = useAuth()
  const schoolId = String(currentUser?.schoolId || '')

  const [groups, setGroups] = useState<ExamGroup[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [filterGroup, setFilterGroup] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [metaLoaded, setMetaLoaded] = useState(false)

  const [exams, setExams] = useState<ExamSubject[]>([])
  const [students, setStudents] = useState<MarksheetStudent[]>([])
  const [results, setResults] = useState<ExamResult[]>([])
  const [downloadingReport, setDownloadingReport] = useState<number | null>(null)

  const loadMeta = useCallback(async () => {
    if (metaLoaded || !schoolId) return
    try {
      const [gRes, cRes] = await Promise.all([getExamGroups(schoolId), getClasses(schoolId, 1, 100)])
      if (gRes.data.success) setGroups(gRes.data.data || [])
      if (cRes.data.success) setClasses(cRes.data.data.classes || [])
      setMetaLoaded(true)
    } catch { }
  }, [schoolId, metaLoaded])

  // Load meta on first focus
  if (!metaLoaded) loadMeta()

  const loadMarksheet = async () => {
    if (!filterGroup || !filterClass) return
    setLoading(true)
    try {
      const { data } = await getMarksheet(schoolId, Number(filterGroup), Number(filterClass))
      if (data.success) {
        setExams(data.data.exams || [])
        setStudents(data.data.students || [])
        setResults(data.data.results || [])
      }
    } catch { } finally { setLoading(false) }
  }

  // Get result for a student+exam
  const getResult = (studentId: number, examId: number) =>
    results.find(r => r.student_id === studentId && r.exam_id === examId)

  // Total marks per student
  const getStudentTotal = (studentId: number) => {
    return exams.reduce((sum, exam) => {
      const r = getResult(studentId, exam.id)
      return sum + (r && !r.is_absent ? Number(r.marks_obtained) : 0)
    }, 0)
  }

  const getStudentMaxTotal = () => exams.reduce((sum, e) => sum + Number(e.max_marks), 0)

  const getStudentPct = (studentId: number) => {
    const max = getStudentMaxTotal()
    if (!max) return 0
    return (getStudentTotal(studentId) / max) * 100
  }

  const selectedGroup = groups.find(g => String(g.id) === filterGroup)
  const selectedClass = classes.find(c => String(c.id) === filterClass)

  const handleDownloadPdf = async (studentId: number, name: string) => {
    if (!filterGroup) return
    setDownloadingReport(studentId)
    try {
      const res = await downloadStudentReportCardPdf(schoolId, Number(filterGroup), studentId)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ReportCard_${name.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    } finally {
      setDownloadingReport(null)
    }
  }

  const handlePrint = () => {
    const content = document.getElementById('marksheet-print-area')?.innerHTML
    if (!content) return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<html><head><title>Marksheet</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:6px 10px;text-align:center}
      th{background:#f0f0f0;font-weight:bold;font-size:11px;text-transform:uppercase}
      .pass{color:#17c653;font-weight:bold}.fail{color:#f1416c;font-weight:bold}
      .absent{color:#888;font-style:italic}
      h2{text-align:center;margin-bottom:4px}p{text-align:center;color:#666;margin-bottom:20px}
      @media print{@page{size:A4 landscape;margin:10mm}}
    </style></head><body>${content}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  return (
    <>
      <ToolbarWrapper />
      <Content>

        {/* ── Filter Bar ── */}
        <div className='card card-flush shadow-sm mb-6'>
          <div className='card-header border-0 pt-5 pb-5 align-items-center flex-wrap gap-3'>
            <h3 className='card-title fw-bold me-5'>Class Marksheet</h3>
            <div className='d-flex gap-3 flex-wrap'>
              <select className='form-select form-select-solid form-select-sm w-200px' value={filterGroup}
                onChange={e => { setFilterGroup(e.target.value); setExams([]); setStudents([]); setResults([]) }}>
                <option value=''>Select Exam Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select className='form-select form-select-solid form-select-sm w-160px' value={filterClass}
                disabled={!filterGroup}
                onChange={e => setFilterClass(e.target.value)}>
                <option value=''>Select Class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className='btn btn-primary btn-sm' onClick={loadMarksheet} disabled={!filterGroup || !filterClass || loading}>
                {loading ? <span className='spinner-border spinner-border-sm me-2' /> : <i className='ki-duotone ki-eye fs-4 me-1'><span className='path1' /><span className='path2' /></i>}
                Load Marksheet
              </button>
            </div>
          </div>
        </div>

        {/* ── empty state ── */}
        {!students.length && !loading && (
          <div className='card card-flush shadow-sm'>
            <div className='card-body text-center py-16'>
              <i className='ki-duotone ki-book fs-5x text-gray-300 mb-4'><span className='path1' /><span className='path2' /><span className='path3' /></i>
              <p className='text-muted fw-semibold fs-5'>Select an Exam Group and Class to view the marksheet</p>
            </div>
          </div>
        )}

        {/* ── Marksheet ── */}
        {students.length > 0 && (
          <div className='card card-flush shadow-sm'>
            <div className='card-header border-0 pt-5 align-items-center'>
              <div>
                <h4 className='fw-bold mb-1'>{selectedGroup?.name} — {selectedClass?.name}</h4>
                <span className='text-muted fs-7'>{students.length} Students · {exams.length} Subjects</span>
              </div>
              <button className='btn btn-sm btn-light-primary fw-semibold' onClick={handlePrint}>
                <i className='ki-duotone ki-printer fs-4 me-1'><span className='path1' /><span className='path2' /><span className='path3' /></i>
                Print Marksheet
              </button>
            </div>

            {/* Stats */}
            <div className='card-body pt-4 pb-0'>
              <div className='row g-4 mb-6'>
                {[
                  { label: 'Total Students', value: students.length, color: 'primary' },
                  { label: 'Subjects', value: exams.length, color: 'info' },
                  { label: 'Max Total Marks', value: getStudentMaxTotal(), color: 'warning' },
                  { label: 'Pass %', value: `${students.length ? ((students.filter(s => getStudentPct(s.id) >= 33).length / students.length) * 100).toFixed(0) : 0}%`, color: 'success' },
                ].map(({ label, value, color }) => (
                  <div className='col-sm-3' key={label}>
                    <div className={`card bg-light-${color} border-0 py-4 px-5`}>
                      <div className={`fs-2 fw-bolder text-${color}`}>{value}</div>
                      <div className='text-muted fw-semibold fs-8'>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='card-body pt-0' id='marksheet-print-area'>
              <h2 className='text-center fw-bold mb-1 d-none d-print-block'>{selectedGroup?.name}</h2>
              <p className='text-center text-muted mb-4 d-none d-print-block'>{selectedClass?.name}</p>

              <div className='table-responsive'>
                <table className='table align-middle table-row-bordered fs-7 gy-2 mb-0'>
                  <thead className='sticky-top bg-white'>
                    <tr className='fw-bold text-uppercase text-gray-500 fs-8'>
                      <th className='text-start ps-4' style={{ minWidth: 50 }}>#</th>
                      <th className='text-start' style={{ minWidth: 160 }}>Student</th>
                      <th style={{ minWidth: 70 }}>Roll No.</th>
                      {exams.map(e => (
                        <th key={e.id} style={{ minWidth: 100 }}>
                          {e.subject?.name || `#${e.id}`}
                          <div className='fw-normal text-muted fs-9 text-lowercase'>(/{e.max_marks})</div>
                        </th>
                      ))}
                      <th style={{ minWidth: 90 }}>Total</th>
                      <th style={{ minWidth: 80 }}>%</th>
                      <th style={{ minWidth: 80 }}>Grade</th>
                      <th style={{ minWidth: 70 }}>Result</th>
                      <th className='text-end pe-4' style={{ minWidth: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => {
                      const total = getStudentTotal(s.id)
                      const max = getStudentMaxTotal()
                      const pct = max ? (total / max * 100) : 0
                      const isPass = pct >= 33
                      const hasAbsent = exams.some(e => getResult(s.id, e.id)?.is_absent)

                      // Best grade from results
                      const grades = exams.map(e => getResult(s.id, e.id)?.grade_name).filter(Boolean)
                      const topGrade = grades[0] || null

                      return (
                        <tr key={s.id}>
                          <td className='ps-4 text-muted'>{idx + 1}</td>
                          <td>
                            <div className='d-flex align-items-center gap-3'>
                              <div className='symbol symbol-30px'>
                                <div className='symbol-label fw-bolder text-primary bg-light-primary fs-7'>
                                  {s.first_name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <span className='fw-bold text-gray-800'>{s.first_name} {s.last_name}</span>
                            </div>
                          </td>
                          <td className='text-center text-muted'>{s.enrollments?.[0]?.roll_number || '—'}</td>
                          {exams.map(e => {
                            const r = getResult(s.id, e.id)
                            return (
                              <td key={e.id} className='text-center'>
                                {!r
                                  ? <span className='text-gray-300'>—</span>
                                  : r.is_absent
                                    ? <span className='text-muted fw-semibold'>AB</span>
                                    : (
                                      <div>
                                        <span className={`fw-bolder ${Number(r.marks_obtained) >= Number(e.min_marks) ? 'text-success' : 'text-danger'}`}>
                                          {fmt(r.marks_obtained)}
                                        </span>
                                        {r.grade_name && <div className='badge badge-light-primary fs-9 mt-1'>{r.grade_name}</div>}
                                      </div>
                                    )
                                }
                              </td>
                            )
                          })}
                          <td className='text-center fw-bolder fs-6 text-gray-800'>{total}</td>
                          <td className='text-center'>
                            <span className={`fw-bold ${pct >= 60 ? 'text-success' : pct >= 33 ? 'text-warning' : 'text-danger'}`}>
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className='text-center'>
                            {topGrade
                              ? <span className='badge badge-light-success fw-bold px-3'>{topGrade}</span>
                              : <span className='text-muted'>—</span>}
                          </td>
                          <td className='text-center'>
                            <span className={`badge fw-bold ${isPass ? 'badge-light-success' : 'badge-light-danger'}`}>
                              {hasAbsent ? 'AB' : isPass ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className='text-end pe-4'>
                            <button
                              className='btn btn-icon btn-sm btn-light-primary'
                              title='Download Report Card PDF'
                              disabled={downloadingReport === s.id}
                              onClick={() => handleDownloadPdf(s.id, `${s.first_name} ${s.last_name}`)}
                            >
                              {downloadingReport === s.id ? (
                                <span className='spinner-border spinner-border-sm'></span>
                              ) : (
                                <i className='ki-duotone ki-file-down fs-4'><span className='path1'></span><span className='path2'></span></i>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className='bg-light fw-bolder fs-7 text-gray-700'>
                      <td colSpan={3} className='ps-4 text-uppercase'>Class Average</td>
                      {exams.map(e => {
                        const examResults = results.filter(r => r.exam_id === e.id && !r.is_absent)
                        const avg = examResults.length
                          ? examResults.reduce((s, r) => s + Number(r.marks_obtained), 0) / examResults.length
                          : 0
                        return <td key={e.id} className='text-center'>{avg.toFixed(1)}</td>
                      })}
                      <td className='text-center'>
                        {students.length
                          ? (students.reduce((s, st) => s + getStudentTotal(st.id), 0) / students.length).toFixed(1)
                          : '—'}
                      </td>
                      <td className='text-center'>
                        {students.length
                          ? ((students.reduce((s, st) => s + getStudentPct(st.id), 0)) / students.length).toFixed(1) + '%'
                          : '—'}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

const ResultsWrapper: FC = () => (
  <>
    <PageTitle breadcrumbs={[{ title: 'Examination', path: '/examination/results', isActive: false }, { title: 'Results', path: '/examination/results', isActive: true }]}>
      Exam Results
    </PageTitle>
    <ResultsPage />
  </>
)

export { ResultsWrapper }
