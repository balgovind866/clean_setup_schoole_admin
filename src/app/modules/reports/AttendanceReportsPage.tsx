import { FC, useState, useEffect, useCallback } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getClassMonthlyMatrix, getStudentMonthlyReport, getStaffMonthlyMatrix, getStaffMonthlyReport, getStaffAttendance } from '../attendance/core/_requests'
import { ClassMonthlyMatrixResponse, StudentMonthlyReportResponse, StaffMonthlyMatrixResponse, StaffMonthlyReportResponse } from '../attendance/core/_models'
import { getClasses, getClassSections } from '../academic/core/_requests'
import { getStudents } from '../students/core/_requests'
import { ClassModel, ClassSectionMappingModel } from '../academic/core/_models'
import { toast } from 'react-toastify'

const AttendanceReports: FC = () => {
    const { currentUser } = useAuth()
    const schoolId = String(currentUser?.schoolId || '')

    const [activeTab, setActiveTab] = useState<'matrix' | 'student' | 'staff_matrix' | 'staff'>('matrix')

    // Filters for Matrix
    const [classes, setClasses] = useState<ClassModel[]>([])
    const [classSections, setClassSections] = useState<ClassSectionMappingModel[]>([])
    const [filterClass, setFilterClass] = useState('')
    const [filterSection, setFilterSection] = useState('')
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
    const [filterYear, setFilterYear] = useState(new Date().getFullYear())

    // Filters for Staff
    const [staffs, setStaffs] = useState<any[]>([])
    const [filterStaffType, setFilterStaffType] = useState<'TEACHER' | 'ADMIN'>('TEACHER')
    const [filterStaffId, setFilterStaffId] = useState('')

    // Filters for Student
    const [students, setStudents] = useState<any[]>([])
    const [filterStudentId, setFilterStudentId] = useState('')

    // Data
    const [matrixData, setMatrixData] = useState<ClassMonthlyMatrixResponse['data']['matrix_report'] | null>(null)
    const [studentData, setStudentData] = useState<StudentMonthlyReportResponse['data']['report'] | null>(null)
    const [staffMatrixData, setStaffMatrixData] = useState<StaffMonthlyMatrixResponse['data']['matrix_report'] | null>(null)
    const [staffData, setStaffData] = useState<StaffMonthlyReportResponse['data']['report'] | null>(null)
    const [loading, setLoading] = useState(false)

    // Load Initial Meta
    useEffect(() => {
        if (!schoolId) return
        getClasses(schoolId, 1, 100).then(res => {
            if (res.data.success) setClasses(res.data.data.classes || [])
        }).catch(() => {})

        getStudents(schoolId, { limit: 1000 }).then(res => {
            if (res.data.success) setStudents(res.data.data.students || [])
        }).catch(() => {})

        getStaffAttendance(schoolId, new Date().toISOString().split('T')[0]).then(res => {
            if (res.data.success) setStaffs(res.data.data.attendances || [])
        }).catch(() => {})
    }, [schoolId])

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

    const fetchMatrix = async () => {
        if (!schoolId || !filterSection) {
            toast.warning('Please select a Class and Section')
            return
        }
        setLoading(true)
        try {
            const { data } = await getClassMonthlyMatrix(schoolId, filterSection, filterMonth, filterYear)
            if (data.success) setMatrixData(data.data.matrix_report)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch matrix')
        } finally {
            setLoading(false)
        }
    }

    const fetchStudentReport = async () => {
        if (!schoolId || !filterStudentId) {
            toast.warning('Please select a Student')
            return
        }
        setLoading(true)
        try {
            const { data } = await getStudentMonthlyReport(schoolId, filterStudentId, filterMonth, filterYear)
            if (data.success) setStudentData(data.data.report)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }



    const fetchStaffMatrix = async () => {
        if (!schoolId) return
        setLoading(true)
        try {
            const { data } = await getStaffMonthlyMatrix(schoolId, filterMonth, filterYear)
            if (data.success) setStaffMatrixData(data.data.matrix_report)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to fetch staff matrix')
        } finally {
            setLoading(false)
        }
    }

    const fetchStaffReport = async () => {
        if (!schoolId || !filterStaffId) {
            toast.warning('Please select a Staff')
            return
        }
        setLoading(true)
        try {
            const { data } = await getStaffMonthlyReport(schoolId, filterStaffType, filterStaffId, filterMonth, filterYear)
            if (data.success) setStaffData(data.data.report)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to fetch staff report')
        } finally {
            setLoading(false)
        }
    }

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month, 0).getDate();
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = 'secondary';
        let label = status || '-';
        if (status === 'PRESENT') color = 'success', label = 'P';
        if (status === 'ABSENT') color = 'danger', label = 'A';
        if (status === 'LATE') color = 'warning', label = 'L';
        if (status === 'HALF_DAY') color = 'info', label = 'HD';
        if (status === 'LEAVE') color = 'primary', label = 'LV';

        return <span className={`badge badge-light-${color} fw-bold w-30px h-30px d-flex align-items-center justify-content-center`}>{label}</span>
    }

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
    }))

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    return (
        <>
            <ToolbarWrapper />
            <Content>
                <div className='card mb-5'>
                    <div className='card-header card-header-stretch'>
                        <h3 className='card-title'>Attendance Reports</h3>
                        <div className='card-toolbar'>
                            <ul className='nav nav-tabs nav-line-tabs nav-stretch fs-6 border-0'>
                                <li className='nav-item'>
                                    <a className={`nav-link text-active-primary px-4 cursor-pointer ${activeTab === 'matrix' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('matrix')}>
                                        Class Monthly Matrix
                                    </a>
                                </li>
                                <li className='nav-item'>
                                    <a className={`nav-link text-active-primary px-4 cursor-pointer ${activeTab === 'student' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('student')}>
                                        Student Individual Report
                                    </a>
                                </li>

                                <li className='nav-item'>
                                    <a className={`nav-link text-active-primary px-4 cursor-pointer ${activeTab === 'staff_matrix' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('staff_matrix')}>
                                        Staff Monthly Matrix
                                    </a>
                                </li>
                                <li className='nav-item'>
                                    <a className={`nav-link text-active-primary px-4 cursor-pointer ${activeTab === 'staff' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('staff')}>
                                        Staff Individual Report
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className='card-body'>
                        {/* Common Filters Container */}
                        <div className='row g-4 align-items-end mb-7 pb-5 border-bottom'>

                            {activeTab === 'staff_matrix' ? (
                                <div className='col-md-6'>
                                     {/* No extra filters needed for staff matrix */}
                                </div>
                            ) : null}
                            {activeTab === 'staff' ? (
                                <>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Staff Type</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterStaffType}
                                            onChange={e => {
                                                setFilterStaffType(e.target.value as any);
                                                setFilterStaffId('');
                                            }}>
                                            <option value='TEACHER'>Teacher</option>
                                            <option value='ADMIN'>Admin</option>
                                        </select>
                                    </div>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Staff</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterStaffId}
                                            onChange={e => setFilterStaffId(e.target.value)}>
                                            <option value=''>Select Staff</option>
                                            {staffs.filter(s => s.staff_type === filterStaffType).map(s => <option key={s.staff_id} value={s.staff_id}>{s.name || s.first_name + ' ' + (s.last_name || '')} (ID: {s.staff_id})</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : null}
                            
                            {activeTab === 'matrix' && (
                                <>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Class</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterClass}
                                            onChange={e => handleClassFilter(e.target.value)}>
                                            <option value=''>Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Section</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterSection}
                                            onChange={e => setFilterSection(e.target.value)} disabled={!filterClass}>
                                            <option value=''>Select Section</option>
                                            {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.section?.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {activeTab === 'student' && (
                                <div className='col-md-6'>
                                    <label className='fw-semibold fs-7 mb-1 text-gray-600'>Student</label>
                                    <select className='form-select form-select-solid form-select-sm' value={filterStudentId}
                                        onChange={e => setFilterStudentId(e.target.value)}>
                                        <option value=''>Select Student</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (ID: {s.id})</option>)}
                                    </select>
                                </div>
                            )}
                            {activeTab === 'staff_matrix' && (
                                <div className='col-md-6'>
                                     {/* Matrix for staff uses all staffs so no extra filter required */}
                                </div>
                            )}
                            {activeTab === 'staff' && (
                                <>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Staff Type</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterStaffType}
                                            onChange={e => {
                                                setFilterStaffType(e.target.value as any);
                                                setFilterStaffId('');
                                            }}>
                                            <option value='TEACHER'>Teacher</option>
                                            <option value='ADMIN'>Admin</option>
                                        </select>
                                    </div>
                                    <div className='col-md-3'>
                                        <label className='fw-semibold fs-7 mb-1 text-gray-600'>Staff</label>
                                        <select className='form-select form-select-solid form-select-sm' value={filterStaffId}
                                            onChange={e => setFilterStaffId(e.target.value)}>
                                            <option value=''>Select Staff</option>
                                            {staffs.filter(s => s.staff_type === filterStaffType).map(s => <option key={s.staff_id} value={s.staff_id}>{s.name || s.first_name + ' ' + (s.last_name||'')} (ID: {s.staff_id})</option>)}
                                        </select>
                                    </div>
                                </>
                            )}


                            <div className='col-md-2'>
                                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Month</label>
                                <select className='form-select form-select-solid form-select-sm' value={filterMonth}
                                    onChange={e => setFilterMonth(Number(e.target.value))}>
                                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div className='col-md-2'>
                                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Year</label>
                                <select className='form-select form-select-solid form-select-sm' value={filterYear}
                                    onChange={e => setFilterYear(Number(e.target.value))}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className='col-md-2'>
                                <button className='btn btn-primary btn-sm w-100' 
                                        onClick={() => { if(activeTab === 'matrix') fetchMatrix(); else if(activeTab === 'student') fetchStudentReport(); else if(activeTab === 'staff_matrix') fetchStaffMatrix(); else fetchStaffReport(); }} 
                                        disabled={loading}>
                                    {loading ? <span className='spinner-border spinner-border-sm'></span> : 'Generate Report'}
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {activeTab === 'matrix' && (
                            <div>
                                {!matrixData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select filters and generate report to view the matrix.</div>
                                )}
                                {matrixData && (
                                    <div className='table-responsive'>
                                        <table className='table align-middle table-row-dashed fs-8 gy-3 border'>
                                            <thead className='bg-light'>
                                                <tr className='text-start text-gray-600 fw-bold text-uppercase gs-0'>
                                                    <th className='min-w-150px px-3 sticky-start bg-light'>Student</th>
                                                    <th className='min-w-50px text-center px-1' title='Present'>P</th>
                                                    <th className='min-w-50px text-center px-1' title='Absent'>A</th>
                                                    <th className='min-w-50px text-center px-1 border-end' title='Leave'>L</th>
                                                    {Array.from({ length: getDaysInMonth(matrixData.month, matrixData.year) }, (_, i) => (
                                                        <th key={i} className='min-w-40px text-center px-1'>{i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className='fw-semibold text-gray-600'>
                                                {matrixData.matrix.length === 0 ? (
                                                    <tr><td colSpan={35} className='text-center py-5'>No records</td></tr>
                                                ) : matrixData.matrix.map((row) => (
                                                    <tr key={row.student_id}>
                                                        <td className='px-3 fw-bold sticky-start bg-body'>
                                                            <div className='text-gray-800 text-truncate' style={{maxWidth: '150px'}} title={row.name}>{row.name}</div>
                                                        </td>
                                                        <td className='text-center px-1 text-success fw-bold'>{row.summary.present}</td>
                                                        <td className='text-center px-1 text-danger fw-bold'>{row.summary.absent}</td>
                                                        <td className='text-center px-1 text-primary fw-bold border-end'>{row.summary.leave}</td>
                                                        {Array.from({ length: getDaysInMonth(matrixData.month, matrixData.year) }, (_, i) => {
                                                            const dateStr = `${matrixData.year}-${String(matrixData.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                                                            const status = row.attendance[dateStr]
                                                            return (
                                                                <td key={i} className='text-center px-1 p-0 m-0 align-middle'>
                                                                    <div className='d-flex justify-content-center'>
                                                                        <StatusBadge status={status} />
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'student' && (
                            <div>
                                {!studentData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select a student and generate report.</div>
                                )}
                                {studentData && (
                                    <div className='row g-5'>
                                        <div className='col-lg-4'>
                                            <div className='card card-flush bg-light'>
                                                <div className='card-body py-5'>
                                                    <h4 className='card-title text-gray-800 mb-5'>Attendance Summary</h4>
                                                    <div className='d-flex flex-column gap-3'>
                                                        <div className='d-flex justify-content-between text-gray-600 fw-bold fs-6'>
                                                            <span>Total Marked Days</span>
                                                            <span className='text-gray-900'>{studentData.summary.total_marked}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-success fw-bold fs-6'>
                                                            <span>Present</span>
                                                            <span>{studentData.summary.present}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-danger fw-bold fs-6'>
                                                            <span>Absent</span>
                                                            <span>{studentData.summary.absent}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-warning fw-bold fs-6'>
                                                            <span>Late</span>
                                                            <span>{studentData.summary.late}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-primary fw-bold fs-6'>
                                                            <span>Leave</span>
                                                            <span>{studentData.summary.leave}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-lg-8'>
                                            <div className='table-responsive border rounded'>
                                                <table className='table align-middle table-row-dashed fs-6 gy-4 mb-0'>
                                                    <thead className='bg-light'>
                                                        <tr className='text-start text-gray-600 fw-bold fs-7 text-uppercase gs-0'>
                                                            <th className='ps-4 min-w-100px'>Date</th>
                                                            <th className='min-w-100px'>Status</th>
                                                            <th className='min-w-100px'>Entry Time</th>
                                                            <th className='min-w-150px'>Mode</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='fw-semibold text-gray-600'>
                                                        {studentData.records.length === 0 ? (
                                                            <tr><td colSpan={4} className='text-center py-5'>No records found for this month</td></tr>
                                                        ) : studentData.records.map(record => (
                                                            <tr key={record.id}>
                                                                <td className='ps-4'>
                                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        record.status === 'PRESENT' ? 'badge-light-success' :
                                                                        record.status === 'ABSENT' ? 'badge-light-danger' :
                                                                        record.status === 'LATE' ? 'badge-light-warning' :
                                                                        record.status === 'LEAVE' ? 'badge-light-primary' : 'badge-light-secondary'
                                                                    }`}>
                                                                        {record.status}
                                                                    </span>
                                                                </td>
                                                                <td>{record.entry_time || '-'}</td>
                                                                <td><span className='text-muted'>{record.attendance_mode ? record.attendance_mode.replace(/_/g, ' ') : 'MANUAL'}</span></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'staff_matrix' && (
                            <div>
                                {!staffMatrixData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select filters and generate report to view the staff matrix.</div>
                                )}
                                {staffMatrixData && (
                                    <div className='table-responsive'>
                                        <table className='table align-middle table-row-dashed fs-8 gy-3 border'>
                                            <thead className='bg-light'>
                                                <tr className='text-start text-gray-600 fw-bold text-uppercase gs-0'>
                                                    <th className='min-w-150px px-3 sticky-start bg-light'>Staff Name</th>
                                                    <th className='min-w-100px px-1 bg-light'>Type</th>
                                                    <th className='min-w-50px text-center px-1' title='Present'>P</th>
                                                    <th className='min-w-50px text-center px-1' title='Absent'>A</th>
                                                    <th className='min-w-50px text-center px-1 border-end' title='Leave'>L</th>
                                                    {Array.from({ length: getDaysInMonth(staffMatrixData.month, staffMatrixData.year) }, (_, i) => (
                                                        <th key={i} className='min-w-40px text-center px-1'>{i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className='fw-semibold text-gray-600'>
                                                {staffMatrixData.matrix.length === 0 ? (
                                                    <tr><td colSpan={35} className='text-center py-5'>No records</td></tr>
                                                ) : staffMatrixData.matrix.map((row) => {
                                                    const dispName = row.name || 'Staff #' + row.staff_id;
                                                    return (
                                                    <tr key={row.staff_id + '_' + row.staff_type}>
                                                        <td className='px-3 fw-bold sticky-start bg-body'>
                                                            <div className='text-gray-800 text-truncate' style={{maxWidth: '150px'}} title={dispName}>{dispName}</div>
                                                        </td>
                                                        <td className='px-1 sticky-start bg-body'>
                                                            <span className={`badge badge-light-${row.staff_type === 'TEACHER' ? 'primary' : 'warning'}`}>{row.staff_type}</span>
                                                        </td>
                                                        <td className='text-center px-1 text-success fw-bold'>{row.summary.present}</td>
                                                        <td className='text-center px-1 text-danger fw-bold'>{row.summary.absent}</td>
                                                        <td className='text-center px-1 text-primary fw-bold border-end'>{row.summary.leave}</td>
                                                        {Array.from({ length: getDaysInMonth(staffMatrixData.month, staffMatrixData.year) }, (_, i) => {
                                                            const dateStr = `${staffMatrixData.year}-${String(staffMatrixData.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                                                            const status = row.attendance[dateStr]
                                                            return (
                                                                <td key={i} className='text-center px-1 p-0 m-0 align-middle'>
                                                                    <div className='d-flex justify-content-center'>
                                                                        <StatusBadge status={status} />
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'staff' && (
                            <div>
                                {!staffData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select a staff member and generate report.</div>
                                )}
                                {staffData && (
                                    <div className='row g-5'>
                                        <div className='col-lg-4'>
                                            <div className='card card-flush bg-light'>
                                                <div className='card-body py-5'>
                                                    <h4 className='card-title text-gray-800 mb-5'>Staff Attendance Summary</h4>
                                                    <div className='d-flex flex-column gap-3'>
                                                        <div className='d-flex justify-content-between text-gray-600 fw-bold fs-6'>
                                                            <span>Total Marked Days</span>
                                                            <span className='text-gray-900'>{staffData.summary.total_marked}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-success fw-bold fs-6'>
                                                            <span>Present</span>
                                                            <span>{staffData.summary.present}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-danger fw-bold fs-6'>
                                                            <span>Absent</span>
                                                            <span>{staffData.summary.absent}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-warning fw-bold fs-6'>
                                                            <span>Late</span>
                                                            <span>{staffData.summary.late}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-primary fw-bold fs-6'>
                                                            <span>Leave</span>
                                                            <span>{staffData.summary.leave}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-lg-8'>
                                            <div className='table-responsive border rounded'>
                                                <table className='table align-middle table-row-dashed fs-6 gy-4 mb-0'>
                                                    <thead className='bg-light'>
                                                        <tr className='text-start text-gray-600 fw-bold fs-7 text-uppercase gs-0'>
                                                            <th className='ps-4 min-w-100px'>Date</th>
                                                            <th className='min-w-100px'>Status</th>
                                                            <th className='min-w-100px'>Entry Time</th>
                                                            <th className='min-w-150px'>Mode</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='fw-semibold text-gray-600'>
                                                        {staffData.records.length === 0 ? (
                                                            <tr><td colSpan={4} className='text-center py-5'>No records found for this month</td></tr>
                                                        ) : staffData.records.map((record: any) => (
                                                            <tr key={record.id}>
                                                                <td className='ps-4'>
                                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        record.status === 'PRESENT' ? 'badge-light-success' :
                                                                        record.status === 'ABSENT' ? 'badge-light-danger' :
                                                                        record.status === 'LATE' ? 'badge-light-warning' :
                                                                        record.status === 'LEAVE' ? 'badge-light-primary' : 'badge-light-secondary'
                                                                    }`}>
                                                                        {record.status}
                                                                    </span>
                                                                </td>
                                                                <td>{record.entry_time || '-'}</td>
                                                                <td><span className='text-muted'>{record.attendance_mode ? record.attendance_mode.replace(/_/g, ' ') : 'MANUAL'}</span></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'staff_matrix' && (
                            <div>
                                {!staffMatrixData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select filters and generate report to view the staff matrix.</div>
                                )}
                                {staffMatrixData && (
                                    <div className='table-responsive'>
                                        <table className='table align-middle table-row-dashed fs-8 gy-3 border'>
                                            <thead className='bg-light'>
                                                <tr className='text-start text-gray-600 fw-bold text-uppercase gs-0'>
                                                    <th className='min-w-150px px-3 sticky-start bg-light'>Staff Name</th>
                                                    <th className='min-w-100px px-1 bg-light'>Type</th>
                                                    <th className='min-w-50px text-center px-1' title='Present'>P</th>
                                                    <th className='min-w-50px text-center px-1' title='Absent'>A</th>
                                                    <th className='min-w-50px text-center px-1 border-end' title='Leave'>L</th>
                                                    {Array.from({ length: getDaysInMonth(staffMatrixData.month, staffMatrixData.year) }, (_, i) => (
                                                        <th key={i} className='min-w-40px text-center px-1'>{i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className='fw-semibold text-gray-600'>
                                                {staffMatrixData.matrix.length === 0 ? (
                                                    <tr><td colSpan={35} className='text-center py-5'>No records</td></tr>
                                                ) : staffMatrixData.matrix.map((row) => {
                                                    const dispName = row.name || 'Staff #' + row.staff_id;
                                                    return (
                                                    <tr key={row.staff_id + '_' + row.staff_type}>
                                                        <td className='px-3 fw-bold sticky-start bg-body'>
                                                            <div className='text-gray-800 text-truncate' style={{maxWidth: '150px'}} title={dispName}>{dispName}</div>
                                                        </td>
                                                        <td className='px-1 sticky-start bg-body'>
                                                            <span className={`badge badge-light-${row.staff_type === 'TEACHER' ? 'primary' : 'warning'}`}>{row.staff_type}</span>
                                                        </td>
                                                        <td className='text-center px-1 text-success fw-bold'>{row.summary.present}</td>
                                                        <td className='text-center px-1 text-danger fw-bold'>{row.summary.absent}</td>
                                                        <td className='text-center px-1 text-primary fw-bold border-end'>{row.summary.leave}</td>
                                                        {Array.from({ length: getDaysInMonth(staffMatrixData.month, staffMatrixData.year) }, (_, i) => {
                                                            const dateStr = `${staffMatrixData.year}-${String(staffMatrixData.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                                                            const status = row.attendance[dateStr]
                                                            return (
                                                                <td key={i} className='text-center px-1 p-0 m-0 align-middle'>
                                                                    <div className='d-flex justify-content-center'>
                                                                        <StatusBadge status={status} />
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'staff' && (
                            <div>
                                {!staffData && !loading && (
                                    <div className='text-center py-10 text-muted'>Select a staff member and generate report.</div>
                                )}
                                {staffData && (
                                    <div className='row g-5'>
                                        <div className='col-lg-4'>
                                            <div className='card card-flush bg-light'>
                                                <div className='card-body py-5'>
                                                    <h4 className='card-title text-gray-800 mb-5'>Staff Attendance Summary</h4>
                                                    <div className='d-flex flex-column gap-3'>
                                                        <div className='d-flex justify-content-between text-gray-600 fw-bold fs-6'>
                                                            <span>Total Marked Days</span>
                                                            <span className='text-gray-900'>{staffData.summary.total_marked}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-success fw-bold fs-6'>
                                                            <span>Present</span>
                                                            <span>{staffData.summary.present}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-danger fw-bold fs-6'>
                                                            <span>Absent</span>
                                                            <span>{staffData.summary.absent}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-warning fw-bold fs-6'>
                                                            <span>Late</span>
                                                            <span>{staffData.summary.late}</span>
                                                        </div>
                                                        <div className='d-flex justify-content-between text-primary fw-bold fs-6'>
                                                            <span>Leave</span>
                                                            <span>{staffData.summary.leave}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-lg-8'>
                                            <div className='table-responsive border rounded'>
                                                <table className='table align-middle table-row-dashed fs-6 gy-4 mb-0'>
                                                    <thead className='bg-light'>
                                                        <tr className='text-start text-gray-600 fw-bold fs-7 text-uppercase gs-0'>
                                                            <th className='ps-4 min-w-100px'>Date</th>
                                                            <th className='min-w-100px'>Status</th>
                                                            <th className='min-w-100px'>Entry Time</th>
                                                            <th className='min-w-150px'>Mode</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='fw-semibold text-gray-600'>
                                                        {staffData.records.length === 0 ? (
                                                            <tr><td colSpan={4} className='text-center py-5'>No records found for this month</td></tr>
                                                        ) : staffData.records.map((record: any) => (
                                                            <tr key={record.id}>
                                                                <td className='ps-4'>
                                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        record.status === 'PRESENT' ? 'badge-light-success' :
                                                                        record.status === 'ABSENT' ? 'badge-light-danger' :
                                                                        record.status === 'LATE' ? 'badge-light-warning' :
                                                                        record.status === 'LEAVE' ? 'badge-light-primary' : 'badge-light-secondary'
                                                                    }`}>
                                                                        {record.status}
                                                                    </span>
                                                                </td>
                                                                <td>{record.entry_time || '-'}</td>
                                                                <td><span className='text-muted'>{record.attendance_mode ? record.attendance_mode.replace(/_/g, ' ') : 'MANUAL'}</span></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </Content>
        </>
    )
}

const AttendanceReportsWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Attendance Reports</PageTitle>
            <AttendanceReports />
        </>
    )
}

export { AttendanceReportsWrapper }
