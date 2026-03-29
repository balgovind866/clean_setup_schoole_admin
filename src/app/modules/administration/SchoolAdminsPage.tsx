import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../auth'
import {
    getSchools,
    getSchoolStaff,
    createSchoolStaff,
    updateSchoolStaff,
    deleteSchoolStaff,
    toggleStaffStatus,
    updateStaffPermissions,
    getProfessions
} from '../auth/core/_requests'
import { SchoolModel, ProfessionModel, StaffModel } from '../auth/core/_models'

const MODULES = [
    'students', 'staff', 'academic', 'fees', 'timetable',
    'examination', 'library', 'transport', 'hostel', 'communication',
    'inventory', 'payroll', 'reports', 'settings', 'professions'
];

const SchoolAdminsPage: FC = () => {
    const { currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';

    const [schools, setSchools] = useState<SchoolModel[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>(currentUser?.schoolId ? currentUser.schoolId.toString() : '');

    const [staffList, setStaffList] = useState<StaffModel[]>([]);
    const [professions, setProfessions] = useState<ProfessionModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Main Edit/Add Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        profession_id: '',
        is_active: true
    });

    // Permissions Modal
    const [showPermModal, setShowPermModal] = useState(false);
    const [permStaff, setPermStaff] = useState<StaffModel | null>(null);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchSchools();
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (selectedSchool) {
            fetchStaff();
            fetchProf();
        } else {
            setStaffList([]);
            setProfessions([]);
        }
    }, [selectedSchool]);

    const fetchSchools = async () => {
        try {
            const { data: response } = await getSchools(1, 100, '', true);
            if (response.success) {
                setSchools(response.data.schools);
                if (!selectedSchool && response.data.schools.length > 0) {
                    setSelectedSchool(response.data.schools[0].id.toString());
                }
            }
        } catch (err: any) {
            setError("Failed to load schools.");
        }
    };

    const fetchProf = async () => {
        try {
            const { data: response } = await getProfessions(selectedSchool);
            if (response.success && response.data.professions) setProfessions(response.data.professions);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStaff = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: response } = await getSchoolStaff(selectedSchool, 1, 10);
            if (response.success) {
                setStaffList(response.data.staff || []);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load staff");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (staff?: StaffModel) => {
        setError(null);
        if (staff) {
            setIsEditMode(true);
            setCurrentStaffId(staff.id);
            setFormData({
                name: staff.name,
                email: staff.email,
                password: '',
                role: staff.role,
                profession_id: staff.profession_id ? staff.profession_id.toString() : '',
                is_active: staff.is_active
            });
        } else {
            setIsEditMode(false);
            setCurrentStaffId(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                profession_id: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload: any = { ...formData };
            if (payload.profession_id === '') delete payload.profession_id;
            else payload.profession_id = parseInt(payload.profession_id);

            if (isEditMode && currentStaffId) {
                if (!payload.password) delete payload.password;
                await updateSchoolStaff(selectedSchool, currentStaffId, payload);
            } else {
                await createSchoolStaff(selectedSchool, payload);
            }
            setShowModal(false);
            fetchStaff();
        } catch (err: any) {
            setError(err.response?.data?.message || "Operation failed");
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: number) => {
        if (!window.confirm("Are you sure you want to toggle the status?")) return;
        setLoading(true);
        try {
            await toggleStaffStatus(selectedSchool, id);
            fetchStaff();
        } catch (err: any) {
            setError("Failed to toggle status");
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this staff member?")) return;
        setLoading(true);
        try {
            await deleteSchoolStaff(selectedSchool, id);
            fetchStaff();
        } catch (err: any) {
            setError("Failed to delete");
            setLoading(false);
        }
    };

    const openPermModal = (staff: StaffModel) => {
        setPermStaff(staff);
        setSelectedPerms(staff.permissions || []);
        setShowPermModal(true);
    };

    const handleTogglePerm = (perm: string) => {
        setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    };

    const handleSavePerms = async () => {
        if (!permStaff) return;
        setLoading(true);
        try {
            await updateStaffPermissions(selectedSchool, permStaff.id, selectedPerms);
            setShowPermModal(false);
            fetchStaff();
        } catch (e: any) {
            setError("Failed to update permissions");
            setLoading(false);
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Manage School Staff & Admins</PageTitle>
            <ToolbarWrapper />
            <Content>
                {error && (!showModal && !showPermModal) && (
                    <div className='alert alert-danger mb-5'>{error}</div>
                )}

                {isSuperAdmin && (
                    <div className='card card-flush mb-6'>
                        <div className='card-header py-5'>
                            <div className='card-title w-100 me-0'>
                                <div className='d-flex flex-column w-100'>
                                    <label className='form-label fs-5 fw-bold text-gray-800'>Context: Select Target School</label>
                                    <select
                                        className='form-select form-select-solid fw-bolder'
                                        value={selectedSchool}
                                        onChange={(e) => setSelectedSchool(e.target.value)}
                                    >
                                        <option value=''>--- Select a School ---</option>
                                        {schools.map(school => (
                                            <option key={school.id} value={school.id}>{school.name} ({school.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedSchool ? (
                    <div className='card card-flush'>
                        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
                            <div className='card-title'>
                                <h3 className='fw-bolder m-0'>Administration Staff</h3>
                            </div>
                            <div className='card-toolbar'>
                                <button className='btn btn-primary' onClick={() => handleOpenModal()}>
                                    <i className='ki-duotone ki-plus fs-2'></i> Add Staff
                                </button>
                            </div>
                        </div>
                        <div className='card-body pt-0 table-responsive'>
                            <table className='table align-middle table-row-dashed fs-6 gy-5'>
                                <thead>
                                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th className='text-end'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='fw-semibold text-gray-600'>
                                    {loading && staffList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='text-center py-10'>Loading...</td>
                                        </tr>
                                    ) : staffList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='text-center py-10'>No staff found.</td>
                                        </tr>
                                    ) : (
                                        staffList.map((staff) => (
                                            <tr key={staff.id}>
                                                <td><span className='text-gray-800 fw-bold'>{staff.name}</span></td>
                                                <td>{staff.email}</td>
                                                <td>
                                                    <span className={`badge badge-light-${staff.role === 'admin' ? 'primary' : staff.role === 'manager' ? 'info' : 'secondary'} text-uppercase`}>
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={`badge badge-light-${staff.is_active ? 'success' : 'danger'}`}>
                                                        {staff.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </td>
                                                <td className='text-end'>
                                                    <button
                                                        className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                                        title='Edit'
                                                        onClick={() => handleOpenModal(staff)}
                                                    >
                                                        <i className='ki-duotone ki-pencil fs-2'><span className='path1'></span><span className='path2'></span></i>
                                                    </button>
                                                    {staff.role !== 'admin' && (
                                                        <button
                                                            className='btn btn-icon btn-bg-light btn-active-color-info btn-sm me-1'
                                                            title='Set Permissions'
                                                            onClick={() => openPermModal(staff)}
                                                        >
                                                            <i className='ki-duotone ki-shield-tick fs-2'><span className='path1'></span><span className='path2'></span></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        className={`btn btn-icon btn-bg-light btn-sm me-1 btn-active-color-${staff.is_active ? 'warning' : 'success'}`}
                                                        title={staff.is_active ? 'Deactivate' : 'Activate'}
                                                        onClick={() => handleToggleStatus(staff.id)}
                                                    >
                                                        <i className={`ki-duotone ${staff.is_active ? 'ki-minus-square fs-2' : 'ki-check-square fs-2'}`}><span className='path1'></span><span className='path2'></span></i>
                                                    </button>
                                                    <button
                                                        className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                                        title='Delete'
                                                        onClick={() => handleDelete(staff.id)}
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
                ) : (
                    <div className='card card-flush'>
                        <div className='card-body text-center py-20'>
                            <h3 className='text-gray-600'>Please select a school to manage its staff.</h3>
                        </div>
                    </div>
                )}
            </Content>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Staff' : 'Create New Staff'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-10 px-lg-17'>
                    {error && <Alert variant='danger'>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Full Name</label>
                                <input type='text' className='form-control form-control-solid' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Email</label>
                                <input type='email' className='form-control form-control-solid' value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                        </div>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className={`${isEditMode ? '' : 'required'} fs-6 fw-semibold mb-2`}>Password {isEditMode && '(Leave blank to keep current)'}</label>
                                <input type='password' className='form-control form-control-solid' value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!isEditMode} />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Role</label>
                                <select className='form-select form-select-solid' value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
                                    <option value='admin'>Admin (Full Access)</option>
                                    <option value='manager'>Manager</option>
                                    <option value='staff'>Staff</option>
                                </select>
                            </div>
                        </div>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='fs-6 fw-semibold mb-2'>Assigned Profession</label>
                                <select className='form-select form-select-solid' value={formData.profession_id} onChange={(e) => setFormData({ ...formData, profession_id: e.target.value })}>
                                    <option value=''>--- None ---</option>
                                    {professions.map(prof => (
                                        <option key={prof.id} value={prof.id.toString()}>{prof.name} ({prof.category})</option>
                                    ))}
                                </select>
                            </div>
                            <div className='col-md-6 fv-row mt-12'>
                                <div className="form-check form-switch form-check-custom form-check-solid">
                                    <input className="form-check-input" type="checkbox" id="isActiveRole" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                    <label className="form-check-label ms-3 fw-semibold text-gray-700" htmlFor="isActiveRole">Active Staff</label>
                                </div>
                            </div>
                        </div>

                        <div className='text-end pt-5'>
                            <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                            <Button variant='primary' type='submit' disabled={loading}>{loading ? 'Saving...' : 'Save Staff'}</Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Permissions Modal */}
            <Modal show={showPermModal} onHide={() => setShowPermModal(false)} size='lg' centered>
                <Modal.Header closeButton>
                    <Modal.Title>Set Permissions: {permStaff?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-10 px-lg-17'>
                    <p className='text-muted mb-8'>Select the modules this staff member can view or manage.</p>
                    <div className='row'>
                        {MODULES.map(module => (
                            <div key={module} className='col-md-6 mb-5'>
                                <div className='card card-body p-4 bg-light border border-gray-300'>
                                    <h5 className='text-capitalize mb-3'>{module}</h5>
                                    <div className='d-flex gap-4'>
                                        <div className="form-check form-check-custom form-check-solid form-check-sm">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedPerms.includes(`view_${module}`)}
                                                onChange={() => handleTogglePerm(`view_${module}`)}
                                                id={`view_${module}`}
                                            />
                                            <label className="form-check-label" htmlFor={`view_${module}`}>View</label>
                                        </div>
                                        <div className="form-check form-check-custom form-check-solid form-check-sm">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedPerms.includes(`manage_${module}`)}
                                                onChange={() => handleTogglePerm(`manage_${module}`)}
                                                id={`manage_${module}`}
                                            />
                                            <label className="form-check-label" htmlFor={`manage_${module}`}>Manage</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='text-end pt-5 mt-5'>
                        <Button variant='light' onClick={() => setShowPermModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                        <Button variant='primary' onClick={handleSavePerms} disabled={loading}>{loading ? 'Saving...' : 'Save Permissions'}</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default SchoolAdminsPage
