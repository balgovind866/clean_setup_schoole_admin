import { useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../_metronic/helpers'

const AuthLayout = () => {
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) root.style.height = '100%'
    return () => {
      if (root) root.style.height = 'auto'
    }
  }, [])

  return (
    <div className='d-flex flex-column flex-lg-row flex-column-fluid h-100'>

      {/* ══ Left: Form Panel ══ */}
      <div className='d-flex flex-column flex-lg-row-fluid w-lg-50 p-10 order-2 order-lg-1'>

        {/* Top logo (mobile only) */}
        <div className='d-flex align-items-center justify-content-center d-lg-none mb-10'>
          <Link to='/'>
            <img
              alt='EduAdmin Logo'
              src={toAbsoluteUrl('media/logos/default.svg')}
              className='h-45px'
            />
          </Link>
        </div>

        {/* Form centered */}
        <div className='d-flex flex-center flex-column flex-lg-row-fluid'>
          <div className='w-lg-500px p-10'>
            <Outlet />
          </div>
        </div>

        {/* Footer links */}
        <div className='d-flex flex-center flex-wrap px-5 py-3'>
          <div className='d-flex fw-semibold text-primary fs-base gap-4'>
            <a href='#' className='text-muted text-hover-primary'>Terms</a>
            <a href='#' className='text-muted text-hover-primary'>Plans</a>
            <a href='#' className='text-muted text-hover-primary'>Contact Us</a>
          </div>
        </div>
      </div>



    </div>
  )
}

export { AuthLayout }