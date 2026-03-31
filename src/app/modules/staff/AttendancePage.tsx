import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { useAuth } from '../auth'
import { getStaffAttendance, markStaffAttendance } from '../attendance/core/_requests'
import { StaffAttendanceRecord } from '../attendance/core/_models'
import { toast } from 'react-toastify'

const StaffAttendancePage: FC = () => {
    const { currentUser } = useAuth()
    const schoolId = String(currentUser?.schoolId || '')

    // Filter state
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const [search, setSearch] = useState('')

    // Data state
    const [attendances, setAttendances] = useState<StaffAttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Status tracking (local modifications before save)
    // Key is a combination of staff_id and staff_type because IDs might overlap between Teacher/Admin tables
    const [attendanceEdits, setAttendanceEdits] = useState<Record<string, { status: string; remark: string }>>({})

    const fetchAttendance = async () => {
        if (!schoolId || !filterDate) {
            toast.warning('Please select a Date')
            return
        }
        setLoading(true)
        try {
            const { data } = await getStaffAttendance(schoolId, filterDate)
            if (data.success) {
                setAttendances(data.data.attendances || [])
                // Reset edits
                const edits: Record<string, { status: string; remark: string }> = {}
                data.data.attendances.forEach(a => {
                    const key = `${a.staff_type}_${a.staff_id}`
                    edits[key] = {
                        status: a.status || 'PRESENT', // default to present if blank
                        remark: a.remark || ''
                    }
                })
                setAttendanceEdits(edits)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch staff attendance')
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch on mount for today
    useEffect(() => {
        if(schoolId) fetchAttendance()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schoolId])

    const saveAttendance = async () => {
        if (!schoolId || !filterDate) return
        setSaving(true)
        try {
            const payload = {
                date: filterDate,
                staffList: attendances.map(a => {
                    const key = `${a.staff_type}_${a.staff_id}`
                    const record = attendanceEdits[key];
                    return {
                        staff_id: a.staff_id,
                        staff_type: a.staff_type,
                        status: record.status,
                        ...(record.remark?.trim() ? { remark: record.remark.trim() } : {})
                    }
                })
            }
            // Add log
            console.log("Sending staff mark attendance payload:", payload);

            const { data } = await markStaffAttendance(schoolId, payload)
            if (data.success) {
                setShowSuccessModal(true)
                fetchAttendance()
            }
        } catch (error: any) {
            console.error("Staff Attendance Mark API Error:", error.response?.data || error);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to save attendance';
            toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
        } finally {
            setSaving(false)
        }
    }

    const markAll = (status: string) => {
        const newEdits = { ...attendanceEdits }
        Object.keys(newEdits).forEach(key => {
            newEdits[key].status = status
        })
        setAttendanceEdits(newEdits)
    }

    const handleStatusChange = (staffId: number, staffType: string, status: string) => {
        const key = `${staffType}_${staffId}`
        setAttendanceEdits(prev => ({
            ...prev,
            [key]: { ...prev[key], status }
        }))
    }

    const handleRemarkChange = (staffId: number, staffType: string, remark: string) => {
        const key = `${staffType}_${staffId}`
        setAttendanceEdits(prev => ({
            ...prev,
            [key]: { ...prev[key], remark }
        }))
    }

    const filteredAttendances = attendances.filter(a => {
        if (!search) return true
        const name = (a.name || '').toLowerCase()
        const designation = (a.designation || '').toLowerCase()
        return name.includes(search.toLowerCase()) || designation.includes(search.toLowerCase())
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
                                <label className='fw-semibold fs-7 mb-1 text-gray-600'>Attendance Date</label>
                                <input type='date' className='form-control form-control-solid form-control-sm'
                                    value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                            </div>
                            <div className='col-md-2'>
                                <button className='btn btn-primary btn-sm w-100' onClick={fetchAttendance} disabled={loading || !filterDate}>
                                    {loading ? <span className='spinner-border spinner-border-sm'></span> : 'Fetch Register'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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
                            {/* Visual Indicator */}
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
                                        <th className='min-w-200px'>Staff Member</th>
                                        <th className='min-w-100px'>Type</th>
                                        <th className='min-w-300px'>Attendance Status</th>
                                        <th className='min-w-200px'>Remark</th>
                                    </tr>
                                </thead>
                                <tbody className='fw-semibold text-gray-600'>
                                    {attendances.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='text-center py-10 text-muted'>
                                                {loading ? 'Fetching staff records...' : 'No records found for selected date.'}
                                            </td>
                                        </tr>
                                    ) : filteredAttendances.map((staff, idx) => {
                                        const key = `${staff.staff_type}_${staff.staff_id}`
                                        return (
                                            <tr key={key}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <div className='d-flex align-items-center'>
                                                        <div className='symbol symbol-circle symbol-35px overflow-hidden me-3'>
                                                            <div className='symbol-label fs-3 bg-light-info text-info'>
                                                                {(staff.name && staff.name !== 'undefined') ? staff.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                        </div>
                                                        <div className='d-flex flex-column'>
                                                            <span className='text-gray-800 fw-bold mb-1'>
                                                                {staff.name !== 'undefined' ? staff.name : `Staff #${staff.staff_id}`}
                                                            </span>
                                                            <span className='text-muted fs-7'>{staff.designation}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-light-${staff.staff_type === 'TEACHER' ? 'primary' : 'warning'}`}>
                                                        {staff.staff_type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className='d-flex flex-wrap gap-2'>
                                                        {STATUSES.map(status => {
                                                            const isChecked = attendanceEdits[key]?.status === status;
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
                                                                        name={`status_${key}`}
                                                                        value={status}
                                                                        checked={isChecked}
                                                                        onChange={(e) => handleStatusChange(staff.staff_id, staff.staff_type, e.target.value)}
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
                                                        value={attendanceEdits[key]?.remark || ''}
                                                        onChange={(e) => handleRemarkChange(staff.staff_id, staff.staff_type, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {attendances.length > 0 && (
                            <div className='d-flex justify-content-end mt-5'>
                                <button className='btn btn-primary' onClick={saveAttendance} disabled={saving}>
                                    {saving ? <span className='spinner-border spinner-border-sm me-2'></span> : <i className='ki-duotone ki-check fs-2'><span className='path1'></span><span className='path2'></span></i>}
                                    {attendances.some(a => a.attendance_id) ? 'Update Staff Attendance' : 'Save Staff Attendance'}
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
                            <p className='text-gray-600 fs-5 mb-8'>Staff attendance has been successfully saved.</p>
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

const StaffAttendanceWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Staff Attendance</PageTitle>
            <StaffAttendancePage />
        </>
    )
}

export { StaffAttendanceWrapper }
