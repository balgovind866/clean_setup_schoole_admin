import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { getSchools } from '../auth/core/_requests'
import { SchoolModel } from '../auth/core/_models'

const CreateAdminPage: FC = () => {
    const [schools, setSchools] = useState<SchoolModel[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [newAdmin, setNewAdmin] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        school_id: ""
    });

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            // Fetch all active schools without pagination for dropdown
            const { data: response } = await getSchools(1, 100, '', true);
            if (response.success) {
                setSchools(response.data.schools);
            }
        } catch (err) {
            console.error("Failed to fetch schools", err);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock API call since actual endpoint is pending
        setTimeout(() => {
            alert(`School Admin ${newAdmin.first_name} ${newAdmin.last_name} created successfully!`);
            setNewAdmin({
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                school_id: ""
            });
            setLoading(false);
        }, 1000);
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Create School Admin</PageTitle>
            <ToolbarWrapper />
            <Content>
                <div className='card card-flush max-w-800px mx-auto'>
                    <div className='card-header py-5'>
                        <div className='card-title'>
                            <h2>Create School Administrator</h2>
                        </div>
                    </div>
                    <div className='card-body pt-0'>
                        <form onSubmit={handleCreateAdmin}>
                            <div className='row g-9 mb-8'>
                                <div className='col-md-6 fv-row'>
                                    <label className='required fs-6 fw-semibold mb-2'>First Name</label>
                                    <input type='text' className='form-control form-control-solid' placeholder='First Name' value={newAdmin.first_name} onChange={(e) => setNewAdmin({...newAdmin, first_name: e.target.value})} required />
                                </div>
                                <div className='col-md-6 fv-row'>
                                    <label className='required fs-6 fw-semibold mb-2'>Last Name</label>
                                    <input type='text' className='form-control form-control-solid' placeholder='Last Name' value={newAdmin.last_name} onChange={(e) => setNewAdmin({...newAdmin, last_name: e.target.value})} required />
                                </div>
                            </div>
                            <div className='row g-9 mb-8'>
                                <div className='col-md-6 fv-row'>
                                    <label className='required fs-6 fw-semibold mb-2'>Email Address</label>
                                    <input type='email' className='form-control form-control-solid' placeholder='admin@school.com' value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} required />
                                </div>
                                <div className='col-md-6 fv-row'>
                                    <label className='required fs-6 fw-semibold mb-2'>Temporary Password</label>
                                    <input type='password' className='form-control form-control-solid' placeholder='Password' value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} required />
                                </div>
                            </div>
                            <div className='d-flex flex-column mb-8 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Select School</label>
                                <select className='form-select form-select-solid' value={newAdmin.school_id} onChange={(e) => setNewAdmin({...newAdmin, school_id: e.target.value})} required>
                                    <option value=''>--- Select a School ---</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name} ({school.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className='text-end mt-10'>
                                <button type='submit' className='btn btn-primary' disabled={loading}>
                                    <span className='indicator-label'>{loading ? 'Creating...' : 'Create Admin'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Content>
        </>
    )
}

export default CreateAdminPage
