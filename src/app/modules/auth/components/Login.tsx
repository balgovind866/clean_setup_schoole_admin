
import { useState } from 'react'
import * as Yup from 'yup'
import clsx from 'clsx'
import { useFormik } from 'formik'
import AsyncSelect from 'react-select/async'
import { getUserByToken, login, getSchools } from '../core/_requests'
import { AuthModel } from '../core/_models'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
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
    is: 'admin', // Matches School Admin
    then: (schema) => schema.required('School ID is required'),
  }),
})

const initialValues = {
  email: 'admin@myapp.com',
  password: 'Admin@123456',
  schoolId: '',
  loginType: 'admin' as 'super_admin' | 'admin',
}

/*
  Formik+YUP+Typescript:
  https://jaredpalmer.com/formik/docs/tutorial#getfieldprops
  https://medium.com/@maurice.de.beijer/yup-validation-and-typescript-and-formik-6c342578a20e
*/

export function Login() {
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<'super_admin' | 'admin'>('admin')
  const { saveAuth, setCurrentUser } = useAuth()

  const loadSchoolOptions = async (inputValue: string) => {
    try {
      const response = await getSchools(1, 10, inputValue, true)
      if (response && response.data && response.data.data && response.data.data.schools) {
        return response.data.data.schools.map((school) => ({
          value: school.id,
          label: `${school.name} (${school.code})`,
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching schools', error)
      return []
    }
  }

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      try {
        const { data: response } = await login(values.email, values.password, loginType, values.schoolId)
        if (response.success) {
          // Extract user from either 'user' or 'admin' property
          const user = response.data.user || response.data.admin

          const auth: AuthModel = {
            api_token: response.data.token,
            user: user,
          }
          saveAuth(auth)

          if (user) {
            setCurrentUser(user)
          }
        } else {
          saveAuth(undefined)
          setStatus(response.message || 'The login details are incorrect')
          setSubmitting(false)
          setLoading(false)
        }
      } catch (error) {
        console.error(error)
        saveAuth(undefined)
        setStatus('The login details are incorrect')
        setSubmitting(false)
        setLoading(false)
      }
    },
  })

  return (
    <form
      className='form w-100'
      onSubmit={formik.handleSubmit}
      noValidate
      id='kt_login_signin_form'
    >
      {/* begin::Heading */}
      <div className='text-center mb-11'>
        <h1 className='text-gray-900 fw-bolder mb-3'>Sign In</h1>
        <div className='text-gray-500 fw-semibold fs-6'>EduAdmin Management System</div>
      </div>
      {/* end::Heading */}

      {/* begin::Role Switch */}
      <div className='d-flex bg-light rounded p-1 mb-9'>
        <button
          type='button'
          onClick={() => {
            setLoginType('super_admin')
            formik.setFieldValue('loginType', 'super_admin')
          }}
          className={clsx(
            'btn btn-sm flex-grow-1',
            loginType === 'super_admin' ? 'btn-white shadow-sm' : 'btn-color-gray-500'
          )}
        >
          Super Admin
        </button>
        <button
          type='button'
          onClick={() => {
            setLoginType('admin')
            formik.setFieldValue('loginType', 'admin')
          }}
          className={clsx(
            'btn btn-sm flex-grow-1',
            loginType === 'admin' ? 'btn-white shadow-sm' : 'btn-color-gray-500'
          )}
        >
          School Admin
        </button>
      </div>
      {/* end::Role Switch */}

      {formik.status ? (
        <div className='mb-lg-15 alert alert-danger'>
          <div className='alert-text font-weight-bold'>{formik.status}</div>
        </div>
      ) : (
        <div className='mb-10 bg-light-info p-8 rounded'>
          <div className='text-info'>
            {loginType === 'super_admin' ? (
              <>Use <strong>admin@myapp.com</strong> for Super Admin</>
            ) : (
              <>Use <strong>admin@sunbeam.com</strong> for School Admin</>
            )}
          </div>
        </div>
      )}

      {/* begin::School Selection (Only for School Admin) */}
      {loginType === 'admin' && (
        <div className='fv-row mb-8'>
          <label className='form-label fs-6 fw-bolder text-gray-900'>Select School</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadSchoolOptions}
            placeholder='Search school by code or name...'
            onChange={(option: any) => {
              formik.setFieldValue('schoolId', option ? option.value.toString() : '')
            }}
            onBlur={() => formik.setFieldTouched('schoolId', true)}
            classNamePrefix='react-select'
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'transparent',
                borderColor: formik.touched.schoolId && formik.errors.schoolId ? '#f1416c' : '#E4E6EF',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.475rem',
                boxShadow: 'none',
                minHeight: '43px',
              }),
            }}
          />
          {formik.touched.schoolId && formik.errors.schoolId && (
            <div className='fv-plugins-message-container mt-2'>
              <span role='alert' className='text-danger'>{formik.errors.schoolId}</span>
            </div>
          )}
        </div>
      )}
      {/* end::School Selection */}

      {/* begin::Form group */}
      <div className='fv-row mb-8'>
        <label className='form-label fs-6 fw-bolder text-gray-900'>Email</label>
        <input
          placeholder='Email'
          {...formik.getFieldProps('email')}
          className={clsx(
            'form-control bg-transparent',
            { 'is-invalid': formik.touched.email && formik.errors.email },
            {
              'is-valid': formik.touched.email && !formik.errors.email,
            }
          )}
          type='email'
          name='email'
          autoComplete='off'
        />
        {formik.touched.email && formik.errors.email && (
          <div className='fv-plugins-message-container'>
            <span role='alert'>{formik.errors.email}</span>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='fv-row mb-3'>
        <label className='form-label fw-bolder text-gray-900 fs-6 mb-0'>Password</label>
        <input
          type='password'
          autoComplete='off'
          {...formik.getFieldProps('password')}
          className={clsx(
            'form-control bg-transparent',
            {
              'is-invalid': formik.touched.password && formik.errors.password,
            },
            {
              'is-valid': formik.touched.password && !formik.errors.password,
            }
          )}
        />
        {formik.touched.password && formik.errors.password && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>{formik.errors.password}</span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Action */}
      <div className='d-grid mb-10 mt-8'>
        <button
          type='submit'
          id='kt_sign_in_submit'
          className='btn btn-primary'
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {!loading && <span className='indicator-label'>Continue</span>}
          {loading && (
            <span className='indicator-progress' style={{ display: 'block' }}>
              Please wait...
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          )}
        </button>
      </div>
      {/* end::Action */}
    </form>
  )
}
