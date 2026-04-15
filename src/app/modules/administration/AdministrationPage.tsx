import { FC, useState } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { createSchool, getSchools, updateSchool, toggleSchoolStatus, deleteSchool } from '../auth/core/_requests'
import { SchoolModel } from '../auth/core/_models'
import { useEffect } from 'react'

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Mock Data removed

const AdministrationPage: FC = () => {
    const [schools, setSchools] = useState<SchoolModel[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    useEffect(() => {
        fetchSchools();
    }, [page, pageSize, search]);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const { data: response } = await getSchools(page, pageSize, search);
            if (response.success) {
                setSchools(response.data.schools);
                setPagination(response.pagination);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to fetch schools");
        } finally {
            setLoading(false);
        }
    };

    // New School State
    const [newSchool, setNewSchool] = useState<{
        name: string;
        code: string;
        subdomain: string;
        db_host?: string;
        db_port?: number;
        db_username?: string;
        db_password?: string;
        address?: string;
        phone?: string;
        email?: string;
        logoPath?: string;
        logoFile?: File | null;
    }>({
        name: "",
        code: "",
        subdomain: "",
        db_host: "localhost",
        db_port: 5432,
        db_username: "postgres",
        db_password: "",
        address: "",
        phone: "",
        email: "",
        logoPath: "",
        logoFile: null
    });

    // Filtered is now handled by API
    const filtered = schools;

    const [editSchoolId, setEditSchoolId] = useState<number | null>(null);

    const openAddModal = () => {
        setEditSchoolId(null);
        setNewSchool({
            name: "", code: "", subdomain: "", db_host: "localhost", db_port: 5432,
            db_username: "postgres", db_password: "", address: "", phone: "", email: "", logoPath: "", logoFile: null
        });
        setError(null);
        setShowModal(true);
    };

    const handleEditClick = (school: SchoolModel) => {
        setEditSchoolId(school.id);
        setNewSchool({
            name: school.name,
            code: school.code,
            subdomain: school.subdomain,
            db_host: school.db_host || "localhost",
            db_port: school.db_port || 5432,
            db_username: school.db_username || "postgres",
            db_password: "", // Avoid loading real password
            address: school.address || "",
            phone: school.phone || "",
            email: school.email || "",
            logoPath: school.logoPath || "",
            logoFile: null
        });
        setError(null);
        setShowModal(true);
    };

    const handleSaveSchool = async () => {
        setLoading(true);
        setError(null);
        try {
            if (editSchoolId) {
                // Use FormData wrapper for updates
                const updatePayload = new FormData();
                updatePayload.append("name", newSchool.name);
                
                if (newSchool.logoFile) {
                    updatePayload.append("logo", newSchool.logoFile);
                } else if (newSchool.logoPath) {
                    updatePayload.append("logoPath", newSchool.logoPath);
                }
                
                const { data: response } = await updateSchool(editSchoolId, updatePayload as any);
                if (response.success) {
                    setSchools(schools.map(s => s.id === editSchoolId ? { ...s, ...response.data.school } : s));
                    setShowModal(false);
                }
            } else {
                const payload = {
                    name: newSchool.name,
                    code: newSchool.code,
                    subdomain: newSchool.subdomain,
                    db_host: newSchool.db_host || '',
                    db_port: Number(newSchool.db_port),
                    db_username: newSchool.db_username || '',
                    db_password: newSchool.db_password || '',
                    address: newSchool.address || '',
                    phone: newSchool.phone || '',
                    email: newSchool.email || ''
                };

                const { data: response } = await createSchool(payload);
                if (response.success) {
                    setSchools([...schools, {
                        ...response.data.school,
                        principalName: "Pending...",
                    }]);
                    setShowModal(false);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to save school");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (school: SchoolModel) => {
        if (!window.confirm(`Are you sure you want to ${school.is_active ? 'deactivate' : 'activate'} this school?`)) return;
        try {
            const { data } = await toggleSchoolStatus(school.id);
            if (data.success) {
                setSchools(schools.map(s => s.id === school.id ? { ...s, is_active: !s.is_active } : s));
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to toggle status");
        }
    };

    const handleDeleteSchool = async (id: number) => {
        if (!window.confirm('Are you sure you want to permanently delete this school?')) return;
        try {
            await deleteSchool(id, true);
            setSchools(schools.filter(s => s.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to delete school");
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Administration Dashboard</PageTitle>
            <ToolbarWrapper />
            <Content>
                {/* Stats Row */}
                <div className='row g-5 g-xl-10 mb-5 mb-xl-10'>
                    <div className='col-md-3'>
                        <div className='card h-md-100 border-0' style={{backgroundColor: '#7DA0FA', borderRadius: '15px', boxShadow: 'none'}}>
                            <div className='card-body d-flex flex-column px-8 py-7'>
                                <div className='text-white fw-medium fs-6 mb-3'>Total Schools</div>
                                <div className='fs-2hx fw-bold text-white mb-1'>{pagination.total}</div>
                                <div className='text-white opacity-75 fs-8'>Overall registered</div>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-3'>
                        <div className='card h-md-100 border-0 bg-primary' style={{borderRadius: '15px', boxShadow: 'none'}}>
                            <div className='card-body d-flex flex-column px-8 py-7'>
                                <div className='text-white fw-medium fs-6 mb-3'>Active (This Page)</div>
                                <div className='fs-2hx fw-bold text-white mb-1'>{schools.filter(s => s.is_active).length}</div>
                                <div className='text-white opacity-75 fs-8'>Currently running</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schools Table */}
                <div className='card card-flush mt-6'>
                    <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
                        <div className='card-title'>
                            <div className='d-flex align-items-center position-relative my-1'>
                                <i className='ki-duotone ki-magnifier fs-3 position-absolute ms-4'></i>
                                <input
                                    type='text'
                                    className='form-control form-control-solid w-250px ps-12'
                                    placeholder='Search School'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='card-toolbar'>
                            <button className='btn btn-primary' onClick={openAddModal}>Add School</button>
                        </div>
                    </div>
                    <div className='card-body pt-0'>
                        <table className='table align-middle table-row-dashed fs-6 gy-5'>
                            <thead>
                                <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                                    <th className='min-w-100px'>Code</th>
                                    <th className='min-w-200px'>School Name</th>
                                    <th className='min-w-150px'>Principal</th>
                                    <th className='min-w-150px'>Subdomain</th>
                                    <th className='min-w-100px'>Status</th>
                                    <th className='text-end min-w-70px'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='fw-semibold text-gray-600'>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center py-10'>
                                            <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                                            <span className='ms-2'>Loading...</span>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className='text-center py-10'>No schools found</td>
                                    </tr>
                                ) : (
                                    filtered.map((school) => (
                                        <tr key={school.id}>
                                            <td>
                                                <span className='text-gray-800 text-hover-primary fw-bold'>{school.code}</span>
                                            </td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='ms-5'>
                                                        <span className='text-gray-800 text-hover-primary fs-5 fw-bold'>{school.name}</span>
                                                        <div className='text-muted fs-7'>{school.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{school.principalName || 'N/A'}</td>
                                            <td>
                                                <span className='badge badge-light-primary'>{school.subdomain}.eduadmin.com</span>
                                            </td>
                                            <td>
                                                <div className={`badge badge-light-${school.is_active ? 'success' : 'danger'}`}>
                                                    {school.is_active ? 'Active' : 'Inactive'}
                                                </div>
                                            </td>
                                            <td className='text-end'>
                                                <div className='d-flex justify-content-end flex-shrink-0'>
                                                    <button onClick={() => handleToggleStatus(school)} className={`btn btn-icon btn-bg-light btn-active-color-${school.is_active ? 'warning' : 'success'} btn-sm me-1`} title={school.is_active ? 'Deactivate' : 'Activate'}>
                                                        <i className={`ki-duotone ${school.is_active ? 'ki-cross-circle' : 'ki-check-circle'} fs-2`}>
                                                            <span className='path1'></span><span className='path2'></span>
                                                        </i>
                                                    </button>
                                                    <button onClick={() => handleEditClick(school)} className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1' title='Edit'>
                                                        <i className='ki-duotone ki-pencil fs-2'>
                                                            <span className='path1'></span><span className='path2'></span>
                                                        </i>
                                                    </button>
                                                    <button onClick={() => handleDeleteSchool(school.id)} className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm' title='Delete'>
                                                        <i className='ki-duotone ki-trash fs-2'>
                                                            <span className='path1'></span><span className='path2'></span><span className='path3'></span><span className='path4'></span><span className='path5'></span>
                                                        </i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className='row'>
                            <div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'>
                                <div className='dataTables_length'>
                                    <label>
                                        <select
                                            className='form-select form-select-sm form-select-solid'
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
                                <div className='dataTables_paginate paging_simple_numbers'>
                                    <ul className='pagination'>
                                        <li className={`paginate_button page-item previous ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                            <button className='page-link' onClick={() => setPage(page - 1)}>
                                                <i className='previous'></i>
                                            </button>
                                        </li>
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <li key={i} className={`paginate_button page-item ${page === i + 1 ? 'active' : ''}`}>
                                                <button className='page-link' onClick={() => setPage(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`paginate_button page-item next ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                                            <button className='page-link' onClick={() => setPage(page + 1)}>
                                                <i className='next'></i>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Content>

            {/* Add School Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editSchoolId ? 'Edit School' : 'Add New School'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-10 px-lg-17'>
                    {error && <Alert variant='danger'>{error}</Alert>}
                    <div className='scroll-y me-n7 pe-7'>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='d-flex align-items-center fs-6 fw-semibold mb-2'>
                                    <span className='required'>School Name</span>
                                </label>
                                <input type='text' className='form-control form-control-solid' placeholder='School Name' value={newSchool.name} onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })} />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='d-flex align-items-center fs-6 fw-semibold mb-2'>
                                    <span className={!editSchoolId ? 'required' : ''}>School Code</span>
                                </label>
                                <input type='text' className='form-control form-control-solid' placeholder='School Code' value={newSchool.code} onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })} disabled={!!editSchoolId} />
                            </div>
                        </div>

                        {editSchoolId && (
                            <div className='d-flex flex-column mb-8 fv-row'>
                                <label className='d-flex align-items-center fs-6 fw-semibold mb-2'>
                                    <span>School Logo</span>
                                </label>
                                <div>
                                    {/* Image input */}
                                    <div
                                        className='image-input image-input-outline image-input-empty'
                                        style={{ backgroundImage: `url('/media/svg/avatars/blank.svg')` }}
                                    >
                                        <div 
                                            className='image-input-wrapper w-125px h-125px' 
                                            style={{ backgroundImage: `url(${newSchool.logoPath || '/media/svg/avatars/blank.svg'})` }}
                                        ></div>
                                        <label
                                            className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                            data-kt-image-input-action='change'
                                            data-bs-toggle='tooltip'
                                            title='Change logo'
                                        >
                                            <i className='bi bi-pencil-fill fs-7'></i>
                                            <input 
                                                type='file' 
                                                name='logo' 
                                                accept='.png, .jpg, .jpeg' 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const objectUrl = URL.createObjectURL(file);
                                                        setNewSchool(prev => ({ ...prev, logoFile: file, logoPath: objectUrl }));
                                                    }
                                                }} 
                                            />
                                            <input type='hidden' name='logo_remove' />
                                        </label>
                                    </div>
                                    <div className='form-text'>Allowed file types: png, jpg, jpeg.</div>
                                </div>
                            </div>
                        )}

                        <div className='d-flex flex-column mb-8 fv-row'>
                            <label className='d-flex align-items-center fs-6 fw-semibold mb-2'>
                                <span className={!editSchoolId ? 'required' : ''}>Subdomain</span>
                            </label>
                            <div className='input-group input-group-solid'>
                                <input type='text' className='form-control' placeholder='subdomain' value={newSchool.subdomain} onChange={(e) => setNewSchool({ ...newSchool, subdomain: e.target.value })} disabled={!!editSchoolId} />
                                <span className='input-group-text'>.eduadmin.com</span>
                            </div>
                        </div>

                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='fs-6 fw-semibold mb-2 required'>Email</label>
                                <input type='email' className='form-control form-control-solid' placeholder='contact@school.com' value={newSchool.email} onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })} />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='fs-6 fw-semibold mb-2 required'>Phone</label>
                                <input type='text' className='form-control form-control-solid' placeholder='Phone Number' value={newSchool.phone} onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })} />
                            </div>
                        </div>

                        <div className='d-flex flex-column mb-8 fv-row'>
                            <label className='fs-6 fw-semibold mb-2 required'>Address</label>
                            <textarea className='form-control form-control-solid' rows={2} placeholder='School Address' value={newSchool.address} onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })} />
                        </div>

                        {!editSchoolId && (
                            <>
                                <div className='separator separator-dashed my-10'></div>
                                <h4 className='fw-bold mb-5'>Database Configuration</h4>

                                <div className='row g-9 mb-8'>
                                    <div className='col-md-8 fv-row'>
                                        <label className='fs-6 fw-semibold mb-2 required'>DB Host</label>
                                        <input type='text' className='form-control form-control-solid' placeholder='localhost' value={newSchool.db_host} onChange={(e) => setNewSchool({ ...newSchool, db_host: e.target.value })} />
                                    </div>
                                    <div className='col-md-4 fv-row'>
                                        <label className='fs-6 fw-semibold mb-2 required'>DB Port</label>
                                        <input type='number' className='form-control form-control-solid' placeholder='5432' value={newSchool.db_port} onChange={(e) => setNewSchool({ ...newSchool, db_port: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className='row g-9 mb-8'>
                                    <div className='col-md-6 fv-row'>
                                        <label className='fs-6 fw-semibold mb-2 required'>DB Username</label>
                                        <input type='text' className='form-control form-control-solid' placeholder='postgres' value={newSchool.db_username} onChange={(e) => setNewSchool({ ...newSchool, db_username: e.target.value })} />
                                    </div>
                                    <div className='col-md-6 fv-row'>
                                        <label className='fs-6 fw-semibold mb-2'>DB Password</label>
                                        <input type='password' name='db_password' className='form-control form-control-solid' placeholder='DB Password' value={newSchool.db_password} onChange={(e) => setNewSchool({ ...newSchool, db_password: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className='flex-center'>
                    <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                    <Button variant='primary' onClick={handleSaveSchool} disabled={loading}>
                        {loading ? 'Saving...' : editSchoolId ? 'Save Changes' : 'Add School'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default AdministrationPage
