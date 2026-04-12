import React, { useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { useAuth } from '../auth'
import { getAppSettings, updateAppSettings } from './core/_requests'
import { UpdateAppSettingsPayload } from './core/_models'
import toast, { Toaster } from 'react-hot-toast'
import clsx from 'clsx'
import { KTIcon } from '../../../_metronic/helpers'

// ─── Predefined Color Themes ────────────────────────────────────────────────
const COLOR_THEMES = [
    { name: 'Nature Green', primary: '#4c662b', secondary: '#586249' },
    { name: 'Ocean Teal', primary: '#006876', secondary: '#4a6268' },
    { name: 'Royal Blue', primary: '#1a56db', secondary: '#505863ff' },
    { name: 'Sunset Orange', primary: '#c4441c', secondary: '#8b5c4a' },
    { name: 'Deep Purple', primary: '#6b21a8', secondary: '#6d5a7b' },
]

const AppManagementPage: React.FC = () => {
    const { currentUser } = useAuth()
    const tenantId = currentUser?.schoolId || '30'

    const [activeTab, setActiveTab] = useState<'branding' | 'modules'>('branding')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState<UpdateAppSettingsPayload>({
        primary_color: '#4c662b',
        secondary_color: '#586249',
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
                    primary_color: fetchedData.primary_color || '#4c662b',
                    secondary_color: fetchedData.secondary_color || '#586249',
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

    const handleSelectTheme = (primary: string, secondary: string) => {
        setFormData(prev => ({
            ...prev,
            primary_color: primary,
            secondary_color: secondary,
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

    const isThemeSelected = (primary: string, secondary: string) =>
        formData.primary_color?.toLowerCase() === primary.toLowerCase() &&
        formData.secondary_color?.toLowerCase() === secondary.toLowerCase()

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
                                <div className='col-xl-8'>
                                    <h4 className='fw-semibold text-gray-800 mb-2'>Choose App Theme</h4>
                                    <p className='text-muted fs-7 mb-6'>Select a color theme for your app. The selected colors will be used for buttons, headers, and accents.</p>

                                    <div className='row g-4 mb-6'>
                                        {COLOR_THEMES.map((theme) => {
                                            const selected = isThemeSelected(theme.primary, theme.secondary)
                                            return (
                                                <div key={theme.name} className='col-lg-4 col-md-6'>
                                                    <div
                                                        className='cursor-pointer rounded-3 p-4 position-relative'
                                                        onClick={() => handleSelectTheme(theme.primary, theme.secondary)}
                                                        style={{
                                                            border: selected ? `2.5px solid ${theme.primary}` : '2px solid #e4e6ef',
                                                            background: selected ? `${theme.primary}08` : '#fff',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: selected ? `0 4px 16px ${theme.primary}22` : 'none',
                                                        }}
                                                    >
                                                        {/* Selected checkmark */}
                                                        {selected && (
                                                            <div
                                                                className='position-absolute d-flex align-items-center justify-content-center'
                                                                style={{
                                                                    top: -8, right: -8,
                                                                    width: 26, height: 26,
                                                                    borderRadius: '50%',
                                                                    background: theme.primary,
                                                                    color: '#fff',
                                                                    fontSize: 14,
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                                }}
                                                            >
                                                                <i className='bi bi-check-lg' />
                                                            </div>
                                                        )}

                                                        {/* Color swatches */}
                                                        <div className='d-flex align-items-center gap-3 mb-3'>
                                                            <div
                                                                style={{
                                                                    width: 40, height: 40,
                                                                    borderRadius: '50%',
                                                                    background: theme.primary,
                                                                    border: '3px solid #fff',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                                                }}
                                                                title={`Primary: ${theme.primary}`}
                                                            />
                                                            <div
                                                                style={{
                                                                    width: 32, height: 32,
                                                                    borderRadius: '50%',
                                                                    background: theme.secondary,
                                                                    border: '3px solid #fff',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                                                    marginLeft: -12,
                                                                }}
                                                                title={`Secondary: ${theme.secondary}`}
                                                            />
                                                        </div>

                                                        {/* Theme name */}
                                                        <div className='fw-bold text-gray-800 fs-6 mb-1'>{theme.name}</div>
                                                        <div className='d-flex align-items-center gap-2'>
                                                            <span className='fs-8 text-muted fw-semibold' style={{ fontFamily: 'monospace' }}>{theme.primary}</span>
                                                            <span className='text-muted fs-8'>·</span>
                                                            <span className='fs-8 text-muted fw-semibold' style={{ fontFamily: 'monospace' }}>{theme.secondary}</span>
                                                        </div>

                                                        {/* Preview bar */}
                                                        <div className='mt-3 d-flex gap-1 rounded overflow-hidden' style={{ height: 6 }}>
                                                            <div style={{ flex: 3, background: theme.primary }} />
                                                            <div style={{ flex: 2, background: theme.secondary }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Currently selected display */}
                                    <div className='border border-dashed border-gray-300 rounded-3 p-4 d-flex align-items-center gap-4'>
                                        <span className='fw-semibold text-gray-600 fs-7'>Currently Selected:</span>
                                        <div className='d-flex align-items-center gap-2'>
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: formData.primary_color, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                            <span className='fw-bold text-gray-800 fs-7'>Primary</span>
                                            <span className='text-muted fs-8' style={{ fontFamily: 'monospace' }}>{formData.primary_color}</span>
                                        </div>
                                        <div className='d-flex align-items-center gap-2'>
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: formData.secondary_color, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                            <span className='fw-bold text-gray-800 fs-7'>Secondary</span>
                                            <span className='text-muted fs-8' style={{ fontFamily: 'monospace' }}>{formData.secondary_color}</span>
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
