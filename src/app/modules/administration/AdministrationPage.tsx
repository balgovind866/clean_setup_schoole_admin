import { FC, useState } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_SCHOOLS = [
    { id: 1, code: "DPS001", name: "Delhi Public School", subdomain: "dps001", principalName: "Dr. Ramesh Kumar", phone: "+91-9876543210", email: "info@dps001.edu.in", is_active: true, setup_completed: true, createdAt: "2024-01-15", address: "Sector 45, Gurugram" },
    { id: 2, code: "KV002", name: "Kendriya Vidyalaya No.1", subdomain: "kv002", principalName: "Mrs. Sunita Sharma", phone: "+91-9876543220", email: "info@kv002.edu.in", is_active: true, setup_completed: true, createdAt: "2024-02-10", address: "Dwarka, New Delhi" },
    { id: 3, code: "DAV003", name: "DAV Public School", subdomain: "dav003", principalName: "Mr. Anil Gupta", phone: "+91-9876543230", email: "info@dav003.edu.in", is_active: false, setup_completed: true, createdAt: "2024-03-05", address: "Rohini, Delhi" },
    { id: 4, code: "RPS004", name: "Ryan International School", subdomain: "rps004", principalName: "Ms. Priya Singh", phone: "+91-9876543240", email: "info@rps004.edu.in", is_active: true, setup_completed: false, createdAt: "2024-04-20", address: "Noida Sector 62" },
];

const AdministrationPage: FC = () => {
    const [schools, setSchools] = useState(MOCK_SCHOOLS);
    const [search, setSearch] = useState("");

    const filtered = schools.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <PageTitle breadcrumbs={[]}>Administration Dashboard</PageTitle>
            <ToolbarWrapper />
            <Content>
                {/* Stats Row */}
                <div className='row g-5 g-xl-10 mb-5 mb-xl-10'>
                    <div className='col-md-3'>
                        <div className='card card-flush h-md-100 bg-light-warning'>
                            <div className='card-header pt-5'>
                                <div className='card-title d-flex flex-column'>
                                    <span className='fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2'>{schools.length}</span>
                                    <span className='text-gray-500 pt-1 fw-semibold fs-6'>Total Schools</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-3'>
                        <div className='card card-flush h-md-100 bg-light-success'>
                            <div className='card-header pt-5'>
                                <div className='card-title d-flex flex-column'>
                                    <span className='fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2'>{schools.filter(s => s.is_active).length}</span>
                                    <span className='text-gray-500 pt-1 fw-semibold fs-6'>Active Schools</span>
                                </div>
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
                            <button className='btn btn-primary'>Add School</button>
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
                                {filtered.map((school) => (
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
                                        <td>{school.principalName}</td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Content>
        </>
    )
}

export default AdministrationPage
