import { useState, useCallback } from 'react'
import * as Yup from 'yup'
import clsx from 'clsx'
import { useFormik } from 'formik'
import AsyncSelect from 'react-select/async'
import { login, getSchools } from '../core/_requests'
import { AuthModel } from '../core/_models'
import { useAuth } from '../core/Auth'

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Wrong email format')
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
  schoolId: Yup.string().when('loginType', {
    is: 'admin',
    then: (schema) => schema.required('School is required'),
  }),
})

const initialValues = {
  email: 'admin@myapp.com',
  password: 'Admin@123456',
  schoolId: '',
  loginType: 'admin' as 'super_admin' | 'admin',
}

export function Login() {
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<'super_admin' | 'admin'>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const { saveAuth, setCurrentUser } = useAuth()

  const loadSchoolOptions = useCallback(async (inputValue: string) => {
    try {
      const response = await getSchools(1, 10, inputValue, true)
      if (response?.data?.data?.schools) {
        return response.data.data.schools.map((school: any) => ({
          value: school.id,
          label: `${school.name} (${school.code})`,
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching schools', error)
      return []
    }
  }, [])

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      try {
        const { data: response } = await login(values.email, values.password, loginType, values.schoolId)
        if (response.success) {
          const user = response.data.user || response.data.admin
          const auth: AuthModel = { api_token: response.data.token, user }
          saveAuth(auth)
          if (user) setCurrentUser(user)
        } else {
          saveAuth(undefined)
          setStatus(response.message || 'Invalid credentials. Please try again.')
          setSubmitting(false)
          setLoading(false)
        }
      } catch (error) {
        console.error(error)
        saveAuth(undefined)
        setStatus('Something went wrong. Please try again.')
        setSubmitting(false)
        setLoading(false)
      }
    },
  })

  // react-select styles that mirror Metronic's form-control look using CSS variables
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: 'var(--kt-input-bg)',
      borderColor:
        formik.touched.schoolId && formik.errors.schoolId
          ? 'var(--kt-danger)'
          : state.isFocused
            ? 'var(--kt-primary)'
            : 'var(--kt-input-border-color)',
      borderRadius: '0.475rem',
      padding: '0.1rem 0.25rem',
      minHeight: '43.59px',
      boxShadow: state.isFocused
        ? '0 0 0 0.25rem color-mix(in srgb, var(--kt-primary) 25%, transparent)'
        : 'none',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      '&:hover': { borderColor: 'var(--kt-primary)' },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--kt-dropdown-bg, #fff)',
      border: '1px solid var(--kt-dropdown-border-color, #eff2f5)',
      borderRadius: '0.475rem',
      boxShadow: 'var(--kt-dropdown-box-shadow, 0px 0px 50px 0px rgba(82,63,105,0.15))',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({ ...base, padding: '0.5rem 0' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--kt-primary)'
        : state.isFocused
          ? 'var(--kt-component-hover-bg, #f9f9f9)'
          : 'transparent',
      color: state.isSelected ? '#fff' : 'var(--kt-input-color)',
      padding: '0.65rem 1rem',
      fontSize: '1rem',
      cursor: 'pointer',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--kt-input-color)',
      fontSize: '1rem',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--kt-input-placeholder-color)',
      fontSize: '1rem',
    }),
    input: (base: any) => ({ ...base, color: 'var(--kt-input-color)' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'var(--kt-gray-500)',
      '&:hover': { color: 'var(--kt-gray-700)' },
    }),
    loadingMessage: (base: any) => ({
      ...base,
      color: 'var(--kt-text-muted)',
      fontSize: '0.9rem',
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: 'var(--kt-text-muted)',
      fontSize: '0.9rem',
    }),
  }

  return (
    <form
      className='form w-100'
      onSubmit={formik.handleSubmit}
      noValidate
      id='kt_login_signin_form'
    >
      {/* ── Heading ── */}
      <div className='text-center mb-11'>
        {/* App icon */}
        <div className='d-flex justify-content-center mb-5'>
          <span
            className='d-flex align-items-center justify-content-center w-60px h-60px rounded-3 bg-primary bg-opacity-10'
            style={{ width: 60, height: 60 }}
          >
            <i className='ki-duotone ki-element-11 fs-2tx text-primary'>
              <span className='path1'></span>
              <span className='path2'></span>
              <span className='path3'></span>
              <span className='path4'></span>
            </i>
          </span>
        </div>
        <h1 className='text-gray-900 fw-bolder mb-2' style={{ fontSize: '1.9rem', letterSpacing: '-0.5px' }}>
          Welcome back
        </h1>
        <div className='text-gray-500 fw-semibold fs-6'>EduAdmin Management System</div>
      </div>

      {/* ── Role Toggle ── */}
      <div className='d-flex bg-light rounded-3 p-1 mb-9' style={{ gap: '4px' }}>
        {/* Super Admin Tab */}
        <button
          type='button'
          onClick={() => {
            setLoginType('super_admin')
            formik.setFieldValue('loginType', 'super_admin')
            formik.setFieldValue('schoolId', '')
          }}
          className={clsx(
            'btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3',
            loginType === 'super_admin'
              ? 'btn-white shadow-sm text-primary fw-bolder'
              : 'btn-color-gray-500 fw-semibold'
          )}
          style={{ borderRadius: '0.4rem', transition: 'all 0.2s ease' }}
        >
          <i
            className={clsx(
              'ki-duotone ki-shield-tick fs-4',
              loginType === 'super_admin' ? 'text-primary' : 'text-gray-400'
            )}
          >
            <span className='path1'></span>
            <span className='path2'></span>
          </i>
          Super Admin
        </button>

        {/* School Admin Tab */}
        <button
          type='button'
          onClick={() => {
            setLoginType('admin')
            formik.setFieldValue('loginType', 'admin')
          }}
          className={clsx(
            'btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3',
            loginType === 'admin'
              ? 'btn-white shadow-sm text-primary fw-bolder'
              : 'btn-color-gray-500 fw-semibold'
          )}
          style={{ borderRadius: '0.4rem', transition: 'all 0.2s ease' }}
        >
          <i
            className={clsx(
              'ki-duotone ki-home-2 fs-4',
              loginType === 'admin' ? 'text-primary' : 'text-gray-400'
            )}
          >
            <span className='path1'></span>
            <span className='path2'></span>
          </i>
          School Admin
        </button>
      </div>

      {/* ── Status / Info Banner ── */}
      {formik.status ? (
        <div className='alert alert-danger d-flex align-items-center gap-3 mb-8 py-4 px-5 rounded-3'>
          <i className='ki-duotone ki-information-5 fs-2hx text-danger flex-shrink-0'>
            <span className='path1'></span>
            <span className='path2'></span>
            <span className='path3'></span>
          </i>
          <div>
            <div className='fw-bold fs-6 text-danger'>Login Failed</div>
            <div className='fw-semibold fs-7'>{formik.status}</div>
          </div>
        </div>
      ) : (
        <div
          className='notice d-flex bg-light-primary rounded-3 border border-primary border-dashed mb-9 p-4'
        >
          <i className='ki-duotone ki-information fs-2tx text-primary me-4 flex-shrink-0'>
            <span className='path1'></span>
            <span className='path2'></span>
            <span className='path3'></span>
          </i>
          <div className='d-flex flex-stack flex-grow-1'>
            <div className='fw-semibold'>
              <div className='fs-7 text-gray-700'>
                Use{' '}
                <span className='fw-bolder text-gray-900'>
                  {loginType === 'super_admin' ? 'admin@myapp.com' : 'admin@sunbeam.com'}
                </span>{' '}
                to sign in as {loginType === 'super_admin' ? 'Super Admin' : 'School Admin'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── School Selector (School Admin only) ── */}
      {loginType === 'admin' && (
        <div className='fv-row mb-8'>
          <label className='form-label fs-6 fw-bold text-gray-900 required'>
            Select School
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadSchoolOptions}
            placeholder='Search school by name or code...'
            onChange={(option: any) =>
              formik.setFieldValue('schoolId', option ? option.value.toString() : '')
            }
            onBlur={() => formik.setFieldTouched('schoolId', true)}
            styles={selectStyles}
          />
          {formik.touched.schoolId && formik.errors.schoolId && (
            <div className='fv-plugins-message-container mt-2'>
              <div className='fv-help-block d-flex align-items-center gap-1'>
                <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                  <span className='path1'></span>
                  <span className='path2'></span>
                  <span className='path3'></span>
                </i>
                <span role='alert' className='text-danger fw-semibold fs-7'>
                  {formik.errors.schoolId}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Email ── */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bold text-gray-900 fs-6 required'>
          Email Address
        </label>
        <div className='position-relative'>
          <input
            type='email'
            placeholder='Enter your email'
            autoComplete='off'
            {...formik.getFieldProps('email')}
            className={clsx(
              'form-control bg-transparent pe-10',
              { 'is-invalid': formik.touched.email && formik.errors.email },
              { 'is-valid': formik.touched.email && !formik.errors.email }
            )}
          />
          {/* Trailing state icon */}
          <span
            className='position-absolute top-50 end-0 translate-middle-y pe-3'
            style={{ pointerEvents: 'none' }}
          >
            {formik.touched.email && formik.errors.email ? (
              <i className='ki-duotone ki-cross-circle fs-3 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            ) : formik.touched.email && !formik.errors.email ? (
              <i className='ki-duotone ki-check-circle fs-3 text-success'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            ) : (
              <i className='ki-duotone ki-sms fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            )}
          </span>
        </div>
        {formik.touched.email && formik.errors.email && (
          <div className='fv-plugins-message-container mt-2'>
            <div className='fv-help-block d-flex align-items-center gap-1'>
              <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
              <span role='alert' className='text-danger fw-semibold fs-7'>
                {formik.errors.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Password ── */}
      <div className='fv-row mb-3'>
        <label className='form-label fw-bold text-gray-900 fs-6 required'>Password</label>
        <div className='position-relative'>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder='Enter your password'
            autoComplete='off'
            {...formik.getFieldProps('password')}
            className={clsx(
              'form-control bg-transparent pe-10',
              { 'is-invalid': formik.touched.password && formik.errors.password },
              { 'is-valid': formik.touched.password && !formik.errors.password }
            )}
          />
          {/* Show / Hide password toggle */}
          <span
            className='position-absolute top-50 end-0 translate-middle-y pe-3 cursor-pointer'
            onClick={() => setShowPassword((v) => !v)}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{ zIndex: 5 }}
          >
            {showPassword ? (
              <i className='ki-duotone ki-eye-slash fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
                <span className='path4'></span>
              </i>
            ) : (
              <i className='ki-duotone ki-eye fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
            )}
          </span>
        </div>
        {formik.touched.password && formik.errors.password && (
          <div className='fv-plugins-message-container mt-2'>
            <div className='fv-help-block d-flex align-items-center gap-1'>
              <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
              <span role='alert' className='text-danger fw-semibold fs-7'>
                {formik.errors.password}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <div className='d-grid mb-10 mt-8'>
        <button
          type='submit'
          id='kt_sign_in_submit'
          className='btn btn-primary py-3 fs-6 fw-bolder'
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {loading ? (
            <span className='indicator-progress d-flex align-items-center justify-content-center gap-2'>
              <span className='spinner-border spinner-border-sm align-middle'></span>
              Signing in...
            </span>
          ) : (
            <span className='indicator-label d-flex align-items-center justify-content-center gap-2'>
              Sign In
              <i className='ki-duotone ki-arrow-right fs-4'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            </span>
          )}
        </button>
      </div>

      {/* ── Footer note ── */}
      <div className='text-center'>
        <span className='text-muted fw-semibold fs-8 text-uppercase ls-1'>
          Secure access · EduAdmin portal
        </span>
      </div>
    </form>
  )
}