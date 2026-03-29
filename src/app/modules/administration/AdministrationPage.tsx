import { FC, useState } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { createSchool, getSchools } from '../auth/core/_requests'
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
    const [newSchool, setNewSchool] = useState({
        name: "",
        code: "",
        subdomain: "",
        db_host: "localhost",
        db_port: 5432,
        db_username: "postgres",
        db_password: "",
        address: "",
        phone: "",
        email: ""
    });

    // Filtered is now handled by API
    const filtered = schools;

    const handleAddSchool = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: response } = await createSchool({
                name: newSchool.name,
                code: newSchool.code,
                subdomain: newSchool.subdomain,
                db_host: newSchool.db_host,
                db_port: Number(newSchool.db_port),
                db_username: newSchool.db_username,
                db_password: newSchool.db_password,
                address: newSchool.address,
                phone: newSchool.phone,
                email: newSchool.email
            });

            if (response.success) {
                setSchools([...schools, {
                    ...response.data.school,
                    principalName: "Pending...",
                }]);
                setShowModal(false);
                setNewSchool({
                    name: "",
                    code: "",
                    subdomain: "",
                    db_host: "localhost",
                    db_port: 5432,
                    db_username: "postgres",
                    db_password: "",
                    address: "",
                    phone: "",
                    email: ""
                });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to create school");
        } finally {
            setLoading(false);
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
                            <button className='btn btn-primary' onClick={() => setShowModal(true)}>Add School</button>
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
                                                <button className='btn btn-sm btn-light btn-active-light-primary'>Edit</button>
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
                    <Modal.Title>Add New School</Modal.Title>
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
                                    <span className='required'>School Code</span>
                                </label>
                                <input type='text' className='form-control form-control-solid' placeholder='School Code' value={newSchool.code} onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })} />
                            </div>
                        </div>

                        <div className='d-flex flex-column mb-8 fv-row'>
                            <label className='d-flex align-items-center fs-6 fw-semibold mb-2'>
                                <span className='required'>Subdomain</span>
                            </label>
                            <div className='input-group input-group-solid'>
                                <input type='text' className='form-control' placeholder='subdomain' value={newSchool.subdomain} onChange={(e) => setNewSchool({ ...newSchool, subdomain: e.target.value })} />
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
                                <label className='fs-6 fw-semibold mb-2 required'>DB Password</label>
                                <input type='password' name='db_password' className='form-control form-control-solid' placeholder='DB Password' value={newSchool.db_password} onChange={(e) => setNewSchool({ ...newSchool, db_password: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className='flex-center'>
                    <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                    <Button variant='primary' onClick={handleAddSchool} disabled={loading}>
                        {loading ? 'Creating...' : 'Add School'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default AdministrationPage
