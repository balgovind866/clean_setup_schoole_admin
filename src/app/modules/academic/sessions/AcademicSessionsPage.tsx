import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../../_metronic/layout/components/toolbar'
import { Content } from '../../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../../auth'
import {
    getAcademicSessions,
    createAcademicSession,
    updateAcademicSession,
    deleteAcademicSession,
    setCurrentAcademicSession
} from '../core/_requests'
import { SessionModel } from '../core/_models'

const AcademicSessionsPage: FC = () => {
    const { currentUser } = useAuth();
    const schoolId = currentUser?.schoolId || '';

    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        session_year: '',
        start_date: '',
        end_date: '',
        is_current: false,
        attendance_mode: 'DAILY' as 'DAILY' | 'PERIOD'
    });

    useEffect(() => {
        if (schoolId) {
            fetchSessions();
        }
    }, [schoolId]);

    const fetchSessions = async () => {
        if (!schoolId) return;
        setLoading(true);
        setError(null);
        try {
            const { data: response } = await getAcademicSessions(schoolId, 1, 100);
            if (response.success) {
                setSessions(response.data.sessions || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (session?: SessionModel) => {
        setError(null);
        if (session) {
            setIsEditMode(true);
            setCurrentId(session.id);
            setFormData({
                session_year: session.session_year,
                start_date: session.start_date.split('T')[0], // Extract YYYY-MM-DD
                end_date: session.end_date.split('T')[0],
                is_current: session.is_current,
                attendance_mode: session.attendance_mode || 'DAILY'
            });
        } else {
            setIsEditMode(false);
            setCurrentId(null);
            setFormData({
                session_year: '',
                start_date: '',
                end_date: '',
                is_current: false,
                attendance_mode: 'DAILY'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode && currentId) {
                await updateAcademicSession(schoolId, currentId, formData);
            } else {
                await createAcademicSession(schoolId, formData);
            }
            setShowModal(false);
            fetchSessions();
        } catch (err: any) {
            setError(err.response?.data?.message || "Operation failed");
            setLoading(false);
        }
    };

    const handleSetCurrent = async (id: number) => {
        if (!window.confirm("Are you sure you want to set this session as the Current Active Session? This will deactivate the currently active session.")) return;
        setLoading(true);
        try {
            await setCurrentAcademicSession(schoolId, id);
            fetchSessions();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to set as current session");
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, is_current: boolean) => {
        if (is_current) {
            setError("Active sessions cannot be deleted. Please set another session as active first.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this session?")) return;
        setLoading(true);
        try {
            await deleteAcademicSession(schoolId, id);
            fetchSessions();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to delete");
            setLoading(false);
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Manage Academic Sessions</PageTitle>
            <ToolbarWrapper />
            <Content>
                {error && !showModal && (
                    <div className='alert alert-danger mb-5'>{error}</div>
                )}

                <div className='card card-flush'>
                    <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
                        <div className='card-title'>
                            <h3 className='fw-bolder m-0'>Academic Sessions</h3>
                        </div>
                        <div className='card-toolbar'>
                            <button className='btn btn-primary' onClick={() => handleOpenModal()}>
                                <i className='ki-duotone ki-plus fs-2'></i> Add Session
                            </button>
                        </div>
                    </div>
                    <div className='card-body pt-0 table-responsive'>
                        <table className='table align-middle table-row-dashed fs-6 gy-5'>
                            <thead>
                                <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                                    <th>Session Year</th>
                                    <th>Duration</th>
                                    <th>Attendance Mode</th>
                                    <th>Status</th>
                                    <th className='text-end'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='fw-semibold text-gray-600'>
                                {loading && sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className='text-center py-10'>Loading...</td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className='text-center py-10'>No sessions found.</td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.id}>
                                            <td><span className='text-gray-800 fw-bold'>{session.session_year}</span></td>
                                            <td>{new Date(session.start_date).toLocaleDateString()} to {new Date(session.end_date).toLocaleDateString()}</td>
                                            <td>
                                                <div className={`badge badge-light-${session.attendance_mode === 'PERIOD' ? 'warning' : 'info'}`}>
                                                    {session.attendance_mode === 'PERIOD' ? '⏱ Period-wise' : ' Daily'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`badge badge-light-${session.is_current ? 'success' : 'secondary'}`}>
                                                    {session.is_current ? 'Current' : 'Past'}
                                                </div>
                                            </td>
                                            <td className='text-end'>
                                                {!session.is_current && (
                                                    <button
                                                        className='btn btn-icon btn-bg-light btn-active-color-success btn-sm me-1'
                                                        title='Set as Current'
                                                        onClick={() => handleSetCurrent(session.id)}
                                                    >
                                                        <i className='ki-duotone ki-check-square fs-2'><span className='path1'></span><span className='path2'></span></i>
                                                    </button>
                                                )}
                                                <button
                                                    className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                                    title='Edit'
                                                    onClick={() => handleOpenModal(session)}
                                                >
                                                    <i className='ki-duotone ki-pencil fs-2'><span className='path1'></span><span className='path2'></span></i>
                                                </button>
                                                <button
                                                    className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                                    title='Delete'
                                                    onClick={() => handleDelete(session.id, session.is_current)}
                                                >
                                                    <i className='ki-duotone ki-trash fs-2'><span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Content>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Academic Session' : 'Create New Academic Session'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-10 px-lg-17'>
                    {error && <Alert variant='danger'>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-12 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Session Year (e.g. 2024-2025)</label>
                                <input type='text' className='form-control form-control-solid' placeholder='2024-2025' value={formData.session_year} onChange={(e) => setFormData({ ...formData, session_year: e.target.value })} required />
                            </div>
                        </div>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Start Date</label>
                                <input type='date' className='form-control form-control-solid' value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>End Date</label>
                                <input type='date' className='form-control form-control-solid' value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                            </div>
                        </div>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Attendance Mode</label>
                                <select
                                    className='form-select form-select-solid'
                                    value={formData.attendance_mode}
                                    onChange={(e) => setFormData({ ...formData, attendance_mode: e.target.value as 'DAILY' | 'PERIOD' })}
                                    required
                                >
                                    <option value='DAILY'>Daily (Once per day)</option>
                                    <option value='PERIOD'>Period-wise (For each period)</option>
                                </select>

                                <div className='form-text text-muted mt-1'>
                                    {formData.attendance_mode === 'PERIOD'
                                        ? ' In Period mode, attendance will be taken separately for each subject period.'
                                        : ' In Daily mode, a student will be marked present/absent only once per day.'}
                                </div>
                            </div>
                            <div className='col-md-6 fv-row d-flex align-items-center'>
                                <div className="form-check form-switch form-check-custom form-check-solid">
                                    <input className="form-check-input" type="checkbox" id="isCurrentRole" checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })} />
                                    <label className="form-check-label ms-3 fw-semibold text-gray-700" htmlFor="isCurrentRole">Set as Current (Active) Session</label>
                                </div>
                            </div>
                        </div>

                        <div className='text-end pt-5'>
                            <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                            <Button variant='primary' type='submit' disabled={loading}>{loading ? 'Saving...' : 'Save Session'}</Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default AcademicSessionsPage
