import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'
import { Modal, Button, Alert } from 'react-bootstrap'
import { 
    getSchools, 
    getProfessions, 
    createProfession, 
    updateProfession, 
    deleteProfession, 
    toggleProfessionStatus 
} from '../auth/core/_requests'
import { SchoolModel, ProfessionModel } from '../auth/core/_models'

const ProfessionsPage: FC = () => {
    // School Selection State
    const [schools, setSchools] = useState<SchoolModel[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    
    // Profession Data State
    const [professions, setProfessions] = useState<ProfessionModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentProfessionId, setCurrentProfessionId] = useState<number | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'teaching',
        is_active: true
    });

    useEffect(() => {
        fetchSchools();
    }, []);

    useEffect(() => {
        if (selectedSchool) {
            fetchProfessions();
        } else {
            setProfessions([]);
        }
    }, [selectedSchool]);

    const fetchSchools = async () => {
        try {
            const { data: response } = await getSchools(1, 100, '', true);
            if (response.success) {
                setSchools(response.data.schools);
                if (response.data.schools.length > 0) {
                    setSelectedSchool(response.data.schools[0].id.toString());
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch schools", err);
            setError("Failed to load schools.");
        }
    };

    const fetchProfessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: response } = await getProfessions(selectedSchool);
            if (response.success) {
                // Ensure it handles paginated or array response
                setProfessions(response.data.professions || []);
            }
        } catch (err: any) {
             console.error(err);
             setError(err.response?.data?.message || err.message || "Failed to load professions");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (profession?: ProfessionModel) => {
        setError(null);
        if (profession) {
            setIsEditMode(true);
            setCurrentProfessionId(profession.id);
            setFormData({
                name: profession.name,
                description: profession.description || '',
                category: profession.category,
                is_active: profession.is_active
            });
        } else {
            setIsEditMode(false);
            setCurrentProfessionId(null);
            setFormData({
                name: '',
                description: '',
                category: 'teaching',
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
            if (isEditMode && currentProfessionId) {
                await updateProfession(selectedSchool, currentProfessionId, formData);
            } else {
                await createProfession(selectedSchool, formData);
            }
            setShowModal(false);
            fetchProfessions();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (professionId: number) => {
        if (!window.confirm("Are you sure you want to toggle the status of this profession?")) return;
        setLoading(true);
        try {
            await toggleProfessionStatus(selectedSchool, professionId);
            fetchProfessions();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to toggle status");
            setLoading(false);
        }
    };

    const handleDelete = async (professionId: number) => {
        if (!window.confirm("Are you sure you want to completely delete this profession? This action cannot be undone.")) return;
        setLoading(true);
        try {
            await deleteProfession(selectedSchool, professionId);
            fetchProfessions();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to delete profession");
            setLoading(false);
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Manage Professions</PageTitle>
            <ToolbarWrapper />
            <Content>
                {error && !showModal && (
                    <div className='alert alert-danger mb-5'>
                        <div className='d-flex flex-column'>
                            <h4 className='mb-1 text-danger'>Error</h4>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Top Section: School Selector */}
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

                {/* Main Content Area */}
                {selectedSchool ? (
                    <div className='card card-flush'>
                        <div className='card-header align-items-center py-5 gap-2 gap-md-5'>
                            <div className='card-title'>
                                <h3 className='fw-bolder m-0'>Professions List</h3>
                            </div>
                            <div className='card-toolbar'>
                                <button className='btn btn-primary' onClick={() => handleOpenModal()}>
                                    <i className='ki-duotone ki-plus fs-2'></i> Add Profession
                                </button>
                            </div>
                        </div>
                        <div className='card-body pt-0'>
                            <table className='table align-middle table-row-dashed fs-6 gy-5'>
                                <thead>
                                    <tr className='text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0'>
                                        <th className='min-w-150px'>Profession Name</th>
                                        <th className='min-w-150px'>Category</th>
                                        <th className='min-w-200px'>Description</th>
                                        <th className='min-w-100px'>Status</th>
                                        <th className='text-end min-w-150px'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='fw-semibold text-gray-600'>
                                    {loading && professions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='text-center py-10'>
                                                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                                                <span className='ms-2'>Loading...</span>
                                            </td>
                                        </tr>
                                    ) : professions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='text-center py-10'>No professions found for this school.</td>
                                        </tr>
                                    ) : (
                                        professions.map((prof) => (
                                            <tr key={prof.id}>
                                                <td>
                                                    <span className='text-gray-800 fw-bold'>{prof.name}</span>
                                                </td>
                                                <td>
                                                    <span className='badge badge-light-info text-capitalize'>{prof.category}</span>
                                                </td>
                                                <td>{prof.description || '-'}</td>
                                                <td>
                                                    <div className={`badge badge-light-${prof.is_active ? 'success' : 'danger'}`}>
                                                        {prof.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </td>
                                                <td className='text-end'>
                                                    <button 
                                                        className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                                        title='Edit'
                                                        onClick={() => handleOpenModal(prof)}
                                                    >
                                                        <i className='ki-duotone ki-pencil fs-2'><span className='path1'></span><span className='path2'></span></i>
                                                    </button>
                                                    <button 
                                                        className={`btn btn-icon btn-bg-light btn-sm me-1 btn-active-color-${prof.is_active ? 'warning' : 'success'}`}
                                                        title={prof.is_active ? 'Deactivate' : 'Activate'}
                                                        onClick={() => handleToggleStatus(prof.id)}
                                                    >
                                                        <i className={`ki-duotone ${prof.is_active ? 'ki-minus-square fs-2' : 'ki-check-square fs-2'}`}><span className='path1'></span><span className='path2'></span></i>
                                                    </button>
                                                    <button 
                                                        className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                                        title='Delete'
                                                        onClick={() => handleDelete(prof.id)}
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
                            <h3 className='text-gray-600'>Please select a school to manage its professions.</h3>
                        </div>
                    </div>
                )}
            </Content>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Profession' : 'Create New Profession'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-10 px-lg-17'>
                    {error && <Alert variant='danger'>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <div className='row g-9 mb-8'>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Profession Name</label>
                                <input 
                                    type='text' 
                                    className='form-control form-control-solid' 
                                    placeholder='e.g., Math Teacher' 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className='col-md-6 fv-row'>
                                <label className='required fs-6 fw-semibold mb-2'>Category</label>
                                <select 
                                    className='form-select form-select-solid' 
                                    value={formData.category} 
                                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                                    required
                                >
                                    <option value='teaching'>Teaching</option>
                                    <option value='administrative'>Administrative</option>
                                    <option value='support'>Support</option>
                                    <option value='technical'>Technical</option>
                                    <option value='other'>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className='d-flex flex-column mb-8 fv-row'>
                            <label className='fs-6 fw-semibold mb-2'>Description</label>
                            <textarea 
                                className='form-control form-control-solid' 
                                rows={3} 
                                placeholder='Brief description of responsibilities'
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            />
                        </div>

                        <div className='d-flex align-items-center mb-8'>
                            <div className="form-check form-switch form-check-custom form-check-solid">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="isActiveCheckbox" 
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                />
                                <label className="form-check-label ms-3 fw-semibold text-gray-700" htmlFor="isActiveCheckbox">
                                    Active Status
                                </label>
                            </div>
                        </div>

                        <div className='text-end pt-5'>
                            <Button variant='light' onClick={() => setShowModal(false)} className='me-3' disabled={loading}>Cancel</Button>
                            <Button variant='primary' type='submit' disabled={loading}>
                                {loading ? 'Saving...' : 'Save Profession'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ProfessionsPage
