import React, { useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { useAuth } from '../auth'
import { getAppSettings, updateAppSettings } from './core/_requests'
import { UpdateAppSettingsPayload } from './core/_models'
import toast, { Toaster } from 'react-hot-toast'
import clsx from 'clsx'
import { KTIcon } from '../../../_metronic/helpers'

const AppManagementPage: React.FC = () => {
    const { currentUser } = useAuth()
    const tenantId = currentUser?.schoolId || '30'

    const [activeTab, setActiveTab] = useState<'branding' | 'modules'>('branding')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState<UpdateAppSettingsPayload>({
        primary_color: '#3498db',
        secondary_color: '#2980b9',
        enabled_modules: {
            exams: true,
            fees: true,
            notices: true,
            assignments: true,
            timetable: true,
            attendance: true,
        }
    })

    const fetchSettings = async () => {
        try {
            setIsLoading(true)
            const response = await getAppSettings(tenantId)
            if (response.data?.success && response.data?.data) {
                const fetchedData = response.data.data
                setFormData({
                    primary_color: fetchedData.primary_color || '#3498db',
                    secondary_color: fetchedData.secondary_color || '#2980b9',
                    enabled_modules: {
                        exams: fetchedData.enabled_modules?.exams ?? true,
                        fees: fetchedData.enabled_modules?.fees ?? true,
                        notices: fetchedData.enabled_modules?.notices ?? true,
                        assignments: fetchedData.enabled_modules?.assignments ?? true,
                        timetable: fetchedData.enabled_modules?.timetable ?? true,
                        attendance: fetchedData.enabled_modules?.attendance ?? true,
                    }
                })
            }
        } catch (error) {
            console.error('Error fetching app settings:', error)
            toast.error('Failed to load application settings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (tenantId) {
            fetchSettings()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId])

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleModuleToggle = (moduleName: keyof UpdateAppSettingsPayload['enabled_modules']) => {
        setFormData(prev => ({
            ...prev,
            enabled_modules: {
                ...prev.enabled_modules,
                [moduleName]: !prev.enabled_modules[moduleName]
            }
        }))
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const response = await updateAppSettings(tenantId, formData)
            if (response.data?.success) {
                toast.success('App settings updated successfully')
            } else {
                toast.error(response.data?.message || 'Failed to update settings')
            }
        } catch (error) {
            console.error('Error updating app settings:', error)
            toast.error('An error occurred while updating settings')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>App Management</PageTitle>
            <Toaster position="top-right" />

            <div className='card'>
                <div className='card-header border-0 pt-6'>
                    <div className='card-title m-0'>
                        <h3 className='fw-bold m-0'>App Management Settings</h3>
                    </div>
                </div>

                <div className='card-body pt-0'>
                    <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x mb-5 fs-6'>
                        <li className='nav-item'>
                            <a
                                className={`nav-link text-active-primary cursor-pointer fw-semibold ${activeTab === 'branding' ? 'active' : ''}`}
                                onClick={() => setActiveTab('branding')}
                            >
                                <KTIcon iconName='color-swatch' className='fs-2 me-2' />
                                Branding & Theme
                            </a>
                        </li>
                        <li className='nav-item'>
                            <a
                                className={`nav-link text-active-primary cursor-pointer fw-semibold ${activeTab === 'modules' ? 'active' : ''}`}
                                onClick={() => setActiveTab('modules')}
                            >
                                <KTIcon iconName='element-11' className='fs-2 me-2' />
                                Dashboard Modules & Quick Actions
                            </a>
                        </li>
                    </ul>

                    <div className='tab-content' id='appManagementTabContent'>
                        {/* Tab 1: Branding & Theme */}
                        <div className={clsx('tab-pane fade', { 'show active': activeTab === 'branding' })}>
                            <div className='row mb-8'>
                                <div className='col-xl-6'>
                                    <h4 className='fw-semibold text-gray-800 mb-5'>Colors</h4>

                                    <div className='row mb-6'>
                                        <label className='col-lg-4 col-form-label required fw-bold fs-6'>Primary Color</label>
                                        <div className='col-lg-8'>
                                            <div className='d-flex align-items-center'>
                                                <input
                                                    type='color'
                                                    name='primary_color'
                                                    className='form-control form-control-color me-3'
                                                    value={formData.primary_color}
                                                    onChange={handleColorChange}
                                                    title='Choose your primary color'
                                                />
                                                <input
                                                    type='text'
                                                    className='form-control form-control-solid flex-grow-1'
                                                    value={formData.primary_color}
                                                    readOnly
                                                />
                                            </div>
                                            <div className='form-text'>Used for primary buttons, active states, and main accents.</div>
                                        </div>
                                    </div>

                                    <div className='row mb-6'>
                                        <label className='col-lg-4 col-form-label required fw-bold fs-6'>Secondary Color</label>
                                        <div className='col-lg-8'>
                                            <div className='d-flex align-items-center'>
                                                <input
                                                    type='color'
                                                    name='secondary_color'
                                                    className='form-control form-control-color me-3'
                                                    value={formData.secondary_color}
                                                    onChange={handleColorChange}
                                                    title='Choose your secondary color'
                                                />
                                                <input
                                                    type='text'
                                                    className='form-control form-control-solid flex-grow-1'
                                                    value={formData.secondary_color}
                                                    readOnly
                                                />
                                            </div>
                                            <div className='form-text'>Used for secondary elements, badges, and headers.</div>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-xl-6'>
                                    <h4 className='fw-semibold text-gray-800 mb-5'>Logos (Visual Only)</h4>
                                    <div className='row mb-6'>
                                        <label className='col-lg-4 col-form-label fw-bold fs-6'>App Logo</label>
                                        <div className='col-lg-8'>
                                            <div
                                                className='image-input image-input-outline image-input-empty'
                                                style={{ backgroundImage: `url('/media/svg/avatars/blank.svg')` }}
                                            >
                                                <div className='image-input-wrapper w-125px h-125px'></div>
                                                <label
                                                    className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                                    data-kt-image-input-action='change'
                                                    data-bs-toggle='tooltip'
                                                    title='Change avatar'
                                                >
                                                    <i className='bi bi-pencil-fill fs-7'></i>
                                                    <input type='file' name='avatar' accept='.png, .jpg, .jpeg' />
                                                    <input type='hidden' name='avatar_remove' />
                                                </label>
                                            </div>
                                            <div className='form-text'>Pending backend multipart support. (Visual demonstration only)</div>
                                        </div>
                                    </div>
                                    <div className='row mb-6'>
                                        <label className='col-lg-4 col-form-label fw-bold fs-6'>Favicon</label>
                                        <div className='col-lg-8'>
                                            <div
                                                className='image-input image-input-outline image-input-empty'
                                                style={{ backgroundImage: `url('/media/svg/avatars/blank.svg')` }}
                                            >
                                                <div className='image-input-wrapper w-65px h-65px'></div>
                                                <label
                                                    className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                                    data-kt-image-input-action='change'
                                                    data-bs-toggle='tooltip'
                                                    title='Change favicon'
                                                >
                                                    <i className='bi bi-pencil-fill fs-7'></i>
                                                    <input type='file' name='favicon' accept='.ico, .png' />
                                                    <input type='hidden' name='favicon_remove' />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab 2: Dashboard Modules & Quick Actions */}
                        <div className={clsx('tab-pane fade', { 'show active': activeTab === 'modules' })}>
                            <h4 className='fw-semibold text-gray-800 mb-5'>Available Modules</h4>
                            <div className='text-muted mb-7'>Turn these modules on or off to instantly show or hide them from the app dashboard.</div>

                            <div className='row g-5 mb-8'>
                                {Object.keys(formData.enabled_modules).map((moduleKey) => {
                                    const key = moduleKey as keyof UpdateAppSettingsPayload['enabled_modules'];
                                    return (
                                        <div key={key} className='col-md-6 col-lg-4'>
                                            <div className='d-flex flex-stack border border-dashed border-gray-300 rounded p-4'>
                                                <div className='d-flex align-items-center'>
                                                    <div className='symbol symbol-40px me-4'>
                                                        <span className='symbol-label bg-light-primary'>
                                                            <KTIcon iconName='abstract-26' className='fs-2 text-primary' />
                                                        </span>
                                                    </div>
                                                    <div className='d-flex flex-column'>
                                                        <span className='fs-5 fw-bold text-gray-900 text-capitalize'>
                                                            {key}
                                                        </span>
                                                        <span className='fs-7 text-muted'>
                                                            {formData.enabled_modules[key] ? 'Currently Active' : 'Currently Hidden'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className='form-check form-switch form-switch-sm form-check-custom form-check-solid'>
                                                    <input
                                                        className='form-check-input cursor-pointer'
                                                        type='checkbox'
                                                        checked={formData.enabled_modules[key]}
                                                        onChange={() => handleModuleToggle(key)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='card-footer d-flex justify-content-end py-6 px-9'>
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                    >
                        {!isSaving && <span className='indicator-label'>Save Changes</span>}
                        {isSaving && (
                            <span className='indicator-progress' style={{ display: 'block' }}>
                                Please wait...{' '}
                                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}

export const AppManagementWrapper: React.FC = () => {
    return (
        <>
            <AppManagementPage />
        </>
    )
}
